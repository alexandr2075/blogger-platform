-- Create posts and post_likes tables for PostgreSQL migration
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(30) NOT NULL,
  short_description VARCHAR(100) NOT NULL,
  content VARCHAR(1000) NOT NULL,
  blog_id UUID NOT NULL REFERENCES blogs(id) ON DELETE CASCADE,
  blog_name VARCHAR(15) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_posts_blog_id ON posts(blog_id);
CREATE INDEX IF NOT EXISTS idx_posts_deleted_at ON posts(deleted_at);

CREATE OR REPLACE FUNCTION update_posts_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_posts_updated_at ON posts;
CREATE TRIGGER update_posts_updated_at
BEFORE UPDATE ON posts
FOR EACH ROW EXECUTE FUNCTION update_posts_updated_at_column();

-- Likes table to support like/dislike/none per user per post
CREATE TABLE IF NOT EXISTS post_likes (
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(10) NOT NULL CHECK (status IN ('Like','Dislike','None')),
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (post_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON post_likes(user_id);
