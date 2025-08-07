-- Add footer translations for all supported languages
INSERT INTO app_translations (language, key, value) VALUES

-- Footer translations - English
('en', 'footer.brand_description', 'Zamar is a platform for Christian music that uplifts and inspires believers worldwide.'),
('en', 'footer.quick_links', 'Quick Links'),
('en', 'footer.support', 'Support'),
('en', 'footer.contact_email', 'Contact us at hello@zamar.com'),
('en', 'footer.faith_values', 'Built on faith, powered by technology'),
('en', 'footer.copyright', '© 2024 Zamar. All rights reserved.'),

-- Footer translations - German
('de', 'footer.brand_description', 'Zamar ist eine Plattform für christliche Musik, die Gläubige weltweit erhebt und inspiriert.'),
('de', 'footer.quick_links', 'Schnellzugriff'),
('de', 'footer.support', 'Support'),
('de', 'footer.contact_email', 'Kontaktieren Sie uns unter hello@zamar.com'),
('de', 'footer.faith_values', 'Auf Glauben gebaut, von Technologie angetrieben'),
('de', 'footer.copyright', '© 2024 Zamar. Alle Rechte vorbehalten.'),

-- Footer translations - French
('fr', 'footer.brand_description', 'Zamar est une plateforme de musique chrétienne qui élève et inspire les croyants du monde entier.'),
('fr', 'footer.quick_links', 'Liens rapides'),
('fr', 'footer.support', 'Support'),
('fr', 'footer.contact_email', 'Contactez-nous à hello@zamar.com'),
('fr', 'footer.faith_values', 'Construit sur la foi, alimenté par la technologie'),
('fr', 'footer.copyright', '© 2024 Zamar. Tous droits réservés.'),

-- Footer translations - Spanish
('es', 'footer.brand_description', 'Zamar es una plataforma de música cristiana que eleva e inspira a creyentes de todo el mundo.'),
('es', 'footer.quick_links', 'Enlaces rápidos'),
('es', 'footer.support', 'Soporte'),
('es', 'footer.contact_email', 'Contáctanos en hello@zamar.com'),
('es', 'footer.faith_values', 'Construido en fe, impulsado por tecnología'),
('es', 'footer.copyright', '© 2024 Zamar. Todos los derechos reservados.'),

-- Footer translations - Italian
('it', 'footer.brand_description', 'Zamar è una piattaforma di musica cristiana che eleva e ispira i credenti di tutto il mondo.'),
('it', 'footer.quick_links', 'Collegamenti rapidi'),
('it', 'footer.support', 'Supporto'),
('it', 'footer.contact_email', 'Contattaci a hello@zamar.com'),
('it', 'footer.faith_values', 'Costruito sulla fede, alimentato dalla tecnologia'),
('it', 'footer.copyright', '© 2024 Zamar. Tutti i diritti riservati.'),

-- Footer translations - Portuguese
('pt', 'footer.brand_description', 'Zamar é uma plataforma de música cristã que eleva e inspira crentes em todo o mundo.'),
('pt', 'footer.quick_links', 'Links rápidos'),
('pt', 'footer.support', 'Suporte'),
('pt', 'footer.contact_email', 'Entre em contato conosco em hello@zamar.com'),
('pt', 'footer.faith_values', 'Construído na fé, alimentado pela tecnologia'),
('pt', 'footer.copyright', '© 2024 Zamar. Todos os direitos reservados.')

ON CONFLICT (language, key) DO NOTHING;