import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, Users, DollarSign, Trophy, TrendingUp, Filter, Calendar } from "lucide-react";
import { format } from "date-fns";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as ReTooltip,
  CartesianGrid,
} from "recharts";

interface EarningRow {
  id: string;
  user_id: string; // earner
  referred_user_id: string;
  generation: number;
  amount: number; // numeric in DB
  status: "pending" | "paid";
  earned_at: string;
}

interface ProfileLite {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
}

type Period = "30d" | "90d" | "all";

function ReferralAnalyticsComp() {
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const { toast } = useToast();

  // Summary
  const [totalEarned, setTotalEarned] = useState(0);
  const [paid, setPaid] = useState(0);
  const [pending, setPending] = useState(0);
  const [totalReferrals, setTotalReferrals] = useState(0);

  // Filters / view state
  const [period, setPeriod] = useState<Period>("30d");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [generationFilter, setGenerationFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  // Data
  const [earnings, setEarnings] = useState<EarningRow[]>([]);
  const [profiles, setProfiles] = useState<Record<string, ProfileLite>>({});
  const [loading, setLoading] = useState(true);

  // Leaderboard
  const [leaderboard, setLeaderboard] = useState<Array<{ user_id: string; total: number; count: number }>>([]);

  useEffect(() => {
    if (!isAdmin) return;
    loadSummary();
    loadEarnings();
  }, [isAdmin, period, statusFilter, generationFilter]);

  const loadSummary = async () => {
    try {
      // Earnings totals
      const { data: all, error: e1 } = await supabase
        .from("referral_earnings")
        .select("amount, status");
      if (e1) throw e1;
      const total = (all || []).reduce((s, r) => s + Number(r.amount || 0), 0);
      const paidAmt = (all || []).filter((r) => r.status === "paid").reduce((s, r) => s + Number(r.amount || 0), 0);
      const pendingAmt = total - paidAmt;
      setTotalEarned(total);
      setPaid(paidAmt);
      setPending(pendingAmt);

      // Referral count
      const { count, error: e2 } = await supabase
        .from("referrals")
        .select("id", { count: "exact", head: true });
      if (e2) throw e2;
      setTotalReferrals(count || 0);
    } catch (err) {
      console.error("Summary load error", err);
      toast({ title: "Error", description: "Failed to load referral summary", variant: "destructive" });
    }
  };

  const computeDateLowerBound = () => {
    if (period === "all") return undefined;
    const days = period === "30d" ? 30 : 90;
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString();
  };

  const loadEarnings = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("referral_earnings")
        .select("id,user_id,referred_user_id,generation,amount,status,earned_at")
        .order("earned_at", { ascending: false });

      const from = computeDateLowerBound();
      if (from) query = query.gte("earned_at", from);
      if (statusFilter !== "all") query = query.eq("status", statusFilter);
      if (generationFilter !== "all") query = query.eq("generation", Number(generationFilter));

      const { data, error } = await query;
      if (error) throw error;
      const rows = (data || []) as unknown as EarningRow[];
      setEarnings(rows);

      // Build leaderboard aggregates
      const agg = new Map<string, { total: number; count: number }>();
      rows.forEach((r) => {
        const entry = agg.get(r.user_id) || { total: 0, count: 0 };
        entry.total += Number(r.amount || 0);
        entry.count += 1;
        agg.set(r.user_id, entry);
      });
      const lb = Array.from(agg.entries())
        .map(([user_id, v]) => ({ user_id, total: v.total, count: v.count }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 10);
      setLeaderboard(lb);

      // Fetch profiles for display
      const ids = Array.from(new Set([...
        rows.map((r) => r.user_id),
        rows.map((r) => r.referred_user_id),
        leaderboard.map((l) => l.user_id),
      ]));

      if (ids.length) {
        const { data: profs } = await supabase
          .from("profiles" as any)
          .select("id, first_name, last_name, email")
          .in("id", ids);
        const map: Record<string, ProfileLite> = {};
        (profs || []).forEach((p: any) => (map[p.id] = p));
        setProfiles(map);
      }
    } catch (err) {
      console.error("Earnings load error", err);
      toast({ title: "Error", description: "Failed to load earnings", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Chart data grouped by day
  const chartData = useMemo(() => {
    const map = new Map<string, number>();
    earnings.forEach((e) => {
      const day = format(new Date(e.earned_at), "yyyy-MM-dd");
      const prev = map.get(day) || 0;
      map.set(day, prev + Number(e.amount || 0));
    });
    return Array.from(map.entries())
      .map(([date, value]) => ({ date, value }))
      .sort((a, b) => (a.date < b.date ? -1 : 1));
  }, [earnings]);

  const filteredTableRows = useMemo(() => {
    if (!search) return earnings;
    const term = search.toLowerCase();
    return earnings.filter((e) => {
      const earner = profiles[e.user_id];
      const referred = profiles[e.referred_user_id];
      const earnerName = `${earner?.first_name || ""} ${earner?.last_name || ""}`.toLowerCase();
      const referredName = `${referred?.first_name || ""} ${referred?.last_name || ""}`.toLowerCase();
      return earnerName.includes(term) || referredName.includes(term) || e.id.includes(term);
    });
  }, [earnings, profiles, search]);

  const fmtMoney = (n: number) => `£${(Number(n) || 0).toFixed(2)}`;
  const nameOf = (p?: ProfileLite) =>
    p ? `${p.first_name || ""} ${p.last_name || ""}`.trim() || p.email || "Unknown" : "Unknown";

  const exportCSV = () => {
    const headers = [
      "Date",
      "Earner",
      "Referred User",
      "Generation",
      "Amount",
      "Status",
      "ID",
    ];
    const rows = filteredTableRows.map((r) => [
      format(new Date(r.earned_at), "yyyy-MM-dd HH:mm"),
      nameOf(profiles[r.user_id]),
      nameOf(profiles[r.referred_user_id]),
      r.generation === 1 ? "Gen-1" : "Gen-2",
      (Number(r.amount) || 0).toFixed(2),
      r.status,
      r.id,
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `referral-earnings-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (adminLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded-lg" />
            ))}
          </div>
          <div className="h-64 bg-muted rounded-lg" />
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-destructive">Access denied</CardTitle>
          <CardDescription>Admin permissions are required to view Referral Analytics.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-primary/20 bg-gradient-to-br from-background to-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total Earned</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-primary" />
            <span className="text-2xl font-bold text-primary">{fmtMoney(totalEarned)}</span>
          </CardContent>
        </Card>
        <Card className="border-success/20 bg-gradient-to-br from-background to-success/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Paid Out</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            <Trophy className="h-6 w-6 text-success" />
            <span className="text-2xl font-bold text-success">{fmtMoney(paid)}</span>
          </CardContent>
        </Card>
        <Card className="border-warning/20 bg-gradient-to-br from-background to-warning/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Pending</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-warning" />
            <span className="text-2xl font-bold text-warning">{fmtMoney(pending)}</span>
          </CardContent>
        </Card>
        <Card className="border-accent/20 bg-gradient-to-br from-background to-accent/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total Referrals</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            <Users className="h-6 w-6 text-accent" />
            <span className="text-2xl font-bold text-accent">{totalReferrals}</span>
          </CardContent>
        </Card>
      </div>

      {/* Chart + Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 border-primary/20">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Earnings Over Time</CardTitle>
              <div className="flex items-center gap-2">
                <Label htmlFor="period" className="text-xs text-muted-foreground">Period</Label>
                <Select value={period} onValueChange={(v: Period) => setPeriod(v)}>
                  <SelectTrigger id="period" className="h-8 w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30d">Last 30 days</SelectItem>
                    <SelectItem value="90d">Last 90 days</SelectItem>
                    <SelectItem value="all">All time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ left: 8, right: 8, top: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="earnings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="hsl(var(--border))" strokeOpacity={0.3} />
                <XAxis dataKey="date" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))" }} />
                <ReTooltip formatter={(v: any) => fmtMoney(Number(v))} labelFormatter={(l) => `Date: ${l}`} />
                <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#earnings)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Top Referrers</CardTitle>
            <CardDescription>Last {period === "all" ? "all time" : period === "30d" ? "30 days" : "90 days"}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {leaderboard.length === 0 && (
                <div className="text-sm text-muted-foreground">No data for selected period.</div>
              )}
              {leaderboard.map((row, i) => (
                <div key={row.user_id} className="flex items-center justify-between border border-border rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 text-center text-sm font-semibold text-primary">{i + 1}</span>
                    <span className="text-sm">{nameOf(profiles[row.user_id])}</span>
                  </div>
                  <div className="text-sm font-semibold">{fmtMoney(row.total)}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed table */}
      <Card className="border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Filter className="h-5 w-5" /> Commission Breakdown
            </CardTitle>
            <div className="flex items-center gap-2">
              <Input placeholder="Search earner/referred..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-48" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
              <Select value={generationFilter} onValueChange={setGenerationFilter}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Generation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Gen: All</SelectItem>
                  <SelectItem value="1">Gen‑1</SelectItem>
                  <SelectItem value="2">Gen‑2</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={exportCSV}>
                <Download className="h-4 w-4 mr-2" /> Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Earner</TableHead>
                  <TableHead>Referred User</TableHead>
                  <TableHead>Generation</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7}>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" /> Loading...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredTableRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No records for the selected filters
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTableRows.map((row) => (
                    <TableRow key={row.id} className="hover:bg-muted/30">
                      <TableCell>{format(new Date(row.earned_at), "yyyy-MM-dd HH:mm")}</TableCell>
                      <TableCell>{nameOf(profiles[row.user_id])}</TableCell>
                      <TableCell>{nameOf(profiles[row.referred_user_id])}</TableCell>
                      <TableCell>
                        <Badge variant={row.generation === 1 ? "default" : "secondary"}>
                          {row.generation === 1 ? "Gen‑1 (15%)" : "Gen‑2 (10%)"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{fmtMoney(row.amount)}</TableCell>
                      <TableCell>
                        <Badge className={row.status === "paid" ? "bg-success/20 text-success" : "bg-warning/20 text-warning"}>
                          {row.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{row.id.slice(0, 8)}…</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Tabs placeholder for future extensions */}
      <Tabs defaultValue="analytics" className="w-full">
        <TabsList className="hidden">
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        <TabsContent value="analytics" />
      </Tabs>
    </div>
  );
}

export default ReferralAnalyticsComp;
export { ReferralAnalyticsComp as ReferralAnalytics };