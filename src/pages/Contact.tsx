import React, { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Mail, MessageCircle, Send } from "lucide-react";

interface ChatMessage {
  id: string;
  room_id: string;
  sender_id: string;
  message: string;
  seen: boolean;
  sent_at: string;
}

const Contact: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Chat state (for signed-in users)
  const [roomId, setRoomId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  // SEO
  useEffect(() => {
    const title = "Contact Zamar | Support & Custom Song Inquiries";
    const description =
      "Contact Zamar for support or custom song inquiries. Reach us via message and we’ll reply by chat or email.";
    document.title = title;

    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute("content", description);
    else {
      const m = document.createElement("meta");
      m.name = "description";
      m.content = description;
      document.head.appendChild(m);
    }

    const canonicalHref = `${window.location.origin}/contact`;
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = canonicalHref;
  }, []);

  // Prefill email if logged in (best effort)
  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("first_name, last_name, email")
        .eq("id", user.id)
        .maybeSingle();
      if (data?.email) setEmail(data.email);
      if (data?.first_name || data?.last_name) setName(`${data.first_name ?? ""} ${data.last_name ?? ""}`.trim());
    };
    loadProfile();
  }, [user]);

  const scrollToBottom = () => {
    const el = scrollerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  // Initialize or fetch chat room for logged-in users
  useEffect(() => {
    if (!user) return;
    let active = true;

    const init = async () => {
      const { data: room } = await supabase
        .from("chat_rooms")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      let id = room?.id as string | undefined;
      if (!id) {
        const { data: created, error } = await supabase
          .from("chat_rooms")
          .insert({ user_id: user.id })
          .select("id")
          .single();
        if (error) console.error(error);
        id = created?.id;
      }
      if (!active || !id) return;
      setRoomId(id);

      // Load messages
      const { data: initial } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("room_id", id)
        .order("sent_at", { ascending: true });
      if (active) setMessages(initial || []);

      // Mark admin messages as seen
      await supabase
        .from("chat_messages")
        .update({ seen: true })
        .eq("room_id", id)
        .neq("sender_id", user.id);

      // Subscribe
      const channel = supabase
        .channel(`contact-chat-${id}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `room_id=eq.${id}` },
          (payload) => {
            const incoming = payload.new as unknown as ChatMessage;
            setMessages((prev) => (prev.some(m => m.id === incoming.id) ? prev : [...prev, incoming]));
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    init();
    return () => {
      active = false;
    };
  }, [user]);

  const sendChat = async () => {
    if (!user || !roomId || !chatInput.trim()) return;
    setChatLoading(true);
    const text = chatInput.trim();
    // Optimistic UI
    const optimistic: ChatMessage = {
      id: 'temp-' + Date.now(),
      room_id: roomId,
      sender_id: user.id,
      message: text,
      seen: false,
      sent_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setChatInput('');
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({ room_id: roomId, sender_id: user.id, message: text })
        .select()
        .single();
      if (error) throw error;
      // Replace optimistic with real message
      setMessages((prev) => prev.map(m => (m.id === optimistic.id ? (data as any) : m)));
    } catch (e) {
      console.error(e);
      // Revert optimistic on error
      setMessages((prev) => prev.filter(m => m.id !== optimistic.id));
      setChatInput(text);
      toast({ title: 'Message failed', description: 'Please try again.', variant: 'destructive' });
    } finally {
      setChatLoading(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !message) {
      toast({ title: "Missing details", description: "Please provide your email and message.", variant: "destructive" });
      return;
    }
    setSubmitting(true);

    try {
      // 1) If signed in, add to chat
      if (user) {
        // Ensure room exists (roomId state may still be null if init not completed)
        let id = roomId;
        if (!id) {
          const { data: room } = await supabase
            .from("chat_rooms")
            .select("id")
            .eq("user_id", user.id)
            .maybeSingle();
          if (!room) {
            const { data: created } = await supabase
              .from("chat_rooms")
              .insert({ user_id: user.id })
              .select("id")
              .single();
            id = created?.id ?? null;
          } else id = room.id;
        }

        if (id) {
          await supabase.from("chat_messages").insert({
            room_id: id,
            sender_id: user.id,
            message: `[Contact] ${subject ? subject + ': ' : ''}${message}`,
          });
        }
      }

      // 2) Always email a confirmation to the sender
      await supabase.functions.invoke("contact-submit", {
        body: { name, email, subject, emailBody: message },
      });

      toast({ title: "Message sent", description: "Thanks! We’ll get back to you by chat or email." });
      setSubject("");
      setMessage("");
      if (!user) {
        setName("");
        setEmail("");
      }
    } catch (err) {
      console.error(err);
      toast({ title: "Something went wrong", description: "Please try again in a moment.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  // Simple layout: Contact form + (if logged in) chat thread
  return (
    <main>
      <header className="sr-only">
        <h1>Contact Zamar — Support & Custom Songs</h1>
      </header>
      <section className="container mx-auto px-4 py-10 grid gap-6 md:grid-cols-2">
        <article>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" /> Send us a message
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-muted-foreground">Name</label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Email</label>
                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
                  </div>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Subject</label>
                  <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="How can we help?" />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Message</label>
                  <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Write your message..." rows={6} required />
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">We’ll reply by email. If you’re signed in, we’ll also open a chat thread.</p>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? "Sending…" : "Send"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </article>

        <aside>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" /> Live chat (signed-in users)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {user ? (
                <div className="flex flex-col h-[420px]">
                  <ScrollArea className="flex-1 pr-4" ref={scrollerRef as any}>
                    <div className="space-y-3">
                      {messages.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No messages yet. Send us a note and we’ll respond here.</p>
                      ) : (
                        messages.map((m) => (
                          <div key={m.id} className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${m.sender_id === user.id ? 'ml-auto bg-primary text-primary-foreground' : 'bg-muted'}`}>
                            {m.message}
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                  <div className="mt-3 flex items-center gap-2">
                    <Input
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Type a message…"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendChat();
                        }
                      }}
                    />
                    <Button onClick={sendChat} disabled={chatLoading || !chatInput.trim()} size="icon" aria-label="Send message">
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Sign in to chat in-app. Otherwise, we’ll email you back.</p>
              )}
            </CardContent>
          </Card>
        </aside>
      </section>
    </main>
  );
};

export default Contact;
