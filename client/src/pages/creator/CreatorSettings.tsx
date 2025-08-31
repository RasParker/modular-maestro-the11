import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { EdgeToEdgeContainer } from '@/components/layout/EdgeToEdgeContainer';
import { User, Save, Upload, Palette, Dumbbell, Music, Laptop, ChefHat, Shirt, Gamepad2, Briefcase, Home, GraduationCap, Plus, X, AlertTriangle, CheckCircle, Star } from 'lucide-react';
import type { Category } from '@shared/schema';

// Icon mapping for categories
const categoryIcons: { [key: string]: any } = {
  'Palette': Palette,
  'Dumbbell': Dumbbell,
  'Music': Music,
  'Laptop': Laptop,
  'ChefHat': ChefHat,
  'Shirt': Shirt,
  'Gamepad2': Gamepad2,
  'Briefcase': Briefcase,
  'Home': Home,
  'GraduationCap': GraduationCap,
};

export const CreatorSettings: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  // Profile state
  const [displayName, setDisplayName] = useState(user?.display_name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatar, setAvatar] = useState<File | null>(null);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || '');
  const [coverPreview, setCoverPreview] = useState(user?.cover_image || '');

  // Content settings state
  const [commentsEnabled, setCommentsEnabled] = useState(user?.comments_enabled ?? true);
  const [autoPostEnabled, setAutoPostEnabled] = useState(user?.auto_post_enabled ?? false);
  const [watermarkEnabled, setWatermarkEnabled] = useState(user?.watermark_enabled ?? true);
  const [profileDiscoverable, setProfileDiscoverable] = useState(user?.profile_discoverable ?? true);
  const [activityStatusVisible, setActivityStatusVisible] = useState(user?.activity_status_visible ?? false);

  // Category management state
  const [categories, setCategories] = useState<Category[]>([]);
  const [creatorCategories, setCreatorCategories] = useState<number[]>([]);
  const [primaryCategory, setPrimaryCategory] = useState<number | null>(user?.primary_category_id || null);
  const [customCategory, setCustomCategory] = useState('');
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [migrationInProgress, setMigrationInProgress] = useState(false);

  useEffect(() => {
    fetchCategories();
    fetchCreatorCategories();
  }, []);

  const fetchCategories = async () => {
    setLoadingCategories(true);
    try {
      const response = await fetch('/api/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoadingCategories(false);
    }
  };

  const fetchCreatorCategories = async () => {
    if (!user?.id) return;

    try {
      const response = await fetch(`/api/creators/${user.id}/categories`);
      if (response.ok) {
        const data = await response.json();
        setCreatorCategories(data.map((cat: any) => cat.category_id));
      }
    } catch (error) {
      console.error('Error fetching creator categories:', error);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'cover') => {
    const file = event.target.files?.[0];
    if (file) {
      if (type === 'avatar') {
        setAvatar(file);
        setAvatarPreview(URL.createObjectURL(file));
      } else {
        setCoverImage(file);
        setCoverPreview(URL.createObjectURL(file));
      }
    }
  };

  const handleCategoryToggle = (categoryId: number) => {
    setCreatorCategories(prev => {
      const isSelected = prev.includes(categoryId);
      const newSelection = isSelected 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId];

      // If removing the primary category, reset it
      if (isSelected && primaryCategory === categoryId) {
        setPrimaryCategory(null);
      }

      // Auto-set as primary if it's the first selection
      if (!isSelected && newSelection.length === 1) {
        setPrimaryCategory(categoryId);
      }

      return newSelection;
    });
  };

  const handleAddCustomCategory = async () => {
    if (!customCategory.trim()) return;

    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: customCategory,
          slug: customCategory.toLowerCase().replace(/\s+/g, '-'),
          description: `Custom category: ${customCategory}`,
          icon: 'User',
          color: '#6366f1',
          is_active: true
        })
      });

      if (response.ok) {
        const newCategory = await response.json();
        setCategories(prev => [...prev, newCategory]);
        setCreatorCategories(prev => [...prev, newCategory.id]);
        setCustomCategory('');
        toast({
          title: "Category added",
          description: "Your custom category has been created successfully.",
        });
      }
    } catch (error) {
      console.error('Error adding custom category:', error);
      toast({
        title: "Error",
        description: "Failed to add custom category.",
        variant: "destructive",
      });
    }
  };

  const handleMigratePrimaryCategory = async (newPrimaryId: number) => {
    setMigrationInProgress(true);

    try {
      const response = await fetch(`/api/creators/${user?.id}/primary-category`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ categoryId: newPrimaryId })
      });

      if (response.ok) {
        setPrimaryCategory(newPrimaryId);

        // Update user context
        if (user) {
          updateUser({
            ...user,
            primary_category_id: newPrimaryId
          });
        }

        toast({
          title: "Primary category updated",
          description: "Your primary category has been successfully migrated.",
          icon: <CheckCircle className="w-4 h-4" />,
        });
      }
    } catch (error) {
      console.error('Error migrating primary category:', error);
      toast({
        title: "Migration failed",
        description: "Failed to update primary category.",
        variant: "destructive",
      });
    } finally {
      setMigrationInProgress(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('display_name', displayName);
      formData.append('bio', bio);

      if (avatar) {
        formData.append('avatar', avatar);
      }

      if (coverImage) {
        formData.append('cover_image', coverImage);
      }

      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        body: formData,
      });

      if (response.ok) {
        const updatedUser = await response.json();
        updateUser(updatedUser);
        toast({
          title: "Profile updated",
          description: "Your profile has been updated successfully.",
        });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveCategories = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      // First, clear existing categories
      await fetch(`/api/creators/${user.id}/categories`, {
        method: 'DELETE',
      });

      // Add selected categories
      const categoryPromises = creatorCategories.map(categoryId => 
        fetch(`/api/creators/${user.id}/categories`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            category_id: categoryId,
            is_primary: categoryId === primaryCategory
          })
        })
      );

      await Promise.all(categoryPromises);

      // Update primary category
      if (primaryCategory) {
        await fetch(`/api/creators/${user.id}/primary-category`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ categoryId: primaryCategory })
        });
      }

      toast({
        title: "Categories updated",
        description: "Your categories have been updated successfully.",
      });
    } catch (error) {
      console.error('Error updating categories:', error);
      toast({
        title: "Error",
        description: "Failed to update categories.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveContentSettings = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          comments_enabled: commentsEnabled,
          auto_post_enabled: autoPostEnabled,
          watermark_enabled: watermarkEnabled,
          profile_discoverable: profileDiscoverable,
          activity_status_visible: activityStatusVisible,
        }),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        updateUser(updatedUser);
        toast({
          title: "Settings updated",
          description: "Your content settings have been updated successfully.",
        });
      }
    } catch (error) {
      console.error('Error updating content settings:', error);
      toast({
        title: "Error",
        description: "Failed to update content settings.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <EdgeToEdgeContainer maxWidth="4xl" enablePadding className="py-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Creator Settings</h1>
          <p className="text-muted-foreground">Manage your profile, categories, and content preferences</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Profile Information
                </CardTitle>
                <CardDescription>
                  Update your public profile information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Avatar Upload */}
                <div className="space-y-2">
                  <Label>Profile Picture</Label>
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-full overflow-hidden bg-muted">
                      {avatarPreview ? (
                        <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <User className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, 'avatar')}
                        className="hidden"
                        id="avatar-upload"
                      />
                      <Label htmlFor="avatar-upload">
                        <Button variant="outline" size="sm" asChild>
                          <span className="cursor-pointer">
                            <Upload className="w-4 h-4 mr-2" />
                            Upload Photo
                          </span>
                        </Button>
                      </Label>
                    </div>
                  </div>
                </div>

                {/* Cover Image Upload */}
                <div className="space-y-2">
                  <Label>Cover Image</Label>
                  <div className="space-y-4">
                    <div className="w-full h-32 rounded-lg overflow-hidden bg-muted">
                      {coverPreview ? (
                        <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Upload className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, 'cover')}
                        className="hidden"
                        id="cover-upload"
                      />
                      <Label htmlFor="cover-upload">
                        <Button variant="outline" size="sm" asChild>
                          <span className="cursor-pointer">
                            <Upload className="w-4 h-4 mr-2" />
                            Upload Cover
                          </span>
                        </Button>
                      </Label>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="display-name">Display Name</Label>
                    <Input
                      id="display-name"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Your display name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Tell your fans about yourself..."
                      rows={4}
                    />
                  </div>
                </div>

                <Button onClick={handleSaveProfile} disabled={isLoading} className="w-full">
                  <Save className="w-4 h-4 mr-2" />
                  {isLoading ? 'Saving...' : 'Save Profile'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="categories" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Category Management</CardTitle>
                <CardDescription>
                  Manage your content categories to help fans discover your content
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Current Primary Category Migration */}
                {primaryCategory && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Star className="w-4 h-4 text-blue-600" />
                      <span className="font-medium text-blue-900 dark:text-blue-100">
                        Current Primary Category
                      </span>
                    </div>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      {categories.find(cat => cat.id === primaryCategory)?.name}
                    </p>
                  </div>
                )}

                {/* Category Selection */}
                {loadingCategories ? (
                  <div className="grid grid-cols-1 gap-3">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="h-16 bg-muted/50 rounded-lg animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-3">
                      {categories.map((category) => {
                        const IconComponent = categoryIcons[category.icon] || User;
                        const isSelected = creatorCategories.includes(category.id);
                        const isPrimary = primaryCategory === category.id;

                        return (
                          <div
                            key={category.id}
                            className={`
                              relative p-4 rounded-lg border-2 transition-all duration-200
                              ${isSelected 
                                ? 'border-primary bg-primary/10' 
                                : 'border-border hover:border-border/80 hover:bg-muted/50'
                              }
                            `}
                          >
                            <div className="flex items-center space-x-3">
                              <button
                                type="button"
                                onClick={() => handleCategoryToggle(category.id)}
                                className="flex items-center space-x-3 flex-1 text-left"
                              >
                                <IconComponent 
                                  className="w-5 h-5" 
                                  style={{ color: category.color }}
                                />
                                <div>
                                  <div className="font-medium">{category.name}</div>
                                  {category.description && (
                                    <div className="text-sm text-muted-foreground">
                                      {category.description}
                                    </div>
                                  )}
                                </div>
                              </button>

                              {isSelected && !isPrimary && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="outline" size="sm" disabled={migrationInProgress}>
                                      <Star className="w-4 h-4 mr-1" />
                                      Set Primary
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle className="flex items-center gap-2">
                                        <AlertTriangle className="w-5 h-5 text-amber-500" />
                                        Migrate Primary Category
                                      </AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Changing your primary category will update how your profile appears in search results 
                                        and category filters. This action will take effect immediately.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction 
                                        onClick={() => handleMigratePrimaryCategory(category.id)}
                                        disabled={migrationInProgress}
                                      >
                                        {migrationInProgress ? 'Migrating...' : 'Confirm Migration'}
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              )}

                              {isPrimary && (
                                <Badge variant="secondary" className="text-xs">
                                  Primary
                                </Badge>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Custom Category Creation */}
                    <div className="p-4 rounded-lg border-2 border-dashed border-border">
                      <div className="space-y-3">
                        <Label className="font-medium">Add Custom Category</Label>
                        <div className="flex gap-2">
                          <Input
                            placeholder="Enter custom category name"
                            value={customCategory}
                            onChange={(e) => setCustomCategory(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddCustomCategory()}
                          />
                          <Button 
                            onClick={handleAddCustomCategory}
                            variant="outline"
                            disabled={!customCategory.trim()}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <Button onClick={handleSaveCategories} disabled={isLoading} className="w-full">
                  <Save className="w-4 h-4 mr-2" />
                  {isLoading ? 'Saving...' : 'Save Categories'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="content" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Content Preferences</CardTitle>
                <CardDescription>
                  Configure how your content is displayed and managed
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Enable Comments</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow fans to comment on your posts
                      </p>
                    </div>
                    <Switch
                      checked={commentsEnabled}
                      onCheckedChange={setCommentsEnabled}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Profile Discoverable</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow your profile to appear in search results
                      </p>
                    </div>
                    <Switch
                      checked={profileDiscoverable}
                      onCheckedChange={setProfileDiscoverable}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Show Activity Status</Label>
                      <p className="text-sm text-muted-foreground">
                        Let fans see when you're online
                      </p>
                    </div>
                    <Switch
                      checked={activityStatusVisible}
                      onCheckedChange={setActivityStatusVisible}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Enable Watermarks</Label>
                      <p className="text-sm text-muted-foreground">
                        Add watermarks to your images automatically
                      </p>
                    </div>
                    <Switch
                      checked={watermarkEnabled}
                      onCheckedChange={setWatermarkEnabled}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Auto-Post to Social Media</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically share posts to connected social accounts
                      </p>
                    </div>
                    <Switch
                      checked={autoPostEnabled}
                      onCheckedChange={setAutoPostEnabled}
                    />
                  </div>
                </div>

                <Button onClick={handleSaveContentSettings} disabled={isLoading} className="w-full">
                  <Save className="w-4 h-4 mr-2" />
                  {isLoading ? 'Saving...' : 'Save Content Settings'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </EdgeToEdgeContainer>
  );
};