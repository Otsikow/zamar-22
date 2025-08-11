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
        "relative flex w-full h-[12px] overflow-visible touch-none select-none items-center",
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

      {/* Radio-style Thumb consistent with app sliders */}
      <SliderPrimitive.Thumb
        className={cn(
          "block h-5 w-5 md:h-6 md:w-6 rounded-full border-4 border-primary bg-background",
          "shadow-[0_0_0_2px_rgba(0,0,0,0.25)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30",
          "disabled:pointer-events-none disabled:opacity-50 transition-transform duration-150 hover:scale-105"
        )}
        aria-label="Slider handle"
      />
    </SliderPrimitive.Root>
  );
}
