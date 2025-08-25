import { supabase } from "@/integrations/supabase/client";

// Password strength scoring
export function passwordScore(password: string): number {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return score; // 0-5
}

export function getPasswordStrength(score: number): {
  label: string;
  color: string;
  className: string;
} {
  switch (score) {
    case 0:
    case 1:
      return {
        label: "Very weak",
        color: "hsl(var(--destructive))",
        className: "bg-destructive"
      };
    case 2:
      return {
        label: "Weak", 
        color: "hsl(var(--destructive))",
        className: "bg-destructive"
      };
    case 3:
      return {
        label: "Fair",
        color: "hsl(var(--warning))",
        className: "bg-yellow-500"
      };
    case 4:
      return {
        label: "Good",
        color: "hsl(var(--primary))",
        className: "bg-primary"
      };
    case 5:
      return {
        label: "Strong",
        color: "hsl(var(--primary))",
        className: "bg-primary"
      };
    default:
      return {
        label: "Very weak",
        color: "hsl(var(--destructive))",
        className: "bg-destructive"
      };
  }
}

// Change password (for logged in users)
export async function changePassword(
  currentEmail: string, 
  currentPassword: string, 
  newPassword: string
) {
  // 1) Re-auth to confirm the user
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: currentEmail,
    password: currentPassword,
  });
  
  if (signInError) {
    throw new Error('Current password is incorrect.');
  }

  // 2) Update password
  const { data, error } = await supabase.auth.updateUser({ 
    password: newPassword 
  });
  
  if (error) throw error;

  // 3) Sign out other sessions for safety
  await supabase.auth.signOut({ scope: 'others' });

  return data.user;
}

// Send reset email
export async function sendResetEmail(email: string) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/update-password`
  });
  
  if (error) throw error;
  return data;
}

// Set new password from reset link
export async function setNewPassword(newPassword: string) {
  const { data, error } = await supabase.auth.updateUser({ 
    password: newPassword 
  });
  
  if (error) throw error;
  
  // Force fresh session
  await supabase.auth.refreshSession();
  return data.user;
}

// Validate password meets minimum requirements
export function isPasswordValid(password: string): boolean {
  return password.length >= 8 && passwordScore(password) >= 3;
}