-- Fix blogs table name column collation for proper sorting
ALTER TABLE blogs ALTER COLUMN name TYPE varchar USING name::varchar COLLATE "C";
ALTER TABLE blogs ALTER COLUMN description TYPE varchar USING description::varchar COLLATE "C";
ALTER TABLE blogs ALTER COLUMN "websiteUrl" TYPE varchar USING "websiteUrl"::varchar COLLATE "C";
