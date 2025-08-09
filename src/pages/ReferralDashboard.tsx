import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Copy, Users, DollarSign, TrendingUp, Eye, Share2, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ReferralTestingPanel } from '@/components/referrals/ReferralTestingPanel';
import { addWWWToReferralLink } from '@/lib/utils';

interface ReferralStats {
  totalReferrals: number;
  activeReferrals: number;
  inactiveReferrals: number;
  totalEarned: number;
  paidEarnings: number;
  pendingPayout: number;
  monthlyEarnings: Array<{
    month: string;
    paid: number;
    pending: number;
  }>;
  referralActivity: Array<{
    id: string;
    name: string;
    joinedDate: string;
    status: 'active' | 'inactive';
    generation: '1st' | '2nd';
    monthlyEarned: number;
  }>;
}

interface EarningsDetail {
  id: string;
  date: string;
  amount: number;
  generation: '1st' | '2nd';
  status: 'paid' | 'pending';
  referredUser: string;
}

export default function ReferralDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState<ReferralStats>({
    totalReferrals: 0,
    activeReferrals: 0,
    inactiveReferrals: 0,
    totalEarned: 0,
    paidEarnings: 0,
    pendingPayout: 0,
    monthlyEarnings: [],
    referralActivity: []
  });
  const [earningsDetails, setEarningsDetails] = useState<EarningsDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [referralCode, setReferralCode] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [selectedGeneration, setSelectedGeneration] = useState('all');

  useEffect(() => {
    if (user) {
      generateReferralCode();
      fetchReferralStats();
    }
  }, [user]);

  const generateReferralCode = () => {
    if (!user) return;
    const code = `ZAMAR_${user.id.slice(-8).toUpperCase()}`;
    setReferralCode(code);
  };

  const fetchReferralStats = async () => {
    if (!user) return;

    try {
      // Fetch user's referral statistics
      const { data: statsData, error: statsError } = await supabase
        .rpc('get_user_referral_stats', { target_user_id: user.id });
      
      let userStats: any = undefined;
      if (!statsError && statsData?.[0]) {
        userStats = statsData[0];
      }

      // Fetch referral activity with user details
      const { data: referralsData, error: referralsError } = await supabase
        .from('referrals')
        .select(`
          id,
          referred_user_id,
          generation,
          referred_at
        `)
        .eq('referrer_id', user.id);

      if (referralsError) throw referralsError;

      // Fetch profile details for referred users
      const referredUserIds = referralsData?.map(r => r.referred_user_id) || [];
      let profilesData: any[] = [];
      
      if (referredUserIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .in('id', referredUserIds);
        profilesData = profiles || [];
      }

      // Fetch detailed earnings
      const { data: earningsData, error: earningsError } = await supabase
        .from('referral_earnings')
        .select(`
          id,
          amount,
          generation,
          status,
          earned_at,
          referred_user_id
        `)
        .eq('user_id', user.id)
        .order('earned_at', { ascending: false });

      if (earningsError) throw earningsError;

      // Fallback: if RPC failed, compute stats locally from fetched tables
      if (!userStats) {
        const direct = (referralsData || []).filter((r: any) => r.generation === 1).length || 0;
        const indirect = (referralsData || []).filter((r: any) => r.generation === 2).length || 0;
        let totalEarned = 0, paid = 0, pending = 0;
        (earningsData || []).forEach((e: any) => {
          const amt = Number(e.amount) || 0;
          totalEarned += amt;
          if (e.status === 'paid') paid += amt; else pending += amt;
        });
        userStats = {
          total_referrals: direct + indirect,
          active_referrals: direct,
          inactive_referrals: indirect,
          total_earned: totalEarned,
          paid_earnings: paid,
          pending_earnings: pending
        };
      }

      // Process monthly earnings data
      const monthlyEarningsMap = new Map();
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      // Initialize all months
      months.forEach(month => {
        monthlyEarningsMap.set(month, { month, paid: 0, pending: 0 });
      });

      // Populate with actual data
      earningsData?.forEach(earning => {
        const date = new Date(earning.earned_at);
        const monthIndex = date.getMonth();
        const monthKey = months[monthIndex];
        const current = monthlyEarningsMap.get(monthKey);
        
        if (earning.status === 'paid') {
          current.paid += Number(earning.amount);
        } else {
          current.pending += Number(earning.amount);
        }
        monthlyEarningsMap.set(monthKey, current);
      });

      // Create a profile lookup map
      const profileMap = new Map();
      profilesData.forEach(profile => {
        profileMap.set(profile.id, profile);
      });

      // Convert referrals data to activity format
      const referralActivity = referralsData?.map(referral => {
        const profile = profileMap.get(referral.referred_user_id);
        const name = profile ? 
          `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Unknown User' :
          'Unknown User';
        
        return {
          id: referral.id,
          name,
          joinedDate: referral.referred_at,
          status: 'active' as const, // You might want to determine this based on recent activity
          generation: referral.generation === 1 ? '1st' as const : '2nd' as const,
          monthlyEarned: 0 // Calculate based on current month earnings if needed
        };
      }) || [];

      // Convert earnings data to details format
      const earningsDetails: EarningsDetail[] = earningsData?.map(earning => {
        const profile = profileMap.get(earning.referred_user_id);
        const referredUser = profile ? 
          `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Unknown User' :
          'Unknown User';
        
        return {
          id: earning.id,
          date: earning.earned_at,
          amount: Number(earning.amount),
          generation: earning.generation === 1 ? '1st' as const : '2nd' as const,
          status: earning.status as 'paid' | 'pending',
          referredUser
        };
      }) || [];

      const finalStats: ReferralStats = {
        totalReferrals: Number(userStats.total_referrals),
        activeReferrals: Number(userStats.active_referrals),
        inactiveReferrals: Number(userStats.inactive_referrals),
        totalEarned: Number(userStats.total_earned),
        paidEarnings: Number(userStats.paid_earnings),
        pendingPayout: Number(userStats.pending_earnings),
        monthlyEarnings: Array.from(monthlyEarningsMap.values()),
        referralActivity
      };

      setStats(finalStats);
      setEarningsDetails(earningsDetails);
    } catch (error) {
      console.error('Error fetching referral stats:', error);
      toast({
        title: "Error",
        description: "Failed to load referral data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const copyReferralLink = () => {
    const referralLink = addWWWToReferralLink(`https://zamarsongs.com/auth?ref=${referralCode}`);
    navigator.clipboard.writeText(referralLink);
    toast({
      title: "Referral link copied!",
      description: "Share your link to start earning commissions"
    });
  };
  const filteredActivity = stats.referralActivity.filter(activity => {
    const monthMatch = selectedMonth === 'all' || new Date(activity.joinedDate).getMonth() + 1 === parseInt(selectedMonth);
    const generationMatch = selectedGeneration === 'all' || activity.generation === selectedGeneration;
    return monthMatch && generationMatch;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-64"></div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-muted rounded-lg"></div>
              ))}
            </div>
            <div className="h-64 bg-muted rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center md:text-left">
          <h1 className="text-3xl font-bold text-foreground mb-2">Referral Dashboard</h1>
          <p className="text-muted-foreground">Track your referrals and earnings</p>
        </div>

        {/* Section 1: Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-primary/20 bg-card/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Referred</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Users className="h-6 w-6 text-primary" />
                <span className="text-2xl font-bold text-primary">{stats.totalReferrals}</span>
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                {stats.activeReferrals} Active / {stats.inactiveReferrals} Inactive
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/20 bg-card/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Earned</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <DollarSign className="h-6 w-6 text-primary" />
                <span className="text-2xl font-bold text-primary">£{stats.totalEarned.toFixed(2)}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">All-time earnings</p>
            </CardContent>
          </Card>

          <Card className="border-primary/20 bg-card/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Paid Earnings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-6 w-6 text-success" />
                <span className="text-2xl font-bold text-success">£{stats.paidEarnings.toFixed(2)}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Successfully paid</p>
            </CardContent>
          </Card>

          <Card className="border-primary/20 bg-card/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending Payout</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Calendar className="h-6 w-6 text-warning" />
                <span className="text-2xl font-bold text-warning">£{stats.pendingPayout.toFixed(2)}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Awaiting payment</p>
            </CardContent>
          </Card>
        </div>

        {/* Section 2: Referral Code & Share */}
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <Share2 className="h-5 w-5" />
              Your Referral Code
            </CardTitle>
            <CardDescription>
              Share this link to earn commissions when supporters upgrade or purchase custom song through your referrals
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-4">{referralCode}</div>
              <div className="grid grid-cols-[1fr_auto] items-center gap-3 p-4 bg-muted/50 rounded-lg mb-4">
                <code className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-xs sm:text-sm font-mono">
                  https://www.zamarsongs.com/auth?ref={referralCode}
                </code>
                <Button onClick={copyReferralLink} size="sm" className="shrink-0">
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 3: Monthly Earnings Chart */}
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle>Monthly Earnings</CardTitle>
            <CardDescription>Track your monthly referral earnings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.monthlyEarnings}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`£${value}`, '']} />
                  <Bar dataKey="paid" fill="hsl(var(--primary))" name="Paid" />
                  <Bar dataKey="pending" fill="hsl(var(--muted-foreground))" name="Pending" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Section 4: Referral Activity Table */}
        <Card className="border-primary/20">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle>Referral Activity</CardTitle>
                <CardDescription>Track your referrals and their activity</CardDescription>
              </div>
              <div className="flex gap-2">
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Month" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Months</SelectItem>
                    <SelectItem value="1">January</SelectItem>
                    <SelectItem value="2">February</SelectItem>
                    <SelectItem value="3">March</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={selectedGeneration} onValueChange={setSelectedGeneration}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Generation" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Gen</SelectItem>
                    <SelectItem value="1st">1st Gen</SelectItem>
                    <SelectItem value="2nd">2nd Gen</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Joined Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Generation</TableHead>
                    <TableHead>This Month's Earned</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredActivity.length > 0 ? (
                    filteredActivity.map((activity) => (
                      <TableRow 
                        key={activity.id}
                        className={activity.monthlyEarned > 0 ? 'bg-primary/5' : ''}
                      >
                        <TableCell className="font-medium">{activity.name}</TableCell>
                        <TableCell>{new Date(activity.joinedDate).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge variant={activity.status === 'active' ? 'default' : 'secondary'}>
                            {activity.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{activity.generation}</Badge>
                        </TableCell>
                        <TableCell className={activity.monthlyEarned > 0 ? 'text-primary font-bold' : ''}>
                          £{activity.monthlyEarned.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No referrals yet. Share your link to start earning!
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Section 5: Earnings Breakdown Modal */}
        <Card className="border-primary/20">
          <CardContent className="pt-6">
            <div className="text-center">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full md:w-auto">
                    <Eye className="h-4 w-4 mr-2" />
                    View All Earnings
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Complete Earnings History</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Generation</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Referred User</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {earningsDetails.length > 0 ? (
                          earningsDetails.map((earning) => (
                            <TableRow key={earning.id}>
                              <TableCell>{new Date(earning.date).toLocaleDateString()}</TableCell>
                              <TableCell className="font-bold">£{earning.amount.toFixed(2)}</TableCell>
                              <TableCell>
                                <Badge variant="outline">{earning.generation}</Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant={earning.status === 'paid' ? 'default' : 'secondary'}>
                                  {earning.status}
                                </Badge>
                              </TableCell>
                              <TableCell>{earning.referredUser}</TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                              No earnings yet. Share your referral link to start earning!
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        {/* Testing Panel */}
        <ReferralTestingPanel />

        {/* Status Notice */}
        <Card className="border-primary/20 bg-muted/20">
          <CardHeader>
            <CardTitle>Referral System - Now Live with Auto-Processing!</CardTitle>
            <CardDescription>Your referral tracking and earnings are now fully automated</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4 text-muted-foreground">
              <p className="mb-2">✅ Automatic earnings on donations ≥ £25</p>
              <p className="mb-2">✅ Database triggers for real-time processing</p>
              <p className="text-sm">Earn 15% on 1st generation and 10% on 2nd generation referrals.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}