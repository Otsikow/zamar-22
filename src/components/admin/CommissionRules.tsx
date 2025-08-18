import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings } from 'lucide-react';
import { format } from 'date-fns';

interface CommissionRule {
  generation: number;
  rate: number;
  updated_at: string;
}

interface CommissionRulesProps {
  rules: CommissionRule[];
}

export function CommissionRules({ rules }: CommissionRulesProps) {
  const getLastUpdated = () => {
    if (rules.length === 0) return 'Never';
    const latestUpdate = rules.reduce((latest, rule) => {
      const ruleDate = new Date(rule.updated_at);
      return ruleDate > latest ? ruleDate : latest;
    }, new Date(rules[0].updated_at));
    
    return format(latestUpdate, 'MMM dd, yyyy HH:mm');
  };

  const getRuleRate = (generation: number) => {
    const rule = rules.find(r => r.generation === generation);
    return rule ? (rule.rate * 100).toFixed(0) : '0';
  };

  return (
    <Card className="border-muted/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-muted-foreground">
          <Settings className="h-5 w-5" />
          Commission Rules
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <div className="flex justify-between items-center py-2 px-3 rounded bg-primary/5 border border-primary/20">
            <span className="font-medium text-primary">Gen-1 Rate:</span>
            <span className="font-bold text-primary">{getRuleRate(1)}%</span>
          </div>
          
          <div className="flex justify-between items-center py-2 px-3 rounded bg-accent/5 border border-accent/20">
            <span className="font-medium text-accent">Gen-2 Rate:</span>
            <span className="font-bold text-accent">{getRuleRate(2)}%</span>
          </div>
        </div>

        <div className="pt-2 border-t border-muted/30">
          <p className="text-xs text-muted-foreground">
            <span className="font-medium">Last updated:</span> {getLastUpdated()}
          </p>
        </div>

        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Gen-1: Direct referrals earn 15% commission</p>
          <p>• Gen-2: Second-level referrals earn 10% commission</p>
          <p>• Commissions are calculated on successful payments</p>
        </div>
      </CardContent>
    </Card>
  );
}