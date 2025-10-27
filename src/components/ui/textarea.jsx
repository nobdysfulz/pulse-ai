import * as React from "react"
import { cn } from "@/lib/utils"

const Textarea = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[80px] w-full rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-sm text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none focus:ring-0 focus:border-[#7C3AED] disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-[#F8FAFC]",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }