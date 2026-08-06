"use client";

import { Download } from "lucide-react";
import { ConfigSection } from "./shared";

const PDFS = [
  { id: "sistema-basico", title: "Sistema Básico", description: "Regras fundamentais do sistema Millie Munds.", category: "Sistema", available: true },
  { id: "compendio-racas", title: "Compêndio de Raças", description: "Mais de 200 raças catalogadas do multiverso. Em finalização.", category: "Compêndio", available: false },
  { id: "universo-arcan", title: "Universo Arcan", description: "Lore completo do universo Arcan com mapas e história.", category: "Universo", available: true },
  { id: "universo-bestiarius", title: "Universo Bestiarius", description: "Criaturas, reinos e a política do Reino Bestial.", category: "Universo", available: false },
  { id: "universo-gaia", title: "Universo Gaia", description: "O mundo que não deveria existir. Floresta Ancestral e além.", category: "Universo", available: false },
];

export default function TabBiblioteca() {
  return (
    <ConfigSection title="Biblioteca de PDFs">
      <p className="mb-6 text-sm leading-relaxed text-bege-claro/60">
        Aqui ficam todos os materiais do universo Millie Munds — sistema, raças e lore dos mundos.
        PDFs marcados como <span className="font-title text-bege-escuro uppercase tracking-wider">em breve</span> ainda estão sendo finalizados.
      </p>

      <div className="flex flex-col gap-3">
        {PDFS.map((pdf) => (
          <div key={pdf.id} className={`flex items-center justify-between gap-4 border p-4 transition-all
            ${pdf.available ? "border-bege-escuro/35 hover:border-bege-medio/50" : "border-bege-escuro/15 opacity-50"}`}>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-title text-sm uppercase tracking-wider text-bege-claro truncate">{pdf.title}</p>
                <span className="shrink-0 rounded-sm border border-bege-escuro/30 px-1.5 py-0.5 font-title text-[9px] uppercase tracking-widest text-bege-escuro/60">
                  {pdf.available ? pdf.category : "Em breve"}
                </span>
              </div>
              <p className="mt-0.5 text-xs leading-relaxed text-bege-claro/50">{pdf.description}</p>
            </div>

            {pdf.available ? (
              <a
                href={`/assets/pdfs/${pdf.id}.pdf`}
                download
                className="flex shrink-0 items-center gap-2 border border-bege-escuro/40 px-3 py-2 font-title text-[10px] uppercase tracking-widest text-bege-medio transition hover:border-bege-medio hover:text-bege-claro"
              >
                <Download size={12} strokeWidth={1.5} />
                Baixar
              </a>
            ) : (
              <span className="shrink-0 font-title text-[10px] uppercase tracking-widest text-bege-escuro/30">Indisponível</span>
            )}
          </div>
        ))}
      </div>
    </ConfigSection>
  );
}