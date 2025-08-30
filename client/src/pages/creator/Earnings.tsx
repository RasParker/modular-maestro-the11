import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

import { 
  ArrowLeft, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Calendar, 
  Download, 
  Eye,
  ChevronDown,
  ChevronUp,
  Plus
} from 'lucide-react';

const EARNINGS_DATA = {
  totalMonthlyRevenue: 85.00,
  totalActiveSubscribers: 3,
  estimatedNetRevenue: 80.75,
  growth: 11.2,
  platformFee: 0.00,
  paystackFees: 4.25,
  nextPayout: '2025-07-15'
};



const TRANSACTION_HISTORY = [
  { id: '1', date: '2025-06-28', amount: 10.00, type: 'Subscription', subscriber: 'Kwame A.', tier: 'Basic Support' },
  { id: '2', date: '2025-06-27', amount: 25.00, type: 'Subscription', subscriber: 'Ama K.', tier: 'Premium Content' },
  { id: '3', date: '2025-06-26', amount: 50.00, type: 'Subscription', subscriber: 'Kofi M.', tier: 'VIP Access' },
  { id: '4', date: '2025-06-25', amount: 15.75, type: 'Tip', subscriber: 'Akua S.', tier: 'Premium Content' },
];

// Mobile-optimized tier card component
const TierCard: React.FC<{ tier: typeof TIER_BREAKDOWN[0] }> = ({ tier }) => (
  <Card className="bg-gradient-card border-border/50">
    <CardContent className="p-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-foreground text-sm">{tier.name}</h4>
          <Badge variant="secondary" className="text-xs">{tier.percentage.toFixed(1)}%</Badge>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Price</p>
            <p className="font-medium">GHS {tier.price.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Subscribers</p>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="rounded-full w-6 h-6 p-0 flex items-center justify-center text-xs">
                {tier.subscribers}
              </Badge>
            </div>
          </div>
        </div>
        <div className="pt-2 border-t border-border/20">
          <p className="text-muted-foreground text-sm">Monthly Revenue</p>
          <p className="font-semibold text-foreground">GHS {tier.monthlyRevenue.toFixed(2)}</p>
        </div>
      </div>
    </CardContent>
  </Card>
);

// Mobile-optimized transaction card component
const TransactionCard: React.FC<{ transaction: typeof TRANSACTION_HISTORY[0] }> = ({ transaction }) => (
  <Card className="bg-gradient-card border-border/50">
    <CardContent className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-foreground text-sm">{transaction.subscriber}</h4>
          <div className="flex gap-2 mt-2">
            <Badge variant="outline" className="text-xs whitespace-nowrap">{transaction.type}</Badge>
            <Badge variant="secondary" className="text-xs whitespace-nowrap">{transaction.tier}</Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">{transaction.date}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-lg font-semibold text-foreground">GHS {transaction.amount.toFixed(2)}</div>
        </div>
      </div>
    </CardContent>
  </Card>
);

export const Earnings: React.FC = () => {
  const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState('all-time');
  const [isBreakdownOpen, setIsBreakdownOpen] = useState(false);
  const [isPaymentInfoOpen, setIsPaymentInfoOpen] = useState(false);
  const [payoutHistory, setPayoutHistory] = useState([]);
  const [currentEarnings, setCurrentEarnings] = useState(null);
  const [creatorTiers, setCreatorTiers] = useState([]);
  const [tierBreakdown, setTierBreakdown] = useState([]);
  const [analytics, setAnalytics] = useState({ subscribers: 0, monthlyEarnings: 0 });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (user?.id) {
      fetchPayoutData();
    }
  }, [user]);

  const fetchPayoutData = async () => {
    try {
      setLoading(true);

      // Fetch current month earnings
      const earningsResponse = await fetch(`/api/payouts/creator/${user.id}/current-earnings`);
      if (earningsResponse.ok) {
        const earningsData = await earningsResponse.json();
        setCurrentEarnings(earningsData.data);
      }

      // Fetch payout history
      const historyResponse = await fetch(`/api/payouts/creator/${user.id}/history?limit=10`);
      if (historyResponse.ok) {
        const historyData = await historyResponse.json();
        setPayoutHistory(historyData.data);
      }

      // Fetch real analytics data for subscriber count
      const analyticsResponse = await fetch(`/api/creator/${user.id}/analytics`);
      if (analyticsResponse.ok) {
        const analyticsData = await analyticsResponse.json();
        setAnalytics(analyticsData);
      }

      // Fetch creator's subscription tiers with real performance data
      const tiersResponse = await fetch(`/api/creators/${user.id}/tiers`);
      if (tiersResponse.ok) {
        const tiersData = await tiersResponse.json();
        setCreatorTiers(tiersData);
      }

      // Fetch real tier performance data
      const tierPerformanceResponse = await fetch(`/api/creator/${user.id}/tier-performance`);
      if (tierPerformanceResponse.ok) {
        const tierPerformanceData = await tierPerformanceResponse.json();

        // Calculate tier breakdown with real data
        const breakdown = tierPerformanceData.map((tier) => {
          const monthlyRevenue = tier.revenue || 0;
          return {
            name: tier.name,
            price: parseFloat(tier.price),
            subscribers: tier.subscribers || 0,
            monthlyRevenue: monthlyRevenue,
            percentage: 0 // Will calculate after getting total
          };
        });

        // Calculate percentages
        const totalRevenue = breakdown.reduce((sum, tier) => sum + tier.monthlyRevenue, 0);
        const breakdownWithPercentages = breakdown.map(tier => ({
          ...tier,
          percentage: totalRevenue > 0 ? (tier.monthlyRevenue / totalRevenue) * 100 : 0
        }));

        setTierBreakdown(breakdownWithPercentages);
      }
    } catch (error) {
      console.error('Error fetching payout data:', error);
      toast({
        title: "Error",
        description: "Failed to load earnings data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
            Earnings Overview
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Track your revenue and financial performance
          </p>
        </div>

        {/* Main Stats Cards - Mobile Optimized */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-xs sm:text-sm mb-1">Total Monthly Revenue</p>
                  <p className="text-2xl sm:text-3xl font-bold">GHS {currentEarnings?.gross_revenue?.toFixed(2) || '0.00'}</p>
                </div>
                <DollarSign className="w-6 h-6 sm:w-8 sm:h-8 text-white opacity-70" strokeWidth={1} />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-xs sm:text-sm mb-1">Total Active Subscribers</p>
                  <p className="text-2xl sm:text-3xl font-bold">{analytics.subscribers || 0}</p>
                </div>
                <Users className="w-6 h-6 sm:w-8 sm:h-8 text-white opacity-70" strokeWidth={1} />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-cyan-400 to-cyan-500 text-white border-0 sm:col-span-2 lg:col-span-1">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-cyan-100 text-xs sm:text-sm mb-1">Est. Net Revenue*</p>
                  <p className="text-2xl sm:text-3xl font-bold">GHS {currentEarnings?.net_payout?.toFixed(2) || '0.00'}</p>
                </div>
                <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-cyan-200" strokeWidth={1} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Revenue Breakdown - Collapsible on Mobile */}
        <Collapsible open={isBreakdownOpen} onOpenChange={setIsBreakdownOpen} className="mb-6 sm:mb-8">
          <Card className="bg-gradient-card border-border/50">
            <CardHeader>
              <CollapsibleTrigger asChild>
                <div className="flex items-center justify-between cursor-pointer">
                  <div>
                    <CardTitle className="text-base sm:text-lg">Revenue Breakdown by Tier</CardTitle>
                    <CardDescription className="text-sm">Detailed breakdown of your subscription tiers</CardDescription>
                  </div>
                  {isBreakdownOpen ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
              </CollapsibleTrigger>
            </CardHeader>

            <CollapsibleContent>
              <CardContent>
                {/* Desktop Table View */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border/50">
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground text-sm">Tier Name</th>
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground text-sm">Price</th>
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground text-sm">Subscribers</th>
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground text-sm">Monthly Revenue</th>
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground text-sm">Percentage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tierBreakdown.length > 0 ? (
                        <>
                          {tierBreakdown.map((tier, index) => (
                            <tr key={index} className="border-b border-border/20">
                              <td className="py-3 px-4 font-medium text-foreground text-sm">{tier.name}</td>
                              <td className="py-3 px-4 text-muted-foreground text-sm">GHS {tier.price.toFixed(2)}</td>
                              <td className="py-3 px-4">
                                <Badge variant="outline" className="rounded-full w-6 h-6 p-0 flex items-center justify-center text-xs">
                                  {tier.subscribers}
                                </Badge>
                              </td>
                              <td className="py-3 px-4 font-medium text-foreground text-sm">GHS {tier.monthlyRevenue.toFixed(2)}</td>
                              <td className="py-3 px-4">
                                <Badge variant="secondary" className="text-xs">{tier.percentage.toFixed(1)}%</Badge>
                              </td>
                            </tr>
                          ))}
                          <tr className="bg-muted/20">
                            <td className="py-3 px-4 font-semibold text-foreground text-sm">Total</td>
                            <td className="py-3 px-4 text-sm">-</td>
                            <td className="py-3 px-4">
                              <Badge variant="outline" className="rounded-full w-6 h-6 p-0 flex items-center justify-center text-xs bg-green-100 text-green-700">
                                {tierBreakdown.reduce((sum, tier) => sum + tier.subscribers, 0)}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 font-semibold text-foreground text-sm">
                              GHS {tierBreakdown.reduce((sum, tier) => sum + tier.monthlyRevenue, 0).toFixed(2)}
                            </td>
                            <td className="py-3 px-4 font-semibold text-foreground text-sm">100%</td>
                          </tr>
                        </>
                      ) : (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-muted-foreground">
                            <div className="flex flex-col items-center gap-2">
                              <DollarSign className="w-8 h-8" />
                              <span>No subscription tiers created yet</span>
                              <Button variant="outline" size="sm" asChild className="mt-2">
                                <Link to="/creator/tiers">Create Tiers</Link>
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="sm:hidden space-y-4">
                  {tierBreakdown.length > 0 ? (
                    <>
                      {tierBreakdown.map((tier, index) => (
                        <TierCard key={index} tier={tier} />
                      ))}

                      {/* Total Summary Card */}
                      <Card className="bg-muted/20 border-border/50">
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <h4 className="font-semibold text-foreground">Total Summary</h4>
                              <Badge variant="outline" className="bg-green-100 text-green-700">100%</Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-muted-foreground">Total Subscribers</p>
                                <p className="font-semibold">{tierBreakdown.reduce((sum, tier) => sum + tier.subscribers, 0)}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Total Revenue</p>
                                <p className="font-semibold">GHS {tierBreakdown.reduce((sum, tier) => sum + tier.monthlyRevenue, 0).toFixed(2)}</p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </>
                  ) : (
                    <Card className="bg-gradient-card border-border/50">
                      <CardContent className="p-6">
                        <div className="text-center py-4">
                          <DollarSign className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                          <h3 className="text-lg font-medium mb-2">No subscription tiers</h3>
                          <p className="text-muted-foreground text-sm mb-4">
                            Create subscription tiers to start tracking revenue breakdown.
                          </p>
                          <Button variant="outline" size="sm" asChild>
                            <Link to="/creator/tiers">
                              <Plus className="w-4 h-4 mr-2" />
                              Create Tiers
                            </Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Payment Information - Collapsible on Mobile */}
        <Collapsible open={isPaymentInfoOpen} onOpenChange={setIsPaymentInfoOpen} className="mb-6 sm:mb-8">
          <Card className="bg-gradient-card border-border/50">
            <CardHeader>
              <CollapsibleTrigger asChild>
                <div className="flex items-center justify-between cursor-pointer">
                  <CardTitle className="text-base sm:text-lg">Payment Information</CardTitle>
                  {isPaymentInfoOpen ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
              </CollapsibleTrigger>
            </CardHeader>

            <CollapsibleContent>
              <CardContent>
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6 rounded-r">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <div className="w-5 h-5 rounded-full bg-blue-400 flex items-center justify-center">
                        <span className="text-white text-xs">!</span>
                      </div>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-blue-800">
                        <strong>Payment Processing:</strong> Payments are processed monthly via Paystack. Your earnings will be transferred to your linked bank account after deducting Paystack's transaction fees.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                  <div>
                    <h4 className="font-medium text-foreground mb-4 text-sm sm:text-base">This Month's Projections:</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Gross Revenue:</span>
                        <span className="font-medium">GHS {currentEarnings?.gross_revenue?.toFixed(2) || '0.00'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Platform Fee (5%):</span>
                        <span className="font-medium">GHS {currentEarnings?.platform_fee?.toFixed(2) || '0.00'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Paystack Fees (3.5%):</span>
                        <span className="font-medium">GHS {currentEarnings?.paystack_fees?.toFixed(2) || '0.00'}</span>
                      </div>
                      <div className="border-t pt-2 mt-2">
                        <div className="flex justify-between font-semibold">
                          <span>Net Revenue:</span>
                          <span>GHS {currentEarnings?.net_payout?.toFixed(2) || '0.00'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-foreground mb-4 text-sm sm:text-base">Payment Schedule:</h4>
                    <p className="text-sm text-muted-foreground">
                      Payments are processed automatically by Paystack on the subscriber's billing date. Your earnings are transferred to your bank account within 2-3 business days.
                    </p>
                  </div>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Payout History */}
        <Card className="bg-gradient-card border-border/50">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Payout History</CardTitle>
            <CardDescription className="text-sm">Your processed payouts and pending transfers</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading payout history...</p>
              </div>
            ) : payoutHistory.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium text-foreground mb-2">No Payouts Yet</h3>
                <p className="text-sm text-muted-foreground">Your first payout will appear here once you reach the minimum threshold of GHS 10.00</p>
              </div>
            ) : (
              <div className="space-y-4">
                {payoutHistory.map((payout: any) => (
                  <div key={payout.id} className="flex items-center justify-between p-4 rounded-lg border border-border/50">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div>
                          <h4 className="font-medium text-foreground">
                            {new Date(payout.period_start).toLocaleDateString()} - {new Date(payout.period_end).toLocaleDateString()}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge 
                              variant={payout.status === 'completed' ? 'default' : payout.status === 'pending' ? 'secondary' : 'destructive'}
                              className="text-xs"
                            >
                              {payout.status}
                            </Badge>
                            <Badge variant="outline" className="text-xs">{payout.payout_method}</Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-foreground">GHS {parseFloat(payout.amount).toFixed(2)}</div>
                      <p className="text-xs text-muted-foreground">
                        {payout.processed_at ? new Date(payout.processed_at).toLocaleDateString() : 'Pending'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};