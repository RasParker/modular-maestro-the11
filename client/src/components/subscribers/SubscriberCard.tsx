import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageSquare, Calendar, User } from 'lucide-react';

interface Subscriber {
  id: string;
  username: string;
  email: string;
  tier: string;
  joined: string;
  status: string;
  avatar?: string;
  created_at?: string;
  display_name?: string; // Added display_name to the interface
}

interface SubscriberCardProps {
  subscriber: Subscriber;
  onMessage: (username: string) => void;
}

export const SubscriberCard: React.FC<SubscriberCardProps> = ({ subscriber, onMessage }) => {
  return (
    <div className="p-4 rounded-lg border border-border/50 hover:border-primary/50 transition-colors bg-card">
      {/* Mobile Layout - Vertical Stack */}
      <div className="space-y-4 md:hidden">
        {/* User Info Row */}
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12">
            <AvatarImage 
              src={subscriber.avatar ? (subscriber.avatar.startsWith('/uploads/') ? subscriber.avatar : `/uploads/${subscriber.avatar}`) : null} 
              alt={subscriber.username || 'User'} 
            />
            <AvatarFallback className="bg-gradient-primary text-primary-foreground">
              {subscriber.username?.charAt(0)?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-foreground text-base truncate">{subscriber.username || 'Unknown User'}</p>
            <p className="text-sm text-muted-foreground">Subscriber since {subscriber.joined || new Date(subscriber.created_at).toLocaleDateString()}</p>
          </div>
          <Badge 
            variant={subscriber.tier === 'Premium Content' ? 'default' : 'outline'}
            className="shrink-0"
          >
            {subscriber.tier}
          </Badge>
        </div>

        {/* Details Row */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>Joined {subscriber.joined}</span>
          </div>
          <span className={`font-medium ${subscriber.status === 'Active' ? 'text-green-600' : 'text-yellow-600'}`}>
            {subscriber.status}
          </span>
        </div>

        {/* Action Row */}
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => onMessage(subscriber.username || subscriber.display_name || 'Unknown User')}
          className="w-full"
        >
          <MessageSquare className="w-4 h-4 mr-2" />
          Send Message
        </Button>
      </div>

      {/* Desktop Layout - Horizontal */}
      <div className="hidden md:flex md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-12 w-12">
            <AvatarImage 
              src={subscriber.avatar ? (subscriber.avatar.startsWith('/uploads/') ? subscriber.avatar : `/uploads/${subscriber.avatar}`) : null} 
              alt={subscriber.username || 'User'} 
            />
            <AvatarFallback className="bg-gradient-primary text-primary-foreground">
              {subscriber.username?.charAt(0)?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-foreground truncate">{subscriber.username || 'Unknown User'}</p>
            <p className="text-sm text-muted-foreground">Subscriber since {subscriber.joined || new Date(subscriber.created_at).toLocaleDateString()}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Badge 
            variant={subscriber.tier === 'Premium Content' ? 'default' : 'outline'}
          >
            {subscriber.tier}
          </Badge>

          <div className="text-right">
            <p className="text-sm font-medium">Joined {subscriber.joined}</p>
            <p className={`text-xs ${subscriber.status === 'Active' ? 'text-green-600' : 'text-yellow-600'}`}>
              {subscriber.status}
            </p>
          </div>

          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onMessage(subscriber.username || subscriber.display_name || 'Unknown User')}
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Send Message
          </Button>
        </div>
      </div>
    </div>
  );
};