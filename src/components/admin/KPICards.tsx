import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet, Trophy, TrendingUp, Users } from 'lucide-react';

// Helper function for consistent GBP formatting
const formatGBP = (cents: number | null | undefined): string => {
  if (cents == null) return "£0.00";
  const value = (Number(cents) / 100).toFixed(2);
  return `£${value}`;
};

interface KPIData {
  totalEarned: number;
  paidOut: number;
  pending: number;
  totalReferrals: number;
}

interface KPICardsProps {
  data: KPIData;
}

export function KPICards({ data }: KPICardsProps) {
  const kpis = [
    {
      title: "Total Earned (£)",
      value: formatGBP(data.totalEarned * 100), // Convert back to cents for formatting
      icon: Wallet,
      accent: "text-primary",
      bgGradient: "bg-gradient-to-br from-background to-primary/5 border-primary/20"
    },
    {
      title: "Paid Out (£)",
      value: formatGBP(data.paidOut * 100),
      icon: Trophy,
      accent: "text-success",
      bgGradient: "bg-gradient-to-br from-background to-success/5 border-success/20"
    },
    {
      title: "Pending (£)",
      value: formatGBP(data.pending * 100),
      icon: TrendingUp,
      accent: "text-warning",
      bgGradient: "bg-gradient-to-br from-background to-warning/5 border-warning/20"
    },
    {
      title: "Total Referrals",
      value: data.totalReferrals.toString(),
      icon: Users,
      accent: "text-accent",
      bgGradient: "bg-gradient-to-br from-background to-accent/5 border-accent/20"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi, index) => {
        const IconComponent = kpi.icon;
        
        return (
          <Card key={index} className={kpi.bgGradient}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground font-medium">
                {kpi.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <IconComponent className={`h-6 w-6 ${kpi.accent}`} />
                <span className="text-2xl font-bold">{kpi.value}</span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}