import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  BarChart3, 
  Users, 
  DollarSign,
  MessageSquare,
  TrendingUp
} from 'lucide-react';

interface QuickAction {
  to: string;
  icon: React.ReactNode;
  label: string;
  variant?: "premium" | "outline";
}

export const QuickActionsGrid: React.FC = () => {
  const quickActions: QuickAction[] = [
    {
      to: "/creator/manage-content",
      icon: <FileText className="w-6 h-6 sm:w-8 sm:h-8" />,
      label: "Manage Content",
      variant: "premium"
    },
    {
      to: "/creator/analytics",
      icon: <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8" />,
      label: "View Analytics",
      variant: "outline"
    },
    {
      to: "/creator/subscribers",
      icon: <Users className="w-6 h-6 sm:w-8 sm:h-8" />,
      label: "Manage Subscribers",
      variant: "outline"
    },
    {
      to: "/creator/tiers",
      icon: <DollarSign className="w-6 h-6 sm:w-8 sm:h-8" />,
      label: "Manage Tiers",
      variant: "outline"
    },
    {
      to: "/creator/messages",
      icon: <MessageSquare className="w-6 h-6 sm:w-8 sm:h-8" />,
      label: "Messages",
      variant: "outline"
    },
    {
      to: "/creator/earnings",
      icon: <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8" />,
      label: "Earnings",
      variant: "outline"
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {quickActions.map((action) => (
        <Button 
          key={action.to}
          asChild 
          variant={action.variant} 
          className="h-auto p-4 sm:p-6"
        >
          <Link to={action.to} className="flex flex-col items-center gap-2">
            {action.icon}
            <span className="text-xs sm:text-sm text-center">{action.label}</span>
          </Link>
        </Button>
      ))}
    </div>
  );
};