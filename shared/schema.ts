import { sql } from "drizzle-orm";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  username: text("username").unique(),
  password: text("password"),
  role: text("role").notNull().default("Member"),
  department: text("department"),
  status: text("status").notNull().default("Active"),
  avatar: text("avatar"),
  allowedIp: text("allowed_ip"),
  googleAccessToken: text("google_access_token"),
  googleRefreshToken: text("google_refresh_token"),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// User Access Logs table
export const userAccessLogs = sqliteTable("user_access_logs", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  loginAt: text("login_at"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  device: text("device"),
  browser: text("browser"),
  os: text("os"),
  success: integer("success", { mode: "boolean" }).default(true),
  logoutAt: text("logout_at"),
});

export const insertUserAccessLogSchema = createInsertSchema(userAccessLogs).omit({ id: true, loginAt: true });
export type InsertUserAccessLog = z.infer<typeof insertUserAccessLogSchema>;
export type UserAccessLog = typeof userAccessLogs.$inferSelect;

// Projects table
export const projects = sqliteTable("projects", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  status: text("status").notNull().default("Not Started"),
  priority: text("priority").notNull().default("Medium"),
  startDate: text("start_date"),
  dueDate: text("due_date"),
  teamMembers: text("team_members", { mode: "json" }).$type<string[]>().default("[]"),
  owner: text("owner"),
  notes: text("notes"),
  budget: text("budget"),
  files: text("files", { mode: "json" }).$type<string[]>().default("[]"),
  createdAt: text("created_at"),
  shareToken: text("share_token"),
  shareExpiresAt: text("share_expires_at"),
  isPublic: integer("is_public", { mode: "boolean" }).default(false),
});

export const insertProjectSchema = createInsertSchema(projects).omit({ id: true, createdAt: true });
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;

// Project Shares table
export const projectShares = sqliteTable("project_shares", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull().references(() => projects.id),
  userId: text("user_id").notNull().references(() => users.id),
  sharedById: text("shared_by_id").references(() => users.id),
  permission: text("permission").notNull().default("view"),
  sharedAt: text("shared_at"),
});

export const insertProjectShareSchema = createInsertSchema(projectShares).omit({ id: true, sharedAt: true });
export type InsertProjectShare = z.infer<typeof insertProjectShareSchema>;
export type ProjectShare = typeof projectShares.$inferSelect;

// Tasks table
export const tasks = sqliteTable("tasks", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  done: integer("done", { mode: "boolean" }).notNull().default(false),
  startDate: text("start_date"),
  dueDate: text("due_date"),
  tag: text("tag"),
  assignedTo: text("assigned_to").references(() => users.id),
  priority: text("priority").default("medium"),
  estimatedHours: integer("estimated_hours"),
  actualHours: integer("actual_hours"),
  projectId: text("project_id").references(() => projects.id, { onDelete: "set null" }),
  createdAt: text("created_at"),
});

export const insertTaskSchema = createInsertSchema(tasks).omit({ id: true, createdAt: true });
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;

// Emails table
// Emails table
export const emails = sqliteTable("emails", {
  id: text("id").primaryKey(), // Combined ID: email_uid + folder + accountId
  userId: text("user_id").references(() => users.id),
  uid: integer("uid").notNull().default(0),
  messageId: text("message_id"),
  folder: text("folder").notNull().default('INBOX'),
  accountId: text("account_id"),
  fromAddress: text("from_address"),
  fromName: text("from_name"),
  toAddress: text("to_address"),
  subject: text("subject"),
  preview: text("preview"),
  body: text("body"),
  unread: integer("unread", { mode: "boolean" }).default(false),
  starred: integer("starred", { mode: "boolean" }).default(false),
  hasAttachments: integer("has_attachments", { mode: "boolean" }).default(false),
  receivedAt: text("received_at"),
  createdAt: text("created_at"),
});

export const insertEmailSchema = createInsertSchema(emails).omit({ createdAt: true });
export type InsertEmail = z.infer<typeof insertEmailSchema>;
export type Email = typeof emails.$inferSelect;

// Project Emails - links emails to projects
export const projectEmails = sqliteTable("project_emails", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  emailId: text("email_id").notNull(),
  emailSubject: text("email_subject").notNull(),
  emailFrom: text("email_from").notNull(),
  emailPreview: text("email_preview"),
  emailDate: text("email_date"),
  addedAt: text("added_at"),
});

export const insertProjectEmailSchema = createInsertSchema(projectEmails).omit({ id: true, addedAt: true });
export type InsertProjectEmail = z.infer<typeof insertProjectEmailSchema>;
export type ProjectEmail = typeof projectEmails.$inferSelect;

// Chat Channels table
export const chatChannels = sqliteTable("chat_channels", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull().default("channel"),
  description: text("description"),
  color: text("color").default("blue"),
  members: text("members", { mode: "json" }).$type<string[]>().default("[]"),
  createdBy: text("created_by").references(() => users.id),
  unreadCount: integer("unread_count").notNull().default(0),
  lastMessageAt: text("last_message_at"),
  createdAt: text("created_at"),
  isArchived: integer("is_archived").notNull().default(0),
  archivedAt: text("archived_at"),
  archivedBy: text("archived_by").references(() => users.id),
  projectId: text("project_id").references(() => projects.id, { onDelete: "cascade" }),
  taskId: text("task_id").references(() => tasks.id, { onDelete: "cascade" }),
});

export const CHANNEL_COLORS = [
  { id: 'blue', name: 'Blu', class: 'bg-blue-500' },
  { id: 'green', name: 'Verde', class: 'bg-green-500' },
  { id: 'red', name: 'Rosso', class: 'bg-red-500' },
  { id: 'orange', name: 'Arancione', class: 'bg-orange-500' },
  { id: 'purple', name: 'Viola', class: 'bg-purple-500' },
  { id: 'pink', name: 'Rosa', class: 'bg-pink-500' },
  { id: 'yellow', name: 'Giallo', class: 'bg-yellow-500' },
  { id: 'teal', name: 'Teal', class: 'bg-teal-500' },
  { id: 'indigo', name: 'Indaco', class: 'bg-indigo-500' },
  { id: 'cyan', name: 'Ciano', class: 'bg-cyan-500' },
] as const;

export const insertChatChannelSchema = createInsertSchema(chatChannels).omit({ id: true, createdAt: true, lastMessageAt: true });
export type InsertChatChannel = z.infer<typeof insertChatChannelSchema>;
export type ChatChannel = typeof chatChannels.$inferSelect;

// Chat Messages table
export const chatMessages = sqliteTable("chat_messages", {
  id: text("id").primaryKey(),
  channelId: text("channel_id").notNull().references(() => chatChannels.id),
  senderId: text("sender_id").notNull(),
  senderName: text("sender_name").notNull(),
  senderAvatar: text("sender_avatar"),
  content: text("content").notNull(),
  attachments: text("attachments"),
  isRead: integer("is_read").notNull().default(0),
  createdAt: text("created_at"),
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({ id: true, createdAt: true });
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;

// Saved Chat Conversations table
export const chatSavedConversations = sqliteTable("chat_saved_conversations", {
  id: text("id").primaryKey(),
  channelId: text("channel_id").notNull(),
  channelName: text("channel_name").notNull(),
  title: text("title").notNull(),
  notes: text("notes"),
  savedBy: text("saved_by").notNull().references(() => users.id),
  savedByName: text("saved_by_name").notNull(),
  transcript: text("transcript").notNull(),
  messageCount: integer("message_count").notNull().default(0),
  dateFrom: text("date_from"),
  dateTo: text("date_to"),
  createdAt: text("created_at"),
});

export const insertChatSavedConversationSchema = createInsertSchema(chatSavedConversations).omit({ id: true, createdAt: true });
export type InsertChatSavedConversation = z.infer<typeof insertChatSavedConversationSchema>;
export type ChatSavedConversation = typeof chatSavedConversations.$inferSelect;

// Chat Folders table
export const chatFolders = sqliteTable("chat_folders", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  color: text("color").default("blue"),
  icon: text("icon").default("folder"),
  createdBy: text("created_by").notNull().references(() => users.id),
  createdAt: text("created_at"),
});

export const insertChatFolderSchema = createInsertSchema(chatFolders).omit({ id: true, createdAt: true });
export type InsertChatFolder = z.infer<typeof insertChatFolderSchema>;
export type ChatFolder = typeof chatFolders.$inferSelect;

// Chat Folder Items table (links saved conversations to folders)
export const chatFolderItems = sqliteTable("chat_folder_items", {
  id: text("id").primaryKey(),
  folderId: text("folder_id").notNull().references(() => chatFolders.id, { onDelete: "cascade" }),
  savedConversationId: text("saved_conversation_id").notNull().references(() => chatSavedConversations.id, { onDelete: "cascade" }),
  addedAt: text("added_at"),
});

export const insertChatFolderItemSchema = createInsertSchema(chatFolderItems).omit({ id: true, addedAt: true });
export type InsertChatFolderItem = z.infer<typeof insertChatFolderItemSchema>;
export type ChatFolderItem = typeof chatFolderItems.$inferSelect;



// Telegram Chats table
export const telegramChats = sqliteTable("telegram_chats", {
  id: text("id").primaryKey(),
  chatId: text("chat_id").notNull().unique(),
  username: text("username"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  type: text("type").notNull().default("private"),
  unreadCount: integer("unread_count").notNull().default(0),
  lastMessageAt: text("last_message_at"),
});

export const insertTelegramChatSchema = createInsertSchema(telegramChats).omit({ id: true, lastMessageAt: true });
export type InsertTelegramChat = z.infer<typeof insertTelegramChatSchema>;
export type TelegramChat = typeof telegramChats.$inferSelect;

// Telegram Messages table
export const telegramMessages = sqliteTable("telegram_messages", {
  id: text("id").primaryKey(),
  chatId: text("chat_id").notNull().references(() => telegramChats.id),
  telegramMessageId: text("telegram_message_id"),
  content: text("content").notNull(),
  direction: text("direction").notNull().default("incoming"),
  createdAt: text("created_at"),
});

export const insertTelegramMessageSchema = createInsertSchema(telegramMessages).omit({ id: true, createdAt: true });
export type InsertTelegramMessage = z.infer<typeof insertTelegramMessageSchema>;
export type TelegramMessage = typeof telegramMessages.$inferSelect;

// Documents table
export const documents = sqliteTable("documents", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").default(""),
  icon: text("icon").default("📄"),
  coverImage: text("cover_image"),
  attachments: text("attachments"),
  parentId: text("parent_id"),
  ownerId: text("owner_id").references(() => users.id),
  lastEditorId: text("last_editor_id").references(() => users.id),
  lastEditedAt: text("last_edited_at"),
  isPublic: integer("is_public", { mode: "boolean" }).notNull().default(false),
  isArchived: integer("is_archived", { mode: "boolean" }).notNull().default(false),
  needsReview: integer("needs_review", { mode: "boolean" }).notNull().default(false),
  tags: text("tags").default("[]"),
  createdAt: text("created_at"),
  updatedAt: text("updated_at"),
});

export const insertDocumentSchema = createInsertSchema(documents).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documents.$inferSelect;

// Document Shares table
export const documentShares = sqliteTable("document_shares", {
  id: text("id").primaryKey(),
  documentId: text("document_id").notNull().references(() => documents.id),
  userId: text("user_id").notNull().references(() => users.id),
  sharedById: text("shared_by_id").references(() => users.id),
  permission: text("permission").notNull().default("view"),
  sharedAt: text("shared_at"),
});

export const insertDocumentShareSchema = createInsertSchema(documentShares).omit({ id: true, sharedAt: true });
export type InsertDocumentShare = z.infer<typeof insertDocumentShareSchema>;
export type DocumentShare = typeof documentShares.$inferSelect;

// Document Comments table
export const documentComments = sqliteTable("document_comments", {
  id: text("id").primaryKey(),
  documentId: text("document_id").notNull().references(() => documents.id),
  userId: text("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  resolved: integer("resolved").notNull().default(0),
  createdAt: text("created_at"),
});

export const insertDocumentCommentSchema = createInsertSchema(documentComments).omit({ id: true, createdAt: true });
export type InsertDocumentComment = z.infer<typeof insertDocumentCommentSchema>;
export type DocumentComment = typeof documentComments.$inferSelect;

// Project Documents - links documents to projects
export const projectDocuments = sqliteTable("project_documents", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  documentId: text("document_id").notNull().references(() => documents.id, { onDelete: "cascade" }),
  addedAt: text("added_at"),
});

export const insertProjectDocumentSchema = createInsertSchema(projectDocuments).omit({ id: true, addedAt: true });
export type InsertProjectDocument = z.infer<typeof insertProjectDocumentSchema>;
export type ProjectDocument = typeof projectDocuments.$inferSelect;

// Role Permissions table - stores permissions for each role
export const rolePermissions = sqliteTable("role_permissions", {
  id: text("id").primaryKey(),
  role: text("role").notNull(),
  module: text("module").notNull(),
  canView: integer("can_view", { mode: "boolean" }).notNull().default(false),
  canCreate: integer("can_create", { mode: "boolean" }).notNull().default(false),
  canEdit: integer("can_edit", { mode: "boolean" }).notNull().default(false),
  canDelete: integer("can_delete", { mode: "boolean" }).notNull().default(false),
});

export const insertRolePermissionSchema = createInsertSchema(rolePermissions).omit({ id: true });
export type InsertRolePermission = z.infer<typeof insertRolePermissionSchema>;
export type RolePermission = typeof rolePermissions.$inferSelect;

// Available modules and roles
export const MODULES = ['projects', 'tasks', 'email', 'chat', 'documents', 'users', 'archivio', 'produzione', 'crm', 'office_pulse'] as const;
export const ROLES = ['Admin', 'Manager', 'Member', 'Viewer'] as const;
export type Module = typeof MODULES[number];
export type Role = typeof ROLES[number];

// Archive categories
export const ARCHIVE_CATEGORIES = ['Contratti', 'Fatture', 'Documenti Legali', 'Certificazioni', 'Altro'] as const;
export type ArchiveCategory = typeof ARCHIVE_CATEGORIES[number];

// Archive Folders table - custom user folders
export const archiveFolders = sqliteTable("archive_folders", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  color: text("color").default("gray"),
  icon: text("icon").default("folder"),
  parentId: text("parent_id"),
  projectId: text("project_id"),
  createdBy: text("created_by").references(() => users.id),
  createdAt: text("created_at"),
  updatedAt: text("updated_at"),
});

export const insertArchiveFolderSchema = createInsertSchema(archiveFolders).omit({ id: true, createdAt: true });
export type InsertArchiveFolder = z.infer<typeof insertArchiveFolderSchema>;
export type ArchiveFolder = typeof archiveFolders.$inferSelect;

// Archived Documents table
export const archivedDocuments = sqliteTable("archived_documents", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  category: text("category").notNull(),
  folderId: text("folder_id").references(() => archiveFolders.id),
  filePath: text("file_path").notNull(),
  fileName: text("file_name").notNull(),
  fileType: text("file_type").notNull(),
  fileSize: integer("file_size"),
  tags: text("tags").default("[]"),
  starred: integer("starred", { mode: "boolean" }).notNull().default(false),
  notes: text("notes"),
  aiSummary: text("ai_summary"),
  archivedAt: text("archived_at"),
  updatedAt: text("updated_at"),
  deletedAt: text("deleted_at"),
  uploadedBy: text("uploaded_by").references(() => users.id),
  updatedBy: text("updated_by").references(() => users.id),
  shareToken: text("share_token"),
  shareExpiresAt: text("share_expires_at"),
  downloadCount: integer("download_count").default(0),
  lastDownloadAt: text("last_download_at"),
  lastDownloadIp: text("last_download_ip"),
  shareCreatedAt: text("share_created_at"),
});

export const insertArchivedDocumentSchema = createInsertSchema(archivedDocuments).omit({ id: true, archivedAt: true });
export type InsertArchivedDocument = z.infer<typeof insertArchivedDocumentSchema>;
export type ArchivedDocument = typeof archivedDocuments.$inferSelect;

// User Permissions table - stores individual user permissions per module
export const userPermissions = sqliteTable("user_permissions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  module: text("module").notNull(),
  canView: integer("can_view", { mode: "boolean" }).notNull().default(false),
  canCreate: integer("can_create", { mode: "boolean" }).notNull().default(false),
  canEdit: integer("can_edit", { mode: "boolean" }).notNull().default(false),
  canDelete: integer("can_delete", { mode: "boolean" }).notNull().default(false),
});

export const insertUserPermissionSchema = createInsertSchema(userPermissions).omit({ id: true });
export type InsertUserPermission = z.infer<typeof insertUserPermissionSchema>;
export type UserPermission = typeof userPermissions.$inferSelect;

// Personal Todos table - for personal task management
export const personalTodos = sqliteTable("personal_todos", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  completed: integer("completed", { mode: "boolean" }).notNull().default(false),
  priority: text("priority").notNull().default("medium"),
  dueDate: text("due_date"),
  category: text("category"),
  starred: integer("starred", { mode: "boolean" }).notNull().default(false),
  userId: text("user_id").references(() => users.id),
  projectId: text("project_id").references(() => projects.id),
  recurrenceType: text("recurrence_type"),
  recurrenceEndDate: text("recurrence_end_date"),
  reminderBefore: integer("reminder_before"),
  reminderSent: integer("reminder_sent", { mode: "boolean" }).default(false),
  dependsOn: text("depends_on", { mode: "json" }).$type<string[]>().default("[]"),
  pomodoroSessions: integer("pomodoro_sessions").default(0),
  pomodoroMinutes: integer("pomodoro_minutes").default(0),
  googleCalendarEventId: text("google_calendar_event_id"),
  googleCalendarId: text("google_calendar_id"),
  createdAt: text("created_at"),
  updatedAt: text("updated_at"),
});

