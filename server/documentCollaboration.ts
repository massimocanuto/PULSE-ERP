import { WebSocketServer, WebSocket } from 'ws';
import { Server as HttpServer, IncomingMessage } from 'http';
import { storage } from './storage';
import { parse as parseCookie } from 'cookie';
import { URL } from 'url';

interface DocumentSession {
  documentId: string;
  users: Map<string, {
    odId: string;
    userId: string;
    userName: string;
    userColor: string;
    cursorPosition?: { line: number; column: number };
    lastActive: number;
  }>;
  content: string;
}

interface CollabMessage {
  type: 'join' | 'leave' | 'cursor' | 'content' | 'presence' | 'sync';
  documentId: string;
  userId?: string;
  userName?: string;
  userColor?: string;
  content?: string;
  cursorPosition?: { line: number; column: number };
  users?: Array<{ userId: string; userName: string; userColor: string; cursorPosition?: { line: number; column: number } }>;
}

const USER_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', 
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
];

const documentSessions = new Map<string, DocumentSession>();
const clientConnections = new Map<WebSocket, { documentId: string; odId: string; userId: string; canEdit: boolean }>();

function getRandomColor(): string {
  return USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)];
}

function generateConnectionId(): string {
  return Math.random().toString(36).substring(2, 15);
}

function broadcastToDocument(documentId: string, message: CollabMessage, excludeWs?: WebSocket) {
  const session = documentSessions.get(documentId);
  if (!session) return;

  const messageStr = JSON.stringify(message);
  
  for (const [ws, conn] of clientConnections.entries()) {
    if (conn.documentId === documentId && ws !== excludeWs && ws.readyState === WebSocket.OPEN) {
      ws.send(messageStr);
    }
  }
}

function getDocumentUsers(documentId: string): Array<{ userId: string; userName: string; userColor: string; cursorPosition?: { line: number; column: number } }> {
  const session = documentSessions.get(documentId);
  if (!session) return [];
  
  return Array.from(session.users.values()).map(u => ({
    userId: u.userId,
    userName: u.userName,
    userColor: u.userColor,
    cursorPosition: u.cursorPosition
  }));
}

export function setupDocumentCollaboration(server: HttpServer) {
  const wss = new WebSocketServer({ 
    server,
    path: '/ws/documents'
  });

  console.log('[WebSocket] Document collaboration server initialized on /ws/documents');

  wss.on('connection', (ws: WebSocket) => {
    const connectionId = generateConnectionId();
    console.log(`[WebSocket] New connection: ${connectionId}`);

    ws.on('message', (data: Buffer) => {
      try {
        const message: CollabMessage = JSON.parse(data.toString());
        
        switch (message.type) {
          case 'join': {
            const { documentId, userId, userName } = message;
            if (!documentId || !userId || !userName) return;

            (async () => {
              try {
                const document = await storage.getDocument(documentId);
                if (!document) {
                  ws.send(JSON.stringify({ type: 'error', message: 'Documento non trovato' }));
                  ws.close();
                  return;
                }

                const isOwner = document.ownerId === userId;
                let hasAccess = isOwner;
                let canEdit = isOwner;

                if (!isOwner) {
                  const shares = await storage.getDocumentShares(documentId);
                  const userShare = shares.find((s: any) => s.userId === userId);
                  if (userShare) {
                    hasAccess = ['view', 'edit', 'admin'].includes(userShare.permission);
                    canEdit = ['edit', 'admin'].includes(userShare.permission);
                  }
                }

                if (!hasAccess) {
                  ws.send(JSON.stringify({ type: 'error', message: 'Accesso non autorizzato' }));
                  ws.close();
                  return;
                }

                let session = documentSessions.get(documentId);
                if (!session) {
                  session = {
                    documentId,
                    users: new Map(),
                    content: document.content || ''
                  };
                  documentSessions.set(documentId, session);
                }

                const userColor = getRandomColor();
                session.users.set(connectionId, {
                  odId: connectionId,
                  userId,
                  userName,
                  userColor,
                  lastActive: Date.now()
                });

                clientConnections.set(ws, { documentId, odId: connectionId, userId, canEdit });

                ws.send(JSON.stringify({
                  type: 'sync',
                  documentId,
                  userColor,
                  canEdit,
                  content: session.content,
                  users: getDocumentUsers(documentId)
                }));

                broadcastToDocument(documentId, {
                  type: 'presence',
                  documentId,
                  users: getDocumentUsers(documentId)
                }, ws);

                console.log(`[WebSocket] User ${userName} joined document ${documentId} (authorized)`);
              } catch (error) {
                console.error('[WebSocket] Error validating access:', error);
                ws.send(JSON.stringify({ type: 'error', message: 'Errore di validazione' }));
                ws.close();
              }
            })();
            break;
          }

          case 'cursor': {
            const conn = clientConnections.get(ws);
            if (!conn) return;

            const session = documentSessions.get(conn.documentId);
            if (!session) return;

            const user = session.users.get(conn.odId);
            if (user && message.cursorPosition) {
              user.cursorPosition = message.cursorPosition;
              user.lastActive = Date.now();

              broadcastToDocument(conn.documentId, {
                type: 'cursor',
                documentId: conn.documentId,
                userId: conn.userId,
                cursorPosition: message.cursorPosition,
                userColor: user.userColor,
                userName: user.userName
              }, ws);
            }
            break;
          }

          case 'content': {
            const conn = clientConnections.get(ws);
            if (!conn) return;

            if (!conn.canEdit) {
              ws.send(JSON.stringify({ type: 'error', message: 'Non hai i permessi per modificare questo documento' }));
              return;
            }

            const session = documentSessions.get(conn.documentId);
            if (session && message.content !== undefined) {
              session.content = message.content;

              const user = session.users.get(conn.odId);
              broadcastToDocument(conn.documentId, {
                type: 'content',
                documentId: conn.documentId,
                userId: conn.userId,
                userName: user?.userName,
                content: message.content
              }, ws);
            }
            break;
          }

          case 'leave': {
            handleDisconnect(ws);
            break;
          }
        }
      } catch (error) {
        console.error('[WebSocket] Error processing message:', error);
      }
    });

    ws.on('close', () => {
      handleDisconnect(ws);
    });

    ws.on('error', (error) => {
      console.error('[WebSocket] Connection error:', error);
      handleDisconnect(ws);
    });
  });

  function handleDisconnect(ws: WebSocket) {
    const conn = clientConnections.get(ws);
    if (!conn) return;

    const session = documentSessions.get(conn.documentId);
    if (session) {
      const user = session.users.get(conn.odId);
      session.users.delete(conn.odId);

      if (user) {
        console.log(`[WebSocket] User ${user.userName} left document ${conn.documentId}`);
      }

      broadcastToDocument(conn.documentId, {
        type: 'presence',
        documentId: conn.documentId,
        users: getDocumentUsers(conn.documentId)
      });

      if (session.users.size === 0) {
        documentSessions.delete(conn.documentId);
      }
    }

    clientConnections.delete(ws);
  }

  setInterval(() => {
    const now = Date.now();
    const timeout = 5 * 60 * 1000;

    for (const [docId, session] of documentSessions.entries()) {
      for (const [connId, user] of session.users.entries()) {
        if (now - user.lastActive > timeout) {
          session.users.delete(connId);
        }
      }
      if (session.users.size === 0) {
        documentSessions.delete(docId);
      }
    }
  }, 60000);

  return wss;
}
