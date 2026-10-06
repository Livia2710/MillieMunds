import { getMyNotifications } from "@/app/actions/notifications";
import { NotificationInbox } from "@/componentes/notificacoes/NotificationInbox";

export default async function NotificationsPage() {
  const { notifications } = await getMyNotifications(100);
  return <div className="relative min-h-screen w-full overflow-hidden bg-roxo-escuro px-4 py-10 shadow-header sm:px-6 md:px-12 md:py-14">
    <div className="mx-auto w-full max-w-4xl"><NotificationInbox initial={notifications} /></div>
  </div>;
}
