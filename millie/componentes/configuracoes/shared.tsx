"use client";

export function ConfigSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-title text-xl uppercase tracking-[0.14em] text-bege-medio">{title}</h2>
        <div className="mt-2 h-px w-full bg-bege-escuro/20" />
      </div>
      {children}
    </div>
  );
}

export function ToggleRow({
  label, description, checked, onChange,
}: {
  label: string; description: string; checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-bege-escuro/10 pb-4">
      <div className="flex-1 min-w-0">
        <p className="font-title text-sm uppercase tracking-wider text-bege-claro/80">{label}</p>
        <p className="mt-0.5 text-[11px] leading-relaxed text-bege-escuro/50">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-5 w-9 shrink-0 cursor-pointer rounded-full border transition-all
          ${checked ? "border-bege-medio bg-bege-medio/20" : "border-bege-escuro/40 bg-transparent"}`}
      >
        <div
          className={`absolute top-0.5 h-3.5 w-3.5 rounded-full transition-all
            ${checked ? "left-[18px] bg-bege-medio" : "left-0.5 bg-bege-escuro/40"}`}
        />
      </button>
    </div>
  );
}

export function DangerRow({
  label, description, buttonLabel, variant, onClick, disabled = false,
}: {
  label: string; description: string; buttonLabel: string;
  variant: "soft" | "danger" | "critical"; onClick?: () => void; disabled?: boolean;
}) {
  const buttonStyles = {
    soft: "border-bege-escuro/30 text-bege-escuro/60 hover:border-bege-medio hover:text-bege-medio",
    danger: "border-red-500/30 text-red-500/60 hover:border-red-400 hover:text-red-400",
    critical: "border-red-500/60 text-red-400 hover:border-red-300 hover:text-red-300",
  };
  return (
    <div className="flex flex-col gap-3 border-b border-bege-escuro/10 pb-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex-1 min-w-0">
        <p className="font-title text-sm uppercase tracking-wider text-bege-claro/80">{label}</p>
        <p className="mt-0.5 text-[11px] leading-relaxed text-bege-escuro/50">{description}</p>
      </div>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={`shrink-0 border px-4 py-2 font-title text-[10px] uppercase tracking-widest transition disabled:opacity-40 disabled:cursor-not-allowed ${buttonStyles[variant]}`}
      >
        {buttonLabel}
      </button>
    </div>
  );
}

export function ConfigActionButton({ label, onClick, disabled = false }: { label: string; onClick?: () => void; disabled?: boolean }) {
  return (
    <div className="pt-2">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className="arcane-hover relative h-12 border border-bege-escuro/40 px-8 font-title text-sm uppercase tracking-[0.18em] text-bege-escuro transition hover:border-bege-medio hover:text-bege-medio overflow-hidden disabled:opacity-40"
      >
        {label}
      </button>
    </div>
  );
}

export function FieldRow({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="flex flex-col gap-1 border-b border-bege-escuro/10 pb-4">
      <p className="font-title text-[10px] uppercase tracking-[0.18em] text-bege-escuro/50">{label}</p>
      <p className="mt-0.5 font-title text-sm text-bege-claro/80 truncate">{value}</p>
      <p className="mt-0.5 text-[11px] text-bege-escuro/40">{hint}</p>
    </div>
  );
}