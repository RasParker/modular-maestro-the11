import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  ArrowUp,
  ArrowDown,
  Check,
  Clock,
  Star,
  CreditCard,
  Calendar,
  History,
  AlertTriangle
} from "lucide-react";

interface TierOption {
  id: number;
  name: string;
  price: string;
  description: string;
  benefits: string[];
  proration_amount: number;
  is_upgrade: boolean;
  days_remaining: number;
}

interface PendingChange {
  id: number;
  change_type: string;
  scheduled_date: string;
  to_tier: {
    name: string;
    price: string;
  };
  proration_amount: string;
  status: string;
}

interface SubscriptionChange {
  id: number;
  change_type: string;
  effective_date: string;
  from_tier: {
    name: string;
    price: string;
  } | null;
  to_tier: {
    name: string;
    price: string;
  };
  proration_amount: string;
  billing_impact: string;
}

interface TierManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscription: {
    id: number;
    creator: {
      id: number;
      username: string;
      display_name: string;
      avatar: string;
    };
    tier: {
      id: number;
      name: string;
      price: string;
      description: string;
    };
    status: string;
    next_billing_date: string;
    available_tiers?: TierOption[];
    pending_changes?: PendingChange[];
    change_history?: SubscriptionChange[];
  };
  onSubscriptionUpdate: () => void;
}

