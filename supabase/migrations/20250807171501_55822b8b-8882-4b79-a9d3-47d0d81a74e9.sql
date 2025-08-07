-- Add hero section and main content translations for all languages

-- English hero content
INSERT INTO public.app_translations (language, key, value) VALUES
('en', 'hero.title_line1', 'Your Story, Your Song'),
('en', 'hero.title_line2', 'Crafted with Purpose'),
('en', 'hero.subtitle', 'Zamar creates custom songs for every occasion – weddings, birthdays, churches, businesses – combining faith and technology to deliver powerful music that speaks.'),
('en', 'hero.stat1', '500+ Happy Clients'),
('en', 'hero.stat2', '24-48hr Delivery'),
('en', 'hero.stat3', 'Faith-Based Platform'),
('en', 'hero.create_song', 'Create Your Song'),
('en', 'hero.see_examples', 'See Examples'),
('en', 'hero.radio', 'Radio')
ON CONFLICT (language, key) DO UPDATE SET value = EXCLUDED.value;

-- French hero content
INSERT INTO public.app_translations (language, key, value) VALUES
('fr', 'hero.title_line1', 'Votre Histoire, Votre Chanson'),
('fr', 'hero.title_line2', 'Créée avec Intention'),
('fr', 'hero.subtitle', 'Zamar crée des chansons personnalisées pour chaque occasion – mariages, anniversaires, églises, entreprises – combinant foi et technologie pour livrer une musique puissante qui parle.'),
('fr', 'hero.stat1', '500+ Clients Satisfaits'),
('fr', 'hero.stat2', 'Livraison 24-48h'),
('fr', 'hero.stat3', 'Plateforme Basée sur la Foi'),
('fr', 'hero.create_song', 'Créer Votre Chanson'),
('fr', 'hero.see_examples', 'Voir les Exemples'),
('fr', 'hero.radio', 'Radio')
ON CONFLICT (language, key) DO UPDATE SET value = EXCLUDED.value;

-- Spanish hero content
INSERT INTO public.app_translations (language, key, value) VALUES
('es', 'hero.title_line1', 'Tu Historia, Tu Canción'),
('es', 'hero.title_line2', 'Creada con Propósito'),
('es', 'hero.subtitle', 'Zamar crea canciones personalizadas para cada ocasión – bodas, cumpleaños, iglesias, negocios – combinando fe y tecnología para entregar música poderosa que habla.'),
('es', 'hero.stat1', '500+ Clientes Felices'),
('es', 'hero.stat2', 'Entrega 24-48h'),
('es', 'hero.stat3', 'Plataforma Basada en la Fe'),
('es', 'hero.create_song', 'Crear Tu Canción'),
('es', 'hero.see_examples', 'Ver Ejemplos'),
('es', 'hero.radio', 'Radio')
ON CONFLICT (language, key) DO UPDATE SET value = EXCLUDED.value;

-- German hero content
INSERT INTO public.app_translations (language, key, value) VALUES
('de', 'hero.title_line1', 'Deine Geschichte, Dein Lied'),
('de', 'hero.title_line2', 'Mit Absicht Geschaffen'),
('de', 'hero.subtitle', 'Zamar erstellt maßgeschneiderte Lieder für jeden Anlass – Hochzeiten, Geburtstage, Kirchen, Unternehmen – verbindet Glauben und Technologie, um kraftvolle Musik zu liefern, die spricht.'),
('de', 'hero.stat1', '500+ Zufriedene Kunden'),
('de', 'hero.stat2', '24-48h Lieferung'),
('de', 'hero.stat3', 'Glaubensbasierte Plattform'),
('de', 'hero.create_song', 'Dein Lied Erstellen'),
('de', 'hero.see_examples', 'Beispiele Ansehen'),
('de', 'hero.radio', 'Radio')
ON CONFLICT (language, key) DO UPDATE SET value = EXCLUDED.value;

-- Portuguese hero content
INSERT INTO public.app_translations (language, key, value) VALUES
('pt', 'hero.title_line1', 'Sua História, Sua Música'),
('pt', 'hero.title_line2', 'Criada com Propósito'),
('pt', 'hero.subtitle', 'Zamar cria músicas personalizadas para cada ocasião – casamentos, aniversários, igrejas, empresas – combinando fé e tecnologia para entregar música poderosa que fala.'),
('pt', 'hero.stat1', '500+ Clientes Felizes'),
('pt', 'hero.stat2', 'Entrega 24-48h'),
('pt', 'hero.stat3', 'Plataforma Baseada na Fé'),
('pt', 'hero.create_song', 'Criar Sua Música'),
('pt', 'hero.see_examples', 'Ver Exemplos'),
('pt', 'hero.radio', 'Rádio')
ON CONFLICT (language, key) DO UPDATE SET value = EXCLUDED.value;

-- Italian hero content
INSERT INTO public.app_translations (language, key, value) VALUES
('it', 'hero.title_line1', 'La Tua Storia, La Tua Canzone'),
('it', 'hero.title_line2', 'Creata con Scopo'),
('it', 'hero.subtitle', 'Zamar crea canzoni personalizzate per ogni occasione – matrimoni, compleanni, chiese, aziende – combinando fede e tecnologia per consegnare musica potente che parla.'),
('it', 'hero.stat1', '500+ Clienti Felici'),
('it', 'hero.stat2', 'Consegna 24-48h'),
('it', 'hero.stat3', 'Piattaforma Basata sulla Fede'),
('it', 'hero.create_song', 'Crea La Tua Canzone'),
('it', 'hero.see_examples', 'Vedi Esempi'),
('it', 'hero.radio', 'Radio')
ON CONFLICT (language, key) DO UPDATE SET value = EXCLUDED.value;