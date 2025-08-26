import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Settings, Shield, Mail, Users, Save, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export const AdminSettings: React.FC = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isModerationLoading, setIsModerationLoading] = useState(false);
  const [isEmailLoading, setIsEmailLoading] = useState(false);

  const [platformSettings, setPlatformSettings] = useState({
    siteName: 'Xclusive',
    siteDescription: 'Premium content monetization platform',
    commissionRate: 10,
    minimumAge: 18,
    maintenanceMode: false,
    newUserRegistration: true,
  });

  const [moderationSettings, setModerationSettings] = useState({
    autoModeration: true,
    requireApproval: false,
    bannedWords: 'spam, scam, fake',
    maxFileSize: 100,
    allowedFileTypes: 'jpg, png, gif, mp4, pdf',
  });

  const [emailSettings, setEmailSettings] = useState({
    smtpServer: 'smtp.gmail.com',
    smtpPort: 587,
    smtpUsername: 'noreply@xclusive.com',
    fromEmail: 'Xclusive <noreply@xclusive.com>',
  });

  const handleSave = () => {
    toast({
      title: "Settings saved",
      description: "Your settings have been updated successfully.",
    });
  };

  const handlePlatformUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/admin/platform-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          commission_rate: platformSettings.commissionRate / 100, // Convert percentage to decimal
          site_name: platformSettings.siteName,
          site_description: platformSettings.siteDescription,
          maintenance_mode: platformSettings.maintenanceMode,
          new_user_registration: platformSettings.newUserRegistration
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Settings Updated",
          description: "Platform settings have been saved successfully.",
        });
      } else {
        throw new Error(data.message || 'Failed to update settings');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update platform settings.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleModerationUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsModerationLoading(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast({
        title: "Moderation settings updated",
        description: "Content moderation settings have been successfully updated.",
      });
    } catch (error) {
      toast({
        title: "Update failed",
        description: "Failed to update moderation settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsModerationLoading(false);
    }
  };

  const handleEmailUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsEmailLoading(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast({
        title: "Email settings updated",
        description: "Email configuration has been successfully updated.",
      });
    } catch (error) {
      toast({
        title: "Update failed",
        description: "Failed to update email settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsEmailLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <Button variant="outline" size="sm" asChild className="mb-4 w-10 h-10 p-0 sm:w-auto sm:h-auto sm:p-2 sm:px-4">
                <Link to="/admin/dashboard">
                  <ArrowLeft className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Back to Dashboard</span>
                </Link>
              </Button>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Admin Settings</h1>
              <p className="text-muted-foreground text-sm sm:text-base">
                Manage platform-wide settings and configurations
              </p>
            </div>
            <Button onClick={handleSave} className="w-full sm:w-auto">
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          <Tabs defaultValue="platform" className="space-y-6">
            <TabsList>
              <TabsTrigger value="platform">Platform</TabsTrigger>
              <TabsTrigger value="moderation">Content</TabsTrigger>
              <TabsTrigger value="email">Email</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
            </TabsList>

            <TabsContent value="platform" className="space-y-6">
              <Card className="bg-gradient-card border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Platform Settings
                  </CardTitle>
                  <CardDescription>
                    Configure basic platform information and policies
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <form onSubmit={handlePlatformUpdate} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="siteName">Site Name</Label>
                        <Input
                          id="siteName"
                          value={platformSettings.siteName}
                          onChange={(e) => setPlatformSettings(prev => ({ ...prev, siteName: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="commissionRate">Commission Rate (%)</Label>
                        <Input
                          id="commissionRate"
                          type="number"
                          min="0"
                          max="50"
                          value={platformSettings.commissionRate}
                          onChange={(e) => setPlatformSettings(prev => ({ ...prev, commissionRate: parseInt(e.target.value) }))}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="siteDescription">Site Description</Label>
                      <Textarea
                        id="siteDescription"
                        value={platformSettings.siteDescription}
                        onChange={(e) => setPlatformSettings(prev => ({ ...prev, siteDescription: e.target.value }))}
                        rows={3}
                      />
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Maintenance Mode</Label>
                          <p className="text-sm text-muted-foreground">
                            Temporarily disable the platform for maintenance
                          </p>
                        </div>
                        <Switch
                          checked={platformSettings.maintenanceMode}
                          onCheckedChange={(checked) => 
                            setPlatformSettings(prev => ({ ...prev, maintenanceMode: checked }))
                          }
                        />
                      </div>

                      <Separator />

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>New User Registration</Label>
                          <p className="text-sm text-muted-foreground">
                            Allow new users to register accounts
                          </p>
                        </div>
                        <Switch
                          checked={platformSettings.newUserRegistration}
                          onCheckedChange={(checked) => 
                            setPlatformSettings(prev => ({ ...prev, newUserRegistration: checked }))
                          }
                        />
                      </div>
                    </div>

                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? "Updating..." : "Update Platform Settings"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="moderation" className="space-y-6">
              <Card className="bg-gradient-card border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Content Moderation
                  </CardTitle>
                  <CardDescription>
                    Configure content moderation and safety settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <form onSubmit={handleModerationUpdate} className="space-y-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Auto Moderation</Label>
                          <p className="text-sm text-muted-foreground">
                            Automatically flag potentially inappropriate content
                          </p>
                        </div>
                        <Switch
                          checked={moderationSettings.autoModeration}
                          onCheckedChange={(checked) => 
                            setModerationSettings(prev => ({ ...prev, autoModeration: checked }))
                          }
                        />
                      </div>

                      <Separator />

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Require Content Approval</Label>
                          <p className="text-sm text-muted-foreground">
                            All content must be approved before going live
                          </p>
                        </div>
                        <Switch
                          checked={moderationSettings.requireApproval}
                          onCheckedChange={(checked) => 
                            setModerationSettings(prev => ({ ...prev, requireApproval: checked }))
                          }
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="bannedWords">Banned Words (comma-separated)</Label>
                        <Textarea
                          id="bannedWords"
                          value={moderationSettings.bannedWords}
                          onChange={(e) => setModerationSettings(prev => ({ ...prev, bannedWords: e.target.value }))}
                          rows={3}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="maxFileSize">Max File Size (MB)</Label>
                          <Input
                            id="maxFileSize"
                            type="number"
                            min="1"
                            max="1000"
                            value={moderationSettings.maxFileSize}
                            onChange={(e) => setModerationSettings(prev => ({ ...prev, maxFileSize: parseInt(e.target.value) }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="allowedFileTypes">Allowed File Types</Label>
                          <Input
                            id="allowedFileTypes"
                            value={moderationSettings.allowedFileTypes}
                            onChange={(e) => setModerationSettings(prev => ({ ...prev, allowedFileTypes: e.target.value }))}
                          />
                        </div>
                      </div>
                    </div>

                    <Button type="submit" disabled={isModerationLoading}>
                      {isModerationLoading ? "Saving..." : "Save Moderation Settings"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="email" className="space-y-6">
              <Card className="bg-gradient-card border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="w-5 h-5" />
                    Email Configuration
                  </CardTitle>
                  <CardDescription>
                    Configure SMTP settings for platform emails
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleEmailUpdate} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="smtpServer">SMTP Server</Label>
                        <Input
                          id="smtpServer"
                          value={emailSettings.smtpServer}
                          onChange={(e) => setEmailSettings(prev => ({ ...prev, smtpServer: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="smtpPort">SMTP Port</Label>
                        <Input
                          id="smtpPort"
                          type="number"
                          value={emailSettings.smtpPort}
                          onChange={(e) => setEmailSettings(prev => ({ ...prev, smtpPort: parseInt(e.target.value) }))}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="smtpUsername">SMTP Username</Label>
                        <Input
                          id="smtpUsername"
                          value={emailSettings.smtpUsername}
                          onChange={(e) => setEmailSettings(prev => ({ ...prev, smtpUsername: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="fromEmail">From Email</Label>
                        <Input
                          id="fromEmail"
                          value={emailSettings.fromEmail}
                          onChange={(e) => setEmailSettings(prev => ({ ...prev, fromEmail: e.target.value }))}
                        />
                      </div>
                    </div>

                    <Button type="submit" disabled={isEmailLoading}>
                      {isEmailLoading ? "Saving..." : "Save Email Settings"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="users" className="space-y-6">
              <Card className="bg-gradient-card border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    User Management
                  </CardTitle>
                  <CardDescription>
                    Configure user-related settings and policies
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="minimumAge">Minimum Age</Label>
                      <Input
                        id="minimumAge"
                        type="number"
                        min="13"
                        max="21"
                        value={platformSettings.minimumAge}
                        onChange={(e) => setPlatformSettings(prev => ({ ...prev, minimumAge: parseInt(e.target.value) }))}
                      />
                      <p className="text-xs text-muted-foreground">
                        Minimum age required to create an account
                      </p>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <h4 className="font-medium text-foreground">User Statistics</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 rounded-lg bg-muted/20">
                          <p className="text-sm text-muted-foreground">Total Users</p>
                          <p className="text-2xl font-bold text-foreground">1,234</p>
                        </div>
                        <div className="p-4 rounded-lg bg-muted/20">
                          <p className="text-sm text-muted-foreground">Active Creators</p>
                          <p className="text-2xl font-bold text-foreground">456</p>
                        </div>
                        <div className="p-4 rounded-lg bg-muted/20">
                          <p className="text-sm text-muted-foreground">Verified Users</p>
                          <p className="text-2xl font-bold text-foreground">89</p>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <h4 className="font-medium text-foreground">User Actions</h4>
                      <div className="space-y-2">
                        <Button variant="outline" className="w-full">
                          Export User Data
                        </Button>
                        <Button variant="outline" className="w-full">
                          Send Platform Announcement
                        </Button>
                        <Button variant="outline" className="w-full">
                          Generate User Report
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};