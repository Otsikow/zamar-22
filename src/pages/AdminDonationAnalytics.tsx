
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { DollarSign, TrendingUp, Users, Calendar, Plus, Search } from 'lucide-react';
import { useTranslation, getLocaleForLanguage } from '@/contexts/TranslationContext';

interface DonationData {
  id: string;
  amount: number;
  donor_name: string;
  donor_email: string;
  campaign: string;
  type: string;
  status: string;
  created_at: string;
}

interface DonationStats {
  total_donations: number;
  monthly_donors: number;
  one_time_donations: number;
  total_amount: number;
}

interface CampaignStats {
  campaign_name: string;
  total_amount: number;
  donation_count: number;
}

export default function AdminDonationAnalytics() {
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const { toast } = useToast();
  // Retrieve current language for dynamic date formatting
  const { currentLanguage } = useTranslation();
  const locale = getLocaleForLanguage(currentLanguage);
  
  const [donations, setDonations] = useState<DonationData[]>([]);
  const [stats, setStats] = useState<DonationStats | null>(null);
  const [campaignStats, setCampaignStats] = useState<CampaignStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  useEffect(() => {
    if (isAdmin && !adminLoading) {
      fetchDonationData();
    }
  }, [isAdmin, adminLoading]);

  const fetchDonationData = async () => {
    try {
      console.log('🔐 Fetching donation data with admin privileges');
      
      // Fetch donation statistics using existing secure RPC function
      const { data: statsData, error: statsError } = await supabase.rpc('get_donation_stats');
      if (statsError) {
        console.error('Error fetching donation stats:', statsError);
        throw statsError;
      }
      
      // Fetch campaign statistics using existing secure RPC function
      const { data: campaignData, error: campaignError } = await supabase.rpc('get_donations_by_campaign');
      if (campaignError) {
        console.error('Error fetching campaign stats:', campaignError);
        throw campaignError;
      }
      
      // Fetch recent donations using existing secure RPC function
      const { data: recentData, error: recentError } = await supabase.rpc('get_recent_donations', { limit_count: 100 });
      if (recentError) {
        console.error('Error fetching recent donations:', recentError);
        throw recentError;
      }
      
      // Transform the data to match our interface
      const transformedDonations: DonationData[] = (recentData || []).map(donation => ({
        id: donation.id,
        amount: Number(donation.amount),
        donor_name: donation.donor_name || 'Anonymous',
        donor_email: donation.donor_email || '',
        campaign: donation.campaign || 'General Fund',
        type: donation.type,
        status: 'completed', // From RPC function, these are already completed
        created_at: donation.created_at
      }));
      
      setStats(statsData?.[0] || { total_donations: 0, monthly_donors: 0, one_time_donations: 0, total_amount: 0 });
      setCampaignStats(campaignData || []);
      setDonations(transformedDonations);
      
      console.log('✅ Successfully fetched donation data:', { 
        stats: statsData?.[0], 
        campaigns: campaignData?.length,
        donations: transformedDonations.length 
      });
      
    } catch (error) {
      console.error('❌ Error fetching donation data:', error);
      toast({
        title: "Error",
        description: "Failed to load donation analytics. Please check your admin permissions.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredDonations = donations.filter(donation => {
    const matchesSearch = searchTerm === '' || 
      donation.donor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      donation.donor_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      donation.campaign.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || donation.status === statusFilter;
    const matchesType = typeFilter === 'all' || donation.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  if (adminLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-destructive mb-2">Access Denied</h2>
              <p className="text-muted-foreground">You don't have permission to view donation analytics.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-primary">Donation Analytics</h1>
          <p className="text-muted-foreground">Monitor and analyze donation data</p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Donations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="h-8 w-8 text-primary" />
              <span className="text-3xl font-bold text-primary">£{stats?.total_amount?.toFixed(2) || '0.00'}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Count</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-8 w-8 text-success" />
              <span className="text-3xl font-bold text-success">{stats?.total_donations || 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Donors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-8 w-8 text-accent" />
              <span className="text-3xl font-bold text-accent">{stats?.monthly_donors || 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">One-Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Calendar className="h-8 w-8 text-warning" />
              <span className="text-3xl font-bold text-warning">{stats?.one_time_donations || 0}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaign Performance */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle>Campaign Performance</CardTitle>
          <CardDescription>Donation amounts by campaign</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {campaignStats.map((campaign, index) => (
              <div key={campaign.campaign_name} className="flex items-center justify-between p-3 border border-border rounded-lg">
                <div>
                  <p className="font-medium text-foreground">{campaign.campaign_name}</p>
                  <p className="text-sm text-muted-foreground">{campaign.donation_count} donations</p>
                </div>
                <Badge variant="outline" className="text-primary">
                  £{Number(campaign.total_amount).toFixed(2)}
                </Badge>
              </div>
            ))}
            {campaignStats.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No campaign data available</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Filters and Search */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle>Recent Donations</CardTitle>
          <CardDescription>Latest donation records</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by name, email, or campaign..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="type">Type</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="one-time">One-time</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Donations Table */}
          <div className="border border-border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Donor</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Amount</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Campaign</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Type</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDonations.map((donation, index) => (
                    <tr key={donation.id} className={index % 2 === 0 ? 'bg-background' : 'bg-muted/25'}>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-foreground">{donation.donor_name}</p>
                          <p className="text-sm text-muted-foreground">{donation.donor_email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="text-primary">
                          £{donation.amount.toFixed(2)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-foreground">{donation.campaign}</td>
                      <td className="px-4 py-3">
                        <Badge variant={donation.type === 'monthly' ? 'default' : 'secondary'}>
                          {donation.type}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {new Date(donation.created_at).toLocaleDateString(locale, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {filteredDonations.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No donations found matching your criteria</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
