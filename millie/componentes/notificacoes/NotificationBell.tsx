"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Bell, Check, X } from "lucide-react";
import { getMyNotifications, markNotificationRead } from "@/app/actions/notifications";

type Notice = {
  id: string; type: string; title: string; message: string; href: string;
  createdAt: Date; readAt: Date | null;
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const result = await getMyNotifications(8);
      setNotices(result.notifications);
      setUnreadCount(result.unreadCount);
    } catch {
      // A falha de atualização do contador não deve interromper a navegação.
    }
  }, []);

  useEffect(() => {
    void refresh();
    const interval = window.setInterval(refresh, 60_000);
    window.addEventListener("focus", refresh);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refresh);
    };
  }, [refresh]);

  function markRead(id: string) {
    void markNotificationRead(id).then(refresh).catch(() => undefined);
    setNotices((current) => current.map((notice) => notice.id === id ? { ...notice, readAt: new Date() } : notice));
    setUnreadCount((count) => Math.max(0, count - 1));
  }

  return (
    <div className="relative z-[60]">
      <button
        type="button"
        aria-label={unreadCount ? `Notificações, ${unreadCount} não lidas` : "Notificações"}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full text-bege-escuro transition hover:bg-bege-escuro/10 hover:text-bege-claro focus-visible:outline focus-visible:outline-2 focus-visible:outline-bege-medio"
      >
        <Bell size={21} strokeWidth={1.6} />
        {unreadCount > 0 && <span className="absolute right-0 top-0 grid min-h-4 min-w-4 place-items-center rounded-full bg-red-400 px-1 text-[9px] font-semibold leading-none text-roxo-escuro">{unreadCount > 99 ? "99+" : unreadCount}</span>}
      </button>

      {open && <div className="absolute right-2 top-12 w-[min(22rem,calc(100vw-1rem))] border border-bege-escuro/20 bg-roxo-escuro text-bege-claro shadow-2xl">
        <div className="flex items-center justify-between border-b border-bege-escuro/15 px-4 py-3">
          <h2 className="font-title text-xs uppercase tracking-[0.16em]">Notificações</h2>
          <button type="button" onClick={() => setOpen(false)} aria-label="Fechar notificações" className="rounded p-1 text-bege-escuro/60 hover:text-bege-claro"><X size={16} /></button>
        </div>
        <div className="max-h-[65vh] overflow-y-auto">
          {notices.length === 0 ? <p className="px-4 py-6 text-center text-sm text-bege-escuro/60">Você ainda não tem notificações.</p> : notices.map((notice) => (
            <Link key={notice.id} href={notice.href} onClick={() => { if (!notice.readAt) markRead(notice.id); setOpen(false); }} className={`block border-b border-bege-escuro/10 px-4 py-3 transition hover:bg-bege-escuro/5 ${notice.readAt ? "opacity-65" : "bg-bege-escuro/[0.04]"}`}>
              <span className="flex items-start gap-2"><span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${notice.readAt ? "bg-transparent" : "bg-bege-medio"}`} /><span className="min-w-0 flex-1"><span className="block font-title text-sm">{notice.title}</span><span className="mt-0.5 block text-xs leading-relaxed text-bege-escuro/70">{notice.message}</span><time className="mt-1 block text-[10px] text-bege-escuro/45">{new Date(notice.createdAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" })}</time></span></span>
            </Link>
          ))}
        </div>
        <Link href="/notificacoes" onClick={() => setOpen(false)} className="flex items-center justify-center gap-2 px-4 py-3 font-title text-[10px] uppercase tracking-[0.16em] text-bege-medio transition hover:bg-bege-escuro/5"><Check size={14} /> Ver todas</Link>
      </div>}
    </div>
  );
}
