-- Create translations table for multi-language support
CREATE TABLE public.app_translations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  language TEXT NOT NULL,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(language, key)
);

-- Enable Row Level Security
ALTER TABLE public.app_translations ENABLE ROW LEVEL SECURITY;

-- Create policies for translations
CREATE POLICY "Anyone can view translations" 
ON public.app_translations 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage translations" 
ON public.app_translations 
FOR ALL
USING (is_admin());

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_translations_updated_at
BEFORE UPDATE ON public.app_translations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some initial English translations
INSERT INTO public.app_translations (language, key, value) VALUES
('en', 'app.title', 'ZAMAR'),
('en', 'nav.home', 'Home'),
('en', 'nav.songs', 'Songs'),
('en', 'nav.radio', 'Radio'),
('en', 'nav.library', 'Library'),
('en', 'nav.menu', 'Menu'),
('en', 'player.play', 'Play'),
('en', 'player.pause', 'Pause'),
('en', 'player.next', 'Next'),
('en', 'player.previous', 'Previous'),
('en', 'auth.signin', 'Sign In'),
('en', 'auth.signup', 'Sign Up'),
('en', 'settings.language', 'Language'),
('en', 'common.loading', 'Loading...'),
('en', 'common.error', 'Error occurred');

-- Insert French translations
INSERT INTO public.app_translations (language, key, value) VALUES
('fr', 'app.title', 'ZAMAR'),
('fr', 'nav.home', 'Accueil'),
('fr', 'nav.songs', 'Chansons'),
('fr', 'nav.radio', 'Radio'),
('fr', 'nav.library', 'Bibliothèque'),
('fr', 'nav.menu', 'Menu'),
('fr', 'player.play', 'Jouer'),
('fr', 'player.pause', 'Pause'),
('fr', 'player.next', 'Suivant'),
('fr', 'player.previous', 'Précédent'),
('fr', 'auth.signin', 'Se connecter'),
('fr', 'auth.signup', 'S''inscrire'),
('fr', 'settings.language', 'Langue'),
('fr', 'common.loading', 'Chargement...'),
('fr', 'common.error', 'Erreur survenue');

-- Insert Spanish translations
INSERT INTO public.app_translations (language, key, value) VALUES
('es', 'app.title', 'ZAMAR'),
('es', 'nav.home', 'Inicio'),
('es', 'nav.songs', 'Canciones'),
('es', 'nav.radio', 'Radio'),
('es', 'nav.library', 'Biblioteca'),
('es', 'nav.menu', 'Menú'),
('es', 'player.play', 'Reproducir'),
('es', 'player.pause', 'Pausa'),
('es', 'player.next', 'Siguiente'),
('es', 'player.previous', 'Anterior'),
('es', 'auth.signin', 'Iniciar sesión'),
('es', 'auth.signup', 'Registrarse'),
('es', 'settings.language', 'Idioma'),
('es', 'common.loading', 'Cargando...'),
('es', 'common.error', 'Error ocurrido');