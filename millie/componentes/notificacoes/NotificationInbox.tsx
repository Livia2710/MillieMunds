"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { CheckCheck } from "lucide-react";
import { markAllNotificationsRead, markNotificationRead } from "@/app/actions/notifications";
import { useToast } from "@/componentes/ui/ToastProvider";

type Notice = {
  id: string; type: string; title: string; message: string; href: string;
  createdAt: Date; readAt: Date | null;
};

export function NotificationInbox({ initial }: { initial: Notice[] }) {
  const [notices, setNotices] = useState(initial);
  const [isPending, startTransition] = useTransition();
  const toast = useToast();
  const unreadCount = notices.filter((notice) => !notice.readAt).length;

  function markRead(id: string) {
    setNotices((current) => current.map((notice) => notice.id === id ? { ...notice, readAt: new Date() } : notice));
    void markNotificationRead(id).catch(() => toast.error("Não foi possível atualizar a notificação."));
  }

  function markAllRead() {
    startTransition(async () => {
      try {
        await markAllNotificationsRead();
        setNotices((current) => current.map((notice) => ({ ...notice, readAt: notice.readAt ?? new Date() })));
        toast.success("Notificações marcadas como lidas.");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Não foi possível atualizar as notificações.");
      }
    });
  }

  return (
    <section className="mx-auto w-full max-w-3xl">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div><h1 className="font-title text-3xl uppercase tracking-[0.1em] text-bege-medio">Notificações</h1><p className="mt-1 text-sm text-bege-escuro/65">Avisos recentes das suas campanhas.</p></div>
        <button type="button" disabled={isPending || unreadCount === 0} onClick={markAllRead} className="flex items-center gap-2 border border-bege-escuro/25 px-3 py-2 font-title text-[10px] uppercase tracking-widest text-bege-medio transition hover:bg-bege-escuro/5 disabled:cursor-not-allowed disabled:opacity-40"><CheckCheck size={15} /> Marcar todas como lidas</button>
      </div>
      <div className="border-y border-bege-escuro/15">
        {notices.length === 0 ? <p className="py-12 text-center text-sm text-bege-escuro/60">Você ainda não tem notificações.</p> : notices.map((notice) => (
          <Link key={notice.id} href={notice.href} onClick={() => { if (!notice.readAt) markRead(notice.id); }} className={`flex gap-3 border-b border-bege-escuro/10 px-4 py-4 transition hover:bg-bege-escuro/[0.04] ${notice.readAt ? "opacity-65" : ""}`}>
            <span className={`mt-2 h-2 w-2 shrink-0 rounded-full ${notice.readAt ? "bg-bege-escuro/20" : "bg-bege-medio"}`} />
            <span className="min-w-0 flex-1"><span className="block font-title text-base text-bege-medio">{notice.title}</span><span className="mt-1 block text-sm leading-relaxed text-bege-escuro/75">{notice.message}</span><time className="mt-2 block text-xs text-bege-escuro/50">{new Date(notice.createdAt).toLocaleString("pt-BR", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Sao_Paulo" })}</time></span>
          </Link>
        ))}
      </div>
    </section>
  );
}
