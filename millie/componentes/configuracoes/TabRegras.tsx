"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Dices, LoaderCircle, Sparkles } from "lucide-react";
import { getSystemTestContext, performSystemTest } from "@/app/actions/rules";

type Attribute = "agilidade" | "inteligencia" | "forca" | "vigor" | "sorte";
type Result = "Falha Absoluta" | "Fracasso" | "Parcial" | "Sucesso" | "Sucesso Garantido" | "Excepcional";
type Character = { id: string; name: string; agilidade: number; inteligencia: number; forca: number; vigor: number; sorte: number };
type TestOutcome = { characterName: string; attribute: Attribute; attributeName: string; attributeValue: number; adjustmentBand: number; card: string; baseResult: Result; result: Result; specialCardsCollected: string[]; attributeAboveTenNote: string | null };
const ATTRIBUTES: { id: Attribute; label: string; suggestion: string }[] = [
  { id: "agilidade", label: "Agilidade", suggestion: "Esquivar, perseguir, escalar ou executar uma manobra precisa." },
  { id: "inteligencia", label: "Inteligência", suggestion: "Investigar, lembrar, decifrar ou analisar uma situação." },
  { id: "forca", label: "Força", suggestion: "Erguer, romper, conter ou realizar um esforço físico." },
  { id: "vigor", label: "Vigor", suggestion: "Resistir ao cansaço, suportar uma condição ou sobreviver." },
  { id: "sorte", label: "Sorte", suggestion: "Lidar com o acaso quando nenhuma capacidade explica o resultado." },
];
const DAMAGE_RATE: Record<Result, number> = {
  "Falha Absoluta": 0, Fracasso: 0, Parcial: 0.15, Sucesso: 0.25, "Sucesso Garantido": 0.25, Excepcional: 0.4,
};

