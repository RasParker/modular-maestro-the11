import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CreditCard, Plus, Trash2, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const MOCK_PAYMENT_METHODS = [
  {
    id: '1',
    type: 'card',
    brand: 'Visa',
    last4: '4242',
    expiry: '12/25',
    is_default: true
  },
  {
    id: '2',
    type: 'card',
    brand: 'Mastercard',
    last4: '8888',
    expiry: '08/26',
    is_default: false
  }
];

export const PaymentMethod: React.FC = () => {
  const { toast } = useToast();
  const [paymentMethods, setPaymentMethods] = useState(MOCK_PAYMENT_METHODS);
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [cardForm, setCardForm] = useState({
    number: '',
    expiry: '',
    cvc: '',
    name: ''
  });

  const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 2000));

      const newCard = {
        id: Date.now().toString(),
        type: 'card',
        brand: 'Visa',
        last4: cardForm.number.slice(-4),
        expiry: cardForm.expiry,
        is_default: paymentMethods.length === 0
      };

      setPaymentMethods([...paymentMethods, newCard]);
      setCardForm({ number: '', expiry: '', cvc: '', name: '' });
      setIsAddingCard(false);

      toast({
        title: "Payment method added",
        description: "Your card has been added successfully.",
      });
    } catch (error) {
      toast({
        title: "Failed to add card",
        description: "There was an error adding your payment method.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveCard = (cardId: string) => {
    setPaymentMethods(paymentMethods.filter(card => card.id !== cardId));
    toast({
      title: "Payment method removed",
      description: "Your card has been removed successfully.",
    });
  };

  const handleSetDefault = (cardId: string) => {
    setPaymentMethods(paymentMethods.map(card => ({
      ...card,
      is_default: card.id === cardId
    })));
    toast({
      title: "Default payment method updated",
      description: "Your default payment method has been updated.",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Button variant="outline" size="sm" asChild className="mb-4 w-10 h-10 p-0 sm:w-auto sm:h-auto sm:p-2 sm:px-4">
            <Link to="/fan/dashboard">
              <ArrowLeft className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Back to Dashboard</span>
            </Link>
          </Button>
          <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-2">
            <CreditCard className="w-8 h-8 text-primary" />
            Payment Methods
          </h1>
          <p className="text-muted-foreground">
            Manage your payment methods and billing information
          </p>
        </div>

        <div className="space-y-6">
          {/* Current Payment Methods */}
          <Card className="bg-gradient-card border-border/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Your Payment Methods</CardTitle>
                  <CardDescription>
                    Manage your saved payment methods
                  </CardDescription>
                </div>
                <Button onClick={() => setIsAddingCard(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Card
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {paymentMethods.map((method) => (
                  <div key={method.id} className="flex items-center justify-between p-4 rounded-lg border border-border/50">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-8 bg-gradient-primary rounded flex items-center justify-center">
                        <CreditCard className="w-6 h-6 text-primary-foreground" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground">
                            {method.brand} •••• {method.last4}
                          </p>
                          {method.is_default && (
                            <Badge variant="default">Default</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Expires {method.expiry}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {!method.is_default && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSetDefault(method.id)}
                        >
                          Set Default
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveCard(method.id)}
                        disabled={paymentMethods.length === 1}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}

                {paymentMethods.length === 0 && (
                  <div className="text-center py-8">
                    <CreditCard className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No payment methods added yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Add New Card Form */}
          {isAddingCard && (
            <Card className="bg-gradient-card border-border/50">
              <CardHeader>
                <CardTitle>Add New Payment Method</CardTitle>
                <CardDescription>
                  Add a new credit or debit card to your account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddCard} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="cardNumber">Card Number</Label>
                    <Input
                      id="cardNumber"
                      placeholder="1234 5678 9012 3456"
                      value={cardForm.number}
                      onChange={(e) => setCardForm(prev => ({ ...prev, number: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="expiry">Expiry Date</Label>
                      <Input
                        id="expiry"
                        placeholder="MM/YY"
                        value={cardForm.expiry}
                        onChange={(e) => setCardForm(prev => ({ ...prev, expiry: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cvc">CVC</Label>
                      <Input
                        id="cvc"
                        placeholder="123"
                        value={cardForm.cvc}
                        onChange={(e) => setCardForm(prev => ({ ...prev, cvc: e.target.value }))}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cardName">Cardholder Name</Label>
                    <Input
                      id="cardName"
                      placeholder="John Doe"
                      value={cardForm.name}
                      onChange={(e) => setCardForm(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Shield className="w-4 h-4" />
                    Your payment information is encrypted and secure
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? "Adding..." : "Add Card"}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsAddingCard(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Billing Information */}
          <Card className="bg-gradient-card border-border/50">
            <CardHeader>
              <CardTitle>Billing Information</CardTitle>
              <CardDescription>
                Your current billing details and history
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Next billing date</p>
                  <p className="font-medium">February 15, 2024</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Amount due</p>
                  <p className="font-medium">GHS 25.00</p>
                </div>
              </div>

              <Button variant="outline" className="w-full">
                View Billing History
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};