"use client"

import React, { useState, useContext, createContext } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const AccordionContext = createContext({
    activeItem: null,
    setActiveItem: () => {},
});

const AccordionItemContext = createContext(null);

const Accordion = ({ className, type = "single", defaultValue, collapsible = true, children, ...props }) => {
    const [activeItem, setActiveItem] = useState(defaultValue || null);

    const handleSetActiveItem = (value) => {
        if (type === "single") {
            if (collapsible && activeItem === value) {
                setActiveItem(null);
            } else {
                setActiveItem(value);
            }
        }
    };

    return (
        <AccordionContext.Provider value={{ activeItem, setActiveItem: handleSetActiveItem }}>
            <div className={cn("w-full", className)} {...props}>
                {children}
            </div>
        </AccordionContext.Provider>
    );
};

const AccordionItem = React.forwardRef(({ className, value, children, ...props }, ref) => (
    <AccordionItemContext.Provider value={value}>
        <div ref={ref} className={cn("border-b", className)} {...props}>
            {children}
        </div>
    </AccordionItemContext.Provider>
));
AccordionItem.displayName = "AccordionItem";

const AccordionTrigger = React.forwardRef(({ className, children, ...props }, ref) => {
    const { activeItem, setActiveItem } = useContext(AccordionContext);
    const value = useContext(AccordionItemContext);
    const isOpen = activeItem === value;

    return (
        <div className="flex">
            <button
                ref={ref}
                onClick={() => setActiveItem(value)}
                className={cn(
                    "flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline",
                    className
                )}
                {...props}
            >
                {children}
                <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform duration-200", isOpen && "rotate-180")} />
            </button>
        </div>
    );
});
AccordionTrigger.displayName = "AccordionTrigger";

const AccordionContent = React.forwardRef(({ className, children, ...props }, ref) => {
    const { activeItem } = useContext(AccordionContext);
    const value = useContext(AccordionItemContext);
    const isOpen = activeItem === value;

    return (
        <div
            ref={ref}
            className={cn("overflow-hidden text-sm transition-all", !isOpen && "hidden")}
            {...props}
        >
            <div className={cn("pb-4 pt-0", className)}>{children}</div>
        </div>
    );
});
AccordionContent.displayName = "AccordionContent";

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };