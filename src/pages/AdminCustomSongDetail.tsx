import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

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
  updated_at: string;
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
  const { toast } = useToast();

  const [req, setReq] = useState<Request | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);

  const [quote, setQuote] = useState<string>("");
  const [newMessage, setNewMessage] = useState<string>("");

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

      // realtime messages
      const channel = supabase
        .channel(`csr-${id}`)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "custom_song_messages", filter: `request_id=eq.${id}` }, (payload) => {
          setMessages((prev) => [...prev, payload.new as any]);
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
    if (!id || !newMessage.trim()) return;
    try {
      const { data, error } = await supabase
        .from("custom_song_messages")
        .insert({ request_id: id, body: newMessage } as any)
        .select()
        .single();
      if (error) throw error;
      setNewMessage("");
      setMessages((prev) => [...prev, data as any]);
    } catch (e: any) {
      toast({ title: "Send failed", description: e.message, variant: "destructive" });
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Assets</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Label className="w-36">Upload Draft</Label>
                <Input type="file" accept="audio/*" onChange={(e) => uploadDraft(e.target.files?.[0])} />
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
        </div>
      </div>
    </div>
  );
}
