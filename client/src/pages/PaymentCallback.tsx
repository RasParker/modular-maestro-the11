import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

const PaymentCallback: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'failed' | 'cancelled'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const processPayment = async () => {
      const reference = searchParams.get('reference');
      const paymentStatus = searchParams.get('status');

      console.log('Payment callback params:', { reference, paymentStatus });

      if (!reference) {
        setStatus('failed');
        setMessage('Payment reference not found');
        return;
      }

      try {
        // Always verify payment with backend regardless of status
        console.log('Verifying payment with backend...');
        const response = await fetch(`/api/payments/verify/${reference}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const result = await response.json();
        console.log('Payment verification result:', result);

        if (result.success && result.data.status === 'success') {
          setStatus('success');
          setMessage('Payment successful! Your subscription is now active.');

          toast({
            title: "Payment Successful",
            description: "Your subscription has been activated successfully!",
          });

          // Redirect after 3 seconds
          setTimeout(() => {
            const lastProfile = sessionStorage.getItem('lastCreatorProfile');
            if (lastProfile) {
              sessionStorage.removeItem('lastCreatorProfile');
              navigate(lastProfile);
            } else {
              navigate('/fan/dashboard');
            }
          }, 3000);
        } else {
          setStatus('failed');
          setMessage(result.message || 'Payment verification failed');
        }
      } catch (error) {
        console.error('Payment verification error:', error);
        setStatus('failed');
        setMessage('Failed to verify payment. Please contact support.');
      }
    };

    // Check URL params for immediate status
    const urlStatus = searchParams.get('status');
    if (urlStatus === 'success') {
      processPayment();
    } else if (urlStatus === 'cancelled') {
      setStatus('cancelled');
      setMessage('Payment was cancelled');
    } else {
      processPayment();
    }
  }, [searchParams, navigate, toast]);

  const getStatusIcon = () => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-16 h-16 text-green-500" />;
      case 'failed':
        return <XCircle className="w-16 h-16 text-red-500" />;
      case 'cancelled':
        return <XCircle className="w-16 h-16 text-yellow-500" />;
      default:
        return <Loader2 className="w-16 h-16 text-primary animate-spin" />;
    }
  };

  const getStatusTitle = () => {
    switch (status) {
      case 'success':
        return 'Payment Successful!';
      case 'failed':
        return 'Payment Failed';
      case 'cancelled':
        return 'Payment Cancelled';
      default:
        return 'Processing Payment...';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return 'text-green-600';
      case 'failed':
        return 'text-red-600';
      case 'cancelled':
        return 'text-yellow-600';
      default:
        return 'text-primary';
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {getStatusIcon()}
          </div>
          <CardTitle className={`text-2xl ${getStatusColor()}`}>
            {getStatusTitle()}
          </CardTitle>
          <CardDescription>
            {message || 'Please wait while we process your payment...'}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {status === 'loading' && (
            <p className="text-sm text-muted-foreground">
              This may take a few moments...
            </p>
          )}

          {status === 'success' && (
            <p className="text-sm text-muted-foreground">
              Redirecting you back to the creator profile...
            </p>
          )}

          {(status === 'failed' || status === 'cancelled') && (
            <div className="space-y-3">
              <Button 
                onClick={() => {
                  const lastProfile = sessionStorage.getItem('lastCreatorProfile');
                  if (lastProfile) {
                    sessionStorage.removeItem('lastCreatorProfile');
                    navigate(lastProfile);
                  } else {
                    navigate('/fan/dashboard');
                  }
                }}
                className="w-full"
              >
                Return to Profile
              </Button>
              <Button 
                variant="outline"
                onClick={() => navigate('/fan/dashboard')}
                className="w-full"
              >
                Go to Dashboard
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentCallback;