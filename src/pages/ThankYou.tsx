import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Library, Home } from "lucide-react";
import { Link } from "react-router-dom";
import Footer from "@/components/sections/Footer";

const ThankYou = () => {
  return (
    <div className="min-h-screen bg-background">
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-2xl">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-primary/20 rounded-full">
                <CheckCircle className="w-16 h-16 text-primary" />
              </div>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-playfair font-bold text-foreground mb-6">
              🎉 Thank You!
            </h1>
            
            <h2 className="text-xl md:text-2xl font-playfair text-primary mb-6">
              Your custom song request has been received.
            </h2>
            
            <p className="text-lg text-muted-foreground font-inter leading-relaxed">
              We'll get started right away. You'll receive a confirmation email and can 
              track your request in your Library.
            </p>
          </div>

          {/* Confirmation Card */}
          <Card className="bg-gradient-card border-primary/20 mb-8">
            <CardContent className="p-8 text-center">
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-2 text-primary">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-inter font-medium">Request Submitted Successfully</span>
                </div>
                
                <div className="text-sm text-muted-foreground font-inter space-y-2">
                  <p>✓ Confirmation email sent</p>
                  <p>✓ Payment processed</p>
                  <p>✓ Production team notified</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="space-y-4">
            <Button asChild size="lg" className="w-full">
              <Link to="/library">
                <Library className="w-5 h-5 mr-2" />
                Go to My Library
              </Link>
            </Button>
            
            <Button asChild variant="outline" size="lg" className="w-full border-primary text-primary hover:bg-primary/10">
              <Link to="/">
                <Home className="w-5 h-5 mr-2" />
                Back to Homepage
              </Link>
            </Button>
          </div>

          {/* Additional Info */}
          <div className="mt-12 text-center">
            <p className="text-sm text-muted-foreground font-inter">
              Questions? Email us at{" "}
              <a href="mailto:support@zamar.com" className="text-primary hover:underline">
                support@zamar.com
              </a>
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ThankYou;