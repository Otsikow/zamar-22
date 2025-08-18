import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DollarSign, Users, CheckCircle, Clock, Download, Copy, Calendar as CalendarIcon, AlertTriangle, Settings, Ban } from 'lucide-react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface CommissionRule {
  generation: number;
  rate: number;
  updated_at: string;
}

interface CommissionRecord {
  id: string;
  earner_user_id: string;
  purchaser_user_id: string;
  generation: number;
  rate: number;
  amount_cents: number;
  currency: string;
  status: 'pending' | 'paid' | 'void';
  created_at: string;
  paid_at?: string;
  notes?: string;
  source_order_id: string;
  earner_name?: string;
  referred_name?: string;
}

interface KPIData {
  totalEarned: number;
  paidOut: number;
  pending: number;
  totalReferrals: number;
}

interface TopReferrer {
  earner_user_id: string;
  gen1_earnings: number;
  gen2_earnings: number;
  total: number;
  earner_name?: string;
}

interface FraudAlert {
  type: 'self_purchase' | 'multiple_accounts' | 'same_card';
  description: string;
  severity: 'high' | 'medium' | 'low';
  count: number;
}

export default function ComprehensiveReferralDashboard() {
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const { toast } = useToast();

  // State
  const [kpiData, setKpiData] = useState<KPIData>({ totalEarned: 0, paidOut: 0, pending: 0, totalReferrals: 0 });
  const [commissions, setCommissions] = useState<CommissionRecord[]>([]);
  const [rules, setRules] = useState<CommissionRule[]>([]);
  const [topReferrers, setTopReferrers] = useState<TopReferrer[]>([]);
  const [fraudAlerts, setFraudAlerts] = useState<FraudAlert[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [period, setPeriod] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [statusFilter, setStatusFilter] = useState('all');
  const [generationFilter, setGenerationFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});

  // Modals
  const [selectedCommission, setSelectedCommission] = useState<CommissionRecord | null>(null);
  const [voidReason, setVoidReason] = useState('');
  const [showVoidDialog, setShowVoidDialog] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      loadDashboardData();
    }
  }, [isAdmin, period, statusFilter, generationFilter, dateRange]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadKPIData(),
        loadCommissions(),
        loadRules(),
        loadTopReferrers(),
        loadFraudAlerts()
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast({ title: 'Error', description: 'Failed to load dashboard data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const loadKPIData = async () => {
    // Use existing referral_earnings table for KPIs
    const { data: earningsData } = await supabase
      .from('referral_earnings')
      .select('amount, status');

    if (earningsData) {
      const totalEarned = earningsData.reduce((sum, e) => sum + Number(e.amount), 0);
      const paidOut = earningsData.filter(e => e.status === 'paid').reduce((sum, e) => sum + Number(e.amount), 0);
      const pending = earningsData.filter(e => e.status === 'pending').reduce((sum, e) => sum + Number(e.amount), 0);

      const { count: totalReferrals } = await supabase
        .from('referrals')
        .select('*', { count: 'exact', head: true });

      setKpiData({
        totalEarned,
        paidOut,
        pending,
        totalReferrals: totalReferrals || 0
      });
    }
  };

  const loadCommissions = async () => {
    let query = supabase
      .from('referral_earnings')
      .select(`
        id,
        user_id,
        referred_user_id,
        generation,
        amount,
        status,
        created_at,
        level
      `)
      .order('created_at', { ascending: false });

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    if (generationFilter !== 'all') {
      const level = generationFilter === '1' ? 'L1' : 'L2';
      query = query.eq('level', level);
    }

    if (dateRange.from) {
      query = query.gte('created_at', startOfDay(dateRange.from).toISOString());
    }

    if (dateRange.to) {
      query = query.lte('created_at', endOfDay(dateRange.to).toISOString());
    }

    // Apply period filter
    if (period !== 'all') {
      const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
      const fromDate = subDays(new Date(), days);
      query = query.gte('created_at', fromDate.toISOString());
    }

    const { data } = await query;

    if (data) {
      // Fetch user names
      const userIds = [...new Set([...data.map(d => d.user_id), ...data.map(d => d.referred_user_id)])];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email')
        .in('id', userIds);

      const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);

      const enrichedCommissions = data.map(commission => ({
        id: commission.id,
        earner_user_id: commission.user_id,
        purchaser_user_id: commission.referred_user_id,
        generation: commission.level === 'L1' ? 1 : 2,
        rate: commission.level === 'L1' ? 0.15 : 0.10,
        amount_cents: Math.round(Number(commission.amount) * 100),
        currency: 'GBP',
        status: commission.status as 'pending' | 'paid' | 'void',
        created_at: commission.created_at,
        source_order_id: commission.id, // Using earning ID as source
        earner_name: getProfileName(profilesMap.get(commission.user_id)),
        referred_name: getProfileName(profilesMap.get(commission.referred_user_id)),
        notes: ''
      }));

      setCommissions(enrichedCommissions);
    }
  };

  const loadRules = async () => {
    // Mock rules data based on current system
    setRules([
      { generation: 1, rate: 0.15, updated_at: new Date().toISOString() },
      { generation: 2, rate: 0.10, updated_at: new Date().toISOString() }
    ]);
  };

  const loadTopReferrers = async () => {
    const fromDate = subDays(new Date(), 30);
    
    const { data } = await supabase
      .from('referral_earnings')
      .select('user_id, amount, level')
      .gte('created_at', fromDate.toISOString());

    if (data) {
      const referrerMap = new Map();
      
      data.forEach(earning => {
        if (!referrerMap.has(earning.user_id)) {
          referrerMap.set(earning.user_id, { gen1: 0, gen2: 0 });
        }
        
        const current = referrerMap.get(earning.user_id);
        if (earning.level === 'L1') {
          current.gen1 += Number(earning.amount);
        } else {
          current.gen2 += Number(earning.amount);
        }
      });

      const referrers = Array.from(referrerMap.entries()).map(([userId, earnings]) => ({
        earner_user_id: userId,
        gen1_earnings: earnings.gen1,
        gen2_earnings: earnings.gen2,
        total: earnings.gen1 + earnings.gen2
      }));

      // Get names
      const userIds = referrers.map(r => r.earner_user_id);
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email')
        .in('id', userIds);

      const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);

      const enrichedReferrers = referrers.map(r => ({
        ...r,
        earner_name: getProfileName(profilesMap.get(r.earner_user_id))
      })).sort((a, b) => b.total - a.total).slice(0, 20);

      setTopReferrers(enrichedReferrers);
    }
  };

  const loadFraudAlerts = async () => {
    // Mock fraud alerts for now
    setFraudAlerts([
      {
        type: 'self_purchase',
        description: 'Potential self-purchases detected',
        severity: 'high',
        count: 0
      },
      {
        type: 'multiple_accounts',
        description: 'Multiple accounts from same IP',
        severity: 'medium',
        count: 0
      },
      {
        type: 'same_card',
        description: 'Same card across different users',
        severity: 'low',
        count: 0
      }
    ]);
  };

  const getProfileName = (profile?: any) => {
    if (!profile) return 'Unknown';
    const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(' ');
    return fullName || profile.email || 'Unknown';
  };

  const chartData = useMemo(() => {
    const dayMap = new Map();
    
    commissions.forEach(commission => {
      const day = format(new Date(commission.created_at), 'yyyy-MM-dd');
      const amount = commission.amount_cents / 100;
      
      if (!dayMap.has(day)) {
        dayMap.set(day, { date: day, pending: 0, paid: 0 });
      }
      
      const dayData = dayMap.get(day);
      if (commission.status === 'pending') {
        dayData.pending += amount;
      } else if (commission.status === 'paid') {
        dayData.paid += amount;
      }
    });

    return Array.from(dayMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [commissions]);

  const filteredCommissions = useMemo(() => {
    if (!search) return commissions;
    
    const searchTerm = search.toLowerCase();
    return commissions.filter(c => 
      c.earner_name?.toLowerCase().includes(searchTerm) ||
      c.referred_name?.toLowerCase().includes(searchTerm) ||
      c.source_order_id.toLowerCase().includes(searchTerm)
    );
  }, [commissions, search]);

  const markAsPaid = async (commissionId: string) => {
    try {
      const { error } = await supabase
        .from('referral_earnings')
        .update({ 
          status: 'paid',
          updated_at: new Date().toISOString()
        })
        .eq('id', commissionId)
        .eq('status', 'pending');
      
      if (error) throw error;
      
      toast({ title: 'Success', description: 'Commission marked as paid' });
      loadDashboardData();
    } catch (error) {
      console.error('Error marking as paid:', error);
      toast({ title: 'Error', description: 'Failed to mark commission as paid', variant: 'destructive' });
    }
  };

  const voidCommission = async (commissionId: string, reason: string) => {
    try {
      const { error } = await supabase
        .from('referral_earnings')
        .update({ 
          status: 'void',
          updated_at: new Date().toISOString()
        })
        .eq('id', commissionId)
        .eq('status', 'pending');
      
      if (error) throw error;
      
      toast({ title: 'Success', description: 'Commission voided' });
      setShowVoidDialog(false);
      setVoidReason('');
      loadDashboardData();
    } catch (error) {
      console.error('Error voiding commission:', error);
      toast({ title: 'Error', description: 'Failed to void commission', variant: 'destructive' });
    }
  };

  const exportCSV = () => {
    const headers = ['Date', 'Earner', 'Referred User', 'Generation', 'Amount (£)', 'Status', 'Source Order ID', 'Notes'];
    const rows = filteredCommissions.map(c => [
      format(new Date(c.created_at), 'yyyy-MM-dd HH:mm:ss'),
      c.earner_name || 'Unknown',
      c.referred_name || 'Unknown',
      c.generation === 1 ? 'Gen-1 (15%)' : 'Gen-2 (10%)',
      (c.amount_cents / 100).toFixed(2),
      c.status,
      c.source_order_id,
      c.notes || ''
    ]);

    const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `referral-commissions-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (adminLoading || loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-muted rounded-lg" />
          ))}
        </div>
        <div className="h-64 bg-muted rounded-lg" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-destructive">Access Denied</CardTitle>
          <CardDescription>You don't have access to this page.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Admin → Referrals</h1>
          <p className="text-muted-foreground">Comprehensive referral management dashboard</p>
        </div>
        <Button onClick={exportCSV} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-primary/20 bg-gradient-to-br from-background to-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total Earned (£)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="h-6 w-6 text-primary" />
              <span className="text-2xl font-bold">£{kpiData.totalEarned.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-success/20 bg-gradient-to-br from-background to-success/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Paid Out (£)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-success" />
              <span className="text-2xl font-bold">£{kpiData.paidOut.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-warning/20 bg-gradient-to-br from-background to-warning/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Pending (£)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-6 w-6 text-warning" />
              <span className="text-2xl font-bold">£{kpiData.pending.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-accent/20 bg-gradient-to-br from-background to-accent/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total Referrals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-6 w-6 text-accent" />
              <span className="text-2xl font-bold">{kpiData.totalReferrals}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart and Top Referrers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Earnings Chart */}
        <Card className="lg:col-span-2 border-primary/20">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Earnings Over Time</CardTitle>
              <Select value={period} onValueChange={(v: '7d' | '30d' | '90d' | 'all') => setPeriod(v)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="all">All time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip formatter={(v: any) => [`£${Number(v).toFixed(2)}`, '']} />
                    <Line type="monotone" dataKey="pending" stroke="hsl(var(--warning))" name="Pending" />
                    <Line type="monotone" dataKey="paid" stroke="hsl(var(--success))" name="Paid" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No data yet
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Referrers */}
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle>Top Referrers (Last 30 days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topReferrers.length === 0 ? (
                <div className="text-sm text-muted-foreground">No data for selected period.</div>
              ) : (
                topReferrers.map((referrer, i) => (
                  <div key={referrer.earner_user_id} className="flex items-center justify-between border border-border rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <span className="w-6 text-center text-sm font-semibold text-primary">{i + 1}</span>
                      <div>
                        <div className="text-sm font-medium">{referrer.earner_name}</div>
                        <div className="text-xs text-muted-foreground">
                          Gen-1: £{referrer.gen1_earnings.toFixed(2)} | Gen-2: £{referrer.gen2_earnings.toFixed(2)}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm font-semibold">£{referrer.total.toFixed(2)}</div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Commission Breakdown */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle>Commission Breakdown</CardTitle>
          <div className="flex flex-wrap gap-4 mt-4">
            <Input
              placeholder="Search earner/referred..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="void">Void</SelectItem>
              </SelectContent>
            </Select>
            <Select value={generationFilter} onValueChange={setGenerationFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Generation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="1">Gen-1</SelectItem>
                <SelectItem value="2">Gen-2</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Earner</TableHead>
                  <TableHead>Referred User</TableHead>
                  <TableHead>Generation</TableHead>
                  <TableHead className="text-right">Amount (£)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Source Order</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCommissions.map((commission) => (
                  <TableRow key={commission.id}>
                    <TableCell>{format(new Date(commission.created_at), 'yyyy-MM-dd HH:mm')}</TableCell>
                    <TableCell>{commission.earner_name}</TableCell>
                    <TableCell>{commission.referred_name}</TableCell>
                    <TableCell>
                      <Badge variant={commission.generation === 1 ? 'default' : 'secondary'}>
                        Gen-{commission.generation} ({(commission.rate * 100).toFixed(0)}%)
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">£{(commission.amount_cents / 100).toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={
                        commission.status === 'paid' ? 'default' :
                        commission.status === 'pending' ? 'secondary' : 'destructive'
                      }>
                        {commission.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-mono">{commission.source_order_id.slice(0, 8)}</span>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => navigator.clipboard.writeText(commission.source_order_id)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {commission.status === 'pending' && (
                          <>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm">Mark Paid</Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Mark Commission as Paid</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to mark this commission as paid?
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => markAsPaid(commission.id)}>
                                    Mark as Paid
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>

                            <Dialog open={showVoidDialog && selectedCommission?.id === commission.id} onOpenChange={setShowVoidDialog}>
                              <DialogTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => setSelectedCommission(commission)}
                                >
                                  <Ban className="h-3 w-3 mr-1" />
                                  Void
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Void Commission</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <Label htmlFor="void-reason">Reason for voiding</Label>
                                  <Textarea
                                    id="void-reason"
                                    value={voidReason}
                                    onChange={(e) => setVoidReason(e.target.value)}
                                    placeholder="Enter reason for voiding this commission..."
                                  />
                                </div>
                                <DialogFooter>
                                  <Button variant="outline" onClick={() => setShowVoidDialog(false)}>Cancel</Button>
                                  <Button 
                                    variant="destructive" 
                                    onClick={() => voidCommission(commission.id, voidReason)}
                                    disabled={!voidReason.trim()}
                                  >
                                    Void Commission
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Rules and Fraud Checks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rules Panel */}
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Commission Rules
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {rules.map(rule => (
                <div key={rule.generation} className="flex justify-between items-center p-3 border border-border rounded-lg">
                  <div>
                    <div className="font-medium">Gen-{rule.generation} Rate</div>
                    <div className="text-sm text-muted-foreground">
                      Updated: {format(new Date(rule.updated_at), 'yyyy-MM-dd')}
                    </div>
                  </div>
                  <div className="text-lg font-bold text-primary">{(rule.rate * 100).toFixed(0)}%</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Fraud Checks */}
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Fraud Checks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {fraudAlerts.map(alert => (
                <div key={alert.type} className="flex justify-between items-center p-3 border border-border rounded-lg">
                  <div>
                    <div className="font-medium">{alert.description}</div>
                    <Badge variant={
                      alert.severity === 'high' ? 'destructive' :
                      alert.severity === 'medium' ? 'secondary' : 'default'
                    }>
                      {alert.severity}
                    </Badge>
                  </div>
                  <div className="text-lg font-bold">{alert.count}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}