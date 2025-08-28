import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users } from 'lucide-react';
import { BioDisplay } from '@/lib/text-utils';
import { OnlineStatusIndicator } from '@/components/OnlineStatusIndicator';

interface CreatorCardProps {
  creator: {
    id: string;
    username: string;
    display_name?: string;
    avatar?: string;
    bio?: string;
    verified?: boolean;
    total_subscribers?: number;
  };
}

export const CreatorCard: React.FC<CreatorCardProps> = ({ creator }) => {

  return (
    <Card className="bg-gradient-card border-border/50 hover:border-primary/50 transition-all duration-300">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="relative">
            <Avatar className="w-12 h-12">
              <AvatarImage
                src={creator.avatar ? (creator.avatar.startsWith('/uploads/') ? creator.avatar : `/uploads/${creator.avatar}`) : undefined}
                alt={creator.username}
              />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {(creator.display_name || creator.username).charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {/* Online status dot - positioned absolutely on avatar border */}
            <OnlineStatusIndicator userId={parseInt(creator.id)} dotOnly={true} size="xs" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm truncate">
                {creator.display_name || creator.username}
              </h3>
              {creator.verified && (
                <Badge variant="secondary" className="text-xs">
                  Verified
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">@{creator.username}</p>
            {creator.bio && (
              <div className="mt-1">
                <BioDisplay
                  bio={creator.bio}
                  context="card"
                  className="text-xs text-muted-foreground line-clamp-2 leading-tight max-h-[2.2em] overflow-hidden"
                />
              </div>
            )}
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {creator.total_subscribers || 0} subscribers
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-3">
          <Link to={`/creator/${encodeURIComponent(creator.username)}`}>
            <Button
              variant="outline"
              size="sm"
              className="w-full view-profile-btn"
              style={{
                '--hover-bg': '#22222a'
              } as React.CSSProperties}
              onMouseEnter={(e) => {
                (e.target as HTMLElement).style.backgroundColor = '#22222a';
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLElement).style.backgroundColor = '';
              }}
            >
              View Profile
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};