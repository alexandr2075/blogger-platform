-- Create blogs table for PostgreSQL migration
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE blogs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(15) NOT NULL,
    description VARCHAR(500) NOT NULL,
    website_url VARCHAR(255) NOT NULL,
    is_membership BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- Indexes
CREATE INDEX idx_blogs_name ON blogs(name);
CREATE INDEX idx_blogs_deleted_at ON blogs(deleted_at);

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_blogs_updated_at 
    BEFORE UPDATE ON blogs 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
