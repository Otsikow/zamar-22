import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { 
  DollarSign, 
  Users, 
  CheckCircle, 
  Clock, 
  Download, 
  Plus, 
  Calendar,
  CreditCard,
  TrendingUp,
  Filter
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface ReferralEarning {
  id: string;
  user_id: string;
  referred_user_id: string;
  generation: number;
  amount: number;
  status: 'pending' | 'paid';
  earned_at: string;
  referrer_profile?: {
    first_name: string;
    last_name: string;
    email: string;
  };
  referred_profile?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

interface PayoutRecord {
  id: string;
  user_id: string;
  amount: number;
  paid_at: string;
  method: string;
  notes: string;
  profile?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

interface SummaryStats {
  totalEarned: number;
  totalPaid: number;
  pendingPayouts: number;
  thisMonthEarnings: number;
}

export default function AdminReferralPayoutDashboard() {
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const { toast } = useToast();
  
  const [earnings, setEarnings] = useState<ReferralEarning[]>([]);
  const [payouts, setPayouts] = useState<PayoutRecord[]>([]);
  const [stats, setStats] = useState<SummaryStats>({
    totalEarned: 0,
    totalPaid: 0,
    pendingPayouts: 0,
    thisMonthEarnings: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedEarnings, setSelectedEarnings] = useState<string[]>([]);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [generationFilter, setGenerationFilter] = useState('all');
  const [dateRange, setDateRange] = useState<{from?: Date; to?: Date}>({});
  
  // Manual payout form
  const [manualPayoutForm, setManualPayoutForm] = useState({
    user_id: '',
    amount: '',
    method: '',
    notes: ''
  });
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);

  useEffect(() => {
    if (user && isAdmin) {
      fetchEarnings();
      fetchPayouts();
      fetchStats();
      fetchAvailableUsers();
    }
  }, [user, isAdmin, statusFilter, generationFilter, dateRange]);

  const fetchEarnings = async () => {
    try {
      let query = supabase
        .from('referral_earnings')
        .select(`
          id,
          user_id,
          referred_user_id,
          generation,
          amount,
          status,
          earned_at
        `)
        .order('earned_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (generationFilter !== 'all') {
        query = query.eq('generation', parseInt(generationFilter));
      }

      if (dateRange.from) {
        query = query.gte('earned_at', dateRange.from.toISOString());
      }

      if (dateRange.to) {
        query = query.lte('earned_at', dateRange.to.toISOString());
      }

      const { data: earningsData, error } = await query;

      if (error) throw error;

      // Fetch profile data separately
      const userIds = [...new Set([
        ...(earningsData?.map(e => e.user_id) || []),
        ...(earningsData?.map(e => e.referred_user_id) || [])
      ])];

      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email')
        .in('id', userIds);

      const profileMap = new Map();
      profilesData?.forEach(profile => {
        profileMap.set(profile.id, profile);
      });

      const enrichedEarnings = earningsData?.map(earning => ({
        ...earning,
        status: earning.status as 'pending' | 'paid',
        referrer_profile: profileMap.get(earning.user_id),
        referred_profile: profileMap.get(earning.referred_user_id)
      })) || [];

      setEarnings(enrichedEarnings);
    } catch (error) {
      console.error('Error fetching earnings:', error);
      toast({
        title: "Error",
        description: "Failed to load referral earnings",
        variant: "destructive"
      });
    }
  };

  const fetchPayouts = async () => {
    try {
      const { data: payoutData, error } = await supabase
        .from('payouts')
        .select(`
          id,
          user_id,
          amount,
          paid_at,
          method,
          notes
        `)
        .order('paid_at', { ascending: false });

      if (error) throw error;

      // Fetch profile data separately
      const userIds = [...new Set(payoutData?.map(p => p.user_id) || [])];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email')
        .in('id', userIds);

      const profileMap = new Map();
      profilesData?.forEach(profile => {
        profileMap.set(profile.id, profile);
      });

      const enrichedPayouts = payoutData?.map(payout => ({
        ...payout,
        profile: profileMap.get(payout.user_id)
      })) || [];

      setPayouts(enrichedPayouts);
    } catch (error) {
      console.error('Error fetching payouts:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const { data: earningsData, error: earningsError } = await supabase
        .from('referral_earnings')
        .select('amount, status, earned_at');

      if (earningsError) throw earningsError;

      const { data: payoutsData, error: payoutsError } = await supabase
        .from('payouts')
        .select('amount');

      if (payoutsError) throw payoutsError;

      const thisMonth = startOfMonth(new Date());
      const nextMonth = endOfMonth(new Date());

      const totalEarned = earningsData?.reduce((sum, earning) => sum + Number(earning.amount), 0) || 0;
      const pendingPayouts = earningsData?.filter(e => e.status === 'pending').reduce((sum, earning) => sum + Number(earning.amount), 0) || 0;
      const totalPaid = payoutsData?.reduce((sum, payout) => sum + Number(payout.amount), 0) || 0;
      const thisMonthEarnings = earningsData?.filter(e => {
        const earnedDate = new Date(e.earned_at);
        return earnedDate >= thisMonth && earnedDate <= nextMonth;
      }).reduce((sum, earning) => sum + Number(earning.amount), 0) || 0;

      setStats({
        totalEarned,
        totalPaid,
        pendingPayouts,
        thisMonthEarnings
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email')
        .order('first_name');

      if (error) throw error;
      setAvailableUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const markEarningsAsPaid = async (earningIds: string[]) => {
    try {
      // Use the new secure bulk update function
      const { error } = await supabase.rpc('mark_referral_earnings_as_paid', {
        earnings_ids: earningIds,
        payout_method: 'Admin bulk update'
      });

      if (error) throw error;

      toast({
        title: "✅ Marked as Paid",
        description: `Successfully marked ${earningIds.length} earnings as paid and recorded in payout history`
      });

      setSelectedEarnings([]);
      fetchEarnings();
      fetchStats();
      fetchPayouts(); // Refresh payouts to show new records
    } catch (error) {
      console.error('Error marking as paid:', error);
      toast({
        title: "Error",
        description: "Failed to mark earnings as paid",
        variant: "destructive"
      });
    }
  };

  const recordManualPayout = async () => {
    try {
      const { error } = await supabase
        .from('payouts')
        .insert({
          user_id: manualPayoutForm.user_id,
          amount: parseFloat(manualPayoutForm.amount),
          method: manualPayoutForm.method,
          notes: manualPayoutForm.notes
        });

      if (error) throw error;

      toast({
        title: "Payout Recorded",
        description: "Manual payout has been recorded successfully"
      });

      setManualPayoutForm({ user_id: '', amount: '', method: '', notes: '' });
      fetchPayouts();
      fetchStats();
    } catch (error) {
      console.error('Error recording payout:', error);
      toast({
        title: "Error",
        description: "Failed to record manual payout",
        variant: "destructive"
      });
    }
  };

  const exportToCSV = () => {
    const csvData = earnings.map(earning => ({
      'Referrer Name': earning.referrer_profile ? 
        `${earning.referrer_profile.first_name} ${earning.referrer_profile.last_name}` : 'Unknown',
      'Referrer Email': earning.referrer_profile?.email || 'Unknown',
      'Referred User': earning.referred_profile ? 
        `${earning.referred_profile.first_name} ${earning.referred_profile.last_name}` : 'Unknown',
      'Referred Email': earning.referred_profile?.email || 'Unknown',
      'Generation': earning.generation === 1 ? '1st' : '2nd',
      'Amount': `£${earning.amount.toFixed(2)}`,
      'Status': earning.status,
      'Earned Date': format(new Date(earning.earned_at), 'yyyy-MM-dd HH:mm:ss')
    }));

    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `referral-earnings-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (adminLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Checking admin access...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="text-destructive">Access Denied</CardTitle>
            <CardDescription>You don't have permission to access this admin dashboard.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-64"></div>
            <div className="grid grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-muted rounded-lg"></div>
              ))}
            </div>
            <div className="h-96 bg-muted rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Referral Payout Dashboard</h1>
            <p className="text-muted-foreground">Manage referral earnings and payouts</p>
          </div>
          <Button onClick={exportToCSV} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-primary/20 bg-gradient-to-br from-background to-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Earned</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <DollarSign className="h-6 w-6 text-primary" />
                <span className="text-2xl font-bold text-primary">£{stats.totalEarned.toFixed(2)}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">All-time referral earnings</p>
            </CardContent>
          </Card>

          <Card className="border-primary/20 bg-gradient-to-br from-background to-success/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Paid</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-6 w-6 text-success" />
                <span className="text-2xl font-bold text-success">£{stats.totalPaid.toFixed(2)}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Successfully paid out</p>
            </CardContent>
          </Card>

          <Card className="border-primary/20 bg-gradient-to-br from-background to-warning/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending Payouts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Clock className="h-6 w-6 text-warning" />
                <span className="text-2xl font-bold text-warning">£{stats.pendingPayouts.toFixed(2)}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Awaiting payment</p>
            </CardContent>
          </Card>

          <Card className="border-primary/20 bg-gradient-to-br from-background to-accent/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">This Month</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-6 w-6 text-accent" />
                <span className="text-2xl font-bold text-accent">£{stats.thisMonthEarnings.toFixed(2)}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Current month earnings</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="earnings" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="earnings">Referral Earnings</TabsTrigger>
            <TabsTrigger value="payouts">Payout History</TabsTrigger>
          </TabsList>

          <TabsContent value="earnings" className="space-y-4">
            {/* Filters */}
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Filter className="h-5 w-5" />
                  Filters
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4">
                  <div className="flex-1 min-w-48">
                    <Label>Status</Label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex-1 min-w-48">
                    <Label>Generation</Label>
                    <Select value={generationFilter} onValueChange={setGenerationFilter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Generations</SelectItem>
                        <SelectItem value="1">1st Generation</SelectItem>
                        <SelectItem value="2">2nd Generation</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setDateRange({ 
                        from: subMonths(new Date(), 1), 
                        to: new Date() 
                      })}
                      size="sm"
                    >
                      Last 30 Days
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setDateRange({ 
                        from: startOfMonth(new Date()), 
                        to: endOfMonth(new Date()) 
                      })}
                      size="sm"
                    >
                      This Month
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setDateRange({})}
                      size="sm"
                    >
                      Clear
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bulk Actions */}
            {selectedEarnings.length > 0 && (
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <p className="text-sm">
                      {selectedEarnings.length} earning{selectedEarnings.length !== 1 ? 's' : ''} selected
                    </p>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Mark Selected as Paid
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirm Payment</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to mark {selectedEarnings.length} earning{selectedEarnings.length !== 1 ? 's' : ''} as paid?
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => markEarningsAsPaid(selectedEarnings)}>
                            Confirm Payment
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Earnings Table */}
            <Card className="border-primary/20">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={selectedEarnings.length === earnings.length && earnings.length > 0}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedEarnings(earnings.map(e => e.id));
                              } else {
                                setSelectedEarnings([]);
                              }
                            }}
                          />
                        </TableHead>
                        <TableHead>Referrer</TableHead>
                        <TableHead>Referred User</TableHead>
                        <TableHead>Generation</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Earned Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {earnings.length > 0 ? (
                        earnings.map((earning) => (
                          <TableRow 
                            key={earning.id}
                            className={cn(
                              "hover:bg-muted/50",
                              earning.amount >= 10 && "bg-primary/5"
                            )}
                          >
                            <TableCell>
                              <Checkbox
                                checked={selectedEarnings.includes(earning.id)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedEarnings([...selectedEarnings, earning.id]);
                                  } else {
                                    setSelectedEarnings(selectedEarnings.filter(id => id !== earning.id));
                                  }
                                }}
                              />
                            </TableCell>
                            <TableCell className="font-medium">
                              <div>
                                <div className="font-semibold">
                                  {earning.referrer_profile ? 
                                    `${earning.referrer_profile.first_name} ${earning.referrer_profile.last_name}` : 
                                    'Unknown User'
                                  }
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {earning.referrer_profile?.email}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-semibold">
                                  {earning.referred_profile ? 
                                    `${earning.referred_profile.first_name} ${earning.referred_profile.last_name}` : 
                                    'Unknown User'
                                  }
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {earning.referred_profile?.email}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {earning.generation === 1 ? '1st' : '2nd'} Gen
                              </Badge>
                            </TableCell>
                            <TableCell className={cn(
                              "font-bold",
                              earning.amount >= 10 && "text-primary"
                            )}>
                              £{earning.amount.toFixed(2)}
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant={earning.status === 'paid' ? 'default' : 'secondary'}
                                className={cn(
                                  earning.status === 'paid' && "bg-success text-success-foreground",
                                  earning.status === 'pending' && "bg-warning text-warning-foreground"
                                )}
                              >
                                {earning.status === 'paid' ? 'Paid' : 'Pending'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {format(new Date(earning.earned_at), 'dd/MM/yyyy HH:mm')}
                            </TableCell>
                            <TableCell>
                              {earning.status === 'pending' && (
                                <Button
                                  size="sm"
                                  onClick={() => markEarningsAsPaid([earning.id])}
                                >
                                  Mark Paid
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                            No referral earnings found matching your filters.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payouts" className="space-y-4">
            {/* Manual Payout Form */}
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Record Manual Payout
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Referrer</Label>
                    <Select 
                      value={manualPayoutForm.user_id} 
                      onValueChange={(value) => setManualPayoutForm({...manualPayoutForm, user_id: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select referrer" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableUsers.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.first_name} {user.last_name} ({user.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Amount (£)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={manualPayoutForm.amount}
                      onChange={(e) => setManualPayoutForm({...manualPayoutForm, amount: e.target.value})}
                      placeholder="0.00"
                    />
                  </div>
                  
                  <div>
                    <Label>Payment Method</Label>
                    <Select 
                      value={manualPayoutForm.method} 
                      onValueChange={(value) => setManualPayoutForm({...manualPayoutForm, method: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="stripe">Stripe</SelectItem>
                        <SelectItem value="paypal">PayPal</SelectItem>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Notes</Label>
                    <Textarea
                      value={manualPayoutForm.notes}
                      onChange={(e) => setManualPayoutForm({...manualPayoutForm, notes: e.target.value})}
                      placeholder="Optional notes..."
                      className="min-h-[80px]"
                    />
                  </div>
                </div>
                
                <div className="mt-4">
                  <Button 
                    onClick={recordManualPayout}
                    disabled={!manualPayoutForm.user_id || !manualPayoutForm.amount || !manualPayoutForm.method}
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Record Payout
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Payout History Table */}
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle>Payout History</CardTitle>
                <CardDescription>All recorded payouts to referrers</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Referrer</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Paid Date</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payouts.length > 0 ? (
                        payouts.map((payout) => (
                          <TableRow key={payout.id}>
                            <TableCell className="font-medium">
                              <div>
                                <div className="font-semibold">
                                  {payout.profile ? 
                                    `${payout.profile.first_name} ${payout.profile.last_name}` : 
                                    'Unknown User'
                                  }
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {payout.profile?.email}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="font-bold text-success">
                              £{payout.amount.toFixed(2)}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {payout.method.replace('_', ' ').toUpperCase()}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {format(new Date(payout.paid_at), 'dd/MM/yyyy HH:mm')}
                            </TableCell>
                            <TableCell className="max-w-xs truncate">
                              {payout.notes || '-'}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            No payouts recorded yet.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}