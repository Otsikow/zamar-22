import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import BackButton from '@/components/ui/back-button';
import { useSettings } from '@/contexts/SettingsContext';
import { useNowPlaying } from '@/contexts/NowPlayingContext';
import { 
  Volume2, 
  Bell, 
  Shield, 
  Download, 
  Trash2,
  Info,
  Moon,
  Smartphone,
  Play
} from 'lucide-react';

const Settings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { settings, updateSetting, resetSettings, clearCache } = useSettings();
  const { setVolume } = useNowPlaying();

  // Update audio volume when setting changes
  const handleVolumeChange = (volume: number) => {
    updateSetting('volume', volume);
    setVolume(volume / 100); // Convert percentage to 0-1 range
    toast({
      title: "Volume updated",
      description: `Volume set to ${volume}%`
    });
  };

  const handleSettingChange = (key: keyof typeof settings, value: any) => {
    updateSetting(key, value);
    toast({
      title: "Settings updated",
      description: "Your preferences have been saved."
    });
  };

  const handleResetSettings = () => {
    if (confirm('This will reset all settings to default. Are you sure?')) {
      resetSettings();
      toast({
        title: "Settings reset",
        description: "All settings have been restored to default."
      });
    }
  };

  const handleClearCache = () => {
    if (confirm('This will clear all cached data. Are you sure?')) {
      clearCache();
      toast({
        title: "Cache cleared",
        description: "All cached data has been removed."
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
            <h1 className="text-3xl font-heading text-primary">Settings</h1>
            <p className="text-muted-foreground mt-1">Customize your app experience</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Audio Settings */}
          <Card className="border-primary/20 shadow-lg">
            <CardHeader className="border-b border-primary/10">
              <CardTitle className="flex items-center gap-2 text-primary">
                <Volume2 className="h-5 w-5" />
                Audio Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-2">
                <Label>Default Volume: {settings.volume}%</Label>
                <Slider
                  value={[settings.volume]}
                  onValueChange={(value) => handleVolumeChange(value[0])}
                  max={100}
                  step={5}
                  className="w-full"
                />
              </div>

              <div className="space-y-4">
                <Label>Audio Quality</Label>
                <Select
                  value={settings.audioQuality}
                  onValueChange={(value) => handleSettingChange('audioQuality', value)}
                >
                  <SelectTrigger className="border-primary/30 focus:border-primary">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low (64 kbps)</SelectItem>
                    <SelectItem value="medium">Medium (128 kbps)</SelectItem>
                    <SelectItem value="high">High (320 kbps)</SelectItem>
                    <SelectItem value="lossless">Lossless</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Auto-play Next Song</Label>
                  <p className="text-xs text-muted-foreground">
                    Automatically play the next song in queue
                  </p>
                </div>
                <Switch
                  checked={settings.autoPlay}
                  onCheckedChange={(checked) => handleSettingChange('autoPlay', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>High Quality Streaming</Label>
                  <p className="text-xs text-muted-foreground">
                    Use higher bitrate for better sound quality
                  </p>
                </div>
                <Switch
                  checked={settings.highQuality}
                  onCheckedChange={(checked) => handleSettingChange('highQuality', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* App Preferences */}
          <Card className="border-primary/20 shadow-lg">
            <CardHeader className="border-b border-primary/10">
              <CardTitle className="flex items-center gap-2 text-primary">
                <Smartphone className="h-5 w-5" />
                App Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Push Notifications</Label>
                  <p className="text-xs text-muted-foreground">
                    Receive updates about new songs and features
                  </p>
                </div>
                <Switch
                  checked={settings.notifications}
                  onCheckedChange={(checked) => handleSettingChange('notifications', checked)}
                />
              </div>

              <div className="space-y-4">
                <Label>Theme</Label>
                <Select
                  value={settings.theme}
                  onValueChange={(value) => handleSettingChange('theme', value)}
                >
                  <SelectTrigger className="border-primary/30 focus:border-primary">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="auto">Auto (System)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Download Settings */}
          <Card className="border-primary/20 shadow-lg">
            <CardHeader className="border-b border-primary/10">
              <CardTitle className="flex items-center gap-2 text-primary">
                <Download className="h-5 w-5" />
                Download Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Download Over Wi-Fi Only</Label>
                  <p className="text-xs text-muted-foreground">
                    Prevent downloads when using mobile data
                  </p>
                </div>
                <Switch
                  checked={settings.downloadOverWifiOnly}
                  onCheckedChange={(checked) => handleSettingChange('downloadOverWifiOnly', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Privacy & Security */}
          <Card className="border-primary/20 shadow-lg">
            <CardHeader className="border-b border-primary/10">
              <CardTitle className="flex items-center gap-2 text-primary">
                <Shield className="h-5 w-5" />
                Privacy & Security
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <Button
                variant="outline"
                onClick={() => navigate('/privacy-policy')}
                className="w-full justify-start border-primary/30 hover:bg-primary/10"
              >
                View Privacy Policy
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/terms-of-service')}
                className="w-full justify-start border-primary/30 hover:bg-primary/10"
              >
                Terms of Service
              </Button>
            </CardContent>
          </Card>

          {/* Data Management */}
          <Card className="border-primary/20 shadow-lg">
            <CardHeader className="border-b border-primary/10">
              <CardTitle className="flex items-center gap-2 text-primary">
                <Trash2 className="h-5 w-5" />
                Data Management
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <Button
                variant="outline"
                onClick={handleClearCache}
                className="w-full justify-start border-primary/30 hover:bg-primary/10"
              >
                Clear Cache
              </Button>
              <Button
                variant="outline"
                onClick={handleResetSettings}
                className="w-full justify-start border-destructive/30 text-destructive hover:bg-destructive/10"
              >
                Reset All Settings
              </Button>
            </CardContent>
          </Card>

          {/* About */}
          <Card className="border-primary/20 shadow-lg">
            <CardHeader className="border-b border-primary/10">
              <CardTitle className="flex items-center gap-2 text-primary">
                <Info className="h-5 w-5" />
                About Zamar
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4 text-center">
              <div>
                <h3 className="font-heading text-primary text-lg">Zamar</h3>
                <p className="text-muted-foreground">Custom Songs for Every Occasion</p>
                <p className="text-sm text-muted-foreground mt-2">Version 1.0.0</p>
              </div>
              <div className="pt-4 border-t border-primary/10">
                <p className="text-xs text-muted-foreground">
                  © 2025 Zamar. All rights reserved.
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