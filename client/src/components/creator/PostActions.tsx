import { Button } from "@/components/ui/button";
import { Heart, MessageSquare, Share2, Edit, Trash2 } from "lucide-react";

interface PostActionsProps {
  post: {
    id: string;
    likes_count: number;
    comments_count: number;
  };
  postLikes: Record<string, { liked: boolean; count: number }>;
  isOwnProfile: boolean;
  onLike: (postId: string) => void;
  onComment: (postId: string) => void;
  onShare: (postId: string) => void;
  onEdit?: (postId: string) => void;
  onDelete?: (postId: string) => void;
}

export const PostActions: React.FC<PostActionsProps> = ({
  post,
  postLikes,
  isOwnProfile,
  onLike,
  onComment,
  onShare,
  onEdit,
  onDelete
}) => {
  return (
    <div className="flex items-center justify-between mt-2 px-2">
      <div className="flex items-center gap-6">
        {/* Like button */}
        <Button
          variant="ghost"
          size="sm"
          className={`flex items-center gap-2 h-auto py-2 px-3 ${postLikes[post.id]?.liked ? 'text-red-500' : 'text-muted-foreground'}`}
          onClick={(e) => {
            e.stopPropagation();
            onLike(post.id);
          }}
        >
          <Heart className={`w-5 h-5 ${postLikes[post.id]?.liked ? 'fill-current' : ''}`} />
          <span className="text-sm">{postLikes[post.id]?.count || post.likes_count || 0}</span>
        </Button>

        {/* Comment button */}
        <Button 
          variant="ghost" 
          size="sm" 
          className="flex items-center gap-2 h-auto py-2 px-3 text-muted-foreground"
          onClick={(e) => {
            e.stopPropagation();
            onComment(post.id);
          }}
        >
          <MessageSquare className="w-5 h-5" />
          <span className="text-sm">{post.comments_count || 0}</span>
        </Button>

        {/* Share button */}
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-2 h-auto py-2 px-3 text-muted-foreground"
          onClick={(e) => {
            e.stopPropagation();
            onShare(post.id);
          }}
        >
          <Share2 className="w-5 h-5" />
          <span className="text-sm">Share</span>
        </Button>
      </div>

      {/* Action buttons for own posts - bottom row right side */}
      {isOwnProfile && (
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center gap-2 h-auto py-2 px-3 text-muted-foreground hover:text-foreground"
            onClick={(e) => {
              e.stopPropagation();
              onEdit?.(post.id);
            }}
          >
            <Edit className="w-4 h-4" />
            <span className="text-sm">Edit</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center gap-2 h-auto py-2 px-3 text-red-500 hover:text-red-600"
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.(post.id);
            }}
          >
            <Trash2 className="w-4 h-4" />
            <span className="text-sm">Delete</span>
          </Button>
        </div>
      )}
    </div>
  );
};