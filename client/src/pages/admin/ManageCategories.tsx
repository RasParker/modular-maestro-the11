
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EdgeToEdgeContainer } from '@/components/layout/EdgeToEdgeContainer';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Plus, Edit, Trash2, Eye, EyeOff, Users, TrendingUp, Palette, Dumbbell, Music, Laptop, ChefHat, Shirt, Gamepad2, Briefcase, Home, GraduationCap, User, Save, AlertTriangle } from 'lucide-react';
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
  'User': User,
};

const iconOptions = [
  { value: 'Palette', label: 'Art', icon: Palette },
  { value: 'Dumbbell', label: 'Fitness', icon: Dumbbell },
  { value: 'Music', label: 'Music', icon: Music },
  { value: 'Laptop', label: 'Tech', icon: Laptop },
  { value: 'ChefHat', label: 'Cooking', icon: ChefHat },
  { value: 'Shirt', label: 'Fashion', icon: Shirt },
  { value: 'Gamepad2', label: 'Gaming', icon: Gamepad2 },
  { value: 'Briefcase', label: 'Business', icon: Briefcase },
  { value: 'Home', label: 'Lifestyle', icon: Home },
  { value: 'GraduationCap', label: 'Education', icon: GraduationCap },
  { value: 'User', label: 'Other', icon: User },
];

const colorOptions = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4',
  '#ef4444', '#f97316', '#84cc16', '#6366f1', '#8b5cf6', '#ec4899'
];

