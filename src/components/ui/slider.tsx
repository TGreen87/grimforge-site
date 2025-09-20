import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "@/lib/utils"

type BaseSliderProps = React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>

type ExtendedSliderProps = BaseSliderProps & {
  thumbLabels?: (string | undefined)[]
}

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  ExtendedSliderProps
>(({ className, value, defaultValue, thumbLabels, ...props }, ref) => {
  const resolvedValue = React.useMemo(() => {
    if (Array.isArray(value)) return value
    if (Array.isArray(defaultValue)) return defaultValue
    return [typeof value === "number" ? value : typeof defaultValue === "number" ? defaultValue : 0]
  }, [value, defaultValue])

  const thumbCount = resolvedValue.length || 1
  const ariaLabelProp = (props as Record<string, unknown>)["aria-label"]
  const computedThumbLabels = thumbLabels ?? (
    Array.from({ length: thumbCount }, () => ariaLabelProp as string | undefined)
  )
  const ariaLabelledBy = (props as Record<string, unknown>)["aria-labelledby"] as string | undefined
  const ariaDescribedBy = (props as Record<string, unknown>)["aria-describedby"] as string | undefined

  return (
    <SliderPrimitive.Root
      ref={ref}
      value={value}
      defaultValue={defaultValue}
      className={cn(
        "relative flex w-full touch-none select-none items-center",
        className
      )}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary">
        <SliderPrimitive.Range className="absolute h-full bg-primary" />
      </SliderPrimitive.Track>
      {Array.from({ length: thumbCount }).map((_, index) => (
        <SliderPrimitive.Thumb
          key={index}
          aria-label={computedThumbLabels[index] ?? computedThumbLabels[0] ?? undefined}
          aria-labelledby={ariaLabelledBy}
          aria-describedby={ariaDescribedBy}
          className="block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
        />
      ))}
    </SliderPrimitive.Root>
  )
})
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }
