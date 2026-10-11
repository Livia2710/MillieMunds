CREATE TABLE "ExplorationDiscovery" (
  "campaignId" TEXT NOT NULL,
  "mapId" TEXT NOT NULL,
  "objectId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "inventoryItemId" TEXT,
  "itemName" TEXT,
  "foundByUserId" TEXT,
  "characterId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ExplorationDiscovery_pkey" PRIMARY KEY ("campaignId","mapId","objectId"),
  CONSTRAINT "ExplorationDiscovery_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ExplorationDiscovery_mapId_fkey" FOREIGN KEY ("mapId") REFERENCES "ExplorationMap"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "ExplorationDiscovery" ("campaignId","mapId","objectId","type","title")
SELECT s."campaignId", split_part(k.dkey,':',1), split_part(k.dkey,':',2), 'desconhecido', '(registro anterior)'
FROM "CampaignExplorationState" s
CROSS JOIN LATERAL jsonb_array_elements_text(s."discovered") AS k(dkey)
JOIN "ExplorationMap" m ON m."id" = split_part(k.dkey,':',1) AND m."campaignId" = s."campaignId"
ON CONFLICT DO NOTHING;

CREATE INDEX "ExplorationDiscovery_campaignId_createdAt_idx" ON "ExplorationDiscovery"("campaignId","createdAt");
CREATE INDEX "InventoryItem_campaignId_ownerId_idx" ON "InventoryItem"("campaignId","ownerId");
CREATE INDEX "Character_campaignId_playerId_idx" ON "Character"("campaignId","playerId");