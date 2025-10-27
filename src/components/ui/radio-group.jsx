import * as React from "react"
import { Circle } from "lucide-react"

import { cn } from "@/lib/utils"

const RadioGroupContext = React.createContext(null);

const RadioGroup = React.forwardRef(({ className, value, onValueChange, ...props }, ref) => {
  return (
    <RadioGroupContext.Provider value={{ name: props.name, selectedValue: value, onValueChange }}>
      <div
        ref={ref}
        className={cn("grid gap-2", className)}
        {...props}
        role="radiogroup"
      />
    </RadioGroupContext.Provider>
  )
})
RadioGroup.displayName = "RadioGroup"

const RadioGroupItem = React.forwardRef(({ className, value, ...props }, ref) => {
  const context = React.useContext(RadioGroupContext);
  if (!context) {
    throw new Error("RadioGroupItem must be used within a RadioGroup");
  }
  const { selectedValue, onValueChange } = context;
  const isChecked = selectedValue === value;

  return (
    <button
      ref={ref}
      type="button"
      role="radio"
      aria-checked={isChecked}
      data-state={isChecked ? 'checked' : 'unchecked'}
      onClick={() => onValueChange && onValueChange(value)}
      className={cn(
        "aspect-square h-4 w-4 rounded-full border border-primary text-primary ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      {isChecked && (
        <div className="flex items-center justify-center">
          <Circle className="h-2.5 w-2.5 fill-current text-current" />
        </div>
      )}
    </button>
  )
})
RadioGroupItem.displayName = "RadioGroupItem"

export { RadioGroup, RadioGroupItem }