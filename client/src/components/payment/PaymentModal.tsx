
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
      <DialogContent className="sm:max-w-lg bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-xl border border-slate-700/50">
        <DialogHeader className="text-center space-y-3">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-primary mx-auto">
            <Star className="h-6 w-6 text-white" />
          </div>
          <DialogTitle className="text-xl font-semibold text-gradient-primary">
            Subscribe to {creatorName}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Join the {tier.name} tier for exclusive content access
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* Tier Summary */}
          <Card className="border border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg text-slate-100">{tier.name}</CardTitle>
                  <CardDescription className="text-slate-400 text-sm">{tier.description}</CardDescription>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">GHS {tier.price}</div>
                  <div className="text-sm text-slate-400">per month</div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <Check className="h-4 w-4 text-blue-400" />
                <span>Cancel anytime</span>
              </div>
            </CardContent>
          </Card>

          {/* Payment Method Selection */}
          <div className="space-y-4">
            <Label className="text-slate-200 font-medium">Choose Payment Method</Label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant={paymentMethod === 'card' ? 'default' : 'outline'}
                onClick={() => setPaymentMethod('card')}
                className={`h-20 flex flex-col items-center gap-2 transition-all duration-200 ${
                  paymentMethod === 'card' 
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 shadow-lg shadow-blue-500/25' 
                    : 'border-slate-600 bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 hover:border-slate-500'
                }`}
              >
                <CreditCard className="h-5 w-5" />
                <span className="text-sm font-medium">Debit Card</span>
              </Button>
              <Button
                variant={paymentMethod === 'mobile_money' ? 'default' : 'outline'}
                onClick={() => setPaymentMethod('mobile_money')}
                className={`h-20 flex flex-col items-center gap-2 transition-all duration-200 ${
                  paymentMethod === 'mobile_money' 
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 shadow-lg shadow-blue-500/25' 
                    : 'border-slate-600 bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 hover:border-slate-500'
                }`}
              >
                <Smartphone className="h-5 w-5" />
                <span className="text-sm font-medium">Mobile Money</span>
              </Button>
            </div>
          </div>

          {/* Mobile Money Form */}
          {paymentMethod === 'mobile_money' && (
            <div className="space-y-4 p-4 bg-slate-800/30 rounded-xl border border-slate-700/50">
              <div>
                <Label htmlFor="phone" className="text-slate-200 font-medium">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="0244000000"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="mt-2 bg-slate-700/50 border-slate-600 text-slate-100 placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500/20"
                />
                {phoneNumber && !isValidPhoneNumber(phoneNumber) && (
                  <p className="text-sm text-red-400 mt-2 flex items-center gap-1">
                    <span className="w-1 h-1 bg-red-400 rounded-full"></span>
                    Please enter a valid Ghana phone number
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="provider" className="text-slate-200 font-medium">Mobile Money Provider</Label>
                <Select value={mobileProvider} onValueChange={(value: 'mtn' | 'vod' | 'tgo' | 'airtel') => setMobileProvider(value)}>
                  <SelectTrigger className="mt-2 bg-slate-700/50 border-slate-600 text-slate-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
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
          <div className="flex items-start gap-3 p-4 bg-slate-800/30 rounded-xl border border-slate-700/50">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-500/20 flex-shrink-0">
              <Shield className="h-4 w-4 text-blue-400" />
            </div>
            <div className="space-y-1">
              <p className="font-medium text-slate-200 text-sm">Secure Payment</p>
              <p className="text-slate-400 text-sm leading-relaxed">
                Your payment is processed securely through Paystack. We never store your payment details.
              </p>
            </div>
          </div>

          {/* Payment Button */}
          <Button
            onClick={handlePayment}
            disabled={isLoading || (paymentMethod === 'mobile_money' && (!phoneNumber || !isValidPhoneNumber(phoneNumber)))}
            className="w-full py-6 text-lg font-semibold bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0 shadow-lg shadow-blue-500/25 transition-all duration-200 hover:shadow-blue-500/30 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            size="lg"
          >
            {isLoading ? (
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Processing Payment...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <Lock className="h-5 w-5" />
                <span>Pay GHS {tier.price}/month</span>
              </div>
            )}
          </Button>

          {/* Footer Note */}
          <p className="text-center text-xs text-slate-500">
            By subscribing, you agree to our terms and conditions
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