export const insertPersonalTodoSchema = createInsertSchema(personalTodos).omit({ id: true, createdAt: true });
export type InsertPersonalTodo = z.infer<typeof insertPersonalTodoSchema>;
export type PersonalTodo = typeof personalTodos.$inferSelect;

// User Alarm Settings table - for personal alarm/briefing configuration
export const userAlarmSettings = sqliteTable("user_alarm_settings", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  alarmTime: text("alarm_time").notNull().default("07:00"),
  selectedDays: text("selected_days", { mode: "json" }).$type<string[]>().default("[]"),
  useOpenAI: integer("use_openai", { mode: "boolean" }).default(false),
  openAIKey: text("openai_key"),
  selectedVoice: text("selected_voice").default("default"),
  createdAt: text("created_at"),
  updatedAt: text("updated_at"),
});

export const insertUserAlarmSettingsSchema = createInsertSchema(userAlarmSettings).omit({ id: true, createdAt: true });
export type InsertUserAlarmSettings = z.infer<typeof insertUserAlarmSettingsSchema>;
export type UserAlarmSettings = typeof userAlarmSettings.$inferSelect;


// Subtasks table - for breaking down todos into smaller steps
export const subtasks = sqliteTable("subtasks", {
  id: text("id").primaryKey(),
  todoId: text("todo_id").notNull().references(() => personalTodos.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  completed: integer("completed", { mode: "boolean" }).notNull().default(false),
  order: integer("order").default(0),
  createdAt: text("created_at"),
});

export const insertSubtaskSchema = createInsertSchema(subtasks).omit({ id: true, createdAt: true });
export type InsertSubtask = z.infer<typeof insertSubtaskSchema>;
export type Subtask = typeof subtasks.$inferSelect;

// Task Comments table - for discussions on tasks
export const taskComments = sqliteTable("task_comments", {
  id: text("id").primaryKey(),
  taskId: text("task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  mentions: text("mentions").default("[]"),
  createdAt: text("created_at"),
});

export const insertTaskCommentSchema = createInsertSchema(taskComments).omit({ id: true, createdAt: true });
export type InsertTaskComment = z.infer<typeof insertTaskCommentSchema>;
export type TaskComment = typeof taskComments.$inferSelect;

// Activity Feed table - tracks team activities
export const activityFeed = sqliteTable("activity_feed", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id"),
  entityTitle: text("entity_title"),
  details: text("details"),
  createdAt: text("created_at"),
});

export const insertActivityFeedSchema = createInsertSchema(activityFeed).omit({ id: true, createdAt: true });
export type InsertActivityFeed = z.infer<typeof insertActivityFeedSchema>;
export type ActivityFeed = typeof activityFeed.$inferSelect;

// Activity action types
export const ACTIVITY_ACTIONS = ['created', 'updated', 'deleted', 'completed', 'commented', 'assigned', 'mentioned'] as const;
export type ActivityAction = typeof ACTIVITY_ACTIONS[number];

// App Settings table - for application configuration
export const appSettings = sqliteTable("app_settings", {
  id: text("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value"),
  createdAt: text("created_at"),
  updatedAt: text("updated_at"),
});

export const insertAppSettingsSchema = createInsertSchema(appSettings).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertAppSettings = z.infer<typeof insertAppSettingsSchema>;
export type AppSettings = typeof appSettings.$inferSelect;

// Project Comments table - for discussions on projects
export const projectComments = sqliteTable("project_comments", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  mentions: text("mentions").default("[]"),
  createdAt: text("created_at"),
});

export const insertProjectCommentSchema = createInsertSchema(projectComments).omit({ id: true, createdAt: true });
export type InsertProjectComment = z.infer<typeof insertProjectCommentSchema>;
export type ProjectComment = typeof projectComments.$inferSelect;

// Shared Links table - for external sharing
export const sharedLinks = sqliteTable("shared_links", {
  id: text("id").primaryKey(),
  resourceType: text("resource_type").notNull(),
  resourceId: text("resource_id").notNull(),
  token: text("token").notNull().unique(),
  permission: text("permission").notNull().default("view"),
  password: text("password"),
  expiresAt: text("expires_at"),
  createdBy: text("created_by").references(() => users.id),
  createdAt: text("created_at"),
});

export const insertSharedLinkSchema = createInsertSchema(sharedLinks).omit({ id: true, createdAt: true });
export type InsertSharedLink = z.infer<typeof insertSharedLinkSchema>;
export type SharedLink = typeof sharedLinks.$inferSelect;

// Team Availability table - for team calendar
export const teamAvailability = sqliteTable("team_availability", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  availabilityType: text("availability_type").notNull().default("available"),
  title: text("title"),
  description: text("description"),
  createdAt: text("created_at"),
});

export const insertTeamAvailabilitySchema = createInsertSchema(teamAvailability).omit({ id: true, createdAt: true });
export type InsertTeamAvailability = z.infer<typeof insertTeamAvailabilitySchema>;
export type TeamAvailability = typeof teamAvailability.$inferSelect;

// Notifications table - for @mentions and other notifications
export const notifications = sqliteTable("notifications", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  resourceType: text("resource_type"),
  resourceId: text("resource_id"),
  fromUserId: text("from_user_id").references(() => users.id),
  read: integer("read", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at"),
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, createdAt: true });
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

// Availability types
export const AVAILABILITY_TYPES = ['available', 'busy', 'away', 'vacation', 'meeting'] as const;
export type AvailabilityType = typeof AVAILABILITY_TYPES[number];

// Emails Cache table


// Notification types
export const NOTIFICATION_TYPES = ['mention', 'comment', 'assignment', 'deadline', 'share'] as const;
export type NotificationType = typeof NOTIFICATION_TYPES[number];

// Todo Templates table - reusable task templates
export const todoTemplates = sqliteTable("todo_templates", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  priority: text("priority").notNull().default("medium"),
  category: text("category"),
  estimatedMinutes: integer("estimated_minutes"),
  recurrenceType: text("recurrence_type"),
  reminderBefore: integer("reminder_before"),
  userId: text("user_id").references(() => users.id),
  createdAt: text("created_at"),
});

export const insertTodoTemplateSchema = createInsertSchema(todoTemplates).omit({ id: true, createdAt: true });
export type InsertTodoTemplate = z.infer<typeof insertTodoTemplateSchema>;
export type TodoTemplate = typeof todoTemplates.$inferSelect;

// Time Entries table - tracks time spent on tasks/projects
export const timeEntries = sqliteTable("time_entries", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id),
  todoId: text("todo_id").references(() => personalTodos.id, { onDelete: "cascade" }),
  projectId: text("project_id").references(() => projects.id, { onDelete: "cascade" }),
  taskId: text("task_id").references(() => tasks.id, { onDelete: "cascade" }),
  description: text("description"),
  startTime: text("start_time").notNull(),
  endTime: text("end_time"),
  durationMinutes: integer("duration_minutes"),
  billable: integer("billable").default(0),
  createdAt: text("created_at"),
});

export const insertTimeEntrySchema = createInsertSchema(timeEntries).omit({ id: true, createdAt: true });
export type InsertTimeEntry = z.infer<typeof insertTimeEntrySchema>;
export type TimeEntry = typeof timeEntries.$inferSelect;

// Pulse Keep Notes table - personal notes like Google Keep
export const keepNotes = sqliteTable("keep_notes", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title"),
  content: text("content"),
  color: text("color").default("default"),
  pinned: integer("pinned", { mode: "boolean" }).notNull().default(false),
  archived: integer("archived", { mode: "boolean" }).notNull().default(false),
  deleted: integer("deleted", { mode: "boolean" }).notNull().default(false),
  deletedAt: text("deleted_at"),
  labels: text("labels", { mode: "json" }).$type<string[]>().default("[]"),
  checklistItems: text("checklist_items", { mode: "json" }).$type<any[]>().default("[]"),
  reminder: text("reminder"),
  imageUrl: text("image_url"),
  orderIndex: integer("order_index").default(0),
  createdAt: text("created_at"),
  updatedAt: text("updated_at"),
});

export const insertKeepNoteSchema = createInsertSchema(keepNotes).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertKeepNote = z.infer<typeof insertKeepNoteSchema>;
export type KeepNote = typeof keepNotes.$inferSelect;

// Keep Labels table - for organizing notes
export const keepLabels = sqliteTable("keep_labels", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  color: text("color").default("gray"),
  createdAt: text("created_at"),
});

export const insertKeepLabelSchema = createInsertSchema(keepLabels).omit({ id: true, createdAt: true });
export type InsertKeepLabel = z.infer<typeof insertKeepLabelSchema>;
export type KeepLabel = typeof keepLabels.$inferSelect;

// Keep Note Templates
export const keepNoteTemplates = sqliteTable("keep_note_templates", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  title: text("title"),
  content: text("content"),
  color: text("color").default("default"),
  isChecklist: integer("is_checklist").notNull().default(0),
  checklistItems: text("checklist_items"),
  createdAt: text("created_at"),
});

export const insertKeepNoteTemplateSchema = createInsertSchema(keepNoteTemplates).omit({ id: true, createdAt: true });
export type InsertKeepNoteTemplate = z.infer<typeof insertKeepNoteTemplateSchema>;
export type KeepNoteTemplate = typeof keepNoteTemplates.$inferSelect;

// Keep note colors
export const KEEP_NOTE_COLORS = [
  'default', 'red', 'orange', 'yellow', 'green', 'teal',
  'blue', 'purple', 'pink', 'brown', 'gray'
] as const;
export type KeepNoteColor = typeof KEEP_NOTE_COLORS[number];

// Whiteboards table
export const whiteboards = sqliteTable("whiteboards", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  ownerId: text("owner_id").references(() => users.id),
  projectId: text("project_id").references(() => projects.id),
  isPublic: integer("is_public").notNull().default(0),
  backgroundColor: text("background_color").default("#ffffff"),
  gridEnabled: integer("grid_enabled").default(1),
  collaborators: text("collaborators").default("[]"),
  createdAt: text("created_at"),
  updatedAt: text("updated_at"),
});

export const insertWhiteboardSchema = createInsertSchema(whiteboards).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertWhiteboard = z.infer<typeof insertWhiteboardSchema>;
export type Whiteboard = typeof whiteboards.$inferSelect;

// Whiteboard elements table
export const whiteboardElements = sqliteTable("whiteboard_elements", {
  id: text("id").primaryKey(),
  whiteboardId: text("whiteboard_id").notNull().references(() => whiteboards.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // 'sticky', 'text', 'shape', 'line', 'image', 'drawing'
  x: integer("x").notNull().default(0),
  y: integer("y").notNull().default(0),
  width: integer("width").default(200),
  height: integer("height").default(200),
  rotation: integer("rotation").default(0),
  content: text("content"),
  color: text("color").default("#fef08a"),
  fontSize: integer("font_size").default(14),
  fontWeight: text("font_weight").default("normal"),
  borderColor: text("border_color"),
  borderWidth: integer("border_width").default(0),
  shapeType: text("shape_type"), // 'rectangle', 'circle', 'triangle', 'arrow'
  points: text("points"), // JSON string for lines/drawings
  zIndex: integer("z_index").default(0),
  locked: integer("locked").default(0),
  createdBy: text("created_by").references(() => users.id),
  createdAt: text("created_at"),
  updatedAt: text("updated_at"),
});

export const insertWhiteboardElementSchema = createInsertSchema(whiteboardElements).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertWhiteboardElement = z.infer<typeof insertWhiteboardElementSchema>;
export type WhiteboardElement = typeof whiteboardElements.$inferSelect;

// User Email Configurations table - per-user email account settings
export const userEmailConfigs = sqliteTable("user_email_configs", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  emailAddress: text("email_address").notNull(),
  imapHost: text("imap_host").notNull(),
  imapPort: integer("imap_port").notNull().default(993),
  imapSecure: integer("imap_secure", { mode: "boolean" }).notNull().default(true),
  smtpHost: text("smtp_host").notNull(),
  smtpPort: integer("smtp_port").notNull().default(465),
  smtpSecure: integer("smtp_secure", { mode: "boolean" }).notNull().default(true),
  password: text("password").notNull(),
  displayName: text("display_name"),
  signature: text("signature"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  lastSyncAt: text("last_sync_at"),
  createdAt: text("created_at"),
  updatedAt: text("updated_at"),
});

export const insertUserEmailConfigSchema = createInsertSchema(userEmailConfigs).omit({ id: true, userId: true, createdAt: true, updatedAt: true, lastSyncAt: true });
export type InsertUserEmailConfig = z.infer<typeof insertUserEmailConfigSchema>;
export type UserEmailConfig = typeof userEmailConfigs.$inferSelect;

// User WhatsApp Configurations table - per-user WhatsApp session
export const userWhatsappConfigs = sqliteTable("user_whatsapp_configs", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  sessionData: text("session_data"),
  phoneNumber: text("phone_number"),
  isConnected: integer("is_connected").notNull().default(0),
  lastConnectedAt: text("last_connected_at"),
  createdAt: text("created_at"),
  updatedAt: text("updated_at"),
});

export const insertUserWhatsappConfigSchema = createInsertSchema(userWhatsappConfigs).omit({ id: true, createdAt: true, updatedAt: true, lastConnectedAt: true });
export type InsertUserWhatsappConfig = z.infer<typeof insertUserWhatsappConfigSchema>;
export type UserWhatsappConfig = typeof userWhatsappConfigs.$inferSelect;

// WhatsApp Contacts
export const whatsappContacts = sqliteTable("whatsapp_contacts", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  phoneNumber: text("phone_number").notNull(),
  avatar: text("avatar"),
  isGroup: integer("is_group").default(0),
  unreadCount: integer("unread_count").default(0),
  lastMessageTime: text("last_message_time"),
  lastMessagePreview: text("last_message_preview"),
  isOnline: integer("is_online").default(0),
  createdAt: text("created_at"),
  updatedAt: text("updated_at"),
});

export const insertWhatsappContactSchema = createInsertSchema(whatsappContacts).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertWhatsappContact = z.infer<typeof insertWhatsappContactSchema>;
export type WhatsappContact = typeof whatsappContacts.$inferSelect;

// WhatsApp Messages
export const whatsappMessages = sqliteTable("whatsapp_messages", {
  id: text("id").primaryKey(),
  contactId: text("contact_id").notNull().references(() => whatsappContacts.id, { onDelete: "cascade" }),
  content: text("content"),
  type: text("type").default("text"), // text, image, video, audio, document
  mediaUrl: text("media_url"),
  direction: text("direction").notNull(), // inbound, outbound
  status: text("status").default("sent"), // sent, delivered, read
  timestamp: text("timestamp").notNull(),
  whatsappId: text("whatsapp_id"), // ID from WhatsApp
  isDeleted: integer("is_deleted").default(0),
});

export const insertWhatsappMessageSchema = createInsertSchema(whatsappMessages).omit({ id: true });
export type InsertWhatsappMessage = z.infer<typeof insertWhatsappMessageSchema>;
export type WhatsappMessage = typeof whatsappMessages.$inferSelect;

// Anagrafica - Stati disponibili
export const ANAGRAFICA_STATI = ["attivo", "sospeso", "cessato"] as const;
export type AnagraficaStato = typeof ANAGRAFICA_STATI[number];

// Anagrafica - Personale (Staff/Employees)
export const anagraficaPersonale = sqliteTable("anagrafica_personale", {
  id: text("id").primaryKey(),
  nome: text("nome").notNull(),
  cognome: text("cognome").notNull(),
  codiceFiscale: text("codice_fiscale"),
  dataNascita: text("data_nascita"),
  luogoNascita: text("luogo_nascita"),
  indirizzo: text("indirizzo"),
  citta: text("citta"),
  cap: text("cap"),
  provincia: text("provincia"),
  telefono: text("telefono"),
  cellulare: text("cellulare"),
  email: text("email"),
  emailPrivata: text("email_privata"),
  emailCedolini: text("email_cedolini"),
  ruolo: text("ruolo"),
  reparto: text("reparto"),
  dataAssunzione: text("data_assunzione"),
  dataFinePeriodoProva: text("data_fine_periodo_prova"),
  emailBenvenutoInviata: integer("email_benvenuto_inviata").default(0),
  tipoContratto: text("tipo_contratto"),
  stipendio: text("stipendio"),
  iban: text("iban"),
  banca: text("banca"),
  abi: text("abi"),
  cab: text("cab"),
  sitoBanca: text("sito_banca"),
  // Dati cedolino
  livelloContrattuale: text("livello_contrattuale"),
  ccnl: text("ccnl"),
  oreSettimanali: text("ore_settimanali"),
  percentualePartTime: text("percentuale_part_time"),
  ralAnnua: text("ral_annua"),
  superminimo: text("superminimo"),
  indennitaMensile: text("indennita_mensile"),
  buoniPasto: text("buoni_pasto"),
  familariACarico: integer("familiari_a_carico").default(0),
  coniugeACarico: integer("coniuge_a_carico").default(0),
  figlioDisabile: integer("figlio_disabile").default(0),
  aliquotaIrpef: text("aliquota_irpef"),
  contributiInps: text("contributi_inps"),
  tfr: text("tfr"),
  fondiPensione: text("fondi_pensione"),
  note: text("note"),
  stato: text("stato").notNull().default("attivo"),
  tags: text("tags"),
  attivo: integer("attivo").notNull().default(1),
  // Credenziali portale personale
  portalUsername: text("portal_username"),
  portalPasswordHash: text("portal_password_hash"),
  portalEnabled: integer("portal_enabled").default(0),
  portalLastAccess: text("portal_last_access"),
  portalToken: text("portal_token"),
  // Credenziali biometriche (WebAuthn)
  biometricCredentialId: text("biometric_credential_id"),
  biometricPublicKey: text("biometric_public_key"),
  biometricCounter: integer("biometric_counter").default(0),
  biometricEnabled: integer("biometric_enabled").default(0),
  responsabileId: text("responsabile_id"),
  createdAt: text("created_at"),
  updatedAt: text("updated_at"),
});

