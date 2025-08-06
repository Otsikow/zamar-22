import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { 
  Calculator, 
  Percent, 
  CalendarDays, 
  TrendingUp, 
  Trophy, 
  Target,
  Rocket,
  Crown,
  Medal,
  Award,
  FileText,
  Sprout,
  Lightbulb,
  Play,
  Megaphone
} from 'lucide-react';

interface ProgressionLevel {
  level: string;
  icon: string;
  color: string;
  next?: {
    level: string;
    needed: number;
  } | null;
}

interface Scenario {
  refs: number;
  amount: number;
  label: string;
  icon: string;
}

const ReferralCalculator = () => {
  const [firstGenReferrals, setFirstGenReferrals] = useState(50);
  const [secondGenMultiplier, setSecondGenMultiplier] = useState(1);
  const [transactionAmount, setTransactionAmount] = useState(90);
  const chartRef = useRef<HTMLCanvasElement>(null);

  const calculateEarnings = () => {
    const secondGenReferrals = Math.round(firstGenReferrals * secondGenMultiplier);
    const firstGenEarnings = firstGenReferrals * transactionAmount * 0.15;
    const secondGenEarnings = secondGenReferrals * transactionAmount * 0.10;
    const totalMonthlyEarnings = firstGenEarnings + secondGenEarnings;
    const annualEarnings = totalMonthlyEarnings * 12;
    const networkSize = firstGenReferrals + secondGenReferrals;
    
    return { 
      firstGenReferrals,
      secondGenReferrals,
      firstGenEarnings, 
      secondGenEarnings,
      totalMonthlyEarnings, 
      annualEarnings,
      networkSize
    };
  };

  const getProgressionLevel = (refs: number): ProgressionLevel => {
    if (refs >= 100) return { level: 'Platinum', icon: 'crown', color: 'purple', next: null };
    if (refs >= 70) return { level: 'Gold', icon: 'medal', color: 'yellow', next: { level: 'Platinum', needed: 100 - refs } };
    if (refs >= 40) return { level: 'Silver', icon: 'award', color: 'gray', next: { level: 'Gold', needed: 70 - refs } };
    if (refs >= 25) return { level: 'Bronze', icon: 'certificate', color: 'orange', next: { level: 'Silver', needed: 40 - refs } };
    return { level: 'Starter', icon: 'seedling', color: 'green', next: { level: 'Bronze', needed: 25 - refs } };
  };

  const earnings = calculateEarnings();
  const level = getProgressionLevel(earnings.networkSize);

  const levels = [
    { name: 'Starter', min: 10, max: 24, icon: Sprout, active: earnings.networkSize >= 10 && earnings.networkSize <= 24 },
    { name: 'Bronze', min: 25, max: 39, icon: FileText, active: earnings.networkSize >= 25 && earnings.networkSize <= 39 },
    { name: 'Silver', min: 40, max: 69, icon: Award, active: earnings.networkSize >= 40 && earnings.networkSize <= 69 },
    { name: 'Gold', min: 70, max: 99, icon: Medal, active: earnings.networkSize >= 70 && earnings.networkSize <= 99 },
    { name: 'Platinum', min: 100, max: 999, icon: Crown, active: earnings.networkSize >= 100 }
  ];

  const multiLevelScenarios = [
    { firstGen: 100, multiplier: 2, amount: 90, label: 'PLATINUM POWERHOUSE' },
    { firstGen: 75, multiplier: 1.5, amount: 90, label: 'GOLD STANDARD' },
    { firstGen: 50, multiplier: 1, amount: 90, label: 'SILVER SUCCESS' },
    { firstGen: 25, multiplier: 0.5, amount: 90, label: 'BRONZE BUILDER' }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <div className="container mx-auto px-4 pt-24 pb-8 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">MULTI-LEVEL REFERRAL SYSTEM</h1>
          <p className="text-xl text-white font-bold">COMPREHENSIVE EARNINGS CALCULATOR</p>
        </div>

        {/* Main Calculator Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Input Controls */}
          <div className="lg:col-span-1">
            <Card className="border-primary/20 shadow-lg bg-gradient-primary text-black">
              <CardHeader>
                <CardTitle className="text-2xl font-bold flex items-center text-black">
                  <Calculator className="mr-3 text-black" />
                  Calculator
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="block text-sm font-semibold mb-2 text-black">1st Generation Referrals</Label>
                  <Input 
                    type="number" 
                    value={firstGenReferrals}
                    onChange={(e) => setFirstGenReferrals(parseInt(e.target.value) || 0)}
                    min="1" 
                    max="1000" 
                    className="text-white font-semibold text-lg bg-black"
                  />
                </div>
                <div>
                  <Label className="block text-sm font-semibold mb-2 text-black">2nd Gen Multiplier</Label>
                  <select 
                    value={secondGenMultiplier}
                    onChange={(e) => setSecondGenMultiplier(parseFloat(e.target.value))}
                    className="w-full px-4 py-3 rounded-lg text-white font-semibold text-lg bg-black border border-border focus:ring-2 focus:ring-primary focus:outline-none"
                  >
                    <option value="0.5">Conservative (0.5x)</option>
                    <option value="1">Moderate (1x)</option>
                    <option value="1.5">Optimistic (1.5x)</option>
                    <option value="2">Aggressive (2x)</option>
                  </select>
                </div>
                <div>
                  <Label className="block text-sm font-semibold mb-2 text-black">Transaction Amount (£)</Label>
                  <Input 
                    type="number" 
                    value={transactionAmount}
                    onChange={(e) => setTransactionAmount(parseFloat(e.target.value) || 0)}
                    min="1" 
                    max="1000" 
                    className="text-white font-semibold text-lg bg-black"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Commission Structure */}
            <Card className="border-primary/20 shadow-lg mt-6">
              <CardHeader>
                <CardTitle className="text-xl font-bold flex items-center">
                  <Percent className="text-primary mr-3" />
                  Commission Structure
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-primary/10 rounded-lg">
                  <span className="font-semibold">1st Generation</span>
                  <span className="text-primary font-bold">15%</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-primary/10 rounded-lg">
                  <span className="font-semibold">2nd Generation</span>
                  <span className="text-primary font-bold">10%</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-primary text-black rounded-lg">
                  <span className="font-semibold">Total Commission</span>
                  <span className="font-bold">25%</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Multi-Level Earnings Dashboard */}
          <div className="lg:col-span-2">
            {/* Generation Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card className="border-primary/20 shadow-lg hover:scale-105 transition-transform border-l-4 border-l-primary">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold">1st Gen Monthly</h3>
                    <CalendarDays className="text-primary text-2xl" />
                  </div>
                  <div className="text-3xl font-bold text-primary">£{earnings.firstGenEarnings.toLocaleString()}</div>
                  <p className="text-muted-foreground mt-2">Direct referrals (15%)</p>
                </CardContent>
              </Card>

              <Card className="border-primary/20 shadow-lg hover:scale-105 transition-transform border-l-4 border-l-green-500">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold">2nd Gen Monthly</h3>
                    <TrendingUp className="text-green-500 text-2xl" />
                  </div>
                  <div className="text-3xl font-bold text-green-600">£{earnings.secondGenEarnings.toLocaleString()}</div>
                  <p className="text-muted-foreground mt-2">Indirect referrals (10%)</p>
                </CardContent>
              </Card>

              <Card className="border-primary/20 shadow-lg hover:scale-105 transition-transform border-l-4 border-l-purple-500">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold">Total Monthly</h3>
                    <Trophy className="text-purple-500 text-2xl" />
                  </div>
                  <div className="text-3xl font-bold text-purple-600">£{earnings.totalMonthlyEarnings.toLocaleString()}</div>
                  <p className="text-muted-foreground mt-2">Combined earnings</p>
                </CardContent>
              </Card>
            </div>

            {/* Annual and Network Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <Card className="border-primary/20 shadow-lg hover:scale-105 transition-transform">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold">Annual Earnings</h3>
                    <TrendingUp className="text-primary text-2xl" />
                  </div>
                  <div className="text-3xl font-bold text-primary">£{earnings.annualEarnings.toLocaleString()}</div>
                  <p className="text-muted-foreground mt-2">Total yearly income</p>
                </CardContent>
              </Card>

              <Card className="border-primary/20 shadow-lg hover:scale-105 transition-transform">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold">Network Size</h3>
                    <Target className="text-primary text-2xl" />
                  </div>
                  <div className="text-3xl font-bold text-primary">{earnings.networkSize.toLocaleString()}</div>
                  <p className="text-muted-foreground mt-2">Total referrals</p>
                </CardContent>
              </Card>
            </div>

            {/* Network Breakdown */}
            <Card className="border-primary/20 shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl font-bold flex items-center">
                  <Trophy className="text-primary mr-3" />
                  Network Composition
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-black rounded-lg border border-primary/20">
                    <h4 className="font-bold mb-2 text-white">1st Generation</h4>
                    <p className="text-2xl font-bold text-primary">{earnings.firstGenReferrals}</p>
                    <p className="text-gray-300">Direct referrals</p>
                  </div>
                  <div className="text-center p-4 bg-black rounded-lg border border-primary/20">
                    <h4 className="font-bold mb-2 text-white">2nd Generation</h4>
                    <p className="text-2xl font-bold text-primary">{earnings.secondGenReferrals}</p>
                    <p className="text-gray-300">Indirect referrals</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Progression Levels */}
            <Card className="border-primary/20 shadow-lg mt-6">
              <CardHeader>
                <CardTitle className="text-xl font-bold flex items-center">
                  <Trophy className="text-primary mr-3" />
                  Progression Levels
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  {levels.map((levelItem) => {
                    const IconComponent = levelItem.icon;
                    return (
                      <div
                        key={levelItem.name}
                        className={`text-center p-4 rounded-lg transition-all ${
                          levelItem.active 
                            ? 'bg-primary text-black shadow-lg scale-105' 
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        <IconComponent className={`text-2xl mb-2 mx-auto ${
                          levelItem.active ? 'text-black' : 'text-yellow-500'
                        }`} />
                        <h4 className="font-bold mb-1">{levelItem.name}</h4>
                        <p className="text-sm">
                          {levelItem.min}-{levelItem.max === 999 ? '∞' : levelItem.max} refs
                        </p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Scenario Comparison */}
        <Card className="border-primary/20 shadow-lg mb-8">
          <CardHeader>
            <CardTitle className="text-2xl font-bold flex items-center">
              <Megaphone className="text-primary mr-3" />
              Top Revenue Scenarios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-primary text-black">
                    <th className="px-6 py-3 text-left font-semibold">Scenario</th>
                    <th className="px-6 py-3 text-center font-semibold">1st Gen</th>
                    <th className="px-6 py-3 text-center font-semibold">2nd Gen</th>
                    <th className="px-6 py-3 text-center font-semibold">Monthly Total</th>
                    <th className="px-6 py-3 text-center font-semibold">Annual Total</th>
                  </tr>
                </thead>
                <tbody>
                  {multiLevelScenarios.map((scenario) => {
                    const secondGen = Math.round(scenario.firstGen * scenario.multiplier);
                    const firstGenEarnings = scenario.firstGen * scenario.amount * 0.15;
                    const secondGenEarnings = secondGen * scenario.amount * 0.10;
                    const monthlyTotal = firstGenEarnings + secondGenEarnings;
                    const annualTotal = monthlyTotal * 12;
                    return (
                      <tr key={scenario.label} className="border-b hover:bg-primary/5 transition-colors">
                        <td className="px-6 py-4 font-semibold">{scenario.label}</td>
                        <td className="px-6 py-4 text-center font-bold text-primary">£{firstGenEarnings.toLocaleString()}</td>
                        <td className="px-6 py-4 text-center font-bold text-green-600">£{secondGenEarnings.toLocaleString()}</td>
                        <td className="px-6 py-4 text-center font-bold text-purple-600">£{monthlyTotal.toLocaleString()}</td>
                        <td className="px-6 py-4 text-center font-bold text-blue-600">£{annualTotal.toLocaleString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Strategic Insights */}
        <Card className="border-primary/20 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-bold flex items-center">
              <Lightbulb className="text-primary mr-3" />
              Strategic Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center p-6 bg-black text-white rounded-lg border border-primary/20">
                <Play className="text-4xl text-primary mb-3 mx-auto" />
                <h4 className="font-bold mb-2 text-white">Break-Even</h4>
                <p className="text-2xl font-bold text-primary">5 refs</p>
                <p className="text-gray-300 text-sm">covers business costs</p>
              </div>
              <div className="text-center p-6 bg-black text-white rounded-lg border border-primary/20">
                <Rocket className="text-4xl text-primary mb-3 mx-auto" />
                <h4 className="font-bold mb-2 text-white">Growth Phase</h4>
                <p className="text-2xl font-bold text-primary">25+ refs</p>
                <p className="text-gray-300 text-sm">£500+ monthly</p>
              </div>
              <div className="text-center p-6 bg-black text-white rounded-lg border border-primary/20">
                <Trophy className="text-4xl text-primary mb-3 mx-auto" />
                <h4 className="font-bold mb-2 text-white">Success Zone</h4>
                <p className="text-2xl font-bold text-primary">50+ refs</p>
                <p className="text-gray-300 text-sm">£1,000+ monthly</p>
              </div>
              <div className="text-center p-6 bg-black text-white rounded-lg border border-primary/20">
                <Crown className="text-4xl text-primary mb-3 mx-auto" />
                <h4 className="font-bold mb-2 text-white">Elite Level</h4>
                <p className="text-2xl font-bold text-primary">100+ refs</p>
                <p className="text-gray-300 text-sm">£2,500+ monthly</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ReferralCalculator;