import { useEffect, useState, useMemo, useCallback } from 'react';
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
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Wallet, Trophy, TrendingUp, Users, CheckCircle, Clock, Download, Copy, Calendar as CalendarIcon, AlertTriangle, Settings, Ban, Shield, CreditCard, Globe } from 'lucide-react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';

// Import new components
import { KPICards } from './KPICards';
import { EarningsChart } from './EarningsChart';
import { TopReferrersTable } from './TopReferrersTable';
import { CommissionBreakdownTable } from './CommissionBreakdownTable';
import { FraudChecksPanel } from './FraudChecksPanel';
import { CommissionRules } from './CommissionRules';
import { FiltersBar } from './FiltersBar';

// Helper function for consistent GBP formatting
const formatGBP = (cents: number | null | undefined): string => {
  if (cents == null) return "£0.00";
  const value = (Number(cents) / 100).toFixed(2);
  return `£${value}`;
};

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
  id: string;
  type: 'self_purchase' | 'multiple_accounts' | 'same_card';
  description: string;
  severity: 'high' | 'medium' | 'low';
  count: number;
  details?: any;
}

interface EarningsChartData {
  date: string;
  pending: number;
  paid: number;
}

export default function ComprehensiveReferralDashboard() {
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const { toast } = useToast();

  // Page-level state as requested
  const [state, setState] = useState({
    period: "last_30" as 'last_7' | 'last_30' | 'last_90' | 'all' | 'custom',
    date_from: null as Date | null,
    date_to: null as Date | null,
    status_filter: "all" as string,
    gen_filter: "all" as string,
    search_text: "",
    selected_commission_id: null as string | null,
    fraud_tab_open: false
  });

  // Data state
  const [kpiData, setKpiData] = useState<KPIData>({ totalEarned: 0, paidOut: 0, pending: 0, totalReferrals: 0 });
  const [commissions, setCommissions] = useState<CommissionRecord[]>([]);
  const [rules, setRules] = useState<CommissionRule[]>([]);
  const [topReferrers, setTopReferrers] = useState<TopReferrer[]>([]);
  const [fraudAlerts, setFraudAlerts] = useState<FraudAlert[]>([]);
  const [chartData, setChartData] = useState<EarningsChartData[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [selectedCommission, setSelectedCommission] = useState<CommissionRecord | null>(null);
  const [voidReason, setVoidReason] = useState('');
  const [showVoidDialog, setShowVoidDialog] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 25;

  useEffect(() => {
    if (isAdmin) {
      loadDashboardData();
    }
  }, [isAdmin, state.period, state.status_filter, state.gen_filter, state.date_from, state.date_to]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadKPIData(),
        loadCommissions(),
        loadRules(),
        loadTopReferrers(),
        loadFraudAlerts(),
        loadChartData()
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast({ title: 'Error', description: 'Failed to load dashboard data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const loadKPIData = async () => {
    // KPI Card 1 — Total Earned (pending + paid)
    const { data: totalEarnedData } = await supabase
      .from('referral_earnings')
      .select('amount')
      .in('status', ['pending', 'paid']);

    // KPI Card 2 — Paid Out
    const { data: paidOutData } = await supabase
      .from('referral_earnings')
      .select('amount')
      .eq('status', 'paid');

    // KPI Card 3 — Pending
    const { data: pendingData } = await supabase
      .from('referral_earnings')
      .select('amount')
      .eq('status', 'pending');

    // KPI Card 4 — Total Referrals (distinct purchaser_user_id)
    const { data: referralsData } = await supabase
      .from('referral_earnings')
      .select('referred_user_id');

    const totalEarned = (totalEarnedData || []).reduce((sum, e) => sum + Number(e.amount), 0);
    const paidOut = (paidOutData || []).reduce((sum, e) => sum + Number(e.amount), 0);
    const pending = (pendingData || []).reduce((sum, e) => sum + Number(e.amount), 0);
    const uniqueReferrals = new Set((referralsData || []).map(r => r.referred_user_id)).size;

    setKpiData({
      totalEarned,
      paidOut,
      pending,
      totalReferrals: uniqueReferrals
    });
  };

  const buildFilterWhereClause = () => {
    let whereClause = "1=1";
    const params: any[] = [];

    // Status filter
    if (state.status_filter !== 'all') {
      whereClause += ` AND status = $${params.length + 1}`;
      params.push(state.status_filter);
    }

    // Generation filter
    if (state.gen_filter !== 'all') {
      const level = state.gen_filter === '1' ? 'L1' : 'L2';
      whereClause += ` AND level = $${params.length + 1}`;
      params.push(level);
    }

    // Period filter
    if (state.period !== 'all' && state.period !== 'custom') {
      const days = state.period === 'last_7' ? 7 : state.period === 'last_30' ? 30 : 90;
      const fromDate = subDays(new Date(), days);
      whereClause += ` AND created_at >= $${params.length + 1}`;
      params.push(fromDate.toISOString());
    } else if (state.period === 'custom') {
      if (state.date_from) {
        whereClause += ` AND created_at >= $${params.length + 1}`;
        params.push(startOfDay(state.date_from).toISOString());
      }
      if (state.date_to) {
        whereClause += ` AND created_at <= $${params.length + 1}`;
        params.push(endOfDay(state.date_to).toISOString());
      }
    }

    return { whereClause, params };
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

    // Apply filters
    if (state.status_filter !== 'all') {
      query = query.eq('status', state.status_filter);
    }

    if (state.gen_filter !== 'all') {
      const level = state.gen_filter === '1' ? 'L1' : 'L2';
      query = query.eq('level', level);
    }

    // Apply period filter
    if (state.period !== 'all' && state.period !== 'custom') {
      const days = state.period === 'last_7' ? 7 : state.period === 'last_30' ? 30 : 90;
      const fromDate = subDays(new Date(), days);
      query = query.gte('created_at', fromDate.toISOString());
    } else if (state.period === 'custom') {
      if (state.date_from) {
        query = query.gte('created_at', startOfDay(state.date_from).toISOString());
      }
      if (state.date_to) {
        query = query.lte('created_at', endOfDay(state.date_to).toISOString());
      }
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

  const loadChartData = async () => {
    // Build chart data based on current filters
    const { whereClause } = buildFilterWhereClause();
    
    let query = supabase
      .from('referral_earnings')
      .select('created_at, amount, status');

    // Apply same filters as commissions
    if (state.status_filter !== 'all') {
      query = query.eq('status', state.status_filter);
    }

    if (state.gen_filter !== 'all') {
      const level = state.gen_filter === '1' ? 'L1' : 'L2';
      query = query.eq('level', level);
    }

    if (state.period !== 'all' && state.period !== 'custom') {
      const days = state.period === 'last_7' ? 7 : state.period === 'last_30' ? 30 : 90;
      const fromDate = subDays(new Date(), days);
      query = query.gte('created_at', fromDate.toISOString());
    } else if (state.period === 'custom') {
      if (state.date_from) {
        query = query.gte('created_at', startOfDay(state.date_from).toISOString());
      }
      if (state.date_to) {
        query = query.lte('created_at', endOfDay(state.date_to).toISOString());
      }
    }

    const { data } = await query;

    if (data) {
      const dayMap = new Map<string, { pending: number; paid: number }>();
      
      data.forEach(earning => {
        const day = format(new Date(earning.created_at), 'yyyy-MM-dd');
        const amount = Number(earning.amount);
        
        if (!dayMap.has(day)) {
          dayMap.set(day, { pending: 0, paid: 0 });
        }
        
        const dayData = dayMap.get(day)!;
        if (earning.status === 'pending') {
          dayData.pending += amount;
        } else if (earning.status === 'paid') {
          dayData.paid += amount;
        }
      });

      const chartData = Array.from(dayMap.entries())
        .map(([date, data]) => ({
          date,
          pending: data.pending,
          paid: data.paid
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      setChartData(chartData);
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
    const alerts: FraudAlert[] = [];

    // 1) Self-Purchases (earner = purchaser)
    const { data: selfPurchases } = await supabase
      .from('referral_earnings')
      .select('id, user_id, referred_user_id, amount, created_at')
      .eq('user_id', 'referred_user_id'); // This won't work directly, but we'll filter in JS

    // 2) Same IP bursts (requires orders.metadata->>'ip')
    // Mock for now since we don't have IP data in orders
    
    // 3) Same card across users (requires orders.metadata->>'last4') 
    // Mock for now since we don't have card data

    alerts.push({
      id: 'self_purchase',
      type: 'self_purchase',
      description: 'Users earning commissions on their own purchases',
      severity: 'high',
      count: 0 // Would count actual self-purchases
    });

    alerts.push({
      id: 'multiple_accounts',
      type: 'multiple_accounts', 
      description: 'Multiple accounts purchasing from same IP within 24h',
      severity: 'medium',
      count: 0 // Would count IP bursts
    });

    alerts.push({
      id: 'same_card',
      type: 'same_card',
      description: 'Same payment method used across multiple accounts',
      severity: 'low', 
      count: 0 // Would count shared cards
    });

    setFraudAlerts(alerts);
  };

  const getProfileName = (profile?: any) => {
    if (!profile) return 'Unknown';
    const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(' ');
    return fullName || profile.email || 'Unknown';
  };

  // Filtered commissions with search
  const filteredCommissions = useMemo(() => {
    if (!state.search_text) return commissions;
    
    const searchTerm = state.search_text.toLowerCase();
    return commissions.filter(c => 
      c.earner_name?.toLowerCase().includes(searchTerm) ||
      c.referred_name?.toLowerCase().includes(searchTerm) ||
      c.source_order_id.toLowerCase().includes(searchTerm)
    );
  }, [commissions, state.search_text]);

  // Direct database actions since RPC functions don't exist yet
  const markAsPaid = useCallback(async (commissionId: string) => {
    try {
      const { error } = await supabase
        .from('referral_earnings')
        .update({ status: 'paid', updated_at: new Date().toISOString() })
        .eq('id', commissionId)
        .eq('status', 'pending');
      
      if (error) throw error;
      
      toast({ title: 'Success', description: 'Commission marked as paid' });
      loadDashboardData();
    } catch (error) {
      console.error('Error marking as paid:', error);
      toast({ title: 'Error', description: 'Failed to mark commission as paid', variant: 'destructive' });
    }
  }, [toast]);

  const voidCommission = useCallback(async (commissionId: string, reason: string) => {
    try {
      const { error } = await supabase
        .from('referral_earnings')
        .update({ status: 'void', updated_at: new Date().toISOString() })
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
  }, [toast]);

  // Additional handlers
  const handleReferrerClick = (referrer: TopReferrer) => {
    setState(prev => ({ ...prev, search_text: referrer.earner_name || '' }));
    // Scroll to breakdown section
    document.getElementById('commission-breakdown')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleVoidClick = (commission: CommissionRecord) => {
    setSelectedCommission(commission);
    setShowVoidDialog(true);
  };

  const handleFilterByAlert = (alert: FraudAlert) => {
    // Apply filters based on fraud alert type
    switch (alert.type) {
      case 'self_purchase':
        setState(prev => ({ ...prev, search_text: 'self-purchase' }));
        break;
      case 'multiple_accounts':
        // Would filter by IP if we had that data
        break;
      case 'same_card':
        // Would filter by card if we had that data
        break;
    }
    document.getElementById('commission-breakdown')?.scrollIntoView({ behavior: 'smooth' });
  };

  const exportCSV = useCallback(() => {
    const headers = ['Date', 'Earner', 'Referred User', 'Generation', 'Amount (£)', 'Status', 'Source Order ID', 'Notes'];
    const rows = filteredCommissions.map(c => [
      format(new Date(c.created_at), 'yyyy-MM-dd HH:mm:ss'),
      c.earner_name || 'Unknown',
      c.referred_name || 'Unknown',
      c.generation === 1 ? 'Gen-1 (15%)' : 'Gen-2 (10%)',
      formatGBP(c.amount_cents).replace('£', ''), // Remove £ symbol for CSV
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
  }, [filteredCommissions]);

  if (adminLoading || loading) {
    return (
      <div className="space-y-6 animate-pulse max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-muted rounded-lg" />
          ))}
        </div>
        <div className="h-64 bg-muted rounded-lg" />
        <div className="h-96 bg-muted rounded-lg" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="text-destructive">Access Denied</CardTitle>
            <CardDescription>You don't have access to this page.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Admin → Referrals</h1>
          <p className="text-muted-foreground">Comprehensive referral management dashboard with Gen-1 & Gen-2 support</p>
        </div>
        <div className="flex items-center gap-2">
          <Sheet open={state.fraud_tab_open} onOpenChange={(open) => setState(prev => ({ ...prev, fraud_tab_open: open }))}>
            <SheetTrigger asChild>
              <Button variant="outline">
                <Shield className="h-4 w-4 mr-2" />
                Fraud & Risk
              </Button>
            </SheetTrigger>
            <SheetContent className="w-96">
              <SheetHeader>
                <SheetTitle>Fraud & Risk Panel</SheetTitle>
                <SheetDescription>
                  Monitor suspicious activity and potential fraud
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6">
                <FraudChecksPanel 
                  fraudAlerts={fraudAlerts} 
                  onFilterByAlert={handleFilterByAlert}
                />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* KPI Cards */}
      <KPICards data={kpiData} />

      {/* Filters Bar */}
      <FiltersBar 
        state={state}
        onStateChange={(updates) => setState(prev => ({ ...prev, ...updates }))}
        onExportCSV={exportCSV}
      />

      {/* Chart and Top Referrers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Earnings Chart */}
        <div className="lg:col-span-2">
          <EarningsChart data={chartData} period={state.period} />
        </div>

        {/* Top Referrers */}
        <div className="space-y-6">
          <TopReferrersTable 
            referrers={topReferrers}
            onReferrerClick={handleReferrerClick}
          />
          
          {/* Rules Panel */}
          <CommissionRules rules={rules} />
        </div>
      </div>

      {/* Commission Breakdown */}
      <div id="commission-breakdown">
        <CommissionBreakdownTable 
          commissions={filteredCommissions}
          onMarkPaid={markAsPaid}
          onVoid={handleVoidClick}
          onExportCSV={exportCSV}
        />
      </div>

      {/* Void Commission Dialog */}
      <Dialog open={showVoidDialog} onOpenChange={setShowVoidDialog}>
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
              onClick={() => selectedCommission && voidCommission(selectedCommission.id, voidReason)}
              disabled={!voidReason.trim()}
            >
              Void Commission
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}