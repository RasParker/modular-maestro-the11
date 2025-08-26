import React, { useState, useEffect } from 'react';
// UI Updates Applied: Transparency removal - Jan 27 2025
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { EdgeToEdgeContainer } from '@/components/layout/EdgeToEdgeContainer';
import { CommentSection } from '@/components/fan/CommentSection';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Heart, MessageSquare, MessageCircle, Calendar, Eye, Share2, Share, ArrowLeft, Image, Video, Music, FileText, Loader2, Grid3X3, List, MoreVertical } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const MOCK_FEED = [
  {
    id: '1',
    creator: {
      username: 'artisticmia',
      display_name: 'Artistic Mia',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b5fd?w=150&h=150&fit=crop&crop=face'
    },
    content: 'Just finished my latest series of fantasy warrior illustrations! This collection took me 3 weeks to complete and features 12 unique characters.',
    type: 'image',
    tier: 'Fan',
    thumbnail: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&h=300&fit=crop',
    posted: '2024-02-19T10:30:00',
    likes: 142,
    comments: 28,
    views: 1250,
    liked: false,
    initialComments: [
      {
        id: '1',
        user: {
          id: '2',
          username: 'artlover123',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
        },
        content: 'Amazing work! The detail in these characters is incredible. How long did each one take?',
        likes: 5,
        liked: false,
        createdAt: '2024-02-19T11:00:00',
        replies: [
          {
            id: '2',
            user: {
              id: '1',
              username: 'artisticmia',
              avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b5fd?w=150&h=150&fit=crop&crop=face'
            },
            content: 'Thank you! Each character took about 6-8 hours. The armor details were the most time-consuming part.',
            likes: 2,
            liked: false,
            createdAt: '2024-02-19T11:30:00',
            replies: []
          },
          {
            id: '5',
            user: {
              id: '3',
              username: 'digitalart_fan',
              avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face'
            },
            content: 'The armor textures look so realistic! What software do you use for the detail work?',
            likes: 1,
            liked: false,
            createdAt: '2024-02-19T12:15:00',
            replies: []
          }
        ]
      },
      {
        id: '6',
        user: {
          id: '4',
          username: 'fantasy_enthusiast',
          avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face'
        },
        content: 'Love the fantasy theme! The character designs remind me of classic D&D artwork. Are you planning to create a whole campaign setting?',
        likes: 8,
        liked: true,
        createdAt: '2024-02-19T13:00:00',
        replies: [
          {
            id: '7',
            user: {
              id: '1',
              username: 'artisticmia',
              avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b5fd?w=150&h=150&fit=crop&crop=face'
            },
            content: 'That\'s actually a great idea! I\'ve been thinking about creating a comprehensive world with these characters. Maybe I should start working on background lore and maps.',
            likes: 4,
            liked: false,
            createdAt: '2024-02-19T13:30:00',
            replies: []
          }
        ]
      }
    ]
  },
  {
    id: '2',
    creator: {
      username: 'fitnessking',
      display_name: 'Fitness King',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
    },
    content: 'Starting the week strong with an intense upper body workout! Follow along for maximum gains. Remember to warm up properly!',
    type: 'video',
    tier: 'Supporter',
    thumbnail: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
    posted: '2024-02-19T07:00:00',
    likes: 89,
    comments: 15,
    views: 892,
    liked: true,
    initialComments: [
      {
        id: '3',
        user: {
          id: '3',
          username: 'fitnessfan',
          avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face'
        },
        content: 'Great workout! Following along now. My arms are already burning! 💪',
        likes: 8,
        liked: true,
        createdAt: '2024-02-19T07:30:00',
        replies: [
          {
            id: '8',
            user: {
              id: '2',
              username: 'fitnessking',
              avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
            },
            content: 'That\'s the spirit! Remember to keep proper form even when it gets tough. Results come from consistency, not just intensity.',
            likes: 3,
            liked: false,
            createdAt: '2024-02-19T08:00:00',
            replies: []
          }
        ]
      },
      {
        id: '9',
        user: {
          id: '5',
          username: 'morningworkout',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
        },
        content: 'Perfect timing! Just what I needed for my morning routine. How often do you recommend doing this specific workout?',
        likes: 2,
        liked: false,
        createdAt: '2024-02-19T08:15:00',
        replies: []
      }
    ]
  },
  {
    id: '3',
    creator: {
      username: 'musicmaker',
      display_name: 'Music Maker',
      avatar: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=150&h=150&fit=crop&crop=face'
    },
    content: 'Working on a new beat for my upcoming album. Here\'s a sneak peek at my creative process. What genre should I explore next?',
    type: 'audio',
    tier: 'Superfan',
    thumbnail: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop',
    posted: '2024-02-18T20:15:00',
    likes: 56,
    comments: 12,
    views: 423,
    liked: false,
    initialComments: [
      {
        id: '4',
        user: {
          id: '4',
          username: 'beathead',
          avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face'
        },
        content: 'This sounds fire! 🔥 Have you considered exploring some drill or UK garage elements?',
        likes: 3,
        liked: false,
        createdAt: '2024-02-18T21:00:00',
        replies: [
          {
            id: '10',
            user: {
              id: '3',
              username: 'musicmaker',
              avatar: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=150&h=150&fit=crop&crop=face'
            },
            content: 'UK garage is definitely something I want to experiment with! The syncopated rhythms would work perfectly with my style.',
            likes: 1,
            liked: false,
            createdAt: '2024-02-18T21:30:00',
            replies: []
          }
        ]
      },
      {
        id: '11',
        user: {
          id: '6',
          username: 'producer_pro',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
        },
        content: 'The layering in this beat is amazing! What DAW are you using? The mixing sounds really clean.',
        likes: 6,
        liked: false,
        createdAt: '2024-02-18T22:00:00',
        replies: [
          {
            id: '12',
            user: {
              id: '3',
              username: 'musicmaker',
              avatar: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=150&h=150&fit=crop&crop=face'
            },
            content: 'Thanks! I\'m using Logic Pro X with some custom plugins. The secret is in the compression chain I\'ve built over the years.',
            likes: 2,
            liked: false,
            createdAt: '2024-02-18T22:15:00',
            replies: []
          },
          {
            id: '13',
            user: {
              id: '4',
              username: 'beathead',
              avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face'
            },
            content: 'Would love to hear more about your compression setup! Maybe you could do a tutorial on your production process?',
            likes: 4,
            liked: false,
            createdAt: '2024-02-18T22:45:00',
            replies: []
          }
        ]
      }
    ]
  },
  {
    id: '4',
    creator: {
      username: 'artisticmia',
      display_name: 'Artistic Mia',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b5fd?w=150&h=150&fit=crop&crop=face'
    },
    content: 'Here\'s a sneak peek at my upcoming digital painting. Still working on the lighting effects and color balance. What do you think so far?',
    type: 'image',
    tier: 'Supporter',
    thumbnail: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop',
    posted: '2024-02-20T14:15:00',
    likes: 78,
    comments: 12,
    views: 456,
    liked: false,
    initialComments: []
  }
];

