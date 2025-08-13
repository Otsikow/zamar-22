import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { Share2, Copy, Users, Network, PiggyBank, CalendarDays, Download } from "lucide-react";
import { addWWWToReferralLink, cn } from "@/lib/utils";
import { format } from "date-fns";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

interface SummaryRow {
  user_id: string;
  total_earned: number;
  pending_earnings: number;
  paid_earnings: number;
  direct_referrals: number;
  indirect_referrals: number;
}

interface EarningLine {
  id: string;
  created_at: string;
  amount: number;
  status: string;
  generation: number;
  purchase_amount?: number | null;
  payment_currency?: string | null;
}

export default function ReferralAnalytics() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [referralCode, setReferralCode] = useState<string>("");
  const [summary, setSummary] = useState<SummaryRow | null>(null);
  const [lines, setLines] = useState<EarningLine[]>([]);
  const [period, setPeriod] = useState<"30d" | "90d" | "all">("30d");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    document.title = "Referral Analytics | Zamar";
    const desc = "Referral Analytics: track your impact and rewards in real time.";
    let metaDesc = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!metaDesc) {
      metaDesc = document.createElement("meta");
      metaDesc.name = "description";
      document.head.appendChild(metaDesc);
    }
    metaDesc.content = desc;

    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    const href = window.location.origin + "/referrals/analytics";
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = href;
  }, []);

  useEffect(() => {
    if (!user) return;
    // Fallback code generation since profiles may not have referral_code column
    setReferralCode(`ZAMAR_${user.id.slice(-8).toUpperCase()}`);
  }, [user]);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      setLoading(true);
      try {
        // Summary
        const { data: sumRows } = await supabase
          .from("v_referral_summary")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();
        if (sumRows) setSummary(sumRows as unknown as SummaryRow);

        // Earnings detailed
        let q = supabase
          .from("v_referral_earnings_detailed")
          .select("id, created_at, amount, status, generation, payment_amount, payment_currency")
          .order("created_at", { ascending: false })
          .eq("user_id", user.id);

        if (statusFilter !== "all") q = q.eq("status", statusFilter);
        if (dateRange.from) q = q.gte("created_at", dateRange.from.toISOString());
        if (dateRange.to) q = q.lte("created_at", dateRange.to.toISOString());

        const { data: lineRows, error: lineErr } = await q;
        if (lineErr) throw lineErr;
        setLines((lineRows || []) as unknown as EarningLine[]);
      } catch (e) {
        console.error(e);
        toast({ title: "Failed to load", description: "Could not load referral analytics", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user, statusFilter, dateRange]);

  const chartData = useMemo(() => {
    // Filter period
    const now = new Date();
    const start = period === "30d" ? new Date(now.getTime() - 30 * 86400000)
      : period === "90d" ? new Date(now.getTime() - 90 * 86400000)
      : new Date(0);

    const byDay = new Map<string, number>();
    (lines || []).forEach((l) => {
      const d = new Date(l.created_at);
      if (d < start) return;
      const key = format(d, "yyyy-MM-dd");
      const prev = byDay.get(key) || 0;
      byDay.set(key, prev + Number(l.amount || 0));
    });
    return Array.from(byDay.entries())
      .sort((a, b) => (a[0] < b[0] ? -1 : 1))
      .map(([date, total]) => ({ date, total }));
  }, [lines, period]);

  const copyReferral = () => {
    const url = addWWWToReferralLink(`https://zamarsongs.com/auth?ref=${referralCode}`);
    navigator.clipboard.writeText(url);
    toast({ title: "Referral link copied", description: url });
  };

  const exportCSV = () => {
    const rows = lines.map((l) => ({
      date: l.created_at,
      generation: l.generation,
      status: l.status,
      amount: l.amount,
      purchase_amount: l.purchase_amount ?? "",
      currency: l.payment_currency ?? "",
    }));
    if (rows.length === 0) return;
    const header = Object.keys(rows[0]).join(",");
    const csv = [header, ...rows.map((r) => Object.values(r).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `referral-earnings-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-6xl mx-auto animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-64" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded-lg" />
            ))}
          </div>
          <div className="h-80 bg-muted rounded-lg" />
          <div className="h-64 bg-muted rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Referral Analytics</h1>
          <p className="text-muted-foreground">Track your impact and rewards in real time.</p>
        </div>

        {/* Row: Referral Link + Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card A */}
          <Card className="border-primary/20 bg-gradient-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <Share2 className="h-5 w-5"/>
                Your Referral Link
              </CardTitle>
              <CardDescription>Share this link and earn commissions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="font-mono text-sm p-4 rounded-lg bg-muted/50 border border-border break-all">
                https://www.zamarsongs.com/auth?ref={referralCode}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Button 
                  onClick={copyReferral} 
                  variant="default" 
                  size="sm" 
                  className="w-full"
                >
                  <Copy className="h-4 w-4 mr-2"/>
                  Copy
                </Button>
                <Button 
                  asChild 
                  variant="outline" 
                  size="sm"
                  className="w-full"
                >
                  <a 
                    href={`https://wa.me/?text=${encodeURIComponent(addWWWToReferralLink(`https://zamarsongs.com/auth?ref=${referralCode}`))}`} 
                    target="_blank" 
                    rel="noreferrer"
                  >
                    WhatsApp
                  </a>
                </Button>
                <Button 
                  asChild 
                  variant="outline" 
                  size="sm"
                  className="w-full"
                >
                  <a href={`mailto:?subject=Join%20Zamar&body=${encodeURIComponent(addWWWToReferralLink(`https://zamarsongs.com/auth?ref=${referralCode}`))}`}>
                    Email
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Card B */}
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="text-primary">Earnings Summary</CardTitle>
              <CardDescription>Converted from your earnings</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-3">
              <div>
                <div className="text-xs text-muted-foreground">Total Earned</div>
                <div className="text-xl font-bold">£{(summary?.total_earned ?? 0).toFixed(2)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Unpaid</div>
                <div className="text-xl font-bold">£{(summary?.pending_earnings ?? 0).toFixed(2)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Paid</div>
                <div className="text-xl font-bold">£{(summary?.paid_earnings ?? 0).toFixed(2)}</div>
              </div>
            </CardContent>
          </Card>

          {/* Card C */}
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="text-primary">Referrals</CardTitle>
              <CardDescription>Your network</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2"><Users className="h-4 w-4 text-primary"/> <div>
                <div className="text-xs text-muted-foreground">Direct</div>
                <div className="text-xl font-bold">{summary?.direct_referrals ?? 0}</div>
              </div></div>
              <div className="flex items-center gap-2"><Network className="h-4 w-4 text-primary"/> <div>
                <div className="text-xs text-muted-foreground">Indirect</div>
                <div className="text-xl font-bold">{summary?.indirect_referrals ?? 0}</div>
              </div></div>
            </CardContent>
          </Card>
        </div>

        {/* Row: Chart + Leaderboard */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2 border-primary/20">
            <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Earnings Over Time</CardTitle>
                <CardDescription>Daily totals (reversed excluded)</CardDescription>
              </div>
              <div className="flex gap-2">
                {(["30d","90d","all"] as const).map(p => (
                  <Button key={p} size="sm" variant={period===p?"default":"outline"} onClick={()=>setPeriod(p)}>{p}</Button>
                ))}
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ left: 12, right: 12, top: 10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.6}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.05}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date"/>
                    <YAxis/>
                    <Tooltip formatter={(v)=>[`£${Number(v).toFixed(2)}`, "Total"]} />
                    <Area type="monotone" dataKey="total" stroke="hsl(var(--primary))" fill="url(#gold)"/>
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle>Top Referrers (30 days)</CardTitle>
              <CardDescription>Privacy-respecting leaderboard</CardDescription>
            </CardHeader>
            <CardContent>
              <Leaderboard selfId={user?.id} />
            </CardContent>
          </Card>
        </div>

        {/* Table: Commission Breakdown */}
        <Card className="border-primary/20">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle>Commission Breakdown</CardTitle>
              <CardDescription>Filtered by your selections</CardDescription>
            </div>
            <div className="flex gap-2 items-center">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40"><SelectValue placeholder="Status"/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="pending">Unpaid</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="reversed">Reversed</SelectItem>
                </SelectContent>
              </Select>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm"><CalendarDays className="h-4 w-4 mr-2"/>Date range</Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="range" selected={dateRange as any} onSelect={setDateRange as any} className={cn("p-3 pointer-events-auto")} />
                </PopoverContent>
              </Popover>
              <Button variant="outline" size="sm" onClick={exportCSV}><Download className="h-4 w-4 mr-2"/>Export</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="w-full overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Gen</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead className="text-right">Purchase</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lines.map(l => (
                    <TableRow key={l.id}>
                      <TableCell>{format(new Date(l.created_at), "yyyy-MM-dd")}</TableCell>
                      <TableCell>{l.generation === 1 ? "Gen‑1 (15%)" : "Gen‑2 (10%)"}</TableCell>
                      <TableCell>{l.status}</TableCell>
                      <TableCell>£{Number(l.amount || 0).toFixed(2)}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{l.purchase_amount ? `£${Number(l.purchase_amount).toFixed(2)}` : "—"}</TableCell>
                    </TableRow>
                  ))}
                  {lines.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">No earnings found for the selected filters.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Notice */}
        {summary && (summary.pending_earnings ?? 0) > 0 && (
          <Card className="border-primary/20">
            <CardContent className="py-4 text-sm text-muted-foreground">
              You have unpaid earnings. Payouts are processed monthly.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function Leaderboard({ selfId }: { selfId?: string }) {
  const [rows, setRows] = useState<{ earner_id: string; earned_30d: number; earning_events: number; display_name?: string }[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("v_top_referrers_last30").select("*");
      const ids = Array.from(new Set((data || []).map((r: any) => r.earner_id)));
      if (ids.length === 0) { setRows([]); return; }
      const { data: profiles } = await supabase.from("profiles").select("id, first_name, last_name").in("id", ids);
      const map = new Map(profiles?.map((p: any) => [p.id, `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim()]))
      const items = (data || []).map((r: any) => ({
        earner_id: r.earner_id,
        earned_30d: Number(r.earned_30d ?? r.earned_cents_30d ?? 0),
        earning_events: Number(r.earning_events || 0),
        display_name: map.get(r.earner_id) || undefined,
      }));
      setRows(items);
    };
    load();
  }, []);

  const mask = (id: string) => `User ••••${id.slice(-4)}`;

  return (
    <div className="space-y-3">
      {rows.length === 0 && <div className="text-sm text-muted-foreground">No leaderboard data yet.</div>}
      {rows.map((r) => (
        <div key={r.earner_id} className="flex items-center justify-between border-b border-border/50 pb-2">
          <div className="font-medium">{r.earner_id === selfId ? (r.display_name || "You") : (r.display_name ? mask(r.display_name) : mask(r.earner_id))}</div>
          <div className="text-sm">£{r.earned_30d.toFixed(2)} • {r.earning_events} events</div>
        </div>
      ))}
    </div>
  );
}