export const insertAnagraficaPersonaleSchema = createInsertSchema(anagraficaPersonale).omit({ id: true, createdAt: true, updatedAt: true, portalPasswordHash: true, portalLastAccess: true });
export type InsertAnagraficaPersonale = z.infer<typeof insertAnagraficaPersonaleSchema>;
export type AnagraficaPersonale = typeof anagraficaPersonale.$inferSelect;

// Notifiche HR (HR Notifications)
export const TIPO_NOTIFICA_HR = ["benvenuto", "periodo_prova", "compleanno", "scadenza_contratto", "scadenza_documento"] as const;
export type TipoNotificaHR = typeof TIPO_NOTIFICA_HR[number];

export const notificheHR = sqliteTable("notifiche_hr", {
  id: text("id").primaryKey(),
  personaleId: text("personale_id").notNull().references(() => anagraficaPersonale.id, { onDelete: "cascade" }),
  tipo: text("tipo").notNull(), // benvenuto, periodo_prova, compleanno, scadenza_contratto
  titolo: text("titolo").notNull(),
  messaggio: text("messaggio"),
  dataScadenza: text("data_scadenza"), // YYYY-MM-DD
  letta: integer("letta").default(0),
  emailInviata: integer("email_inviata").default(0),
  dataEmailInviata: text("data_email_inviata"),
  createdAt: text("created_at"),
});

export const insertNotificaHRSchema = createInsertSchema(notificheHR).omit({ id: true, createdAt: true });
export type InsertNotificaHR = z.infer<typeof insertNotificaHRSchema>;
export type NotificaHR = typeof notificheHR.$inferSelect;

// Cedolini (Payslips)
export const cedolini = sqliteTable("cedolini", {
  id: text("id").primaryKey(),
  personaleId: text("personale_id").notNull().references(() => anagraficaPersonale.id, { onDelete: "cascade" }),
  mese: integer("mese").notNull(),
  anno: integer("anno").notNull(),
  filename: text("filename").notNull(),
  filepath: text("filepath").notNull(),
  filesize: integer("filesize"),
  mimetype: text("mimetype"),
  stipendioLordo: text("stipendio_lordo"),
  stipendioNetto: text("stipendio_netto"),
  contributiInps: text("contributi_inps"),
  irpef: text("irpef"),
  bonus: text("bonus"),
  straordinari: text("straordinari"),
  note: text("note"),
  createdAt: text("created_at"),
});

export const insertCedolinoSchema = createInsertSchema(cedolini).omit({ id: true, createdAt: true });
export type InsertCedolino = z.infer<typeof insertCedolinoSchema>;
export type Cedolino = typeof cedolini.$inferSelect;

// Timbrature (Time Clock Entries)
export const TIPO_TIMBRATURA = ["entrata", "uscita"] as const;
export type TipoTimbratura = typeof TIPO_TIMBRATURA[number];

export const timbrature = sqliteTable("timbrature", {
  id: text("id").primaryKey(),
  personaleId: text("personale_id").notNull().references(() => anagraficaPersonale.id, { onDelete: "cascade" }),
  tipo: text("tipo").notNull(), // entrata, uscita
  dataOra: text("data_ora").notNull(),
  latitudine: text("latitudine"),
  longitudine: text("longitudine"),
  indirizzo: text("indirizzo"),
  dispositivo: text("dispositivo"),
  note: text("note"),
  createdAt: text("created_at"),
});

export const insertTimbraturaSchema = createInsertSchema(timbrature).omit({ id: true, createdAt: true });
export type InsertTimbratura = z.infer<typeof insertTimbraturaSchema>;
export type Timbratura = typeof timbrature.$inferSelect;

// Turni (Work Shifts)
export const turni = sqliteTable("turni", {
  id: text("id").primaryKey(),
  personaleId: text("personale_id").notNull().references(() => anagraficaPersonale.id, { onDelete: "cascade" }),
  data: text("data").notNull(), // YYYY-MM-DD
  oraInizio: text("ora_inizio").notNull(), // HH:MM
  oraFine: text("ora_fine").notNull(), // HH:MM
  pausa: integer("pausa").default(0), // minuti di pausa
  tipologia: text("tipologia").default("ordinario"), // ordinario, notturno, festivo
  note: text("note"),
  createdAt: text("created_at"),
  updatedAt: text("updated_at"),
});

export const insertTurnoSchema = createInsertSchema(turni).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertTurno = z.infer<typeof insertTurnoSchema>;
export type Turno = typeof turni.$inferSelect;

// Turni Predefiniti (Shift Templates)
export const turniPredefiniti = sqliteTable("turni_predefiniti", {
  id: text("id").primaryKey(),
  nome: text("nome").notNull(),
  oraInizio: text("ora_inizio").notNull(),
  oraFine: text("ora_fine").notNull(),
  pausa: integer("pausa").default(60),
  colore: text("colore").default("#3b82f6"),
  attivo: integer("attivo", { mode: "boolean" }).default(true),
  ordine: integer("ordine").default(0),
  createdAt: text("created_at"),
});

export const insertTurnoPredefinitaSchema = createInsertSchema(turniPredefiniti).omit({ id: true, createdAt: true });
export type InsertTurnoPredefinita = z.infer<typeof insertTurnoPredefinitaSchema>;
export type TurnoPredefinita = typeof turniPredefiniti.$inferSelect;

// Straordinari (Overtime Requests)
export const STATO_STRAORDINARIO = ["richiesto", "approvato", "rifiutato"] as const;
export type StatoStraordinario = typeof STATO_STRAORDINARIO[number];

export const straordinari = sqliteTable("straordinari", {
  id: text("id").primaryKey(),
  personaleId: text("personale_id").notNull().references(() => anagraficaPersonale.id, { onDelete: "cascade" }),
  data: text("data").notNull(), // YYYY-MM-DD
  ore: text("ore").notNull(), // numero ore (es. "2.5")
  motivo: text("motivo"),
  stato: text("stato").notNull().default("richiesto"), // richiesto, approvato, rifiutato
  approvatoDa: text("approvato_da").references(() => users.id),
  dataApprovazione: text("data_approvazione"),
  noteApprovazione: text("note_approvazione"),
  createdAt: text("created_at"),
  updatedAt: text("updated_at"),
});

export const insertStraordinarioSchema = createInsertSchema(straordinari).omit({ id: true, createdAt: true, updatedAt: true, approvatoDa: true, dataApprovazione: true, noteApprovazione: true });
export type InsertStraordinario = z.infer<typeof insertStraordinarioSchema>;
export type Straordinario = typeof straordinari.$inferSelect;

// Ferie e Permessi (Leave/Time Off Requests)
export const TIPO_ASSENZA = ["ferie", "permesso", "malattia", "maternita", "paternita", "lutto", "altro"] as const;
export type TipoAssenza = typeof TIPO_ASSENZA[number];

export const STATO_ASSENZA = ["richiesta", "approvata", "rifiutata", "annullata"] as const;
export type StatoAssenza = typeof STATO_ASSENZA[number];

export const richiesteAssenza = sqliteTable("richieste_assenza", {
  id: text("id").primaryKey(),
  personaleId: text("personale_id").notNull().references(() => anagraficaPersonale.id, { onDelete: "cascade" }),
  tipo: text("tipo").notNull().default("ferie"), // ferie, permesso, malattia, maternita, paternita, lutto, altro
  dataInizio: text("data_inizio").notNull(), // YYYY-MM-DD
  dataFine: text("data_fine").notNull(), // YYYY-MM-DD
  giorniTotali: text("giorni_totali").notNull().default("1"), // numero giorni richiesti
  oreTotali: text("ore_totali"), // per permessi orari
  motivo: text("motivo"),
  stato: text("stato").notNull().default("richiesta"), // richiesta, approvata, rifiutata, annullata
  approvatoDa: text("approvato_da").references(() => users.id),
  dataApprovazione: text("data_approvazione"),
  noteApprovazione: text("note_approvazione"),
  allegato: text("allegato"), // path certificato medico o altro
  createdAt: text("created_at"),
  updatedAt: text("updated_at"),
});

export const insertRichiestaAssenzaSchema = createInsertSchema(richiesteAssenza).omit({
  id: true, createdAt: true, updatedAt: true, approvatoDa: true, dataApprovazione: true, noteApprovazione: true
});
export type InsertRichiestaAssenza = z.infer<typeof insertRichiestaAssenzaSchema>;
export type RichiestaAssenza = typeof richiesteAssenza.$inferSelect;

// Saldi Ferie/Permessi per anno
export const saldiFeriePermessi = sqliteTable("saldi_ferie_permessi", {
  id: text("id").primaryKey(),
  personaleId: text("personale_id").notNull().references(() => anagraficaPersonale.id, { onDelete: "cascade" }),
  anno: integer("anno").notNull(),
  ferieTotali: text("ferie_totali").notNull().default("26"), // giorni totali
  ferieGodute: text("ferie_godute").notNull().default("0"),
  ferieResidueAnnoPrec: text("ferie_residue_anno_prec").default("0"),
  permessiTotali: text("permessi_totali").notNull().default("32"), // ore ROL
  permessiGoduti: text("permessi_goduti").notNull().default("0"),
  malattiaGiorni: text("malattia_giorni").default("0"),
  createdAt: text("created_at"),
  updatedAt: text("updated_at"),
});

export const insertSaldoFeriePermessiSchema = createInsertSchema(saldiFeriePermessi).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSaldoFeriePermessi = z.infer<typeof insertSaldoFeriePermessiSchema>;
export type SaldoFeriePermessi = typeof saldiFeriePermessi.$inferSelect;

// Scadenzario HR (Deadlines/Reminders)
export const TIPO_SCADENZA_HR = ["visita_medica", "contratto", "formazione", "documento", "certificazione", "altro"] as const;
export type TipoScadenzaHR = typeof TIPO_SCADENZA_HR[number];

export const scadenzeHr = sqliteTable("scadenze_hr", {
  id: text("id").primaryKey(),
  personaleId: text("personale_id").notNull().references(() => anagraficaPersonale.id, { onDelete: "cascade" }),
  tipo: text("tipo").notNull().default("altro"), // visita_medica, contratto, formazione, documento, certificazione, altro
  titolo: text("titolo").notNull(),
  descrizione: text("descrizione"),
  dataScadenza: text("data_scadenza").notNull(), // YYYY-MM-DD
  dataAvviso: text("data_avviso"), // YYYY-MM-DD - quando iniziare ad avvisare
  giorniAnticipo: integer("giorni_anticipo").default(30), // giorni prima della scadenza per avvisare
  priorita: text("priorita").default("normale"), // bassa, normale, alta, urgente
  completata: integer("completata").default(0),
  dataCompletamento: text("data_completamento"),
  allegato: text("allegato"), // path file allegato
  note: text("note"),
  createdAt: text("created_at"),
  updatedAt: text("updated_at"),
});

export const insertScadenzaHrSchema = createInsertSchema(scadenzeHr).omit({ id: true, createdAt: true, updatedAt: true, dataCompletamento: true });
export type InsertScadenzaHr = z.infer<typeof insertScadenzaHrSchema>;
export type ScadenzaHr = typeof scadenzeHr.$inferSelect;

// Anagrafica - Clienti (Customers)
export const anagraficaClienti = sqliteTable("anagrafica_clienti", {
  id: text("id").primaryKey(),
  ragioneSociale: text("ragione_sociale").notNull(),
  partitaIva: text("partita_iva"),
  codiceFiscale: text("codice_fiscale"),
  indirizzo: text("indirizzo"),
  citta: text("citta"),
  cap: text("cap"),
  provincia: text("provincia"),
  nazione: text("nazione").default("Italia"),
  telefono: text("telefono"),
  cellulare: text("cellulare"),
  email: text("email"),
  pec: text("pec"),
  sdi: text("sdi"),
  website: text("website"),
  referente: text("referente"),
  categoria: text("categoria"),
  condizioni_pagamento: text("condizioni_pagamento"),
  sconto: text("sconto"),
  note: text("note"),
  stato: text("stato").notNull().default("attivo"),
  tags: text("tags"),
  attivo: integer("attivo").notNull().default(1),
  stessoIndirizzoSpedizione: integer("stesso_indirizzo_spedizione").default(1),
  // Campi avanzati gestione clienti
  categoriaCliente: text("categoria_cliente").default("standard"), // vip, standard, prospect, inattivo
  settoreMerceologico: text("settore_merceologico"),
  fatturatoTotale: text("fatturato_totale").default("0"),
  fatturatoAnnoCorrente: text("fatturato_anno_corrente").default("0"),
  numeroOrdini: integer("numero_ordini").default(0),
  ultimoOrdine: text("ultimo_ordine"),
  dataUltimoContatto: text("data_ultimo_contatto"),
  giorniInattivita: integer("giorni_inattivita").default(0),
  limiteCredito: text("limite_credito"),
  esposizioneCredito: text("esposizione_credito").default("0"),
  affidabilita: text("affidabilita").default("buona"), // ottima, buona, media, scarsa, critica
  origineCliente: text("origine_cliente"), // web, fiera, passaparola, social, altro
  agente: text("agente"),
  notePrivate: text("note_private"),
  documentiCount: integer("documenti_count").default(0),
  latitudine: text("latitudine"),
  longitudine: text("longitudine"),
  // Credenziali portale cliente
  portaleAbilitato: integer("portale_abilitato").default(0),
  portaleUsername: text("portale_username"),
  portalePassword: text("portale_password"),
  createdAt: text("created_at"),
  updatedAt: text("updated_at"),
});

export const insertAnagraficaClientiSchema = createInsertSchema(anagraficaClienti).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertAnagraficaClienti = z.infer<typeof insertAnagraficaClientiSchema>;
export type AnagraficaClienti = typeof anagraficaClienti.$inferSelect;

// Referenti Clienti - Contatti multipli per azienda
export const referentiClienti = sqliteTable("referenti_clienti", {
  id: text("id").primaryKey(),
  clienteId: text("cliente_id").notNull().references(() => anagraficaClienti.id, { onDelete: "cascade" }),
  nome: text("nome").notNull(),
  cognome: text("cognome"),
  ruolo: text("ruolo"),
  dipartimento: text("dipartimento"),
  email: text("email"),
  telefonoFisso: text("telefono_fisso"),
  cellulare: text("cellulare"),
  linkedIn: text("linkedin"),
  principale: integer("principale").default(0),
  riceveNewsletter: integer("riceve_newsletter").default(0),
  riceveOfferte: integer("riceve_offerte").default(1),
  note: text("note"),
  attivo: integer("attivo").default(1),
  createdAt: text("created_at"),
  updatedAt: text("updated_at"),
});

export const insertReferenteClienteSchema = createInsertSchema(referentiClienti).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertReferenteCliente = z.infer<typeof insertReferenteClienteSchema>;
export type ReferenteCliente = typeof referentiClienti.$inferSelect;

// Indirizzi Spedizione Clienti - Magazzini/destinazioni multiple per cliente
export const indirizziSpedizioneClienti = sqliteTable("indirizzi_spedizione_clienti", {
  id: text("id").primaryKey(),
  clienteId: text("cliente_id").notNull().references(() => anagraficaClienti.id, { onDelete: "cascade" }),
  nome: text("nome").notNull(), // es: "Magazzino Nord", "Sede Operativa", "Deposito Milano"
  ragioneSociale: text("ragione_sociale"), // se diversa dalla sede legale
  indirizzo: text("indirizzo").notNull(),
  cap: text("cap"),
  citta: text("citta"),
  provincia: text("provincia"),
  nazione: text("nazione").default("Italia"),
  telefono: text("telefono"),
  email: text("email"),
  referente: text("referente"), // persona di riferimento per la consegna
  // Orari di apertura per ogni giorno (formato JSON: {"apertura": "08:00", "chiusura": "18:00", "chiuso": false})
  orariLunedi: text("orari_lunedi"),
  orariMartedi: text("orari_martedi"),
  orariMercoledi: text("orari_mercoledi"),
  orariGiovedi: text("orari_giovedi"),
  orariVenerdi: text("orari_venerdi"),
  orariSabato: text("orari_sabato"),
  orariDomenica: text("orari_domenica"),
  orariConsegna: text("orari_consegna"), // note testuali (es: "solo mattina", "previo appuntamento")
  noteConsegna: text("note_consegna"), // istruzioni speciali per la consegna
  googlePlaceId: text("google_place_id"), // ID Google Places per recupero orari
  principale: integer("principale").default(0), // indirizzo di spedizione predefinito
  attivo: integer("attivo").default(1),
  createdAt: text("created_at"),
  updatedAt: text("updated_at"),
});

