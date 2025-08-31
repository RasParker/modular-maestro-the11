import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { EdgeToEdgeContainer } from '@/components/layout/EdgeToEdgeContainer';
import { useAuth } from '@/contexts/AuthContext';
import { NotificationTester } from '@/components/admin/NotificationTester';
import { useQuery } from '@tanstack/react-query';
import { 
  Shield, 
  Users, 
  DollarSign, 
  AlertTriangle, 
  TrendingUp, 
  FileText,
  Settings,
  BarChart3,
  Crown,
  Flag,
  Palette // Import Palette for category icon
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();

  // Fetch platform statistics
  const { data: platformStats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/admin/platform-stats'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch top creators
  const { data: topCreators, isLoading: creatorsLoading } = useQuery({
    queryKey: ['/api/admin/top-creators'],
    refetchInterval: 60000, // Refresh every minute
  });

  // Fetch recent reports
  const { data: recentReports, isLoading: reportsLoading } = useQuery({
    queryKey: ['/api/reports'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch system health data
  const { data: systemHealth, isLoading: systemHealthLoading } = useQuery({
    queryKey: ['/api/admin/system-health'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Use real data or fallback to show loading state
  const stats = platformStats || {
    totalUsers: 0,
    totalCreators: 0,
    totalFans: 0,
    monthlyRevenue: 0,
    platformFees: 0,
    activeSubscriptions: 0,
    contentModeration: { pending: 0, approved: 0, rejected: 0 }
  };

  const creators = Array.isArray(topCreators) ? topCreators : [];
  const reports = Array.isArray(recentReports) ? recentReports.slice(0, 3) : [];

  return (
    <EdgeToEdgeContainer>
      {/* Hero Section - Full Width */}
      <div className="bg-gradient-to-r from-primary/10 via-red-500/5 to-primary/10 border-b border-border">
        <EdgeToEdgeContainer maxWidth="7xl" enablePadding enableTopPadding>
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <h1 className="text-4xl sm:text-5xl font-bold text-foreground">
                Admin Dashboard
              </h1>
            </div>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Welcome back, {user?.username}! Platform overview and management tools
            </p>
          </div>
        </EdgeToEdgeContainer>
      </div>

      {/* Main Content */}
      <EdgeToEdgeContainer maxWidth="7xl" enablePadding className="py-6 sm:py-8">

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Key Metrics */}
          <div className="lg:col-span-4 grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card className="bg-gradient-card border-border/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                    {statsLoading ? (
                      <div className="h-8 w-20 bg-muted animate-pulse rounded"></div>
                    ) : (
                      <p className="text-2xl font-bold text-foreground">{stats.totalUsers.toLocaleString()}</p>
                    )}
                    <p className="text-xs text-success">Real-time data</p>
                  </div>
                  <Users className="h-8 w-8 text-primary" strokeWidth={1} />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-border/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Platform Revenue</p>
                    {statsLoading ? (
                      <div className="h-8 w-24 bg-muted animate-pulse rounded"></div>
                    ) : (
                      <p className="text-2xl font-bold text-foreground">GHS {stats.platformFees.toLocaleString()}</p>
                    )}
                    <p className="text-xs text-success">15% commission</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-accent" strokeWidth={1} />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-border/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Active Creators</p>
                    {statsLoading ? (
                      <div className="h-8 w-16 bg-muted animate-pulse rounded"></div>
                    ) : (
                      <p className="text-2xl font-bold text-foreground">{stats.totalCreators.toLocaleString()}</p>
                    )}
                    <p className="text-xs text-success">Live count</p>
                  </div>
                  <Crown className="h-8 w-8 text-accent" strokeWidth={1} />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-border/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Pending Reports</p>
                    {statsLoading ? (
                      <div className="h-8 w-12 bg-muted animate-pulse rounded"></div>
                    ) : (
                      <p className="text-2xl font-bold text-foreground">{stats.contentModeration.pending}</p>
                    )}
                    <p className="text-xs text-warning">Needs attention</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-warning" strokeWidth={1} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Quick Actions */}
            <Card className="bg-gradient-card border-border/50">
              <CardHeader className="text-center sm:text-left">
                <CardTitle>Admin Actions</CardTitle>
                <CardDescription>Manage platform operations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <Button size="lg" className="h-20 flex-col gap-3 px-4" asChild>
                    <Link to="/admin/users">
                      <Users className="w-6 h-6" />
                      Manage Users
                    </Link>
                  </Button>
                  <Button variant="outline" size="lg" className="h-20 flex-col gap-3 px-4" asChild>
                    <Link to="/admin/content">
                      <FileText className="w-6 h-6" />
                      Review Content
                    </Link>
                  </Button>
                  <Button variant="outline" size="lg" className="h-20 flex-col gap-3 px-4 relative" asChild>
                    <Link to="/admin/reports">
                      <Flag className="w-6 h-6" />
                      Reports
                      {stats.contentModeration.pending > 0 && (
                        <Badge variant="destructive" className="absolute -top-2 -right-2 px-2 py-1 text-xs">
                          {stats.contentModeration.pending}
                        </Badge>
                      )}
                    </Link>
                  </Button>
                  <Button variant="outline" size="lg" className="h-20 flex-col gap-3 px-4" asChild>
                    <Link to="/admin/analytics">
                      <BarChart3 className="w-6 h-6" />
                      Analytics
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Content Moderation Overview */}
            <Card className="bg-gradient-card border-border/50">
              <CardHeader className="text-center sm:text-left">
                <CardTitle>Content Moderation</CardTitle>
                <CardDescription>Review status and pending items</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="text-center p-4 rounded-lg border border-border/50">
                    {statsLoading ? (
                      <div className="h-8 w-8 bg-muted animate-pulse rounded mx-auto mb-2"></div>
                    ) : (
                      <p className="text-2xl font-bold text-warning">{stats.contentModeration.pending}</p>
                    )}
                    <p className="text-sm text-muted-foreground">Pending Review</p>
                  </div>
                  <div className="text-center p-4 rounded-lg border border-border/50">
                    {statsLoading ? (
                      <div className="h-8 w-8 bg-muted animate-pulse rounded mx-auto mb-2"></div>
                    ) : (
                      <p className="text-2xl font-bold text-success">{stats.contentModeration.approved}</p>
                    )}
                    <p className="text-sm text-muted-foreground">Approved</p>
                  </div>
                  <div className="text-center p-4 rounded-lg border border-border/50">
                    {statsLoading ? (
                      <div className="h-8 w-8 bg-muted animate-pulse rounded mx-auto mb-2"></div>
                    ) : (
                      <p className="text-2xl font-bold text-destructive">{stats.contentModeration.rejected}</p>
                    )}
                    <p className="text-sm text-muted-foreground">Rejected</p>
                  </div>
                </div>
                <Button variant="outline" className="w-full" asChild>
                  <Link to="/admin/content">Review Pending Content</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Top Creators */}
            <Card className="bg-gradient-card border-border/50">
              <CardHeader className="text-center sm:text-left">
                <CardTitle>Top Performing Creators</CardTitle>
                <CardDescription>Highest earning creators this month</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {creatorsLoading ? (
                  Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="flex items-center justify-between p-4 rounded-lg border border-border/50">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-muted animate-pulse rounded-full"></div>
                        <div>
                          <div className="h-4 w-24 bg-muted animate-pulse rounded mb-1"></div>
                          <div className="h-3 w-16 bg-muted animate-pulse rounded"></div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="h-4 w-20 bg-muted animate-pulse rounded mb-1"></div>
                        <div className="h-3 w-16 bg-muted animate-pulse rounded"></div>
                      </div>
                    </div>
                  ))
                ) : creators.length > 0 ? (
                  creators.map((creator, index) => (
                    <div key={creator.id} className="flex items-center justify-between p-4 rounded-lg border border-border/50">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{creator.display_name}</p>
                          <p className="text-sm text-muted-foreground">@{creator.username}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">GHS {creator.monthly_revenue.toLocaleString()}</p>
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-muted-foreground">{creator.subscribers} subscribers</p>
                          <Badge variant={creator.status === 'verified' ? 'default' : 'outline'}>
                            {creator.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No creator data available yet
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Recent Reports */}
            <Card className="bg-gradient-card border-border/50">
              <CardHeader className="text-center sm:text-left">
                <CardTitle className="text-lg">Recent Reports</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {reportsLoading ? (
                  Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="p-3 rounded-lg border border-border/50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="h-4 w-16 bg-muted animate-pulse rounded"></div>
                        <div className="h-3 w-12 bg-muted animate-pulse rounded"></div>
                      </div>
                      <div className="h-4 w-full bg-muted animate-pulse rounded mb-1"></div>
                      <div className="h-3 w-20 bg-muted animate-pulse rounded"></div>
                    </div>
                  ))
                ) : reports.length > 0 ? (
                  reports.map((report: any) => (
                    <div key={report.id} className="p-3 rounded-lg border border-border/50">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant={
                          report.status === 'pending' ? 'destructive' :
                          report.status === 'under_review' ? 'secondary' : 'default'
                        }>
                          {report.status.replace('_', ' ')}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(report.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm font-medium">{report.reason}</p>
                      <p className="text-xs text-muted-foreground">
                        Target: {report.target_name || report.target_id}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No recent reports
                  </div>
                )}
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link to="/admin/reports">View All Reports</Link>
                </Button>
              </CardContent>
            </Card>

            {/* System Health */}
            <Card className="bg-gradient-card border-border/50">
              <CardHeader className="text-center sm:text-left">
                <CardTitle className="text-lg">System Health</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {systemHealthLoading ? (
                  Array.from({ length: 3 }).map((_, index) => (
                    <div key={index}>
                      <div className="flex justify-between text-sm mb-2">
                        <div className="h-4 w-24 bg-muted animate-pulse rounded"></div>
                        <div className="h-4 w-8 bg-muted animate-pulse rounded"></div>
                      </div>
                      <div className="h-2 w-full bg-muted animate-pulse rounded"></div>
                    </div>
                  ))
                ) : (
                  <>
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Server Performance</span>
                        <span>{systemHealth?.server_performance || 0}%</span>
                      </div>
                      <Progress value={systemHealth?.server_performance || 0} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Database Health</span>
                        <span>{systemHealth?.database_health || 0}%</span>
                      </div>
                      <Progress value={systemHealth?.database_health || 0} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>API Response Time</span>
                        <span>{systemHealth?.api_response_time || 0}ms</span>
                      </div>
                      <Progress value={Math.min((1000 - (systemHealth?.api_response_time || 1000)) / 10, 100)} className="h-2" />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Platform Settings */}
            <Card className="bg-gradient-card border-border/50">
              <CardHeader className="text-center sm:text-left">
                <CardTitle className="text-lg">Platform Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4 text-center sm:text-left">
                  Configure platform-wide settings and policies
                </p>
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link to="/admin/settings">
                    <Settings className="w-4 h-4 mr-2" />
                    Manage Settings
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Notification Testing */}
            <NotificationTester />
          </div>
        </div>
      </EdgeToEdgeContainer>
    </EdgeToEdgeContainer>
  );
};