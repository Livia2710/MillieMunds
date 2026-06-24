import { forwardRef } from "react";
import { ChevronDown } from "lucide-react";

type Option = { value: string; label: string };

type Props = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  error?: string;
  options: Option[];
  placeholder?: string;
};

const MillieSelect = forwardRef<HTMLSelectElement, Props>(
  ({ label, error, options, placeholder, className = "", ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="font-title text-[10px] uppercase tracking-[0.2em] text-bege-escuro">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            {...props}
            className={[
              "w-full appearance-none border border-bege-escuro/40 bg-roxo-escuro/80 px-3 py-2.5 pr-9",
              "font-body text-sm text-bege-claro",
              "outline-none transition-colors",
              "focus:border-bege-medio/70 focus:bg-roxo-escuro",
              "disabled:cursor-not-allowed disabled:opacity-40",
              error ? "border-red-500/60" : "",
              className,
            ].join(" ")}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-bege-medio/60"
          />
        </div>
        {error && (
          <span className="font-body text-xs text-red-400">{error}</span>
        )}
      </div>
    );
  }
);

MillieSelect.displayName = "MillieSelect";
export default MillieSelect;