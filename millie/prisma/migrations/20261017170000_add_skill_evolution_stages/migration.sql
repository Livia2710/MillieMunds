ALTER TABLE "Skill"
ADD COLUMN "evolutionStages" TEXT NOT NULL DEFAULT '[]';

ALTER TABLE "RaceSkill"
ADD COLUMN "evolutionStages" TEXT NOT NULL DEFAULT '[]';
