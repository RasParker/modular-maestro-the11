import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Pause, Play, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface Subscription {
  id: string;
  creator: {
    username: string;
    display_name: string;
    avatar: string;
    category: string;
  };
  tier: string;
  price: number;
  status: 'active' | 'paused';
  next_billing: string;
  joined: string;
  auto_renew: boolean;
}

interface SubscriptionCardProps {
  subscription: Subscription;
  onPauseResume: (id: string) => void;
  onCancel: (id: string) => void;
  onToggleAutoRenew?: (id: string, autoRenew: boolean) => void;
}

export const SubscriptionCard: React.FC<SubscriptionCardProps> = ({
  subscription,
  onPauseResume,
  onCancel,
  onToggleAutoRenew
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

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
                  <Badge variant="outline" className="text-xs">{subscription.tier}</Badge>
                  <Badge variant={subscription.status === 'active' ? 'success' : subscription.status === 'paused' ? 'destructive' : 'secondary'} className="text-xs">
                    {subscription.status}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="flex flex-col text-right gap-2">
              <p className="text-lg font-bold text-foreground">
                GHS {subscription.price}/month
              </p>
              <p className="text-sm text-muted-foreground">
                Next: {subscription.next_billing}
              </p>
              <p className="text-xs text-muted-foreground">
                Joined: {new Date(subscription.joined).toLocaleDateString()}
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
                className="text-destructive hover:text-destructive"
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
                      GHS {subscription.price}/mo
                    </p>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-xs">{subscription.tier}</Badge>
                    <Badge variant="outline" className="text-xs">{subscription.creator.category}</Badge>
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
                  <span className="text-sm font-medium">{subscription.next_billing}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Joined</span>
                  <span className="text-sm font-medium">{new Date(subscription.joined).toLocaleDateString()}</span>
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
                  className="text-destructive hover:text-destructive flex-1"
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
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
};