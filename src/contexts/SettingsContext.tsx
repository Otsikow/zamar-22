import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface SettingsData {
  notifications: boolean;
  autoPlay: boolean;
  highQuality: boolean;
  downloadOverWifiOnly: boolean;
  volume: number;
  audioQuality: string;
  theme: string;
}

interface SettingsContextType {
  settings: SettingsData;
  updateSetting: <K extends keyof SettingsData>(key: K, value: SettingsData[K]) => void;
  resetSettings: () => void;
  clearCache: () => void;
}

const defaultSettings: SettingsData = {
  notifications: true,
  autoPlay: true, // Default to true for better user experience
  highQuality: true,
  downloadOverWifiOnly: true,
  volume: 80,
  audioQuality: 'high',
  theme: 'dark'
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<SettingsData>(defaultSettings);

  // Load settings from localStorage on mount
  useEffect(() => {
    const loadSettings = () => {
      try {
        const savedSettings = localStorage.getItem('zamar_settings');
        if (savedSettings) {
          const parsed = JSON.parse(savedSettings);
          setSettings(prev => ({ ...prev, ...parsed }));
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };

    loadSettings();
  }, []);

  // Save settings to localStorage whenever they change
  const saveSettings = useCallback((newSettings: SettingsData) => {
    try {
      localStorage.setItem('zamar_settings', JSON.stringify(newSettings));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  }, []);

  const updateSetting = useCallback(<K extends keyof SettingsData>(
    key: K,
    value: SettingsData[K]
  ) => {
    setSettings(prev => {
      const newSettings = { ...prev, [key]: value };
      saveSettings(newSettings);
      return newSettings;
    });
  }, [saveSettings]);

  const resetSettings = useCallback(() => {
    setSettings(defaultSettings);
    saveSettings(defaultSettings);
  }, [saveSettings]);

  const clearCache = useCallback(() => {
    try {
      localStorage.removeItem('zamar_cache');
      // Clear any other cached data
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('cache') || key.includes('temp'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }, []);

  const value: SettingsContextType = {
    settings,
    updateSetting,
    resetSettings,
    clearCache,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};