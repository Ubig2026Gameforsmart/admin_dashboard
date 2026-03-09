-- Migration: Tournament Bracket System
-- WARNING: This migration ONLY creates NEW tables. It does NOT modify existing tables.

-- 1. Competition Rounds: Stores tournament rounds (Qualification, Semifinal, Final, etc.)
CREATE TABLE IF NOT EXISTS competition_rounds (
  id TEXT PRIMARY KEY,
  competition_id TEXT NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  round_order INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_competition_rounds_competition_id ON competition_rounds(competition_id);

-- 2. Competition Groups: Stores groups within each round
CREATE TABLE IF NOT EXISTS competition_groups (
  id TEXT PRIMARY KEY,
  round_id TEXT NOT NULL REFERENCES competition_rounds(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  quiz_ids TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_competition_groups_round_id ON competition_groups(round_id);

-- 3. Competition Group Members: Stores participants within each group
CREATE TABLE IF NOT EXISTS competition_group_members (
  id TEXT PRIMARY KEY,
  group_id TEXT NOT NULL REFERENCES competition_groups(id) ON DELETE CASCADE,
  participant_id TEXT NOT NULL,
  score NUMERIC NOT NULL DEFAULT 0,
  is_advanced BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_competition_group_members_group_id ON competition_group_members(group_id);

-- 4. Enable RLS on all new tables
ALTER TABLE competition_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE competition_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE competition_group_members ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies (Allow all for authenticated users - admin dashboard)
CREATE POLICY "Allow all for authenticated" ON competition_rounds FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON competition_groups FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON competition_group_members FOR ALL TO authenticated USING (true) WITH CHECK (true);
