import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Shield, CreditCard, Globe } from 'lucide-react';
import { format } from 'date-fns';

// Helper function for consistent GBP formatting
const formatGBP = (cents: number | null | undefined): string => {
  if (cents == null) return "£0.00";
  const value = (Number(cents) / 100).toFixed(2);
  return `£${value}`;
};

interface FraudAlert {
  id: string;
  type: 'self_purchase' | 'multiple_accounts' | 'same_card';
  description: string;
  severity: 'high' | 'medium' | 'low';
  count: number;
  details?: any;
}

interface FraudChecksPanelProps {
  fraudAlerts: FraudAlert[];
  onFilterByAlert: (alert: FraudAlert) => void;
}

export function FraudChecksPanel({ fraudAlerts, onFilterByAlert }: FraudChecksPanelProps) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-destructive/20 text-destructive border-destructive/30';
      case 'medium': return 'bg-warning/20 text-warning border-warning/30';
      case 'low': return 'bg-muted/20 text-muted-foreground border-muted/30';
      default: return 'bg-muted/20 text-muted-foreground border-muted/30';
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'self_purchase': return <Shield className="h-4 w-4" />;
      case 'multiple_accounts': return <Globe className="h-4 w-4" />;
      case 'same_card': return <CreditCard className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getTitle = (type: string) => {
    switch (type) {
      case 'self_purchase': return 'Self-Purchases';
      case 'multiple_accounts': return 'Same IP Bursts';
      case 'same_card': return 'Same Card Multiple Users';
      default: return 'Unknown Risk';
    }
  };

  const getTooltipText = (type: string) => {
    switch (type) {
      case 'self_purchase': return 'Detected when earner_user_id equals purchaser_user_id';
      case 'multiple_accounts': return 'Multiple accounts purchasing from the same IP within 24 hours';
      case 'same_card': return 'Same card number used across different user accounts within 14 days';
      default: return 'Unknown fraud detection rule';
    }
  };

  return (
    <Card className="border-warning/20 bg-gradient-to-br from-background to-warning/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-warning">
          <AlertTriangle className="h-5 w-5" />
          Fraud & Risk Alerts
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {fraudAlerts.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Shield className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No fraud alerts detected</p>
          </div>
        ) : (
          fraudAlerts.map((alert) => (
            <div 
              key={alert.id} 
              className="flex items-center justify-between p-3 rounded-lg border border-primary/20 bg-background/50"
            >
              <div className="flex items-center gap-3">
                <div className="text-muted-foreground">
                  {getIcon(alert.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-sm">{getTitle(alert.type)}</h4>
                    <Badge 
                      variant="outline" 
                      className={getSeverityColor(alert.severity)}
                    >
                      {alert.severity}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground" title={getTooltipText(alert.type)}>
                    {alert.description}
                  </p>
                  {alert.count > 0 && (
                    <div className="mt-1">
                      <Badge variant="outline" className="text-xs">
                        {alert.count} cases found
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
              
              {alert.count > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onFilterByAlert(alert)}
                  className="text-xs"
                >
                  View in Breakdown
                </Button>
              )}
            </div>
          ))
        )}

        {/* Mock specific fraud cases for demonstration */}
        <div className="mt-6 space-y-3">
          <h5 className="font-medium text-sm text-muted-foreground">Recent Risk Events</h5>
          
          {/* Mock self-purchase case */}
          <div className="p-2 rounded border border-destructive/20 bg-destructive/5">
            <div className="flex justify-between items-start text-xs">
              <div>
                <span className="font-medium text-destructive">Self-Purchase Detected</span>
                <p className="text-muted-foreground">User earned commission on own purchase</p>
                <p className="text-muted-foreground">{formatGBP(1500)} • {format(new Date(), 'MMM dd, HH:mm')}</p>
              </div>
              <Badge variant="outline" className="bg-destructive/20 text-destructive border-destructive/30 text-xs">
                HIGH
              </Badge>
            </div>
          </div>

          {/* Mock IP burst case */}
          <div className="p-2 rounded border border-warning/20 bg-warning/5">
            <div className="flex justify-between items-start text-xs">
              <div>
                <span className="font-medium text-warning">IP Burst Activity</span>
                <p className="text-muted-foreground">5 accounts, same IP, 2h window</p>
                <p className="text-muted-foreground">192.168.1.* • {format(new Date(), 'MMM dd, HH:mm')}</p>
              </div>
              <Badge variant="outline" className="bg-warning/20 text-warning border-warning/30 text-xs">
                MED
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}