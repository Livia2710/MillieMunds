import { ProfileCharacter } from "@/lib/types/profile";
import ProfileHeader from "./ProfileHeader";
import ProfileCards from "./ProfileCards";
import ProfileInventory from "./ProfileInventory";

interface ProfileGridProps {
  character: ProfileCharacter;
  username: string;
}

export default function ProfileGrid({ character, username }: ProfileGridProps) {
  return (
    <div className="space-y-6 animate-fade-in">
      <ProfileHeader 
        character={character} 
        username={username} 
        isMaster={false} 
      />
      
      <div className="grid grid-cols-1 gap-6">
        <ProfileCards character={character} />
        <ProfileInventory character={character} />
      </div>
    </div>
  );
}
