'use client'

import type { ProfileCharacter } from "@/lib/types/profile"
import ProfileHeader from "./ProfileHeader"
import ProfileCards from "./ProfileCards"
import ProfileInventory from "./ProfileInventory"
import TarotReadingModal from "@/componentes/modais/TarotReadingModal"
import { useTarotPolling } from "@/lib/hooks/useTarotPolling"

type ActiveCondition = {
  id: string
  type: string
}

interface ProfileGridProps {
  character: ProfileCharacter
  username: string
  activeConditions?: ActiveCondition[]
}

export default function ProfileGrid({
  character,
  username,
  activeConditions = [],
}: ProfileGridProps) {
  const { pendingDraw, clearPending } = useTarotPolling(character.id)

  return (
    <div className="space-y-6 animate-fade-in">
      <ProfileHeader
        character={character}
        username={username}
        isMaster={false}
        activeConditions={activeConditions}
      />

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
  )
}