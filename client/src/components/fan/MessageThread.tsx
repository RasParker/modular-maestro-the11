
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send } from 'lucide-react';

interface Message {
  id: string;
  sender: string;
  content: string;
  timestamp: string;
  type: 'sent' | 'received';
}

interface Creator {
  username: string;
  display_name: string;
  avatar: string;
}

interface MessageThreadProps {
  creator: Creator;
  messages: Message[];
  newMessage: string;
  onNewMessageChange: (value: string) => void;
  onSendMessage: () => void;
}

export const MessageThread: React.FC<MessageThreadProps> = ({
  creator,
  messages,
  newMessage,
  onNewMessageChange,
  onSendMessage
}) => {
  return (
    <div className="h-full flex flex-col lg:bg-transparent bg-gradient-card lg:border-0 border-border/50 lg:rounded-none rounded-lg">
      {/* Header */}
      <div className="flex-shrink-0 p-4 lg:p-3 border-b border-border/50">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={creator.avatar ? (creator.avatar.startsWith('/uploads/') ? creator.avatar : `/uploads/${creator.avatar}`) : undefined} alt={creator.username} />
            <AvatarFallback>{creator.display_name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-foreground truncate text-base lg:text-lg">
              {creator.display_name}
            </h3>
            <p className="text-sm text-muted-foreground truncate">@{creator.username}</p>
          </div>
        </div>
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'sent' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] lg:max-w-[70%] p-3 rounded-lg ${
                message.type === 'sent'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-foreground'
              }`}
            >
              <p className="text-sm break-words">{message.content}</p>
              <p className={`text-xs mt-1 ${
                message.type === 'sent' 
                  ? 'text-primary-foreground/70' 
                  : 'text-muted-foreground'
              }`}>
                {new Date(message.timestamp).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Message Input */}
      <div className="flex-shrink-0 p-4 lg:p-3 border-t border-border/50">
        <div className="flex gap-2">
          <Input
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => onNewMessageChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSendMessage()}
            className="flex-1 text-sm"
          />
          <Button onClick={onSendMessage} size="sm" className="flex-shrink-0">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