export const FeedPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [feed, setFeed] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showComments, setShowComments] = useState<Record<string, boolean>>({});
  const [expandedCaptions, setExpandedCaptions] = useState<Record<string, boolean>>({});
  const [expandedModalCaption, setExpandedModalCaption] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedContent, setSelectedContent] = useState<any>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'single'>('grid');

  // Fetch real posts from API with subscription filtering
  useEffect(() => {
    const fetchFeed = async () => {
      try {
        setLoading(true);
        
        // First get user's subscriptions
        let userSubscriptions = [];
        if (user) {
          const subscriptionsResponse = await fetch(`/api/subscriptions/fan/${user.id}`);
          if (subscriptionsResponse.ok) {
            userSubscriptions = await subscriptionsResponse.json();
          }
        }

        const response = await fetch('/api/posts');
        if (response.ok) {
          const posts = await response.json();
          console.log('Fetched posts from API:', posts.length);

          if (!Array.isArray(posts)) {
            throw new Error('Invalid response format from API');
          }

          // Transform and filter posts based on access
          const transformedPosts = posts.map((post: any) => {
            const postTier = post.tier || 'public';
            
            return {
              id: post.id.toString(),
              creator: {
                username: post.creator?.username || post.username || 'Unknown',
                display_name: post.creator?.display_name || post.display_name || post.creator?.username || post.username || 'Unknown',
                avatar: post.creator?.avatar || post.avatar || '',
                id: post.creator_id
              },
              content: post.content || post.title || '',
              type: post.media_type || 'post',
              tier: postTier,
              thumbnail: post.media_urls && post.media_urls.length > 0 
                ? post.media_urls[0].startsWith('/uploads/') 
                  ? post.media_urls[0] 
                  : `/uploads/${post.media_urls[0]}`
                : '',
              posted: post.created_at || new Date().toISOString(),
              likes: post.likes_count || 0,
              comments: post.comments_count || 0,
              views: Math.floor(Math.random() * 1000) + 100,
              liked: false,
              initialComments: [],
              hasAccess: hasAccessToContent(postTier, post.creator_id, userSubscriptions)
            };
          });

          // Show all posts but mark access level for display logic
          console.log('Total posts after filtering:', transformedPosts.length);
          setFeed(transformedPosts);
        } else {
          const errorText = await response.text();
          console.error('API request failed:', response.status, errorText);
          throw new Error(`API request failed with status ${response.status}`);
        }
      } catch (error) {
        console.error('Error fetching feed:', error);
        toast({
          title: "Error",
          description: "Failed to load feed. Please try again.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchFeed();
  }, [user, toast]);

  // Check if user has access to content based on subscription
  const hasAccessToContent = (postTier: string, creatorId: number, userSubscriptions: any[]) => {
    // Public content is always accessible
    if (postTier === 'public') {
      return true;
    }

    // If user is not logged in, no access to premium content
    if (!user) {
      return false;
    }

    // Find user's subscription to this creator
    const userSubscription = userSubscriptions.find(
      sub => sub.creator_id === creatorId && sub.status === 'active'
    );

    // If no subscription, no access to premium content
    if (!userSubscription) {
      return false;
    }

    // Define tier hierarchy (lower index = higher access level)
    const tierHierarchy = ['superfan', 'premium', 'fan', 'supporter'];
    const postTierIndex = tierHierarchy.indexOf(postTier.toLowerCase());
    const userTierIndex = tierHierarchy.indexOf(userSubscription.tier_name?.toLowerCase() || '');

    // If post tier or user tier not found in hierarchy, deny access
    if (postTierIndex === -1 || userTierIndex === -1) {
      return false;
    }

    // User has access if their tier level is equal or higher than required
    return userTierIndex <= postTierIndex;
  };

  const handleLike = async (postId: string) => {
    if (!user) return;

    try {
      const currentPost = feed.find(post => post.id === postId);
      if (!currentPost) return;

      if (currentPost.liked) {
        // Unlike the post
        await fetch(`/api/posts/${postId}/like`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId: user.id }),
        });
      } else {
        // Like the post
        await fetch(`/api/posts/${postId}/like`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId: user.id }),
        });
      }

      // Update local state immediately for responsive UI
      setFeed(feed.map(post => 
        post.id === postId 
          ? { 
              ...post, 
              liked: !post.liked,
              likes: post.liked ? post.likes - 1 : post.likes + 1
            }
          : post
      ));

    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleCommentClick = (postId: string) => {
    setShowComments(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  const handleModalCommentClick = () => {
    setShowBottomSheet(true);
  };

  const handleCommentCountChange = (postId: string, newCount: number) => {
    setFeed(prev => prev.map(post => 
      post.id === postId 
        ? { ...post, comments: newCount }
        : post
    ));
  };

  const handleShare = (postId: string) => {
    toast({
      title: "Link copied",
      description: "Post link has been copied to your clipboard.",
    });
  };

  const handleThumbnailClick = (post: any) => {
    // Check if user has access to this content
    if (!post.hasAccess) {
      // Redirect to creator profile for subscription
      navigate(`/creator/${post.creator.username}`);
      return;
    }

    // For video content, check aspect ratio to determine navigation behavior
    if (post.type === 'video' && post.thumbnail) {
      // Create a temporary image/video element to detect aspect ratio
      const media = document.createElement('video');
      media.src = post.thumbnail;
      media.onloadedmetadata = () => {
        const aspectRatio = media.videoWidth / media.videoHeight;

        if (aspectRatio > 1) {
          // 16:9 or landscape video - navigate to YouTube-style watch page
          navigate(`/video/${post.id}`);
        } else {
          // 9:16 or portrait video - open Instagram-style modal
          const index = feed.findIndex(p => p.id === post.id);
          setSelectedContent(post);
          setSelectedIndex(index);
          setIsModalOpen(true);
        }
      };

      // Fallback for when metadata can't be loaded - assume portrait for modal
      media.onerror = () => {
        const index = feed.findIndex(p => p.id === post.id);
        setSelectedContent(post);
        setSelectedIndex(index);
        setIsModalOpen(true);
      };
    } else {
      // Non-video content always opens in modal
      const index = feed.findIndex(p => p.id === post.id);
      setSelectedContent(post);
      setSelectedIndex(index);
      setIsModalOpen(true);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedContent(null);
    setSelectedIndex(0);
    setExpandedModalCaption(false);
    setShowBottomSheet(false);
  };

  const handleSwipeUp = () => {
    if (selectedIndex < feed.length - 1) {
      const nextIndex = selectedIndex + 1;
      setSelectedIndex(nextIndex);
      setSelectedContent(feed[nextIndex]);
      setExpandedModalCaption(false);
    }
  };

  const handleSwipeDown = () => {
    if (selectedIndex > 0) {
      const prevIndex = selectedIndex - 1;
      setSelectedIndex(prevIndex);
      setSelectedContent(feed[prevIndex]);
      setExpandedModalCaption(false);
    }
  };

  const toggleComments = (postId: string) => {
    setShowComments(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  const toggleCaptionExpansion = (postId: string) => {
    setExpandedCaptions(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  const truncateText = (text: string, maxLines: number = 1) => {
    const words = text.split(' ');
    // Reserve space for "... Read more" by reducing available words
    const wordsPerLine = window.innerWidth < 640 ? 8 : 14; // Reduced to leave space for "Read more"
    const maxWords = maxLines * wordsPerLine;

    if (words.length <= maxWords) {
      return { truncated: text, needsExpansion: false };
    }

    return {
      truncated: words.slice(0, maxWords).join(' '),
      needsExpansion: true
    };
  };

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'image':
        return <Image className="w-4 h-4 text-white" />;
      case 'video':
        return <Video className="w-4 h-4 text-white" />;
      case 'audio':
        return <Music className="w-4 h-4 text-white" />;
      case 'text':
      case 'post':
        return <FileText className="w-4 h-4 text-white" />;
      default:
        return <FileText className="w-4 h-4 text-white" />;
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier.toLowerCase()) {
      case 'public':
        return 'outline';
      case 'supporter':
      case 'starter pump':
        return 'secondary';
      case 'fan':
      case 'power gains':
        return 'secondary';
      case 'premium':
      case 'superfan':
      case 'elite beast mode':
        return 'default';
      default:
        return 'outline';
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return `${Math.floor(diffInDays / 7)}w ago`;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Layout - Edge-to-edge like VideoWatch */}
      <div className="md:hidden">
        {/* Mobile Feed Container - Full Width with invisible scrollbar */}
        <div className="w-full bg-background -mt-16 pt-16 overflow-y-auto scrollbar-hide" style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}>
          {loading ? (
            <div className="space-y-0">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-full">
                  <div className="px-3 py-3">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-10 h-10 bg-muted rounded-full animate-pulse"></div>
                      <div className="space-y-2">
                        <div className="w-28 h-3 bg-muted rounded animate-pulse"></div>
                        <div className="w-20 h-2 bg-muted rounded animate-pulse"></div>
                      </div>
                    </div>
                    <div className="w-full h-64 bg-muted rounded-lg animate-pulse mb-3"></div>
                    <div className="space-y-2">
                      <div className="w-full h-3 bg-muted rounded animate-pulse"></div>
                      <div className="w-3/4 h-3 bg-muted rounded animate-pulse"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : feed.length === 0 ? (
            <div className="text-center py-16 px-4">
              <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No posts yet</h3>
              <p className="text-muted-foreground mb-6">
                Follow some creators to see their content in your feed
              </p>
              <Button asChild>
                <Link to="/explore">Discover Creators</Link>
              </Button>
            </div>
          ) : (
            /* Mobile Feed Items */
            <div className="space-y-0">
              {feed.map((post) => (
                <div key={post.id} className="w-full bg-background border-b border-border/20 overflow-hidden">
                  <div 
                    className="relative w-full aspect-video bg-black cursor-pointer"
                    onClick={() => handleThumbnailClick(post)}
                  >
                    {post.hasAccess ? (
                      post.thumbnail ? (
                        post.type === 'video' ? (
                          <video
                            src={post.thumbnail.startsWith('/uploads/') ? post.thumbnail : `/uploads/${post.thumbnail}`}
                            className="w-full h-full object-cover"
                            muted
                            preload="metadata"
                            onError={(e) => {
                              const target = e.target as HTMLVideoElement;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent) {
                                parent.innerHTML = `<div class="w-full h-full bg-gray-800 flex items-center justify-center">
                                  <div class="text-white text-sm">Video unavailable</div>
                                </div>`;
                              }
                            }}
                          />
                        ) : (
                          <img 
                            src={post.thumbnail.startsWith('/uploads/') ? post.thumbnail : `/uploads/${post.thumbnail}`}
                            alt={`${post.creator.display_name}'s post`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = `https://placehold.co/800x800/6366F1/FFFFFF?text=Creator+Post+${post.id}`;
                            }}
                          />
                        )
                      ) : (
                        <img 
                          src={post.id === '1' ? 'https://placehold.co/800x800/E63946/FFFFFF?text=Creator+Post+1' :
                               post.id === '2' ? 'https://placehold.co/800x800/457B9D/FFFFFF?text=Creator+Post+2' :
                               post.id === '3' ? 'https://placehold.co/800x800/1D3557/FFFFFF?text=Creator+Post+3' :
                               `https://placehold.co/800x800/6366F1/FFFFFF?text=Creator+Post+${post.id}`}
                          alt={`${post.creator.display_name}'s post`}
                          className="w-full h-full object-cover"
                        />
                      )
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-accent/20 to-accent/10 flex items-center justify-center relative">
                        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
                        <div className="text-center z-10 p-4">
                          <div className="mb-3">
                            <svg className="w-12 h-12 mx-auto text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                          </div>
                          <h3 className="text-base font-medium text-foreground mb-2">
                            {post.tier === 'supporter' ? 'Supporter' : 
                             post.tier === 'fan' ? 'Fan' : 
                             post.tier === 'premium' ? 'Premium' : 
                             post.tier === 'superfan' ? 'Superfan' : 'Premium'} Content
                          </h3>
                          <p className="text-sm text-muted-foreground mb-4">
                            Subscribe to view this content
                          </p>
                          <Button 
                            size="sm" 
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/creator/${post.creator.username}`);
                            }}
                            className="bg-accent hover:bg-accent/90 text-accent-foreground"
                          >
                            Subscribe
                          </Button>
                        </div>
                      </div>
                    )}

                    

                    {/* Duration Badge for videos */}
                    {post.type === 'video' && (
                      <div className="absolute bottom-2 right-2 bg-black text-white text-xs px-2 py-1 rounded">
                        {post.duration || '0:00'}
                      </div>
                    )}

                    {/* Media Type Badge */}
                    <div className="absolute top-2 right-2 bg-black rounded px-2 py-1">
                      {getTypeIcon(post.type)}
                    </div>
                  </div>

                  {/* Bottom section - VideoWatch Up Next style */}
                  <div className="p-3">
                    <div className="flex gap-3">
                      <Avatar className="h-9 w-9 flex-shrink-0">
                        <AvatarImage 
                          src={post.creator.avatar ? (post.creator.avatar.startsWith('/uploads/') ? post.creator.avatar : `/uploads/${post.creator.avatar}`) : undefined} 
                          alt={post.creator.username} 
                        />
                        <AvatarFallback className="text-sm">{(post.creator.display_name || post.creator.username || 'U').charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-foreground line-clamp-2 mb-1">
                          {post.content || 'Untitled Post'}
                        </h4>
                        <div className="flex items-center justify-between text-xs text-muted-foreground w-full">
                          <span className="truncate mr-2">{post.creator.display_name || post.creator.username}</span>
                          <div className="flex items-center gap-1 flex-shrink-0 text-right">
                            <Eye className="w-3 h-3" />
                            <span>{post.views}</span>
                            <span>•</span>
                            <span>{getTimeAgo(post.posted)}</span>
                          </div>
                        </div>
                        
                        
                      </div>
                    </div>

                    {/* Comments Section */}
                    {showComments[post.id] && (
                      <div className="mt-4 border-t border-border pt-4">
                        <CommentSection
                          postId={post.id}
                          initialComments={post.initialComments || []}
                          onCommentCountChange={(newCount) => handleCommentCountChange(post.id, newCount)}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Desktop Layout - Keep original design */}
      <div className="hidden md:block">
        <EdgeToEdgeContainer>
      {/* Hero Section - Full Width */}
      <div className="bg-gradient-to-r from-accent/10 via-primary/5 to-accent/10 border-b border-border">
        <EdgeToEdgeContainer maxWidth="4xl" enablePadding enableTopPadding>
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
              Your Feed
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
              Latest content from creators you follow
            </p>

            {/* View Toggle - Desktop Only */}
            <div className="hidden md:flex justify-center">
              <div className="inline-flex items-center rounded-lg border border-border bg-background p-1">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="h-8 px-3"
                >
                  <Grid3X3 className="w-4 h-4 mr-2" />
                  Grid
                </Button>
                <Button
                  variant={viewMode === 'single' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('single')}
                  className="h-8 px-3"
                >
                  <List className="w-4 h-4 mr-2" />
                  Single
                </Button>
              </div>
            </div>
          </div>
        </EdgeToEdgeContainer>
      </div>

      {/* Feed Content */}
      <EdgeToEdgeContainer maxWidth="7xl" enablePadding className="py-4 sm:py-6">
        {loading ? (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="bg-gradient-card border-border/50">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-12 h-12 bg-muted rounded-full animate-pulse"></div>
                    <div className="space-y-2">
                      <div className="w-32 h-4 bg-muted rounded animate-pulse"></div>
                      <div className="w-24 h-3 bg-muted rounded animate-pulse"></div>
                    </div>
                  </div>
                  <div className="w-full h-48 bg-muted rounded-lg animate-pulse mb-4"></div>
                  <div className="space-y-2">
                    <div className="w-full h-4 bg-muted rounded animate-pulse"></div>
                    <div className="w-3/4 h-4 bg-muted rounded animate-pulse"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : feed.length === 0 ? (
          <div className="text-center py-12 px-4 sm:px-6">
            <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No posts yet</h3>
            <p className="text-muted-foreground mb-6">
              Follow some creators to see their content in your feed
            </p>
            <Button asChild>
              <Link to="/explore">Discover Creators</Link>
            </Button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="flex justify-center">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4 max-w-7xl mx-auto">
              {feed.map((post) => (
                <div key={post.id} className="youtube-grid-card cursor-pointer" onClick={() => handleThumbnailClick(post)}>
                  {/* Thumbnail */}
                  <div className="relative w-full aspect-video bg-black overflow-hidden mb-3 rounded-lg">
                    {post.hasAccess ? (
                      post.thumbnail ? (
                        post.type === 'video' ? (
                          <video
                            src={post.thumbnail.startsWith('/uploads/') ? post.thumbnail : `/uploads/${post.thumbnail}`}
                            className="w-full h-full object-cover"
                            muted
                            preload="metadata"
                            onError={(e) => {
                              const target = e.target as HTMLVideoElement;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent) {
                                parent.innerHTML = `<div class="w-full h-full bg-gray-800 flex items-center justify-center">
                                  <div class="text-white text-xs">Video unavailable</div>
                                </div>`;
                              }
                            }}
                          />
                        ) : (
                          <img 
                            src={post.thumbnail.startsWith('/uploads/') ? post.thumbnail : `/uploads/${post.thumbnail}`}
                            alt={`${post.creator.display_name}'s post`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = `https://placehold.co/640x360/6366F1/FFFFFF?text=Creator+Post+${post.id}`;
                            }}
                          />
                        )
                      ) : (
                        <img 
                          src={post.id === '1' ? 'https://placehold.co/640x360/E63946/FFFFFF?text=Creator+Post+1' :
                               post.id === '2' ? 'https://placehold.co/640x360/457B9D/FFFFFF?text=Creator+Post+2' :
                               post.id === '3' ? 'https://placehold.co/640x360/1D3557/FFFFFF?text=Creator+Post+3' :
                               `https://placehold.co/640x360/6366F1/FFFFFF?text=Creator+Post+${post.id}`}
                          alt={`${post.creator.display_name}'s post`}
                          className="w-full h-full object-cover"
                        />
                      )
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-accent/20 to-accent/10 flex items-center justify-center relative">
                        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
                        <div className="text-center z-10 p-2">
                          <div className="mb-2">
                            <svg className="w-8 h-8 mx-auto text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">
                            {post.tier === 'supporter' ? 'Supporter' : 
                             post.tier === 'fan' ? 'Fan' : 
                             post.tier === 'premium' ? 'Premium' : 
                             post.tier === 'superfan' ? 'Superfan' : 'Premium'} Content
                          </p>
                          <Button 
                            size="sm" 
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/creator/${post.creator.username}`);
                            }}
                            className="bg-accent hover:bg-accent/90 text-accent-foreground text-xs h-6 px-2"
                          >
                            Subscribe
                          </Button>
                        </div>
                      </div>
                    )}

                  

                  {/* Duration overlay for videos */}
                  {post.type === 'video' && (
                    <div className="absolute bottom-2 right-2">
                      <div className="px-2 py-1 bg-black/80 rounded text-white text-xs font-medium">
                        {Math.floor(Math.random() * 10) + 1}:{Math.floor(Math.random() * 60).toString().padStart(2, '0')}
                      </div>
                    </div>
                  )}

                    {/* Content type badge */}
                    <div className="absolute top-2 left-2">
                      <Badge variant={getTierColor(post.tier)} className="text-xs">
                        {post.tier === 'public' ? 'Free' : post.tier}
                      </Badge>
                    </div>
                  </div>

                {/* YouTube-style content below thumbnail */}
                <div className="flex gap-3">
                  <Avatar className="h-9 w-9 flex-shrink-0">
                    <AvatarImage 
                      src={post.creator.avatar ? (post.creator.avatar.startsWith('/uploads/') ? post.creator.avatar : `/uploads/${post.creator.avatar}`) : undefined} 
                      alt={post.creator.username} 
                    />
                    <AvatarFallback className="text-sm">{(post.creator.display_name || post.creator.username || 'U').charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-foreground line-clamp-2 mb-1">
                      {post.content || post.title || 'Untitled Post'}
                    </h3>
                    <div className="flex items-center justify-between text-xs text-muted-foreground w-full">
                      <span className="truncate mr-2">{post.creator.display_name || post.creator.username}</span>
                      <div className="flex items-center gap-1 flex-shrink-0 text-right">
                        <Eye className="w-3 h-3" />
                        <span>{post.views}</span>
                        <span>•</span>
                        <span>{getTimeAgo(post.posted)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            </div>
          </div>
        ) : (
          /* Single View */
          <div className="max-w-4xl mx-auto space-y-6">
            {feed.map((post) => (
              <Card key={post.id} className="bg-gradient-card border-border/50 overflow-hidden">
                <CardContent className="p-4">
                  {/* Media Content */}
                  <div 
                    className="relative aspect-video bg-black cursor-pointer rounded-lg overflow-hidden mb-4"
                    onClick={() => handleThumbnailClick(post)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleThumbnailClick(post);
                      }
                    }}
                  >
                    {post.hasAccess ? (
                      post.thumbnail ? (
                        post.type === 'video' ? (
                          <video
                            src={post.thumbnail.startsWith('/uploads/') ? post.thumbnail : `/uploads/${post.thumbnail}`}
                            className="w-full h-full object-cover"
                            muted
                            preload="metadata"
                            onError={(e) => {
                              const target = e.target as HTMLVideoElement;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent) {
                                parent.innerHTML = `<div class="w-full h-full bg-gray-800 flex items-center justify-center">
                                  <div class="text-white text-sm">Video unavailable</div>
                                </div>`;
                              }
                            }}
                          />
                        ) : (
                          <img 
                            src={post.thumbnail.startsWith('/uploads/') ? post.thumbnail : `/uploads/${post.thumbnail}`}
                            alt={`${post.creator.display_name}'s post`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = `https://placehold.co/1280x720/6366F1/FFFFFF?text=Creator+Post+${post.id}`;
                            }}
                          />
                        )
                      ) : (
                        <img 
                          src={post.id === '1' ? 'https://placehold.co/1280x720/E63946/FFFFFF?text=Creator+Post+1' :
                               post.id === '2' ? 'https://placehold.co/1280x720/457B9D/FFFFFF?text=Creator+Post+2' :
                               post.id === '3' ? 'https://placehold.co/1280x720/1D3557/FFFFFF?text=Creator+Post+3' :
                               `https://placehold.co/1280x720/6366F1/FFFFFF?text=Creator+Post+${post.id}`}
                          alt={`${post.creator.display_name}'s post`}
                          className="w-full h-full object-cover"
                        />
                      )
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-accent/20 to-accent/10 flex items-center justify-center relative">
                        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
                        <div className="text-center z-10 p-6">
                          <div className="mb-4">
                            <svg className="w-16 h-16 mx-auto text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                          </div>
                          <h3 className="text-xl font-medium text-foreground mb-2">
                            {post.tier === 'supporter' ? 'Supporter' : 
                             post.tier === 'fan' ? 'Fan' : 
                             post.tier === 'premium' ? 'Premium' : 
                             post.tier === 'superfan' ? 'Superfan' : 'Premium'} Content
                          </h3>
                          <p className="text-muted-foreground mb-4">
                            Subscribe to {post.creator.display_name} to view this content
                          </p>
                          <Button asChild className="mt-2">
                            <a href={`/creator/${post.creator.username}`}>
                              View Profile
                            </a>
                          </Button>
                        </div>
                      </div>
                    )}

                    

                    {/* Duration overlay for videos */}
                    {post.type === 'video' && (
                      <div className="absolute bottom-4 right-4">
                        <div className="px-2 py-1 bg-black/80 rounded text-white text-sm font-medium">
                          {Math.floor(Math.random() * 10) + 1}:{Math.floor(Math.random() * 60).toString().padStart(2, '0')}
                        </div>
                      </div>
                    )}

                    {/* Tier badge */}
                    <div className="absolute top-4 left-4">
                      <Badge variant={getTierColor(post.tier)} className="text-sm">
                        {post.tier === 'public' ? 'Free' : post.tier}
                      </Badge>
                    </div>
                  </div>

                  {/* Creator Info and Content - VideoWatch Up Next style */}
                  <div className="flex gap-3">
                    <Avatar className="h-9 w-9 flex-shrink-0">
                      <AvatarImage 
                        src={post.creator.avatar ? (post.creator.avatar.startsWith('/uploads/') ? post.creator.avatar : `/uploads/${post.creator.avatar}`) : undefined} 
                        alt={post.creator.username} 
                      />
                      <AvatarFallback className="text-sm">{(post.creator.display_name || post.creator.username || 'U').charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-foreground line-clamp-2 mb-1">
                        {post.content || 'Untitled Post'}
                      </h4>
                      <div className="flex items-center justify-between text-xs text-muted-foreground w-full">
                        <span className="truncate mr-2">{post.creator.display_name || post.creator.username}</span>
                        <div className="flex items-center gap-1 flex-shrink-0 text-right">
                          <Eye className="w-3 h-3" />
                          <span>{post.views}</span>
                          <span>•</span>
                          <span>{getTimeAgo(post.posted)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className={`h-8 w-8 p-0 ${post.liked ? 'text-red-500' : 'text-muted-foreground'}`}
                            onClick={() => handleLike(post.id)}
                          >
                            <Heart className={`w-5 h-5 ${post.liked ? 'fill-current' : ''}`} />
                          </Button>
                          <span className="text-sm font-medium text-foreground">
                            {post.likes}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 text-muted-foreground"
                            onClick={() => handleCommentClick(post.id)}
                          >
                            <MessageSquare className="w-5 h-5" />
                          </Button>
                          <span className="text-sm font-medium text-foreground">
                            {post.comments}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-muted-foreground"
                            onClick={() => handleShare(post.id)}
                          >
                            <Share2 className="w-5 h-5" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Comments Section */}
                    {showComments[post.id] && (
                      <div className="mt-4 border-t border-border pt-4">
                        <CommentSection
                          postId={post.id}
                          initialComments={post.initialComments || []}
                          onCommentCountChange={(count) => handleCommentCountChange(post.id, count)}
                          isBottomSheet={false}
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Load More */}
        {!loading && feed.length > 0 && (
          <div className="text-center mt-8">
            <Button variant="outline">
              Load More Posts
            </Button>
          </div>
        )}
      </EdgeToEdgeContainer>

      {/* Instagram-style Content Modal with responsive design */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-full max-h-full w-full h-full p-0 m-0 overflow-hidden border-0 [&>button]:hidden sm:max-w-5xl sm:max-h-[95vh] sm:w-auto sm:h-auto sm:rounded-lg">
          <DialogHeader className="sr-only">
            <DialogTitle>{selectedContent?.type} Content</DialogTitle>
            <DialogDescription>View content from {selectedContent?.creator?.display_name}</DialogDescription>
          </DialogHeader>
          {selectedContent && (
            <div 
              className="relative w-full h-full bg-black sm:flex sm:h-[90vh] sm:max-h-[800px] sm:rounded-lg sm:overflow-hidden"
              onTouchStart={(e) => {
                const touch = e.touches[0];
                const startY = touch.clientY;

                const handleTouchMove = (moveEvent: TouchEvent) => {
                  const currentTouch = moveEvent.touches[0];
                  const deltaY = startY - currentTouch.clientY;

                  if (Math.abs(deltaY) > 50) {
                    if (deltaY > 0) {
                      handleSwipeUp();
                    } else {
                      handleSwipeDown();
                    }
                    document.removeEventListener('touchmove', handleTouchMove);
                    document.removeEventListener('touchend', handleTouchEnd);
                  }
                };

                const handleTouchEnd = () => {
                  document.removeEventListener('touchmove', handleTouchMove);
                  document.removeEventListener('touchend', handleTouchEnd);
                };

                document.addEventListener('touchmove', handleTouchMove);
                document.addEventListener('touchend', handleTouchEnd);
              }}
            >
              {/* Back Arrow Button */}
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-4 left-4 z-50 w-10 h-10 rounded-full text-white hover:bg-gray-800 sm:text-gray-600 sm:hover:bg-gray-200"
                onClick={closeModal}
              >
                <ArrowLeft className="w-7 h-7" />
              </Button>

              {/* Mobile: Full screen content */}
              <div className="relative w-full h-full bg-black sm:hidden">
                {selectedContent.thumbnail ? (
                  selectedContent.type === 'video' ? (
                    <div className="w-full h-full bg-black flex items-center justify-center">
                    <video 
                      key={selectedContent.id}
                      src={selectedContent.thumbnail} 
                      className="max-w-full max-h-full"
                      controls
                      autoPlay
                      muted
                      loop
                      onLoadedMetadata={(e) => {
                        const video = e.target as HTMLVideoElement;
                        const aspectRatio = video.videoWidth / video.videoHeight;

                        if (aspectRatio > 1) {
                          // Landscape video - fit width
                          video.style.width = '100%';
                          video.style.height = 'auto';
                        } else {
                          // Portrait video - fit height
                          video.style.width = 'auto';
                          video.style.height = '100%';
                        }
                      }}
                    />
                    </div>
                  ) : (
                    <img 
                      src={selectedContent.thumbnail} 
                      alt={`${selectedContent.creator.display_name}'s post`}
                      className="w-full h-full object-cover"
                    />
                  )
                ) : (
                  selectedContent.id === '1' ? (
                    <img 
                      src="https://placehold.co/1080x1920/E63946/FFFFFF?text=Creator+Post+1"
                      alt={`${selectedContent.creator.display_name}'s post`}
                      className="w-full h-full object-cover"
                    />
                  ) : selectedContent.id === '2' ? (
                    <img 
                      src="https://placehold.co/1080x1920/457B9D/FFFFFF?text=Creator+Post+2"
                      alt={`${selectedContent.creator.display_name}'s post`}
                      className="w-full h-full object-cover"
                    />
                  ) : selectedContent.id === '3' ? (
                    <img 
                      src="https://placehold.co/1080x1920/1D3557/FFFFFF?text=Creator+Post+3"
                      alt={`${selectedContent.creator.display_name}'s post`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <img 
                      src={`https://placehold.co/1080x1920/6366F1/FFFFFF?text=Creator+Post+${selectedContent.id}`}
                      alt={`${selectedContent.creator.display_name}'s post`}
                      className="w-full h-full object-cover"
                    />
                  )
                )}

                {/* Mobile overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent pointer-events-none">
                  {/* Creator info overlay - bottom left - moved up */}
                  <div className="absolute bottom-20 left-4 right-16 pointer-events-auto">
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar className="h-10 w-10 border-2 border-white">
                        <AvatarImage 
                          src={selectedContent.creator.avatar ? (selectedContent.creator.avatar.startsWith('/uploads/') ? selectedContent.creator.avatar : `/uploads/${selectedContent.creator.avatar}`) : undefined} 
                          alt={selectedContent.creator.username} 
                        />
                        <AvatarFallback className="text-black">{(selectedContent.creator.display_name || selectedContent.creator.username || 'U').charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-semibold text-white text-sm drop-shadow-lg">
                          @{selectedContent.creator.username}
                        </p>
                        <span className="text-xs text-white/80 drop-shadow-lg">
                          {getTimeAgo(selectedContent.posted)}
                        </span>
                      </div>
                    </div>

                    {/* Caption */}
                    <div className="mb-3">
                      {(() => {
                        const { truncated, needsExpansion } = truncateText(selectedContent.content, 2);

                        return (
                          <p className="text-sm leading-relaxed text-white drop-shadow-lg">
                            {expandedModalCaption ? selectedContent.content : (
                              <>
                                {truncated}
                                {needsExpansion && !expandedModalCaption && (
                                  <>
                                    {'... '}
                                    <button
                                      onClick={() => setExpandedModalCaption(true)}
                                      className="text-white/80 hover:text-white font-normal underline"
                                    >
                                      more
                                    </button>
                                  </>
                                )}
                              </>
                            )}
                            {expandedModalCaption && needsExpansion && (
                              <>
                                {' '}
                                <button
                                  onClick={() => setExpandedModalCaption(false)}
                                  className="text-white/80 hover:text-white font-normal underline"
                                >
                                  less
                                </button>
                              </>
                            )}
                          </p>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Action buttons - right side */}
                  <div className="absolute bottom-20 right-4 flex flex-col gap-4 pointer-events-auto">
                    <div className="flex flex-col items-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`h-12 w-12 p-0 rounded-full bg-gray-900 border-2 border-gray-500 ${selectedContent.liked ? 'text-red-500' : 'text-white'}`}
                        onClick={() => handleLike(selectedContent.id)}
                      >
                        <Heart className={`w-6 h-6 ${selectedContent.liked ? 'fill-current' : ''}`} />
                      </Button>
                      <span className="text-xs font-medium text-white drop-shadow-lg mt-1">
                        {selectedContent.likes}
                      </span>
                    </div>

                    <div className="flex flex-col items-center">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-12 w-12 p-0 rounded-full bg-gray-900 border-2 border-gray-500 text-white"
                        onClick={handleModalCommentClick}
                      >
                        <MessageSquare className="w-6 h-6" />
                      </Button>
                      <span className="text-xs font-medium text-white drop-shadow-lg mt-1">
                        {selectedContent.comments}
                      </span>
                    </div>

                    <div className="flex flex-col items-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-12 w-12 p-0 rounded-full bg-gray-900 border-2 border-gray-500 text-white"
                        onClick={() => handleShare(selectedContent.id)}
                      >
                        <Share2 className="w-6 h-6" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Desktop: Two-panel Instagram-style layout */}
              <div className="hidden sm:flex w-full h-full">
                {/* Left panel - Content */}
                <div className="flex-1 bg-black flex items-center justify-center">
                  <div className="relative w-full h-full max-w-md mx-auto">
                  {selectedContent.thumbnail ? (
                      selectedContent.type === 'video' ? (
                        <div className="w-full h-full bg-black flex items-center justify-center">
                        <video 
                          key={selectedContent.id}
                          src={selectedContent.thumbnail} 
                          className="max-w-full max-h-full"
                          controls
                          autoPlay
                          muted
                          loop
                          onLoadedMetadata={(e) => {
                            const video = e.target as HTMLVideoElement;
                            const aspectRatio = video.videoWidth / video.videoHeight;

                            if (aspectRatio > 1) {
                              // Landscape video - fit width
                              video.style.width = '100%';
                              video.style.height = 'auto';
                            } else {
                              // Portrait video - fit height
                              video.style.width = 'auto';
                              video.style.height = '100%';
                            }
                          }}
                        />
                        </div>
                      ) : (
                        <img 
                          src={selectedContent.thumbnail} 
                          alt={`${selectedContent.creator.display_name}'s post`}
                          className="w-full h-full object-contain"
                        />
                      )
                    ) : (
                      selectedContent.id === '1' ? (
                        <img 
                          src="https://placehold.co/1080x1920/E63946/FFFFFF?text=Creator+Post+1"
                          alt={`${selectedContent.creator.display_name}'s post`}
                          className="w-full h-full object-contain"
                        />
                      ) : selectedContent.id === '2' ? (
                        <img 
                          src="https://placehold.co/1080x1920/457B9D/FFFFFF?text=Creator+Post+2"
                          alt={`${selectedContent.creator.display_name}'s post`}
                          className="w-full h-full object-contain"
                        />
                      ) : selectedContent.id === '3' ? (
                        <img 
                          src="https://placehold.co/1080x1920/1D3557/FFFFFF?text=Creator+Post+3"
                          alt={`${selectedContent.creator.display_name}'s post`}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <img 
                          src={`https://placehold.co/1080x1920/6366F1/FFFFFF?text=Creator+Post+${selectedContent.id}`}
                          alt={`${selectedContent.creator.display_name}'s post`}
                          className="w-full h-full object-contain"
                        />
                      )
                    )}
                  </div>
                </div>

                {/* Right panel - Post info and comments */}
                <div className="w-96 bg-background border-l border-border flex flex-col">
                  {/* Post header */}
                  <div className="px-4 py-3 border-b border-border">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage 
                          src={selectedContent.creator.avatar ? (selectedContent.creator.avatar.startsWith('/uploads/') ? selectedContent.creator.avatar : `/uploads/${selectedContent.creator.avatar}`) : undefined} 
                          alt={selectedContent.creator.username} 
                        />
                        <AvatarFallback>{(selectedContent.creator.display_name || selectedContent.creator.username || 'U').charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-semibold text-foreground text-sm">
                          @{selectedContent.creator.username}
                        </p>
                        <span className="text-xs text-muted-foreground">
                          {getTimeAgo(selectedContent.posted)}
                        </span>
                      </div>
                    </div>

                    {/* Caption */}
                    <div className="mt-3">
                      <p className="text-sm leading-relaxed text-foreground">
                        {selectedContent.content}
                      </p>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="px-4 py-3 border-b border-border">
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`h-8 w-8 p-0 ${selectedContent.liked ? 'text-red-500' : 'text-muted-foreground'}`}
                          onClick={() => handleLike(selectedContent.id)}
                        >
                          <Heart className={`w-6 h-6 ${selectedContent.liked ? 'fill-current' : ''}`} />
                        </Button>
                        <span className="text-sm font-medium text-foreground">
                          {selectedContent.likes}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 text-muted-foreground"
                        >
                          <MessageSquare className="w-6 h-6" />
                        </Button>
                        <span className="text-sm font-medium text-foreground">
                          {selectedContent.comments}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-muted-foreground"
                        onClick={() => handleShare(selectedContent.id)}
                      >
                        <Share2 className="w-6 h-6" />
                      </Button>
                    </div>
                  </div>

                  {/* Comments section */}
                  <div className="flex-1 overflow-hidden">
                    <CommentSection
                      postId={selectedContent.id}
                      initialComments={selectedContent.initialComments || []}
                      onCommentCountChange={(count) => handleCommentCountChange(selectedContent.id, count)}
                      isBottomSheet={false}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Instagram-style Bottom Sheet Comment Section */}
      <Sheet open={showBottomSheet} onOpenChange={setShowBottomSheet}>
        <SheetContent 
          side="bottom" 
          className="h-[75vh] p-0 border-t-4 border-border/30 rounded-t-xl bg-background flex flex-col"
        >
          <SheetHeader className="px-4 py-3 border-b border-border/20 bg-background shrink-0">
            <div className="flex items-center justify-center">
              <div className="w-12 h-1 bg-muted-foreground/30 rounded-full mb-2"></div>
            </div>
            <SheetTitle className="text-center text-lg font-semibold text-foreground">
              Comments
            </SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto bg-background">
            {selectedContent && (
              <CommentSection
                postId={selectedContent.id}
                initialComments={selectedContent.initialComments || []}
                onCommentCountChange={(count) => handleCommentCountChange(selectedContent.id, count)}
                isBottomSheet={true}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>
        </EdgeToEdgeContainer>
      </div>
    </div>
  );
};