import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { X, Star, Users, Clock, Check } from 'lucide-react';

interface TierDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tier: {
    id: number;
    name: string;
    price: string;
    description: string;
    creator_id: number;
  };
  creatorName: string;
  onSubscribe: () => void;
}

export const TierDetailsModal: React.FC<TierDetailsModalProps> = ({ 
  isOpen, 
  onClose, 
  tier, 
  creatorName,
  onSubscribe 
}) => {
  const tierFeatures = [
    "Access to exclusive content",
    "Direct messaging privileges",
    "Priority support responses",
    "Monthly exclusive photos/videos",
    "Behind-the-scenes content",
    "Special subscriber-only posts"
  ];

  const handleSubscribe = () => {
    console.log('TierDetailsModal: handleSubscribe called');
    onSubscribe();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-xl border border-slate-700/50">
        <DialogHeader className="text-center space-y-3">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-primary mx-auto">
            <Star className="h-6 w-6 text-white" />
          </div>
          <DialogTitle className="text-xl font-semibold text-gradient-primary">
            Subscribe to {creatorName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Tier Header */}
          <div className="text-center space-y-3">
            <div className="space-y-2">
              <div className="flex justify-center">
                <Badge className="text-xs bg-gradient-primary border-0 text-white">
                  <Star className="h-3 w-3 mr-1" />
                  Popular
                </Badge>
              </div>
              <h2 className="text-2xl font-bold uppercase text-slate-100">{tier.name}</h2>
            </div>
            <div className="text-3xl font-bold text-gradient-primary">
              GHS {tier.price}
              <span className="text-base font-normal text-slate-400 ml-1">per month</span>
            </div>
            <p className="text-slate-400 max-w-sm mx-auto">
              {tier.description || 'Get access to exclusive content and support your favorite creator.'}
            </p>
          </div>

          <Separator />

          {/* Features */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Check className="h-5 w-5 text-green-500" />
              What's included:
            </h3>
            <div className="space-y-3">
              {tierFeatures.map((feature, index) => (
                <div key={index} className="flex items-start gap-3">
                  <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="space-y-1">
              <div className="flex items-center justify-center gap-1">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-2xl font-bold">156</span>
              </div>
              <p className="text-xs text-muted-foreground">Subscribers</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-center gap-1">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-2xl font-bold">24/7</span>
              </div>
              <p className="text-xs text-muted-foreground">Access</p>
            </div>
          </div>

          <Separator />

          {/* Subscription Terms */}
          <div className="space-y-3 text-sm text-muted-foreground bg-muted/30 p-4 rounded-lg">
            <h4 className="font-medium text-foreground">Subscription Terms:</h4>
            <ul className="space-y-1 text-xs">
              <li>• Recurring monthly billing</li>
              <li>• Cancel anytime from your account settings</li>
              <li>• Access continues until the end of your billing period</li>
              <li>• Secure payment processing via Paystack</li>
            </ul>
          </div>

          {/* Subscribe Button */}
          <Button 
            onClick={handleSubscribe}
            className="w-full bg-gradient-primary hover:opacity-90 text-white py-6 text-lg font-semibold shadow-lg shadow-blue-500/25 transition-all duration-200 hover:shadow-blue-500/30 hover:scale-[1.02]"
            size="lg"
          >
            Subscribe for GHS {tier.price}/month
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};