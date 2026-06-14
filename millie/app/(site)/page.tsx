import { HomeCastle } from "@/componentes/home/HomeCastle";
import { HomeWorlds } from "@/componentes/home/HomeWorlds";

export default function Home() {
  return (
    <div className="md:space-y-10">
      <HomeCastle />
      <HomeWorlds />
    </div>
  );
}