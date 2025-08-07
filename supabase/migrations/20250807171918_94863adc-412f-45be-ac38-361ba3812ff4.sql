-- Add missing translations for Support Our Mission section and other hero content

-- English
INSERT INTO public.app_translations (language, key, value) VALUES
('en', 'hero.support_mission', 'Support Our Mission'),
('en', 'hero.empowering_communities', 'Empowering Communities Through Music'),
('en', 'hero.support_description', 'Help us create meaningful music for communities, ministries, and churches worldwide. Every contribution supports hope, healing, and inspiration through custom songs.'),
('en', 'hero.free_songs', 'Free Songs'),
('en', 'hero.global_reach', 'Global Reach'),
('en', 'hero.community', 'Community'),
('en', 'hero.donate_now', 'Donate Now'),
('en', 'hero.earn_referral', 'Earn Referral Bonus'),
('en', 'hero.share_earn', 'Share & Earn Commissions'),
('en', 'hero.referral_description', 'Invite friends to Zamar and earn commission on their purchases. Share the gift of custom music while building your income.'),
('en', 'hero.direct_referrals', 'Direct Referrals'),
('en', 'hero.indirect_referrals', 'Indirect Referrals'),
('en', 'hero.calculate_earnings', 'Calculate Your Earnings'),
('en', 'hero.join_earn', 'Join & Earn'),
('en', 'hero.join_start_earning', 'Join & Start Earning'),
('en', 'hero.guest_referral_description', 'Create an account to get your referral link and start earning commission on every friend who purchases custom songs through your link.')
ON CONFLICT (language, key) DO UPDATE SET value = EXCLUDED.value;

-- French
INSERT INTO public.app_translations (language, key, value) VALUES
('fr', 'hero.support_mission', 'Soutenez Notre Mission'),
('fr', 'hero.empowering_communities', 'Autonomiser les Communautés par la Musique'),
('fr', 'hero.support_description', 'Aidez-nous à créer de la musique significative pour les communautés, ministères et églises du monde entier. Chaque contribution soutient l''espoir, la guérison et l''inspiration à travers des chansons personnalisées.'),
('fr', 'hero.free_songs', 'Chansons Gratuites'),
('fr', 'hero.global_reach', 'Portée Mondiale'),
('fr', 'hero.community', 'Communauté'),
('fr', 'hero.donate_now', 'Faire un Don'),
('fr', 'hero.earn_referral', 'Gagner des Bonus de Parrainage'),
('fr', 'hero.share_earn', 'Partager et Gagner des Commissions'),
('fr', 'hero.referral_description', 'Invitez des amis sur Zamar et gagnez une commission sur leurs achats. Partagez le cadeau de la musique personnalisée tout en développant vos revenus.'),
('fr', 'hero.direct_referrals', 'Parrainages Directs'),
('fr', 'hero.indirect_referrals', 'Parrainages Indirects'),
('fr', 'hero.calculate_earnings', 'Calculer Vos Gains'),
('fr', 'hero.join_earn', 'Rejoindre et Gagner'),
('fr', 'hero.join_start_earning', 'Rejoindre et Commencer à Gagner'),
('fr', 'hero.guest_referral_description', 'Créez un compte pour obtenir votre lien de parrainage et commencer à gagner une commission sur chaque ami qui achète des chansons personnalisées via votre lien.')
ON CONFLICT (language, key) DO UPDATE SET value = EXCLUDED.value;

-- German
INSERT INTO public.app_translations (language, key, value) VALUES
('de', 'hero.support_mission', 'Unterstützen Sie Unsere Mission'),
('de', 'hero.empowering_communities', 'Gemeinden Durch Musik Stärken'),
('de', 'hero.support_description', 'Helfen Sie uns, bedeutungsvolle Musik für Gemeinden, Dienste und Kirchen weltweit zu schaffen. Jeder Beitrag unterstützt Hoffnung, Heilung und Inspiration durch individuelle Lieder.'),
('de', 'hero.free_songs', 'Kostenlose Lieder'),
('de', 'hero.global_reach', 'Globale Reichweite'),
('de', 'hero.community', 'Gemeinschaft'),
('de', 'hero.donate_now', 'Jetzt Spenden'),
('de', 'hero.earn_referral', 'Empfehlungsbonus Verdienen'),
('de', 'hero.share_earn', 'Teilen und Provisionen Verdienen'),
('de', 'hero.referral_description', 'Laden Sie Freunde zu Zamar ein und verdienen Sie Provision bei ihren Käufen. Teilen Sie das Geschenk der individuellen Musik und bauen Sie Ihr Einkommen auf.'),
('de', 'hero.direct_referrals', 'Direkte Empfehlungen'),
('de', 'hero.indirect_referrals', 'Indirekte Empfehlungen'),
('de', 'hero.calculate_earnings', 'Verdienst Berechnen'),
('de', 'hero.join_earn', 'Beitreten und Verdienen'),
('de', 'hero.join_start_earning', 'Beitreten und Verdienen Beginnen'),
('de', 'hero.guest_referral_description', 'Erstellen Sie ein Konto, um Ihren Empfehlungslink zu erhalten und bei jedem Freund Provision zu verdienen, der über Ihren Link individuelle Lieder kauft.')
ON CONFLICT (language, key) DO UPDATE SET value = EXCLUDED.value;

-- Spanish
INSERT INTO public.app_translations (language, key, value) VALUES
('es', 'hero.support_mission', 'Apoya Nuestra Misión'),
('es', 'hero.empowering_communities', 'Empoderando Comunidades a Través de la Música'),
('es', 'hero.support_description', 'Ayúdanos a crear música significativa para comunidades, ministerios e iglesias en todo el mundo. Cada contribución apoya esperanza, sanación e inspiración a través de canciones personalizadas.'),
('es', 'hero.free_songs', 'Canciones Gratuitas'),
('es', 'hero.global_reach', 'Alcance Global'),
('es', 'hero.community', 'Comunidad'),
('es', 'hero.donate_now', 'Donar Ahora'),
('es', 'hero.earn_referral', 'Ganar Bonos de Referidos'),
('es', 'hero.share_earn', 'Compartir y Ganar Comisiones'),
('es', 'hero.referral_description', 'Invita amigos a Zamar y gana comisión en sus compras. Comparte el regalo de música personalizada mientras construyes tus ingresos.'),
('es', 'hero.direct_referrals', 'Referidos Directos'),
('es', 'hero.indirect_referrals', 'Referidos Indirectos'),
('es', 'hero.calculate_earnings', 'Calcular Tus Ganancias'),
('es', 'hero.join_earn', 'Únete y Gana'),
('es', 'hero.join_start_earning', 'Únete y Comienza a Ganar'),
('es', 'hero.guest_referral_description', 'Crea una cuenta para obtener tu enlace de referido y comenzar a ganar comisión en cada amigo que compre canciones personalizadas a través de tu enlace.')
ON CONFLICT (language, key) DO UPDATE SET value = EXCLUDED.value;