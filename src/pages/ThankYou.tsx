import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Library, Home, Heart } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "@/contexts/TranslationContext";
import Footer from "@/components/sections/Footer";

const ThankYou = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const type = searchParams.get('type');
  const requestId = searchParams.get('request_id');
  
  // Only show as donation if explicitly marked as donation
  const isDonation = type === 'donation';
  const isCustomSong = type === 'custom_song';
  const hasPayment = !!sessionId; // Only show payment processed if we have a session ID

  return (
    <div className="min-h-screen bg-background">
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-2xl">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="flex justify-center mb-6">
              <div className={`p-4 rounded-full ${isDonation ? 'bg-green-500/20' : 'bg-primary/20'}`}>
                {isDonation ? (
                  <Heart className={`w-16 h-16 ${isDonation ? 'text-green-500' : 'text-primary'}`} />
                ) : (
                  <CheckCircle className="w-16 h-16 text-primary" />
                )}
              </div>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-playfair font-bold text-transparent bg-gradient-primary bg-clip-text mb-6">
              {isDonation ? t('thank_you.donation_title', '🎉 Thank You!') : '🎉 Thank You!'}
            </h1>
            
            <h2 className="text-xl md:text-2xl font-playfair text-primary mb-6">
              {isDonation 
                ? t('thank_you.donation_subtitle', 'Your generous donation has been received.')
                : isCustomSong && hasPayment
                  ? 'Your custom song request has been received and paid for.'
                  : 'Your request has been submitted.'
              }
            </h2>
            
            <p className="text-lg text-muted-foreground font-inter leading-relaxed">
              {isDonation 
                ? t('thank_you.donation_description', 'Your contribution helps us create meaningful music that inspires, heals, and brings hope to communities around the world.')
                : isCustomSong && hasPayment
                  ? 'Thank you for your payment! We\'ll get started on your custom song right away. You\'ll receive a confirmation email and can track your request in your Library.'
                  : 'Your request has been submitted but payment is still required to begin production.'
              }
            </p>
          </div>

          {/* Confirmation Card */}
          <Card className="bg-gradient-card border-primary/20 mb-8">
            <CardHeader>
              <CardTitle className="text-2xl font-playfair text-foreground flex items-center gap-2">
                {isDonation ? (
                  <>
                    <Heart className="w-6 h-6 text-primary" />
                    {t('thank_you.donation_confirmed', 'Donation Confirmed')}
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-6 h-6 text-primary" />
                    Request Submitted Successfully
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isDonation ? (
                <div>
                  <p className="text-muted-foreground font-inter mb-4">
                    {t('thank_you.confirmation_text', 'Your donation has been successfully processed. You should receive a confirmation email shortly with your receipt.')}
                  </p>
                  
                  {sessionId && (
                    <div className="text-sm text-muted-foreground mb-4">
                      <strong>{t('thank_you.reference', 'Reference:')} </strong>
                      <span className="font-mono">{sessionId}</span>
                    </div>
                  )}

                  <div className="pt-4 border-t border-primary/20">
                    <h3 className="font-semibold text-foreground mb-2">
                      {t('thank_you.what_happens_next', 'What happens next?')}
                    </h3>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• {t('thank_you.email_receipt', 'You\'ll receive an email receipt for your records')}</li>
                      <li>• {t('thank_you.funds_used', 'Your donation will be used to create and distribute meaningful music')}</li>
                      <li>• {t('thank_you.updates', 'We\'ll keep you updated on the impact of your contribution')}</li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <div className="space-y-4">
                    <div className="flex items-center justify-center gap-2 text-primary">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-inter font-medium">
                        {hasPayment ? 'Request Submitted & Paid Successfully' : 'Request Submitted Successfully'}
                      </span>
                    </div>
                    
                    <div className="text-sm text-muted-foreground font-inter space-y-2">
                      <p>✓ Request submitted</p>
                      {hasPayment && (
                        <>
                          <p>✓ Payment processed</p>
                          <p>✓ Production team notified</p>
                          <p>✓ Confirmation email sent</p>
                        </>
                      )}
                      {!hasPayment && (
                        <p className="text-amber-600">⏳ Payment required to begin production</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="space-y-4">
            {isDonation ? (
              <>
                <Button asChild size="lg" className="w-full">
                  <Link to="/">
                    <Home className="w-5 h-5 mr-2" />
                    {t('thank_you.return_home', 'Return Home')}
                  </Link>
                </Button>
                
                <Button asChild variant="outline" size="lg" className="w-full border-primary text-primary hover:bg-primary/10">
                  <Link to="/songs">
                    {t('thank_you.browse_songs', 'Browse Songs')}
                  </Link>
                </Button>
              </>
            ) : (
              <>
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
              </>
            )}
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