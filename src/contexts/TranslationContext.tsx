import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface TranslationContextType {
  currentLanguage: string;
  translations: Record<string, string>;
  changeLanguage: (language: string) => Promise<void>;
  t: (key: string, fallback?: string) => string;
  loading: boolean;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

const AVAILABLE_LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'pt', name: 'Português', flag: '🇵🇹' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
  { code: 'sw', name: 'Kiswahili', flag: '🇰🇪' },
];

// Mapping from application language codes to locales accepted by
// JavaScript's Intl APIs. Many of the `toLocaleDateString` calls in the
// application previously hard‑coded the US English locale ("en-US"). This
// prevented dates from reflecting the currently selected language when the
// user changed languages via the language selector. By providing a mapping
// here, components can derive an appropriate locale for each supported
// language. If a language code is not found in this map, the language
// itself is returned as the locale. Note: some locales, such as Arabic,
// simply use the language code without a region because specifying a
// region (e.g. "ar-SA") can cause number formatting issues in some
// browsers.
export const LANGUAGE_TO_LOCALE: Record<string, string> = {
  en: 'en-US',
  fr: 'fr-FR',
  es: 'es-ES',
  de: 'de-DE',
  pt: 'pt-PT',
  it: 'it-IT',
  ar: 'ar',
  zh: 'zh-CN',
  hi: 'hi-IN',
  sw: 'sw-KE',
};

/**
 * Returns a locale string for a given language code. If the language code
 * exists in the `LANGUAGE_TO_LOCALE` map, the mapped locale is used.
 * Otherwise the provided language code itself is returned. Components
 * should use this helper when formatting dates so that the output
 * automatically adjusts to the selected language.
 */
export function getLocaleForLanguage(language: string): string {
  return LANGUAGE_TO_LOCALE[language] ?? language;
}

interface TranslationProviderProps {
  children: ReactNode;
}

export const TranslationProvider: React.FC<TranslationProviderProps> = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState<string>('en');
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const loadTranslations = async (language: string) => {
    try {
      setLoading(true);
      console.log('Loading translations for language:', language);
      
      const { data, error } = await supabase
        .from('app_translations')
        .select('key, value')
        .eq('language', language);

      if (error) {
        console.error('Error loading translations:', error);
        // Fallback to English if the language fails to load
        if (language !== 'en') {
          await loadTranslations('en');
        }
        return;
      }

      if (data) {
        const translationMap = Object.fromEntries(
          data.map(item => [item.key, item.value])
        );
        setTranslations(translationMap);
        console.log(`Loaded ${data.length} translations for ${language}:`, translationMap);
      }
    } catch (error) {
      console.error('Failed to load translations:', error);
    } finally {
      setLoading(false);
    }
  };

  const changeLanguage = async (language: string) => {
    console.log('Changing language to:', language);
    localStorage.setItem('appLanguage', language);
    setCurrentLanguage(language);
    
    // Save preferred language to user profile if authenticated
    if (user) {
      try {
        await supabase
          .from('profiles')
          .update({ preferred_language: language })
          .eq('id', user.id);
        console.log('Saved preferred language to user profile:', language);
      } catch (error) {
        console.error('Failed to save preferred language to profile:', error);
      }
    }
    
    await loadTranslations(language);
  };

  const t = (key: string, fallback?: string): string => {
    const translation = translations[key];
    if (translation) {
      return translation;
    }
    
    console.warn(`Translation missing for key: ${key} in language: ${currentLanguage}`);
    return fallback || key;
  };

  useEffect(() => {
    const initializeLanguage = async () => {
      let initialLanguage = 'en';
      
      // Check if user is authenticated and has a preferred language
      if (user) {
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('preferred_language')
            .eq('id', user.id)
            .single();
          
          if (profile?.preferred_language) {
            initialLanguage = profile.preferred_language;
          }
        } catch (error) {
          console.error('Failed to fetch user preferred language:', error);
        }
      }
      
      // Fallback to localStorage if no user preference
      if (!user || initialLanguage === 'en') {
        initialLanguage = localStorage.getItem('appLanguage') || 'en';
      }
      
      console.log('Initializing translation system with language:', initialLanguage);
      setCurrentLanguage(initialLanguage);
      await loadTranslations(initialLanguage);
    };

    initializeLanguage();
  }, [user]);

  const contextValue: TranslationContextType = {
    currentLanguage,
    translations,
    changeLanguage,
    t,
    loading,
  };

  return (
    <TranslationContext.Provider value={contextValue}>
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(TranslationContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
};

export { AVAILABLE_LANGUAGES };