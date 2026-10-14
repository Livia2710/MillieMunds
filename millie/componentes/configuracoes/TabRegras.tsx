"use client";

import { useEffect, useState, useTransition } from "react";
import { Dices, LoaderCircle, Sparkles } from "lucide-react";
import { getSystemTestContext, performSystemTest, performRankRegressionCheck, performCharacterRest, applyCombatDamage } from "@/app/actions/rules";
import type { EquipmentEffectRecord, EquipmentType } from "@/lib/types/inventory";
import { getArmorProtection, getShieldBlockBonus, getWeaponPotency } from "@/lib/utils/equipment";

type Attribute = "agilidade" | "inteligencia" | "forca" | "vigor" | "sorte" | "vontade";
type Result = "Falha Absoluta" | "Fracasso" | "Parcial" | "Sucesso" | "Sucesso Garantido" | "Excepcional" | "Sem teste";
type CharacterEquipment = { id: string; name: string; type: EquipmentType | null; subtype: string | null; rarity: string; durability: number | null; maxDurability: number | null; effects: EquipmentEffectRecord[] };
type Character = { id: string; name: string; agilidade: number; inteligencia: number; forca: number; vigor: number; sorte: number; level: number; pv: number; pvMax: number; conditions: string[]; rank: string; regressionRisk: boolean; canLoseRank: boolean; equipment: CharacterEquipment[] };
type TestOutcome = { characterName: string; opponentName?: string | null; attribute: Attribute; attributeName: string; attributeValue: number; adjustedAttribute: number; adjustmentBand: number; card: string; cardRank?: string; baseResult: Result; result: Result; specialCardsCollected: string[]; attributeAboveTenNote: string | null; rankPenalty: number; conditionModifiers: { condition: string; label: string; penalty: number }[]; totalPenalty: number; shieldBonus?: number; luckPower: number; levelDifference?: number | null; levelRuleNote?: string | null; regressionRisk?: boolean };
type RegressionOutcome = { characterName: string; card: string; result: Exclude<Result, "Sem teste">; vigor: number; rankBefore: string; rankAfter: string; rankLost: boolean; specialCardsCollected: string[] };
type RestOutcome = { characterName: string; restType: 'curto' | 'longo'; card: string; result: string; pvRecovered: number; pmRecovered: number; pv: number; pvMax: number; pm: number; pmMax: number; specialCardsCollected: string[] };
const ATTRIBUTES: { id: Attribute; label: string; suggestion: string }[] = [
  { id: "agilidade", label: "Agilidade", suggestion: "Esquivar, perseguir, escalar ou executar uma manobra precisa." },
  { id: "inteligencia", label: "Inteligência", suggestion: "Investigar, lembrar, decifrar ou analisar uma situação." },
  { id: "forca", label: "Força", suggestion: "Erguer, romper, conter ou realizar um esforço físico." },
  { id: "vigor", label: "Vigor", suggestion: "Resistir ao cansaço, suportar uma condição ou sobreviver." },
  { id: "sorte", label: "Sorte", suggestion: "Lidar com o acaso quando nenhuma capacidade explica o resultado." },
  { id: "vontade", label: "Vontade", suggestion: "Resistir a medo, pressão ou outros efeitos mentais; usa o maior entre Inteligência e Vigor." },
];
const DAMAGE_RATE: Record<Result, number> = {
  "Falha Absoluta": 0, Fracasso: 0, Parcial: 0.15, Sucesso: 0.25, "Sucesso Garantido": 0.25, Excepcional: 0.4, "Sem teste": 0,
};
const DAMAGE_LADDER = [0, 0.15, 0.25, 0.4, 0.6];
const POTENCY_SHIFT = { infima: -2, fraca: -1, normal: 0, forte: 1, devastadora: 2 } as const;
type DamageType = "fisico" | "elemental" | "mental";

