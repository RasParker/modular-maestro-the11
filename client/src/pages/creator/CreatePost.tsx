import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

import { ArrowLeft, Upload, Image, Video, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

const MAX_FILE_SIZE = 16 * 1024 * 1024; // 16MB
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
const ACCEPTED_VIDEO_TYPES = ['video/mp4', 'video/mov'];

const formSchema = z.object({
  caption: z.string().optional(),
  accessTier: z.string().min(1, "Please select who can see this post"),
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

export const CreatePost: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDraftSaving, setIsDraftSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [tiers, setTiers] = useState<SubscriptionTier[]>([]);
  const [videoAspectRatio, setVideoAspectRatio] = useState<'landscape' | 'portrait' | null>(null);
  const [videoDimensions, setVideoDimensions] = useState<{ width: number; height: number } | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      caption: '',
      accessTier: '',
      scheduledTime: '',
    },
  });

  // Fetch creator's subscription tiers
  useEffect(() => {
    const fetchTiers = async () => {
      if (!user?.id) return;

      try {
        const response = await fetch(`/api/creators/${user.id}/tiers`);
        if (response.ok) {
          const tiersData = await response.json();
          setTiers(tiersData);
        } else {
          console.error('Failed to fetch tiers');
          setTiers([]);
        }
      } catch (error) {
        console.error('Error fetching tiers:', error);
        setTiers([]);
      }
    };

    fetchTiers();
  }, [user?.id]);

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
    if (mediaPreview) {
      URL.revokeObjectURL(mediaPreview);
    }
    setMediaFile(null);
    setMediaPreview(null);
    setMediaType(null);
    setVideoAspectRatio(null);
    setVideoDimensions(null);
  };

  const handleSubmit = async (data: FormData, action: 'draft' | 'schedule' | 'publish') => {
    // Validate that we have either caption or media
    if (!data.caption?.trim() && !mediaFile) {
      toast({
        title: "Content required",
        description: "Please provide a caption or upload media to create a post.",
        variant: "destructive",
      });
      return;
    }

    // Validate scheduled posts have a date
    if (action === 'schedule' && !data.scheduledDate) {
      toast({
        title: "Schedule date required",
        description: "Please select a date and time to schedule your post.",
        variant: "destructive",
      });
      return;
    }

    // Set specific loading state based on action
    setIsUploading(true);
    if (action === 'draft') {
      setIsDraftSaving(true);
    } else if (action === 'publish') {
      setIsPublishing(true);
    } else if (action === 'schedule') {
      setIsScheduling(true);
    }

    try {
      // Get current user ID from auth context
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please log in to create a post.",
          variant: "destructive",
        });
        navigate('/login');
        return;
      }

      // Upload media file first if it exists
      let uploadedMediaUrls: string[] = [];
      if (mediaFile) {
        try {
          const formData = new FormData();
          formData.append('media', mediaFile);

          const uploadResponse = await fetch('/api/upload/post-media', {
            method: 'POST',
            body: formData,
          });

          if (!uploadResponse.ok) {
            const errorData = await uploadResponse.json();
            throw new Error(errorData.error || 'Failed to upload media');
          }

          const uploadResult = await uploadResponse.json();
          uploadedMediaUrls = uploadResult.filename ? [uploadResult.filename] : [];

          if (uploadedMediaUrls.length === 0) {
            throw new Error('Media upload did not return a valid filename');
          }
        } catch (uploadError) {
          console.error('Media upload error:', uploadError);
          toast({
            title: "Media upload failed",
            description: uploadError instanceof Error ? uploadError.message : "Please try uploading again.",
            variant: "destructive",
          });
          return;
        }
      }

      // Handle scheduled date and time
      let scheduled_for = null;
      if (data.scheduledDate && action === 'schedule') {
        const scheduledDateTime = new Date(data.scheduledDate);
        if (data.scheduledTime) {
          const [hours, minutes] = data.scheduledTime.split(':');
          scheduledDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        }
        scheduled_for = scheduledDateTime.toISOString();
      }

      // Prepare post data for API
      const postData = {
        creator_id: parseInt(user.id),
        title: data.caption?.substring(0, 50) || 'Untitled Post',
        content: data.caption || '',
        media_type: mediaType || 'text',
        media_urls: uploadedMediaUrls,
        tier: data.accessTier === 'free' ? 'public' : data.accessTier,
        status: action === 'draft' ? 'draft' : action === 'schedule' ? 'scheduled' : 'published',
        scheduled_for: scheduled_for
      };

      console.log('Creating post with data:', postData);

      // Create the post via API
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData),
      });

      if (!response.ok) {
        throw new Error('Failed to create post');
      }

      const createdPost = await response.json();
      console.log('Post created successfully:', createdPost);

      // Dispatch custom event to notify profile page
      window.dispatchEvent(new CustomEvent('localStorageChange', {
        detail: { type: 'postCreated', post: createdPost }
      }));

      toast({
        title: `Post ${action === 'publish' ? 'published' : action === 'schedule' ? 'scheduled' : 'saved as draft'}`,
        description: `Your post has been ${action === 'publish' ? 'published successfully' : action === 'schedule' ? 'scheduled successfully' : 'saved as draft'}.`,
      });

      // Navigate back to dashboard or schedule page
      if (action === 'schedule') {
        navigate('/creator/schedule');
      } else {
        navigate('/creator/dashboard');
      }
    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        title: "Error",
        description: `Failed to ${action} post. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setIsDraftSaving(false);
      setIsPublishing(false);
      setIsScheduling(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Button variant="outline" size="sm" asChild className="mb-4 w-10 h-10 p-0 sm:w-auto sm:h-auto sm:p-2 sm:px-4">
            <Link to="/creator/dashboard">
              <ArrowLeft className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Back to Dashboard</span>
            </Link>
          </Button>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Create New Post</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Share exclusive content with your subscribers
          </p>
        </div>

        <Form {...form}>
          <form className="space-y-6">
            <Card className="bg-gradient-card border-border/50">
              <CardHeader>
                <CardTitle>Post Content</CardTitle>
                <CardDescription>Add your caption and media</CardDescription>
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

                  {!mediaFile ? (
                    <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                      <Input
                        type="file"
                        accept=".jpg,.jpeg,.png,.gif,.mp4,.mov"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="media-upload"
                      />
                      <Label htmlFor="media-upload" className="cursor-pointer">
                        <div className="flex flex-col items-center gap-4">
                          <Upload className="w-12 h-12 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">Click to upload media</p>
                            <p className="text-xs text-muted-foreground">
                              Images: JPG, PNG, GIF (max 16MB)<br/>
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
                            src={mediaPreview!}
                            alt="Preview"
                            className="w-full h-64 object-cover"
                          />
                        ) : (
                          <video
                            src={mediaPreview!}
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
                        <span>{mediaFile.name} ({(mediaFile.size / 1024 / 1024).toFixed(1)} MB)</span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-border/50">
              <CardHeader>
                <CardTitle>Audience & Publishing</CardTitle>
                <CardDescription>Choose who can see this post and when to publish</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Access Tier */}
                <FormField
                  control={form.control}
                  name="accessTier"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Choose who can see this post</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select access level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="free">Free for all followers</SelectItem>
                          {tiers.map((tier) => (
                            <SelectItem key={tier.id} value={tier.name.toLowerCase()}>
                              {tier.name} (GHS {tier.price}/month)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                                date < new Date(new Date().setHours(0, 0, 0, 0))
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
                          <Input
                            type="time"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/creator/dashboard')}
                disabled={isUploading}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => form.handleSubmit((data) => handleSubmit(data, 'draft'))()}
                disabled={isUploading}
              >
                {isDraftSaving ? 'Saving...' : 'Save as Draft'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => form.handleSubmit((data) => handleSubmit(data, 'schedule'))()}
                disabled={isUploading || !form.watch('scheduledDate')}
              >
                {isScheduling ? 'Scheduling...' : 'Schedule Post'}
              </Button>
              <Button
                type="button"
                onClick={() => form.handleSubmit((data) => handleSubmit(data, 'publish'))()}
                disabled={isUploading}
              >
                {isPublishing ? 'Publishing...' : 'Publish Now'}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};