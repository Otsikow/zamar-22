import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import BackButton from '@/components/ui/back-button';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from '@/contexts/TranslationContext';
import { 
  Volume2, 
  Bell, 
  Shield, 
  Download, 
  Trash2,
  Info,
  Moon,
  Smartphone
} from 'lucide-react';

interface SettingsData {
  notifications: boolean;
  autoPlay: boolean;
  highQuality: boolean;
  downloadOverWifiOnly: boolean;
  volume: number;
  audioQuality: string;
}

const ThemeSelector = () => {
  const { theme, setTheme } = useTheme();
  
  return (
    <Select value={theme} onValueChange={setTheme}>
      <SelectTrigger className="border-primary/30 focus:border-primary">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="system">Auto (System)</SelectItem>
        <SelectItem value="light">Light</SelectItem>
        <SelectItem value="dark">Dark</SelectItem>
      </SelectContent>
    </Select>
  );
};

const Settings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [settings, setSettings] = useState<SettingsData>({
    notifications: true,
    autoPlay: false,
    highQuality: true,
    downloadOverWifiOnly: true,
    volume: 80,
    audioQuality: 'high'
  });

  useEffect(() => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('zamar_settings');
    if (savedSettings) {
      setSettings({ ...settings, ...JSON.parse(savedSettings) });
    }
  }, []);

  const updateSetting = (key: keyof SettingsData, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    localStorage.setItem('zamar_settings', JSON.stringify(newSettings));
    
    toast({
      title: t('settings.toast.updated_title', 'Settings updated'),
      description: t('settings.toast.updated_desc', 'Your preferences have been saved.')
    });
  };

  const clearCache = () => {
    if (confirm(t('settings.confirm.clear_cache', 'This will clear all cached data. Are you sure?'))) {
      localStorage.removeItem('zamar_cache');
      toast({
      title: t('settings.toast.cache_cleared_title', 'Cache cleared'),
      description: t('settings.toast.cache_cleared_desc', 'All cached data has been removed.')
      });
    }
  };

  const resetSettings = () => {
    if (confirm(t('settings.confirm.reset', 'This will reset all settings to default. Are you sure?'))) {
      const defaultSettings: SettingsData = {
        notifications: true,
        autoPlay: false,
        highQuality: true,
        downloadOverWifiOnly: true,
        volume: 80,
        audioQuality: 'high'
      };
      setSettings(defaultSettings);
      localStorage.setItem('zamar_settings', JSON.stringify(defaultSettings));
      
      toast({
      title: t('settings.toast.reset_title', 'Settings reset'),
      description: t('settings.toast.reset_desc', 'All settings have been restored to default.')
      });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-32"> {/* Added bottom padding for mini player + nav */}
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <BackButton showOnDesktop={true} />
          <div>
            <h1 className="text-3xl font-heading text-primary">{t('settings.title', 'Settings')}</h1>
            <p className="text-muted-foreground mt-1">{t('settings.subtitle', 'Customize your app experience')}</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Audio Settings */}
          <Card className="border-primary/20 shadow-lg">
            <CardHeader className="border-b border-primary/10">
              <CardTitle className="flex items-center gap-2 text-primary">
                <Volume2 className="h-5 w-5" />
                {t('settings.audio.title', 'Audio Settings')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-2">
                <Label>{t('settings.audio.default_volume', 'Default Volume')}: {settings.volume}%</Label>
                <Slider
                  value={[settings.volume]}
                  onValueChange={(value) => updateSetting('volume', value[0])}
                  max={100}
                  step={5}
                  className="w-full"
                />
              </div>

              <div className="space-y-4">
                <Label>{t('settings.audio.quality', 'Audio Quality')}</Label>
                <Select
                  value={settings.audioQuality}
                  onValueChange={(value) => updateSetting('audioQuality', value)}
                >
                  <SelectTrigger className="border-primary/30 focus:border-primary">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">{t('settings.audio.quality_low', 'Low (64 kbps)')}</SelectItem>
                    <SelectItem value="medium">{t('settings.audio.quality_medium', 'Medium (128 kbps)')}</SelectItem>
                    <SelectItem value="high">{t('settings.audio.quality_high', 'High (320 kbps)')}</SelectItem>
                    <SelectItem value="lossless">{t('settings.audio.quality_lossless', 'Lossless')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>{t('settings.audio.autoplay', 'Auto-play Next Song')}</Label>
                  <p className="text-xs text-muted-foreground">
                    {t('settings.audio.autoplay_desc', 'Automatically play the next song in queue')}
                  </p>
                </div>
                <Switch
                  checked={settings.autoPlay}
                  onCheckedChange={(checked) => updateSetting('autoPlay', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>{t('settings.audio.high_quality', 'High Quality Streaming')}</Label>
                  <p className="text-xs text-muted-foreground">
                    {t('settings.audio.high_quality_desc', 'Use higher bitrate for better sound quality')}
                  </p>
                </div>
                <Switch
                  checked={settings.highQuality}
                  onCheckedChange={(checked) => updateSetting('highQuality', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* App Preferences */}
          <Card className="border-primary/20 shadow-lg">
            <CardHeader className="border-b border-primary/10">
              <CardTitle className="flex items-center gap-2 text-primary">
                <Smartphone className="h-5 w-5" />
                {t('settings.app.title', 'App Preferences')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>{t('settings.app.push_notifications', 'Push Notifications')}</Label>
                  <p className="text-xs text-muted-foreground">
                    {t('settings.app.push_desc', 'Receive updates about new songs and features')}
                  </p>
                </div>
                <Switch
                  checked={settings.notifications}
                  onCheckedChange={(checked) => updateSetting('notifications', checked)}
                />
              </div>

              <div className="space-y-4">
                <Label>{t('settings.app.theme', 'Theme')}</Label>
                <ThemeSelector />
              </div>
            </CardContent>
          </Card>

          {/* Download Settings */}
          <Card className="border-primary/20 shadow-lg">
            <CardHeader className="border-b border-primary/10">
              <CardTitle className="flex items-center gap-2 text-primary">
                <Download className="h-5 w-5" />
                {t('settings.download.title', 'Download Settings')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>{t('settings.download.wifi_only', 'Download Over Wi-Fi Only')}</Label>
                  <p className="text-xs text-muted-foreground">
                    {t('settings.download.wifi_only_desc', 'Prevent downloads when using mobile data')}
                  </p>
                </div>
                <Switch
                  checked={settings.downloadOverWifiOnly}
                  onCheckedChange={(checked) => updateSetting('downloadOverWifiOnly', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Privacy & Security */}
          <Card className="border-primary/20 shadow-lg">
            <CardHeader className="border-b border-primary/10">
              <CardTitle className="flex items-center gap-2 text-primary">
                <Shield className="h-5 w-5" />
                {t('settings.privacy.title', 'Privacy & Security')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <Button
                variant="outline"
                onClick={() => navigate('/privacy-policy')}
                className="w-full justify-start border-primary/30 hover:bg-primary/10"
              >
                {t('settings.privacy.view_policy', 'View Privacy Policy')}
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/terms-of-service')}
                className="w-full justify-start border-primary/30 hover:bg-primary/10"
              >
                {t('settings.privacy.terms', 'Terms of Service')}
              </Button>
            </CardContent>
          </Card>

          {/* Data Management */}
          <Card className="border-primary/20 shadow-lg">
            <CardHeader className="border-b border-primary/10">
              <CardTitle className="flex items-center gap-2 text-primary">
                <Trash2 className="h-5 w-5" />
                {t('settings.data.title', 'Data Management')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <Button
                variant="outline"
                onClick={clearCache}
                className="w-full justify-start border-primary/30 hover:bg-primary/10"
              >
                {t('settings.data.clear_cache', 'Clear Cache')}
              </Button>
              <Button
                variant="outline"
                onClick={resetSettings}
                className="w-full justify-start border-destructive/30 text-destructive hover:bg-destructive/10"
              >
                {t('settings.data.reset_all', 'Reset All Settings')}
              </Button>
            </CardContent>
          </Card>

          {/* About */}
          <Card className="border-primary/20 shadow-lg">
            <CardHeader className="border-b border-primary/10">
              <CardTitle className="flex items-center gap-2 text-primary">
                <Info className="h-5 w-5" />
                {t('settings.about.title', 'About Zamar')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4 text-center">
              <div>
                <h3 className="font-heading text-primary text-lg">Zamar</h3>
                <p className="text-muted-foreground">{t('settings.about.tagline', 'Custom Songs for Every Occasion')}</p>
                <p className="text-sm text-muted-foreground mt-2">{t('settings.about.version', 'Version 1.0.0')}</p>
              </div>
              <div className="pt-4 border-t border-primary/10">
                <p className="text-xs text-muted-foreground">
                  {t('settings.about.copyright', '© 2025 Zamar. All rights reserved.')}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Settings;