export function SectionTitle({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 text-bege-escuro/70">
      {icon}
      <h2 className="font-title text-xs uppercase tracking-[0.2em]">{label}</h2>
      <div className="flex-1 h-px bg-bege-escuro/15" />
    </div>
  )
}

export function Empty({ label }: { label: string }) {
  return (
    <p className="text-center text-bege-escuro/40 font-title text-xs tracking-wide py-8">
      {label}
    </p>
  )
}