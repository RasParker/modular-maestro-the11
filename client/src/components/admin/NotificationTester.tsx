import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Send, TestTube, Zap } from 'lucide-react';

export const NotificationTester: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('test');
  const { toast } = useToast();

  const sendTestNotification = async () => {
    if (!title.trim() || !message.trim()) {
      toast({
        title: "Error",
        description: "Please fill in both title and message",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/test-realtime-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          title,
          message,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send notification');
      }

      toast({
        title: "Success",
        description: "Real-time notification sent successfully!",
      });

      // Clear form
      setTitle('');
      setMessage('');
      setType('test');

    } catch (error) {
      console.error('Error sending test notification:', error);
      toast({
        title: "Error",
        description: "Failed to send test notification",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sendBulkTestNotifications = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/test-notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to send bulk notifications');
      }

      const result = await response.json();
      toast({
        title: "Success",
        description: `${result.count} test notifications sent successfully!`,
      });

    } catch (error) {
      console.error('Error sending bulk test notifications:', error);
      toast({
        title: "Error",
        description: "Failed to send bulk test notifications",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="w-5 h-5" />
          Real-time Notification Tester
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Single Notification Test */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-center sm:text-left">Send Custom Notification</h3>
          
          <div className="space-y-2">
            <Label htmlFor="notification-type">Notification Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue placeholder="Select notification type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="test">Test</SelectItem>
                <SelectItem value="new_subscriber">New Subscriber</SelectItem>
                <SelectItem value="new_message">New Message</SelectItem>
                <SelectItem value="new_post">New Post</SelectItem>
                <SelectItem value="payment_success">Payment Success</SelectItem>
                <SelectItem value="like">Like</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notification-title">Title</Label>
            <Input
              id="notification-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter notification title"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notification-message">Message</Label>
            <Textarea
              id="notification-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter notification message"
              rows={3}
            />
          </div>

          <Button 
            onClick={sendTestNotification} 
            disabled={isLoading}
            className="w-full"
          >
            <Send className="w-4 h-4 mr-2" />
            Send Real-time Notification
          </Button>
        </div>

        {/* Bulk Test */}
        <div className="border-t pt-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-center sm:text-left">Send Bulk Test Notifications</h3>
            <p className="text-sm text-muted-foreground text-center sm:text-left">
              This will send multiple pre-defined test notifications to demonstrate different notification types.
            </p>
            
            <Button 
              onClick={sendBulkTestNotifications} 
              disabled={isLoading}
              variant="outline"
              className="w-full"
            >
              <Zap className="w-4 h-4 mr-2" />
              Send Bulk Test Notifications
            </Button>
          </div>
        </div>

        {/* Instructions */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-2 text-center sm:text-left">Instructions</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Notifications will be sent in real-time via WebSocket</li>
            <li>• Browser push notifications will appear if permission is granted</li>
            <li>• Toast notifications will show for active users</li>
            <li>• Check the notification bell icon for unread count updates</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};