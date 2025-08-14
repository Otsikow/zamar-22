-- Add missing translation keys for Pricing page content
INSERT INTO app_translations (key, language, value) VALUES
-- Custom song tiers translations
('pricing.essentials', 'en', 'Essentials'),
('pricing.essentials', 'pt', 'Essenciais'),
('pricing.essentials', 'fr', 'Essentiel'),
('pricing.essentials', 'es', 'Esenciales'),
('pricing.essentials', 'de', 'Grundlagen'),

('pricing.signature', 'en', 'Signature'),
('pricing.signature', 'pt', 'Assinatura'),
('pricing.signature', 'fr', 'Signature'),
('pricing.signature', 'es', 'Firma'),
('pricing.signature', 'de', 'Signatur'),

('pricing.premier', 'en', 'Premier'),
('pricing.premier', 'pt', 'Premier'),
('pricing.premier', 'fr', 'Premier'),
('pricing.premier', 'es', 'Premier'),
('pricing.premier', 'de', 'Premier'),

('pricing.most_popular', 'en', 'Most Popular'),
('pricing.most_popular', 'pt', 'Mais Popular'),
('pricing.most_popular', 'fr', 'Le Plus Populaire'),
('pricing.most_popular', 'es', 'Más Popular'),
('pricing.most_popular', 'de', 'Am Beliebtesten'),

('pricing.limited_availability', 'en', 'Limited Availability'),
('pricing.limited_availability', 'pt', 'Disponibilidade Limitada'),
('pricing.limited_availability', 'fr', 'Disponibilité Limitée'),
('pricing.limited_availability', 'es', 'Disponibilidad Limitada'),
('pricing.limited_availability', 'de', 'Begrenzte Verfügbarkeit'),

-- Custom song descriptions
('pricing.perfect_for_quick', 'en', 'Perfect for quick personal messages'),
('pricing.perfect_for_quick', 'pt', 'Perfeito para mensagens pessoais rápidas'),
('pricing.perfect_for_quick', 'fr', 'Parfait pour les messages personnels rapides'),
('pricing.perfect_for_quick', 'es', 'Perfecto para mensajes personales rápidos'),
('pricing.perfect_for_quick', 'de', 'Perfekt für schnelle persönliche Nachrichten'),

('pricing.most_popular_choice', 'en', 'Most popular choice for special occasions'),
('pricing.most_popular_choice', 'pt', 'Escolha mais popular para ocasiões especiais'),
('pricing.most_popular_choice', 'fr', 'Choix le plus populaire pour les occasions spéciales'),
('pricing.most_popular_choice', 'es', 'Opción más popular para ocasiones especiales'),
('pricing.most_popular_choice', 'de', 'Beliebteste Wahl für besondere Anlässe'),

('pricing.premium_experience', 'en', 'Premium experience with fastest delivery'),
('pricing.premium_experience', 'pt', 'Experiência premium com entrega mais rápida'),
('pricing.premium_experience', 'fr', 'Expérience premium avec la livraison la plus rapide'),
('pricing.premium_experience', 'es', 'Experiencia premium con entrega más rápida'),
('pricing.premium_experience', 'de', 'Premium-Erlebnis mit schnellster Lieferung'),

-- Order Now button
('pricing.order_now', 'en', 'Order Now'),
('pricing.order_now', 'pt', 'Encomendar Agora'),
('pricing.order_now', 'fr', 'Commander Maintenant'),
('pricing.order_now', 'es', 'Ordenar Ahora'),
('pricing.order_now', 'de', 'Jetzt Bestellen'),

-- Supporter plans
('pricing.supporter_lifetime', 'en', 'Supporter Lifetime'),
('pricing.supporter_lifetime', 'pt', 'Apoiador Vitalício'),
('pricing.supporter_lifetime', 'fr', 'Supporter à Vie'),
('pricing.supporter_lifetime', 'es', 'Seguidor de por Vida'),
('pricing.supporter_lifetime', 'de', 'Unterstützer Lebenslang'),

('pricing.only_first_500', 'en', 'Only first 500 supporters'),
('pricing.only_first_500', 'pt', 'Apenas os primeiros 500 apoiadores'),
('pricing.only_first_500', 'fr', 'Seulement les 500 premiers supporters'),
('pricing.only_first_500', 'es', 'Solo los primeros 500 seguidores'),
('pricing.only_first_500', 'de', 'Nur die ersten 500 Unterstützer'),

('pricing.standard', 'en', 'Standard'),
('pricing.standard', 'pt', 'Padrão'),
('pricing.standard', 'fr', 'Standard'),
('pricing.standard', 'es', 'Estándar'),
('pricing.standard', 'de', 'Standard'),

('pricing.family_church', 'en', 'Family/Church'),
('pricing.family_church', 'pt', 'Família/Igreja'),
('pricing.family_church', 'fr', 'Famille/Église'),
('pricing.family_church', 'es', 'Familia/Iglesia'),
('pricing.family_church', 'de', 'Familie/Kirche'),