export const insertIndirizzoSpedizioneClienteSchema = createInsertSchema(indirizziSpedizioneClienti).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertIndirizzoSpedizioneCliente = z.infer<typeof insertIndirizzoSpedizioneClienteSchema>;
export type IndirizzoSpedizioneCliente = typeof indirizziSpedizioneClienti.$inferSelect;

// Anagrafica - Fornitori (Suppliers)
export const anagraficaFornitori = sqliteTable("anagrafica_fornitori", {
  id: text("id").primaryKey(),
  ragioneSociale: text("ragione_sociale").notNull(),
  partitaIva: text("partita_iva"),
  codiceFiscale: text("codice_fiscale"),
  indirizzo: text("indirizzo"),
  citta: text("citta"),
  cap: text("cap"),
  provincia: text("provincia"),
  nazione: text("nazione").default("Italia"),
  telefono: text("telefono"),
  cellulare: text("cellulare"),
  email: text("email"),
  pec: text("pec"),
  sdi: text("sdi"),
  website: text("website"),
  referente: text("referente"),
  categoria: text("categoria"),
  condizioni_pagamento: text("condizioni_pagamento"),
  iban: text("iban"),
  note: text("note"),
  stato: text("stato").notNull().default("attivo"),
  tags: text("tags"),
  attivo: integer("attivo").notNull().default(1),
  // Credenziali portale fornitore
  portaleAbilitato: integer("portale_abilitato").default(0),
  portaleUsername: text("portale_username"),
  portalePassword: text("portale_password"),
  createdAt: text("created_at"),
  updatedAt: text("updated_at"),
});

export const insertAnagraficaFornitoriSchema = createInsertSchema(anagraficaFornitori).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertAnagraficaFornitori = z.infer<typeof insertAnagraficaFornitoriSchema>;
export type AnagraficaFornitori = typeof anagraficaFornitori.$inferSelect;

// Promemoria Anagrafica - Reminder tags per clienti e fornitori
export const promemoriaAnagrafica = sqliteTable("promemoria_anagrafica", {
  id: text("id").primaryKey(),
  tipo: text("tipo").notNull(), // "cliente" o "fornitore"
  entitaId: text("entita_id").notNull(), // ID del cliente o fornitore
  titolo: text("titolo").notNull(),
  descrizione: text("descrizione"),
  dataScadenza: text("data_scadenza"), // data di scadenza promemoria
  priorita: text("priorita").default("normale"), // bassa, normale, alta, urgente
  stato: text("stato").default("attivo"), // attivo, completato, annullato
  colore: text("colore").default("#3B82F6"), // colore del tag
  notificaEmail: integer("notifica_email").default(0),
  notificato: integer("notificato").default(0), // se è stata inviata notifica
  completatoAt: text("completato_at"),
  completatoDa: text("completato_da").references(() => users.id),
  createdBy: text("created_by").references(() => users.id),
  createdAt: text("created_at"),
  updatedAt: text("updated_at"),
});

export const insertPromemoriaAnagraficaSchema = createInsertSchema(promemoriaAnagrafica).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPromemoriaAnagrafica = z.infer<typeof insertPromemoriaAnagraficaSchema>;
export type PromemoriaAnagrafica = typeof promemoriaAnagrafica.$inferSelect;

// Database Backups
export const backups = sqliteTable("backups", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  status: text("status").notNull().default("pending"), // pending, in_progress, completed, failed
  type: text("type").notNull().default("manual"), // manual, scheduled
  size: text("size"), // file size in human readable format
  filePath: text("file_path"),
  tables: text("tables"), // JSON array of tables included
  createdBy: text("created_by").references(() => users.id),
  createdAt: text("created_at"),
  completedAt: text("completed_at"),
  errorMessage: text("error_message"),
});

export const insertBackupSchema = createInsertSchema(backups).omit({ id: true, createdAt: true });
export type InsertBackup = z.infer<typeof insertBackupSchema>;
export type Backup = typeof backups.$inferSelect;

// Backup Schedules
export const backupSchedules = sqliteTable("backup_schedules", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  frequency: text("frequency").notNull(), // daily, weekly, monthly
  dayOfWeek: integer("day_of_week"), // 0-6 for weekly (0 = Sunday)
  dayOfMonth: integer("day_of_month"), // 1-31 for monthly
  hour: integer("hour").notNull().default(2), // Hour of day (0-23)
  minute: integer("minute").notNull().default(0), // Minute (0-59)
  enabled: integer("enabled").notNull().default(1),
  retentionDays: integer("retention_days").notNull().default(30), // How many days to keep backups
  lastRun: text("last_run"),
  nextRun: text("next_run"),
  createdBy: text("created_by").references(() => users.id),
  createdAt: text("created_at"),
  updatedAt: text("updated_at"),
});

export const insertBackupScheduleSchema = createInsertSchema(backupSchedules).omit({ id: true, createdAt: true, updatedAt: true, nextRun: true, lastRun: true });
export type InsertBackupSchedule = z.infer<typeof insertBackupScheduleSchema>;
export type BackupSchedule = typeof backupSchedules.$inferSelect;

// =====================
// FINANZA PROFESSIONALE
// =====================

// Conti Bancari/Cassa
export const financeAccounts = sqliteTable("finance_accounts", {
  id: text("id").primaryKey(),
  nome: text("nome").notNull(),
  tipo: text("tipo").notNull().default("banca"), // banca, cassa, carta_credito, paypal, altro
  iban: text("iban"),
  bic: text("bic"),
  istituto: text("istituto"), // nome banca
  saldoIniziale: text("saldo_iniziale").default("0"),
  saldoAttuale: text("saldo_attuale").default("0"),
  valuta: text("valuta").default("EUR"),
  colore: text("colore").default("#3B82F6"),
  icona: text("icona").default("building-2"),
  attivo: integer("attivo").notNull().default(1),
  predefinito: integer("predefinito").notNull().default(0),
  note: text("note"),
  createdAt: text("created_at"),
  updatedAt: text("updated_at"),
});

export const insertFinanceAccountSchema = createInsertSchema(financeAccounts).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertFinanceAccount = z.infer<typeof insertFinanceAccountSchema>;
export type FinanceAccount = typeof financeAccounts.$inferSelect;

// Categorie Finanziarie
export const financeCategories = sqliteTable("finance_categories", {
  id: text("id").primaryKey(),
  nome: text("nome").notNull(),
  tipo: text("tipo").notNull(), // entrata, uscita
  icona: text("icona").default("folder"),
  colore: text("colore").default("#6B7280"),
  parentId: text("parent_id"), // per sottocategorie
  ordine: integer("ordine").default(0),
  attivo: integer("attivo").notNull().default(1),
  createdAt: text("created_at"),
});

export const insertFinanceCategorySchema = createInsertSchema(financeCategories).omit({ id: true, createdAt: true });
export type InsertFinanceCategory = z.infer<typeof insertFinanceCategorySchema>;
export type FinanceCategory = typeof financeCategories.$inferSelect;

// Fatture
export const invoices = sqliteTable("invoices", {
  id: text("id").primaryKey(),
  numero: text("numero").notNull(),
  tipo: text("tipo").notNull().default("emessa"), // emessa, ricevuta
  stato: text("stato").notNull().default("bozza"), // bozza, inviata, pagata, parziale, scaduta, annullata
  dataEmissione: text("data_emissione").notNull(),
  dataScadenza: text("data_scadenza"),
  dataPagamento: text("data_pagamento"),
  // Cliente/Fornitore
  clienteId: text("cliente_id").references(() => anagraficaClienti.id),
  fornitoreId: text("fornitore_id").references(() => anagraficaFornitori.id),
  ragioneSociale: text("ragione_sociale").notNull(),
  partitaIva: text("partita_iva"),
  codiceFiscale: text("codice_fiscale"),
  indirizzo: text("indirizzo"),
  // Importi
  imponibile: text("imponibile").default("0"),
  iva: text("iva").default("0"),
  totale: text("totale").default("0"),
  totalePagato: text("totale_pagato").default("0"),
  valuta: text("valuta").default("EUR"),
  // Dettagli
  oggetto: text("oggetto"),
  note: text("note"),
  noteInterne: text("note_interne"),
  metodoPagamento: text("metodo_pagamento"),
  contoId: text("conto_id").references(() => financeAccounts.id),
  // Fatturazione elettronica
  sdi: text("sdi"),
  pec: text("pec"),
  xmlPath: text("xml_path"),
  pdfPath: text("pdf_path"),
  // Tracking
  createdBy: text("created_by").references(() => users.id),
  projectId: text("project_id").references(() => projects.id),
  createdAt: text("created_at"),
  updatedAt: text("updated_at"),
});

export const insertInvoiceSchema = createInsertSchema(invoices).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoices.$inferSelect;

// Righe Fattura
export const invoiceLines = sqliteTable("invoice_lines", {
  id: text("id").primaryKey(),
  invoiceId: text("invoice_id").notNull().references(() => invoices.id, { onDelete: "cascade" }),
  descrizione: text("descrizione").notNull(),
  quantita: text("quantita").default("1"),
  unitaMisura: text("unita_misura").default("pz"),
  prezzoUnitario: text("prezzo_unitario").default("0"),
  sconto: text("sconto").default("0"), // percentuale
  aliquotaIva: text("aliquota_iva").default("22"), // percentuale
  importo: text("importo").default("0"),
  ordine: integer("ordine").default(0),
});

export const insertInvoiceLineSchema = createInsertSchema(invoiceLines).omit({ id: true });
export type InsertInvoiceLine = z.infer<typeof insertInvoiceLineSchema>;
export type InvoiceLine = typeof invoiceLines.$inferSelect;

// Preventivi
export const quotes = sqliteTable("quotes", {
  id: text("id").primaryKey(),
  numero: text("numero").notNull(),
  stato: text("stato").notNull().default("bozza"), // bozza, inviato, accettato, rifiutato, scaduto, convertito
  dataEmissione: text("data_emissione").notNull(),
  dataValidita: text("data_validita"), // data di scadenza preventivo
  // Cliente
  clienteId: text("cliente_id").references(() => anagraficaClienti.id),
  ragioneSociale: text("ragione_sociale").notNull(),
  partitaIva: text("partita_iva"),
  codiceFiscale: text("codice_fiscale"),
  indirizzo: text("indirizzo"),
  email: text("email"),
  telefono: text("telefono"),
  // Importi
  imponibile: text("imponibile").default("0"),
  iva: text("iva").default("0"),
  totale: text("totale").default("0"),
  sconto: text("sconto").default("0"), // sconto globale
  valuta: text("valuta").default("EUR"),
  // Dettagli
  oggetto: text("oggetto"),
  descrizione: text("descrizione"),
  terminiPagamento: text("termini_pagamento"),
  note: text("note"),
  noteInterne: text("note_interne"),
  // Collegamento fattura
  invoiceId: text("invoice_id").references(() => invoices.id),
  projectId: text("project_id").references(() => projects.id),
  // Tracking
  createdBy: text("created_by").references(() => users.id),
  createdAt: text("created_at"),
  updatedAt: text("updated_at"),
});

export const insertQuoteSchema = createInsertSchema(quotes).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertQuote = z.infer<typeof insertQuoteSchema>;
export type Quote = typeof quotes.$inferSelect;

// Righe Preventivo
export const quoteLines = sqliteTable("quote_lines", {
  id: text("id").primaryKey(),
  quoteId: text("quote_id").notNull().references(() => quotes.id, { onDelete: "cascade" }),
  descrizione: text("descrizione").notNull(),
  quantita: text("quantita").default("1"),
  unitaMisura: text("unita_misura").default("pz"),
  prezzoUnitario: text("prezzo_unitario").default("0"),
  sconto: text("sconto").default("0"),
  aliquotaIva: text("aliquota_iva").default("22"),
  importo: text("importo").default("0"),
  ordine: integer("ordine").default(0),
});

export const insertQuoteLineSchema = createInsertSchema(quoteLines).omit({ id: true });
export type InsertQuoteLine = z.infer<typeof insertQuoteLineSchema>;
export type QuoteLine = typeof quoteLines.$inferSelect;

// Ordini Cliente (Sales Orders) - Workflow integrato
export const salesOrders = sqliteTable("sales_orders", {
  id: text("id").primaryKey(),
  numero: text("numero").notNull().unique(),
  // Stato workflow: confermato, verifica_materiale, in_produzione, pronto, spedito, fatturato, consegnato, annullato
  stato: text("stato").notNull().default("confermato"),
  workflowStatus: text("workflow_status").default("preventivo_accettato"), // fase corrente del workflow
  dataOrdine: text("data_ordine").notNull(),
  dataConsegnaPrevista: text("data_consegna_prevista"),
  dataConsegnaEffettiva: text("data_consegna_effettiva"),
  // Collegamento preventivo
  quoteId: text("quote_id").references(() => quotes.id),
  // Cliente
  clienteId: text("cliente_id").references(() => anagraficaClienti.id),
  ragioneSociale: text("ragione_sociale").notNull(),
  partitaIva: text("partita_iva"),
  codiceFiscale: text("codice_fiscale"),
  indirizzo: text("indirizzo"),
  cap: text("cap"),
  citta: text("citta"),
  provincia: text("provincia"),
  email: text("email"),
  telefono: text("telefono"),
  // Importi
  imponibile: text("imponibile").default("0"),
  iva: text("iva").default("0"),
  totale: text("totale").default("0"),
  valuta: text("valuta").default("EUR"),
  // Dettagli
  oggetto: text("oggetto"),
  note: text("note"),
  noteInterne: text("note_interne"),
  terminiPagamento: text("termini_pagamento"),
  // Priorità e urgenza
  priorita: text("priorita").default("normale"), // bassa, normale, alta, urgente
  // Tracking materiale
  materialeVerificato: integer("materiale_verificato").default(0),
  materialeDisponibile: integer("materiale_disponibile").default(0),
  produzioneRichiesta: integer("produzione_richiesta").default(0),
  // Collegamenti documenti generati
  ddtId: text("ddt_id").references(() => ddt.id),
  invoiceId: text("invoice_id").references(() => invoices.id),
  spedizioneId: text("spedizione_id"),
  projectId: text("project_id").references(() => projects.id),
  // Tracking
  createdBy: text("created_by").references(() => users.id),
  createdAt: text("created_at"),
  updatedAt: text("updated_at"),
});

export const insertSalesOrderSchema = createInsertSchema(salesOrders).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSalesOrder = z.infer<typeof insertSalesOrderSchema>;
export type SalesOrder = typeof salesOrders.$inferSelect;

// Righe Ordine Cliente
export const salesOrderLines = sqliteTable("sales_order_lines", {
  id: text("id").primaryKey(),
  orderId: text("order_id").notNull().references(() => salesOrders.id, { onDelete: "cascade" }),
  // Articolo catalogo
  articoloId: text("articolo_id").references(() => catalogArticles.id),
  codiceArticolo: text("codice_articolo"),
  descrizione: text("descrizione").notNull(),
  quantita: text("quantita").default("1"),
  unitaMisura: text("unita_misura").default("pz"),
  prezzoUnitario: text("prezzo_unitario").default("0"),
  sconto: text("sconto").default("0"),
  aliquotaIva: text("aliquota_iva").default("22"),
  importo: text("importo").default("0"),
  ordine: integer("ordine").default(0),
  // Tracking evasione
  quantitaAllocata: text("quantita_allocata").default("0"), // riservata da giacenza
  quantitaInProduzione: text("quantita_in_produzione").default("0"), // in ordine produzione
  quantitaSpedita: text("quantita_spedita").default("0"), // già su DDT
  quantitaFatturata: text("quantita_fatturata").default("0"), // già fatturata
  // Collegamento produzione
  produzioneOrdineId: text("produzione_ordine_id").references(() => productionOrders.id),
});

export const insertSalesOrderLineSchema = createInsertSchema(salesOrderLines).omit({ id: true });
export type InsertSalesOrderLine = z.infer<typeof insertSalesOrderLineSchema>;
export type SalesOrderLine = typeof salesOrderLines.$inferSelect;

