-- Update video description translation to the correct content
UPDATE app_translations 
SET value = 'Discover how Zamar curates, streams, and inspires. This short overview walks through our radio experience, playlists, and the heart behind the music.', updated_at = now()
WHERE key = 'video.description' AND language = 'en';