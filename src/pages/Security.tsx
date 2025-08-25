import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Shield, AlertCircle } from "lucide-react";
import { changePassword, isPasswordValid, passwordScore } from "@/lib/password";
import { PasswordStrengthMeter } from "@/components/ui/password-strength-meter";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/contexts/TranslationContext";

const Security = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validation
    if (!form.currentPassword || !form.newPassword || !form.confirmPassword) {
      setError("All fields are required.");
      setLoading(false);
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      setError("New passwords do not match.");
      setLoading(false);
      return;
    }

    if (form.currentPassword === form.newPassword) {
      setError("New password must be different from current password.");
      setLoading(false);
      return;
    }

    if (!isPasswordValid(form.newPassword)) {
      setError("New password must be at least 8 characters with good strength.");
      setLoading(false);
      return;
    }

    try {
      if (!user?.email) {
        throw new Error("User email not found");
      }

      await changePassword(user.email, form.currentPassword, form.newPassword);
      
      toast({
        title: "✅ Password updated",
        description: "Your password has been successfully changed.",
      });

      // Clear form
      setForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
    } catch (err: any) {
      setError(err.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = 
    form.currentPassword &&
    form.newPassword &&
    form.confirmPassword &&
    form.newPassword === form.confirmPassword &&
    form.newPassword !== form.currentPassword &&
    isPasswordValid(form.newPassword);

  return (
    <div className="min-h-screen bg-background">
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-2xl">
          {/* Back Button */}
          <div className="mb-6">
            <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>

          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Shield className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold text-foreground">Security</h1>
            </div>
            <p className="text-muted-foreground">
              Manage your account security settings and password.
            </p>
          </div>

          {/* Change Password Card */}
          <Card className="bg-card border-border shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl">Change Password</CardTitle>
              <p className="text-sm text-muted-foreground">
                Update your password to keep your account secure.
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {/* Current Password */}
                <div>
                  <Label htmlFor="current-password">Current Password</Label>
                  <PasswordInput
                    id="current-password"
                    placeholder="Enter your current password"
                    value={form.currentPassword}
                    onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
                    required
                  />
                </div>

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
                  {loading ? "Updating password..." : "Update password"}
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
                <li>• Must be different from your current password</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Security;