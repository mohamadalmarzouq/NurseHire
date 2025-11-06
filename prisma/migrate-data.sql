-- Migration script to copy data from nightShiftSalary to fullTimeSalary
-- Run this after the schema migration succeeds

-- Copy existing nightShiftSalary values to fullTimeSalary
UPDATE nurse_profiles
SET "fullTimeSalary" = COALESCE("nightShiftSalary", 0)
WHERE "fullTimeSalary" = 0 AND "nightShiftSalary" IS NOT NULL;

