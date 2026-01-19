import { ScrollArea } from "@/components/ui/scroll-area";
import { useLocation } from "wouter";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { Search, Star, Archive, Trash2, MailOpen, MoreVertical, Reply, ReplyAll, Forward, Loader2, RefreshCw, Send, Plus, AlertCircle, Inbox, SendHorizontal, FileText, AlertTriangle, Folder, Link, FolderPlus, Check, Settings, PanelRight, PanelBottom, Maximize2, EyeOff, LayoutGrid, X, Paperclip, Tag, FolderInput, BookOpen, Sparkles, ExternalLink, Mail, StickyNote, RotateCcw } from "lucide-react";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { projectsApi, personalTodosApi } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { CheckSquare, Calendar as CalendarIcon, Clock } from "lucide-react";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";

type EmailLayoutMode = 'right' | 'bottom' | 'popup' | 'hidden';

const LAYOUT_STORAGE_KEY = 'pulse-email-layout';

interface ArubaEmail {
  id: string;
  fromAddress: string;
  fromName: string;
  toAddress: string;
  subject: string;
  preview: string;
  body: string;
  unread: boolean;
  starred: boolean;
  receivedAt: string;
  hasAttachments: boolean;
  attachmentCount: number;
}

interface ArubaStatus {
  configured: boolean;
  email: string | null;
}

interface EmailLabel {
  id: string;
  name: string;
  color: string;
  userId?: string;
  createdAt?: string;
}

interface EmailLabelAssignment {
  id: string;
  emailId: string;
  labelId: string;
  label: EmailLabel;
}

async function fetchArubaEmails(accountId?: string): Promise<{ configured: boolean; emails: ArubaEmail[] }> {
  const accountParam = accountId && accountId !== "default" ? `&accountId=${accountId}` : "";
  const res = await fetch(`/api/aruba/emails?limit=15${accountParam}`);
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Errore nel recupero email");
  }
  return res.json();
}

interface EmailFolder {
  name: string;
  path: string;
  delimiter: string;
  flags: string[];
  children?: EmailFolder[];
}

async function fetchArubaStatus(): Promise<ArubaStatus> {
  const res = await fetch("/api/aruba/status");
  return res.json();
}

async function fetchArubaFolders(accountId?: string): Promise<{ configured: boolean; folders: EmailFolder[] }> {
  const accountParam = accountId && accountId !== "default" ? `?accountId=${accountId}` : "";
  const res = await fetch(`/api/aruba/folders${accountParam}`);
  if (!res.ok) {
    throw new Error("Errore nel recupero cartelle");
  }
  return res.json();
}

async function fetchEmailsFromFolder(folderPath: string, accountId?: string): Promise<{ configured: boolean; folder: string; emails: ArubaEmail[] }> {
  const accountParam = accountId && accountId !== "default" ? `&accountId=${accountId}` : "";

  // Prima prova dalla cache, poi fallback a IMAP
  try {
    const cacheRes = await fetch(`/api/email-cache?folder=${encodeURIComponent(folderPath)}&limit=100${accountParam}`);
    if (cacheRes.ok) {
      const cached = await cacheRes.json();
      if (cached.emails && cached.emails.length > 0) {
        return { configured: true, folder: folderPath, emails: cached.emails };
      }
    }
  } catch { }

  // Fallback a IMAP diretto
  const queryParams = [`limit=15`];
  if (accountId && accountId !== "default") queryParams.push(`accountId=${accountId}`);

  const res = await fetch(`/api/aruba/folder/${encodeURIComponent(folderPath)}?${queryParams.join("&")}`);
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Errore nel recupero email");
  }
  return res.json();
}

async function sendArubaEmail(data: { to: string; subject: string; body: string }): Promise<any> {
  const res = await fetch("/api/aruba/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Errore nell'invio email");
  }
  return res.json();
}

const folderIconMap: Record<string, any> = {
  "INBOX": Inbox,
  "Sent": SendHorizontal,
  "Drafts": FileText,
  "Junk": AlertTriangle,
  "Spam": AlertTriangle,
  "Trash": Trash2,
  "Archive": Archive,
};

const folderNameMap: Record<string, string> = {
  "INBOX": "Posta in Arrivo",
  "Sent": "Posta Inviata",
  "Drafts": "Bozze",
  "Junk": "Spam",
  "Spam": "Spam",
  "Trash": "Cestino",
  "Archive": "Archivio",
};