// DDT (Documenti di Trasporto)
export const ddt = sqliteTable("ddt", {
  id: text("id").primaryKey(),
  numero: text("numero").notNull(),
  stato: text("stato").notNull().default("bozza"), // bozza, emesso, consegnato, fatturato, annullato
  dataEmissione: text("data_emissione").notNull(),
  dataTrasporto: text("data_trasporto"),
  oraTrasporto: text("ora_trasporto"),
  // Cliente
  clienteId: text("cliente_id").references(() => anagraficaClienti.id),
  ragioneSociale: text("ragione_sociale").notNull(),
  partitaIva: text("partita_iva"),
  codiceFiscale: text("codice_fiscale"),
  indirizzo: text("indirizzo"),
  cap: text("cap"),
  citta: text("citta"),
  provincia: text("provincia"),
  email: text("email"),
  telefono: text("telefono"),
  // Destinazione (se diversa dalla sede)
  destinazioneDiversa: integer("destinazione_diversa").default(0),
  destinazioneRagioneSociale: text("destinazione_ragione_sociale"),
  destinazioneIndirizzo: text("destinazione_indirizzo"),
  destinazioneCap: text("destinazione_cap"),
  destinazioneCitta: text("destinazione_citta"),
  destinazioneProvincia: text("destinazione_provincia"),
  // Trasporto
  causaleTrasporto: text("causale_trasporto").default("Vendita"), // Vendita, Conto visione, Reso, Riparazione, Omaggio, Altro
  tipoTrasporto: text("tipo_trasporto").default("Mittente"), // Mittente, Destinatario, Vettore
  vettore: text("vettore"),
  aspettoBeni: text("aspetto_beni").default("Scatole"), // Scatole, Pallet, Sfuso, Buste, Altro
  porto: text("porto").default("Franco"), // Franco, Assegnato
  pesoLordo: text("peso_lordo"),
  pesoNetto: text("peso_netto"),
  colli: text("colli"),
  // Note e riferimenti
  note: text("note"),
  noteInterne: text("note_interne"),
  riferimentoOrdine: text("riferimento_ordine"),
  // Collegamenti
  salesOrderId: text("sales_order_id"), // collegamento a ordine cliente
  invoiceId: text("invoice_id").references(() => invoices.id),
  quoteId: text("quote_id").references(() => quotes.id),
  projectId: text("project_id").references(() => projects.id),
  // Tracking
  createdBy: text("created_by").references(() => users.id),
  createdAt: text("created_at"),
  updatedAt: text("updated_at"),
});

export const insertDdtSchema = createInsertSchema(ddt).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertDdt = z.infer<typeof insertDdtSchema>;
export type Ddt = typeof ddt.$inferSelect;

// Righe DDT
export const ddtLines = sqliteTable("ddt_lines", {
  id: text("id").primaryKey(),
  ddtId: text("ddt_id").notNull().references(() => ddt.id, { onDelete: "cascade" }),
  codiceArticolo: text("codice_articolo"),
  descrizione: text("descrizione").notNull(),
  quantita: text("quantita").default("1"),
  unitaMisura: text("unita_misura").default("pz"),
  note: text("note"),
  ordine: integer("ordine").default(0),
});

export const insertDdtLineSchema = createInsertSchema(ddtLines).omit({ id: true });
export type InsertDdtLine = z.infer<typeof insertDdtLineSchema>;
export type DdtLine = typeof ddtLines.$inferSelect;

// Transazioni Finanziarie
export const financeTransactions = sqliteTable("finance_transactions", {
  id: text("id").primaryKey(),
  tipo: text("tipo").notNull(), // entrata, uscita, trasferimento
  descrizione: text("descrizione").notNull(),
  importo: text("importo").notNull(),
  data: text("data").notNull(),
  contoId: text("conto_id").references(() => financeAccounts.id),
  contoDestinazioneId: text("conto_destinazione_id").references(() => financeAccounts.id), // per trasferimenti
  categoriaId: text("categoria_id").references(() => financeCategories.id),
  invoiceId: text("invoice_id").references(() => invoices.id),
  projectId: text("project_id").references(() => projects.id),
  clienteId: text("cliente_id").references(() => anagraficaClienti.id),
  fornitoreId: text("fornitore_id").references(() => anagraficaFornitori.id),
  riconciliato: integer("riconciliato").notNull().default(0),
  note: text("note"),
  allegato: text("allegato"),
  deletedAt: text("deleted_at"),
  createdBy: text("created_by").references(() => users.id),
  createdAt: text("created_at"),
  updatedAt: text("updated_at"),
});

export const insertFinanceTransactionSchema = createInsertSchema(financeTransactions).omit({ id: true, createdAt: true, updatedAt: true, deletedAt: true });
export type InsertFinanceTransaction = z.infer<typeof insertFinanceTransactionSchema>;
export type FinanceTransaction = typeof financeTransactions.$inferSelect;

// Budget
export const budgets = sqliteTable("budgets", {
  id: text("id").primaryKey(),
  nome: text("nome").notNull(),
  tipo: text("tipo").notNull().default("mensile"), // mensile, trimestrale, annuale, personalizzato
  categoriaId: text("categoria_id").references(() => financeCategories.id),
  projectId: text("project_id").references(() => projects.id),
  importoPrevisto: text("importo_previsto").notNull(),
  importoSpeso: text("importo_speso").default("0"),
  dataInizio: text("data_inizio").notNull(),
  dataFine: text("data_fine").notNull(),
  alertSoglia: integer("alert_soglia").default(80), // percentuale per avviso
  note: text("note"),
  attivo: integer("attivo").notNull().default(1),
  createdBy: text("created_by").references(() => users.id),
  createdAt: text("created_at"),
  updatedAt: text("updated_at"),
});

export const insertBudgetSchema = createInsertSchema(budgets).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertBudget = z.infer<typeof insertBudgetSchema>;
export type Budget = typeof budgets.$inferSelect;

// Scadenze/Promemoria Pagamenti
export const paymentReminders = sqliteTable("payment_reminders", {
  id: text("id").primaryKey(),
  titolo: text("titolo").notNull(),
  tipo: text("tipo").notNull(), // incasso, pagamento
  importo: text("importo").notNull(),
  dataScadenza: text("data_scadenza").notNull(),
  invoiceId: text("invoice_id").references(() => invoices.id),
  clienteId: text("cliente_id").references(() => anagraficaClienti.id),
  fornitoreId: text("fornitore_id").references(() => anagraficaFornitori.id),
  stato: text("stato").notNull().default("attivo"), // attivo, completato, annullato
  ricorrente: integer("ricorrente").notNull().default(0),
  frequenzaRicorrenza: text("frequenza_ricorrenza"), // mensile, trimestrale, annuale
  note: text("note"),
  createdBy: text("created_by").references(() => users.id),
  createdAt: text("created_at"),
});

export const insertPaymentReminderSchema = createInsertSchema(paymentReminders).omit({ id: true, createdAt: true });
export type InsertPaymentReminder = z.infer<typeof insertPaymentReminderSchema>;
export type PaymentReminder = typeof paymentReminders.$inferSelect;

// Integrazioni Finanziarie (Plaid, SDI, etc.)
export const financeIntegrations = sqliteTable("finance_integrations", {
  id: text("id").primaryKey(),
  tipo: text("tipo").notNull(), // plaid, sdi_aruba, sdi_openapi, sdi_invoicetronic
  nome: text("nome").notNull(),
  attivo: integer("attivo").notNull().default(0),
  configurato: integer("configurato").notNull().default(0),
  ambiente: text("ambiente").default("sandbox"), // sandbox, development, production
  clientId: text("client_id"),
  clientSecret: text("client_secret"),
  accessToken: text("access_token"),
  codiceDestinatario: text("codice_destinatario"),
  partitaIva: text("partita_iva"),
  webhookUrl: text("webhook_url"),
  ultimaSincronizzazione: text("ultima_sincronizzazione"),
  configurazione: text("configurazione"),
  createdAt: text("created_at"),
  updatedAt: text("updated_at"),
});

export const insertFinanceIntegrationSchema = createInsertSchema(financeIntegrations).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertFinanceIntegration = z.infer<typeof insertFinanceIntegrationSchema>;
export type FinanceIntegration = typeof financeIntegrations.$inferSelect;

// Link di Condivisione per Fatture e Transazioni
export const financeShareLinks = sqliteTable("finance_share_links", {
  id: text("id").primaryKey(),
  token: text("token").notNull().unique(),
  tipo: text("tipo").notNull(), // invoice, transaction
  resourceId: text("resource_id").notNull(),
  createdBy: text("created_by").references(() => users.id),
  expiresAt: text("expires_at"),
  password: text("password"),
  viewCount: integer("view_count").notNull().default(0),
  maxViews: integer("max_views"),
  isActive: integer("is_active").notNull().default(1),
  note: text("note"),
  lastViewedAt: text("last_viewed_at"),
  lastViewedIp: text("last_viewed_ip"),
  createdAt: text("created_at"),
});

export const insertFinanceShareLinkSchema = createInsertSchema(financeShareLinks).omit({ id: true, createdAt: true, viewCount: true });
export type InsertFinanceShareLink = z.infer<typeof insertFinanceShareLinkSchema>;
export type FinanceShareLink = typeof financeShareLinks.$inferSelect;

// Solleciti Fatture (Email Reminders)
export const invoiceReminders = sqliteTable("invoice_reminders", {
  id: text("id").primaryKey(),
  invoiceId: text("invoice_id").notNull().references(() => invoices.id),
  trackingToken: text("tracking_token").notNull().unique(),
  recipientEmail: text("recipient_email").notNull(),
  recipientName: text("recipient_name"),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  sentBy: text("sent_by").references(() => users.id),
  sentAt: text("sent_at"),
  deliveryStatus: text("delivery_status").notNull().default("pending"), // pending, sent, failed
  deliveryError: text("delivery_error"),
  openedAt: text("opened_at"),
  openCount: integer("open_count").notNull().default(0),
  lastOpenIp: text("last_open_ip"),
  lastOpenUserAgent: text("last_open_user_agent"),
  createdAt: text("created_at"),
});

export const insertInvoiceReminderSchema = createInsertSchema(invoiceReminders).omit({ id: true, createdAt: true, openCount: true });
export type InsertInvoiceReminder = z.infer<typeof insertInvoiceReminderSchema>;
export type InvoiceReminder = typeof invoiceReminders.$inferSelect;

// Contatori Fatture (per numerazione sequenziale senza buchi)
export const invoiceCounters = sqliteTable("invoice_counters", {
  id: text("id").primaryKey(),
  anno: integer("anno").notNull(),
  ultimoNumero: integer("ultimo_numero").notNull().default(0),
  updatedAt: text("updated_at"),
});

export type InvoiceCounter = typeof invoiceCounters.$inferSelect;

// Contatori DDT
export const ddtCounters = sqliteTable("ddt_counters", {
  id: text("id").primaryKey(),
  anno: integer("anno").notNull(),
  ultimoNumero: integer("ultimo_numero").notNull().default(0),
  updatedAt: text("updated_at"),
});

export type DdtCounter = typeof ddtCounters.$inferSelect;

// =====================
// MODULO PRODUZIONE
// =====================

// Categorie Prodotti Magazzino
export const warehouseCategories = sqliteTable("warehouse_categories", {
  id: text("id").primaryKey(),
  nome: text("nome").notNull(),
  prefisso: text("prefisso").notNull().default("GEN"),
  descrizione: text("descrizione"),
  colore: text("colore").default("#3B82F6"),
  parentId: text("parent_id"),
  ordine: integer("ordine").default(0),
  createdAt: text("created_at"),
});

// Progressivi Codici Prodotto
export const warehouseCodeCounters = sqliteTable("warehouse_code_counters", {
  prefisso: text("prefisso").primaryKey(),
  ultimoProgressivo: integer("ultimo_progressivo").notNull().default(0),
});

export const insertWarehouseCategorySchema = createInsertSchema(warehouseCategories).omit({ id: true, createdAt: true });
export type InsertWarehouseCategory = z.infer<typeof insertWarehouseCategorySchema>;
export type WarehouseCategory = typeof warehouseCategories.$inferSelect;

// Prodotti Magazzino
export const warehouseProducts = sqliteTable("warehouse_products", {
  id: text("id").primaryKey(),
  codice: text("codice").notNull().unique(),
  nome: text("nome").notNull(),
  descrizione: text("descrizione"),
  categoriaId: text("categoria_id").references(() => warehouseCategories.id),
  unitaMisura: text("unita_misura").notNull().default("pz"), // pz, kg, lt, m, m2, m3
  prezzoAcquisto: text("prezzo_acquisto").default("0"),
  prezzoVendita: text("prezzo_vendita").default("0"),
  aliquotaIva: text("aliquota_iva").default("22"),
  giacenza: text("giacenza").notNull().default("0"),
  giacenzaMinima: text("giacenza_minima").default("0"),
  giacenzaMassima: text("giacenza_massima"),
  ubicazione: text("ubicazione"),
  barcode: text("barcode"),
  fornitoreId: text("fornitore_id").references(() => anagraficaFornitori.id),
  note: text("note"),
  attivo: integer("attivo").notNull().default(1),
  immagine: text("immagine"),
  createdAt: text("created_at"),
  updatedAt: text("updated_at"),
});

export const insertWarehouseProductSchema = createInsertSchema(warehouseProducts).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertWarehouseProduct = z.infer<typeof insertWarehouseProductSchema>;
export type WarehouseProduct = typeof warehouseProducts.$inferSelect;

// Movimenti Magazzino
export const warehouseMovements = sqliteTable("warehouse_movements", {
  id: text("id").primaryKey(),
  prodottoId: text("prodotto_id").notNull().references(() => warehouseProducts.id),
  tipo: text("tipo").notNull(), // carico, scarico, rettifica, trasferimento
  causale: text("causale").notNull(), // acquisto, vendita, produzione, reso, inventario, consumo
  quantita: text("quantita").notNull(),
  giacenzaPrecedente: text("giacenza_precedente"),
  giacenzaSuccessiva: text("giacenza_successiva"),
  prezzoUnitario: text("prezzo_unitario"),
  documentoRif: text("documento_rif"),
  ordineProduzioneId: text("ordine_produzione_id"),
  note: text("note"),
  createdBy: text("created_by").references(() => users.id),
  createdAt: text("created_at"),
});

export const insertWarehouseMovementSchema = createInsertSchema(warehouseMovements).omit({ id: true, createdAt: true });
export type InsertWarehouseMovement = z.infer<typeof insertWarehouseMovementSchema>;
export type WarehouseMovement = typeof warehouseMovements.$inferSelect;

// Distinta Base (Bill of Materials)
export const billOfMaterials = sqliteTable("bill_of_materials", {
  id: text("id").primaryKey(),
  prodottoFinito: text("prodotto_finito").notNull().references(() => warehouseProducts.id),
  nome: text("nome").notNull(),
  versione: text("versione").default("1.0"),
  descrizione: text("descrizione"),
  tempoLavorazione: integer("tempo_lavorazione"), // minuti
  costo: text("costo"),
  attiva: integer("attiva").notNull().default(1),
  note: text("note"),
  createdBy: text("created_by").references(() => users.id),
  createdAt: text("created_at"),
  updatedAt: text("updated_at"),
});

export const insertBillOfMaterialsSchema = createInsertSchema(billOfMaterials).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertBillOfMaterials = z.infer<typeof insertBillOfMaterialsSchema>;
export type BillOfMaterials = typeof billOfMaterials.$inferSelect;

// Componenti Distinta Base
export const bomComponents = sqliteTable("bom_components", {
  id: text("id").primaryKey(),
  bomId: text("bom_id").notNull().references(() => billOfMaterials.id),
  componenteId: text("componente_id").notNull().references(() => warehouseProducts.id),
  quantita: text("quantita").notNull(),
  unitaMisura: text("unita_misura"),
  note: text("note"),
  ordine: integer("ordine").default(0),
});

export const insertBomComponentSchema = createInsertSchema(bomComponents).omit({ id: true });
export type InsertBomComponent = z.infer<typeof insertBomComponentSchema>;
export type BomComponent = typeof bomComponents.$inferSelect;

// Ordini di Produzione
export const productionOrders = sqliteTable("production_orders", {
  id: text("id").primaryKey(),
  numero: text("numero").notNull().unique(),
  prodottoId: text("prodotto_id").notNull().references(() => warehouseProducts.id),
  articoloCatalogoId: text("articolo_catalogo_id").references(() => catalogArticles.id),
  bomId: text("bom_id").references(() => billOfMaterials.id),
  quantitaRichiesta: text("quantita_richiesta").notNull(),
  quantitaProdotta: text("quantita_prodotta").default("0"),
  stato: text("stato").notNull().default("pianificato"), // pianificato, in_corso, completato, sospeso, annullato
  priorita: text("priorita").notNull().default("normale"), // bassa, normale, alta, urgente
  dataInizio: text("data_inizio"),
  dataFineStimata: text("data_fine_stimata"),
  dataFineEffettiva: text("data_fine_effettiva"),
  clienteId: text("cliente_id").references(() => anagraficaClienti.id),
  projectId: text("project_id").references(() => projects.id),
  responsabileId: text("responsabile_id").references(() => users.id),
  note: text("note"),
  noteInterne: text("note_interne"),
  createdBy: text("created_by").references(() => users.id),
  createdAt: text("created_at"),
  updatedAt: text("updated_at"),
});

export const insertProductionOrderSchema = createInsertSchema(productionOrders).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertProductionOrder = z.infer<typeof insertProductionOrderSchema>;
export type ProductionOrder = typeof productionOrders.$inferSelect;

// Fasi di Lavorazione
export const productionPhases = sqliteTable("production_phases", {
  id: text("id").primaryKey(),
  ordineId: text("ordine_id").notNull().references(() => productionOrders.id),
  nome: text("nome").notNull(),
  descrizione: text("descrizione"),
  ordine: integer("ordine").notNull().default(0),
  stato: text("stato").notNull().default("da_iniziare"), // da_iniziare, in_corso, completata, sospesa
  tempoStimato: integer("tempo_stimato"), // minuti
  tempoEffettivo: integer("tempo_effettivo"), // minuti
  dataInizio: text("data_inizio"),
  dataFine: text("data_fine"),
  operatoreId: text("operatore_id").references(() => users.id),
  note: text("note"),
  createdAt: text("created_at"),
});

