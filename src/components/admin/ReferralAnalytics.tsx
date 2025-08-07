import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Users, DollarSign, TrendingUp, Award, Plus } from 'lucide-react';
import { useTranslation, getLocaleForLanguage } from '@/contexts/TranslationContext';

interface ReferralAnalytics {
  totalReferrals: number;
  totalPaid: number;
  monthlyStats: any;
}

export const ReferralAnalytics = () => {
  const { toast } = useToast();
  // Get the current language and resolve a suitable locale for date formatting.
  const { currentLanguage } = useTranslation();
  const locale = getLocaleForLanguage(currentLanguage);
  const [analytics, setAnalytics] = useState<ReferralAnalytics>({
    totalReferrals: 0,
    totalPaid: 0,
    monthlyStats: {}
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      // For now, use placeholder data until the referral system is fully implemented
      setAnalytics({
        totalReferrals: 0,
        totalPaid: 0,
        monthlyStats: {
          paid: 0,
          // Use the resolved locale so the month label reflects the selected language
          month: new Date().toLocaleDateString(locale, { month: 'long', year: 'numeric' })
        }
      });

    } catch (error) {
      console.error('Error fetching referral analytics:', error);
      toast({
        title: "Error",
        description: "Failed to load referral analytics",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded-lg"></div>
            ))}
          </div>
          <div className="h-64 bg-muted rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Referrals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-8 w-8 text-primary" />
              <span className="text-3xl font-bold text-primary">{analytics.totalReferrals}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="h-8 w-8 text-success" />
              <span className="text-3xl font-bold text-success">£{analytics.totalPaid.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-8 w-8 text-accent" />
              <span className="text-3xl font-bold text-accent">£{analytics.monthlyStats.paid?.toFixed(2) || '0.00'}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">{analytics.monthlyStats.month}</p>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Referrers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Award className="h-8 w-8 text-warning" />
              <span className="text-3xl font-bold text-warning">0</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Implementation Notice */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle>Referral Analytics - Implementation in Progress</CardTitle>
          <CardDescription>Complete referral system being built</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="mb-6">
              <Award className="h-16 w-16 text-primary mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-semibold text-primary mb-2">Referral System Setup</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                The complete referral analytics dashboard is being implemented. 
                This will include top referrers, commission tracking, and detailed analytics.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
              <div className="p-4 border border-primary/20 rounded-lg">
                <Users className="h-8 w-8 text-primary mx-auto mb-2" />
                <h4 className="font-semibold text-sm">Top Referrers</h4>
                <p className="text-xs text-muted-foreground">Track highest earning users</p>
              </div>
              <div className="p-4 border border-primary/20 rounded-lg">
                <DollarSign className="h-8 w-8 text-primary mx-auto mb-2" />
                <h4 className="font-semibold text-sm">Commission Tracking</h4>
                <p className="text-xs text-muted-foreground">Monitor all referral payments</p>
              </div>
              <div className="p-4 border border-primary/20 rounded-lg">
                <TrendingUp className="h-8 w-8 text-primary mx-auto mb-2" />
                <h4 className="font-semibold text-sm">Analytics</h4>
                <p className="text-xs text-muted-foreground">Detailed performance insights</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};