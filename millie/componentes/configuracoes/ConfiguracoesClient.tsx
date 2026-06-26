"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import {User, Sliders, Bell, BookOpen, Trash2, ChevronRight, Download, ExternalLink} from "lucide-react";
import { useSession } from 'next-auth/react'
import { updateProfile, updatePassword } from '@/app/actions/auth'
import MillieImageUpload from '@/componentes/ui/MillieImageUpload'
import MillieInput from '@/componentes/ui/MillieInput'

type ConfigTab = "conta" | "preferencias" | "notificacoes" | "biblioteca" | "campanha";

const TABS: { key: ConfigTab; label: string; icon: React.ReactNode }[] = [
  { key: "conta", label: "Conta", icon: <User size={15} strokeWidth={1.5} /> },
  { key: "preferencias", label: "Preferências", icon: <Sliders size={15} strokeWidth={1.5} /> },
  { key: "notificacoes", label: "Notificações", icon: <Bell size={15} strokeWidth={1.5} /> },
  { key: "biblioteca", label: "Biblioteca", icon: <BookOpen size={15} strokeWidth={1.5} /> },
  { key: "campanha", label: "Campanha", icon: <Trash2 size={15} strokeWidth={1.5} /> },
];

// PDFs mockados — futuramente virão do banco
const MOCK_PDFS = [
  {
    id: "sistema-basico",
    title: "Sistema Básico",
    description: "Regras fundamentais do sistema Millie Munds.",
    category: "Sistema",
    size: "2.4 MB",
    available: true,
  },
  {
    id: "compendio-racas",
    title: "Compêndio de Raças",
    description: "Mais de 200 raças catalogadas do multiverso. Em finalização.",
    category: "Compêndio",
    size: "18 MB",
    available: false, // ainda não finalizado
  },
  {
    id: "universo-arcan",
    title: "Universo Arcan",
    description: "Lore completo do universo Arcan com mapas e história.",
    category: "Universo",
    size: "5.1 MB",
    available: true,
  },
  {
    id: "universo-bestiariu",
    title: "Universo Bestiarius",
    description: "Criaturas, reinos e a política do Reino Bestial.",
    category: "Universo",
    size: "3.8 MB",
    available: true,
  },
  {
    id: "universo-gaia",
    title: "Universo Gaia",
    description: "O mundo que não deveria existir. Floresta Ancestral e além.",
    category: "Universo",
    size: "4.2 MB",
    available: true,
  },
];

export default function ConfiguracoesClient() {
  const [activeTab, setActiveTab] = useState<ConfigTab>("conta");

  return (
    <div className="space-y-8">

      {/* Cabeçalho */}
      <div>
        <h1 className="font-title text-4xl uppercase tracking-[0.08em] text-bege-medio md:text-5xl">
          Configurações
        </h1>
        <Image src="/assets/svgs/divider.svg" alt="" width={320} height={20}
          className="mt-3 max-w-[200px] md:max-w-xs" />
      </div>

      {/* Tabs laterais em desktop, horizontal em mobile */}
      <div className="flex min-w-0 flex-col gap-8 md:flex-row md:gap-12">

        {/* Nav de tabs */}
        <nav className="flex w-full flex-wrap gap-1 md:w-44 md:flex-col md:flex-nowrap">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            const isDanger = tab.key === "campanha";

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`flex h-10 w-10 items-center justify-center border-b-2 transition-all sm:h-auto sm:w-auto sm:justify-start sm:gap-3 sm:px-3 sm:py-2.5 md:border-b-0 md:border-l-2
                ${isActive
                    ? isDanger
                    ? "border-red-500/60 text-red-400"
                    : "border-bege-medio text-bege-medio"
                    : isDanger
                    ? "border-transparent text-red-500/40 hover:text-red-400"
                    : "border-transparent text-bege-escuro/50 hover:text-bege-medio"
                }
             `}
              >
                <span className="shrink-0">{tab.icon}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Conteúdo da tab ativa */}
        <div className="flex-1 min-w-0">
          {activeTab === "conta"        && <TabConta />}
          {activeTab === "preferencias" && <TabPreferencias />}
          {activeTab === "notificacoes" && <TabNotificacoes />}
          {activeTab === "biblioteca"   && <TabBiblioteca />}
          {activeTab === "campanha"     && <TabCampanha />}
        </div>
      </div>
    </div>
  );
}

// ─── SEÇÃO: CONTA ────────────────────────────────────────────────────────────

