import { passwordScore, getPasswordStrength } from "@/lib/password";
import { cn } from "@/lib/utils";

interface PasswordStrengthMeterProps {
  password: string;
  className?: string;
}

export const PasswordStrengthMeter = ({ password, className }: PasswordStrengthMeterProps) => {
  const score = passwordScore(password);
  const strength = getPasswordStrength(score);
  const percentage = (score / 5) * 100;

  if (!password) return null;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex justify-between items-center">
        <span className="text-sm text-muted-foreground">Password strength:</span>
        <span className="text-sm font-medium">{strength.label}</span>
      </div>
      <div className="w-full bg-muted rounded-full h-2">
        <div
          className={cn("h-2 rounded-full transition-all duration-300", strength.className)}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};