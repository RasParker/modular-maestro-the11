
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CheckCircle, XCircle, Flag } from 'lucide-react';

interface ContentItem {
  id: string;
  title: string;
  type: string;
  creator: {
    username: string;
    display_name: string;
    avatar: string;
  };
  submitted: string;
  status: string;
  tier: string;
  thumbnail: string;
}

interface ContentReviewCardProps {
  item: ContentItem;
  onApprove: (contentId: string) => void;
  onReject: (contentId: string) => void;
}

export const ContentReviewCard: React.FC<ContentReviewCardProps> = ({
  item,
  onApprove,
  onReject
}) => {
  return (
    <div className="p-4 sm:p-6 rounded-lg border border-border/50 bg-muted/10">
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
        <div className="flex-shrink-0 self-center lg:self-start">
          <img 
            src={item.thumbnail} 
            alt={item.title}
            className="w-full sm:w-32 h-32 sm:h-24 object-cover rounded-lg"
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
            <div className="min-w-0 flex-1 text-center sm:text-left">
              <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2 break-words">
                {item.title}
              </h3>
              <div className="flex items-center justify-center sm:justify-start gap-3">
                <Avatar className="w-6 h-6 sm:w-8 sm:h-8">
                  <AvatarImage src={item.creator.avatar} alt={item.creator.username} />
                  <AvatarFallback>{item.creator.display_name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{item.creator.display_name}</p>
                  <p className="text-xs text-muted-foreground truncate">@{item.creator.username}</p>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2">
              <Badge variant="outline" className="text-xs capitalize">
                {item.type}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {item.tier}
              </Badge>
              <Badge variant={item.status === 'flagged' ? 'destructive' : 'secondary'} className="text-xs">
                {item.status === 'flagged' && <Flag className="w-3 h-3 mr-1" />}
                {item.status}
              </Badge>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="text-sm text-muted-foreground text-center sm:text-left">
              Submitted: {new Date(item.submitted).toLocaleString()}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onReject(item.id)}
                className="flex-1 sm:flex-initial"
              >
                <XCircle className="w-4 h-4 mr-1" />
                Reject
              </Button>
              <Button
                size="sm"
                onClick={() => onApprove(item.id)}
                className="flex-1 sm:flex-initial"
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                Approve
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
