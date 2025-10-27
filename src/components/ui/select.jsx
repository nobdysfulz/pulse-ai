
import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

const Select = React.forwardRef(({ children, value, onValueChange, ...props }, ref) => {
  const [isOpen, setIsOpen] = React.useState(false);

  let selectTrigger = null;
  let selectContent = null;
  const otherChildren = [];

  // Separate direct children into trigger, content, and others
  React.Children.forEach(children, child => {
    if (React.isValidElement(child)) {
      if (child.type === SelectTrigger) {
        selectTrigger = child;
      } else if (child.type === SelectContent) {
        selectContent = child;
      } else {
        otherChildren.push(child);
      }
    } else {
      otherChildren.push(child);
    }
  });

  // Extract the SelectItem children from SelectContent to pass to SelectTrigger
  const selectContentItems = selectContent ? React.Children.toArray(selectContent.props.children) : [];

  return (
    <div className="relative" ref={ref} {...props}>
      {selectTrigger && React.cloneElement(selectTrigger, {
        value,
        onClick: () => setIsOpen(!isOpen),
        isOpen,
        // Pass the actual SelectItem children from SelectContent to the trigger
        selectContentChildren: selectContentItems
      })}
      {isOpen && selectContent && React.cloneElement(selectContent, {
        onValueChange: (val) => {
          onValueChange(val);
          setIsOpen(false);
        },
        onClose: () => setIsOpen(false)
      })}
      {/* Render any other children that are not SelectTrigger or SelectContent */}
      {otherChildren}
    </div>
  );
});
Select.displayName = "Select"

const SelectTrigger = React.forwardRef(({ className, children, value, isOpen, selectContentChildren, ...props }, ref) => {
  const selectValueChild = React.Children.toArray(children).find(
    (child) => child.type === SelectValue
  );

  let displayValue = selectValueChild?.props.placeholder || "Select...";

  if (value !== undefined && value !== null && selectContentChildren && selectContentChildren.length > 0) {
    const selectedItem = selectContentChildren.find(
      (child) => child.type === SelectItem && child.props.value === value
    );
    if (selectedItem) {
      // Handles both simple strings and complex children (like a div with an icon and text)
      displayValue = selectedItem.props.children;
    }
  }

  return (
    <button
      ref={ref}
      type="button"
      className={cn(
        "flex h-10 w-full items-center justify-between rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-sm text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none focus:ring-0 focus:border-[#7C3AED] disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      <span className="block truncate">{displayValue}</span>
      <ChevronDown className={cn("h-4 w-4 opacity-50 transition-transform flex-shrink-0 ml-2", isOpen && "rotate-180")} />
    </button>
  );
});
SelectTrigger.displayName = "SelectTrigger"

const SelectValue = React.forwardRef(({ placeholder, children, ...props }, ref) => (
  <span ref={ref} {...props}>
    {children || placeholder || "Select..."}
  </span>
))
SelectValue.displayName = "SelectValue"

const SelectContent = React.forwardRef(({ className, children, onValueChange, onClose, ...props }, ref) => {
  const contentRef = React.useRef(null);

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (contentRef.current && !contentRef.current.contains(event.target)) {
        onClose?.();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={contentRef}
      className={cn(
        "absolute z-50 min-w-[8rem] w-full overflow-hidden rounded-lg border border-[#E2E8F0] bg-white text-[#1E293B] shadow-lg mt-1 max-h-[300px] overflow-y-auto",
        className
      )}
      {...props}
    >
      <div className="p-1">
        {React.Children.map(children, child => {
          if (child.type === SelectItem) {
            return React.cloneElement(child, { onValueChange });
          }
          return child;
        })}
      </div>
    </div>
  );
})
SelectContent.displayName = "SelectContent"

const SelectItem = React.forwardRef(({ className, children, value, onValueChange, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "relative flex cursor-pointer select-none items-center rounded-md px-2 py-1.5 text-sm outline-none hover:bg-[#F8FAFC] focus:bg-[#F8FAFC]",
      className
    )}
    onClick={() => onValueChange?.(value)}
    {...props}
  >
    {children}
  </div>
))
SelectItem.displayName = "SelectItem"

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem }
