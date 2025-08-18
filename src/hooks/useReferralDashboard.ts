import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ReferralStats {
  totalReferrals: number;
  totalEarned: number;
  pendingEarnings: number;
  paidEarnings: number;
  activeReferrals: number;
  l1Earnings: number;
  l2Earnings: number;
  l1Pending: number;
  l2Pending: number;
  l1Paid: number;
  l2Paid: number;
}

interface ReferralEarning {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  referred_user_id: string;
  generation: number;
  level: string;
  referred_user_name?: string;
}

interface ReferredUser {
  id: string;
  name: string;
  email?: string;
  joined_date: string;
  total_earned: number;
  status: 'active' | 'inactive';
}

export const useReferralDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [referralCode, setReferralCode] = useState<string>('');
  const [stats, setStats] = useState<ReferralStats>({
    totalReferrals: 0,
    totalEarned: 0,
    pendingEarnings: 0,
    paidEarnings: 0,
    activeReferrals: 0,
    l1Earnings: 0,
    l2Earnings: 0,
    l1Pending: 0,
    l2Pending: 0,
    l1Paid: 0,
    l2Paid: 0
  });
  const [earnings, setEarnings] = useState<ReferralEarning[]>([]);
  const [referredUsers, setReferredUsers] = useState<ReferredUser[]>([]);

  // Generate or fetch referral code
  const ensureReferralCode = async (userId: string) => {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('referral_code')
      .eq('id', userId)
      .single();

    if (error) throw error;

    if (profile?.referral_code) {
      setReferralCode(profile.referral_code);
      return profile.referral_code;
    }

    // Generate new code
    const newCode = generateReferralCode();
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ referral_code: newCode })
      .eq('id', userId);

    if (updateError) throw updateError;
    
    setReferralCode(newCode);
    return newCode;
  };

  // Fetch referral statistics
  const fetchStats = async (userId: string) => {
    try {
      // Get total referrals
      const { count: totalReferrals } = await supabase
        .from('referrals')
        .select('*', { count: 'exact', head: true })
        .eq('referrer_id', userId);

      // Get earnings statistics with level breakdown
      const { data: earningsData } = await supabase
        .from('referral_earnings')
        .select('amount, status, level')
        .eq('user_id', userId);

      const totalEarned = earningsData?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;
      const pendingEarnings = earningsData?.filter(e => e.status === 'pending').reduce((sum, e) => sum + Number(e.amount), 0) || 0;
      const paidEarnings = earningsData?.filter(e => e.status === 'paid').reduce((sum, e) => sum + Number(e.amount), 0) || 0;
      
      // Level-specific earnings
      const l1Earnings = earningsData?.filter(e => e.level === 'L1').reduce((sum, e) => sum + Number(e.amount), 0) || 0;
      const l2Earnings = earningsData?.filter(e => e.level === 'L2').reduce((sum, e) => sum + Number(e.amount), 0) || 0;
      const l1Pending = earningsData?.filter(e => e.level === 'L1' && e.status === 'pending').reduce((sum, e) => sum + Number(e.amount), 0) || 0;
      const l2Pending = earningsData?.filter(e => e.level === 'L2' && e.status === 'pending').reduce((sum, e) => sum + Number(e.amount), 0) || 0;
      const l1Paid = earningsData?.filter(e => e.level === 'L1' && e.status === 'paid').reduce((sum, e) => sum + Number(e.amount), 0) || 0;
      const l2Paid = earningsData?.filter(e => e.level === 'L2' && e.status === 'paid').reduce((sum, e) => sum + Number(e.amount), 0) || 0;

      // Count active referrals (those who have made purchases)
      const { data: activeReferralsData } = await supabase
        .from('referral_earnings')
        .select('referred_user_id')
        .eq('user_id', userId);
      
      const activeReferrals = new Set(activeReferralsData?.map(r => r.referred_user_id) || []).size;

      setStats({
        totalReferrals: totalReferrals || 0,
        totalEarned,
        pendingEarnings,
        paidEarnings,
        activeReferrals: activeReferrals || 0,
        l1Earnings,
        l2Earnings,
        l1Pending,
        l2Pending,
        l1Paid,
        l2Paid
      });

    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Failed to load referral statistics');
    }
  };

  // Fetch detailed earnings
  const fetchEarnings = async (userId: string) => {
    try {
      const { data: earningsData, error } = await supabase
        .from('referral_earnings')
        .select('id, amount, status, created_at, referred_user_id, generation, level')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch referred user names separately
      if (earningsData && earningsData.length > 0) {
        const userIds = [...new Set(earningsData.map(e => e.referred_user_id))];
        const { data: usersData } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, email')
          .in('id', userIds);

        const usersMap = new Map(usersData?.map(u => [u.id, u]) || []);
        
        const processedEarnings = earningsData.map(earning => {
          const userProfile = usersMap.get(earning.referred_user_id);
          return {
            ...earning,
            referred_user_name: userProfile 
              ? [userProfile.first_name, userProfile.last_name].filter(Boolean).join(' ') || userProfile.email || 'Unknown'
              : 'Unknown'
          };
        });

        setEarnings(processedEarnings);
      } else {
        setEarnings([]);
      }

    } catch (error) {
      console.error('Error fetching earnings:', error);
      toast.error('Failed to load earnings details');
    }
  };

  // Fetch referred users
  const fetchReferredUsers = async (userId: string) => {
    try {
      const { data: referralsData, error } = await supabase
        .from('referrals')
        .select('referred_user_id, created_at')
        .eq('referrer_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!referralsData || referralsData.length === 0) {
        setReferredUsers([]);
        return;
      }

      // Fetch user profiles separately
      const userIds = referralsData.map(r => r.referred_user_id);
      const { data: usersData } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email')
        .in('id', userIds);

      const usersMap = new Map(usersData?.map(u => [u.id, u]) || []);

      // Get earnings for each referred user
      const usersWithEarnings = await Promise.all(
        referralsData.map(async (referral) => {
          const { data: earningsData } = await supabase
            .from('referral_earnings')
            .select('amount')
            .eq('user_id', userId)
            .eq('referred_user_id', referral.referred_user_id);

          const totalEarned = earningsData?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;
          const userProfile = usersMap.get(referral.referred_user_id);

          return {
            id: referral.referred_user_id,
            name: userProfile 
              ? [userProfile.first_name, userProfile.last_name].filter(Boolean).join(' ') || userProfile.email || 'Unknown'
              : 'Unknown',
            email: userProfile?.email,
            joined_date: referral.created_at,
            total_earned: totalEarned,
            status: totalEarned > 0 ? 'active' : 'inactive' as 'active' | 'inactive'
          };
        })
      );

      setReferredUsers(usersWithEarnings);

    } catch (error) {
      console.error('Error fetching referred users:', error);
      toast.error('Failed to load referred users');
    }
  };

  // Main data loading function
  const loadReferralData = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      await ensureReferralCode(user.id);
      await Promise.all([
        fetchStats(user.id),
        fetchEarnings(user.id),
        fetchReferredUsers(user.id)
      ]);
    } catch (error) {
      console.error('Error loading referral data:', error);
      toast.error('Failed to load referral dashboard');
    } finally {
      setLoading(false);
    }
  };

  // Load data on mount and when user changes
  useEffect(() => {
    loadReferralData();
  }, [user?.id]);

  // Copy referral link to clipboard
  const copyReferralLink = () => {
    const baseUrl = window.location.origin;
    const referralLink = `${baseUrl}/?ref=${referralCode}`;
    
    navigator.clipboard.writeText(referralLink).then(() => {
      toast.success('Referral link copied to clipboard!');
    }).catch(() => {
      toast.error('Failed to copy link');
    });
  };

  return {
    loading,
    referralCode,
    stats,
    earnings,
    referredUsers,
    copyReferralLink,
    refreshData: loadReferralData
  };
};

// Helper function to generate referral codes
function generateReferralCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}