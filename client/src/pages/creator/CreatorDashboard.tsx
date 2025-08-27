import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { EdgeToEdgeContainer } from '@/components/layout/EdgeToEdgeContainer';
import { DashboardHeader } from '@/components/creator/DashboardHeader';
import { QuickActionsGrid } from '@/components/creator/QuickActionsGrid';
import { ContentScheduleCard } from '@/components/creator/ContentScheduleCard';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart3,
  TrendingUp,
  Users,
  DollarSign,
  Plus,
  Calendar,
  FileText,
  Settings,
  Heart,
  User,
  Crown,
  Eye,
  MessageSquare,
  Image,
  Video,
  Clock
} from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"

export const CreatorDashboard: React.FC = () => {
  const { user } = useAuth();

  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [scheduledContent, setScheduledContent] = useState<any[]>([]);
  const [recentSubscribers, setRecentSubscribers] = useState<any[]>([]);
  const [tierPerformance, setTierPerformance] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState({
    subscribers: 0,
    monthlyEarnings: 0,
    totalEarnings: 0,
    growthRate: 0,
    engagementRate: 0,
    postsThisMonth: 0
  });
  const [monthlyGoals, setMonthlyGoals] = useState({
    subscriberGoal: 0,
    revenueGoal: 0,
    postsGoal: 0,
    currentSubscribers: 0,
    currentRevenue: 0,
    currentPosts: 0
  });

  // Use React Query for monthly goals
  const { data: goalsData, refetch: refetchGoals } = useQuery({
    queryKey: ['creator', user?.id, 'goals'],
    queryFn: async () => {
      if (!user) return null;
      const response = await fetch(`/api/creator/${user.id}/goals`);
      if (response.ok) {
        const data = await response.json();
        return data;
      }
      return null;
    },
    enabled: !!user
  });

  const fetchUserPosts = async () => {
    if (!user) return;

    try {
      const response = await fetch(`/api/creator/${user.id}/content`);
      if (response.ok) {
        const posts = await response.json();
        
        const scheduled = posts.filter((post: any) =>
          post.status === 'scheduled' ||
          (post.scheduled_for && new Date(post.scheduled_for) > new Date())
        );
        setScheduledContent(scheduled);

        const publishedPosts = posts.filter((post: any) =>
          post.status === 'published'
        );
        setUserPosts(publishedPosts);
      }

      // Fetch analytics
      const analyticsResponse = await fetch(`/api/creator/${user.id}/analytics`);
      let analyticsData = { subscribers: 0, monthlyEarnings: 0, totalEarnings: 0, growthRate: 0, engagementRate: 0, postsThisMonth: 0 };
      if (analyticsResponse.ok) {
        analyticsData = await analyticsResponse.json();
        setAnalytics({
          subscribers: analyticsData.subscribers || 0,
          monthlyEarnings: analyticsData.monthlyEarnings || 0,
          totalEarnings: analyticsData.totalEarnings || 0,
          growthRate: analyticsData.growthRate || 0,
          engagementRate: analyticsData.engagementRate || 0,
          postsThisMonth: analyticsData.postsThisMonth || 0
        });
      }

      // Fetch recent subscribers
      try {
        const subscribersResponse = await fetch(`/api/creators/${user.id}/subscribers?limit=3&recent=true`);
        if (subscribersResponse.ok) {
          const subscribers = await subscribersResponse.json();
          setRecentSubscribers(subscribers);
        }
      } catch (error) {
        console.error('Error fetching subscribers:', error);
      }

      // Fetch tier performance data
      try {
        const tierPerformanceResponse = await fetch(`/api/creator/${user.id}/tier-performance`);
        if (tierPerformanceResponse.ok) {
          const tierData = await tierPerformanceResponse.json();
          setTierPerformance(tierData);
        }
      } catch (error) {
        console.error('Error fetching tier performance:', error);
      }
    } catch (error) {
      console.error('Error fetching user posts:', error);
    }
  };

  useEffect(() => {
    fetchUserPosts();
  }, [user]);

  useEffect(() => {
    if (goalsData) {
      setMonthlyGoals({
        subscriberGoal: goalsData.subscriberGoal || 30,
        revenueGoal: goalsData.revenueGoal || 1000,
        postsGoal: goalsData.postsGoal || 15,
        currentSubscribers: analytics.subscribers || 0,
        currentRevenue: analytics.monthlyEarnings || 0,
        currentPosts: analytics.postsThisMonth || 0
      });
    }
  }, [goalsData, analytics]);

  return (
    <EdgeToEdgeContainer>
      {/* Hero Section - Full Width */}
      <div className="bg-gradient-to-r from-accent/10 via-primary/5 to-accent/10 border-b border-border">
        <EdgeToEdgeContainer maxWidth="7xl" enablePadding enableTopPadding>
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Crown className="w-10 h-10 text-primary" />
              <h1 className="text-4xl sm:text-5xl font-bold text-foreground">
                Creator Dashboard
              </h1>
            </div>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Welcome back, {user?.username}! Here's your creator overview
            </p>
          </div>
        </EdgeToEdgeContainer>
      </div>

      {/* Main Content */}
      <EdgeToEdgeContainer maxWidth="7xl" enablePadding className="py-6 sm:py-8">
        <div className="grid lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Key Metrics */}
          <div className="lg:col-span-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
            <Card className="bg-gradient-card border-border/50">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total Subscribers</p>
                    <p className="text-xl sm:text-2xl font-bold text-foreground">{analytics.subscribers.toLocaleString()}</p>
                    <p className="text-xs text-success">+{analytics.growthRate}% this month</p>
                  </div>
                  <Users className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-border/50">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground">Monthly Earnings</p>
                    <p className="text-xl sm:text-2xl font-bold text-foreground">GHS {analytics.monthlyEarnings.toLocaleString()}</p>
                    <p className="text-xs text-success">+{analytics.growthRate}% vs last month</p>
                  </div>
                  <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-accent" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-border/50">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total Earnings</p>
                    <p className="text-xl sm:text-2xl font-bold text-foreground">GHS {analytics.totalEarnings.toLocaleString()}</p>
                    <p className="text-xs text-success">All time</p>
                  </div>
                  <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-success" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-border/50">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground">Engagement Rate</p>
                    <p className="text-xl sm:text-2xl font-bold text-foreground">{analytics.engagementRate}%</p>
                    <p className="text-xs text-success">Above average</p>
                  </div>
                  <Heart className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-4 sm:space-y-6">
            <QuickActionsGrid />

            {/* Subscription Tiers Performance */}
            <Card className="bg-gradient-card border-border/50">
              <CardHeader>
                <CardTitle className="text-base sm:text-xl">Subscription Tiers Performance</CardTitle>
                <CardDescription className="text-sm">Revenue breakdown by tier</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {tierPerformance.length > 0 ? (
                  tierPerformance.map((tier) => (
                    <div key={tier.name} className="space-y-2">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline" className="text-xs">{tier.name}</Badge>
                          <span className="text-sm text-muted-foreground">GHS {tier.price}/month</span>
                        </div>
                        <div className="text-left sm:text-right">
                          <p className="text-sm font-medium">{tier.subscribers} subscribers</p>
                          <p className="text-xs text-muted-foreground">GHS {tier.revenue.toLocaleString()}/month</p>
                        </div>
                      </div>
                      <Progress
                        value={analytics.subscribers > 0 ? (tier.subscribers / analytics.subscribers) * 100 : 0}
                        className="h-2"
                      />
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6">
                    <BarChart3 className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No subscription tiers found</p>
                    <p className="text-xs text-muted-foreground mb-4">Create subscription tiers to start earning revenue</p>
                    <Button variant="outline" size="sm" className="mt-2" asChild>
                      <Link to="/creator/tiers">Create Tiers</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Scheduled Content and Recent Posts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <Card className="bg-gradient-card border-border/50">
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg">Scheduled Content</CardTitle>
                  <CardDescription className="text-sm">
                    {scheduledContent.length} {scheduledContent.length === 1 ? 'post' : 'posts'} scheduled
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {scheduledContent.length > 0 ? (
                    <>
                      {scheduledContent.slice(0, 3).map((post) => (
                        <div key={post.id} className="flex items-center gap-3 p-2 rounded-lg bg-background/50">
                          <div className="w-2 h-2 rounded-full bg-accent flex-shrink-0"></div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate" title={post.title || post.caption}>
                              {post.title || post.caption || 'Untitled Post'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {post.scheduled_for ? 
                                new Date(post.scheduled_for).toLocaleDateString('en-US', { 
                                  month: 'short', 
                                  day: 'numeric', 
                                  year: 'numeric' 
                                }) : 
                                'Not scheduled'
                              }
                            </p>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {post.tier || 'Free'}
                          </Badge>
                        </div>
                      ))}
                      {scheduledContent.length > 3 && (
                        <p className="text-xs text-muted-foreground text-center">
                          +{scheduledContent.length - 3} more
                        </p>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-4">
                      <Clock className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No scheduled content</p>
                    </div>
                  )}
                  <Button variant="outline" size="sm" className="w-full mt-3" asChild>
                    <Link to="/creator/manage-content">
                      <Calendar className="w-4 h-4 mr-2" />
                      Manage Content
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-gradient-card border-border/50">
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg">Recent Posts</CardTitle>
                  <CardDescription className="text-sm">
                    {userPosts.length} {userPosts.length === 1 ? 'post' : 'posts'} published
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {userPosts.length > 0 ? (
                    <>
                      {userPosts.slice(0, 3).map((post) => (
                        <div key={post.id} className="flex items-center gap-3 p-2 rounded-lg bg-background/50">
                          <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0"></div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate" title={post.title || post.content}>
                              {post.title || post.content || 'Untitled Post'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {post.created_at ? 
                                new Date(post.created_at).toLocaleDateString('en-US', { 
                                  month: 'short', 
                                  day: 'numeric', 
                                  year: 'numeric' 
                                }) : 
                                'No date'
                              }
                            </p>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {post.tier || 'Free'}
                          </Badge>
                        </div>
                      ))}
                      {userPosts.length > 3 && (
                        <p className="text-xs text-muted-foreground text-center">
                          +{userPosts.length - 3} more
                        </p>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-4">
                      <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No posts yet</p>
                    </div>
                  )}
                  <Button variant="outline" size="sm" className="w-full mt-3" asChild>
                    <Link to="/creator/upload">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Post
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4 sm:space-y-6">
            {/* Recent Subscribers */}
            <Card className="bg-gradient-card border-border/50">
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">Recent Subscribers</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentSubscribers.length > 0 ? (
                  recentSubscribers.map((subscriber) => (
                    <div key={subscriber.id} className="flex items-center gap-3">
                      <Avatar className="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0">
                        <AvatarImage
                          src={subscriber.fan?.avatar || subscriber.avatar}
                          alt={subscriber.fan?.username || subscriber.username}
                        />
                        <AvatarFallback className="text-xs">
                          {(subscriber.fan?.username || subscriber.username)?.charAt(0)?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {subscriber.fan?.username || subscriber.username}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          {subscriber.tier_name || subscriber.tier || 'Subscriber'}
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6">
                    <Users className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No subscribers yet</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Monthly Goals */}
            <Card className="bg-gradient-card border-border/50">
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">Monthly Goals</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Subscribers</span>
                    <span className="text-sm font-medium">{monthlyGoals.currentSubscribers}/{monthlyGoals.subscriberGoal}</span>
                  </div>
                  <Progress value={(monthlyGoals.currentSubscribers / monthlyGoals.subscriberGoal) * 100} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Revenue</span>
                    <span className="text-sm font-medium">GHS {monthlyGoals.currentRevenue}/{monthlyGoals.revenueGoal}</span>
                  </div>
                  <Progress value={(monthlyGoals.currentRevenue / monthlyGoals.revenueGoal) * 100} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Posts</span>
                    <span className="text-sm font-medium">{monthlyGoals.currentPosts}/{monthlyGoals.postsGoal}</span>
                  </div>
                  <Progress value={(monthlyGoals.currentPosts / monthlyGoals.postsGoal) * 100} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* Profile Settings */}
            <Card className="bg-gradient-card border-border/50">
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">Profile</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Keep your profile updated to attract more subscribers
                </p>
                <div className="space-y-2">
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <Link to={`/creator/${user?.username}`}>
                      <User className="w-4 h-4 mr-2" />
                      View My Profile
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <Link to="/creator/settings">
                      <Settings className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </EdgeToEdgeContainer>
    </EdgeToEdgeContainer>
  );
};