export const insertProductionPhaseSchema = createInsertSchema(productionPhases).omit({ id: true, createdAt: true });
export type InsertProductionPhase = z.infer<typeof insertProductionPhaseSchema>;
export type ProductionPhase = typeof productionPhases.$inferSelect;

// Articoli dell'ordine di produzione
export const productionOrderLines = sqliteTable("production_order_lines", {
  id: text("id").primaryKey(),
  ordineId: text("ordine_id").notNull().references(() => productionOrders.id, { onDelete: "cascade" }),
  codiceArticolo: text("codice_articolo").notNull(),
  descrizione: text("descrizione").notNull(),
  quantita: text("quantita").notNull(),
  unitaMisura: text("unita_misura"),
  note: text("note"),
  ordine: integer("ordine").default(0),
  createdAt: text("created_at"),
});

export const insertProductionOrderLineSchema = createInsertSchema(productionOrderLines).omit({ id: true, createdAt: true });
export type InsertProductionOrderLine = z.infer<typeof insertProductionOrderLineSchema>;
export type ProductionOrderLine = typeof productionOrderLines.$inferSelect;

// ==================== CRM ====================

// CRM Lead - Potenziali clienti
export const crmLeads = sqliteTable("crm_leads", {
  id: text("id").primaryKey(),
  nome: text("nome").notNull(),
  cognome: text("cognome"),
  azienda: text("azienda"),
  email: text("email"),
  telefono: text("telefono"),
  cellulare: text("cellulare"),
  indirizzo: text("indirizzo"),
  citta: text("citta"),
  cap: text("cap"),
  provincia: text("provincia"),
  nazione: text("nazione").default("Italia"),
  fonte: text("fonte"), // web, fiera, referral, cold_call, social, altro
  stato: text("stato").notNull().default("nuovo"), // nuovo, contattato, qualificato, non_qualificato, convertito, perso
  valutazione: text("valutazione").default("freddo"), // freddo, tiepido, caldo
  budgetStimato: text("budget_stimato"),
  settore: text("settore"),
  interesse: text("interesse"),
  note: text("note"),
  tags: text("tags"),
  assegnatoA: text("assegnato_a").references(() => users.id),
  dataProssimoContatto: text("data_prossimo_contatto"),
  clienteId: text("cliente_id").references(() => anagraficaClienti.id), // quando convertito
  createdBy: text("created_by").references(() => users.id),
  createdAt: text("created_at"),
  updatedAt: text("updated_at"),
});

export const insertCrmLeadSchema = createInsertSchema(crmLeads).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCrmLead = z.infer<typeof insertCrmLeadSchema>;
export type CrmLead = typeof crmLeads.$inferSelect;

// CRM Opportunità - Pipeline di vendita
export const crmOpportunita = sqliteTable("crm_opportunita", {
  id: text("id").primaryKey(),
  titolo: text("titolo").notNull(),
  descrizione: text("descrizione"),
  clienteId: text("cliente_id").references(() => anagraficaClienti.id),
  leadId: text("lead_id").references(() => crmLeads.id),
  fase: text("fase").notNull().default("prospetto"), // prospetto, qualificazione, proposta, negoziazione, chiuso_vinto, chiuso_perso
  valore: text("valore"), // importo stimato
  probabilita: integer("probabilita").default(20), // 0-100%
  dataChiusuraStimata: text("data_chiusura_stimata"),
  dataChiusuraEffettiva: text("data_chiusura_effettiva"),
  motivoPerdita: text("motivo_perdita"),
  concorrente: text("concorrente"),
  prodottiServizi: text("prodotti_servizi"),
  preventivoId: text("preventivo_id"),
  projectId: text("project_id").references(() => projects.id),
  assegnatoA: text("assegnato_a").references(() => users.id),
  priorita: text("priorita").default("normale"), // bassa, normale, alta
  note: text("note"),
  tags: text("tags"),
  createdBy: text("created_by").references(() => users.id),
  createdAt: text("created_at"),
  updatedAt: text("updated_at"),
});

export const insertCrmOpportunitaSchema = createInsertSchema(crmOpportunita).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCrmOpportunita = z.infer<typeof insertCrmOpportunitaSchema>;
export type CrmOpportunita = typeof crmOpportunita.$inferSelect;

// CRM Attività - Chiamate, riunioni, task
export const crmAttivita = sqliteTable("crm_attivita", {
  id: text("id").primaryKey(),
  tipo: text("tipo").notNull(), // chiamata, email, riunione, task, nota, altro
  oggetto: text("oggetto").notNull(),
  descrizione: text("descrizione"),
  clienteId: text("cliente_id").references(() => anagraficaClienti.id),
  leadId: text("lead_id").references(() => crmLeads.id),
  opportunitaId: text("opportunita_id").references(() => crmOpportunita.id),
  dataOra: text("data_ora").notNull(),
  durata: integer("durata"), // minuti
  stato: text("stato").notNull().default("pianificata"), // pianificata, in_corso, completata, annullata, rinviata
  esito: text("esito"),
  priorita: text("priorita").default("normale"), // bassa, normale, alta, urgente
  promemoria: text("promemoria"), // nessuno, 5min, 15min, 30min, 1ora, 1giorno
  luogo: text("luogo"), // location of activity
  partecipanti: text("partecipanti"), // comma-separated emails
  risultato: text("risultato"), // outcome/result after completion
  assegnatoA: text("assegnato_a").references(() => users.id),
  createdBy: text("created_by").references(() => users.id),
  createdAt: text("created_at"),
  updatedAt: text("updated_at"),
});

export const insertCrmAttivitaSchema = createInsertSchema(crmAttivita).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCrmAttivita = z.infer<typeof insertCrmAttivitaSchema>;
export type CrmAttivita = typeof crmAttivita.$inferSelect;

// CRM Interazioni - Storico comunicazioni
export const crmInterazioni = sqliteTable("crm_interazioni", {
  id: text("id").primaryKey(),
  tipo: text("tipo").notNull(), // email_inviata, email_ricevuta, chiamata_in, chiamata_out, riunione, nota, preventivo, fattura
  oggetto: text("oggetto"),
  contenuto: text("contenuto"),
  clienteId: text("cliente_id").references(() => anagraficaClienti.id),
  leadId: text("lead_id").references(() => crmLeads.id),
  opportunitaId: text("opportunita_id").references(() => crmOpportunita.id),
  attivitaId: text("attivita_id").references(() => crmAttivita.id),
  emailId: text("email_id"),
  preventivoId: text("preventivo_id"),
  fatturaId: text("fattura_id"),
  direzione: text("direzione"), // in, out
  durata: integer("durata"), // minuti per chiamate
  esito: text("esito"),
  createdBy: text("created_by").references(() => users.id),
  createdAt: text("created_at"),
});

export const insertCrmInterazioneSchema = createInsertSchema(crmInterazioni).omit({ id: true, createdAt: true });
export type InsertCrmInterazione = z.infer<typeof insertCrmInterazioneSchema>;
export type CrmInterazione = typeof crmInterazioni.$inferSelect;

// Email Labels - Etichette personalizzabili per le email
export const emailLabels = sqliteTable("email_labels", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  color: text("color").notNull().default("#3B82F6"),
  userId: text("user_id").references(() => users.id),
  createdAt: text("created_at"),
});

export const insertEmailLabelSchema = createInsertSchema(emailLabels).omit({ id: true, createdAt: true });
export type InsertEmailLabel = z.infer<typeof insertEmailLabelSchema>;
export type EmailLabel = typeof emailLabels.$inferSelect;

// Email Label Assignments - Collegamento email-etichetta
export const emailLabelAssignments = sqliteTable("email_label_assignments", {
  id: text("id").primaryKey(),
  emailId: text("email_id").notNull(),
  labelId: text("label_id").notNull().references(() => emailLabels.id, { onDelete: "cascade" }),
  assignedAt: text("assigned_at"),
});

export const insertEmailLabelAssignmentSchema = createInsertSchema(emailLabelAssignments).omit({ id: true, assignedAt: true });
export type InsertEmailLabelAssignment = z.infer<typeof insertEmailLabelAssignmentSchema>;
export type EmailLabelAssignment = typeof emailLabelAssignments.$inferSelect;

// ==================== EMAIL CACHE SYSTEM ====================

// Email Cache - Cache locale delle email con UID IMAP per sincronizzazione incrementale
export const emailCache = sqliteTable("email_cache", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  messageId: text("message_id"), // Message-ID header
  uid: integer("uid").notNull(), // UID IMAP per sincronizzazione incrementale
  folder: text("folder").notNull().default("INBOX"), // INBOX, Sent, Drafts, Trash, Spam, Archive
  fromAddress: text("from_address").notNull(),
  fromName: text("from_name"),
  toAddress: text("to_address").notNull(),
  ccAddress: text("cc_address"),
  bccAddress: text("bcc_address"),
  subject: text("subject").notNull(),
  preview: text("preview"),
  body: text("body"),
  bodyHtml: text("body_html"),
  unread: integer("unread").notNull().default(1),
  starred: integer("starred").notNull().default(0),
  flagged: integer("flagged").notNull().default(0),
  answered: integer("answered").notNull().default(0),
  deleted: integer("deleted").notNull().default(0),
  draft: integer("draft").notNull().default(0),
  hasAttachments: integer("has_attachments").notNull().default(0),
  importance: text("importance").default("normal"), // low, normal, high
  receivedAt: text("received_at"),
  sentAt: text("sent_at"),
  cachedAt: text("cached_at"),
  updatedAt: text("updated_at"),
});

export const insertEmailCacheSchema = createInsertSchema(emailCache).omit({ id: true, cachedAt: true, updatedAt: true });
export type InsertEmailCache = z.infer<typeof insertEmailCacheSchema>;
export type EmailCache = typeof emailCache.$inferSelect;

// Email Attachments - Allegati salvati separatamente per download on-demand
export const emailAttachments = sqliteTable("email_attachments", {
  id: text("id").primaryKey(),
  emailCacheId: text("email_cache_id").notNull().references(() => emailCache.id, { onDelete: "cascade" }),
  filename: text("filename").notNull(),
  mimeType: text("mime_type"),
  size: integer("size"), // Size in bytes
  contentId: text("content_id"), // Per immagini inline
  isInline: integer("is_inline").default(0),
  storagePath: text("storage_path"), // Path in object storage
  downloaded: integer("downloaded").default(0),
  downloadedAt: text("downloaded_at"),
  createdAt: text("created_at"),
});

export const insertEmailAttachmentSchema = createInsertSchema(emailAttachments).omit({ id: true, createdAt: true });
export type InsertEmailAttachment = z.infer<typeof insertEmailAttachmentSchema>;
export type EmailAttachment = typeof emailAttachments.$inferSelect;

// Email Folders - Cartelle email (standard e personalizzate)
export const emailFolders = sqliteTable("email_folders", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  path: text("path").notNull(), // Path IMAP (es: INBOX, INBOX.Subfolder)
  type: text("type").notNull().default("custom"), // inbox, sent, drafts, trash, spam, archive, custom
  icon: text("icon"), // Icona personalizzata
  color: text("color"), // Colore personalizzata
  parentId: text("parent_id"), // Per sottocartelle
  unreadCount: integer("unread_count").default(0),
  totalCount: integer("total_count").default(0),
  isDefault: integer("is_default").default(0), // Cartelle di sistema non eliminabili
  sortOrder: integer("sort_order").default(0),
  createdAt: text("created_at"),
});

export const insertEmailFolderSchema = createInsertSchema(emailFolders).omit({ id: true, createdAt: true });
export type InsertEmailFolder = z.infer<typeof insertEmailFolderSchema>;
export type EmailFolder = typeof emailFolders.$inferSelect;

// Email Sync State - Stato sincronizzazione per ogni folder
export const emailSyncState = sqliteTable("email_sync_state", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  folder: text("folder").notNull(),
  lastUid: integer("last_uid").default(0), // Ultimo UID sincronizzato
  uidValidity: integer("uid_validity"), // UIDVALIDITY per validazione cache
  lastSyncAt: text("last_sync_at"),
  syncStatus: text("sync_status").default("idle"), // idle, syncing, error
  syncError: text("sync_error"),
  emailCount: integer("email_count").default(0),
  unreadCount: integer("unread_count").default(0),
  createdAt: text("created_at"),
  updatedAt: text("updated_at"),
});

export const insertEmailSyncStateSchema = createInsertSchema(emailSyncState).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertEmailSyncState = z.infer<typeof insertEmailSyncStateSchema>;
export type EmailSyncState = typeof emailSyncState.$inferSelect;

// ==================== PORTALE CLIENTE ====================

