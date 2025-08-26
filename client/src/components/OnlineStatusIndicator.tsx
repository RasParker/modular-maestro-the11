import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';

interface OnlineStatusIndicatorProps {
  userId: number;
  showLastSeen?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  dotOnly?: boolean;
  isOwnProfile?: boolean;
}

interface OnlineStatus {
  is_online: boolean;
  last_seen: string | null;
  activity_status_visible: boolean;
}

// Export the query key factory for cache invalidation
export const getOnlineStatusQueryKey = (userId: number) => [`/api/users/${userId}/online-status`];

export const OnlineStatusIndicator: React.FC<OnlineStatusIndicatorProps> = ({ 
  userId, 
  showLastSeen = false,
  size = 'sm',
  dotOnly = false,
  isOwnProfile = false
}) => {
  const { data: onlineStatus, error, isLoading } = useQuery<OnlineStatus>({
    queryKey: getOnlineStatusQueryKey(userId),
    queryFn: async () => {
      const response = await fetch(`/api/users/${userId}/online-status`);
      if (!response.ok) throw new Error('Failed to fetch online status');
      return response.json();
    },
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 5000, // Consider data stale after 5 seconds for quicker updates
    enabled: !!userId, // Only run query if userId is provided
  });

  // For own profile, respect their privacy setting. For others, also respect their privacy setting
  if (!onlineStatus?.activity_status_visible) {
    return null; // Don't show anything if user has disabled activity status
  }

  const formatLastSeen = (lastSeen: string | null) => {
    if (!lastSeen) return '';

    const date = new Date(lastSeen);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getSizeClasses = () => {
    // Use same sizes for both dotOnly and text indicators
    switch (size) {
      case 'xs':
        return 'w-2 h-2';
      case 'sm':
        return 'w-2.5 h-2.5';
      case 'md':
        return 'w-3 h-3';
      case 'lg':
        return 'w-4 h-4';
      default:
        return 'w-2 h-2';
    }
  };

  // Dot-only mode for avatar status indicators
  if (dotOnly) {
    if (onlineStatus?.is_online) {
      return (
        <div className={`${getSizeClasses()} rounded-full bg-green-500 border-2 border-background shadow-lg absolute z-30`} style={{ bottom: '3px', right: '3px' }} />
      );
    }
    // Don't show anything for offline users in dot-only mode
    return null;
  }

  // Regular mode with text
  if (onlineStatus?.is_online) {
    return (
      <div className="flex items-center gap-1">
        <div className={`${getSizeClasses()} rounded-full bg-green-500 animate-pulse`} />
        <span className="text-xs text-green-600 dark:text-green-400">Online</span>
        {showLastSeen && (
          <span className="text-xs text-muted-foreground">
            • Active now
          </span>
        )}
      </div>
    );
  }

  if (showLastSeen && onlineStatus?.last_seen) {
    return (
      <div className="flex items-center gap-1">
        <div className={`${getSizeClasses()} rounded-full bg-gray-400`} />
        <span className="text-xs text-muted-foreground">
          {formatLastSeen(onlineStatus.last_seen)}
        </span>
      </div>
    );
  }

  return null;
};