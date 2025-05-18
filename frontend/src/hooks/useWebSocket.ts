import { useRef, useEffect } from 'react';

interface WebSocketMessage {
  type: 'progress' | 'connected' | 'pong';
  value?: number;
  audioInfo?: {
    duration?: number;
  };
  duration?: number;
  message?: string;
}

interface WebSocketHookProps {
  onDurationUpdate: (duration: number) => void;
  onProgress: (progress: number) => void;
}

export const useWebSocket = ({ onDurationUpdate, onProgress }: WebSocketHookProps) => {
  const wsRef = useRef<WebSocket | null>(null);

  // Cleanup effect for WebSocket
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const setupWebSocket = (clientId: string): Promise<WebSocket> => {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(`ws://localhost:8000/ws/${clientId}`);
      
      // Set up ping interval
      let pingInterval: NodeJS.Timeout;
      
      // Set a timeout for the connection
      const timeoutId = setTimeout(() => {
        clearInterval(pingInterval);
        ws.close();
        reject(new Error('WebSocket connection timeout'));
      }, 10000);

      ws.onopen = () => {
        console.log('WebSocket connected');
        clearTimeout(timeoutId);
        
        // Set up periodic ping at a lower frequency
        pingInterval = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 30000);
        
        resolve(ws);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as WebSocketMessage;
          console.log('Raw WebSocket message:', event.data);
          
          if (data.type === 'progress' || data.type === 'connected') {
            // Update audio duration if available
            if (data.audioInfo?.duration || data.duration) {
              const duration = data.audioInfo?.duration || data.duration;
              if (typeof duration === 'number' && duration > 0) {
                onDurationUpdate(duration);
                console.log('Updated audio duration:', duration);
              }
            }

            if (data.type === 'progress' && typeof data.value === 'number') {
              const newProgress = Math.min(100, Math.max(0, data.value));
              onProgress(newProgress);
            } else if (data.type === 'connected') {
              console.log('WebSocket successfully connected:', data.message);
              onProgress(0); // Reset progress on connection
            }
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };

      ws.onerror = (error) => {
        try {
          console.error('WebSocket error:', error);
          clearTimeout(timeoutId);
          reject(error);
        } catch (err) {
          console.error('Error handling WebSocket error:', err);
        }
      };

      ws.onclose = (event) => {
        try {
          console.log('WebSocket disconnected:', event.code, event.reason);
          clearInterval(pingInterval);
          if (wsRef.current === ws) {
            wsRef.current = null;
          }
        } catch (err) {
          console.error('Error handling WebSocket close:', err);
        }
      };

      wsRef.current = ws;
    });
  };

  return {
    setupWebSocket,
    closeWebSocket: () => {
      if (wsRef.current) {
        wsRef.current.close(1000, 'Transcription complete');
      }
    }
  };
};
