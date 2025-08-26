import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, MessageSquare, Search, Send, ChevronRight, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNotificationWebSocket, NotificationWebSocket } from '@/contexts/NotificationContext';

interface Fan {
  username: string;
  display_name: string;
  avatar: string;
}

interface Conversation {
  id: string;
  fan?: Fan;
  creator?: Fan;
  other_participant_id: number;
  last_message: string;
  timestamp: string;
  unread: boolean;
  unread_count: number;
}

interface Message {
  id: string;
  sender: string;
  content: string;
  timestamp: string;
  type: 'sent' | 'received';
}

export const Messages: React.FC = () => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<NotificationWebSocket | null>(null);
  const wsServiceRef = useRef<NotificationWebSocket | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  const { createConnection } = useNotificationWebSocket();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [refreshingConversations, setRefreshingConversations] = useState(false);
  const [pushPermission, setPushPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  ); // Push notifications permission

  // Fetch conversations on component mount
  useEffect(() => {
    if (user) {
      fetchConversations(true);
    }
  }, [user]);

  // Fetch messages when conversation is selected
  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  // Initialize WebSocket connection and push notifications
  useEffect(() => {
    if (!user?.id) return;

    // Check browser push notification permission
    if ('Notification' in window) {
      setPushPermission(Notification.permission);
    }

    // Create WebSocket connection for real-time messages
    const wsService = createConnection(
      (notification) => {
        // Handle notifications
        console.log('Received notification:', notification);
      },
      (messageData) => {
        // Handle real-time messages
        console.log('Received real-time message:', messageData);

        if (messageData.type === 'new_message_realtime' && selectedConversation) {
          // Check if the message is for the current conversation
          if (messageData.conversationId === selectedConversation.id) {
            // Adjust message type based on current user
            const adjustedMessage = {
              ...messageData.message,
              type: messageData.message.sender === (user.display_name || user.username) ? 'sent' : 'received'
            };

            // Add message to current messages
            setMessages(prev => {
              // Check if message already exists to avoid duplicates
              const exists = prev.some(msg => msg.id === adjustedMessage.id);
              if (!exists) {
                return [...prev, adjustedMessage];
              }
              return prev;
            });
          }

          // Refresh conversations to update last message
          // fetchConversations(); // Commented out to prevent blank screen
        }
      }
    );

    wsServiceRef.current = wsService;

    return () => {
      if (wsServiceRef.current) {
        wsServiceRef.current.disconnect();
      }
    };
  }, [user?.id, selectedConversation, createConnection]);

  const fetchConversations = async (isInitialLoad = false) => {
    try {
      if (isInitialLoad) {
        setLoading(true);
      } else {
        setRefreshingConversations(true);
      }
      const response = await fetch('/api/conversations', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setConversations(data);
        // Auto-select first conversation if available
        if (data.length > 0 && !selectedConversation) {
          setSelectedConversation(data[0]);
        }
      } else {
        console.error('Failed to fetch conversations');
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast({
        title: "Error",
        description: "Failed to load conversations. Please try again.",
        variant: "destructive"
      });
    } finally {
      if (isInitialLoad) {
        setLoading(false);
      } else {
        setRefreshingConversations(false);
      }
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      setMessagesLoading(true);
      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      } else {
        console.error('Failed to fetch messages');
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: "Error",
        description: "Failed to load messages. Please try again.",
        variant: "destructive"
      });
    } finally {
      setMessagesLoading(false);
    }
  };

  const sendMessageMutation = useMutation({
    mutationFn: async ({ conversationId, content }: { conversationId: string; content: string }) => {
      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          content,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Store the message content before clearing the input
      const messageContent = newMessage.trim();
      setNewMessage('');

      // Add the message immediately to the UI for better UX
      if (selectedConversation && user) {
        const newMsg = {
          id: data?.id || Date.now().toString(),
          content: data?.content || messageContent,
          sender: user.display_name || user.username,
          timestamp: data?.timestamp || new Date().toISOString(),
          type: 'sent' as const
        };

        setMessages(prev => [...prev, newMsg]);
      }

      toast({
        title: "Message sent",
        description: "Your message has been sent successfully.",
      });
    },
    onError: (error) => {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
    }
  });

  const filteredConversations = conversations.filter(conv => {
    const participant = conv.fan || conv.creator;
    if (!participant) return false;
    return participant.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           participant.username?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConversation) return;

    sendMessageMutation.mutate({
      conversationId: selectedConversation.id,
      content: newMessage.trim()
    });
  };

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setShowMobileChat(true);
  };

  const handleBackToList = () => {
    setShowMobileChat(false);
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading conversations...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop View */}
      <div className="hidden lg:block">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="mb-6">
            <Button variant="outline" size="sm" asChild className="mb-4 w-10 h-10 p-0 sm:w-auto sm:h-auto sm:p-2 sm:px-4">
            <Link to="/creator/dashboard">
              <ArrowLeft className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Back to Dashboard</span>
            </Link>
          </Button>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2 flex items-center gap-2">
              <MessageSquare className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
              Messages
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Connect with your subscribers
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
            {/* Conversations List */}
            <div className="lg:col-span-1 bg-gradient-card border border-border/50 rounded-lg p-4 flex flex-col">
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search conversations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2 flex-1 overflow-y-auto">
                {filteredConversations.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No conversations yet</p>
                    <p className="text-sm mt-2">Your subscribers will appear here when they message you!</p>
                  </div>
                ) : (
                  filteredConversations.map((conv) => (
                    <div
                      key={conv.id}
                      onClick={() => handleSelectConversation(conv)}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedConversation?.id === conv.id
                          ? 'bg-primary/20 border-primary'
                          : 'hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="w-12 h-12 flex-shrink-0">
                          <AvatarImage src={(conv.fan || conv.creator)?.avatar} alt={(conv.fan || conv.creator)?.display_name} />
                          <AvatarFallback>
                            {(conv.fan || conv.creator)?.display_name?.charAt(0) || (conv.fan || conv.creator)?.username?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-medium text-foreground truncate">
                              {(conv.fan || conv.creator)?.display_name || (conv.fan || conv.creator)?.username}
                            </p>
                            <span className="text-xs text-muted-foreground flex-shrink-0">
                              {getTimeAgo(conv.timestamp)}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {conv.last_message}
                          </p>
                        </div>
                        {conv.unread && (
                          <Badge variant="secondary" className="ml-2">
                            {conv.unread_count}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Chat Area */}
            <div className="lg:col-span-2 bg-gradient-card border border-border/50 rounded-lg flex flex-col">
              {selectedConversation ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b border-border/50 flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={(selectedConversation.fan || selectedConversation.creator)?.avatar} alt={(selectedConversation.fan || selectedConversation.creator)?.display_name} />
                      <AvatarFallback>
                        {(selectedConversation.fan || selectedConversation.creator)?.display_name?.charAt(0) || (selectedConversation.fan || selectedConversation.creator)?.username?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">
                        {(selectedConversation.fan || selectedConversation.creator)?.display_name || (selectedConversation.fan || selectedConversation.creator)?.username}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        @{(selectedConversation.fan || selectedConversation.creator)?.username}
                      </p>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messagesLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No messages yet</p>
                        <p className="text-sm mt-2">Start the conversation!</p>
                      </div>
                    ) : (
                      messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.type === 'sent' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
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
                      ))
                    )}
                  </div>

                  {/* Message Input */}
                  <div className="p-4 border-t border-border/50">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Type your message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="flex-1"
                        disabled={sendMessageMutation.isPending}
                      />
                      <Button 
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim() || sendMessageMutation.isPending}
                        className="px-4"
                      >
                        {sendMessageMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">Select a conversation to start messaging</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile View */}
      <div className="lg:hidden">
        {!showMobileChat ? (
          // Mobile Conversation List
          <div className="min-h-screen bg-background">
            <div className="sticky top-0 z-10 bg-background border-b border-border/50 p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/creator/dashboard">
                      <ArrowLeft className="w-4 h-4" />
                    </Link>
                  </Button>
                  <h1 className="text-xl sm:text-2xl font-bold text-foreground">Messages</h1>
                </div>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search conversations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="p-4 space-y-2">
              {filteredConversations.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">No conversations yet</p>
                  <p className="text-sm mt-2">Your subscribers will appear here when they message you!</p>
                </div>
              ) : (
                filteredConversations.map((conv) => (
                  <div
                    key={conv.id}
                    onClick={() => handleSelectConversation(conv)}
                    className="p-4 bg-gradient-card border border-border/50 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="w-12 h-12 flex-shrink-0">
                        <AvatarImage src={(conv.fan || conv.creator)?.avatar} alt={(conv.fan || conv.creator)?.display_name} />
                        <AvatarFallback>
                          {(conv.fan || conv.creator)?.display_name?.charAt(0) || (conv.fan || conv.creator)?.username?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-medium text-foreground truncate">
                            {(conv.fan || conv.creator)?.display_name || (conv.fan || conv.creator)?.username}
                          </p>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground flex-shrink-0">
                              {getTimeAgo(conv.timestamp)}
                            </span>
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {conv.last_message}
                        </p>
                      </div>
                      {conv.unread && (
                        <Badge variant="secondary" className="ml-2">
                          {conv.unread_count}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          // Mobile Chat View
          <div className="min-h-screen bg-background flex flex-col">
            {/* Mobile Chat Header */}
            <div className="sticky top-0 z-10 bg-background border-b border-border/50 p-4">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" onClick={handleBackToList}>
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                {selectedConversation && (
                  <>
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={(selectedConversation.fan || selectedConversation.creator)?.avatar} alt={(selectedConversation.fan || selectedConversation.creator)?.display_name} />
                      <AvatarFallback>
                        {(selectedConversation.fan || selectedConversation.creator)?.display_name?.charAt(0) || (selectedConversation.fan || selectedConversation.creator)?.username?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">
                        {(selectedConversation.fan || selectedConversation.creator)?.display_name || (selectedConversation.fan || selectedConversation.creator)?.username}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        @{(selectedConversation.fan || selectedConversation.creator)?.username}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Mobile Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messagesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No messages yet</p>
                  <p className="text-sm mt-2">Start the conversation!</p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === 'sent' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs px-4 py-2 rounded-lg ${
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
                ))
              )}
            </div>

            {/* Mobile Message Input */}
            <div className="sticky bottom-0 bg-background border-t border-border/50 p-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1"
                  disabled={sendMessageMutation.isPending}
                />
                <Button 
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sendMessageMutation.isPending}
                  className="px-4"
                >
                  {sendMessageMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};