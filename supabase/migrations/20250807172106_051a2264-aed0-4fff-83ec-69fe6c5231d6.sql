-- Add any missing Hero section translations (ignore if they already exist)
INSERT INTO app_translations (language, key, value) VALUES

-- Missing English translations
('en', 'hero.earn_referral', 'Earn Referral Bonus'),
('en', 'hero.share_earn', 'Share & Earn Commissions'),
('en', 'hero.referral_description', 'Invite friends to Zamar and earn commission on their purchases. Share the gift of custom music while building your income.'),
('en', 'hero.direct_referrals', 'Direct Referrals'),
('en', 'hero.indirect_referrals', 'Indirect Referrals'),
('en', 'hero.calculate_earnings', 'Calculate Your Earnings'),
('en', 'hero.join_start_earning', 'Join & Start Earning'),
('en', 'hero.guest_referral_description', 'Create an account to get your referral link and start earning commission on every friend who purchases custom songs through your link.'),
('en', 'hero.support_description', 'Help us create meaningful music for communities, ministries, and churches worldwide. Every contribution supports hope, healing, and inspiration through custom songs.'),

-- Missing German translations
('de', 'hero.earn_referral', 'Empfehlungsbonus verdienen'),
('de', 'hero.share_earn', 'Teilen & Provisionen verdienen'),
('de', 'hero.referral_description', 'Lade Freunde zu Zamar ein und verdiene Provision auf ihre Käufe. Teile das Geschenk benutzerdefinierter Musik und baue dein Einkommen auf.'),
('de', 'hero.direct_referrals', 'Direkte Empfehlungen'),
('de', 'hero.indirect_referrals', 'Indirekte Empfehlungen'),
('de', 'hero.calculate_earnings', 'Berechne deine Einnahmen'),
('de', 'hero.join_start_earning', 'Mitmachen & verdienen'),
('de', 'hero.guest_referral_description', 'Erstelle ein Konto, um deinen Empfehlungslink zu erhalten und Provision für jeden Freund zu verdienen, der über deinen Link Custom Songs kauft.'),
('de', 'hero.support_description', 'Hilf uns, bedeutungsvolle Musik für Gemeinden, Dienste und Kirchen weltweit zu erstellen. Jeder Beitrag unterstützt Hoffnung, Heilung und Inspiration durch Custom Songs.'),

-- Missing French translations
('fr', 'hero.earn_referral', 'Gagner un bonus de parrainage'),
('fr', 'hero.share_earn', 'Partager et gagner des commissions'),
('fr', 'hero.referral_description', 'Invitez des amis sur Zamar et gagnez une commission sur leurs achats. Partagez le cadeau de la musique personnalisée tout en construisant vos revenus.'),
('fr', 'hero.direct_referrals', 'Parrainages directs'),
('fr', 'hero.indirect_referrals', 'Parrainages indirects'),
('fr', 'hero.calculate_earnings', 'Calculez vos gains'),
('fr', 'hero.join_start_earning', 'Rejoindre et commencer à gagner'),
('fr', 'hero.guest_referral_description', 'Créez un compte pour obtenir votre lien de parrainage et commencer à gagner une commission sur chaque ami qui achète des chansons personnalisées via votre lien.'),
('fr', 'hero.support_description', 'Aidez-nous à créer de la musique significative pour les communautés, ministères et églises du monde entier. Chaque contribution soutient l''espoir, la guérison et l''inspiration à travers des chansons personnalisées.'),

-- Missing Spanish translations
('es', 'hero.earn_referral', 'Ganar bono por referidos'),
('es', 'hero.share_earn', 'Compartir y ganar comisiones'),
('es', 'hero.referral_description', 'Invita amigos a Zamar y gana comisión en sus compras. Comparte el regalo de la música personalizada mientras construyes tus ingresos.'),
('es', 'hero.direct_referrals', 'Referidos directos'),
('es', 'hero.indirect_referrals', 'Referidos indirectos'),
('es', 'hero.calculate_earnings', 'Calcula tus ganancias'),
('es', 'hero.join_start_earning', 'Únete y empieza a ganar'),
('es', 'hero.guest_referral_description', 'Crea una cuenta para obtener tu enlace de referidos y empezar a ganar comisión por cada amigo que compre canciones personalizadas a través de tu enlace.'),
('es', 'hero.support_description', 'Ayúdanos a crear música significativa para comunidades, ministerios e iglesias en todo el mundo. Cada contribución apoya esperanza, sanación e inspiración a través de canciones personalizadas.')

ON CONFLICT (language, key) DO NOTHING;