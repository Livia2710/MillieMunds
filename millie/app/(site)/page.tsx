import { HomeCastle } from "@/componentes/home/HomeCastle";
import { HomeWorlds } from "@/componentes/home/HomeWorlds";
import { getWorldsByActiveCampaign } from "@/app/actions/world";
import { getActiveCampaign } from "@/app/actions/campaign";

export default async function Home() {
  const [worlds, activeCampaign] = await Promise.all([
    getWorldsByActiveCampaign(),
    getActiveCampaign(),
  ]);

  const isMaster = activeCampaign?.role === "MASTER";

  return (
    <div className="md:space-y-10">
      <HomeCastle />
      <HomeWorlds
        worlds={worlds}
        isMaster={isMaster}
        hasCampaign={!!activeCampaign}
      />
    </div>
  );
}