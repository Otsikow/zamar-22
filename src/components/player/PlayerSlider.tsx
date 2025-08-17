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
        {/* Filled range with golden color */}
        <SliderPrimitive.Range
          className="absolute h-full rounded-full bg-gradient-to-r from-yellow-400 to-yellow-500 shadow-lg ring-1 ring-yellow-400/50"
        />
      </SliderPrimitive.Track>

      {/* Enhanced Radio-style Thumb with golden styling */}
      <SliderPrimitive.Thumb
        className={cn(
          "block h-6 w-6 md:h-7 md:w-7 rounded-full border-4 border-yellow-400 bg-background",
          "shadow-[0_0_0_3px_hsl(var(--primary)/0.3),0_2px_8px_rgba(0,0,0,0.15),0_0_20px_hsl(var(--primary)/0.2)]",
          "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-yellow-400/30",
          "disabled:pointer-events-none disabled:opacity-50",
          "transition-all duration-200 ease-out",
          "hover:scale-110 hover:shadow-[0_0_0_4px_hsl(var(--primary)/0.4),0_4px_12px_rgba(0,0,0,0.2),0_0_30px_hsl(var(--primary)/0.3)]",
          "cursor-grab active:cursor-grabbing active:scale-105 active:shadow-[0_0_0_2px_hsl(var(--primary)/0.5),0_2px_6px_rgba(0,0,0,0.25)]",
          // Add a subtle glow effect
          "before:absolute before:inset-0 before:rounded-full before:bg-gradient-to-r before:from-yellow-400/20 before:to-yellow-500/20 before:blur-sm before:-z-10"
        )}
        aria-label="Slider handle"
      />
    </SliderPrimitive.Root>
  );
}
