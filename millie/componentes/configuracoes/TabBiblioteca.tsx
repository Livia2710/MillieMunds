"use client";

import { Download, ExternalLink } from "lucide-react";
import { ConfigSection } from "./shared";

type LibraryAction = { label: string; href: string; kind: "download" | "open"; filename?: string };
type LibraryMaterial = { id: string; title: string; description: string; category: string; actions: LibraryAction[] };

const MATERIALS: LibraryMaterial[] = [
  { id: "sistema-basico", title: "Sistema Básico", description: "Regras fundamentais do sistema Millie Munds.", category: "Sistema", actions: [{ label: "Baixar PDF", href: "/assets/pdfs/sistema-basico.pdf", kind: "download", filename: "sistema-basico.pdf" }] },
  { id: "compendio-racas", title: "Compêndio de Raças", description: "Mais de 200 raças catalogadas do multiverso. O compêndio interativo poderá ser aberto aqui quando estiver disponível.", category: "Compêndio", actions: [] },
  { id: "universo-arcan-pdf", title: "Universo Arcan — PDF", description: "Lore completo do universo Arcan com mapas e história.", category: "Universo", actions: [{ label: "Baixar PDF", href: "/assets/pdfs/universo-arcan.pdf", kind: "download", filename: "universo-arcan.pdf" }] },
  { id: "arcan", title: "Arcan", description: "Acesse a experiência interativa de Arcan.", category: "Universo · Arcan", actions: [{ label: "Abrir", href: "https://canva.link/aswrwozqyc1kx9q", kind: "open" }] },
  { id: "abismo", title: "Abismo", description: "Acesse Abismo pelo Canva ou visite o site do mundo.", category: "Universo · Arcan", actions: [{ label: "Abrir no Canva", href: "https://canva.link/o2c1hk5wmo6djpd", kind: "open" }, { label: "Abrir site", href: "https://bybeauty.my.canva.site/abismo", kind: "open" }] },
  { id: "celestia", title: "Celestia", description: "Acesse a experiência interativa de Celestia.", category: "Universo · Arcan", actions: [{ label: "Abrir", href: "https://canva.link/rz0fncq9ysthmzd", kind: "open" }] },
  { id: "universo-bestiarius", title: "Universo Bestiarius", description: "Criaturas, reinos e a política do Reino Bestial.", category: "Universo", actions: [] },
  { id: "universo-gaia", title: "Universo Gaia", description: "O mundo que não deveria existir. Floresta Ancestral e além.", category: "Universo", actions: [] },
  { id: "universo-veyron", title: "Universo Veyron", description: "Um universo intergalático.", category: "Universo", actions: [{ label: "Baixar PDF", href: "/assets/pdfs/universo-veyron.pdf", kind: "download", filename: "universo-veyron.pdf" }] },
];

export default function TabBiblioteca() {
  return (
    <ConfigSection title="Biblioteca de materiais">
      <p className="mb-6 text-sm leading-relaxed text-bege-claro/60">
        Aqui ficam os materiais do universo Millie Munds. Você pode baixar PDFs ou abrir conteúdos interativos em uma nova aba. Materiais sem ações disponíveis ainda estão sendo preparados.
      </p>

      <div className="flex flex-col gap-3">
        {MATERIALS.map((material) => (
          <div key={material.id} className={`flex flex-col justify-between gap-4 border p-4 transition-all sm:flex-row sm:items-center
            ${material.actions.length ? "border-bege-escuro/35 hover:border-bege-medio/50" : "border-bege-escuro/15 opacity-60"}`}>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate font-title text-sm uppercase tracking-wider text-bege-claro">{material.title}</p>
                <span className="shrink-0 rounded-sm border border-bege-escuro/30 px-1.5 py-0.5 font-title text-[9px] uppercase tracking-widest text-bege-escuro/60">
                  {material.actions.length ? material.category : "Em breve"}
                </span>
              </div>
              <p className="mt-0.5 text-xs leading-relaxed text-bege-claro/50">{material.description}</p>
            </div>

            <div className="flex shrink-0 flex-wrap gap-2">
              {material.actions.length ? material.actions.map((action) => action.kind === "download" ? (
                <a key={action.href} href={action.href} download={action.filename} className="flex items-center justify-center gap-2 border border-bege-escuro/40 px-3 py-2 font-title text-[10px] uppercase tracking-widest text-bege-medio transition hover:border-bege-medio hover:text-bege-claro">
                  <Download size={12} strokeWidth={1.5} />{action.label}
                </a>
              ) : (
                <a key={action.href} href={action.href} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 border border-bege-escuro/40 px-3 py-2 font-title text-[10px] uppercase tracking-widest text-bege-medio transition hover:border-bege-medio hover:text-bege-claro">
                  <ExternalLink size={12} strokeWidth={1.5} />{action.label}
                </a>
              )) : <span className="self-center font-title text-[10px] uppercase tracking-widest text-bege-escuro/50">Indisponível</span>}
            </div>
          </div>
        ))}
      </div>
    </ConfigSection>
  );
}
