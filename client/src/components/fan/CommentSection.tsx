import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, MessageSquare, Send, MoreHorizontal, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { ReportDialog } from '@/components/shared/ReportDialog';

interface Comment {
  id: string;
  user: {
    id: string;
    username: string;
    avatar?: string;
  };
  content: string;
  likes: number;
  liked: boolean;
  createdAt: string;
  replies: Comment[];
}

interface CommentSectionProps {
  postId: string;
  initialComments: Comment[];
  onCommentCountChange: (count: number) => void;
  creatorId?: string;
  isBottomSheet?: boolean;
}

// Separate component for reply input to avoid cursor jumping
const ReplyInput: React.FC<{
  commentId: string;
  username: string;
  onReply: (commentId: string, content: string) => void;
  onCancel: () => void;
  userAvatar?: string;
  currentUserName?: string;
}> = ({ commentId, username, onReply, onCancel, userAvatar, currentUserName }) => {
  const [replyText, setReplyText] = useState('');

  const handleSubmit = () => {
    if (replyText.trim()) {
      onReply(commentId, replyText);
      setReplyText('');
    }
  };

  return (
    <div className="mt-3 px-2 animate-in slide-in-from-top-1 duration-200">
      <div className="flex gap-2">
        <Avatar className="h-6 w-6 sm:h-8 sm:w-8 flex-shrink-0">
          <AvatarImage src={userAvatar} alt={currentUserName} />
          <AvatarFallback className="text-xs">{currentUserName?.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1 flex gap-3">
          <Textarea
            placeholder={`Reply to ${username}...`}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            className="min-h-[60px] resize-none border-border/20 focus:border-primary/40 text-sm bg-background/50"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                handleSubmit();
              }
              if (e.key === 'Escape') {
                onCancel();
              }
            }}
            autoFocus
          />
          <div className="flex flex-col gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleSubmit}
              disabled={!replyText.trim()}
              className="h-8 w-8 p-0 text-primary hover:text-primary/80 hover:bg-primary/10"
            >
              <Send className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onCancel}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              ✕
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const CommentSection: React.FC<CommentSectionProps> = ({
  postId,
  initialComments,
  onCommentCountChange,
  creatorId,
  isBottomSheet = false
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [showReplies, setShowReplies] = useState<Record<string, boolean>>({});
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'popular'>('newest');
  const [showAllComments, setShowAllComments] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [commentsEnabled, setCommentsEnabled] = useState(true);

  // Fetch comments when component mounts
  const fetchComments = useCallback(async () => {
    try {
      const response = await fetch(`/api/posts/${postId}/comments`);
      if (response.ok) {
        const fetchedComments = await response.json();
        const formattedComments = fetchedComments.map((comment: any) => ({
          id: comment.id.toString(),
          user: {
            id: comment.user?.id.toString() || '1',
            username: comment.user?.username || 'Anonymous',
            avatar: comment.user?.avatar
          },
          content: comment.content,
          likes: comment.likes_count || 0,
          liked: false,
          createdAt: comment.created_at,
          replies: comment.replies || []
        }));
        setComments(formattedComments);
        onCommentCountChange(formattedComments.length);
      }
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    }
  }, [postId, onCommentCountChange]);

  React.useEffect(() => {
    fetchComments();

    // Check if comments are enabled for this creator
    const checkCommentsEnabled = async () => {
      if (creatorId) {
        try {
          const response = await fetch(`/api/creators/${creatorId}/comments-enabled`);
          if (response.ok) {
            const data = await response.json();
            setCommentsEnabled(data.comments_enabled);
          }
        } catch (error) {
          console.error('Error checking comments enabled:', error);
        }
      }
    };

    checkCommentsEnabled();
  }, [postId, creatorId]);

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newComment,
          user_id: user?.id || 1
        })
      });

      if (response.ok) {
        const newCommentData = await response.json();
        const comment: Comment = {
          id: newCommentData.id.toString(),
          user: {
            id: newCommentData.user?.id.toString() || user?.id?.toString() || '1',
            username: newCommentData.user?.username || user?.username || 'current_user',
            avatar: newCommentData.user?.avatar || user?.avatar
          },
          content: newCommentData.content,
          likes: 0,
          liked: false,
          createdAt: newCommentData.created_at,
          replies: []
        };

        setComments(prev => [comment, ...prev]);
        setNewComment('');
        // Update comment count by calling the callback with the new count
        onCommentCountChange(comments.length + 1);

        toast({
          title: "Comment added",
          description: "Your comment has been posted successfully.",
        });
      } else {
        throw new Error('Failed to post comment');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to post comment. Please try again.",
      });
    }
  };

  const handleAddReply = (parentId: string, replyContent: string) => {
    if (!replyContent.trim()) return;

    const reply: Comment = {
      id: Date.now().toString(),
      user: {
        id: user?.id || '1',
        username: user?.username || 'current_user',
        avatar: user?.avatar
      },
      content: replyContent,
      likes: 0,
      liked: false,
      createdAt: new Date().toISOString(),
      replies: []
    };

    setComments(prev => prev.map(comment => 
      comment.id === parentId 
        ? { ...comment, replies: [reply, ...comment.replies] }
        : comment
    ));

    setReplyingTo(null);
    onCommentCountChange(comments.reduce((total, comment) => total + 1 + comment.replies.length, 0) + 1);

    toast({
      title: "Reply added",
      description: "Your reply has been posted successfully.",
    });
  };

  const handleLikeComment = (commentId: string, isReply: boolean = false, parentId?: string) => {
    if (isReply && parentId) {
      setComments(prev => prev.map(comment => 
        comment.id === parentId 
          ? {
              ...comment,
              replies: comment.replies.map(reply =>
                reply.id === commentId
                  ? {
                      ...reply,
                      liked: !reply.liked,
                      likes: reply.liked ? reply.likes - 1 : reply.likes + 1
                    }
                  : reply
              )
            }
          : comment
      ));
    } else {
      setComments(prev => prev.map(comment => 
        comment.id === commentId 
          ? {
              ...comment,
              liked: !comment.liked,
              likes: comment.liked ? comment.likes - 1 : comment.likes + 1
            }
          : comment
      ));
    }
  };

  const toggleReplies = (commentId: string) => {
    setShowReplies(prev => ({
      ...prev,
      [commentId]: !prev[commentId]
    }));
  };

  const getSortedComments = () => {
    const sorted = [...comments];
    switch (sortBy) {
      case 'newest':
        return sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      case 'oldest':
        return sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      case 'popular':
        return sorted.sort((a, b) => b.likes - a.likes);
      default:
        return sorted;
    }
  };

  const displayedComments = showAllComments ? getSortedComments() : getSortedComments().slice(0, 5);

  const CommentItem: React.FC<{ 
    comment: Comment; 
    depth?: number; 
    parentId?: string;
    maxDepth?: number;
  }> = ({ comment, depth = 0, parentId, maxDepth = 3 }) => {
    const isNested = depth > 0;
    const canNest = depth < maxDepth;

    return (
      <div className={`${isNested ? 'ml-6 sm:ml-8 border-l border-border/30 pl-3 sm:pl-4 relative' : ''}`}>
        {isNested && (
          <div className="absolute left-0 top-4 w-3 sm:w-4 h-0.5 bg-border/30"></div>
        )}

        <div className="flex gap-3 py-2">
          <Avatar className={`${isNested ? 'h-6 w-6 sm:h-7 sm:w-7' : 'h-8 w-8'} flex-shrink-0`}>
            <AvatarImage src={comment.user.avatar} alt={comment.user.username} />
            <AvatarFallback className="text-xs">{comment.user.username.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            {/* Comment Content - Instagram style */}
            <div className="mb-1">
              <p className="text-sm leading-relaxed break-words">
                <span className="font-medium text-foreground">{comment.user.username}</span>{' '}
                <span className="text-foreground">{comment.content}</span>
              </p>
            </div>

            {/* Comment Actions - Instagram style */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>{getTimeAgo(comment.createdAt)}</span>

              {comment.likes > 0 && (
                <span className="font-medium">{comment.likes} {comment.likes === 1 ? 'like' : 'likes'}</span>
              )}

              {canNest && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 text-muted-foreground hover:text-foreground text-xs font-medium"
                  onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                >
                  Reply
                </Button>
              )}

              <Button
                variant="ghost"
                size="sm"
                className={`h-auto p-0 hover:text-foreground ${comment.liked ? 'text-red-500' : 'text-muted-foreground'}`}
                onClick={() => handleLikeComment(comment.id, isNested, parentId)}
              >
                <Heart className={`w-3 h-3 ${comment.liked ? 'fill-current' : ''}`} />
              </Button>

              <ReportDialog contentId={comment.id} contentType="comment" />
            </div>

            {/* Show Replies Link - Instagram style */}
            {!isNested && comment.replies.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 text-muted-foreground hover:text-foreground text-xs font-medium mt-2"
                onClick={() => toggleReplies(comment.id)}
              >
                {showReplies[comment.id] ? '— Hide' : '—— View'} {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
              </Button>
            )}

            {/* Reply Input */}
            {replyingTo === comment.id && (
              <ReplyInput
                commentId={comment.id}
                username={comment.user.username}
                onReply={handleAddReply}
                onCancel={() => setReplyingTo(null)}
                userAvatar={user?.avatar}
                currentUserName={user?.username}
              />
            )}

            {/* Nested Replies */}
            {!isNested && showReplies[comment.id] && comment.replies.length > 0 && (
              <div className="mt-3 animate-in slide-in-from-top-1 duration-300">
                {comment.replies
                  .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                  .map((reply) => (
                    <CommentItem 
                      key={reply.id} 
                      comment={reply} 
                      depth={depth + 1}
                      parentId={comment.id}
                      maxDepth={maxDepth}
                    />
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // If comments are disabled, show a message
  if (!commentsEnabled) {
    return (
      <div className="w-full bg-background">
        <div className="px-2 py-8 text-center text-muted-foreground">
          <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Comments are disabled for this creator's posts.</p>
        </div>
      </div>
    );
  }

  if (isBottomSheet) {
    return (
      <div className="w-full h-full bg-background flex flex-col">
        {/* Comments Header */}
        {comments.length > 0 && (
          <div className="px-4 py-3 border-b border-border/20 bg-background shrink-0">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">
                {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground hidden sm:inline">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'popular')}
                  className="text-xs bg-background border border-border/30 rounded px-2 py-1 text-muted-foreground"
                >
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                  <option value="popular">Most liked</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Comments List - Instagram style */}
        <div className="flex-1 overflow-y-auto px-4 bg-background">
          {comments.length > 0 ? (
            <div className="divide-y divide-border/20">
              {displayedComments.map((comment) => (
                <CommentItem key={comment.id} comment={comment} />
              ))}

              {/* Load More Comments */}
              {comments.length > 5 && !showAllComments && (
                <div className="py-4 text-center border-t border-border/20">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAllComments(true)}
                    className="text-muted-foreground hover:text-foreground text-sm font-medium"
                  >
                    <ChevronDown className="w-4 h-4 mr-1" />
                    View {comments.length - 5} more comments
                  </Button>
                </div>
              )}

              {showAllComments && comments.length > 5 && (
                <div className="py-4 text-center border-t border-border/20">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAllComments(false)}
                    className="text-muted-foreground hover:text-foreground text-sm font-medium"
                  >
                    <ChevronUp className="w-4 h-4 mr-1" />
                    Show fewer comments
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No comments yet. Be the first to comment!</p>
            </div>
          )}
        </div>

        {/* Add Comment - Instagram style - Fixed at bottom */}
        <div className="px-4 py-3 border-t border-border/30 bg-background shrink-0">
          <div className="flex gap-2">
            <Avatar className="h-8 w-8 flex-shrink-0">
              <AvatarImage src={user?.avatar} alt={user?.username} />
              <AvatarFallback className="text-xs">{user?.username?.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1 flex gap-3">
              <Textarea
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="min-h-[40px] max-h-[120px] resize-none border-border/20 focus:border-primary/40 text-sm bg-background"
                style={{ 
                  direction: 'ltr', 
                  textAlign: 'left',
                  unicodeBidi: 'normal',
                  writingMode: 'horizontal-tb',
                  textOrientation: 'mixed'
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    handleAddComment();
                  }
                }}
              />
              <Button
                onClick={handleAddComment}
                disabled={!newComment.trim()}
                size="sm"
                variant="ghost"
                className="h-[40px] px-3 text-primary hover:text-primary/80 hover:bg-primary/10"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-background">
      {/* Add Comment - Instagram style */}
      <div className="px-2 py-3 border-b border-border/30">
        <div className="flex gap-2">
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarImage src={user?.avatar} alt={user?.username} />
            <AvatarFallback className="text-xs">{user?.username?.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1 flex gap-3">
            <Textarea
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="min-h-[60px] resize-none border-border/20 focus:border-primary/40 text-sm bg-background/50"
              style={{ 
                direction: 'ltr', 
                textAlign: 'left',
                unicodeBidi: 'normal',
                writingMode: 'horizontal-tb',
                textOrientation: 'mixed'
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  handleAddComment();
                }
              }}
            />
            <Button
              onClick={handleAddComment}
              disabled={!newComment.trim()}
              size="sm"
              className="h-[60px] px-3"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Comments Header */}
      {comments.length > 0 && (
        <div className="px-2 py-3 border-b border-border/20 bg-background/50">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">
              {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground hidden sm:inline">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'popular')}
                className="text-xs bg-background border border-border/30 rounded px-2 py-1 text-muted-foreground"
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="popular">Most liked</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Comments List - Instagram style */}
      {comments.length > 0 ? (
        <div className="divide-y divide-border/20">
          {displayedComments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} />
          ))}

          {/* Load More Comments */}
          {comments.length > 5 && !showAllComments && (
            <div className="px-2 py-4 text-center border-t border-border/20">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAllComments(true)}
                className="text-muted-foreground hover:text-foreground text-sm font-medium"
              >
                <ChevronDown className="w-4 h-4 mr-1" />
                View {comments.length - 5} more comments
              </Button>
            </div>
          )}

          {showAllComments && comments.length > 5 && (
            <div className="px-2 py-4 text-center border-t border-border/20">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAllComments(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-medium"
              >
                <ChevronUp className="w-4 h-4 mr-1" />
                Show fewer comments
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="px-2 py-8 text-center text-muted-foreground">
          <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No comments yet. Be the first to comment!</p>
        </div>
      )}
    </div>
  );
};