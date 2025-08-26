
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertCircle, CreditCard } from 'lucide-react';

const PaymentTest: React.FC = () => {
  const [config, setConfig] = useState<any>(null);
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/payment-test/test-config');
      const data = await response.json();
      setConfig(data.data);
    } catch (error) {
      console.error('Failed to fetch config:', error);
    }
  };

  const runTest = async (testName: string, testFn: () => Promise<any>) => {
    setIsLoading(true);
    try {
      const result = await testFn();
      setTestResults(prev => [...prev, {
        name: testName,
        success: true,
        result,
        timestamp: new Date().toISOString()
      }]);
    } catch (error: any) {
      setTestResults(prev => [...prev, {
        name: testName,
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const testPaymentInitialization = async () => {
    const response = await fetch('/api/payment-test/test-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    return await response.json();
  };

  const testPaymentVerification = async () => {
    // First initialize a test payment
    const initResponse = await fetch('/api/payment-test/test-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const initData = await initResponse.json();
    
    if (!initData.success) throw new Error('Failed to initialize test payment');
    
    // Then verify it
    const reference = initData.data.data.reference;
    const verifyResponse = await fetch(`/api/payment-test/test-verify/${reference}`, {
      method: 'POST'
    });
    return await verifyResponse.json();
  };

  const getStatusIcon = (success: boolean) => {
    return success ? (
      <CheckCircle className="h-5 w-5 text-green-500" />
    ) : (
      <XCircle className="h-5 w-5 text-red-500" />
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Payment Integration Test</h1>
        <p className="text-muted-foreground">Test Paystack payment integration functionality</p>
      </div>

      {/* Configuration Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Configuration Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {config ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <Badge variant={config.has_public_key ? "default" : "destructive"}>
                  Public Key
                </Badge>
                <p className="text-sm text-muted-foreground mt-1">
                  {config.has_public_key ? 'Configured' : 'Missing'}
                </p>
              </div>
              <div className="text-center">
                <Badge variant={config.has_secret_key ? "default" : "destructive"}>
                  Secret Key
                </Badge>
                <p className="text-sm text-muted-foreground mt-1">
                  {config.has_secret_key ? 'Configured' : 'Missing'}
                </p>
              </div>
              <div className="text-center">
                <Badge variant={config.is_development ? "secondary" : "default"}>
                  Environment
                </Badge>
                <p className="text-sm text-muted-foreground mt-1">
                  {config.environment}
                </p>
              </div>
              <div className="text-center">
                <Badge variant="outline">
                  Public Key Preview
                </Badge>
                <p className="text-xs text-muted-foreground mt-1 font-mono">
                  {config.public_key?.substring(0, 10)}...
                </p>
              </div>
            </div>
          ) : (
            <p>Loading configuration...</p>
          )}
        </CardContent>
      </Card>

      {/* Test Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Tests
          </CardTitle>
          <CardDescription>
            Run tests to verify payment functionality
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => runTest('Payment Initialization', testPaymentInitialization)}
              disabled={isLoading}
            >
              Test Payment Init
            </Button>
            <Button
              onClick={() => runTest('Payment Verification', testPaymentVerification)}
              disabled={isLoading}
            >
              Test Payment Verify
            </Button>
            <Button
              variant="outline"
              onClick={() => setTestResults([])}
            >
              Clear Results
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Test Results */}
      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {testResults.map((test, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 border rounded-lg"
                >
                  {getStatusIcon(test.success)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{test.name}</h4>
                      <Badge variant={test.success ? "default" : "destructive"}>
                        {test.success ? 'PASS' : 'FAIL'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(test.timestamp).toLocaleString()}
                    </p>
                    {test.success && test.result && (
                      <details className="mt-2">
                        <summary className="text-sm cursor-pointer">View Details</summary>
                        <pre className="text-xs mt-2 p-2 bg-muted rounded overflow-auto">
                          {JSON.stringify(test.result, null, 2)}
                        </pre>
                      </details>
                    )}
                    {!test.success && (
                      <p className="text-sm text-red-600 mt-1">{test.error}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PaymentTest;
