import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useTranslation, getLocaleForLanguage } from '@/contexts/TranslationContext';
import { User, Mail, Calendar, Edit3, Save, X, Users } from 'lucide-react';
import BackButton from '@/components/ui/back-button';
import { ReferralDashboard } from '@/components/referrals/ReferralDashboard';

interface UserProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  created_at: string;
  updated_at: string;
}

const Profile = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  // Pull the current language from the translation context so that date
  // formatting honours the selected locale. Without this, the "Member
  // Since" field always displays in US English.
  const { currentLanguage } = useTranslation();
  const locale = getLocaleForLanguage(currentLanguage);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: ''
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Profile doesn't exist, create one
          await createProfile();
        } else {
          throw error;
        }
      } else {
        setProfile(data);
        setFormData({
          first_name: data.first_name || '',
          last_name: data.last_name || ''
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Error loading profile",
        description: "Please try again later",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          id: user?.id,
          email: user?.email,
          first_name: null,
          last_name: null
        })
        .select()
        .single();

      if (error) throw error;
      
      setProfile(data);
      setFormData({
        first_name: '',
        last_name: ''
      });
    } catch (error) {
      console.error('Error creating profile:', error);
    }
  };

  const handleSave = async () => {
    if (!user || !profile) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: formData.first_name.trim() || null,
          last_name: formData.last_name.trim() || null
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully."
      });

      setIsEditing(false);
      fetchProfile(); // Refresh the profile data
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error updating profile",
        description: "Please try again later",
        variant: "destructive"
      });
    }
  };

  const handleCancel = () => {
    setFormData({
      first_name: profile?.first_name || '',
      last_name: profile?.last_name || ''
    });
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground pb-20">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-primary">Loading profile...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-32 pt-24"> {/* Added top padding for header + bottom padding for mini player + nav */}
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <BackButton showOnDesktop={true} />
          <div className="flex-1">
            <h1 className="text-3xl font-heading text-primary">My Account</h1>
            <p className="text-muted-foreground mt-1">Manage your profile information</p>
          </div>
          {!isEditing && (
            <Button
              onClick={() => setIsEditing(true)}
              variant="outline"
              className="border-primary/30 text-primary hover:bg-primary/10"
            >
              <Edit3 className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
        </div>

        {/* Profile Card */}
        <Card className="border-primary/20 shadow-lg mb-6">
          <CardHeader className="border-b border-primary/10">
            <CardTitle className="flex items-center gap-2 text-primary">
              <User className="h-5 w-5" />
              Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {isEditing ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">First Name</Label>
                    <Input
                      id="first_name"
                      value={formData.first_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                      placeholder="Enter your first name"
                      className="border-primary/30 focus:border-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name">Last Name</Label>
                    <Input
                      id="last_name"
                      value={formData.last_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                      placeholder="Enter your last name"
                      className="border-primary/30 focus:border-primary"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={handleCancel}
                    variant="outline"
                    className="flex-1"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSave}
                    className="flex-1"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">First Name</Label>
                    <p className="text-foreground font-medium">
                      {profile?.first_name || 'Not set'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Last Name</Label>
                    <p className="text-foreground font-medium">
                      {profile?.last_name || 'Not set'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Account Details */}
        <Card className="border-primary/20 shadow-lg">
          <CardHeader className="border-b border-primary/10">
            <CardTitle className="flex items-center gap-2 text-primary">
              <Mail className="h-5 w-5" />
              Account Details
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div>
                <Label className="text-sm text-muted-foreground">Email Address</Label>
                <p className="text-foreground font-medium">{user?.email}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Member Since</Label>
                <p className="text-foreground font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {profile?.created_at ? new Date(profile.created_at).toLocaleDateString(locale, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }) : 'Unknown'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Referral Dashboard */}
        <Card className="border-primary/20 shadow-lg">
          <CardHeader className="border-b border-primary/10">
            <CardTitle className="flex items-center gap-2 text-primary">
              <Users className="h-5 w-5" />
              My Referral Earnings
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ReferralDashboard />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;