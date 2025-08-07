-- Add more English translations
INSERT INTO public.app_translations (language, key, value) VALUES
('en', 'nav.back_home', 'Back to Home'),
('en', 'nav.account', 'Account'),
('en', 'nav.profile', 'Profile'),
('en', 'nav.dashboard', 'Dashboard'),
('en', 'auth.welcome', 'Welcome to Zamar'),
('en', 'auth.subtitle', 'Sign in to your account or create a new one'),
('en', 'auth.login', 'Login'),
('en', 'auth.email', 'Email'),
('en', 'auth.password', 'Password'),
('en', 'auth.signing_in', 'Signing in...'),
('en', 'auth.first_name', 'First Name'),
('en', 'auth.last_name', 'Last Name'),
('en', 'auth.confirm_password', 'Confirm Password'),
('en', 'auth.creating_account', 'Creating account...'),
('en', 'auth.create_account', 'Create Account'),
('en', 'auth.signout', 'Sign Out')
ON CONFLICT (language, key) DO UPDATE SET value = EXCLUDED.value;

-- Add more French translations
INSERT INTO public.app_translations (language, key, value) VALUES
('fr', 'nav.back_home', 'Retour à l''accueil'),
('fr', 'nav.account', 'Compte'),
('fr', 'nav.profile', 'Profil'),
('fr', 'nav.dashboard', 'Tableau de bord'),
('fr', 'auth.welcome', 'Bienvenue sur Zamar'),
('fr', 'auth.subtitle', 'Connectez-vous à votre compte ou créez-en un nouveau'),
('fr', 'auth.login', 'Connexion'),
('fr', 'auth.email', 'Email'),
('fr', 'auth.password', 'Mot de passe'),
('fr', 'auth.signing_in', 'Connexion en cours...'),
('fr', 'auth.first_name', 'Prénom'),
('fr', 'auth.last_name', 'Nom'),
('fr', 'auth.confirm_password', 'Confirmer le mot de passe'),
('fr', 'auth.creating_account', 'Création du compte...'),
('fr', 'auth.create_account', 'Créer un compte'),
('fr', 'auth.signout', 'Se déconnecter')
ON CONFLICT (language, key) DO UPDATE SET value = EXCLUDED.value;

-- Add more Spanish translations
INSERT INTO public.app_translations (language, key, value) VALUES
('es', 'nav.back_home', 'Volver al inicio'),
('es', 'nav.account', 'Cuenta'),
('es', 'nav.profile', 'Perfil'),
('es', 'nav.dashboard', 'Panel de control'),
('es', 'auth.welcome', 'Bienvenido a Zamar'),
('es', 'auth.subtitle', 'Inicia sesión en tu cuenta o crea una nueva'),
('es', 'auth.login', 'Iniciar sesión'),
('es', 'auth.email', 'Correo'),
('es', 'auth.password', 'Contraseña'),
('es', 'auth.signing_in', 'Iniciando sesión...'),
('es', 'auth.first_name', 'Nombre'),
('es', 'auth.last_name', 'Apellido'),
('es', 'auth.confirm_password', 'Confirmar contraseña'),
('es', 'auth.creating_account', 'Creando cuenta...'),
('es', 'auth.create_account', 'Crear cuenta'),
('es', 'auth.signout', 'Cerrar sesión')
ON CONFLICT (language, key) DO UPDATE SET value = EXCLUDED.value;