export default function EmailContent() {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const { toast } = useToast();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [projectPopup, setProjectPopup] = useState<{ open: boolean; projectId: string | null; projectTitle: string | null }>({ open: false, projectId: null, projectTitle: null });
  const [selectedFolder, setSelectedFolder] = useState("INBOX");
  const [selectedAccountId, setSelectedAccountId] = useState<string>("default");
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeTo, setComposeTo] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");

  // AI Task Creation State
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [taskData, setTaskData] = useState<{ title: string; description: string; priority: "low" | "medium" | "high"; dueDate: string }>({
    title: "",
    description: "",
    priority: "medium",
    dueDate: ""
  });
  const [isAnalyzingEmail, setIsAnalyzingEmail] = useState(false);

  const extractTaskMutation = useMutation({
    mutationFn: async (email: { content: string; subject: string }) => {
      const res = await fetch("/api/ai/extract-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(email),
      });
      if (!res.ok) throw new Error("Failed to extract task");
      return res.json();
    },
    onSuccess: (data) => {
      setTaskData({
        title: data.title,
        description: data.description,
        priority: data.priority,
        dueDate: data.dueDate || new Date().toISOString().split('T')[0]
      });
      setIsAnalyzingEmail(false);
      setTaskDialogOpen(true);
    },
    onError: () => {
      setIsAnalyzingEmail(false);
      toast({ title: "Errore", description: "Impossibile analizzare l'email", variant: "destructive" });
    }
  });

  const createTodoMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create task");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Successo", description: "Task creato correttamente" });
      setTaskDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["todos"] });
    },
  });

  const handleCreateTaskFromEmail = (email: any) => {
    setIsAnalyzingEmail(true);
    extractTaskMutation.mutate({
      content: email.body || email.preview || "",
      subject: email.subject || ""
    });
  };

  // Handle URL parameters for direct email navigation
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const emailId = params.get("emailId");
    if (emailId) {
      setSelectedEmailId(emailId);
    }
  }, []);

  // Queries for accounts
  const { data: userEmailConfigs = [] } = useQuery({
    queryKey: ["user-email-config"],
    queryFn: async () => {
      const res = await fetch("/api/user-email-config");
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!user?.id,
  });

  // Set default account when configs load
  useEffect(() => {
    if (userEmailConfigs.length > 0 && selectedAccountId === "default") {
      setSelectedAccountId(userEmailConfigs[0].id);
    }
  }, [userEmailConfigs, selectedAccountId]);



  // Wiki dialog state
  const [wikiDialogOpen, setWikiDialogOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<{ email: string; name: string } | null>(null);
  const [wikiData, setWikiData] = useState<any>(null);

  // Query per i contatti email
  const { data: emailContacts = [], isLoading: loadingContacts } = useQuery({
    queryKey: ["email-contacts"],
    queryFn: async () => {
      const res = await fetch("/api/email/contacts");
      if (!res.ok) throw new Error("Errore caricamento contatti");
      return res.json();
    },
    enabled: wikiDialogOpen && !!user?.id,
  });

  // Stato per il progresso del Wiki
  const [wikiProgress, setWikiProgress] = useState(0);
  const [wikiProcessing, setWikiProcessing] = useState(false);
  const [wikiStep, setWikiStep] = useState<string>("");
  const [wikiEmailCount, setWikiEmailCount] = useState<{ folders: { folder: string; count: number }[]; total: number } | null>(null);

  // Mutation per generare il Wiki
  const generateWikiMutation = useMutation({
    mutationFn: async (contact: { email: string; name: string }) => {
      setWikiProcessing(true);
      setWikiProgress(5);
      setWikiStep("Ricerca email in corso...");
      setWikiEmailCount(null);

      // Step 1: Count emails first
      const countRes = await fetch("/api/ai/count-wiki-emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ contactEmail: contact.email }),
      });

      if (countRes.ok) {
        const counts = await countRes.json();
        setWikiEmailCount({ folders: counts.folders || [], total: counts.total });
        setWikiProgress(30);
        setWikiStep(`Trovate ${counts.total} email in ${counts.folders?.length || 0} cartelle. Analisi AI...`);
      } else {
        setWikiProgress(30);
        setWikiStep("Ora sta generando la Wiki... Attendi il completamento.");
      }

      // Step 2: Generate wiki
      const progressInterval = setInterval(() => {
        setWikiProgress(prev => Math.min(prev + 10, 90));
      }, 1500);

      try {
        const res = await fetch("/api/ai/generate-email-wiki", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ contactEmail: contact.email, contactName: contact.name }),
        });

        clearInterval(progressInterval);
        setWikiProgress(95);
        setWikiStep("Completamento...");

        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || "Errore generazione Wiki");
        }
        return res.json();
      } catch (error) {
        clearInterval(progressInterval);
        throw error;
      }
    },
    onSuccess: (data) => {
      setWikiProgress(100);
      setWikiStep("Fatto!");
      setTimeout(() => {
        setWikiData(data);
        setWikiProcessing(false);
        setWikiProgress(0);
        setWikiStep("");
        setWikiEmailCount(null);
      }, 500);
    },
    onError: () => {
      setWikiProcessing(false);
      setWikiProgress(0);
      setWikiStep("");
      setWikiEmailCount(null);
    },
  });

  // Mutation per creare il progetto Wiki
  const createWikiProjectMutation = useMutation({
    mutationFn: async () => {
      if (!wikiData || !selectedContact) return;
      const res = await fetch("/api/ai/create-wiki-project", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactEmail: selectedContact.email,
          contactName: selectedContact.name,
          wiki: { ...wikiData.wiki, totalEmails: wikiData.totalEmails },
        }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Errore creazione progetto");
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["keep-notes"] });
      setWikiDialogOpen(false);
      setWikiData(null);
      setSelectedContact(null);
    },
  });
  const [linkPopoverOpen, setLinkPopoverOpen] = useState(false);
  const [linkedProjectId, setLinkedProjectId] = useState<string | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [layoutMode, setLayoutMode] = useState<EmailLayoutMode>(() => {
    const saved = localStorage.getItem(LAYOUT_STORAGE_KEY);
    return (saved as EmailLayoutMode) || 'right';
  });
  const [popupEmailOpen, setPopupEmailOpen] = useState(false);
  const [bookMode, setBookMode] = useState(false);
  const [bookCurrentPage, setBookCurrentPage] = useState(0);
  const [labelDialogOpen, setLabelDialogOpen] = useState(false);
  const [newLabelName, setNewLabelName] = useState("");
  const [newLabelColor, setNewLabelColor] = useState("#3B82F6");
  const [labelPopoverEmailId, setLabelPopoverEmailId] = useState<string | null>(null);
  const [selectedEmailIds, setSelectedEmailIds] = useState<Set<string>>(new Set());
  const [filterLabelId, setFilterLabelId] = useState<string | null>(null);
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState<{
    open: boolean;
    emailIds: string[];
    linkedProjectName: string | null;
    countdown: number;
  }>({ open: false, emailIds: [], linkedProjectName: null, countdown: 8 });

  const [duplicateLinkWarning, setDuplicateLinkWarning] = useState<{
    open: boolean;
    projectName: string;
  }>({ open: false, projectName: "" });

  const [columnWidths, setColumnWidths] = useState(() => {
    try {
      const saved = localStorage.getItem('email-column-widths');
      return saved ? JSON.parse(saved) : {
        checkbox: 40,
        label: 180,
        sender: 180,
        subject: 300,
        date: 140,
        attachment: 50
      };
    } catch (e) {
      console.error("Failed to parse email-column-widths", e);
      return {
        checkbox: 40,
        label: 180,
        sender: 180,
        subject: 300,
        date: 140,
        attachment: 50
      };
    }
  });
  const [resizing, setResizing] = useState<{ column: string; startX: number; startWidth: number } | null>(null);

  const handleResizeStart = (column: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setResizing({ column, startX: e.clientX, startWidth: columnWidths[column] });
  };

  useEffect(() => {
    if (!resizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const diff = e.clientX - resizing.startX;
      const newWidth = Math.max(50, resizing.startWidth + diff);
      setColumnWidths(prev => {
        const updated = { ...prev, [resizing.column]: newWidth };
        localStorage.setItem('email-column-widths', JSON.stringify(updated));
        return updated;
      });
    };

    const handleMouseUp = () => {
      setResizing(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizing]);

  const toggleEmailSelection = (emailId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedEmailIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(emailId)) {
        newSet.delete(emailId);
      } else {
        newSet.add(emailId);
      }
      return newSet;
    });
  };




  const toggleSelectAll = () => {
    if (selectedEmailIds.size === emails.length) {
      setSelectedEmailIds(new Set());
    } else {
      setSelectedEmailIds(new Set(emails.map(e => e.id)));
    }
  };

  const handleLayoutChange = (mode: EmailLayoutMode) => {
    setLayoutMode(mode);
    localStorage.setItem(LAYOUT_STORAGE_KEY, mode);
    if (mode === 'popup' && selectedEmailId) {
      setPopupEmailOpen(true);
    }
  };

  useEffect(() => {
    if (!deleteConfirmDialog.open) return;
    if (deleteConfirmDialog.countdown <= 0) {
      setDeleteConfirmDialog(prev => ({ ...prev, open: false }));
      return;
    }
    const timer = setTimeout(() => {
      setDeleteConfirmDialog(prev => ({ ...prev, countdown: prev.countdown - 1 }));
    }, 1000);
    return () => clearTimeout(timer);
  }, [deleteConfirmDialog.open, deleteConfirmDialog.countdown]);

  const handleDeleteEmails = (emailIds: string[]) => {
    const linkedProjectNames: string[] = [];
    for (const emailId of emailIds) {
      const linked = linkedEmails.find((le: any) => le.emailId === emailId);
      if (linked) {
        const project = projects.find((p: any) => p.id === linked.projectId);
        if (project?.title) {
          linkedProjectNames.push(project.title);
        }
      }
    }

    if (linkedProjectNames.length > 0) {
      const projectName = linkedProjectNames.length === 1
        ? linkedProjectNames[0]
        : linkedProjectNames.join(', ');
      setDeleteConfirmDialog({
        open: true,
        emailIds,
        linkedProjectName: projectName,
        countdown: 8,
      });
    } else {
      deleteEmailMutation.mutate(emailIds);
    }
  };

  const confirmDeleteWithProject = () => {
    deleteEmailMutation.mutate(deleteConfirmDialog.emailIds);
    setDeleteConfirmDialog({ open: false, emailIds: [], linkedProjectName: null, countdown: 8 });
  };

  const markAsReadMutation = useMutation({
    mutationFn: async ({ emailUid, folder }: { emailUid: number; folder: string }) => {
      const res = await fetch("/api/aruba/email/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailUid, folder }),
      });
      if (!res.ok) throw new Error("Errore");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["aruba-emails"] });
    },
  });

  useEffect(() => {
    const selectedEmail = emails.find(e => e.id === selectedEmailId);
    if (!selectedEmail || !selectedEmail.unread) return;

    // Gestisce entrambi i formati: aruba-123-timestamp e aruba-FOLDER-123-timestamp
    const seqMatch = selectedEmail.id.match(/aruba-(?:[A-Za-z]+[.-])?(\d+)-/);
    if (!seqMatch) return;
    const emailUid = parseInt(seqMatch[1]);

    const timer = setTimeout(() => {
      markAsReadMutation.mutate({ emailUid, folder: selectedFolder });
    }, 3000);

    return () => clearTimeout(timer);
  }, [selectedEmailId, selectedFolder]);

  const { data: userEmailConfig } = useQuery({
    queryKey: ["user-email-config-single", selectedAccountId],
    queryFn: async () => {
      if (selectedAccountId === "default") return null;
      const res = await fetch(`/api/user-email-config`); // The array logic is handled above, but here we might want the specific config details if needed.
      // optimize: just find it in userEmailConfigs
      return userEmailConfigs.find((c: any) => c.id === selectedAccountId);
    },
    enabled: selectedAccountId !== "default"
  });

  const isUserConfigured = userEmailConfigs.length > 0;

  // Carica la firma automaticamente quando si apre il compose dialog
  useEffect(() => {
    if (composeOpen && userEmailConfig?.signature) {
      setComposeBody("\n\n" + userEmailConfig.signature);
    } else if (composeOpen) {
      setComposeBody("");
    }
  }, [composeOpen, userEmailConfig?.signature]);

  const { data: status } = useQuery({
    queryKey: ["aruba-status"],
    queryFn: fetchArubaStatus,
    enabled: !isUserConfigured && !!user?.id,
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: projectsApi.getAll,
    enabled: !!user?.id,
  });

  const { data: linkedEmails = [] } = useQuery({
    queryKey: ["linked-emails"],
    queryFn: async () => {
      const res = await fetch("/api/linked-emails");
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!user?.id,
  });

  const { data: emailLabels = [] } = useQuery<EmailLabel[]>({
    queryKey: ["email-labels"],
    queryFn: async () => {
      const res = await fetch("/api/email-labels");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: labelAssignments = [] } = useQuery<EmailLabelAssignment[]>({
    queryKey: ["email-label-assignments"],
    queryFn: async () => {
      const res = await fetch("/api/email-label-assignments");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const getEmailLabels = (emailId: string): EmailLabel[] => {
    return labelAssignments
      .filter(a => a.emailId === emailId)
      .map(a => a.label);
  };

  const createLabelMutation = useMutation({
    mutationFn: async (data: { name: string; color: string }) => {
      const res = await fetch("/api/email-labels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create label");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-labels"] });
      setNewLabelName("");
      setNewLabelColor("#3B82F6");
    },
  });

  const deleteLabelMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/email-labels/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete label");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-labels"] });
      queryClient.invalidateQueries({ queryKey: ["email-label-assignments"] });
    },
  });

  const assignLabelMutation = useMutation({
    mutationFn: async ({ emailId, labelId }: { emailId: string; labelId: string }) => {
      const res = await fetch(`/api/emails/${encodeURIComponent(emailId)}/labels/${labelId}`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to assign label");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-label-assignments"] });
      setLabelPopoverEmailId(null);
    },
  });

  const removeLabelMutation = useMutation({
    mutationFn: async ({ emailId, labelId }: { emailId: string; labelId: string }) => {
      const res = await fetch(`/api/emails/${encodeURIComponent(emailId)}/labels/${labelId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to remove label");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-label-assignments"] });
    },
  });

  const getLinkedProject = (emailId: string) => {
    const linked = linkedEmails.find((le: any) => le.emailId === emailId);
    if (!linked) return null;
    return linked;
  };

  const deleteEmailMutation = useMutation({
    mutationFn: async (emailIds: string[]) => {
      const results = await Promise.all(
        emailIds.map(emailId =>
          fetch("/api/aruba/email/delete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ emailId, sourceFolder: selectedFolder }),
          }).then(res => res.json())
        )
      );
      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["aruba-folder-emails"] });
      setSelectedEmailIds(new Set());
      setSelectedEmailId(null);
    },
  });

  const archiveEmailMutation = useMutation({
    mutationFn: async (emailIds: string[]) => {
      const results = await Promise.all(
        emailIds.map(emailId =>
          fetch("/api/aruba/email/archive", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ emailId, sourceFolder: selectedFolder }),
          }).then(res => res.json())
        )
      );
      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["aruba-folder-emails"] });
      setSelectedEmailIds(new Set());
      setSelectedEmailId(null);
    },
  });

  const moveEmailMutation = useMutation({
    mutationFn: async ({ emailIds, targetFolder }: { emailIds: string[]; targetFolder: string }) => {
      const results = await Promise.all(
        emailIds.map(emailId =>
          fetch("/api/aruba/email/move", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ emailId, sourceFolder: selectedFolder, targetFolder }),
          }).then(res => res.json())
        )
      );
      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["aruba-folder-emails"] });
      setSelectedEmailIds(new Set());
      setSelectedEmailId(null);
    },
  });

  const linkEmailMutation = useMutation({
    mutationFn: ({ projectId, emailData }: { projectId: string; emailData: any }) =>
      projectsApi.addEmail(projectId, emailData),
    onSuccess: (_, variables) => {
      setLinkedProjectId(variables.projectId);
      setLinkPopoverOpen(false);
      queryClient.invalidateQueries({ queryKey: ["project-emails", variables.projectId] });
      queryClient.invalidateQueries({ queryKey: ["linked-emails"] });
      setTimeout(() => setLinkedProjectId(null), 2000);
    },
  });

  const isConfigured = isUserConfigured || status?.configured;

  const { data: foldersData, isLoading: loadingFolders } = useQuery({
    queryKey: ["aruba-folders", selectedAccountId],
    queryFn: () => fetchArubaFolders(selectedAccountId),
    enabled: !!user?.id,
  });

  const { data: emailData, isLoading: loadingEmails, refetch, isRefetching } = useQuery({
    queryKey: ["aruba-folder-emails", selectedFolder, selectedAccountId],
    queryFn: () => fetchEmailsFromFolder(selectedFolder, selectedAccountId),
    // Pulisce la cache delle query quando cambia la cartella o l'account per evitare flash di email vecchie
    placeholderData: (previousData) => previousData,
    refetchInterval: 30000,
    enabled: !!user?.id,
  });

  const folders = foldersData?.folders || [];
  const emails = emailData?.emails || [];
  const selectedEmail = emails.find((e) => e.id === selectedEmailId) || emails[0];

  useEffect(() => {
    if (emails.length > 0 && !selectedEmailId) {
      setSelectedEmailId(emails[0].id);
    }
  }, [emails, selectedEmailId]);

  useEffect(() => {
    if (loadingEmails || isRefetching) {
      setLoadingProgress(0);
      const interval = setInterval(() => {
        setLoadingProgress(prev => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 15;
        });
      }, 200);
      return () => clearInterval(interval);
    } else {
      setLoadingProgress(100);
      const timeout = setTimeout(() => setLoadingProgress(0), 500);
      return () => clearTimeout(timeout);
    }
  }, [loadingEmails, isRefetching]);

  const sendMutation = useMutation({
    mutationFn: sendArubaEmail,
    onSuccess: () => {
      setComposeOpen(false);
      setComposeTo("");
      setComposeSubject("");
      setComposeBody("");
      queryClient.invalidateQueries({ queryKey: ["aruba-folder-emails"] });
    },
  });

  // Sincronizzazione cache email
  const syncEmailMutation = useMutation({
    mutationFn: async (folder: string) => {
      const res = await fetch("/api/email-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ folder }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Errore sincronizzazione");
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["aruba-folder-emails"] });
      queryClient.invalidateQueries({ queryKey: ["email-cache"] });
      if (data.newEmails > 0) {
        toast({
          title: "Sincronizzazione completata",
          description: `${data.newEmails} nuove email scaricate`,
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Errore sincronizzazione",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSyncAndRefresh = async () => {
    try {
      await syncEmailMutation.mutateAsync(selectedFolder);
      refetch();
    } catch {
      // Error handled by onError
    }
  };

  const formatTime = (date: string | Date) => {
    try {
      const d = new Date(date);
      const now = new Date();
      const isToday = d.toDateString() === now.toDateString();
      if (isToday) {
        return format(d, "HH:mm");
      }
      return format(d, "d MMM", { locale: it });
    } catch {
      return "";
    }
  };

  if (!isConfigured) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center p-8">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-amber-500" />
          <h3 className="text-lg font-semibold mb-2">Email Non Configurata</h3>
          <p className="text-muted-foreground mb-4">
            Configura il tuo account email per visualizzare e inviare messaggi.
          </p>
          <Button onClick={() => setLocation("/control-panel?tab=email")}>
            <Settings className="h-4 w-4 mr-2" />
            Vai alle Impostazioni
          </Button>
        </div>
      </div>
    );
  }

  if (loadingEmails) {
    return (
      <div className="flex h-full bg-background">
        {/* Sidebar skeleton */}
        <div className="w-52 border-r border-border p-3 space-y-2 bg-muted/30">
          <div className="h-8 bg-muted rounded-md animate-pulse mb-4" />
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex items-center gap-2 py-1.5 px-2">
              <div className="h-4 w-4 bg-muted rounded animate-pulse" />
              <div className="h-3 flex-1 bg-muted rounded animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
            </div>
          ))}
        </div>

        {/* Email list skeleton */}
        <div className="flex-1 flex flex-col">
          <div className="h-14 border-b border-border px-4 flex items-center gap-3 bg-muted/20">
            <div className="h-8 w-48 bg-muted rounded-md animate-pulse" />
            <div className="h-8 w-24 bg-muted rounded-md animate-pulse ml-auto" />
          </div>

          <div className="flex-1 p-4 space-y-2 overflow-hidden">
            {[1, 2, 3, 4, 5, 6, 7].map(i => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-card"
                style={{ opacity: 1 - (i * 0.1) }}
              >
                <div className="h-4 w-4 bg-muted rounded animate-pulse" />
                <div className="h-8 w-8 bg-gradient-to-br from-blue-200 to-blue-300 rounded-full animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-28 bg-muted rounded animate-pulse" style={{ animationDelay: `${i * 50}ms` }} />
                    <div className="h-2 w-16 bg-muted/60 rounded animate-pulse ml-auto" />
                  </div>
                  <div className="h-3 w-3/4 bg-muted/80 rounded animate-pulse" style={{ animationDelay: `${i * 75}ms` }} />
                </div>
              </div>
            ))}
          </div>

          {/* Loading indicator */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-background/90 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-border">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  <div className="absolute inset-0 h-8 w-8 rounded-full border-2 border-blue-200 animate-ping opacity-30" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Caricamento email</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-32 bg-muted rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-blue-600 h-1.5 rounded-full transition-all duration-300 ease-out"
                        style={{ width: `${loadingProgress}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">{Math.round(loadingProgress)}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const renderFolder = (folder: EmailFolder, level = 0) => {
    const FolderIcon = folderIconMap[folder.name] || Folder;
    const displayName = folderNameMap[folder.name] || folder.name;
    const isSelected = selectedFolder === folder.path;

    return (
      <div key={folder.path}>
        <button
          onClick={() => {
            setSelectedFolder(folder.path);
            setSelectedEmailId(null);
          }}
          className={`
            w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-colors
            ${isSelected
              ? 'bg-blue-100 text-blue-700 font-medium dark:bg-blue-900/30 dark:text-blue-300'
              : 'text-foreground hover:bg-accent'}
          `}
          style={{ paddingLeft: `${8 + level * 10}px` }}
        >
          <FolderIcon className="h-3.5 w-3.5" />
          <span className="flex-1 text-left truncate">{displayName}</span>
        </button>
        {folder.children && folder.children.map(child => renderFolder(child, level + 1))}
      </div>
    );
  };

  const currentFolderName = folderNameMap[selectedFolder] ||
    folders.find(f => f.path === selectedFolder)?.name ||
    selectedFolder;

  const handleEmailClick = (emailId: string) => {
    setSelectedEmailId(emailId);
    if (layoutMode === 'popup') {
      setPopupEmailOpen(true);
    }
  };

  const renderEmailDetailPanel = (inPopup = false) => {
    if (!selectedEmail) {
      return (
        <div className="flex-1 flex flex-col">
          <div className="p-3 border-b border-border bg-gradient-to-r from-amber-50 to-orange-50">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <MailOpen className="h-4 w-4 text-amber-600" />
              <span className="text-amber-800">LETTURA MESSAGGIO</span>
            </h3>
          </div>
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            Seleziona un'email per leggerla
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col h-full">
        <div className="p-3 border-b border-border bg-gradient-to-r from-amber-50 to-orange-50">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <MailOpen className="h-4 w-4 text-amber-600" />
            <span className="text-amber-800">LETTURA MESSAGGIO</span>
          </h3>
        </div>
        <div className={`${inPopup ? 'h-12' : 'h-14'} border-b border-border flex items-center justify-between px-6 bg-background`}>
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground">
              <Archive className="h-4 w-4" />
            </button>
            <button
              className="p-2 hover:bg-red-100 rounded-md text-muted-foreground hover:text-red-600 transition-colors"
              onClick={async () => {
                if (selectedEmail) {
                  const confirmed = await confirm({
                    title: "Elimina email",
                    description: "Sei sicuro di voler eliminare questa email?",
                    confirmText: "Elimina",
                    variant: "destructive",
                  });
                  if (confirmed) {
                    setSelectedEmailId(null);
                    if (inPopup) setPopupEmailOpen(false);
                  }
                }
              }}
              title="Elimina email"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <button className="p-2 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground">
              <MailOpen className="h-4 w-4" />
            </button>
            <Separator orientation="vertical" className="h-6 mx-1" />
            <button className="p-2 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground">
              <Star className={`h-4 w-4 ${selectedEmail?.starred ? 'fill-yellow-400 text-yellow-400' : ''}`} />
            </button>
            <Separator orientation="vertical" className="h-6 mx-1" />
            <Popover open={linkPopoverOpen} onOpenChange={setLinkPopoverOpen}>
              <PopoverTrigger asChild>
                <button
                  className={`p-2 rounded-md transition-colors flex items-center gap-1 ${linkedProjectId
                    ? 'bg-green-100 text-green-600'
                    : 'hover:bg-blue-100 text-muted-foreground hover:text-blue-600'
                    }`}
                  title="Collega a progetto"
                >
                  {linkedProjectId ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <FolderPlus className="h-4 w-4" />
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-2" align="start">
                <div className="text-sm font-medium mb-2 px-2">Collega a Progetto</div>
                <div className="space-y-1 max-h-48 overflow-auto">
                  {projects.length === 0 ? (
                    <div className="text-xs text-muted-foreground p-2">Nessun progetto disponibile</div>
                  ) : (
                    projects.map((project: any) => {
                      const isAlreadyLinked = selectedEmail && linkedEmails.some(
                        (le: any) => le.emailId === selectedEmail.id && le.projectId === project.id
                      );
                      return (
                        <button
                          key={project.id}
                          onClick={() => {
                            if (selectedEmail) {
                              if (isAlreadyLinked) {
                                setDuplicateLinkWarning({ open: true, projectName: project.title });
                                setLinkPopoverOpen(false);
                              } else {
                                linkEmailMutation.mutate({
                                  projectId: project.id,
                                  emailData: {
                                    emailId: selectedEmail.id,
                                    emailSubject: selectedEmail.subject,
                                    emailFrom: selectedEmail.fromName || selectedEmail.fromAddress,
                                    emailPreview: selectedEmail.preview,
                                    emailDate: selectedEmail.receivedAt,
                                  }
                                });
                              }
                            }
                          }}
                          disabled={linkEmailMutation.isPending}
                          className={`w-full text-left px-2 py-1.5 rounded text-sm flex items-center gap-2 transition-colors ${isAlreadyLinked
                            ? 'bg-green-50 text-green-700'
                            : 'hover:bg-muted'
                            }`}
                        >
                          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isAlreadyLinked ? 'bg-green-500' : 'bg-blue-500'}`} />
                          <span className="truncate">{project.title}</span>
                          {isAlreadyLinked && <Check className="h-3 w-3 ml-auto text-green-600" />}
                        </button>
                      );
                    })
                  )}
                </div>
              </PopoverContent>
            </Popover>
            <Separator orientation="vertical" className="h-6 mx-1" />
            <button
              className="p-2 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground"
              onClick={() => {
                if (selectedEmail) {
                  setComposeTo(selectedEmail.fromAddress);
                  setComposeSubject(`Re: ${selectedEmail.subject}`);
                  setComposeOpen(true);
                }
              }}
              title="Rispondi"
            >
              <Reply className="h-4 w-4" />
            </button>
            <button
              className="p-2 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground"
              title="Rispondi a tutti"
            >
              <ReplyAll className="h-4 w-4" />
            </button>
            <button
              className="p-2 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground"
              onClick={() => {
                if (selectedEmail) {
                  setComposeSubject(`Fwd: ${selectedEmail.subject}`);
                  setComposeBody(`\n\n---------- Messaggio Inoltrato ----------\nDa: ${selectedEmail.fromName} <${selectedEmail.fromAddress}>\n\n${selectedEmail.body.replace(/<[^>]*>/g, '')}`);
                  setComposeOpen(true);
                }
              }}
              title="Inoltra"
            >
              <Forward className="h-4 w-4" />
            </button>
            <Separator orientation="vertical" className="h-6 mx-1" />
            <button
              className={`p-2 rounded-md transition-colors ${bookMode ? 'bg-amber-100 text-amber-700' : 'hover:bg-muted text-muted-foreground hover:text-foreground'}`}
              onClick={() => {
                setBookMode(!bookMode);
                setBookCurrentPage(0);
              }}
              title="Leggi come libro"
            >
              <BookOpen className="h-4 w-4" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            {inPopup && (
              <button
                className="p-2 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground"
                onClick={() => setPopupEmailOpen(false)}
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <button className="p-2 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground">
              <MoreVertical className="h-4 w-4" />
            </button>
          </div>
        </div>
        <ScrollArea className="flex-1 p-8">
          <div className="w-full">
            <div className="mb-8">
              <h1 className="text-2xl font-bold mb-2">{selectedEmail.subject}</h1>
              {(() => {
                const linked = getLinkedProject(selectedEmail.id);
                return linked ? (
                  <div className="mb-4 flex items-center gap-2">
                    <button
                      onClick={() => setProjectPopup({ open: true, projectId: linked.projectId, projectTitle: linked.projectTitle })}
                      className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full flex items-center gap-2 hover:bg-blue-200 transition-colors cursor-pointer"
                    >
                      <FolderPlus className="h-4 w-4" />
                      Collegato a: <strong>{linked.projectTitle || 'Progetto'}</strong>
                    </button>
                  </div>
                ) : null;
              })()}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold">
                    {(selectedEmail.fromName || selectedEmail.fromAddress)[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="font-medium">{selectedEmail.fromName || selectedEmail.fromAddress}</div>
                    <div className="text-xs text-muted-foreground">{selectedEmail.fromAddress}</div>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  {formatTime(selectedEmail.receivedAt)}
                </div>
              </div>
            </div>

            <Separator className="my-6" />

            {bookMode ? (
              // Modalità libro - tutte le email
              (() => {
                const leftEmail = emails[bookCurrentPage * 2];
                const rightEmail = emails[bookCurrentPage * 2 + 1];
                const totalPages = Math.ceil(emails.length / 2);

                const renderEmailPage = (email: typeof emails[0] | undefined, pageNum: number) => {
                  if (!email) return (
                    <div className="flex items-center justify-center h-full text-muted-foreground italic">
                      Fine delle email
                    </div>
                  );

                  const plainText = email.body.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

                  return (
                    <div className="h-full flex flex-col">
                      <div className="text-xs text-amber-600/60 mb-2 text-center">
                        Email {pageNum} di {emails.length}
                      </div>
                      <div className="mb-3 pb-3 border-b border-amber-300/30">
                        <div className="font-semibold text-sm text-stone-800 truncate">{email.subject}</div>
                        <div className="text-xs text-stone-600">Da: {email.fromName || email.fromAddress}</div>
                        <div className="text-xs text-stone-500">{formatTime(email.receivedAt)}</div>
                      </div>
                      <div
                        className="text-sm leading-relaxed text-stone-700 whitespace-pre-wrap overflow-hidden flex-1"
                        style={{
                          textAlign: 'justify',
                          hyphens: 'auto'
                        }}
                      >
                        {plainText.slice(0, 800)}{plainText.length > 800 ? '...' : ''}
                      </div>
                    </div>
                  );
                };

                return (
                  <div className="flex flex-col items-center">
                    <div
                      className="relative flex bg-gradient-to-r from-amber-50 via-amber-100 to-amber-50 rounded-lg shadow-2xl overflow-hidden"
                      style={{
                        width: '100%',
                        maxWidth: '900px',
                        minHeight: '500px',
                        perspective: '2000px'
                      }}
                    >
                      <div
                        className="flex-1 p-6 border-r border-amber-300/50 bg-gradient-to-r from-amber-50 to-amber-100/80"
                        style={{
                          boxShadow: 'inset -10px 0 20px -10px rgba(0,0,0,0.1)',
                          fontFamily: 'Georgia, serif'
                        }}
                      >
                        {renderEmailPage(leftEmail, bookCurrentPage * 2 + 1)}
                      </div>

                      <div
                        className="w-4 bg-gradient-to-r from-amber-200 via-amber-300 to-amber-200"
                        style={{ boxShadow: 'inset 0 0 10px rgba(0,0,0,0.2)' }}
                      />

                      <div
                        className="flex-1 p-6 bg-gradient-to-l from-amber-50 to-amber-100/80"
                        style={{
                          boxShadow: 'inset 10px 0 20px -10px rgba(0,0,0,0.1)',
                          fontFamily: 'Georgia, serif'
                        }}
                      >
                        {renderEmailPage(rightEmail, bookCurrentPage * 2 + 2)}
                      </div>
                    </div>

                    <div className="flex items-center justify-center gap-4 mt-6">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setBookCurrentPage(Math.max(0, bookCurrentPage - 1))}
                        disabled={bookCurrentPage === 0}
                        className="gap-2"
                      >
                        <RotateCcw className="h-4 w-4" />
                        Precedente
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        Pagina {bookCurrentPage + 1} / {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setBookCurrentPage(Math.min(totalPages - 1, bookCurrentPage + 1))}
                        disabled={bookCurrentPage >= totalPages - 1}
                        className="gap-2"
                      >
                        Successiva
                        <RotateCcw className="h-4 w-4 rotate-180" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setBookMode(false);
                          setBookCurrentPage(0);
                        }}
                        className="gap-2 ml-4"
                      >
                        <X className="h-4 w-4" />
                        Chiudi
                      </Button>
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="prose prose-stone max-w-none">
                {selectedEmail.body.includes('<') ? (
                  <iframe
                    srcDoc={`<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:system-ui,-apple-system,sans-serif;font-size:14px;line-height:1.5;color:#333;margin:0;padding:0;}a{color:#2563eb;}img{max-width:100%;height:auto;}</style></head><body>${selectedEmail.body}</body></html>`}
                    className="w-full min-h-[400px] border-0"
                    sandbox="allow-same-origin"
                    title="Email content"
                    style={{ height: 'auto', minHeight: '400px' }}
                    onLoad={(e) => {
                      const iframe = e.target as HTMLIFrameElement;
                      if (iframe.contentDocument) {
                        iframe.style.height = iframe.contentDocument.body.scrollHeight + 'px';
                      }
                    }}
                  />
                ) : (
                  <div className="whitespace-pre-line text-foreground">{selectedEmail.body}</div>
                )}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    );
  };

  const renderEmailList = (expanded = false) => (
    <div className={`shrink-0 border-r-2 border-border flex flex-col bg-[#F7F7F5]/50 overflow-hidden ${expanded ? 'flex-1 min-w-0' : 'w-[450px]'}`}>
      <div className="p-3 border-b border-border bg-gradient-to-r from-blue-50 to-indigo-50">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <Inbox className="h-4 w-4 text-blue-600" />
          <span className="text-blue-800">LISTA MESSAGGI</span>
          {isRefetching && (
            <span className="flex items-center gap-1.5 ml-auto">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
              </span>
              <span className="text-xs text-green-600 font-medium">Controllo...</span>
            </span>
          )}
        </h3>
      </div>
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold flex items-center gap-2"><span className="text-xl">📧</span> {currentFolderName}</h2>
          <div className="flex gap-1">
            {selectedEmailIds.size > 0 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => handleDeleteEmails(Array.from(selectedEmailIds))}
                  disabled={deleteEmailMutation.isPending}
                  title="Elimina"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                  onClick={() => archiveEmailMutation.mutate(Array.from(selectedEmailIds))}
                  disabled={archiveEmailMutation.isPending}
                  title="Archivia"
                >
                  <Archive className="h-4 w-4" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      title="Sposta in cartella"
                    >
                      <FolderInput className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel>Sposta in</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {folders.filter(f => f.path !== selectedFolder).map((folder) => {
                      const FolderIconItem = folderIconMap[folder.name] || Folder;
                      return (
                        <DropdownMenuItem
                          key={folder.path}
                          onClick={() => moveEmailMutation.mutate({
                            emailIds: Array.from(selectedEmailIds),
                            targetFolder: folder.path
                          })}
                        >
                          <FolderIconItem className="h-4 w-4 mr-2" />
                          {folderNameMap[folder.name] || folder.name}
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
                <div className="w-px h-6 bg-border mx-1" />
              </>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleSyncAndRefresh}
              disabled={isRefetching || syncEmailMutation.isPending}
              title="Sincronizza e aggiorna"
            >
              <RefreshCw className={`h-4 w-4 ${isRefetching || syncEmailMutation.isPending ? 'animate-spin' : ''}`} />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" title="Layout lettura">
                  <LayoutGrid className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Posizione Pannello</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => handleLayoutChange('right')}
                  className={layoutMode === 'right' ? 'bg-accent' : ''}
                >
                  <PanelRight className="h-4 w-4 mr-2" />
                  A Destra
                  {layoutMode === 'right' && <Check className="h-4 w-4 ml-auto" />}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleLayoutChange('bottom')}
                  className={layoutMode === 'bottom' ? 'bg-accent' : ''}
                >
                  <PanelBottom className="h-4 w-4 mr-2" />
                  In Basso
                  {layoutMode === 'bottom' && <Check className="h-4 w-4 ml-auto" />}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleLayoutChange('popup')}
                  className={layoutMode === 'popup' ? 'bg-accent' : ''}
                >
                  <Maximize2 className="h-4 w-4 mr-2" />
                  Popup
                  {layoutMode === 'popup' && <Check className="h-4 w-4 ml-auto" />}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleLayoutChange('hidden')}
                  className={layoutMode === 'hidden' ? 'bg-accent' : ''}
                >
                  <EyeOff className="h-4 w-4 mr-2" />
                  Nascosto
                  {layoutMode === 'hidden' && <Check className="h-4 w-4 ml-auto" />}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Plus className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Nuova Email</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Destinatario</Label>
                    <Input
                      placeholder="email@esempio.com"
                      value={composeTo}
                      onChange={(e) => setComposeTo(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Oggetto</Label>
                    <Input
                      placeholder="Oggetto dell'email"
                      value={composeSubject}
                      onChange={(e) => setComposeSubject(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Messaggio</Label>
                    <textarea
                      placeholder="Scrivi il messaggio..."
                      value={composeBody}
                      onChange={(e) => setComposeBody(e.target.value)}
                      className="flex min-h-[150px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    />
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => sendMutation.mutate({ to: composeTo, subject: composeSubject, body: composeBody })}
                    disabled={!composeTo || !composeSubject || !composeBody || sendMutation.isPending}
                  >
                    {sendMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4 mr-2" />
                    )}
                    Invia Email
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              title="Crea Task da Email"
              onClick={() => {
                const emailToUse = selectedEmailIds.size === 1
                  ? emails.find(e => e.id === Array.from(selectedEmailIds)[0])
                  : selectedEmail;

                if (emailToUse) {
                  handleCreateTaskFromEmail(emailToUse);
                }
              }}
              disabled={isAnalyzingEmail}
            >
              {isAnalyzingEmail ? (
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              ) : (
                <CheckSquare className="h-4 w-4" />
              )}
            </Button>
            {/* Wiki Email Dialog */}
            <Dialog open={wikiDialogOpen} onOpenChange={(open) => {
              setWikiDialogOpen(open);
              if (!open) {
                setWikiData(null);
                setSelectedContact(null);
                setWikiProcessing(false);
                setWikiProgress(0);
                setWikiStep("");
                setWikiEmailCount(null);
              }
            }}>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  title="Genera Wiki Email"
                  onClick={() => {
                    // Se c'è un'email selezionata, usa il suo mittente come contatto
                    if (selectedEmailIds.size === 1) {
                      const emailId = Array.from(selectedEmailIds)[0];
                      const email = emails.find(e => e.id === emailId);
                      if (email) {
                        const fromMatch = (email.fromAddress || "").match(/<([^>]+)>/) || [null, email.fromAddress];
                        const fromEmail = (fromMatch[1] || email.fromAddress || "").toLowerCase().trim();
                        const fromName = email.fromName || email.fromAddress?.replace(/<[^>]+>/, "").trim() || fromEmail;
                        setSelectedContact({ email: fromEmail, name: fromName });
                      }
                    }
                  }}
                >
                  <BookOpen className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[550px] max-h-[75vh] overflow-hidden flex flex-col text-xs">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-sm">
                    <BookOpen className="h-4 w-4" />
                    Email Wiki - Riassunto Corrispondenza
                  </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto space-y-4 pt-2">
                  {/* Schermata di elaborazione con progresso */}
                  {wikiProcessing ? (
                    <div className="py-6 text-center space-y-3">
                      <div className="relative inline-flex">
                        <Sparkles className="h-8 w-8 text-primary animate-pulse" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-sm font-semibold">{wikiStep || "Elaborazione..."}</h3>
                        <p className="text-xs text-muted-foreground">
                          {selectedContact?.name}
                        </p>
                      </div>

                      {/* Contatori email in tempo reale */}
                      {wikiEmailCount && (
                        <div className="space-y-2 py-2">
                          <div className="flex justify-center items-center gap-2">
                            <span className="text-2xl font-bold text-green-600">{wikiEmailCount.total}</span>
                            <span className="text-xs text-muted-foreground">email trovate</span>
                          </div>
                          {wikiEmailCount.folders.length > 0 && (
                            <div className="max-h-20 overflow-y-auto text-[10px] text-muted-foreground space-y-0.5">
                              {wikiEmailCount.folders.map((f, i) => (
                                <div key={i} className="flex justify-between px-4">
                                  <span className="truncate">{f.folder}</span>
                                  <span className="font-medium ml-2">{f.count}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      <div className="max-w-xs mx-auto space-y-1">
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all duration-500 ease-out rounded-full"
                            style={{ width: `${wikiProgress}%` }}
                          />
                        </div>
                        <p className="text-xs font-medium">{wikiProgress}%</p>
                      </div>
                    </div>
                  ) : !wikiData ? (
                    <>
                      {/* Se c'è già un contatto selezionato dall'email, mostra direttamente */}
                      {selectedContact ? (
                        <div className="py-4 text-center space-y-3">
                          <div className="p-3 bg-primary/10 border border-primary rounded-lg inline-block">
                            <p className="text-[10px] text-muted-foreground mb-0.5">Contatto selezionato:</p>
                            <p className="font-bold text-lg animate-pulse">{selectedContact.name}</p>
                            <p className="text-xs text-muted-foreground">{selectedContact.email}</p>
                          </div>

                          <p className="text-xs text-muted-foreground">
                            Clicca per generare un riassunto cronologico di tutta la corrispondenza con questo contatto.
                          </p>

                          <div className="flex gap-2 justify-center">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setWikiDialogOpen(false)}
                            >
                              Annulla
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => generateWikiMutation.mutate(selectedContact)}
                            >
                              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                              Genera Wiki
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="text-xs text-muted-foreground">
                            Seleziona un contatto per generare un riassunto cronologico di tutta la corrispondenza email con AI.
                          </p>

                          {loadingContacts ? (
                            <div className="flex items-center justify-center py-6">
                              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                            </div>
                          ) : emailContacts.length === 0 ? (
                            <div className="text-center py-6 text-muted-foreground">
                              <Mail className="h-8 w-8 mx-auto mb-2 opacity-50" />
                              <p className="text-xs">Nessun contatto trovato nelle email</p>
                            </div>
                          ) : (
                            <div className="h-[220px] border rounded-md overflow-y-auto">
                              <div className="p-1.5 space-y-0.5">
                                {emailContacts.map((contact: { email: string; name: string; count: number }) => (
                                  <button
                                    type="button"
                                    key={contact.email}
                                    className="w-full flex items-center justify-between p-2 rounded-md cursor-pointer transition-all text-left hover:bg-accent border border-transparent hover:border-primary"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setSelectedContact({ email: contact.email, name: contact.name });
                                    }}
                                  >
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium text-xs truncate">{contact.name}</p>
                                      <p className="text-[10px] text-muted-foreground truncate">{contact.email}</p>
                                    </div>
                                    <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded-full ml-2 flex-shrink-0">
                                      {contact.count}
                                    </span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      )}

                      {generateWikiMutation.isError && (
                        <p className="text-sm text-destructive text-center">
                          {(generateWikiMutation.error as Error).message}
                        </p>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">{wikiData.contactName}</h3>
                          <p className="text-sm text-muted-foreground">{wikiData.contactEmail}</p>
                        </div>
                        <span className="text-sm bg-primary/10 text-primary px-3 py-1 rounded-full">
                          {wikiData.totalEmails} email analizzate
                        </span>
                      </div>

                      <div className="space-y-4">
                        <div className="p-4 bg-muted/50 rounded-lg">
                          <h4 className="font-medium mb-2 flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Panoramica
                          </h4>
                          <p className="text-sm whitespace-pre-wrap">{wikiData.wiki.summary}</p>
                        </div>

                        {wikiData.wiki.topics?.length > 0 && (
                          <div>
                            <h4 className="font-medium mb-2">Temi Principali</h4>
                            <div className="flex flex-wrap gap-2">
                              {wikiData.wiki.topics.map((topic: string, i: number) => (
                                <span key={i} className="bg-accent px-2 py-1 rounded text-sm">
                                  {topic}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {wikiData.wiki.keyPoints?.length > 0 && (
                          <div>
                            <h4 className="font-medium mb-2">Punti Chiave</h4>
                            <ul className="text-sm space-y-1">
                              {wikiData.wiki.keyPoints.map((point: string, i: number) => (
                                <li key={i} className="flex items-start gap-2">
                                  <Check className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                                  {point}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {wikiData.wiki.timeline?.length > 0 && (
                          <div>
                            <h4 className="font-medium mb-2">Timeline Comunicazioni</h4>
                            <ScrollArea className="h-[150px]">
                              <div className="space-y-2">
                                {wikiData.wiki.timeline.slice(0, 10).map((item: any, i: number) => (
                                  <div key={i} className="flex items-start gap-2 text-sm p-2 bg-muted/30 rounded">
                                    <span className={item.direction === 'incoming' ? 'text-blue-500' : 'text-green-500'}>
                                      {item.direction === 'incoming' ? '📥' : '📤'}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs text-muted-foreground">{item.date}</span>
                                        <span className="font-medium truncate">{item.subject}</span>
                                      </div>
                                      <p className="text-muted-foreground text-xs">{item.summary}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </ScrollArea>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => {
                            setWikiData(null);
                            setSelectedContact(null);
                          }}
                        >
                          Indietro
                        </Button>
                        <Button
                          className="flex-1"
                          disabled={createWikiProjectMutation.isPending}
                          onClick={() => createWikiProjectMutation.mutate()}
                        >
                          {createWikiProjectMutation.isPending ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Salvataggio...
                            </>
                          ) : (
                            <>
                              <StickyNote className="h-4 w-4 mr-2" />
                              Salva in Pulse Keep
                            </>
                          )}
                        </Button>
                      </div>

                      {createWikiProjectMutation.isError && (
                        <p className="text-sm text-destructive text-center">
                          {(createWikiProjectMutation.error as Error).message}
                        </p>
                      )}
                    </>
                  )}
                </div>
              </DialogContent>
            </Dialog>

            {/* Vai a Pulse Keep */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              title="Vai a Pulse Keep"
              onClick={() => setLocation("/pulse-keep")}
            >
              <StickyNote className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Cerca email..." className="pl-8 bg-background border-none shadow-sm focus-visible:ring-1" />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant={filterLabelId ? "secondary" : "ghost"}
                size="sm"
                className={`h-9 gap-1 ${filterLabelId ? 'border-2' : ''}`}
                style={filterLabelId ? { borderColor: emailLabels.find(l => l.id === filterLabelId)?.color } : {}}
              >
                <Tag className="h-3.5 w-3.5" />
                {filterLabelId ? emailLabels.find(l => l.id === filterLabelId)?.name : 'Etichetta'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Filtra per etichetta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setFilterLabelId(null)}>
                <X className="h-4 w-4 mr-2" />
                Tutte le email
                {!filterLabelId && <Check className="h-4 w-4 ml-auto" />}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {emailLabels.map((label) => (
                <DropdownMenuItem
                  key={label.id}
                  onClick={() => setFilterLabelId(label.id)}
                  className={filterLabelId === label.id ? 'bg-accent' : ''}
                >
                  <span
                    className="w-3 h-3 rounded-full mr-2 flex-shrink-0"
                    style={{ backgroundColor: label.color }}
                  />
                  {label.name}
                  {filterLabelId === label.id && <Check className="h-4 w-4 ml-auto" />}
                </DropdownMenuItem>
              ))}
              {emailLabels.length === 0 && (
                <div className="px-2 py-1.5 text-xs text-muted-foreground">Nessuna etichetta creata</div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {filterLabelId
            ? `${emails.filter(e => getEmailLabels(e.id).some(l => l.id === filterLabelId)).length} email con etichetta "${emailLabels.find(l => l.id === filterLabelId)?.name}"`
            : `${emails.length} email`
          }
        </p>
      </div>
      <ScrollArea className="flex-1">
        <div className="min-w-full">
          {emails.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              Nessuna email trovata
            </div>
          ) : (
            <table className="w-full text-xs">
              <thead className="bg-muted/50 sticky top-0">
                <tr className="border-b border-border">
                  <th style={{ width: '40px', minWidth: '40px' }} className="text-center py-2 px-3 font-medium text-muted-foreground text-xs whitespace-nowrap">
                    <Paperclip className="h-3.5 w-3.5 mx-auto" />
                  </th>
                  <th className="text-left py-2 px-2 font-medium text-muted-foreground text-xs whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={emails.length > 0 && selectedEmailIds.size === emails.length}
                        onChange={toggleSelectAll}
                        className="h-3.5 w-3.5 rounded border-gray-300 cursor-pointer"
                      />
                      <span>ETICHETTA</span>
                    </div>
                  </th>
                  <th style={{ width: '140px', minWidth: '140px' }} className="text-left py-2 px-3 font-medium text-muted-foreground text-xs whitespace-nowrap">
                    {selectedFolder === 'Sent' || selectedFolder === 'INBOX.Sent' ? 'DESTINATARIO' : 'MITTENTE'}
                  </th>
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground text-xs whitespace-nowrap">
                    OGGETTO
                  </th>
                  <th style={{ width: '100px', minWidth: '100px' }} className="text-left py-2 px-3 font-medium text-muted-foreground text-xs whitespace-nowrap">
                    DATA
                  </th>
                </tr>
              </thead>
              <tbody>
                {emails
                  .filter(email => !filterLabelId || getEmailLabels(email.id).some(l => l.id === filterLabelId))
                  .map((email) => {
                    const emailDate = new Date(email.receivedAt);
                    const dateStr = format(emailDate, "dd/MM/yyyy", { locale: it });
                    const timeStr = format(emailDate, "HH:mm", { locale: it });
                    const linked = getLinkedProject(email.id);

                    const isMultiSelected = selectedEmailIds.has(email.id);

                    return (
                      <tr
                        key={email.id}
                        onClick={() => handleEmailClick(email.id)}
                        className={`
                        border-b border-border/50 cursor-pointer select-none
                        transition-all duration-150 ease-in-out
                        hover:bg-slate-100 hover:shadow-sm dark:hover:bg-slate-800/50
                        active:bg-slate-200 dark:active:bg-slate-700/50
                        ${isMultiSelected ? 'bg-yellow-100 dark:bg-yellow-900/30 hover:bg-yellow-150' : ''}
                        ${!isMultiSelected && selectedEmail?.id === email.id ? 'bg-blue-100 dark:bg-blue-950/30 shadow-inner' : ''}
                        ${!isMultiSelected && selectedEmail?.id !== email.id && email.unread ? 'font-semibold' : ''}
                      `}
                      >
                        <td style={{ width: '40px', minWidth: '40px' }} className="py-2 px-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {email.hasAttachments && (
                              <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
                            )}
                            <Button variant="ghost" size="sm" onClick={() => archiveEmailMutation.mutate([selectedEmailId])} title="Archivia" className="h-6 w-6 p-0 hover:bg-slate-200 rounded-full">
                              <Archive className="h-3.5 w-3.5 text-muted-foreground" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteEmails([selectedEmailId])} title="Elimina" className="h-6 w-6 p-0 hover:bg-red-100 rounded-full">
                              <Trash2 className="h-3.5 w-3.5 text-red-500" />
                            </Button>
                          </div>
                        </td>
                        <td className="py-2 px-2 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isMultiSelected}
                              onClick={(e) => toggleEmailSelection(email.id, e)}
                              onChange={() => { }}
                              className="h-3.5 w-3.5 rounded border-gray-300 cursor-pointer flex-shrink-0"
                            />
                            <div className="flex items-center gap-1 flex-nowrap">
                              {email.starred && (
                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 flex-shrink-0" />
                              )}
                              {getEmailLabels(email.id).map((label) => (
                                <span
                                  key={label.id}
                                  className="text-xs px-1.5 py-0.5 rounded text-white font-medium flex items-center gap-1"
                                  style={{ backgroundColor: label.color }}
                                >
                                  {label.name}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      removeLabelMutation.mutate({ emailId: email.id, labelId: label.id });
                                    }}
                                    className="hover:bg-white/20 rounded-full p-0.5"
                                  >
                                    <X className="h-2.5 w-2.5" />
                                  </button>
                                </span>
                              ))}
                              {linked && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setProjectPopup({ open: true, projectId: linked.projectId, projectTitle: linked.projectTitle });
                                  }}
                                  className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded flex items-center gap-1 hover:bg-green-200 transition-colors border border-green-300"
                                  title={`Progetto: ${linked.projectTitle}`}
                                >
                                  <FolderPlus className="h-3 w-3" />
                                  <span className="max-w-[100px] truncate">{linked.projectTitle}</span>
                                </button>
                              )}
                              <Popover open={labelPopoverEmailId === email.id} onOpenChange={(open) => setLabelPopoverEmailId(open ? email.id : null)}>
                                <PopoverTrigger asChild>
                                  <button
                                    onClick={(e) => e.stopPropagation()}
                                    className="text-xs text-muted-foreground hover:text-foreground hover:bg-muted px-1 py-0.5 rounded transition-colors"
                                    title="Aggiungi etichetta"
                                  >
                                    <Tag className="h-3 w-3" />
                                  </button>
                                </PopoverTrigger>
                                <PopoverContent className="w-48 p-2" align="start" onClick={(e) => e.stopPropagation()}>
                                  <div className="text-xs font-medium mb-2">Assegna etichetta</div>
                                  <div className="space-y-1 max-h-32 overflow-auto">
                                    {emailLabels.length === 0 ? (
                                      <div className="text-xs text-muted-foreground py-1">Nessuna etichetta</div>
                                    ) : (
                                      emailLabels.map((label) => {
                                        const isAssigned = getEmailLabels(email.id).some(l => l.id === label.id);
                                        return (
                                          <button
                                            key={label.id}
                                            onClick={() => {
                                              if (!isAssigned) {
                                                assignLabelMutation.mutate({ emailId: email.id, labelId: label.id });
                                              }
                                            }}
                                            disabled={isAssigned}
                                            className={`w-full text-left px-2 py-1 rounded text-xs flex items-center gap-2 ${isAssigned ? 'opacity-50 cursor-not-allowed' : 'hover:bg-muted'}`}
                                          >
                                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: label.color }} />
                                            <span className="truncate">{label.name}</span>
                                            {isAssigned && <Check className="h-3 w-3 ml-auto text-green-500" />}
                                          </button>
                                        );
                                      })
                                    )}
                                  </div>
                                  <div className="border-t mt-2 pt-2">
                                    <button
                                      onClick={() => {
                                        setLabelPopoverEmailId(null);
                                        setLabelDialogOpen(true);
                                      }}
                                      className="text-xs text-blue-600 hover:underline"
                                    >
                                      + Gestisci etichette
                                    </button>
                                  </div>
                                </PopoverContent>
                              </Popover>
                            </div>
                          </div>
                        </td>
                        <td style={{ width: '140px', minWidth: '140px' }} className="py-2 px-3 overflow-hidden">
                          <span className={`truncate block ${email.unread ? 'font-semibold' : ''}`}>
                            {selectedFolder === 'Sent' || selectedFolder === 'INBOX.Sent'
                              ? (email.toAddress?.split('@')[0] || email.toAddress)
                              : (email.fromName || email.fromAddress.split('@')[0])
                            }
                          </span>
                        </td>
                        <td className="py-2 px-3 overflow-hidden">
                          <span className={`truncate block ${email.unread ? 'font-semibold' : 'text-foreground/80'}`}>
                            {email.subject}
                          </span>
                        </td>
                        <td style={{ width: '100px', minWidth: '100px' }} className="py-2 px-3 whitespace-nowrap text-muted-foreground overflow-hidden">
                          <span>{dateStr}</span>
                          <span className="ml-2 text-xs">{timeStr}</span>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          )}
        </div>
      </ScrollArea>
    </div>
  );

  const renderFoldersSidebar = () => (
    <div className="w-48 shrink-0 border-r border-border flex flex-col bg-[#F7F7F5]/30">
      <div className="flex items-center gap-2 mb-4 px-2">
        <Mail className="h-5 w-5 text-primary" />
        <span className="font-semibold text-lg">Posta</span>
      </div>

      <div className="px-2 mb-4">
        <Label className="text-xs text-muted-foreground mb-1 block">Account</Label>
        <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Seleziona account" />
          </SelectTrigger>
          <SelectContent>
            {userEmailConfigs.length > 0 ? (
              userEmailConfigs.map((cfg: any) => (
                <SelectItem key={cfg.id} value={cfg.id}>
                  {cfg.displayName || cfg.emailAddress}
                </SelectItem>
              ))
            ) : (
              <SelectItem value="default" disabled>Nessun account</SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>

      <Button
        className="w-full mb-4 gap-2"
        onClick={() => setComposeOpen(true)}
      >
        <Plus className="h-4 w-4" /> Componi
      </Button>
      <div className="p-3 border-b border-border">
        <h3 className="font-semibold text-xs text-muted-foreground">CARTELLE</h3>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {loadingFolders ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : folders.length === 0 ? (
            <button
              onClick={() => setSelectedFolder("INBOX")}
              className={`
                w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-colors
                ${selectedFolder === "INBOX"
                  ? 'bg-blue-100 text-blue-700 font-medium dark:bg-blue-900/30 dark:text-blue-300'
                  : 'text-foreground hover:bg-accent'}
              `}
            >
              <Inbox className="h-3.5 w-3.5" />
              <span className="flex-1 text-left">Posta in Arrivo</span>
            </button>
          ) : (
            folders.map(folder => renderFolder(folder))
          )}
        </div>
      </ScrollArea>
    </div>
  );

  return (
    <>
      {layoutMode === 'right' && (
        <div className="flex h-full overflow-hidden">
          {renderFoldersSidebar()}
          {renderEmailList()}
          <div className="flex-1 min-w-0 flex flex-col bg-background overflow-hidden">
            {renderEmailDetailPanel()}
          </div>
        </div>
      )}

      {layoutMode === 'bottom' && (
        <div className="flex h-full overflow-hidden">
          {renderFoldersSidebar()}
          <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
            <div className="h-1/2 border-b border-border flex flex-col overflow-hidden">
              {renderEmailList(true)}
            </div>
            <div className="h-1/2 flex flex-col bg-background overflow-auto">
              {renderEmailDetailPanel()}
            </div>
          </div>
        </div>
      )}

      {(layoutMode === 'popup' || layoutMode === 'hidden') && (
        <div className="flex h-full overflow-hidden">
          {renderFoldersSidebar()}
          {renderEmailList(true)}
          <Dialog open={popupEmailOpen} onOpenChange={setPopupEmailOpen}>
            <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0">
              {renderEmailDetailPanel(true)}
            </DialogContent>
          </Dialog>
        </div>
      )}

      <Dialog open={labelDialogOpen} onOpenChange={setLabelDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5 text-blue-600" />
              Gestisci Etichette
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Nome etichetta (es. AVVOCATO)"
                value={newLabelName}
                onChange={(e) => setNewLabelName(e.target.value)}
                className="flex-1"
              />
              <input
                type="color"
                value={newLabelColor}
                onChange={(e) => setNewLabelColor(e.target.value)}
                className="w-10 h-10 rounded cursor-pointer border border-border"
                title="Scegli colore"
              />
              <Button
                onClick={() => createLabelMutation.mutate({ name: newLabelName, color: newLabelColor })}
                disabled={!newLabelName.trim() || createLabelMutation.isPending}
                size="sm"
              >
                {createLabelMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              </Button>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Etichette esistenti:</p>
              {emailLabels.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nessuna etichetta creata</p>
              ) : (
                <div className="space-y-1">
                  {emailLabels.map((label) => (
                    <div key={label.id} className="flex items-center gap-2 p-2 rounded border border-border">
                      <span
                        className="w-4 h-4 rounded-full flex-shrink-0"
                        style={{ backgroundColor: label.color }}
                      />
                      <span className="flex-1 text-sm font-medium">{label.name}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          const confirmed = await confirm({
                            title: "Elimina etichetta",
                            description: `Sei sicuro di voler eliminare l'etichetta "${label.name}"? Verrà rimossa da tutte le email.`,
                            confirmText: "Elimina",
                            variant: "destructive",
                          });
                          if (confirmed) {
                            deleteLabelMutation.mutate(label.id);
                          }
                        }}

                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent >
      </Dialog >

      <Dialog open={projectPopup.open} onOpenChange={(open) => setProjectPopup(prev => ({ ...prev, open }))}>
        <DialogContent className="max-w-5xl h-[85vh] flex flex-col p-0">
          <DialogHeader className="p-4 border-b flex-shrink-0">
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderPlus className="h-5 w-5 text-blue-600" />
                <span>{projectPopup.projectTitle || 'Progetto'}</span>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    setProjectPopup({ open: false, projectId: null, projectTitle: null });
                    setLocation(`/projects?id=${projectPopup.projectId}`);
                  }}
                >
                  <Folder className="h-4 w-4 mr-2" />
                  Apri Completo
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            {projectPopup.projectId && (
              <iframe
                src={`/internal/project/${projectPopup.projectId}`}
                className="w-full h-full border-0"
                title="Vista Progetto"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Crea Task da Email</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Titolo</Label>
              <Input
                id="title"
                value={taskData.title}
                onChange={(e) => setTaskData({ ...taskData, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descrizione</Label>
              <textarea
                id="description"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={taskData.description}
                onChange={(e) => setTaskData({ ...taskData, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priority">Priorità</Label>
                <Select
                  value={taskData.priority}
                  onValueChange={(value: any) => setTaskData({ ...taskData, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Bassa</SelectItem>
                    <SelectItem value="medium">Media</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDate">Scadenza</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={taskData.dueDate}
                  onChange={(e) => setTaskData({ ...taskData, dueDate: e.target.value })}
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setTaskDialogOpen(false)}>Annulla</Button>
            <Button onClick={() => createTodoMutation.mutate({
              title: taskData.title,
              description: taskData.description,
              priority: taskData.priority,
              dueDate: taskData.dueDate,
              completed: false
            })}>
              Crea Task
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteConfirmDialog.open} onOpenChange={(open) => !open && setDeleteConfirmDialog(prev => ({ ...prev, open: false }))}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <AlertCircle className="h-6 w-6" />
              ATTENZIONE
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-base mb-4">
              L'email è presente all'interno del progetto <strong>"{deleteConfirmDialog.linkedProjectName}"</strong>
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              Mi confermi la cancellazione?
            </p>
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  onClick={confirmDeleteWithProject}
                >
                  Sì
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setDeleteConfirmDialog(prev => ({ ...prev, open: false }))}
                >
                  Annulla
                </Button>
              </div>
              <div className="text-sm text-muted-foreground">
                Chiusura automatica in <span className="font-bold text-amber-600">{deleteConfirmDialog.countdown}</span>s
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={duplicateLinkWarning.open} onOpenChange={(open) => setDuplicateLinkWarning(prev => ({ ...prev, open }))}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <AlertCircle className="h-6 w-6" />
              Attenzione
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-base">
              Email già inserita nel progetto <strong>"{duplicateLinkWarning.projectName}"</strong>
            </p>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => setDuplicateLinkWarning({ open: false, projectName: "" })}>
              OK
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
