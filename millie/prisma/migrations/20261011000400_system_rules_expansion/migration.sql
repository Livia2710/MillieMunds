ALTER TABLE "Character"
  ADD COLUMN "unspentAttributePoints" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "specialCardUsedThisScene" BOOLEAN NOT NULL DEFAULT false;

UPDATE "Character"
SET "unspentAttributePoints" = GREATEST(FLOOR(("level" - 1)::numeric / 5)::integer, 0);

CREATE TABLE "CampaignConditionDefinition" (
  "id" TEXT NOT NULL,
  "campaignId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "cause" TEXT NOT NULL,
  "color" TEXT NOT NULL DEFAULT '#D8B35E',
  "removalInstructions" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CampaignConditionDefinition_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CampaignConditionDefinition_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "CampaignConditionDefinition_campaignId_name_key" ON "CampaignConditionDefinition"("campaignId", "name");
CREATE INDEX "CampaignConditionDefinition_campaignId_idx" ON "CampaignConditionDefinition"("campaignId");
