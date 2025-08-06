import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Copy, Users, DollarSign, TrendingUp, ExternalLink } from 'lucide-react';
import SocialShare from '@/components/ui/social-share';

interface ReferralData {
  referralCode: string;
  directReferrals: number;
  indirectReferrals: number;
  totalEarnings: number;
}

export const ReferralDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [data, setData] = useState<ReferralData>({
    referralCode: '',
    directReferrals: 0,
    indirectReferrals: 0,
    totalEarnings: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      generateReferralCode();
    }
  }, [user]);

  const generateReferralCode = async () => {
    if (!user) return;

    try {
      // Create a simple referral code from user ID
      const referralCode = user.id.slice(-8).toUpperCase();
      
      setData({
        referralCode,
        directReferrals: 0,
        indirectReferrals: 0,
        totalEarnings: 0
      });

    } catch (error) {
      console.error('Error generating referral code:', error);
      toast({
        title: "Error",
        description: "Failed to generate referral code",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const copyReferralLink = () => {
    const referralLink = `https://zamarsongs.com/auth?ref=${data.referralCode}`;
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

  return (
    <div className="space-y-6">
      {/* Referral Link Section */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <ExternalLink className="h-5 w-5" />
            Your Referral Link
          </CardTitle>
          <CardDescription>
            Share this link to earn commissions when supporters upgrade or purchase custom song through your referrals
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
            <code className="flex-1 text-sm font-mono">
              https://zamarsongs.com/auth?ref={data.referralCode}
            </code>
            <Button onClick={copyReferralLink} size="sm">
              <Copy className="h-4 w-4 mr-2" />
              Copy
            </Button>
          </div>
          <div className="mt-4 flex justify-center">
            <SocialShare
              title="Join Zamar - Create Your Custom Songs"
              description="Check out this amazing platform for creating custom songs with faith and purpose. Use my referral link to get started!"
              url={`https://zamarsongs.com/auth?ref=${data.referralCode}`}
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Direct Referrals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-8 w-8 text-primary" />
              <span className="text-3xl font-bold text-primary">{data.directReferrals}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Level 1 referrals</p>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Indirect Referrals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-8 w-8 text-accent" />
              <span className="text-3xl font-bold text-foreground">{data.indirectReferrals}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Level 2 referrals</p>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Earnings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="h-8 w-8 text-success" />
              <span className="text-3xl font-bold text-success">£{data.totalEarnings.toFixed(2)}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">All-time commissions</p>
          </CardContent>
        </Card>
      </div>

      {/* Coming Soon Notice */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle>Referral System - Coming Soon!</CardTitle>
          <CardDescription>The full referral tracking system is being implemented</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p className="mb-4">Your referral link is ready, but tracking and rewards are currently being set up.</p>
            <p className="text-sm">Once complete, you'll see your referrals and earnings here!</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};