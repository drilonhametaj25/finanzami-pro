-- Demo Account Seed Script for Apple App Review
-- =============================================
--
-- STEP 1: Create a demo user in Supabase Dashboard
-- ------------------------------------------------
-- 1. Go to: Authentication > Users > Add user
-- 2. Email: demo@finanzami.app (or your preferred email)
-- 3. Password: AppleReview2026!
-- 4. Check "Auto Confirm User" to skip email verification
-- 5. Click "Create user"
-- 6. Copy the user's UUID and replace 'DEMO_USER_ID' below
--
-- STEP 2: Run this script in Supabase SQL Editor
-- ------------------------------------------------

-- Replace this with the actual UUID from the user you created
DO $$
DECLARE
    demo_user_id UUID := 'DEMO_USER_ID'; -- <-- REPLACE THIS WITH ACTUAL USER ID

    -- Category IDs (will be generated)
    cat_groceries UUID;
    cat_transport UUID;
    cat_entertainment UUID;
    cat_utilities UUID;
    cat_dining UUID;
    cat_shopping UUID;
    cat_health UUID;
    cat_subscriptions UUID;
    cat_salary UUID;
    cat_freelance UUID;

BEGIN
    -- =============================================
    -- UPDATE PROFILE
    -- =============================================
    UPDATE profiles
    SET
        full_name = 'Demo User',
        main_currency = 'EUR',
        monthly_budget = 2500.00,
        onboarding_completed = true,
        updated_at = NOW()
    WHERE id = demo_user_id;

    -- =============================================
    -- CREATE CATEGORIES
    -- =============================================

    -- Expense categories
    INSERT INTO categories (id, user_id, name, icon, color, budget, is_preset, is_active, order_index)
    VALUES
        (uuid_generate_v4(), demo_user_id, 'Groceries', 'cart', '#4CAF50', 400.00, true, true, 1)
    RETURNING id INTO cat_groceries;

    INSERT INTO categories (id, user_id, name, icon, color, budget, is_preset, is_active, order_index)
    VALUES
        (uuid_generate_v4(), demo_user_id, 'Transport', 'car', '#2196F3', 200.00, true, true, 2)
    RETURNING id INTO cat_transport;

    INSERT INTO categories (id, user_id, name, icon, color, budget, is_preset, is_active, order_index)
    VALUES
        (uuid_generate_v4(), demo_user_id, 'Entertainment', 'movie', '#9C27B0', 150.00, true, true, 3)
    RETURNING id INTO cat_entertainment;

    INSERT INTO categories (id, user_id, name, icon, color, budget, is_preset, is_active, order_index)
    VALUES
        (uuid_generate_v4(), demo_user_id, 'Utilities', 'flash', '#FF9800', 180.00, true, true, 4)
    RETURNING id INTO cat_utilities;

    INSERT INTO categories (id, user_id, name, icon, color, budget, is_preset, is_active, order_index)
    VALUES
        (uuid_generate_v4(), demo_user_id, 'Dining Out', 'food', '#E91E63', 200.00, true, true, 5)
    RETURNING id INTO cat_dining;

    INSERT INTO categories (id, user_id, name, icon, color, budget, is_preset, is_active, order_index)
    VALUES
        (uuid_generate_v4(), demo_user_id, 'Shopping', 'bag', '#00BCD4', 250.00, true, true, 6)
    RETURNING id INTO cat_shopping;

    INSERT INTO categories (id, user_id, name, icon, color, budget, is_preset, is_active, order_index)
    VALUES
        (uuid_generate_v4(), demo_user_id, 'Health', 'heart-pulse', '#F44336', 100.00, true, true, 7)
    RETURNING id INTO cat_health;

    INSERT INTO categories (id, user_id, name, icon, color, budget, is_preset, is_active, order_index)
    VALUES
        (uuid_generate_v4(), demo_user_id, 'Subscriptions', 'credit-card', '#607D8B', 80.00, true, true, 8)
    RETURNING id INTO cat_subscriptions;

    -- Income categories
    INSERT INTO categories (id, user_id, name, icon, color, budget, is_preset, is_active, order_index)
    VALUES
        (uuid_generate_v4(), demo_user_id, 'Salary', 'briefcase', '#8BC34A', NULL, true, true, 9)
    RETURNING id INTO cat_salary;

    INSERT INTO categories (id, user_id, name, icon, color, budget, is_preset, is_active, order_index)
    VALUES
        (uuid_generate_v4(), demo_user_id, 'Freelance', 'laptop', '#03A9F4', NULL, true, true, 10)
    RETURNING id INTO cat_freelance;

    -- =============================================
    -- CREATE TRANSACTIONS (Last 3 months)
    -- =============================================

    -- Current month transactions
    INSERT INTO transactions (user_id, category_id, amount, type, description, date) VALUES
        (demo_user_id, cat_salary, 3200.00, 'income', 'Monthly Salary', CURRENT_DATE - INTERVAL '5 days'),
        (demo_user_id, cat_groceries, 85.50, 'expense', 'Weekly groceries', CURRENT_DATE - INTERVAL '2 days'),
        (demo_user_id, cat_groceries, 42.30, 'expense', 'Fresh produce', CURRENT_DATE - INTERVAL '6 days'),
        (demo_user_id, cat_transport, 50.00, 'expense', 'Gas station', CURRENT_DATE - INTERVAL '3 days'),
        (demo_user_id, cat_dining, 45.00, 'expense', 'Dinner with friends', CURRENT_DATE - INTERVAL '1 day'),
        (demo_user_id, cat_entertainment, 15.99, 'expense', 'Netflix subscription', CURRENT_DATE - INTERVAL '10 days'),
        (demo_user_id, cat_utilities, 95.00, 'expense', 'Electricity bill', CURRENT_DATE - INTERVAL '8 days'),
        (demo_user_id, cat_shopping, 79.99, 'expense', 'New headphones', CURRENT_DATE - INTERVAL '4 days'),
        (demo_user_id, cat_health, 35.00, 'expense', 'Pharmacy', CURRENT_DATE - INTERVAL '7 days'),
        (demo_user_id, cat_freelance, 450.00, 'income', 'Side project payment', CURRENT_DATE - INTERVAL '12 days');

    -- Last month transactions
    INSERT INTO transactions (user_id, category_id, amount, type, description, date) VALUES
        (demo_user_id, cat_salary, 3200.00, 'income', 'Monthly Salary', CURRENT_DATE - INTERVAL '35 days'),
        (demo_user_id, cat_groceries, 92.40, 'expense', 'Weekly groceries', CURRENT_DATE - INTERVAL '32 days'),
        (demo_user_id, cat_groceries, 65.80, 'expense', 'Weekly groceries', CURRENT_DATE - INTERVAL '39 days'),
        (demo_user_id, cat_groceries, 38.50, 'expense', 'Quick shop', CURRENT_DATE - INTERVAL '45 days'),
        (demo_user_id, cat_transport, 45.00, 'expense', 'Gas station', CURRENT_DATE - INTERVAL '38 days'),
        (demo_user_id, cat_transport, 52.00, 'expense', 'Gas station', CURRENT_DATE - INTERVAL '52 days'),
        (demo_user_id, cat_dining, 62.50, 'expense', 'Restaurant', CURRENT_DATE - INTERVAL '40 days'),
        (demo_user_id, cat_dining, 28.00, 'expense', 'Lunch', CURRENT_DATE - INTERVAL '48 days'),
        (demo_user_id, cat_entertainment, 15.99, 'expense', 'Netflix subscription', CURRENT_DATE - INTERVAL '40 days'),
        (demo_user_id, cat_entertainment, 12.99, 'expense', 'Spotify subscription', CURRENT_DATE - INTERVAL '42 days'),
        (demo_user_id, cat_utilities, 89.00, 'expense', 'Electricity bill', CURRENT_DATE - INTERVAL '36 days'),
        (demo_user_id, cat_utilities, 45.00, 'expense', 'Internet bill', CURRENT_DATE - INTERVAL '37 days'),
        (demo_user_id, cat_shopping, 129.00, 'expense', 'Winter jacket', CURRENT_DATE - INTERVAL '44 days'),
        (demo_user_id, cat_health, 25.00, 'expense', 'Gym membership', CURRENT_DATE - INTERVAL '35 days');

    -- Two months ago transactions
    INSERT INTO transactions (user_id, category_id, amount, type, description, date) VALUES
        (demo_user_id, cat_salary, 3200.00, 'income', 'Monthly Salary', CURRENT_DATE - INTERVAL '65 days'),
        (demo_user_id, cat_freelance, 300.00, 'income', 'Consulting work', CURRENT_DATE - INTERVAL '70 days'),
        (demo_user_id, cat_groceries, 78.90, 'expense', 'Weekly groceries', CURRENT_DATE - INTERVAL '62 days'),
        (demo_user_id, cat_groceries, 54.20, 'expense', 'Weekly groceries', CURRENT_DATE - INTERVAL '69 days'),
        (demo_user_id, cat_transport, 48.00, 'expense', 'Gas station', CURRENT_DATE - INTERVAL '68 days'),
        (demo_user_id, cat_dining, 55.00, 'expense', 'Birthday dinner', CURRENT_DATE - INTERVAL '72 days'),
        (demo_user_id, cat_entertainment, 15.99, 'expense', 'Netflix subscription', CURRENT_DATE - INTERVAL '70 days'),
        (demo_user_id, cat_utilities, 102.00, 'expense', 'Electricity bill', CURRENT_DATE - INTERVAL '66 days'),
        (demo_user_id, cat_shopping, 45.00, 'expense', 'Books', CURRENT_DATE - INTERVAL '75 days'),
        (demo_user_id, cat_health, 25.00, 'expense', 'Gym membership', CURRENT_DATE - INTERVAL '65 days');

    -- =============================================
    -- CREATE GOALS
    -- =============================================
    INSERT INTO goals (user_id, name, icon, target_amount, current_amount, target_date, monthly_allocation, is_completed)
    VALUES
        (demo_user_id, 'Emergency Fund', 'shield', 10000.00, 3500.00, CURRENT_DATE + INTERVAL '12 months', 300.00, false),
        (demo_user_id, 'Summer Vacation', 'airplane', 2500.00, 1200.00, CURRENT_DATE + INTERVAL '6 months', 250.00, false),
        (demo_user_id, 'New Laptop', 'laptop', 1500.00, 800.00, CURRENT_DATE + INTERVAL '4 months', 200.00, false);

    -- =============================================
    -- CREATE RECURRING TRANSACTIONS
    -- =============================================
    INSERT INTO recurring_transactions (user_id, category_id, amount, description, frequency, next_date, is_active)
    VALUES
        (demo_user_id, cat_subscriptions, 15.99, 'Netflix', 'monthly', CURRENT_DATE + INTERVAL '20 days', true),
        (demo_user_id, cat_subscriptions, 12.99, 'Spotify', 'monthly', CURRENT_DATE + INTERVAL '15 days', true),
        (demo_user_id, cat_health, 25.00, 'Gym membership', 'monthly', CURRENT_DATE + INTERVAL '5 days', true),
        (demo_user_id, cat_utilities, 45.00, 'Internet', 'monthly', CURRENT_DATE + INTERVAL '10 days', true);

    -- =============================================
    -- CREATE BANK ACCOUNT
    -- =============================================
    INSERT INTO bank_accounts (user_id, name, type, balance, icon, color, is_primary, currency_code)
    VALUES
        (demo_user_id, 'Main Account', 'checking', 4250.00, 'bank', '#2196F3', true, 'EUR');

    RAISE NOTICE 'Demo account data created successfully!';

END $$;

-- =============================================
-- VERIFY DATA
-- =============================================
-- After running the script, verify with these queries:

-- Check profile
-- SELECT * FROM profiles WHERE id = 'DEMO_USER_ID';

-- Check categories count
-- SELECT COUNT(*) as category_count FROM categories WHERE user_id = 'DEMO_USER_ID';

-- Check transactions count
-- SELECT COUNT(*) as transaction_count FROM transactions WHERE user_id = 'DEMO_USER_ID';

-- Check goals
-- SELECT * FROM goals WHERE user_id = 'DEMO_USER_ID';
