import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

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

interface TranslationProviderProps {
  children: ReactNode;
}

export const TranslationProvider: React.FC<TranslationProviderProps> = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState<string>('en');
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

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
    const savedLanguage = localStorage.getItem('appLanguage') || 'en';
    console.log('Initializing translation system with language:', savedLanguage);
    setCurrentLanguage(savedLanguage);
    loadTranslations(savedLanguage);
  }, []);

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