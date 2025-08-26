
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, X } from 'lucide-react';

interface SubscriberFiltersProps {
  searchTerm: string;
  selectedTier: string;
  onSearchChange: (value: string) => void;
  onSearch: () => void;
  onFilterChange: (tier: string) => void;
  onReset: () => void;
}

export const SubscriberFilters: React.FC<SubscriberFiltersProps> = ({
  searchTerm,
  selectedTier,
  onSearchChange,
  onSearch,
  onFilterChange,
  onReset
}) => {
  return (
    <div className="space-y-4">
      {/* Mobile-First Search */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex-1 flex gap-2">
          <Input
            placeholder="Search by username or email..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && onSearch()}
            className="flex-1"
          />
          <Button onClick={onSearch} size="sm" className="shrink-0">
            <Search className="w-4 h-4" />
            <span className="hidden sm:inline ml-2">Search</span>
          </Button>
        </div>
      </div>
      
      {/* Mobile-First Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2 flex-1">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select value={selectedTier} onValueChange={onFilterChange}>
            <SelectTrigger className="flex-1 sm:w-48">
              <SelectValue placeholder="Filter by tier" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tiers</SelectItem>
              <SelectItem value="Basic Support">Basic Support</SelectItem>
              <SelectItem value="Premium Content">Premium Content</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Button variant="outline" onClick={onReset} size="sm" className="shrink-0">
          <X className="w-4 h-4" />
          <span className="ml-2">Clear</span>
        </Button>
      </div>
    </div>
  );
};
