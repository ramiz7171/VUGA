-- Migration: Create expense_types and order_sources tables
-- Run this SQL in your Supabase SQL Editor

-- Expense Types table
CREATE TABLE IF NOT EXISTS expense_types (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);

-- Seed default expense types
INSERT INTO expense_types (name) VALUES
  ('advertising'),
  ('salary'),
  ('logistics'),
  ('officeSupplies')
ON CONFLICT (name) DO NOTHING;

-- Order Sources table
CREATE TABLE IF NOT EXISTS order_sources (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  value text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);

-- Seed default order sources
INSERT INTO order_sources (name, value) VALUES
  ('Instagram', 'instagram'),
  ('Facebook', 'facebook'),
  ('Digər', 'other')
ON CONFLICT (value) DO NOTHING;

-- Enable RLS (optional, adjust policies as needed)
ALTER TABLE expense_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_sources ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read
CREATE POLICY "Allow authenticated read expense_types" ON expense_types FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read order_sources" ON order_sources FOR SELECT TO authenticated USING (true);

-- Allow all authenticated users to insert/update/delete (admin check done in app)
CREATE POLICY "Allow authenticated write expense_types" ON expense_types FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated write order_sources" ON order_sources FOR ALL TO authenticated USING (true) WITH CHECK (true);
