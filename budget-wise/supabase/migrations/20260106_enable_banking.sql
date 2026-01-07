-- Migration: Enable Banking Integration
-- Date: 2026-01-06
-- Description: Add tables for Enable Banking API integration

-- Table to store Enable Banking application configuration
-- (JWT keys are stored in environment variables, this is for metadata)

-- Table to store Enable Banking sessions (authorization sessions)
CREATE TABLE IF NOT EXISTS enable_banking_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  session_id TEXT UNIQUE NOT NULL, -- Enable Banking session ID
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'authorized', 'expired', 'revoked', 'error')),
  valid_until TIMESTAMPTZ,
  accounts_data JSONB, -- Cached account data from session
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table to store connected bank accounts via Enable Banking
CREATE TABLE IF NOT EXISTS enable_banking_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  session_id UUID REFERENCES enable_banking_sessions(id) ON DELETE CASCADE NOT NULL,
  account_id TEXT NOT NULL, -- Enable Banking account ID
  iban TEXT,
  bban TEXT,
  account_name TEXT,
  account_type TEXT, -- CACC (current), SVGS (savings), etc.
  currency TEXT DEFAULT 'EUR',
  balance_amount DECIMAL(15, 2),
  balance_type TEXT, -- closingBooked, interimAvailable, etc.
  balance_date DATE,
  bank_name TEXT,
  bank_bic TEXT,
  bank_country TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  last_sync_at TIMESTAMPTZ,
  sync_status TEXT DEFAULT 'pending' CHECK (sync_status IN ('pending', 'syncing', 'success', 'error')),
  sync_error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, account_id)
);

-- Table to store ASPSPs (banks) metadata for caching
CREATE TABLE IF NOT EXISTS enable_banking_aspsps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  bic TEXT,
  country TEXT NOT NULL,
  logo_url TEXT,
  supported_features JSONB, -- AIS, PIS capabilities
  maximum_consent_validity TEXT,
  cached_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(name, country)
);

-- Table for transaction category learning (ML-like approach)
CREATE TABLE IF NOT EXISTS transaction_category_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  pattern TEXT NOT NULL, -- Merchant name/description pattern (regex or substring)
  pattern_type TEXT DEFAULT 'contains' CHECK (pattern_type IN ('contains', 'starts_with', 'ends_with', 'regex', 'exact')),
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE NOT NULL,
  priority INTEGER DEFAULT 0, -- Higher priority rules are evaluated first
  is_global BOOLEAN DEFAULT FALSE, -- Global rules apply to all users
  match_count INTEGER DEFAULT 0, -- How many times this rule was applied
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, pattern, pattern_type)
);

-- Add Enable Banking fields to transactions table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'enable_banking_id') THEN
    ALTER TABLE transactions ADD COLUMN enable_banking_id TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'enable_banking_account_id') THEN
    ALTER TABLE transactions ADD COLUMN enable_banking_account_id UUID REFERENCES enable_banking_accounts(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'remittance_info') THEN
    ALTER TABLE transactions ADD COLUMN remittance_info TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'creditor_name') THEN
    ALTER TABLE transactions ADD COLUMN creditor_name TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'debtor_name') THEN
    ALTER TABLE transactions ADD COLUMN debtor_name TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'booking_date') THEN
    ALTER TABLE transactions ADD COLUMN booking_date DATE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'value_date') THEN
    ALTER TABLE transactions ADD COLUMN value_date DATE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'auto_categorized') THEN
    ALTER TABLE transactions ADD COLUMN auto_categorized BOOLEAN DEFAULT FALSE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'categorization_confidence') THEN
    ALTER TABLE transactions ADD COLUMN categorization_confidence DECIMAL(3, 2);
  END IF;
END $$;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_eb_sessions_user ON enable_banking_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_eb_sessions_status ON enable_banking_sessions(status);
CREATE INDEX IF NOT EXISTS idx_eb_accounts_user ON enable_banking_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_eb_accounts_session ON enable_banking_accounts(session_id);
CREATE INDEX IF NOT EXISTS idx_eb_accounts_sync ON enable_banking_accounts(sync_status);
CREATE INDEX IF NOT EXISTS idx_transactions_eb_id ON transactions(enable_banking_id);
CREATE INDEX IF NOT EXISTS idx_category_rules_user ON transaction_category_rules(user_id);
CREATE INDEX IF NOT EXISTS idx_category_rules_global ON transaction_category_rules(is_global) WHERE is_global = TRUE;

-- Enable Row Level Security
ALTER TABLE enable_banking_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE enable_banking_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE enable_banking_aspsps ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_category_rules ENABLE ROW LEVEL SECURITY;

-- RLS Policies for enable_banking_sessions
CREATE POLICY "Users can view their own sessions"
  ON enable_banking_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sessions"
  ON enable_banking_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions"
  ON enable_banking_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessions"
  ON enable_banking_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for enable_banking_accounts
