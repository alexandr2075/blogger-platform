-- Create devices table for PostgreSQL migration
CREATE TABLE devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    device_id VARCHAR(255) UNIQUE NOT NULL,
    iat VARCHAR(255) NOT NULL,
    device_name VARCHAR(255) DEFAULT 'not specified',
    ip VARCHAR(255) DEFAULT 'not specified',
    exp VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_devices_user_id ON devices(user_id);
CREATE INDEX idx_devices_device_id ON devices(device_id);
CREATE INDEX idx_devices_user_device ON devices(user_id, device_id);
CREATE INDEX idx_devices_exp ON devices(exp);

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_devices_updated_at 
    BEFORE UPDATE ON devices 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add foreign key constraint to users table
ALTER TABLE devices 
ADD CONSTRAINT fk_devices_user_id 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
