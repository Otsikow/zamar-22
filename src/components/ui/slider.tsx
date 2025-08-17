import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "@/lib/utils"

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex w-full h-[12px] overflow-visible touch-none select-none items-center cursor-pointer",
      className
    )}
    {...props}
  >
    <SliderPrimitive.Track
      className="relative w-full grow overflow-hidden rounded-full bg-muted shadow-inner h-[12px]"
    >
      <SliderPrimitive.Range
        className="absolute h-full rounded-full bg-primary ring-1 ring-primary/30"
      />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb
      className="block h-6 w-6 md:h-7 md:w-7 rounded-full border-4 border-primary bg-background shadow-[0_0_0_3px_rgba(0,0,0,0.3),0_2px_8px_rgba(0,0,0,0.15)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30 disabled:pointer-events-none disabled:opacity-50 transition-all duration-200 hover:scale-110 hover:shadow-[0_0_0_4px_rgba(0,0,0,0.4),0_4px_12px_rgba(0,0,0,0.2)] cursor-grab active:cursor-grabbing active:scale-105"
      aria-label="Slider handle"
    />
  </SliderPrimitive.Root>
))
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }