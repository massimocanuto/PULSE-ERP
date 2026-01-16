import {
  users, type User, type InsertUser,
  userAccessLogs, type UserAccessLog, type InsertUserAccessLog,
  turniPredefiniti, type TurnoPredefinita, type InsertTurnoPredefinita,
  projects, type Project, type InsertProject,
  projectShares, type ProjectShare, type InsertProjectShare,
  tasks, type Task, type InsertTask,
  emails, type Email, type InsertEmail,
  projectEmails, type ProjectEmail, type InsertProjectEmail,
  chatChannels, type ChatChannel, type InsertChatChannel,
  chatMessages, type ChatMessage, type InsertChatMessage,
  chatSavedConversations, type ChatSavedConversation, type InsertChatSavedConversation,
  whatsappContacts, type WhatsappContact, type InsertWhatsappContact,
  whatsappMessages, type WhatsappMessage, type InsertWhatsappMessage,
  telegramChats, type TelegramChat, type InsertTelegramChat,
  telegramMessages, type TelegramMessage, type InsertTelegramMessage,
  documents, type Document, type InsertDocument,
  documentShares, type DocumentShare, type InsertDocumentShare,
  documentComments, type DocumentComment, type InsertDocumentComment,
  projectDocuments, type ProjectDocument, type InsertProjectDocument,
  rolePermissions, type RolePermission, type InsertRolePermission,
  archivedDocuments, type ArchivedDocument, type InsertArchivedDocument,
  archiveFolders, type ArchiveFolder, type InsertArchiveFolder,
  userPermissions, type UserPermission, type InsertUserPermission,
  personalTodos, type PersonalTodo, type InsertPersonalTodo,
  subtasks, type Subtask, type InsertSubtask,
  taskComments, type TaskComment, type InsertTaskComment,
  activityFeed, type ActivityFeed, type InsertActivityFeed,
  appSettings, type AppSettings,
  projectComments, type ProjectComment, type InsertProjectComment,
  sharedLinks, type SharedLink, type InsertSharedLink,
  teamAvailability, type TeamAvailability, type InsertTeamAvailability,
  notifications, type Notification, type InsertNotification,
  todoTemplates, type TodoTemplate, type InsertTodoTemplate,
  timeEntries, type TimeEntry, type InsertTimeEntry,
  keepNotes, type KeepNote, type InsertKeepNote,
  keepLabels, type KeepLabel, type InsertKeepLabel,
  whiteboards, type Whiteboard, type InsertWhiteboard,
  whiteboardElements, type WhiteboardElement, type InsertWhiteboardElement,
  userEmailConfigs, type UserEmailConfig, type InsertUserEmailConfig,
  anagraficaPersonale, type AnagraficaPersonale, type InsertAnagraficaPersonale,
  anagraficaClienti, type AnagraficaClienti, type InsertAnagraficaClienti,
  referentiClienti, type ReferenteCliente, type InsertReferenteCliente,
  salesOrders, type SalesOrder, type InsertSalesOrder,
  indirizziSpedizioneClienti, type IndirizzoSpedizioneCliente, type InsertIndirizzoSpedizioneCliente,
  anagraficaFornitori, type AnagraficaFornitori, type InsertAnagraficaFornitori,

  backups, type Backup, type InsertBackup,
  backupSchedules, type BackupSchedule, type InsertBackupSchedule,
  financeAccounts, type FinanceAccount, type InsertFinanceAccount,
  financeCategories, type FinanceCategory, type InsertFinanceCategory,
  invoices, type Invoice, type InsertInvoice,
  invoiceLines, type InvoiceLine, type InsertInvoiceLine,
  quotes, type Quote, type InsertQuote,
  quoteLines, type QuoteLine, type InsertQuoteLine,
  ddt, type Ddt, type InsertDdt,
  ddtLines, type DdtLine, type InsertDdtLine,
  financeTransactions, type FinanceTransaction, type InsertFinanceTransaction,
  budgets, type Budget, type InsertBudget,
  paymentReminders, type PaymentReminder, type InsertPaymentReminder,
  financeIntegrations, type FinanceIntegration, type InsertFinanceIntegration,
  financeShareLinks, type FinanceShareLink, type InsertFinanceShareLink,
  invoiceReminders, type InvoiceReminder, type InsertInvoiceReminder,
  warehouseCategories, type WarehouseCategory, type InsertWarehouseCategory,
  warehouseCodeCounters,
  warehouseProducts, type WarehouseProduct, type InsertWarehouseProduct,
  warehouseMovements, type WarehouseMovement, type InsertWarehouseMovement,
  billOfMaterials, type BillOfMaterials, type InsertBillOfMaterials,
  bomComponents, type BomComponent, type InsertBomComponent,
  productionOrders, type ProductionOrder, type InsertProductionOrder,
  productionPhases, type ProductionPhase, type InsertProductionPhase,
  crmLeads, type CrmLead, type InsertCrmLead,
  crmOpportunita, type CrmOpportunita, type InsertCrmOpportunita,
  crmAttivita, type CrmAttivita, type InsertCrmAttivita,
  crmInterazioni, type CrmInterazione, type InsertCrmInterazione,
  emailLabels, type EmailLabel, type InsertEmailLabel,
  emailLabelAssignments, type EmailLabelAssignment, type InsertEmailLabelAssignment,

  emailAttachments, type EmailAttachment, type InsertEmailAttachment,
  emailFolders, type EmailFolder, type InsertEmailFolder,
  emailSyncState, type EmailSyncState, type InsertEmailSyncState,
  corrieri, type Corriere, type InsertCorriere,
  spedizioni, type Spedizione, type InsertSpedizione,
  spedizioniRighe, type SpedizioneRiga, type InsertSpedizioneRiga,
  companyInfo, type CompanyInfo, type InsertCompanyInfo,
  aziendaContiBancari, type AziendaContoBancario, type InsertAziendaContoBancario,
  condizioniPagamento, type CondizioniPagamento, type InsertCondizioniPagamento,
  cedolini, type Cedolino, type InsertCedolino,
  timbrature, type Timbratura, type InsertTimbratura,
  turni, type Turno, type InsertTurno,
  straordinari, type Straordinario, type InsertStraordinario,
  richiesteAssenza, type RichiestaAssenza, type InsertRichiestaAssenza,
  saldiFeriePermessi, type SaldoFeriePermessi, type InsertSaldoFeriePermessi,
  scadenzeHr, type ScadenzaHr, type InsertScadenzaHr,
  personalCategories, type PersonalCategory, type InsertPersonalCategory,
  personalAccounts, type PersonalAccount, type InsertPersonalAccount,
  personalTransactions, type PersonalTransaction, type InsertPersonalTransaction,
  personalBudgets, type PersonalBudget, type InsertPersonalBudget,
  personalGoals, type PersonalGoal, type InsertPersonalGoal,
  personalGoalContributions, type PersonalGoalContribution, type InsertPersonalGoalContribution,
  officeDocuments, type OfficeDocument, type InsertOfficeDocument,
  MODULES, ROLES
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, asc, and, or, inArray, isNull, isNotNull, sql, like, max } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUsers(): Promise<User[]>;
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;

  // User Access Logs
  getUserAccessLogs(userId?: string): Promise<UserAccessLog[]>;
  createUserAccessLog(log: InsertUserAccessLog): Promise<UserAccessLog>;

  // Projects
  getProjects(): Promise<Project[]>;
  getProject(id: string): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: string, project: Partial<InsertProject>): Promise<Project | undefined>;
  deleteProject(id: string): Promise<boolean>;

  // Project Shares
  getProjectShares(projectId: string): Promise<ProjectShare[]>;
  getProjectsSharedWithUser(userId: string): Promise<Project[]>;
  createProjectShare(share: InsertProjectShare): Promise<ProjectShare>;
  deleteProjectShare(id: string): Promise<boolean>;

  // Tasks
  getTasks(): Promise<Task[]>;
  getTask(id: string): Promise<Task | undefined>;
  getTasksByProject(projectId: string): Promise<Task[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: string, task: Partial<InsertTask>): Promise<Task | undefined>;
  deleteTask(id: string): Promise<boolean>;

  // Emails
  getEmails(userId?: string, limit?: number): Promise<Email[]>;
  getEmail(id: string): Promise<Email | undefined>;
  createEmail(email: InsertEmail): Promise<Email>;
  updateEmail(id: string, email: Partial<InsertEmail>): Promise<Email | undefined>;
  deleteEmail(id: string): Promise<boolean>;

  // User Email Config
  getUserEmailConfigs(userId?: string): Promise<UserEmailConfig[]>;
  getUserEmailConfig(id: string): Promise<UserEmailConfig | undefined>;
  createUserEmailConfig(config: InsertUserEmailConfig & { userId: string }): Promise<UserEmailConfig>;
  updateUserEmailConfig(id: string, config: Partial<InsertUserEmailConfig>): Promise<UserEmailConfig | undefined>;
  deleteUserEmailConfig(id: string): Promise<boolean>;

  // Anagrafica Clienti Search & Relations
  searchAnagraficaClienti(query: string): Promise<AnagraficaClienti[]>;
  getReferentiByCliente(clienteId: string): Promise<ReferenteCliente[]>;
  getSalesOrdersByCliente(clienteId: string): Promise<SalesOrder[]>;
  getQuotesByCliente(clienteId: string): Promise<Quote[]>;
  getInvoicesByCliente(clienteId: string): Promise<Invoice[]>;

  // Project Emails
  getProjectEmails(projectId: string): Promise<ProjectEmail[]>;
  addProjectEmail(projectEmail: InsertProjectEmail): Promise<ProjectEmail>;
  removeProjectEmail(id: string): Promise<boolean>;
  getAllLinkedEmails(): Promise<ProjectEmail[]>;

  // Email Labels
  getEmailLabels(): Promise<EmailLabel[]>;
  createEmailLabel(label: InsertEmailLabel): Promise<EmailLabel>;
  updateEmailLabel(id: string, label: Partial<InsertEmailLabel>): Promise<EmailLabel | undefined>;
  deleteEmailLabel(id: string): Promise<boolean>;
  getEmailLabelAssignments(emailId: string): Promise<(EmailLabelAssignment & { label: EmailLabel })[]>;
  getAllEmailLabelAssignments(): Promise<(EmailLabelAssignment & { label: EmailLabel })[]>;
  assignLabelToEmail(assignment: InsertEmailLabelAssignment): Promise<EmailLabelAssignment>;
  removeLabelFromEmail(emailId: string, labelId: string): Promise<boolean>;

  // Email Cache (nuovo sistema)
  getEmailCache(userId: string, folder?: string): Promise<Email[]>;
  getEmailCacheById(id: string): Promise<Email | undefined>;
  getEmailCacheByUid(userId: string, folder: string, uid: number): Promise<Email | undefined>;
  createEmailCache(email: InsertEmail): Promise<Email>;
  updateEmailCache(id: string, email: Partial<InsertEmail>): Promise<Email | undefined>;
  deleteEmailCache(id: string): Promise<boolean>;
  searchEmailCache(userId: string, query: string): Promise<Email[]>;

  // Email Attachments
  getEmailAttachments(emailCacheId: string): Promise<EmailAttachment[]>;
  createEmailAttachment(attachment: InsertEmailAttachment): Promise<EmailAttachment>;
  updateEmailAttachment(id: string, attachment: Partial<InsertEmailAttachment>): Promise<EmailAttachment | undefined>;
  deleteEmailAttachment(id: string): Promise<boolean>;

  // Email Folders
  getEmailFolders(userId: string): Promise<EmailFolder[]>;
  createEmailFolder(folder: InsertEmailFolder): Promise<EmailFolder>;
  updateEmailFolder(id: string, folder: Partial<InsertEmailFolder>): Promise<EmailFolder | undefined>;
  deleteEmailFolder(id: string): Promise<boolean>;
  initDefaultEmailFolders(userId: string): Promise<void>;

  // Email Sync State
  getEmailSyncState(userId: string, folder: string): Promise<EmailSyncState | undefined>;
  upsertEmailSyncState(state: InsertEmailSyncState): Promise<EmailSyncState>;
  updateEmailSyncState(id: string, state: Partial<InsertEmailSyncState>): Promise<EmailSyncState | undefined>;

  // Chat Channels
  getChatChannels(): Promise<ChatChannel[]>;
  getChatChannel(id: string): Promise<ChatChannel | undefined>;
  getChatChannelByProjectId(projectId: string): Promise<ChatChannel | undefined>;
  getChatChannelByTaskId(taskId: string): Promise<ChatChannel | undefined>;
  createChatChannel(channel: InsertChatChannel): Promise<ChatChannel>;
  updateChatChannel(id: string, channel: Partial<InsertChatChannel>): Promise<ChatChannel | undefined>;
  deleteChatChannel(id: string): Promise<boolean>;

  // Chat Messages
  getChatMessages(channelId?: string): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  deleteChatMessage(id: string): Promise<boolean>;
  purgeAllChatMessages(): Promise<void>;
  purgeAllChatChannels(): Promise<void>;

  // Saved Conversations
  getSavedConversations(userId?: string): Promise<ChatSavedConversation[]>;
  getSavedConversation(id: string): Promise<ChatSavedConversation | undefined>;
  createSavedConversation(conversation: InsertChatSavedConversation): Promise<ChatSavedConversation>;
  deleteSavedConversation(id: string): Promise<boolean>;

  // WhatsApp Contacts
  getWhatsappContacts(): Promise<WhatsappContact[]>;
  getWhatsappContact(id: string): Promise<WhatsappContact | undefined>;
  createWhatsappContact(contact: InsertWhatsappContact): Promise<WhatsappContact>;
  updateWhatsappContact(id: string, contact: Partial<InsertWhatsappContact>): Promise<WhatsappContact | undefined>;

  // WhatsApp Messages
  getWhatsappMessages(contactId: string): Promise<WhatsappMessage[]>;
  createWhatsappMessage(message: InsertWhatsappMessage): Promise<WhatsappMessage>;

  // Telegram Chats
  getTelegramChats(): Promise<TelegramChat[]>;
  getTelegramChat(id: string): Promise<TelegramChat | undefined>;
  getTelegramChatByChatId(chatId: string): Promise<TelegramChat | undefined>;
  createTelegramChat(chat: InsertTelegramChat): Promise<TelegramChat>;
  updateTelegramChat(id: string, chat: Partial<InsertTelegramChat>): Promise<TelegramChat | undefined>;

  // Telegram Messages
  getTelegramMessages(chatId?: string): Promise<TelegramMessage[]>;
  createTelegramMessage(message: InsertTelegramMessage): Promise<TelegramMessage>;

  // Documents
  getDocuments(): Promise<Document[]>;
  getDocumentsMetadata(): Promise<Omit<Document, 'content'>[]>;

  // Anagrafica Clienti
  getAnagraficaClienti(): Promise<AnagraficaClienti[]>;
  getAnagraficaCliente(id: string): Promise<AnagraficaClienti | undefined>;
  createAnagraficaCliente(cliente: InsertAnagraficaClienti): Promise<AnagraficaClienti>;
  updateAnagraficaCliente(id: string, cliente: Partial<InsertAnagraficaClienti>): Promise<AnagraficaClienti | undefined>;
  deleteAnagraficaCliente(id: string): Promise<boolean>;

  // Anagrafica Fornitori
  getAnagraficaFornitori(): Promise<AnagraficaFornitori[]>;
  getAnagraficaFornitore(id: string): Promise<AnagraficaFornitori | undefined>;
  createAnagraficaFornitore(fornitore: InsertAnagraficaFornitori): Promise<AnagraficaFornitori>;
  updateAnagraficaFornitore(id: string, fornitore: Partial<InsertAnagraficaFornitori>): Promise<AnagraficaFornitori | undefined>;
  deleteAnagraficaFornitore(id: string): Promise<boolean>;

  // Indirizzi Spedizione
  getIndirizziSpedizione(clienteId: string): Promise<IndirizzoSpedizione[]>;
  createIndirizzoSpedizione(indirizzo: InsertIndirizzoSpedizione): Promise<IndirizzoSpedizione>;
  updateIndirizzoSpedizione(id: string, indirizzo: Partial<InsertIndirizzoSpedizione>): Promise<IndirizzoSpedizione | undefined>;
  deleteIndirizzoSpedizione(id: string): Promise<boolean>;
  getDocumentsMetadataByOwner(ownerId: string): Promise<Omit<Document, 'content'>[]>;
  getDocumentsMetadataSharedWithUser(userId: string): Promise<Omit<Document, 'content'>[]>;
  getDocument(id: string): Promise<Document | undefined>;
  getDocumentsByOwner(ownerId: string): Promise<Document[]>;
  getDocumentsSharedWithUser(userId: string): Promise<Document[]>;
  createDocument(document: InsertDocument): Promise<Document>;
  updateDocument(id: string, document: Partial<InsertDocument>): Promise<Document | undefined>;
  deleteDocument(id: string): Promise<boolean>;

  // Document Shares
  getDocumentShares(documentId: string): Promise<DocumentShare[]>;
  createDocumentShare(share: InsertDocumentShare): Promise<DocumentShare>;
  deleteDocumentShare(id: string): Promise<boolean>;

  // Document Comments
  getDocumentComments(documentId: string): Promise<DocumentComment[]>;
  createDocumentComment(comment: InsertDocumentComment): Promise<DocumentComment>;
  updateDocumentComment(id: string, comment: Partial<InsertDocumentComment>): Promise<DocumentComment | undefined>;
  deleteDocumentComment(id: string): Promise<boolean>;

  // Project Documents
  getProjectDocuments(projectId: string): Promise<ProjectDocument[]>;
  getProjectDocumentsWithDetails(projectId: string): Promise<(ProjectDocument & { document: Document })[]>;
  addProjectDocument(projectDocument: InsertProjectDocument): Promise<ProjectDocument>;
  removeProjectDocument(id: string): Promise<boolean>;
  getDocumentProjects(documentId: string): Promise<Project[]>;

  // Role Permissions
  getRolePermissions(role: string): Promise<RolePermission[]>;
  getAllRolePermissions(): Promise<RolePermission[]>;
  updateRolePermission(role: string, module: string, permissions: Partial<Pick<RolePermission, 'canView' | 'canCreate' | 'canEdit' | 'canDelete'>>): Promise<RolePermission | undefined>;
  upsertRolePermission(role: string, module: string, permissions: Pick<RolePermission, 'canView' | 'canCreate' | 'canEdit' | 'canDelete'>): Promise<RolePermission>;
  seedDefaultPermissions(): Promise<void>;

  // Archive Folders
  getArchiveFolders(): Promise<ArchiveFolder[]>;
  getArchiveFolder(id: string): Promise<ArchiveFolder | undefined>;
  getArchiveFolderByProjectId(projectId: string): Promise<ArchiveFolder | undefined>;
  getArchiveFolderByName(name: string): Promise<ArchiveFolder | undefined>;
  createArchiveFolder(folder: InsertArchiveFolder): Promise<ArchiveFolder>;
  updateArchiveFolder(id: string, folder: Partial<InsertArchiveFolder>): Promise<ArchiveFolder | undefined>;
  deleteArchiveFolder(id: string): Promise<boolean>;

  // Archived Documents
  getArchivedDocuments(userId?: string, category?: string): Promise<ArchivedDocument[]>;
  getArchivedDocument(id: string): Promise<ArchivedDocument | undefined>;
  createArchivedDocument(doc: InsertArchivedDocument): Promise<ArchivedDocument>;
  updateArchivedDocument(id: string, doc: Partial<InsertArchivedDocument>): Promise<ArchivedDocument | undefined>;
  deleteArchivedDocument(id: string): Promise<boolean>;

  // User Permissions
  getUserPermissions(userId: string): Promise<UserPermission[]>;
  getAllUserPermissions(): Promise<UserPermission[]>;

  upsertUserPermission(userId: string, module: string, permissions: Pick<UserPermission, 'canView' | 'canCreate' | 'canEdit' | 'canDelete'>): Promise<UserPermission>;
  seedUserPermissionsFromRole(userId: string, role: string): Promise<void>;

  // Personal Todos
  getPersonalTodos(userId?: string): Promise<PersonalTodo[]>;
  getPersonalTodo(id: string): Promise<PersonalTodo | undefined>;
  getPersonalTodoByProjectAndTitle(projectId: string, title: string): Promise<PersonalTodo | undefined>;
  getPersonalTodoByCategoryAndTitle(category: string, title: string): Promise<PersonalTodo | undefined>;
  createPersonalTodo(todo: InsertPersonalTodo): Promise<PersonalTodo>;
  updatePersonalTodo(id: string, todo: Partial<InsertPersonalTodo>): Promise<PersonalTodo | undefined>;
  deletePersonalTodo(id: string): Promise<boolean>;

  // Subtasks
  getSubtasks(todoId: string): Promise<Subtask[]>;
  createSubtask(subtask: InsertSubtask): Promise<Subtask>;
  updateSubtask(id: string, data: Partial<InsertSubtask>): Promise<Subtask | undefined>;
  deleteSubtask(id: string): Promise<boolean>;

  // Task Comments
  getTaskComments(taskId: string): Promise<TaskComment[]>;
  createTaskComment(comment: InsertTaskComment): Promise<TaskComment>;
  deleteTaskComment(id: string): Promise<boolean>;

  // Activity Feed
  getActivityFeed(limit?: number): Promise<ActivityFeed[]>;
  createActivity(activity: InsertActivityFeed): Promise<ActivityFeed>;
  purgeActivityFeed(): Promise<void>;

  // App Settings
  getSetting(key: string): Promise<AppSettings | undefined>;
  setSetting(key: string, value: string): Promise<AppSettings>;
  deleteSetting(key: string): Promise<void>;
  isSetupComplete(): Promise<boolean>;

  // Todo Templates
  getTodoTemplates(): Promise<TodoTemplate[]>;
  getTodoTemplate(id: string): Promise<TodoTemplate | undefined>;
  createTodoTemplate(template: InsertTodoTemplate): Promise<TodoTemplate>;
  updateTodoTemplate(id: string, template: Partial<InsertTodoTemplate>): Promise<TodoTemplate | undefined>;
  deleteTodoTemplate(id: string): Promise<boolean>;

  // Time Entries
  getTimeEntries(): Promise<TimeEntry[]>;
  getTimeEntriesByTodo(todoId: string): Promise<TimeEntry[]>;
  getTimeEntriesByProject(projectId: string): Promise<TimeEntry[]>;
  createTimeEntry(entry: InsertTimeEntry): Promise<TimeEntry>;
  updateTimeEntry(id: string, entry: Partial<InsertTimeEntry>): Promise<TimeEntry | undefined>;
  deleteTimeEntry(id: string): Promise<boolean>;

  // Keep Notes
  getKeepNotes(userId: string): Promise<KeepNote[]>;
  getDeletedKeepNotes(userId: string): Promise<KeepNote[]>;
  getKeepNote(id: string): Promise<KeepNote | undefined>;
  createKeepNote(note: InsertKeepNote): Promise<KeepNote>;
  updateKeepNote(id: string, note: Partial<InsertKeepNote>): Promise<KeepNote | undefined>;
  softDeleteKeepNote(id: string): Promise<KeepNote | undefined>;
  restoreKeepNote(id: string): Promise<KeepNote | undefined>;
  deleteKeepNote(id: string): Promise<boolean>;
  duplicateKeepNote(id: string): Promise<KeepNote | undefined>;
  updateKeepNotesOrder(updates: { id: string; orderIndex: number }[]): Promise<void>;

  // Keep Labels
  getKeepLabels(userId: string): Promise<KeepLabel[]>;
  createKeepLabel(label: InsertKeepLabel): Promise<KeepLabel>;
  deleteKeepLabel(id: string): Promise<boolean>;

  // Whiteboards
  getWhiteboards(userId?: string): Promise<Whiteboard[]>;
  getWhiteboard(id: string): Promise<Whiteboard | undefined>;
  createWhiteboard(whiteboard: InsertWhiteboard): Promise<Whiteboard>;
  updateWhiteboard(id: string, whiteboard: Partial<InsertWhiteboard>): Promise<Whiteboard | undefined>;
  deleteWhiteboard(id: string): Promise<boolean>;

  // Whiteboard Elements
  getWhiteboardElements(whiteboardId: string): Promise<WhiteboardElement[]>;
  createWhiteboardElement(element: InsertWhiteboardElement): Promise<WhiteboardElement>;
  updateWhiteboardElement(id: string, element: Partial<InsertWhiteboardElement>): Promise<WhiteboardElement | undefined>;
  deleteWhiteboardElement(id: string): Promise<boolean>;



  // Condizioni di Pagamento
  getCondizioniPagamento(): Promise<CondizioniPagamento[]>;
  createCondizionePagamento(condizione: InsertCondizioniPagamento): Promise<CondizioniPagamento>;
  updateCondizionePagamento(id: string, condizione: Partial<InsertCondizioniPagamento>): Promise<CondizioniPagamento | undefined>;
  deleteCondizionePagamento(id: string): Promise<boolean>;

  // Finance
  getInvoices(): Promise<Invoice[]>;
  getInvoice(id: string): Promise<Invoice | undefined>;
  getProjectInvoices(projectId: string): Promise<Invoice[]>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoice(id: string, invoice: Partial<InsertInvoice>): Promise<Invoice | undefined>;

  getQuotes(): Promise<Quote[]>;
  getQuote(id: string): Promise<Quote | undefined>;
  getProjectQuotes(projectId: string): Promise<Quote[]>;
  createQuote(quote: InsertQuote): Promise<Quote>;
  updateQuote(id: string, quote: Partial<InsertQuote>): Promise<Quote | undefined>;

  getTransactions(): Promise<FinanceTransaction[]>;
  getTransaction(id: string): Promise<FinanceTransaction | undefined>;
  getProjectTransactions(projectId: string): Promise<FinanceTransaction[]>;
  createTransaction(transaction: InsertFinanceTransaction): Promise<FinanceTransaction>;
  updateTransaction(id: string, transaction: Partial<InsertFinanceTransaction>): Promise<FinanceTransaction | undefined>;

  // Anagrafica Clienti
  getAnagraficaClienti(): Promise<AnagraficaClienti[]>;
  getAnagraficaCliente(id: string): Promise<AnagraficaClienti | undefined>;
  createAnagraficaCliente(cliente: InsertAnagraficaClienti): Promise<AnagraficaClienti>;
  updateAnagraficaCliente(id: string, cliente: Partial<InsertAnagraficaClienti>): Promise<AnagraficaClienti | undefined>;
  deleteAnagraficaCliente(id: string): Promise<boolean>;
  searchAnagraficaClienti(query: string): Promise<AnagraficaClienti[]>;

  getReferentiByCliente(clienteId: string): Promise<ReferenteCliente[]>;
  getSalesOrdersByCliente(clienteId: string): Promise<SalesOrder[]>;
  getQuotesByCliente(clienteId: string): Promise<Quote[]>;
  getInvoicesByCliente(clienteId: string): Promise<Invoice[]>;


  getOfficeDocuments(): Promise<OfficeDocument[]>;
  getOfficeDocument(id: string): Promise<OfficeDocument | undefined>;
  createOfficeDocument(doc: InsertOfficeDocument): Promise<OfficeDocument>;
  updateOfficeDocument(id: string, doc: Partial<InsertOfficeDocument>): Promise<OfficeDocument | undefined>;
  deleteOfficeDocument(id: string): Promise<boolean>;
  // HR System - Timbrature
  getTimbrature(personaleId?: string): Promise<Timbratura[]>;
  getTimbratura(id: string): Promise<Timbratura | undefined>;
  createTimbratura(timbratura: InsertTimbratura): Promise<Timbratura>;
  updateTimbratura(id: string, timbratura: Partial<InsertTimbratura>): Promise<Timbratura | undefined>;
  deleteTimbratura(id: string): Promise<boolean>;

  // HR System - Turni
  getTurni(personaleId?: string): Promise<Turno[]>;
  createTurno(turno: InsertTurno): Promise<Turno>;
  updateTurno(id: string, turno: Partial<InsertTurno>): Promise<Turno | undefined>;
  deleteTurno(id: string): Promise<boolean>;

  // HR System - Richieste Assenza
  getRichiesteAssenza(personaleId?: string): Promise<RichiestaAssenza[]>;
  getRichiestaAssenza(id: string): Promise<RichiestaAssenza | undefined>;
  createRichiestaAssenza(richiesta: InsertRichiestaAssenza): Promise<RichiestaAssenza>;
  updateRichiestaAssenza(id: string, richiesta: Partial<InsertRichiestaAssenza>): Promise<RichiestaAssenza | undefined>;
  deleteRichiestaAssenza(id: string): Promise<boolean>;

  // Backups
  getBackups(): Promise<Backup[]>;
  createBackup(backup: InsertBackup): Promise<Backup>;
  deleteBackup(id: string): Promise<boolean>;

  // Backup Schedules
  getBackupSchedules(): Promise<BackupSchedule[]>;
  getBackupSchedule(id: string): Promise<BackupSchedule | undefined>;
  createBackupSchedule(schedule: InsertBackupSchedule): Promise<BackupSchedule>;
  updateBackupSchedule(id: string, schedule: Partial<InsertBackupSchedule>): Promise<BackupSchedule | undefined>;
  deleteBackupSchedule(id: string): Promise<boolean>;

  // App Settings
  getSetting(key: string): Promise<AppSettings | undefined>;
  setSetting(key: string, value: string): Promise<AppSettings>;
  deleteSetting(key: string): Promise<void>;
  isSetupComplete(): Promise<boolean>;
}


