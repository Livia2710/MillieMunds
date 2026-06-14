import { Header } from "@/componentes/Header";
import { HomeCastle } from "@/componentes/home/HomeCastle";

export default function Home() {
  return (
    <div>
         <Header/>
          <main className="mt-10">
            <HomeCastle/>
         </main>
         <footer>
            <p className="text-center text-sm text-bege-escuro/70 mt-10">
              &copy; 2026 Escola dos Mil Mundos. Todos os direitos reservados.
            </p>
          </footer>
     </div>
  );
}

