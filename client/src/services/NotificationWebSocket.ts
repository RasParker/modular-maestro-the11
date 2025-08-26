import { useAuth } from '@/contexts/AuthContext';

export interface WebSocketNotification {
  id: number;
  type: string;
  title: string;
  message: string;
  read: boolean;
  action_url?: string;
  time_ago: string;
  created_at: string;
}

export class NotificationWebSocket {
  private ws: WebSocket | null = null;
  private userId: number | null = null;
  private onNotificationCallback: ((notification: WebSocketNotification) => void) | null = null;
  private onMessageCallback: ((messageData: any) => void) | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second

  constructor(userId: number) {
    this.userId = userId;
    this.connect();
  }

  private connect() {
    try {
      // Determine WebSocket URL based on current location
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      console.log('Connecting to WebSocket:', wsUrl);
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;
        
        // Authenticate with user ID
        if (this.ws && this.userId) {
          this.ws.send(JSON.stringify({
            type: 'auth',
            userId: this.userId
          }));
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'auth_success') {
            console.log('WebSocket authentication successful');
          } else if (data.type === 'new_notification' && this.onNotificationCallback) {
            console.log('Received real-time notification:', data.notification);
            this.onNotificationCallback(data.notification);
          } else if (data.type === 'new_message_realtime' && this.onMessageCallback) {
            console.log('Received real-time message:', data);
            this.onMessageCallback(data);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        this.ws = null;
        
        // Attempt to reconnect if not manually closed
        if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    this.reconnectAttempts++;
    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), 30000);
    
    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    setTimeout(() => {
      if (this.reconnectAttempts <= this.maxReconnectAttempts) {
        this.connect();
      }
    }, delay);
  }

  public onNotification(callback: (notification: WebSocketNotification) => void) {
    this.onNotificationCallback = callback;
  }

  public onMessage(callback: (messageData: any) => void) {
    this.onMessageCallback = callback;
  }

  public isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  public disconnect() {
    if (this.ws) {
      this.ws.close(1000, 'Manual disconnect');
      this.ws = null;
    }
    this.onNotificationCallback = null;
    this.onMessageCallback = null;
  }
}

// Hook for using WebSocket notifications
export const useNotificationWebSocket = () => {
  const { user } = useAuth();
  
  const createConnection = (
    onNotification: (notification: WebSocketNotification) => void,
    onMessage?: (messageData: any) => void
  ) => {
    if (!user?.id) return null;
    
    const wsService = new NotificationWebSocket(user.id);
    wsService.onNotification(onNotification);
    if (onMessage) {
      wsService.onMessage(onMessage);
    }
    return wsService;
  };

  return { createConnection };
};