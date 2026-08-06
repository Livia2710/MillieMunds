"use client";

import { useState, useTransition } from "react";
import { useSession } from "next-auth/react";
import { updateProfile, updatePassword } from "@/app/actions/auth";
import MillieImageUpload from "@/componentes/ui/MillieImageUpload";
import MillieInput from "@/componentes/ui/MillieInput";
import { ConfigSection, ConfigActionButton } from "./shared";

export default function TabConta() {
  const { data: session, update } = useSession();
  const [isPending, startTransition] = useTransition();

  const [username, setUsername] = useState(session?.user?.name ?? "");
  const [avatar, setAvatar] = useState(session?.user?.image ?? "");
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [feedback, setFeedback] = useState<{ type: "ok" | "erro"; msg: string } | null>(null);

  function handleSaveProfile() {
    startTransition(async () => {
      try {
        await updateProfile({ username, avatar });
        await update();
        setFeedback({ type: "ok", msg: "Perfil atualizado com sucesso." });
      } catch (e: any) {
        setFeedback({ type: "erro", msg: e.message });
      }
    });
  }

  function handleSavePassword() {
    if (!newPw) return;
    startTransition(async () => {
      try {
        await updatePassword(currentPw, newPw);
        setCurrentPw("");
        setNewPw("");
        setFeedback({ type: "ok", msg: "Senha alterada com sucesso." });
      } catch (e: any) {
        setFeedback({ type: "erro", msg: e.message });
      }
    });
  }

  return (
    <ConfigSection title="Informações da Conta">
      <div className="flex flex-col gap-1 border-b border-bege-escuro/10 pb-5">
        <p className="font-title text-[10px] uppercase tracking-[0.18em] text-bege-escuro/50">Avatar</p>
        <div className="mt-2">
          <MillieImageUpload value={avatar} onChange={setAvatar} label="Trocar avatar" />
        </div>
        <p className="mt-1 text-[11px] text-bege-escuro/40">Aparece no cabeçalho e nos cards de perfil.</p>
      </div>

      <div className="flex flex-col gap-1 border-b border-bege-escuro/10 pb-5">
        <p className="font-title text-[10px] uppercase tracking-[0.18em] text-bege-escuro/50">Username</p>
        <MillieInput value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Seu nome na campanha" />
        <p className="mt-1 text-[11px] text-bege-escuro/40">Visível para outros jogadores na campanha.</p>
      </div>

      <div className="flex flex-col gap-1 border-b border-bege-escuro/10 pb-5">
        <p className="font-title text-[10px] uppercase tracking-[0.18em] text-bege-escuro/50">Email</p>
        <p className="font-title text-sm text-bege-claro/60">{session?.user?.email}</p>
        <p className="mt-1 text-[11px] text-bege-escuro/40">O email não pode ser alterado.</p>
      </div>

      <ConfigActionButton label={isPending ? "Salvando..." : "Salvar perfil"} onClick={handleSaveProfile} disabled={isPending} />

      <div className="pt-4">
        <p className="mb-4 font-title text-xs uppercase tracking-[0.16em] text-bege-escuro/50">Alterar senha</p>
        <div className="flex flex-col gap-3">
          <MillieInput type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} placeholder="Senha atual" />
          <MillieInput type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="Nova senha" />
        </div>
        <div className="mt-4">
          <ConfigActionButton
            label={isPending ? "Salvando..." : "Alterar senha"}
            onClick={handleSavePassword}
            disabled={isPending || !currentPw || !newPw}
          />
        </div>
      </div>

      {feedback && (
        <p className={`font-title text-xs uppercase tracking-wider ${feedback.type === "ok" ? "text-terra" : "text-red-400"}`}>
          {feedback.msg}
        </p>
      )}
    </ConfigSection>
  );
}