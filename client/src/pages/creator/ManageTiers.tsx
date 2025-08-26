import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

import { ArrowLeft, Plus, Edit, Trash2, DollarSign, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface SubscriptionTier {
  id: number;
  creator_id: number;
  name: string;
  price: number;
  description: string;
  benefits: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const ManageTiers: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tiers, setTiers] = useState<SubscriptionTier[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingTier, setEditingTier] = useState<SubscriptionTier | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    description: '',
    benefits: ['']
  });
  const [isLoading, setIsLoading] = useState(false);

  // Load tiers from API on component mount
  useEffect(() => {
    const fetchTiers = async () => {
      if (!user?.id) return;

      try {
        const response = await fetch(`/api/creators/${user.id}/tiers`);
        if (response.ok) {
          const tiersData = await response.json();
          setTiers(tiersData);
        } else {
          console.error('Failed to fetch tiers');
          setTiers([]);
        }
      } catch (error) {
        console.error('Error fetching tiers:', error);
        setTiers([]);
      }
    };

    fetchTiers();
  }, [user?.id]);

  const handleCreateTier = () => {
    setIsCreating(true);
    setFormData({ name: '', price: '', description: '', benefits: [''] });
  };

  const handleEditTier = (tier: SubscriptionTier) => {
    setEditingTier(tier);
    setFormData({
      name: tier.name,
      price: tier.price.toString(),
      description: tier.description,
      benefits: tier.benefits
    });
  };

  const handleSaveTier = async () => {
    if (!formData.name || !formData.price || !formData.description || !user?.id) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const tierData = {
        name: formData.name,
        price: parseFloat(formData.price),
        description: formData.description,
        benefits: formData.benefits.filter(f => f.trim() !== '')
      };

      let response;
      if (editingTier) {
        // Update existing tier
        response = await fetch(`/api/tiers/${editingTier.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(tierData),
        });
      } else {
        // Create new tier
        response = await fetch(`/api/creators/${user.id}/tiers`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(tierData),
        });
      }

      if (response.ok) {
        const savedTier = await response.json();

        if (editingTier) {
          setTiers(prev => prev.map(t => t.id === editingTier.id ? savedTier : t));
          toast({
            title: "Tier updated",
            description: "Subscription tier has been updated successfully.",
          });
        } else {
          setTiers(prev => [...prev, savedTier]);
          toast({
            title: "Tier created",
            description: "New subscription tier has been created successfully.",
          });
        }
      } else {
        throw new Error('Failed to save tier');
      }
    } catch (error) {
      console.error('Error saving tier:', error);
      toast({
        title: "Error",
        description: "Failed to save subscription tier. Please try again.",
        variant: "destructive",
      });
    }

    setIsCreating(false);
    setEditingTier(null);
    setFormData({ name: '', price: '', description: '', benefits: [''] });
    setIsLoading(false);
  };

  const handleDeleteTier = async (id: number) => {
    try {
      const response = await fetch(`/api/tiers/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setTiers(prev => prev.filter(t => t.id !== id));
        toast({
          title: "Tier deleted",
          description: "Subscription tier has been deleted successfully.",
        });
      } else {
        throw new Error('Failed to delete tier');
      }
    } catch (error) {
      console.error('Error deleting tier:', error);
      toast({
        title: "Error",
        description: "Failed to delete subscription tier. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleBenefitChange = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      benefits: prev.benefits.map((f, i) => i === index ? value : f)
    }));
  };

  const addBenefit = () => {
    setFormData(prev => ({
      ...prev,
      benefits: [...prev.benefits, '']
    }));
  };

  const removeBenefit = (index: number) => {
    setFormData(prev => ({
      ...prev,
      benefits: prev.benefits.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="min-h-screen bg-background">

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Button variant="outline" size="sm" asChild className="mb-4 w-10 h-10 p-0 sm:w-auto sm:h-auto sm:p-2 sm:px-4">
            <Link to="/creator/dashboard">
              <ArrowLeft className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Back to Dashboard</span>
            </Link>
          </Button>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2 flex items-center gap-2">
                <DollarSign className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
                <span className="break-words">Manage Subscription Tiers</span>
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base">
                Create and manage your subscription tiers and pricing
              </p>
            </div>
            <Button onClick={handleCreateTier} className="w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              Create New Tier
            </Button>
          </div>
        </div>

        <div className="grid gap-6">
          {/* Create/Edit Form */}
          {(isCreating || editingTier) && (
            <Card className="bg-gradient-card border-border/50">
              <CardHeader>
                <CardTitle>{editingTier ? 'Edit Tier' : 'Create New Tier'}</CardTitle>
                <CardDescription>
                  Set up your subscription tier details and benefits
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Tier Name</Label>
                    <Input
                      id="name"
                      placeholder="e.g., Premium Supporter"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price">Monthly Price (GHS)</Label>
                    <Input
                      id="price"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="9.99"
                      value={formData.price}
                      onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe what this tier includes..."
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                  />
                </div>

                <div className="space-y-4">
                  <Label>Benefits & Features</Label>
                  {formData.benefits.map((benefit, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        placeholder="Enter a benefit..."
                        value={benefit}
                        onChange={(e) => handleBenefitChange(index, e.target.value)}
                      />
                      {formData.benefits.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeBenefit(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button type="button" variant="outline" onClick={addBenefit}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Benefit
                  </Button>
                </div>

                <div className="flex gap-4">
                  <Button onClick={handleSaveTier} disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-background border-t-foreground" />
                        {editingTier ? 'Updating...' : 'Creating...'}
                      </>
                    ) : (
                      editingTier ? 'Update Tier' : 'Create Tier'
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setIsCreating(false);
                      setEditingTier(null);
                      setFormData({ name: '', price: '', description: '', benefits: [''] });
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Existing Tiers */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tiers.map((tier) => (
              <Card key={tier.id} className="bg-gradient-card border-border/50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{tier.name}</CardTitle>
                    <Badge variant="outline">GHS {tier.price}/mo</Badge>
                  </div>
                  <CardDescription>{tier.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2">
                    {(() => {
                      let benefits = tier.benefits || [];

                      // Handle case where benefits might be a JSON string
                      if (typeof benefits === 'string') {
                        try {
                          benefits = JSON.parse(benefits);
                        } catch (e) {
                          console.warn('Failed to parse benefits JSON:', e);
                          benefits = [];
                        }
                      }

                      // Ensure benefits is an array - handle null, undefined, or other non-array types
                      if (!benefits || !Array.isArray(benefits)) {
                        benefits = [];
                      }

                      // If no benefits, show a default message
                      if (benefits.length === 0) {
                        return (
                          <li className="flex items-center gap-2 text-sm">
                            <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                            <span>No benefits specified</span>
                          </li>
                        );
                      }

                      return benefits.map((benefit, index) => (
                        <li key={index} className="text-sm flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                          {benefit}
                        </li>
                      ));
                    })()}
                  </ul>

                  <div className="flex gap-2 pt-4">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleEditTier(tier)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDeleteTier(tier.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Stats Card */}
          <Card className="bg-gradient-card border-border/50">
            <CardHeader>
              <CardTitle>Tier Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{tiers.length}</div>
                  <div className="text-sm text-muted-foreground">Active Tiers</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    GHS {tiers.length > 0 ? Math.min(...tiers.map(t => t.price)) : 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Lowest Price</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    GHS {tiers.length > 0 ? Math.max(...tiers.map(t => t.price)) : 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Highest Price</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};