export default function TabRegras() {
  const [role, setRole] = useState<"MASTER" | "PLAYER" | null>(null);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [characterId, setCharacterId] = useState("");
  const [attribute, setAttribute] = useState<Attribute>("agilidade");
  const [outcome, setOutcome] = useState<TestOutcome | null>(null);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    getSystemTestContext().then(data => {
      setRole(data.role);
      setCharacters(data.characters as Character[]);
      setCharacterId(data.characters[0]?.id ?? "");
    }).catch(e => setError(e instanceof Error ? e.message : "Não foi possível carregar os personagens."));
  }, []);

  const selected = characters.find(c => c.id === characterId);
  const damageEstimate = useMemo(() => {
    if (!selected || !outcome) return null;
    const score = selected[outcome.attribute];
    return Math.ceil(score * DAMAGE_RATE[outcome.result]);
  }, [selected, outcome]);

  function roll(nextAttribute: Attribute) {
    if (!characterId) return;
    setAttribute(nextAttribute);
    setError("");
    startTransition(async () => {
      try {
        const result = await performSystemTest({ characterId, attribute: nextAttribute });
        setOutcome(result as TestOutcome);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Não foi possível realizar o teste.");
      }
    });
  }

  if (role === null && !error) return <div className="py-12 text-center text-bege-medio"><LoaderCircle className="mx-auto animate-spin" /></div>;

  return (
    <section className="space-y-6 text-bege-claro">
      <header className="border-b border-bege-escuro/30 pb-4">
        <p className="text-[10px] uppercase tracking-[.25em] text-bege-medio">Pontes Quebradas</p>
        <h2 className="mt-2 flex items-center gap-2 font-title text-xl uppercase tracking-widest"><Dices size={20} /> Regras do Sistema</h2>
        <p className="mt-2 text-sm text-bege-escuro/80">{role === "MASTER" ? "Consulte testes sugeridos e faça uma rolagem para um personagem da campanha." : "Escolha o atributo usado na ação. O sistema tira a carta e aplica o resultado automaticamente."}</p>
      </header>

      {error && <p role="alert" className="border border-red-400/30 p-3 text-sm text-red-200">{error}</p>}
      {!characters.length && role && <p className="border border-bege-escuro/25 p-4 text-sm text-bege-escuro/80">Não há personagens disponíveis na campanha ativa.</p>}

      {characters.length > 0 && <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(260px,.8fr)]">
        <div className="space-y-4 border border-bege-escuro/25 bg-roxo-escuro/30 p-4">
          <label className="block text-[10px] uppercase tracking-widest text-bege-medio">Personagem
            <select value={characterId} onChange={e => { setCharacterId(e.target.value); setOutcome(null); }} disabled={isPending} className="mt-2 w-full border border-bege-escuro/30 bg-[#1d1020] p-3 text-sm normal-case text-bege-claro">
              {characters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>

          {role === "PLAYER" ? <>
            <label className="block text-[10px] uppercase tracking-widest text-bege-medio">Atributo do teste
              <select value={attribute} onChange={e => setAttribute(e.target.value as Attribute)} disabled={isPending} className="mt-2 w-full border border-bege-escuro/30 bg-[#1d1020] p-3 text-sm normal-case text-bege-claro">
                {ATTRIBUTES.map(a => <option key={a.id} value={a.id}>{a.label} · {selected?.[a.id] ?? 0}</option>)}
              </select>
            </label>
            <p className="text-xs leading-relaxed text-bege-escuro/80">{ATTRIBUTES.find(a => a.id === attribute)?.suggestion}</p>
            <button type="button" onClick={() => roll(attribute)} disabled={isPending || !characterId} className="flex w-full items-center justify-center gap-2 border border-bege-medio/50 px-4 py-3 text-xs uppercase tracking-widest hover:bg-bege-medio/10 disabled:opacity-50">
              {isPending ? <LoaderCircle size={15} className="animate-spin" /> : <Dices size={15} />} Realizar teste
            </button>
          </> : <div className="space-y-2">
            <p className="text-[10px] uppercase tracking-widest text-bege-medio">Testes sugeridos</p>
            {ATTRIBUTES.map(a => <button key={a.id} type="button" onClick={() => roll(a.id)} disabled={isPending || !characterId} className="flex w-full items-center justify-between gap-3 border border-bege-escuro/25 px-3 py-2 text-left hover:border-bege-medio/60 disabled:opacity-50">
              <span><span className="block text-xs uppercase">{a.label} · {selected?.[a.id] ?? 0}</span><span className="mt-1 block text-[11px] text-bege-escuro/80">{a.suggestion}</span></span>
              {isPending && attribute === a.id ? <LoaderCircle size={15} className="shrink-0 animate-spin" /> : <Dices size={15} className="shrink-0 text-bege-medio" />}
            </button>)}
          </div>}

          {outcome && <article aria-live="polite" className="border border-bege-medio/40 bg-[#1d1020] p-4">
            <p className="text-[10px] uppercase tracking-widest text-bege-medio">{outcome.characterName} · Teste de {outcome.attributeName} ({outcome.attributeValue})</p>
            <p className="mt-3 font-title text-lg">{outcome.card}</p>
            <p className="mt-1 text-sm">{outcome.baseResult}{outcome.baseResult !== outcome.result ? " → " + outcome.result : ""}</p>
            {outcome.specialCardsCollected.length > 0 && <p className="mt-2 flex items-center gap-1 text-xs text-bege-medio"><Sparkles size={13} /> Carta(s) especial(is) guardada(s): {outcome.specialCardsCollected.join(", ")}</p>}
            {outcome.attributeAboveTenNote && <p className="mt-2 text-[11px] text-bege-escuro/80">{outcome.attributeAboveTenNote}</p>}
            {role === "MASTER" && <p className="mt-3 border-t border-bege-escuro/25 pt-2 text-xs">Estimativa de dano caso esta ação cause dano: {damageEstimate} PV ({Math.round(DAMAGE_RATE[outcome.result] * 100)}% de {outcome.attributeName}). O valor não é aplicado automaticamente.</p>}
          </article>}
        </div>

        <aside className="space-y-4">
          <section className="border border-bege-escuro/25 p-4">
            <h3 className="font-title text-xs uppercase tracking-widest text-bege-medio">Resultado das cartas</h3>
            <ul className="mt-3 space-y-2 text-xs">
              <li>Ás — Falha Absoluta</li><li>2–3 — Fracasso</li><li>4–7 — Parcial</li><li>8–10 — Sucesso</li><li>Rei — Sucesso Garantido</li><li>Rainha — Excepcional</li>
            </ul>
            <p className="mt-3 text-[11px] leading-relaxed text-bege-escuro/80">Valete: ativa uma habilidade sem consumir a ação normal. Cavaleiro: concede uma ação completa extra. Se tiver os dois, escolha um por cena. Ao encontrar um deles no teste, ele é guardado e outra carta determina o resultado.</p>
          </section>
          <section className="border border-bege-escuro/25 p-4">
            <h3 className="font-title text-xs uppercase tracking-widest text-bege-medio">Ajustes dos atributos</h3>
            <ul className="mt-3 space-y-2 text-xs leading-relaxed">
              <li>1–3: cartas 8–9 passam de Sucesso para Parcial.</li>
              <li>4–6: sem alteração.</li>
              <li>7–9: cartas 4–7 passam de Parcial para Sucesso.</li>
              <li>10 ou mais: cartas 2–3 passam de Fracasso para Parcial.</li>
            </ul>
            <p className="mt-3 text-[11px] leading-relaxed text-bege-escuro/80">Para atributos acima de 10, o ajuste de carta usa a faixa 10; o valor integral permanece disponível para cálculos de dano.</p>
          </section>
          {role === "MASTER" && <section className="border border-bege-escuro/25 p-4">
            <h3 className="font-title text-xs uppercase tracking-widest text-bege-medio">Dano sugerido</h3>
            <p className="mt-2 text-xs leading-relaxed">A estimativa usa o atributo do teste: Falha 0%, Parcial 15%, Sucesso 25% e Excepcional 40%, arredondando para cima. Sucesso Garantido usa 25%. A aplicação ao PV do alvo fica com o Mestre.</p>
          </section>}
        </aside>
      </div>}
    </section>
  );
}
