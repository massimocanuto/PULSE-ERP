import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface CollaboratorPresence {
  odId: string;
  odName: string;
  odColor: string;
  cursorPosition?: { line: number; column: number };
}

interface CollabMessage {
  type: 'join' | 'leave' | 'cursor' | 'content' | 'presence' | 'sync' | 'error';
  documentId: string;
  userId?: string;
  userName?: string;
  userColor?: string;
  content?: string;
  message?: string;
  cursorPosition?: { line: number; column: number };
  users?: Array<{ userId: string; userName: string; userColor: string; cursorPosition?: { line: number; column: number } }>;
}

export function useDocumentCollaboration(documentId: string | null, enabled: boolean = true) {
  const { user } = useAuth();
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [collaborators, setCollaborators] = useState<CollaboratorPresence[]>([]);
  const [myColor, setMyColor] = useState<string>('#4ECDC4');
  const [remoteContent, setRemoteContent] = useState<string | null>(null);
  const [remoteCursors, setRemoteCursors] = useState<Map<string, { userName: string; userColor: string; position: { line: number; column: number } }>>(new Map());
  
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(() => {
    if (!documentId || !user || !enabled) return;
    
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/documents`;
    
    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[Collab] WebSocket connected');
        setIsConnected(true);
        reconnectAttempts.current = 0;

        ws.send(JSON.stringify({
          type: 'join',
          documentId,
          userId: user.id,
          userName: user.name || user.username
        }));
      };

      ws.onmessage = (event) => {
        try {
          const message: CollabMessage = JSON.parse(event.data);
          
          switch (message.type) {
            case 'error':
              console.error('[Collab] Server error:', message.message);
              setIsConnected(false);
              break;

            case 'sync':
              if (message.userColor) {
                setMyColor(message.userColor);
              }
              if (message.users) {
                setCollaborators(message.users
                  .filter(u => u.userId !== user.id)
                  .map(u => ({
                    odId: u.userId,
                    odName: u.userName,
                    odColor: u.userColor,
                    cursorPosition: u.cursorPosition
                  }))
                );
              }
              break;

            case 'presence':
              if (message.users) {
                setCollaborators(message.users
                  .filter(u => u.userId !== user.id)
                  .map(u => ({
                    odId: u.userId,
                    odName: u.userName,
                    odColor: u.userColor,
                    cursorPosition: u.cursorPosition
                  }))
                );
              }
              break;

            case 'cursor':
              if (message.userId && message.userId !== user.id && message.cursorPosition) {
                setRemoteCursors(prev => {
                  const newMap = new Map(prev);
                  newMap.set(message.userId!, {
                    userName: message.userName || 'Utente',
                    userColor: message.userColor || '#999',
                    position: message.cursorPosition!
                  });
                  return newMap;
                });
              }
              break;

            case 'content':
              if (message.userId !== user.id && message.content !== undefined) {
                setRemoteContent(message.content);
              }
              break;
          }
        } catch (error) {
          console.error('[Collab] Error parsing message:', error);
        }
      };

      ws.onclose = () => {
        console.log('[Collab] WebSocket disconnected');
        setIsConnected(false);
        wsRef.current = null;

        if (reconnectAttempts.current < maxReconnectAttempts && enabled && documentId) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttempts.current++;
            connect();
          }, delay);
        }
      };

      ws.onerror = (error) => {
        console.error('[Collab] WebSocket error:', error);
      };
    } catch (error) {
      console.error('[Collab] Failed to create WebSocket:', error);
    }
  }, [documentId, user, enabled]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (wsRef.current) {
      if (wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'leave', documentId }));
      }
      wsRef.current.close();
      wsRef.current = null;
    }
    
    setIsConnected(false);
    setCollaborators([]);
    setRemoteCursors(new Map());
    setRemoteContent(null);
  }, [documentId]);

  const sendCursorPosition = useCallback((position: { line: number; column: number }) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'cursor',
        documentId,
        cursorPosition: position
      }));
    }
  }, [documentId]);

  const sendContentUpdate = useCallback((content: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'content',
        documentId,
        content
      }));
    }
  }, [documentId]);

  useEffect(() => {
    if (documentId && user && enabled) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [documentId, user, enabled, connect, disconnect]);

  return {
    isConnected,
    collaborators,
    myColor,
    remoteContent,
    remoteCursors,
    sendCursorPosition,
    sendContentUpdate
  };
}
