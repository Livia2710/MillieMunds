CREATE TABLE "ExplorationMap" (
  "id" TEXT NOT NULL,
  "campaignId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "rooms" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "isEditing" BOOLEAN NOT NULL DEFAULT true,
  "isPublished" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ExplorationMap_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ExplorationMap_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "ExplorationMap_campaignId_idx" ON "ExplorationMap"("campaignId");

CREATE TABLE "CampaignExplorationState" (
  "campaignId" TEXT NOT NULL,
  "currentMapId" TEXT,
  "currentRoomId" TEXT,
  "discovered" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CampaignExplorationState_pkey" PRIMARY KEY ("campaignId"),
  CONSTRAINT "CampaignExplorationState_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
