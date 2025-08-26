import React, { useState, useEffect } from 'react';
// UI Updates Applied: Up Next layout fix + transparency removal - Jan 27 2025
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { CommentSection } from '@/components/fan/CommentSection';
import { Heart, MessageSquare, Share2, ArrowLeft, Maximize2, X, Eye, ChevronDown, Play } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export const VideoWatch: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isImmersive, setIsImmersive] = useState(false);
  const [videoAspectRatio, setVideoAspectRatio] = useState<'landscape' | 'portrait' | null>(null);
  const [liked, setLiked] = useState(false);
  const [showCommentsSheet, setShowCommentsSheet] = useState(false);
  const [nextVideos, setNextVideos] = useState<any[]>([]);

  const getTimeAgo = (dateString: string) => {
    // Handle CURRENT_TIMESTAMP literal string
    if (dateString === "CURRENT_TIMESTAMP") {
      return 'Just now';
    }

    const date = new Date(dateString);

    // Check if date is invalid
    if (isNaN(date.getTime())) {
      return 'Just now';
    }

    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return `${Math.floor(diffInDays / 7)}w ago`;
  };

  useEffect(() => {
    const fetchPost = async () => {
      if (!id) return;

      try {
        const response = await fetch(`/api/posts/${id}`);
        if (response.ok) {
          const postData = await response.json();
          // Map the creator data to the expected format
          const mappedPost = {
            ...postData,
            creator_display_name: postData.creator?.username || 'Unknown Creator',
            creator_username: postData.creator?.username || 'unknown',
            creator_avatar: postData.creator?.avatar || null
          };
          setPost(mappedPost);

          // Check if user has liked this post
          if (user) {
            const likeResponse = await fetch(`/api/posts/${id}/like/${user.id}`);
            if (likeResponse.ok) {
              const likeData = await likeResponse.json();
              setLiked(likeData.liked);
            }
          }
        } else {
          toast({
            title: "Error",
            description: "Failed to load video.",
            variant: "destructive"
          });
          navigate('/fan/feed');
        }
      } catch (error) {
        console.error('Error fetching post:', error);
        toast({
          title: "Error",
          description: "Failed to load video.",
          variant: "destructive"
        });
        navigate('/fan/feed');
      } finally {
        setLoading(false);
      }
    };

    const fetchNextVideos = async () => {
      try {
        const response = await fetch('/api/posts');
        if (response.ok) {
          const posts = await response.json();
          // Filter out current video and take next 5, and map creator data
          const filtered = posts
            .filter((p: any) => p.id.toString() !== id)
            .slice(0, 5)
            .map((post: any) => ({
              ...post,
              creator_display_name: post.creator?.display_name || post.creator?.username || post.display_name || post.username || 'Unknown Creator',
              creator_username: post.creator?.username || post.username || 'unknown',
              creator_avatar: post.creator?.avatar || post.avatar || null
            }));
          setNextVideos(filtered);
        }
      } catch (error) {
        console.error('Error fetching next videos:', error);
      }
    };

    fetchPost();
    fetchNextVideos();
  }, [id, user, toast, navigate]);

  const handleLike = async () => {
    if (!user || !post) return;

    try {
      if (liked) {
        await fetch(`/api/posts/${post.id}/like`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id }),
        });
      } else {
        await fetch(`/api/posts/${post.id}/like`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id }),
        });
      }

      setLiked(!liked);
      setPost((prev: any) => ({
        ...prev,
        likes_count: liked ? prev.likes_count - 1 : prev.likes_count + 1
      }));
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: "Link copied",
      description: "Video link has been copied to your clipboard.",
    });
  };

  const toggleImmersive = () => {
    if (videoAspectRatio === 'portrait') {
      setIsImmersive(!isImmersive);
    }
  };

  const handleVideoLoad = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.target as HTMLVideoElement;
    const aspectRatio = video.videoWidth / video.videoHeight;

    if (aspectRatio > 1) {
      setVideoAspectRatio('landscape');
      video.setAttribute('data-aspect-ratio', 'landscape');
    } else {
      setVideoAspectRatio('portrait');
      video.setAttribute('data-aspect-ratio', 'portrait');
    }
  };

  const handleVideoCardClick = (videoId: string) => {
    navigate(`/video/${videoId}`);
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isImmersive) {
        setIsImmersive(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isImmersive]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Video not found</h2>
          <Button onClick={() => navigate('/fan/feed')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Feed
          </Button>
        </div>
      </div>
    );
  }

  const mediaUrl = Array.isArray(post.media_urls) ? post.media_urls[0] : post.media_urls;
  const fullMediaUrl = mediaUrl?.startsWith('http') ? mediaUrl : `/uploads/${mediaUrl}`;

  return (
    <div className={`min-h-screen bg-background ${isImmersive ? 'is-immersive' : ''}`}>
      {/* Mobile Layout */}
      <div className="md:hidden">
        {/* Video Player Wrapper - YouTube style for mobile */}
        <div className="video-player-wrapper relative bg-black w-full">
          {/* Back Button */}
          {!isImmersive && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-4 left-4 z-10 text-white hover:bg-white/20"
              onClick={() => {
                // Check if we came from a creator profile by looking at the post's creator
                if (post && post.creator_username) {
                  navigate(`/creator/${post.creator_username}`);
                } else if (user?.role === 'creator') {
                  navigate(`/creator/${user.username}`);
                } else {
                  navigate('/fan/feed');
                }
              }}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}

          {/* Close Immersive Button */}
          {isImmersive && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-4 right-4 z-10 text-white hover:bg-white/20"
              onClick={() => setIsImmersive(false)}
            >
              <X className="w-5 h-5" />
            </Button>
          )}

          {/* Immersive Toggle Button - only for portrait videos */}
          {videoAspectRatio === 'portrait' && !isImmersive && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-4 right-4 z-10 text-white hover:bg-white/20"
              onClick={toggleImmersive}
            >
              <Maximize2 className="w-5 h-5" />
            </Button>
          )}

          {/* Video Element */}
          {post.media_type === 'video' ? (
            <video
              src={fullMediaUrl}
              className="w-full h-full video-element"
              controls
              playsInline
              onLoadedMetadata={handleVideoLoad}
              style={{
                objectFit: videoAspectRatio === 'landscape' ? 'contain' : 'contain',
                backgroundColor: 'black'
              }}
            />
          ) : (
            <img
              src={fullMediaUrl}
              alt={post.title}
              className="w-full h-full object-contain bg-black"
            />
          )}
        </div>

        {/* Content Wrapper - Scrollable area below video */}
        <div className="content-wrapper bg-background scrollbar-hide">
          <div className="px-4 py-4">
            {/* Video Caption with Avatar */}
            <div className="flex items-start gap-3 mb-3">
              <Avatar className="h-9 w-9 flex-shrink-0">
                <AvatarImage src={post.creator_avatar ? (post.creator_avatar.startsWith('/uploads/') ? post.creator_avatar : `/uploads/${post.creator_avatar}`) : undefined} alt={post.creator_username} />
                <AvatarFallback className="text-sm">{(post.creator_display_name || post.creator_username || 'U').charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h1 className="text-sm font-medium text-foreground line-clamp-2 mb-1">
                  {post.content}
                </h1>
                <div className="flex items-center justify-between text-xs text-muted-foreground w-full">
                  <span className="truncate mr-2">{post.creator_display_name || post.creator_username}</span>
                  <div className="flex items-center gap-1 flex-shrink-0 text-right">
                    <div className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      <span>{Math.floor(Math.random() * 1000) + 100}K</span>
                    </div>
                    <span>•</span>
                    <span>{getTimeAgo(post.created_at)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons Row */}
            <div className="flex items-center justify-between mb-6 px-2 overflow-hidden">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`flex items-center gap-1 h-auto py-2 px-2 ${liked ? 'text-red-500' : 'text-muted-foreground'}`}
                  onClick={handleLike}
                >
                  <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
                  <span className="text-sm">{post.likes_count || 0}</span>
                </Button>

                <Button variant="ghost" size="sm" className="flex items-center gap-1 h-auto py-2 px-2 text-muted-foreground">
                  <MessageSquare className="w-4 h-4" />
                  <span className="text-sm">{post.comments_count || 0}</span>
                </Button>

                <Button variant="ghost" size="sm" className="flex items-center gap-1 h-auto py-2 px-2 text-muted-foreground" onClick={handleShare}>
                  <Share2 className="w-4 h-4" />
                  <span className="text-sm">Share</span>
                </Button>
              </div>

              {/* Creator Edit/Delete Actions */}
              {user && post.creator_id === user.id && (
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="flex items-center gap-1 h-auto py-2 px-2 text-muted-foreground hover:text-foreground"
                    onClick={() => navigate(`/creator/edit-post/${post.id}`)}
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3Z"/>
                    </svg>
                    <span className="text-xs">Edit</span>
                  </Button>

                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="flex items-center gap-1 h-auto py-2 px-2 text-red-500 hover:text-red-600"
                    onClick={async () => {
                      if (window.confirm('Are you sure you want to delete this post?')) {
                        try {
                          const response = await fetch(`/api/posts/${post.id}`, {
                            method: 'DELETE',
                            headers: { 'Content-Type': 'application/json' }
                          });

                          if (response.ok) {
                            toast({
                              title: "Success",
                              description: "Post deleted successfully"
                            });
                            navigate('/creator/dashboard');
                          } else {
                            throw new Error('Failed to delete post');
                          }
                        } catch (error) {
                          toast({
                            title: "Error",
                            description: "Failed to delete post",
                            variant: "destructive"
                          });
                        }
                      }
                    }}
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 0 0 1-2-2V6h14Z"/>
                      <line x1="10" x2="10" y1="11" y2="17"/>
                      <line x1="14" x2="14" y1="11" y2="17"/>
                    </svg>
                    <span className="text-xs">Delete</span>
                  </Button>
                </div>
              )}
            </div>



            {/* Comments Container - YouTube Style */}
            <div 
              className="bg-background border border-border rounded-lg p-4 mb-6 cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => setShowCommentsSheet(true)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h3 className="text-base font-semibold">Comments</h3>
                  <span className="text-sm text-muted-foreground">{post.comments_count || 379}</span>
                </div>
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              </div>

              <div className="flex items-center gap-3 mt-3">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={user?.avatar} alt={user?.username} />
                  <AvatarFallback className="text-xs">{user?.username?.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 bg-muted/50 rounded-full px-4 py-2">
                  <span className="text-sm text-muted-foreground">Add a comment...</span>
                </div>
              </div>
            </div>

            {/* Next Videos Section - Edge-to-Edge */}
            <div className="space-y-0 -mx-4">
              <h3 className="text-lg font-semibold mb-4 px-4 text-foreground">Up next</h3>
              <div className="space-y-0">
                {nextVideos.map((video) => {
                  const videoMediaUrl = Array.isArray(video.media_urls) ? video.media_urls[0] : video.media_urls;
                  const videoFullUrl = videoMediaUrl?.startsWith('http') ? videoMediaUrl : `/uploads/${videoMediaUrl}`;

                  return (
                    <div 
                      key={video.id} 
                      className="cursor-pointer hover:bg-muted/50 transition-colors border-b border-border/20 last:border-b-0"
                      onClick={() => handleVideoCardClick(video.id)}
                    >
                      <div className="py-3">
                        <div className="relative w-full aspect-video bg-black overflow-hidden mb-3 rounded-lg">
                          {video.media_type === 'video' ? (
                            <video
                              src={videoFullUrl}
                              className="w-full h-full object-cover"
                              muted
                            />
                          ) : (
                            <img
                              src={videoFullUrl}
                              alt={video.title}
                              className="w-full h-full object-cover"
                            />
                          )}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Play className="w-6 h-6 text-white" fill="white" />
                          </div>
                          <div className="absolute bottom-1 right-1 bg-black text-white text-xs px-1 rounded">
                            {Math.floor(Math.random() * 10) + 5}:{Math.floor(Math.random() * 60).toString().padStart(2, '0')}
                          </div>
                        </div>

                        <div className="flex gap-3 px-4">
                          <Avatar className="h-9 w-9 flex-shrink-0">
                            <AvatarImage src={video.creator_avatar || video.avatar} alt={video.creator_username || video.username} />
                            <AvatarFallback className="text-sm">{(video.creator_display_name || video.creator_username || video.display_name || video.username || 'U').charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-light text-foreground line-clamp-2 mb-1 leading-tight">
                              {video.title || video.content}
                            </h4>
                            <div className="flex items-center justify-between text-xs text-muted-foreground w-full">
                              <span className="truncate mr-2">{video.creator_display_name || video.creator_username}</span>
                              <div className="flex items-center gap-1 flex-shrink-0 text-right">
                                <Eye className="w-3 h-3" />
                                <span>{Math.floor(Math.random() * 500) + 100}K</span>
                                <span>•</span>
                                <span>{getTimeAgo(video.created_at)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Comments Bottom Sheet - Mobile Only */}
        <Sheet open={showCommentsSheet} onOpenChange={setShowCommentsSheet}>
          <SheetContent 
            side="bottom" 
            className="h-[85vh] p-0 border-t-4 border-border/30 rounded-t-xl bg-background flex flex-col"
          >
            <SheetHeader className="px-4 py-3 border-b border-border/20 bg-background shrink-0">
              <div className="flex items-center justify-center">
                <div className="w-12 h-1 bg-muted-foreground/30 rounded-full mb-2"></div>
              </div>
              <SheetTitle className="text-lg font-semibold text-foreground text-center">
                Comments
              </SheetTitle>

              {/* Sort Options */}
              <div className="flex items-center gap-3 mt-3">
                <Button variant="default" size="sm" className="rounded-full">
                  Top
                </Button>
                <Button variant="ghost" size="sm" className="rounded-full">
                  Newest
                </Button>
              </div>
            </SheetHeader>

            <div className="flex-1 overflow-hidden">
              <CommentSection
                postId={post.id.toString()}
                initialComments={[]}
                onCommentCountChange={(count) => setPost((prev: any) => ({ ...prev, comments_count: count }))}
                isBottomSheet={true}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:flex min-h-screen bg-background justify-center">
        <div className="w-full max-w-8xl px-6">
          <div className="flex gap-6 py-6 justify-center">
            {/* Main Content */}
            <div className="flex-1 max-w-6xl">
              {/* Back Button */}
              <Button
                variant="ghost"
                size="sm"
                className="mb-4 text-muted-foreground hover:text-foreground"
                onClick={() => {
                  // Check if we came from a creator profile by looking at the post's creator
                  if (post && post.creator_username) {
                    navigate(`/creator/${post.creator_username}`);
                  } else if (user?.role === 'creator') {
                    navigate(`/creator/${user.username}`);
                  } else {
                    navigate('/fan/feed');
                  }
                }}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Feed
              </Button>

              {/* Video Player */}
              <div className="bg-black rounded-lg overflow-hidden mb-4">
                {post.media_type === 'video' ? (
                  <video
                    src={fullMediaUrl}
                    className="w-full aspect-video"
                    controls
                    onLoadedMetadata={handleVideoLoad}
                    style={{
                      objectFit: 'contain',
                      backgroundColor: 'black'
                    }}
                  />
                ) : (
                  <img
                    src={fullMediaUrl}
                    alt={post.title}
                    className="w-full aspect-video object-contain bg-black"
                  />
                )}
              </div>

              {/* Video Caption with Avatar */}
              <div className="flex items-start gap-3 mb-4">
                <Avatar className="h-9 w-9 flex-shrink-0">
                  <AvatarImage 
                    src={post.creator_avatar ? (post.creator_avatar.startsWith('/uploads/') ? post.creator_avatar : `/uploads/${post.creator_avatar}`) : undefined} 
                    alt={post.creator_username} 
                  />
                  <AvatarFallback className="text-sm">{(post.creator_display_name || post.creator_username || 'U').charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h1 className="text-sm font-medium text-foreground line-clamp-2 mb-1">
                    {post.content}
                  </h1>
                  <div className="flex items-center justify-between text-xs text-muted-foreground w-full">
                    <span className="truncate mr-2">{post.creator_display_name || post.creator_username}</span>
                    <div className="flex items-center gap-1 flex-shrink-0 text-right">
                      <div className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        <span>876K</span>
                      </div>
                      <span>•</span>
                      <span>{getTimeAgo(post.created_at)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons Row */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-border overflow-hidden">
                <div className="flex items-center gap-6 flex-1 min-w-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`flex items-center gap-2 h-auto py-2 px-3 ${liked ? 'text-red-500' : 'text-muted-foreground'}`}
                    onClick={handleLike}
                  >
                    <Heart className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
                    <span className="text-sm">{post.likes_count || 0}</span>
                  </Button>

                  <Button variant="ghost" size="sm" className="flex items-center gap-2 h-auto py-2 px-3 text-muted-foreground">
                    <MessageSquare className="w-5 h-5" />
                    <span className="text-sm">{post.comments_count || 0}</span>
                  </Button>

                  <Button variant="ghost" size="sm" className="flex items-center gap-2 h-auto py-2 px-3 text-muted-foreground" onClick={handleShare}>
                    <Share2 className="w-5 h-5" />
                    <span className="text-sm">Share</span>
                  </Button>
                </div>

                {/* Creator Edit/Delete Actions - Desktop */}
                {user && post.creator_id === user.id && (
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="flex items-center gap-2 h-auto py-2 px-3 text-muted-foreground hover:text-foreground"
                      onClick={() => navigate(`/creator/edit-post/${post.id}`)}
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3Z"/>
                      </svg>
                      <span className="text-sm">Edit</span>
                    </Button>

                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="flex items-center gap-2 h-auto py-2 px-3 text-red-500 hover:text-red-600"
                      onClick={async () => {
                        if (window.confirm('Are you sure you want to delete this post?')) {
                          try {
                            const response = await fetch(`/api/posts/${post.id}`, {
                              method: 'DELETE',
                              headers: { 'Content-Type': 'application/json' }
                            });

                            if (response.ok) {
                              toast({
                                title: "Success",
                                description: "Post deleted successfully"
                              });
                              navigate('/creator/dashboard');
                            } else {
                              throw new Error('Failed to delete post');
                            }
                          } catch (error) {
                            toast({
                              title: "Error",
                              description: "Failed to delete post",
                              variant: "destructive"
                            });
                          }
                        }
                      }}
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 0 0 1-2-2V6h14Z"/>
                        <line x1="10" x2="10" y1="11" y2="17"/>
                        <line x1="14" x2="14" y1="11" y2="17"/>
                      </svg>
                      <span className="text-sm">Delete</span>
                    </Button>
                  </div>
                )}
              </div>

              {/* Comments Section - Desktop */}
              <CommentSection
                postId={post.id.toString()}
                initialComments={[]}
                onCommentCountChange={(count) => setPost((prev: any) => ({ ...prev, comments_count: count }))}
                isBottomSheet={false}
              />
            </div>

            {/* Sidebar - Next Videos */}
            <div className="w-70 space-y-0">
              <h3 className="text-lg font-semibold mb-4 px-2">Up next</h3>
              <div className="space-y-0 border border-border rounded-lg overflow-hidden">
                {nextVideos.map((video, index) => {
                  const videoMediaUrl = Array.isArray(video.media_urls) ? video.media_urls[0] : video.media_urls;
                  const videoFullUrl = videoMediaUrl?.startsWith('http') ? videoMediaUrl : `/uploads/${videoMediaUrl}`;

                  return (
                    <div 
                      key={video.id} 
                      className={`cursor-pointer hover:bg-muted/50 transition-colors ${index !== nextVideos.length - 1 ? 'border-b border-border' : ''}`}
                      onClick={() => handleVideoCardClick(video.id)}
                    >
                      <div className="p-3">
                        <div className="relative w-full aspect-video bg-black overflow-hidden mb-2 md:rounded-lg">
                          {video.media_type === 'video' ? (
                            <video
                              src={videoFullUrl}
                              className="w-full h-full object-cover"
                              muted
                            />
                          ) : (
                            <img
                              src={videoFullUrl}
                              alt={video.title}
                              className="w-full h-full object-cover"
                            />
                          )}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Play className="w-4 h-4 text-white" fill="white" />
                          </div>
                          <div className="absolute bottom-1 right-1 bg-black text-white text-xs px-1 rounded">
                            {Math.floor(Math.random() * 10) + 5}:{Math.floor(Math.random() * 60).toString().padStart(2, '0')}
                          </div>
                        </div>

                        <div className="flex gap-3">
                          <Avatar className="h-9 w-9 flex-shrink-0">
                            <AvatarImage src={video.creator_avatar || video.avatar} alt={video.creator_username || video.username} />
                            <AvatarFallback className="text-sm">{(video.creator_display_name || video.creator_username || video.display_name || video.username || 'U').charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-foreground line-clamp-2 mb-1" style={{ fontSize: '14px', fontWeight: 500 }}>
                              {video.title || video.content}
                            </h3>
                            <div className="flex items-center justify-between text-xs text-muted-foreground w-full">
                              <span className="truncate mr-2">{video.creator_display_name || video.creator_username}</span>
                              <div className="flex items-center gap-1 flex-shrink-0 text-right">
                                <Eye className="w-3 h-3" />
                                <span>{Math.floor(Math.random() * 500) + 100}K</span>
                                <span>•</span>
                                <span>{Math.floor(Math.random() * 7) + 1}d ago</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};