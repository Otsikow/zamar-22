import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl font-bold text-foreground">Top Referrers</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Last 30 days</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {referrers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">No referrers found for the last 30 days</p>
          </div>
        ) : (
          <div className="space-y-3">
            {referrers.map((referrer, index) => (
              <div 
                key={referrer.earner_user_id} 
                className="flex items-center justify-between p-3 rounded-lg border border-primary/20 bg-background/50 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => onReferrerClick(referrer)}
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                    #{index + 1}
                  </div>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {getInitials(referrer.earner_name || 'UN')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium text-sm">
                        {referrer.earner_name || 'Unknown'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Gen-1: {formatGBP(referrer.gen1_earnings * 100)} | Gen-2: {formatGBP(referrer.gen2_earnings * 100)}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="font-bold text-primary">
                    {formatGBP(referrer.total * 100)}
                  </div>
                  <div className="text-xs text-muted-foreground">Total</div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {referrers.length > 0 && (
          <p className="text-xs text-muted-foreground mt-3 text-center">
            Click on a referrer to filter the commission breakdown below
          </p>
        )}
      </CardContent>
    </Card>
  );
}