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
      "relative flex w-full touch-none select-none items-center cursor-pointer",
      className
    )}
    {...props}
  >
    <SliderPrimitive.Track
      className="relative w-full grow overflow-hidden rounded-full"
      style={{
        height: '12px', // thicker than before
        backgroundColor: '#1f1f1f', // deep dark background
      }}
    >
      <SliderPrimitive.Range
        className="absolute rounded-full"
        style={{
          height: '100%',
          backgroundColor: '#EAB308', // Zamar gold
        }}
      />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb
      className="block rounded-full transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-grab active:cursor-grabbing hover:scale-110"
      style={{
        width: '24px',
        height: '24px',
        border: '3px solid #EAB308',         // Golden border
        backgroundColor: '#1a1a1a',          // Slightly lighter dark center for visibility
        boxShadow: '0 0 0 1px #EAB308, 0 4px 12px rgba(234, 179, 8, 0.3)', // Golden glow + shadow
      }}
    />
  </SliderPrimitive.Root>
))
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }