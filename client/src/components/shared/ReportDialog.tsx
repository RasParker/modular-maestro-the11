
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Flag } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface ReportDialogProps {
  targetType: 'post' | 'user' | 'comment';
  targetId: number;
  targetName: string;
  children?: React.ReactNode;
}

export const ReportDialog: React.FC<ReportDialogProps> = ({ 
  targetType, 
  targetId, 
  targetName, 
  children 
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    reason: '',
    description: '',
    type: getReportType(targetType)
  });

  function getReportType(targetType: string) {
    switch (targetType) {
      case 'post':
      case 'comment':
        return 'content';
      case 'user':
        return 'user';
      default:
        return 'content';
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "You must be logged in to report content.",
        variant: "destructive"
      });
      return;
    }

    if (!formData.reason) {
      toast({
        title: "Reason Required",
        description: "Please select a reason for reporting.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: formData.type,
          reason: formData.reason,
          description: formData.description,
          reported_by: user.id,
          target_type: targetType,
          target_id: targetId,
          target_name: targetName
        }),
      });

      if (response.ok) {
        toast({
          title: "Report Submitted",
          description: "Thank you for reporting this content. We'll review it shortly.",
        });
        setOpen(false);
        setFormData({ reason: '', description: '', type: getReportType(targetType) });
      } else {
        throw new Error('Failed to submit report');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit report. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm">
            <Flag className="w-4 h-4 mr-2" />
            Report
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Report Content</DialogTitle>
          <DialogDescription>
            Help us keep the platform safe by reporting inappropriate content or behavior.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for reporting</Label>
            <Select value={formData.reason} onValueChange={(value) => setFormData(prev => ({ ...prev, reason: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {targetType === 'user' ? (
                  <>
                    <SelectItem value="harassment">Harassment or bullying</SelectItem>
                    <SelectItem value="spam">Spam behavior</SelectItem>
                    <SelectItem value="impersonation">Impersonation</SelectItem>
                    <SelectItem value="inappropriate_contact">Inappropriate contact</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </>
                ) : (
                  <>
                    <SelectItem value="inappropriate_content">Inappropriate content</SelectItem>
                    <SelectItem value="copyright_violation">Copyright violation</SelectItem>
                    <SelectItem value="spam">Spam</SelectItem>
                    <SelectItem value="harassment">Harassment or hate speech</SelectItem>
                    <SelectItem value="misinformation">Misinformation</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Additional details (optional)</Label>
            <Textarea
              id="description"
              placeholder="Provide any additional context or details..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Report'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
