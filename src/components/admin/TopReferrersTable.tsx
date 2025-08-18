import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

// Helper function for consistent GBP formatting
const formatGBP = (cents: number | null | undefined): string => {
  if (cents == null) return "£0.00";
  const value = (Number(cents) / 100).toFixed(2);
  return `£${value}`;
};

interface TopReferrer {
  earner_user_id: string;
  gen1_earnings: number;
  gen2_earnings: number;
  total: number;
  earner_name?: string;
}

interface TopReferrersTableProps {
  referrers: TopReferrer[];
  onReferrerClick: (referrer: TopReferrer) => void;
}

export function TopReferrersTable({ referrers, onReferrerClick }: TopReferrersTableProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle>Top Referrers (Last 30 days)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border border-primary/20">
          <Table>
            <TableHeader>
              <TableRow className="border-primary/20">
                <TableHead className="w-16">Rank</TableHead>
                <TableHead>Referrer</TableHead>
                <TableHead className="text-right">Gen-1 (£)</TableHead>
                <TableHead className="text-right">Gen-2 (£)</TableHead>
                <TableHead className="text-right">Total (£)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {referrers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No referrers found for the last 30 days
                  </TableCell>
                </TableRow>
              ) : (
                referrers.map((referrer, index) => (
                  <TableRow 
                    key={referrer.earner_user_id} 
                    className="border-primary/20 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => onReferrerClick(referrer)}
                  >
                    <TableCell>
                      <div className="flex items-center justify-center">
                        <span className="font-bold text-primary">#{index + 1}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {getInitials(referrer.earner_name || 'UN')}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">
                          {referrer.earner_name || 'Unknown'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatGBP(referrer.gen1_earnings * 100)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatGBP(referrer.gen2_earnings * 100)}
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold text-primary">
                      {formatGBP(referrer.total * 100)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        
        {referrers.length > 0 && (
          <p className="text-xs text-muted-foreground mt-3 text-center">
            Click on a referrer to filter the commission breakdown below
          </p>
        )}
      </CardContent>
    </Card>
  );
}