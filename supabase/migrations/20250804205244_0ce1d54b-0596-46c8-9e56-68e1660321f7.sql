-- Delete the duplicate song without audio URL
DELETE FROM songs WHERE id = '7fcdcd0a-3cbf-40b7-9b0d-b38b8b9444e1' AND audio_url IS NULL;