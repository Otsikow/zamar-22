import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';

// Helper function for consistent GBP formatting
const formatGBP = (cents: number | null | undefined): string => {
  if (cents == null) return "£0.00";
  const value = (Number(cents) / 100).toFixed(2);
  return `£${value}`;
};

interface EarningsChartData {
  date: string;
  pending: number;
  paid: number;
}

interface EarningsChartProps {
  data: EarningsChartData[];
  period: string;
}

export function EarningsChart({ data, period }: EarningsChartProps) {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-primary/20 rounded-lg p-3 shadow-lg">
          <p className="font-medium text-foreground mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatGBP(entry.value * 100)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const getPeriodTitle = () => {
    switch (period) {
      case 'last_7': return 'Last 7 Days';
      case 'last_30': return 'Last 30 Days';
      case 'last_90': return 'Last 90 Days';
      case 'custom': return 'Custom Period';
      default: return 'All Time';
    }
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle>Earnings Over Time - {getPeriodTitle()}</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <div className="text-center">
              <p className="text-lg font-medium mb-2">No data for this period</p>
              <p className="text-sm">Try adjusting your filters or date range</p>
            </div>
          </div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground"
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground"
                  tickFormatter={(value) => `£${value.toFixed(0)}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="pending" 
                  stroke="hsl(var(--warning))" 
                  strokeWidth={2}
                  name="Pending"
                  dot={{ fill: 'hsl(var(--warning))', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: 'hsl(var(--warning))', strokeWidth: 2 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="paid" 
                  stroke="hsl(var(--success))" 
                  strokeWidth={2}
                  name="Paid"
                  dot={{ fill: 'hsl(var(--success))', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: 'hsl(var(--success))', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}