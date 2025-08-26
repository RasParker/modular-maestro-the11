
import React from 'react';
import { Users, Search } from 'lucide-react';

interface SubscriberEmptyStateProps {
  hasFilters: boolean;
  searchTerm?: string;
  selectedTier?: string;
}

export const SubscriberEmptyState: React.FC<SubscriberEmptyStateProps> = ({ 
  hasFilters, 
  searchTerm, 
  selectedTier 
}) => {
  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
        {hasFilters ? (
          <Search className="w-8 h-8 text-muted-foreground" />
        ) : (
          <Users className="w-8 h-8 text-muted-foreground" />
        )}
      </div>
      
      <h3 className="text-lg font-medium text-foreground mb-2">
        {hasFilters ? 'No subscribers found' : 'No subscribers yet'}
      </h3>
      
      <p className="text-sm text-muted-foreground max-w-md mx-auto">
        {hasFilters ? (
          <>
            Try adjusting your search or filter criteria.
            {searchTerm && (
              <span className="block mt-1">
                No results for "<span className="font-medium">{searchTerm}</span>"
              </span>
            )}
            {selectedTier !== 'all' && (
              <span className="block mt-1">
                in <span className="font-medium">{selectedTier}</span>
              </span>
            )}
          </>
        ) : (
          'Your subscribers will appear here once they start following you'
        )}
      </p>
    </div>
  );
};
