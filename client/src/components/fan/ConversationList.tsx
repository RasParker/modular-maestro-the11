
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search } from 'lucide-react';
import { getTimeAgo } from '@/lib/timeUtils';

interface Conversation {
  id: string;
  creator: {
    username: string;
    display_name: string;
    avatar: string;
  };
  last_message: string;
  timestamp: string;
  unread: boolean;
  unread_count: number;
}

interface ConversationListProps {
  conversations: Conversation[];
  selectedConversation: Conversation;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onSelectConversation: (conversation: Conversation) => void;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  selectedConversation,
  searchTerm,
  onSearchChange,
  onSelectConversation
}) => {
  return (
    <div className="h-full flex flex-col lg:bg-transparent bg-gradient-card lg:border-0 border-border/50 lg:rounded-none rounded-lg">
      <div className="flex-shrink-0 p-4 lg:p-3 border-b border-border/50 lg:border-b-0">
        <div className="lg:hidden mb-3">
          <h2 className="text-lg font-semibold">Conversations</h2>
        </div>
        <div className="hidden lg:block mb-3">
          <h2 className="text-base font-semibold">Messages</h2>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 text-sm"
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-0">
          {conversations.map((conversation) => (
            <div
              key={conversation.id}
              className={`p-3 lg:p-4 cursor-pointer transition-colors border-b border-border/20 last:border-b-0 ${
                selectedConversation.id === conversation.id 
                  ? 'bg-primary/10 lg:bg-muted/50' 
                  : 'hover:bg-muted/20'
              }`}
              onClick={() => onSelectConversation(conversation)}
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 flex-shrink-0">
                  <AvatarImage src={conversation.creator.avatar ? (conversation.creator.avatar.startsWith('/uploads/') ? conversation.creator.avatar : `/uploads/${conversation.creator.avatar}`) : undefined} alt={conversation.creator.username} />
                  <AvatarFallback>{conversation.creator.display_name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-foreground truncate text-sm">
                      {conversation.creator.display_name}
                    </p>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <span className="text-xs text-muted-foreground">
                        {getTimeAgo(conversation.timestamp)}
                      </span>
                      {conversation.unread && (
                        <Badge variant="destructive" className="text-xs min-w-0 h-5 px-1.5">
                          {conversation.unread_count}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-1">
                    {conversation.last_message}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
