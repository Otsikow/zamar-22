import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle, ArrowLeft, Heart } from "lucide-react";

export default function DonationCancel() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-2xl mx-auto text-center space-y-8">
        {/* Cancel Icon */}
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center">
            <XCircle className="w-12 h-12 text-orange-600 dark:text-orange-400" />
          </div>
        </div>

        {/* Main Message */}
        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-foreground">
            Donation Cancelled
          </h1>
          <p className="text-xl text-muted-foreground">
            Your donation was cancelled. No payment was processed.
          </p>
        </div>

        {/* Information Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-center gap-2">
              <Heart className="w-5 h-5 text-primary" />
              Your Support Still Matters
            </CardTitle>
            <CardDescription>
              Even though this donation was cancelled, we appreciate your heart to give
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              If you experienced any issues during checkout or would like to try a different payment method, 
              you can always try again. Your support helps us create meaningful Christian music and reach 
              communities around the world.
            </p>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg">
            <Link to="/donate">
              <Heart className="w-4 h-4 mr-2" />
              Try Again
            </Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link to="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
          </Button>
        </div>

        {/* Support Contact */}
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              Encountered an issue during checkout?{" "}
              <Link 
                to="/contact" 
                className="text-primary hover:underline font-medium"
              >
                Contact our support team
              </Link>
              {" "}and we'll be happy to help.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}