-- Add missing translations for navigation, auth, and featured songs
INSERT INTO app_translations (language, key, value) VALUES

-- Navigation and Auth translations - English
('en', 'nav.profile', 'Profile'),
('en', 'nav.library', 'Library'),
('en', 'auth.signout', 'Sign Out'),
('en', 'auth.signin', 'Sign In'),
('en', 'app.title', 'Zamar'),
('en', 'featured.title', 'Featured Songs'),
('en', 'featured.view_all', 'View All Songs'),

-- Navigation and Auth translations - German
('de', 'nav.profile', 'Profil'),
('de', 'nav.library', 'Bibliothek'),
('de', 'auth.signout', 'Abmelden'),
('de', 'auth.signin', 'Anmelden'),
('de', 'app.title', 'Zamar'),
('de', 'featured.title', 'Ausgewählte Lieder'),
('de', 'featured.view_all', 'Alle Lieder anzeigen'),

-- Navigation and Auth translations - French
('fr', 'nav.profile', 'Profil'),
('fr', 'nav.library', 'Bibliothèque'),
('fr', 'auth.signout', 'Se déconnecter'),
('fr', 'auth.signin', 'Se connecter'),
('fr', 'app.title', 'Zamar'),
('fr', 'featured.title', 'Chansons en vedette'),
('fr', 'featured.view_all', 'Voir toutes les chansons'),

-- Navigation and Auth translations - Spanish
('es', 'nav.profile', 'Perfil'),
('es', 'nav.library', 'Biblioteca'),
('es', 'auth.signout', 'Cerrar sesión'),
('es', 'auth.signin', 'Iniciar sesión'),
('es', 'app.title', 'Zamar'),
('es', 'featured.title', 'Canciones destacadas'),
('es', 'featured.view_all', 'Ver todas las canciones'),

-- Navigation and Auth translations - Italian
('it', 'nav.profile', 'Profilo'),
('it', 'nav.library', 'Biblioteca'),
('it', 'auth.signout', 'Disconnetti'),
('it', 'auth.signin', 'Accedi'),
('it', 'app.title', 'Zamar'),
('it', 'featured.title', 'Canzoni in evidenza'),
('it', 'featured.view_all', 'Vedi tutte le canzoni'),

-- Navigation and Auth translations - Portuguese
('pt', 'nav.profile', 'Perfil'),
('pt', 'nav.library', 'Biblioteca'),
('pt', 'auth.signout', 'Sair'),
('pt', 'auth.signin', 'Entrar'),
('pt', 'app.title', 'Zamar'),
('pt', 'featured.title', 'Canções em destaque'),
('pt', 'featured.view_all', 'Ver todas as canções')

ON CONFLICT (language, key) DO NOTHING;