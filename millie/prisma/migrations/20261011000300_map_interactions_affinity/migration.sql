ALTER TABLE "CampaignExplorationState" ADD COLUMN "activeInteraction" JSONB;

CREATE TABLE "CharacterAffinity" (
  "campaignId" TEXT NOT NULL,
  "sourceCharacterId" TEXT NOT NULL,
  "targetCharacterId" TEXT NOT NULL,
  "value" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "CharacterAffinity_pkey" PRIMARY KEY ("campaignId", "sourceCharacterId", "targetCharacterId"),
  CONSTRAINT "CharacterAffinity_sourceCharacterId_fkey" FOREIGN KEY ("sourceCharacterId") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "CharacterAffinity_targetCharacterId_fkey" FOREIGN KEY ("targetCharacterId") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "CharacterAffinity_campaignId_targetCharacterId_idx" ON "CharacterAffinity"("campaignId", "targetCharacterId");
