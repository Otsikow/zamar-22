-- Remove all placeholder songs and related data
DELETE FROM synced_lyrics WHERE song_id IN (SELECT id FROM songs);
DELETE FROM lyrics WHERE song_id IN (SELECT id FROM songs);
DELETE FROM song_plays WHERE song_id IN (SELECT id FROM songs);
DELETE FROM songs;