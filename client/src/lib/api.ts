import { queryClient } from "./queryClient";

const API_BASE = "/api";

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    let errorMessage = `API error: ${response.statusText}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error || JSON.stringify(errorData);
    } catch (e) {
      // ignore json parse error
    }
    throw new Error(errorMessage);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

// Users API
export const usersApi = {
  getAll: () => fetchJson<any[]>("/users"),
  get: (id: string) => fetchJson<any>(`/users/${id}`),
  create: (data: any) => fetchJson<any>("/users", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: any) => fetchJson<any>(`/users/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  delete: (id: string) => fetchJson<void>(`/users/${id}`, { method: "DELETE" }),
};

// Projects API
export const projectsApi = {
  getAll: () => fetchJson<any[]>("/projects"),
  get: (id: string) => fetchJson<any>(`/projects/${id}`),
  create: (data: any) => fetchJson<any>("/projects", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: any) => fetchJson<any>(`/projects/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  delete: (id: string) => fetchJson<void>(`/projects/${id}`, { method: "DELETE" }),
  getEmails: (projectId: string) => fetchJson<any[]>(`/projects/${projectId}/emails`),
  addEmail: (projectId: string, data: any) => fetchJson<any>(`/projects/${projectId}/emails`, { method: "POST", body: JSON.stringify(data) }),
  removeEmail: (projectId: string, emailId: string) => fetchJson<void>(`/projects/${projectId}/emails/${emailId}`, { method: "DELETE" }),
  generateShareLink: (id: string, expiresInDays?: number) =>
    fetchJson<{ shareToken: string; shareUrl: string; expiresAt: string }>(`/projects/${id}/share`, { method: "POST", body: JSON.stringify({ expiresInDays }) }),
  removeShareLink: (id: string) => fetchJson<{ success: boolean }>(`/projects/${id}/share`, { method: "DELETE" }),
  getShared: (token: string) => fetchJson<any>(`/shared/project/${token}`),
  getShares: (projectId: string) => fetchJson<any[]>(`/projects/${projectId}/shares`),
  addShare: (projectId: string, data: { userId: string; permission: string; sharedById?: string }) =>
    fetchJson<any>(`/projects/${projectId}/shares`, { method: "POST", body: JSON.stringify(data) }),
  removeShare: (projectId: string, shareId: string) => fetchJson<void>(`/projects/${projectId}/shares/${shareId}`, { method: "DELETE" }),
  getInvoices: (projectId: string) => fetchJson<any[]>(`/projects/${projectId}/invoices`),
  getQuotes: (projectId: string) => fetchJson<any[]>(`/projects/${projectId}/quotes`),
  getTransactions: (projectId: string) => fetchJson<any[]>(`/projects/${projectId}/transactions`),
  linkInvoice: (invoiceId: string, projectId: string | null) =>
    fetchJson<any>(`/invoices/${invoiceId}/project`, { method: "PATCH", body: JSON.stringify({ projectId }) }),
  linkQuote: (quoteId: string, projectId: string | null) =>
    fetchJson<any>(`/quotes/${quoteId}/project`, { method: "PATCH", body: JSON.stringify({ projectId }) }),
  linkTransaction: (transactionId: string, projectId: string | null) =>
    fetchJson<any>(`/finance/transactions/${transactionId}/project`, { method: "PATCH", body: JSON.stringify({ projectId }) }),
};

// Tasks API
export const tasksApi = {
  getAll: () => fetchJson<any[]>("/tasks"),
  get: (id: string) => fetchJson<any>(`/tasks/${id}`),
  create: (data: any) => fetchJson<any>("/tasks", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: any) => fetchJson<any>(`/tasks/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  delete: (id: string) => fetchJson<void>(`/tasks/${id}`, { method: "DELETE" }),
};

// Personal Todos API
export const personalTodosApi = {
  getAll: (userId?: string) => {
    const params = new URLSearchParams({ _t: Date.now().toString() });
    if (userId) params.append("userId", userId);
    return fetchJson<any[]>(`/personal-todos?${params.toString()}`);
  },
  create: (data: any) => fetchJson<any>("/personal-todos", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: any) => fetchJson<any>(`/personal-todos/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  delete: (id: string) => fetchJson<void>(`/personal-todos/${id}`, { method: "DELETE" }),
};

// Emails API
export const emailsApi = {
  getAll: () => fetchJson<any[]>("/emails"),
  get: (id: string) => fetchJson<any>(`/emails/${id}`),
  create: (data: any) => fetchJson<any>("/emails", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: any) => fetchJson<any>(`/emails/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  delete: (id: string) => fetchJson<void>(`/emails/${id}`, { method: "DELETE" }),
};

// Chat API
export const chatApi = {
  getChannels: () => fetchJson<any[]>("/chat/channels"),
  createChannel: (data: any) => fetchJson<any>("/chat/channels", { method: "POST", body: JSON.stringify(data) }),
  updateChannel: (id: string, data: any) => fetchJson<any>(`/chat/channels/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteChannel: (id: string) => fetchJson<void>(`/chat/channels/${id}`, { method: "DELETE" }),
  archiveChannel: (id: string, userId: string) => fetchJson<any>(`/chat/channels/${id}/archive`, { method: "POST", body: JSON.stringify({ userId }) }),
  createDm: (data: { userId1: string; userId2: string; user1Name: string; user2Name: string }) =>
    fetchJson<any>("/chat/dm", { method: "POST", body: JSON.stringify(data) }),
  getMessages: (channelId: string) => fetchJson<any[]>(`/chat/channels/${channelId}/messages`),
  sendMessage: (channelId: string, data: any) => fetchJson<any>(`/chat/channels/${channelId}/messages`, { method: "POST", body: JSON.stringify(data) }),
  deleteMessage: (messageId: string) => fetchJson<void>(`/chat/messages/${messageId}`, { method: "DELETE" }),
  deleteMessages: (messageIds: string[]) => fetchJson<void>(`/chat/messages/bulk-delete`, { method: "POST", body: JSON.stringify({ ids: messageIds }) }),
  markAsRead: (channelId: string) => fetchJson<any>(`/chat/channels/${channelId}/read`, { method: "POST" }),
  getUnreadCount: () => fetchJson<{ unreadCount: number }>("/chat/unread"),
  uploadFile: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch("/api/chat/upload", { method: "POST", body: formData });
    if (!response.ok) throw new Error("Upload failed");
    return response.json();
  },
  saveConversation: (channelId: string, data: { title: string; notes?: string; userId: string; userName: string }) =>
    fetchJson<any>(`/chat/channels/${channelId}/save`, { method: "POST", body: JSON.stringify(data) }),
  getSavedConversations: (userId?: string) => fetchJson<any[]>(userId ? `/chat/saved?userId=${userId}` : "/chat/saved"),
  getSavedConversation: (id: string) => fetchJson<any>(`/chat/saved/${id}`),
  deleteSavedConversation: (id: string) => fetchJson<void>(`/chat/saved/${id}`, { method: "DELETE" }),
  askAI: (channelId: string, question: string, userId: string, sendToChat?: boolean, conversationHistory?: Array<{ role: 'user' | 'ai'; content: string }>) =>
    fetchJson<{ response: string }>(`/chat/channels/${channelId}/ai`, { method: "POST", body: JSON.stringify({ question, userId, sendToChat, conversationHistory }) }),
  getProjectChannel: (projectId: string) => fetchJson<any | null>(`/chat/channels/project/${projectId}`),
  createProjectChannel: (projectId: string, data: { projectName: string; createdBy: string }) =>
    fetchJson<any>(`/chat/channels/project/${projectId}`, { method: "POST", body: JSON.stringify(data) }),
  getTaskChannel: (taskId: string) => fetchJson<any | null>(`/chat/channels/task/${taskId}`),
  createTaskChannel: (taskId: string, data: { taskTitle: string; createdBy: string }) =>
    fetchJson<any>(`/chat/channels/task/${taskId}`, { method: "POST", body: JSON.stringify(data) }),
};

// WhatsApp API
export const whatsappApi = {
  getContacts: () => fetchJson<any[]>("/whatsapp/contacts"),
  createContact: (data: any) => fetchJson<any>("/whatsapp/contacts", { method: "POST", body: JSON.stringify(data) }),
  updateContact: (id: string, data: any) => fetchJson<any>(`/whatsapp/contacts/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  getMessages: (contactId: string) => fetchJson<any[]>(`/whatsapp/contacts/${contactId}/messages`),
  sendMessage: (contactId: string, data: any) => fetchJson<any>(`/whatsapp/contacts/${contactId}/messages`, { method: "POST", body: JSON.stringify(data) }),
  getStatus: () => fetchJson<any>("/whatsapp/status"),
  getQr: () => fetchJson<any>("/whatsapp/qr"),
  init: () => fetchJson<any>("/whatsapp/init", { method: "POST" }),
  disconnect: () => fetchJson<any>("/whatsapp/disconnect", { method: "POST" }),
};

// Telegram API
export const telegramApi = {
  getChats: () => fetchJson<any[]>("/telegram/chats"),
  getChat: (id: string) => fetchJson<any>(`/telegram/chats/${id}`),
  createChat: (data: any) => fetchJson<any>("/telegram/chats", { method: "POST", body: JSON.stringify(data) }),
  getMessages: (chatId: string) => fetchJson<any[]>(`/telegram/chats/${chatId}/messages`),
  sendMessage: (chatId: string, data: any) => fetchJson<any>(`/telegram/chats/${chatId}/messages`, { method: "POST", body: JSON.stringify(data) }),
  sendTelegram: (chatId: string, text: string) => fetchJson<any>("/telegram/send", { method: "POST", body: JSON.stringify({ chatId, text }) }),
  getBotInfo: () => fetchJson<any>("/telegram/bot-info"),
};

// Documents API
export const documentsApi = {
  getAll: (userId?: string) => fetchJson<any[]>(userId ? `/documents?userId=${userId}` : "/documents"),
  get: (id: string) => fetchJson<any>(`/documents/${id}`),
  create: (data: any) => fetchJson<any>("/documents", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: any) => fetchJson<any>(`/documents/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  delete: (id: string) => fetchJson<void>(`/documents/${id}`, { method: "DELETE" }),
  getShares: (id: string) => fetchJson<any[]>(`/documents/${id}/shares`),
  addShare: (id: string, data: any) => fetchJson<any>(`/documents/${id}/shares`, { method: "POST", body: JSON.stringify(data) }),
  removeShare: (docId: string, shareId: string) => fetchJson<void>(`/documents/${docId}/shares/${shareId}`, { method: "DELETE" }),
  getComments: (id: string) => fetchJson<any[]>(`/documents/${id}/comments`),
  addComment: (id: string, data: any) => fetchJson<any>(`/documents/${id}/comments`, { method: "POST", body: JSON.stringify(data) }),
  updateComment: (docId: string, commentId: string, data: any) => fetchJson<any>(`/documents/${docId}/comments/${commentId}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteComment: (docId: string, commentId: string) => fetchJson<void>(`/documents/${docId}/comments/${commentId}`, { method: "DELETE" }),
  getProjects: (docId: string) => fetchJson<any[]>(`/documents/${docId}/projects`),
  linkToProject: (projectId: string, documentId: string) => fetchJson<any>(`/projects/${projectId}/documents`, { method: "POST", body: JSON.stringify({ documentId }) }),
};

// Seed API
export const seedApi = {
  seed: () => fetchJson<any>("/seed", { method: "POST" }),
};

// Keep Notes API
export const keepNotesApi = {
  getAll: (userId: string) => fetchJson<any[]>(`/keep/notes/${userId}`),
  create: (data: any) => fetchJson<any>("/keep/notes", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: any) => fetchJson<any>(`/keep/notes/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  delete: (id: string) => fetchJson<void>(`/keep/notes/${id}`, { method: "DELETE" }),
};