// Token di accesso per portale clienti
export const customerPortalTokens = sqliteTable("customer_portal_tokens", {
  id: text("id").primaryKey(),
  clienteId: text("cliente_id").notNull().references(() => anagraficaClienti.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  nome: text("nome"), // Nome descrittivo per il link
  attivo: integer("attivo").notNull().default(1),
  scadenza: text("scadenza"), // null = mai
  ultimoAccesso: text("ultimo_accesso"),
  accessiTotali: integer("accessi_totali").notNull().default(0),
  ultimoIp: text("ultimo_ip"), // IP ultima connessione
  connessioneAttiva: integer("connessione_attiva").default(0), // Se attualmente connesso
  ultimaAttivita: text("ultima_attivita"), // Timestamp ultima attività
  createdBy: text("created_by").references(() => users.id),
  createdAt: text("created_at"),
});

export const insertCustomerPortalTokenSchema = createInsertSchema(customerPortalTokens).omit({ id: true, createdAt: true, ultimoAccesso: true, accessiTotali: true });
export type InsertCustomerPortalToken = z.infer<typeof insertCustomerPortalTokenSchema>;
export type CustomerPortalToken = typeof customerPortalTokens.$inferSelect;

// ==================== MODULO SPEDIZIONI ====================

// Corrieri - Anagrafica corrieri
export const corrieri = sqliteTable("corrieri", {
  id: text("id").primaryKey(),
  nome: text("nome").notNull(),
  codice: text("codice"),
  telefono: text("telefono"),
  email: text("email"),
  website: text("website"),
  urlTracking: text("url_tracking"), // es: https://tracking.gls.it/?code={tracking}
  costoBase: text("costo_base").default("0"),
  note: text("note"),
  attivo: integer("attivo").default(1),
  createdAt: text("created_at"),
});

export const insertCorriereSchema = createInsertSchema(corrieri).omit({ id: true, createdAt: true });
export type InsertCorriere = z.infer<typeof insertCorriereSchema>;
export type Corriere = typeof corrieri.$inferSelect;

// Spedizioni
export const spedizioni = sqliteTable("spedizioni", {
  id: text("id").primaryKey(),
  numero: text("numero").notNull(),
  data: text("data").notNull(),
  clienteId: text("cliente_id").references(() => anagraficaClienti.id),
  corriereId: text("corriere_id").references(() => corrieri.id),
  // Destinazione (può essere diversa dalla sede cliente)
  destinatario: text("destinatario"),
  indirizzoDestinazione: text("indirizzo_destinazione"),
  capDestinazione: text("cap_destinazione"),
  cittaDestinazione: text("citta_destinazione"),
  provinciaDestinazione: text("provincia_destinazione"),
  nazioneDestinazione: text("nazione_destinazione").default("Italia"),
  telefonoDestinazione: text("telefono_destinazione"),
  referenteDestinazione: text("referente_destinazione"),
  // Dati spedizione
  stato: text("stato").notNull().default("da_preparare"), // da_preparare, in_preparazione, pronta, spedita, consegnata, annullata
  numeroTracking: text("numero_tracking"),
  dataSpedizione: text("data_spedizione"),
  dataConsegnaStimata: text("data_consegna_stimata"),
  dataConsegnaEffettiva: text("data_consegna_effettiva"),
  // Dettagli fisici
  numeroColli: integer("numero_colli").default(1),
  pesoTotale: text("peso_totale"),
  volumeTotale: text("volume_totale"),
  // Costi
  costoSpedizione: text("costo_spedizione").default("0"),
  // Collegamenti
  ddtId: text("ddt_id"),
  ordineProduzioneId: text("ordine_produzione_id"),
  // Note
  notePreparazione: text("note_preparazione"),
  noteConsegna: text("note_consegna"),
  // Firma digitale consegna
  firmaDestinatario: text("firma_destinatario"),
  nomeFirmatario: text("nome_firmatario"),
  dataOraFirma: text("data_ora_firma"),
  // Notifiche email
  emailDestinatario: text("email_destinatario"),
  notificaPartenzaInviata: integer("notifica_partenza_inviata").default(0),
  notificaConsegnaInviata: integer("notifica_consegna_inviata").default(0),
  dataNotificaPartenza: text("data_notifica_partenza"),
  dataNotificaConsegna: text("data_notifica_consegna"),
  createdBy: text("created_by").references(() => users.id),
  createdAt: text("created_at"),
  updatedAt: text("updated_at"),
});

export const insertSpedizioneSchema = createInsertSchema(spedizioni).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSpedizione = z.infer<typeof insertSpedizioneSchema>;
export type Spedizione = typeof spedizioni.$inferSelect;

// Righe Spedizione - Articoli da spedire
export const spedizioniRighe = sqliteTable("spedizioni_righe", {
  id: text("id").primaryKey(),
  spedizioneId: text("spedizione_id").notNull().references(() => spedizioni.id, { onDelete: "cascade" }),
  prodottoId: text("prodotto_id").references(() => warehouseProducts.id),
  descrizione: text("descrizione").notNull(),
  quantita: text("quantita").notNull().default("1"),
  unitaMisura: text("unita_misura").default("pz"),
  peso: text("peso"),
  note: text("note"),
  prelevato: integer("prelevato").default(0), // per picking list
  createdAt: text("created_at"),
});

export const insertSpedizioneRigaSchema = createInsertSchema(spedizioniRighe).omit({ id: true, createdAt: true });
export type InsertSpedizioneRiga = z.infer<typeof insertSpedizioneRigaSchema>;
export type SpedizioneRiga = typeof spedizioniRighe.$inferSelect;

// Token Corriere - Link sicuri per firma consegna mobile
export const courierTokens = sqliteTable("courier_tokens", {
  id: text("id").primaryKey(),
  spedizioneId: text("spedizione_id").notNull().references(() => spedizioni.id, { onDelete: "cascade" }),
  token: text("token", { length: 64 }).notNull().unique(),
  pin: text("pin", { length: 6 }),
  expiresAt: text("expires_at").notNull(),
  usedAt: text("used_at"),
  createdAt: text("created_at"),
});

export const insertCourierTokenSchema = createInsertSchema(courierTokens).omit({ id: true, createdAt: true });
export type InsertCourierToken = z.infer<typeof insertCourierTokenSchema>;
export type CourierToken = typeof courierTokens.$inferSelect;

// Anagrafica Azienda - Dati della propria azienda
export const companyInfo = sqliteTable("company_info", {
  id: text("id").primaryKey(),
  ragioneSociale: text("ragione_sociale").notNull(),
  partitaIva: text("partita_iva"),
  codiceFiscale: text("codice_fiscale"),
  codiceDestinatario: text("codice_destinatario"),
  pec: text("pec"),
  // Indirizzo sede legale
  indirizzoSede: text("indirizzo_sede"),
  capSede: text("cap_sede"),
  cittaSede: text("citta_sede"),
  provinciaSede: text("provincia_sede"),
  nazioneSede: text("nazione_sede").default("Italia"),
  // Indirizzo operativo (per spedizioni)
  indirizzoOperativo: text("indirizzo_operativo"),
  capOperativo: text("cap_operativo"),
  cittaOperativo: text("citta_operativo"),
  provinciaOperativo: text("provincia_operativo"),
  nazioneOperativo: text("nazione_operativo").default("Italia"),
  // Coordinate GPS per mappa spedizioni
  latitudine: text("latitudine"),
  longitudine: text("longitudine"),
  // Contatti
  telefono: text("telefono"),
  fax: text("fax"),
  email: text("email"),
  website: text("website"),
  // Dati bancari
  iban: text("iban"),
  banca: text("banca"),
  swift: text("swift"),
  // Logo e branding
  logo: text("logo"),
  coloreAziendale: text("colore_aziendale"),
  // Note
  note: text("note"),
  createdAt: text("created_at"),
  updatedAt: text("updated_at"),
});

export const insertCompanyInfoSchema = createInsertSchema(companyInfo).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCompanyInfo = z.infer<typeof insertCompanyInfoSchema>;
export type CompanyInfo = typeof companyInfo.$inferSelect;

// Conti Bancari Aziendali - Multipli conti per l'azienda
export const aziendaContiBancari = sqliteTable("azienda_conti_bancari", {
  id: text("id").primaryKey(),
  nome: text("nome").notNull(), // Es: "Conto Principale", "Conto Estero"
  iban: text("iban").notNull(),
  banca: text("banca"),
  swift: text("swift"),
  abi: text("abi"),
  cab: text("cab"),
  intestatario: text("intestatario"),
  filiale: text("filiale"),
  note: text("note"),
  principale: integer("principale").default(0), // Conto principale
  attivo: integer("attivo").default(1),
  createdAt: text("created_at"),
  updatedAt: text("updated_at"),
});

export const insertAziendaContoBancarioSchema = createInsertSchema(aziendaContiBancari).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertAziendaContoBancario = z.infer<typeof insertAziendaContoBancarioSchema>;
export type AziendaContoBancario = typeof aziendaContiBancari.$inferSelect;

// Catalogo Articoli
export const catalogCategories = sqliteTable("catalog_categories", {
  id: text("id").primaryKey(),
  nome: text("nome").notNull(),
  descrizione: text("descrizione"),
  icona: text("icona").default("Box"),
  ordine: integer("ordine").default(0),
  attivo: integer("attivo").default(1),
  createdAt: text("created_at"),
  updatedAt: text("updated_at"),
});

export const catalogArticles = sqliteTable("catalog_articles", {
  id: text("id").primaryKey(),
  codice: text("codice", { length: 50 }).notNull().unique(),
  barcode: text("barcode", { length: 50 }),
  nome: text("nome").notNull(),
  descrizione: text("descrizione"),
  categoriaId: text("categoria_id").references(() => catalogCategories.id),
  prezzoListino: text("prezzo_listino").default("0"),
  costo: text("costo").default("0"),
  ricarico: text("ricarico").default("0"),
  unitaMisura: text("unita_misura").default("pz"),
  immagine: text("immagine"),
  giacenza: integer("giacenza").default(0),
  stockMinimo: integer("stock_minimo").default(0),
  stockMassimo: integer("stock_massimo").default(0),
  ubicazioneScaffale: text("ubicazione_scaffale"),
  ubicazioneCorsia: text("ubicazione_corsia"),
  ubicazioneRipiano: text("ubicazione_ripiano"),
  lotto: text("lotto"),
  dataScadenza: text("data_scadenza"),
  visibile: integer("visibile").default(1),
  attivo: integer("attivo").default(1),
  createdAt: text("created_at"),
  updatedAt: text("updated_at"),
});

export const catalogPriceLists = sqliteTable("catalog_price_lists", {
  id: text("id").primaryKey(),
  nome: text("nome").notNull(),
  descrizione: text("descrizione"),
  tipo: text("tipo").default("standard"),
  attivo: integer("attivo").default(1),
  createdAt: text("created_at"),
});

export const catalogArticlePrices = sqliteTable("catalog_article_prices", {
  id: text("id").primaryKey(),
  articoloId: text("articolo_id").references(() => catalogArticles.id).notNull(),
  listinoId: text("listino_id").references(() => catalogPriceLists.id).notNull(),
  prezzo: text("prezzo").default("0"),
  createdAt: text("created_at"),
});

export const catalogPriceHistory = sqliteTable("catalog_price_history", {
  id: text("id").primaryKey(),
  articoloId: text("articolo_id").references(() => catalogArticles.id).notNull(),
  prezzoVecchio: text("prezzo_vecchio"),
  prezzoNuovo: text("prezzo_nuovo"),
  tipoPrezzo: text("tipo_prezzo").default("listino"),
  dataModifica: text("data_modifica"),
  note: text("note"),
});

export const catalogMovements = sqliteTable("catalog_movements", {
  id: text("id").primaryKey(),
  articoloId: text("articolo_id").references(() => catalogArticles.id).notNull(),
  tipo: text("tipo").notNull(),
  quantita: integer("quantita").notNull(),
  giacenzaPrecedente: integer("giacenza_precedente"),
  giacenzaSuccessiva: integer("giacenza_successiva"),
  causale: text("causale"),
  documentoRif: text("documento_rif"),
  note: text("note"),
  createdBy: text("created_by").references(() => users.id),
  createdAt: text("created_at"),
});

export const insertCatalogCategorySchema = createInsertSchema(catalogCategories).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCatalogCategory = z.infer<typeof insertCatalogCategorySchema>;
export type CatalogCategory = typeof catalogCategories.$inferSelect;

export const insertCatalogArticleSchema = createInsertSchema(catalogArticles).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCatalogArticle = z.infer<typeof insertCatalogArticleSchema>;
export type CatalogArticle = typeof catalogArticles.$inferSelect;

export const insertCatalogPriceListSchema = createInsertSchema(catalogPriceLists).omit({ id: true, createdAt: true });
export type InsertCatalogPriceList = z.infer<typeof insertCatalogPriceListSchema>;
export type CatalogPriceList = typeof catalogPriceLists.$inferSelect;

// Condizioni di Pagamento
export const condizioniPagamento = sqliteTable("condizioni_pagamento", {
  id: text("id").primaryKey(),
  codice: text("codice").notNull(),
  descrizione: text("descrizione").notNull(),
  giorniScadenza: integer("giorni_scadenza").default(0),
  note: text("note"),
  attivo: integer("attivo").default(1),
  createdAt: text("created_at"),
});

export const insertCondizioniPagamentoSchema = createInsertSchema(condizioniPagamento).omit({ id: true, createdAt: true });
export type InsertCondizioniPagamento = z.infer<typeof insertCondizioniPagamentoSchema>;
export type CondizioniPagamento = typeof condizioniPagamento.$inferSelect;

// Social & Marketing - Campagne
export const marketingCampagne = sqliteTable("marketing_campagne", {
  id: text("id").primaryKey(),
  nome: text("nome").notNull(),
  descrizione: text("descrizione"),
  obiettivo: text("obiettivo"),
  dataInizio: text("data_inizio"),
  dataFine: text("data_fine"),
  budget: text("budget"),
  spesaEffettiva: text("spesa_effettiva"),
  stato: text("stato").default("bozza"),
  canali: text("canali", { mode: 'json' }).$type<string[]>().default("[]"),
  targetAudience: text("target_audience"),
  kpiTarget: text("kpi_target"),
  kpiRaggiunto: text("kpi_raggiunto"),
  note: text("note"),
  createdBy: text("created_by").references(() => users.id),
  createdAt: text("created_at"),
  updatedAt: text("updated_at"),
});

export const insertMarketingCampagnaSchema = createInsertSchema(marketingCampagne).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertMarketingCampagna = z.infer<typeof insertMarketingCampagnaSchema>;
export type MarketingCampagna = typeof marketingCampagne.$inferSelect;

// Social & Marketing - Contenuti Social
export const socialContenuti = sqliteTable("social_contenuti", {
  id: text("id").primaryKey(),
  titolo: text("titolo").notNull(),
  tipo: text("tipo").default("post"),
  piattaforma: text("piattaforma"),
  contenuto: text("contenuto"),
  mediaUrl: text("media_url"),
  mediaType: text("media_type"),
  hashtags: text("hashtags", { mode: 'json' }).$type<string[]>().default("[]"),
  stato: text("stato").default("bozza"),
  dataPubblicazione: text("data_pubblicazione"),
  oraPubblicazione: text("ora_pubblicazione"),
  campagnaId: text("campagna_id").references(() => marketingCampagne.id),
  linkEsterno: text("link_esterno"),
  note: text("note"),
  createdBy: text("created_by").references(() => users.id),
  createdAt: text("created_at"),
  updatedAt: text("updated_at"),
});

export const insertSocialContenutoSchema = createInsertSchema(socialContenuti).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSocialContenuto = z.infer<typeof insertSocialContenutoSchema>;
export type SocialContenuto = typeof socialContenuti.$inferSelect;

// Social & Marketing - Video YouTube
export const youtubeVideos = sqliteTable("youtube_videos", {
  id: text("id").primaryKey(),
  titolo: text("titolo").notNull(),
  descrizione: text("descrizione"),
  tags: text("tags", { mode: 'json' }).$type<string[]>().default("[]"),
  thumbnailUrl: text("thumbnail_url"),
  videoUrl: text("video_url"),
  youtubeId: text("youtube_id"),
  stato: text("stato").default("bozza"),
  dataPubblicazione: text("data_pubblicazione"),
  durata: text("durata"),
  categoria: text("categoria"),
  script: text("script"),
  storyboard: text("storyboard"),
  views: integer("views").default(0),
  likes: integer("likes").default(0),
  commenti: integer("commenti").default(0),
  campagnaId: text("campagna_id").references(() => marketingCampagne.id),
  note: text("note"),
  createdBy: text("created_by").references(() => users.id),
  createdAt: text("created_at"),
  updatedAt: text("updated_at"),
});

export const insertYoutubeVideoSchema = createInsertSchema(youtubeVideos).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertYoutubeVideo = z.infer<typeof insertYoutubeVideoSchema>;
export type YoutubeVideo = typeof youtubeVideos.$inferSelect;

// Social & Marketing - Analytics/Statistiche
export const socialAnalytics = sqliteTable("social_analytics", {
  id: text("id").primaryKey(),
  piattaforma: text("piattaforma").notNull(),
  dataRilevazione: text("data_rilevazione").notNull(),
  followers: integer("followers").default(0),
  followersVariazione: integer("followers_variazione").default(0),
  engagement: text("engagement"),
  impressions: integer("impressions").default(0),
  reach: integer("reach").default(0),
  clicks: integer("clicks").default(0),
  likes: integer("likes").default(0),
  commenti: integer("commenti").default(0),
  condivisioni: integer("condivisioni").default(0),
  note: text("note"),
  createdAt: text("created_at"),
});

export const insertSocialAnalyticsSchema = createInsertSchema(socialAnalytics).omit({ id: true, createdAt: true });
export type InsertSocialAnalytics = z.infer<typeof insertSocialAnalyticsSchema>;
export type SocialAnalytics = typeof socialAnalytics.$inferSelect;

// Social & Marketing - Libreria Media
export const mediaLibrary = sqliteTable("media_library", {
  id: text("id").primaryKey(),
  nome: text("nome").notNull(),
  tipo: text("tipo").default("immagine"),
  url: text("url"),
  dimensione: text("dimensione"),
  formato: text("formato"),
  categoria: text("categoria"),
  tags: text("tags").default("[]"),
  usatoIn: text("usato_in").default("[]"),
  createdBy: text("created_by").references(() => users.id),
  createdAt: text("created_at"),
});

export const insertMediaLibrarySchema = createInsertSchema(mediaLibrary).omit({ id: true, createdAt: true });
export type InsertMediaLibrary = z.infer<typeof insertMediaLibrarySchema>;
export type MediaLibrary = typeof mediaLibrary.$inferSelect;

// Google Business Profile - Account collegati
export const googleBusinessAccounts = sqliteTable("google_business_accounts", {
  id: text("id").primaryKey(),
  accountId: text("account_id"),
  locationId: text("location_id"),
  nomeAttivita: text("nome_attivita").notNull(),
  indirizzo: text("indirizzo"),
  telefono: text("telefono"),
  sitoWeb: text("sito_web"),
  categoria: text("categoria"),
  orariApertura: text("orari_apertura"),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  tokenExpiresAt: text("token_expires_at"),
  isConnected: integer("is_connected").default(0),
  lastSync: text("last_sync"),
  createdAt: text("created_at"),
  updatedAt: text("updated_at"),
});

export const insertGoogleBusinessAccountSchema = createInsertSchema(googleBusinessAccounts).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertGoogleBusinessAccount = z.infer<typeof insertGoogleBusinessAccountSchema>;
export type GoogleBusinessAccount = typeof googleBusinessAccounts.$inferSelect;

// Google Business Profile - Recensioni
export const googleBusinessReviews = sqliteTable("google_business_reviews", {
  id: text("id").primaryKey(),
  accountId: text("account_id").references(() => googleBusinessAccounts.id),
  reviewId: text("review_id"),
  autore: text("autore"),
  rating: integer("rating"),
  testo: text("testo"),
  dataRecensione: text("data_recensione"),
  risposta: text("risposta"),
  dataRisposta: text("data_risposta"),
  rispostoTramiteApp: integer("risposto_tramite_app").default(0),
  createdAt: text("created_at"),
});

export const insertGoogleBusinessReviewSchema = createInsertSchema(googleBusinessReviews).omit({ id: true, createdAt: true });
export type InsertGoogleBusinessReview = z.infer<typeof insertGoogleBusinessReviewSchema>;
export type GoogleBusinessReview = typeof googleBusinessReviews.$inferSelect;

// Google Business Profile - Post
export const googleBusinessPosts = sqliteTable("google_business_posts", {
  id: text("id").primaryKey(),
  accountId: text("account_id").references(() => googleBusinessAccounts.id),
  postId: text("post_id"),
  tipo: text("tipo").default("update"),
  titolo: text("titolo"),
  contenuto: text("contenuto"),
  callToAction: text("call_to_action"),
  linkCta: text("link_cta"),
  mediaUrl: text("media_url"),
  stato: text("stato").default("bozza"),
  dataPubblicazione: text("data_pubblicazione"),
  dataScadenza: text("data_scadenza"),
  views: integer("views").default(0),
  clicks: integer("clicks").default(0),
  createdAt: text("created_at"),
  updatedAt: text("updated_at"),
});

export const insertGoogleBusinessPostSchema = createInsertSchema(googleBusinessPosts).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertGoogleBusinessPost = z.infer<typeof insertGoogleBusinessPostSchema>;
export type GoogleBusinessPost = typeof googleBusinessPosts.$inferSelect;

// Google Business Profile - Statistiche
export const googleBusinessInsights = sqliteTable("google_business_insights", {
  id: text("id").primaryKey(),
  accountId: text("account_id").references(() => googleBusinessAccounts.id),
  dataRilevazione: text("data_rilevazione").notNull(),
  visualizzazioniMappa: integer("visualizzazioni_mappa").default(0),
  visualizzazioniRicerca: integer("visualizzazioni_ricerca").default(0),
  chiamate: integer("chiamate").default(0),
  richiesteDirezioni: integer("richieste_direzioni").default(0),
  clickSitoWeb: integer("click_sito_web").default(0),
  fotoVisualizzate: integer("foto_visualizzate").default(0),
  recensioniTotali: integer("recensioni_totali").default(0),
  ratingMedio: text("rating_medio"),
  createdAt: text("created_at"),
});

export const insertGoogleBusinessInsightsSchema = createInsertSchema(googleBusinessInsights).omit({ id: true, createdAt: true });
export type InsertGoogleBusinessInsights = z.infer<typeof insertGoogleBusinessInsightsSchema>;
export type GoogleBusinessInsights = typeof googleBusinessInsights.$inferSelect;



// =====================






// =====================
// MACHINERY MANAGEMENT MODULE
// =====================

// Machinery - Anagrafica Macchinari
export const machinery = sqliteTable("machinery", {
  id: text("id").primaryKey(),
  codice: text("codice").notNull(),
  nome: text("nome").notNull(),
  tipo: text("tipo"),
  categoria: text("categoria"),
  marca: text("marca"),
  modello: text("modello"),
  numeroSerie: text("numero_serie"),
  annoAcquisto: text("anno_acquisto"),
  dataAcquisto: text("data_acquisto"),
  valoreAcquisto: text("valore_acquisto"),
  valoreResiduo: text("valore_residuo"),
  anniAmmortamento: integer("anni_ammortamento"),
  ubicazione: text("ubicazione"),
  reparto: text("reparto"),
  stato: text("stato").default("attivo"),
  potenza: text("potenza"),
  consumoOrario: text("consumo_orario"),
  unitaConsumo: text("unita_consumo"),
  oreLavoro: integer("ore_lavoro").default(0),
  responsabileId: text("responsabile_id").references(() => users.id),
  fornitoreId: text("fornitore_id"),
  note: text("note"),
  immagine: text("immagine"),
  documenti: text("documenti").default("[]"),
  createdAt: text("created_at"),
  updatedAt: text("updated_at"),
});

export const insertMachinerySchema = createInsertSchema(machinery).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertMachinery = z.infer<typeof insertMachinerySchema>;
export type Machinery = typeof machinery.$inferSelect;

// Machinery Consumptions - Consumi Macchinari
export const machineryConsumptions = sqliteTable("machinery_consumptions", {
  id: text("id").primaryKey(),
  machineryId: text("machinery_id").notNull().references(() => machinery.id, { onDelete: "cascade" }),
  data: text("data").notNull(),
  tipoConsumo: text("tipo_consumo").notNull(),
  quantita: text("quantita").notNull(),
  unitaMisura: text("unita_misura"),
  costoUnitario: text("costo_unitario"),
  costoTotale: text("costo_totale"),
  oreLavoro: text("ore_lavoro"),
  ordineProduzioneId: text("ordine_produzione_id"),
  letturaPrecedente: text("lettura_precedente"),
  letturaAttuale: text("lettura_attuale"),
  note: text("note"),
  registratoDa: text("registrato_da").references(() => users.id),
  createdAt: text("created_at"),
});

export const insertMachineryConsumptionSchema = createInsertSchema(machineryConsumptions).omit({ id: true, createdAt: true });
export type InsertMachineryConsumption = z.infer<typeof insertMachineryConsumptionSchema>;
export type MachineryConsumption = typeof machineryConsumptions.$inferSelect;

// Machinery Costs - Costi Macchinari
export const machineryCosts = sqliteTable("machinery_costs", {
  id: text("id").primaryKey(),
  machineryId: text("machinery_id").notNull().references(() => machinery.id, { onDelete: "cascade" }),
  data: text("data").notNull(),
  tipoCosto: text("tipo_costo").notNull(),
  descrizione: text("descrizione"),
  importo: text("importo").notNull(),
  fornitoreId: text("fornitore_id"),
  fatturaRif: text("fattura_rif"),
  categoria: text("categoria"),
  note: text("note"),
  registratoDa: text("registrato_da").references(() => users.id),
  createdAt: text("created_at"),
});

export const insertMachineryCostSchema = createInsertSchema(machineryCosts).omit({ id: true, createdAt: true });
export type InsertMachineryCost = z.infer<typeof insertMachineryCostSchema>;
export type MachineryCost = typeof machineryCosts.$inferSelect;

// Maintenance Plans - Piani di Manutenzione
export const maintenancePlans = sqliteTable("maintenance_plans", {
  id: text("id").primaryKey(),
  machineryId: text("machinery_id").notNull().references(() => machinery.id, { onDelete: "cascade" }),
  nome: text("nome").notNull(),
  tipo: text("tipo").notNull(),
  descrizione: text("descrizione"),
  frequenza: text("frequenza"),
  intervalloGiorni: integer("intervallo_giorni"),
  intervalloOre: integer("intervallo_ore"),
  prossimaScadenza: text("prossima_scadenza"),
  ultimaEsecuzione: text("ultima_esecuzione"),
  checklist: text("checklist"),
  responsabileId: text("responsabile_id").references(() => users.id),
  costoStimato: text("costo_stimato"),
  durataStimata: text("durata_stimata"),
  priorita: text("priorita").default("normale"),
  attivo: integer("attivo").default(1),
  notificaGiorniPrima: integer("notifica_giorni_prima").default(7),
  createdAt: text("created_at"),
  updatedAt: text("updated_at"),
});

export const insertMaintenancePlanSchema = createInsertSchema(maintenancePlans).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertMaintenancePlan = z.infer<typeof insertMaintenancePlanSchema>;
export type MaintenancePlan = typeof maintenancePlans.$inferSelect;

// Maintenance Events - Eventi di Manutenzione
export const maintenanceEvents = sqliteTable("maintenance_events", {
  id: text("id").primaryKey(),
  machineryId: text("machinery_id").notNull().references(() => machinery.id, { onDelete: "cascade" }),
  planId: text("plan_id").references(() => maintenancePlans.id),
  tipo: text("tipo").notNull(),
  titolo: text("titolo").notNull(),
  descrizione: text("descrizione"),
  dataPianificata: text("data_pianificata"),
  dataEsecuzione: text("data_esecuzione"),
  stato: text("stato").default("pianificato"),
  tecnicoId: text("tecnico_id").references(() => users.id),
  oreFermo: text("ore_fermo"),
  oreLavoro: text("ore_lavoro"),
  costoManodopera: text("costo_manodopera"),
  costoRicambi: text("costo_ricambi"),
  costoTotale: text("costo_totale"),
  ricambiUsati: text("ricambi_usati"),
  checklistCompletata: text("checklist_completata"),
  note: text("note"),
  allegati: text("allegati").default("[]"),
  createdAt: text("created_at"),
  updatedAt: text("updated_at"),
});

export const insertMaintenanceEventSchema = createInsertSchema(maintenanceEvents).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertMaintenanceEvent = z.infer<typeof insertMaintenanceEventSchema>;
export type MaintenanceEvent = typeof maintenanceEvents.$inferSelect;

// Maintenance Alerts - Avvisi Manutenzione
export const maintenanceAlerts = sqliteTable("maintenance_alerts", {
  id: text("id").primaryKey(),
  machineryId: text("machinery_id").notNull().references(() => machinery.id, { onDelete: "cascade" }),
  planId: text("plan_id").references(() => maintenancePlans.id),
  tipo: text("tipo").notNull(),
  messaggio: text("messaggio").notNull(),
  priorita: text("priorita").default("normale"),
  dataScadenza: text("data_scadenza"),
  letto: integer("letto").default(0),
  archiviato: integer("archiviato").default(0),
  createdAt: text("created_at"),
});

export const insertMaintenanceAlertSchema = createInsertSchema(maintenanceAlerts).omit({ id: true, createdAt: true });
export type InsertMaintenanceAlert = z.infer<typeof insertMaintenanceAlertSchema>;
export type MaintenanceAlert = typeof maintenanceAlerts.$inferSelect;

// ============================================
// PERSONAL FINANCE MODULE - Finanza Personale
// ============================================

// Personal Finance Categories - Categorie Finanza Personale
export const personalCategories = sqliteTable("personal_categories", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  nome: text("nome").notNull(),
  tipo: text("tipo").notNull(), // entrata, uscita
  icona: text("icona"),
  colore: text("colore"),
  predefinita: integer("predefinita").default(0),
  attiva: integer("attiva").default(1),
  createdAt: text("created_at"),
});

