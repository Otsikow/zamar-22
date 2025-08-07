
-- Add language column to songs table
ALTER TABLE songs 
ADD COLUMN language text DEFAULT 'English';

-- Create an index on the language column for better query performance
CREATE INDEX idx_songs_language ON songs(language);
