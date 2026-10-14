ALTER TABLE "CharacterAffinity"
  ADD COLUMN "sessionChange" INTEGER NOT NULL DEFAULT 0;

UPDATE "CharacterAffinity"
SET "value" = GREATEST(-9, LEAST(9, "value"));
