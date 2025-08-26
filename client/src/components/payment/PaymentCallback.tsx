import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface PaymentStatus {
  success: boolean;
  message: string;
  data?: any;
}

export const PaymentCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const reference = searchParams.get('reference');
    if (reference) {
      verifyPayment(reference);
    } else {
      setPaymentStatus({
        success: false,
        message: 'No payment reference found'
      });
      setIsLoading(false);
    }
  }, [searchParams]);

  const verifyPayment = async (reference: string) => {
    try {
      const response = await fetch(`/api/payments/verify/${reference}`);
      const data = await response.json();
      
      const isSuccess = data.success && data.data.status === 'success';
      
      setPaymentStatus({
        success: isSuccess,
        message: isSuccess 
          ? 'Payment completed successfully!' 
          : data.data.gateway_response || 'Payment failed',
        data: data.data
      });

      // Dispatch custom event to notify components about successful subscription
      if (isSuccess) {
        const event = new CustomEvent('subscriptionStatusChange', {
          detail: { type: 'subscriptionCreated', paymentData: data.data }
        });
        window.dispatchEvent(event);
        console.log('🔄 Dispatched subscription status change event');
      }
    } catch (error) {
      setPaymentStatus({
        success: false,
        message: 'Failed to verify payment'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinue = () => {
    if (paymentStatus?.success) {
      navigate('/fan/dashboard');
    } else {
      navigate('/explore');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-center text-muted-foreground">
                Verifying your payment...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {paymentStatus?.success ? (
              <CheckCircle className="h-16 w-16 text-green-500" />
            ) : (
              <XCircle className="h-16 w-16 text-red-500" />
            )}
          </div>
          <CardTitle className="text-2xl">
            {paymentStatus?.success ? 'Payment Successful!' : 'Payment Failed'}
          </CardTitle>
          <CardDescription>
            {paymentStatus?.message}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {paymentStatus?.success && (
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                Subscription Activated
              </h4>
              <p className="text-sm text-green-700 dark:text-green-300">
                You now have access to exclusive content from this creator. 
                Check your fan dashboard to explore new content.
              </p>
            </div>
          )}

          {paymentStatus?.data && (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount:</span>
                <span className="font-medium">
                  GHS {(paymentStatus.data.amount / 100).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Reference:</span>
                <span className="font-mono text-xs">
                  {paymentStatus.data.reference}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Channel:</span>
                <span className="capitalize">{paymentStatus.data.channel}</span>
              </div>
              {paymentStatus.data.paid_at && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Paid at:</span>
                  <span>{new Date(paymentStatus.data.paid_at).toLocaleString()}</span>
                </div>
              )}
            </div>
          )}

          <Button onClick={handleContinue} className="w-full" size="lg">
            {paymentStatus?.success ? 'Go to Dashboard' : 'Try Again'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};