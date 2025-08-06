import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { DollarSign, Users, Zap } from 'lucide-react';

export const ReferralTestingPanel = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('25.00');

  const simulatePayment = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to simulate a payment",
        variant: "destructive"
      });
      return;
    }

    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount < 25) {
      toast({
        title: "Invalid Amount",
        description: "Payment amount must be at least £25",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Call the edge function to process payment referrals
      const { data, error } = await supabase.functions.invoke('process-payment-referrals', {
        body: {
          user_id: user.id,
          payment_amount: amount,
          payment_type: 'test_payment',
          description: `Test payment of £${amount} for referral system testing`
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Payment Simulated!",
          description: `£${amount} payment processed. Referral earnings have been calculated and added.`
        });
      } else {
        throw new Error(data.message || 'Failed to process payment');
      }
    } catch (error) {
      console.error('Error simulating payment:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to simulate payment",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addTestReferral = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to add test referrals",
        variant: "destructive"
      });
      return;
    }

    try {
      // Create a dummy user profile for testing (you might want to create actual test users)
      const dummyUserId = crypto.randomUUID();
      
      // Insert a test referral
      const { error } = await supabase
        .from('referrals')
        .insert({
          referred_user_id: dummyUserId,
          referrer_id: user.id,
          generation: 1
        });

      if (error) throw error;

      toast({
        title: "Test Referral Added",
        description: "A test referral has been added to your account. Now simulate a payment to see earnings!"
      });
    } catch (error) {
      console.error('Error adding test referral:', error);
      toast({
        title: "Error",
        description: "Failed to add test referral",
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <Zap className="h-5 w-5" />
          Referral System Testing
        </CardTitle>
        <CardDescription>
          Test the automatic referral earnings system with simulated payments
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Test Payment Simulation */}
        <div className="space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Simulate Payment
          </h3>
          <div className="space-y-3">
            <div>
              <Label htmlFor="payment-amount">Payment Amount (£)</Label>
              <Input
                id="payment-amount"
                type="number"
                min="25"
                step="0.01"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="25.00"
              />
            </div>
            <Button 
              onClick={simulatePayment} 
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Processing...' : 'Simulate Payment & Process Referrals'}
            </Button>
          </div>
        </div>

        {/* Test Referral Creation */}
        <div className="space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Users className="h-4 w-4" />
            Add Test Referral
          </h3>
          <p className="text-sm text-muted-foreground">
            Add a test referral to your account so you can see earnings when simulating payments.
          </p>
          <Button 
            onClick={addTestReferral}
            variant="outline"
            className="w-full"
          >
            Add Test Referral
          </Button>
        </div>

        {/* How It Works */}
        <div className="space-y-4">
          <h3 className="font-semibold">How It Works:</h3>
          <div className="text-sm text-muted-foreground space-y-2">
            <p>1. <strong>Minimum Payment:</strong> £25 required to trigger referral earnings</p>
            <p>2. <strong>1st Generation:</strong> 15% commission for direct referrals</p>
            <p>3. <strong>2nd Generation:</strong> 10% commission for sub-referrals</p>
            <p>4. <strong>Status:</strong> All earnings start as 'pending' until admin approval</p>
            <p>5. <strong>Automatic:</strong> Triggers on successful donations, payments, or subscriptions</p>
          </div>
        </div>

        {/* Database Tables */}
        <div className="space-y-4">
          <h3 className="font-semibold">Database Integration:</h3>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>• <code>donations</code> table: Triggers on completed donations ≥ £25</p>
            <p>• <code>payments</code> table: Triggers on succeeded payments ≥ £25</p>
            <p>• <code>referral_earnings</code> table: Stores all commission records</p>
            <p>• Edge function: <code>process-payment-referrals</code> for manual/webhook triggers</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};