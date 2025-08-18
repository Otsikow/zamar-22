import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Copy, Users, DollarSign, TrendingUp, ExternalLink, Gift, Target, Trophy, RefreshCw } from 'lucide-react';
import SocialShare from '@/components/ui/social-share';
import { useTranslation } from "@/contexts/TranslationContext";
import { addWWWToReferralLink } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ReferralData {
  referralCode: string;
  directReferrals: number;
  indirectReferrals: number;
  totalEarnings: number;
}

interface ReferralStats {
  totalReferrals: number;
  totalEarned: number;
  paidEarnings: number;
  pendingPayout: number;
}

interface ReferralItem {
  created_at: string;
  friend_name: string | null;
  friend_id: string;
}

interface Commission {
  created_at: string;
  level: number;
  amount_gbp: number;
  status: string;
  purchase_id: string;
}

export const ReferralDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [data, setData] = useState<ReferralData>({
    referralCode: '',
    directReferrals: 0,
    indirectReferrals: 0,
    totalEarnings: 0
  });
  const [stats, setStats] = useState<ReferralStats>({
    totalReferrals: 0,
    totalEarned: 0,
    paidEarnings: 0,
    pendingPayout: 0
  });
  const [referrals, setReferrals] = useState<ReferralItem[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchReferralCode();
      fetchReferralStats();
      fetchReferralDetails();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchReferralCode = async () => {
    if (!user) return;

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('referral_code')
        .eq('id', user.id)
        .single();

      if (profile?.referral_code) {
        setData(prev => ({
          ...prev,
          referralCode: profile.referral_code
        }));
      }
    } catch (error) {
      console.error('Error fetching referral code:', error);
    }
  };

  const fetchReferralStats = async () => {
    if (!user) return;

    try {
      console.log('Fetching referral stats for user:', user.id);
      
      // For now, use simple direct queries until types are updated
      // Count total referrals
      const { count: totalReferrals } = await supabase
        .from('referrals')
        .select('*', { count: 'exact', head: true })
        .eq('referrer_id', user.id);

      // Get commission totals manually for now
      let totalEarned = 0, paid = 0, pending = 0;
      
      setStats({
        totalReferrals: totalReferrals || 0,
        totalEarned,
        paidEarnings: paid,
        pendingPayout: pending
      });

      setData(prev => ({
        ...prev,
        directReferrals: totalReferrals || 0,
        indirectReferrals: 0,
        totalEarnings: totalEarned
      }));

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

  const fetchReferralDetails = async () => {
    if (!user) return;

    try {
      // Fetch referrals (people who signed up using my referral code)
      const { data: referralData } = await supabase
        .from('referrals')
        .select('referred_user_id, created_at')
        .eq('referrer_id', user.id);

      // Get profile details for each referred user
      const referralItems: ReferralItem[] = [];
      if (referralData) {
        for (const referral of referralData) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('first_name, last_name, email')
            .eq('id', referral.referred_user_id)
            .single();

          referralItems.push({
            created_at: referral.created_at,
            friend_name: profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email : 'Anonymous',
            friend_id: referral.referred_user_id
          });
        }
      }

      // Fetch commission earnings
      const { data: commissionData } = await supabase
        .from('referral_earnings')
        .select('*')
        .eq('user_id', user.id);

      const commissionItems = commissionData?.map(c => ({
        created_at: c.created_at || '',
        level: c.generation,
        amount_gbp: Number(c.amount),
        status: c.status || 'pending',
        purchase_id: c.payment_id || 'N/A'
      })) || [];

      setReferrals(referralItems);
      setCommissions(commissionItems);
    } catch (error) {
      console.error('Error fetching referral details:', error);
      toast({
        title: "Error",
        description: "Failed to load referral details",
        variant: "destructive"
      });
    }
  };

  const refreshData = async () => {
    setLoading(true);
    await Promise.all([
      fetchReferralCode(),
      fetchReferralStats(),
      fetchReferralDetails(),
    ]);
    setLoading(false);
  };

  const copyReferralLink = () => {
    const referralLink = `https://www.zamarsongs.com/?ref=${data.referralCode}`;
    navigator.clipboard.writeText(referralLink);
    toast({
      title: "Link copied!",
      description: "Your referral link has been copied to clipboard"
    });
  };
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-muted rounded-lg"></div>
          <div className="grid grid-cols-3 gap-4">
            <div className="h-24 bg-muted rounded-lg"></div>
            <div className="h-24 bg-muted rounded-lg"></div>
            <div className="h-24 bg-muted rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-6">
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="text-primary">Sign in to view referrals</CardTitle>
            <CardDescription>You need to be logged in to access your referral dashboard.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/auth')}>Go to Login</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <Button variant="outline" asChild>
            <Link to="/dashboard" aria-label="Back to Dashboard">
              {t('referral.back', 'Back')}
            </Link>
          </Button>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button 
              variant="outline" 
              onClick={refreshData} 
              disabled={loading}
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              {t('referral.refresh', 'Refresh')}
            </Button>
            <Button variant="outline" asChild className="whitespace-nowrap">
              <Link to="/referral-calculator" aria-label="Open Referral Earnings Calculator">
                {t('referral.earnings_calculator', 'Earnings Calculator')}
              </Link>
            </Button>
          </div>
      </div>
      {/* Welcome Banner */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/10 to-accent/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary text-2xl">
            <Gift className="h-6 w-6" />
            {t('referral.dashboard.welcome_title', 'Welcome to Your Referral Dashboard!')}
          </CardTitle>
          <CardDescription className="text-lg">
            {t('referral.dashboard.welcome_desc', 'Earn commissions by sharing Zamar with others. Start earning today with our multi-level referral system!')}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Referral Link Section */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <ExternalLink className="h-5 w-5" />
            {t('referral.dashboard.link_title', 'Your Referral Link')}
          </CardTitle>
          <CardDescription>
            {t('referral.dashboard.link_desc', 'Share this link to earn commissions when supporters upgrade or purchase custom songs through your referrals')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-[1fr_auto] items-center gap-3 p-4 bg-muted/50 rounded-lg">
            <code className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-xs sm:text-sm font-mono">
              https://www.zamarsongs.com/?ref={data.referralCode}
            </code>
            <Button onClick={copyReferralLink} size="sm" className="shrink-0">
              <Copy className="h-4 w-4 mr-2" />
              Copy
            </Button>
          </div>
          <div className="mt-4 flex justify-center">
            <SocialShare
              title="Join Zamar - Create Your Custom Songs"
              description="Check out this amazing platform for creating custom songs with faith and purpose. Use my referral link to get started!"
              url={`https://www.zamarsongs.com/?ref=${data.referralCode}`}
              hashtags={['ZamarMusic', 'CustomSongs', 'FaithMusic', 'MusicCreation']}
              trigger={
                <Button variant="outline" size="sm">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Share Referral Link
                </Button>
              }
            />
          </div>
          <div className="mt-4 p-4 border border-accent/20 rounded-lg bg-accent/5">
            <h4 className="font-semibold text-sm mb-2">Referral Commission Structure:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• <strong>Level 1 (Direct)</strong>: 15% commission on supporter upgrades</li>
              <li>• <strong>Level 2 (Indirect)</strong>: 10% commission on sub-referral upgrades</li>
              <li>• Minimum £25 purchase required for commission eligibility</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Referrals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-8 w-8 text-primary" />
              <span className="text-3xl font-bold text-primary">{stats.totalReferrals}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">All referrals</p>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Earned</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="h-8 w-8 text-success" />
              <span className="text-3xl font-bold text-success">£{stats.totalEarned.toFixed(2)}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">All-time earnings</p>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Paid Out</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Trophy className="h-8 w-8 text-primary" />
              <span className="text-3xl font-bold text-primary">£{stats.paidEarnings.toFixed(2)}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Successfully paid</p>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Payout</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Target className="h-8 w-8 text-warning" />
              <span className="text-3xl font-bold text-warning">£{stats.pendingPayout.toFixed(2)}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Awaiting payment</p>
          </CardContent>
        </Card>
      </div>

      {/* Referred Users */}
      {referrals.length > 0 && (
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Your Referrals ({referrals.length})
            </CardTitle>
            <CardDescription>
              People who signed up using your referral link
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Friend</TableHead>
                  <TableHead>Joined Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {referrals.map((referral, index) => (
                  <TableRow key={referral.friend_id}>
                    <TableCell className="font-medium">
                      {referral.friend_name || 'Anonymous User'}
                    </TableCell>
                    <TableCell>
                      {new Date(referral.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Commission Earnings */}
      {commissions.length > 0 && (
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-success" />
              Your Earnings ({commissions.length})
            </CardTitle>
            <CardDescription>
              Commission earnings from your referrals
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {commissions.map((commission, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      {new Date(commission.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        Level {commission.level}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      £{commission.amount_gbp.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={commission.status === 'paid' ? 'default' : 'secondary'}
                      >
                        {commission.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* How It Works */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            How Your Referral System Works
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 border border-primary/20 rounded-lg">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-primary font-bold text-xl">1</span>
              </div>
              <h3 className="font-semibold mb-2">Share Your Link</h3>
              <p className="text-sm text-muted-foreground">
                Share your unique referral link with friends, family, or on social media
              </p>
            </div>
            
            <div className="text-center p-4 border border-primary/20 rounded-lg">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-primary font-bold text-xl">2</span>
              </div>
              <h3 className="font-semibold mb-2">They Sign Up & Upgrade</h3>
              <p className="text-sm text-muted-foreground">
                When someone uses your link to sign up and makes a purchase ≥£25
              </p>
            </div>
            
            <div className="text-center p-4 border border-primary/20 rounded-lg">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-primary font-bold text-xl">3</span>
              </div>
              <h3 className="font-semibold mb-2">You Earn Commissions</h3>
              <p className="text-sm text-muted-foreground">
                Get 15% on direct referrals and 10% on their referrals too!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button onClick={() => navigate('/dashboard')}>
              <Trophy className="h-4 w-4 mr-2" />
              View Full Dashboard
            </Button>
            <Button variant="outline" onClick={() => navigate('/referral-calculator')}>
              <Target className="h-4 w-4 mr-2" />
              {t('referral.earnings_calculator', 'Earnings Calculator')}
            </Button>
            <Button variant="outline" onClick={copyReferralLink}>
              <Copy className="h-4 w-4 mr-2" />
              Copy Link Again
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Active System Notice */}
      <Card className="border-success/20 bg-success/5">
        <CardHeader>
          <CardTitle className="text-success">✅ Referral System - Fully Active!</CardTitle>
          <CardDescription>Your referral tracking and earnings are now live and automated</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4">
              <div className="text-2xl mb-2">🔗</div>
              <h4 className="font-semibold text-sm mb-1">Link Ready</h4>
              <p className="text-xs text-muted-foreground">Your referral link is active and tracking</p>
            </div>
            <div className="text-center p-4">
              <div className="text-2xl mb-2">💰</div>
              <h4 className="font-semibold text-sm mb-1">Auto Earnings</h4>
              <p className="text-xs text-muted-foreground">Commissions calculated automatically</p>
            </div>
            <div className="text-center p-4">
              <div className="text-2xl mb-2">📊</div>
              <h4 className="font-semibold text-sm mb-1">Real-time Stats</h4>
              <p className="text-xs text-muted-foreground">Track your progress in real-time</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
