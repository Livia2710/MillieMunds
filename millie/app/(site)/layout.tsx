import { Header } from "@/componentes/Header";

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />

      <main className="mt-5 md:mt-10">
        {children}
      </main>

      <footer>
        <p className="mt-10 text-center text-sm text-bege-escuro/70">
          &copy; 2026 Escola dos Mil Mundos. Todos os direitos reservados a Lívia.
        </p>
      </footer>
    </>
  );
}