CREATE POLICY "Users can view their own accounts"
  ON enable_banking_accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own accounts"
  ON enable_banking_accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own accounts"
  ON enable_banking_accounts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own accounts"
  ON enable_banking_accounts FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for ASPSPs (public read)
CREATE POLICY "Anyone can view ASPSPs"
  ON enable_banking_aspsps FOR SELECT
  TO authenticated
  USING (TRUE);

-- RLS Policies for category rules
CREATE POLICY "Users can view their own rules and global rules"
  ON transaction_category_rules FOR SELECT
  USING (auth.uid() = user_id OR is_global = TRUE);

CREATE POLICY "Users can insert their own rules"
  ON transaction_category_rules FOR INSERT
  WITH CHECK (auth.uid() = user_id AND is_global = FALSE);

CREATE POLICY "Users can update their own rules"
  ON transaction_category_rules FOR UPDATE
  USING (auth.uid() = user_id AND is_global = FALSE);

CREATE POLICY "Users can delete their own rules"
  ON transaction_category_rules FOR DELETE
  USING (auth.uid() = user_id AND is_global = FALSE);

-- Insert default global category rules for common merchants
INSERT INTO transaction_category_rules (pattern, pattern_type, category_id, is_global, priority)
SELECT
  rule.pattern,
  rule.pattern_type,
  c.id,
  TRUE,
  rule.priority
