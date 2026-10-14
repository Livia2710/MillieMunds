ALTER TABLE "InventoryItem"
  ADD COLUMN "equipmentDurability" INTEGER,
  ADD COLUMN "equipmentMaxDurability" INTEGER;

UPDATE "InventoryItem"
SET "equipmentMaxDurability" = CASE "rarity"
  WHEN 'comum' THEN 5
  WHEN 'incomum' THEN 6
  WHEN 'raro' THEN 8
  WHEN 'epico' THEN 10
  WHEN 'lendario' THEN 12
  ELSE NULL
END
WHERE "category" = 'equipamento';

UPDATE "InventoryItem"
SET "equipmentDurability" = "equipmentMaxDurability"
WHERE "category" = 'equipamento' AND "equipmentMaxDurability" IS NOT NULL;
