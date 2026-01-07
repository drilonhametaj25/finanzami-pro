-- SaltEdge Integration Migration
-- Run this SQL in your Supabase SQL Editor

-- ============================================
-- 1. Create saltedge_customers table
-- ============================================
CREATE TABLE IF NOT EXISTS saltedge_customers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  saltedge_customer_id TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE saltedge_customers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for saltedge_customers
DROP POLICY IF EXISTS "Users can view own saltedge customer" ON saltedge_customers;
CREATE POLICY "Users can view own saltedge customer" ON saltedge_customers
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own saltedge customer" ON saltedge_customers;
CREATE POLICY "Users can insert own saltedge customer" ON saltedge_customers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own saltedge customer" ON saltedge_customers;
CREATE POLICY "Users can delete own saltedge customer" ON saltedge_customers
  FOR DELETE USING (auth.uid() = user_id);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_saltedge_customers_user ON saltedge_customers(user_id);
CREATE INDEX IF NOT EXISTS idx_saltedge_customers_saltedge_id ON saltedge_customers(saltedge_customer_id);

-- ============================================
-- 2. Create saltedge_connections table
-- ============================================
CREATE TABLE IF NOT EXISTS saltedge_connections (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  saltedge_connection_id TEXT NOT NULL UNIQUE,
  saltedge_customer_id TEXT NOT NULL,
  provider_code TEXT NOT NULL,
  provider_name TEXT NOT NULL,
  country_code TEXT,
  status TEXT DEFAULT 'active', -- active, inactive, disabled
  last_sync_at TIMESTAMPTZ,
  next_refresh_at TIMESTAMPTZ,
  sync_status TEXT DEFAULT 'pending', -- pending, syncing, success, error
  sync_error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE saltedge_connections ENABLE ROW LEVEL SECURITY;

-- RLS Policies for saltedge_connections
DROP POLICY IF EXISTS "Users can view own connections" ON saltedge_connections;
CREATE POLICY "Users can view own connections" ON saltedge_connections
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own connections" ON saltedge_connections;
CREATE POLICY "Users can insert own connections" ON saltedge_connections
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own connections" ON saltedge_connections;
CREATE POLICY "Users can update own connections" ON saltedge_connections
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own connections" ON saltedge_connections;
CREATE POLICY "Users can delete own connections" ON saltedge_connections
  FOR DELETE USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_saltedge_connections_user ON saltedge_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_saltedge_connections_saltedge_id ON saltedge_connections(saltedge_connection_id);

-- ============================================
-- 3. Extend bank_accounts table with SaltEdge fields
-- ============================================

-- First, ensure bank_accounts table exists (may already exist)
CREATE TABLE IF NOT EXISTS bank_accounts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('checking', 'savings', 'cash', 'credit_card', 'investment')),
  balance DECIMAL(12,2) DEFAULT 0,
  icon TEXT DEFAULT 'wallet',
  color TEXT DEFAULT '#6366F1',
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add SaltEdge-specific columns
ALTER TABLE bank_accounts ADD COLUMN IF NOT EXISTS saltedge_account_id TEXT UNIQUE;
ALTER TABLE bank_accounts ADD COLUMN IF NOT EXISTS saltedge_connection_id TEXT;
ALTER TABLE bank_accounts ADD COLUMN IF NOT EXISTS currency_code TEXT DEFAULT 'EUR';
ALTER TABLE bank_accounts ADD COLUMN IF NOT EXISTS iban TEXT;
ALTER TABLE bank_accounts ADD COLUMN IF NOT EXISTS account_number TEXT;
ALTER TABLE bank_accounts ADD COLUMN IF NOT EXISTS is_connected BOOLEAN DEFAULT FALSE;
ALTER TABLE bank_accounts ADD COLUMN IF NOT EXISTS last_sync_at TIMESTAMPTZ;

-- Enable RLS (if not already)
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for bank_accounts (drop if exist, then recreate)
DROP POLICY IF EXISTS "Users can view own bank accounts" ON bank_accounts;
DROP POLICY IF EXISTS "Users can insert own bank accounts" ON bank_accounts;
DROP POLICY IF EXISTS "Users can update own bank accounts" ON bank_accounts;
DROP POLICY IF EXISTS "Users can delete own bank accounts" ON bank_accounts;

CREATE POLICY "Users can view own bank accounts" ON bank_accounts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bank accounts" ON bank_accounts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bank accounts" ON bank_accounts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own bank accounts" ON bank_accounts
  FOR DELETE USING (auth.uid() = user_id);

-- Indexes for bank_accounts
CREATE INDEX IF NOT EXISTS idx_bank_accounts_user ON bank_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_saltedge ON bank_accounts(saltedge_account_id);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_connection ON bank_accounts(saltedge_connection_id);

-- ============================================
-- 4. Extend transactions table with SaltEdge fields
-- ============================================

-- Add SaltEdge-specific columns to transactions
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS saltedge_transaction_id TEXT UNIQUE;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS bank_account_id UUID REFERENCES bank_accounts(id) ON DELETE SET NULL;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS is_synced BOOLEAN DEFAULT FALSE;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS saltedge_category TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS merchant_name TEXT;

-- Index for synced transactions
CREATE INDEX IF NOT EXISTS idx_transactions_saltedge ON transactions(saltedge_transaction_id);
CREATE INDEX IF NOT EXISTS idx_transactions_bank_account ON transactions(bank_account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_synced ON transactions(is_synced);

-- ============================================
-- 5. Update triggers for updated_at
-- ============================================

-- Drop triggers if they exist, then create
DROP TRIGGER IF EXISTS update_saltedge_connections_updated_at ON saltedge_connections;
CREATE TRIGGER update_saltedge_connections_updated_at
  BEFORE UPDATE ON saltedge_connections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_bank_accounts_updated_at ON bank_accounts;
CREATE TRIGGER update_bank_accounts_updated_at
  BEFORE UPDATE ON bank_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 6. Service role policy for Edge Functions
-- ============================================
-- Note: Edge Functions use service_role key which bypasses RLS
-- But we need policies for the webhook endpoint that uses anon key

-- Create a policy that allows inserting/updating via service role
-- This is handled automatically by service_role, but we document it here

-- ============================================
-- 7. Helpful views (optional)
-- ============================================

-- View to get connected accounts with connection info
CREATE OR REPLACE VIEW connected_bank_accounts AS
SELECT
  ba.*,
  sc.provider_name,
  sc.provider_code,
  sc.status as connection_status,
  sc.sync_status as connection_sync_status,
  sc.last_sync_at as connection_last_sync
FROM bank_accounts ba
LEFT JOIN saltedge_connections sc ON ba.saltedge_connection_id = sc.saltedge_connection_id
WHERE ba.is_connected = true;

-- Grant access to authenticated users
GRANT SELECT ON connected_bank_accounts TO authenticated;