function TabConta() {
  const { data: session, update } = useSession()
  const [isPending, startTransition] = useTransition()

  const [username, setUsername] = useState(session?.user?.name ?? '')
  const [avatar,   setAvatar]   = useState(session?.user?.image ?? '')
  const [currentPw, setCurrentPw] = useState('')
  const [newPw,     setNewPw]     = useState('')
  const [feedback,  setFeedback]  = useState<{ type: 'ok' | 'erro'; msg: string } | null>(null)

  function handleSaveProfile() {
    startTransition(async () => {
      try {
        await updateProfile({ username, avatar })
        await update()   // atualiza a sessão NextAuth no cliente
        setFeedback({ type: 'ok', msg: 'Perfil atualizado com sucesso.' })
      } catch (e: any) {
        setFeedback({ type: 'erro', msg: e.message })
      }
    })
  }

  function handleSavePassword() {
    if (!newPw) return
    startTransition(async () => {
      try {
        await updatePassword(currentPw, newPw)
        setCurrentPw('')
        setNewPw('')
        setFeedback({ type: 'ok', msg: 'Senha alterada com sucesso.' })
      } catch (e: any) {
        setFeedback({ type: 'erro', msg: e.message })
      }
    })
  }

  return (
    <ConfigSection title="Informações da Conta">

      {/* Avatar */}
      <div className="flex flex-col gap-1 border-b border-bege-escuro/10 pb-5">
        <p className="font-title text-[10px] uppercase tracking-[0.18em] text-bege-escuro/50">Avatar</p>
        <div className="mt-2">
          <MillieImageUpload
            value={avatar}
            onChange={setAvatar}
            label="Trocar avatar"
          />
        </div>
        <p className="mt-1 text-[11px] text-bege-escuro/40">Aparece no cabeçalho e nos cards de perfil.</p>
      </div>

      {/* Username */}
      <div className="flex flex-col gap-1 border-b border-bege-escuro/10 pb-5">
        <p className="font-title text-[10px] uppercase tracking-[0.18em] text-bege-escuro/50">Username</p>
        <MillieInput
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Seu nome na campanha"
        />
        <p className="mt-1 text-[11px] text-bege-escuro/40">Visível para outros jogadores na campanha.</p>
      </div>

      {/* Email — só leitura */}
      <div className="flex flex-col gap-1 border-b border-bege-escuro/10 pb-5">
        <p className="font-title text-[10px] uppercase tracking-[0.18em] text-bege-escuro/50">Email</p>
        <p className="font-title text-sm text-bege-claro/60">{session?.user?.email}</p>
        <p className="mt-1 text-[11px] text-bege-escuro/40">O email não pode ser alterado.</p>
      </div>

      <ConfigActionButton
        label={isPending ? 'Salvando...' : 'Salvar perfil'}
        onClick={handleSaveProfile}
        disabled={isPending}
      />

      {/* Separador senha */}
      <div className="pt-4">
        <p className="mb-4 font-title text-xs uppercase tracking-[0.16em] text-bege-escuro/50">Alterar senha</p>
        <div className="flex flex-col gap-3">
          <MillieInput
            type="password"
            value={currentPw}
            onChange={(e) => setCurrentPw(e.target.value)}
            placeholder="Senha atual"
          />
          <MillieInput
            type="password"
            value={newPw}
            onChange={(e) => setNewPw(e.target.value)}
            placeholder="Nova senha"
          />
        </div>
        <div className="mt-4">
          <ConfigActionButton
            label={isPending ? 'Salvando...' : 'Alterar senha'}
            onClick={handleSavePassword}
            disabled={isPending || !currentPw || !newPw}
          />
        </div>
      </div>

      {/* Feedback */}
      {feedback && (
        <p className={`font-title text-xs uppercase tracking-wider ${
          feedback.type === 'ok' ? 'text-terra' : 'text-red-400'
        }`}>
          {feedback.msg}
        </p>
      )}
    </ConfigSection>
  )
}

// ─── SEÇÃO: PREFERÊNCIAS ─────────────────────────────────────────────────────

