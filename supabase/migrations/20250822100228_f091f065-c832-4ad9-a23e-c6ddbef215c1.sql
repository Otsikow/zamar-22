-- Update hero section translations to the correct content
UPDATE app_translations 
SET value = 'Your Story, Your Song', updated_at = now()
WHERE key = 'hero.title_line1' AND language = 'en';

UPDATE app_translations 
SET value = 'Crafted with Purpose', updated_at = now()
WHERE key = 'hero.title_line2' AND language = 'en';

UPDATE app_translations 
SET value = 'Zamar creates custom songs for every occasion – weddings, birthdays, churches, businesses – combining faith and technology to deliver powerful music that speaks.', updated_at = now()
WHERE key = 'hero.subtitle' AND language = 'en';