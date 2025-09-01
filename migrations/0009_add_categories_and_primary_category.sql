
-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  icon VARCHAR(100) DEFAULT 'Star',
  color VARCHAR(7) DEFAULT '#3b82f6',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add primary_category_id column to users table if it doesn't exist
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'primary_category_id') THEN
    ALTER TABLE users ADD COLUMN primary_category_id INTEGER REFERENCES categories(id);
  END IF;
END $$;

-- Insert default categories
INSERT INTO categories (name, slug, description, icon, color, is_active) VALUES
  ('Art', 'art', 'Digital art, illustrations, and creative visual content', 'Palette', '#ef4444', true),
  ('Fitness', 'fitness', 'Workout routines, nutrition advice, and health tips', 'Dumbbell', '#10b981', true),
  ('Music', 'music', 'Original music, covers, and audio content', 'Music', '#8b5cf6', true),
  ('Tech', 'tech', 'Technology tutorials, reviews, and programming content', 'Laptop', '#06b6d4', true),
  ('Cooking', 'cooking', 'Recipes, cooking tutorials, and culinary content', 'ChefHat', '#f59e0b', true),
  ('Fashion', 'fashion', 'Style guides, fashion tips, and lifestyle content', 'Shirt', '#ec4899', true),
  ('Gaming', 'gaming', 'Gaming content, reviews, and entertainment', 'Gamepad2', '#84cc16', true),
  ('Business', 'business', 'Entrepreneurship, business tips, and professional content', 'Briefcase', '#6366f1', true),
  ('Lifestyle', 'lifestyle', 'Daily life, vlogs, and personal content', 'Home', '#f97316', true),
  ('Education', 'education', 'Educational content, tutorials, and learning materials', 'GraduationCap', '#0ea5e9', true)
ON CONFLICT (name) DO NOTHING;

-- Create creator_categories table if it doesn't exist
CREATE TABLE IF NOT EXISTS creator_categories (
  id SERIAL PRIMARY KEY,
  creator_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(creator_id, category_id)
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_creator_categories_creator_id ON creator_categories(creator_id);
CREATE INDEX IF NOT EXISTS idx_creator_categories_category_id ON creator_categories(category_id);
CREATE INDEX IF NOT EXISTS idx_creator_categories_is_primary ON creator_categories(is_primary);
