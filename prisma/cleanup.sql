-- 🚀 Database Cleanup Script
-- Wipes all testing data except for User accounts

TRUNCATE TABLE "chat_messages" CASCADE;
TRUNCATE TABLE "secret_notes" CASCADE;
TRUNCATE TABLE "memories" CASCADE;
TRUNCATE TABLE "meal_logs" CASCADE;
TRUNCATE TABLE "user_moods" CASCADE;
TRUNCATE TABLE "water_logs" CASCADE;
TRUNCATE TABLE "love_notes" CASCADE;

-- Optional: Reset sequences if needed (PostgreSQL specific)
-- ALTER SEQUENCE chat_messages_id_seq RESTART WITH 1;
-- ...etc