function TabPreferencias() {
  return (
    <ConfigSection title="Preferências Visuais e de Sistema">
      <ToggleRow
        label="Animações da interface"
        description="Inclui a animação de órbita na tela de Habilidades e transições de página."
        defaultChecked={true}
      />
      <ToggleRow
        label="Efeito de textura de papel"
        description="Camada overlay de papel sobre toda a interface."
        defaultChecked={true}
      />
      <ToggleRow
        label="Sons de interface"
        description="Sons ao virar cartas e interagir com elementos arcanos."
        defaultChecked={false}
      />

      <div className="mt-6 border-t border-bege-escuro/20 pt-6">
        <p className="mb-3 font-title text-xs uppercase tracking-[0.16em] text-bege-escuro/50">Idioma</p>
        <div className="relative w-48">
          <select className="w-full appearance-none border border-bege-escuro/40 bg-roxo-escuro px-4 py-2.5 pr-8 font-title text-xs uppercase tracking-wider text-bege-medio outline-none cursor-pointer">
            <option className="bg-roxo-escuro">Português (BR)</option>
            <option className="bg-roxo-escuro">English</option>
          </select>
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-bege-escuro/50">▼</span>
        </div>
      </div>

      <ConfigActionButton label="Salvar preferências" />
    </ConfigSection>
  );
}

// ─── SEÇÃO: NOTIFICAÇÕES ─────────────────────────────────────────────────────

function TabNotificacoes() {
  return (
    <ConfigSection title="Notificações">
      <ToggleRow
        label="Novas sessões de campanha"
        description="Quando o Mestre agendar ou iniciar uma nova sessão."
        defaultChecked={true}
      />
      <ToggleRow
        label="Itens adicionados ao inventário"
        description="Quando o Mestre adicionar um item ao seu inventário."
        defaultChecked={true}
      />
      <ToggleRow
        label="Habilidades desbloqueadas"
        description="Quando você subir de nível e desbloquear novas habilidades."
        defaultChecked={true}
      />
      <ToggleRow
        label="Atualizações do sistema"
        description="Novos conteúdos, raças e mundos adicionados ao Millie Munds."
        defaultChecked={false}
      />

      <ConfigActionButton label="Salvar notificações" />
    </ConfigSection>
  );
}

// ─── SEÇÃO: BIBLIOTECA ───────────────────────────────────────────────────────

function TabBiblioteca() {
  return (
    <ConfigSection title="Biblioteca de PDFs">
      <p className="mb-6 text-sm leading-relaxed text-bege-claro/60">
        Aqui ficam todos os materiais do universo Millie Munds — sistema, raças e lore dos mundos.
        PDFs marcados como <span className="font-title text-bege-escuro uppercase tracking-wider">em breve</span> ainda
        estão sendo finalizados.
      </p>

      <div className="flex flex-col gap-3">
        {MOCK_PDFS.map((pdf) => (
          <div
            key={pdf.id}
            className={`
              flex items-center justify-between gap-4 border p-4 transition-all
              ${pdf.available
                ? "border-bege-escuro/35 hover:border-bege-medio/50"
                : "border-bege-escuro/15 opacity-50"
              }
            `}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-title text-sm uppercase tracking-wider text-bege-claro truncate">
                  {pdf.title}
                </p>
                <span className="shrink-0 rounded-sm border border-bege-escuro/30 px-1.5 py-0.5 font-title text-[9px] uppercase tracking-widest text-bege-escuro/60">
                  {pdf.available ? pdf.category : "Em breve"}
                </span>
              </div>
              <p className="mt-0.5 text-xs leading-relaxed text-bege-claro/50">
                {pdf.description}
              </p>
              {pdf.available && (
                <p className="mt-1 font-mono text-[10px] text-bege-escuro/40">{pdf.size}</p>
              )}
            </div>

            {pdf.available ? (
              <button
                type="button"
                className="flex shrink-0 items-center gap-2 border border-bege-escuro/40 px-3 py-2 font-title text-[10px] uppercase tracking-widest text-bege-medio transition hover:border-bege-medio hover:text-bege-claro"
              >
                <Download size={12} strokeWidth={1.5} />
                Baixar
              </button>
            ) : (
              <span className="shrink-0 font-title text-[10px] uppercase tracking-widest text-bege-escuro/30">
                Indisponível
              </span>
            )}
          </div>
        ))}
      </div>
    </ConfigSection>
  );
}

// ─── SEÇÃO: CAMPANHA ─────────────────────────────────────────────────────────

