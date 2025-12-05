-- Migration script to rebrand from NURSE to CARETAKER
-- Run this BEFORE running prisma db push or prisma migrate

-- Step 1: Update all existing NURSE roles to CARETAKER in users table
UPDATE users 
SET role = 'CARETAKER' 
WHERE role = 'NURSE';

-- Step 2: Rename the nurse_profiles table to caretaker_profiles
ALTER TABLE nurse_profiles RENAME TO caretaker_profiles;

-- Step 3: Rename the nurseId column to caretakerId in information_requests table
ALTER TABLE information_requests 
RENAME COLUMN "nurseId" TO "caretakerId";

-- Step 4: Drop the old NURSE enum value and add CARETAKER
-- Note: PostgreSQL doesn't allow direct enum value changes, so we need to:
-- a) Create a new enum type
CREATE TYPE "UserRole_new" AS ENUM ('USER', 'CARETAKER', 'ADMIN');

-- b) Update the column to use the new enum
ALTER TABLE users 
  ALTER COLUMN role TYPE "UserRole_new" USING role::text::"UserRole_new";

-- c) Drop the old enum and rename the new one
DROP TYPE "UserRole";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";

-- Step 5: Update CareTakerStatus enum (rename NurseStatus)
-- a) Create new enum
CREATE TYPE "CareTakerStatus_new" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- b) Update the column
ALTER TABLE caretaker_profiles 
  ALTER COLUMN status TYPE "CareTakerStatus_new" USING status::text::"CareTakerStatus_new";

-- c) Drop old enum and rename
DROP TYPE "NurseStatus";
ALTER TYPE "CareTakerStatus_new" RENAME TO "CareTakerStatus";

-- Verify the changes
SELECT COUNT(*) as caretaker_count FROM users WHERE role = 'CARETAKER';
SELECT COUNT(*) as total_users FROM users;

