ALTER TABLE "Universe"
  ADD COLUMN "description" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "artworkUrl" TEXT,
  ADD COLUMN "artStyle" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "kind" TEXT NOT NULL DEFAULT 'universe',
  ADD COLUMN "visibility" TEXT NOT NULL DEFAULT 'PUBLIC';

ALTER TABLE "UniverseWorld"
  ADD COLUMN "description" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "imageUrl" TEXT,
  ADD COLUMN "visibility" TEXT NOT NULL DEFAULT 'PUBLIC';

ALTER TABLE "Race"
  ADD COLUMN "appearance" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "biology" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "culture" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "masterNotes" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "visibility" TEXT NOT NULL DEFAULT 'PUBLIC';

ALTER TABLE "RaceSkill"
  ADD COLUMN "visibility" TEXT NOT NULL DEFAULT 'PUBLIC';

UPDATE "Universe" SET "kind" = 'origin' WHERE "name" LIKE 'Primordial%';
UPDATE "Universe" SET "kind" = 'multiversal' WHERE "name" LIKE 'Clã Arlatala%';

CREATE TABLE "UniverseConnection" (
  "id" TEXT NOT NULL,
  "fromUniverseId" TEXT NOT NULL,
  "toUniverseId" TEXT NOT NULL,
  "relationType" TEXT NOT NULL DEFAULT 'known',
  "description" TEXT NOT NULL DEFAULT '',
  "visibility" TEXT NOT NULL DEFAULT 'PUBLIC',
  CONSTRAINT "UniverseConnection_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UniverseConnection_fromUniverseId_toUniverseId_key"
  ON "UniverseConnection"("fromUniverseId", "toUniverseId");

ALTER TABLE "UniverseConnection"
  ADD CONSTRAINT "UniverseConnection_fromUniverseId_fkey"
  FOREIGN KEY ("fromUniverseId") REFERENCES "Universe"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "UniverseConnection_toUniverseId_fkey"
  FOREIGN KEY ("toUniverseId") REFERENCES "Universe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "AtlasDiscovery" (
  "id" TEXT NOT NULL,
  "campaignId" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "discoveredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AtlasDiscovery_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AtlasDiscovery_campaignId_entityType_entityId_key"
  ON "AtlasDiscovery"("campaignId", "entityType", "entityId");
CREATE INDEX "AtlasDiscovery_campaignId_entityType_idx"
  ON "AtlasDiscovery"("campaignId", "entityType");

ALTER TABLE "AtlasDiscovery"
  ADD CONSTRAINT "AtlasDiscovery_campaignId_fkey"
  FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
