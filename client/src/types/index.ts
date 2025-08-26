// Core types for Xclusive platform

export interface User {
  id: string;
  email: string;
  username: string;
  avatar?: string;
  role: 'fan' | 'creator' | 'admin';
  created_at: string;
  updated_at: string;
}

export interface Creator extends User {
  role: 'creator';
  display_name: string;
  bio?: string;
  cover_image?: string;
  social_links?: {
    twitter?: string;
    instagram?: string;
    website?: string;
  };
  verified: boolean;
  total_subscribers: number;
  total_earnings: number;
  commission_rate: number;
}

export interface SubscriptionTier {
  id: string;
  creator_id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  benefits: string[];
  created_at: string;
}

export interface Subscription {
  id: string;
  fan_id: string;
  creator_id: string;
  tier_id: string;
  status: 'active' | 'cancelled' | 'expired';
  started_at: string;
  ends_at?: string;
  auto_renew: boolean;
}

export interface Post {
  id: string;
  creator_id: string;
  tier_id?: string; // null for public posts
  title: string;
  content: string;
  media_urls: string[];
  media_type: 'image' | 'video' | 'text';
  is_nsfw: boolean;
  likes_count: number;
  comments_count: number;
  scheduled_for?: string;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: string;
  post_id?: string;
  user_id?: string;
  user: Pick<User, 'id' | 'username' | 'avatar'>;
  content: string;
  likes: number;
  liked: boolean;
  createdAt: string;
  created_at?: string;
  replies: Comment[];
}

export interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  read: boolean;
  created_at: string;
  sender: Pick<User, 'id' | 'username' | 'avatar'>;
}

export interface Analytics {
  subscriber_count: number;
  total_earnings: number;
  monthly_earnings: number;
  top_tier: string;
  growth_rate: number;
  engagement_rate: number;
}