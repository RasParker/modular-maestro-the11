import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/shared/Navbar';
import { ContentReviewCard } from '@/components/admin/ContentReviewCard';
import { ArrowLeft, Eye, CheckCircle, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const PENDING_CONTENT = [
  {
    id: '1',
    title: 'Digital Art Collection - Fantasy Warriors',
    type: 'image',
    creator: {
      username: 'artisticmia',
      display_name: 'Artistic Mia',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b5fd?w=150&h=150&fit=crop&crop=face'
    },
    submitted: '2024-02-19T10:30:00',
    status: 'pending',
    tier: 'Superfan',
    thumbnail: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=300&h=200&fit=crop'
  },
  {
    id: '2',
    title: 'Workout Routine Video - Upper Body',
    type: 'video',
    creator: {
      username: 'fitnessking',
      display_name: 'Fitness King',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
    },
    submitted: '2024-02-19T14:15:00',
    status: 'pending',
    tier: 'Premium',
    thumbnail: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&h=200&fit=crop'
  },
  {
    id: '3',
    title: 'Weekly Music Tutorial - Beat Making',
    type: 'video',
    creator: {
      username: 'musicmaker',
      display_name: 'Music Maker',
      avatar: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=150&h=150&fit=crop&crop=face'
    },
    submitted: '2024-02-19T16:45:00',
    status: 'flagged',
    tier: 'Producer',
    thumbnail: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=200&fit=crop'
  }
];

export const ReviewContent: React.FC = () => {
  const { toast } = useToast();
  const [content, setContent] = useState(PENDING_CONTENT);

  const handleApprove = (contentId: string) => {
    setContent(content.filter(item => item.id !== contentId));
    toast({
      title: "Content approved",
      description: "Content has been approved and published.",
    });
  };

  const handleReject = (contentId: string) => {
    setContent(content.filter(item => item.id !== contentId));
    toast({
      title: "Content rejected",
      description: "Content has been rejected and removed.",
      variant: "destructive",
    });
  };

  return (
    <div className="min-h-screen bg-background">

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-8 text-center sm:text-left">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2 flex items-center gap-2 justify-center sm:justify-start">
            <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
            Content Review
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Review and moderate platform content
          </p>
        </div>

        <Card className="bg-gradient-card border-border/50">
          <CardHeader className="text-center sm:text-left">
            <CardTitle className="text-base sm:text-xl">Pending Content Review ({content.length})</CardTitle>
            <CardDescription className="text-sm">Content awaiting moderation approval</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 sm:space-y-6">
              {content.map((item) => (
                <ContentReviewCard
                  key={item.id}
                  item={item}
                  onApprove={handleApprove}
                  onReject={handleReject}
                />
              ))}

              {content.length === 0 && (
                <div className="text-center py-8 sm:py-12">
                  <div className="w-16 h-16 sm:w-24 sm:h-24 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">All caught up!</h3>
                  <p className="text-sm text-muted-foreground">
                    No content pending review at the moment.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};