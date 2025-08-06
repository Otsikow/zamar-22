
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  DollarSign, 
  Users, 
  TrendingUp, 
  Calendar,
  Download, 
  Plus,
  Heart,
  Target,
  Activity,
  Filter
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { Separator } from '@/components/ui/separator';

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

interface RecentDonation {
  id: string;
  amount: number;
  donor_name: string;
  donor_email: string;
  campaign: string;
  type: string;
  created_at: string;
}

interface Donation {
  id: string;
  user_id: string;
  amount: number;
  campaign: string;
  type: string;
  status: string;
  created_at: string;
  first_name?: string;
  last_name?: string;
  email?: string;
}

export default function AdminDonationAnalytics() {
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const { toast } = useToast();
  
  const [stats, setStats] = useState<DonationStats>({
    total_donations: 0,
    monthly_donors: 0,
    one_time_donations: 0,
    total_amount: 0
  });
  const [campaignStats, setCampaignStats] = useState<CampaignStats[]>([]);
  const [recentDonations, setRecentDonations] = useState<RecentDonation[]>([]);
  const [allDonations, setAllDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [campaignFilter, setCampaignFilter] = useState('all');
  const [dateRange, setDateRange] = useState<{from?: Date; to?: Date}>({});
  
  // Manual donation form
  const [manualDonationForm, setManualDonationForm] = useState({
    user_email: '',
    amount: '',
    campaign: '',
    type: 'one-time',
    notes: ''
  });
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);

  useEffect(() => {
    if (user && isAdmin) {
      fetchDonationStats();
      fetchCampaignStats();
      fetchRecentDonations();
      fetchAllDonations();
      fetchAvailableUsers();
    }
  }, [user, isAdmin, statusFilter, typeFilter, campaignFilter, dateRange]);

  const fetchDonationStats = async () => {
    try {
      const { data, error } = await supabase.rpc('get_donation_stats');
      if (error) throw error;
      
      if (data && data.length > 0) {
        setStats(data[0]);
      }
    } catch (error) {
      console.error('Error fetching donation stats:', error);
      toast({
        title: "Error",
        description: "Failed to load donation statistics",
        variant: "destructive"
      });
    }
  };

  const fetchCampaignStats = async () => {
    try {
      const { data, error } = await supabase.rpc('get_donations_by_campaign');
      if (error) throw error;
      setCampaignStats(data || []);
    } catch (error) {
      console.error('Error fetching campaign stats:', error);
    }
  };

  const fetchRecentDonations = async () => {
    try {
      const { data, error } = await supabase.rpc('get_recent_donations', { limit_count: 10 });
      if (error) throw error;
      setRecentDonations(data || []);
    } catch (error) {
      console.error('Error fetching recent donations:', error);
    }
  };

  const fetchAllDonations = async () => {
    try {
      let query = supabase
        .from('donation_analytics')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (typeFilter !== 'all') {
        query = query.eq('type', typeFilter);
      }

      if (campaignFilter !== 'all') {
        if (campaignFilter === 'general') {
          query = query.or('campaign.is.null,campaign.eq.General Fund');
        } else {
          query = query.eq('campaign', campaignFilter);
        }
      }

      if (dateRange.from) {
        query = query.gte('created_at', dateRange.from.toISOString());
      }

      if (dateRange.to) {
        query = query.lte('created_at', dateRange.to.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;
      
      setAllDonations(data || []);
    } catch (error) {
      console.error('Error fetching all donations:', error);
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

  const recordManualDonation = async () => {
    try {
      // Find user by email
      const user = availableUsers.find(u => u.email === manualDonationForm.user_email);
      if (!user) {
        toast({
          title: "Error",
          description: "User not found with that email",
          variant: "destructive"
        });
        return;
      }

      const { error } = await supabase
        .from('donations')
        .insert({
          user_id: user.id,
          amount: parseFloat(manualDonationForm.amount),
          campaign: manualDonationForm.campaign || null,
          type: manualDonationForm.type,
          status: 'completed'
        });

      if (error) throw error;

      toast({
        title: "Donation Recorded",
        description: "Manual donation has been recorded successfully"
      });

      setManualDonationForm({ user_email: '', amount: '', campaign: '', type: 'one-time', notes: '' });
      fetchDonationStats();
      fetchCampaignStats();
      fetchRecentDonations();
      fetchAllDonations();
    } catch (error) {
      console.error('Error recording donation:', error);
      toast({
        title: "Error",
        description: "Failed to record manual donation",
        variant: "destructive"
      });
    }
  };

  const exportToCSV = () => {
    const csvData = allDonations.map(donation => ({
      'Donor Name': donation.first_name && donation.last_name ? 
        `${donation.first_name} ${donation.last_name}` : 'Anonymous',
      'Email': donation.email || '',
      'Amount': `£${donation.amount.toFixed(2)}`,
      'Campaign': donation.campaign || 'General Fund',
      'Type': donation.type,
      'Status': donation.status,
      'Date': format(new Date(donation.created_at), 'yyyy-MM-dd HH:mm:ss')
    }));

    const csv = [
      Object.keys(csvData[0] || {}).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `donations-${format(new Date(), 'yyyy-MM-dd')}.csv`;
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
            <h1 className="text-3xl font-bold text-foreground">Donation Analytics</h1>
            <p className="text-muted-foreground">Manage and monitor all donations</p>
          </div>
          <div className="flex gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Record Donation
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Record Manual Donation</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>User Email</Label>
                    <Select 
                      value={manualDonationForm.user_email} 
                      onValueChange={(value) => setManualDonationForm({...manualDonationForm, user_email: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select user" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableUsers.map((user) => (
                          <SelectItem key={user.id} value={user.email}>
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
                      value={manualDonationForm.amount}
                      onChange={(e) => setManualDonationForm({...manualDonationForm, amount: e.target.value})}
                      placeholder="0.00"
                    />
                  </div>
                  
                  <div>
                    <Label>Campaign</Label>
                    <Input
                      value={manualDonationForm.campaign}
                      onChange={(e) => setManualDonationForm({...manualDonationForm, campaign: e.target.value})}
                      placeholder="General Fund"
                    />
                  </div>
                  
                  <div>
                    <Label>Type</Label>
                    <Select 
                      value={manualDonationForm.type} 
                      onValueChange={(value) => setManualDonationForm({...manualDonationForm, type: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="one-time">One-time</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Button 
                    onClick={recordManualDonation}
                    disabled={!manualDonationForm.user_email || !manualDonationForm.amount}
                    className="w-full"
                  >
                    Record Donation
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            
            <Button onClick={exportToCSV} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-primary/20 bg-gradient-to-br from-background to-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Donations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <DollarSign className="h-6 w-6 text-primary" />
                <span className="text-2xl font-bold text-primary">£{stats.total_donations.toFixed(2)}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">All completed donations</p>
            </CardContent>
          </Card>

          <Card className="border-primary/20 bg-gradient-to-br from-background to-success/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Donors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Users className="h-6 w-6 text-success" />
                <span className="text-2xl font-bold text-success">{stats.monthly_donors}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Active monthly supporters</p>
            </CardContent>
          </Card>

          <Card className="border-primary/20 bg-gradient-to-br from-background to-warning/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">One-time Donations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Heart className="h-6 w-6 text-warning" />
                <span className="text-2xl font-bold text-warning">{stats.one_time_donations}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Individual contributions</p>
            </CardContent>
          </Card>

          <Card className="border-primary/20 bg-gradient-to-br from-background to-accent/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Average Donation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-6 w-6 text-accent" />
                <span className="text-2xl font-bold text-accent">
                  £{stats.one_time_donations > 0 ? (stats.total_donations / (stats.one_time_donations + stats.monthly_donors)).toFixed(2) : '0.00'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Per donation</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="donations">All Donations</TabsTrigger>
            <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Donations */}
              <Card className="border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Recent Donations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentDonations.length > 0 ? (
                      recentDonations.map((donation) => (
                        <div key={donation.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                          <div>
                            <div className="font-semibold">{donation.donor_name}</div>
                            <div className="text-sm text-muted-foreground">
                              {donation.campaign} • {donation.type}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-primary">£{donation.amount.toFixed(2)}</div>
                            <div className="text-xs text-muted-foreground">
                              {format(new Date(donation.created_at), 'MMM dd, HH:mm')}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-muted-foreground py-8">
                        No recent donations found
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Campaign Performance */}
              <Card className="border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Campaign Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {campaignStats.length > 0 ? (
                      campaignStats.map((campaign, index) => (
                        <div key={campaign.campaign_name} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">{campaign.campaign_name}</span>
                            <span className="text-primary font-bold">£{campaign.total_amount.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-sm text-muted-foreground">
                            <span>{campaign.donation_count} donations</span>
                            <span>#{index + 1}</span>
                          </div>
                          {index < campaignStats.length - 1 && <Separator />}
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-muted-foreground py-8">
                        No campaign data available
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="donations" className="space-y-4">
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
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex-1 min-w-48">
                    <Label>Type</Label>
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

                  <div className="flex-1 min-w-48">
                    <Label>Campaign</Label>
                    <Select value={campaignFilter} onValueChange={setCampaignFilter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Campaigns</SelectItem>
                        <SelectItem value="general">General Fund</SelectItem>
                        {campaignStats.map((campaign) => (
                          <SelectItem key={campaign.campaign_name} value={campaign.campaign_name}>
                            {campaign.campaign_name}
                          </SelectItem>
                        ))}
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

            {/* Donations Table */}
            <Card className="border-primary/20">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Donor</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Campaign</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allDonations.length > 0 ? (
                        allDonations.map((donation) => (
                          <TableRow key={donation.id}>
                            <TableCell className="font-medium">
                              <div>
                                <div className="font-semibold">
                                  {donation.first_name && donation.last_name ? 
                                    `${donation.first_name} ${donation.last_name}` : 
                                    'Anonymous'
                                  }
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {donation.email}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="font-bold text-primary">
                              £{donation.amount.toFixed(2)}
                            </TableCell>
                            <TableCell>
                              {donation.campaign || 'General Fund'}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {donation.type}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant={donation.status === 'completed' ? 'default' : 'secondary'}
                                className={donation.status === 'completed' ? 'bg-success text-success-foreground' : ''}
                              >
                                {donation.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {format(new Date(donation.created_at), 'dd/MM/yyyy HH:mm')}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            No donations found matching your filters.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="campaigns" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {campaignStats.map((campaign) => (
                <Card key={campaign.campaign_name} className="border-primary/20">
                  <CardHeader>
                    <CardTitle className="text-lg">{campaign.campaign_name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Total Raised</span>
                        <span className="font-bold text-primary">£{campaign.total_amount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Donations</span>
                        <span className="font-semibold">{campaign.donation_count}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Average</span>
                        <span className="font-semibold">
                          £{(campaign.total_amount / campaign.donation_count).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
