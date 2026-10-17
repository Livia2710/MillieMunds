-- Personagens de Mestre não têm playerId; mantenha-os ocultos até liberação manual.
UPDATE "Character"
SET "isLocked" = TRUE
WHERE "playerId" IS NULL AND "isLocked" = FALSE;

-- Personagens criados sem informar explicitamente o estado devem iniciar bloqueados.
ALTER TABLE "Character" ALTER COLUMN "isLocked" SET DEFAULT TRUE;
