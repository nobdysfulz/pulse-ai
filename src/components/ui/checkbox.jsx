
import * as React from "react"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

const Checkbox = React.forwardRef(({ className, ...props }, ref) => (
  <button
    type="button"
    role="checkbox"
    aria-checked={props.checked}
    data-state={props.checked ? "checked" : "unchecked"}
    className={cn(
      "peer h-4 w-4 shrink-0 rounded-sm border border-[#E2E8F0] focus:outline-none focus:ring-0 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-[#7C3AED] data-[state=checked]:border-[#7C3AED] data-[state=checked]:text-white",
      className
    )}
    onClick={() => props.onCheckedChange?.(!props.checked)}
    ref={ref}
    {...props}
  >
    {props.checked && (
      <Check className="h-3 w-3 text-white" />
    )}
  </button>
))
Checkbox.displayName = "Checkbox"

export { Checkbox }
