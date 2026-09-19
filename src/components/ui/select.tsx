import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectFieldProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
}

/** Accessible native select styled to the Circa design language. */
export const SelectField = React.forwardRef<HTMLSelectElement, SelectFieldProps>(
  ({ label, options, className, id, ...props }, ref) => {
    const selectId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={selectId} className="text-2xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            id={selectId}
            ref={ref}
            className={cn(
              "h-9 w-full appearance-none rounded-md border border-input bg-card px-3 pr-8 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              className,
            )}
            {...props}
          >
            {options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        </div>
      </div>
    );
  },
);
SelectField.displayName = "SelectField";

/** Numeric / text input field. */
export interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  suffix?: string;
}

export const InputField = React.forwardRef<HTMLInputElement, InputFieldProps>(
  ({ label, suffix, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={inputId} className="text-2xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          <input
            id={inputId}
            ref={ref}
            className={cn(
              "h-9 w-full rounded-md border border-input bg-card px-3 text-sm tabular-nums text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              suffix && "pr-9",
              className,
            )}
            {...props}
          />
          {suffix && (
            <span className="pointer-events-none absolute right-3 text-xs text-muted-foreground">
              {suffix}
            </span>
          )}
        </div>
      </div>
    );
  },
);
InputField.displayName = "InputField";
