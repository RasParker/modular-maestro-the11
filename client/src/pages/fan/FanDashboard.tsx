import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { EdgeToEdgeContainer } from '@/components/layout/EdgeToEdgeContainer';
import { useAuth } from '@/contexts/AuthContext';
import { Heart, MessageSquare, Calendar, CreditCard, TrendingUp, Star } from 'lucide-react';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

interface Subscription {
  id: number;
  creator: {
    id: number;
    username: string;
    display_name: string;
    avatar: string;
  };
  tier: {
    name: string;
    price: number;
  };
  status: string;
  current_period_end: string;
  created_at: string;
  auto_renew: boolean;
}

interface RecentActivity {
  id: string;
  type: string;
  creator: string;
  message: string;
  time: string;
  avatar: string;
}

export const FanDashboard: React.FC = () => {
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [newContentCount, setNewContentCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [activityLoading, setActivityLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubscriptions = async () => {
      if (!user) return;

      try {
        const response = await fetch(`/api/subscriptions/fan/${user.id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch subscriptions');
        }
        const data = await response.json();
        setSubscriptions(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    const fetchRecentActivity = async () => {
      if (!user) return;

      try {
        const response = await fetch(`/api/fan/${user.id}/recent-activity`);
        if (response.ok) {
          const data = await response.json();
          // Handle the correct response structure: {activities: [], total: 0, hasMore: false}
          setRecentActivity(Array.isArray(data) ? data : (data.activities || []));
        } else {
          // If response is not ok, set empty array
          setRecentActivity([]);
        }
      } catch (err) {
        console.error('Error fetching recent activity:', err);
        // Don't set error state for activity, just use empty array
        setRecentActivity([]);
      } finally {
        setActivityLoading(false);
      }
    };

    const fetchNewContentCount = async () => {
      if (!user) return;

      try {
        const response = await fetch(`/api/fan/${user.id}/new-content-count`);
        if (!response.ok) {
          throw new Error('Failed to fetch new content count');
        }
        const data = await response.json();
        setNewContentCount(data.count || 0);
      } catch (err) {
        console.error('Error fetching new content count:', err);
        setNewContentCount(0);
      }
    };

    fetchSubscriptions();
    fetchRecentActivity();
    fetchNewContentCount();
  }, [user]);

  const fetchNewContentCount = async () => {
    if (!user) return;

    try {
      const response = await fetch(`/api/fan/${user.id}/new-content-count`);
      if (!response.ok) {
        throw new Error('Failed to fetch new content count');
      }
      const data = await response.json();
      setNewContentCount(data.count || 0);
    } catch (err) {
      console.error('Error fetching new content count:', err);
      setNewContentCount(0);
    }
  };

  useEffect(() => {
    if (user?.id) {
      const interval = setInterval(() => {
        fetchNewContentCount();
      }, 30000); // Check every 30 seconds

      return () => clearInterval(interval);
    }
  }, [user]);

  // Listen for subscription updates from payment callback
  useEffect(() => {
    const handleSubscriptionUpdate = () => {
      console.log('🔄 Dashboard: Subscription update detected, refreshing...');
      if (user?.id) {
        fetchSubscriptions();
        fetchRecentActivity();
        fetchNewContentCount();
      }
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'subscriptionUpdate') {
        handleSubscriptionUpdate();
      }
    };

    window.addEventListener('subscriptionStatusChange', handleSubscriptionUpdate);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('subscriptionStatusChange', handleSubscriptionUpdate);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [user]);

  return (
    <EdgeToEdgeContainer>
      {/* Hero Section - Full Width */}
      <div className="bg-gradient-to-r from-primary/10 via-accent/5 to-primary/10 border-b border-border">
        <EdgeToEdgeContainer maxWidth="7xl" enablePadding enableTopPadding>
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
              Welcome back, {user?.username}!
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Here's what's happening with your favorite creators
            </p>
          </div>
        </EdgeToEdgeContainer>
      </div>

      {/* Main Content */}
      <EdgeToEdgeContainer maxWidth="7xl" enablePadding className="py-6 sm:py-8">
        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Stats */}
            <div className="grid md:grid-cols-3 gap-4">
              <Card className="bg-gradient-card border-border/50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Active Subscriptions</p>
                      <p className="text-2xl font-bold text-foreground">{subscriptions.filter(sub => sub.status === 'active').length}</p>
                    </div>
                    <Heart className="h-8 w-8 text-white" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-card border-border/50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Monthly Spending</p>
                      <p className="text-2xl font-bold text-foreground">
                        GHS {subscriptions.filter(sub => sub.status === 'active').reduce((sum, sub) => sum + parseFloat(sub.tier.price), 0).toFixed(2)}
                      </p>
                    </div>
                    <CreditCard className="h-8 w-8 text-white" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-card border-border/50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">New Content</p>
                      <p className="text-2xl font-bold text-foreground">{newContentCount}</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-white" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Your Subscriptions */}
            <Card className="bg-gradient-card border-border/50">
              <CardHeader>
                <CardTitle className="text-xl">Your Subscriptions</CardTitle>
                <CardDescription>
                  Manage your active creator subscriptions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <LoadingSpinner />
                  </div>
                ) : error ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Error loading subscriptions: {error}</p>
                  </div>
                ) : subscriptions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No active subscriptions yet.</p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center mt-4">
                      <Button variant="premium" asChild>
                        <Link to="/explore">Discover Creators</Link>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {subscriptions.map((subscription) => (
                      <div
                        key={subscription.id}
                        className="p-4 rounded-lg bg-muted/10 border border-border/50"
                      >
                        <div className="flex items-start gap-3 sm:items-center">
                          <Avatar className="w-12 h-12 flex-shrink-0">
                            <AvatarImage 
                              src={subscription.creator.avatar} 
                              alt={subscription.creator.username}
                              className="object-cover" 
                            />
                            <AvatarFallback className="text-sm">
                              {subscription.creator.display_name?.charAt(0) || subscription.creator.username.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">
                                  {subscription.creator.display_name || subscription.creator.username}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {subscription.tier.name}
                                </p>
                                <p className="text-xs font-medium text-foreground mt-1">
                                  GHS {subscription.tier.price}/month
                                </p>
                              </div>
                              <div className="flex flex-col sm:flex-row items-center gap-2">
                                <Badge variant={
                                  subscription.status === 'active' ? 'success' : 
                                  subscription.status === 'paused' ? 'secondary' : 'destructive'
                                } className="text-xs">
                                  {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                                </Badge>
                                <Button variant="outline" size="sm" className="w-full sm:w-auto" asChild>
                                  <Link to={`/creator/${subscription.creator.username}`}>
                                    View Profile
                                  </Link>
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
                      <Button variant="premium" asChild>
                        <Link to="/fan/subscriptions">Manage All Subscriptions</Link>
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="bg-gradient-card border-border/50">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-foreground mb-4">Quick Actions</h3>
                  <div className="space-y-3">
                    <Button variant="outline" className="w-full justify-start" asChild>
                      <Link to="/fan/feed">
                        <Calendar className="w-4 h-4 mr-2" />
                        View My Feed
                      </Link>
                    </Button>
                    <Button variant="outline" className="w-full justify-start" asChild>
                      <Link to="/explore">
                        <TrendingUp className="w-4 h-4 mr-2" />
                        Discover Creators
                      </Link>
                    </Button>
                    <Button variant="outline" className="w-full justify-start" asChild>
                      <Link to="/fan/messages">
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Messages
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-card border-border/50">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-foreground mb-4">Payment Info</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Next billing</span>
                      <span className="font-medium">
                        {subscriptions.length > 0 
                          ? new Date(subscriptions[0].current_period_end).toLocaleDateString()
                          : 'No active subscriptions'
                        }
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Payment method</span>
                      <span className="font-medium">•••• 4242</span>
                    </div>
                    <Button variant="outline" size="sm" className="w-full" asChild>
                      <Link to="/fan/payment">Update Payment Method</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Recent Activity */}
            <Card className="bg-gradient-card border-border/50 overflow-hidden">
              <CardHeader className="pb-0">
                <CardTitle className="text-lg">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {activityLoading ? (
                  <div className="px-6 py-8 text-center">
                    <LoadingSpinner />
                  </div>
                ) : recentActivity.length === 0 ? (
                  <div className="px-6 py-8 text-center text-muted-foreground">
                    <p className="text-sm">No recent activity</p>
                    <p className="text-xs">Subscribe to creators to see their latest posts</p>
                  </div>
                ) : (
                  <>
                    <div className="max-h-80 overflow-y-auto space-y-0 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
                      {(Array.isArray(recentActivity) ? recentActivity : [])
                      .slice(0, 5)
                      .map((activity, index) => (
                        <div key={activity.id} className="px-6 py-3 hover:bg-background/50 transition-colors border-b border-border/20 last:border-b-0">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={activity.avatar} alt={activity.creator} />
                              <AvatarFallback>{activity.creator.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm leading-relaxed">
                                <span className="font-medium">{activity.creator}</span>{' '}
                                <span className="text-muted-foreground">{activity.message}</span>
                              </p>
                              <p className="text-xs text-muted-foreground">{activity.time}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                      {recentActivity.length > 10 && (
                        <div className="px-6 py-3 text-center border-t border-border/20 bg-muted/10">
                          <p className="text-xs text-muted-foreground">
                            Showing 10 of {recentActivity.length} activities
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="px-6 py-3 bg-muted/20">
                      <Button variant="ghost" size="sm" className="w-full text-muted-foreground" asChild>
                        <Link to="/fan/feed">View all activity</Link>
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Recommendations */}
            <Card className="bg-gradient-card border-border/50">
              <CardHeader>
                <CardTitle className="text-lg">Recommended for You</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Discover new creators based on your interests
                </p>
                <Button variant="premium" size="sm" className="w-full" asChild>
                  <Link to="/explore">Explore Now</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </EdgeToEdgeContainer>
    </EdgeToEdgeContainer>
  );
};