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
        height: '12px',
        backgroundColor: 'hsl(var(--secondary))',
      }}
    >
      <SliderPrimitive.Range
        className="absolute rounded-full"
        style={{
          height: '100%',
          backgroundColor: 'hsl(var(--primary))',
        }}
      />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb
      className="block rounded-full transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-grab active:cursor-grabbing hover:scale-110"
      style={{
        width: '24px',
        height: '24px',
        border: '2px solid hsl(var(--primary))',
        backgroundColor: 'hsl(var(--primary))',
        backgroundImage: 'radial-gradient(circle at center, hsl(0 0% 0%) 0 6px, rgba(0,0,0,0) 7px)',
        boxShadow: '0 0 0 1px hsl(var(--primary)), 0 4px 12px hsl(var(--primary) / 0.3)',
      }}
    />
  </SliderPrimitive.Root>
))
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }