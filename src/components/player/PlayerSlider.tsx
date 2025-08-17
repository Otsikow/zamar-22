import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "@/lib/utils";

type Props = React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> & {
  variant?: "progress" | "volume";
};

export default function PlayerSlider({
  className,
  variant = "progress",
  ...props
}: Props) {
  const isProgress = variant === "progress";
  
  return (
    <SliderPrimitive.Root
      className={cn(
        "relative flex w-full touch-none select-none items-center cursor-pointer",
        isProgress ? "h-3" : "h-2", // Progress slider is taller
        className
      )}
      {...props}
    >
      {/* Track Background */}
      <SliderPrimitive.Track
        className={cn(
          "relative w-full grow overflow-hidden rounded-full bg-muted/40",
          isProgress ? "h-3" : "h-2"
        )}
      >
        {/* Filled Range - Using brand-gold color */}
        <SliderPrimitive.Range
          className={cn(
            "absolute h-full rounded-full transition-all duration-200",
            "bg-gradient-to-r from-brand-gold to-brand-gold/90",
            "shadow-[0_0_8px_rgba(212,175,55,0.4)]" // Glow effect
          )}
        />
      </SliderPrimitive.Track>

      {/* Enhanced Radio-style Thumb Handle */}
      <SliderPrimitive.Thumb
        className={cn(
          "block rounded-full border-2 border-brand-gold bg-background",
          "shadow-[0_0_0_2px_rgba(212,175,55,0.3),0_2px_8px_rgba(0,0,0,0.15)]",
          "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-gold/30",
          "disabled:pointer-events-none disabled:opacity-50",
          "transition-all duration-200 ease-out",
          "hover:scale-110 hover:border-brand-gold/80 hover:shadow-[0_0_0_3px_rgba(212,175,55,0.4),0_4px_12px_rgba(0,0,0,0.2)]",
          "active:scale-105 active:border-brand-gold",
          "cursor-grab active:cursor-grabbing",
          // Size based on variant
          isProgress ? "h-5 w-5" : "h-4 w-4"
        )}
        aria-label={`${variant} control`}
      />
    </SliderPrimitive.Root>
  );
}