export default function TabRegras() {
  const [role, setRole] = useState<"MASTER" | "PLAYER" | null>(null);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [characterId, setCharacterId] = useState("");
  const [opponentCharacterId, setOpponentCharacterId] = useState("");
  const [damageTargetId, setDamageTargetId] = useState("");
  const [weaponItemId, setWeaponItemId] = useState("");
  const [armorItemId, setArmorItemId] = useState("");
  const [shieldItemId, setShieldItemId] = useState("");
  const [blockShieldItemId, setBlockShieldItemId] = useState("");
  const [damageType, setDamageType] = useState<DamageType>("fisico");
  const [potency, setPotency] = useState<keyof typeof POTENCY_SHIFT>("normal");
  const [resistanceShift, setResistanceShift] = useState<-1 | 0 | 1>(0);
  const [immune, setImmune] = useState(false);
  const [armorPP, setArmorPP] = useState(0);
  const [attribute, setAttribute] = useState<Attribute>("agilidade");
  const [offensive, setOffensive] = useState(false);
  const [combatMode, setCombatMode] = useState<"manual" | "automatico">("manual");
  const [damageApplied, setDamageApplied] = useState(false);
  const [outcome, setOutcome] = useState<TestOutcome | null>(null);
  const [regressionOutcome, setRegressionOutcome] = useState<RegressionOutcome | null>(null);
  const [restOutcome, setRestOutcome] = useState<RestOutcome | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    getSystemTestContext().then(data => {
      setRole(data.role);
      setCharacters(data.characters as Character[]);
      setCharacterId(data.characters[0]?.id ?? "");
    }).catch(e => setError(e instanceof Error ? e.message : "Não foi possível carregar os personagens."));
  }, []);

  const selected = characters.find(c => c.id === characterId);
  const attributeValue = (id: Attribute) => !selected ? 0 : id === 'vontade' ? Math.max(selected.inteligencia, selected.vigor) : selected[id];
  const damageTarget = characters.find(c => c.id === damageTargetId);
  const selectedWeapon = selected?.equipment.find(item => item.id === weaponItemId);
  const selectedArmor = damageTarget?.equipment.find(item => item.id === armorItemId);
  const selectedShield = damageTarget?.equipment.find(item => item.id === shieldItemId);
  const penetration = Boolean(selectedWeapon?.effects.some(effect => effect.rule === "perfurante"));
  const weaponBroken = selectedWeapon?.durability === 0;
  const armorBroken = selectedArmor?.durability === 0;
  const shieldBroken = selectedShield?.durability === 0;
  const gearProtection = selectedArmor ? getArmorProtection(selectedArmor.subtype, selectedArmor.rarity, armorBroken) : 0;
  const shieldBlock = selectedShield ? getShieldBlockBonus(selectedShield.rarity, shieldBroken) : 0;
  const effectivePotency = selectedWeapon ? getWeaponPotency(selectedWeapon.rarity, weaponBroken) : potency;
  const damageEstimate = (() => {
    if (!damageTarget || !outcome || outcome.result === "Sem teste" || immune) return null;
    const baseRate = DAMAGE_RATE[outcome.result];
    if (baseRate === 0) return { pv: 0, percent: 0, adjustedPercent: 0, combinedShift: 0, armorTotal: Math.min(20, armorPP + gearProtection), effectiveArmor: 0, shieldBlock, penetration, totalProtection: 0 };
    const baseIndex = DAMAGE_LADDER.indexOf(baseRate);
    const combinedShift = Math.max(-2, Math.min(2, POTENCY_SHIFT[effectivePotency] + resistanceShift));
    const adjustedRate = DAMAGE_LADDER[Math.max(0, Math.min(DAMAGE_LADDER.length - 1, baseIndex + combinedShift))];
    const armorTotal = Math.max(0, armorPP + gearProtection);
    const effectiveArmor = penetration ? 0 : armorTotal;
    const totalProtection = damageType === "fisico" ? effectiveArmor : 0;
    const armorReduction = damageType === "fisico" ? totalProtection / 100 : 0;
    const finalRate = Math.max(0, adjustedRate - armorReduction);
    return { pv: Math.ceil(damageTarget.pvMax * finalRate), percent: Math.round(finalRate * 100), adjustedPercent: Math.round(adjustedRate * 100), combinedShift, armorTotal, effectiveArmor, shieldBlock, penetration, totalProtection };
  })();

  function roll(nextAttribute: Attribute) {
    if (!characterId) return;
    setAttribute(nextAttribute);
    setError("");
    setNotice("");
    startTransition(async () => {
      try {
        const result = await performSystemTest({ characterId, attribute: nextAttribute, offensive, ...(role === "MASTER" && opponentCharacterId ? { opponentCharacterId } : {}), ...(nextAttribute === 'vigor' && blockShieldItemId ? { shieldItemId: blockShieldItemId } : {}) });
        setOutcome(result as TestOutcome);
        setDamageApplied(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Não foi possível realizar o teste.");
      }
    });
  }

  function applyDamageAutomatically() {
    if (!selected || !damageTarget || !outcome || !damageEstimate || damageApplied || immune) return;
    startTransition(async () => {
      try {
        const result = await applyCombatDamage({
          attackerCharacterId: selected.id,
          targetCharacterId: damageTarget.id,
          damage: damageEstimate.pv,
          ...(weaponItemId ? { weaponItemId } : {}),
          ...(armorItemId ? { armorItemId } : {}),
          wearWeapon: outcome.cardRank === 'as' || outcome.baseResult === 'Fracasso',
          wearArmor: damageType === 'fisico' && outcome.result === 'Excepcional',
        });
        setDamageApplied(true);
        const refreshed = await getSystemTestContext();
        setCharacters(refreshed.characters as Character[]);
        const wear = [result.weapon ? 'arma −1 durabilidade' : '', result.armor ? 'armadura −1 durabilidade' : ''].filter(Boolean).join('; ');
        setNotice(`Dano aplicado em ${result.characterName}: ${result.damage} PV (${result.pv}/${result.pvMax})${wear ? ` · ${wear}` : ''}.`);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Não foi possível aplicar o dano.');
      }
    });
  }

  function rollRegressionCheck() {
    if (!characterId) return;
    setError("");
    startTransition(async () => {
      try {
        const result = await performRankRegressionCheck(characterId);
        setRegressionOutcome(result);
        if (result.rankLost) {
          const refreshed = await getSystemTestContext();
          setCharacters(refreshed.characters as Character[]);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Não foi possível realizar o teste de Vigor.");
      }
    });
  }

  function rest(restType: 'curto' | 'longo') {
    if (!characterId) return;
    setError("");
    startTransition(async () => {
      try {
        const result = await performCharacterRest(characterId, restType);
        setRestOutcome(result);
        setOutcome(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Não foi possível resolver o descanso.");
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
      {notice && <p role="status" className="border border-emerald-300/30 p-3 text-sm text-emerald-200">{notice}</p>}
      {!characters.length && role && <p className="border border-bege-escuro/25 p-4 text-sm text-bege-escuro/80">Não há personagens disponíveis na campanha ativa.</p>}

      {characters.length > 0 && <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(260px,.8fr)]">
        <div className="space-y-4 border border-bege-escuro/25 bg-roxo-escuro/30 p-4">
          <label className="block text-[10px] uppercase tracking-widest text-bege-medio">Personagem
            <select value={characterId} onChange={e => { setCharacterId(e.target.value); setBlockShieldItemId(""); setOutcome(null); setDamageApplied(false); setRegressionOutcome(null); setRestOutcome(null); }} disabled={isPending} className="mt-2 w-full border border-bege-escuro/30 bg-[#1d1020] p-3 text-sm normal-case text-bege-claro">
              {characters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>

          {selected?.equipment.some(item => item.type === 'escudo') && <label className="block text-[10px] uppercase tracking-widest text-bege-medio">Escudo usado no teste de bloqueio com Vigor
            <select value={blockShieldItemId} onChange={e => setBlockShieldItemId(e.target.value)} disabled={isPending} className="mt-2 w-full border border-bege-escuro/30 bg-[#1d1020] p-3 text-sm normal-case text-bege-claro">
              <option value="">Sem escudo</option>{selected.equipment.filter(item => item.type === 'escudo').map(item => <option key={item.id} value={item.id}>{item.name} · +{getShieldBlockBonus(item.rarity)}</option>)}
            </select>
          </label>}

          {role === "MASTER" && <label className="block text-[10px] uppercase tracking-widest text-bege-medio">Comparar com personagem (opcional)
            <select value={opponentCharacterId} onChange={e => { setOpponentCharacterId(e.target.value); setOutcome(null); }} disabled={isPending} className="mt-2 w-full border border-bege-escuro/30 bg-[#1d1020] p-3 text-sm normal-case text-bege-claro">
              <option value="">Sem comparação de nível</option>
              {characters.filter(c => c.id !== characterId).map(c => <option key={c.id} value={c.id}>{c.name} · nível {c.level}</option>)}
            </select>
          </label>}

          {role === "MASTER" && selected?.regressionRisk && <div className="border border-red-400/40 bg-red-950/15 p-3 text-xs text-red-100">
            <p>Este personagem está em risco de regressão de Rank. O Mestre pode solicitar um teste de Vigor; falha absoluta ou fracasso reduz o Rank em uma faixa.</p>
            {selected.canLoseRank ? <button type="button" onClick={rollRegressionCheck} disabled={isPending} className="mt-3 border border-red-300/40 px-3 py-2 text-[10px] uppercase tracking-widest hover:bg-red-300/10 disabled:opacity-50">{isPending ? "Sorteando…" : "Testar Vigor contra regressão"}</button> : <p className="mt-2">O personagem já está no Rank D; não pode perder outra faixa.</p>}
          </div>}

          <div className="space-y-2 border border-bege-escuro/25 p-3">
            <p className="text-[10px] uppercase tracking-widest text-bege-medio">Recuperação</p>
            <p className="text-[11px] text-bege-escuro/80">O mesmo teste recupera PV e PM. Ás conta como Fracasso; Rei e Rainha contam como Excepcional.</p>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => rest('curto')} disabled={isPending || !characterId} className="border border-bege-escuro/30 px-3 py-2 text-[10px] uppercase tracking-widest disabled:opacity-50">Descanso curto</button>
              <button type="button" onClick={() => rest('longo')} disabled={isPending || !characterId} className="border border-bege-escuro/30 px-3 py-2 text-[10px] uppercase tracking-widest disabled:opacity-50">Descanso longo</button>
            </div>
          </div>

          {role === "PLAYER" ? <>
            <label className="flex items-start gap-2 text-xs text-bege-escuro/80"><input type="checkbox" checked={offensive} onChange={e => setOffensive(e.target.checked)} disabled={isPending} className="mt-0.5" />Este teste faz parte de uma ação ofensiva</label>
            <label className="block text-[10px] uppercase tracking-widest text-bege-medio">Atributo do teste
              <select value={attribute} onChange={e => setAttribute(e.target.value as Attribute)} disabled={isPending} className="mt-2 w-full border border-bege-escuro/30 bg-[#1d1020] p-3 text-sm normal-case text-bege-claro">
                {ATTRIBUTES.map(a => <option key={a.id} value={a.id}>{a.label} · {attributeValue(a.id)}</option>)}
              </select>
            </label>
            <p className="text-xs leading-relaxed text-bege-escuro/80">{ATTRIBUTES.find(a => a.id === attribute)?.suggestion}</p>
            <button type="button" onClick={() => roll(attribute)} disabled={isPending || !characterId} className="flex w-full items-center justify-center gap-2 border border-bege-medio/50 px-4 py-3 text-xs uppercase tracking-widest hover:bg-bege-medio/10 disabled:opacity-50">
              {isPending ? <LoaderCircle size={15} className="animate-spin" /> : <Dices size={15} />} Realizar teste
            </button>
          </> : <div className="space-y-2">
            <label className="flex items-start gap-2 text-xs text-bege-escuro/80"><input type="checkbox" checked={offensive} onChange={e => setOffensive(e.target.checked)} disabled={isPending} className="mt-0.5" />Esta ação é ofensiva</label>
            <p className="text-[10px] uppercase tracking-widest text-bege-medio">Testes sugeridos</p>
            {ATTRIBUTES.map(a => <button key={a.id} type="button" onClick={() => roll(a.id)} disabled={isPending || !characterId} className="flex w-full items-center justify-between gap-3 border border-bege-escuro/25 px-3 py-2 text-left hover:border-bege-medio/60 disabled:opacity-50">
              <span><span className="block text-xs uppercase">{a.label} · {attributeValue(a.id)}</span><span className="mt-1 block text-[11px] text-bege-escuro/80">{a.suggestion}</span></span>
              {isPending && attribute === a.id ? <LoaderCircle size={15} className="shrink-0 animate-spin" /> : <Dices size={15} className="shrink-0 text-bege-medio" />}
            </button>)}
          </div>}

          {outcome && <article aria-live="polite" className="border border-bege-medio/40 bg-[#1d1020] p-4">
            <p className="text-[10px] uppercase tracking-widest text-bege-medio">{outcome.characterName}{outcome.opponentName ? ` × ${outcome.opponentName}` : ""} · Teste de {outcome.attributeName} ({outcome.attributeValue})</p>
            {outcome.result !== "Sem teste" && <><p className="mt-3 font-title text-lg">{outcome.card}</p><p className="mt-1 text-sm">{outcome.baseResult}{outcome.baseResult !== outcome.result ? " → " + outcome.result : ""}</p></>}
            {outcome.result === "Sem teste" && <p className="mt-3 font-title text-base">Sem tiragem — resolva narrativamente.</p>}
            {outcome.result !== "Sem teste" && <p className="mt-2 text-sm">Atributo ajustado: <strong>{outcome.adjustedAttribute}</strong>{outcome.shieldBonus ? ` (inclui +${outcome.shieldBonus} do escudo)` : ''}.</p>}
            {outcome.result !== "Sem teste" && <div className="mt-3 border-t border-bege-escuro/20 pt-3">
              <p className="text-[10px] uppercase tracking-widest text-bege-medio">Condições e penalidades consideradas</p>
              {outcome.conditionModifiers.length ? <ul className="mt-2 space-y-1 text-xs">{outcome.conditionModifiers.map((modifier, index) => <li key={`${modifier.condition}-${index}`}>{modifier.label}: {modifier.penalty < 0 ? `${modifier.penalty} no teste` : 'sem penalidade neste teste'}</li>)}</ul> : <p className="mt-2 text-xs text-bege-escuro/80">Nenhuma condição ativa.</p>}
              <p className="mt-2 text-xs">Penalidade de Rank: {outcome.rankPenalty ? `−${outcome.rankPenalty}` : 'nenhuma'} · Penalidade total aplicada: −{outcome.totalPenalty} (máximo −4).</p>
            </div>}
            {outcome.levelDifference != null && outcome.levelRuleNote && <p className="mt-2 text-xs text-amber-100">Diferença de {outcome.levelDifference} níveis: {outcome.levelRuleNote}</p>}
            {outcome.result !== "Sem teste" && outcome.rankPenalty > 0 && <p className="mt-2 text-xs text-amber-200">Penalidade de Rank: −{outcome.rankPenalty} no atributo considerado para este teste.</p>}
            {outcome.result !== "Sem teste" && !!outcome.shieldBonus && <p className="mt-2 text-xs text-amber-200">Bônus de bloqueio do escudo: +{outcome.shieldBonus} em Vigor.</p>}
            {outcome.result !== "Sem teste" && <p className="mt-1 text-[11px] text-bege-escuro/80">A Sorte influencia a probabilidade de cada carta: {outcome.luckPower / 100}× de força relativa para cartas favoráveis.</p>}
            {outcome.specialCardsCollected.length > 0 && <p className="mt-2 flex items-center gap-1 text-xs text-bege-medio"><Sparkles size={13} /> Carta(s) especial(is) guardada(s): {outcome.specialCardsCollected.join(", ")}</p>}
            {outcome.attributeAboveTenNote && <p className="mt-2 text-[11px] text-bege-escuro/80">{outcome.attributeAboveTenNote}</p>}
            {outcome.regressionRisk && <p className="mt-2 text-xs text-red-200">O personagem continua em risco de regressão; o Mestre pode solicitar um teste de Vigor.</p>}
            {role === "MASTER" && outcome.result !== "Sem teste" && <div className="mt-4 space-y-3 border-t border-bege-escuro/25 pt-3">
              <p className="text-[10px] uppercase tracking-widest text-bege-medio">Calcular dano do ataque</p>
              <label className="block text-xs">Aplicação do combate<select value={combatMode} onChange={e => setCombatMode(e.target.value as "manual" | "automatico")} disabled={isPending || damageApplied} className="mt-1 w-full border border-bege-escuro/30 bg-[#1d1020] p-2 text-sm text-bege-claro"><option value="manual">Manual — mostrar o cálculo</option><option value="automatico">Automática — aplicar PV e desgaste</option></select></label>
              <label className="block text-xs">Alvo<select value={damageTargetId} onChange={e => { setDamageTargetId(e.target.value); setArmorItemId(""); setShieldItemId(""); }} className="mt-1 w-full border border-bege-escuro/30 bg-[#1d1020] p-2 text-sm text-bege-claro"><option value="">Selecione o alvo</option>{characters.map(c => <option key={c.id} value={c.id}>{c.name} · {c.pvMax} PV máx.</option>)}</select></label>
              <div className="grid gap-2 sm:grid-cols-2">
                <label className="text-xs">Tipo<select value={damageType} onChange={e => setDamageType(e.target.value as DamageType)} className="mt-1 w-full border border-bege-escuro/30 bg-[#1d1020] p-2 text-sm text-bege-claro"><option value="fisico">Físico</option><option value="elemental">Elemental</option><option value="mental">Mental / espiritual</option></select></label>
                <label className="text-xs">Potência {selectedWeapon ? "(definida pela raridade da arma)" : ""}<select value={selectedWeapon ? effectivePotency : potency} disabled={!!selectedWeapon} onChange={e => setPotency(e.target.value as keyof typeof POTENCY_SHIFT)} className="mt-1 w-full border border-bege-escuro/30 bg-[#1d1020] p-2 text-sm text-bege-claro disabled:opacity-70"><option value="infima">Ínfima (−2)</option><option value="fraca">Fraca (−1)</option><option value="normal">Normal</option><option value="forte">Forte (+1)</option><option value="devastadora">Devastadora (+2)</option></select></label>
                <label className="text-xs">Resistência do alvo<select value={resistanceShift} onChange={e => setResistanceShift(Number(e.target.value) as -1 | 0 | 1)} className="mt-1 w-full border border-bege-escuro/30 bg-[#1d1020] p-2 text-sm text-bege-claro"><option value={0}>Nenhuma</option><option value={-1}>Resistente (−1 faixa)</option><option value={1}>Vulnerável (+1 faixa)</option></select></label>
                {damageType === "fisico" && <>
                  <label className="text-xs">Arma do atacante<select value={weaponItemId} onChange={e => setWeaponItemId(e.target.value)} className="mt-1 w-full border border-bege-escuro/30 bg-[#1d1020] p-2 text-sm text-bege-claro"><option value="">Sem arma selecionada</option>{selected?.equipment.filter(item => item.type === "arma").map(item => <option key={item.id} value={item.id}>{item.name} · {getWeaponPotency(item.rarity, item.durability === 0)}{item.durability === 0 ? ' · Quebrada' : ''}{item.effects.some(effect => effect.rule === "perfurante") ? " · Perfurante" : ""}</option>)}</select></label>
                  <label className="text-xs">Armadura do alvo<select value={armorItemId} onChange={e => setArmorItemId(e.target.value)} className="mt-1 w-full border border-bege-escuro/30 bg-[#1d1020] p-2 text-sm text-bege-claro"><option value="">Sem armadura selecionada</option>{damageTarget?.equipment.filter(item => item.type === "armadura").map(item => <option key={item.id} value={item.id}>{item.name} · {getArmorProtection(item.subtype, item.rarity, item.durability === 0)} pp{item.durability === 0 ? ' · Quebrada' : ''}</option>)}</select></label>
                  <label className="text-xs">Escudo (bônus no teste de bloqueio)<select value={shieldItemId} onChange={e => setShieldItemId(e.target.value)} className="mt-1 w-full border border-bege-escuro/30 bg-[#1d1020] p-2 text-sm text-bege-claro"><option value="">Sem escudo selecionado</option>{damageTarget?.equipment.filter(item => item.type === "escudo").map(item => <option key={item.id} value={item.id}>{item.name} · +{getShieldBlockBonus(item.rarity, item.durability === 0)}{item.durability === 0 ? ' · Quebrado' : ''}</option>)}</select></label>
                  <label className="text-xs">Proteção manual adicional (pontos percentuais)<input type="number" min={0} max={20} value={armorPP} onChange={e => setArmorPP(Math.min(20, Math.max(0, Number(e.target.value) || 0)))} className="mt-1 w-full border border-bege-escuro/30 bg-[#1d1020] p-2 text-sm text-bege-claro" /></label>
                </>}
              </div>
              <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={immune} onChange={e => setImmune(e.target.checked)} />Alvo imune a este tipo de dano</label>
              {damageTarget && <><p aria-live="polite" className="text-sm">Dano calculado: <strong>{immune ? 0 : damageEstimate?.pv ?? 0} PV</strong> ({immune ? "imunidade" : `${Math.round(DAMAGE_RATE[outcome.result] * 100)}% base${damageEstimate?.adjustedPercent !== Math.round(DAMAGE_RATE[outcome.result] * 100) ? ` → ${damageEstimate?.adjustedPercent}% após potência/resistência` : ""}, ${damageEstimate?.percent ?? 0}% final dos ${damageTarget.pvMax} PV máximos${damageType === "fisico" && (damageEstimate?.totalProtection ?? 0) > 0 ? penetration ? "; Perfurante ignora a redução da armadura" : `; armadura reduz ${damageEstimate?.totalProtection} pp` : ""}${shieldBlock ? `; escudo concede +${shieldBlock} no teste de bloqueio` : ""}`}). {combatMode === 'manual' ? 'Aplique esse dano manualmente na ficha.' : 'O modo automático atualiza PV e durabilidade conforme o resultado.'}</p>
                {combatMode === 'automatico' && <button type="button" onClick={applyDamageAutomatically} disabled={isPending || damageApplied || immune || !damageEstimate} className="w-full border border-bege-medio/50 px-3 py-2 text-xs uppercase tracking-widest hover:bg-bege-medio/10 disabled:opacity-50">{isPending ? 'Aplicando…' : damageApplied ? 'Resultado aplicado' : `Aplicar ${damageEstimate?.pv ?? 0} PV e desgaste`}</button>}
                {damageApplied && <p className="text-xs text-emerald-200">Dano e desgaste aplicados. O resultado não pode ser aplicado novamente.</p>}
              </>}
            </div>}
          </article>}
          {restOutcome && <article aria-live="polite" className="border border-bege-medio/40 bg-[#1d1020] p-4">
            <p className="text-[10px] uppercase tracking-widest text-bege-medio">Descanso {restOutcome.restType} · {restOutcome.characterName}</p>
            <p className="mt-3 font-title text-lg">{restOutcome.card} — {restOutcome.result}</p>
            <p className="mt-2 text-sm">Recuperou {restOutcome.pvRecovered} PV ({restOutcome.pv}/{restOutcome.pvMax}) e {restOutcome.pmRecovered} PM ({restOutcome.pm}/{restOutcome.pmMax}).</p>
            {restOutcome.specialCardsCollected.length > 0 && <p className="mt-2 text-xs text-bege-medio">Cartas especiais guardadas: {restOutcome.specialCardsCollected.join(", ")}</p>}
          </article>}
          {regressionOutcome && <article aria-live="polite" className="border border-red-300/40 bg-[#1d1020] p-4">
            <p className="text-[10px] uppercase tracking-widest text-bege-medio">Teste de Vigor · {regressionOutcome.characterName} ({regressionOutcome.vigor})</p>
            <p className="mt-3 font-title text-lg">{regressionOutcome.card} — {regressionOutcome.result}</p>
            <p className="mt-2 text-sm">{regressionOutcome.rankLost ? `Falha: Rank ${regressionOutcome.rankBefore} → ${regressionOutcome.rankAfter}.` : `O Rank ${regressionOutcome.rankBefore} foi mantido.`}</p>
            {regressionOutcome.specialCardsCollected.length > 0 && <p className="mt-2 text-xs">Cartas especiais guardadas: {regressionOutcome.specialCardsCollected.join(", ")}</p>}
          </article>}
        </div>

        <aside className="space-y-4">
          <section className="border border-bege-escuro/25 p-4">
            <h3 className="font-title text-xs uppercase tracking-widest text-bege-medio">Resultado das cartas</h3>
            <ul className="mt-3 space-y-2 text-xs">
              <li>Ás — Falha Absoluta</li><li>2–3 — Fracasso</li><li>4–7 — Parcial</li><li>8–10 — Sucesso</li><li>Rei — Sucesso Garantido</li><li>Rainha — Excepcional</li>
            </ul>
            <p className="mt-3 text-[11px] leading-relaxed text-bege-escuro/80">Valete: ativa uma habilidade sem consumir a ação normal. Cavaleiro: concede uma ação completa extra. Só é possível usar uma carta especial por cena; o Mestre libera o uso ao iniciar a próxima cena. Ao encontrar um deles no teste, ele é guardado e outra carta determina o resultado.</p>
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
            <p className="mt-2 text-xs leading-relaxed">O dano base é calculado sobre os PV máximos do alvo: falha 0%, parcial 15%, sucesso/Rei 25% e excepcional/Rainha 40%. A raridade da arma define sua Potência; resistência desloca o resultado na escala 0%, 15%, 25%, 40% e 60%, com limite combinado de duas faixas. Imunidade zera o dano. Armaduras reduzem dano físico em pontos percentuais (teto 20); Perfurante ignora essa redução. Escudos concedem bônus ao teste de bloqueio, não reduzem dano diretamente. O resultado é arredondado para cima e precisa ser aplicado pelo Mestre.</p>
            <p className="mt-2 text-xs leading-relaxed">A Sorte aumenta o peso das cartas favoráveis (8–10, Rainha e Rei) e reduz o peso das cartas de falha (Ás e 2–3). O efeito cresce com o atributo Sorte em relação ao limite do Rank e com o próprio Rank; no Rank D é discreto e no S pode chegar ao fator máximo de 5.</p>
          </section>}
          <section className="border border-bege-escuro/25 p-4">
            <h3 className="font-title text-xs uppercase tracking-widest text-bege-medio">Rank e diferença de nível</h3>
            <ul className="mt-3 space-y-2 text-xs leading-relaxed">
              <li>Totais esperados: C 36+, B 46+, A 56+ e S 66+.</li>
              <li>Faixa leve (C 33–35, B 43–45, A 53–55, S 63–65): −1 nos testes. Faixa grave (C 30–32, B 40–42, A 50–52, S 60–62): −2.</li>
              <li>Abaixo da faixa grave, o Mestre pode pedir teste de Vigor. Falha absoluta ou fracasso faz perder uma faixa de Rank; o Rank não cai abaixo do Rank de nascença e raças corrompidas não regridem.</li>
              <li>Diferença de até 20 níveis: teste normal. De 21 a 50: sucesso do personagem mais fraco vira parcial. Acima de 50: sem tiragem, resolução narrativa pelo Mestre.</li>
            </ul>
          </section>
        </aside>
      </div>}
    </section>
  );
}
