CREATE TABLE "RitualCatalogEntry" (
  "id" TEXT NOT NULL,
  "catalogOrder" INTEGER NOT NULL,
  "sourceRow" INTEGER NOT NULL,
  "degree" INTEGER NOT NULL,
  "sourceIdOrPair" TEXT,
  "elementText" TEXT NOT NULL,
  "elements" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "categoryOrVariant" TEXT,
  "anchor" TEXT,
  "anchorVariant" TEXT,
  "secondary" TEXT,
  "secondaryVariant" TEXT,
  "name" TEXT NOT NULL,
  "effect" TEXT,
  "pmBase" TEXT,
  "difficulty" TEXT,
  "difficultyModifier" TEXT,
  "affinityXpModifier" TEXT,
  "domainXpMax" INTEGER,
  "grade4ResultElement" TEXT,
  "sigilForm" TEXT,
  "sourceData" JSONB NOT NULL,
  "overrides" JSONB,
  CONSTRAINT "RitualCatalogEntry_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CharacterRitual" (
  "id" TEXT NOT NULL,
  "characterId" TEXT NOT NULL,
  "ritualId" TEXT NOT NULL,
  "masteryXp" INTEGER NOT NULL DEFAULT 0,
  "learnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastPracticedAt" TIMESTAMP(3),
  CONSTRAINT "CharacterRitual_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CharacterElementAffinity" (
  "id" TEXT NOT NULL,
  "characterId" TEXT NOT NULL,
  "element" TEXT NOT NULL,
  "stage" INTEGER NOT NULL,
  "stageXp" INTEGER NOT NULL DEFAULT 0,
  "racialRank" TEXT,
  "source" TEXT NOT NULL DEFAULT 'RACIAL',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CharacterElementAffinity_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "GrimoireConfig" (
  "id" TEXT NOT NULL DEFAULT 'default',
  "stageTransitionRule" TEXT,
  "affinitySuccessXpByDegree" JSONB NOT NULL DEFAULT '{"1":100,"2":300,"3":700,"4":1500}',
  "affinityPracticeXpByDegree" JSONB NOT NULL DEFAULT '{"1":50,"2":150,"3":350,"4":750}',
  "affinityStudyXpByDegree" JSONB,
  "domainSuccessXpByRitual" JSONB NOT NULL DEFAULT '{"ritual-1-5":100}',
  "domainPracticeXpByRitual" JSONB NOT NULL DEFAULT '{"ritual-1-5":50}',
  "difficultyModifiers" JSONB,
  "repetitionDiminishingRule" JSONB,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "GrimoireConfig_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "GrimoireAuditEntry" (
  "id" TEXT NOT NULL,
  "campaignId" TEXT NOT NULL,
  "characterId" TEXT,
  "actorUserId" TEXT,
  "operation" TEXT NOT NULL,
  "targetId" TEXT,
  "details" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "GrimoireAuditEntry_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RitualCatalogEntry_catalogOrder_key" ON "RitualCatalogEntry"("catalogOrder");
CREATE INDEX "RitualCatalogEntry_degree_name_idx" ON "RitualCatalogEntry"("degree", "name");
CREATE INDEX "RitualCatalogEntry_elements_idx" ON "RitualCatalogEntry" USING GIN ("elements");
CREATE UNIQUE INDEX "CharacterRitual_characterId_ritualId_key" ON "CharacterRitual"("characterId", "ritualId");
CREATE INDEX "CharacterRitual_characterId_learnedAt_idx" ON "CharacterRitual"("characterId", "learnedAt");
CREATE UNIQUE INDEX "CharacterElementAffinity_characterId_element_key" ON "CharacterElementAffinity"("characterId", "element");
CREATE INDEX "CharacterElementAffinity_characterId_stage_idx" ON "CharacterElementAffinity"("characterId", "stage");
CREATE INDEX "GrimoireAuditEntry_campaignId_createdAt_idx" ON "GrimoireAuditEntry"("campaignId", "createdAt");
CREATE INDEX "GrimoireAuditEntry_characterId_createdAt_idx" ON "GrimoireAuditEntry"("characterId", "createdAt");

ALTER TABLE "CharacterRitual" ADD CONSTRAINT "CharacterRitual_characterId_fkey"
  FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CharacterRitual" ADD CONSTRAINT "CharacterRitual_ritualId_fkey"
  FOREIGN KEY ("ritualId") REFERENCES "RitualCatalogEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CharacterElementAffinity" ADD CONSTRAINT "CharacterElementAffinity_characterId_fkey"
  FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GrimoireAuditEntry" ADD CONSTRAINT "GrimoireAuditEntry_campaignId_fkey"
  FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GrimoireAuditEntry" ADD CONSTRAINT "GrimoireAuditEntry_characterId_fkey"
  FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GrimoireAuditEntry" ADD CONSTRAINT "GrimoireAuditEntry_actorUserId_fkey"
  FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
