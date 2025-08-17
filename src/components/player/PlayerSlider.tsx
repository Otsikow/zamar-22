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
  return (
    <SliderPrimitive.Root
      className={cn(
        "relative flex w-full h-[12px] overflow-visible touch-none select-none items-center cursor-pointer",
        className
      )}
      {...props}
    >
      {/* Track */}
      <SliderPrimitive.Track
        className="relative w-full grow overflow-hidden rounded-full bg-muted shadow-inner h-[12px]"
      >
        {/* Filled range with primary gradient */}
        <SliderPrimitive.Range
          className="absolute h-full rounded-full bg-gradient-to-r from-primary/90 to-primary shadow-lg ring-1 ring-primary/50"
        />
      </SliderPrimitive.Track>

      {/* Enhanced Radio-style Thumb with professional styling */}
      <SliderPrimitive.Thumb
        className={cn(
          "relative block h-5 w-5 md:h-6 md:w-6 rounded-full border-2 border-primary bg-background",
          "shadow-[0_2px_10px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.4)]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
          "disabled:pointer-events-none disabled:opacity-50",
          "transition-all duration-200 ease-out transform-gpu",
          "hover:scale-110 hover:border-primary/80",
          "cursor-grab active:cursor-grabbing active:scale-105",
          "after:absolute after:inset-1 after:rounded-full after:bg-primary after:scale-0 after:transition-transform after:duration-200",
          "hover:after:scale-75 active:after:scale-90",
          // Ensure it's always visible and interactive
          "z-10 pointer-events-auto"
        )}
        aria-label="Slider handle"
      />
    </SliderPrimitive.Root>
  );
}
