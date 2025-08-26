import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Edit3, 
  Trash2, 
  ExternalLink,
  Eye,
  Heart,
  MessageCircle,
  Calendar,
  Clock,
  Timer,
  Image,
  Video,
  FileText,
  Edit,
  CheckCircle,
  
} from 'lucide-react';


interface ContentCardProps {
  id: string;
  caption: string;
  type: 'Image' | 'Video' | 'Text';
  tier: string;
  status: 'Published' | 'Scheduled' | 'Draft';
  date: string;
  views: number;
  likes: number;
  comments: number;
  mediaPreview?: string;
  category: string;
  scheduledFor?: string;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onPublish: (id: string) => void;
  onViewContent?: (item: ContentCardProps) => void;
}

export const ContentCard: React.FC<ContentCardProps> = ({
  id,
  caption,
  type,
  tier,
  status,
  date,
  views,
  likes,
  comments,
  mediaPreview,
  category,
  scheduledFor,
  onEdit,
  onDelete,
  onPublish,
  onViewContent
}) => {
  const [expandedCaption, setExpandedCaption] = useState(false);

  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) {
      return { truncated: text, needsExpansion: false };
    }

    const truncated = text.slice(0, maxLength).trim();
    return {
      truncated,
      needsExpansion: true
    };
  };

  const getTypeIcon = () => {
    switch (type) {
      case 'Image':
        return <Image className="w-4 h-4" />;
      case 'Video':
        return <Video className="w-4 h-4" />;
      case 'Text':
        return <FileText className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'Published':
        return 'default';
      case 'Scheduled':
        return 'secondary';
      case 'Draft':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'Free':
        return 'outline';
      case 'Basic':
        return 'secondary';
      case 'Premium':
        return 'default';
      default:
        return 'outline';
    }
  };


  return (
    <Card className="bg-gradient-card border-border/50 hover:border-primary/20 transition-all duration-200">
      <CardContent className="p-3">
        <div className="flex items-center gap-3 p-3 bg-background/50 rounded-lg">
          {/* Thumbnail */}
          <div className="flex-shrink-0">
            {mediaPreview ? (
              type === 'Video' ? (
                <video
                  src={mediaPreview}
                  className="w-16 h-16 object-cover rounded-lg"
                  muted
                  preload="metadata"
                />
              ) : (
                <img
                  src={mediaPreview}
                  alt={caption}
                  className="w-16 h-16 object-cover rounded-lg"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjZjNmNGY2Ii8+CjxwYXRoIGQ9Ik0xMDAgNzVMMTI1IDEwMEgxMTJWMTI1SDg4VjEwMEg3NUwxMDAgNzVaIiBmaWxsPSIjOWNhM2FmIi8+Cjx0ZXh0IHg9IjEwMCIgeT0iMTUwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOWNhM2FmIiBmb250LXNpemU9IjEyIj5JbWFnZSBub3QgZm91bmQ8L3RleHQ+Cjwvc3ZnPg==';
                    target.className = "w-full h-full object-cover opacity-50";
                  }}
                />
              )
            ) : (
              <div className="w-16 h-16 bg-gradient-to-br from-accent/20 to-accent/10 rounded-lg flex items-center justify-center">
                {getTypeIcon()}
              </div>
            )}



            {/* Duration overlay for videos - Only show for Published content */}
            {type === 'Video' && status === 'Published' && (
              <div className="absolute bottom-1 right-1">
                <div className="px-1 py-0.5 bg-black/80 rounded text-white text-xs font-medium">
                  {Math.floor(Math.random() * 10) + 1}:{Math.floor(Math.random() * 60).toString().padStart(2, '0')}
                </div>
              </div>
            )}
          </div>

          {/* Content Info */}
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm line-clamp-1 break-words overflow-hidden truncate mb-1" style={{ 
              display: '-webkit-box',
              WebkitLineClamp: 1,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>{caption}</h4>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant={getTierColor(tier)} className="text-xs">{tier}</Badge>
              <span className="text-xs text-muted-foreground">{date}</span>
              {status === 'Scheduled' && scheduledFor && (
                <span className="text-xs text-accent truncate">
                  {new Date(scheduledFor).toLocaleDateString()}
                </span>
              )}
            </div>

            {/* Stats and Actions Row */}
            <div className="flex items-center justify-between">
              {/* Stats */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Eye className="w-3 h-3" />
                  <span>{views}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Heart className="w-3 h-3" />
                  <span>{likes}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MessageCircle className="w-3 h-3" />
                  <span>{comments}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    onViewContent({ id, caption, type, tier, status, date, views, likes, comments, mediaPreview, category, scheduledFor });
                  }}
                  className="h-8 w-8 p-0"
                >
                  <Eye className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    onEdit(id);
                  }}
                  className="h-8 w-8 p-0"
                >
                  <Edit className="w-4 h-4" />
                </Button>
                {status === 'Draft' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      onPublish(id);
                    }}
                    className="h-8 w-8 p-0 text-success"
                  >
                    <CheckCircle className="w-4 h-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    onDelete(id);
                  }}
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive/80"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};