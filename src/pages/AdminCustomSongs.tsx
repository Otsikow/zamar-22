import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface RequestRow {
  id: string;
  user_id: string | null;
  title: string | null;
  status: string;
  price_cents: number | null;
  need_by_date: string | null;
  updated_at: string;
}

export default function AdminCustomSongs() {
  const { isAdmin, loading } = useIsAdmin();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("requests");
  const [rows, setRows] = useState<RequestRow[]>([]);
  const [emailsByUser, setEmailsByUser] = useState<Record<string, string>>({});
  const [fetching, setFetching] = useState(false);

  const statusesByTab: Record<string, string[]> = useMemo(
    () => ({
      requests: ["pending_brief", "quoted", "awaiting_payment"],
      production: ["in_production", "draft_shared", "revision_requested"],
      completed: ["approved", "delivered"],
      cancelled: ["cancelled", "rejected"],
    }),
    []
  );

  useEffect(() => {
    if (loading) return;
    if (!isAdmin) {
      toast({ title: "Access denied", description: "Admins only" });
      navigate("/admin");
      return;
    }
  }, [isAdmin, loading, navigate, toast]);

  const fetchData = async () => {
    try {
      setFetching(true);
      const statuses = statusesByTab[activeTab];
      let query = supabase
        .from("custom_song_requests")
        .select("id,user_id,title,status,price_cents,need_by_date,updated_at")
        .in("status", statuses as any)
        .order("updated_at", { ascending: false });

      if (search.trim()) {
        // Simple server-side filter on title; email filter is handled client-side (after join)
        query = query.ilike("title", `%${search.trim()}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      const reqs = (data || []) as RequestRow[];
      setRows(reqs);

      // Load emails for involved users from profiles
      const userIds = Array.from(
        new Set(reqs.map((r) => r.user_id).filter(Boolean))
      ) as string[];
      if (userIds.length) {
        const { data: profs, error: pErr } = await supabase
          .from("profiles")
          .select("id,email")
          .in("id", userIds);
        if (pErr) throw pErr;
        const map: Record<string, string> = {};
        (profs || []).forEach((p: any) => (map[p.id] = p.email || ""));
        setEmailsByUser(map);
      } else {
        setEmailsByUser({});
      }
    } catch (e: any) {
      console.error(e);
      toast({ title: "Failed to load", description: e.message });
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (!isAdmin || loading) return;
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, search, isAdmin, loading]);

  const renderTable = () => (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-muted-foreground border-b">
            <th className="text-left p-3">Title</th>
            <th className="text-left p-3">User</th>
            <th className="text-left p-3">Status</th>
            <th className="text-right p-3">Price</th>
            <th className="text-left p-3">Need By</th>
            <th className="text-left p-3">Updated</th>
            <th className="text-right p-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const email = r.user_id ? emailsByUser[r.user_id] : "";
            const price = r.price_cents ? `£${(r.price_cents / 100).toFixed(2)}` : "—";
            const updated = new Date(r.updated_at).toLocaleString();
            return (
              <tr key={r.id} className="border-b hover:bg-muted/30">
                <td className="p-3">{r.title || "(Untitled)"}</td>
                <td className="p-3">{email || "—"}</td>
                <td className="p-3"><span className="inline-flex px-2 py-0.5 rounded bg-primary/10 text-primary">{r.status}</span></td>
                <td className="p-3 text-right">{price}</td>
                <td className="p-3">{r.need_by_date || "—"}</td>
                <td className="p-3">{updated}</td>
                <td className="p-3 text-right">
                  <Button size="sm" variant="outline" onClick={() => navigate(`/admin/custom-requests/${r.id}`)}>
                    Open
                  </Button>
                </td>
              </tr>
            );
          })}
          {rows.length === 0 && (
            <tr>
              <td className="p-6 text-center text-muted-foreground" colSpan={7}>
                {fetching ? "Loading..." : "No requests in this stage yet."}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-primary">Loading...</div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="container max-w-7xl mx-auto px-4">
      <Card className="mt-4">
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle>Custom Songs</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Search title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-[220px]"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="requests">Requests</TabsTrigger>
              <TabsTrigger value="production">Production</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
            </TabsList>
            <TabsContent value="requests">{renderTable()}</TabsContent>
            <TabsContent value="production">{renderTable()}</TabsContent>
            <TabsContent value="completed">{renderTable()}</TabsContent>
            <TabsContent value="cancelled">{renderTable()}</TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
