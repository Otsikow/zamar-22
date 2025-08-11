import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PasswordInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, ...props }, ref) => {
    const [show, setShow] = React.useState(false);

    return (
      <div className="relative">
        <input
          ref={ref}
          type={show ? "text" : "password"}
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm pr-10",
            className
          )}
          {...props}
        />
        <button
          type="button"
          aria-label={show ? "Hide password" : "Show password"}
          onClick={() => setShow((s) => !s)}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-muted-foreground hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    );
  }
);
PasswordInput.displayName = "PasswordInput";

export { PasswordInput }; 
