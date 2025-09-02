import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Pause, Play, X, ChevronDown, ChevronUp, ArrowUpDown, Clock, Star } from 'lucide-react';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { TierManagementModal } from "@/components/subscription/TierManagementModal";

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

interface Subscription {
  id: number;
  creator: {
    id: number;
    username: string;
    display_name: string;
    avatar: string;
    category: string;
  };
  tier: {
    id: number;
    name: string;
    price: string;
    description: string;
  };
  status: 'active' | 'paused' | 'cancelled' | 'expired';
  next_billing_date: string;
  created_at: string;
  auto_renew: boolean;
  pending_changes?: PendingChange[];
  available_tiers?: any[];
  change_history?: any[];
}

interface SubscriptionCardProps {
  subscription: Subscription;
  onPauseResume: (id: number) => void;
  onCancel: (id: number) => void;
  onToggleAutoRenew?: (id: number, autoRenew: boolean) => void;
  onSubscriptionUpdate?: () => void;
}

export const SubscriptionCard: React.FC<SubscriptionCardProps> = ({
  subscription,
  onPauseResume,
  onCancel,
  onToggleAutoRenew,
  onSubscriptionUpdate
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showTierManagement, setShowTierManagement] = useState(false);

  return (
    <Card className="bg-gradient-card border-border/50">
      <CardContent className="p-0">
        {/* Desktop View - Always expanded */}
        <div className="hidden sm:block p-6">
          <div className="flex flex-row items-start justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0 flex-1">
              <Avatar className="h-16 w-16 flex-shrink-0">
                <AvatarImage src={subscription.creator.avatar} alt={subscription.creator.username} />
                <AvatarFallback>{subscription.creator.display_name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-semibold text-foreground truncate">
                  {subscription.creator.display_name}
                </h3>
                <p className="text-sm text-muted-foreground truncate">
                  @{subscription.creator.username}
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <Badge variant="outline" className="text-xs">{subscription.creator.category}</Badge>
                  <Badge variant="outline" className="text-xs">{subscription.tier.name}</Badge>
                  <Badge variant={subscription.status === 'active' ? 'success' : subscription.status === 'paused' ? 'destructive' : 'secondary'} className="text-xs">
                    {subscription.status}
                  </Badge>
                  {subscription.pending_changes && subscription.pending_changes.length > 0 && (
                    <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                      <Clock className="h-3 w-3 mr-1" />
                      Pending change
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col text-right gap-2">
              <p className="text-lg font-bold text-foreground">
                GHS {subscription.tier.price}/month
              </p>
              <p className="text-sm text-muted-foreground">
                Next: {new Date(subscription.next_billing_date).toLocaleDateString()}
              </p>
              <p className="text-xs text-muted-foreground">
                Joined: {new Date(subscription.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex flex-row items-center justify-between gap-3 mt-4 pt-4 border-t border-border/50">
            <div className="flex items-center gap-2">
              <Label htmlFor={`auto-renew-${subscription.id}`} className="text-sm text-muted-foreground">
                Auto-renew
              </Label>
              <Switch
                id={`auto-renew-${subscription.id}`}
                checked={subscription.auto_renew}
                onCheckedChange={(checked) => onToggleAutoRenew?.(subscription.id, checked)}
                disabled={subscription.status !== 'active'}
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (subscription && subscription.creator && subscription.tier) {
                    setShowTierManagement(true);
                  } else {
                    console.error('Incomplete subscription data:', subscription);
                  }
                }}
                data-testid={`button-manage-tier-${subscription.id}`}
              >
                <ArrowUpDown className="w-4 h-4 mr-1" />
                Manage Tier
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPauseResume(subscription.id)}
              >
                {subscription.status === 'active' ? (
                  <>
                    <Pause className="w-4 h-4 mr-1" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-1" />
                    Resume
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onCancel(subscription.id)}
              >
                <X className="w-4 h-4 mr-1" />
                Cancel
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile View - Collapsible */}
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded} className="sm:hidden">
          <CollapsibleTrigger asChild>
            <div className="p-4 cursor-pointer hover:bg-accent/5 transition-colors">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 flex-shrink-0">
                  <AvatarImage src={subscription.creator.avatar} alt={subscription.creator.username} />
                  <AvatarFallback>{subscription.creator.display_name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-base font-semibold text-foreground truncate">
                      {subscription.creator.display_name}
                    </h3>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Badge variant={subscription.status === 'active' ? 'default' : 'destructive'} className="text-xs">
                        {subscription.status}
                      </Badge>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-1">
                    <p className="text-sm text-muted-foreground truncate">
                      @{subscription.creator.username}
                    </p>
                    <p className="text-sm font-semibold text-foreground flex-shrink-0">
                      GHS {subscription.tier.price}/mo
                    </p>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-xs">{subscription.tier.name}</Badge>
                    <Badge variant="outline" className="text-xs">{subscription.creator.category}</Badge>
                    {subscription.pending_changes && subscription.pending_changes.length > 0 && (
                      <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                        <Clock className="h-3 w-3 mr-1" />
                        Pending
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <div className="px-4 pb-4 space-y-4">
              {/* Billing Info */}
              <div className="bg-muted/30 rounded-lg p-3 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Next billing</span>
                  <span className="text-sm font-medium">{new Date(subscription.next_billing_date).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Joined</span>
                  <span className="text-sm font-medium">{new Date(subscription.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor={`auto-renew-${subscription.id}`} className="text-xs sm:text-sm text-muted-foreground">
                    Auto-renew
                  </Label>
                  <Switch
                    id={`auto-renew-${subscription.id}`}
                    checked={subscription.auto_renew}
                    onCheckedChange={(checked) => onToggleAutoRenew?.(subscription.id, checked)}
                    disabled={subscription.status !== 'active'}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowTierManagement(true);
                  }}
                  data-testid={`button-manage-tier-mobile-${subscription.id}`}
                >
                  <ArrowUpDown className="w-4 h-4 mr-1" />
                  Manage Tier
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onPauseResume(subscription.id);
                    }}
                    className="flex-1"
                  >
                    {subscription.status === 'active' ? (
                      <>
                        <Pause className="w-4 h-4 mr-1" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-1" />
                        Resume
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCancel(subscription.id);
                    }}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>

      {/* Tier Management Modal */}
      <TierManagementModal
        isOpen={showTierManagement}
        onClose={() => setShowTierManagement(false)}
        subscription={subscription}
        onSubscriptionUpdate={() => {
          onSubscriptionUpdate?.();
          setShowTierManagement(false);
        }}
      />
    </Card>
  );
};