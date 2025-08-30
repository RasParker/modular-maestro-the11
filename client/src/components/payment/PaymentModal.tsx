
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
import { CreditCard, Smartphone, Loader2, Lock, Shield, Star, Check } from 'lucide-react';

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
      sessionStorage.setItem('lastCreatorProfile', window.location.pathname);

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
        
        if (data.data.authorization_url.startsWith('/')) {
          console.log('Development mode: navigating to callback');
          onClose();
          navigate(data.data.authorization_url);
        } else {
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
       sessionStorage.setItem('lastCreatorProfile', window.location.pathname);
      
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
    const phoneRegex = /^(0|\+233)[2-9]\d{8}$/;
    return phoneRegex.test(phone);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg bg-gradient-to-br from-background to-background/95 backdrop-blur-xl border border-border/50">
        <DialogHeader className="text-center space-y-4">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-primary/20 to-accent/20 mx-auto">
            <CreditCard className="h-8 w-8 text-primary" />
          </div>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Complete Your Subscription
          </DialogTitle>
          <DialogDescription className="text-muted-foreground max-w-sm mx-auto leading-relaxed">
            You're about to join {creatorName}'s {tier.name} tier
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* Tier Summary */}
          <Card className="border border-border/30 bg-gradient-to-br from-card/50 to-background/50 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg text-foreground flex items-center gap-2">
                    {tier.name}
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  </CardTitle>
                  <CardDescription className="text-muted-foreground text-sm leading-relaxed">
                    {tier.description}
                  </CardDescription>
                </div>
                <div className="text-right space-y-1">
                  <div className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    GHS {tier.price}
                  </div>
                  <div className="text-sm text-muted-foreground">per month</div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between bg-muted/30 rounded-lg p-3">
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>Cancel anytime</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <Shield className="h-4 w-4 text-blue-500" />
                  <span>Secure payment</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Method Selection */}
          <div className="space-y-5">
            <div className="text-center">
              <Label className="text-foreground font-semibold text-lg">Choose Payment Method</Label>
              <p className="text-sm text-muted-foreground mt-1">Select your preferred payment option</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="ghost"
                onClick={() => setPaymentMethod('card')}
                className={`h-24 flex flex-col items-center justify-center gap-3 transition-all duration-300 rounded-xl border-2 ${
                  paymentMethod === 'card' 
                    ? 'border-primary bg-gradient-to-br from-primary/10 to-accent/10 text-primary shadow-lg shadow-primary/20' 
                    : 'border-border/30 bg-gradient-to-br from-card/30 to-background/30 text-muted-foreground hover:border-primary/40 hover:text-foreground hover:bg-gradient-to-br hover:from-primary/5 hover:to-accent/5'
                }`}
              >
                <CreditCard className="h-6 w-6" />
                <span className="text-sm font-semibold">Debit Card</span>
                {paymentMethod === 'card' && (
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                )}
              </Button>
              <Button
                variant="ghost"
                onClick={() => setPaymentMethod('mobile_money')}
                className={`h-24 flex flex-col items-center justify-center gap-3 transition-all duration-300 rounded-xl border-2 ${
                  paymentMethod === 'mobile_money' 
                    ? 'border-primary bg-gradient-to-br from-primary/10 to-accent/10 text-primary shadow-lg shadow-primary/20' 
                    : 'border-border/30 bg-gradient-to-br from-card/30 to-background/30 text-muted-foreground hover:border-primary/40 hover:text-foreground hover:bg-gradient-to-br hover:from-primary/5 hover:to-accent/5'
                }`}
              >
                <Smartphone className="h-6 w-6" />
                <span className="text-sm font-semibold">Mobile Money</span>
                {paymentMethod === 'mobile_money' && (
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                )}
              </Button>
            </div>
          </div>

          {/* Mobile Money Form */}
          {paymentMethod === 'mobile_money' && (
            <div className="space-y-5 p-6 bg-gradient-to-br from-card/40 to-background/40 rounded-2xl border border-border/30 backdrop-blur-sm">
              <div className="text-center mb-4">
                <h4 className="font-semibold text-foreground mb-1">Mobile Money Details</h4>
                <p className="text-sm text-muted-foreground">Enter your mobile money information</p>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-foreground font-medium flex items-center gap-2">
                    <Smartphone className="h-4 w-4" />
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="0244000000"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="bg-background/50 border-border/50 text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20 transition-all duration-200"
                  />
                  {phoneNumber && !isValidPhoneNumber(phoneNumber) && (
                    <p className="text-sm text-red-500 mt-2 flex items-center gap-2 bg-red-50 dark:bg-red-900/20 p-2 rounded-lg">
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Please enter a valid Ghana phone number
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="provider" className="text-foreground font-medium flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Mobile Money Provider
                  </Label>
                  <Select value={mobileProvider} onValueChange={(value: 'mtn' | 'vod' | 'tgo' | 'airtel') => setMobileProvider(value)}>
                    <SelectTrigger className="bg-background/50 border-border/50 text-foreground focus:border-primary focus:ring-primary/20 transition-all duration-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-background border-border/50">
                      <SelectItem value="mtn">MTN Mobile Money</SelectItem>
                      <SelectItem value="vod">Vodafone Cash</SelectItem>
                      <SelectItem value="tgo">Tigo Cash</SelectItem>
                      <SelectItem value="airtel">AirtelTigo Money</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Security Notice */}
          <div className="flex items-start gap-4 p-5 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-2xl border border-green-200/30 dark:border-green-700/30">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-green-500 to-blue-500 flex-shrink-0">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div className="space-y-2">
              <p className="font-semibold text-foreground">🔒 Bank-Level Security</p>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Your payment is processed securely through Paystack with industry-standard encryption. We never store your payment details.
              </p>
            </div>
          </div>

          {/* Payment Button */}
          <Button
            onClick={handlePayment}
            disabled={isLoading || (paymentMethod === 'mobile_money' && (!phoneNumber || !isValidPhoneNumber(phoneNumber)))}
            className="w-full py-6 text-lg font-bold bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white border-0 shadow-xl shadow-primary/25 transition-all duration-300 hover:shadow-primary/40 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none rounded-xl"
            size="lg"
          >
            {isLoading ? (
              <div className="flex items-center gap-3">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span>Processing Payment...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-3">
                <Lock className="h-5 w-5" />
                <span>Complete Payment • GHS {tier.price}/month</span>
                <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
            )}
          </Button>

          {/* Footer Note */}
          <div className="text-center space-y-2">
            <p className="text-xs text-muted-foreground">
              By subscribing, you agree to our terms and conditions
            </p>
            <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Instant access
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Cancel anytime
              </span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
