import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, ArrowRight, Download, Star } from "lucide-react";
import Header from "@/components/navigation/Header";
import Footer from "@/components/sections/Footer";
import { useTranslation } from "@/contexts/TranslationContext";

const PaymentSuccess = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [loading, setLoading] = useState(true);
  const [orderDetails, setOrderDetails] = useState<any>(null);

  useEffect(() => {
    // In a real implementation, you might want to verify the session
    // and get order details from your backend
    setLoading(false);
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Confirming your payment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-2xl">
          {/* Success Header */}
          <div className="text-center mb-12">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-green-100 dark:bg-green-900/20 rounded-full">
                <CheckCircle className="w-16 h-16 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <h1 className="text-3xl md:text-4xl font-playfair font-bold text-foreground mb-4">
              {t('payment.success_title', 'Payment Successful!')}
            </h1>
            <p className="text-lg text-muted-foreground">
              {t('payment.success_description', 'Thank you for your purchase. Your order has been processed successfully.')}
            </p>
          </div>

          {/* Order Confirmation Card */}
          <Card className="bg-gradient-card border-border mb-8">
            <CardHeader className="text-center">
              <CardTitle className="text-xl font-playfair text-foreground">
                {t('payment.order_confirmed', 'Order Confirmed')}
              </CardTitle>
              {sessionId && (
                <Badge variant="outline" className="mx-auto mt-2">
                  Order #{sessionId.slice(-8)}
                </Badge>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center space-y-2">
                <p className="text-muted-foreground">
                  {t('payment.confirmation_email', 'A confirmation email has been sent to your registered email address.')}
                </p>
                <p className="text-muted-foreground">
                  {t('payment.processing_time', 'Please allow a few minutes for the transaction to be fully processed.')}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card className="bg-accent/10 border-primary/10 mb-8">
            <CardContent className="p-6">
              <h3 className="text-lg font-playfair font-semibold text-foreground mb-4 flex items-center gap-2">
                <Star className="w-5 h-5 text-primary" />
                {t('payment.what_next', 'What happens next?')}
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-muted-foreground">
                    {t('payment.step_1', 'Your account has been updated with your new purchase benefits')}
                  </p>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-muted-foreground">
                    {t('payment.step_2', 'For custom songs, our team will contact you within 24 hours to discuss your requirements')}
                  </p>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-muted-foreground">
                    {t('payment.step_3', 'You can track your orders and manage your account in your dashboard')}
                  </p>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="hero" size="lg" asChild>
              <Link to="/profile" className="flex items-center gap-2">
                {t('payment.view_dashboard', 'View Dashboard')}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to="/songs" className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                {t('payment.browse_music', 'Browse Music')}
              </Link>
            </Button>
          </div>

          {/* Support Section */}
          <div className="text-center mt-12 pt-8 border-t border-border">
            <p className="text-muted-foreground mb-4">
              {t('payment.need_help', 'Need help or have questions about your order?')}
            </p>
            <Button variant="outline" asChild>
              <Link to="/contact">
                {t('payment.contact_support', 'Contact Support')}
              </Link>
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PaymentSuccess;