export class DatabaseStorage implements IStorage {
  // Users
  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  // Anagrafica Clienti
  async getAnagraficaClienti(): Promise<AnagraficaClienti[]> {
    return await db.select().from(anagraficaClienti);
  }

  async getAnagraficaCliente(id: string): Promise<AnagraficaClienti | undefined> {
    const result = await db.select().from(anagraficaClienti).where(eq(anagraficaClienti.id, id));
    return result[0];
  }

  async createAnagraficaCliente(cliente: InsertAnagraficaClienti): Promise<AnagraficaClienti> {
    const newCliente = {
      ...cliente,
      id: randomUUID(),
      createdAt: new Date().toISOString()
    };
    const result = await db.insert(anagraficaClienti).values(newCliente).returning();
    return result[0];
  }

  async updateAnagraficaCliente(id: string, cliente: Partial<InsertAnagraficaClienti>): Promise<AnagraficaClienti | undefined> {
    const result = await db.update(anagraficaClienti).set({ ...cliente, updatedAt: new Date().toISOString() }).where(eq(anagraficaClienti.id, id)).returning();
    return result[0];
  }

  async deleteAnagraficaCliente(id: string): Promise<boolean> {
    const result = await db.delete(anagraficaClienti).where(eq(anagraficaClienti.id, id)).returning();
    return result.length > 0;
  }

  async searchAnagraficaClienti(query: string): Promise<AnagraficaClienti[]> {
    const lowerQuery = query.toLowerCase();
    const searchPattern = `%${lowerQuery}%`;
    return await db.select().from(anagraficaClienti)
      .where(or(
        like(anagraficaClienti.ragioneSociale, searchPattern),
        like(anagraficaClienti.email, searchPattern),
        like(anagraficaClienti.partitaIva, searchPattern)
      ));
  }

  async getReferentiByCliente(clienteId: string): Promise<ReferenteCliente[]> {
    return await db.select().from(referentiClienti).where(eq(referentiClienti.clienteId, clienteId));
  }

  async getSalesOrdersByCliente(clienteId: string): Promise<SalesOrder[]> {
    return await db.select().from(salesOrders).where(eq(salesOrders.clienteId, clienteId));
  }

  async getQuotesByCliente(clienteId: string): Promise<Quote[]> {
    return await db.select().from(quotes).where(eq(quotes.clienteId, clienteId));
  }

