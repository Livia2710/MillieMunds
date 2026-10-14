ALTER TABLE "InventoryItem"
  ADD COLUMN "equipmentType" TEXT,
  ADD COLUMN "equipmentSubtype" TEXT,
  ADD COLUMN "equipmentEffects" JSONB;