FROM (
  VALUES
    -- Supermercati / Spesa alimentare
    ('ESSELUNGA', 'contains', 'Spesa alimentare', 100),
    ('CONAD', 'contains', 'Spesa alimentare', 100),
    ('COOP', 'contains', 'Spesa alimentare', 100),
    ('LIDL', 'contains', 'Spesa alimentare', 100),
    ('EUROSPIN', 'contains', 'Spesa alimentare', 100),
    ('CARREFOUR', 'contains', 'Spesa alimentare', 100),
    ('PAM', 'contains', 'Spesa alimentare', 100),
    ('PENNY', 'contains', 'Spesa alimentare', 100),
    ('ALDI', 'contains', 'Spesa alimentare', 100),
    ('MD DISCOUNT', 'contains', 'Spesa alimentare', 100),
    ('SIMPLY', 'contains', 'Spesa alimentare', 100),
    ('IPER', 'contains', 'Spesa alimentare', 100),

    -- Fast food e ristoranti
    ('MCDONALD', 'contains', 'Ristoranti e bar', 100),
    ('BURGER KING', 'contains', 'Ristoranti e bar', 100),
    ('STARBUCKS', 'contains', 'Ristoranti e bar', 100),
    ('PIZZERIA', 'contains', 'Ristoranti e bar', 80),
    ('RISTORANTE', 'contains', 'Ristoranti e bar', 80),
    ('BAR ', 'contains', 'Ristoranti e bar', 70),
    ('CAFFE', 'contains', 'Ristoranti e bar', 70),
    ('JUST EAT', 'contains', 'Ristoranti e bar', 100),
    ('DELIVEROO', 'contains', 'Ristoranti e bar', 100),
    ('GLOVO', 'contains', 'Ristoranti e bar', 100),
    ('UBER EATS', 'contains', 'Ristoranti e bar', 100),

    -- Trasporti
    ('TRENITALIA', 'contains', 'Trasporti', 100),
    ('ITALO', 'contains', 'Trasporti', 100),
    ('ATM MILANO', 'contains', 'Trasporti', 100),
    ('ATAC', 'contains', 'Trasporti', 100),
    ('ENI', 'contains', 'Trasporti', 90),
    ('Q8', 'contains', 'Trasporti', 90),
    ('IP BENZINA', 'contains', 'Trasporti', 90),
    ('TAMOIL', 'contains', 'Trasporti', 90),
    ('SHELL', 'contains', 'Trasporti', 90),
    ('AUTOSTRADE', 'contains', 'Trasporti', 100),
    ('TELEPASS', 'contains', 'Trasporti', 100),
    ('UBER', 'contains', 'Trasporti', 90),
    ('TAXI', 'contains', 'Trasporti', 80),
    ('PARCHEGGIO', 'contains', 'Trasporti', 80),
    ('PARKING', 'contains', 'Trasporti', 80),

    -- Casa e utenze
    ('ENEL', 'contains', 'Casa', 100),
    ('ENI GAS', 'contains', 'Casa', 100),
    ('A2A', 'contains', 'Casa', 100),
    ('IREN', 'contains', 'Casa', 100),
    ('ACEA', 'contains', 'Casa', 100),
    ('SORGENIA', 'contains', 'Casa', 100),
    ('EDISON', 'contains', 'Casa', 100),
    ('AFFITTO', 'contains', 'Casa', 100),
    ('RENT', 'contains', 'Casa', 80),
    ('CONDOMINIO', 'contains', 'Casa', 100),
    ('IKEA', 'contains', 'Casa', 90),
    ('LEROY MERLIN', 'contains', 'Casa', 90),

    -- Tecnologia e telecomunicazioni
    ('TIM', 'exact', 'Tecnologia', 90),
    ('VODAFONE', 'contains', 'Tecnologia', 100),
    ('WIND', 'contains', 'Tecnologia', 100),
    ('ILIAD', 'contains', 'Tecnologia', 100),
    ('FASTWEB', 'contains', 'Tecnologia', 100),
    ('MEDIAWORLD', 'contains', 'Tecnologia', 100),
    ('UNIEURO', 'contains', 'Tecnologia', 100),
    ('APPLE', 'contains', 'Tecnologia', 90),
    ('AMAZON', 'contains', 'Tecnologia', 70),
    ('NETFLIX', 'contains', 'Svago e intrattenimento', 100),
    ('SPOTIFY', 'contains', 'Svago e intrattenimento', 100),
    ('DISNEY', 'contains', 'Svago e intrattenimento', 100),
    ('PRIME VIDEO', 'contains', 'Svago e intrattenimento', 100),

    -- Salute
    ('FARMACIA', 'contains', 'Salute', 100),
    ('PARAFARMACIA', 'contains', 'Salute', 100),
    ('OSPEDALE', 'contains', 'Salute', 100),
    ('MEDICO', 'contains', 'Salute', 80),
    ('DENTISTA', 'contains', 'Salute', 100),
    ('OTTICO', 'contains', 'Salute', 100),

    -- Abbigliamento
    ('ZARA', 'contains', 'Abbigliamento', 100),
    ('H&M', 'contains', 'Abbigliamento', 100),
    ('PRIMARK', 'contains', 'Abbigliamento', 100),
    ('OVS', 'contains', 'Abbigliamento', 100),
    ('BERSHKA', 'contains', 'Abbigliamento', 100),
    ('PULL&BEAR', 'contains', 'Abbigliamento', 100),
    ('DECATHLON', 'contains', 'Abbigliamento', 90),
    ('NIKE', 'contains', 'Abbigliamento', 90),
    ('ADIDAS', 'contains', 'Abbigliamento', 90),

    -- Viaggi
    ('BOOKING', 'contains', 'Viaggi', 100),
    ('AIRBNB', 'contains', 'Viaggi', 100),
    ('RYANAIR', 'contains', 'Viaggi', 100),
    ('EASYJET', 'contains', 'Viaggi', 100),
    ('ALITALIA', 'contains', 'Viaggi', 100),
    ('ITA AIRWAYS', 'contains', 'Viaggi', 100),
    ('HOTEL', 'contains', 'Viaggi', 80),
    ('EXPEDIA', 'contains', 'Viaggi', 100),

    -- Cura personale
    ('SEPHORA', 'contains', 'Cura personale', 100),
    ('DOUGLAS', 'contains', 'Cura personale', 100),
    ('PARRUCCHIERE', 'contains', 'Cura personale', 100),
    ('BARBIERE', 'contains', 'Cura personale', 100),
    ('ESTETISTA', 'contains', 'Cura personale', 100),
    ('PALESTRA', 'contains', 'Cura personale', 90),
    ('GYM', 'contains', 'Cura personale', 90),

    -- Svago
    ('CINEMA', 'contains', 'Svago e intrattenimento', 100),
    ('TEATRO', 'contains', 'Svago e intrattenimento', 100),
    ('MUSEO', 'contains', 'Svago e intrattenimento', 100),
    ('CONCERTO', 'contains', 'Svago e intrattenimento', 100),
    ('TICKETONE', 'contains', 'Svago e intrattenimento', 100),

    -- Income patterns (entrate)
    ('STIPENDIO', 'contains', 'Stipendio', 100),
    ('SALARY', 'contains', 'Stipendio', 100),
    ('BONIFICO STIPENDIO', 'contains', 'Stipendio', 100),
    ('EMOLUMENTI', 'contains', 'Stipendio', 100),
    ('RIMBORSO', 'contains', 'Rimborso', 90),
    ('REFUND', 'contains', 'Rimborso', 90)
) AS rule(pattern, pattern_type, category_name, priority)
JOIN categories c ON c.name = rule.category_name AND c.is_preset = TRUE
ON CONFLICT DO NOTHING;

