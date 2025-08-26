
import React from 'react';
import { Crown } from 'lucide-react';

interface DashboardHeaderProps {
  username?: string;
  title: string;
  subtitle: string;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  username,
  title,
  subtitle
}) => {
  return (
    <div className="mb-6 sm:mb-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2 flex items-center gap-2">
        <Crown className="w-6 h-6 sm:w-8 sm:h-8 text-accent" />
        <span className="truncate">{title}</span>
      </h1>
      <p className="text-sm sm:text-base text-muted-foreground">
        {username ? `Welcome back, ${username}! ${subtitle}` : subtitle}
      </p>
    </div>
  );
};
