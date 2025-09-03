import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, Settings, Check, CheckCheck, BellRing } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useNotificationWebSocket, NotificationWebSocket } from '@/contexts/NotificationContext';
import { WebSocketNotification } from '@/services/NotificationWebSocket';

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  read: boolean;
  action_url?: string;
  actor?: {
    id: number;
    username: string;
    display_name: string;
    avatar?: string;
  };
  entity_type?: string;
  entity_id?: number;
  metadata?: any;
  time_ago: string;
  created_at: string;
}

export const NotificationBell: React.FC = React.memo(() => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasNewNotification, setHasNewNotification] = useState(false);
  const [pushPermission, setPushPermission] = useState<NotificationPermission>('default');
  const [expandedNotifications, setExpandedNotifications] = useState<Set<number>>(new Set());
  const [showPushPrompt, setShowPushPrompt] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<NotificationWebSocket | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  const { createConnection } = useNotificationWebSocket();

  // Fetch notifications
  const { data: notifications = [], isLoading: notificationsLoading } = useQuery<Notification[]>({
    queryKey: ['notifications', 'list'],
    queryFn: async () => {
      const response = await fetch('/api/notifications?limit=5');
      if (!response.ok) throw new Error('Failed to fetch notifications');
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
    refetchInterval: user?.id ? 120000 : false, // Poll every 2 minutes when logged in
    enabled: !!user?.id, // Only fetch if user is logged in
  });

  // Fetch unread count
  const { data: unreadData, isLoading: countLoading } = useQuery<{ count: number }>({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => {
      const response = await fetch('/api/notifications/unread-count');
      if (!response.ok) throw new Error('Failed to fetch unread count');
      const data = await response.json();
      return data;
    },
    refetchInterval: user?.id ? 120000 : false, // Poll every 2 minutes when logged in
    enabled: !!user?.id, // Only fetch if user is logged in
  });

  // Mark notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
      });
      if (!response.ok) throw new Error('Failed to mark as read');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    },
  });

  // Mark all as read
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'PATCH',
      });
      if (!response.ok) throw new Error('Failed to mark all as read');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    },
  });

  // Set hasNewNotification based on unread count
  useEffect(() => {
    if (unreadData?.count && unreadData.count > 0) {
      setHasNewNotification(true);
    } else {
      setHasNewNotification(false);
    }
  }, [unreadData?.count]);

  // Initialize WebSocket connection and push notifications
  useEffect(() => {
    if (!user?.id) return;

    // Check browser push notification permission
    if ('Notification' in window) {
      setPushPermission(Notification.permission);
    }

    // Create WebSocket connection
    const handleNewNotification = (notification: WebSocketNotification) => {
      setHasNewNotification(true);

      // Update React Query cache
      queryClient.invalidateQueries({ queryKey: ['notifications', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });

      // Show browser push notification if permission granted
      if (Notification.permission === 'granted' && document.hidden) {
        // Ensure body is a string - convert message to string safely
        const body = typeof notification.message === 'string' 
          ? notification.message 
          : String(notification.message || '');
            
        new Notification(notification.title, {
          body: body,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: `notification-${notification.id}`,
          requireInteraction: false,
          silent: false
        });
      }

      // Show toast notification if user is on the page
      if (!document.hidden) {
        // Ensure description is a string - convert message to string safely
        const description = typeof notification.message === 'string' 
          ? notification.message 
          : String(notification.message || '');
            
        toast({
          title: notification.title,
          description: description,
          duration: 4000,
        });
      }
    };

    wsRef.current = createConnection(handleNewNotification, () => {});

    return () => {
      if (wsRef.current) {
        wsRef.current.disconnect();
        wsRef.current = null;
      }
    };
  }, [user?.id, createConnection, queryClient, toast]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Clear new notification indicator when dropdown opens and there are no unread notifications
  useEffect(() => {
    if (isOpen && hasNewNotification && (!unreadData?.count || unreadData.count === 0)) {
      setTimeout(() => setHasNewNotification(false), 1000);
    }
  }, [isOpen, hasNewNotification, unreadData?.count]);

  // Show push prompt after user interacts with notifications multiple times
  useEffect(() => {
    if (isOpen && pushPermission === 'default') {
      const interactionCount = parseInt(localStorage.getItem('notification-interactions') || '0');
      if (interactionCount >= 2) {
        setShowPushPrompt(true);
      }
      localStorage.setItem('notification-interactions', (interactionCount + 1).toString());
    }
  }, [isOpen, pushPermission]);

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsReadMutation.mutate(notification.id);
    }
    setIsOpen(false);
  };

  const toggleNotificationExpanded = (notificationId: number) => {
    setExpandedNotifications(prev => {
      const newSet = new Set(prev);
      if (newSet.has(notificationId)) {
        newSet.delete(notificationId);
      } else {
        newSet.add(notificationId);
      }
      return newSet;
    });
  };

  const requestPushPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      try {
        const permission = await Notification.requestPermission();
        setPushPermission(permission);

        if (permission === 'granted') {
          toast({
            title: "Push Notifications Enabled",
            description: "You'll now receive browser notifications for new activity",
          });
        }
      } catch (error) {
        console.error('Error requesting notification permission:', error);
      }
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_subscriber':
        return '👥';
      case 'new_message':
        return '💬';
      case 'new_comment':
        return '💭';
      case 'new_post':
        return '📝';
      case 'payment_success':
        return '💰';
      case 'payment_failed':
        return '❌';
      case 'payout_completed':
        return '💳';
      case 'like':
        return '❤️';
      default:
        return '📢';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        size="sm"
        className="relative p-2 h-10 w-10"
        onClick={() => setIsOpen(!isOpen)}
      >
        {hasNewNotification ? (
          <BellRing className={cn(
            "h-5 w-5 text-primary",
            hasNewNotification && "animate-pulse"
          )} />
        ) : (
          <Bell className="h-5 w-5" />
        )}
        {unreadData?.count && unreadData.count > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
          >
            {unreadData.count > 99 ? '99+' : unreadData.count}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <Card className="absolute right-0 top-12 w-80 sm:w-96 max-w-[calc(100vw-2rem)] shadow-lg border z-[9999] bg-background flex flex-col max-h-96 sm:right-0 sm:top-12 -translate-x-1/2 left-1/2 sm:translate-x-0 sm:left-auto">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Notifications</CardTitle>
              <div className="flex items-center gap-2">
                {unreadData?.count && unreadData.count > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => markAllAsReadMutation.mutate()}
                    disabled={markAllAsReadMutation.isPending}
                    className="h-8 px-2 text-xs"
                  >
                    <CheckCheck className="h-3 w-3 mr-1" />
                    Mark all read
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0 flex flex-col flex-1 min-h-0">
            <div className="flex-1 overflow-y-auto">
              {notificationsLoading ? (
                <div className="p-4 text-center text-muted-foreground">
                  Loading notifications...
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  No notifications yet
                </div>
              ) : (
                <div className="divide-y">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={cn(
                        "p-3 hover:bg-accent/50 transition-colors cursor-pointer",
                        !notification.read && "bg-accent/20 border-l-2 border-l-primary"
                      )}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      {notification.action_url ? (
                        <Link to={notification.action_url} className="block">
                          <NotificationContent 
                            notification={notification} 
                            getNotificationIcon={getNotificationIcon}
                            isExpanded={expandedNotifications.has(notification.id)}
                            onToggleExpanded={() => toggleNotificationExpanded(notification.id)}
                          />
                        </Link>
                      ) : (
                        <NotificationContent 
                          notification={notification} 
                          getNotificationIcon={getNotificationIcon}
                          isExpanded={expandedNotifications.has(notification.id)}
                          onToggleExpanded={() => toggleNotificationExpanded(notification.id)}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-3 border-t bg-muted/50 space-y-2 flex-shrink-0">
              {showPushPrompt && pushPermission === 'default' && (
                <div className="space-y-2">
                  <div className="text-xs text-muted-foreground">
                    Stay updated with instant notifications
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="flex-1 text-xs"
                      onClick={requestPushPermission}
                    >
                      <BellRing className="w-3 h-3 mr-1" />
                      Enable
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="flex-1 text-xs"
                      onClick={() => setShowPushPrompt(false)}
                    >
                      Later
                    </Button>
                  </div>
                </div>
              )}
              
              {/* Conditional bulk actions */}
              {unreadData?.count && unreadData.count > 3 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => markAllAsReadMutation.mutate()}
                  disabled={markAllAsReadMutation.isPending}
                  className="w-full text-xs"
                >
                  <CheckCheck className="h-3 w-3 mr-2" />
                  Clear all notifications
                </Button>
              )}
              
              <Link to={`/${user?.role || 'fan'}/notifications`} onClick={() => setIsOpen(false)}>
                <Button variant="ghost" className="w-full text-sm">
                  View all notifications
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
});

interface NotificationContentProps {
  notification: Notification;
  getNotificationIcon: (type: string) => string;
  isExpanded?: boolean;
  onToggleExpanded?: () => void;
}

const NotificationContent: React.FC<NotificationContentProps> = ({ 
  notification, 
  getNotificationIcon, 
  isExpanded = false,
  onToggleExpanded 
}) => {
  const hasLongMessage = notification.message.length > 50;
  const truncatedMessage = hasLongMessage && !isExpanded 
    ? notification.message.substring(0, 50) + '...' 
    : notification.message;

  return (
    <div className="flex items-start gap-3">
      <div className="flex-shrink-0">
        {notification.actor?.avatar ? (
          <Avatar className="h-8 w-8">
            <AvatarImage src={notification.actor.avatar} alt={notification.actor.display_name} />
            <AvatarFallback className="text-xs">
              {notification.actor.display_name?.charAt(0) || notification.actor.username?.charAt(0)}
            </AvatarFallback>
          </Avatar>
        ) : (
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-sm">{getNotificationIcon(notification.type)}</span>
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className="font-medium text-sm text-foreground truncate">
            {notification.title}
          </p>
          {!notification.read && (
            <div className="h-2 w-2 bg-primary rounded-full flex-shrink-0 ml-2" />
          )}
        </div>
        
        <div className="mt-1">
          <p className="text-xs text-muted-foreground">
            {truncatedMessage}
          </p>
          {hasLongMessage && onToggleExpanded && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpanded();
              }}
              className="text-xs text-primary hover:text-primary/80 mt-1"
            >
              {isExpanded ? 'Show less' : 'Show more'}
            </button>
          )}
        </div>
        
        <div className="flex items-center justify-between mt-1">
          <p className="text-xs text-muted-foreground">
            {notification.time_ago}
          </p>
          {notification.actor && isExpanded && (
            <p className="text-xs text-muted-foreground">
              by {notification.actor.display_name || notification.actor.username}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};