import React from 'react';
import { cn } from '@/lib/utils';

interface EdgeToEdgeContainerProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '6xl' | '7xl';
  enablePadding?: boolean;
  enableTopPadding?: boolean;
}

export const EdgeToEdgeContainer: React.FC<EdgeToEdgeContainerProps> = ({ 
  children, 
  className,
  maxWidth = 'none',
  enablePadding = false,
  enableTopPadding = false
}) => {
  const getMaxWidthClass = () => {
    switch (maxWidth) {
      case 'sm': return 'max-w-sm mx-auto';
      case 'md': return 'max-w-md mx-auto';
      case 'lg': return 'max-w-lg mx-auto';
      case 'xl': return 'max-w-xl mx-auto';
      case '2xl': return 'max-w-2xl mx-auto';
      case '4xl': return 'max-w-4xl mx-auto';
      case '6xl': return 'max-w-6xl mx-auto';
      case '7xl': return 'max-w-7xl mx-auto';
      default: return '';
    }
  };

  return (
    <div className={cn(
      'w-full',
      getMaxWidthClass(),
      enablePadding && 'px-4 sm:px-6 lg:px-8',
      enableTopPadding && 'py-6 sm:py-8',
      className
    )}>
      {children}
    </div>
  );
};