import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Users, DollarSign, TrendingUp, Eye, Share2, Calendar, RefreshCw } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useReferralDashboard } from '@/hooks/useReferralDashboard';
import { Skeleton } from '@/components/ui/skeleton';

export default function ReferralDashboard() {
  const { 
    loading, 
    referralCode, 
    stats, 
    earnings, 
    referredUsers, 
    copyReferralLink, 
    refreshData 
  } = useReferralDashboard();

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="text-center space-y-2">
          <Skeleton className="h-8 w-64 mx-auto" />
          <Skeleton className="h-4 w-96 mx-auto" />
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount / 100); // Convert from pence to pounds
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB');
  };

  const referralLink = `${window.location.origin}/?ref=${referralCode}`;

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
          Referral Dashboard
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Share your unique link and earn commission: 15% on direct referrals (L1) and 10% on their referrals (L2)
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.totalReferrals}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeReferrals} active • {stats.totalReferrals - stats.activeReferrals} inactive
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalEarned)}</div>
            <p className="text-xs text-muted-foreground">
              Lifetime earnings from referrals
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid Earnings</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(stats.paidEarnings)}</div>
            <p className="text-xs text-muted-foreground">
              Successfully paid out
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payout</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{formatCurrency(stats.pendingEarnings)}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting payment
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Level-based earnings breakdown */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Earnings by Level
          </CardTitle>
          <CardDescription>
            Breakdown of your commission earnings by referral level
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20 dark:border-green-800/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">
                  L1 Earnings (15% Direct Referrals)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Total:</span>
                  <span className="font-bold text-green-600 text-lg">{formatCurrency(stats.l1Earnings)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Pending:</span>
                  <span className="text-orange-600">{formatCurrency(stats.l1Pending)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Paid:</span>
                  <span className="text-blue-600">{formatCurrency(stats.l1Paid)}</span>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-800/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  L2 Earnings (10% Indirect Referrals)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Total:</span>
                  <span className="font-bold text-blue-600 text-lg">{formatCurrency(stats.l2Earnings)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Pending:</span>
                  <span className="text-orange-600">{formatCurrency(stats.l2Pending)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Paid:</span>
                  <span className="text-blue-600">{formatCurrency(stats.l2Paid)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Referral Link Section */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 via-transparent to-primary-glow/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Your Referral Link
          </CardTitle>
          <CardDescription>
            Share this link to earn 15% (L1) and 10% (L2) commission on purchases
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1 p-3 bg-muted rounded-md border font-mono text-sm break-all">
              {referralLink}
            </div>
            <Button onClick={copyReferralLink} variant="outline" className="shrink-0">
              <Copy className="h-4 w-4 mr-2" />
              Copy Link
            </Button>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Your referral code: <span className="font-mono font-semibold">{referralCode}</span>
            </div>
            <Button onClick={refreshData} variant="ghost" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Earnings */}
      {earnings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Recent Earnings
            </CardTitle>
            <CardDescription>
              Your latest referral commissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Referred User</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Level & Rate</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {earnings.slice(0, 10).map((earning) => (
                    <TableRow key={earning.id}>
                      <TableCell>{formatDate(earning.created_at)}</TableCell>
                      <TableCell>{earning.referred_user_name}</TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(earning.amount)}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={earning.level === 'L1' ? 'default' : 'secondary'}
                          className={earning.level === 'L1' ? 
                            'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 
                            'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                          }
                        >
                          {earning.level} ({earning.level === 'L1' ? '15%' : '10%'})
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={earning.status === 'paid' ? 'default' : 'secondary'}
                        >
                          {earning.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Referred Users */}
      {referredUsers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Your Referrals
            </CardTitle>
            <CardDescription>
              People you've successfully referred
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Joined Date</TableHead>
                    <TableHead>Total Earned</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {referredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{formatDate(user.joined_date)}</TableCell>
                      <TableCell>{formatCurrency(user.total_earned)}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={user.status === 'active' ? 'default' : 'secondary'}
                        >
                          {user.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* How It Works */}
      <Card className="border-muted">
        <CardHeader>
          <CardTitle>How Referrals Work</CardTitle>
          <CardDescription>
            Understand how you earn with our referral program
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
                <Share2 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold">Share Your Link</h3>
              <p className="text-sm text-muted-foreground">
                Copy and share your unique referral link with friends and family
              </p>
            </div>
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold">They Purchase</h3>
              <p className="text-sm text-muted-foreground">
                When someone uses your link and makes a purchase of £25 or more
              </p>
            </div>
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold">You Earn Commission</h3>
              <p className="text-sm text-muted-foreground">
                Earn 15% (L1) on direct referrals, 10% (L2) on their referrals, paid out monthly
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Notice */}
      <Card className="bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <div>
              <p className="font-semibold text-green-800 dark:text-green-200">
                Referral System Active
              </p>
              <p className="text-sm text-green-700 dark:text-green-300">
                All referrals are being tracked automatically. Earnings are processed within 24 hours of purchase.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}