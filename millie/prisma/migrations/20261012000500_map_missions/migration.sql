CREATE TABLE "MapMissionProgress" (
  "campaignId" TEXT NOT NULL,
  "mapId" TEXT NOT NULL,
  "missionId" TEXT NOT NULL,
  "characterId" TEXT NOT NULL,
  "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  CONSTRAINT "MapMissionProgress_pkey" PRIMARY KEY ("campaignId", "mapId", "missionId", "characterId"),
  CONSTRAINT "MapMissionProgress_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "MapMissionProgress_mapId_fkey" FOREIGN KEY ("mapId") REFERENCES "ExplorationMap"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "MapMissionProgress_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "MapMissionProgress_campaignId_characterId_idx" ON "MapMissionProgress"("campaignId", "characterId");
