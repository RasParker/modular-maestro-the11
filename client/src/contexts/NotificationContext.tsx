import React, { createContext, useContext, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';

export interface NotificationWebSocket {
  disconnect: () => void;
}

interface NotificationContextType {
  createConnection: (
    onNotification: (notification: any) => void,
    onMessage: (message: any) => void
  ) => NotificationWebSocket;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotificationWebSocket = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationWebSocket must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  const createConnection = useCallback((
    onNotification: (notification: any) => void,
    onMessage: (message: any) => void
  ): NotificationWebSocket => {
    if (!user?.id) {
      return { disconnect: () => {} };
    }

    const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('WebSocket connected');
      // Authenticate the connection
      ws.send(JSON.stringify({
        type: 'auth',
        userId: user.id,
        token: 'authenticated' // In a real app, this would be a proper auth token
      }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('WebSocket message received:', data);
        
        if (data.type === 'new_notification') {
          onNotification(data.notification);
        } else if (data.type === 'notification') {
          onNotification(data);
        } else if (data.type === 'new_message_realtime') {
          onMessage(data);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onclose = (event) => {
      console.log('WebSocket disconnected:', event.code, event.reason);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return {
      disconnect: () => {
        ws.close();
      }
    };
  }, [user?.id]);

  return (
    <NotificationContext.Provider value={{ createConnection }}>
      {children}
    </NotificationContext.Provider>
  );
};

