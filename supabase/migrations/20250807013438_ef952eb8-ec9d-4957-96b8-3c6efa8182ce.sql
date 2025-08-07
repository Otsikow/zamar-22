
-- Add some sample songs with Twi language so it appears in the language filter
-- You can later update specific songs to be Twi through your admin interface
UPDATE songs 
SET language = 'Twi' 
WHERE id IN (
  SELECT id 
  FROM songs 
  WHERE title ILIKE '%twi%' OR title ILIKE '%ghana%' OR title ILIKE '%akan%'
  LIMIT 3
);

-- If no songs match the above criteria, we can insert a sample record to ensure Twi appears
-- (You can delete this later if needed)
INSERT INTO songs (title, language, genre, occasion, featured) 
VALUES ('Sample Twi Song', 'Twi', 'Gospel', 'Worship', false)
ON CONFLICT DO NOTHING;
