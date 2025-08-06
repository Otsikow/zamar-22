import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Share2, 
  Facebook, 
  MessageCircle, 
  Twitter, 
  Instagram, 
  Linkedin, 
  Copy,
  Mail,
  Download
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface SocialShareProps {
  title: string;
  description?: string;
  url?: string;
  hashtags?: string[];
  trigger?: React.ReactNode;
}

const SocialShare: React.FC<SocialShareProps> = ({
  title,
  description = "",
  url = window.location.href,
  hashtags = [],
  trigger
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const shareText = `${title} ${description ? `- ${description}` : ''}`;
  const hashtagString = hashtags.map(tag => `#${tag}`).join(' ');
  const fullText = `${shareText} ${hashtagString}`.trim();

  const shareUrls = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(fullText)}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(fullText)}&url=${encodeURIComponent(url)}`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(`${fullText} ${url}`)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}&summary=${encodeURIComponent(description)}`,
    telegram: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(fullText)}`,
    reddit: `https://reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`,
    email: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${fullText}\n\n${url}`)}`,
    tiktok: `https://www.tiktok.com/` // TikTok doesn't have direct URL sharing, opens app
  };

  const handleShare = (platform: keyof typeof shareUrls) => {
    if (platform === 'tiktok') {
      // For TikTok, copy the content and open TikTok
      handleCopyLink();
      window.open(shareUrls.tiktok, '_blank');
      toast({
        title: "Opening TikTok",
        description: "Content copied to clipboard. Paste it in your TikTok post!",
      });
    } else {
      window.open(shareUrls[platform], '_blank', 'width=600,height=400');
    }
    setIsOpen(false);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${fullText} ${url}`);
      toast({
        title: "Copied to clipboard",
        description: "The link and content have been copied to your clipboard.",
      });
      setIsOpen(false);
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Please copy the link manually.",
        variant: "destructive",
      });
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: description,
          url,
        });
        setIsOpen(false);
      } catch (error) {
        // User cancelled or error occurred
      }
    }
  };

  const platforms = [
    {
      name: "Facebook",
      icon: Facebook,
      color: "text-blue-600 hover:text-blue-700",
      onClick: () => handleShare('facebook')
    },
    {
      name: "WhatsApp", 
      icon: MessageCircle,
      color: "text-green-600 hover:text-green-700",
      onClick: () => handleShare('whatsapp')
    },
    {
      name: "Twitter",
      icon: Twitter,
      color: "text-sky-500 hover:text-sky-600",
      onClick: () => handleShare('twitter')
    },
    {
      name: "TikTok",
      icon: () => (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-.88-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43V7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.43z"/>
        </svg>
      ),
      color: "text-black hover:text-gray-800",
      onClick: () => handleShare('tiktok')
    },
    {
      name: "LinkedIn",
      icon: Linkedin,
      color: "text-blue-700 hover:text-blue-800",
      onClick: () => handleShare('linkedin')
    },
    {
      name: "Telegram",
      icon: () => (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.568 8.16l-1.61 7.59c-.12.54-.44.67-.89.42l-2.46-1.82-1.18 1.14c-.13.13-.24.24-.49.24l.17-2.49 4.53-4.09c.2-.18-.04-.28-.3-.1L9.39 13.9l-2.43-.76c-.53-.17-.54-.53.11-.78l9.49-3.66c.44-.17.82.1.68.78z"/>
        </svg>
      ),
      color: "text-blue-500 hover:text-blue-600",
      onClick: () => handleShare('telegram')
    },
    {
      name: "Reddit",
      icon: () => (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
        </svg>
      ),
      color: "text-orange-600 hover:text-orange-700",
      onClick: () => handleShare('reddit')
    },
    {
      name: "Email",
      icon: Mail,
      color: "text-gray-600 hover:text-gray-700",
      onClick: () => handleShare('email')
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="lg">
            <Share2 className="w-5 h-5 mr-2" />
            Share
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Share "{title}"
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 py-4">
          {platforms.map((platform) => {
            const IconComponent = platform.icon;
            return (
              <Button
                key={platform.name}
                variant="outline"
                className={`h-12 justify-start gap-3 ${platform.color}`}
                onClick={platform.onClick}
              >
                <IconComponent className="w-5 h-5" />
                {platform.name}
              </Button>
            );
          })}
          
          <Button
            variant="outline"
            className="h-12 justify-start gap-3 text-gray-600 hover:text-gray-700"
            onClick={handleCopyLink}
          >
            <Copy className="w-5 h-5" />
            Copy Link
          </Button>
          
          {navigator.share && (
            <Button
              variant="outline"
              className="h-12 justify-start gap-3 text-primary hover:text-primary/80"
              onClick={handleNativeShare}
            >
              <Download className="w-5 h-5" />
              More Options
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SocialShare;