function TabCampanha() {
  return (
    <ConfigSection title="Gerenciar Campanha">

      {/* Ações não destrutivas */}
      <div className="flex flex-col gap-3 mb-8">
        <DangerRow
          label="Sair da campanha"
          description="Você sai como jogador, mas o personagem e o progresso permanecem salvos pelo Mestre."
          buttonLabel="Sair"
          variant="soft"
        />
        <DangerRow
          label="Transferir liderança"
          description="Passa o papel de Mestre para outro jogador da campanha."
          buttonLabel="Transferir"
          variant="soft"
        />
      </div>

      {/* Zona de perigo */}
      <div className="border border-red-500/20 p-5">
        <p className="mb-4 font-title text-xs uppercase tracking-[0.18em] text-red-500/60">
          Zona de perigo
        </p>
        <div className="flex flex-col gap-3">
          <DangerRow
            label="Arquivar campanha"
            description="A campanha fica oculta mas pode ser restaurada. Todos os dados são preservados."
            buttonLabel="Arquivar"
            variant="danger"
          />
          <DangerRow
            label="Excluir campanha permanentemente"
            description="Todos os personagens, mundos e inventários serão apagados. Ação irreversível."
            buttonLabel="Excluir"
            variant="critical"
          />
        </div>
      </div>
    </ConfigSection>
  );
}

// ─── COMPONENTES AUXILIARES ──────────────────────────────────────────────────

function ConfigSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-title text-xl uppercase tracking-[0.14em] text-bege-medio">
          {title}
        </h2>
        <div className="mt-2 h-px w-full bg-bege-escuro/20" />
      </div>
      {children}
    </div>
  );
}

function FieldRow({
  label, value, hint, isImage = false,
}: {
  label: string; value: string; hint: string; isImage?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1 border-b border-bege-escuro/10 pb-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="font-title text-[10px] uppercase tracking-[0.18em] text-bege-escuro/50">
            {label}
          </p>
          <p className="mt-0.5 font-title text-sm text-bege-claro/80 truncate">
            {value}
          </p>
          <p className="mt-0.5 text-[11px] text-bege-escuro/40">{hint}</p>
        </div>
        <button
          type="button"
          className="flex shrink-0 items-center gap-1.5 border border-bege-escuro/30 px-3 py-1.5 font-title text-[10px] uppercase tracking-widest text-bege-escuro/60 transition hover:border-bege-medio hover:text-bege-medio"
        >
          Editar
          <ChevronRight size={10} />
        </button>
      </div>
    </div>
  );
}

function ToggleRow({
  label, description, defaultChecked,
}: {
  label: string; description: string; defaultChecked: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-bege-escuro/10 pb-4">
      <div className="flex-1 min-w-0">
        <p className="font-title text-sm uppercase tracking-wider text-bege-claro/80">{label}</p>
        <p className="mt-0.5 text-[11px] leading-relaxed text-bege-escuro/50">{description}</p>
      </div>

      {/* Toggle visual — sem lógica real por agora */}
      <div
        className={`
          relative mt-0.5 h-5 w-9 shrink-0 cursor-pointer rounded-full border transition-all
          ${defaultChecked
            ? "border-bege-medio bg-bege-medio/20"
            : "border-bege-escuro/40 bg-transparent"
          }
        `}
      >
        <div
          className={`
            absolute top-0.5 h-3.5 w-3.5 rounded-full transition-all
            ${defaultChecked
              ? "left-[18px] bg-bege-medio"
              : "left-0.5 bg-bege-escuro/40"
            }
          `}
        />
      </div>
    </div>
  );
}

function DangerRow({
  label, description, buttonLabel, variant,
}: {
  label: string; description: string; buttonLabel: string;
  variant: "soft" | "danger" | "critical";
}) {
  const buttonStyles = {
    soft:     "border-bege-escuro/30 text-bege-escuro/60 hover:border-bege-medio hover:text-bege-medio",
    danger:   "border-red-500/30 text-red-500/60 hover:border-red-400 hover:text-red-400",
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
        className={`shrink-0 border px-4 py-2 font-title text-[10px] uppercase tracking-widest transition ${buttonStyles[variant]}`}
      >
        {buttonLabel}
      </button>
    </div>
  );
}

function ConfigActionButton({ label, onClick, disabled=false }: { label: string; onClick?: () => void; disabled?:boolean }) {
  return (
    <div className="pt-2">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className="arcane-hover relative h-12 border border-bege-escuro/40 px-8 font-title text-sm uppercase tracking-[0.18em] text-bege-escuro transition hover:border-bege-medio hover:text-bege-medio overflow-hidden"
      >
        {label}
      </button>
    </div>
  );
}