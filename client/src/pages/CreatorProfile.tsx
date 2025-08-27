import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { CreatorPostActions } from '@/components/creator/CreatorPostActions';
import { PostActions } from '@/components/creator/PostActions';
import { CommentSection } from '@/components/fan/CommentSection';
import { PaymentModal } from '@/components/payment/PaymentModal';
import { TierDetailsModal } from '@/components/subscription/TierDetailsModal';
import { OnlineStatusIndicator } from '@/components/OnlineStatusIndicator';
import { useAuth } from '@/contexts/AuthContext';
import { Star, Users, DollarSign, Check, Settings, Eye, MessageSquare, Heart, Share2, Share, Image, Video, FileText, Edit, Trash2, ArrowLeft, Plus, ChevronDown, ChevronUp, User } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { BioDisplay } from '@/lib/text-utils';


// Add CSS for feed cards to match Fan feed page
const feedCardStyles = `
  .feed-card {
    @apply bg-background border border-border rounded-lg overflow-hidden hover:border-primary/20 transition-all duration-200;
  }

  .feed-card-thumbnail {
    @apply relative aspect-square bg-black overflow-hidden;
  }

  .feed-card-content {
    @apply p-2;
  }

  .feed-card-title {
    @apply font-medium text-foreground text-sm leading-tight line-clamp-2 mb-1;
  }

  .feed-card-meta {
    @apply text-xs text-muted-foreground flex items-center gap-1;
  }

  .feed-card-meta span:not(:last-child)::after {
    content: '';
  }
`;

// Mock creators database
const MOCK_CREATORS = {
  'artisticmia': {
    id: '2',
    username: 'artisticmia',
    display_name: 'Artistic Mia',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b5fd?w=150&h=150&fit=crop&crop=face',
    cover: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800&h=300&fit=crop',
    bio: 'Digital artist creating stunning fantasy worlds and characters. Join me for exclusive art tutorials, behind-the-scenes content, and early access to my latest creations.',
    subscribers: 2840,
    verified: true,
    tiers: [
      { 
        id: '1',
        name: 'Supporter', 
        price: 5,
        description: 'Access to basic content and community posts',
        features: ['Weekly art posts', 'Community access', 'Behind-the-scenes content']
      },
      { 
        id: '2',
        name: 'Fan', 
        price: 15,
        description: 'Everything in Supporter plus exclusive tutorials',
        features: ['Everything in Supporter', 'Monthly tutorials', 'Process videos', 'High-res downloads']
      },
      { 
        id: '3',
        name: 'Superfan', 
        price: 25,
        description: 'Ultimate access with personal interaction',
        features: ['Everything in Fan', 'Direct messaging', '1-on-1 feedback', 'Custom artwork requests']
      }
    ],
    recentPosts: [
      {
        id: '1',
        title: 'New Digital Art Collection',
        content: 'Check out my latest digital artwork featuring cyberpunk themes...',
        mediaType: 'image',
        tier: 'Fan',
        createdAt: '2024-02-19T10:30:00',
        thumbnail: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&h=300&fit=crop',
        likes: 24,
        comments: [
          {
            id: '1',
            author: 'johndoe',
            content: 'Amazing work! Love the color palette.',
            time: '1h ago'
          },
          {
            id: '2',
            author: 'sarahsmith',
            content: 'This is incredible! How long did it take?',
            time: '30m ago'
          }
        ]
      },
      {
        id: '2',
        title: 'Behind the Scenes Process',
        content: 'Here\'s how I create my digital masterpieces...',
        mediaType: 'video',
        tier: 'Superfan',
        createdAt: '2024-02-18T15:20:00',
        thumbnail: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop',
        likes: 18,
        comments: [
          {
            id: '3',
            author: 'mikejones',
            content: 'Thanks for sharing your process!',
            time: '2h ago'
          }
        ]
      }
    ]
  },
  'original badman': {
    id: '3',
    username: 'original badman',
    display_name: 'Original Badman',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    cover: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800&h=300&fit=crop',
    bio: 'Welcome to my creative space! I\'m just getting started on this amazing platform. Stay tuned for exciting content coming your way!',
    subscribers: 0,
    verified: false,
    tiers: [],
    recentPosts: []
  }
};

