-- CreateEnum
CREATE TYPE "Role" AS ENUM ('MASTER', 'PLAYER');

-- CreateEnum
CREATE TYPE "BaseRank" AS ENUM ('E', 'D', 'C', 'B', 'A', 'S');

-- CreateEnum
CREATE TYPE "RacePath" AS ENUM ('ASCENSAO', 'CORRUPCAO', 'PERMANENCIA');

-- CreateEnum
CREATE TYPE "SpecialCardType" AS ENUM ('VALETE', 'CAVALEIRO');

-- CreateEnum
CREATE TYPE "ReadingType" AS ENUM ('COMUM', 'PROFUNDA');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT,
    "avatar" TEXT,
    "bio" TEXT,
    "preferences" JSONB,
    "notifications" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "passwordHash" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "inviteCode" TEXT NOT NULL,
    "masterId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampaignMember" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'PLAYER',
    "active" BOOLEAN NOT NULL DEFAULT false,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CampaignMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExplorationMap" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "rooms" JSONB NOT NULL DEFAULT '[]',
    "floors" JSONB NOT NULL DEFAULT '[{"id":"ground","name":"Térreo"}]',
    "isEditing" BOOLEAN NOT NULL DEFAULT true,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExplorationMap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampaignExplorationState" (
    "campaignId" TEXT NOT NULL,
    "currentMapId" TEXT,
    "currentRoomId" TEXT,
    "discovered" JSONB NOT NULL DEFAULT '[]',
    "activeInteraction" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CampaignExplorationState_pkey" PRIMARY KEY ("campaignId")
);

-- CreateTable
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

    CONSTRAINT "ExplorationDiscovery_pkey" PRIMARY KEY ("campaignId","mapId","objectId")
);

-- CreateTable
CREATE TABLE "MapMissionProgress" (
    "campaignId" TEXT NOT NULL,
    "mapId" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "MapMissionProgress_pkey" PRIMARY KEY ("campaignId","mapId","missionId","characterId")
);

