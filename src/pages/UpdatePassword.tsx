import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, AlertCircle, CheckCircle } from "lucide-react";
import { setNewPassword, isPasswordValid } from "@/lib/password";
import { PasswordStrengthMeter } from "@/components/ui/password-strength-meter";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/contexts/TranslationContext";
import { supabase } from "@/integrations/supabase/client";

const UpdatePassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);
  const [form, setForm] = useState({
    newPassword: "",
    confirmPassword: ""
  });

  // Check if we have a valid recovery session
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsValidSession(true);
      } else {
        // No valid session, redirect to auth
        navigate("/auth");
      }
    };

    checkSession();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validation
    if (!form.newPassword || !form.confirmPassword) {
      setError("Both password fields are required.");
      setLoading(false);
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    if (!isPasswordValid(form.newPassword)) {
      setError("Password must be at least 8 characters with good strength.");
      setLoading(false);
      return;
    }

    try {
      await setNewPassword(form.newPassword);
      setSuccess(true);
      
      toast({
        title: "✅ Password updated",
        description: "Your password has been successfully changed.",
      });

      // Redirect to login after a short delay
      setTimeout(() => {
        navigate("/auth", { replace: true });
      }, 3000);
    } catch (err: any) {
      setError(err.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = 
    form.newPassword &&
    form.confirmPassword &&
    form.newPassword === form.confirmPassword &&
    isPasswordValid(form.newPassword);

  if (!isValidSession) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verifying session...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background">
        <main className="pt-24 pb-20">
          <div className="container mx-auto px-4 max-w-md">
            <Card className="bg-card border-border shadow-lg">
              <CardContent className="pt-6 text-center">
                <CheckCircle className="h-16 w-16 text-primary mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  Password Updated!
                </h2>
                <p className="text-muted-foreground mb-6">
                  Your password has been successfully changed. You'll be redirected to the login page shortly.
                </p>
                <Button onClick={() => navigate("/auth")} className="w-full">
                  Return to login
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <Shield className="h-12 w-12 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Set New Password</h1>
            <p className="text-muted-foreground">
              Choose a strong password for your account.
            </p>
          </div>

          {/* Update Password Card */}
          <Card className="bg-card border-border shadow-lg">
            <CardHeader>
              <CardTitle>Update Your Password</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {/* New Password */}
                <div>
                  <Label htmlFor="new-password">New Password</Label>
                  <PasswordInput
                    id="new-password"
                    placeholder="Enter your new password"
                    value={form.newPassword}
                    onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                    required
                  />
                  <PasswordStrengthMeter password={form.newPassword} className="mt-2" />
                </div>

                {/* Confirm Password */}
                <div>
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <PasswordInput
                    id="confirm-password"
                    placeholder="Confirm your new password"
                    value={form.confirmPassword}
                    onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                    required
                  />
                  {form.confirmPassword && form.newPassword !== form.confirmPassword && (
                    <p className="text-sm text-destructive mt-1">Passwords do not match</p>
                  )}
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90"
                  disabled={loading || !isFormValid}
                >
                  {loading ? "Setting new password..." : "Set new password"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Password Requirements */}
          <Card className="mt-6 bg-accent/5 border-primary/20">
            <CardContent className="pt-6">
              <h4 className="font-semibold text-primary mb-3">Password Requirements</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• At least 8 characters long</li>
                <li>• Contains uppercase and lowercase letters</li>
                <li>• Contains at least one number</li>
                <li>• Contains at least one special character</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default UpdatePassword;