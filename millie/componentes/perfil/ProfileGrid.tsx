'use client'

import { ProfileCharacter } from "@/lib/types/profile";
import ProfileHeader from "./ProfileHeader";
import ProfileCards from "./ProfileCards";
import ProfileInventory from "./ProfileInventory";
import TarotReadingModal from "@/componentes/modais/TarotReadingModal";
import { useTarotPolling } from "@/lib/hooks/useTarotPolling";

interface ProfileGridProps {
  character: ProfileCharacter;
  username: string;
}

export default function ProfileGrid({ character, username }: ProfileGridProps) {
  const { pendingDraw, clearPending } = useTarotPolling(character.id)

  return (
    <div className="space-y-6 animate-fade-in">
      <ProfileHeader character={character} username={username} isMaster={false} />

      <div className="grid grid-cols-1 gap-6">
        <ProfileCards character={character} />
        <ProfileInventory character={character} />
      </div>

      {pendingDraw && (
        <TarotReadingModal
          isOpen={true}
          onClose={clearPending}
          drawId={pendingDraw.id}
          readingType={pendingDraw.readingType as 'COMUM' | 'PROFUNDA'}
          question={pendingDraw.question}
        />
      )}
    </div>
  );
}