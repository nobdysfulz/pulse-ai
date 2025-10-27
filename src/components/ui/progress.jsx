
import * as React from "react"
import { cn } from "@/lib/utils"

const Progress = React.forwardRef(({ className, value, indicatorClassName, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "relative h-2 w-full overflow-hidden rounded-full bg-[#E2E8F0]",
      className
    )}
    {...props}
  >
    <div
      className={cn("h-full w-full flex-1 bg-[#6D28D9] transition-all", indicatorClassName)}
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </div>
))
Progress.displayName = "Progress"

export { Progress }