-- Function to auto-categorize a transaction
CREATE OR REPLACE FUNCTION auto_categorize_transaction(
  p_user_id UUID,
  p_description TEXT,
  p_merchant_name TEXT DEFAULT NULL,
  p_creditor_name TEXT DEFAULT NULL,
  p_debtor_name TEXT DEFAULT NULL,
  p_remittance_info TEXT DEFAULT NULL,
  p_amount DECIMAL DEFAULT 0
) RETURNS TABLE(category_id UUID, confidence DECIMAL, rule_id UUID) AS $$
DECLARE
  search_text TEXT;
  v_category_id UUID;
  v_confidence DECIMAL;
  v_rule_id UUID;
BEGIN
  -- Combine all text fields for matching
  search_text := UPPER(COALESCE(p_merchant_name, '') || ' ' ||
                       COALESCE(p_creditor_name, '') || ' ' ||
                       COALESCE(p_debtor_name, '') || ' ' ||
                       COALESCE(p_description, '') || ' ' ||
                       COALESCE(p_remittance_info, ''));

  -- Find matching rule (user rules have priority over global)
  SELECT
    tcr.category_id,
    CASE
      WHEN tcr.is_global THEN 0.7 + (tcr.priority::DECIMAL / 500)
      ELSE 0.9 + (tcr.priority::DECIMAL / 1000)
    END as confidence,
    tcr.id
  INTO v_category_id, v_confidence, v_rule_id
  FROM transaction_category_rules tcr
  WHERE
    (tcr.user_id = p_user_id OR tcr.is_global = TRUE)
    AND (
      (tcr.pattern_type = 'contains' AND search_text LIKE '%' || UPPER(tcr.pattern) || '%')
      OR (tcr.pattern_type = 'starts_with' AND search_text LIKE UPPER(tcr.pattern) || '%')
      OR (tcr.pattern_type = 'ends_with' AND search_text LIKE '%' || UPPER(tcr.pattern))
      OR (tcr.pattern_type = 'exact' AND search_text = UPPER(tcr.pattern))
      OR (tcr.pattern_type = 'regex' AND search_text ~ tcr.pattern)
    )
  ORDER BY
    CASE WHEN tcr.user_id = p_user_id THEN 0 ELSE 1 END, -- User rules first
    tcr.priority DESC,
    tcr.match_count DESC
  LIMIT 1;

  -- If found, increment match count
  IF v_rule_id IS NOT NULL THEN
    UPDATE transaction_category_rules
    SET match_count = match_count + 1, updated_at = NOW()
    WHERE id = v_rule_id;

    RETURN QUERY SELECT v_category_id, v_confidence, v_rule_id;
    RETURN;
  END IF;

  -- Fallback: Use "Altro" category with low confidence
  SELECT c.id INTO v_category_id
  FROM categories c
  WHERE c.user_id = p_user_id AND c.name = 'Altro'
  LIMIT 1;

  RETURN QUERY SELECT v_category_id, 0.3::DECIMAL, NULL::UUID;
END;
$$ LANGUAGE plpgsql;

-- Function to learn from user category corrections
CREATE OR REPLACE FUNCTION learn_category_rule(
  p_user_id UUID,
  p_transaction_id UUID,
  p_new_category_id UUID
) RETURNS VOID AS $$
DECLARE
  v_pattern TEXT;
  v_existing_rule_id UUID;
BEGIN
  -- Get the merchant name or description from the transaction
  SELECT COALESCE(merchant_name, creditor_name, description)
  INTO v_pattern
  FROM transactions
  WHERE id = p_transaction_id AND user_id = p_user_id;

  IF v_pattern IS NULL OR LENGTH(v_pattern) < 3 THEN
    RETURN;
  END IF;

  -- Check if rule already exists
  SELECT id INTO v_existing_rule_id
  FROM transaction_category_rules
  WHERE user_id = p_user_id
    AND UPPER(pattern) = UPPER(v_pattern)
    AND pattern_type = 'contains';

  IF v_existing_rule_id IS NOT NULL THEN
    -- Update existing rule
    UPDATE transaction_category_rules
    SET category_id = p_new_category_id,
        match_count = match_count + 1,
        updated_at = NOW()
    WHERE id = v_existing_rule_id;
  ELSE
    -- Create new rule
    INSERT INTO transaction_category_rules
      (user_id, pattern, pattern_type, category_id, priority)
    VALUES
      (p_user_id, v_pattern, 'contains', p_new_category_id, 50);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger to learn from category changes
CREATE OR REPLACE FUNCTION trigger_learn_category()
RETURNS TRIGGER AS $$
BEGIN
  -- Only learn when category is manually changed (not auto-categorized)
  IF OLD.category_id != NEW.category_id AND
     (OLD.auto_categorized = TRUE OR NEW.auto_categorized = FALSE) THEN
    PERFORM learn_category_rule(NEW.user_id, NEW.id, NEW.category_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger if not exists
DROP TRIGGER IF EXISTS learn_category_trigger ON transactions;
CREATE TRIGGER learn_category_trigger
  AFTER UPDATE OF category_id ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION trigger_learn_category();
