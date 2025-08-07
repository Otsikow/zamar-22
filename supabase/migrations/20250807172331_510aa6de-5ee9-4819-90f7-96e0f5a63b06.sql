-- Add Italian translations for Hero section
INSERT INTO app_translations (language, key, value) VALUES

-- Italian Hero translations
('it', 'hero.title_line1', 'La Tua Storia, La Tua Canzone'),
('it', 'hero.title_line2', 'Creata con Proposito'),
('it', 'hero.subtitle', 'Zamar crea canzoni personalizzate per ogni occasione – matrimoni, compleanni, chiese, aziende – combinando fede e tecnologia per offrire musica potente che parla.'),
('it', 'hero.stat1', '500+ Clienti Felici'),
('it', 'hero.stat2', 'Consegna 24-48 ore'),
('it', 'hero.stat3', 'Piattaforma Basata sulla Fede'),
('it', 'hero.create_song', 'Crea la Tua Canzone'),
('it', 'hero.see_examples', 'Vedi Esempi'),
('it', 'hero.radio', 'Radio'),
('it', 'hero.support_mission', 'Sostieni la Nostra Missione'),
('it', 'hero.empowering_communities', 'Potenziare le Comunità Attraverso la Musica'),
('it', 'hero.support_description', 'Aiutaci a creare musica significativa per comunità, ministeri e chiese in tutto il mondo. Ogni contributo sostiene speranza, guarigione e ispirazione attraverso canzoni personalizzate.'),
('it', 'hero.free_songs', 'Canzoni Gratuite'),
('it', 'hero.global_reach', 'Portata Globale'),
('it', 'hero.community', 'Comunità'),
('it', 'hero.donate_now', 'Dona Ora'),
('it', 'hero.earn_referral', 'Guadagna Bonus Referral'),
('it', 'hero.share_earn', 'Condividi e Guadagna Commissioni'),
('it', 'hero.referral_description', 'Invita amici a Zamar e guadagna commissioni sui loro acquisti. Condividi il dono della musica personalizzata costruendo il tuo reddito.'),
('it', 'hero.direct_referrals', 'Referral Diretti'),
('it', 'hero.indirect_referrals', 'Referral Indiretti'),
('it', 'hero.calculate_earnings', 'Calcola i Tuoi Guadagni'),
('it', 'hero.join_start_earning', 'Unisciti e Inizia a Guadagnare'),
('it', 'hero.guest_referral_description', 'Crea un account per ottenere il tuo link di referral e inizia a guadagnare commissioni su ogni amico che acquista canzoni personalizzate tramite il tuo link.'),
('it', 'hero.join_earn', 'Unisciti e Guadagna'),

-- Navigation translations for Italian
('it', 'nav.dashboard', 'Pannello di Controllo'),
('it', 'nav.home', 'Home'),
('it', 'nav.songs', 'Canzoni'),
('it', 'nav.radio', 'Radio'),
('it', 'nav.about', 'Chi Siamo'),
('it', 'nav.pricing', 'Prezzi'),
('it', 'nav.account', 'Account')

ON CONFLICT (language, key) DO NOTHING;