
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Gift, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Star, 
  ArrowRight,
  CheckCircle,
  Target,
  Trophy
} from 'lucide-react';

interface ReferralOnboardingProps {
  onGetStarted: () => void;
}

export const ReferralOnboarding = ({ onGetStarted }: ReferralOnboardingProps) => {
  const [currentStep, setCurrentStep] = useState(0);

  const benefits = [
    {
      icon: DollarSign,
      title: "High Commissions",
      description: "Earn 15% on direct referrals + 10% on their referrals",
      color: "text-green-600"
    },
    {
      icon: Users,
      title: "Two-Level System",
      description: "Get paid when your referrals refer others too",
      color: "text-blue-600"
    },
    {
      icon: TrendingUp,
      title: "Passive Income",
      description: "Earn continuously as your network grows",
      color: "text-purple-600"
    },
    {
      icon: Target,
      title: "Low Threshold",
      description: "Only £25 minimum purchase to earn commissions",
      color: "text-orange-600"
    }
  ];

  const steps = [
    {
      title: "Get Your Link",
      description: "Receive your unique referral link",
      icon: Gift
    },
    {
      title: "Share & Promote",
      description: "Share with friends, family, or on social media",
      icon: Users
    },
    {
      title: "Track & Earn",
      description: "Watch your earnings grow automatically",
      icon: Trophy
    }
  ];

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/10 to-accent/10">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-4">
            <Gift className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-3xl text-primary mb-2">
            Start Earning with Referrals!
          </CardTitle>
          <CardDescription className="text-lg">
            Join our multi-level referral program and earn commissions on every referral
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Benefits Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {benefits.map((benefit, index) => {
          const IconComponent = benefit.icon;
          return (
            <Card key={index} className="border-primary/20 hover:shadow-md transition-shadow">
              <CardContent className="p-6 text-center">
                <IconComponent className={`h-12 w-12 mx-auto mb-4 ${benefit.color}`} />
                <h3 className="font-semibold mb-2">{benefit.title}</h3>
                <p className="text-sm text-muted-foreground">{benefit.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* How It Works */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="text-center text-2xl">How It Works</CardTitle>
          <CardDescription className="text-center">
            Three simple steps to start earning
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, index) => {
              const IconComponent = step.icon;
              return (
                <div key={index} className="text-center">
                  <div className="relative">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <IconComponent className="h-8 w-8 text-primary" />
                    </div>
                    <Badge 
                      variant="default" 
                      className="absolute -top-2 -right-2 w-8 h-8 rounded-full p-0 flex items-center justify-center"
                    >
                      {index + 1}
                    </Badge>
                    {index < steps.length - 1 && (
                      <ArrowRight className="hidden md:block absolute top-6 -right-12 h-6 w-6 text-muted-foreground" />
                    )}
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Commission Structure */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="text-center">Commission Structure</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="text-center p-6 border border-primary/20 rounded-lg bg-primary/5">
              <div className="text-4xl text-primary font-bold mb-2">15%</div>
              <h3 className="font-semibold mb-2">Level 1 (Direct)</h3>
              <p className="text-sm text-muted-foreground">
                Earn 15% commission on every purchase made by users you directly refer
              </p>
            </div>
            
            <div className="text-center p-6 border border-accent/20 rounded-lg bg-accent/5">
              <div className="text-4xl text-accent font-bold mb-2">10%</div>
              <h3 className="font-semibold mb-2">Level 2 (Indirect)</h3>
              <p className="text-sm text-muted-foreground">
                Earn 10% commission when your referrals refer others
              </p>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-5 w-5 text-success" />
              <span className="font-semibold">Requirements:</span>
            </div>
            <ul className="text-sm text-muted-foreground space-y-1 ml-7">
              <li>• Minimum £25 purchase required for commission eligibility</li>
              <li>• Commissions are calculated automatically</li>
              <li>• Track all earnings in your dashboard</li>
              <li>• Payouts processed regularly</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Earnings Examples */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="text-center">Earnings Examples</CardTitle>
          <CardDescription className="text-center">
            See your potential monthly earnings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border border-muted rounded-lg">
              <div className="text-2xl font-bold text-primary mb-2">£135</div>
              <h4 className="font-semibold mb-2">Starter</h4>
              <p className="text-sm text-muted-foreground">10 referrals × £90 avg purchase</p>
            </div>
            
            <div className="text-center p-4 border border-primary rounded-lg bg-primary/5">
              <div className="text-2xl font-bold text-primary mb-2">£675</div>
              <h4 className="font-semibold mb-2">Growing</h4>
              <p className="text-sm text-muted-foreground">50 referrals × £90 avg purchase</p>
            </div>
            
            <div className="text-center p-4 border border-accent rounded-lg bg-accent/5">
              <div className="text-2xl font-bold text-accent mb-2">£1,350</div>
              <h4 className="font-semibold mb-2">Success</h4>
              <p className="text-sm text-muted-foreground">100 referrals × £90 avg purchase</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CTA */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5">
        <CardContent className="p-8 text-center">
          <Star className="h-12 w-12 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">Ready to Start Earning?</h2>
          <p className="text-muted-foreground mb-6">
            Join thousands of users already earning with our referral program
          </p>
          <Button size="lg" onClick={onGetStarted} className="px-8">
            Get My Referral Link
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
