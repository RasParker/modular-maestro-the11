import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, Upload, Shield, Key, Smartphone, Eye, EyeOff, Trash2, Camera, Image, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { setLocalStorageItem, getLocalStorageItem } from '@/lib/storage-utils';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

export const CreatorSettings: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { updateUser } = useAuth();

  // Get the tab from URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const defaultTab = urlParams.get('tab') || 'profile';
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('mtn-momo');
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(
    getLocalStorageItem('profilePhotoUrl')
  );
  const [coverPhotoUrl, setCoverPhotoUrl] = useState<string | null>(
    getLocalStorageItem('coverPhotoUrl')
  );
  const [displayName, setDisplayName] = useState<string>(
    getLocalStorageItem('displayName') || ''
  );
  const [bio, setBio] = useState<string>(
    getLocalStorageItem('bio') || ''
  );
  const [open, setOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEmailChangeDialogOpen, setIsEmailChangeDialogOpen] = useState(false);
  const [isPasswordChangeDialogOpen, setIsPasswordChangeDialogOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [passwordFormData, setPasswordFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [currentEmail, setCurrentEmail] = useState('creator4@example.com');
  const [commentsEnabled, setCommentsEnabled] = useState(true);
  const [autoPostEnabled, setAutoPostEnabled] = useState(false);
  const [watermarkEnabled, setWatermarkEnabled] = useState(true);
  const [socialLinks, setSocialLinks] = useState({
    twitter: '',
    instagram: '',
    website: ''
  });

  // Privacy settings state
  const [profileDiscoverable, setProfileDiscoverable] = useState(true);
  const [activityStatusVisible, setActivityStatusVisible] = useState(false);

  // Monthly goals state
  const [monthlyGoals, setMonthlyGoals] = useState({
    subscriberGoal: 3000,
    revenueGoal: 5000,
    postsGoal: 30
  });
  const [isGoalsLoading, setIsGoalsLoading] = useState(false);

  // Payout settings state
  const [payoutSettings, setPayoutSettings] = useState({
    payout_method: 'mtn_momo',
    momo_provider: 'mtn',
    momo_phone: '',
    momo_name: '',
    bank_name: '',
    account_number: '',
    account_name: '',
    auto_withdraw_enabled: false,
    auto_withdraw_threshold: '500.00'
  });
  const [isPayoutSettingsLoading, setIsPayoutSettingsLoading] = useState(false);

  // New state for subscription tiers
  const [tiers, setTiers] = useState([]);
  const { user } = useAuth();

  // Load user settings, payout settings and monthly goals on component mount
  useEffect(() => {
    const loadUserSettings = async () => {
      try {
        const response = await fetch('/api/user/settings');
        if (response.ok) {
          const userData = await response.json();
          setCommentsEnabled(userData.comments_enabled ?? true);
          setProfileDiscoverable(userData.profile_discoverable ?? true);
          setActivityStatusVisible(userData.activity_status_visible ?? false);
          setAutoPostEnabled(userData.auto_post_enabled ?? false);
          setWatermarkEnabled(userData.watermark_enabled ?? true);
          setSocialLinks(userData.social_links || { twitter: '', instagram: '', website: '' });
        }
      } catch (error) {
        console.error('Error loading user settings:', error);
      }
    };

    const loadPayoutSettings = async () => {
      try {
        setIsPayoutSettingsLoading(true);
        const response = await fetch('/api/creators/1/payout-settings');
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            setPayoutSettings(result.data);
            setPaymentMethod(result.data.payout_method || 'mtn_momo');
          }
        }
      } catch (error) {
        console.error('Error loading payout settings:', error);
      } finally {
        setIsPayoutSettingsLoading(false);
      }
    };

    const loadMonthlyGoals = async () => {
      try {
        setIsGoalsLoading(true);
        const response = await fetch('/api/creator/1/goals');
        if (response.ok) {
          const goals = await response.json();
          if (goals) {
            setMonthlyGoals({
              subscriberGoal: goals.subscriberGoal || 3000,
              revenueGoal: goals.revenueGoal || 5000,
              postsGoal: goals.postsGoal || 30
            });
          }
        }
      } catch (error) {
        console.error('Error loading monthly goals:', error);
      } finally {
        setIsGoalsLoading(false);
      }
    };

    const loadSubscriptionTiers = async () => {
      if (!user?.id) return;

      try {
        const response = await fetch(`/api/creators/${user.id}/tiers`);
        if (response.ok) {
          const tiersData = await response.json();
          setTiers(tiersData);
        }
      } catch (error) {
        console.error('Error loading subscription tiers:', error);
      }
    };

    loadUserSettings();
    loadPayoutSettings();
    loadMonthlyGoals();
    loadSubscriptionTiers();
  }, [user?.id]);

  const handleSavePayoutSettings = async () => {
    try {
      setIsPayoutSettingsLoading(true);
      const response = await fetch('/api/creators/1/payout-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...payoutSettings,
          payout_method: paymentMethod,
        }),
      });

      if (response.ok) {
        toast({
          title: "Payout settings saved",
          description: "Your payout settings have been updated successfully.",
        });
      } else {
        throw new Error('Failed to save payout settings');
      }
    } catch (error) {
      console.error('Error saving payout settings:', error);
      toast({
        title: "Error",
        description: "Failed to save payout settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsPayoutSettingsLoading(false);
    }
  };

  const handleSaveMonthlyGoals = async () => {
    try {
      setIsGoalsLoading(true);
      const response = await fetch('/api/creator/1/goals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(monthlyGoals),
      });

      if (response.ok) {
        // Invalidate the goals cache so the dashboard refetches
        await queryClient.invalidateQueries({ queryKey: ['creator', 1, 'goals'] });

        toast({
          title: "Monthly goals saved",
          description: "Your monthly goals have been updated successfully.",
        });
      } else {
        throw new Error('Failed to save monthly goals');
      }
    } catch (error) {
      console.error('Error saving monthly goals:', error);
      toast({
        title: "Error",
        description: "Failed to save monthly goals. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGoalsLoading(false);
    }
  };

  const handleSaveContentSettings = async () => {
    try {
      const response = await fetch('/api/user/content-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          comments_enabled: commentsEnabled,
          auto_post_enabled: autoPostEnabled,
          watermark_enabled: watermarkEnabled,
        }),
      });

      if (response.ok) {
        toast({
          title: "Content settings saved",
          description: "Your content settings have been updated successfully.",
        });
      } else {
        throw new Error('Failed to save content settings');
      }
    } catch (error) {
      console.error('Error saving content settings:', error);
      toast({
        title: "Error",
        description: "Failed to save content settings. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSavePrivacySettings = async () => {
    try {
      const response = await fetch('/api/user/privacy-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          profile_discoverable: profileDiscoverable,
          activity_status_visible: activityStatusVisible,
        }),
      });

      if (response.ok) {
        // Invalidate the online status query to update the OnlineStatusIndicator component
        await queryClient.invalidateQueries({ queryKey: ['onlineStatus'] });

        toast({
          title: "Privacy settings saved",
          description: "Your privacy settings have been updated successfully.",
        });
      } else {
        throw new Error('Failed to save privacy settings');
      }
    } catch (error) {
      console.error('Error saving privacy settings:', error);
      toast({
        title: "Error",
        description: "Failed to save privacy settings. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSave = () => {
    // Save display name and bio to localStorage
    if (displayName.trim()) {
      console.log('Saving display name:', displayName);
      setLocalStorageItem('displayName', displayName.trim());
    }

    if (bio.trim()) {
      setLocalStorageItem('bio', bio.trim());
    }

    // Dispatch custom event to trigger reactivity
    console.log('Dispatching localStorageChange event for displayName and bio');
    window.dispatchEvent(new CustomEvent('localStorageChange', {
      detail: { keys: ['displayName', 'bio'] }
    }));

    toast({
      title: "Settings saved",
      description: "Your settings have been updated successfully.",
    });
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation === 'DELETE') {
      try {
        // Call the backend API to delete the account
        const response = await fetch('/api/delete-account', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to delete account');
        }

        toast({
          title: "Account deleted",
          description: "Your creator account has been permanently deleted.",
          variant: "destructive",
        });

        setIsDeleteDialogOpen(false);
        setDeleteConfirmation('');

        // Clear user data and logout
        localStorage.clear();

        // Redirect to home page after a brief delay
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);

      } catch (error) {
        console.error('Error deleting account:', error);
        toast({
          title: "Deletion failed",
          description: "Failed to delete account. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const handleEmailChange = async () => {
    if (!newEmail) {
      toast({
        title: "Email required",
        description: "Please enter a new email address.",
        variant: "destructive",
      });
      return;
    }

    try {
      // API call to change email would go here
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast({
        title: "Email updated",
        description: "Your email address has been successfully updated.",
      });

      // Update the displayed email
      setCurrentEmail(newEmail);
      setIsEmailChangeDialogOpen(false);
      setNewEmail('');
    } catch (error) {
      toast({
        title: "Update failed",
        description: "Failed to update email. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handlePasswordChange = async () => {
    if (passwordFormData.newPassword !== passwordFormData.confirmPassword) {
      toast({
        title: "Password mismatch",
        description: "New passwords do not match.",
        variant: "destructive",
      });
      return;
    }

    setIsPasswordLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast({
        title: "Password changed",
        description: "Your password has been successfully updated.",
      });

      setPasswordFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setIsPasswordChangeDialogOpen(false);
    } catch (error) {
      toast({
        title: "Update failed",
        description: "Failed to update password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsPasswordLoading(false);
    }
  };

  const handleTempDeleteAccount = async () => {
    try {
      const response = await fetch('/api/delete-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Account deletion failed');
      }

      // Handle successful account deletion (e.g., redirect to logout)
      toast({
        title: "Account deleted",
        description: "Your account has been successfully deleted.",
      });
      // Redirect to logout or another appropriate page
      window.location.href = '/logout'; // Replace '/logout' with your actual logout route
    } catch (error: any) {
      toast({
        title: "Deletion failed",
        description: error.message || "Failed to delete account. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleProfilePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        console.log('Uploading profile photo:', file.name);
        // Create FormData to send the file
        const formData = new FormData();
        formData.append('profilePhoto', file);

        // Upload to backend
        const response = await fetch('/api/upload/profile-photo', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Upload failed');
        }

        const result = await response.json();
        console.log('Upload result:', result);

        // Update the profile photo URL state
        setProfilePhotoUrl(result.url);
        // Save to localStorage so it persists across pages
        setLocalStorageItem('profilePhotoUrl', result.url);

        // Update the user context with the new avatar
        updateUser({ avatar: result.url });

        // Dispatch custom event to trigger reactivity
        window.dispatchEvent(new CustomEvent('localStorageChange', {
          detail: { keys: ['profilePhotoUrl'] }
        }));

        toast({
          title: "Profile photo updated",
          description: "Your profile photo has been updated successfully.",
        });
      } catch (error) {
        toast({
          title: "Upload failed",
          description: "Failed to upload profile photo. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const handleCoverPhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        console.log('Uploading cover photo:', file.name);
        // Create FormData to send the file
        const formData = new FormData();
        formData.append('coverPhoto', file);

        // Upload to backend
        const response = await fetch('/api/upload/cover-photo', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Upload failed');
        }

        const result = await response.json();
        console.log('Upload result:', result);

        // Update the cover photo URL state
        setCoverPhotoUrl(result.url);
        // Save to localStorage so it persists across pages
        setLocalStorageItem('coverPhotoUrl', result.url);

        // Update the user context with the new cover photo
        updateUser({ avatar: result.url } as any);

        // Dispatch custom event to trigger reactivity
        window.dispatchEvent(new CustomEvent('localStorageChange', {
          detail: { keys: ['coverPhotoUrl'] }
        }));

        toast({
          title: "Cover photo updated",
          description: "Your cover photo has been updated successfully.",
        });
      } catch (error) {
        toast({
          title: "Upload failed",
          description: "Failed to upload cover photo. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const handleSaveProfile = async () => {
    try {
      // Save display name and bio to localStorage
      if (displayName.trim()) {
        setLocalStorageItem('displayName', displayName.trim());
      }

      if (bio.trim()) {
        setLocalStorageItem('bio', bio.trim());
      }

      // Sync to database
      const profilePhotoUrl = getLocalStorageItem('profilePhotoUrl');
      const coverPhotoUrl = getLocalStorageItem('coverPhotoUrl');

      const response = await fetch('/api/users/sync-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          displayName: displayName.trim() || null,
          bio: bio.trim() || null,
          profilePhotoUrl: profilePhotoUrl || null,
          coverPhotoUrl: coverPhotoUrl || null,
          socialLinks: socialLinks,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to sync profile to database');
      }

      console.log('Profile synced to database successfully');
      console.log('Dispatching localStorageChange event for displayName and bio');

      // Update the user context with the latest profile data
      updateUser({ 
        avatar: profilePhotoUrl || undefined
      } as any);

      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated and saved.",
      });
    } catch (error) {
      console.error('Profile save error:', error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  // New state for active tab
  const [activeTab, setActiveTab] = useState('profile');

  return (
    <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8 text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2 flex items-center gap-2 justify-center sm:justify-start">
              <Settings className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
              Creator Settings
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Manage your creator profile and preferences
            </p>
          </div>

          <div className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            {/* Tab Navigation */}
            <TabsList className="mb-6">
              <TabsTrigger value="profile">
                Profile
              </TabsTrigger>
              <TabsTrigger value="content">
                Content
              </TabsTrigger>
              <TabsTrigger value="goals">
                Goals
              </TabsTrigger>
              <TabsTrigger value="payouts">
                Payouts
              </TabsTrigger>
              <TabsTrigger value="security">
                Security
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-6">
              <div className="space-y-6">
                <Card className="bg-gradient-card border-border/50">
                  <CardHeader>
                    <CardTitle>Profile Information</CardTitle>
                    <CardDescription>
                      Update your public profile information
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Combined Cover Photo and Profile Photo Section */}
                    <div className="space-y-3">
                      <Label>Cover & Profile Photos</Label>
                      <div className="relative">
                        {/* Cover Photo */}
                        <div className="w-full h-32 rounded-lg overflow-hidden border-2 border-dashed border-border relative">
                          {coverPhotoUrl ? (
                            <img 
                              src={coverPhotoUrl} 
                              alt="Cover photo" 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-r from-primary/20 to-accent/20 flex items-center justify-center">
                              <span className="text-sm text-muted-foreground">Cover Photo Preview</span>
                            </div>
                          )}

                          {/* Cover Photo Upload Indicator */}
                          <div className="absolute top-2 right-2 w-8 h-8 bg-background/80 backdrop-blur-sm rounded-full border-2 border-border flex items-center justify-center cursor-pointer hover:bg-background/90 transition-colors">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleCoverPhotoUpload}
                              className="hidden"
                              id="cover-upload"
                            />
                            <label htmlFor="cover-upload" className="cursor-pointer flex items-center justify-center w-full h-full">
                              {coverPhotoUrl ? (
                                <Image className="w-4 h-4 text-foreground" />
                              ) : (
                                <span className="text-foreground text-sm font-bold">+</span>
                              )}
                            </label>
                          </div>
                        </div>

                        {/* Profile Photo Overlayed on Cover Photo */}
                        <div className="absolute bottom-4 left-6">
                          <div className="relative">
                            <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-background bg-background">
                              {profilePhotoUrl ? (
                                <img 
                                  src={profilePhotoUrl} 
                                  alt="Profile photo" 
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-gradient-primary flex items-center justify-center">
                                  <span className="text-xl font-bold text-primary-foreground">AA</span>
                                </div>
                              )}
                            </div>
                            {/* Profile Photo Upload Indicator */}
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary rounded-full border-2 border-background flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-colors">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleProfilePhotoUpload}
                                className="hidden"
                                id="profile-upload"
                              />
                              <label htmlFor="profile-upload" className="cursor-pointer flex items-center justify-center w-full h-full">
                                {profilePhotoUrl ? (
                                  <Camera className="w-3 h-3 text-primary-foreground" />
                                ) : (
                                  <span className="text-primary-foreground text-sm font-bold">+</span>
                                )}
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Instructions and Remove Buttons */}
                      <div className="mt-16 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-muted-foreground">
                          <div>
                            <p className="font-medium text-foreground mb-1">Cover Photo</p>
                            <p>Recommended size: 800x300px. Max file size: 5MB</p>
                          </div>
                          <div>
                            <p className="font-medium text-foreground mb-1">Profile Photo</p>
                            <p>Square image recommended. Max file size: 5MB</p>
                          </div>
                        </div>

                        {/* Remove Photo Buttons */}
                        {(coverPhotoUrl || profilePhotoUrl) && (
                          <div className="flex flex-col sm:flex-row gap-2">
                            {coverPhotoUrl && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={async () => {
                                  try {
                                    // Remove from localStorage
                                    localStorage.removeItem('coverPhotoUrl');
                                    setCoverPhotoUrl(null);

                                    // Sync to database
                                    await fetch('/api/users/sync-profile', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({
                                        coverPhotoUrl: null,
                                      }),
                                    });

                                    // Trigger reactivity
                                    window.dispatchEvent(new CustomEvent('localStorageChange', {
                                      detail: { keys: ['coverPhotoUrl'] }
                                    }));

                                    toast({
                                      title: "Cover photo removed",
                                      description: "Your cover photo has been removed successfully.",
                                    });
                                  } catch (error) {
                                    toast({
                                      title: "Error",
                                      description: "Failed to remove cover photo. Please try again.",
                                      variant: "destructive",
                                    });
                                  }
                                }}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Remove Cover Photo
                              </Button>
                            )}

                            {profilePhotoUrl && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={async () => {
                                  try {
                                    // Remove from localStorage
                                    localStorage.removeItem('profilePhotoUrl');
                                    setProfilePhotoUrl(null);

                                    // Sync to database
                                    await fetch('/api/users/sync-profile', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({
                                        profilePhotoUrl: null,
                                      }),
                                    });

                                    // Update user context
                                    updateUser({ avatar: undefined } as any);

                                    // Trigger reactivity
                                    window.dispatchEvent(new CustomEvent('localStorageChange', {
                                      detail: { keys: ['profilePhotoUrl'] }
                                    }));

                                    toast({
                                      title: "Profile photo removed",
                                      description: "Your profile photo has been removed successfully.",
                                    });
                                  } catch (error) {
                                    toast({
                                      title: "Error",
                                      description: "Failed to remove profile photo. Please try again.",
                                      variant: "destructive",
                                    });
                                  }
                                }}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Remove Profile Photo
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="displayName">Display Name</Label>
                      <Input 
                        id="displayName" 
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Enter your display name"
                      />
                    </div>

                    <div>
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea 
                        id="bio" 
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="Tell your audience about yourself..."
                        rows={3}
                      />
                    </div>

                    {/* Social Media Links */}
                    <div className="space-y-4">
                      <Label>Social Media Links</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="twitter">Twitter/X</Label>
                          <Input 
                            id="twitter" 
                            value={socialLinks.twitter}
                            onChange={(e) => setSocialLinks(prev => ({ ...prev, twitter: e.target.value }))}
                            placeholder="https://twitter.com/yourusername"
                          />
                        </div>
                        <div>
                          <Label htmlFor="instagram">Instagram</Label>
                          <Input 
                            id="instagram" 
                            value={socialLinks.instagram}
                            onChange={(e) => setSocialLinks(prev => ({ ...prev, instagram: e.target.value }))}
                            placeholder="https://instagram.com/yourusername"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <Label htmlFor="website">Website</Label>
                          <Input 
                            id="website" 
                            value={socialLinks.website}
                            onChange={(e) => setSocialLinks(prev => ({ ...prev, website: e.target.value }))}
                            placeholder="https://yourwebsite.com"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button onClick={handleSaveProfile} className="flex-1">
                        <Save className="w-4 h-4 mr-2" />
                        Save Profile
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="content" className="space-y-6">

                <Card className="bg-gradient-card border-border/50">
                  <CardHeader>
                    <CardTitle>Content Settings</CardTitle>
                    <CardDescription>
                      Configure how your content is displayed and monetized
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="autoPost">Auto-post to social media</Label>
                        <p className="text-sm text-muted-foreground">
                          Automatically share new posts on your connected social accounts
                        </p>
                      </div>
                      <Switch 
                        id="autoPost" 
                        checked={autoPostEnabled}
                        onCheckedChange={setAutoPostEnabled}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="watermark">Add watermark to images</Label>
                        <p className="text-sm text-muted-foreground">
                          Protect your content with your username watermark
                        </p>
                      </div>
                      <Switch 
                        id="watermark" 
                        checked={watermarkEnabled}
                        onCheckedChange={setWatermarkEnabled}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="comments">Allow comments</Label>
                        <p className="text-sm text-muted-foreground">
                          Let subscribers comment on your posts
                        </p>
                      </div>
                      <Switch 
                        id="comments" 
                        checked={commentsEnabled}
                        onCheckedChange={setCommentsEnabled}
                      />
                    </div>

                    <div>
                      <Label htmlFor="defaultTier">Default content tier</Label>
                      <Select defaultValue="free">
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="free">Free</SelectItem>
                          {tiers.map((tier: any) => (
                            <SelectItem key={tier.id} value={tier.name.toLowerCase()}>
                              {tier.name} - GHS {tier.price}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-border/50">
                      <Button 
                        onClick={handleSaveContentSettings}
                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Save Content Settings
                      </Button>
                    </div>
                  </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="goals" className="space-y-6">

                <Card className="bg-gradient-card border-border/50">
                  <CardHeader>
                    <CardTitle>Monthly Goals</CardTitle>
                    <CardDescription>
                      Set your monthly targets to track your creator growth
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="subscriberGoal">Subscriber Goal</Label>
                        <Input
                          id="subscriberGoal"
                          type="number"
                          value={monthlyGoals.subscriberGoal}
                          onChange={(e) => setMonthlyGoals(prev => ({ 
                            ...prev, 
                            subscriberGoal: parseInt(e.target.value) || 0 
                          }))}
                          placeholder="3000"
                          min="0"
                        />
                        <p className="text-xs text-muted-foreground">
                          Target number of total subscribers
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="revenueGoal">Revenue Goal (GHS)</Label>
                        <Input
                          id="revenueGoal"
                          type="number"
                          value={monthlyGoals.revenueGoal}
                          onChange={(e) => setMonthlyGoals(prev => ({ 
                            ...prev, 
                            revenueGoal: parseInt(e.target.value) || 0 
                          }))}
                          placeholder="5000"
                          min="0"
                        />
                        <p className="text-xs text-muted-foreground">
                          Monthly earnings target in GHS
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="postsGoal">Posts Goal</Label>
                        <Input
                          id="postsGoal"
                          type="number"
                          value={monthlyGoals.postsGoal}
                          onChange={(e) => setMonthlyGoals(prev => ({ 
                            ...prev, 
                            postsGoal: parseInt(e.target.value) || 0 
                          }))}
                          placeholder="30"
                          min="0"
                        />
                        <p className="text-xs text-muted-foreground">
                          Number of posts to publish monthly
                        </p>
                      </div>
                    </div>

                    <div className="p-4 rounded-lg bg-muted/20 space-y-3">
                      <h4 className="font-medium text-foreground">Goal Setting Tips</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Set realistic and achievable monthly targets</li>
                        <li>• Review and adjust your goals each month based on performance</li>
                        <li>• Subscriber goals should reflect steady growth, not just retention</li>
                        <li>• Revenue goals help you track monetization effectiveness</li>
                        <li>• Consistent posting helps maintain audience engagement</li>
                      </ul>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-border/50">
                      <Button 
                        onClick={handleSaveMonthlyGoals}
                        disabled={isGoalsLoading}
                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {isGoalsLoading ? 'Saving...' : 'Save Monthly Goals'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="payouts" className="space-y-6">

                <Card className="bg-gradient-card border-border/50">
                  <CardHeader>
                    <CardTitle>Payout Settings</CardTitle>
                    <CardDescription>
                      Configure how you receive payments from your content
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <Label htmlFor="payoutMethod">Primary Payout Method</Label>
                      <Select 
                        value={paymentMethod} 
                        onValueChange={(value) => {
                          setPaymentMethod(value);
                          setPayoutSettings(prev => ({ ...prev, payout_method: value }));
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mtn-momo">MTN Mobile Money</SelectItem>
                          <SelectItem value="vodafone-cash">Vodafone Cash</SelectItem>
                          <SelectItem value="airteltigo-money">AirtelTigo Money</SelectItem>
                          <SelectItem value="bank-transfer">Bank Transfer</SelectItem>
                          <SelectItem value="paystack">Paystack</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {paymentMethod.includes('momo') && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="momoNumber">Mobile Money Number</Label>
                          <Input 
                            id="momoNumber" 
                            value={payoutSettings.momo_phone}
                            onChange={(e) => setPayoutSettings(prev => ({ ...prev, momo_phone: e.target.value }))}
                            placeholder="+233 24 123 4567"
                          />
                        </div>
                        <div>
                          <Label htmlFor="momoName">Account Name</Label>
                          <Input 
                            id="momoName" 
                            value={payoutSettings.momo_name}
                            onChange={(e) => setPayoutSettings(prev => ({ ...prev, momo_name: e.target.value }))}
                            placeholder="Account Name"
                          />
                        </div>
                      </div>
                    )}

                    {paymentMethod === 'bank-transfer' && (
                      <div className="p-4 rounded-lg bg-muted/20 space-y-3">
                        <h4 className="font-medium text-foreground">Bank Details</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="bankName">Bank Name</Label>
                            <Select 
                              value={payoutSettings.bank_name}
                              onValueChange={(value) => setPayoutSettings(prev => ({ ...prev, bank_name: value }))}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select bank" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="gcb">GCB Bank</SelectItem>
                                <SelectItem value="ecobank">Ecobank Ghana</SelectItem>
                                <SelectItem value="absa">Absa Bank Ghana</SelectItem>
                                <SelectItem value="stanbic">Stanbic Bank</SelectItem>
                                <SelectItem value="fidelity">Fidelity Bank</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="accountNumber">Account Number</Label>
                            <Input 
                              id="accountNumber" 
                              value={payoutSettings.account_number}
                              onChange={(e) => setPayoutSettings(prev => ({ ...prev, account_number: e.target.value }))}
                              placeholder="Account Number"
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="accountName">Account Name</Label>
                          <Input 
                            id="accountName" 
                            value={payoutSettings.account_name}
                            onChange={(e) => setPayoutSettings(prev => ({ ...prev, account_name: e.target.value }))}
                            placeholder="Account Name"
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="autoWithdraw">Auto-withdraw earnings</Label>
                        <p className="text-sm text-muted-foreground">
                          Automatically withdraw when balance reaches GH₵ {payoutSettings.auto_withdraw_threshold}
                        </p>
                      </div>
                      <Switch 
                        id="autoWithdraw" 
                        checked={payoutSettings.auto_withdraw_enabled}
                        onCheckedChange={(checked) => setPayoutSettings(prev => ({ ...prev, auto_withdraw_enabled: checked }))}
                      />
                    </div>

                    <div>
                      <Label htmlFor="taxId">TIN (Tax Identification Number)</Label>
                      <Input id="taxId" placeholder="Enter your TIN for tax reporting" />
                      <p className="text-xs text-muted-foreground mt-1">
                        Required for earnings above GH₵ 10,000 annually
                      </p>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-border/50">
                      <Button 
                        onClick={handleSavePayoutSettings}
                        disabled={isPayoutSettingsLoading}
                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {isPayoutSettingsLoading ? 'Saving...' : 'Save Payout Settings'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

</TabsContent>

            <TabsContent value="security" className="space-y-6">

                <Card className="bg-gradient-card border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="w-5 h-5" />
                      Security Settings
                    </CardTitle>
                    <CardDescription>
                      Keep your account secure with these settings
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Email Address */}
                    <div className="space-y-4">
                      <h4 className="font-medium text-foreground">Email Address</h4>
                      <div className="flex items-center justify-between p-4 rounded-lg bg-muted/20">
                        <span className="text-sm">{currentEmail}</span>
                        <Button variant="outline" size="sm" onClick={() => setIsEmailChangeDialogOpen(true)}>
                          Change Email
                        </Button>
                      </div>
                    </div>

                    {/* Change Password */}
                    <div className="space-y-4 pt-4 border-t border-border/50">
                      <h4 className="font-medium text-foreground flex items-center gap-2">
                        <Key className="w-4 h-4" />
                        Password
                      </h4>
                      <div className="flex items-center justify-between p-4 rounded-lg bg-muted/20">
                        <div>
                          <span className="text-sm font-medium">••••••••••••</span>
                          <p className="text-xs text-muted-foreground">Last changed 2 months ago</p>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => setIsPasswordChangeDialogOpen(true)}>
                          Change Password
                        </Button>
                      </div>
                    </div>

                    {/* Two-Factor Authentication */}
                    <div className="space-y-4 pt-4 border-t border-border/50">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-foreground flex items-center gap-2">
                            <Smartphone className="w-4 h-4" />
                            Two-Factor Authentication
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            Add an extra layer of security to your account
                          </p>
                        </div>
                        <Switch 
                          checked={twoFactorEnabled} 
                          onCheckedChange={setTwoFactorEnabled}
                        />
                      </div>
                      {twoFactorEnabled && (
                        <div className="p-4 rounded-lg bg-muted/20">
                          <p className="text-sm text-muted-foreground mb-3">
                            Scan this QR code with your authenticator app or enter the setup key manually.
                          </p>
                          <div className="flex items-center gap-4">
                            <div className="w-32 h-32 bg-white rounded-lg flex items-center justify-center">
                              <span className="text-xs text-gray-500">QR Code</span>
                            </div>
                            <div className="flex-1">
                              <Label htmlFor="setupKey">Setup Key</Label>
                              <Input id="setupKey" value="ABCD-EFGH-IJKL-MNOP" readOnly />
                              <Button variant="outline" size="sm" className="mt-2">Copy Key</Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Login Activity */}
                    <div className="space-y-4 pt-4 border-t border-border/50">
                      <h4 className="font-medium text-foreground">Recent Login Activity</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/10">
                          <div>
                            <p className="text-sm font-medium text-foreground">Current Session</p>
                            <p className="text-xs text-muted-foreground">Chrome on Windows • Accra, Ghana</p>
                          </div>
                          <Badge variant="outline" className="text-xs">Active</Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/10">
                          <div>
                            <p className="text-sm font-medium text-foreground">Mobile App</p>
                            <p className="text-xs text-muted-foreground">iPhone • 2 hours ago</p>
                          </div>
                          <Button variant="outline" size="sm">Revoke</Button>
                        </div>
                      </div>
                    </div>

                    {/* Privacy Settings */}
                    <div className="space-y-4 pt-4 border-t border-border/50">
                      <h4 className="font-medium text-foreground">Privacy Settings</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="profileVisibility">Profile Discovery</Label>
                            <p className="text-sm text-muted-foreground">Allow your profile to appear in search results</p>
                          </div>
                          <Switch 
                            id="profileVisibility" 
                            checked={profileDiscoverable}
                            onCheckedChange={async (checked) => {
                              setProfileDiscoverable(checked);
                              // Auto-save the setting
                              try {
                                const response = await fetch('/api/user/privacy-settings', {
                                  method: 'POST',
                                  headers: {
                                    'Content-Type': 'application/json',
                                  },
                                  body: JSON.stringify({
                                    profile_discoverable: checked,
                                  }),
                                });

                                if (response.ok) {
                                  toast({
                                    title: "Profile Discovery updated",
                                    description: checked ? "Your profile will appear in search results" : "Your profile is now hidden from search results",
                                  });
                                }
                              } catch (error) {
                                console.error('Error saving profile discovery setting:', error);
                              }
                            }}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="activityStatus">Show Activity Status</Label>
                            <p className="text-sm text-muted-foreground">Let others see when you're online</p>
                          </div>
                          <Switch 
                            id="activityStatus" 
                            checked={activityStatusVisible}
                            onCheckedChange={async (checked) => {
                              setActivityStatusVisible(checked);
                              // Auto-save the setting
                              try {
                                const response = await fetch('/api/user/privacy-settings', {
                                  method: 'POST',
                                  headers: {
                                    'Content-Type': 'application/json',
                                  },
                                  body: JSON.stringify({
                                    activity_status_visible: checked,
                                  }),
                                });

                                if (response.ok) {
                                    // Invalidate the online status query to update the OnlineStatusIndicator component
                                    await queryClient.invalidateQueries({ queryKey: ['onlineStatus'] });
                                  toast({
                                    title: "Activity Status updated",
                                    description: checked ? "Others can see when you're online" : "Your online status is now hidden",
                                  });
                                }
                              } catch (error) {
                                console.error('Error saving activity status setting:', error);
                              }
                            }}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="dataDownload">Data Export</Label>
                            <p className="text-sm text-muted-foreground">Download a copy of your account data</p>
                          </div>
                          <Button variant="outline" size="sm">Request Export</Button>
                        </div>
                      </div>
                    </div>

                    {/* Delete Account */}
                    <div className="pt-4 border-t border-border/50">
                      <div className="p-4 rounded-lg border border-destructive/50 bg-destructive/5">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-destructive flex items-center gap-2">
                              <Trash2 className="w-4 h-4" />
                              Delete Account
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              Permanently delete your creator account and all data
                            </p>
                          </div>

                          <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive">
                                Delete Account
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                                  <Trash2 className="w-5 h-5" />
                                  Delete Creator Account
                                </AlertDialogTitle>
                                <AlertDialogDescription className="space-y-3">
                                  <p>
                                    This action cannot be undone. This will permanently delete your 
                                    creator account and remove all your data from our servers.
                                  </p>
                                  <p>
                                    This includes:
                                  </p>
                                  <ul className="list-disc list-inside text-sm space-y-1 ml-4">
                                    <li>Your creator profile and settings</li>
                                    <li>All published content and media</li>
                                    <li>Subscription tiers and subscriber data</li>
                                    <li>Earnings history and payout information</li>
                                    <li>Analytics and performance data</li>
                                    <li>Messages and fan communications</li>
                                  </ul>
                                  <div className="pt-4">
                                    <Label htmlFor="deleteConfirmation" className="text-sm font-medium">
                                      Please type <span className="font-bold text-destructive">DELETE</span> to confirm:
                                    </Label>
                                    <Input
                                      id="deleteConfirmation"
                                      value={deleteConfirmation}
                                      onChange={(e) => setDeleteConfirmation(e.target.value)}
                                      placeholder="Type DELETE here"
                                      className="mt-2"
                                    />
                                  </div>
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel onClick={() => {
                                  setDeleteConfirmation('');
                                  setIsDeleteDialogOpen(false);
                                }}>
                                  Cancel
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={handleDeleteAccount}
                                  disabled={deleteConfirmation !== 'DELETE'}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete Creator Account
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Email Change Dialog */}
      <AlertDialog open={isEmailChangeDialogOpen} onOpenChange={setIsEmailChangeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change Email Address</AlertDialogTitle>
            <AlertDialogDescription>
              Enter your new email address below. You may need to verify this email address.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newEmail">New Email Address</Label>
              <Input
                id="newEmail"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="Enter new email address"
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleEmailChange}>
              Update Email
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Password Change Dialog */}
      <AlertDialog open={isPasswordChangeDialogOpen} onOpenChange={setIsPasswordChangeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change Password</AlertDialogTitle>
            <AlertDialogDescription>
              Enter your current password and choose a new secure password.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                value={passwordFormData.currentPassword}
                onChange={(e) => setPasswordFormData(prev => ({ ...prev, currentPassword: e.target.value }))}
                placeholder="Enter current password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={passwordFormData.newPassword}
                onChange={(e) => setPasswordFormData(prev => ({ ...prev, newPassword: e.target.value }))}
                placeholder="Enter new password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
              <Input
                id="confirmNewPassword"
                type="password"
                value={passwordFormData.confirmPassword}
                onChange={(e) => setPasswordFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                placeholder="Confirm new password"
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setPasswordFormData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: '',
              });
              setIsPasswordChangeDialogOpen(false);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handlePasswordChange} disabled={isPasswordLoading}>
              {isPasswordLoading ? "Updating..." : "Update Password"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};