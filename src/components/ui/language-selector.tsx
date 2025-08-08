import React from 'react';
import { useTranslation, AVAILABLE_LANGUAGES } from '@/contexts/TranslationContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Globe } from 'lucide-react';

interface LanguageSelectorProps {
  className?: string;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ className }) => {
  const { currentLanguage, changeLanguage, t, loading } = useTranslation();

  const handleLanguageChange = async (languageCode: string) => {
    console.log('Language selector: changing to', languageCode);
    await changeLanguage(languageCode);
  };

  const getCurrentLanguage = () => {
    return AVAILABLE_LANGUAGES.find(lang => lang.code === currentLanguage);
  };

  const currentLang = getCurrentLanguage();

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Globe className="hidden sm:block h-4 w-4 text-muted-foreground" />
      <Select
        value={currentLanguage}
        onValueChange={handleLanguageChange}
        disabled={loading}
      >
        <SelectTrigger className="w-[90px] sm:w-[140px] border-0 bg-transparent hover:bg-accent/50 focus:ring-0">
          <SelectValue>
            <div className="flex items-center gap-2">
              <span>{currentLang?.flag}</span>
              <span className="hidden sm:inline text-sm">{currentLang?.name}</span>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="bg-background/95 backdrop-blur-md border border-white/10">
          {AVAILABLE_LANGUAGES.map((language) => (
            <SelectItem
              key={language.code}
              value={language.code}
              className="hover:bg-accent/50 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span>{language.flag}</span>
                <span>{language.name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};