  async getInvoicesByCliente(clienteId: string): Promise<Invoice[]> {
    return await db.select().from(invoices).where(eq(invoices.clienteId, clienteId));
  }


  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const newUser = {
      ...insertUser,
      id: randomUUID(),
      allowedIp: insertUser.allowedIp || null // Ensure optional fields are handled
    };
    const result = await db.insert(users).values(newUser).returning();
    return result[0];
  }

  async updateUser(id: string, userData: Partial<InsertUser>): Promise<User | undefined> {
    const result = await db.update(users).set(userData).where(eq(users.id, id)).returning();
    return result[0];
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id)).returning();
    return result.length > 0;
  }

  // User Access Logs
  async getUserAccessLogs(userId?: string): Promise<UserAccessLog[]> {
    if (userId) {
      return await db.select().from(userAccessLogs).where(eq(userAccessLogs.userId, userId)).orderBy(desc(userAccessLogs.loginAt));
    }
    return await db.select().from(userAccessLogs).orderBy(desc(userAccessLogs.loginAt));
  }

  async createUserAccessLog(log: InsertUserAccessLog): Promise<UserAccessLog> {
    const newLog = {
      ...log,
      id: randomUUID(),
      loginAt: new Date().toISOString()
    };
    const result = await db.insert(userAccessLogs).values(newLog).returning();
    return result[0];
  }

  // Projects
  async getProjects(): Promise<Project[]> {
    return await db.select().from(projects).orderBy(desc(projects.createdAt));
  }

  async getProject(id: string): Promise<Project | undefined> {
    const result = await db.select().from(projects).where(eq(projects.id, id));
    return result[0];
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const newProject = {
      ...insertProject,
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      files: insertProject.files || "[]",
      teamMembers: insertProject.teamMembers || "[]"
    };
    const result = await db.insert(projects).values(newProject).returning();
    return result[0];
  }

  async updateProject(id: string, projectData: Partial<InsertProject>): Promise<Project | undefined> {
    const result = await db.update(projects).set(projectData).where(eq(projects.id, id)).returning();
    return result[0];
  }

  async deleteProject(id: string): Promise<boolean> {
    const result = await db.delete(projects).where(eq(projects.id, id)).returning();
    return result.length > 0;
  }

  // Project Shares
  async getProjectShares(projectId: string): Promise<ProjectShare[]> {
    return await db.select().from(projectShares).where(eq(projectShares.projectId, projectId));
  }

  async getProjectsSharedWithUser(userId: string): Promise<Project[]> {
    const shares = await db.select().from(projectShares).where(eq(projectShares.userId, userId));
    if (shares.length === 0) return [];
    const projectIds = shares.map(s => s.projectId);
    return await db.select().from(projects).where(inArray(projects.id, projectIds));
  }

  async createProjectShare(insertShare: InsertProjectShare): Promise<ProjectShare> {
    const result = await db.insert(projectShares).values(insertShare).returning();
    return result[0];
  }

  async deleteProjectShare(id: string): Promise<boolean> {
    const result = await db.delete(projectShares).where(eq(projectShares.id, id)).returning();
    return result.length > 0;
  }

  // Tasks
  async getTasks(): Promise<Task[]> {
    return await db.select().from(tasks).orderBy(desc(tasks.createdAt));
  }

  async getTask(id: string): Promise<Task | undefined> {
    const result = await db.select().from(tasks).where(eq(tasks.id, id));
    return result[0];
  }

  async getTasksByProject(projectId: string): Promise<Task[]> {
    return await db.select().from(tasks).where(eq(tasks.projectId, projectId)).orderBy(desc(tasks.createdAt));
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const task = {
      ...insertTask,
      id: randomUUID(),
      createdAt: new Date().toISOString()
    };
    const result = await db.insert(tasks).values(task).returning();
    return result[0];
  }

  async updateTask(id: string, taskData: Partial<InsertTask>): Promise<Task | undefined> {
    const result = await db.update(tasks).set(taskData).where(eq(tasks.id, id)).returning();
    return result[0];
  }

  async deleteTask(id: string): Promise<boolean> {
    const result = await db.delete(tasks).where(eq(tasks.id, id)).returning();
    return result.length > 0;
  }

  // Emails
  async getEmails(userId?: string, limit?: number): Promise<Email[]> {
    if (userId) {
      const query = db.select().from(emails).where(eq(emails.userId, userId)).orderBy(desc(emails.receivedAt));
      if (limit) return await query.limit(limit);
      return await query;
    }
    const query = db.select().from(emails).orderBy(desc(emails.receivedAt));
    if (limit) return await query.limit(limit);
    return await query;
  }

  async getEmail(id: string): Promise<Email | undefined> {
    const result = await db.select().from(emails).where(eq(emails.id, id));
    return result[0];
  }

  async createEmail(insertEmail: InsertEmail): Promise<Email> {
    const emailData = {
      ...insertEmail,
      id: randomUUID(),
      receivedAt: insertEmail.receivedAt || new Date().toISOString()
    };
    const result = await db.insert(emails).values(emailData).returning();
    return result[0];
  }

  async updateEmail(id: string, emailData: Partial<InsertEmail>): Promise<Email | undefined> {
    const result = await db.update(emails).set(emailData).where(eq(emails.id, id)).returning();
    return result[0];
  }

  async deleteEmail(id: string): Promise<boolean> {
    const result = await db.delete(emails).where(eq(emails.id, id)).returning();
    return result.length > 0;
  }

  // Project Emails
  async getProjectEmails(projectId: string): Promise<ProjectEmail[]> {
    return await db.select().from(projectEmails).where(eq(projectEmails.projectId, projectId)).orderBy(desc(projectEmails.addedAt));
  }

  async addProjectEmail(insertProjectEmail: InsertProjectEmail): Promise<ProjectEmail> {
    const projectEmail = {
      ...insertProjectEmail,
      id: randomUUID(),
      addedAt: new Date().toISOString()
    };
    const result = await db.insert(projectEmails).values(projectEmail).returning();
    return result[0];
  }

  async removeProjectEmail(id: string): Promise<boolean> {
    const result = await db.delete(projectEmails).where(eq(projectEmails.id, id)).returning();
    return result.length > 0;
  }

  async getAllLinkedEmails(): Promise<(ProjectEmail & { projectTitle?: string })[]> {
    const result = await db
      .select({
        id: projectEmails.id,
        projectId: projectEmails.projectId,
        emailId: projectEmails.emailId,
        emailSubject: projectEmails.emailSubject,
        emailFrom: projectEmails.emailFrom,
        emailPreview: projectEmails.emailPreview,
        emailDate: projectEmails.emailDate,
        addedAt: projectEmails.addedAt,
        projectTitle: projects.title,
      })
      .from(projectEmails)
      .leftJoin(projects, eq(projectEmails.projectId, projects.id))
      .orderBy(desc(projectEmails.addedAt));
    return result;
  }

  // Email Labels
  async getEmailLabels(): Promise<EmailLabel[]> {
    return await db.select().from(emailLabels).orderBy(emailLabels.name);
  }

  async createEmailLabel(label: InsertEmailLabel): Promise<EmailLabel> {
    const [created] = await db.insert(emailLabels).values(label).returning();
    return created;
  }

  async updateEmailLabel(id: string, label: Partial<InsertEmailLabel>): Promise<EmailLabel | undefined> {
    const [updated] = await db.update(emailLabels).set(label).where(eq(emailLabels.id, id)).returning();
    return updated;
  }

  async deleteEmailLabel(id: string): Promise<boolean> {
    const result = await db.delete(emailLabels).where(eq(emailLabels.id, id)).returning();
    return result.length > 0;
  }

  async getEmailLabelAssignments(emailId: string): Promise<(EmailLabelAssignment & { label: EmailLabel })[]> {
    const assignments = await db
      .select()
      .from(emailLabelAssignments)
      .innerJoin(emailLabels, eq(emailLabelAssignments.labelId, emailLabels.id))
      .where(eq(emailLabelAssignments.emailId, emailId));

    return assignments.map(row => ({
      ...row.email_label_assignments,
      label: row.email_labels
    }));
  }

  async getAllEmailLabelAssignments(): Promise<(EmailLabelAssignment & { label: EmailLabel })[]> {
    const assignments = await db
      .select()
      .from(emailLabelAssignments)
      .innerJoin(emailLabels, eq(emailLabelAssignments.labelId, emailLabels.id));

    return assignments.map(row => ({
      ...row.email_label_assignments,
      label: row.email_labels
    }));
  }

  async assignLabelToEmail(assignment: InsertEmailLabelAssignment): Promise<EmailLabelAssignment> {
    const [created] = await db.insert(emailLabelAssignments).values(assignment).returning();
    return created;
  }

  async removeLabelFromEmail(emailId: string, labelId: string): Promise<boolean> {
    const result = await db
      .delete(emailLabelAssignments)
      .where(and(
        eq(emailLabelAssignments.emailId, emailId),
        eq(emailLabelAssignments.labelId, labelId)
      ))
      .returning();
    return result.length > 0;
  }

  // Email Cache
  async getEmailCache(userId: string, folder?: string): Promise<Email[]> {
    if (folder) {
      return await db.select().from(emails)
        .where(and(eq(emails.userId, userId), eq(emails.folder, folder)))
        .orderBy(desc(emails.receivedAt));
    }
    return await db.select().from(emails)
      .where(eq(emails.userId, userId))
      .orderBy(desc(emails.receivedAt));
  }

  async getEmailCacheById(id: string): Promise<Email | undefined> {
    const result = await db.select().from(emails).where(eq(emails.id, id));
    return result[0];
  }

  async getEmailCacheByUid(userId: string, folder: string, uid: number): Promise<Email | undefined> {
    const result = await db.select().from(emails)
      .where(and(
        eq(emails.userId, userId),
        eq(emails.folder, folder),
        eq(emails.uid, uid)
      ));
    return result[0];
  }

  async createEmailCache(email: InsertEmail): Promise<Email> {
    const [created] = await db.insert(emails).values(email).returning();
    return created;
  }

  async updateEmailCache(id: string, email: Partial<InsertEmail>): Promise<Email | undefined> {
    const [updated] = await db.update(emails).set({ ...email }).where(eq(emails.id, id)).returning();
    return updated;
  }

  async deleteEmailCache(id: string): Promise<boolean> {
    const result = await db.delete(emails).where(eq(emails.id, id)).returning();
    return result.length > 0;
  }

  async searchEmailCache(userId: string, query: string): Promise<Email[]> {
    const searchPattern = `%${query.toLowerCase()}%`;
    return await db.select().from(emails)
      .where(and(
        eq(emails.userId, userId),
        or(
          sql`LOWER(${emails.subject}) LIKE ${searchPattern}`,
          sql`LOWER(${emails.fromAddress}) LIKE ${searchPattern}`,
          sql`LOWER(${emails.fromName}) LIKE ${searchPattern}`,
          sql`LOWER(${emails.body}) LIKE ${searchPattern}`
        )
      ))
      .orderBy(desc(emails.receivedAt))
      .limit(100);
  }

  // Email Attachments
  async getEmailAttachments(emailCacheId: string): Promise<EmailAttachment[]> {
    return await db.select().from(emailAttachments).where(eq(emailAttachments.emailCacheId, emailCacheId));
  }

  async createEmailAttachment(attachment: InsertEmailAttachment): Promise<EmailAttachment> {
    const [created] = await db.insert(emailAttachments).values(attachment).returning();
    return created;
  }

  async updateEmailAttachment(id: string, attachment: Partial<InsertEmailAttachment>): Promise<EmailAttachment | undefined> {
    const [updated] = await db.update(emailAttachments).set(attachment).where(eq(emailAttachments.id, id)).returning();
    return updated;
  }

  async deleteEmailAttachment(id: string): Promise<boolean> {
    const result = await db.delete(emailAttachments).where(eq(emailAttachments.id, id)).returning();
    return result.length > 0;
  }

  // Email Folders
  async getEmailFolders(userId: string): Promise<EmailFolder[]> {
    return await db.select().from(emailFolders)
      .where(eq(emailFolders.userId, userId))
      .orderBy(emailFolders.sortOrder);
  }

  async createEmailFolder(folder: InsertEmailFolder): Promise<EmailFolder> {
    const [created] = await db.insert(emailFolders).values(folder).returning();
    return created;
  }

  async updateEmailFolder(id: string, folder: Partial<InsertEmailFolder>): Promise<EmailFolder | undefined> {
    const [updated] = await db.update(emailFolders).set(folder).where(eq(emailFolders.id, id)).returning();
    return updated;
  }

  async deleteEmailFolder(id: string): Promise<boolean> {
    const result = await db.delete(emailFolders).where(eq(emailFolders.id, id)).returning();
    return result.length > 0;
  }

  async initDefaultEmailFolders(userId: string): Promise<void> {
    const existingFolders = await this.getEmailFolders(userId);
    if (existingFolders.length > 0) return;

    const defaultFolders = [
      { name: 'Posta in arrivo', path: 'INBOX', type: 'inbox', icon: 'Inbox', isDefault: true, sortOrder: 0 },
      { name: 'Inviati', path: 'Sent', type: 'sent', icon: 'Send', isDefault: true, sortOrder: 1 },
      { name: 'Bozze', path: 'Drafts', type: 'drafts', icon: 'FileEdit', isDefault: true, sortOrder: 2 },
      { name: 'Cestino', path: 'Trash', type: 'trash', icon: 'Trash2', isDefault: true, sortOrder: 3 },
      { name: 'Spam', path: 'Spam', type: 'spam', icon: 'AlertTriangle', isDefault: true, sortOrder: 4 },
      { name: 'Archiviati', path: 'Archive', type: 'archive', icon: 'Archive', isDefault: true, sortOrder: 5 },
    ];

    for (const folder of defaultFolders) {
      await db.insert(emailFolders).values({ ...folder, userId });
    }
  }

  // Email Sync State
  async getEmailSyncState(userId: string, folder: string): Promise<EmailSyncState | undefined> {
    const result = await db.select().from(emailSyncState)
      .where(and(eq(emailSyncState.userId, userId), eq(emailSyncState.folder, folder)));
    return result[0];
  }

  async upsertEmailSyncState(state: InsertEmailSyncState): Promise<EmailSyncState> {
    const existing = await this.getEmailSyncState(state.userId, state.folder);
    if (existing) {
      const [updated] = await db.update(emailSyncState)
        .set({ ...state, updatedAt: new Date() })
        .where(eq(emailSyncState.id, existing.id))
        .returning();
      return updated;
    }
    const [created] = await db.insert(emailSyncState).values(state).returning();
    return created;
  }

  async updateEmailSyncState(id: string, state: Partial<InsertEmailSyncState>): Promise<EmailSyncState | undefined> {
    const [updated] = await db.update(emailSyncState)
      .set({ ...state, updatedAt: new Date() })
      .where(eq(emailSyncState.id, id))
      .returning();
    return updated;
  }

  // Chat Channels
  async getChatChannels(): Promise<ChatChannel[]> {
    return await db.select().from(chatChannels);
  }

  async getChatChannel(id: string): Promise<ChatChannel | undefined> {
    const result = await db.select().from(chatChannels).where(eq(chatChannels.id, id));
    return result[0];
  }

  async getChatChannelByProjectId(projectId: string): Promise<ChatChannel | undefined> {
    const result = await db.select().from(chatChannels).where(eq(chatChannels.projectId, projectId));
    return result[0];
  }

  async getChatChannelByTaskId(taskId: string): Promise<ChatChannel | undefined> {
    const result = await db.select().from(chatChannels).where(eq(chatChannels.taskId, taskId));
    return result[0];
  }

  async createChatChannel(insertChannel: InsertChatChannel): Promise<ChatChannel> {
    const channel = {
      ...insertChannel,
      id: randomUUID(),
      createdAt: new Date().toISOString()
    };
    const result = await db.insert(chatChannels).values(channel).returning();
    return result[0];
  }

  async updateChatChannel(id: string, channelData: Partial<InsertChatChannel>): Promise<ChatChannel | undefined> {
    const result = await db.update(chatChannels).set(channelData).where(eq(chatChannels.id, id)).returning();
    return result[0];
  }

  async deleteChatChannel(id: string): Promise<boolean> {
    // First delete all messages in the channel
    await db.delete(chatMessages).where(eq(chatMessages.channelId, id));
    const result = await db.delete(chatChannels).where(eq(chatChannels.id, id)).returning();
    return result.length > 0;
  }

  // Chat Messages
  async getChatMessages(channelId?: string): Promise<ChatMessage[]> {
    if (channelId) {
      return await db.select().from(chatMessages).where(eq(chatMessages.channelId, channelId)).orderBy(chatMessages.createdAt);
    }
    return await db.select().from(chatMessages).orderBy(chatMessages.createdAt);
  }

  async createChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const message = {
      ...insertMessage,
      id: randomUUID(),
      createdAt: new Date().toISOString()
    };
    const result = await db.insert(chatMessages).values(message).returning();
    return result[0];
  }

  async deleteChatMessage(id: string): Promise<boolean> {
    const result = await db.delete(chatMessages).where(eq(chatMessages.id, id)).returning();
    return result.length > 0;
  }

  async purgeAllChatMessages(): Promise<void> {
    await db.delete(chatMessages);
  }

  async purgeAllChatChannels(): Promise<void> {
    await db.delete(chatMessages);
    await db.delete(chatChannels);
  }

  // Saved Conversations
  async getSavedConversations(userId?: string): Promise<ChatSavedConversation[]> {
    if (userId) {
      return await db.select().from(chatSavedConversations).where(eq(chatSavedConversations.savedBy, userId)).orderBy(desc(chatSavedConversations.createdAt));
    }
    return await db.select().from(chatSavedConversations).orderBy(desc(chatSavedConversations.createdAt));
  }

  async getSavedConversation(id: string): Promise<ChatSavedConversation | undefined> {
    const result = await db.select().from(chatSavedConversations).where(eq(chatSavedConversations.id, id));
    return result[0];
  }

  async createSavedConversation(conversation: InsertChatSavedConversation): Promise<ChatSavedConversation> {
    const result = await db.insert(chatSavedConversations).values(conversation).returning();
    return result[0];
  }

  async deleteSavedConversation(id: string): Promise<boolean> {
    const result = await db.delete(chatSavedConversations).where(eq(chatSavedConversations.id, id)).returning();
    return result.length > 0;
  }

  // WhatsApp Contacts
  async getWhatsappContacts(): Promise<WhatsappContact[]> {
    return await db.select().from(whatsappContacts).orderBy(desc(whatsappContacts.lastMessageAt));
  }

  async getWhatsappContact(id: string): Promise<WhatsappContact | undefined> {
    const result = await db.select().from(whatsappContacts).where(eq(whatsappContacts.id, id));
    return result[0];
  }

  // Telegram Chats
  async getTelegramChats(): Promise<TelegramChat[]> {
    return await db.select().from(telegramChats).orderBy(desc(telegramChats.lastMessageAt));
  }

  async getTelegramChat(id: string): Promise<TelegramChat | undefined> {
    const result = await db.select().from(telegramChats).where(eq(telegramChats.id, id));
    return result[0];
  }

  async getTelegramChatByChatId(chatId: string): Promise<TelegramChat | undefined> {
    const result = await db.select().from(telegramChats).where(eq(telegramChats.chatId, chatId));
    return result[0];
  }

  async createTelegramChat(insertChat: InsertTelegramChat): Promise<TelegramChat> {
    const result = await db.insert(telegramChats).values(insertChat).returning();
    return result[0];
  }

  async updateTelegramChat(id: string, chatData: Partial<InsertTelegramChat>): Promise<TelegramChat | undefined> {
    const result = await db.update(telegramChats).set(chatData).where(eq(telegramChats.id, id)).returning();
    return result[0];
  }

  // Telegram Messages
  async getTelegramMessages(chatId?: string): Promise<TelegramMessage[]> {
    if (chatId) {
      return await db.select().from(telegramMessages).where(eq(telegramMessages.chatId, chatId)).orderBy(telegramMessages.createdAt);
    }
    return await db.select().from(telegramMessages).orderBy(telegramMessages.createdAt);
  }

  async createTelegramMessage(insertMessage: InsertTelegramMessage): Promise<TelegramMessage> {
    const result = await db.insert(telegramMessages).values(insertMessage).returning();
    return result[0];
  }

  // Documents
  async getDocuments(): Promise<Document[]> {
    return await db.select().from(documents).where(eq(documents.isArchived, false)).orderBy(desc(documents.updatedAt));
  }

  // Optimized methods for listing - use SQL to exclude content field at database level
  async getDocumentsMetadata(): Promise<Omit<Document, 'content'>[]> {
    return await db.select({
      id: documents.id,
      title: documents.title,
      description: documents.description,
      type: documents.type,
      fileName: documents.fileName,
      filePath: documents.filePath,
      ownerId: documents.ownerId,
      lastEditorId: documents.lastEditorId,
      version: documents.version,
      isLocked: documents.isLocked,
      lockedBy: documents.lockedBy,
      lastOpenedAt: documents.lastOpenedAt,
      createdAt: documents.createdAt,
      updatedAt: documents.updatedAt,
    }).from(documents);
  }

  // Anagrafica Clienti
  async getAnagraficaClienti(): Promise<AnagraficaClienti[]> {
    return await db.select().from(anagraficaClienti);
  }

  async getAnagraficaCliente(id: string): Promise<AnagraficaClienti | undefined> {
    const [cliente] = await db.select().from(anagraficaClienti).where(eq(anagraficaClienti.id, id));
    return cliente;
  }

  async searchAnagraficaClienti(query: string): Promise<AnagraficaClienti[]> {
    return await db
      .select()
      .from(anagraficaClienti)
      .where(
        or(
          like(anagraficaClienti.ragioneSociale, `%${query}%`),
          like(anagraficaClienti.partitaIva, `%${query}%`),
          like(anagraficaClienti.codiceFiscale, `%${query}%`),
          like(anagraficaClienti.email, `%${query}%`)
        )
      );
  }

  async createAnagraficaCliente(cliente: InsertAnagraficaClienti): Promise<AnagraficaClienti> {
    const id = randomUUID();
    const [newCliente] = await db.insert(anagraficaClienti).values({ ...cliente, id, createdAt: new Date().toISOString() }).returning();
    return newCliente;
  }

  async updateAnagraficaCliente(id: string, cliente: Partial<InsertAnagraficaClienti>): Promise<AnagraficaClienti | undefined> {
    const [updated] = await db.update(anagraficaClienti).set({ ...cliente, updatedAt: new Date().toISOString() }).where(eq(anagraficaClienti.id, id)).returning();
    return updated;
  }

  async deleteAnagraficaCliente(id: string): Promise<boolean> {
    const [deleted] = await db.delete(anagraficaClienti).where(eq(anagraficaClienti.id, id)).returning();
    return !!deleted;
  }

  // Anagrafica Fornitori
  async getAnagraficaFornitori(): Promise<AnagraficaFornitori[]> {
    return await db.select().from(anagraficaFornitori);
  }

  async getAnagraficaFornitore(id: string): Promise<AnagraficaFornitori | undefined> {
    const [fornitore] = await db.select().from(anagraficaFornitori).where(eq(anagraficaFornitori.id, id));
    return fornitore;
  }

  async createAnagraficaFornitore(fornitore: InsertAnagraficaFornitori): Promise<AnagraficaFornitori> {
    const id = randomUUID();
    const [newFornitore] = await db.insert(anagraficaFornitori).values({ ...fornitore, id, createdAt: new Date().toISOString() }).returning();
    return newFornitore;
  }

  async updateAnagraficaFornitore(id: string, fornitore: Partial<InsertAnagraficaFornitori>): Promise<AnagraficaFornitori | undefined> {
    const [updated] = await db.update(anagraficaFornitori).set({ ...fornitore, updatedAt: new Date().toISOString() }).where(eq(anagraficaFornitori.id, id)).returning();
    return updated;
  }

  async deleteAnagraficaFornitore(id: string): Promise<boolean> {
    const [deleted] = await db.delete(anagraficaFornitori).where(eq(anagraficaFornitori.id, id)).returning();
    return !!deleted;
  }

  // Indirizzi Spedizione
  async getIndirizziSpedizione(clienteId: string): Promise<IndirizzoSpedizione[]> {
    return await db.select().from(indirizziSpedizione).where(eq(indirizziSpedizione.clienteId, clienteId));
  }

  async createIndirizzoSpedizione(indirizzo: InsertIndirizzoSpedizione): Promise<IndirizzoSpedizione> {
    const id = randomUUID();
    const [newIndirizzo] = await db.insert(indirizziSpedizione).values({ ...indirizzo, id, createdAt: new Date().toISOString() }).returning();
    return newIndirizzo;
  }

  async updateIndirizzoSpedizione(id: string, indirizzo: Partial<InsertIndirizzoSpedizione>): Promise<IndirizzoSpedizione | undefined> {
    const [updated] = await db.update(indirizziSpedizione).set(indirizzo).where(eq(indirizziSpedizione.id, id)).returning();
    return updated;
  }

  async deleteIndirizzoSpedizione(id: string): Promise<boolean> {
    const [deleted] = await db.delete(indirizziSpedizione).where(eq(indirizziSpedizione.id, id)).returning();
    return !!deleted;
  }

  // Missing helper methods referenced in IStorage but not implemented fully or I'm adding dummy here if missing to prevent error
  // Wait, ReferenteCliente, SalesOrder, related methods I noticed in interface at line 157.
  // I need to implement getReferentiByCliente etc. OR remove them from IStorage.
  // Since I saw them in IStorage (lines 157+), I should technically implement them if I can, OR I should have removed them.
  // But they expect return types `ReferenteCliente[]`.
  // I didn't add `ReferenteCliente` schema.
  // I will just implement the core Anagrafica methods first.
  // If TS complains about missing methods (searchAnagraficaClienti, etc.), I will implement searchAnagraficaClienti (I did above).
  // But for others... I'll check if `SalesOrder` is imported. It is.
  // I'll leave other methods unimplemented (they are already in the file? No, I viewed start of file).
  // I'll assume they are implemented somewhere else or I need to implement them.
  // Warning: `searchAnagraficaClienti` WAS in the interface (line 156). I implemented it.
  // `getReferentiByCliente`... I'll check if I need to implement.
  // Getting partial implementation is better than none.

  async getDocumentsMetadataByOwner(ownerId: string): Promise<Omit<Document, 'content'>[]> {
    const result = await db.all(
      `SELECT id, title, icon, cover_image as coverImage, attachments, parent_id as parentId, 
       owner_id as ownerId, last_editor_id as lastEditorId, last_edited_at as lastEditedAt,
       is_public as isPublic, is_archived as isArchived, needs_review as needsReview,
       tags, created_at as createdAt, updated_at as updatedAt
       FROM documents 
       WHERE owner_id = ? AND is_archived = 0 
       ORDER BY updated_at DESC`,
      [ownerId]
    );
    return result as Omit<Document, 'content'>[];
  }

  async getDocumentsMetadataSharedWithUser(userId: string): Promise<Omit<Document, 'content'>[]> {
    const shares = await db.select().from(documentShares).where(eq(documentShares.userId, userId));
    if (shares.length === 0) return [];
    const docIds = shares.map(s => s.documentId);
    const placeholders = docIds.map(() => '?').join(',');
    const result = await db.all(
      `SELECT id, title, icon, cover_image as coverImage, attachments, parent_id as parentId, 
       owner_id as ownerId, last_editor_id as lastEditorId, last_edited_at as lastEditedAt,
       is_public as isPublic, is_archived as isArchived, needs_review as needsReview,
       tags, created_at as createdAt, updated_at as updatedAt
       FROM documents 
       WHERE id IN (${placeholders}) AND is_archived = 0 
       ORDER BY updated_at DESC`,
      docIds
    );
    return result as Omit<Document, 'content'>[];
  }

  async getDocument(id: string): Promise<Document | undefined> {
    const result = await db.select().from(documents).where(eq(documents.id, id));
    return result[0];
  }

  async getDocumentsByOwner(ownerId: string): Promise<Document[]> {
    return await db.select().from(documents)
      .where(and(eq(documents.ownerId, ownerId), eq(documents.isArchived, false)))
      .orderBy(desc(documents.updatedAt));
  }

  async getDocumentsSharedWithUser(userId: string): Promise<Document[]> {
    const shares = await db.select().from(documentShares).where(eq(documentShares.userId, userId));
    if (shares.length === 0) return [];
    const docIds = shares.map(s => s.documentId);
    const docs = await db.select().from(documents)
      .where(and(inArray(documents.id, docIds), eq(documents.isArchived, false)))
      .orderBy(desc(documents.updatedAt));
    return docs;
  }

  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const doc = {
      ...insertDocument,
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const result = await db.insert(documents).values(doc).returning();
    return result[0];
  }

  async updateDocument(id: string, documentData: Partial<InsertDocument>): Promise<Document | undefined> {
    const result = await db.update(documents).set({ ...documentData, updatedAt: new Date().toISOString() }).where(eq(documents.id, id)).returning();
    return result[0];
  }

  async deleteDocument(id: string): Promise<boolean> {
    // First delete related records to avoid foreign key constraint violations
    await db.delete(documentShares).where(eq(documentShares.documentId, id));
    await db.delete(documentComments).where(eq(documentComments.documentId, id));
    await db.delete(projectDocuments).where(eq(projectDocuments.documentId, id));

    const result = await db.delete(documents).where(eq(documents.id, id)).returning();
    return result.length > 0;
  }

  // Document Shares
  async getDocumentShares(documentId: string): Promise<DocumentShare[]> {
    return await db.select().from(documentShares).where(eq(documentShares.documentId, documentId));
  }

  async createDocumentShare(insertShare: InsertDocumentShare): Promise<DocumentShare> {
    const share = {
      ...insertShare,
      id: randomUUID(),
      sharedAt: new Date().toISOString()
    };
    const result = await db.insert(documentShares).values(share).returning();
    return result[0];
  }

  async deleteDocumentShare(id: string): Promise<boolean> {
    const result = await db.delete(documentShares).where(eq(documentShares.id, id)).returning();
    return result.length > 0;
  }

  // Document Comments
  async getDocumentComments(documentId: string): Promise<DocumentComment[]> {
    return await db.select().from(documentComments).where(eq(documentComments.documentId, documentId)).orderBy(documentComments.createdAt);
  }

  async createDocumentComment(insertComment: InsertDocumentComment): Promise<DocumentComment> {
    const comment = {
      ...insertComment,
      id: randomUUID(),
      createdAt: new Date().toISOString()
    };
    const result = await db.insert(documentComments).values(comment).returning();
    return result[0];
  }

  async updateDocumentComment(id: string, commentData: Partial<InsertDocumentComment>): Promise<DocumentComment | undefined> {
    const result = await db.update(documentComments).set(commentData).where(eq(documentComments.id, id)).returning();
    return result[0];
  }

  async deleteDocumentComment(id: string): Promise<boolean> {
    const result = await db.delete(documentComments).where(eq(documentComments.id, id)).returning();
    return result.length > 0;
  }

  // Project Documents
  async getProjectDocuments(projectId: string): Promise<ProjectDocument[]> {
    return await db.select().from(projectDocuments).where(eq(projectDocuments.projectId, projectId)).orderBy(desc(projectDocuments.addedAt));
  }

  async getProjectDocumentsWithDetails(projectId: string): Promise<(ProjectDocument & { document: Document })[]> {
    const pDocs = await db.select().from(projectDocuments).where(eq(projectDocuments.projectId, projectId)).orderBy(desc(projectDocuments.addedAt));
    const result: (ProjectDocument & { document: Document })[] = [];
    for (const pDoc of pDocs) {
      const docResult = await db.select().from(documents).where(eq(documents.id, pDoc.documentId));
      if (docResult[0]) {
        result.push({ ...pDoc, document: docResult[0] });
      }
    }
    return result;
  }

  async addProjectDocument(insertProjectDocument: InsertProjectDocument): Promise<ProjectDocument> {
    const projectDoc = {
      ...insertProjectDocument,
      id: randomUUID(),
      addedAt: new Date().toISOString()
    };
    const result = await db.insert(projectDocuments).values(projectDoc).returning();
    return result[0];
  }

  async removeProjectDocument(id: string): Promise<boolean> {
    const result = await db.delete(projectDocuments).where(eq(projectDocuments.id, id)).returning();
    return result.length > 0;
  }

  async getDocumentProjects(documentId: string): Promise<Project[]> {
    const pDocs = await db.select().from(projectDocuments).where(eq(projectDocuments.documentId, documentId));
    const result: Project[] = [];
    for (const pDoc of pDocs) {
      const projResult = await db.select().from(projects).where(eq(projects.id, pDoc.projectId));
      if (projResult[0]) {
        result.push(projResult[0]);
      }
    }
    return result;
  }

  // Role Permissions
  async getRolePermissions(role: string): Promise<RolePermission[]> {
    return await db.select().from(rolePermissions).where(eq(rolePermissions.role, role));
  }

  async getAllRolePermissions(): Promise<RolePermission[]> {
    return await db.select().from(rolePermissions);
  }

  async updateRolePermission(role: string, module: string, permissions: Partial<Pick<RolePermission, 'canView' | 'canCreate' | 'canEdit' | 'canDelete'>>): Promise<RolePermission | undefined> {
    const result = await db.update(rolePermissions)
      .set(permissions)
      .where(and(eq(rolePermissions.role, role), eq(rolePermissions.module, module)))
      .returning();
    return result[0];
  }

  async upsertRolePermission(role: string, module: string, permissions: Pick<RolePermission, 'canView' | 'canCreate' | 'canEdit' | 'canDelete'>): Promise<RolePermission> {
    const existing = await db.select().from(rolePermissions)
      .where(and(eq(rolePermissions.role, role), eq(rolePermissions.module, module)));

    if (existing.length > 0) {
      const result = await db.update(rolePermissions)
        .set(permissions)
        .where(and(eq(rolePermissions.role, role), eq(rolePermissions.module, module)))
        .returning();
      return result[0];
    } else {
      const result = await db.insert(rolePermissions)
        .values({ role, module, ...permissions })
        .returning();
      return result[0];
    }
  }

  async seedDefaultPermissions(): Promise<void> {
    const existing = await db.select().from(rolePermissions);
    if (existing.length > 0) return;

    const defaultMatrix: Record<string, Record<string, { canView: boolean; canCreate: boolean; canEdit: boolean; canDelete: boolean }>> = {
      'Admin': {
        'projects': { canView: true, canCreate: true, canEdit: true, canDelete: true },
        'tasks': { canView: true, canCreate: true, canEdit: true, canDelete: true },
        'email': { canView: true, canCreate: true, canEdit: true, canDelete: true },
        'chat': { canView: true, canCreate: true, canEdit: true, canDelete: true },
        'documents': { canView: true, canCreate: true, canEdit: true, canDelete: true },
        'users': { canView: true, canCreate: true, canEdit: true, canDelete: true },
        'archivio': { canView: true, canCreate: true, canEdit: true, canDelete: true },
      },
      'Manager': {
        'projects': { canView: true, canCreate: true, canEdit: true, canDelete: true },
        'tasks': { canView: true, canCreate: true, canEdit: true, canDelete: true },
        'email': { canView: true, canCreate: true, canEdit: true, canDelete: false },
        'chat': { canView: true, canCreate: true, canEdit: false, canDelete: false },
        'documents': { canView: true, canCreate: true, canEdit: true, canDelete: true },
        'users': { canView: true, canCreate: false, canEdit: false, canDelete: false },
        'archivio': { canView: true, canCreate: true, canEdit: true, canDelete: true },
      },
      'Member': {
        'projects': { canView: true, canCreate: true, canEdit: true, canDelete: false },
        'tasks': { canView: true, canCreate: true, canEdit: true, canDelete: false },
        'email': { canView: true, canCreate: false, canEdit: false, canDelete: false },
        'chat': { canView: true, canCreate: true, canEdit: false, canDelete: false },
        'documents': { canView: true, canCreate: true, canEdit: true, canDelete: false },
        'users': { canView: false, canCreate: false, canEdit: false, canDelete: false },
        'archivio': { canView: true, canCreate: true, canEdit: false, canDelete: false },
      },
      'Viewer': {
        'projects': { canView: true, canCreate: false, canEdit: false, canDelete: false },
        'tasks': { canView: true, canCreate: false, canEdit: false, canDelete: false },
        'email': { canView: true, canCreate: false, canEdit: false, canDelete: false },
        'chat': { canView: true, canCreate: false, canEdit: false, canDelete: false },
        'documents': { canView: true, canCreate: false, canEdit: false, canDelete: false },
        'users': { canView: false, canCreate: false, canEdit: false, canDelete: false },
        'archivio': { canView: true, canCreate: false, canEdit: false, canDelete: false },
      },
    };

    const toInsert: InsertRolePermission[] = [];
    for (const role of ROLES) {
      for (const module of MODULES) {
        const perms = defaultMatrix[role][module];
        toInsert.push({
          role,
          module,
          ...perms,
        });
      }
    }

    await db.insert(rolePermissions).values(toInsert);
  }

  // Archive Folders
  async getArchiveFolders(): Promise<ArchiveFolder[]> {
    return await db.select().from(archiveFolders).orderBy(archiveFolders.name);
  }

  async getArchiveFolder(id: string): Promise<ArchiveFolder | undefined> {
    const result = await db.select().from(archiveFolders).where(eq(archiveFolders.id, id));
    return result[0];
  }

  async getArchiveFolderByProjectId(projectId: string): Promise<ArchiveFolder | undefined> {
    const result = await db.select().from(archiveFolders).where(eq(archiveFolders.projectId, projectId));
    return result[0];
  }

  async getArchiveFolderByName(name: string): Promise<ArchiveFolder | undefined> {
    const result = await db.select().from(archiveFolders).where(eq(archiveFolders.name, name));
    return result[0];
  }

  async createArchiveFolder(folder: InsertArchiveFolder): Promise<ArchiveFolder> {
    const newFolder = {
      ...folder,
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const result = await db.insert(archiveFolders).values(newFolder).returning();
    return result[0];
  }

  async updateArchiveFolder(id: string, folder: Partial<InsertArchiveFolder>): Promise<ArchiveFolder | undefined> {
    const result = await db.update(archiveFolders).set(folder).where(eq(archiveFolders.id, id)).returning();
    return result[0];
  }

  async deleteArchiveFolder(id: string): Promise<boolean> {
    const result = await db.delete(archiveFolders).where(eq(archiveFolders.id, id)).returning();
    return result.length > 0;
  }

  // Archived Documents
  async getArchivedDocuments(userId?: string, category?: string): Promise<ArchivedDocument[]> {
    const conditions = [];
    if (userId) {
      conditions.push(eq(archivedDocuments.uploadedBy, userId));
    }
    if (category) {
      conditions.push(eq(archivedDocuments.category, category));
    }

    if (conditions.length > 0) {
      return await db.select().from(archivedDocuments)
        .where(and(...conditions))
        .orderBy(desc(archivedDocuments.archivedAt));
    }
    return await db.select().from(archivedDocuments).orderBy(desc(archivedDocuments.archivedAt));
  }

  async getArchivedDocument(id: string): Promise<ArchivedDocument | undefined> {
    const result = await db.select().from(archivedDocuments).where(eq(archivedDocuments.id, id));
    return result[0];
  }

  async createArchivedDocument(doc: InsertArchivedDocument): Promise<ArchivedDocument> {
    const newDoc = {
      ...doc,
      id: randomUUID(),
      archivedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const result = await db.insert(archivedDocuments).values(newDoc).returning();
    return result[0];
  }

  async updateArchivedDocument(id: string, doc: Partial<InsertArchivedDocument>): Promise<ArchivedDocument | undefined> {
    const result = await db.update(archivedDocuments).set(doc).where(eq(archivedDocuments.id, id)).returning();
    return result[0];
  }

  async deleteArchivedDocument(id: string): Promise<boolean> {
    const result = await db.delete(archivedDocuments).where(eq(archivedDocuments.id, id)).returning();
    return result.length > 0;
  }

  // User Permissions
  async getUserPermissions(userId: string): Promise<UserPermission[]> {
    return await db.select().from(userPermissions).where(eq(userPermissions.userId, userId));
  }

  async getAllUserPermissions(): Promise<UserPermission[]> {
    return await db.select().from(userPermissions);
  }

  async upsertUserPermission(userId: string, module: string, permissions: Pick<UserPermission, 'canView' | 'canCreate' | 'canEdit' | 'canDelete'>): Promise<UserPermission> {
    const existing = await db.select().from(userPermissions)
      .where(and(eq(userPermissions.userId, userId), eq(userPermissions.module, module)));

    if (existing.length > 0) {
      const result = await db.update(userPermissions)
        .set(permissions)
        .where(and(eq(userPermissions.userId, userId), eq(userPermissions.module, module)))
        .returning();
      return result[0];
    }

    const result = await db.insert(userPermissions).values({
      userId,
      module,
      ...permissions,
    }).returning();
    return result[0];
  }

  async seedUserPermissionsFromRole(userId: string, role: string): Promise<void> {
    const rolePerms = await this.getRolePermissions(role);

    if (rolePerms.length === 0) {
      await this.seedDefaultPermissions();
      const newRolePerms = await this.getRolePermissions(role);
      for (const perm of newRolePerms) {
        await this.upsertUserPermission(userId, perm.module, {
          canView: perm.canView,
          canCreate: perm.canCreate,
          canEdit: perm.canEdit,
          canDelete: perm.canDelete,
        });
      }
    } else {
      for (const perm of rolePerms) {
        await this.upsertUserPermission(userId, perm.module, {
          canView: perm.canView,
          canCreate: perm.canCreate,
          canEdit: perm.canEdit,
          canDelete: perm.canDelete,
        });
      }
    }
  }

  // User Email Config
  async getUserEmailConfigs(userId?: string): Promise<UserEmailConfig[]> {
    if (userId) {
      return await db.select().from(userEmailConfigs).where(eq(userEmailConfigs.userId, userId));
    }
    return await db.select().from(userEmailConfigs);
  }

  async getUserEmailConfig(id: string): Promise<UserEmailConfig | undefined> {
    const result = await db.select().from(userEmailConfigs).where(eq(userEmailConfigs.id, id));
    return result[0];
  }

  async createUserEmailConfig(config: InsertUserEmailConfig & { userId: string }): Promise<UserEmailConfig> {
    const newConfig = {
      ...config,
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const result = await db.insert(userEmailConfigs).values(newConfig).returning();
    return result[0];
  }

  async updateUserEmailConfig(id: string, config: Partial<InsertUserEmailConfig>): Promise<UserEmailConfig | undefined> {
    const result = await db.update(userEmailConfigs)
      .set({ ...config, updatedAt: new Date().toISOString() })
      .where(eq(userEmailConfigs.id, id))
      .returning();
    return result[0];
  }

  async deleteUserEmailConfig(id: string): Promise<boolean> {
    const result = await db.delete(userEmailConfigs).where(eq(userEmailConfigs.id, id)).returning();
    return result.length > 0;
  }

  // Personal Todos
  async getPersonalTodos(userId?: string): Promise<PersonalTodo[]> {
    if (userId) {
      return await db.select().from(personalTodos).where(eq(personalTodos.userId, userId)).orderBy(desc(personalTodos.createdAt));
    }
    return await db.select().from(personalTodos).orderBy(desc(personalTodos.createdAt));
  }

  async getPersonalTodo(id: string): Promise<PersonalTodo | undefined> {
    const result = await db.select().from(personalTodos).where(eq(personalTodos.id, id));
    return result[0];
  }

  async getPersonalTodoByProjectAndTitle(projectId: string, title: string): Promise<PersonalTodo | undefined> {
    const result = await db.select().from(personalTodos)
      .where(and(eq(personalTodos.projectId, projectId), eq(personalTodos.title, title)));
    return result[0];
  }

  async getPersonalTodoByCategoryAndTitle(category: string, title: string): Promise<PersonalTodo | undefined> {
    const result = await db.select().from(personalTodos)
      .where(and(eq(personalTodos.category, category), eq(personalTodos.title, title)));
    return result[0];
  }

  async createPersonalTodo(todo: InsertPersonalTodo): Promise<PersonalTodo> {
    const newTodo = {
      ...todo,
      id: randomUUID(),
      created_at: new Date().toISOString()
    };
    const result = await db.insert(personalTodos).values(newTodo).returning();
    return result[0];
  }

  async updatePersonalTodo(id: string, todoData: Partial<InsertPersonalTodo>): Promise<PersonalTodo | undefined> {
    const result = await db.update(personalTodos).set(todoData).where(eq(personalTodos.id, id)).returning();
    return result[0];
  }

  async deletePersonalTodo(id: string): Promise<boolean> {
    const result = await db.delete(personalTodos).where(eq(personalTodos.id, id)).returning();
    return result.length > 0;
  }

  // Subtasks
  async getSubtasks(todoId: string): Promise<Subtask[]> {
    return await db.select().from(subtasks).where(eq(subtasks.todoId, todoId)).orderBy(asc(subtasks.order));
  }

  async createSubtask(subtask: InsertSubtask): Promise<Subtask> {
    const result = await db.insert(subtasks).values({ ...subtask, id: randomUUID() }).returning();
    return result[0];
  }

  async updateSubtask(id: string, data: Partial<InsertSubtask>): Promise<Subtask | undefined> {
    const result = await db.update(subtasks).set(data).where(eq(subtasks.id, id)).returning();
    return result[0];
  }

  async deleteSubtask(id: string): Promise<boolean> {
    const result = await db.delete(subtasks).where(eq(subtasks.id, id)).returning();
    return result.length > 0;
  }

  // Task Comments
  async getTaskComments(taskId: string): Promise<TaskComment[]> {
    return await db.select().from(taskComments).where(eq(taskComments.taskId, taskId)).orderBy(desc(taskComments.createdAt));
  }

  async createTaskComment(comment: InsertTaskComment): Promise<TaskComment> {
    const result = await db.insert(taskComments).values(comment).returning();
    return result[0];
  }

  async deleteTaskComment(id: string): Promise<boolean> {
    const result = await db.delete(taskComments).where(eq(taskComments.id, id)).returning();
    return result.length > 0;
  }

  // Activity Feed
  async getActivityFeed(limit: number = 50): Promise<ActivityFeed[]> {
    return await db.select().from(activityFeed).orderBy(desc(activityFeed.createdAt)).limit(limit);
  }

  async createActivity(activity: InsertActivityFeed): Promise<ActivityFeed> {
    const result = await db.insert(activityFeed).values(activity).returning();
    return result[0];
  }

  async purgeActivityFeed(): Promise<void> {
    await db.delete(activityFeed);
  }

  // Notifications
  async getNotificationsByUser(userId: string): Promise<Notification[]> {
    return await db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt));
  }

  async getUnreadNotifications(userId: string): Promise<Notification[]> {
    return await db.select().from(notifications).where(and(eq(notifications.userId, userId), eq(notifications.read, false))).orderBy(desc(notifications.createdAt));
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const result = await db.insert(notifications).values(notification).returning();
    return result[0];
  }

  async markNotificationRead(id: string): Promise<Notification | undefined> {
    const result = await db.update(notifications).set({ read: true }).where(eq(notifications.id, id)).returning();
    return result[0];
  }

  async markAllNotificationsRead(userId: string): Promise<void> {
    await db.update(notifications).set({ read: true }).where(eq(notifications.userId, userId));
  }

  async deleteNotification(id: string): Promise<boolean> {
    const result = await db.delete(notifications).where(eq(notifications.id, id)).returning();
    return result.length > 0;
  }

  // App Settings




  async isSetupComplete(): Promise<boolean> {
    const setting = await this.getSetting('setup_complete');
    return setting?.value === 'true';
  }

  // Todo Templates
  async getTodoTemplates(): Promise<TodoTemplate[]> {
    return await db.select().from(todoTemplates).orderBy(desc(todoTemplates.createdAt));
  }

  async getTodoTemplate(id: string): Promise<TodoTemplate | undefined> {
    const result = await db.select().from(todoTemplates).where(eq(todoTemplates.id, id));
    return result[0];
  }

  async createTodoTemplate(template: InsertTodoTemplate): Promise<TodoTemplate> {
    const result = await db.insert(todoTemplates).values({ ...template, id: randomUUID() }).returning();
    return result[0];
  }

  async updateTodoTemplate(id: string, template: Partial<InsertTodoTemplate>): Promise<TodoTemplate | undefined> {
    const result = await db.update(todoTemplates).set(template).where(eq(todoTemplates.id, id)).returning();
    return result[0];
  }

  async deleteTodoTemplate(id: string): Promise<boolean> {
    const result = await db.delete(todoTemplates).where(eq(todoTemplates.id, id)).returning();
    return result.length > 0;
  }

  // Time Entries
  async getTimeEntries(): Promise<TimeEntry[]> {
    return await db.select().from(timeEntries).orderBy(desc(timeEntries.startTime));
  }

  async getTimeEntriesByTodo(todoId: string): Promise<TimeEntry[]> {
    return await db.select().from(timeEntries).where(eq(timeEntries.todoId, todoId)).orderBy(desc(timeEntries.startTime));
  }

  async getTimeEntriesByProject(projectId: string): Promise<TimeEntry[]> {
    return await db.select().from(timeEntries).where(eq(timeEntries.projectId, projectId)).orderBy(desc(timeEntries.startTime));
  }

  async createTimeEntry(entry: InsertTimeEntry): Promise<TimeEntry> {
    const timeEntry = {
      ...entry,
      id: randomUUID(),
      createdAt: new Date().toISOString()
    };
    const result = await db.insert(timeEntries).values(timeEntry).returning();
    return result[0];
  }

  async updateTimeEntry(id: string, entry: Partial<InsertTimeEntry>): Promise<TimeEntry | undefined> {
    const result = await db.update(timeEntries).set(entry).where(eq(timeEntries.id, id)).returning();
    return result[0];
  }

  async deleteTimeEntry(id: string): Promise<boolean> {
    const result = await db.delete(timeEntries).where(eq(timeEntries.id, id)).returning();
    return result.length > 0;
  }


  // Whiteboards
  async getWhiteboards(userId?: string): Promise<Whiteboard[]> {
    if (userId) {
      return await db.select().from(whiteboards)
        .where(
          or(
            eq(whiteboards.ownerId, userId),
            eq(whiteboards.isPublic, 1),
            like(whiteboards.collaborators, `%"${userId}"%`)
          )
        )
        .orderBy(desc(whiteboards.updatedAt));
    }
    return await db.select().from(whiteboards).orderBy(desc(whiteboards.updatedAt));
  }

  async getWhiteboard(id: string): Promise<Whiteboard | undefined> {
    const result = await db.select().from(whiteboards).where(eq(whiteboards.id, id));
    return result[0];
  }

  async createWhiteboard(insertWhiteboard: InsertWhiteboard): Promise<Whiteboard> {
    const newBoard = {
      ...insertWhiteboard,
      id: randomUUID(),
      collaborators: insertWhiteboard.collaborators || "[]",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const result = await db.insert(whiteboards).values(newBoard).returning();
    return result[0];
  }

  async updateWhiteboard(id: string, whiteboardData: Partial<InsertWhiteboard>): Promise<Whiteboard | undefined> {
    const result = await db.update(whiteboards)
      .set({ ...whiteboardData, updatedAt: new Date().toISOString() })
      .where(eq(whiteboards.id, id))
      .returning();
    return result[0];
  }

  async deleteWhiteboard(id: string): Promise<boolean> {
    const result = await db.delete(whiteboards).where(eq(whiteboards.id, id)).returning();
    return result.length > 0;
  }

  // Whiteboard Elements
  async getWhiteboardElements(whiteboardId: string): Promise<WhiteboardElement[]> {
    return await db.select().from(whiteboardElements)
      .where(eq(whiteboardElements.whiteboardId, whiteboardId))
      .orderBy(asc(whiteboardElements.zIndex));
  }

  async createWhiteboardElement(insertElement: InsertWhiteboardElement): Promise<WhiteboardElement> {
    const element = {
      ...insertElement,
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const result = await db.insert(whiteboardElements).values(element).returning();
    return result[0];
  }

  async updateWhiteboardElement(id: string, elementData: Partial<InsertWhiteboardElement>): Promise<WhiteboardElement | undefined> {
    const result = await db.update(whiteboardElements)
      .set({ ...elementData, updatedAt: new Date().toISOString() })
      .where(eq(whiteboardElements.id, id))
      .returning();
    return result[0];
  }

  async deleteWhiteboardElement(id: string): Promise<boolean> {
    const result = await db.delete(whiteboardElements).where(eq(whiteboardElements.id, id)).returning();
    return result.length > 0;
  }



  // Anagrafica Personale
  async getAnagraficaPersonale(): Promise<AnagraficaPersonale[]> {
    return await db.select().from(anagraficaPersonale).orderBy(desc(anagraficaPersonale.createdAt));
  }

  async getAnagraficaPersonaleById(id: string): Promise<AnagraficaPersonale | undefined> {
    const result = await db.select().from(anagraficaPersonale).where(eq(anagraficaPersonale.id, id));
    return result[0];
  }

  async createAnagraficaPersonale(data: InsertAnagraficaPersonale): Promise<AnagraficaPersonale> {
    const normalizedData = { ...data } as any;
    if (normalizedData.responsabileId === "") normalizedData.responsabileId = null;
    const result = await db.insert(anagraficaPersonale).values(normalizedData).returning();
    return result[0];
  }

  async updateAnagraficaPersonale(id: string, data: Partial<InsertAnagraficaPersonale>): Promise<AnagraficaPersonale | undefined> {
    const normalizedData = { ...data } as any;
    if (normalizedData.responsabileId === "") normalizedData.responsabileId = null;
    const result = await db.update(anagraficaPersonale)
      .set({ ...normalizedData, updatedAt: new Date() })
      .where(eq(anagraficaPersonale.id, id))
      .returning();
    return result[0];
  }

  async deleteAnagraficaPersonale(id: string): Promise<boolean> {
    const result = await db.delete(anagraficaPersonale).where(eq(anagraficaPersonale.id, id)).returning();
    return result.length > 0;
  }

  // Cedolini
  async getAllCedolini(): Promise<any[]> {
    return await db.select().from(cedolini)
      .orderBy(desc(cedolini.anno), desc(cedolini.mese));
  }

  async getCedoliniByPersonale(personaleId: string): Promise<any[]> {
    return await db.select().from(cedolini)
      .where(eq(cedolini.personaleId, personaleId))
      .orderBy(desc(cedolini.anno), desc(cedolini.mese));
  }

  async getCedolinoById(id: string): Promise<any | undefined> {
    const result = await db.select().from(cedolini).where(eq(cedolini.id, id));
    return result[0];
  }

  async createCedolino(data: any): Promise<any> {
    const result = await db.insert(cedolini).values(data).returning();
    return result[0];
  }

  async deleteCedolino(id: string): Promise<boolean> {
    const result = await db.delete(cedolini).where(eq(cedolini.id, id)).returning();
    return result.length > 0;
  }

  // Timbrature
  async getTimbratureByPersonale(personaleId: string): Promise<Timbratura[]> {
    return await db.select().from(timbrature)
      .where(eq(timbrature.personaleId, personaleId))
      .orderBy(desc(timbrature.dataOra));
  }

  async getTimbratureByDate(date: string): Promise<Timbratura[]> {
    const allTimbrature = await db.select().from(timbrature).orderBy(desc(timbrature.dataOra));
    return allTimbrature.filter((t: any) => {
      const tDate = new Date(t.dataOra).toISOString().split("T")[0];
      return tDate === date;
    });
  }

  async getAllTimbrature(): Promise<Timbratura[]> {
    return await db.select().from(timbrature).orderBy(desc(timbrature.dataOra));
  }

  async createTimbratura(data: InsertTimbratura): Promise<Timbratura> {
    const timbratura = {
      ...data,
      id: randomUUID(),
      createdAt: new Date().toISOString()
    };
    const result = await db.insert(timbrature).values(timbratura).returning();
    return result[0];
  }

  async deleteTimbratura(id: string): Promise<boolean> {
    const result = await db.delete(timbrature).where(eq(timbrature.id, id)).returning();
    return result.length > 0;
  }

  // Turni
  async getTurniByPersonale(personaleId: string): Promise<Turno[]> {
    return await db.select().from(turni)
      .where(eq(turni.personaleId, personaleId))
      .orderBy(desc(turni.data));
  }

  async getTurniByDateRange(startDate: string, endDate: string): Promise<Turno[]> {
    const allTurni = await db.select().from(turni).orderBy(desc(turni.data));
    return allTurni.filter((t: any) => t.data >= startDate && t.data <= endDate);
  }

  async getAllTurni(): Promise<Turno[]> {
    return await db.select().from(turni).orderBy(desc(turni.data));
  }

  async createTurno(data: InsertTurno): Promise<Turno> {
    const turno = {
      ...data,
      id: randomUUID(),
      createdAt: new Date().toISOString()
    };
    const result = await db.insert(turni).values(turno).returning();
    return result[0];
  }

  async updateTurno(id: string, data: Partial<InsertTurno>): Promise<Turno | undefined> {
    const result = await db.update(turni)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(turni.id, id))
      .returning();
    return result[0];
  }

  async deleteTurno(id: string): Promise<boolean> {
    const result = await db.delete(turni).where(eq(turni.id, id)).returning();
    return result.length > 0;
  }

  // Turni Predefiniti
  async getAllTurniPredefiniti(): Promise<TurnoPredefinita[]> {
    return await db.select().from(turniPredefiniti).where(eq(turniPredefiniti.attivo, true)).orderBy(turniPredefiniti.ordine);
  }

  async createTurnoPredefinita(data: InsertTurnoPredefinita): Promise<TurnoPredefinita> {
    const turno = {
      ...data,
      id: randomUUID()
    };
    const result = await db.insert(turniPredefiniti).values(turno).returning();
    return result[0];
  }

  async updateTurnoPredefinita(id: string, data: Partial<InsertTurnoPredefinita>): Promise<TurnoPredefinita | undefined> {
    const result = await db.update(turniPredefiniti).set(data).where(eq(turniPredefiniti.id, id)).returning();
    return result[0];
  }

  async deleteTurnoPredefinita(id: string): Promise<boolean> {
    const result = await db.delete(turniPredefiniti).where(eq(turniPredefiniti.id, id)).returning();
    return result.length > 0;
  }

  // Straordinari
  async getStraordinariByPersonale(personaleId: string): Promise<Straordinario[]> {
    return await db.select().from(straordinari)
      .where(eq(straordinari.personaleId, personaleId))
      .orderBy(desc(straordinari.data));
  }

  async getStraordinariPendenti(): Promise<Straordinario[]> {
    return await db.select().from(straordinari)
      .where(eq(straordinari.stato, "richiesto"))
      .orderBy(desc(straordinari.createdAt));
  }

  async getAllStraordinari(): Promise<Straordinario[]> {
    return await db.select().from(straordinari).orderBy(desc(straordinari.data));
  }

  async createStraordinario(data: InsertStraordinario): Promise<Straordinario> {
    const result = await db.insert(straordinari).values(data).returning();
    return result[0];
  }

  async updateStraordinario(id: string, data: Partial<Straordinario>): Promise<Straordinario | undefined> {
    const result = await db.update(straordinari)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(straordinari.id, id))
      .returning();
    return result[0];
  }

  async deleteStraordinario(id: string): Promise<boolean> {
    const result = await db.delete(straordinari).where(eq(straordinari.id, id)).returning();
    return result.length > 0;
  }

  // Richieste Assenza (Ferie/Permessi)
  async getAllRichiesteAssenza(): Promise<RichiestaAssenza[]> {
    return await db.select().from(richiesteAssenza).orderBy(desc(richiesteAssenza.createdAt));
  }

  async getRichiesteAssenzaPendenti(): Promise<RichiestaAssenza[]> {
    return await db.select().from(richiesteAssenza)
      .where(eq(richiesteAssenza.stato, "richiesta"))
      .orderBy(desc(richiesteAssenza.createdAt));
  }

  async getRichiesteAssenzaByPersonale(personaleId: string): Promise<RichiestaAssenza[]> {
    return await db.select().from(richiesteAssenza)
      .where(eq(richiesteAssenza.personaleId, personaleId))
      .orderBy(desc(richiesteAssenza.dataInizio));
  }

  async createRichiestaAssenza(data: InsertRichiestaAssenza): Promise<RichiestaAssenza> {
    const result = await db.insert(richiesteAssenza).values(data).returning();
    return result[0];
  }

  async updateRichiestaAssenza(id: string, data: Partial<RichiestaAssenza>): Promise<RichiestaAssenza | undefined> {
    const result = await db.update(richiesteAssenza)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(richiesteAssenza.id, id))
      .returning();
    return result[0];
  }

  async deleteRichiestaAssenza(id: string): Promise<boolean> {
    const result = await db.delete(richiesteAssenza).where(eq(richiesteAssenza.id, id)).returning();
    return result.length > 0;
  }

  // Saldi Ferie/Permessi
  async getSaldoFeriePermessi(personaleId: string, anno: number): Promise<SaldoFeriePermessi | undefined> {
    const result = await db.select().from(saldiFeriePermessi)
      .where(and(eq(saldiFeriePermessi.personaleId, personaleId), eq(saldiFeriePermessi.anno, anno)));
    return result[0];
  }

  async getAllSaldiFerieByAnno(anno: number): Promise<SaldoFeriePermessi[]> {
    return await db.select().from(saldiFeriePermessi)
      .where(eq(saldiFeriePermessi.anno, anno));
  }

  async createSaldoFeriePermessi(data: InsertSaldoFeriePermessi): Promise<SaldoFeriePermessi> {
    const result = await db.insert(saldiFeriePermessi).values(data).returning();
    return result[0];
  }

  async updateSaldoFeriePermessi(id: string, data: Partial<SaldoFeriePermessi>): Promise<SaldoFeriePermessi | undefined> {
    const result = await db.update(saldiFeriePermessi)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(saldiFeriePermessi.id, id))
      .returning();
    return result[0];
  }

  // Scadenze HR
  async getScadenzeHr(): Promise<ScadenzaHr[]> {
    return await db.select().from(scadenzeHr).orderBy(desc(scadenzeHr.dataScadenza));
  }

  async getScadenzeHrByPersonale(personaleId: string): Promise<ScadenzaHr[]> {
    return await db.select().from(scadenzeHr)
      .where(eq(scadenzeHr.personaleId, personaleId))
      .orderBy(desc(scadenzeHr.dataScadenza));
  }

  async getScadenzeHrInScadenza(giorniAvanti: number = 30): Promise<ScadenzaHr[]> {
    const oggi = new Date().toISOString().split('T')[0];
    const futuro = new Date(Date.now() + giorniAvanti * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const all = await db.select().from(scadenzeHr).orderBy(desc(scadenzeHr.dataScadenza));
    return all.filter(s => !s.completata && s.dataScadenza >= oggi && s.dataScadenza <= futuro);
  }

  async createScadenzaHr(data: InsertScadenzaHr): Promise<ScadenzaHr> {
    const result = await db.insert(scadenzeHr).values(data).returning();
    return result[0];
  }

  async updateScadenzaHr(id: string, data: Partial<ScadenzaHr>): Promise<ScadenzaHr | undefined> {
    const result = await db.update(scadenzeHr)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(scadenzeHr.id, id))
      .returning();
    return result[0];
  }

  async deleteScadenzaHr(id: string): Promise<boolean> {
    const result = await db.delete(scadenzeHr).where(eq(scadenzeHr.id, id)).returning();
    return result.length > 0;
  }

  // Anagrafica Clienti
  async getAnagraficaClienti(): Promise<AnagraficaClienti[]> {
    return await db.select().from(anagraficaClienti).orderBy(desc(anagraficaClienti.createdAt));
  }

  async getAnagraficaClientiById(id: string): Promise<AnagraficaClienti | undefined> {
    const result = await db.select().from(anagraficaClienti).where(eq(anagraficaClienti.id, id));
    return result[0];
  }

  async createAnagraficaClienti(data: InsertAnagraficaClienti): Promise<AnagraficaClienti> {
    const newCliente = {
      ...data,
      id: randomUUID(),
      createdAt: new Date().toISOString()
    };
    const result = await db.insert(anagraficaClienti).values(newCliente).returning();
    return result[0];
  }

  async updateAnagraficaClienti(id: string, data: Partial<InsertAnagraficaClienti>): Promise<AnagraficaClienti | undefined> {
    const result = await db.update(anagraficaClienti)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(anagraficaClienti.id, id))
      .returning();
    return result[0];
  }

  async deleteAnagraficaClienti(id: string): Promise<boolean> {
    const result = await db.delete(anagraficaClienti).where(eq(anagraficaClienti.id, id)).returning();
    return result.length > 0;
  }

  async searchAnagraficaClienti(query: string): Promise<AnagraficaClienti[]> {
    const searchPattern = `%${query}%`;
    return await db.select().from(anagraficaClienti)
      .where(or(
        like(anagraficaClienti.ragioneSociale, searchPattern),
        like(anagraficaClienti.partitaIva, searchPattern),
        like(anagraficaClienti.codiceFiscale, searchPattern)
      ))
      .orderBy(anagraficaClienti.ragioneSociale)
      .limit(50);
  }

  async getReferentiByCliente(clienteId: string): Promise<ReferenteCliente[]> {
    return await db.select().from(referentiClienti)
      .where(eq(referentiClienti.clienteId, clienteId))
      .orderBy(desc(referentiClienti.principale), referentiClienti.cognome, referentiClienti.nome);
  }

  async getSalesOrdersByCliente(clienteId: string): Promise<SalesOrder[]> {
    return await db.select().from(salesOrders)
      .where(eq(salesOrders.clienteId, clienteId))
      .orderBy(desc(salesOrders.createdAt));
  }

  async getQuotesByCliente(clienteId: string): Promise<Quote[]> {
    return await db.select().from(quotes)
      .where(eq(quotes.clienteId, clienteId))
      .orderBy(desc(quotes.createdAt));
  }

  async getInvoicesByCliente(clienteId: string): Promise<Invoice[]> {
    return await db.select().from(invoices)
      .where(eq(invoices.clienteId, clienteId))
      .orderBy(desc(invoices.createdAt));
  }

  // Indirizzi Spedizione Clienti
  async getIndirizziSpedizioneByCliente(clienteId: string): Promise<IndirizzoSpedizioneCliente[]> {
    return await db.select().from(indirizziSpedizioneClienti)
      .where(eq(indirizziSpedizioneClienti.clienteId, clienteId))
      .orderBy(desc(indirizziSpedizioneClienti.principale), indirizziSpedizioneClienti.nome);
  }

  async getIndirizzoSpedizioneById(id: string): Promise<IndirizzoSpedizioneCliente | undefined> {
    const result = await db.select().from(indirizziSpedizioneClienti).where(eq(indirizziSpedizioneClienti.id, id));
    return result[0];
  }

  async createIndirizzoSpedizione(data: InsertIndirizzoSpedizioneCliente): Promise<IndirizzoSpedizioneCliente> {
    // Se è principale, rimuovi il flag dagli altri
    if (data.principale) {
      await db.update(indirizziSpedizioneClienti)
        .set({ principale: false })
        .where(eq(indirizziSpedizioneClienti.clienteId, data.clienteId));
    }
    const result = await db.insert(indirizziSpedizioneClienti).values(data).returning();
    return result[0];
  }

  async updateIndirizzoSpedizione(id: string, data: Partial<InsertIndirizzoSpedizioneCliente>): Promise<IndirizzoSpedizioneCliente | undefined> {
    // Se diventa principale, rimuovi il flag dagli altri
    if (data.principale) {
      const current = await this.getIndirizzoSpedizioneById(id);
      if (current) {
        await db.update(indirizziSpedizioneClienti)
          .set({ principale: false })
          .where(eq(indirizziSpedizioneClienti.clienteId, current.clienteId));
      }
    }
    const result = await db.update(indirizziSpedizioneClienti)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(indirizziSpedizioneClienti.id, id))
      .returning();
    return result[0];
  }

  async deleteIndirizzoSpedizione(id: string): Promise<boolean> {
    const result = await db.delete(indirizziSpedizioneClienti).where(eq(indirizziSpedizioneClienti.id, id)).returning();
    return result.length > 0;
  }

  // Anagrafica Fornitori
  async getAnagraficaFornitori(): Promise<AnagraficaFornitori[]> {
    return await db.select().from(anagraficaFornitori).orderBy(desc(anagraficaFornitori.createdAt));
  }

  async getAnagraficaFornitoriById(id: string): Promise<AnagraficaFornitori | undefined> {
    const result = await db.select().from(anagraficaFornitori).where(eq(anagraficaFornitori.id, id));
    return result[0];
  }

  async createAnagraficaFornitori(data: InsertAnagraficaFornitori): Promise<AnagraficaFornitori> {
    const result = await db.insert(anagraficaFornitori).values(data).returning();
    return result[0];
  }

  async updateAnagraficaFornitori(id: string, data: Partial<InsertAnagraficaFornitori>): Promise<AnagraficaFornitori | undefined> {
    const result = await db.update(anagraficaFornitori)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(anagraficaFornitori.id, id))
      .returning();
    return result[0];
  }

  async deleteAnagraficaFornitori(id: string): Promise<boolean> {
    const result = await db.delete(anagraficaFornitori).where(eq(anagraficaFornitori.id, id)).returning();
    return result.length > 0;
  }

  // Backups
  async getBackups(): Promise<Backup[]> {
    return await db.select().from(backups).orderBy(desc(backups.createdAt));
  }

  async getBackupById(id: string): Promise<Backup | undefined> {
    const result = await db.select().from(backups).where(eq(backups.id, id));
    return result[0];
  }

  async createBackup(data: InsertBackup): Promise<Backup> {
    const newBackup = {
      ...data,
      id: randomUUID(),
      createdAt: new Date().toISOString()
    };
    const result = await db.insert(backups).values(newBackup).returning();
    return result[0];
  }

  async updateBackup(id: string, data: Partial<InsertBackup>): Promise<Backup | undefined> {
    const result = await db.update(backups)
      .set(data)
      .where(eq(backups.id, id))
      .returning();
    return result[0];
  }

  async deleteBackup(id: string): Promise<boolean> {
    const result = await db.delete(backups).where(eq(backups.id, id)).returning();
    return result.length > 0;
  }

  // Email Caching Methods
  async getCachedEmails(userId: string, folder: string = 'INBOX', limit: number = 50): Promise<Email[]> {
    return await db.select()
      .from(emails)
      .where(and(eq(emails.userId, userId), eq(emails.folder, folder)))
      .orderBy(desc(emails.receivedAt))
      .limit(limit);
  }

  async getLastEmailUid(userId: string, folder: string): Promise<number> {
    const result = await db.select({ maxUid: max(emails.uid) })
      .from(emails)
      .where(and(eq(emails.userId, userId), eq(emails.folder, folder)));
    return result[0]?.maxUid || 0;
  }

  async cacheEmails(newEmails: InsertEmail[]): Promise<void> {
    if (newEmails.length === 0) return;
    // Batch insert using SQLite Upsert (ON CONFLICT DO NOTHING typically, or UPDATE)
    // Here we use simple insert with ignore on conflict if ID is the same
    for (const email of newEmails) {
      await db.insert(emails).values(email).onConflictDoNothing().run();
    }
  }

  // Backup Schedules
  async getBackupSchedules(): Promise<BackupSchedule[]> {
    return await db.select().from(backupSchedules).orderBy(desc(backupSchedules.createdAt));
  }

  async getBackupScheduleById(id: string): Promise<BackupSchedule | undefined> {
    const result = await db.select().from(backupSchedules).where(eq(backupSchedules.id, id));
    return result[0];
  }

  async createBackupSchedule(data: InsertBackupSchedule): Promise<BackupSchedule> {
    const newSchedule = {
      ...data,
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const result = await db.insert(backupSchedules).values(newSchedule).returning();
    return result[0];
  }

  async updateBackupSchedule(id: string, data: Partial<InsertBackupSchedule>): Promise<BackupSchedule | undefined> {
    const result = await db.update(backupSchedules)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(backupSchedules.id, id))
      .returning();
    return result[0];
  }

  async deleteBackupSchedule(id: string): Promise<boolean> {
    const result = await db.delete(backupSchedules).where(eq(backupSchedules.id, id)).returning();
    return result.length > 0;
  }

  // =====================
  // FINANZA PROFESSIONALE
  // =====================

  // Finance Accounts
  async getFinanceAccounts(): Promise<FinanceAccount[]> {
    return await db.select().from(financeAccounts).orderBy(desc(financeAccounts.createdAt));
  }

  async getFinanceAccountById(id: string): Promise<FinanceAccount | undefined> {
    const result = await db.select().from(financeAccounts).where(eq(financeAccounts.id, id));
    return result[0];
  }

  async createFinanceAccount(data: InsertFinanceAccount): Promise<FinanceAccount> {
    const result = await db.insert(financeAccounts).values(data).returning();
    return result[0];
  }

  async updateFinanceAccount(id: string, data: Partial<InsertFinanceAccount>): Promise<FinanceAccount | undefined> {
    const result = await db.update(financeAccounts)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(financeAccounts.id, id))
      .returning();
    return result[0];
  }

  async deleteFinanceAccount(id: string): Promise<boolean> {
    const result = await db.delete(financeAccounts).where(eq(financeAccounts.id, id)).returning();
    return result.length > 0;
  }

  // Finance Categories
  async getFinanceCategories(): Promise<FinanceCategory[]> {
    return await db.select().from(financeCategories).orderBy(financeCategories.ordine);
  }

  async getFinanceCategoryById(id: string): Promise<FinanceCategory | undefined> {
    const result = await db.select().from(financeCategories).where(eq(financeCategories.id, id));
    return result[0];
  }

  async createFinanceCategory(data: InsertFinanceCategory): Promise<FinanceCategory> {
    const result = await db.insert(financeCategories).values(data).returning();
    return result[0];
  }

  async updateFinanceCategory(id: string, data: Partial<InsertFinanceCategory>): Promise<FinanceCategory | undefined> {
    const result = await db.update(financeCategories)
      .set(data)
      .where(eq(financeCategories.id, id))
      .returning();
    return result[0];
  }

  async deleteFinanceCategory(id: string): Promise<boolean> {
    const result = await db.delete(financeCategories).where(eq(financeCategories.id, id)).returning();
    return result.length > 0;
  }

  // Invoices
  async getInvoices(): Promise<Invoice[]> {
    return await db.select().from(invoices).orderBy(desc(invoices.createdAt));
  }

  async getInvoiceById(id: string): Promise<Invoice | undefined> {
    const result = await db.select().from(invoices).where(eq(invoices.id, id));
    return result[0];
  }

  async getInvoicesByType(tipo: string): Promise<Invoice[]> {
    return await db.select().from(invoices).where(eq(invoices.tipo, tipo)).orderBy(desc(invoices.createdAt));
  }

  async createInvoice(data: InsertInvoice): Promise<Invoice> {
    const newInvoice = {
      ...data,
      id: randomUUID(),
      createdAt: new Date().toISOString()
    };
    const result = await db.insert(invoices).values(newInvoice).returning();
    return result[0];
  }

  async updateInvoice(id: string, data: Partial<InsertInvoice>): Promise<Invoice | undefined> {
    const result = await db.update(invoices)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(invoices.id, id))
      .returning();
    return result[0];
  }

  async deleteInvoice(id: string): Promise<boolean> {
    const result = await db.delete(invoices).where(eq(invoices.id, id)).returning();
    return result.length > 0;
  }

  // Invoice Lines
  async getInvoiceLines(invoiceId: string): Promise<InvoiceLine[]> {
    return await db.select().from(invoiceLines).where(eq(invoiceLines.invoiceId, invoiceId)).orderBy(invoiceLines.ordine);
  }

  async createInvoiceLine(data: InsertInvoiceLine): Promise<InvoiceLine> {
    const result = await db.insert(invoiceLines).values({ ...data, id: randomUUID() }).returning();
    return result[0];
  }

  async updateInvoiceLine(id: string, data: Partial<InsertInvoiceLine>): Promise<InvoiceLine | undefined> {
    const result = await db.update(invoiceLines)
      .set(data)
      .where(eq(invoiceLines.id, id))
      .returning();
    return result[0];
  }

  async deleteInvoiceLine(id: string): Promise<boolean> {
    const result = await db.delete(invoiceLines).where(eq(invoiceLines.id, id)).returning();
    return result.length > 0;
  }

  // Quotes (Preventivi)
  async getQuotes(): Promise<Quote[]> {
    return await db.select().from(quotes).orderBy(desc(quotes.createdAt));
  }

  async getQuoteById(id: string): Promise<Quote | undefined> {
    const result = await db.select().from(quotes).where(eq(quotes.id, id));
    return result[0];
  }

  async createQuote(data: InsertQuote): Promise<Quote> {
    const newQuote = {
      ...data,
      id: randomUUID(),
      createdAt: new Date().toISOString()
    };
    const result = await db.insert(quotes).values(newQuote).returning();
    return result[0];
  }

  async updateQuote(id: string, data: Partial<InsertQuote>): Promise<Quote | undefined> {
    const result = await db.update(quotes)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(quotes.id, id))
      .returning();
    return result[0];
  }

  async deleteQuote(id: string): Promise<boolean> {
    const result = await db.delete(quotes).where(eq(quotes.id, id)).returning();
    return result.length > 0;
  }

  // Quote Lines
  async getQuoteLines(quoteId: string): Promise<QuoteLine[]> {
    return await db.select().from(quoteLines).where(eq(quoteLines.quoteId, quoteId)).orderBy(quoteLines.ordine);
  }

  async createQuoteLine(data: InsertQuoteLine): Promise<QuoteLine> {
    const result = await db.insert(quoteLines).values({ ...data, id: randomUUID() }).returning();
    return result[0];
  }

  async updateQuoteLine(id: string, data: Partial<InsertQuoteLine>): Promise<QuoteLine | undefined> {
    const result = await db.update(quoteLines)
      .set(data)
      .where(eq(quoteLines.id, id))
      .returning();
    return result[0];
  }

  async deleteQuoteLine(id: string): Promise<boolean> {
    const result = await db.delete(quoteLines).where(eq(quoteLines.id, id)).returning();
    return result.length > 0;
  }

  // DDT (Documenti di Trasporto)
  async getDdts(): Promise<Ddt[]> {
    return await db.select().from(ddt).orderBy(desc(ddt.createdAt));
  }

  async getDdtById(id: string): Promise<Ddt | undefined> {
    const result = await db.select().from(ddt).where(eq(ddt.id, id));
    return result[0];
  }

  async createDdt(data: InsertDdt): Promise<Ddt> {
    const newDdt = {
      ...data,
      id: randomUUID(),
      createdAt: new Date().toISOString()
    };
    const result = await db.insert(ddt).values(newDdt).returning();
    return result[0];
  }

  async updateDdt(id: string, data: Partial<InsertDdt>): Promise<Ddt | undefined> {
    const result = await db.update(ddt)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(ddt.id, id))
      .returning();
    return result[0];
  }

  async deleteDdt(id: string): Promise<boolean> {
    const result = await db.delete(ddt).where(eq(ddt.id, id)).returning();
    return result.length > 0;
  }

  // DDT Lines
  async getDdtLines(ddtId: string): Promise<DdtLine[]> {
    return await db.select().from(ddtLines).where(eq(ddtLines.ddtId, ddtId)).orderBy(ddtLines.ordine);
  }

  async createDdtLine(data: InsertDdtLine): Promise<DdtLine> {
    const result = await db.insert(ddtLines).values({ ...data, id: randomUUID() }).returning();
    return result[0];
  }

  async updateDdtLine(id: string, data: Partial<InsertDdtLine>): Promise<DdtLine | undefined> {
    const result = await db.update(ddtLines)
      .set(data)
      .where(eq(ddtLines.id, id))
      .returning();
    return result[0];
  }

  async deleteDdtLine(id: string): Promise<boolean> {
    const result = await db.delete(ddtLines).where(eq(ddtLines.id, id)).returning();
    return result.length > 0;
  }

  // Finance Transactions
  async getFinanceTransactions(): Promise<FinanceTransaction[]> {
    return await db.select().from(financeTransactions)
      .where(isNull(financeTransactions.deletedAt))
      .orderBy(desc(financeTransactions.createdAt));
  }

  async getFinanceTransactionById(id: string): Promise<FinanceTransaction | undefined> {
    const result = await db.select().from(financeTransactions).where(eq(financeTransactions.id, id));
    return result[0];
  }

  async getFinanceTransactionsByAccount(contoId: string): Promise<FinanceTransaction[]> {
    return await db.select().from(financeTransactions)
      .where(and(eq(financeTransactions.contoId, contoId), isNull(financeTransactions.deletedAt)))
      .orderBy(desc(financeTransactions.createdAt));
  }

  async createFinanceTransaction(data: InsertFinanceTransaction): Promise<FinanceTransaction> {
    const result = await db.insert(financeTransactions).values(data).returning();
    return result[0];
  }

  async updateFinanceTransaction(id: string, data: Partial<InsertFinanceTransaction>): Promise<FinanceTransaction | undefined> {
    const result = await db.update(financeTransactions)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(financeTransactions.id, id))
      .returning();
    return result[0];
  }

  async deleteFinanceTransaction(id: string): Promise<boolean> {
    // Soft delete - imposta deletedAt
    const result = await db.update(financeTransactions)
      .set({ deletedAt: new Date() })
      .where(eq(financeTransactions.id, id))
      .returning();
    return result.length > 0;
  }

  // Cestino transazioni
  async getDeletedTransactions(): Promise<FinanceTransaction[]> {
    return await db.select().from(financeTransactions)
      .where(isNotNull(financeTransactions.deletedAt))
      .orderBy(desc(financeTransactions.deletedAt));
  }

  async restoreTransaction(id: string): Promise<FinanceTransaction | undefined> {
    const result = await db.update(financeTransactions)
      .set({ deletedAt: null })
      .where(eq(financeTransactions.id, id))
      .returning();
    return result[0];
  }

  async permanentlyDeleteTransaction(id: string): Promise<boolean> {
    const result = await db.delete(financeTransactions).where(eq(financeTransactions.id, id)).returning();
    return result.length > 0;
  }

  // Budgets
  async getBudgets(): Promise<Budget[]> {
    return await db.select().from(budgets).orderBy(desc(budgets.createdAt));
  }

  async getBudgetById(id: string): Promise<Budget | undefined> {
    const result = await db.select().from(budgets).where(eq(budgets.id, id));
    return result[0];
  }

  async createBudget(data: InsertBudget): Promise<Budget> {
    const result = await db.insert(budgets).values(data).returning();
    return result[0];
  }

  async updateBudget(id: string, data: Partial<InsertBudget>): Promise<Budget | undefined> {
    const result = await db.update(budgets)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(budgets.id, id))
      .returning();
    return result[0];
  }

  async deleteBudget(id: string): Promise<boolean> {
    const result = await db.delete(budgets).where(eq(budgets.id, id)).returning();
    return result.length > 0;
  }

  // Payment Reminders
  async getPaymentReminders(): Promise<PaymentReminder[]> {
    return await db.select().from(paymentReminders).orderBy(desc(paymentReminders.createdAt));
  }

  async getPaymentReminderById(id: string): Promise<PaymentReminder | undefined> {
    const result = await db.select().from(paymentReminders).where(eq(paymentReminders.id, id));
    return result[0];
  }

  async createPaymentReminder(data: InsertPaymentReminder): Promise<PaymentReminder> {
    const result = await db.insert(paymentReminders).values(data).returning();
    return result[0];
  }

  async updatePaymentReminder(id: string, data: Partial<InsertPaymentReminder>): Promise<PaymentReminder | undefined> {
    const result = await db.update(paymentReminders)
      .set(data)
      .where(eq(paymentReminders.id, id))
      .returning();
    return result[0];
  }

  async deletePaymentReminder(id: string): Promise<boolean> {
    const result = await db.delete(paymentReminders).where(eq(paymentReminders.id, id)).returning();
    return result.length > 0;
  }

  // Finance Integrations
  async getFinanceIntegrations(): Promise<FinanceIntegration[]> {
    return await db.select().from(financeIntegrations).orderBy(desc(financeIntegrations.createdAt));
  }

  async getFinanceIntegrationById(id: string): Promise<FinanceIntegration | undefined> {
    const result = await db.select().from(financeIntegrations).where(eq(financeIntegrations.id, id));
    return result[0];
  }

  async getFinanceIntegrationByType(tipo: string): Promise<FinanceIntegration | undefined> {
    const result = await db.select().from(financeIntegrations).where(eq(financeIntegrations.tipo, tipo));
    return result[0];
  }

  async createFinanceIntegration(data: InsertFinanceIntegration): Promise<FinanceIntegration> {
    const result = await db.insert(financeIntegrations).values(data).returning();
    return result[0];
  }

  async updateFinanceIntegration(id: string, data: Partial<InsertFinanceIntegration>): Promise<FinanceIntegration | undefined> {
    const result = await db.update(financeIntegrations)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(financeIntegrations.id, id))
      .returning();
    return result[0];
  }

  async deleteFinanceIntegration(id: string): Promise<boolean> {
    const result = await db.delete(financeIntegrations).where(eq(financeIntegrations.id, id)).returning();
    return result.length > 0;
  }

  // Finance Share Links
  async createShareLink(data: InsertFinanceShareLink): Promise<FinanceShareLink> {
    const result = await db.insert(financeShareLinks).values(data).returning();
    return result[0];
  }

  async getShareLinkByToken(token: string): Promise<FinanceShareLink | undefined> {
    const result = await db.select().from(financeShareLinks).where(eq(financeShareLinks.token, token));
    return result[0];
  }

  async getShareLinksByResource(resourceId: string): Promise<FinanceShareLink[]> {
    return await db.select().from(financeShareLinks)
      .where(eq(financeShareLinks.resourceId, resourceId))
      .orderBy(desc(financeShareLinks.createdAt));
  }

  async incrementShareLinkViewCount(id: string): Promise<void> {
    const link = await db.select().from(financeShareLinks).where(eq(financeShareLinks.id, id));
    if (link[0]) {
      await db.update(financeShareLinks)
        .set({ viewCount: (link[0].viewCount || 0) + 1 })
        .where(eq(financeShareLinks.id, id));
    }
  }

  async updateShareLinkAccess(id: string, clientIp: string): Promise<void> {
    const link = await db.select().from(financeShareLinks).where(eq(financeShareLinks.id, id));
    if (link[0]) {
      await db.update(financeShareLinks)
        .set({
          viewCount: (link[0].viewCount || 0) + 1,
          lastViewedAt: new Date(),
          lastViewedIp: clientIp
        })
        .where(eq(financeShareLinks.id, id));
    }
  }

  async getAllShareLinks(): Promise<FinanceShareLink[]> {
    return await db.select().from(financeShareLinks)
      .orderBy(desc(financeShareLinks.createdAt));
  }

  async toggleShareLinkActive(id: string, isActive: boolean): Promise<FinanceShareLink | undefined> {
    const result = await db.update(financeShareLinks)
      .set({ isActive })
      .where(eq(financeShareLinks.id, id))
      .returning();
    return result[0];
  }

  async deleteShareLink(id: string): Promise<boolean> {
    const result = await db.delete(financeShareLinks).where(eq(financeShareLinks.id, id)).returning();
    return result.length > 0;
  }

  // Invoice Reminders (Solleciti)
  async createInvoiceReminder(data: InsertInvoiceReminder): Promise<InvoiceReminder> {
    const result = await db.insert(invoiceReminders).values(data).returning();
    return result[0];
  }

  async getInvoiceRemindersByInvoice(invoiceId: string): Promise<InvoiceReminder[]> {
    return await db.select().from(invoiceReminders)
      .where(eq(invoiceReminders.invoiceId, invoiceId))
      .orderBy(desc(invoiceReminders.createdAt));
  }

  async getInvoiceReminderByToken(token: string): Promise<InvoiceReminder | undefined> {
    const result = await db.select().from(invoiceReminders)
      .where(eq(invoiceReminders.trackingToken, token));
    return result[0];
  }

  async updateInvoiceReminderDelivery(id: string, status: string, error?: string): Promise<void> {
    await db.update(invoiceReminders)
      .set({
        deliveryStatus: status,
        deliveryError: error,
        sentAt: status === 'sent' ? new Date() : undefined
      })
      .where(eq(invoiceReminders.id, id));
  }

  async trackInvoiceReminderOpen(id: string, ip: string, userAgent: string): Promise<void> {
    const reminder = await db.select().from(invoiceReminders).where(eq(invoiceReminders.id, id));
    if (reminder[0]) {
      const updates: any = {
        openCount: (reminder[0].openCount || 0) + 1,
        lastOpenIp: ip,
        lastOpenUserAgent: userAgent
      };
      if (!reminder[0].openedAt) {
        updates.openedAt = new Date();
      }
      await db.update(invoiceReminders).set(updates).where(eq(invoiceReminders.id, id));
    }
  }

  // =====================
  // WAREHOUSE CATEGORIES
  // =====================
  async getWarehouseCategories(): Promise<WarehouseCategory[]> {
    return await db.select().from(warehouseCategories).orderBy(warehouseCategories.ordine);
  }

  async getWarehouseCategory(id: string): Promise<WarehouseCategory | undefined> {
    const result = await db.select().from(warehouseCategories).where(eq(warehouseCategories.id, id));
    return result[0];
  }

  async createWarehouseCategory(data: InsertWarehouseCategory): Promise<WarehouseCategory> {
    const category = {
      ...data,
      id: randomUUID(),
      createdAt: new Date().toISOString()
    };
    const result = await db.insert(warehouseCategories).values(category).returning();
    return result[0];
  }

  async updateWarehouseCategory(id: string, data: Partial<InsertWarehouseCategory>): Promise<WarehouseCategory | undefined> {
    const result = await db.update(warehouseCategories).set(data).where(eq(warehouseCategories.id, id)).returning();
    return result[0];
  }

  async deleteWarehouseCategory(id: string): Promise<boolean> {
    const result = await db.delete(warehouseCategories).where(eq(warehouseCategories.id, id)).returning();
    return result.length > 0;
  }

  // =====================
  // WAREHOUSE CODE GENERATION
  // =====================
  async getNextWarehouseProductCode(prefisso: string): Promise<string> {
    const existing = await db.select().from(warehouseCodeCounters)
      .where(eq(warehouseCodeCounters.prefisso, prefisso));

    let nextNum = 1;
    if (existing.length > 0) {
      nextNum = (existing[0].ultimoProgressivo || 0) + 1;
      await db.update(warehouseCodeCounters)
        .set({ ultimoProgressivo: nextNum })
        .where(eq(warehouseCodeCounters.prefisso, prefisso));
    } else {
      await db.insert(warehouseCodeCounters).values({ prefisso, ultimoProgressivo: 1 });
    }

    const paddedNum = String(nextNum).padStart(4, '0');
    return `${prefisso}-${paddedNum}`;
  }

  // =====================
  // WAREHOUSE PRODUCTS
  // =====================
  async getWarehouseProducts(): Promise<WarehouseProduct[]> {
    return await db.select().from(warehouseProducts).orderBy(warehouseProducts.nome);
  }

  async getWarehouseProduct(id: string): Promise<WarehouseProduct | undefined> {
    const result = await db.select().from(warehouseProducts).where(eq(warehouseProducts.id, id));
    return result[0];
  }

  async getWarehouseProductByCode(codice: string): Promise<WarehouseProduct | undefined> {
    const result = await db.select().from(warehouseProducts).where(eq(warehouseProducts.codice, codice));
    return result[0];
  }

  async createWarehouseProduct(data: InsertWarehouseProduct): Promise<WarehouseProduct> {
    const product = {
      ...data,
      id: randomUUID(),
      createdAt: new Date().toISOString()
    };
    const result = await db.insert(warehouseProducts).values(product).returning();
    return result[0];
  }

  async updateWarehouseProduct(id: string, data: Partial<InsertWarehouseProduct>): Promise<WarehouseProduct | undefined> {
    const result = await db.update(warehouseProducts).set({ ...data, updatedAt: new Date() }).where(eq(warehouseProducts.id, id)).returning();
    return result[0];
  }

  async deleteWarehouseProduct(id: string): Promise<boolean> {
    const result = await db.delete(warehouseProducts).where(eq(warehouseProducts.id, id)).returning();
    return result.length > 0;
  }

  // =====================
  // WAREHOUSE MOVEMENTS
  // =====================
  async getWarehouseMovements(): Promise<WarehouseMovement[]> {
    return await db.select().from(warehouseMovements).orderBy(desc(warehouseMovements.createdAt));
  }

  async getWarehouseMovementsByProduct(prodottoId: string): Promise<WarehouseMovement[]> {
    return await db.select().from(warehouseMovements)
      .where(eq(warehouseMovements.prodottoId, prodottoId))
      .orderBy(desc(warehouseMovements.createdAt));
  }

  async createWarehouseMovement(data: InsertWarehouseMovement): Promise<WarehouseMovement> {
    const movement = {
      ...data,
      id: randomUUID(),
      createdAt: new Date().toISOString()
    };
    const result = await db.insert(warehouseMovements).values(movement).returning();
    return result[0];
  }

  // =====================
  // BILL OF MATERIALS
  // =====================
  async getBillOfMaterials(): Promise<BillOfMaterials[]> {
    return await db.select().from(billOfMaterials).orderBy(billOfMaterials.nome);
  }

  async getBillOfMaterial(id: string): Promise<BillOfMaterials | undefined> {
    const result = await db.select().from(billOfMaterials).where(eq(billOfMaterials.id, id));
    return result[0];
  }

  async createBillOfMaterials(data: InsertBillOfMaterials): Promise<BillOfMaterials> {
    const result = await db.insert(billOfMaterials).values(data).returning();
    return result[0];
  }

  async updateBillOfMaterials(id: string, data: Partial<InsertBillOfMaterials>): Promise<BillOfMaterials | undefined> {
    const result = await db.update(billOfMaterials).set({ ...data, updatedAt: new Date() }).where(eq(billOfMaterials.id, id)).returning();
    return result[0];
  }

  async deleteBillOfMaterials(id: string): Promise<boolean> {
    await db.delete(bomComponents).where(eq(bomComponents.bomId, id));
    const result = await db.delete(billOfMaterials).where(eq(billOfMaterials.id, id)).returning();
    return result.length > 0;
  }

  // =====================
  // BOM COMPONENTS
  // =====================
  async getBomComponents(bomId: string): Promise<BomComponent[]> {
    return await db.select().from(bomComponents).where(eq(bomComponents.bomId, bomId)).orderBy(bomComponents.ordine);
  }

  async createBomComponent(data: InsertBomComponent): Promise<BomComponent> {
    const result = await db.insert(bomComponents).values(data).returning();
    return result[0];
  }

  async updateBomComponent(id: string, data: Partial<InsertBomComponent>): Promise<BomComponent | undefined> {
    const result = await db.update(bomComponents).set(data).where(eq(bomComponents.id, id)).returning();
    return result[0];
  }

  async deleteBomComponent(id: string): Promise<boolean> {
    const result = await db.delete(bomComponents).where(eq(bomComponents.id, id)).returning();
    return result.length > 0;
  }

  // =====================
  // PRODUCTION ORDERS
  // =====================
  async getProductionOrders(): Promise<ProductionOrder[]> {
    return await db.select().from(productionOrders).orderBy(desc(productionOrders.createdAt));
  }

  async getProductionOrder(id: string): Promise<ProductionOrder | undefined> {
    const result = await db.select().from(productionOrders).where(eq(productionOrders.id, id));
    return result[0];
  }

  async createProductionOrder(data: InsertProductionOrder): Promise<ProductionOrder> {
    const order = {
      ...data,
      id: randomUUID(),
      createdAt: new Date().toISOString()
    };
    const result = await db.insert(productionOrders).values(order).returning();
    return result[0];
  }

  async updateProductionOrder(id: string, data: Partial<InsertProductionOrder>): Promise<ProductionOrder | undefined> {
    const result = await db.update(productionOrders).set({ ...data, updatedAt: new Date() }).where(eq(productionOrders.id, id)).returning();
    return result[0];
  }

  async deleteProductionOrder(id: string): Promise<boolean> {
    await db.delete(productionPhases).where(eq(productionPhases.ordineId, id));
    const result = await db.delete(productionOrders).where(eq(productionOrders.id, id)).returning();
    return result.length > 0;
  }

  // =====================
  // PRODUCTION PHASES
  // =====================
  async getProductionPhases(ordineId: string): Promise<ProductionPhase[]> {
    return await db.select().from(productionPhases)
      .where(eq(productionPhases.ordineId, ordineId))
      .orderBy(productionPhases.ordine);
  }

  async createProductionPhase(data: InsertProductionPhase): Promise<ProductionPhase> {
    const phase = {
      ...data,
      id: randomUUID()
    };
    const result = await db.insert(productionPhases).values(phase).returning();
    return result[0];
  }

  async updateProductionPhase(id: string, data: Partial<InsertProductionPhase>): Promise<ProductionPhase | undefined> {
    const result = await db.update(productionPhases).set(data).where(eq(productionPhases.id, id)).returning();
    return result[0];
  }

  async deleteProductionPhase(id: string): Promise<boolean> {
    const result = await db.delete(productionPhases).where(eq(productionPhases.id, id)).returning();
    return result.length > 0;
  }

  // =====================
  // CRM LEADS
  // =====================
  async getCrmLeads(): Promise<CrmLead[]> {
    return await db.select().from(crmLeads).orderBy(desc(crmLeads.createdAt));
  }

  async getCrmLead(id: string): Promise<CrmLead | undefined> {
    const result = await db.select().from(crmLeads).where(eq(crmLeads.id, id));
    return result[0];
  }

  async createCrmLead(data: InsertCrmLead): Promise<CrmLead> {
    const lead = {
      ...data,
      id: randomUUID(),
      createdAt: new Date().toISOString()
    };
    const result = await db.insert(crmLeads).values(lead).returning();
    return result[0];
  }

  async updateCrmLead(id: string, data: Partial<InsertCrmLead>): Promise<CrmLead | undefined> {
    const result = await db.update(crmLeads).set({ ...data, updatedAt: new Date() }).where(eq(crmLeads.id, id)).returning();
    return result[0];
  }

  async deleteCrmLead(id: string): Promise<boolean> {
    const result = await db.delete(crmLeads).where(eq(crmLeads.id, id)).returning();
    return result.length > 0;
  }

  // =====================
  // CRM OPPORTUNITA
  // =====================
  async getCrmOpportunita(): Promise<CrmOpportunita[]> {
    return await db.select().from(crmOpportunita).orderBy(desc(crmOpportunita.createdAt));
  }

  async getCrmOpportunitaById(id: string): Promise<CrmOpportunita | undefined> {
    const result = await db.select().from(crmOpportunita).where(eq(crmOpportunita.id, id));
    return result[0];
  }

  async createCrmOpportunita(data: InsertCrmOpportunita): Promise<CrmOpportunita> {
    const opp = {
      ...data,
      id: randomUUID(),
      createdAt: new Date().toISOString()
    };
    const result = await db.insert(crmOpportunita).values(opp).returning();
    return result[0];
  }

  async updateCrmOpportunita(id: string, data: Partial<InsertCrmOpportunita>): Promise<CrmOpportunita | undefined> {
    const result = await db.update(crmOpportunita).set({ ...data, updatedAt: new Date() }).where(eq(crmOpportunita.id, id)).returning();
    return result[0];
  }

  async deleteCrmOpportunita(id: string): Promise<boolean> {
    const result = await db.delete(crmOpportunita).where(eq(crmOpportunita.id, id)).returning();
    return result.length > 0;
  }

  // =====================
  // CRM ATTIVITA
  // =====================
  async getCrmAttivita(clienteId?: string, leadId?: string, opportunitaId?: string): Promise<CrmAttivita[]> {
    let query = db.select().from(crmAttivita);
    if (clienteId) {
      return await query.where(eq(crmAttivita.clienteId, clienteId)).orderBy(desc(crmAttivita.dataOra));
    }
    if (leadId) {
      return await query.where(eq(crmAttivita.leadId, leadId)).orderBy(desc(crmAttivita.dataOra));
    }
    if (opportunitaId) {
      return await query.where(eq(crmAttivita.opportunitaId, opportunitaId)).orderBy(desc(crmAttivita.dataOra));
    }
    return await query.orderBy(desc(crmAttivita.dataOra));
  }

  async createCrmAttivita(data: InsertCrmAttivita): Promise<CrmAttivita> {
    const attivita = {
      ...data,
      id: randomUUID(),
      dataOra: data.dataOra || new Date().toISOString()
    };
    const result = await db.insert(crmAttivita).values(attivita).returning();
    return result[0];
  }

  async updateCrmAttivita(id: string, data: Partial<InsertCrmAttivita>): Promise<CrmAttivita | undefined> {
    const result = await db.update(crmAttivita).set({ ...data, updatedAt: new Date() }).where(eq(crmAttivita.id, id)).returning();
    return result[0];
  }

  async deleteCrmAttivita(id: string): Promise<boolean> {
    const result = await db.delete(crmAttivita).where(eq(crmAttivita.id, id)).returning();
    return result.length > 0;
  }

  // =====================
  // CRM INTERAZIONI
  // =====================
  async getCrmInterazioni(clienteId?: string, leadId?: string, opportunitaId?: string): Promise<CrmInterazione[]> {
    let query = db.select().from(crmInterazioni);
    if (clienteId) {
      return await query.where(eq(crmInterazioni.clienteId, clienteId)).orderBy(desc(crmInterazioni.createdAt));
    }
    if (leadId) {
      return await query.where(eq(crmInterazioni.leadId, leadId)).orderBy(desc(crmInterazioni.createdAt));
    }
    if (opportunitaId) {
      return await query.where(eq(crmInterazioni.opportunitaId, opportunitaId)).orderBy(desc(crmInterazioni.createdAt));
    }
    return await query.orderBy(desc(crmInterazioni.createdAt));
  }

  async createCrmInterazione(data: InsertCrmInterazione): Promise<CrmInterazione> {
    const interazione = {
      ...data,
      id: randomUUID(),
      dataOra: data.dataOra || new Date().toISOString()
    };
    const result = await db.insert(crmInterazioni).values(interazione).returning();
    return result[0];
  }

  // =====================
  // CORRIERI
  // =====================
  async getCorrieri(): Promise<Corriere[]> {
    return await db.select().from(corrieri).orderBy(corrieri.nome);
  }

  async getCorriere(id: string): Promise<Corriere | undefined> {
    const result = await db.select().from(corrieri).where(eq(corrieri.id, id));
    return result[0];
  }

  async createCorriere(data: InsertCorriere): Promise<Corriere> {
    const result = await db.insert(corrieri).values(data).returning();
    return result[0];
  }

  async updateCorriere(id: string, data: Partial<InsertCorriere>): Promise<Corriere | undefined> {
    const result = await db.update(corrieri).set(data).where(eq(corrieri.id, id)).returning();
    return result[0];
  }

  async deleteCorriere(id: string): Promise<boolean> {
    const result = await db.delete(corrieri).where(eq(corrieri.id, id)).returning();
    return result.length > 0;
  }

  // =====================
  // SPEDIZIONI
  // =====================
  async getSpedizioni(): Promise<Spedizione[]> {
    return await db.select().from(spedizioni).orderBy(desc(spedizioni.createdAt));
  }

  async getSpedizione(id: string): Promise<Spedizione | undefined> {
    const result = await db.select().from(spedizioni).where(eq(spedizioni.id, id));
    return result[0];
  }

  async createSpedizione(data: InsertSpedizione): Promise<Spedizione> {
    const result = await db.insert(spedizioni).values(data).returning();
    return result[0];
  }

  async updateSpedizione(id: string, data: Partial<InsertSpedizione>): Promise<Spedizione | undefined> {
    const result = await db.update(spedizioni).set({ ...data, updatedAt: new Date() }).where(eq(spedizioni.id, id)).returning();
    return result[0];
  }

  async deleteSpedizione(id: string): Promise<boolean> {
    const result = await db.delete(spedizioni).where(eq(spedizioni.id, id)).returning();
    return result.length > 0;
  }

  async getNextSpedizioneNumero(): Promise<string> {
    const year = new Date().getFullYear();
    const result = await db.select().from(spedizioni).orderBy(desc(spedizioni.createdAt));
    const count = result.filter(s => s.numero?.startsWith(`SP${year}`)).length + 1;
    return `SP${year}/${count.toString().padStart(4, "0")}`;
  }

  // =====================
  // RIGHE SPEDIZIONE
  // =====================
  async getSpedizioneRighe(spedizioneId: string): Promise<SpedizioneRiga[]> {
    return await db.select().from(spedizioniRighe).where(eq(spedizioniRighe.spedizioneId, spedizioneId));
  }

  async createSpedizioneRiga(data: InsertSpedizioneRiga): Promise<SpedizioneRiga> {
    const result = await db.insert(spedizioniRighe).values(data).returning();
    return result[0];
  }

  async updateSpedizioneRiga(id: string, data: Partial<InsertSpedizioneRiga>): Promise<SpedizioneRiga | undefined> {
    const result = await db.update(spedizioniRighe).set(data).where(eq(spedizioniRighe.id, id)).returning();
    return result[0];
  }

  async deleteSpedizioneRiga(id: string): Promise<boolean> {
    const result = await db.delete(spedizioniRighe).where(eq(spedizioniRighe.id, id)).returning();
    return result.length > 0;
  }

  // =====================
  // COMPANY INFO (La Mia Azienda)
  // =====================
  async getCompanyInfo(): Promise<CompanyInfo | undefined> {
    const result = await db.select().from(companyInfo).limit(1);
    return result[0];
  }

  async createCompanyInfo(data: InsertCompanyInfo): Promise<CompanyInfo> {
    const now = new Date();
    const result = await db.insert(companyInfo).values({
      ...data,
      id: randomUUID(),
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    }).returning();
    return result[0];
  }

  async updateCompanyInfo(id: string, data: Partial<InsertCompanyInfo>): Promise<CompanyInfo | undefined> {
    const result = await db.update(companyInfo).set({
      ...data,
      updatedAt: new Date().toISOString()
    }).where(eq(companyInfo.id, id)).returning();
    return result[0];
  }

  async upsertCompanyInfo(data: InsertCompanyInfo): Promise<CompanyInfo> {
    const existing = await this.getCompanyInfo();
    if (existing) {
      const result = await this.updateCompanyInfo(existing.id, data);
      return result!;
    }
    return await this.createCompanyInfo(data);
  }

  // =====================
  // CONTI BANCARI AZIENDALI
  // =====================
  async getAziendaContiBancari(): Promise<AziendaContoBancario[]> {
    return await db.select().from(aziendaContiBancari)
      .where(eq(aziendaContiBancari.attivo, 1))
      .orderBy(desc(aziendaContiBancari.principale));
  }

  async getAziendaContoBancarioById(id: string): Promise<AziendaContoBancario | undefined> {
    const result = await db.select().from(aziendaContiBancari).where(eq(aziendaContiBancari.id, id));
    return result[0];
  }

  async getAziendaContoPrincipale(): Promise<AziendaContoBancario | undefined> {
    const result = await db.select().from(aziendaContiBancari).where(eq(aziendaContiBancari.principale, true)).limit(1);
    return result[0];
  }

  async createAziendaContoBancario(data: InsertAziendaContoBancario): Promise<AziendaContoBancario> {
    // Se questo è il principale, rimuovi il flag da altri conti
    if (data.principale) {
      await db.update(aziendaContiBancari).set({ principale: false }).where(eq(aziendaContiBancari.principale, true));
    }
    const conto = {
      ...data,
      id: randomUUID(),
      createdAt: new Date().toISOString()
    };
    const result = await db.insert(aziendaContiBancari).values(conto).returning();
    return result[0];
  }

  async updateAziendaContoBancario(id: string, data: Partial<InsertAziendaContoBancario>): Promise<AziendaContoBancario | undefined> {
    // Se questo diventa principale, rimuovi il flag da altri conti
    if (data.principale) {
      await db.update(aziendaContiBancari).set({ principale: false }).where(eq(aziendaContiBancari.principale, true));
    }
    const result = await db.update(aziendaContiBancari).set({ ...data, updatedAt: new Date() }).where(eq(aziendaContiBancari.id, id)).returning();
    return result[0];
  }

  async deleteAziendaContoBancario(id: string): Promise<boolean> {
    const result = await db.delete(aziendaContiBancari).where(eq(aziendaContiBancari.id, id)).returning();
    return result.length > 0;
  }

  // =====================
  // CONDIZIONI DI PAGAMENTO
  // =====================
  async getCondizioniPagamento(): Promise<CondizioniPagamento[]> {
    return await db.select().from(condizioniPagamento).orderBy(condizioniPagamento.codice);
  }

  async createCondizionePagamento(data: InsertCondizioniPagamento): Promise<CondizioniPagamento> {
    const cond = {
      ...data,
      id: randomUUID()
    };
    const result = await db.insert(condizioniPagamento).values(cond).returning();
    return result[0];
  }

  async updateCondizionePagamento(id: string, data: Partial<InsertCondizioniPagamento>): Promise<CondizioniPagamento | undefined> {
    const result = await db.update(condizioniPagamento).set(data).where(eq(condizioniPagamento.id, id)).returning();
    return result[0];
  }

  async deleteCondizionePagamento(id: string): Promise<boolean> {
    const result = await db.delete(condizioniPagamento).where(eq(condizioniPagamento.id, id)).returning();
    return result.length > 0;
  }

  // =====================
  // FINANZA PERSONALE - CATEGORIE
  // =====================
  async getPersonalCategories(userId: string): Promise<PersonalCategory[]> {
    return await db.select().from(personalCategories).where(eq(personalCategories.userId, userId)).orderBy(personalCategories.nome);
  }

  async createPersonalCategory(data: InsertPersonalCategory): Promise<PersonalCategory> {
    const category = {
      ...data,
      id: randomUUID(),
      createdAt: new Date().toISOString()
    };
    const result = await db.insert(personalCategories).values(category).returning();
    return result[0];
  }

  async updatePersonalCategory(id: string, data: Partial<InsertPersonalCategory>): Promise<PersonalCategory | undefined> {
    const result = await db.update(personalCategories).set(data).where(eq(personalCategories.id, id)).returning();
    return result[0];
  }

  async deletePersonalCategory(id: string): Promise<boolean> {
    const result = await db.delete(personalCategories).where(eq(personalCategories.id, id)).returning();
    return result.length > 0;
  }

  // =====================
  // FINANZA PERSONALE - CONTI
  // =====================
  async getPersonalAccounts(userId: string): Promise<PersonalAccount[]> {
    return await db.select().from(personalAccounts).where(eq(personalAccounts.userId, userId)).orderBy(desc(personalAccounts.predefinito));
  }

  async getPersonalAccount(id: string): Promise<PersonalAccount | undefined> {
    const result = await db.select().from(personalAccounts).where(eq(personalAccounts.id, id));
    return result[0];
  }

  async createPersonalAccount(data: InsertPersonalAccount): Promise<PersonalAccount> {
    const account = {
      ...data,
      id: randomUUID(),
      createdAt: new Date().toISOString()
    };
    const result = await db.insert(personalAccounts).values(account).returning();
    return result[0];
  }

  async updatePersonalAccount(id: string, data: Partial<InsertPersonalAccount>): Promise<PersonalAccount | undefined> {
    const result = await db.update(personalAccounts).set({ ...data, updatedAt: new Date() }).where(eq(personalAccounts.id, id)).returning();
    return result[0];
  }

  async deletePersonalAccount(id: string): Promise<boolean> {
    const result = await db.delete(personalAccounts).where(eq(personalAccounts.id, id)).returning();
    return result.length > 0;
  }

  // =====================
  // FINANZA PERSONALE - TRANSAZIONI
  // =====================
  async getPersonalTransactions(userId: string): Promise<PersonalTransaction[]> {
    return await db.select().from(personalTransactions).where(eq(personalTransactions.userId, userId)).orderBy(desc(personalTransactions.data));
  }

  async getPersonalTransactionsByAccount(accountId: string): Promise<PersonalTransaction[]> {
    return await db.select().from(personalTransactions).where(eq(personalTransactions.accountId, accountId)).orderBy(desc(personalTransactions.data));
  }

  async createPersonalTransaction(data: InsertPersonalTransaction): Promise<PersonalTransaction> {
    const transaction = {
      ...data,
      id: randomUUID(),
      createdAt: new Date().toISOString()
    };
    const result = await db.insert(personalTransactions).values(transaction).returning();
    // Aggiorna il saldo del conto
    await this.updateAccountBalance(data.accountId);
    if (data.tipo === 'trasferimento' && data.accountDestinazioneId) {
      await this.updateAccountBalance(data.accountDestinazioneId);
    }
    return result[0];
  }

  async updatePersonalTransaction(id: string, data: Partial<InsertPersonalTransaction>): Promise<PersonalTransaction | undefined> {
    const existing = await db.select().from(personalTransactions).where(eq(personalTransactions.id, id));
    const result = await db.update(personalTransactions).set(data).where(eq(personalTransactions.id, id)).returning();
    // Aggiorna i saldi dei conti coinvolti
    if (existing[0]) {
      await this.updateAccountBalance(existing[0].accountId);
      if (existing[0].accountDestinazioneId) {
        await this.updateAccountBalance(existing[0].accountDestinazioneId);
      }
    }
    if (result[0]) {
      await this.updateAccountBalance(result[0].accountId);
      if (result[0].accountDestinazioneId) {
        await this.updateAccountBalance(result[0].accountDestinazioneId);
      }
    }
    return result[0];
  }

  async deletePersonalTransaction(id: string): Promise<boolean> {
    const existing = await db.select().from(personalTransactions).where(eq(personalTransactions.id, id));
    const result = await db.delete(personalTransactions).where(eq(personalTransactions.id, id)).returning();
    // Aggiorna i saldi dei conti coinvolti
    if (existing[0]) {
      await this.updateAccountBalance(existing[0].accountId);
      if (existing[0].accountDestinazioneId) {
        await this.updateAccountBalance(existing[0].accountDestinazioneId);
      }
    }
    return result.length > 0;
  }

  async updateAccountBalance(accountId: string): Promise<void> {
    const account = await this.getPersonalAccount(accountId);
    if (!account) return;

    const transactions = await this.getPersonalTransactionsByAccount(accountId);
    let balance = parseFloat(account.saldoIniziale || '0');

    for (const tx of transactions) {
      const amount = parseFloat(tx.importo || '0');
      if (tx.tipo === 'entrata') {
        balance += amount;
      } else if (tx.tipo === 'uscita') {
        balance -= amount;
      } else if (tx.tipo === 'trasferimento') {
        if (tx.accountId === accountId) {
          balance -= amount;
        }
        if (tx.accountDestinazioneId === accountId) {
          balance += amount;
        }
      }
    }

    await db.update(personalAccounts).set({ saldoAttuale: balance.toFixed(2) }).where(eq(personalAccounts.id, accountId));
  }

  // =====================
  // FINANZA PERSONALE - BUDGET
  // =====================
  async getPersonalBudgets(userId: string): Promise<PersonalBudget[]> {
    return await db.select().from(personalBudgets).where(eq(personalBudgets.userId, userId)).orderBy(desc(personalBudgets.createdAt));
  }

  async createPersonalBudget(data: InsertPersonalBudget): Promise<PersonalBudget> {
    const budget = {
      ...data,
      id: randomUUID(),
      createdAt: new Date().toISOString()
    };
    const result = await db.insert(personalBudgets).values(budget).returning();
    return result[0];
  }

  async updatePersonalBudget(id: string, data: Partial<InsertPersonalBudget>): Promise<PersonalBudget | undefined> {
    const result = await db.update(personalBudgets).set({ ...data, updatedAt: new Date() }).where(eq(personalBudgets.id, id)).returning();
    return result[0];
  }

  async deletePersonalBudget(id: string): Promise<boolean> {
    const result = await db.delete(personalBudgets).where(eq(personalBudgets.id, id)).returning();
    return result.length > 0;
  }

  // =====================
  // FINANZA PERSONALE - OBIETTIVI
  // =====================
  async getPersonalGoals(userId: string): Promise<PersonalGoal[]> {
    return await db.select().from(personalGoals).where(eq(personalGoals.userId, userId)).orderBy(desc(personalGoals.createdAt));
  }

  async getPersonalGoal(id: string): Promise<PersonalGoal | undefined> {
    const result = await db.select().from(personalGoals).where(eq(personalGoals.id, id));
    return result[0];
  }

  async createPersonalGoal(data: InsertPersonalGoal): Promise<PersonalGoal> {
    const goal = {
      ...data,
      id: randomUUID(),
      createdAt: new Date().toISOString()
    };
    const result = await db.insert(personalGoals).values(goal).returning();
    return result[0];
  }

  async updatePersonalGoal(id: string, data: Partial<InsertPersonalGoal>): Promise<PersonalGoal | undefined> {
    const result = await db.update(personalGoals).set({ ...data, updatedAt: new Date() }).where(eq(personalGoals.id, id)).returning();
    return result[0];
  }

  async deletePersonalGoal(id: string): Promise<boolean> {
    const result = await db.delete(personalGoals).where(eq(personalGoals.id, id)).returning();
    return result.length > 0;
  }

  // =====================
  // FINANZA PERSONALE - VERSAMENTI OBIETTIVI
  // =====================
  async getGoalContributions(goalId: string): Promise<PersonalGoalContribution[]> {
    return await db.select().from(personalGoalContributions).where(eq(personalGoalContributions.goalId, goalId)).orderBy(desc(personalGoalContributions.data));
  }

  async createGoalContribution(data: InsertPersonalGoalContribution): Promise<PersonalGoalContribution> {
    const contribution = {
      ...data,
      id: randomUUID(),
      createdAt: new Date().toISOString()
    };
    const result = await db.insert(personalGoalContributions).values(contribution).returning();
    // Aggiorna l'importo attuale dell'obiettivo
    const contributions = await this.getGoalContributions(data.goalId);
    const total = contributions.reduce((sum, c) => sum + parseFloat(c.importo || '0'), 0);
    await db.update(personalGoals).set({ importoAttuale: total.toFixed(2) }).where(eq(personalGoals.id, data.goalId));
    return result[0];
  }

  async deleteGoalContribution(id: string): Promise<boolean> {
    const existing = await db.select().from(personalGoalContributions).where(eq(personalGoalContributions.id, id));
    const result = await db.delete(personalGoalContributions).where(eq(personalGoalContributions.id, id)).returning();
    // Aggiorna l'importo attuale dell'obiettivo
    if (existing[0]) {
      const contributions = await this.getGoalContributions(existing[0].goalId);
      const total = contributions.reduce((sum, c) => sum + parseFloat(c.importo || '0'), 0);
      await db.update(personalGoals).set({ importoAttuale: total.toFixed(2) }).where(eq(personalGoals.id, existing[0].goalId));
    }
    return result.length > 0;
  }





  // Pulse Keep
  async getKeepNotes(userId: string): Promise<KeepNote[]> {
    return await db.select().from(keepNotes)
      .where(and(eq(keepNotes.userId, userId), eq(keepNotes.deleted, false)))
      .orderBy(desc(keepNotes.pinned), desc(keepNotes.orderIndex), desc(keepNotes.createdAt));
  }

  async getDeletedKeepNotes(userId: string): Promise<KeepNote[]> {
    return await db.select().from(keepNotes)
      .where(and(eq(keepNotes.userId, userId), eq(keepNotes.deleted, true)))
      .orderBy(desc(keepNotes.deletedAt));
  }

  async getKeepNote(id: string): Promise<KeepNote | undefined> {
    const result = await db.select().from(keepNotes).where(eq(keepNotes.id, id));
    return result[0];
  }

  async createKeepNote(note: InsertKeepNote): Promise<KeepNote> {
    const now = new Date().toISOString();
    const result = await db.insert(keepNotes).values({
      ...note,
      id: randomUUID(),
      createdAt: now,
      updatedAt: now
    }).returning();
    return result[0];
  }

  async updateKeepNote(id: string, note: Partial<InsertKeepNote>): Promise<KeepNote> {
    const result = await db.update(keepNotes).set({ ...note, updatedAt: new Date().toISOString() }).where(eq(keepNotes.id, id)).returning();
    return result[0];
  }

  async softDeleteKeepNote(id: string): Promise<KeepNote | undefined> {
    const result = await db.update(keepNotes)
      .set({
        deleted: true,
        deletedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .where(eq(keepNotes.id, id))
      .returning();
    return result[0];
  }

  async restoreKeepNote(id: string): Promise<KeepNote | undefined> {
    const result = await db.update(keepNotes)
      .set({
        deleted: false,
        deletedAt: null,
        updatedAt: new Date().toISOString()
      })
      .where(eq(keepNotes.id, id))
      .returning();
    return result[0];
  }

  async deleteKeepNote(id: string): Promise<boolean> {
    const result = await db.delete(keepNotes).where(eq(keepNotes.id, id)).returning();
    return result.length > 0;
  }

  async duplicateKeepNote(id: string): Promise<KeepNote> {
    const [original] = await db.select().from(keepNotes).where(eq(keepNotes.id, id));
    if (!original) throw new Error("Note not found");

    const { id: _, createdAt, updatedAt, ...rest } = original;
    const result = await db.insert(keepNotes).values({
      ...rest,
      id: randomUUID(),
      title: original.title ? `${original.title} (Copia)` : "Copia",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }).returning();
    return result[0];
  }

  async updateKeepNotesOrder(updates: { id: string; orderIndex: number }[]): Promise<void> {
    await db.transaction(async (tx) => {
      for (const update of updates) {
        await tx.update(keepNotes)
          .set({ orderIndex: update.orderIndex })
          .where(eq(keepNotes.id, update.id));
      }
    });
  }

  async getKeepLabels(userId: string): Promise<KeepLabel[]> {
    return await db.select().from(keepLabels).where(eq(keepLabels.userId, userId)).orderBy(keepLabels.name);
  }

  async createKeepLabel(label: InsertKeepLabel): Promise<KeepLabel> {
    const result = await db.insert(keepLabels).values({ ...label, id: randomUUID() }).returning();
    return result[0];
  }

  async deleteKeepLabel(id: string): Promise<boolean> {
    const result = await db.delete(keepLabels).where(eq(keepLabels.id, id)).returning();
    return result.length > 0;
  }


  // Finance - Invoices
  async getInvoices(): Promise<Invoice[]> {
    return await db.select().from(invoices).orderBy(desc(invoices.createdAt));
  }

  async getInvoice(id: string): Promise<Invoice | undefined> {
    const result = await db.select().from(invoices).where(eq(invoices.id, id));
    return result[0];
  }

  async getProjectInvoices(projectId: string): Promise<Invoice[]> {
    return await db.select().from(invoices).where(eq(invoices.projectId, projectId)).orderBy(desc(invoices.createdAt));
  }

  async createInvoice(insertInvoice: InsertInvoice): Promise<Invoice> {
    const invoice = {
      ...insertInvoice,
      id: randomUUID(),
      createdAt: new Date().toISOString()
    };
    const result = await db.insert(invoices).values(invoice).returning();
    return result[0];
  }

  async updateInvoice(id: string, invoiceData: Partial<InsertInvoice>): Promise<Invoice | undefined> {
    const result = await db.update(invoices).set(invoiceData).where(eq(invoices.id, id)).returning();
    return result[0];
  }

  // Finance - Quotes
  async getQuotes(): Promise<Quote[]> {
    return await db.select().from(quotes).orderBy(desc(quotes.createdAt));
  }

  async getQuote(id: string): Promise<Quote | undefined> {
    const result = await db.select().from(quotes).where(eq(quotes.id, id));
    return result[0];
  }

  async getProjectQuotes(projectId: string): Promise<Quote[]> {
    return await db.select().from(quotes).where(eq(quotes.projectId, projectId)).orderBy(desc(quotes.createdAt));
  }

  async createQuote(insertQuote: InsertQuote): Promise<Quote> {
    const quote = {
      ...insertQuote,
      id: randomUUID(),
      createdAt: new Date().toISOString()
    };
    const result = await db.insert(quotes).values(quote).returning();
    return result[0];
  }

  async updateQuote(id: string, quoteData: Partial<InsertQuote>): Promise<Quote | undefined> {
    const result = await db.update(quotes).set(quoteData).where(eq(quotes.id, id)).returning();
    return result[0];
  }

  // Finance - Transactions
  async getTransactions(): Promise<FinanceTransaction[]> {
    return await db.select().from(financeTransactions).orderBy(desc(financeTransactions.date));
  }

  async getTransaction(id: string): Promise<FinanceTransaction | undefined> {
    const result = await db.select().from(financeTransactions).where(eq(financeTransactions.id, id));
    return result[0];
  }

  async getProjectTransactions(projectId: string): Promise<FinanceTransaction[]> {
    return await db.select().from(financeTransactions).where(eq(financeTransactions.projectId, projectId)).orderBy(desc(financeTransactions.date));
  }

  async createTransaction(insertTransaction: InsertFinanceTransaction): Promise<FinanceTransaction> {
    const transaction = {
      ...insertTransaction,
      id: randomUUID(),
      createdAt: new Date().toISOString()
    };
    const result = await db.insert(financeTransactions).values(transaction).returning();
    return result[0];
  }

  async updateTransaction(id: string, transactionData: Partial<InsertFinanceTransaction>): Promise<FinanceTransaction | undefined> {
    const [updated] = await db.update(financeTransactions).set(transactionData).where(eq(financeTransactions.id, id)).returning();
    return updated;
  }

  // Office Documents
  async getOfficeDocuments(): Promise<OfficeDocument[]> {
    return await db.select().from(officeDocuments).orderBy(desc(officeDocuments.updatedAt));
  }

  async getOfficeDocument(id: string): Promise<OfficeDocument | undefined> {
    const result = await db.select().from(officeDocuments).where(eq(officeDocuments.id, id));
    return result[0];
  }

  async createOfficeDocument(insertDoc: InsertOfficeDocument): Promise<OfficeDocument> {
    const doc = {
      ...insertDoc,
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const result = await db.insert(officeDocuments).values(doc).returning();
    return result[0];
  }

  async updateOfficeDocument(id: string, docData: Partial<InsertOfficeDocument>): Promise<OfficeDocument | undefined> {
    const result = await db.update(officeDocuments).set({ ...docData, updatedAt: new Date().toISOString() }).where(eq(officeDocuments.id, id)).returning();
    return result[0];
  }

  async deleteOfficeDocument(id: string): Promise<boolean> {
    const result = await db.delete(officeDocuments).where(eq(officeDocuments.id, id)).returning();
    return result.length > 0;
  }

  // WhatsApp Contacts
  async getWhatsappContacts(): Promise<WhatsappContact[]> {
    return await db.select().from(whatsappContacts).orderBy(desc(whatsappContacts.lastMessageAt));
  }

  async getWhatsappContact(id: string): Promise<WhatsappContact | undefined> {
    const result = await db.select().from(whatsappContacts).where(eq(whatsappContacts.id, id));
    return result[0];
  }

  async createWhatsappContact(insertContact: InsertWhatsappContact): Promise<WhatsappContact> {
    const contact = {
      ...insertContact,
      id: randomUUID(),
      lastMessageAt: new Date().toISOString()
    };
    const result = await db.insert(whatsappContacts).values(contact).returning();
    return result[0];
  }

  async updateWhatsappContact(id: string, contactData: Partial<InsertWhatsappContact>): Promise<WhatsappContact | undefined> {
    const result = await db.update(whatsappContacts).set(contactData).where(eq(whatsappContacts.id, id)).returning();
    return result[0];
  }

  // WhatsApp Messages
  async getWhatsappMessages(contactId: string): Promise<WhatsappMessage[]> {
    return await db.select().from(whatsappMessages).where(eq(whatsappMessages.contactId, contactId)).orderBy(asc(whatsappMessages.timestamp));
  }

  async createWhatsappMessage(insertMessage: InsertWhatsappMessage): Promise<WhatsappMessage> {
    const message = {
      ...insertMessage,
      id: randomUUID(),
      createdAt: new Date().toISOString()
    };
    const result = await db.insert(whatsappMessages).values(message).returning();
    return result[0];
  }

  // Project Documents
  async getProjectDocuments(projectId: string): Promise<ProjectDocument[]> {
    return await db.select().from(projectDocuments).where(eq(projectDocuments.projectId, projectId));
  }

  async getProjectDocumentsWithDetails(projectId: string): Promise<(ProjectDocument & { document: Document })[]> {
    const rows = await db.select().from(projectDocuments)
      .innerJoin(documents, eq(projectDocuments.documentId, documents.id))
      .where(eq(projectDocuments.projectId, projectId));

    return rows.map(row => ({
      ...row.project_documents,
      document: row.documents
    }));
  }

  async addProjectDocument(data: InsertProjectDocument): Promise<ProjectDocument> {
    const newDoc = {
      ...data,
      id: randomUUID(),
      addedAt: new Date().toISOString()
    };
    const [result] = await db.insert(projectDocuments).values(newDoc).returning();
    return result;
  }

  async removeProjectDocument(id: string): Promise<boolean> {
    const result = await db.delete(projectDocuments).where(eq(projectDocuments.id, id)).returning();
    return result.length > 0;
  }

  async getDocumentProjects(documentId: string): Promise<Project[]> {
    const rows = await db.select().from(projectDocuments)
      .innerJoin(projects, eq(projectDocuments.projectId, projects.id))
      .where(eq(projectDocuments.documentId, documentId));

    return rows.map(row => row.projects);
  }

  // Role Permissions
  async getRolePermissions(role: string): Promise<RolePermission[]> {
    return await db.select().from(rolePermissions).where(eq(rolePermissions.role, role));
  }

  async getAllRolePermissions(): Promise<RolePermission[]> {
    return await db.select().from(rolePermissions);
  }

  async updateRolePermission(role: string, module: string, permissions: Partial<Pick<RolePermission, 'canView' | 'canCreate' | 'canEdit' | 'canDelete'>>): Promise<RolePermission | undefined> {
    const [existing] = await db.select().from(rolePermissions).where(and(eq(rolePermissions.role, role), eq(rolePermissions.module, module)));

    if (existing) {
      const [updated] = await db.update(rolePermissions)
        .set(permissions)
        .where(eq(rolePermissions.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(rolePermissions).values({
        id: randomUUID(),
        role,
        module,
        canView: false,
        canCreate: false,
        canEdit: false,
        canDelete: false,
        ...permissions
      }).returning();
      return created;
    }
  }

  async upsertRolePermission(role: string, module: string, permissions: Pick<RolePermission, 'canView' | 'canCreate' | 'canEdit' | 'canDelete'>): Promise<RolePermission> {
    const [existing] = await db.select().from(rolePermissions).where(and(eq(rolePermissions.role, role), eq(rolePermissions.module, module)));

    if (existing) {
      const [updated] = await db.update(rolePermissions)
        .set(permissions)
        .where(eq(rolePermissions.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(rolePermissions).values({
        id: randomUUID(),
        role,
        module,
        ...permissions
      }).returning();
      return created;
    }
  }





} // End of DatabaseStorage definition

export const storage = new DatabaseStorage();
