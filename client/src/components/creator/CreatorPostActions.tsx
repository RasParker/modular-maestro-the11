
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Heart, MessageCircle, Send, Edit3, Trash2 } from 'lucide-react';

interface CreatorPostActionsProps {
  postId: string;
  isOwnPost: boolean;
  likes: number;
  comments: Array<{
    id: string;
    author: string;
    content: string;
    time: string;
    avatar?: string;
  }>;
}

export const CreatorPostActions: React.FC<CreatorPostActionsProps> = ({
  postId,
  isOwnPost,
  likes,
  comments
}) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [newComment, setNewComment] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  const [showComments, setShowComments] = useState(false);

  const handleLike = () => {
    setIsLiked(!isLiked);
    toast({
      title: isLiked ? "Unliked" : "Liked",
      description: `Post ${isLiked ? 'unliked' : 'liked'}`,
    });
  };

  const handleComment = () => {
    if (!newComment.trim()) return;
    
    toast({
      title: "Comment added",
      description: "Your comment has been posted",
    });
    setNewComment('');
  };

  const handleEdit = () => {
    toast({
      title: "Edit post",
      description: "Redirecting to edit page...",
    });
    // Navigate to edit page
    navigate(`/creator/edit-post/${postId}`);
  };

  const handleDelete = () => {
    toast({
      title: "Post deleted",
      description: "Your post has been deleted",
      variant: "destructive"
    });
  };

  return (
    <div className="space-y-4">
      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            className={`gap-2 ${isLiked ? 'text-red-500' : ''}`}
          >
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
            {likes + (isLiked ? 1 : 0)}
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowComments(!showComments)}
            className="gap-2"
          >
            <MessageCircle className="w-4 h-4" />
            {comments.length}
          </Button>
        </div>

        {isOwnPost && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleEdit}>
              <Edit3 className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleDelete}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Comments Section */}
      {showComments && (
        <Card className="bg-background/50">
          <CardContent className="p-4 space-y-4">
            {/* Existing Comments */}
            <div className="space-y-3">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <Avatar className="w-6 h-6">
                    <AvatarImage src={comment.avatar} />
                    <AvatarFallback className="text-xs">
                      {comment.author.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{comment.author}</span>
                      <span className="text-xs text-muted-foreground">{comment.time}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{comment.content}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Comment */}
            <div className="flex gap-2 pt-3 border-t border-border/50">
              <Input
                placeholder="Write a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleComment()}
                className="flex-1"
              />
              <Button size="sm" onClick={handleComment} disabled={!newComment.trim()}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
