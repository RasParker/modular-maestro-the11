import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { CreditCard, Smartphone, Loader2, Lock, Shield } from 'lucide-react';

interface PaymentModalProps {
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
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, tier, creatorName }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'mobile_money'>('card');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [mobileProvider, setMobileProvider] = useState<'mtn' | 'vod' | 'tgo' | 'airtel'>('mtn');
  const [isLoading, setIsLoading] = useState(false);
  const [paystackConfig, setPaystackConfig] = useState<{ public_key: string; currency: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchPaystackConfig();
    }
  }, [isOpen]);

  const fetchPaystackConfig = async () => {
    try {
      const response = await fetch('/api/payments/config');
      const data = await response.json();
      if (data.success) {
        setPaystackConfig(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch payment config:', error);
    }
  };

  const handleCardPayment = async () => {
    if (!user || !tier) return;

    console.log('Initializing card payment for:', { 
      fan_id: user.id, 
      tier_id: tier.id, 
      tier_name: tier.name,
      payment_method: 'card' 
    });

    setIsLoading(true);

    try {
      // Store current location for return navigation
      sessionStorage.setItem('lastCreatorProfile', window.location.pathname);

      // Initialize payment
      const response = await fetch('/api/payments/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fan_id: user.id,
          tier_id: tier.id,
          payment_method: 'card'
        })
      });

      const data = await response.json();
      console.log('Payment initialization response:', data);

      if (data.success) {
        console.log('Payment authorization URL:', data.data.authorization_url);
        
        // Check if this is a relative URL (development mode) or external URL (production)
        if (data.data.authorization_url.startsWith('/')) {
          // Development mode - use React Router navigation
          console.log('Development mode: navigating to callback');
          onClose(); // Close the modal first
          navigate(data.data.authorization_url);
        } else {
          // Production mode - redirect to external Paystack URL
          console.log('Production mode: redirecting to Paystack');
          window.location.href = data.data.authorization_url;
        }
      } else {
        throw new Error(data.message || 'Payment initialization failed');
      }
    } catch (error: any) {
      console.error('Payment initialization error:', error);
      toast({
        title: "Payment Error",
        description: error.message || "Failed to initialize payment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMobileMoneyPayment = async () => {
    if (!user || !phoneNumber || !mobileProvider) {
      console.error('Missing mobile money payment data:', { 
        user: !!user, 
        phoneNumber: !!phoneNumber, 
        mobileProvider: !!mobileProvider 
      });
      return;
    }

    console.log('Initializing mobile money payment for:', { 
      fan_id: user.id, 
      tier_id: tier.id,
      tier_name: tier.name,
      phone: phoneNumber,
      provider: mobileProvider
    });

    setIsLoading(true);

    try {
       // Store current location for return navigation
       sessionStorage.setItem('lastCreatorProfile', window.location.pathname);
      // Initialize mobile money payment
      const response = await fetch('/api/payments/mobile-money/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fan_id: user.id,
          tier_id: tier.id,
          phone: phoneNumber,
          provider: mobileProvider
        })
      });

      const data = await response.json();
      console.log('Mobile money payment initialization response:', data);

      if (data.success) {
        toast({
          title: "Mobile Money Payment",
          description: "Please check your phone and approve the payment request.",
        });

        // You might want to implement payment status polling here
        // For now, we'll close the modal and show instructions
        onClose();
      } else {
        throw new Error(data.message || 'Mobile money payment initialization failed');
      }
    } catch (error: any) {
      console.error('Mobile money payment error:', error);
      toast({
        title: "Payment Error",
        description: error.message || "Failed to initialize mobile money payment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayment = () => {
    if (paymentMethod === 'card') {
      handleCardPayment();
    } else {
      handleMobileMoneyPayment();
    }
  };

  const isValidPhoneNumber = (phone: string) => {
    // Basic Ghana phone number validation
    const phoneRegex = /^(0|\+233)[2-9]\d{8}$/;
    return phoneRegex.test(phone);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <DialogTitle className="flex items-center justify-center gap-2">
            <Lock className="h-5 w-5" />
            Subscribe to {creatorName}
          </DialogTitle>
          <DialogDescription className="text-center">
            You're subscribing to the {tier.name} tier
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Tier Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{tier.name}</CardTitle>
              <CardDescription>{tier.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Monthly Price</span>
                <span className="text-2xl font-bold">GHS {tier.price}</span>
              </div>
            </CardContent>
          </Card>

          {/* Payment Method Selection */}
          <div className="space-y-4">
            <Label>Payment Method</Label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant={paymentMethod === 'card' ? 'default' : 'outline'}
                onClick={() => setPaymentMethod('card')}
                className="h-16 flex flex-col items-center gap-2"
              >
                <CreditCard className="h-6 w-6" />
                <span className="text-sm">Card</span>
              </Button>
              <Button
                variant={paymentMethod === 'mobile_money' ? 'default' : 'outline'}
                onClick={() => setPaymentMethod('mobile_money')}
                className="h-16 flex flex-col items-center gap-2"
              >
                <Smartphone className="h-6 w-6" />
                <span className="text-sm">Mobile Money</span>
              </Button>
            </div>
          </div>

          {/* Mobile Money Form */}
          {paymentMethod === 'mobile_money' && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="0244000000"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
                {phoneNumber && !isValidPhoneNumber(phoneNumber) && (
                  <p className="text-sm text-destructive mt-1">
                    Please enter a valid Ghana phone number
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="provider">Mobile Money Provider</Label>
                <Select value={mobileProvider} onValueChange={(value: 'mtn' | 'vod' | 'tgo' | 'airtel') => setMobileProvider(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mtn">MTN Mobile Money</SelectItem>
                    <SelectItem value="vod">Vodafone Cash</SelectItem>
                    <SelectItem value="tgo">Tigo Cash</SelectItem>
                    <SelectItem value="airtel">AirtelTigo Money</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Security Notice */}
          <div className="flex items-start gap-2 p-3 bg-muted rounded-lg">
            <Shield className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium">Secure Payment</p>
              <p className="text-muted-foreground">
                Your payment is processed securely through Paystack. We never store your payment details.
              </p>
            </div>
          </div>

          {/* Payment Button */}
          <Button
            onClick={handlePayment}
            disabled={isLoading || (paymentMethod === 'mobile_money' && (!phoneNumber || !isValidPhoneNumber(phoneNumber)))}
            className="w-full py-6 text-lg font-semibold"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Pay GHS {tier.price}/month
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};