
import React from 'react';
import { Users, TrendingUp, Calendar } from 'lucide-react';

interface SubscriberStatsProps {
  totalCount: number;
  activeCount: number;
  recentCount: number;
}

export const SubscriberStats: React.FC<SubscriberStatsProps> = ({
  totalCount,
  activeCount,
  recentCount
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      <div className="flex items-center gap-3 p-4 rounded-lg bg-card border border-border/50">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Users className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="text-2xl font-bold text-foreground">{totalCount}</p>
          <p className="text-sm text-muted-foreground">Total Subscribers</p>
        </div>
      </div>
      
      <div className="flex items-center gap-3 p-4 rounded-lg bg-card border border-border/50">
        <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
          <TrendingUp className="w-5 h-5 text-green-600" />
        </div>
        <div>
          <p className="text-2xl font-bold text-foreground">{activeCount}</p>
          <p className="text-sm text-muted-foreground">Active</p>
        </div>
      </div>
      
      <div className="flex items-center gap-3 p-4 rounded-lg bg-card border border-border/50">
        <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
          <Calendar className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <p className="text-2xl font-bold text-foreground">{recentCount}</p>
          <p className="text-sm text-muted-foreground">This Month</p>
        </div>
      </div>
    </div>
  );
};
