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
CREATE TABLE "World" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "coverColor" TEXT,
    "coverImage" TEXT,
    "isLocked" BOOLEAN NOT NULL DEFAULT true,
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
    "level" INTEGER NOT NULL DEFAULT 1,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "maxXp" INTEGER NOT NULL DEFAULT 100,
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
    "raceId" TEXT NOT NULL,

    CONSTRAINT "Character_pkey" PRIMARY KEY ("id")
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
    "campaignId" TEXT NOT NULL,
    "ownerId" TEXT,
    "forgedBy" TEXT,
    "effect" TEXT,
    "origin" TEXT,
    "author" TEXT,
    "coverType" TEXT,
    "coverColor" TEXT,
    "coverImage" TEXT,

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
CREATE UNIQUE INDEX "InventoryItem_slug_campaignId_key" ON "InventoryItem"("slug", "campaignId");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignMember" ADD CONSTRAINT "CampaignMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignMember" ADD CONSTRAINT "CampaignMember_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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
ALTER TABLE "CharacterCondition" ADD CONSTRAINT "CharacterCondition_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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