export const TierManagementModal: React.FC<TierManagementModalProps> = ({
  isOpen,
  onClose,
  subscription,
  onSubscriptionUpdate
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [processingTierId, setProcessingTierId] = useState<number | null>(null);
  const [tierOptions, setTierOptions] = useState<TierOption[]>([]);
  const [pendingChanges, setPendingChanges] = useState<PendingChange[]>([]);
  const [changeHistory, setChangeHistory] = useState<SubscriptionChange[]>([]);

  // Validation after hooks
  if (!isOpen) {
    return null;
  }

  if (!subscription || 
      !subscription.creator || 
      !subscription.tier || 
      !subscription.creator.username ||
      !subscription.creator.display_name ||
      !subscription.tier.name ||
      !subscription.tier.price) {
    return null;
  }

  useEffect(() => {
    if (isOpen && subscription) {
      fetchTierData();
    }
  }, [isOpen, subscription]);

  const fetchTierData = async () => {
    if (!user?.id || !subscription?.id) return;

    try {
      setLoading(true);
      
      // Fetch enhanced subscription data with tier options
      const response = await fetch(`/api/subscriptions/user/${user.id}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data && Array.isArray(data.data)) {
          const enhancedSub = data.data.find((sub: any) => sub.id === subscription.id);
          
          if (enhancedSub) {
            setTierOptions(Array.isArray(enhancedSub.available_tiers) ? enhancedSub.available_tiers : []);
            setPendingChanges(Array.isArray(enhancedSub.pending_changes) ? enhancedSub.pending_changes : []);
            setChangeHistory(Array.isArray(enhancedSub.change_history) ? enhancedSub.change_history : []);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching tier data:', error);
      toast({
        title: "Error",
        description: "Failed to load tier management data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (tierId: number) => {
    setProcessingTierId(tierId);
    
    try {
      const response = await fetch(`/api/subscriptions/${subscription.id}/upgrade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tier_id: tierId })
      });

      const data = await response.json();

      if (data.success && data.requires_payment) {
        // Redirect to payment for the prorated difference
        const tier = tierOptions.find(t => t.id === tierId);
        toast({
          title: "Payment Required",
          description: `Upgrade requires payment of GHS ${data.data.proration_amount.toFixed(2)} for the remaining ${data.data.days_remaining} days.`
        });
        
        // Initialize payment for the proration amount
        initiateUpgradePayment(tierId, data.data.proration_amount);
      } else if (data.success) {
        // Free upgrade completed
        toast({
          title: "Tier Upgraded!",
          description: "Your subscription tier has been upgraded successfully.",
          variant: "default"
        });
        onSubscriptionUpdate();
        onClose();
      } else {
        throw new Error(data.message || 'Upgrade failed');
      }
    } catch (error: any) {
      toast({
        title: "Upgrade Failed",
        description: error.message || "Failed to upgrade subscription tier",
        variant: "destructive"
      });
    } finally {
      setProcessingTierId(null);
    }
  };

  const initiateUpgradePayment = async (tierId: number, prorationAmount: number) => {
    try {
      const response = await fetch('/api/payments/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fan_id: user?.id,
          tier_id: tierId,
          payment_method: 'card',
          subscription_type: 'tier_upgrade',
          existing_subscription_id: subscription.id,
          proration_amount: prorationAmount
        })
      });

      const data = await response.json();
      
      if (data.success && data.data.authorization_url) {
        // Redirect to payment gateway
        window.location.href = data.data.authorization_url;
      } else {
        throw new Error(data.message || 'Payment initialization failed');
      }
    } catch (error: any) {
      toast({
        title: "Payment Error",
        description: error.message || "Failed to initialize payment",
        variant: "destructive"
      });
    }
  };

  const handleDowngrade = async (tierId: number) => {
    setProcessingTierId(tierId);
    
    try {
      const response = await fetch(`/api/subscriptions/${subscription.id}/schedule-downgrade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tier_id: tierId })
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Downgrade Scheduled",
          description: `Your tier will be downgraded on ${new Date(data.data.scheduled_date).toLocaleDateString()}. You'll keep current access until then.`,
          variant: "default"
        });
        fetchTierData(); // Refresh to show pending change
      } else {
        throw new Error(data.message || 'Downgrade scheduling failed');
      }
    } catch (error: any) {
      toast({
        title: "Downgrade Failed", 
        description: error.message || "Failed to schedule downgrade",
        variant: "destructive"
      });
    } finally {
      setProcessingTierId(null);
    }
  };

  const cancelPendingChange = async (changeId: number) => {
    try {
      const response = await fetch(`/api/subscriptions/pending-changes/${changeId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast({
          title: "Change Cancelled",
          description: "Scheduled tier change has been cancelled",
          variant: "default"
        });
        fetchTierData(); // Refresh pending changes
      } else {
        throw new Error('Failed to cancel change');
      }
    } catch (error: any) {
      toast({
        title: "Cancellation Failed",
        description: error.message || "Failed to cancel scheduled change",
        variant: "destructive"
      });
    }
  };

  const upgradeOptions = tierOptions.filter(tier => tier.is_upgrade);
  const downgradeOptions = tierOptions.filter(tier => !tier.is_upgrade);

  // Show loading state while fetching data
  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-left">
            Manage Subscription - {subscription.creator.display_name || subscription.creator.username}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Tier Info */}
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-500 fill-current" />
                    <span className="font-semibold">Current Tier:</span>
                  </div>
                  <Badge variant="secondary" className="text-sm">
                    {subscription.tier.name}
                  </Badge>
                  <span className="text-lg font-bold">
                    GHS {subscription.tier.price}/month
                  </span>
                </div>
                <div className="text-right text-sm text-muted-foreground">
                  <div>Next billing: {subscription.next_billing_date ? new Date(subscription.next_billing_date).toLocaleDateString() : 'N/A'}</div>
                  <div className="text-xs">Status: {subscription.status || 'Unknown'}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pending Changes Alert */}
          {pendingChanges.length > 0 && (
            <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/20">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-orange-500 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-orange-800 dark:text-orange-200">
                      Pending Changes
                    </h4>
                    {pendingChanges.map((change) => (
                      <div key={change.id} className="mt-2 p-3 bg-white dark:bg-gray-800 rounded-md border">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-medium">
                              {change.change_type === 'downgrade' ? 'Downgrade' : 'Change'} to {change.to_tier.name}
                            </span>
                            <div className="text-sm text-muted-foreground">
                              Effective: {new Date(change.scheduled_date).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">
                              GHS {change.to_tier.price}/month
                            </Badge>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => cancelPendingChange(change.id)}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Tabs defaultValue="upgrade" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="upgrade" className="flex items-center gap-2">
                <ArrowUp className="h-4 w-4" />
                Upgrade ({upgradeOptions.length})
              </TabsTrigger>
              <TabsTrigger value="downgrade" className="flex items-center gap-2">
                <ArrowDown className="h-4 w-4" />
                Downgrade ({downgradeOptions.length})
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <History className="h-4 w-4" />
                History
              </TabsTrigger>
            </TabsList>

            {/* Upgrade Options */}
            <TabsContent value="upgrade" className="space-y-4">
              {upgradeOptions.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center">
                    <Star className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">
                      You're already on the highest tier! 🎉
                    </p>
                  </CardContent>
                </Card>
              ) : (
                upgradeOptions.map((tier) => (
                  <Card key={tier.id} className="border-green-200 hover:border-green-300 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <ArrowUp className="h-5 w-5 text-green-600" />
                            <h3 className="text-lg font-semibold">{tier.name}</h3>
                            <Badge className="bg-green-100 text-green-800 border-green-200">
                              GHS {tier.price}/month
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{tier.description}</p>
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1">
                              <CreditCard className="h-4 w-4" />
                              <span>
                                Pay now: GHS {tier.proration_amount.toFixed(2)} 
                                ({tier.days_remaining} days remaining)
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              <span>Immediate access</span>
                            </div>
                          </div>
                        </div>
                        <Button
                          onClick={() => handleUpgrade(tier.id)}
                          disabled={loading || processingTierId === tier.id}
                          className="bg-green-600 hover:bg-green-700 text-white"
                          data-testid={`button-upgrade-tier-${tier.id}`}
                        >
                          {processingTierId === tier.id ? "Processing..." : "Upgrade Now"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            {/* Downgrade Options */}
            <TabsContent value="downgrade" className="space-y-4">
              {downgradeOptions.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center">
                    <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">
                      No lower tiers available
                    </p>
                  </CardContent>
                </Card>
              ) : (
                downgradeOptions.map((tier) => (
                  <Card key={tier.id} className="border-orange-200 hover:border-orange-300 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <ArrowDown className="h-5 w-5 text-orange-600" />
                            <h3 className="text-lg font-semibold">{tier.name}</h3>
                            <Badge variant="outline" className="border-orange-200">
                              GHS {tier.price}/month
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{tier.description}</p>
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span>Takes effect next billing cycle</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <CreditCard className="h-4 w-4" />
                              <span>GHS {Math.abs(tier.proration_amount).toFixed(2)} credit applied</span>
                            </div>
                          </div>
                        </div>
                        <Button
                          onClick={() => handleDowngrade(tier.id)}
                          disabled={loading || processingTierId === tier.id}
                          variant="outline"
                          className="border-orange-300 text-orange-700 hover:bg-orange-50"
                          data-testid={`button-downgrade-tier-${tier.id}`}
                        >
                          {processingTierId === tier.id ? "Processing..." : "Schedule Downgrade"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history" className="space-y-4">
              {changeHistory.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center">
                    <History className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">No tier changes yet</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {changeHistory.map((change) => (
                    <Card key={change.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              {change.change_type === 'upgrade' ? (
                                <ArrowUp className="h-4 w-4 text-green-600" />
                              ) : (
                                <ArrowDown className="h-4 w-4 text-orange-600" />
                              )}
                              <span className="font-medium">
                                {change.from_tier ? `${change.from_tier.name} → ` : ''}
                                {change.to_tier.name}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {change.change_type}
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {new Date(change.effective_date).toLocaleDateString()}
                              {change.proration_amount !== "0.00" && (
                                <span className="ml-3">
                                  Amount: GHS {change.proration_amount}
                                </span>
                              )}
                            </div>
                          </div>
                          <Badge variant="secondary">
                            {change.billing_impact}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};