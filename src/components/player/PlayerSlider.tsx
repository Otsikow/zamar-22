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
  // Use design tokens (primary) for active color to match theme
  const trackBase =
    "relative w-full grow overflow-hidden rounded-full cursor-pointer";
  const trackBg = "bg-muted"; // token-based neutral track
  const thickness = "h-[12px]"; // thick bar

  return (
    <SliderPrimitive.Root
      className={cn(
        "relative flex w-full touch-none select-none items-center",
        className
      )}
      {...props}
    >
      {/* Track */}
      <SliderPrimitive.Track
        className={cn(trackBase, trackBg, thickness, "shadow-inner")}
      >
        {/* Filled range */}
        <SliderPrimitive.Range
          className={cn(
            "absolute h-full rounded-full bg-primary ring-1 ring-primary/30"
          )}
        />
      </SliderPrimitive.Track>

      {/* Radio-button Thumb */}
      <SliderPrimitive.Thumb
        className={cn(
          "group relative -mt-[1px] h-6 w-6 rounded-full border-2",
          "border-primary bg-card shadow-md transition-transform focus:outline-none",
          "hover:scale-[1.04] active:scale-[0.98] focus-visible:ring-4 focus-visible:ring-primary/30"
        )}
        aria-label="Slider handle"
      >
        {/* outer glow ring on focus */}
        <span
          className={cn(
            "pointer-events-none absolute inset-0 rounded-full",
            "ring-0 group-focus-visible:ring-8 ring-primary/20 transition-[box-shadow]"
          )}
        />
        {/* inner dot (the 'radio' fill) */}
        <span
          className={cn(
            "pointer-events-none absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full",
            "bg-primary",
            // show the dot on hover/focus/drag for that radio feel
            "scale-0 group-hover:scale-100 group-focus-visible:scale-100 group-active:scale-100 transition-transform"
          )}
        />
      </SliderPrimitive.Thumb>
    </SliderPrimitive.Root>
  );
}
