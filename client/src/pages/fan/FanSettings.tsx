import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ArrowLeft, Save, Shield, User, Bell, CreditCard, Settings, Eye, Trash2, Camera } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { getOnlineStatusQueryKey } from '@/components/OnlineStatusIndicator';

export const FanSettings: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [isPreferencesLoading, setIsPreferencesLoading] = useState(false);

  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    pushNotifications: false,
    contentUpdates: true,
    promotionalEmails: false,
  });

  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: 'public',
    showInSearch: true,
    allowDirectMessages: 'subscribed',
    showActivity: false,
  });

  const [subscriptionSettings, setSubscriptionSettings] = useState({
    autoRenew: true,
    monthlySpendingLimit: 500,
    renewalReminders: true,
    paymentFailureNotifications: true,
  });

  const [securitySettings, setSecuritySettings] = useState({
    twoFactorEnabled: false,
    loginNotifications: true,
    suspiciousActivityAlerts: true,
  });

  const [contentSettings, setContentSettings] = useState({
    adultContent: false,
    contentFiltering: 'moderate',
    autoplayVideos: true,
    showPreviews: true,
  });

  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEmailChangeDialogOpen, setIsEmailChangeDialogOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [activeTab, setActiveTab] = useState('profile');

  // Load current user settings when component mounts
  useEffect(() => {
    const loadUserSettings = async () => {
      try {
        const response = await fetch('/api/user/settings');
        if (response.ok) {
          const settings = await response.json();
          setPrivacySettings(prev => ({
            ...prev,
            showInSearch: settings.profile_discoverable,
            showActivity: settings.activity_status_visible,
          }));
        }

        // Load notification preferences if available
        try {
          const notificationResponse = await fetch('/api/user/notification-preferences');
          if (notificationResponse.ok) {
            const notificationSettings = await notificationResponse.json();
            setPreferences(prev => ({
              ...prev,
              emailNotifications: notificationSettings.email_notifications ?? true,
              pushNotifications: notificationSettings.push_notifications ?? false,
            }));
          }
        } catch (notificationError) {
          console.log('Notification preferences not available:', notificationError);
        }
      } catch (error) {
        console.error('Error loading user settings:', error);
      }
    };

    if (user?.id) {
      loadUserSettings();
    }
  }, [user?.id]);

  const handleSavePrivacySettings = async (settings: Partial<typeof privacySettings>) => {
    try {
      const response = await fetch('/api/user/privacy-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          profile_discoverable: settings.showInSearch,
          activity_status_visible: settings.showActivity,
        }),
      });

      if (response.ok) {
        // Invalidate the online status query for the current user to update the OnlineStatusIndicator component
        if (user?.id) {
          await queryClient.invalidateQueries({ 
            queryKey: getOnlineStatusQueryKey(Number(user.id)) 
          });
        }

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
    toast({
      title: "Settings saved",
      description: "Your settings have been updated successfully.",
    });
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProfileLoading(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      updateUser({ 
        username: formData.username,
        email: formData.email 
      });

      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
    } catch (error) {
      toast({
        title: "Update failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProfileLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.newPassword !== formData.confirmPassword) {
      toast({
        title: "Password mismatch",
        description: "New passwords do not match.",
        variant: "destructive",
      });
      return;
    }

    if (formData.newPassword.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    setIsPasswordLoading(true);
    try {
      const response = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to change password');
      }

      toast({
        title: "Password changed",
        description: "Your password has been successfully updated.",
      });

      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }));
    } catch (error) {
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Failed to update password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsPasswordLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation === 'DELETE') {
      try {
        // Call the backend API to delete the account
        const response = await fetch(`/api/users/${user?.id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to delete account');
        }

        toast({
          title: "Account deleted",
          description: "Your account has been permanently deleted.",
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

      updateUser({ email: newEmail });
      setFormData(prev => ({ ...prev, email: newEmail }));

      toast({
        title: "Email updated",
        description: "Your email address has been successfully updated.",
      });

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

  const handleProfilePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        console.log('Uploading profile photo:', file.name);

        // Validate file size (5MB limit)
        if (file.size > 5 * 1024 * 1024) {
          toast({
            title: "File too large",
            description: "Please select an image smaller than 5MB.",
            variant: "destructive",
          });
          return;
        }

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
        console.log('Upload successful:', result);

        // Update user avatar in context
        updateUser({ avatar: result.url });

        toast({
          title: "Photo updated",
          description: "Your profile photo has been successfully updated.",
        });
      } catch (error) {
        console.error('Upload error:', error);
        toast({
          title: "Upload failed",
          description: "Failed to upload photo. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Button variant="outline" size="sm" asChild className="mb-4 w-10 h-10 p-0 sm:w-auto sm:h-auto sm:p-2 sm:px-4">
            <Link to="/fan/dashboard">
              <ArrowLeft className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Back to Dashboard</span>
            </Link>
          </Button>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Fan Settings</h1>
              <p className="text-muted-foreground text-sm sm:text-base">
                Manage your account preferences and subscription settings
              </p>
            </div>
            <Button onClick={handleSave} className="w-full sm:w-auto">
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="space-y-6">
            {/* Tab Navigation */}
            <TabsList className="mb-6">
              <TabsTrigger value="profile">
                Profile
              </TabsTrigger>
              <TabsTrigger value="notifications">
                Alerts
              </TabsTrigger>
              <TabsTrigger value="subscriptions">
                Subs
              </TabsTrigger>
              <TabsTrigger value="privacy">
                Privacy
              </TabsTrigger>
              <TabsTrigger value="security">
                Security
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-6">
              <Card className="bg-gradient-card border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Profile Information
                  </CardTitle>
                  <CardDescription>
                    Update your personal information and profile details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <div className="space-y-3">
                      <Label>Profile Photo</Label>
                      <div className="flex items-start gap-4">
                        <div className="relative">
                          <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-background bg-background">
                            {user?.avatar ? (
                              <img 
                                src={user.avatar} 
                                alt="Profile photo" 
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-primary flex items-center justify-center">
                                <span className="text-xl font-bold text-primary-foreground">
                                  {user?.username?.charAt(0).toUpperCase() || 'U'}
                                </span>
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
                              {user?.avatar ? (
                                <Camera className="w-3 h-3 text-primary-foreground" />
                              ) : (
                                <span className="text-primary-foreground text-sm font-bold">+</span>
                              )}
                            </label>
                          </div>
                        </div>

                        {/* Instructions */}
                        <div className="flex-1">
                          <p className="text-xs text-muted-foreground">
                            Square image recommended. Max file size: 5MB
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <form onSubmit={handleProfileUpdate} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="username">Username</Label>
                        <Input
                          id="username"
                          value={formData.username}
                          onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        />
                      </div>
                    </div>

                    <Button type="submit" disabled={isProfileLoading}>
                      {isProfileLoading ? "Updating..." : "Update Profile"}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card className="bg-gradient-card border-border/50">
                <CardHeader>
                  <CardTitle>Content Preferences</CardTitle>
                  <CardDescription>
                    Customize your content viewing experience
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Content Filtering</Label>
                      <select 
                        className="w-full p-2 border rounded-md bg-background"
                        value={contentSettings.contentFiltering}
                        onChange={(e) => setContentSettings(prev => ({ ...prev, contentFiltering: e.target.value }))}
                      >
                        <option value="none">No filtering</option>
                        <option value="moderate">Moderate filtering</option>
                        <option value="strict">Strict filtering</option>
                      </select>
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Adult Content</Label>
                        <p className="text-sm text-muted-foreground">
                          Allow mature content in your feed
                        </p>
                      </div>
                      <Switch
                        checked={contentSettings.adultContent}
                        onCheckedChange={(checked) => 
                          setContentSettings(prev => ({ ...prev, adultContent: checked }))
                        }
                      />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Autoplay Videos</Label>
                        <p className="text-sm text-muted-foreground">
                          Automatically play videos in your feed
                        </p>
                      </div>
                      <Switch
                        checked={contentSettings.autoplayVideos}
                        onCheckedChange={(checked) => 
                          setContentSettings(prev => ({ ...prev, autoplayVideos: checked }))
                        }
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications" className="space-y-6">
              <Card className="bg-gradient-card border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="w-5 h-5" />
                    Notification Preferences
                  </CardTitle>
                  <CardDescription>
                    Manage how you receive notifications and updates
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Email Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive notifications via email
                        </p>
                      </div>
                      <Switch
                        checked={preferences.emailNotifications}
                        onCheckedChange={async (checked) => {
                          setPreferences(prev => ({ ...prev, emailNotifications: checked }));

                          try {
                            const response = await fetch('/api/user/notification-preferences', {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                              },
                              body: JSON.stringify({
                                email_notifications: checked,
                              }),
                            });

                            if (response.ok) {
                              toast({
                                title: "Email notifications updated",
                                description: checked ? "Email notifications enabled" : "Email notifications disabled",
                              });
                            } else {
                              throw new Error('Failed to save email notification preference');
                            }
                          } catch (error) {
                            console.error('Error saving email notification preference:', error);
                            toast({
                              title: "Error",
                              description: "Failed to save notification preference. Please try again.",
                              variant: "destructive",
                            });
                          }
                        }}
                      />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Push Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive push notifications in your browser
                        </p>
                      </div>
                      <Switch
                        checked={preferences.pushNotifications}
                        onCheckedChange={async (checked) => {
                          setPreferences(prev => ({ ...prev, pushNotifications: checked }));

                          try {
                            const response = await fetch('/api/user/notification-preferences', {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                              },
                              body: JSON.stringify({
                                push_notifications: checked,
                              }),
                            });

                            if (response.ok) {
                              toast({
                                title: "Push notifications updated",
                                description: checked ? "Push notifications enabled" : "Push notifications disabled",
                              });
                            } else {
                              throw new Error('Failed to save push notification preference');
                            }
                          } catch (error) {
                            console.error('Error saving push notification preference:', error);
                            toast({
                              title: "Error",
                              description: "Failed to save notification preference. Please try again.",
                              variant: "destructive",
                            });
                          }
                        }}
                      />
                    </div>

                    {preferences.pushNotifications && (
                      <>
                        <Separator />

                        <div className="space-y-2">
                          <Label>Test Push Notifications</Label>
                          <p className="text-sm text-muted-foreground">
                            Send a test notification to verify everything is working
                          </p>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={async () => {
                              try {
                                const response = await fetch('/api/test-push-notification', {
                                  method: 'POST',
                                  headers: {
                                    'Content-Type': 'application/json',
                                  },
                                  body: JSON.stringify({
                                    title: 'Test Notification',
                                    message: 'This is a test push notification from your Fan Settings!'
                                  }),
                                });

                                if (response.ok) {
                                  // Show a browser notification as a test
                                  if (Notification.permission === 'granted') {
                                    new Notification('Test Notification', {
                                      body: 'This is a test push notification from your Fan Settings!',
                                      icon: '/favicon.ico'
                                    });
                                  }

                                  toast({
                                    title: "Test notification sent",
                                    description: "Check your browser for the test notification.",
                                  });
                                } else {
                                  throw new Error('Failed to send test notification');
                                }
                              } catch (error) {
                                toast({
                                  title: "Test failed",
                                  description: "Failed to send test notification.",
                                  variant: "destructive",
                                });
                              }
                            }}
                          >
                            Send Test Notification
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="subscriptions" className="space-y-6">
              <Card className="bg-gradient-card border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Subscription Preferences
                  </CardTitle>
                  <CardDescription>
                    Manage your subscription and payment settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Auto-Renewal</Label>
                        <p className="text-sm text-muted-foreground">
                          Automatically renew subscriptions when they expire
                        </p>
                      </div>
                      <Switch
                        checked={subscriptionSettings.autoRenew}
                        onCheckedChange={(checked) => 
                          setSubscriptionSettings(prev => ({ ...prev, autoRenew: checked }))
                        }
                      />
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <Label htmlFor="spendingLimit">Monthly Spending Limit (GHS)</Label>
                      <Input
                        id="spendingLimit"
                        type="number"
                        value={subscriptionSettings.monthlySpendingLimit}
                        onChange={(e) => setSubscriptionSettings(prev => ({ 
                          ...prev, 
                          monthlySpendingLimit: parseInt(e.target.value) || 0 
                        }))}
                      />
                      <p className="text-xs text-muted-foreground">
                        Set to 0 for no limit
                      </p>
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Renewal Reminders</Label>
                        <p className="text-sm text-muted-foreground">
                          Get notified before subscriptions renew
                        </p>
                      </div>
                      <Switch
                        checked={subscriptionSettings.renewalReminders}
                        onCheckedChange={(checked) => 
                          setSubscriptionSettings(prev => ({ ...prev, renewalReminders: checked }))
                        }
                      />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Payment Failure Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Get alerted when payments fail
                        </p>
                      </div>
                      <Switch
                        checked={subscriptionSettings.paymentFailureNotifications}
                        onCheckedChange={(checked) => 
                          setSubscriptionSettings(prev => ({ ...prev, paymentFailureNotifications: checked }))
                        }
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-card border-border/50">
                <CardHeader>
                  <CardTitle>Active Subscriptions</CardTitle>
                  <CardDescription>
                    Manage your current subscriptions
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/10">
                      <div>
                        <p className="text-sm font-medium text-foreground">CreatorName</p>
                        <p className="text-xs text-muted-foreground">Premium Tier • GHS 9.99/month</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="success" className="text-xs">Active</Badge>
                        <Button variant="outline" size="sm">Manage</Button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/10">
                      <div>
                        <p className="text-sm font-medium text-foreground">AnotherCreator</p>
                        <p className="text-xs text-muted-foreground">Basic Tier • GHS 4.99/month</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="success" className="text-xs">Active</Badge>
                        <Button variant="outline" size="sm">Manage</Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="privacy" className="space-y-6">
              <Card className="bg-gradient-card border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="w-5 h-5" />
                    Privacy & Visibility
                  </CardTitle>
                  <CardDescription>
                    Control who can see your profile and activity
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Profile Visibility</Label>
                      <select 
                        className="w-full p-2 border rounded-md bg-background"
                        value={privacySettings.profileVisibility}
                        onChange={async (e) => {
                          const newValue = e.target.value;
                          setPrivacySettings(prev => ({ ...prev, profileVisibility: newValue }));

                          try {
                            const response = await fetch('/api/user/privacy-settings', {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                              },
                              body: JSON.stringify({
                                profile_visibility: newValue,
                              }),
                            });

                            if (response.ok) {
                              toast({
                                title: "Profile visibility updated",
                                description: `Profile is now ${newValue}`,
                              });
                            } else {
                              throw new Error('Failed to save profile visibility');
                            }
                          } catch (error) {
                            console.error('Error saving profile visibility:', error);
                            toast({
                              title: "Error",
                              description: "Failed to save profile visibility. Please try again.",
                              variant: "destructive",
                            });
                          }
                        }}
                      >
                        <option value="public">Public - Anyone can view</option>
                        <option value="subscribers">Subscribers Only</option>
                        <option value="private">Private - Hidden</option>
                      </select>
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Show in Search Results</Label>
                        <p className="text-sm text-muted-foreground">
                          Allow others to find your profile in search
                        </p>
                      </div>
                      <Switch
                        checked={privacySettings.showInSearch}
                        onCheckedChange={async (checked) => {
                          const newSettings = { ...privacySettings, showInSearch: checked };
                          setPrivacySettings(newSettings);
                          await handleSavePrivacySettings(newSettings);
                        }}
                      />
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <Label>Who can message you</Label>
                      <select 
                        className="w-full p-2 border rounded-md bg-background"
                        value={privacySettings.allowDirectMessages}
                        onChange={async (e) => {
                          const newValue = e.target.value;
                          setPrivacySettings(prev => ({ ...prev, allowDirectMessages: newValue }));

                          try {
                            const response = await fetch('/api/user/privacy-settings', {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                              },
                              body: JSON.stringify({
                                allow_direct_messages: newValue,
                              }),
                            });

                            if (response.ok) {
                              toast({
                                title: "Message settings updated",
                                description: `Direct messages now allowed from: ${newValue === 'everyone' ? 'everyone' : newValue === 'subscribed' ? 'creators you\'re subscribed to' : 'no one'}`,
                              });
                            } else {
                              throw new Error('Failed to save message settings');
                            }
                          } catch (error) {
                            console.error('Error saving message settings:', error);
                            toast({
                              title: "Error",
                              description: "Failed to save message settings. Please try again.",
                              variant: "destructive",
                            });
                          }
                        }}
                      >
                        <option value="everyone">Everyone</option>
                        <option value="subscribed">Creators I'm subscribed to</option>
                        <option value="none">No one</option>
                      </select>
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Show Activity Status</Label>
                        <p className="text-sm text-muted-foreground">
                          Let others see when you're online
                        </p>
                      </div>
                      <Switch
                        checked={privacySettings.showActivity}
                        onCheckedChange={async (checked) => {
                          const newSettings = { ...privacySettings, showActivity: checked };
                          setPrivacySettings(newSettings);
                          await handleSavePrivacySettings(newSettings);
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-card border-border/50">
                <CardHeader>
                  <CardTitle>Data & Account Management</CardTitle>
                  <CardDescription>
                    Manage your account data and preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <h4 className="font-medium">Download Your Data</h4>
                      <p className="text-sm text-muted-foreground">
                        Download a copy of your account data and activity
                      </p>
                      <Button variant="outline" className="w-full">
                        Request Data Download
                      </Button>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <h4 className="font-medium">Blocked Creators</h4>
                      <p className="text-sm text-muted-foreground">
                        Manage creators you've blocked
                      </p>
                      <Button variant="outline" className="w-full">
                        Manage Blocked List
                      </Button>
                    </div>
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
                      <span className="text-sm">{user?.email}</span>
                      <Button variant="outline" size="sm" onClick={() => setIsEmailChangeDialogOpen(true)}>
                        Change Email
                      </Button>
                    </div>
                  </div>

                  {/* Change Password */}
                  <div className="space-y-4 pt-4 border-t border-border/50">
                    <h4 className="font-medium text-foreground">Change Password</h4>
                    <form onSubmit={handlePasswordChange} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="currentPassword">Current Password</Label>
                        <Input
                          id="currentPassword"
                          type="password"
                          value={formData.currentPassword}
                          onChange={(e) => setFormData(prev => ({ ...prev, currentPassword: e.target.value }))}
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="newPassword">New Password</Label>
                          <Input
                            id="newPassword"
                            type="password"
                            value={formData.newPassword}
                            onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="confirmPassword">Confirm New Password</Label>
                          <Input
                            id="confirmPassword"
                            type="password"
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          />
                        </div>
                      </div>

                      <Button type="submit" disabled={isPasswordLoading}>
                        {isPasswordLoading ? "Updating..." : "Change Password"}
                      </Button>
                    </form>
                  </div>

                  {/* Two-Factor Authentication */}
                  <div className="space-y-4 pt-4 border-t border-border/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-foreground">Two-Factor Authentication</h4>
                        <p className="text-sm text-muted-foreground">
                          Add an extra layer of security to your account
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={securitySettings.twoFactorEnabled}
                          onCheckedChange={(checked) => 
                            setSecuritySettings(prev => ({ ...prev, twoFactorEnabled: checked }))
                          }
                        />
                        {!securitySettings.twoFactorEnabled && (
                          <Button variant="outline" size="sm">
                            Setup 2FA
                          </Button>
                        )}
                      </div>
                    </div>
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
                    <div className="space-y-2">
                      <Button variant="outline" className="w-full">
                        View Full Login History
                      </Button>
                      <Button variant="outline" className="w-full">
                        Revoke All Sessions
                      </Button>
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
                            Permanently delete your account and all data
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
                                Delete Account
                              </AlertDialogTitle>
                              <AlertDialogDescription className="space-y-3">
                                <p>
                                  This action cannot be undone. This will permanently delete your 
                                  account and remove all your data from our servers.
                                </p>
                                <p>
                                  This includes:
                                </p>
                                <ul className="list-disc list-inside text-sm space-y-1 ml-4">
                                  <li>Your profile and settings</li>
                                  <li>All subscription history</li>
                                  <li>Payment methods and billing information</li>
                                  <li>Messages and conversations</li>
                                  <li>All account activity and preferences</li>
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
                                Delete Account
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
          </div>
        </Tabs>
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
    </div>
  );
};