export const ManageCategories: React.FC = () => {
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryStats, setCategoryStats] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deleteConfirmCategory, setDeleteConfirmCategory] = useState<Category | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: 'User',
    color: '#6366f1',
    is_active: true
  });

  useEffect(() => {
    loadCategories();
    loadCategoryStats();
  }, []);

  const loadCategories = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/categories?include_inactive=true');
      if (response.ok) {
        const data = await response.json();
        setCategories(Array.isArray(data) ? data : []);
      } else {
        console.error('Failed to load categories:', response.status);
        setCategories([]);
        toast({
          title: "Error",
          description: "Failed to load categories.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      setCategories([]);
      toast({
        title: "Error",
        description: "Failed to load categories.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadCategoryStats = async () => {
    try {
      const response = await fetch('/api/admin/category-stats');
      if (response.ok) {
        const stats = await response.json();
        setCategoryStats(stats || {});
      } else {
        console.error('Failed to load category stats:', response.status);
        setCategoryStats({});
      }
    } catch (error) {
      console.error('Error loading category stats:', error);
      setCategoryStats({});
    }
  };

  const handleCreateCategory = async () => {
    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          slug: formData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
        })
      });

      if (response.ok) {
        toast({
          title: "Category created",
          description: `${formData.name} has been created successfully.`,
        });
        
        setFormData({
          name: '',
          description: '',
          icon: 'User',
          color: '#6366f1',
          is_active: true
        });
        setIsCreateDialogOpen(false);
        loadCategories();
        loadCategoryStats();
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create category');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create category.",
        variant: "destructive"
      });
    }
  };

  const handleEditCategory = async () => {
    if (!editingCategory) return;

    try {
      const response = await fetch(`/api/categories/${editingCategory.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          slug: formData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
        })
      });

      if (response.ok) {
        toast({
          title: "Category updated",
          description: `${formData.name} has been updated successfully.`,
        });
        
        setIsEditDialogOpen(false);
        setEditingCategory(null);
        loadCategories();
        loadCategoryStats();
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update category');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update category.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteCategory = async (category: Category) => {
    try {
      const response = await fetch(`/api/categories/${category.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast({
          title: "Category deleted",
          description: `${category.name} has been deleted successfully.`,
        });
        
        setDeleteConfirmCategory(null);
        loadCategories();
        loadCategoryStats();
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete category');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete category.",
        variant: "destructive"
      });
    }
  };

  const handleToggleCategory = async (category: Category) => {
    try {
      const response = await fetch(`/api/categories/${category.id}/toggle`, {
        method: 'PUT'
      });

      if (response.ok) {
        toast({
          title: `Category ${category.is_active ? 'deactivated' : 'activated'}`,
          description: `${category.name} is now ${category.is_active ? 'inactive' : 'active'}.`,
        });
        loadCategories();
      }
    } catch (error) {
      console.error('Toggle category error:', error);
      toast({
        title: "Error",
        description: "Failed to toggle category status.",
        variant: "destructive"
      });
    }
  };

  const openEditDialog = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      icon: category.icon,
      color: category.color,
      is_active: category.is_active
    });
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      icon: 'User',
      color: '#6366f1',
      is_active: true
    });
  };

  return (
    <EdgeToEdgeContainer>
      <div className="bg-gradient-to-r from-primary/10 via-accent/5 to-primary/10 border-b border-border">
        <EdgeToEdgeContainer maxWidth="7xl" enablePadding enableTopPadding>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/admin/dashboard">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Dashboard
                  </Link>
                </Button>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
                Manage Categories
              </h1>
              <p className="text-muted-foreground">
                Create, edit, and manage content categories for creators
              </p>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Category
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New Category</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Category Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter category name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe this category..."
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Icon</Label>
                      <Select value={formData.icon} onValueChange={(value) => setFormData(prev => ({ ...prev, icon: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {iconOptions.map((option) => {
                            const IconComponent = option.icon;
                            return (
                              <SelectItem key={option.value} value={option.value}>
                                <div className="flex items-center space-x-2">
                                  <IconComponent className="w-4 h-4" />
                                  <span>{option.label}</span>
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Color</Label>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {colorOptions.map((color) => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, color }))}
                            className={`w-6 h-6 rounded-full border-2 transition-all ${
                              formData.color === color ? 'border-foreground scale-110' : 'border-border'
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                    />
                    <Label htmlFor="is_active">Active</Label>
                  </div>
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateCategory} disabled={!formData.name.trim()}>
                    Create Category
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </EdgeToEdgeContainer>
      </div>

      <EdgeToEdgeContainer maxWidth="7xl" enablePadding className="py-6 sm:py-8">
        {/* Category Statistics */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-card border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Categories</p>
                  <p className="text-2xl font-bold text-foreground">{categories.length}</p>
                </div>
                <Palette className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Categories</p>
                  <p className="text-2xl font-bold text-foreground">
                    {categories.filter(c => c.is_active).length}
                  </p>
                </div>
                <Eye className="h-8 w-8 text-success" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Creators</p>
                  <p className="text-2xl font-bold text-foreground">
                    {(() => {
                      const counts = categoryStats.creatorCounts || {};
                      return Object.values(counts).reduce((a: number, b: any) => Number(a) + Number(b || 0), 0);
                    })()}
                  </p>
                </div>
                <Users className="h-8 w-8 text-accent" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Most Popular</p>
                  <p className="text-lg font-bold text-foreground">
                    {(() => {
                      const counts = categoryStats.creatorCounts || {};
                      const entries = Object.entries(counts);
                      if (entries.length === 0) return 'N/A';
                      const sorted = entries.sort(([,a], [,b]) => Number(b) - Number(a));
                      return sorted[0]?.[0] || 'N/A';
                    })()}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-warning" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Categories List */}
        <Card className="bg-gradient-card border-border/50">
          <CardHeader>
            <CardTitle>All Categories</CardTitle>
            <CardDescription>
              Manage content categories for creators on the platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-20 bg-muted/50 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {categories.map((category) => {
                  const IconComponent = categoryIcons[category.icon] || User;
                  const creatorCount = Number(categoryStats.creatorCounts?.[category.name] || 0);
                  const canDelete = creatorCount === 0;
                  
                  return (
                    <div
                      key={category.id}
                      className={`
                        p-4 rounded-lg border transition-all duration-200
                        ${category.is_active 
                          ? 'border-border bg-background' 
                          : 'border-border/50 bg-muted/20 opacity-75'
                        }
                      `}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div 
                            className="p-2 rounded-lg"
                            style={{ backgroundColor: `${category.color}20` }}
                          >
                            <IconComponent 
                              className="w-6 h-6" 
                              style={{ color: category.color }}
                            />
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <h3 className="font-semibold text-foreground">{category.name}</h3>
                              <Badge 
                                variant={category.is_active ? "default" : "secondary"}
                                className="text-xs"
                              >
                                {category.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {category.description || 'No description provided'}
                            </p>
                            <div className="flex items-center space-x-4 mt-2">
                              <span className="text-xs text-muted-foreground">
                                {creatorCount} creator{creatorCount !== 1 ? 's' : ''}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                Created {new Date(category.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleCategory(category)}
                            className="text-xs"
                          >
                            {category.is_active ? (
                              <>
                                <EyeOff className="w-4 h-4 mr-1" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <Eye className="w-4 h-4 mr-1" />
                                Activate
                              </>
                            )}
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(category)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={!canDelete}
                                className="text-destructive hover:text-destructive disabled:opacity-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                                  <Trash2 className="w-5 h-5" />
                                  Delete Category
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{category.name}"? 
                                  {!canDelete && (
                                    <div className="mt-2 p-2 bg-warning/10 rounded text-warning text-sm">
                                      <AlertTriangle className="w-4 h-4 inline mr-1" />
                                      This category cannot be deleted because {creatorCount} creator{creatorCount !== 1 ? 's are' : ' is'} using it.
                                    </div>
                                  )}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                {canDelete && (
                                  <AlertDialogAction
                                    onClick={() => handleDeleteCategory(category)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Delete Category
                                  </AlertDialogAction>
                                )}
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Category Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Category</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="editName">Category Name</Label>
                <Input
                  id="editName"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter category name"
                />
              </div>
              <div>
                <Label htmlFor="editDescription">Description</Label>
                <Textarea
                  id="editDescription"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe this category..."
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Icon</Label>
                  <Select value={formData.icon} onValueChange={(value) => setFormData(prev => ({ ...prev, icon: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {iconOptions.map((option) => {
                        const IconComponent = option.icon;
                        return (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center space-x-2">
                              <IconComponent className="w-4 h-4" />
                              <span>{option.label}</span>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Color</Label>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {colorOptions.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, color }))}
                        className={`w-6 h-6 rounded-full border-2 transition-all ${
                          formData.color === color ? 'border-foreground scale-110' : 'border-border'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="editActive"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
                <Label htmlFor="editActive">Active</Label>
              </div>
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditCategory} disabled={!formData.name.trim()}>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </EdgeToEdgeContainer>
    </EdgeToEdgeContainer>
  );
};
