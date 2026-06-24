import { forwardRef } from "react";

type Props = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  error?: string;
};

const MillieTextarea = forwardRef<HTMLTextAreaElement, Props>(
  ({ label, error, className = "", ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="font-title text-[10px] uppercase tracking-[0.2em] text-bege-escuro">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          {...props}
          className={[
            "w-full resize-none border border-bege-escuro/40 bg-roxo-escuro/80 px-3 py-2.5",
            "font-body text-sm text-bege-claro placeholder:text-bege-medio/30",
            "outline-none transition-colors",
            "focus:border-bege-medio/70 focus:bg-roxo-escuro",
            "disabled:cursor-not-allowed disabled:opacity-40",
            error ? "border-red-500/60" : "",
            className,
          ].join(" ")}
        />
        {error && (
          <span className="font-body text-xs text-red-400">{error}</span>
        )}
      </div>
    );
  }
);

MillieTextarea.displayName = "MillieTextarea";
export default MillieTextarea;