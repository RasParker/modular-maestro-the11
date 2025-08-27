import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CountdownTimer } from '@/components/shared/CountdownTimer';
import { 
  Edit3, 
  Trash2, 
  Calendar,
  Clock,
  ExternalLink,
  Image,
  Video,
  FileText
} from 'lucide-react';

interface ContentScheduleCardProps {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  type: 'Image' | 'Video' | 'Text';
  tier: string;
  status: 'Scheduled' | 'Draft';
  thumbnail?: string;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onPublish: (id: string) => void;
  scheduledFor?: string | null;
}

export const ContentScheduleCard: React.FC<ContentScheduleCardProps> = ({
  id,
  title,
  description,
  date,
  time,
  type,
  tier,
  status,
  thumbnail,
  onEdit,
  onDelete,
  onPublish,
  scheduledFor
}) => {
  

  return (
    <div className="flex items-center gap-3 p-3 bg-background/50 rounded-lg">
      <div className="flex-shrink-0">
        {thumbnail ? (
          (() => {
            // Construct full URL - add /uploads/ prefix if not present
            const mediaUrl = thumbnail.startsWith('/uploads/') 
              ? thumbnail 
              : `/uploads/${thumbnail}`;

            return type === 'Video' ? (
              <video
                src={mediaUrl}
                className="w-16 h-16 object-cover rounded-lg"
                muted
                preload="metadata"
                onError={(e) => {
                  // Hide video and show fallback icon
                  const target = e.target as HTMLVideoElement;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    parent.innerHTML = `<div class="w-16 h-16 bg-gradient-to-br from-accent/20 to-accent/10 rounded-lg flex items-center justify-center"><svg class="w-6 h-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg></div>`;
                  }
                }}
              />
            ) : (
              <img
                src={mediaUrl}
                alt={title || 'Post'}
                className="w-16 h-16 object-cover rounded-lg"
                onError={(e) => {
                  // Hide image and show fallback icon
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    parent.innerHTML = `<div class="w-16 h-16 bg-gradient-to-br from-accent/20 to-accent/10 rounded-lg flex items-center justify-center"><svg class="w-6 h-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg></div>`;
                  }
                }}
              />
            );
          })()
        ) : (
          <div className="w-16 h-16 bg-gradient-to-br from-accent/20 to-accent/10 rounded-lg flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <p className="text-xs font-medium">{type}</p>
            </div>
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-sm line-clamp-1 break-words overflow-hidden truncate">{title || description || 'Untitled Post'}</h4>
        <div className="flex items-center gap-2 mt-1">
          <Badge variant="outline" className="text-xs">{tier}</Badge>
          {status === 'Scheduled' && (
            <CountdownTimer 
              targetDate={scheduledFor}
              className="text-xs font-medium text-primary"
            />
          )}
        </div>
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(id);
          }}
          className="h-7 px-2 text-xs"
        >
          <Edit3 className="w-3 h-3" />
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(id);
          }}
          className="h-7 px-2 text-xs text-destructive hover:text-destructive"
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
};