export const CreatorProfile: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(
    () => localStorage.getItem('profilePhotoUrl')
  );
  const [coverPhotoUrl, setCoverPhotoUrl] = useState<string | null>(
    () => localStorage.getItem('coverPhotoUrl')
  );
  const [displayName, setDisplayName] = useState<string | null>(
    () => localStorage.getItem('displayName')
  );
  const [bio, setBio] = useState<string | null>(
    () => localStorage.getItem('bio')
  );
  const [customTiers, setCustomTiers] = useState<any[]>([]);
  const [profileData, setProfileData] = useState<any>(null);
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [selectedContent, setSelectedContent] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedModalCaption, setExpandedModalCaption] = useState(false);
  const [showComments, setShowComments] = useState<Record<string, boolean>>({});
  const [postLikes, setPostLikes] = useState<Record<string, { liked: boolean; count: number }>>({});
  const [editingPost, setEditingPost] = useState<any | null>(null);
  const [editCaption, setEditCaption] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [creator, setCreator] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userSubscription, setUserSubscription] = useState<any>(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedTier, setSelectedTier] = useState<any>(null);
  const [isSubscriptionTiersExpanded, setIsSubscriptionTiersExpanded] = useState(false);
  const [tierDetailsModalOpen, setTierDetailsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [isCreatorLiked, setIsCreatorLiked] = useState(false);
  const [isCreatorFavorited, setIsCreatorFavorited] = useState(false);
  const [likingCreator, setLikingCreator] = useState(false);
  const [favoritingCreator, setFavoritingCreator] = useState(false);

  // Define isOwnProfile early to avoid initialization issues
  const isOwnProfile = user?.username === username;

  // Function to fetch user's posts from database
  const fetchUserPosts = async (userId: string | number) => {
    try {
      const userIdNum = typeof userId === 'string' ? parseInt(userId) : userId;

      // Build query parameters based on who's viewing
      let queryParams = `creatorId=${userIdNum}`;

      // For public profile page, only show published posts regardless of who's viewing
      // Draft posts should only be managed in the Content Manager, not on the profile page

      const response = await fetch(`/api/posts?${queryParams}`);
      if (response.ok) {
        const filteredPosts = await response.json();

        // Sort posts by creation date (newest first)
        filteredPosts.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setUserPosts(filteredPosts);

        // Initialize like status for current user
        if (user) {
          await fetchLikeStatuses(filteredPosts, Number(user.id));
        }

        console.log('Fetched user posts:', filteredPosts);
        console.log('User ID:', userIdNum, 'Is own profile:', isOwnProfile);
      }
    } catch (error) {
      console.error('Error fetching user posts:', error);
    }
  };

  // Function to fetch like statuses for posts
  const fetchLikeStatuses = async (posts: any[], userId: number) => {
    try {
      const likeStatuses: Record<string, { liked: boolean; count: number }> = {};

      for (const post of posts) {
        const response = await fetch(`/api/posts/${post.id}/like/${userId}`);
        if (response.ok) {
          const { liked } = await response.json();
          likeStatuses[post.id] = {
            liked: liked,
            count: post.likes_count || 0
          };
        } else {
          likeStatuses[post.id] = {
            liked: false,
            count: post.likes_count || 0
          };
        }
      }

      setPostLikes(likeStatuses);
    } catch (error) {
      console.error('Error fetching like statuses:', error);
    }
  };

  // Update profile data from localStorage when component mounts or when navigating
  useEffect(() => {
    const updateProfileData = () => {
      const newProfilePhotoUrl = localStorage.getItem('profilePhotoUrl');
      const newCoverPhotoUrl = localStorage.getItem('coverPhotoUrl');
      const newDisplayName = localStorage.getItem('displayName');
      const newBio = localStorage.getItem('bio');

      // Only update state if the values are different
      if (newProfilePhotoUrl !== profilePhotoUrl) setProfilePhotoUrl(newProfilePhotoUrl);
      if (newCoverPhotoUrl !== coverPhotoUrl) setCoverPhotoUrl(newCoverPhotoUrl);
      if (newDisplayName !== displayName) setDisplayName(newDisplayName);
      if (newBio !== bio) setBio(newBio);

      // Load custom tiers from localStorage
      const savedTiers = localStorage.getItem('subscriptionTiers');
      if (savedTiers) {
        try {
          const parsedTiers = JSON.parse(savedTiers);
          if (Array.isArray(parsedTiers)) {
            // Check if these are mock tiers and clear them
            const isMockData = parsedTiers.some(tier => 
              tier.name === 'Supporter' || tier.name === 'Fan' || tier.name === 'Superfan'
            );

            if (isMockData) {
              // Clear mock data and start fresh
              localStorage.removeItem('subscriptionTiers');
              setCustomTiers([]);
            } else {
              setCustomTiers(parsedTiers);
            }
          } else {
            setCustomTiers([]);
          }
        } catch (error) {
          console.error('Error parsing saved tiers:', error);
          setCustomTiers([]);
        }
      }
    };

    // Initial load
    updateProfileData();

    // Listen for localStorage changes (cross-tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'profilePhotoUrl' || e.key === 'coverPhotoUrl' || e.key === 'displayName' || e.key === 'bio' || e.key === 'subscriptionTiers') {
        updateProfileData();

        // Also trigger a re-fetch of creator data to update the UI
        if (username && user?.username === username) {
          const fetchCreatorData = async () => {
            try {
              const response = await fetch(`/api/users/username/${username}`);
              if (response.ok) {
                const userData = await response.json();
                const newProfilePhotoUrl = localStorage.getItem('profilePhotoUrl');
                const newCoverPhotoUrl = localStorage.getItem('coverPhotoUrl');
                const newDisplayName = localStorage.getItem('displayName');
                const newBio = localStorage.getItem('bio');

                setCreator((prev: any) => prev ? {
                  ...prev,
                  display_name: (newDisplayName && newDisplayName.trim()) || userData.display_name || userData.username,
                  avatar: (newProfilePhotoUrl && newProfilePhotoUrl.trim()) || userData.avatar || prev.avatar,
                  cover: (newCoverPhotoUrl && newCoverPhotoUrl.trim()) || userData.cover_image || prev.cover,
                  bio: (newBio && newBio.trim()) || userData.bio || prev.bio,
                } : null);

                console.log('Updated creator from storage event:', {
                  profilePhoto: newProfilePhotoUrl,
                  coverPhoto: newCoverPhotoUrl,
                  displayName: newDisplayName,
                  bio: newBio
                });
              }
            } catch (error) {
              console.error('Error re-fetching creator data:', error);
            }
          };
          fetchCreatorData();
        }
      }
    };

    // Listen for custom storage events (for same-tab updates)
    const handleCustomStorageChange = (e: CustomEvent) => {
      updateProfileData();

      // Refresh posts if post-related event
      if (e.detail && e.detail.type === 'postCreated' && user && user.username === username) {
        fetchUserPosts(user.id);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('localStorageChange', handleCustomStorageChange as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('localStorageChange', handleCustomStorageChange as EventListener);
    };
  }, [username]); // Remove user dependency to prevent infinite loops

  // Fetch user data from database

  // Separate useEffect for fetching user posts
  useEffect(() => {
    if (creator && creator.id) {
      fetchUserPosts(creator.id);
    }
  }, [creator?.id]); // Fetch posts for the profile being viewed

  // Fetch user's subscription to this creator
  useEffect(() => {
    const fetchUserSubscription = async () => {
      if (!user || !creator || isOwnProfile) return;

      try {
        setSubscriptionLoading(true);
        const response = await fetch(`/api/subscriptions/user/${user.id}/creator/${creator.id}`);
        if (response.ok) {
          const subscriptionData = await response.json();
          setUserSubscription(subscriptionData);
        } else {
          setUserSubscription(null);
        }
      } catch (error) {
        console.error('Error fetching subscription:', error);
        setUserSubscription(null);
      } finally {
        setSubscriptionLoading(false);
      }
    };

    fetchUserSubscription();
  }, [user, creator, isOwnProfile]);

  // Check if current user is subscribed to this creator
  useEffect(() => {
    const checkSubscription = async () => {
      if (!user || !creator || isOwnProfile) {
        setUserSubscription(null);
        return;
      }

      try {
        console.log(`Checking subscription for user ${user.id} to creator ${creator.id}`);
        const cacheBuster = Date.now();
        const response = await fetch(`/api/subscriptions/user/${user.id}/creator/${creator.id}?_=${cacheBuster}`);
        if (response.ok) {
          const subscription = await response.json();
          console.log('Subscription API response:', subscription);

          // Only set subscription if it exists, is active, and is for this creator
          if (subscription && 
              subscription.status === 'active' && 
              subscription.creator_id === creator.id) {
            setUserSubscription(subscription);
            console.log('✓ User ${user.id} has active subscription to creator ${creator.id}:', subscription);
          } else {
            setUserSubscription(null);
            console.log('✗ User ${user.id} has no active subscription to creator ${creator.id}');
          }
        } else {
          setUserSubscription(null);
          console.log('✗ No subscription found for user ${user.id} to creator ${creator.id} (${response.status})');
        }
      } catch (error) {
        console.error('Error checking subscription:', error);
        setUserSubscription(null);
      }
    };

    checkSubscription();

    // Listen for subscription changes
    const handleSubscriptionChange = (event: CustomEvent) => {
      if (event.detail && event.detail.type === 'subscriptionCreated') {
        console.log('🔄 Subscription created, refreshing subscription status...');
        checkSubscription();
      }
    };

    window.addEventListener('subscriptionStatusChange', handleSubscriptionChange as EventListener);
    return () => {
      window.removeEventListener('subscriptionStatusChange', handleSubscriptionChange as EventListener);
    };
  }, [user, creator, isOwnProfile]);

  // Check creator like and favorite status
  useEffect(() => {
    const checkCreatorInteractions = async () => {
      if (!user || !creator || isOwnProfile) {
        setIsCreatorLiked(false);
        setIsCreatorFavorited(false);
        return;
      }

      try {
        // Check like status
        const likeResponse = await fetch(`/api/creators/${creator.id}/like/${user.id}`);
        if (likeResponse.ok) {
          const likeData = await likeResponse.json();
          setIsCreatorLiked(likeData.liked);
        }

        // Check favorite status
        const favoriteResponse = await fetch(`/api/creators/${creator.id}/favorite/${user.id}`);
        if (favoriteResponse.ok) {
          const favoriteData = await favoriteResponse.json();
          setIsCreatorFavorited(favoriteData.favorited);
        }
      } catch (error) {
        console.error('Error checking creator interactions:', error);
      }
    };

    checkCreatorInteractions();
  }, [user, creator, isOwnProfile]);

  useEffect(() => {
    const fetchCreatorData = async () => {
      if (!username) return;

      try {
        setLoading(true);
        // Decode the username from URL encoding
        const decodedUsername = decodeURIComponent(username);
        const response = await fetch(`/api/users/username/${encodeURIComponent(decodedUsername)}`);
        if (response.ok) {
          const userData = await response.json();
          console.log('Creator data loaded:', userData);

          // Check localStorage for profile customizations
          const profilePhotoUrl = localStorage.getItem('profilePhotoUrl');
          const coverPhotoUrl = localStorage.getItem('coverPhotoUrl');
          const displayName = localStorage.getItem('displayName');
          const bio = localStorage.getItem('bio');

          console.log('Profile photo URL from localStorage:', profilePhotoUrl);
          console.log('Cover photo URL from localStorage:', coverPhotoUrl);
          console.log('Database avatar:', userData.avatar);
          console.log('Database cover:', userData.cover_image);
          console.log('ProfilePhotoUrl truthy check:', !!(profilePhotoUrl && profilePhotoUrl.trim()));
          console.log('Final avatar choice:', (profilePhotoUrl && profilePhotoUrl.trim()) || userData.avatar || null);

          // Clear invalid localStorage values for this user if they exist
          if (profilePhotoUrl === '' || profilePhotoUrl === 'null' || profilePhotoUrl === 'undefined') {
            localStorage.removeItem('profilePhotoUrl');
          }
          if (coverPhotoUrl === '' || coverPhotoUrl === 'null' || coverPhotoUrl === 'undefined') {
            localStorage.removeItem('coverPhotoUrl');
          }

          // Handle tiers - fetch from API
          let tiers = [];
          if (userData?.id) {
            try {
              const tiersResponse = await fetch(`/api/creators/${userData.id}/tiers`);
              if (tiersResponse.ok) {
                tiers = await tiersResponse.json();
              }
            } catch (error) {
              console.error('Error fetching tiers:', error);
            }
          }

          setCreator({
            ...userData,
            display_name: (displayName && displayName.trim()) || userData.display_name || userData.username,
            avatar: (profilePhotoUrl && profilePhotoUrl.trim()) || userData.avatar || null,
            cover: (coverPhotoUrl && coverPhotoUrl.trim()) || userData.cover_image || null,
            bio: (bio && bio.trim()) || userData.bio || null,
            subscribers: userData.total_subscribers || 0,
            tiers: tiers
          });
        } else {
          setCreator(null);
        }
      } catch (error) {
        console.error('Error fetching creator data:', error);
        setCreator(null);
      } finally {
        setLoading(false);
      }
    };

    fetchCreatorData();
  }, [username, user?.username, profilePhotoUrl, coverPhotoUrl, displayName, bio, customTiers]); // Include necessary dependencies

  const handleSubscribe = async (tierId: string) => {
    if (!user) {
      // Redirect to login with return path
      navigate(`/login?redirect=/creator/${username}`);
      return;
    }

    // Find the selected tier
    const tier = creator.tiers.find((t: any) => t.id === tierId);
    if (tier) {
      try {
        // Create subscription directly for development/testing
        const response = await fetch('/api/subscriptions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fan_id: user.id,
            creator_id: creator.id,
            tier_id: tier.id,
            status: 'active',
            auto_renew: true,
            started_at: new Date().toISOString(),
            next_billing_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          })
        });

        if (response.ok) {
          toast({
            title: "Successfully subscribed!",
            description: `You're now subscribed to ${creator.display_name}'s ${tier.name} tier.`,
          });
        } else {
          const errorData = await response.json();
          toast({
            title: "Subscription failed",
            description: errorData.error || "Failed to create subscription. Please try again.",
            variant: "destructive"
          });
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to create subscription. Please try again.",
          variant: "destructive"
        });
      }
    }
  };

  const getTimeAgo = (dateString: string) => {
    // Handle CURRENT_TIMESTAMP literal string
    if (dateString === "CURRENT_TIMESTAMP") {
      return 'Just now';
    }

    const date = new Date(dateString);

    // Check if date is invalid
    if (isNaN(date.getTime())) {
      return 'Just now';
    }

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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <Image className="w-4 h-4" />;
      case 'video':
        return <Video className="w-4 h-4" />;
      case 'text':
        return <FileText className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'public':
        return 'outline';
      case 'supporter':
        return 'secondary';
      case 'fan':
        return 'secondary';
      case 'premium':
        return 'default';
      case 'superfan':
        return 'default';
      default:
        return 'outline';
    }
  };

  const getMediaOverlayIcon = (mediaType: string) => {
    switch (mediaType?.toLowerCase()) {
      case 'image':
        return <Image className="w-4 h-4 text-white" />;
      case 'video':
        return <Video className="w-4 h-4 text-white" />;
      case 'text':
        return <FileText className="w-4 h-4 text-white" />;
      default:
        return <FileText className="w-4 h-4 text-white" />;
    }
  };

  // Check if user has access to content based on subscription tier
  const hasAccessToTier = (postTier: string): boolean => {
    // Own profile - can see all content
    if (isOwnProfile) {
      console.log('Access granted: Own profile');
      return true;
    }

    // Public content - everyone can see
    if (postTier === 'public') {
      console.log('Access granted: Public content');
      return true;
    }

    // If user is not logged in, no access to premium content
    if (!user) {
      console.log('Access denied: User not logged in');
      return false;
    }

    // If user has no active subscription to this creator, no access to premium content
    if (!userSubscription || userSubscription.status !== 'active') {
      console.log('Access denied: No active subscription', { 
        userSubscription: userSubscription,
        hasSubscription: !!userSubscription,
        subscriptionStatus: userSubscription?.status
      });
      return false;
    }

    // Verify subscription is to this specific creator
    if (userSubscription.creator_id !== creator?.id) {
      console.log('Access denied: Subscription not for this creator', { 
        subscriptionCreatorId: userSubscription.creator_id, 
        currentCreatorId: creator?.id 
      });
      return false;
    }

    // Define tier hierarchy - higher tiers include lower tier content
    const tierHierarchy: Record<string, number> = {
      'supporter': 1,
      'starter pump': 1,
      'fan': 2,
      'premium': 2,
      'power gains': 2,
      'superfan': 3,
      'elite beast mode': 3
    };

    const userTierLevel = tierHierarchy[userSubscription.tier_name?.toLowerCase()] || 0;
    const postTierLevel = tierHierarchy[postTier.toLowerCase()] || 1; // Default to tier 1 for premium content

    const hasAccess = userTierLevel >= postTierLevel;
    console.log('Tier access check:', { 
      postTier, 
      userTierLevel, 
      postTierLevel, 
      userTierName: userSubscription.tier_name,
      hasAccess,
      creatorId: creator?.id,
      userId: user?.id
    });

    return hasAccess;
  };

  // Filter posts based on active tab
  const getFilteredPosts = () => {
    if (!userPosts || !Array.isArray(userPosts)) {
      console.log('No userPosts available:', userPosts);
      return [];
    }

    console.log('Active tab:', activeTab);
    console.log('All user posts:', userPosts.map(p => ({ id: p.id, tier: p.tier, title: p.title })));

    switch (activeTab) {
      case 'free':
        const freePosts = userPosts.filter(post => {
          const tier = post.tier?.toLowerCase();
          // Handle multiple variations of "free" content
          const isFree = tier === 'public' || tier === 'free' || !tier || tier === '';
          console.log(`Post ${post.id}: tier="${post.tier}" (normalized: "${tier}") isFree: ${isFree}`);
          return isFree;
        });
        console.log('Filtered free posts:', freePosts.length, freePosts.map(p => ({ id: p.id, tier: p.tier })));
        return freePosts;
      case 'subscription':
        const subscriptionPosts = userPosts.filter(post => {
          const tier = post.tier?.toLowerCase();
          // Handle multiple variations of "public" content for exclusion
          const isSubscription = tier !== 'public' && tier !== 'free' && tier && tier !== '';
          console.log(`Post ${post.id}: tier="${post.tier}" (normalized: "${tier}") isSubscription: ${isSubscription}`);
          return isSubscription;
        });
        console.log('Filtered subscription posts:', subscriptionPosts.length, subscriptionPosts.map(p => ({ id: p.id, tier: p.tier })));
        return subscriptionPosts;
      case 'all':
      default:
        console.log('Showing all posts:', userPosts.length);
        return userPosts;
    }
  };

  // Get post counts for each tab
  const getPostCounts = () => {
    if (!userPosts || !Array.isArray(userPosts)) return { all: 0, subscription: 0, free: 0 };

    const counts = {
      all: userPosts.length,
      subscription: userPosts.filter(post => {
        const tier = post.tier?.toLowerCase();
        return tier !== 'public' && tier !== 'free' && tier && tier !== '';
      }).length,
      free: userPosts.filter(post => {
        const tier = post.tier?.toLowerCase();
        return tier === 'public' || tier === 'free' || !tier || tier === '';
      }).length
    };

    console.log('Post counts:', counts);
    console.log('Posts by tier:', userPosts.map(p => ({ id: p.id, tier: p.tier, tierLower: p.tier?.toLowerCase() })));
    
    return counts;
  };

  const handleContentClick = (post: any) => {
    // Check access control first
    if (!hasAccessToTier(post.tier)) {
      console.log('Access denied for post tier:', post.tier);
      // Show subscription prompt and scroll to tiers section
      const tiersSection = document.getElementById('subscription-tiers');
      if (tiersSection) {
        tiersSection.scrollIntoView({ behavior: 'smooth' });
        // Expand tiers if they're collapsed
        if (!isSubscriptionTiersExpanded) {
          setIsSubscriptionTiersExpanded(true);
        }
      }
      return;
    }

    // For video content, check aspect ratio to determine navigation behavior
    if (post.media_type === 'video' && post.media_urls) {
      const mediaUrls = Array.isArray(post.media_urls) ? post.media_urls : [post.media_urls];
      const mediaUrl = mediaUrls[0];
      const fullUrl = mediaUrl?.startsWith('/uploads/') ? mediaUrl : `/uploads/${mediaUrl}`;

      // Create a temporary video element to detect aspect ratio
      const media = document.createElement('video');
      media.src = fullUrl;
      media.onloadedmetadata = () => {
        const aspectRatio = media.videoWidth / media.videoHeight;

        if (aspectRatio > 1) {
          // 16:9 or landscape video - navigate to YouTube-style watch page
          navigate(`/video/${post.id}`);
        } else {
          // 9:16 or portrait video - open Instagram-style modal
          const modalData = {
            ...post,
            mediaPreview: fullUrl,
            type: 'Video',
            caption: post.content || post.title
          };
          setSelectedContent(modalData);
          setIsModalOpen(true);
        }
      };

      // Fallback for when metadata can't be loaded - assume landscape for watch page
      media.onerror = () => {
        navigate(`/video/${post.id}`);
      };
    } else {
      // For non-video content, always navigate to watch page
      navigate(`/video/${post.id}`);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedContent(null);
    setExpandedModalCaption(false);
  };

  // Handler functions for post interactions
  const handleLike = async (postId: string) => {
    if (!user) return;

    try {
      const currentLike = postLikes[postId] || { liked: false, count: 0 };

      if (currentLike.liked) {
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
      setPostLikes(prev => ({
        ...prev,
        [postId]: {
          liked: !currentLike.liked,          count: currentLike.liked ? currentLike.count - 1 : currentLike.count + 1
        }
      }));

      // Refetch posts to get updated counts from database
      if (creator?.id) {
        fetchUserPosts(creator.id);
      }
    } catch (error) {
      console.error('Error liking post:', error);
      toast({
        title: "Error",
        description: "Failed to like post. Please try again.",
      });
    }
  };

  const handleCommentClick = (postId: string) => {
    setShowComments(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  const handleCommentCountChange = (postId: string | number, newCount: number) => {
    setUserPosts(prev => prev.map(post => 
      post.id.toString() === postId.toString() 
        ? { ...post, comments_count: newCount }
        : post
    ));
  };

  const handleShare = (postId: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/post/${postId}`);
    toast({
      title: "Link copied",
      description: "Post link has been copied to your clipboard.",
    });
  };

  // Chat initiation functionality
  const initiateChatMutation = useMutation({
    mutationFn: async (creatorId: number) => {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otherUserId: creatorId }),
      });
      if (!response.ok) throw new Error('Failed to create conversation');
      return response.json();
    },
    onSuccess: async (data) => {
      // Store the conversation ID in sessionStorage so Messages component can auto-select it
      sessionStorage.setItem('autoSelectConversationId', data.conversationId.toString());

      // Show success message
      toast({
        title: "Chat started!",
        description: `You can now message ${creator?.display_name}.`,
      });

      // Wait a moment to ensure conversation is created, then navigate
      setTimeout(() => {
        // Invalidate conversations query to refresh the list
        queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
        // Navigate to messages page using React Router
        navigate('/fan/messages');
      }, 500);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to start conversation. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleChatClick = async () => {
    if (!user) {
      // Redirect to login if not authenticated
      navigate(`/login?redirect=/creator/${username}`);
      return;
    }

    if (user.role !== 'fan') {
      toast({
        title: "Access Restricted",
        description: "Only fans can initiate conversations with creators.",
        variant: "destructive"
      });
      return;
    }

    // Force refresh the subscription status before checking
    console.log('🔄 Refreshing subscription status before messaging...');
    if (!creator) {
      console.log('❌ No creator found');
      return;
    }

    try {
      const response = await fetch(`/api/subscriptions/user/${user.id}/creator/${creator.id}`);
      if (response.ok) {
        const subscription = await response.json();
        console.log('💬 Fresh subscription check for messaging:', subscription);

        if (subscription && subscription.status === 'active' && subscription.creator_id === creator.id) {
          console.log('✅ Subscription confirmed for messaging');
          setUserSubscription(subscription);
          if (creator?.id) {
            initiateChatMutation.mutate(creator.id);
          }
          return;
        }
      }
    } catch (error) {
      console.error('Error in handleChatClick:', error);
    }

    console.log('❌ No valid subscription found for messaging');
    toast({
      title: "Subscription Required",
      description: "You need an active subscription to message this creator.",
      variant: "destructive"
    });
    // Scroll to subscription tiers
    document.getElementById('subscription-tiers')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleCreatorLike = async () => {
    if (!user || !creator || isOwnProfile) {
      return;
    }

    if (user.role !== 'fan') {
      toast({
        title: "Access Restricted",
        description: "Only fans can like creators.",
        variant: "destructive"
      });
      return;
    }

    setLikingCreator(true);

    try {
      if (isCreatorLiked) {
        // Unlike creator
        const response = await fetch(`/api/creators/${creator.id}/like`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ fanId: user.id }),
        });

        if (response.ok) {
          setIsCreatorLiked(false);
          toast({
            title: "Unliked",
            description: `You no longer like ${creator.display_name || creator.username}.`,
          });
        }
      } else {
        // Like creator
        const response = await fetch(`/api/creators/${creator.id}/like`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ fanId: user.id }),
        });

        if (response.ok) {
          setIsCreatorLiked(true);
          toast({
            title: "Liked!",
            description: `You liked ${creator.display_name || creator.username}.`,
          });
        }
      }
    } catch (error) {
      console.error('Error toggling creator like:', error);
      toast({
        title: "Error",
        description: "Failed to update like status. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLikingCreator(false);
    }
  };

  const handleCreatorFavorite = async () => {
    if (!user || !creator || isOwnProfile) {
      return;
    }

    if (user.role !== 'fan') {
      toast({
        title: "Access Restricted",
        description: "Only fans can favorite creators.",
        variant: "destructive"
      });
      return;
    }

    setFavoritingCreator(true);

    try {
      if (isCreatorFavorited) {
        // Remove from favorites
        const response = await fetch(`/api/creators/${creator.id}/favorite`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ fanId: user.id }),
        });

        if (response.ok) {
          setIsCreatorFavorited(false);
          toast({
            title: "Removed from favorites",
            description: `${creator.display_name || creator.username} removed from your favorites.`,
          });
        }
      } else {
        // Add to favorites
        const response = await fetch(`/api/creators/${creator.id}/favorite`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ fanId: user.id }),
        });

        if (response.ok) {
          setIsCreatorFavorited(true);
          toast({
            title: "Added to favorites!",
            description: `${creator.display_name || creator.username} added to your favorites.`,
          });
        }
      }
    } catch (error) {
      console.error('Error toggling creator favorite:', error);
      toast({
        title: "Error",
        description: "Failed to update favorite status. Please try again.",
        variant: "destructive"
      });
    } finally {
      setFavoritingCreator(false);
    }
  };

  const handleEdit = (postId: string) => {
    const post = userPosts.find(p => p.id === postId);
    if (post) {
      setEditingPost(post);
      setEditCaption(post.content || post.title);
      setIsEditModalOpen(true);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingPost) return;

    try {
      const response = await fetch(`/api/posts/${editingPost.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: editCaption,
          content: editCaption,
        })
      });

      if (response.ok) {
        const updatedPost = await response.json();
        setUserPosts(prev => prev.map(post => 
          post.id === editingPost.id 
            ? { ...post, title: editCaption, content: editCaption }
            : post
        ));
        setIsEditModalOpen(false);
        setEditingPost(null);
        toast({
          title: "Post updated",
          description: "Your post has been successfully updated.",
        });
      } else {
        throw new Error('Failed to update post');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update post. Please try again.",
      });
    }
  };

  const handleCancelEdit = () => {
    setIsEditModalOpen(false);
    setEditingPost(null);
    setEditCaption('');
  };

  const handleDelete = (postId: string) => {
    // Show confirmation dialog and delete post
    const confirmDelete = window.confirm("Are you sure you want to delete this post? This action cannot be undone.");
    if (confirmDelete) {
      // Here you would typically make an API call to delete the post
      setUserPosts(prev => prev.filter(post => post.id !== postId));
      toast({
        title: "Post deleted",
        description: "Your post has been successfully deleted.",
      });
    }
  };

  // Show loading state while data is being fetched
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading creator profile...</p>
        </div>
      </div>
    );
  }

  if (!creator) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Creator Not Found</h1>
          <p className="text-muted-foreground">The creator profile you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  const handleEditPost = (postId: string) => {
    const post = userPosts.find(p => p.id === postId);
    if (post) {
      setEditingPost(post);
      setEditCaption(post.content || post.title);
      setIsEditModalOpen(true);
    }
  };

  const handleDeletePost = (postId: string) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this post? This action cannot be undone.");
    if (confirmDelete) {
      // Simulate deletion
      setUserPosts(prev => prev.filter(post => post.id !== postId));
      toast({
        title: "Post deleted",
        description: "Your post has been successfully deleted.",
      });
    }
  };

  return (
    <>
      <style>{feedCardStyles}</style>
      <div className="min-h-screen bg-background">

      {/* Creator Header */}
      <div className="relative">
        <div className="h-48 md:h-64 overflow-hidden relative">
          {creator.cover ? (
            <img 
              src={creator.cover.startsWith('/uploads/') ? creator.cover : `/uploads/${creator.cover}`} 
              alt={creator.display_name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-primary/20 to-accent/20 flex items-center justify-center">
              <span className="text-muted-foreground hidden md:block">No cover photo</span>
            </div>
          )}

          {/* Cover Photo Upload Button - Only show for own profile and when no cover photo */}
          {isOwnProfile && !creator.cover && (
            <div className="absolute top-4 right-4">
              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-10 w-10 p-0 bg-background/80 backdrop-blur-sm border-2 border-border hover:bg-background/90 transition-colors"
                  title="Add cover photo"
                  onClick={() => document.getElementById('header-cover-upload')?.click()}
                >
                  <Plus className="w-4 h-4" />
                </Button>
                <input
                  id="header-cover-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      try {
                        const formData = new FormData();
                        formData.append('coverPhoto', file);

                        const response = await fetch('/api/upload/cover-photo', {
                          method: 'POST',
                          body: formData,
                        });

                        if (!response.ok) throw new Error('Upload failed');

                        const result = await response.json();

                        // Update localStorage and trigger re-render
                        localStorage.setItem('coverPhotoUrl', result.url);
                        window.dispatchEvent(new CustomEvent('localStorageChange', {
                          detail: { keys: ['coverPhotoUrl'] }
                        }));

                        toast({
                          title: "Cover photo updated",
                          description: "Your cover photo has been updated successfully.",
                        });
                      } catch (error) {
                        toast({
                          title: "Upload failed",
                          description: "Failed to upload cover photo. Please try again.",
                          variant: "destructive",
                        });
                      }
                    }
                  }}
                />
              </div>
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent"></div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="max-w-4xl mx-auto flex items-end gap-3">
            <div className="relative">
              <Avatar className="w-24 h-24 border-4 border-background">
                <AvatarImage src={creator.avatar ? (creator.avatar.startsWith('/uploads/') ? creator.avatar : `/uploads/${creator.avatar}`) : undefined} alt={creator.username} />
                <AvatarFallback className="text-2xl">{(creator?.display_name || creator?.username || 'U').charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>

              {/* Online status dot overlay */}
              {creator.activity_status_visible && creator.is_online && (
                <div className="absolute w-3 h-3 bg-green-500 rounded-full border-2 border-background shadow-lg z-30" style={{ bottom: '3px', right: '3px' }}></div>
              )}</div>

            {/* Desktop Layout - Action buttons on the right */}
            <div className="hidden md:flex w-full items-end justify-between">
              <div className="flex-1 pb-2">
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-xl font-semibold text-foreground">{creator?.display_name || creator?.username}</h1>
                  {creator.verified && (
                    <Badge variant="secondary" className="bg-accent text-accent-foreground">
                      <Star className="w-3 h-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                </div>
<div className="flex items-center gap-2">
                <p className="text-sm text-muted-foreground">@{creator.username}</p>
              </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                  <Users className="w-4 h-4" />
                  {(creator?.total_subscribers || 0).toLocaleString()} subscribers
                </div>
              </div>
            </div>

            {/* Mobile Layout - Clean profile info only */}
            <div className="md:hidden flex-1 pb-2">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-xl font-semibold text-foreground">{creator?.display_name || creator?.username}</h1>
                {creator.verified && (
                  <Badge variant="secondary" className="bg-accent text-accent-foreground">
                    <Star className="w-3 h-3 mr-1" />
                    Verified
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <p className="text-sm text-muted-foreground">@{creator.username}</p>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                <Users className="w-4 h-4" />
                {(creator?.total_subscribers || 0).toLocaleString()} subscribers
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bio Section */}
      <div className="max-w-4xl mx-auto px-6 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            {(() => {
              const bioText = creator.bio || (isOwnProfile ? 'Add a bio to tell people about yourself.' : 'No bio available.');

              return (
                <div>
                  <BioDisplay 
                    bio={bioText}
                    context="profile"
                    className="text-muted-foreground leading-tight text-sm line-clamp-2"
                  />
                </div>
              );
            })()}
          </div>
        </div>

        {/* Action Buttons - Both Desktop and Mobile */}
        {isOwnProfile ? (
          <div className="flex items-center gap-2 mt-4">
            <Button 
              variant="outline" 
              size="sm" 
              className="h-10 w-10 p-0"
              title="Edit Profile"
              asChild
            >
              <Link to="/creator/settings">
                <Settings className="w-4 h-4" />
              </Link>
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-10 w-10 p-0"
              title="Create Post"
              asChild
            >
              <Link to="/creator/upload">
                <Plus className="w-4 h-4" />
              </Link>
            </Button>
            {/* Profile Photo Upload Button - Modern placement */}
            {!creator.avatar && (
              <Button
                variant="outline"
                size="sm"
                className="h-10 w-10 p-0"
                title="Add profile photo"
                asChild
              >
                <Link to="/creator/settings?tab=profile">
                  <User className="w-4 h-4" />
                </Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 mt-4">
            <Button 
              variant="outline" 
              size="sm" 
              className="h-10 w-10 p-0"
              title="Start conversation"
              onClick={handleChatClick}
              disabled={initiateChatMutation.isPending}
            >
              <MessageSquare className="w-4 h-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-10 w-10 p-0"
              title="Like creator"
              disabled={likingCreator || isOwnProfile || !user || user.role !== 'fan'}
              onClick={handleCreatorLike}
            >
              <Heart className={`w-4 h-4 ${isCreatorLiked ? 'fill-red-500 text-red-500' : ''}`} />
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-10 w-10 p-0"
              title="Add to favorites"
              disabled={favoritingCreator || isOwnProfile || !user || user.role !== 'fan'}
              onClick={handleCreatorFavorite}
            >
              <Star className={`w-4 h-4 ${isCreatorFavorited ? 'fill-yellow-500 text-yellow-500' : ''}`} />
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-10 w-10 p-0"
              title="Share profile"
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                toast({
                  title: "Profile link copied",
                  description: "Creator profile link has been copied to your clipboard.",
                });
              }}
            >
              <Share className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Compact Subscription Tiers - Show for profiles with tiers (Mobile + Desktop) */}
      {creator?.tiers && creator.tiers.length > 0 && (
        <div id="subscription-tiers" className="mx-4 mb-6 max-w-4xl md:mx-auto md:px-6">
          <div className="bg-gradient-card border border-border/50 rounded-lg shadow-sm overflow-hidden">
            {!isSubscriptionTiersExpanded ? (
              /* Compact View */
              <div 
                className="p-4 md:p-6 cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => setIsSubscriptionTiersExpanded(true)}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-base md:text-lg font-semibold">SUBSCRIBE NOW</h3>
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="flex items-center gap-3 md:gap-3 flex-wrap">
                      {creator.tiers.slice(0, 3).map((tier: any, index: number) => (
                        <div key={tier.id} className="flex items-center gap-1">
                          <span className="text-sm md:text-base font-medium text-accent whitespace-nowrap">GHS {tier.price}</span>
                          {index < Math.min(creator.tiers.length - 1, 2) && (
                            <span className="text-xs md:text-sm text-muted-foreground mx-1">•</span>
                          )}
                        </div>
                      ))}
                      {creator.tiers.length > 3 && (
                        <span className="text-xs md:text-sm text-muted-foreground whitespace-nowrap">+{creator.tiers.length - 3} more</span>
                      )}
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    {isOwnProfile ? (
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="px-3 py-2 text-sm font-medium rounded-full md:px-6 md:py-3"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsSubscriptionTiersExpanded(true);
                        }}
                      >
                        MANAGE
                      </Button>
                    ) : (
                      <Button 
                        size="sm" 
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 text-sm font-medium rounded-full md:px-6 md:py-3"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsSubscriptionTiersExpanded(true);
                        }}
                      >
                        NOW
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* Expanded View */
              <div className="p-4 md:p-6">
                <div className="flex items-center justify-between mb-4 md:mb-6">
                  <h3 className="text-base md:text-lg font-semibold">SUBSCRIPTION TIERS</h3>
                  <button 
                    onClick={() => setIsSubscriptionTiersExpanded(false)}
                    className="p-1 hover:bg-muted/50 rounded-full transition-colors"
                  >
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-3">
                  {creator.tiers.map((tier: any, index: number) => (
                    <div 
                      key={tier.id} 
                      className={`flex flex-col p-4 md:p-5 border border-border/30 rounded-lg hover:border-accent/50 transition-colors ${!isOwnProfile ? 'cursor-pointer hover:shadow-md' : ''}`}
                      onClick={!isOwnProfile ? (e) => {
                        e.stopPropagation();
                        console.log('Tier clicked:', tier);
                        setSelectedTier(tier);
                        // Check if user is logged in
                        if (!user) {
                          window.location.href = `/login?redirect=/creator/${username}`;
                          return;
                        }
                        // Open payment modal directly for better UX
                        setPaymentModalOpen(true);
                      } : undefined}
                    >
                      <div className="flex-1 mb-4">
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <span className="text-sm md:text-base font-medium uppercase leading-tight">{tier.name}</span>
                          {index === 0 && creator.tiers.length > 1 && (
                            <span className="text-xs bg-accent/20 text-accent px-2 py-1 rounded-full flex-shrink-0">POPULAR</span>
                          )}
                        </div>
                        <div className="min-h-[3rem]">
                          <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                            {tier.description || 'Access to exclusive content and connect directly with the creator'}
                          </p>
                        </div>
                      </div>
                      <div className="border-t border-border/20 pt-3">
                        <div className="text-lg md:text-xl font-bold text-accent">GHS {tier.price}</div>
                        <div className="text-xs md:text-sm text-muted-foreground">per month</div>
                      </div>
                    </div>
                  ))}
                </div>

                {isOwnProfile && (
                  <div className="mt-4 pt-4 border-t border-border/20">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full md:w-auto text-sm"
                      asChild
                    >
                      <Link to="/creator/tiers">
                        <Settings className="w-4 h-4 mr-2" />
                        Edit Tiers
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-4xl mx-auto md:px-6 py-8">
        <div className="space-y-6">
          {/* Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            {/* Tab Navigation */}
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all" className="text-sm">
                All ({getPostCounts().all})
              </TabsTrigger>
              <TabsTrigger value="subscription" className="text-sm">
                Subscription ({getPostCounts().subscription})
              </TabsTrigger>
              <TabsTrigger value="free" className="text-sm">
                Free ({getPostCounts().free})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-6">
              {/* All Posts Content */}
              <div>
            {getFilteredPosts().length > 0 ? (
              <>
                {/* Mobile: Edge-to-edge borderless layout like fan feed */}
                <div className="md:hidden">
                  <div className="w-full bg-background space-y-0 scrollbar-hide mobile-feed-container" style={{
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none'
                  }}>
                    {getFilteredPosts().map((post) => (
                      <div key={post.id} className="w-full bg-background border-b border-border/20 overflow-hidden">
                        <div 
                          className="relative w-full aspect-video bg-black cursor-pointer"
                          onClick={() => handleContentClick(post)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              handleContentClick(post);
                            }
                          }}
                        >
                          {(() => {
                            const hasAccess = hasAccessToTier(post.tier);

                            if (!hasAccess) {
                              return (
                                <div className="w-full h-full bg-gradient-to-br from-accent/20 to-accent/10 flex items-center justify-center relative">
                                  <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
                                  <div className="text-center z-10 p-4">
                                    <div className="mb-3">
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
                                      className="bg-accent hover:bg-accent/90 text-black text-xs px-2 py-1"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (!user) {
                                          window.location.href = `/login?redirect=/creator/${username}`;
                                        } else {
                                          document.getElementById('subscription-tiers')?.scrollIntoView({ behavior: 'smooth' });
                                        }
                                      }}
                                    >
                                      {!user ? 'Login' : 'Subscribe'}
                                    </Button>
                                  </div>
                                </div>
                              );
                            }

                            const mediaUrls = Array.isArray(post.media_urls) ? post.media_urls : [post.media_urls];
                            const mediaUrl = mediaUrls[0];

                            if (mediaUrl) {
                              const fullUrl = mediaUrl.startsWith('/uploads/') ? mediaUrl : `/uploads/${mediaUrl}`;

                              return post.media_type === 'video' ? (
                                <video 
                                  src={fullUrl}
                                  className="w-full h-full object-cover"
                                  muted
                                  preload="metadata"
                                />
                              ) : (
                                <img 
                                  src={fullUrl}
                                  alt={post.title}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy92MDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjZjNmNGY2Ii8+CjxwYXRoIGQ9Ik0xMDAgNzVMMTI1IDEwMEgxMTJWMTI1SDg4VjEwMEg3NUwxMDAgNzVaIiBmaWxsPSIjOWNhM2FmIi8+Cjx0ZXh0IHg9IjEwMCIgeT0iMTUwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOWNhM2FmIiBmb250LXNpemU9IjEyIj5JbWFnZSBub3QgZm91bmQ8L3RleHQ+Cjwvc3ZnPg==';
                                    target.className = "w-full h-full object-cover opacity-50";
                                  }}
                                />
                              );
                            } else {
                              return (
                                <img 
                                  src={post.id === '1' ? 'https://placehold.co/640x360/E63946/FFFFFF?text=Creator+Post+1' :
                                       post.id === '2' ? 'https://placehold.co/640x360/457B9D/FFFFFF?text=Creator+Post+2' :
                                       post.id === '3' ? 'https://placehold.co/640x360/1D3557/FFFFFF?text=Creator+Post+3' :
                                       `https://placehold.co/640x360/6366F1/FFFFFF?text=Creator+Post+${post.id}`}
                                  alt={`${creator.display_name}'s post`}
                                  className="w-full h-full object-cover"
                                />
                              );
                            }
                          })()}

                          {/* No overlays here for mobile */}
                        </div>

                        {/* Bottom section - VideoWatch Up Next style */}
                        <div className="p-3">
                          {/* Creator Info and Content - Fan Feed Single View Style */}
                          <div className="flex gap-3">
                            <Avatar className="h-9 w-9 flex-shrink-0">
                              <AvatarImage src={creator.avatar ? (creator.avatar.startsWith('/uploads/') ? creator.avatar : `/uploads/${creator.avatar}`) : undefined} alt={creator.username} />
                              <AvatarFallback className="text-sm">{(creator?.display_name || creator?.username || 'U').charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-medium text-foreground line-clamp-2 mb-1">
                                {post.content || post.title || 'Untitled Post'}
                              </h4>

                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                  <span className="truncate">{creator.display_name}</span>
                                  <div className="flex items-center gap-1 flex-shrink-0">
                                    <Eye className="w-3 h-3" />
                                    <span>{Math.floor(Math.random() * 2000) + 100}</span>
                                    <span>•</span>
                                  <span>{getTimeAgo(post.created_at || post.createdAt)}</span>
                                  </div>
                                </div>

                                {/* Action Buttons Row - VideoWatch Style */}
                                <div className="flex items-center justify-between mt-2 overflow-hidden">
                                  <div className="flex items-center gap-4 flex-1 min-w-0">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className={`flex items-center gap-1 h-auto py-2 px-2 ${postLikes[post.id]?.liked ? 'text-red-500' : 'text-muted-foreground'}`}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleLike(post.id);
                                      }}
                                    >
                                      <Heart className={`w-4 h-4 ${postLikes[post.id]?.liked ? 'fill-current' : ''}`} />
                                      <span className="text-sm">{postLikes[post.id]?.count || 0}</span>
                                    </Button>

                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="flex items-center gap-1 h-auto py-2 px-2 text-muted-foreground"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleCommentClick(post.id);
                                      }}
                                    >
                                      <MessageSquare className="w-4 h-4" />
                                      <span className="text-sm">{post.comments_count || 0}</span>
                                    </Button>

                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="flex items-center gap-1 h-auto py-2 px-2 text-muted-foreground" 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleShare(post.id);
                                      }}
                                    >
                                      <Share2 className="w-4 h-4" />
                                      <span className="text-sm">Share</span>
                                    </Button>
                                  </div>

                                  {/* Creator Edit/Delete Actions - Only for own posts */}
                                  {isOwnProfile && (
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="flex items-center gap-1 h-auto py-2 px-2 text-muted-foreground hover:text-foreground"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleEditPost(post.id);
                                        }}
                                      >
                                        <Edit className="w-4 h-4" />
                                        <span className="text-sm">Edit</span>
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="flex items-center gap-1 h-auto py-2 px-2 text-red-500 hover:text-red-600"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDeletePost(post.id);
                                        }}
                                      >
                                        <Trash2 className="w-4 h-4" />
                                        <span className="text-sm">Delete</span>
                                      </Button>
                                    </div>
                                  )}
                                </div>

                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Desktop: YouTube-style 16:9 card layout */}
                <div className="hidden md:block">
                  <div className="max-w-4xl mx-auto space-y-6">
                    {getFilteredPosts().map((post) => (
                      <Card key={post.id} className="bg-gradient-card border-border/50 overflow-hidden">
                        <CardContent className="p-4">
                          {/* Media Content - 16:9 aspect ratio */}
                          <div 
                            className="relative aspect-video bg-black cursor-pointer rounded-lg overflow-hidden mb-4"
                            onClick={() => handleContentClick(post)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                handleContentClick(post);
                              }
                            }}
                          >
                            {(() => {
                              const hasAccess = hasAccessToTier(post.tier);

                              if (!hasAccess) {
                                return (
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
                                      <p className="text-sm text-muted-foreground mb-3">
                                        Subscribe to unlock
                                      </p>
                                      <Button 
                                        size="sm" 
                                        className="bg-accent hover:bg-accent/90 text-black text-sm px-4"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (!user) {
                                            window.location.href = `/login?redirect=/creator/${username}`;
                                          } else {
                                            document.getElementById('subscription-tiers')?.scrollIntoView({ behavior: 'smooth' });
                                          }
                                        }}
                                      >
                                        {!user ? 'Login' : 'Subscribe'}
                                      </Button>
                                    </div>
                                  </div>
                                );
                              }

                              const mediaUrls = Array.isArray(post.media_urls) ? post.media_urls : [post.media_urls];
                              const mediaUrl = mediaUrls[0];

                              if (mediaUrl) {
                                const fullUrl = mediaUrl.startsWith('/uploads/') ? mediaUrl : `/uploads/${mediaUrl}`;

                                return post.media_type === 'video' ? (
                                  <video 
                                    src={fullUrl}
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
                                    src={fullUrl}
                                    alt={post.title}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy92MDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjZjNmNGY2Ii8+CjxwYXRoIGQ9Ik0xMDAgNzVMMTI1IDEwMEgxMTJWMTI1SDg4VjEwMEg3NUwxMDAgNzVaIiBmaWxsPSIjOWNhM2FmIi8+Cjx0ZXh0IHg9IjEwMCIgeT0iMTUwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOWNhM2FmIiBmb250LXNpemU9IjEyIj5JbWFnZSBub3QgZm91bmQ8L3RleHQ+Cjwvc3ZnPg==';
                                      target.className = "w-full h-full object-cover opacity-50";
                                    }}
                                  />
                                );
                              } else {
                                return (
                                  <img 
                                    src={`https://placehold.co/1280x720/6366F1/FFFFFF?text=Creator+Post+${post.id}`}
                                    alt={`${creator.display_name}'s post`}
                                    className="w-full h-full object-cover"
                                  />
                                );
                              }
                            })()}


                            {/* No overlays here for desktop */}
                          </div>

                          {/* Creator Info and Content - Fan Feed Single View Style */}
                          <div className="flex gap-3">
                            <Avatar className="h-9 w-9 flex-shrink-0">
                              <AvatarImage src={creator.avatar ? (creator.avatar.startsWith('/uploads/') ? creator.avatar : `/uploads/${creator.avatar}`) : undefined} alt={creator.username} />
                              <AvatarFallback className="text-sm">{(creator?.display_name || creator?.username || 'U').charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-medium text-foreground line-clamp-2 mb-1">
                                {post.content || post.title || 'Untitled Post'}
                              </h4>

                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                  <span className="truncate">{creator.display_name}</span>
                                  <div className="flex items-center gap-1 flex-shrink-0">
                                    <Eye className="w-3 h-3" />
                                    <span>{Math.floor(Math.random() * 2000) + 100}</span>
                                    <span>•</span>
                                  <span>{getTimeAgo(post.created_at || post.createdAt)}</span>
                                  </div>
                                </div>

                                {/* Action Buttons Row - VideoWatch Style */}
                                <div className="flex items-center justify-between mt-2 overflow-hidden">
                                  <div className="flex items-center gap-6 flex-1 min-w-0">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className={`flex items-center gap-2 h-auto py-2 px-3 ${postLikes[post.id]?.liked ? 'text-red-500' : 'text-muted-foreground'}`}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleLike(post.id);
                                      }}
                                    >
                                      <Heart className={`w-5 h-5 ${postLikes[post.id]?.liked ? 'fill-current' : ''}`} />
                                      <span className="text-sm">{postLikes[post.id]?.count || 0}</span>
                                    </Button>

                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="flex items-center gap-2 h-auto py-2 px-3 text-muted-foreground"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleCommentClick(post.id);
                                      }}
                                    >
                                      <MessageSquare className="w-5 h-5" />
                                      <span className="text-sm">{post.comments_count || 0}</span>
                                    </Button>

                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="flex items-center gap-2 h-auto py-2 px-3 text-muted-foreground" 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleShare(post.id);
                                      }}
                                    >
                                      <Share2 className="w-5 h-5" />
                                      <span className="text-sm">Share</span>
                                    </Button>
                                  </div>

                                  {/* Creator Edit/Delete Actions - Only for own posts */}
                                  {isOwnProfile && (
                                    <div className="flex items-center gap-3 flex-shrink-0">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="flex items-center gap-2 h-auto py-2 px-3 text-muted-foreground hover:text-foreground"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleEditPost(post.id);
                                        }}
                                      >
                                        <Edit className="w-4 h-4" />
                                        <span className="text-sm">Edit</span>
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="flex items-center gap-2 h-auto py-2 px-3 text-red-500 hover:text-red-600"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDeletePost(post.id);
                                        }}
                                      >
                                        <Trash2 className="w-4 h-4" />
                                        <span className="text-sm">Delete</span>
                                      </Button>
                                    </div>
                                  )}
                                </div>

                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
                </>
              ) : (
                <Card className="bg-gradient-card border-border/50">
                  <CardContent className="p-6">
                    <div className="text-center py-4">
                      <DollarSign className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">No posts in this category</h3>
                      <p className="text-muted-foreground text-sm">
                        {activeTab === 'all' 
                          ? (isOwnProfile ? 'Start creating content to build your audience.' : `${creator.display_name} hasn't posted any content yet.`)
                          : activeTab === 'free'
                          ? (isOwnProfile ? 'No free posts yet. Create some free content to attract new fans.' : `${creator.display_name} hasn't posted any free content yet.`)
                          : (isOwnProfile ? 'No subscription content yet. Create premium posts for your subscribers.' : `${creator.display_name} hasn't posted any subscription content yet.`)
                        }
                      </p>
                    </div>
                  </CardContent>
                </Card>
            )}
              </div>
            </TabsContent>

            <TabsContent value="subscription" className="space-y-6">
              {/* Subscription Posts Content */}
              <div>
            {getFilteredPosts().length > 0 ? (
              <>
                {/* Mobile: Edge-to-edge borderless layout like fan feed */}
                <div className="md:hidden">
                  <div className="w-full bg-background space-y-0 scrollbar-hide mobile-feed-container" style={{
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none'
                  }}>
                    {getFilteredPosts().map((post) => (
                      <div key={post.id} className="w-full bg-background border-b border-border/20 overflow-hidden">
                        <div 
                          className="relative w-full aspect-video bg-black cursor-pointer"
                          onClick={() => handleContentClick(post)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              handleContentClick(post);
                            }
                          }}
                        >
                          {(() => {
                            const hasAccess = hasAccessToTier(post.tier);

                            if (!hasAccess) {
                              return (
                                <div className="w-full h-full bg-gradient-to-br from-accent/20 to-accent/10 flex items-center justify-center relative">
                                  <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
                                  <div className="text-center z-10 p-4">
                                    <div className="mb-3">
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
                                      className="bg-accent hover:bg-accent/90 text-black text-xs px-2 py-1"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (!user) {
                                          window.location.href = `/login?redirect=/creator/${username}`;
                                        } else {
                                          document.getElementById('subscription-tiers')?.scrollIntoView({ behavior: 'smooth' });
                                        }
                                      }}
                                    >
                                      {!user ? 'Login' : 'Subscribe'}
                                    </Button>
                                  </div>
                                </div>
                              );
                            }

                            const mediaUrls = Array.isArray(post.media_urls) ? post.media_urls : [post.media_urls];
                            const mediaUrl = mediaUrls[0];

                            if (mediaUrl) {
                              const fullUrl = mediaUrl.startsWith('/uploads/') ? mediaUrl : `/uploads/${mediaUrl}`;

                              return post.media_type === 'video' ? (
                                <video 
                                  src={fullUrl}
                                  className="w-full h-full object-cover"
                                  muted
                                  preload="metadata"
                                />
                              ) : (
                                <img 
                                  src={fullUrl}
                                  alt={post.title}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy92MDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjZjNmNGY2Ii8+CjxwYXRoIGQ9Ik0xMDAgNzVMMTI1IDEwMEgxMTJWMTI1SDg4VjEwMEg3NUwxMDAgNzVaIiBmaWxsPSIjOWNhM2FmIi8+Cjx0ZXh0IHg9IjEwMCIgeT0iMTUwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOWNhM2FmIiBmb250LXNpemU9IjEyIj5JbWFnZSBub3QgZm91bmQ8L3RleHQ+Cjwvc3ZnPg==';
                                    target.className = "w-full h-full object-cover opacity-50";
                                  }}
                                />
                              );
                            } else {
                              return (
                                <img 
                                  src={post.id === '1' ? 'https://placehold.co/640x360/E63946/FFFFFF?text=Creator+Post+1' :
                                       post.id === '2' ? 'https://placehold.co/640x360/457B9D/FFFFFF?text=Creator+Post+2' :
                                       post.id === '3' ? 'https://placehold.co/640x360/1D3557/FFFFFF?text=Creator+Post+3' :
                                       `https://placehold.co/640x360/6366F1/FFFFFF?text=Creator+Post+${post.id}`}
                                  alt={`${creator.display_name}'s post`}
                                  className="w-full h-full object-cover"
                                />
                              );
                            }
                          })()}

                          {/* No overlays here for mobile */}
                        </div>

                        {/* Bottom section - VideoWatch Up Next style */}
                        <div className="p-3">
                          {/* Creator Info and Content - Fan Feed Single View Style */}
                          <div className="flex gap-3">
                            <Avatar className="h-9 w-9 flex-shrink-0">
                              <AvatarImage src={creator.avatar ? (creator.avatar.startsWith('/uploads/') ? creator.avatar : `/uploads/${creator.avatar}`) : undefined} alt={creator.username} />
                              <AvatarFallback className="text-sm">{(creator?.display_name || creator?.username || 'U').charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-medium text-foreground line-clamp-2 mb-1">
                                {post.content || post.title || 'Untitled Post'}
                              </h4>

                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                  <span className="truncate">{creator.display_name}</span>
                                  <div className="flex items-center gap-1 flex-shrink-0">
                                    <Eye className="w-3 h-3" />
                                    <span>{Math.floor(Math.random() * 2000) + 100}</span>
                                    <span>•</span>
                                  <span>{getTimeAgo(post.created_at || post.createdAt)}</span>
                                  </div>
                                </div>

                                {/* Action Buttons Row - VideoWatch Style */}
                                <div className="flex items-center justify-between mt-2 overflow-hidden">
                                  <div className="flex items-center gap-4 flex-1 min-w-0">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className={`flex items-center gap-1 h-auto py-2 px-2 ${postLikes[post.id]?.liked ? 'text-red-500' : 'text-muted-foreground'}`}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleLike(post.id);
                                      }}
                                    >
                                      <Heart className={`w-4 h-4 ${postLikes[post.id]?.liked ? 'fill-current' : ''}`} />
                                      <span className="text-sm">{postLikes[post.id]?.count || 0}</span>
                                    </Button>

                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="flex items-center gap-1 h-auto py-2 px-2 text-muted-foreground"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleCommentClick(post.id);
                                      }}
                                    >
                                      <MessageSquare className="w-4 h-4" />
                                      <span className="text-sm">{post.comments_count || 0}</span>
                                    </Button>

                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="flex items-center gap-1 h-auto py-2 px-2 text-muted-foreground" 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleShare(post.id);
                                      }}
                                    >
                                      <Share2 className="w-4 h-4" />
                                      <span className="text-sm">Share</span>
                                    </Button>
                                  </div>

                                  {/* Creator Edit/Delete Actions - Only for own posts */}
                                  {isOwnProfile && (
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="flex items-center gap-1 h-auto py-2 px-2 text-muted-foreground hover:text-foreground"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleEditPost(post.id);
                                        }}
                                      >
                                        <Edit className="w-4 h-4" />
                                        <span className="text-sm">Edit</span>
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="flex items-center gap-1 h-auto py-2 px-2 text-red-500 hover:text-red-600"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDeletePost(post.id);
                                        }}
                                      >
                                        <Trash2 className="w-4 h-4" />
                                        <span className="text-sm">Delete</span>
                                      </Button>
                                    </div>
                                  )}
                                </div>

                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Desktop: YouTube-style 16:9 card layout */}
                <div className="hidden md:block">
                  <div className="max-w-4xl mx-auto space-y-6">
                    {getFilteredPosts().map((post) => (
                      <Card key={post.id} className="bg-gradient-card border-border/50 overflow-hidden">
                        <CardContent className="p-4">
                          {/* Media Content - 16:9 aspect ratio */}
                          <div 
                            className="relative aspect-video bg-black cursor-pointer rounded-lg overflow-hidden mb-4"
                            onClick={() => handleContentClick(post)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                handleContentClick(post);
                              }
                            }}
                          >
                            {(() => {
                              const hasAccess = hasAccessToTier(post.tier);

                              if (!hasAccess) {
                                return (
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
                                      <p className="text-sm text-muted-foreground mb-3">
                                        Subscribe to unlock
                                      </p>
                                      <Button 
                                        size="sm" 
                                        className="bg-accent hover:bg-accent/90 text-black text-sm px-4"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (!user) {
                                            window.location.href = `/login?redirect=/creator/${username}`;
                                          } else {
                                            document.getElementById('subscription-tiers')?.scrollIntoView({ behavior: 'smooth' });
                                          }
                                        }}
                                      >
                                        {!user ? 'Login' : 'Subscribe'}
                                      </Button>
                                    </div>
                                  </div>
                                );
                              }

                              const mediaUrls = Array.isArray(post.media_urls) ? post.media_urls : [post.media_urls];
                              const mediaUrl = mediaUrls[0];

                              if (mediaUrl) {
                                const fullUrl = mediaUrl.startsWith('/uploads/') ? mediaUrl : `/uploads/${mediaUrl}`;

                                return post.media_type === 'video' ? (
                                  <video 
                                    src={fullUrl}
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
                                    src={fullUrl}
                                    alt={post.title}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy92MDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjZjNmNGY2Ii8+CjxwYXRoIGQ9Ik0xMDAgNzVMMTI1IDEwMEgxMTJWMTI1SDg4VjEwMEg3NUwxMDAgNzVaIiBmaWxsPSIjOWNhM2FmIi8+Cjx0ZXh0IHg9IjEwMCIgeT0iMTUwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOWNhM2FmIiBmb250LXNpemU9IjEyIj5JbWFnZSBub3QgZm91bmQ8L3RleHQ+Cjwvc3ZnPg==';
                                      target.className = "w-full h-full object-cover opacity-50";
                                    }}
                                  />
                                );
                              } else {
                                return (
                                  <img 
                                    src={`https://placehold.co/1280x720/6366F1/FFFFFF?text=Creator+Post+${post.id}`}
                                    alt={`${creator.display_name}'s post`}
                                    className="w-full h-full object-cover"
                                  />
                                );
                              }
                            })()}


                            {/* No overlays here for desktop */}
                          </div>

                          {/* Creator Info and Content - Fan Feed Single View Style */}
                          <div className="flex gap-3">
                            <Avatar className="h-9 w-9 flex-shrink-0">
                              <AvatarImage src={creator.avatar ? (creator.avatar.startsWith('/uploads/') ? creator.avatar : `/uploads/${creator.avatar}`) : undefined} alt={creator.username} />
                              <AvatarFallback className="text-sm">{(creator?.display_name || creator?.username || 'U').charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-medium text-foreground line-clamp-2 mb-1">
                                {post.content || post.title || 'Untitled Post'}
                              </h4>

                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                  <span className="truncate">{creator.display_name}</span>
                                  <div className="flex items-center gap-1 flex-shrink-0">
                                    <Eye className="w-3 h-3" />
                                    <span>{Math.floor(Math.random() * 2000) + 100}</span>
                                    <span>•</span>
                                  <span>{getTimeAgo(post.created_at || post.createdAt)}</span>
                                  </div>
                                </div>

                                {/* Action Buttons Row - VideoWatch Style */}
                                <div className="flex items-center justify-between mt-2 overflow-hidden">
                                  <div className="flex items-center gap-6 flex-1 min-w-0">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className={`flex items-center gap-2 h-auto py-2 px-3 ${postLikes[post.id]?.liked ? 'text-red-500' : 'text-muted-foreground'}`}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleLike(post.id);
                                      }}
                                    >
                                      <Heart className={`w-5 h-5 ${postLikes[post.id]?.liked ? 'fill-current' : ''}`} />
                                      <span className="text-sm">{postLikes[post.id]?.count || 0}</span>
                                    </Button>

                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="flex items-center gap-2 h-auto py-2 px-3 text-muted-foreground"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleCommentClick(post.id);
                                      }}
                                    >
                                      <MessageSquare className="w-5 h-5" />
                                      <span className="text-sm">{post.comments_count || 0}</span>
                                    </Button>

                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="flex items-center gap-2 h-auto py-2 px-3 text-muted-foreground" 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleShare(post.id);
                                      }}
                                    >
                                      <Share2 className="w-5 h-5" />
                                      <span className="text-sm">Share</span>
                                    </Button>
                                  </div>

                                  {/* Creator Edit/Delete Actions - Only for own posts */}
                                  {isOwnProfile && (
                                    <div className="flex items-center gap-3 flex-shrink-0">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="flex items-center gap-2 h-auto py-2 px-3 text-muted-foreground hover:text-foreground"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleEditPost(post.id);
                                        }}
                                      >
                                        <Edit className="w-4 h-4" />
                                        <span className="text-sm">Edit</span>
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="flex items-center gap-2 h-auto py-2 px-3 text-red-500 hover:text-red-600"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDeletePost(post.id);
                                        }}
                                      >
                                        <Trash2 className="w-4 h-4" />
                                        <span className="text-sm">Delete</span>
                                      </Button>
                                    </div>
                                  )}
                                </div>

                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
                </>
              ) : (
                <Card className="bg-gradient-card border-border/50">
                  <CardContent className="p-6">
                    <div className="text-center py-4">
                      <DollarSign className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">No posts in this category</h3>
                      <p className="text-muted-foreground text-sm">
                        {activeTab === 'all' 
                          ? (isOwnProfile ? 'Start creating content to build your audience.' : `${creator.display_name} hasn't posted any content yet.`)
                          : activeTab === 'free'
                          ? (isOwnProfile ? 'No free posts yet. Create some free content to attract new fans.' : `${creator.display_name} hasn't posted any free content yet.`)
                          : (isOwnProfile ? 'No subscription content yet. Create premium posts for your subscribers.' : `${creator.display_name} hasn't posted any subscription content yet.`)
                        }
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
              </div>
            </TabsContent>

            <TabsContent value="free" className="space-y-6">
              {/* Free Posts Content - Same as All Posts but filtered */}
              <div>
            {getFilteredPosts().length > 0 ? (
              <>
                {/* Mobile: Edge-to-edge borderless layout like fan feed */}
                <div className="md:hidden">
                  <div className="w-full bg-background space-y-0 scrollbar-hide mobile-feed-container" style={{
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none'
                  }}>
                    {getFilteredPosts().map((post) => (
                      <div key={post.id} className="w-full bg-background border-b border-border/20 overflow-hidden">
                        <div 
                          className="relative w-full aspect-video bg-black cursor-pointer"
                          onClick={() => handleContentClick(post)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              handleContentClick(post);
                            }
                          }}
                        >
                          {(() => {
                            const hasAccess = hasAccessToTier(post.tier);

                            if (!hasAccess) {
                              return (
                                <div className="w-full h-full bg-gradient-to-br from-accent/20 to-accent/10 flex items-center justify-center relative">
                                  <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
                                  <div className="text-center z-10 p-4">
                                    <div className="mb-3">
                                      <svg className="w-8 h-8 mx-auto text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                      </svg>
                                    </div>
                                    <p className="text-white text-sm font-medium mb-2">Subscribe to view</p>
                                    <p className="text-white/70 text-xs">This content is for subscribers only</p>
                                  </div>
                                </div>
                              );
                            }

                            const mediaUrls = Array.isArray(post.media_urls) ? post.media_urls : [post.media_urls];
                            const mediaUrl = mediaUrls[0];
                            const fullUrl = mediaUrl?.startsWith('/uploads/') ? mediaUrl : `/uploads/${mediaUrl}`;

                            return (
                              <div className="relative w-full h-full">
                                {post.media_type === 'video' ? (
                                  <>
                                    <video 
                                      src={fullUrl}
                                      className="w-full h-full object-cover"
                                      muted
                                      playsInline
                                      preload="metadata"
                                    />
                                    <div className="absolute inset-0 bg-black/20" />
                                    <div className="absolute top-2 right-2">
                                      <Video className="w-4 h-4 text-white drop-shadow-lg" />
                                    </div>
                                  </>
                                ) : post.media_type === 'image' ? (
                                  <>
                                    <img 
                                      src={fullUrl}
                                      alt={post.content || post.title}
                                      className="w-full h-full object-cover"
                                      loading="lazy"
                                    />
                                    <div className="absolute top-2 right-2">
                                      <Image className="w-4 h-4 text-white drop-shadow-lg" />
                                    </div>
                                  </>
                                ) : (
                                  <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                                    <FileText className="w-8 h-8 text-primary" />
                                  </div>
                                )}
                              </div>
                            );
                          })()} 
                        </div>

                        {/* Post info section */}
                        <div className="p-3 bg-background">
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground line-clamp-2 mb-1">
                                {post.content || post.title}
                              </p>
                            </div>
                          </div>

                          {/* Interaction bar */}
                          <div className="flex items-center justify-between pt-2">
                            <div className="flex items-center gap-4">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleLike(post.id);
                                }}
                                className="flex items-center gap-1 text-muted-foreground hover:text-red-500 transition-colors"
                              >
                                <Heart className={`w-4 h-4 ${postLikes[post.id]?.liked ? 'fill-red-500 text-red-500' : ''}`} />
                                <span className="text-xs">{postLikes[post.id]?.count || 0}</span>
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCommentClick(post.id);
                                }}
                                className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors"
                              >
                                <MessageSquare className="w-4 h-4" />
                                <span className="text-xs">{post.comments_count || 0}</span>
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleShare(post.id);
                                }}
                                className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors"
                              >
                                <Share2 className="w-4 h-4" />
                              </button>
                            </div>
                            <Badge variant={getTierColor(post.tier)} className="text-xs px-2 py-1">
                              {post.tier === 'public' ? 'Free' : (
                                post.tier?.split(' ').map((word: string) => 
                                  word.charAt(0).toUpperCase() + word.slice(1)
                                ).join(' ') || 'General'
                              )}
                            </Badge>
                          </div>

                          {/* Creator actions (edit/delete) for own posts */}
                          {isOwnProfile && (
                            <div className="flex gap-2 mt-3 pt-3 border-t border-border/50">
                              <div className="flex gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingPost(post);
                                    setEditCaption(post.content || post.title);
                                    setIsEditModalOpen(true);
                                  }}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    try {
                                      const response = await fetch(`/api/posts/${post.id}`, {
                                        method: 'DELETE',
                                      });
                                      if (response.ok) {
                                        toast({
                                          title: "Post deleted",
                                          description: "Your post has been deleted successfully.",
                                        });
                                        if (creator?.id) {
                                          fetchUserPosts(creator.id);
                                        }
                                      } else {
                                        throw new Error('Failed to delete post');
                                      }
                                    } catch (error) {
                                      console.error('Error deleting post:', error);
                                      toast({
                                        title: "Error",
                                        description: "Failed to delete post. Please try again.",
                                        variant: "destructive"
                                      });
                                    }
                                  }}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          )}

                          {/* Comments section */}
                          {showComments[post.id] && (
                            <div className="mt-3 pt-3 border-t border-border/50">
                              <CommentSection 
                                postId={Number(post.id)} 
                                onCommentCountChange={(newCount) => handleCommentCountChange(post.id, newCount)}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Desktop: Grid layout */}
                <div className="hidden md:block">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {getFilteredPosts().map((post) => (
                      <Card key={post.id} className="feed-card group hover:shadow-lg transition-all duration-200">
                        <CardContent className="p-0">
                          <div 
                            className="feed-card-thumbnail cursor-pointer"
                            onClick={() => handleContentClick(post)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                handleContentClick(post);
                              }
                            }}
                          >
                            {(() => {
                              const hasAccess = hasAccessToTier(post.tier);

                              if (!hasAccess) {
                                return (
                                  <div className="w-full h-full bg-gradient-to-br from-accent/20 to-accent/10 flex items-center justify-center relative">
                                    <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
                                    <div className="text-center z-10 p-4">
                                      <div className="mb-3">
                                        <svg className="w-8 h-8 mx-auto text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                      </div>
                                      <p className="text-accent text-sm font-medium mb-2">Subscribe to view</p>
                                      <p className="text-accent/70 text-xs">This content is for subscribers only</p>
                                    </div>
                                  </div>
                                );
                              }

                              const mediaUrls = Array.isArray(post.media_urls) ? post.media_urls : [post.media_urls];
                              const mediaUrl = mediaUrls[0];
                              const fullUrl = mediaUrl?.startsWith('/uploads/') ? mediaUrl : `/uploads/${mediaUrl}`;

                              return (
                                <div className="relative w-full h-full">
                                  {post.media_type === 'video' ? (
                                    <>
                                      <video 
                                        src={fullUrl}
                                        className="w-full h-full object-cover"
                                        muted
                                        playsInline
                                        preload="metadata"
                                      />
                                      <div className="absolute top-2 right-2">
                                        <Video className="w-4 h-4 text-white drop-shadow-lg" />
                                      </div>
                                    </>
                                  ) : post.media_type === 'image' ? (
                                    <>
                                      <img 
                                        src={fullUrl}
                                        alt={post.content || post.title}
                                        className="w-full h-full object-cover"
                                        loading="lazy"
                                      />
                                      <div className="absolute top-2 right-2">
                                        <Image className="w-4 h-4 text-white drop-shadow-lg" />
                                      </div>
                                    </>
                                  ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                                      <FileText className="w-8 h-8 text-primary" />
                                    </div>
                                  )}
                                </div>
                              );
                            })()} 
                          </div>

                          <div className="feed-card-content">
                            <h3 className="feed-card-title">
                              {post.content || post.title}
                            </h3>
                            <div className="flex items-center justify-between">
                              <div className="feed-card-meta">
                                <span>{getTimeAgo(post.created_at)}</span>
                                <span className="mx-1">•</span>
                                <span>{post.likes_count || 0} likes</span>
                              </div>
                              <Badge variant={getTierColor(post.tier)} className="text-xs">
                                {post.tier === 'public' ? 'Free' : (
                                  post.tier?.split(' ').map((word: string) => 
                                    word.charAt(0).toUpperCase() + word.slice(1)
                                  ).join(' ') || 'General'
                                )}
                              </Badge>
                            </div>

                            {/* Desktop interaction bar */}
                            <div className="flex items-center justify-between pt-2 mt-2 border-t border-border/20">
                              <div className="flex items-center gap-3">
                                <PostActions 
                                  post={post}
                                  postLikes={postLikes}
                                  isOwnProfile={isOwnProfile}
                                  onLike={handleLike}
                                  onComment={handleCommentClick}
                                  onShare={handleShare}
                                />
                              </div>
                              {/* Creator actions for own posts */}
                              {isOwnProfile && (
                                <div className="flex gap-2">
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingPost(post);
                                      setEditCaption(post.content || post.title);
                                      setIsEditModalOpen(true);
                                    }}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={async (e) => {
                                      e.stopPropagation();
                                      try {
                                        const response = await fetch(`/api/posts/${post.id}`, {
                                          method: 'DELETE',
                                        });
                                        if (response.ok) {
                                          toast({
                                            title: "Post deleted",
                                            description: "Your post has been deleted successfully.",
                                          });
                                          if (creator?.id) {
                                            fetchUserPosts(creator.id);
                                          }
                                        } else {
                                          throw new Error('Failed to delete post');
                                        }
                                      } catch (error) {
                                        console.error('Error deleting post:', error);
                                        toast({
                                          title: "Error",
                                          description: "Failed to delete post. Please try again.",
                                          variant: "destructive"
                                        });
                                      }
                                    }}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              )}
                            </div>

                            {/* Comments section */}
                            {showComments[post.id] && (
                              <div className="mt-3 pt-3 border-t border-border/50">
                                <CommentSection 
                                  postId={Number(post.id)} 
                                  onCommentCountChange={(newCount) => handleCommentCountChange(post.id, newCount)}
                                />
                              </div>
                            )}
                          </div>

                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
                </>
              ) : (
                <Card className="bg-gradient-card border-border/50">
                  <CardContent className="p-6">
                    <div className="text-center py-4">
                      <DollarSign className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">No posts in this category</h3>
                      <p className="text-muted-foreground text-sm">
                        {activeTab === 'all' 
                          ? (isOwnProfile ? 'Start creating content to build your audience.' : `${creator.display_name} hasn't posted any content yet.`)
                          : activeTab === 'free'
                          ? (isOwnProfile ? 'No free posts yet. Create some free content to attract new fans.' : `${creator.display_name} hasn't posted any free content yet.`)
                          : (isOwnProfile ? 'No subscription content yet. Create premium posts for your subscribers.' : `${creator.display_name} hasn't posted any subscription content yet.`)
                        }
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Instagram-style Content Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-[95vh] max-h-[95vh] p-0 overflow-hidden border-0 [&>button]:hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>{selectedContent?.type} Content</DialogTitle>
            <DialogDescription>View content</DialogDescription>
          </DialogHeader>
          {selectedContent && (
            <div className="relative bg-black">
              {/* Back Arrow Button */}
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-4 left-4 z-50 w-10 h-10 rounded-full text-white hover:bg-white/10"
                onClick={closeModal}
              >
                <ArrowLeft className="w-7 h-7" />
              </Button>

              {/* Use AspectRatio component like the postcard */}
              <AspectRatio ratio={1} className="overflow-hidden">
                {selectedContent.mediaPreview ? (
                  <div className="relative w-full h-full">
                    {/* Blurred background layer */}
                    <div 
                      className="absolute inset-0 bg-cover bg-center filter blur-sm scale-110"
                      style={{ backgroundImage: `url(${selectedContent.mediaPreview})` }}
                    />
                    {/* Main media content - Square container */}
                    <div className="relative z-10 w-full h-full">
                      {selectedContent.type === 'Video' ? (
                        <video 
                          src={selectedContent.mediaPreview} 
                          className="w-full h-full object-contain"
                          controls
                          autoPlay
                          muted
                        />
                      ) : (
                        <img 
                          src={selectedContent.mediaPreview} 
                          alt={selectedContent.caption}
                          className="w-full h-full object-contain"
                        />
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center w-full h-full bg-gradient-primary/10">
                    <div className="text-center text-white">
                      {getTypeIcon(selectedContent.type)}
                      <p className="mt-2">{selectedContent.type} Content</p>
                    </div>
                  </div>
                )}
              </AspectRatio>

              {/* Clean content view - no overlays */}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Post Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Post</DialogTitle>
            <DialogDescription>
              Make changes to your post content below.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label htmlFor="editCaption" className="block text-sm font-medium mb-2">
                Caption
              </label>
              <Textarea
                id="editCaption"
                value={editCaption}
                onChange={(e) => setEditCaption(e.target.value)}
                className="w-full min-h-[120px]"
                placeholder="Write your post caption here..."
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={handleCancelEdit}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Tier Details Modal */}
      {selectedTier && (
        <TierDetailsModal
          isOpen={tierDetailsModalOpen}
          onClose={() => {
            setTierDetailsModalOpen(false);
            setSelectedTier(null);
          }}
          tier={selectedTier}
          creatorName={creator.display_name || creator.username}
          onSubscribe={() => {
            console.log('CreatorProfile: onSubscribe called from TierDetailsModal');
            // Keep the tier selected and switch to payment modal
            setTierDetailsModalOpen(false);
            // Small delay to ensure smooth transition
            setTimeout(() => {
              console.log('Opening PaymentModal with tier:', selectedTier);
              setPaymentModalOpen(true);
            }, 100);
          }}
        />
      )}

      {/* Payment Modal */}
      {selectedTier && (
        <PaymentModal
          isOpen={paymentModalOpen}
          onClose={() => {
            setPaymentModalOpen(false);
            setSelectedTier(null);
          }}
          tier={selectedTier}
          creatorName={creator.display_name || creator.username}
        />
      )}
    </div>
    </>
  );
};