export const insertPersonalCategorySchema = createInsertSchema(personalCategories).omit({ id: true, createdAt: true });
export type InsertPersonalCategory = z.infer<typeof insertPersonalCategorySchema>;
export type PersonalCategory = typeof personalCategories.$inferSelect;

// Personal Accounts - Conti Personali
export const personalAccounts = sqliteTable("personal_accounts", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  nome: text("nome").notNull(),
  tipo: text("tipo").notNull(), // banca, contante, carta_credito, carta_debito, investimenti, risparmio
  istituto: text("istituto"),
  iban: text("iban"),
  saldoIniziale: text("saldo_iniziale").default("0"),
  saldoAttuale: text("saldo_attuale").default("0"),
  valuta: text("valuta").default("EUR"),
  colore: text("colore"),
  icona: text("icona"),
  attivo: integer("attivo").default(1),
  predefinito: integer("predefinito").default(0),
  includiInTotale: integer("includi_in_totale").default(1),
  note: text("note"),
  createdAt: text("created_at"),
  updatedAt: text("updated_at"),
});

export const insertPersonalAccountSchema = createInsertSchema(personalAccounts).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPersonalAccount = z.infer<typeof insertPersonalAccountSchema>;
export type PersonalAccount = typeof personalAccounts.$inferSelect;

// Personal Transactions - Transazioni Personali
export const personalTransactions = sqliteTable("personal_transactions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  accountId: text("account_id").notNull().references(() => personalAccounts.id, { onDelete: "cascade" }),
  categoryId: text("category_id").references(() => personalCategories.id),
  tipo: text("tipo").notNull(), // entrata, uscita, trasferimento
  importo: text("importo").notNull(),
  data: text("data").notNull(),
  descrizione: text("descrizione"),
  beneficiario: text("beneficiario"),
  accountDestinazioneId: text("account_destinazione_id").references(() => personalAccounts.id),
  ricorrente: integer("ricorrente").default(0),
  frequenzaRicorrenza: text("frequenza_ricorrenza"), // mensile, settimanale, annuale
  dataFineRicorrenza: text("data_fine_ricorrenza"),
  tags: text("tags").default("[]"),
  allegato: text("allegato"),
  note: text("note"),
  createdAt: text("created_at"),
});

export const insertPersonalTransactionSchema = createInsertSchema(personalTransactions).omit({ id: true, createdAt: true });
export type InsertPersonalTransaction = z.infer<typeof insertPersonalTransactionSchema>;
export type PersonalTransaction = typeof personalTransactions.$inferSelect;

// Personal Budgets - Budget Personali
export const personalBudgets = sqliteTable("personal_budgets", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  categoryId: text("category_id").references(() => personalCategories.id),
  nome: text("nome").notNull(),
  importoLimite: text("importo_limite").notNull(),
  importoSpeso: text("importo_speso").default("0"),
  periodo: text("periodo").notNull(), // mensile, settimanale, annuale
  meseAnno: text("mese_anno"), // formato: 2025-01 per budget mensili
  anno: text("anno"), // per budget annuali
  colore: text("colore"),
  notificaSoglia: integer("notifica_soglia").default(80), // percentuale per notifica
  attivo: integer("attivo").default(1),
  createdAt: text("created_at"),
  updatedAt: text("updated_at"),
});

export const insertPersonalBudgetSchema = createInsertSchema(personalBudgets).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPersonalBudget = z.infer<typeof insertPersonalBudgetSchema>;
export type PersonalBudget = typeof personalBudgets.$inferSelect;

// Personal Goals - Obiettivi di Risparmio
export const personalGoals = sqliteTable("personal_goals", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  nome: text("nome").notNull(),
  descrizione: text("descrizione"),
  importoObiettivo: text("importo_obiettivo").notNull(),
  importoAttuale: text("importo_attuale").default("0"),
  dataInizio: text("data_inizio"),
  dataScadenza: text("data_scadenza"),
  priorita: text("priorita").default("normale"), // bassa, normale, alta
  stato: text("stato").default("in_corso"), // in_corso, completato, annullato
  icona: text("icona"),
  colore: text("colore"),
  accountId: text("account_id").references(() => personalAccounts.id),
  note: text("note"),
  createdAt: text("created_at"),
  updatedAt: text("updated_at"),
});

export const insertPersonalGoalSchema = createInsertSchema(personalGoals).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPersonalGoal = z.infer<typeof insertPersonalGoalSchema>;
export type PersonalGoal = typeof personalGoals.$inferSelect;

// Personal Goal Contributions - Versamenti Obiettivi
export const personalGoalContributions = sqliteTable("personal_goal_contributions", {
  id: text("id").primaryKey(),
  goalId: text("goal_id").notNull().references(() => personalGoals.id, { onDelete: "cascade" }),
  importo: text("importo").notNull(),
  data: text("data").notNull(),
  note: text("note"),
  createdAt: text("created_at"),
});

export const insertPersonalGoalContributionSchema = createInsertSchema(personalGoalContributions).omit({ id: true, createdAt: true });
export type InsertPersonalGoalContribution = z.infer<typeof insertPersonalGoalContributionSchema>;
export type PersonalGoalContribution = typeof personalGoalContributions.$inferSelect;

// Office Pulse Documents
export const officeDocuments = sqliteTable("office_documents", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  type: text("type").notNull(), // docx, xlsx, pptx
  fileName: text("file_name").notNull(),
  filePath: text("file_path").notNull(),
  ownerId: text("owner_id").references(() => users.id),
  lastEditorId: text("last_editor_id").references(() => users.id),
  version: integer("version").notNull().default(1),
  isLocked: integer("is_locked", { mode: "boolean" }).default(false),
  lockedBy: text("locked_by").references(() => users.id),
  lastOpenedAt: text("last_opened_at"),
  createdAt: text("created_at"),
  updatedAt: text("updated_at"),
});

export const insertOfficeDocumentSchema = createInsertSchema(officeDocuments).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertOfficeDocument = z.infer<typeof insertOfficeDocumentSchema>;
export type OfficeDocument = typeof officeDocuments.$inferSelect;






// Pulse Library - Book Management
export const books = sqliteTable("books", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id),

  // Book Metadata
  isbn: text("isbn"),
  title: text("title").notNull(),
  author: text("author").notNull(),
  coverUrl: text("cover_url"),
  description: text("description"),
  totalPages: integer("total_pages").default(0),
  publisher: text("publisher"),
  publishedDate: text("published_date"),
  categories: text("categories"), // JSON array string
  language: text("language").default("it"),

  // User Status
  status: text("status").default("to_read"), // to_read, reading, completed, abandoned
  currentPage: integer("current_page").default(0),
  rating: integer("rating"), // 1-5
  startedAt: text("started_at"),
  finishedAt: text("finished_at"),

  // Integration
  format: text("format"), // physical, ebook, audiobook
  associatedKeepNoteId: text("keep_note_id"),
  filePath: text("file_path"), // Path to the uploaded file
  fileType: text("file_type"), // pdf, epub, etc.

  createdAt: text("created_at"),
  updatedAt: text("updated_at"),
});

export const insertBookSchema = createInsertSchema(books).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertBook = z.infer<typeof insertBookSchema>;
export type Book = typeof books.$inferSelect;

// Reading Sessions (for statistics)
export const readingSessions = sqliteTable("reading_sessions", {
  id: text("id").primaryKey(),
  bookId: text("book_id").notNull().references(() => books.id, { onDelete: "cascade" }),
  userId: text("user_id").references(() => users.id),
  date: text("date").notNull(),
  pagesRead: integer("pages_read").notNull(),
  durationMinutes: integer("duration_minutes"),
  notes: text("notes"),
  createdAt: text("created_at"),
});

export const insertReadingSessionSchema = createInsertSchema(readingSessions).omit({ id: true, createdAt: true });
export type InsertReadingSession = z.infer<typeof insertReadingSessionSchema>;
export type ReadingSession = typeof readingSessions.$inferSelect;

// Contacts table
export const contacts = sqliteTable("contacts", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  googleId: text("google_id").unique(),
  resourceName: text("resource_name"),
  etag: text("etag"),
  givenName: text("given_name"),
  familyName: text("family_name"),
  email: text("email"),
  phone: text("phone"),
  company: text("company"),
  jobTitle: text("job_title"),
  notes: text("notes"),
  birthday: text("birthday"),
  lastSyncedAt: text("last_synced_at"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
  deletedAt: text("deleted_at"),
});

export const insertContactSchema = createInsertSchema(contacts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastSyncedAt: true,
});
export type InsertContact = z.infer<typeof insertContactSchema>;
export type Contact = typeof contacts.$inferSelect;
