import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

import { ArrowLeft, TrendingUp, Users, DollarSign, Eye, Heart, FileText } from 'lucide-react';

export const Analytics: React.FC = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState({
    subscribers: 0,
    monthlyEarnings: 0,
    totalEarnings: 0,
    growthRate: 0,
    engagementRate: 0,
    postsThisMonth: 0
  });
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [subscriberGrowth, setSubscriberGrowth] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // Add state for active tab

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      if (!user) return;

      try {
        setLoading(true);

        // Fetch analytics data
        const analyticsResponse = await fetch(`/api/creator/${user.id}/analytics`);
        if (analyticsResponse.ok) {
          const analyticsData = await analyticsResponse.json();
          setAnalytics(analyticsData);
        }

        // Fetch user content for performance analysis
        const contentResponse = await fetch(`/api/creator/${user.id}/content`);
        if (contentResponse.ok) {
          const contentData = await contentResponse.json();
          setUserPosts(contentData);
        }

        // Fetch subscriber data for growth trends
        const subscribersResponse = await fetch(`/api/creators/${user.id}/subscribers`);
        if (subscribersResponse.ok) {
          const subscribersData = await subscribersResponse.json();

          // Calculate monthly growth from subscriber data
          const currentDate = new Date();
          const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                         'July', 'August', 'September', 'October', 'November', 'December'];

          const monthlyGrowth = [];
          for (let i = 2; i >= 0; i--) {
            const targetMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
            const monthName = months[targetMonth.getMonth()];
            const monthlySubscribers = subscribersData.filter((sub: any) => {
              const subDate = new Date(sub.created_at);
              return subDate.getMonth() === targetMonth.getMonth() && 
                     subDate.getFullYear() === targetMonth.getFullYear();
            }).length;

            monthlyGrowth.push({
              month: monthName,
              subscribers: monthlySubscribers
            });
          }

          setSubscriberGrowth(monthlyGrowth);
        }

      } catch (error) {
        console.error('Error fetching analytics data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyticsData();
  }, [user]);

  // Calculate top performing posts
  const topPosts = userPosts
    .filter(post => post.status === 'published')
    .sort((a, b) => (b.likes_count + b.comments_count) - (a.likes_count + a.comments_count))
    .slice(0, 3);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 text-center sm:text-left">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Analytics Dashboard</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Track your performance and growth
          </p>
        </div>

        {/* Tab Navigation */}
        <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="mb-6">
              <TabsTrigger value="overview">
                Overview
              </TabsTrigger>
              <TabsTrigger value="content">
                Content
              </TabsTrigger>
              <TabsTrigger value="audience">
                Audience
              </TabsTrigger>
              <TabsTrigger value="revenue">
                Revenue
              </TabsTrigger>
            </TabsList>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-card border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Subscribers</p>
                  <p className="text-2xl font-bold text-foreground">{analytics.subscribers.toLocaleString()}</p>
                  <p className="text-xs text-success">+{analytics.growthRate}% this month</p>
                </div>
                <Users className="h-8 w-8 text-white opacity-70" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Engagement Rate</p>
                  <p className="text-2xl font-bold text-foreground">{analytics.engagementRate}%</p>
                  <p className="text-xs text-success">+5.2% this month</p>
                </div>
                <Heart className="h-8 w-8 text-white opacity-70" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Posts This Month</p>
                  <p className="text-2xl font-bold text-foreground">{analytics.postsThisMonth}</p>
                  <p className="text-xs text-success">+{Math.round((analytics.postsThisMonth / Math.max(analytics.postsThisMonth - 2, 1)) * 100 - 100)}% vs last month</p>
                </div>
                <FileText className="h-8 w-8 text-white opacity-70" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Monthly Earnings</p>
                  <p className="text-2xl font-bold text-foreground">GHS {parseFloat(analytics.monthlyEarnings || 0).toFixed(2)}</p>
                  <p className="text-xs text-success">+{analytics.growthRate}% vs last month</p>
                </div>
                <DollarSign className="h-8 w-8 text-white opacity-70" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="bg-gradient-card border-border/50">
            <CardHeader>
              <CardTitle>Content Performance</CardTitle>
              <CardDescription>Your top performing posts this month</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {topPosts.length > 0 ? (
                topPosts.map((post, index) => {
                  const engagement = post.likes_count + post.comments_count;
                  const maxEngagement = Math.max(...topPosts.map(p => p.likes_count + p.comments_count), 1);
                  const percentage = Math.round((engagement / maxEngagement) * 100);

                  return (
                    <div key={post.id} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium truncate max-w-[200px]">{post.title}</span>
                        <span className="text-sm text-muted-foreground">{engagement} interactions</span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  );
                })
              ) : (
                <div className="text-center text-muted-foreground py-4">
                  <p>No published posts yet</p>
                  <p className="text-xs">Create some content to see performance data</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-border/50">
            <CardHeader>
              <CardTitle>Subscriber Growth</CardTitle>
              <CardDescription>Monthly subscriber trends</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {subscriberGrowth.length > 0 ? (
                  subscriberGrowth.map((monthData, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm">{monthData.month}</span>
                      <span className="text-sm font-medium">+{monthData.subscribers} subscribers</span>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-muted-foreground py-4">
                    <p>No subscriber data available</p>
                    <p className="text-xs">Growth trends will appear as you gain subscribers</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        </Tabs>
      </div>
    </div>
  );
};