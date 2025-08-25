import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Music, Mail, Lock, User, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/contexts/TranslationContext";
import Footer from "@/components/sections/Footer";
import { ReferralTracker, handleReferralSignup } from '@/components/referrals/ReferralTracker';
import { ForgotPasswordDialog } from "@/components/auth/ForgotPasswordDialog";

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Login form state
  const [loginForm, setLoginForm] = useState({
    email: "",
    password: ""
  });

  // Signup form state
  const [signupForm, setSignupForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: ""
  });

  // Check if user is already authenticated
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/");
      }
    };
    
    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate("/");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginForm.email,
        password: loginForm.password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          setError(t('auth.invalid_credentials', 'Invalid email or password. Please check your credentials and try again.'));
        } else if (error.message.includes("Email not confirmed")) {
          setError(t('auth.email_not_confirmed', 'Please check your email and click the confirmation link before signing in.'));
        } else {
          setError(error.message);
        }
        return;
      }

      toast({
        title: t('auth.welcomeBack', 'Welcome back!'),
        description: t('auth.loginSuccess', 'You have successfully logged in.'),
      });
    } catch (error) {
      console.error("Login error:", error);
      setError(t('errors.unexpected', 'An unexpected error occurred. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validation
    if (signupForm.password !== signupForm.confirmPassword) {
      setError(t('auth.passwords_no_match', 'Passwords do not match.'));
      setLoading(false);
      return;
    }

    if (signupForm.password.length < 6) {
      setError(t('auth.password_min_length', 'Password must be at least 6 characters long.'));
      setLoading(false);
      return;
    }

    try {
      const redirectUrl = `${window.location.origin}/`;
      
      // Get stored referral code
      const refCode = localStorage.getItem('ref_code') || 
                     (document.cookie.match(/ref_code=([^;]+)/)?.[1]);
      
      const { data, error } = await supabase.auth.signUp({
        email: signupForm.email,
        password: signupForm.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            first_name: signupForm.firstName,
            last_name: signupForm.lastName
          }
        }
      });

      if (error) {
        if (error.message.includes("User already registered")) {
          setError(t('auth.user_already_registered', 'This email is already registered. Please try logging in instead.'));
        } else if (error.message.includes("Password should be at least 6 characters")) {
          setError(t('auth.password_min_length', 'Password must be at least 6 characters long.'));
        } else {
          setError(error.message);
        }
        return;
      }

      // BULLETPROOF: Apply referral code using profiles trigger
      if (data?.user?.id && refCode) {
        console.log('Applying referral code via profiles upsert:', { userId: data.user.id, refCode });
        try {
          // This triggers the profiles trigger which will handle referral attribution
          await supabase.from('profiles').upsert({
            id: data.user.id,
            pending_ref_code: refCode
          }, { onConflict: 'id' });
          
          console.log('Referral code applied successfully');
          
          // Clean up stored referral code
          localStorage.removeItem('ref_code');
          document.cookie = 'ref_code=; Max-Age=0; path=/';
        } catch (referralError) {
          console.error('Failed to apply referral code:', referralError);
        }
      }

      toast({
        title: t('auth.account_created', 'Account created!'),
        description: t('auth.check_email', 'Please check your email for a confirmation link.'),
      });

      // Reset form
      setSignupForm({
        email: "",
        password: "",
        confirmPassword: "",
        firstName: "",
        lastName: ""
      });
    } catch (error) {
      console.error("Signup error:", error);
      setError(t('errors.unexpected', 'An unexpected error occurred. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <ReferralTracker />
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-md">
          {/* Back Button */}
          <div className="mb-6">
            <Button variant="outline" size="sm" asChild>
              <Link to="/">
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t('nav.back_home', 'Back to Home')}
              </Link>
            </Button>
          </div>

          {/* Auth Card */}
          <Card className="bg-card border-border shadow-lg">
            <CardHeader className="text-center">
              <div className="flex items-center justify-center mb-4">
                <div className="relative">
                  <Music className="h-12 w-12 text-primary" />
                  <div className="absolute inset-0 bg-primary/20 rounded-full blur-md" />
                </div>
              </div>
              <CardTitle className="text-2xl font-heading text-primary">
                {t('auth.welcome', 'Welcome to Zamar')}
              </CardTitle>
              <p className="text-muted-foreground">
                {t('auth.subtitle', 'Sign in to your account or create a new one')}
              </p>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">{t('auth.login', 'Login')}</TabsTrigger>
                  <TabsTrigger value="signup">{t('auth.signup', 'Sign Up')}</TabsTrigger>
                </TabsList>

                {/* Error Alert */}
                {error && (
                  <Alert variant="destructive" className="mt-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {/* Login Tab */}
                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                      <Label htmlFor="login-email">{t('auth.email', 'Email')}</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="login-email"
                          type="email"
                          placeholder="your@email.com"
                          value={loginForm.email}
                          onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="login-password">{t('auth.password', 'Password')}</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <PasswordInput
                          id="login-password"
                          placeholder="••••••••"
                          value={loginForm.password}
                          onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={loading}
                    >
                      {loading ? t('auth.signing_in', 'Signing in...') : t('auth.signin', 'Sign In')}
                    </Button>
                    
                    {/* Forgot Password Link */}
                    <div className="text-center">
                      <ForgotPasswordDialog />
                    </div>
                  </form>
                </TabsContent>

                {/* Signup Tab */}
                <TabsContent value="signup">
                  <form onSubmit={handleSignup} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="signup-firstName">{t('auth.first_name', 'First Name')}</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="signup-firstName"
                            type="text"
                            placeholder="John"
                            value={signupForm.firstName}
                            onChange={(e) => setSignupForm({ ...signupForm, firstName: e.target.value })}
                            className="pl-10"
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="signup-lastName">{t('auth.last_name', 'Last Name')}</Label>
                        <Input
                          id="signup-lastName"
                          type="text"
                          placeholder="Doe"
                          value={signupForm.lastName}
                          onChange={(e) => setSignupForm({ ...signupForm, lastName: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="signup-email">{t('auth.email', 'Email')}</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="your@email.com"
                          value={signupForm.email}
                          onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="signup-password">{t('auth.password', 'Password')}</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <PasswordInput
                          id="signup-password"
                          placeholder="••••••••"
                          value={signupForm.password}
                          onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                          className="pl-10"
                          required
                          minLength={6}
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="signup-confirmPassword">{t('auth.confirm_password', 'Confirm Password')}</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <PasswordInput
                          id="signup-confirmPassword"
                          placeholder="••••••••"
                          value={signupForm.confirmPassword}
                          onChange={(e) => setSignupForm({ ...signupForm, confirmPassword: e.target.value })}
                          className="pl-10"
                          required
                          minLength={6}
                        />
                      </div>
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={loading}
                    >
                      {loading ? t('auth.creating_account', 'Creating account...') : t('auth.create_account', 'Create Account')}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>

              {/* Additional Actions */}
              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  {t('auth.agree', 'By signing up, you agree to our')} {" "}
                  <Link 
                    to="/terms" 
                    className="text-primary hover:text-primary/80 underline underline-offset-4 transition-colors"
                  >
                    {t('auth.terms_of_service', 'terms of service')}
                  </Link>
                  {" "}{t('auth.and', 'and')}{" "}
                  <Link 
                    to="/privacy" 
                    className="text-primary hover:text-primary/80 underline underline-offset-4 transition-colors"
                  >
                    {t('auth.privacy_policy', 'privacy policy')}
                  </Link>
                  .
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card className="mt-6 bg-accent/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Music className="h-5 w-5 text-primary" />
                <div>
                  <h4 className="font-semibold text-primary">{t('auth.whyCreateAccountTitle', 'Why create an account?')}</h4>
                  <p className="text-sm text-muted-foreground">
                    {t('auth.whyCreateAccountDescription', 'Access custom song requests, view your library, and track your orders.')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Auth;