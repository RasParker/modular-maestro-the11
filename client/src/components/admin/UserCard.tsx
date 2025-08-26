import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Crown, Shield, Ban, CheckCircle } from 'lucide-react';

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  status: string;
  joined: string;
  subscribers: number;
  revenue: number;
}

interface UserCardProps {
  user: User;
  onSuspendUser: (userId: string) => void;
}

export const UserCard: React.FC<UserCardProps> = ({ user, onSuspendUser }) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 rounded-lg border border-border/50 gap-4">
      <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
        <Avatar className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0">
          <AvatarImage src={user.avatar ? (user.avatar.startsWith('/uploads/') ? user.avatar : `/uploads/${user.avatar}`) : undefined} />
          <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-medium text-foreground truncate text-sm sm:text-base">{user.username}</p>
            {user.role === 'creator' && <Crown className="w-4 h-4 text-accent flex-shrink-0" />}
            {user.role === 'admin' && <Shield className="w-4 h-4 text-primary flex-shrink-0" />}
          </div>
          <p className="text-sm text-muted-foreground truncate">{user.email}</p>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <Badge variant="outline" className="text-xs capitalize">
              {user.role}
            </Badge>
            <Badge variant={user.status === 'active' ? 'success' : 'destructive'} className="text-xs">
              {user.status}
            </Badge>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        <div className="text-left sm:text-right">
          <p className="text-sm font-medium">
            Joined: {new Date(user.joined).toLocaleDateString()}
          </p>
          {user.role === 'creator' && (
            <div className="text-xs text-muted-foreground">
              {user.subscribers} subscribers • ${user.revenue} revenue
            </div>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onSuspendUser(user.id)}
          className="w-full sm:w-auto"
        >
          {user.status === 'suspended' ? (
            <>
              <CheckCircle className="w-4 h-4 mr-1" />
              Activate
            </>
          ) : (
            <>
              <Ban className="w-4 h-4 mr-1" />
              Suspend
            </>
          )}
        </Button>
      </div>
    </div>
  );
};