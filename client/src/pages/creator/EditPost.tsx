import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { 
  CalendarIcon,
  Upload,
  ArrowLeft,
  Loader2,
  Save,
  Clock,
  Image,
  Video
} from 'lucide-react';
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom';

const MAX_FILE_SIZE = 16 * 1024 * 1024; // 16MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/gif"];
const ACCEPTED_VIDEO_TYPES = ["video/mp4", "video/quicktime"];

const formSchema = z.object({
  caption: z.string().min(1, "Caption is required").max(2000, "Caption must be less than 2000 characters"),
  accessTier: z.string().min(1, "Please select an access tier"),
  scheduledDate: z.date().optional(),
  scheduledTime: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface SubscriptionTier {
  id: number;
  creator_id: number;
  name: string;
  price: number;
  description: string;
  benefits: string[];
  is_active: boolean;
}

export const EditPost: React.FC = () => {
  const { id: postId } = useParams<{ id: string }>();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [originalPost, setOriginalPost] = useState<any>(null);
  const [tiers, setTiers] = useState<SubscriptionTier[]>([]);
    const [videoAspectRatio, setVideoAspectRatio] = useState<'landscape' | 'portrait' | null>(null);
  const [videoDimensions, setVideoDimensions] = useState<{ width: number; height: number } | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      caption: '',
      accessTier: 'free',
      scheduledDate: undefined,
      scheduledTime: '',
    },
  });

  const handleBackClick = () => {
    console.log('Back button clicked');
    navigate('/creator/dashboard');
  };

  const handleCancelClick = () => {
    console.log('Cancel button clicked');
    navigate('/creator/dashboard');
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!postId || !user?.id) {
        console.log('Missing postId or user.id:', { postId, userId: user?.id });
        setIsLoading(false);
        return;
      }

      try {
        console.log('Fetching data for post:', postId);

        // Fetch both post data and creator tiers
        const [postResponse, tiersResponse] = await Promise.all([
          fetch(`/api/posts/${postId}`),
          fetch(`/api/creators/${user.id}/tiers`)
        ]);

        // Process both responses
        let postData = null;
        let tiersData = [];

        if (postResponse.ok) {
          postData = await postResponse.json();
          console.log('Fetched post data:', postData);
        } else {
          console.error('Failed to fetch post data:', postResponse.status);
          toast({
            title: "Error",
            description: "Failed to load post data.",
            variant: "destructive",
          });
          navigate('/creator/dashboard');
          return;
        }

        if (tiersResponse.ok) {
          tiersData = await tiersResponse.json();
          setTiers(tiersData);
          console.log('Fetched tiers data:', tiersData);
        } else {
          console.error('Failed to fetch tiers');
          setTiers([]);
        }

        // Now process the post data with tiers available
        if (postData) {
          // Pre-populate form with existing post data - handle case mismatch
          let accessTier = postData.tier === 'public' ? 'free' : postData.tier;

          // Fix case sensitivity issues by finding matching tier
          if (accessTier !== 'free' && tiersData.length > 0) {
            const matchingTier = tiersData.find(tier => 
              tier.name.toLowerCase() === accessTier.toLowerCase()
            );
            if (matchingTier) {
              accessTier = matchingTier.name;
            }
          }

          console.log('Mapped access tier:', accessTier, 'from original:', postData.tier);

          // Handle scheduled date and time
          let scheduledDate = undefined;
          let scheduledTime = '';
          if (postData.scheduled_for) {
            const scheduledDateTime = new Date(postData.scheduled_for);
            scheduledDate = scheduledDateTime;
            // Format time as HH:MM for input field
            const hours = scheduledDateTime.getHours().toString().padStart(2, '0');
            const minutes = scheduledDateTime.getMinutes().toString().padStart(2, '0');
            scheduledTime = `${hours}:${minutes}`;
          }

          const formDataObj = {
            caption: postData.content || '',
            accessTier: accessTier,
            scheduledDate: scheduledDate,
            scheduledTime: scheduledTime,
          };

          console.log('Setting form data:', formDataObj);

          // Use setValue instead of reset for better control
          form.setValue('caption', formDataObj.caption);
          form.setValue('accessTier', formDataObj.accessTier);
          if (formDataObj.scheduledDate) {
            form.setValue('scheduledDate', formDataObj.scheduledDate);
          }
          if (formDataObj.scheduledTime) {
            form.setValue('scheduledTime', formDataObj.scheduledTime);
          }

          // Set media preview if exists
          if (postData.media_urls && postData.media_urls.length > 0) {
            // Handle media_urls as array (from database) or string (legacy)
            const mediaFileName = Array.isArray(postData.media_urls) 
              ? postData.media_urls[0] 
              : postData.media_urls;

            const mediaUrl = mediaFileName.startsWith('/uploads/')
              ? mediaFileName
              : `/uploads/${mediaFileName}`;

            console.log('Setting media preview:', mediaUrl);
            setMediaPreview(mediaUrl);
            setMediaType(postData.media_type === 'image' ? 'image' : 'video');
          }

          setOriginalPost(postData);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: "Error",
          description: "Failed to load post data.",
          variant: "destructive",
        });
        navigate('/creator/dashboard');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [postId, user?.id, form, toast, navigate]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: "File too large",
        description: "Please select a file smaller than 16MB.",
        variant: "destructive",
      });
      return;
    }

    // Validate file type
    const isImage = ACCEPTED_IMAGE_TYPES.includes(file.type);
    const isVideo = ACCEPTED_VIDEO_TYPES.includes(file.type);

    if (!isImage && !isVideo) {
      toast({
        title: "Invalid file type",
        description: "Please select a valid image (.jpg, .png, .gif) or video (.mp4, .mov) file.",
        variant: "destructive",
      });
      return;
    }

    setMediaFile(file);
    setMediaType(isImage ? 'image' : 'video');

    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    setMediaPreview(previewUrl);

    toast({
      title: "Media uploaded",
      description: `${file.name} has been selected successfully.`,
    });
  };

  const removeMedia = () => {
    if (mediaPreview && mediaPreview.startsWith('blob:')) {
      URL.revokeObjectURL(mediaPreview);
    }
    setMediaFile(null);
    setMediaPreview(null);
    setMediaType(null);
        setVideoAspectRatio(null);
        setVideoDimensions(null);
  };

  const handleSubmit = async (data: FormData) => {
    if (!user || !postId || !originalPost) return;

    setIsSaving(true);

    try {
      // Upload new media file if it exists, otherwise keep existing media
      let uploadedMediaUrls = originalPost.media_urls || [];
      if (mediaFile) {
        const formData = new FormData();
        formData.append('media', mediaFile);

        const uploadResponse = await fetch('/api/upload/post-media', {
          method: 'POST',
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error('Failed to upload media');
        }

        const uploadResult = await uploadResponse.json();
        uploadedMediaUrls = [uploadResult.filename];
      }

      // Handle scheduled date and time
      let scheduled_for = null;
      if (data.scheduledDate && data.scheduledTime) {
        const [hours, minutes] = data.scheduledTime.split(':');
        const scheduledDateTime = new Date(data.scheduledDate);
        scheduledDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        scheduled_for = scheduledDateTime; // Send as Date object, not ISO string
      }

      // Prepare updated post data
      const updatedPostData = {
        title: data.caption?.substring(0, 50) || originalPost.title,
        content: data.caption || originalPost.content,
        media_type: mediaType || originalPost.media_type,
        media_urls: uploadedMediaUrls,
        tier: data.accessTier === 'free' ? 'public' : data.accessTier,
        scheduled_for: scheduled_for,
        status: scheduled_for ? 'scheduled' : originalPost.status,
      };

      console.log('Updating post with data:', updatedPostData);

      // Update the post via API
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedPostData),
      });

      if (!response.ok) {
        throw new Error('Failed to update post');
      }

      const updatedPost = await response.json();
      console.log('Post updated successfully:', updatedPost);

      toast({
        title: "Post updated",
        description: "Your post has been updated successfully.",
      });

      // Navigate back to dashboard
      navigate('/creator/dashboard');
    } catch (error) {
      console.error('Error updating post:', error);
      toast({
        title: "Error",
        description: "Failed to update post. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

    const handleMediaChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setMediaFile(file);
      const fileType = file.type.startsWith('image/') ? 'image' : 'video';
      setMediaType(fileType);

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setMediaPreview(result);

        // If it's a video, detect aspect ratio
        if (fileType === 'video') {
          const video = document.createElement('video');
          video.src = result;
          video.addEventListener('loadedmetadata', () => {
            const aspectRatio = video.videoWidth / video.videoHeight;
            setVideoDimensions({ width: video.videoWidth, height: video.videoHeight });

            if (aspectRatio > 1) {
              setVideoAspectRatio('landscape');
            } else {
              setVideoAspectRatio('portrait');
            }
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading post...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Button 
            variant="outline" 
            size="sm"
            className="mb-4 w-10 h-10 p-0 sm:w-auto sm:h-auto sm:p-2 sm:px-4"
            onClick={handleBackClick}
          >
            <ArrowLeft className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Back to Dashboard</span>
          </Button>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Edit Post</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Update your post content and settings
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <Card className="bg-gradient-card border-border/50">
              <CardHeader>
                <CardTitle>Post Content</CardTitle>
                <CardDescription>Update your caption and media</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Caption */}
                <FormField
                  control={form.control}
                  name="caption"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Caption</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="What's on your mind?"
                          className="min-h-[120px] resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Media Upload */}
                <div className="space-y-4">
                  <Label>Media (Optional)</Label>

                  {!mediaPreview ? (
                    <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                      <Input
                        type="file"
                        accept=".jpg,.jpeg,.png,.gif,.mp4,.mov"
                        onChange={handleMediaChange}
                        className="hidden"
                        id="media-upload"
                      />
                      <Label htmlFor="media-upload" className="cursor-pointer">
                        <div className="flex flex-col items-center gap-4">
                          <Upload className="w-12 h-12 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">Click to upload new media</p>
                            <p className="text-xs text-muted-foreground">
                              Images: JPG, PNG, GIF (max 16MB)<br />
                              Videos: MP4, MOV (max 16MB)
                            </p>
                          </div>
                        </div>
                      </Label>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="relative rounded-lg overflow-hidden bg-muted">
                        {mediaType === 'image' ? (
                          <img
                            src={mediaPreview}
                            alt="Preview"
                            className="w-full h-64 object-cover"
                          />
                        ) : (
                          <video
                            src={mediaPreview}
                            className="w-full h-64 object-cover"
                            controls
                          />
                        )}
                        <div className="absolute top-2 right-2">
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={removeMedia}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {mediaType === 'image' ? <Image className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                        <span>Media preview</span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-border/50">
              <CardHeader>
                <CardTitle>Access Settings</CardTitle>
                <CardDescription>Choose who can see this post</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Access Tier */}
                <FormField
                  control={form.control}
                  name="accessTier"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Access Level</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select access level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="free">Free for all followers</SelectItem>
                          {tiers.map((tier) => (
                            <SelectItem key={tier.id} value={tier.name}>
                              {tier.name} (GHS {tier.price}/month)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-border/50">
              <CardHeader>
                <CardTitle>Schedule Settings</CardTitle>
                <CardDescription>Update when this post should be published</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Schedule Options */}
                <div className="grid md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="scheduledDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Schedule Date (Optional)</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date < new Date() || date < new Date("1900-01-01")
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="scheduledTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Schedule Time</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type="time"
                              {...field}
                            />
                            <Clock className="absolute right-3 top-3 h-4 w-4 opacity-50" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-col sm:flex-row gap-4 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancelClick}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
                className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </AppLayout>
  );
};