('pricing.up_to_5_accounts', 'en', 'up to 5 accounts'),
('pricing.up_to_5_accounts', 'pt', 'até 5 contas'),
('pricing.up_to_5_accounts', 'fr', 'jusqu à 5 comptes'),
('pricing.up_to_5_accounts', 'es', 'hasta 5 cuentas'),
('pricing.up_to_5_accounts', 'de', 'bis zu 5 Konten'),

-- Supporter features
('pricing.ad_free_streaming', 'en', 'Ad-free streaming'),
('pricing.ad_free_streaming', 'pt', 'Streaming sem anúncios'),
('pricing.ad_free_streaming', 'fr', 'Streaming sans publicité'),
('pricing.ad_free_streaming', 'es', 'Transmisión sin anuncios'),
('pricing.ad_free_streaming', 'de', 'Werbefreies Streaming'),

('pricing.unlimited_downloads', 'en', 'Unlimited downloads (songs & lyrics)'),
('pricing.unlimited_downloads', 'pt', 'Downloads ilimitados (músicas e letras)'),
('pricing.unlimited_downloads', 'fr', 'Téléchargements illimités (chansons et paroles)'),
('pricing.unlimited_downloads', 'es', 'Descargas ilimitadas (canciones y letras)'),
('pricing.unlimited_downloads', 'de', 'Unbegrenzte Downloads (Lieder & Texte)'),

('pricing.playlist_creation', 'en', 'Playlist creation'),
('pricing.playlist_creation', 'pt', 'Criação de playlist'),
('pricing.playlist_creation', 'fr', 'Création de playlist'),
('pricing.playlist_creation', 'es', 'Creación de listas de reproducción'),
('pricing.playlist_creation', 'de', 'Playlist-Erstellung'),

('pricing.song_suggestion_submissions', 'en', 'Song suggestion submissions'),
('pricing.song_suggestion_submissions', 'pt', 'Submissões de sugestões de música'),
('pricing.song_suggestion_submissions', 'fr', 'Soumissions de suggestions de chansons'),
('pricing.song_suggestion_submissions', 'es', 'Envíos de sugerencias de canciones'),
('pricing.song_suggestion_submissions', 'de', 'Einreichung von Liedvorschlägen'),

('pricing.access_my_library', 'en', 'Access to My Library'),
('pricing.access_my_library', 'pt', 'Acesso à Minha Biblioteca'),
('pricing.access_my_library', 'fr', 'Accès à Ma Bibliothèque'),
('pricing.access_my_library', 'es', 'Acceso a Mi Biblioteca'),
('pricing.access_my_library', 'de', 'Zugang zu Meiner Bibliothek'),

-- CTA buttons
('pricing.become_supporter', 'en', 'Become a Supporter'),
('pricing.become_supporter', 'pt', 'Torne-se um Apoiador'),
('pricing.become_supporter', 'fr', 'Devenir un Supporter'),
('pricing.become_supporter', 'es', 'Convertirse en Seguidor'),
('pricing.become_supporter', 'de', 'Unterstützer werden'),

('pricing.subscribe_now', 'en', 'Subscribe Now'),
('pricing.subscribe_now', 'pt', 'Assinar Agora'),
('pricing.subscribe_now', 'fr', 'S abonner Maintenant'),
('pricing.subscribe_now', 'es', 'Suscribirse Ahora'),
('pricing.subscribe_now', 'de', 'Jetzt Abonnieren'),

-- Referral specific keys
('referral.back', 'en', 'Back'),
('referral.back', 'pt', 'Voltar'),
('referral.back', 'fr', 'Retour'),
('referral.back', 'es', 'Atrás'),
('referral.back', 'de', 'Zurück'),

('referral.refresh', 'en', 'Refresh'),
('referral.refresh', 'pt', 'Atualizar'),
('referral.refresh', 'fr', 'Actualiser'),
('referral.refresh', 'es', 'Actualizar'),
('referral.refresh', 'de', 'Aktualisieren'),

('referral.earnings_calculator', 'en', 'Earnings Calculator'),
('referral.earnings_calculator', 'pt', 'Calculadora de Ganhos'),
('referral.earnings_calculator', 'fr', 'Calculateur de Gains'),
('referral.earnings_calculator', 'es', 'Calculadora de Ganancias'),
('referral.earnings_calculator', 'de', 'Verdienstrechner'),

-- Additional pricing feature translations
('pricing.save_12', 'en', 'save £12'),
('pricing.save_12', 'pt', 'economize £12'),
('pricing.save_12', 'fr', 'économisez £12'),
('pricing.save_12', 'es', 'ahorra £12'),
('pricing.save_12', 'de', 'spare £12'),

('pricing.or', 'en', 'or'),
('pricing.or', 'pt', 'ou'),
('pricing.or', 'fr', 'ou'),
('pricing.or', 'es', 'o'),
('pricing.or', 'de', 'oder');