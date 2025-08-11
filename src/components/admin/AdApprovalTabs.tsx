import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pause, Play, CheckCircle2, XCircle, Calendar, Eye } from "lucide-react";
import AdStatsMini from "./AdStatsMini";

interface Ad {
  id: string;
  title: string;
  ad_type: string;
  target_url: string | null;
  media_url: string | null;
  frequency: number | null;
  is_active: boolean | null;
  placement: string | null;
  start_date: string | null;
  end_date: string | null;
  status: string | null;
  impressions: number | null;
  clicks: number | null;
  created_at: string;
}

const fmt = (d: string | null) => (d ? new Date(d).toLocaleDateString() : "—");

const StatusBadge = ({ status }: { status?: string | null }) => {
  const map: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
    active: { variant: "default", label: "Active" },
    pending: { variant: "secondary", label: "Pending" },
    rejected: { variant: "destructive", label: "Rejected" },
    paused: { variant: "outline", label: "Paused" },
    expired: { variant: "outline", label: "Expired" },
  };
  const key = (status || "active").toLowerCase();
  const v = map[key] || { variant: "secondary", label: key };
  return <Badge variant={v.variant}>{v.label}</Badge>;
};

export default function AdApprovalTabs() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("ads").select("*").order("created_at", { ascending: false });
    setAds((data as Ad[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const today = new Date().toISOString().slice(0, 10);
  const groups = useMemo(() => {
    const pending = ads.filter(a => (a.status || "").toLowerCase() === "pending");
    const active = ads.filter(a => (a.status || "active").toLowerCase() === "active" && (!a.end_date || a.end_date >= today));
    const expired = ads.filter(a => (a.status || "").toLowerCase() === "expired" || (a.end_date ? a.end_date < today : false));
    return { pending, active, expired };
  }, [ads, today]);

  const approve = async (ad: Ad) => {
    await supabase.from("ads").update({ status: "active", is_active: true, start_date: ad.start_date ?? today }).eq("id", ad.id);
    await load();
  };
  const reject = async (ad: Ad) => {
    await supabase.from("ads").update({ status: "rejected", is_active: false }).eq("id", ad.id);
    await load();
  };
  const pauseToggle = async (ad: Ad) => {
    const next = !(ad.is_active ?? true);
    await supabase.from("ads").update({ is_active: next, status: next ? "active" : "paused" }).eq("id", ad.id);
    await load();
  };

  const List = ({ items }: { items: Ad[] }) => (
    <div className="space-y-3">
      {items.map(ad => (
        <Card key={ad.id} className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <StatusBadge status={ad.status} />
                  <span className="text-xs text-muted-foreground">{ad.placement?.split("_").join(" ") || "—"}</span>
                  <span className="text-xs text-muted-foreground">• {new Date(ad.created_at).toLocaleDateString()}</span>
                </div>
                <div className="mt-1 font-semibold truncate">{ad.title}</div>
                <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                  <Calendar className="w-3 h-3" /> {fmt(ad.start_date)} → {fmt(ad.end_date)}
                </div>
                <div className="text-xs text-muted-foreground mt-1 flex items-center gap-3">
                  <span className="inline-flex items-center gap-1"><Eye className="w-3 h-3" /> {ad.impressions ?? 0} imps</span>
                  <span>{ad.clicks ?? 0} clicks</span>
                </div>
              </div>

              {ad.ad_type === "banner" && ad.media_url && (
                <img src={ad.media_url} alt={`${ad.title} banner`} className="w-full md:w-48 h-24 object-contain rounded-md border border-border" loading="lazy" />
              )}

              <div className="md:w-64">
                <AdStatsMini adId={ad.id} />
              </div>

              <div className="flex gap-2 md:flex-col md:items-end">
                {(ad.status || "").toLowerCase() === "pending" ? (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => approve(ad)}><CheckCircle2 className="w-4 h-4 mr-1" />Approve</Button>
                    <Button size="sm" variant="destructive" onClick={() => reject(ad)}><XCircle className="w-4 h-4 mr-1" />Reject</Button>
                  </div>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => pauseToggle(ad)}>
                    {(ad.is_active ?? true) ? (<><Pause className="w-4 h-4 mr-1"/>Pause</>) : (<><Play className="w-4 h-4 mr-1"/>Resume</>)}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Ad Approvals & Status</h3>
      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="pending">Pending ({groups.pending.length})</TabsTrigger>
          <TabsTrigger value="active">Active ({groups.active.length})</TabsTrigger>
          <TabsTrigger value="expired">Expired ({groups.expired.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="pending"><List items={groups.pending} /></TabsContent>
        <TabsContent value="active"><List items={groups.active} /></TabsContent>
        <TabsContent value="expired"><List items={groups.expired} /></TabsContent>
      </Tabs>
    </div>
  );
}