-- CreateTable
CREATE TABLE "World" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "coverColor" TEXT,
    "coverImage" TEXT,
    "pageColor" TEXT NOT NULL DEFAULT '#f7f3e9',
    "pageTexture" BOOLEAN NOT NULL DEFAULT true,
    "pageHeader" TEXT NOT NULL DEFAULT '',
    "pageFooter" TEXT NOT NULL DEFAULT '',
    "isLocked" BOOLEAN NOT NULL DEFAULT true,
    "isDraft" BOOLEAN NOT NULL DEFAULT false,
    "campaignId" TEXT NOT NULL,

    CONSTRAINT "World_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Chapter" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "worldId" TEXT NOT NULL,

    CONSTRAINT "Chapter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Universe" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Universe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UniverseWorld" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "universeId" TEXT NOT NULL,

    CONSTRAINT "UniverseWorld_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Race" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "element" TEXT NOT NULL,
    "baseRank" "BaseRank" NOT NULL DEFAULT 'D',
    "isCorrupted" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "image" TEXT,
    "canAscend" BOOLEAN NOT NULL DEFAULT false,
    "canCorrupt" BOOLEAN NOT NULL DEFAULT false,
    "universeWorldId" TEXT NOT NULL,

    CONSTRAINT "Race_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RaceSkill" (
    "id" TEXT NOT NULL,
    "raceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "branch" TEXT NOT NULL,
    "levelRequired" INTEGER NOT NULL DEFAULT 1,
    "isInnate" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "RaceSkill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CharacterRaceSkill" (
    "id" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "raceSkillId" TEXT NOT NULL,
    "currentLevel" INTEGER NOT NULL DEFAULT 0,
    "uses" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "CharacterRaceSkill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RaceEvolution" (
    "id" TEXT NOT NULL,
    "fromRaceId" TEXT NOT NULL,
    "toRaceName" TEXT NOT NULL,
    "path" "RacePath" NOT NULL,
    "levelRequired" INTEGER NOT NULL DEFAULT 100,

    CONSTRAINT "RaceEvolution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Character" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "element" TEXT NOT NULL,
    "image" TEXT,
    "worldSlug" TEXT NOT NULL,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "campaignId" TEXT NOT NULL,
    "playerId" TEXT,
    "year" INTEGER,
    "subject" TEXT,
    "occupation" TEXT,
    "dangerLevel" TEXT,
    "story" TEXT,
    "level" INTEGER NOT NULL DEFAULT 1,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "maxXp" INTEGER NOT NULL DEFAULT 100,
    "unspentAttributePoints" INTEGER NOT NULL DEFAULT 0,
    "specialCardUsedThisScene" BOOLEAN NOT NULL DEFAULT false,
    "rankLosses" INTEGER NOT NULL DEFAULT 0,
    "birthRank" "BaseRank" NOT NULL DEFAULT 'D',
    "racePath" "RacePath",
    "evolvedRaceId" TEXT,
    "agilidade" INTEGER NOT NULL DEFAULT 1,
    "inteligencia" INTEGER NOT NULL DEFAULT 1,
    "forca" INTEGER NOT NULL DEFAULT 1,
    "vigor" INTEGER NOT NULL DEFAULT 1,
    "sorte" INTEGER NOT NULL DEFAULT 1,
    "pv" INTEGER NOT NULL DEFAULT 12,
    "pvMax" INTEGER NOT NULL DEFAULT 12,
    "pm" INTEGER NOT NULL DEFAULT 12,
    "pmMax" INTEGER NOT NULL DEFAULT 12,
    "currency" INTEGER NOT NULL DEFAULT 100,
    "raceId" TEXT NOT NULL,

    CONSTRAINT "Character_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CharacterAffinity" (
    "campaignId" TEXT NOT NULL,
    "sourceCharacterId" TEXT NOT NULL,
    "targetCharacterId" TEXT NOT NULL,
    "value" INTEGER NOT NULL DEFAULT 0,
    "sessionChange" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "CharacterAffinity_pkey" PRIMARY KEY ("campaignId","sourceCharacterId","targetCharacterId")
);

-- CreateTable
CREATE TABLE "CharacterCondition" (
    "id" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "removedAt" TIMESTAMP(3),

    CONSTRAINT "CharacterCondition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampaignConditionDefinition" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cause" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#D8B35E',
    "removalInstructions" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CampaignConditionDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Skill" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "branch" TEXT NOT NULL,
    "element" TEXT NOT NULL,
    "currentLevel" INTEGER NOT NULL DEFAULT 0,
    "maxLevel" INTEGER NOT NULL DEFAULT 3,
    "isUnlocked" BOOLEAN NOT NULL DEFAULT false,
    "requiredCharacterLevel" INTEGER NOT NULL,
    "uses" INTEGER NOT NULL DEFAULT 0,
    "levelEffects" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "characterId" TEXT NOT NULL,

    CONSTRAINT "Skill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpecialCard" (
    "id" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "cardType" "SpecialCardType" NOT NULL,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "obtainedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usedAt" TIMESTAMP(3),

    CONSTRAINT "SpecialCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TarotDraw" (
    "id" TEXT NOT NULL,
    "readingType" "ReadingType" NOT NULL,
    "question" TEXT NOT NULL,
    "cards" TEXT[],
    "sacrifice" TEXT NOT NULL DEFAULT '',
    "sacrificeIsPermanent" BOOLEAN NOT NULL DEFAULT false,
    "hadJoker" BOOLEAN NOT NULL DEFAULT false,
    "drawnAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "characterId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pendente',
    "initiatedByMasterId" TEXT,

    CONSTRAINT "TarotDraw_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryItem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "rarity" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "image" TEXT,
    "worldSlug" TEXT,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "isDraft" BOOLEAN NOT NULL DEFAULT false,
    "campaignId" TEXT NOT NULL,
    "ownerId" TEXT,
    "forgedBy" TEXT,
    "effect" TEXT,
    "equipmentType" TEXT,
    "equipmentSubtype" TEXT,
    "equipmentEffects" JSONB,
    "equipmentDurability" INTEGER,
    "equipmentMaxDurability" INTEGER,
    "origin" TEXT,
    "consumableType" TEXT,
    "author" TEXT,
    "coverType" TEXT,
    "coverColor" TEXT,
    "coverImage" TEXT,
    "pageColor" TEXT NOT NULL DEFAULT '#f7f3e9',
    "pageTexture" BOOLEAN NOT NULL DEFAULT true,
    "pageHeader" TEXT NOT NULL DEFAULT '',
    "pageFooter" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "InventoryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemChapter" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "itemId" TEXT NOT NULL,

    CONSTRAINT "ItemChapter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecurityRateLimit" (
    "key" VARCHAR(80) NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "windowStartedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "blockedUntil" TIMESTAMP(3),

    CONSTRAINT "SecurityRateLimit_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "href" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "Campaign_inviteCode_key" ON "Campaign"("inviteCode");

-- CreateIndex
CREATE UNIQUE INDEX "CampaignMember_userId_campaignId_key" ON "CampaignMember"("userId", "campaignId");

-- CreateIndex
CREATE INDEX "ExplorationMap_campaignId_idx" ON "ExplorationMap"("campaignId");

-- CreateIndex
CREATE INDEX "ExplorationDiscovery_campaignId_createdAt_idx" ON "ExplorationDiscovery"("campaignId", "createdAt");

-- CreateIndex
CREATE INDEX "MapMissionProgress_campaignId_characterId_idx" ON "MapMissionProgress"("campaignId", "characterId");

-- CreateIndex
CREATE UNIQUE INDEX "World_slug_campaignId_key" ON "World"("slug", "campaignId");

-- CreateIndex
CREATE UNIQUE INDEX "Universe_name_key" ON "Universe"("name");

-- CreateIndex
CREATE UNIQUE INDEX "UniverseWorld_name_universeId_key" ON "UniverseWorld"("name", "universeId");

-- CreateIndex
CREATE UNIQUE INDEX "Race_name_universeWorldId_key" ON "Race"("name", "universeWorldId");

-- CreateIndex
CREATE UNIQUE INDEX "CharacterRaceSkill_characterId_raceSkillId_key" ON "CharacterRaceSkill"("characterId", "raceSkillId");

-- CreateIndex
CREATE INDEX "Character_campaignId_playerId_idx" ON "Character"("campaignId", "playerId");

-- CreateIndex
CREATE INDEX "CharacterAffinity_campaignId_targetCharacterId_idx" ON "CharacterAffinity"("campaignId", "targetCharacterId");

-- CreateIndex
CREATE INDEX "CampaignConditionDefinition_campaignId_idx" ON "CampaignConditionDefinition"("campaignId");

-- CreateIndex
CREATE UNIQUE INDEX "CampaignConditionDefinition_campaignId_name_key" ON "CampaignConditionDefinition"("campaignId", "name");

-- CreateIndex
CREATE INDEX "InventoryItem_campaignId_ownerId_idx" ON "InventoryItem"("campaignId", "ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryItem_slug_campaignId_key" ON "InventoryItem"("slug", "campaignId");

-- CreateIndex
CREATE INDEX "SecurityRateLimit_windowStartedAt_idx" ON "SecurityRateLimit"("windowStartedAt");

-- CreateIndex
CREATE INDEX "Notification_userId_readAt_createdAt_idx" ON "Notification"("userId", "readAt", "createdAt");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignMember" ADD CONSTRAINT "CampaignMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignMember" ADD CONSTRAINT "CampaignMember_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExplorationMap" ADD CONSTRAINT "ExplorationMap_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignExplorationState" ADD CONSTRAINT "CampaignExplorationState_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExplorationDiscovery" ADD CONSTRAINT "ExplorationDiscovery_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExplorationDiscovery" ADD CONSTRAINT "ExplorationDiscovery_mapId_fkey" FOREIGN KEY ("mapId") REFERENCES "ExplorationMap"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MapMissionProgress" ADD CONSTRAINT "MapMissionProgress_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MapMissionProgress" ADD CONSTRAINT "MapMissionProgress_mapId_fkey" FOREIGN KEY ("mapId") REFERENCES "ExplorationMap"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MapMissionProgress" ADD CONSTRAINT "MapMissionProgress_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "World" ADD CONSTRAINT "World_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chapter" ADD CONSTRAINT "Chapter_worldId_fkey" FOREIGN KEY ("worldId") REFERENCES "World"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UniverseWorld" ADD CONSTRAINT "UniverseWorld_universeId_fkey" FOREIGN KEY ("universeId") REFERENCES "Universe"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Race" ADD CONSTRAINT "Race_universeWorldId_fkey" FOREIGN KEY ("universeWorldId") REFERENCES "UniverseWorld"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RaceSkill" ADD CONSTRAINT "RaceSkill_raceId_fkey" FOREIGN KEY ("raceId") REFERENCES "Race"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterRaceSkill" ADD CONSTRAINT "CharacterRaceSkill_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterRaceSkill" ADD CONSTRAINT "CharacterRaceSkill_raceSkillId_fkey" FOREIGN KEY ("raceSkillId") REFERENCES "RaceSkill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RaceEvolution" ADD CONSTRAINT "RaceEvolution_fromRaceId_fkey" FOREIGN KEY ("fromRaceId") REFERENCES "Race"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Character" ADD CONSTRAINT "Character_raceId_fkey" FOREIGN KEY ("raceId") REFERENCES "Race"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Character" ADD CONSTRAINT "Character_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterAffinity" ADD CONSTRAINT "CharacterAffinity_sourceCharacterId_fkey" FOREIGN KEY ("sourceCharacterId") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterAffinity" ADD CONSTRAINT "CharacterAffinity_targetCharacterId_fkey" FOREIGN KEY ("targetCharacterId") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterCondition" ADD CONSTRAINT "CharacterCondition_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignConditionDefinition" ADD CONSTRAINT "CampaignConditionDefinition_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Skill" ADD CONSTRAINT "Skill_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpecialCard" ADD CONSTRAINT "SpecialCard_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TarotDraw" ADD CONSTRAINT "TarotDraw_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryItem" ADD CONSTRAINT "InventoryItem_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemChapter" ADD CONSTRAINT "ItemChapter_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "InventoryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
