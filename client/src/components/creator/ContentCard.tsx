
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
  FileText
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

  return (
    <Card className="bg-gradient-card border-border/50 hover:border-primary/20 transition-all duration-200">
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* Media Preview - Left side */}
          <div className="flex-shrink-0">
            <div 
              className="w-40 h-24 overflow-hidden rounded-lg cursor-pointer hover:opacity-95 transition-opacity bg-black"
              onClick={(e) => {
                e.stopPropagation();
                onViewContent && onViewContent({
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
                  scheduledFor
                });
              }}
            >
              {mediaPreview ? (
                <div className="w-full h-full">
                  {type === 'Video' ? (
                    <video 
                      src={mediaPreview}
                      className="w-full h-full object-cover"
                      muted
                      preload="metadata"
                    />
                  ) : (
                    <img 
                      src={mediaPreview}
                      alt={caption}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjZjNmNGY2Ii8+CjxwYXRoIGQ9Ik0xMDAgNzVMMTI1IDEwMEgxMTJWMTI1SDg4VjEwMEg3NUwxMDAgNzVaIiBmaWxsPSIjOWNhM2FmIi8+Cjx0ZXh0IHg9IjEwMCIgeT0iMTUwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOWNhM2FmIiBmb250LXNpemU9IjEyIj5JbWFnZSBub3QgZm91bmQ8L3RleHQ+Cjwvc3ZnPg==';
                        target.className = "w-full h-full object-cover opacity-50";
                      }}
                    />
                  )}
                </div>
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-accent/20 to-accent/10 flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    {getTypeIcon()}
                    <p className="mt-1 text-xs">{type}</p>
                  </div>
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
          </div>

          {/* Content details - Right side */}
          <div className="flex-1 min-w-0 space-y-2">
            {/* Title/Caption */}
            <div className="flex-1 min-w-0">
              {(() => {
                const { truncated, needsExpansion } = truncateText(caption, 80);
                return (
                  <h3 className="text-sm font-medium text-foreground leading-tight break-words overflow-hidden md:line-clamp-2 line-clamp-1">
                    {expandedCaption ? caption : (
                      <>
                        {truncated}
                        {needsExpansion && !expandedCaption && (
                          <>
                            <span className="hidden sm:inline">... </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedCaption(true);
                              }}
                              className="text-primary hover:text-primary/80 font-medium hidden sm:inline"
                            >
                              more
                            </button>
                          </>
                        )}
                      </>
                    )}
                    {expandedCaption && needsExpansion && (
                      <>
                        {' '}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedCaption(false);
                          }}
                          className="text-primary hover:text-primary/80 font-medium hidden sm:inline"
                        >
                          less
                        </button>
                      </>
                    )}
                  </h3>
                );
              })()}
            </div>

            {/* Meta information */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
              <Badge variant="outline" className="text-xs px-2 py-0 h-5 flex-shrink-0">
                {tier}
              </Badge>
              <span className="hidden sm:inline">•</span>
              <span className="truncate">{date}</span>
              {status === 'Scheduled' && scheduledFor && (
                <>
                  <span className="hidden sm:inline">•</span>
                  <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium flex-shrink-0">
                    <Timer className="w-3 h-3" />
                    <span className="text-xs truncate">
                      {(() => {
                        const releaseDate = new Date(scheduledFor);
                        const now = new Date();
                        const isToday = releaseDate.toDateString() === now.toDateString();
                        const isTomorrow = releaseDate.toDateString() === new Date(now.getTime() + 24 * 60 * 60 * 1000).toDateString();

                        if (isToday) {
                          return `Today ${releaseDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
                        } else if (isTomorrow) {
                          return `Tomorrow ${releaseDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
                        } else {
                          return releaseDate.toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                          });
                        }
                      })()}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Stats and Actions */}
            <div className="flex items-center justify-between gap-4">
              {/* Stats */}
              {status === 'Published' && (
                <div className="flex items-center gap-4 text-muted-foreground min-w-0 flex-1">
                  <Button variant="ghost" size="sm" className="flex items-center gap-2 h-auto py-2 px-3 text-muted-foreground">
                    <Eye className="w-5 h-5" />
                    <span className="text-sm">{views}</span>
                  </Button>
                  <Button variant="ghost" size="sm" className="flex items-center gap-2 h-auto py-2 px-3 text-muted-foreground">
                    <Heart className="w-5 h-5" />
                    <span className="text-sm">{likes}</span>
                  </Button>
                  <Button variant="ghost" size="sm" className="flex items-center gap-2 h-auto py-2 px-3 text-muted-foreground">
                    <MessageCircle className="w-5 h-5" />
                    <span className="text-sm">{comments}</span>
                  </Button>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(id);
                  }}
                  className="flex items-center gap-2 h-auto py-2 px-3 text-muted-foreground hover:text-foreground"
                >
                  <Edit3 className="w-4 h-4" />
                  <span className="text-sm">Edit</span>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(id);
                  }}
                  className="flex items-center gap-2 h-auto py-2 px-3 text-red-500 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="text-sm">Delete</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
