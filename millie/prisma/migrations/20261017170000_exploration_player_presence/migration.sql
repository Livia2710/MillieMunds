CREATE TABLE "CampaignExplorationPresence" (
  "campaignId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "mapId" TEXT NOT NULL,
  "roomId" TEXT NOT NULL,
  "characterId" TEXT,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CampaignExplorationPresence_pkey" PRIMARY KEY ("campaignId", "userId"),
  CONSTRAINT "CampaignExplorationPresence_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "CampaignExplorationPresence_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "CampaignExplorationPresence_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "CampaignExplorationPresence_campaignId_mapId_roomId_updatedAt_idx"
  ON "CampaignExplorationPresence"("campaignId", "mapId", "roomId", "updatedAt");
