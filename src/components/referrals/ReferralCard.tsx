import { useState, useEffect } from 'react';
import { Copy, Share2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { getReferralLink, rotateReferralCode } from '@/lib/referralLink';

/**
 * Unified referral card component - single source of truth for referral links
 * Used across dashboard, profile, and any other referral displays
 */
export const ReferralCard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [refLink, setRefLink] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRotating, setIsRotating] = useState(false);

  const loadReferralLink = async () => {
    if (!user?.id) return;
    
    try {
      setIsLoading(true);
      const link = await getReferralLink(user.id);
      setRefLink(link);
    } catch (error) {
      console.error('Error loading referral link:', error);
      toast({
        title: "Error loading referral link",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(refLink);
      toast({
        title: "Copied! 📋",
        description: "Referral link copied to clipboard"
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Please copy the link manually",
        variant: "destructive"
      });
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join Zamar Songs',
          text: 'Join me on Zamar Songs - Christian music that inspires!',
          url: refLink
        });
      } catch (error) {
        // User cancelled share or error occurred, fallback to copy
        handleCopy();
      }
    } else {
      // Fallback to copy for browsers without Web Share API
      handleCopy();
    }
  };

  const handleRotate = async () => {
    if (!user?.id) return;
    
    try {
      setIsRotating(true);
      const newLink = await rotateReferralCode(user.id);
      setRefLink(newLink);
      toast({
        title: "Referral code updated! 🔄",
        description: "Your old link will no longer work"
      });
    } catch (error) {
      toast({
        title: "Failed to rotate code",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive"
      });
    } finally {
      setIsRotating(false);
    }
  };

  useEffect(() => {
    loadReferralLink();
  }, [user?.id]);

  if (isLoading || !refLink) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Your Referral Link
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-10 w-full" />
          <div className="flex gap-2">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 flex-1" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Share2 className="h-5 w-5" />
          Your Referral Link
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Share this link to earn commissions when supporters upgrade or purchase custom songs through your referrals
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            value={refLink}
            readOnly
            className="font-mono text-sm"
          />
          <Button
            variant="outline"
            size="icon"
            onClick={handleCopy}
            title="Copy link"
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={handleShare}
            className="flex-1"
            variant="default"
          >
            <Share2 className="h-4 w-4 mr-2" />
            Share Referral Link
          </Button>
          
          <Button
            onClick={handleRotate}
            variant="outline"
            disabled={isRotating}
            title="Generate new referral code (old link will stop working)"
          >
            <RefreshCw className={`h-4 w-4 ${isRotating ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        <div className="bg-muted/50 p-3 rounded-lg">
          <h4 className="font-medium text-sm mb-2">Referral Commission Structure:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• <strong>Level 1 (Direct):</strong> 15% commission on supporter upgrades</li>
            <li>• <strong>Level 2 (Indirect):</strong> 10% commission on their referrals</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};