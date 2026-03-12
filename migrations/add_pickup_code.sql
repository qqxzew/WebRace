-- Run this in Supabase Dashboard → SQL Editor
-- https://supabase.com/dashboard/project/fnlmhjqqufvhwxvwnulu/sql/new

ALTER TABLE orders ADD COLUMN IF NOT EXISTS pickup_code text;

UPDATE orders
SET pickup_code = LPAD(FLOOR(RANDOM() * 9000 + 1000)::text, 4, '0')
WHERE pickup_code IS NULL;
