ALTER TABLE "ExplorationMap" ADD COLUMN "floors" JSONB NOT NULL DEFAULT '[{"id":"ground","name":"Térreo"}]'::jsonb;
