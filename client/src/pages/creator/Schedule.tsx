import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AppLayout } from '@/components/layout/AppLayout';
import { ContentScheduleCard } from '@/components/creator/ContentScheduleCard';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus,
  Calendar,
  BarChart3,
  Clock,
  TrendingUp,
  ArrowLeft,
  FileText
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

interface ScheduledPost {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  type: 'Image' | 'Video' | 'Text';
  tier: string;
  status: 'Scheduled' | 'Draft';
  thumbnail?: string;
}

const PUBLISHING_TIPS = [
  'Post consistently to keep subscribers engaged',
  'Schedule posts during peak engagement hours',
  'Mix different content types for variety'
];

const BEST_TIMES = [
  { period: 'Weekdays', time: '2-4 PM' },
  { period: 'Weekends', time: '10 AM-12 PM' },
  { period: 'Evenings', time: '7-9 PM' }
];

export const Schedule: React.FC = () => {
  const [activeTab, setActiveTab] = useState('upcoming');
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    scheduled: 0,
    draft: 0,
    thisWeek: 0
  });
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch scheduled posts
  useEffect(() => {
    const fetchScheduledPosts = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const response = await fetch(`/api/creator/${user.id}/content`);
        console.log('Schedule API response status:', response.status);
        if (response.ok) {
          const allPosts = await response.json();

          console.log('Schedule - All posts received:', allPosts);
          console.log('Schedule - Posts array length:', allPosts.length);

          // Filter for scheduled and draft posts and transform data
          const scheduledAndDraftPosts = allPosts
            .filter((post: any) => {
              console.log(`Post ${post.id} status: "${post.status}"`);
              const isScheduledOrDraft = post.status === 'scheduled' || post.status === 'draft';
              console.log(`Post ${post.id} matches filter: ${isScheduledOrDraft}`);
              return isScheduledOrDraft;
            })
            .map((post: any) => {
              console.log(`Processing post ${post.id}:`, post);

              // For scheduled posts, use scheduledFor if available
              let displayDate;
              let displayTime;

              if (post.status === 'Scheduled' && post.scheduledFor) {
                const displayDateTime = new Date(post.scheduledFor);
                displayDate = displayDateTime.toLocaleDateString();
                displayTime = displayDateTime.toLocaleTimeString('en-US', { 
                  hour: '2-digit', 
                  minute: '2-digit',
                  hour12: false 
                });
                console.log(`Scheduled post ${post.id} time:`, displayDate, displayTime);
              } else if (post.status === 'Scheduled' && !post.scheduledFor) {
                displayDate = 'Not scheduled';
                displayTime = '';
              } else {
                // Draft posts - show creation date
                displayDate = post.date;
                displayTime = '';
              }

              const transformedPost = {
                id: post.id.toString(),
                title: post.caption || 'Untitled Post',
                description: post.caption || '',
                date: displayDate,
                time: displayTime,
                type: post.type,
                tier: post.tier || 'Free',
                status: post.status,
                thumbnail: post.mediaPreview,
                scheduledFor: post.scheduledFor
              };

              console.log(`Transformed post ${post.id}:`, transformedPost);
              return transformedPost;
            });

          console.log('Final scheduled and draft posts:', scheduledAndDraftPosts);
          setScheduledPosts(scheduledAndDraftPosts);

          // Calculate stats
          const scheduled = scheduledAndDraftPosts.filter(p => p.status === 'scheduled').length;
          const draft = scheduledAndDraftPosts.filter(p => p.status === 'draft').length;

          console.log('Stats - Scheduled:', scheduled, 'Draft:', draft);

          // Calculate posts for this week (simplified - just count all for now)
          const thisWeek = scheduledAndDraftPosts.length;

          setStats({
            scheduled,
            draft,
            thisWeek
          });
        }
      } catch (error) {
        console.error('Error fetching scheduled posts:', error);
        toast({
          title: "Error",
          description: "Failed to load scheduled posts.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchScheduledPosts();
  }, [user, toast]);

  const handleEdit = (id: string) => {
    navigate(`/creator/edit-post/${id}`);
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/posts/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setScheduledPosts(prev => prev.filter(post => post.id !== id));
        toast({
          title: "Post deleted",
          description: "The scheduled post has been deleted.",
        });
      } else {
        throw new Error('Failed to delete post');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete post.",
        variant: "destructive"
      });
    }
  };

  const handlePublish = async (id: string) => {
    try {
      const response = await fetch(`/api/posts/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'published'
        })
      });

      if (response.ok) {
        setScheduledPosts(prev => prev.filter(post => post.id !== id));
        toast({
          title: "Post published",
          description: "The post has been published immediately.",
        });
      } else {
        throw new Error('Failed to publish post');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to publish post.",
        variant: "destructive"
      });
    }
  };

  const QUICK_STATS = [
    { label: 'Scheduled posts', value: stats.scheduled.toString(), icon: Calendar },
    { label: 'Draft posts', value: stats.draft.toString(), icon: Clock },
    { label: 'This week', value: stats.thisWeek.toString(), icon: TrendingUp }
  ];

  if (loading) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-sm text-muted-foreground">Loading scheduled content...</p>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {/* Mobile-Optimized Header */}
          <div className="space-y-4">
            {/* Back Button */}
            <Button variant="ghost" size="sm" asChild className="w-fit">
              <Link to="/creator/dashboard" className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Back to Dashboard</span>
                <span className="sm:hidden">Back</span>
              </Link>
            </Button>

            {/* Title Section */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
                  <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Content Schedule</h1>
                </div>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Manage your scheduled and draft content
                </p>
              </div>

              <Button 
                className="bg-gradient-primary text-white w-full sm:w-auto"
                asChild
              >
                <Link to="/creator/upload">
                  <Plus className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Create New Post</span>
                  <span className="sm:hidden">Create Post</span>
                </Link>
              </Button>
            </div>
          </div>

          {/* Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            {/* Mobile-Friendly Tab List */}
            <TabsList className="grid w-full grid-cols-2 h-auto">
              <TabsTrigger value="upcoming" className="text-sm py-2">
                Upcoming Posts
                <span className="ml-2 bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs">
                  {scheduledPosts.filter(p => p.status === 'scheduled').length}
                </span>
              </TabsTrigger>
              <TabsTrigger value="insights" className="text-sm py-2">
                Insights
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming" className="space-y-4">
              {/* Post Count */}
              <div className="text-sm text-muted-foreground">
                {scheduledPosts.length} posts in queue
              </div>

              {/* Posts List - Mobile-Optimized */}
              <div className="space-y-4">
                {scheduledPosts.length > 0 ? (
                  scheduledPosts.length > 2 ? (
                    <ScrollArea className="h-[500px] w-full">
                      <div className="space-y-4 pr-4">
                        {scheduledPosts.map((post) => (
                          <ContentScheduleCard
                            key={post.id}
                            {...post}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            onPublish={handlePublish}
                          />
                        ))}
                      </div>
                    </ScrollArea>
                  ) : (
                    <div className="space-y-4">
                      {scheduledPosts.map((post) => (
                        <ContentScheduleCard
                          key={post.id}
                          {...post}
                          onEdit={handleEdit}
                          onDelete={handleDelete}
                          onPublish={handlePublish}
                        />
                      ))}
                    </div>
                  )
                ) : (
                  <Card className="bg-gradient-card border-border/50">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <FileText className="w-12 h-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium text-foreground mb-2">No scheduled content</h3>
                      <p className="text-muted-foreground text-center mb-4">Schedule posts to publish them automatically</p>
                      <Button asChild>
                        <Link to="/creator/upload">Create Content</Link>
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="insights" className="space-y-6">
              {/* Quick Stats - Mobile Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {QUICK_STATS.map((stat, index) => {
                  const Icon = stat.icon;
                  return (
                    <Card key={index} className="bg-gradient-card border-border/50">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">
                              {stat.label}
                            </p>
                            <p className="text-2xl font-bold text-foreground">
                              {stat.value}
                            </p>
                          </div>
                          <Icon className="h-6 w-6 text-white opacity-70" />
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Tips and Best Times - Stacked on Mobile */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Publishing Tips */}
                <Card className="bg-gradient-card border-border/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-primary" />
                      Publishing Tips
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {PUBLISHING_TIPS.map((tip, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                        <p className="text-sm text-muted-foreground">{tip}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Best Times */}
                <Card className="bg-gradient-card border-border/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Clock className="w-5 h-5 text-primary" />
                      Best Times to Post
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {BEST_TIMES.map((time, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">
                          {time.period}
                        </span>
                        <span className="text-sm font-medium text-foreground">
                          {time.time}
                        </span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppLayout>
  );
};