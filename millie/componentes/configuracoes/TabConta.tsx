"use client";

import { useState, useTransition } from "react";
import { useSession } from "next-auth/react";
import { updateProfile, updatePassword } from "@/app/actions/auth";
import MillieImageUpload from "@/componentes/ui/MillieImageUpload";
import MillieInput from "@/componentes/ui/MillieInput";
import { ConfigSection, ConfigActionButton } from "./shared";
import { useToast } from "@/componentes/ui/ToastProvider";

export default function TabConta({ initial }: { initial: { username: string | null; avatar: string | null; email: string } | null }) {
  const { update } = useSession();
  const [isPending, startTransition] = useTransition();
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const [username, setUsername] = useState(initial?.username ?? "");
  const [avatar, setAvatar] = useState(initial?.avatar ?? "");
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const toast = useToast();

  function handleSaveProfile() {
    startTransition(async () => {
      try {
        await updateProfile({ username, avatar });
        // Um objeto vazio faz o NextAuth enviar a atualização de sessão (POST),
        // disparando trigger === 'update' para buscar o perfil recém-salvo no banco.
        await update({});
        setUsername(username.trim());
        toast.success("Perfil atualizado com sucesso.");
      } catch (e: any) {
        toast.error(e instanceof Error ? e.message : "Não foi possível atualizar o perfil.");
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
        toast.success("Senha alterada com sucesso.");
      } catch (e: any) {
        toast.error(e instanceof Error ? e.message : "Não foi possível alterar a senha.");
      }
    });
  }

  return (
    <ConfigSection title="Informações da Conta">
      <div className="flex flex-col gap-1 border-b border-bege-escuro/10 pb-5">
        <p className="font-title text-[10px] uppercase tracking-[0.18em] text-bege-escuro/50">Avatar</p>
        <div className="mt-2">
        <MillieImageUpload
          value={avatar}
          onChange={setAvatar}
          onUploadingChange={setIsUploadingAvatar}
          disabled={isPending}
          label="Trocar avatar"
        />
        </div>
        <p className="mt-1 text-[11px] text-bege-escuro/40">Aparece no cabeçalho e nos cards de perfil.</p>
      </div>

      <div className="flex flex-col gap-1 border-b border-bege-escuro/10 pb-5">
        <p className="font-title text-[10px] uppercase tracking-[0.18em] text-bege-escuro/50">Username</p>
        <MillieInput value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Seu nome na campanha" disabled={isPending} maxLength={32} />
        <p className="mt-1 text-[11px] text-bege-escuro/40">Visível para outros jogadores na campanha.</p>
      </div>

      <div className="flex flex-col gap-1 border-b border-bege-escuro/10 pb-5">
        <p className="font-title text-[10px] uppercase tracking-[0.18em] text-bege-escuro/50">Email</p>
        <p className="font-title text-sm text-bege-claro/60">{initial?.email}</p>
        <p className="mt-1 text-[11px] text-bege-escuro/40">O email não pode ser alterado.</p>
      </div>

      <ConfigActionButton
        label={isPending ? "Salvando..." : "Salvar perfil"}
        onClick={handleSaveProfile}
        disabled={isPending || isUploadingAvatar || username.trim().length < 2 || username.trim().length > 32}
      />

      <div className="pt-4">
        <p className="mb-4 font-title text-xs uppercase tracking-[0.16em] text-bege-escuro/50">Alterar senha</p>
        <div className="flex flex-col gap-3">
          <MillieInput type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} placeholder="Senha atual" autoComplete="current-password" disabled={isPending} />
          <MillieInput type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="Nova senha (mínimo 12 caracteres)" autoComplete="new-password" minLength={12} disabled={isPending} />
        </div>
        <div className="mt-4">
          <ConfigActionButton
            label={isPending ? "Salvando..." : "Alterar senha"}
            onClick={handleSavePassword}
            disabled={isPending || !currentPw || newPw.length < 12 || new TextEncoder().encode(newPw).length > 72 || new TextEncoder().encode(currentPw).length > 72}
          />
        </div>
      </div>

    </ConfigSection>
  );
}
