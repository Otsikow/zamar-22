import { useSearchParams, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Heart, Home, Share2 } from "lucide-react";
import { toast } from "sonner";

export default function DonationSuccess() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");

  const handleShare = async () => {
    try {
      await navigator.share({
        title: "I just supported Zamar Songs!",
        text: "Join me in supporting Christian music creation and outreach.",
        url: window.location.origin,
      });
    } catch (error) {
      // Fallback to copying URL
      navigator.clipboard.writeText(window.location.origin);
      toast.success("Link copied to clipboard!");
    }
  };

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-2xl mx-auto text-center space-y-8">
        {/* Success Icon */}
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
            <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
          </div>
        </div>

        {/* Main Message */}
        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-foreground">
            Thank You! 🙏
          </h1>
          <p className="text-xl text-muted-foreground">
            Your generous donation has been received successfully.
          </p>
        </div>

        {/* Donation Details */}
        {sessionId && (
          <Card className="border-green-200 dark:border-green-800">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                <Heart className="w-5 h-5 text-red-500" />
                Donation Confirmation
              </CardTitle>
              <CardDescription>
                Session ID: {sessionId}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Your donation has been processed successfully. You should receive an email receipt shortly.
              </p>
            </CardContent>
          </Card>
        )}

        {/* What Happens Next */}
        <Card>
          <CardHeader>
            <CardTitle>What happens next?</CardTitle>
          </CardHeader>
          <CardContent className="text-left space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-sm font-semibold text-primary">1</span>
              </div>
              <p className="text-muted-foreground">
                Your donation will help us create more inspiring Christian music
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-sm font-semibold text-primary">2</span>
              </div>
              <p className="text-muted-foreground">
                You'll receive an email receipt for your records
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-sm font-semibold text-primary">3</span>
              </div>
              <p className="text-muted-foreground">
                Your support helps us reach more communities worldwide
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg">
            <Link to="/">
              <Home className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
          </Button>
          <Button variant="outline" size="lg" onClick={handleShare}>
            <Share2 className="w-4 h-4 mr-2" />
            Share with Friends
          </Button>
        </div>

        {/* Support Contact */}
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              Need help or have questions about your donation?{" "}
              <Link 
                to="/contact" 
                className="text-primary hover:underline font-medium"
              >
                Contact our support team
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}