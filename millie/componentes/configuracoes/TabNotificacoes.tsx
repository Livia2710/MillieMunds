"use client";

import { ConfigSection } from "./shared";

const CATEGORIES = [
  "Novas sessões de campanha",
  "Itens adicionados ao inventário",
  "Habilidades desbloqueadas",
  "Atualizações do sistema",
];

export default function TabNotificacoes() {
  return (
    <ConfigSection title="Notificações">
      <p className="text-sm leading-relaxed text-bege-claro/60">
        O Millie ainda não envia notificações. As preferências ficarão disponíveis quando os avisos estiverem implementados;
        por enquanto, nenhuma opção aparece como ativada sem produzir efeito.
      </p>
      <ul className="space-y-3 border-t border-bege-escuro/10 pt-4" aria-label="Tipos de notificação planejados">
        {CATEGORIES.map((category) => (
          <li key={category} className="flex items-center justify-between gap-4 text-sm text-bege-escuro/40">
            <span>{category}</span>
            <span className="shrink-0 font-title text-[9px] uppercase tracking-widest">Em breve</span>
          </li>
        ))}
      </ul>
    </ConfigSection>
  );
}
