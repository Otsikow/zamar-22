import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import UserSearchSelect from "@/components/admin/UserSearchSelect";
interface Request {
  id: string;
  user_id: string | null;
  title: string | null;
  occasion: string | null;
  language: string | null;
  scripture_ref: string | null;
  tone: string | null;
  duration_seconds: number | null;
  need_by_date: string | null;
  status: string;
  price_cents: number | null;
  currency: string | null;
  assigned_admin: string | null;
  stripe_pi_id: string | null;
  updated_at: string;
  key_message?: string;
  style_genre?: string;
  scripture_quote?: string;
}

interface UserProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  referral_code: string | null;
  created_at: string;
}

interface Asset {
  id: string;
  kind: string;
  storage_path: string;
  created_at: string;
}

interface Message {
  id: string;
  sender_id: string;
  body: string;
  created_at: string;
}

export default function AdminCustomSongDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin, loading } = useIsAdmin();
  const { user } = useAuth();
  const { toast } = useToast();

  const [req, setReq] = useState<Request | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);

  const [quote, setQuote] = useState<string>("");
  const [newMessage, setNewMessage] = useState<string>("");
  const [selectedAdmin, setSelectedAdmin] = useState<string>("");
  const [stripePI, setStripePI] = useState<string>("");
  const [nudgeTitle, setNudgeTitle] = useState<string>("");
  const [nudgeBody, setNudgeBody] = useState<string>("");

  const statusOptions = useMemo(
    () => [
      "pending_brief","quoted","awaiting_payment",
      "in_production","draft_shared","revision_requested",
      "approved","delivered","cancelled","rejected"
    ],
    []
  );

  useEffect(() => {
    if (loading) return;
    if (!isAdmin) {
      toast({ title: "Access denied", description: "Admins only" });
      navigate("/admin/custom-songs");
      return;
    }
    // fetch
    const load = async () => {
      const { data: r } = await supabase
        .from("custom_song_requests")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      setReq(r as any);
      setQuote(r?.price_cents ? (r.price_cents / 100).toFixed(2) : "");
      setSelectedAdmin(r?.assigned_admin || "");
      setStripePI(r?.stripe_pi_id || "");

      // Fetch user profile if user_id exists
      if (r?.user_id) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id, first_name, last_name, email, referral_code, created_at")
          .eq("id", r.user_id)
          .maybeSingle();
        setUserProfile(profile);
      }

      const { data: a } = await supabase
        .from("custom_song_assets")
        .select("id,kind,storage_path,created_at")
        .eq("request_id", id)
        .order("created_at", { ascending: true });
      setAssets((a || []) as any);

      const { data: m } = await supabase
        .from("custom_song_messages")
        .select("id,sender_id,body,created_at")
        .eq("request_id", id)
        .order("created_at", { ascending: true });
      setMessages((m || []) as any);

      // realtime messages/assets/deliveries
      const channel = supabase
        .channel(`csr-${id}`)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "custom_song_messages", filter: `request_id=eq.${id}` }, (payload) => {
          setMessages((prev) => [...prev, payload.new as any]);
        })
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "custom_song_assets", filter: `request_id=eq.${id}` }, (payload) => {
          setAssets((prev) => [...prev, payload.new as any]);
        })
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "custom_song_deliveries", filter: `request_id=eq.${id}` }, () => {
          toast({ title: "Delivery updated", description: "New delivery added." });
        })
        .subscribe();
      return () => {
        supabase.removeChannel(channel);
      };
    };
    load();
  }, [id, isAdmin, loading, navigate, toast]);

  const saveQuote = async () => {
    if (!id) return;
    const price = Math.round(parseFloat(quote || "0") * 100);
    try {
      const { error } = await supabase
        .from("custom_song_requests")
        .update({ price_cents: price, status: "quoted" } as any)
        .eq("id", id);
      if (error) throw error;
      toast({ title: "Quote sent", description: "Status set to quoted" });
    } catch (e: any) {
      toast({ title: "Failed to save quote", description: e.message, variant: "destructive" });
    }
  };

  const updateStatus = async (status: string) => {
    if (!id) return;
    try {
      const { error } = await supabase
        .from("custom_song_requests")
        .update({ status } as any)
        .eq("id", id);
      if (error) throw error;
      toast({ title: "Status updated" });
      setReq((r) => (r ? { ...r, status } : r));
    } catch (e: any) {
      toast({ title: "Update failed", description: e.message, variant: "destructive" });
    }
  };

  const uploadDraft = async (file?: File | null) => {
    if (!id || !file) return;
    try {
      const path = `${id}/draft-${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage.from("custom-drafts").upload(path, file);
      if (upErr) throw upErr;
      const { error: insErr } = await supabase
        .from("custom_song_assets")
        .insert({ request_id: id, kind: "draft_audio", storage_path: path } as any);
      if (insErr) throw insErr;
      toast({ title: "Draft uploaded" });
      // refresh assets
      const { data: a } = await supabase
        .from("custom_song_assets")
        .select("id,kind,storage_path,created_at")
        .eq("request_id", id)
        .order("created_at", { ascending: true });
      setAssets((a || []) as any);
    } catch (e: any) {
      toast({ title: "Upload failed", description: e.message, variant: "destructive" });
    }
  };

  const deliverFinal = async (file?: File | null, lyrics?: File | null, art?: File | null) => {
    if (!id || !file) return;
    try {
      const finalPath = `${id}/final-${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage.from("custom-finals").upload(finalPath, file);
      if (upErr) throw upErr;

      let lyricsPath: string | undefined;
      if (lyrics) {
        const p = `${id}/lyrics-${Date.now()}-${lyrics.name}`;
        const { error } = await supabase.storage.from("custom-finals").upload(p, lyrics);
        if (error) throw error;
        lyricsPath = p;
      }

      let artPath: string | undefined;
      if (art) {
        const p = `${id}/cover-${Date.now()}-${art.name}`;
        const { error } = await supabase.storage.from("custom-finals").upload(p, art);
        if (error) throw error;
        artPath = p;
      }

      const { error: insErr } = await supabase
        .from("custom_song_deliveries")
        .insert({ request_id: id, final_audio_path: finalPath, lyrics_pdf_path: lyricsPath, cover_art_path: artPath } as any);
      if (insErr) throw insErr;
      toast({ title: "Delivered to client" });
    } catch (e: any) {
      toast({ title: "Delivery failed", description: e.message, variant: "destructive" });
    }
  };

  const sendMessage = async () => {
    if (!id || !newMessage.trim() || !user) return;
    try {
      const { data, error } = await supabase
        .from("custom_song_messages")
        .insert({ request_id: id, sender_id: user.id, body: newMessage } as any)
        .select()
        .single();
      if (error) throw error;
      setNewMessage("");
      setMessages((prev) => [...prev, data as any]);
    } catch (e: any) {
      toast({ title: "Send failed", description: e.message, variant: "destructive" });
    }
  };

  const assignProducer = async () => {
    if (!id || !selectedAdmin) return;
    try {
      const { error } = await supabase
        .from("custom_song_requests")
        .update({ assigned_admin: selectedAdmin } as any)
        .eq("id", id);
      if (error) throw error;
      setReq((r) => (r ? { ...r, assigned_admin: selectedAdmin } : r));
      toast({ title: "Producer assigned successfully." });
    } catch (e: any) {
      toast({ title: "Assignment failed", description: e.message, variant: "destructive" });
    }
  };

  const attachPaymentIntent = async () => {
    if (!id || !stripePI.trim()) return;
    try {
      const { error } = await supabase
        .from("custom_song_requests")
        .update({ stripe_pi_id: stripePI, status: "awaiting_payment" } as any)
        .eq("id", id);
      if (error) throw error;
      setReq((r) => (r ? { ...r, stripe_pi_id: stripePI, status: "awaiting_payment" } : r));
      toast({ title: "Payment intent attached." });
    } catch (e: any) {
      toast({ title: "Attach failed", description: e.message, variant: "destructive" });
    }
  };

  const uploadDraftLyrics = async (file?: File | null) => {
    if (!id || !file) return;
    try {
      const path = `${id}/lyrics-${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage.from("custom-drafts").upload(path, file);
      if (upErr) throw upErr;
      const { error: insErr } = await supabase
        .from("custom_song_assets")
        .insert({ request_id: id, kind: "lyrics_pdf", storage_path: path } as any);
      if (insErr) throw insErr;
      toast({ title: "Lyrics PDF attached." });
      const { data: a } = await supabase
        .from("custom_song_assets")
        .select("id,kind,storage_path,created_at")
        .eq("request_id", id)
        .order("created_at", { ascending: true });
      setAssets((a || []) as any);
    } catch (e: any) {
      toast({ title: "Upload failed", description: e.message, variant: "destructive" });
    }
  };

  const uploadCoverArtAsset = async (file?: File | null) => {
    if (!id || !file) return;
    try {
      const path = `${id}/cover-${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage.from("custom-art").upload(path, file);
      if (upErr) throw upErr;
      const { error: insErr } = await supabase
        .from("custom_song_assets")
        .insert({ request_id: id, kind: "cover_art", storage_path: path } as any);
      if (insErr) throw insErr;
      toast({ title: "Cover art added." });
      const { data: a } = await supabase
        .from("custom_song_assets")
        .select("id,kind,storage_path,created_at")
        .eq("request_id", id)
        .order("created_at", { ascending: true });
      setAssets((a || []) as any);
    } catch (e: any) {
      toast({ title: "Upload failed", description: e.message, variant: "destructive" });
    }
  };

  const requestRevision = async () => {
    if (!id) return;
    await updateStatus("revision_requested");
    try {
      await supabase
        .from("custom_song_messages")
        .insert({ request_id: id, body: "Admin marked: Revision requested." } as any);
      toast({ title: "Marked as revision requested." });
    } catch (e: any) {
      toast({ title: "Action failed", description: e.message, variant: "destructive" });
    }
  };

  const approveDraft = async () => {
    if (!id || !req?.user_id) return;
    await updateStatus("approved");
    try {
      await supabase.from("notifications").insert({
        user_id: req.user_id,
        type: "draft",
        title: "Draft approved",
        message: "We are preparing final delivery.",
        link: "/library",
      } as any);
      toast({ title: "Draft approved." });
    } catch (e: any) {
      toast({ title: "Notify failed", description: e.message, variant: "destructive" });
    }
  };

  const nudgeClient = async () => {
    if (!req?.user_id || !nudgeTitle.trim() || !nudgeBody.trim()) return;
    try {
      await supabase.from("notifications").insert({
        user_id: req.user_id,
        type: "message",
        title: nudgeTitle,
        message: nudgeBody,
        link: "/library",
      } as any);
      toast({ title: "Client notified." });
      setNudgeTitle("");
      setNudgeBody("");
    } catch (e: any) {
      toast({ title: "Notify failed", description: e.message, variant: "destructive" });
    }
  };
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-primary">Loading...</div>
      </div>
    );
  }
  if (!isAdmin) return null;

  return (
    <div className="container max-w-7xl mx-auto px-4 space-y-6">
      <div className="pt-2">
        <Button variant="outline" onClick={() => navigate(-1)}>Back</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle>Summary</CardTitle></CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Title</span><div>{req?.title || "—"}</div></div>
                <div><span className="text-muted-foreground">Occasion</span><div>{req?.occasion || "—"}</div></div>
                <div><span className="text-muted-foreground">Language</span><div>{req?.language || "—"}</div></div>
                <div><span className="text-muted-foreground">Scripture</span><div>{req?.scripture_ref || "—"}</div></div>
                <div><span className="text-muted-foreground">Tone</span><div>{req?.tone || "—"}</div></div>
                <div><span className="text-muted-foreground">Duration</span><div>{req?.duration_seconds ? `${req.duration_seconds}s` : "—"}</div></div>
                <div><span className="text-muted-foreground">Need by</span><div>{req?.need_by_date || "—"}</div></div>
                <div><span className="text-muted-foreground">Status</span><div><span className="inline-flex px-2 py-0.5 rounded bg-primary/10 text-primary">{req?.status}</span></div></div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information Card */}
          <Card>
            <CardHeader><CardTitle>👤 Client Contact Information</CardTitle></CardHeader>
            <CardContent>
              {userProfile ? (
                <div className="space-y-3">
                  <div className="grid sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Full Name</span>
                      <div className="font-medium">
                        {userProfile.first_name || userProfile.last_name 
                          ? `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim()
                          : '—'
                        }
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Email</span>
                      <div className="font-medium">
                        {userProfile.email ? (
                          <a 
                            href={`mailto:${userProfile.email}`}
                            className="text-primary hover:underline"
                          >
                            {userProfile.email}
                          </a>
                        ) : '—'}
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">User ID</span>
                      <div className="font-mono text-xs bg-muted px-2 py-1 rounded">
                        {userProfile.id}
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Referral Code</span>
                      <div className="font-medium">
                        {userProfile.referral_code || '—'}
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Member Since</span>
                      <div className="font-medium">
                        {new Date(userProfile.created_at).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "long", 
                          year: "numeric"
                        })}
                      </div>
                    </div>
                  </div>
                  
                  {/* Quick Actions */}
                  <div className="pt-3 border-t border-border">
                    <div className="flex gap-2 flex-wrap">
                      {userProfile.email && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => window.open(`mailto:${userProfile.email}?subject=Regarding your Custom Song Request`)}
                        >
                          📧 Email Client
                        </Button>
                      )}
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => navigator.clipboard.writeText(userProfile.email || userProfile.id)}
                      >
                        📋 Copy Contact
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  {req?.user_id ? 'Loading client information...' : 'No client information available'}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Key Message & Scripture */}
          {(req?.key_message || req?.scripture_quote) && (
            <Card>
              <CardHeader><CardTitle>📝 Request Details</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {req.key_message && (
                  <div>
                    <span className="text-muted-foreground text-sm">Key Message</span>
                    <div className="mt-1 p-3 bg-muted/50 rounded-lg text-sm leading-relaxed">
                      {req.key_message}
                    </div>
                  </div>
                )}
                {req.scripture_quote && (
                  <div>
                    <span className="text-muted-foreground text-sm">Scripture Quote</span>
                    <div className="mt-1 p-3 bg-muted/50 rounded-lg text-sm italic">
                      "{req.scripture_quote}"
                    </div>
                  </div>
                )}
                {req.style_genre && (
                  <div>
                    <span className="text-muted-foreground text-sm">Genre</span>
                    <div className="mt-1 font-medium">
                      {req.style_genre}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle>Assignment</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid sm:grid-cols-3 gap-3 items-center">
                <Label>Producer</Label>
                <div className="sm:col-span-2">
                  <UserSearchSelect value={selectedAdmin} onChange={setSelectedAdmin} placeholder="Search admin by name or email" />
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={assignProducer} disabled={!selectedAdmin}>Assign</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Quote & Payment</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2 items-center">
                <Label htmlFor="quote">Price (£)</Label>
                <Input id="quote" value={quote} onChange={(e) => setQuote(e.target.value)} className="max-w-[160px]" />
                <Button size="sm" onClick={saveQuote}>Send Quote</Button>
              </div>
              <div className="flex gap-2 flex-wrap">
                {statusOptions.map((s) => (
                  <Button key={s} size="sm" variant={req?.status === s ? "default" : "outline"} onClick={() => updateStatus(s)}>
                    {s}
                  </Button>
                ))}
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button size="sm" variant="outline" onClick={() => updateStatus('awaiting_payment')}>Awaiting Payment</Button>
                <Button size="sm" variant="outline" onClick={() => updateStatus('in_production')}>Confirm Paid & Start</Button>
              </div>
              <div className="flex gap-2 items-center">
                <Label htmlFor="pi">Stripe PI</Label>
                <Input id="pi" value={stripePI} onChange={(e) => setStripePI(e.target.value)} className="max-w-[260px]" placeholder="pi_..." />
                <Button size="sm" onClick={attachPaymentIntent} disabled={!stripePI.trim()}>Attach PI</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Assets</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Label className="w-36">Upload Draft</Label>
                <Input type="file" accept="audio/*" onChange={(e) => uploadDraft(e.target.files?.[0])} />
              </div>
              <div className="flex items-center gap-2">
                <Label className="w-36">Lyrics PDF (draft)</Label>
                <Input type="file" accept="application/pdf" onChange={(e) => uploadDraftLyrics(e.target.files?.[0])} />
              </div>
              <div className="flex items-center gap-2">
                <Label className="w-36">Cover Art (asset)</Label>
                <Input type="file" accept="image/*" onChange={(e) => uploadCoverArtAsset(e.target.files?.[0])} />
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-2">Files</div>
                <div className="space-y-2">
                  {assets.map((a) => (
                    <div key={a.id} className="flex items-center justify-between border rounded p-2">
                      <div className="text-sm"><span className="font-medium">{a.kind}</span> • {a.storage_path}</div>
                      <div className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString()}</div>
                    </div>
                  ))}
                  {assets.length === 0 && (
                    <div className="text-sm text-muted-foreground">No assets yet.</div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Deliver Final</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid sm:grid-cols-3 gap-2 items-center">
                <div>
                  <Label>Final Audio*</Label>
                  <Input id="final" type="file" accept="audio/*" />
                </div>
                <div>
                  <Label>Lyrics PDF</Label>
                  <Input id="lyrics" type="file" accept="application/pdf" />
                </div>
                <div>
                  <Label>Cover Art</Label>
                  <Input id="art" type="file" accept="image/*" />
                </div>
              </div>
              <Button size="sm" onClick={() => {
                const final = (document.getElementById('final') as HTMLInputElement)?.files?.[0];
                const lyr = (document.getElementById('lyrics') as HTMLInputElement)?.files?.[0];
                const art = (document.getElementById('art') as HTMLInputElement)?.files?.[0];
                deliverFinal(final, lyr, art);
              }}>Deliver to Client</Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Conversation</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[420px] overflow-auto pr-2">
                {messages.map((m) => (
                  <div key={m.id} className="p-2 rounded border">
                    <div className="text-xs text-muted-foreground">{new Date(m.created_at).toLocaleString()}</div>
                    <div className="text-sm whitespace-pre-wrap">{m.body}</div>
                  </div>
                ))}
                {messages.length === 0 && (
                  <div className="text-sm text-muted-foreground">No messages yet.</div>
                )}
              </div>
              <div className="mt-3 flex gap-2">
                <Textarea placeholder="Type a message..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} />
                <Button onClick={sendMessage}>Send</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2 flex-wrap">
                <Button size="sm" variant="outline" onClick={requestRevision}>Request Revision</Button>
                <Button size="sm" variant="outline" onClick={approveDraft}>Approve Draft</Button>
              </div>
              <div className="space-y-2">
                <Label htmlFor="nudgeTitle">Notify Client</Label>
                <Input id="nudgeTitle" placeholder="Title" value={nudgeTitle} onChange={(e) => setNudgeTitle(e.target.value)} />
                <Textarea placeholder="Message" value={nudgeBody} onChange={(e) => setNudgeBody(e.target.value)} />
                <div className="flex justify-end">
                  <Button size="sm" onClick={nudgeClient} disabled={!nudgeTitle.trim() || !nudgeBody.trim()}>Send Notification</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
