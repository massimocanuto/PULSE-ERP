import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  FileText, Plus, Search, MoreHorizontal, Trash2, Share2,
  MessageSquare, Clock, Users, ChevronRight, Loader2, X, Check,
  Bold, Italic, Underline, Image, Video, Minus, CheckSquare, List, FolderPlus,
  AlignLeft, AlignCenter, AlignRight, Highlighter, MessageCircle, Link2, Eye, EyeOff, User, Edit3,
  LayoutGrid, LayoutList, Calendar, HardDrive, FileUp, File, Sparkles, Circle, FileSpreadsheet, Table,
  ListOrdered, ChevronDown, Maximize2, Minimize2, Tag, XCircle, Printer, BookOpen, Palette, ChevronLeft,
  FileType2, Presentation
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { documentsApi, usersApi, projectsApi, chatApi } from "@/lib/api";
import { format, formatDistanceToNow } from "date-fns";
import { it } from "date-fns/locale";
import { useAuth } from "@/contexts/AuthContext";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { PDFViewer } from "@/components/PDFViewer";
import { ExcelViewer } from "@/components/ExcelViewer";
import { useToast } from "@/hooks/use-toast";
import { useDocumentCollaboration } from "@/hooks/useDocumentCollaboration";

interface EmbeddedPdf {
  id: string;
  url: string;
  filename: string;
  size: number;
  summary?: string;
}

interface EmbeddedExcel {
  id: string;
  url: string;
  filename: string;
  size: number;
  sheets?: { name: string; data: any[][] }[];
}

export function DocumentsContent() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const confirm = useConfirm();
  const { toast } = useToast();
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedPermission, setSelectedPermission] = useState("view");
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [videoDialogOpen, setVideoDialogOpen] = useState(false);
  const [mediaUrl, setMediaUrl] = useState("");
  const [linkProjectDialogOpen, setLinkProjectDialogOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");
  const [filterReview, setFilterReview] = useState(false);
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  const availableTags = [
    { name: "Importante", color: "#ef4444" },
    { name: "Lavoro", color: "#3b82f6" },
    { name: "Personale", color: "#22c55e" },
    { name: "Archivio", color: "#6b7280" },
    { name: "Urgente", color: "#f97316" },
    { name: "Bozza", color: "#a855f7" },
    { name: "Completato", color: "#14b8a6" },
    { name: "In revisione", color: "#eab308" },
  ];
  const [newDocDialogOpen, setNewDocDialogOpen] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState("");
  const [pdfDialogOpen, setPdfDialogOpen] = useState(false);
  const [pdfUploading, setPdfUploading] = useState(false);
  const [pdfUploadProgress, setPdfUploadProgress] = useState(0);
  const [aiSummaryOpen, setAiSummaryOpen] = useState(false);
  const [aiSummaryContent, setAiSummaryContent] = useState("");
  const [showChatPanel, setShowChatPanel] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [aiSummaryTitle, setAiSummaryTitle] = useState("");
  const [aiSummaryLoading, setAiSummaryLoading] = useState(false);
  const [embeddedPdfs, setEmbeddedPdfs] = useState<EmbeddedPdf[]>([]);
  const [embeddedExcels, setEmbeddedExcels] = useState<EmbeddedExcel[]>([]);
  const [activePdfSummary, setActivePdfSummary] = useState<string | null>(null);
  const [pdfSummaryContent, setPdfSummaryContent] = useState<string>("");
  const [pdfSummaryLoading, setPdfSummaryLoading] = useState(false);
  const [excelDialogOpen, setExcelDialogOpen] = useState(false);
  const [excelUploading, setExcelUploading] = useState(false);
  const [excelUploadProgress, setExcelUploadProgress] = useState(0);
  const [activeExcelViewer, setActiveExcelViewer] = useState<string | null>(null);
  const [wordDialogOpen, setWordDialogOpen] = useState(false);
  const [wordUploading, setWordUploading] = useState(false);
  const [wordUploadProgress, setWordUploadProgress] = useState(0);
  const [pptxDialogOpen, setPptxDialogOpen] = useState(false);
  const [pptxUploading, setPptxUploading] = useState(false);
  const [pptxUploadProgress, setPptxUploadProgress] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isBookMode, setIsBookMode] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [savedSelection, setSavedSelection] = useState<Range | null>(null);
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipDirection, setFlipDirection] = useState<'left' | 'right'>('right');
  const [docBackground, setDocBackground] = useState('sand');
  const [bgColorOpen, setBgColorOpen] = useState(false);

  const backgroundPresets = [
    { name: 'Sabbia', value: 'sand', style: 'linear-gradient(to bottom, #f5f0e6, #e8e0d0, #d9cfc0)' },
    { name: 'Bianco', value: 'white', style: '#ffffff' },
    { name: 'Crema', value: 'cream', style: 'linear-gradient(to bottom, #fffef0, #f5f0e0)' },
    { name: 'Grigio', value: 'gray', style: 'linear-gradient(to bottom, #f8f9fa, #e9ecef)' },
    { name: 'Azzurro', value: 'blue', style: 'linear-gradient(to bottom, #e3f2fd, #bbdefb)' },
    { name: 'Verde', value: 'green', style: 'linear-gradient(to bottom, #e8f5e9, #c8e6c9)' },
    { name: 'Rosa', value: 'pink', style: 'linear-gradient(to bottom, #fce4ec, #f8bbd9)' },
    { name: 'Lavanda', value: 'lavender', style: 'linear-gradient(to bottom, #ede7f6, #d1c4e9)' },
    { name: 'Seppia', value: 'sepia', style: 'linear-gradient(to bottom, #f4ecd8, #d4c4a8)' },
    { name: 'Notte', value: 'dark', style: 'linear-gradient(to bottom, #2d3748, #1a202c)' },
  ];

  const getBackgroundStyle = () => {
    const preset = backgroundPresets.find(p => p.value === docBackground);
    return preset?.style || backgroundPresets[0].style;
  };

  const excelInputRef = useRef<HTMLInputElement>(null);
  const wordInputRef = useRef<HTMLInputElement>(null);
  const pptxInputRef = useRef<HTMLInputElement>(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  const {
    isConnected: collabConnected,
    collaborators,
    myColor,
    remoteContent,
    remoteCursors,
    sendCursorPosition,
    sendContentUpdate
  } = useDocumentCollaboration(selectedDocId, isEditing);

  useEffect(() => {
    if (remoteContent !== null && editorRef.current && isEditing) {
      const selection = window.getSelection();
      const range = selection?.rangeCount ? selection.getRangeAt(0) : null;
      const cursorOffset = range?.startOffset || 0;

      editorRef.current.innerHTML = remoteContent;
      setEditContent(remoteContent);

      if (range && editorRef.current.firstChild) {
        try {
          const newRange = document.createRange();
          newRange.setStart(editorRef.current.firstChild, Math.min(cursorOffset, editorRef.current.textContent?.length || 0));
          newRange.collapse(true);
          selection?.removeAllRanges();
          selection?.addRange(newRange);
        } catch { }
      }
    }
  }, [remoteContent, isEditing]);

  const formatFileSize = (content: string) => {
    const bytes = new Blob([content || ""]).size;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatFullDateTime = (date: string) => {
    try {
      return format(new Date(date), "dd/MM/yyyy HH:mm:ss", { locale: it });
    } catch {
      return "";
    }
  };

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ["documents", user?.id],
    queryFn: () => documentsApi.getAll(user?.id),
    enabled: !!user?.id,
  });

  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: usersApi.getAll,
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: projectsApi.getAll,
  });

  const { data: linkedProjects = [] } = useQuery({
    queryKey: ["document-projects", selectedDocId],
    queryFn: () => selectedDocId ? documentsApi.getProjects(selectedDocId) : Promise.resolve([]),
    enabled: !!selectedDocId,
  });

  const selectedDoc = documents.find((d: any) => d.id === selectedDocId);

  const { data: fullSelectedDoc, isLoading: isLoadingFullDoc } = useQuery({
    queryKey: ["document", selectedDocId],
    queryFn: () => selectedDocId ? documentsApi.get(selectedDocId) : Promise.resolve(null),
    enabled: !!selectedDocId,
  });

  const { data: shares = [] } = useQuery({
    queryKey: ["document-shares", selectedDocId],
    queryFn: () => selectedDocId ? documentsApi.getShares(selectedDocId) : Promise.resolve([]),
    enabled: !!selectedDocId,
  });

  const { data: chatChannels = [] } = useQuery({
    queryKey: ["chat-channels"],
    queryFn: chatApi.getChannels,
  });

  const documentChannel = chatChannels.find((c: any) =>
    c.type === 'document' && c.name?.includes(selectedDoc?.title)
  );

  const { data: chatMessages = [], refetch: refetchMessages } = useQuery({
    queryKey: ["chat-messages", documentChannel?.id],
    queryFn: () => documentChannel?.id ? chatApi.getMessages(documentChannel.id) : Promise.resolve([]),
    enabled: !!documentChannel?.id && showChatPanel,
    refetchInterval: showChatPanel ? 3000 : false,
  });

  const sendChatMessageMutation = useMutation({
    mutationFn: (content: string) => chatApi.sendMessage(documentChannel!.id, {
      content,
      senderId: user?.id,
      senderName: user?.name,
      senderAvatar: user?.avatar || user?.name?.slice(0, 2).toUpperCase(),
    }),
    onSuccess: () => {
      setChatMessage("");
      refetchMessages();
    },
  });

  // Carica i dati del documento solo quando si seleziona un NUOVO documento (non durante refetch)
  const prevDocIdRef = useRef<string | null>(null);
  useEffect(() => {
    // Wait for the full document to be loaded
    if (selectedDocId && fullSelectedDoc && fullSelectedDoc.id === selectedDocId && fullSelectedDoc.id !== prevDocIdRef.current) {
      prevDocIdRef.current = fullSelectedDoc.id;
      setEditTitle(fullSelectedDoc.title);
      setEditContent(fullSelectedDoc.content || "");
      setHasUnsavedChanges(false);
      setAutoSaveStatus("idle");
      // Carica i PDF e Excel salvati
      if (fullSelectedDoc.attachments) {
        try {
          const attachments = JSON.parse(fullSelectedDoc.attachments);
          if (attachments.pdfs) {
            setEmbeddedPdfs(attachments.pdfs);
          } else if (Array.isArray(attachments)) {
            setEmbeddedPdfs(attachments);
          } else {
            setEmbeddedPdfs([]);
          }
          if (attachments.excels) {
            setEmbeddedExcels(attachments.excels);
          } else {
            setEmbeddedExcels([]);
          }
        } catch {
          setEmbeddedPdfs([]);
          setEmbeddedExcels([]);
        }
      } else {
        setEmbeddedPdfs([]);
        setEmbeddedExcels([]);
      }
      setActivePdfSummary(null);
      setPdfSummaryContent("");
      setActiveExcelViewer(null);
    } else if (!selectedDocId && prevDocIdRef.current) {
      prevDocIdRef.current = null;
      setEditTitle("");
      setEditContent("");
    }
  }, [selectedDocId, fullSelectedDoc]);

  // Imposta il contenuto dell'editor solo quando si cambia documento o si entra in modalità editing
  useEffect(() => {
    if (isEditing && editorRef.current && selectedDoc) {
      editorRef.current.innerHTML = editContent || '<p><br></p>';
    }
  }, [selectedDocId, isEditing]);

  // Autosave ogni 10 secondi
  useEffect(() => {
    if (isEditing && hasUnsavedChanges && selectedDocId) {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }

      autoSaveTimeoutRef.current = setTimeout(() => {
        setAutoSaveStatus("saving");
        updateMutation.mutate({
          id: selectedDocId,
          data: {
            title: editTitle,
            content: editContent,
            attachments: JSON.stringify({ pdfs: embeddedPdfs, excels: embeddedExcels }),
            editorId: user?.id
          },
          isAutoSave: true
        });
      }, 10000); // 10 secondi
    }

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [isEditing, hasUnsavedChanges, editTitle, editContent, selectedDocId, embeddedPdfs, embeddedExcels]);

  const handleContentChange = (newContent: string) => {
    setEditContent(newContent);
    setHasUnsavedChanges(true);
    setAutoSaveStatus("idle");
  };

  const handleTitleChange = (newTitle: string) => {
    setEditTitle(newTitle);
    setHasUnsavedChanges(true);
    setAutoSaveStatus("idle");
  };

  const createMutation = useMutation({
    mutationFn: documentsApi.create,
    onSuccess: (newDoc) => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      setSelectedDocId(newDoc.id);
      setEditTitle(newDoc.title);
      setEditContent(newDoc.content || "");
      setIsEditing(true);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data, isAutoSave }: { id: string; data: any; isAutoSave?: boolean }) => documentsApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      if (variables.isAutoSave) {
        setAutoSaveStatus("saved");
        setHasUnsavedChanges(false);
        setTimeout(() => setAutoSaveStatus("idle"), 2000);
      } else {
        setIsEditing(false);
        setHasUnsavedChanges(false);
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: documentsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      setSelectedDocId(null);
    },
  });

  const shareMutation = useMutation({
    mutationFn: ({ docId, data }: { docId: string; data: any }) => documentsApi.addShare(docId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document-shares", selectedDocId] });
      setSelectedUserId("");
      setUserSearchQuery("");
      setShareDialogOpen(false);
      toast({
        title: "Ho condiviso il Documento",
        description: "L'utente può ora accedere a questo documento.",
      });
    },
  });

  const removeShareMutation = useMutation({
    mutationFn: ({ docId, shareId }: { docId: string; shareId: string }) => documentsApi.removeShare(docId, shareId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document-shares", selectedDocId] });
    },
  });

  const createDocChatMutation = useMutation({
    mutationFn: (data: { name: string; description?: string; members: string[]; color?: string }) =>
      chatApi.createChannel({ ...data, type: "document", unreadCount: 0 }),
    onSuccess: (newChannel) => {
      queryClient.invalidateQueries({ queryKey: ["chat-channels"] });
      toast({
        title: "Chat creata",
        description: `Il canale "${newChannel.name}" è stato creato. Vai alla chat per iniziare a conversare.`,
      });
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Impossibile creare il canale chat.",
        variant: "destructive",
      });
    },
  });

  const handleCreateDocumentChat = (sharedUserId: string, sharedUserName: string) => {
    if (!selectedDoc || !user) return;
    createDocChatMutation.mutate({
      name: `📄 ${selectedDoc.title}`,
      description: `Chat per il documento: ${selectedDoc.title}`,
      members: [user.id, sharedUserId],
      color: "purple",
    });
  };

  const linkProjectMutation = useMutation({
    mutationFn: ({ projectId, documentId }: { projectId: string; documentId: string }) =>
      documentsApi.linkToProject(projectId, documentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document-projects", selectedDocId] });
      setSelectedProjectId("");
      setLinkProjectDialogOpen(false);
    },
  });

  const handleLinkProject = () => {
    if (selectedDocId && selectedProjectId) {
      linkProjectMutation.mutate({ projectId: selectedProjectId, documentId: selectedDocId });
    }
  };

  const insertAtCursor = (text: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newContent = editContent.substring(0, start) + text + editContent.substring(end);
    handleContentChange(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = start + text.length;
    }, 0);
  };

  const execFormatCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    updateContentFromEditor();
  };

  const updateContentFromEditor = () => {
    if (editorRef.current) {
      const newContent = editorRef.current.innerHTML;
      handleContentChange(newContent);
      sendContentUpdate(newContent);
    }
  };

  const handleEditorCursor = useCallback(() => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0 && editorRef.current) {
      const range = selection.getRangeAt(0);
      const preCaretRange = range.cloneRange();
      preCaretRange.selectNodeContents(editorRef.current);
      preCaretRange.setEnd(range.endContainer, range.endOffset);
      const text = preCaretRange.toString();
      const lines = text.split('\n');
      const line = lines.length;
      const column = lines[lines.length - 1].length;
      sendCursorPosition({ line, column });
    }
  }, [sendCursorPosition]);

  const handleBold = () => execFormatCommand("bold");
  const handleItalic = () => execFormatCommand("italic");
  const handleUnderline = () => execFormatCommand("underline");

  const savedSelectionRef = useRef<Range | null>(null);

  const saveSelection = useCallback(() => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0 && editorRef.current?.contains(selection.anchorNode)) {
      savedSelectionRef.current = selection.getRangeAt(0).cloneRange();
      setSavedSelection(selection.getRangeAt(0).cloneRange());
    }
  }, []);

  const restoreAndApplyFormat = useCallback((command: string, value: string) => {
    if (savedSelectionRef.current && editorRef.current) {
      editorRef.current.focus();
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(savedSelectionRef.current);
        setTimeout(() => {
          document.execCommand(command, false, value);
          updateContentFromEditor();
        }, 10);
      }
    }
  }, []);

  const handleFontFamily = (font: string) => {
    restoreAndApplyFormat("fontName", font);
  };

  const handleFontSize = (size: string) => {
    restoreAndApplyFormat("fontSize", size);
  };
  const handleDivider = () => {
    execFormatCommand("insertHTML", "<hr class='my-4 border-neutral-300' />");
  };
  const handleChecklist = () => {
    execFormatCommand("insertHTML", `
      <ul class="checklist-container" style="list-style: none; padding: 0; margin: 8px 0;">
        <li class="checklist-item" style="display: flex; align-items: center; gap: 8px; padding: 4px 0;">
          <input type="checkbox" style="pointer-events: auto; cursor: pointer; width: 16px; height: 16px;" />
          <span contenteditable="true" style="flex: 1; outline: none;">Elemento checklist</span>
        </li>
      </ul>
    `);
  };

  const handleNumberedList = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const selectedText = range.toString().trim();

      if (selectedText) {
        const lines = selectedText.split('\n').filter(line => line.trim());
        const listHtml = `<ol style="margin: 8px 0; padding-left: 40px; list-style-type: decimal; list-style-position: outside;">${lines.map(line => `<li style="margin: 4px 0;">${line.trim()}</li>`).join('')}</ol>`;
        execFormatCommand("insertHTML", listHtml);
      } else {
        execFormatCommand("insertHTML", `<ol style="margin: 8px 0; padding-left: 40px; list-style-type: decimal; list-style-position: outside;"><li style="margin: 4px 0;">Elemento 1</li></ol>`);
      }
    } else {
      execFormatCommand("insertHTML", `<ol style="margin: 8px 0; padding-left: 40px; list-style-type: decimal; list-style-position: outside;"><li style="margin: 4px 0;">Elemento 1</li></ol>`);
    }
  };

  const handleBulletList = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const selectedText = range.toString().trim();

      if (selectedText) {
        const lines = selectedText.split('\n').filter(line => line.trim());
        const listHtml = `<ul style="margin: 8px 0; padding-left: 40px; list-style-type: disc; list-style-position: outside;">${lines.map(line => `<li style="margin: 4px 0;">${line.trim()}</li>`).join('')}</ul>`;
        execFormatCommand("insertHTML", listHtml);
      } else {
        execFormatCommand("insertHTML", `<ul style="margin: 8px 0; padding-left: 40px; list-style-type: disc; list-style-position: outside;"><li style="margin: 4px 0;">Elemento 1</li></ul>`);
      }
    } else {
      execFormatCommand("insertHTML", `<ul style="margin: 8px 0; padding-left: 40px; list-style-type: disc; list-style-position: outside;"><li style="margin: 4px 0;">Elemento 1</li></ul>`);
    }
  };

  const handleToggleList = () => {
    execFormatCommand("insertHTML", `
      <details class="my-2 border rounded-lg p-2 bg-muted/30">
        <summary class="cursor-pointer font-medium flex items-center gap-2">
          <span>Clicca per espandere</span>
        </summary>
        <div class="pt-2 pl-4 text-sm">
          Contenuto nascosto qui...
        </div>
      </details>
    `);
  };
  const handleAlignLeft = () => execFormatCommand("justifyLeft");
  const handleAlignCenter = () => execFormatCommand("justifyCenter");
  const handleAlignRight = () => execFormatCommand("justifyRight");
  const handleHighlight = () => execFormatCommand("hiliteColor", "#fef08a");
  const handleCallout = () => {
    execFormatCommand("insertHTML", `<div class="my-4 p-4 bg-amber-50 border-l-4 border-amber-400 rounded-r-lg"><p class="text-amber-800">💡 Scrivi qui il tuo callout...</p></div><p><br></p>`);
  };
  const handleInsertLink = () => {
    if (linkUrl.trim()) {
      const text = linkText.trim() || linkUrl;
      execFormatCommand("insertHTML", `<a href="${linkUrl}" target="_blank" style="color: #2563eb; text-decoration: underline;">${text}</a>`);
      setLinkUrl("");
      setLinkText("");
      setLinkDialogOpen(false);
    }
  };

  const handleInsertImage = () => {
    if (mediaUrl.trim()) {
      execFormatCommand("insertHTML", `
        <div class="my-4 inline-block relative group" contenteditable="false">
          <img 
            src="${mediaUrl}" 
            alt="Immagine" 
            class="max-w-full rounded-lg shadow-md cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
            style="resize: both; overflow: auto; max-width: 100%;"
            onclick="this.classList.toggle('ring-2'); this.classList.toggle('ring-primary');"
          />
          <div class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
            <button onclick="this.closest('div.group').remove();" class="bg-red-500 text-white rounded p-1 text-xs hover:bg-red-600" title="Rimuovi">✕</button>
          </div>
        </div>
      `);
      setMediaUrl("");
      setImageDialogOpen(false);
    }
  };

  const handleInsertVideo = () => {
    if (mediaUrl.trim()) {
      let videoContent = "";
      if (mediaUrl.includes('youtube.com') || mediaUrl.includes('youtu.be')) {
        const videoId = mediaUrl.includes('youtu.be')
          ? mediaUrl.split('/').pop()
          : new URLSearchParams(new URL(mediaUrl).search).get('v');
        videoContent = `<iframe src="https://www.youtube.com/embed/${videoId}" class="w-full h-full rounded-lg" allowfullscreen></iframe>`;
      } else {
        videoContent = `<video src="${mediaUrl}" controls class="w-full rounded-lg"></video>`;
      }
      const videoHtml = `
        <div class="my-4 relative group aspect-video" contenteditable="false">
          ${videoContent}
          <div class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
            <button onclick="this.closest('div.group').remove();" class="bg-red-500 text-white rounded p-1 text-xs hover:bg-red-600" title="Rimuovi">✕</button>
          </div>
        </div>
      `;
      execFormatCommand("insertHTML", videoHtml);
      setMediaUrl("");
      setVideoDialogOpen(false);
    }
  };

  const handlePdfUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert('Solo file PDF sono supportati');
      return;
    }

    setPdfUploading(true);
    setPdfUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const data = await new Promise<any>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const percent = Math.round((e.loaded / e.total) * 100);
            setPdfUploadProgress(percent);
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            reject(new Error('Errore nel caricamento del PDF'));
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Errore di rete'));
        });

        xhr.open('POST', '/api/upload/document');
        xhr.send(formData);
      });

      const newPdf: EmbeddedPdf = {
        id: `pdf-${Date.now()}`,
        url: data.url,
        filename: data.filename,
        size: data.size
      };

      setEmbeddedPdfs(prev => [...prev, newPdf]);
      setHasUnsavedChanges(true);
      setPdfDialogOpen(false);
    } catch (error) {
      console.error('Error uploading PDF:', error);
      alert('Errore nel caricamento del PDF');
    } finally {
      setPdfUploading(false);
      if (pdfInputRef.current) {
        pdfInputRef.current.value = '';
      }
    }
  };

  const handlePdfSummary = async (pdfId: string, pdfUrl: string, filename: string) => {
    // Controlla se esiste già un riassunto salvato
    const existingPdf = embeddedPdfs.find(p => p.id === pdfId);
    if (existingPdf?.summary) {
      setActivePdfSummary(pdfId);
      setPdfSummaryContent(existingPdf.summary);
      return;
    }

    setActivePdfSummary(pdfId);
    setPdfSummaryLoading(true);
    setPdfSummaryContent("");

    try {
      const response = await fetch('/api/upload/document/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pdfPath: pdfUrl, filename }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Errore nel riassunto');
      }

      const data = await response.json();
      setPdfSummaryContent(data.summary);

      // Salva il riassunto nell'oggetto PDF
      setEmbeddedPdfs(prev => prev.map(p =>
        p.id === pdfId ? { ...p, summary: data.summary } : p
      ));
      setHasUnsavedChanges(true);
    } catch (error: any) {
      setPdfSummaryContent(`Errore: ${error.message}`);
    } finally {
      setPdfSummaryLoading(false);
    }
  };

  const handleRemovePdf = (pdfId: string) => {
    setEmbeddedPdfs(prev => prev.filter(p => p.id !== pdfId));
    setHasUnsavedChanges(true);
    if (activePdfSummary === pdfId) {
      setActivePdfSummary(null);
      setPdfSummaryContent("");
    }
  };

  const handleCloseSummary = () => {
    setActivePdfSummary(null);
    setPdfSummaryContent("");
  };

  const handleExcelUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    if (!validTypes.includes(file.type)) {
      toast({ title: "Errore", description: "Solo file Excel (XLS, XLSX) sono supportati", variant: "destructive" });
      return;
    }

    setExcelUploading(true);
    setExcelUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const data = await new Promise<any>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const percent = Math.round((e.loaded / e.total) * 100);
            setExcelUploadProgress(percent);
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              resolve(JSON.parse(xhr.responseText));
            } catch (e) {
              reject(new Error('Risposta non valida dal server'));
            }
          } else {
            try {
              const errorData = JSON.parse(xhr.responseText);
              reject(new Error(errorData.error || `Errore ${xhr.status}`));
            } catch {
              reject(new Error(`Errore nel caricamento (${xhr.status})`));
            }
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Errore di rete - verifica la connessione'));
        });

        xhr.addEventListener('abort', () => {
          reject(new Error('Upload annullato'));
        });

        xhr.open('POST', '/api/upload/document');
        xhr.send(formData);
      });

      const parseResponse = await fetch('/api/upload/document/parse-excel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath: data.url }),
      });

      if (!parseResponse.ok) {
        throw new Error('Errore nel parsing del file Excel');
      }

      const parseData = await parseResponse.json();

      const newExcel: EmbeddedExcel = {
        id: `excel-${Date.now()}`,
        url: data.url,
        filename: data.filename,
        size: data.size,
        sheets: parseData.sheets
      };

      setEmbeddedExcels(prev => [...prev, newExcel]);
      setHasUnsavedChanges(true);
      setExcelDialogOpen(false);
      toast({ title: "Successo", description: "File Excel caricato correttamente" });
    } catch (error: any) {
      console.error('Error uploading Excel:', error);
      toast({ title: "Errore", description: error.message || "Errore nel caricamento del file Excel", variant: "destructive" });
    } finally {
      setExcelUploading(false);
      if (excelInputRef.current) {
        excelInputRef.current.value = '';
      }
    }
  };

  const handleRemoveExcel = (excelId: string) => {
    setEmbeddedExcels(prev => prev.filter(e => e.id !== excelId));
    setHasUnsavedChanges(true);
    if (activeExcelViewer === excelId) {
      setActiveExcelViewer(null);
    }
  };

  const handleWordUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validTypes = [
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (!validTypes.includes(file.type)) {
      toast({ title: "Errore", description: "Solo file Word (DOC, DOCX) sono supportati", variant: "destructive" });
      return;
    }

    setWordUploading(true);
    setWordUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const data = await new Promise<any>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const percent = Math.round((e.loaded / e.total) * 100);
            setWordUploadProgress(percent);
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              resolve(JSON.parse(xhr.responseText));
            } catch (e) {
              reject(new Error('Risposta non valida dal server'));
            }
          } else {
            try {
              const errorData = JSON.parse(xhr.responseText);
              reject(new Error(errorData.error || `Errore ${xhr.status}`));
            } catch {
              reject(new Error(`Errore nel caricamento (${xhr.status})`));
            }
          }
        });

        xhr.addEventListener('error', () => reject(new Error('Errore di rete')));
        xhr.addEventListener('abort', () => reject(new Error('Upload annullato')));

        xhr.open('POST', '/api/upload/document');
        xhr.send(formData);
      });

      const parseResponse = await fetch('/api/upload/document/parse-word', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath: data.url }),
      });

      if (!parseResponse.ok) {
        throw new Error('Errore nel parsing del file Word');
      }

      const parseData = await parseResponse.json();

      if (editorRef.current && parseData.html) {
        const currentContent = editorRef.current.innerHTML;
        editorRef.current.innerHTML = currentContent + `<div class="word-import" style="border: 1px solid #3b82f6; border-radius: 8px; padding: 16px; margin: 16px 0; background: #eff6ff;"><div style="font-size: 12px; color: #3b82f6; margin-bottom: 8px;"><strong>📄 ${file.name}</strong></div>${parseData.html}</div>`;
        setEditContent(editorRef.current.innerHTML);
        setHasUnsavedChanges(true);
      }

      setWordDialogOpen(false);
      toast({ title: "Successo", description: "Documento Word importato correttamente" });
    } catch (error: any) {
      console.error('Error uploading Word:', error);
      toast({ title: "Errore", description: error.message || "Errore nel caricamento del file Word", variant: "destructive" });
    } finally {
      setWordUploading(false);
      if (wordInputRef.current) {
        wordInputRef.current.value = '';
      }
    }
  };

  const handlePptxUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validTypes = [
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ];
    if (!validTypes.includes(file.type)) {
      toast({ title: "Errore", description: "Solo file PowerPoint (PPT, PPTX) sono supportati", variant: "destructive" });
      return;
    }

    setPptxUploading(true);
    setPptxUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const data = await new Promise<any>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const percent = Math.round((e.loaded / e.total) * 100);
            setPptxUploadProgress(percent);
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              resolve(JSON.parse(xhr.responseText));
            } catch (e) {
              reject(new Error('Risposta non valida dal server'));
            }
          } else {
            try {
              const errorData = JSON.parse(xhr.responseText);
              reject(new Error(errorData.error || `Errore ${xhr.status}`));
            } catch {
              reject(new Error(`Errore nel caricamento (${xhr.status})`));
            }
          }
        });

        xhr.addEventListener('error', () => reject(new Error('Errore di rete')));
        xhr.addEventListener('abort', () => reject(new Error('Upload annullato')));

        xhr.open('POST', '/api/upload/document');
        xhr.send(formData);
      });

      const parseResponse = await fetch('/api/upload/document/parse-pptx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath: data.url }),
      });

      if (!parseResponse.ok) {
        throw new Error('Errore nel parsing del file PowerPoint');
      }

      const parseData = await parseResponse.json();

      if (editorRef.current && parseData.text) {
        const currentContent = editorRef.current.innerHTML;
        const formattedText = parseData.text.split('\n').filter((line: string) => line.trim()).map((line: string) => `<p>${line}</p>`).join('');
        editorRef.current.innerHTML = currentContent + `<div class="pptx-import" style="border: 1px solid #f97316; border-radius: 8px; padding: 16px; margin: 16px 0; background: #fff7ed;"><div style="font-size: 12px; color: #f97316; margin-bottom: 8px;"><strong>📊 ${file.name}</strong></div>${formattedText}</div>`;
        setEditContent(editorRef.current.innerHTML);
        setHasUnsavedChanges(true);
      }

      setPptxDialogOpen(false);
      toast({ title: "Successo", description: "Presentazione PowerPoint importata correttamente" });
    } catch (error: any) {
      console.error('Error uploading PowerPoint:', error);
      toast({ title: "Errore", description: error.message || "Errore nel caricamento del file PowerPoint", variant: "destructive" });
    } finally {
      setPptxUploading(false);
      if (pptxInputRef.current) {
        pptxInputRef.current.value = '';
      }
    }
  };

  const handlePrint = () => {
    const selectedDoc = documents.find((d: any) => d.id === selectedDocId);
    if (!selectedDoc) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const bgStyle = getBackgroundStyle();
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${selectedDoc.title}</title>
        <style>
          @page { margin: 2cm; }
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            padding: 40px;
            background: ${bgStyle};
            color: ${docBackground === 'dark' ? '#fff' : '#333'};
          }
          h1 { font-size: 28px; margin-bottom: 20px; border-bottom: 2px solid #ccc; padding-bottom: 10px; }
          .doc-icon { font-size: 48px; margin-right: 16px; }
          .header { display: flex; align-items: center; margin-bottom: 30px; }
          .content { font-size: 14px; }
          ul, ol { padding-left: 40px; list-style-position: outside; }
          li { margin: 8px 0; }
          hr { border: none; border-top: 1px solid #ccc; margin: 20px 0; }
          .meta { font-size: 12px; color: #666; margin-bottom: 20px; }
        </style>
      </head>
      <body>
        <div class="header">
          <span class="doc-icon">${selectedDoc.icon || '📄'}</span>
          <h1>${selectedDoc.title}</h1>
        </div>
        <div class="meta">Stampato il ${new Date().toLocaleDateString('it-IT', { dateStyle: 'full' })}</div>
        <div class="content">${selectedDoc.content || ''}</div>
      </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const splitContentIntoPages = (content: string): string[] => {
    if (!content) return ['<div class="text-muted-foreground italic">Documento vuoto</div>'];

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    const textLength = tempDiv.textContent?.length || 0;

    const charsPerPage = 1500;
    const numPages = Math.max(1, Math.ceil(textLength / charsPerPage));

    if (numPages === 1) return [content];

    const pages: string[] = [];
    let currentContent = content;

    for (let i = 0; i < numPages && currentContent.length > 0; i++) {
      const breakPoint = Math.min(currentContent.length, charsPerPage * (i + 1));
      const pageContent = currentContent.substring(0, breakPoint);
      pages.push(pageContent);
      currentContent = currentContent.substring(breakPoint);
    }

    return pages.length > 0 ? pages : [content];
  };

  const handleNextPage = () => {
    const selectedDoc = documents.find((d: any) => d.id === selectedDocId);
    if (!selectedDoc) return;
    const pages = splitContentIntoPages(selectedDoc.content);
    if (currentPage < pages.length - 1) {
      setFlipDirection('right');
      setIsFlipping(true);
      setTimeout(() => {
        setCurrentPage(prev => prev + 1);
        setIsFlipping(false);
      }, 300);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setFlipDirection('left');
      setIsFlipping(true);
      setTimeout(() => {
        setCurrentPage(prev => prev - 1);
        setIsFlipping(false);
      }, 300);
    }
  };

  const handleOpenNewDocDialog = () => {
    setNewDocTitle("");
    setNewDocDialogOpen(true);
  };

  const handleCreateDocument = () => {
    if (!newDocTitle.trim()) return;
    createMutation.mutate({
      title: newDocTitle.trim(),
      content: "",
      icon: "📄",
      ownerId: user?.id
    });
    setNewDocDialogOpen(false);
    setNewDocTitle("");
  };

  const handleSaveDocument = () => {
    if (selectedDocId) {
      updateMutation.mutate({
        id: selectedDocId,
        data: {
          title: editTitle,
          content: editContent,
          attachments: JSON.stringify({ pdfs: embeddedPdfs, excels: embeddedExcels }),
          editorId: user?.id
        }
      });
    }
  };

  const handleDeleteDocument = async () => {
    if (selectedDocId) {
      const confirmed = await confirm({
        title: "Elimina documento",
        description: "Sei sicuro di voler eliminare questo documento?",
        confirmText: "Elimina",
        variant: "destructive",
      });
      if (confirmed) {
        deleteMutation.mutate(selectedDocId);
      }
    }
  };

  const handleShare = () => {
    if (selectedDocId && selectedUserId) {
      shareMutation.mutate({
        docId: selectedDocId,
        data: {
          userId: selectedUserId,
          permission: selectedPermission,
          sharedById: user?.id
        }
      });
      setUserSearchQuery("");
    }
  };

  const [creatingChannel, setCreatingChannel] = useState(false);

  const handleOpenDocumentChat = async () => {
    if (documentChannel) {
      setShowChatPanel(!showChatPanel);
      return;
    }

    if (!selectedDoc || creatingChannel) return;

    setCreatingChannel(true);
    try {
      await chatApi.createChannel({
        name: `📄 ${selectedDoc.title}`,
        type: 'document',
        description: `Chat per il documento: ${selectedDoc.title}`,
        color: 'purple',
        members: [user?.id],
      });
      queryClient.invalidateQueries({ queryKey: ["chat-channels"] });
      setShowChatPanel(true);
    } catch (error) {
      console.error("Error creating document channel:", error);
      toast({
        title: "Errore",
        description: "Impossibile creare la chat del documento",
        variant: "destructive",
      });
    } finally {
      setCreatingChannel(false);
    }
  };

  const isDocumentOwner = (doc: any) => doc.ownerId === user?.id;
  const isSharedWithMe = (docId: string) => shares.some((s: any) => s.userId === user?.id);

  const filteredUsers = users.filter((u: any) =>
    u.name.toLowerCase().includes(userSearchQuery.toLowerCase()) &&
    u.id !== user?.id &&
    !shares.some((s: any) => s.userId === u.id)
  );

  const getDocTags = (doc: any): string[] => {
    try {
      return doc.tags ? JSON.parse(doc.tags) : [];
    } catch {
      return [];
    }
  };

  const filteredDocs = documents.filter((doc: any) => {
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesReview = !filterReview || doc.needsReview;
    const docTags = getDocTags(doc);
    const matchesTag = !filterTag || docTags.includes(filterTag);
    return matchesSearch && matchesReview && matchesTag;
  });

  const allUsedTags = [...new Set(documents.flatMap((doc: any) => getDocTags(doc)))];

  const handleAddTag = (docId: string, tagName: string) => {
    const doc = documents.find((d: any) => d.id === docId);
    if (!doc) return;
    const currentTags = getDocTags(doc);
    if (!currentTags.includes(tagName)) {
      const newTags = [...currentTags, tagName];
      updateMutation.mutate({ id: docId, data: { tags: JSON.stringify(newTags) } });
    }
  };

  const handleRemoveTag = (docId: string, tagName: string) => {
    const doc = documents.find((d: any) => d.id === docId);
    if (!doc) return;
    const currentTags = getDocTags(doc);
    const newTags = currentTags.filter((t: string) => t !== tagName);
    updateMutation.mutate({ id: docId, data: { tags: JSON.stringify(newTags) } });
  };

  const handleToggleReview = (docId: string, currentValue: boolean) => {
    updateMutation.mutate({ id: docId, data: { needsReview: !currentValue } });
  };

  const formatDate = (date: string) => {
    try {
      return format(new Date(date), "d MMM yyyy, HH:mm");
    } catch {
      return "";
    }
  };

  const getUserName = (userId: string) => {
    const user = users.find((u: any) => u.id === userId);
    return user?.name || "Utente";
  };

  const renderContent = (content: string) => {
    if (!content) return null;

    let processedContent = content;
    const result: React.ReactElement[] = [];
    let idx = 0;

    const calloutRegex = /\[callout\]([\s\S]*?)\[\/callout\]/g;
    const alignRegex = /\[align:(left|center|right)\]([\s\S]*?)\[\/align\]/g;

    processedContent = processedContent.replace(calloutRegex, (_, text) => {
      return `__CALLOUT_START__${text.trim()}__CALLOUT_END__`;
    });

    processedContent = processedContent.replace(alignRegex, (_, align, text) => {
      return `__ALIGN_${align.toUpperCase()}_START__${text.trim()}__ALIGN_END__`;
    });

    const lines = processedContent.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      idx++;

      if (line.startsWith('__CALLOUT_START__') && line.includes('__CALLOUT_END__')) {
        const text = line.replace('__CALLOUT_START__', '').replace('__CALLOUT_END__', '');
        result.push(
          <div key={idx} className="my-4 p-4 bg-amber-50 border-l-4 border-amber-400 rounded-r-lg">
            <p className="text-amber-800">{text}</p>
          </div>
        );
        continue;
      }

      if (line.includes('__ALIGN_') && line.includes('__ALIGN_END__')) {
        let align = 'left';
        let text = line;
        if (line.includes('__ALIGN_LEFT_START__')) {
          align = 'left';
          text = line.replace('__ALIGN_LEFT_START__', '').replace('__ALIGN_END__', '');
        } else if (line.includes('__ALIGN_CENTER_START__')) {
          align = 'center';
          text = line.replace('__ALIGN_CENTER_START__', '').replace('__ALIGN_END__', '');
        } else if (line.includes('__ALIGN_RIGHT_START__')) {
          align = 'right';
          text = line.replace('__ALIGN_RIGHT_START__', '').replace('__ALIGN_END__', '');
        }
        result.push(
          <p key={idx} className={`min-h-[1.5em] text-${align}`} style={{ textAlign: align as any }}>
            {text}
          </p>
        );
        continue;
      }

      if (line === '---') {
        result.push(<hr key={idx} className="my-4 border-neutral-300" />);
        continue;
      }

      const checklistMatch = line.match(/^- \[([ x])\] (.*)$/);
      if (checklistMatch) {
        const isChecked = checklistMatch[1] === 'x';
        const text = checklistMatch[2];
        result.push(
          <div key={idx} className="flex items-center gap-2 py-1">
            <Checkbox checked={isChecked} disabled className="pointer-events-none" />
            <span className={isChecked ? 'line-through text-muted-foreground' : ''}>{text}</span>
          </div>
        );
        continue;
      }

      const imageMatch = line.match(/!\[([^\]]*)\]\(([^)]+)\)/);
      if (imageMatch) {
        result.push(
          <div key={idx} className="my-4">
            <img src={imageMatch[2]} alt={imageMatch[1]} className="max-w-full rounded-lg shadow-md" />
          </div>
        );
        continue;
      }

      const videoMatch = line.match(/\[Video: ([^\]]+)\]/);
      if (videoMatch) {
        const url = videoMatch[1];
        if (url.includes('youtube.com') || url.includes('youtu.be')) {
          const videoId = url.includes('youtu.be')
            ? url.split('/').pop()
            : new URLSearchParams(new URL(url).search).get('v');
          result.push(
            <div key={idx} className="my-4 aspect-video">
              <iframe
                src={`https://www.youtube.com/embed/${videoId}`}
                className="w-full h-full rounded-lg"
                allowFullScreen
              />
            </div>
          );
        } else {
          result.push(
            <div key={idx} className="my-4">
              <video src={url} controls className="max-w-full rounded-lg" />
            </div>
          );
        }
        continue;
      }

      let formattedLine = line;
      formattedLine = formattedLine.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
      formattedLine = formattedLine.replace(/\*([^*]+)\*/g, '<em>$1</em>');
      formattedLine = formattedLine.replace(/__([^_]+)__/g, '<u>$1</u>');
      formattedLine = formattedLine.replace(/==([^=]+)==/g, '<mark style="background-color: #fef08a; padding: 0 4px; border-radius: 3px;">$1</mark>');
      formattedLine = formattedLine.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" style="color: #2563eb; text-decoration: underline;">$1</a>');

      result.push(
        <p
          key={idx}
          className="min-h-[1.5em]"
          dangerouslySetInnerHTML={{ __html: formattedLine || '&nbsp;' }}
        />
      );
    }

    return result;
  };

  if (isLoading) {
    return (

      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>

    );
  }

  return (
    <>
      <div className="flex flex-col h-[calc(100vh-3rem)] overflow-hidden">
        <div className="flex flex-1 overflow-hidden">
          <div className="w-80 border-r border-border flex flex-col" style={{ backgroundColor: '#f8f7f4' }}>
            <div className="p-4 border-b">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="h-5 w-5 text-primary" />
                <h2 className="font-semibold">Lista Documenti</h2>
              </div>
              <div className="relative mb-3">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cerca documenti..."
                  className="pl-9 h-9 text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleOpenNewDocDialog} className="flex-1" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Nuovo
                </Button>
                <Button
                  onClick={() => setFilterReview(!filterReview)}
                  size="sm"
                  variant={filterReview ? "default" : "outline"}
                  className={filterReview ? "bg-orange-500 hover:bg-orange-600" : ""}
                  title="Filtra documenti da rivedere"
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  onClick={() => setViewMode(viewMode === "list" ? "grid" : "list")}
                  size="sm"
                  variant="outline"
                  title={viewMode === "list" ? "Vista griglia" : "Vista lista"}
                >
                  {viewMode === "list" ? <LayoutGrid className="h-4 w-4" /> : <LayoutList className="h-4 w-4" />}
                </Button>
              </div>

              {/* Filtri etichette */}
              <div className="mt-3 flex flex-wrap gap-1">
                <Button
                  size="sm"
                  variant={filterTag === null ? "default" : "outline"}
                  className="h-6 text-[10px] px-2"
                  onClick={() => setFilterTag(null)}
                >
                  Tutti
                </Button>
                {availableTags.map(tag => {
                  const count = documents.filter((d: any) => getDocTags(d).includes(tag.name)).length;
                  if (count === 0) return null;
                  return (
                    <Button
                      key={tag.name}
                      size="sm"
                      variant={filterTag === tag.name ? "default" : "outline"}
                      className="h-6 text-[10px] px-2 gap-1"
                      style={{
                        backgroundColor: filterTag === tag.name ? tag.color : undefined,
                        borderColor: tag.color,
                        color: filterTag === tag.name ? 'white' : tag.color
                      }}
                      onClick={() => setFilterTag(filterTag === tag.name ? null : tag.name)}
                    >
                      <Tag className="h-2.5 w-2.5" />
                      {tag.name} ({count})
                    </Button>
                  );
                })}
              </div>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-2">
                {viewMode === "list" ? (
                  <>
                    {filteredDocs.map((doc: any) => (
                      <button
                        key={doc.id}
                        onClick={() => {
                          setSelectedDocId(doc.id);
                          setIsEditing(false);
                        }}
                        className={`w-full flex items-center gap-3 p-2.5 rounded-md text-left transition-colors mb-1 ${selectedDocId === doc.id
                          ? 'bg-primary/10 text-primary'
                          : 'hover:bg-muted'
                          }`}
                      >
                        <span className="text-lg">{doc.icon || "📄"}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-xs truncate">{doc.title}</span>
                            {doc.needsReview && (
                              <span className="w-2 h-2 rounded-full bg-orange-500 flex-shrink-0" title="Da rivedere" />
                            )}
                            {doc.ownerId === user?.id ? (
                              <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">Mio</Badge>
                            ) : doc.ownerId && (
                              <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">Condiviso</Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            {doc.lastEditorId && (
                              <>
                                <Edit3 className="h-3 w-3" />
                                <span>{getUserName(doc.lastEditorId)}</span>
                                <span>•</span>
                              </>
                            )}
                            {doc.lastEditedAt ? formatDistanceToNow(new Date(doc.lastEditedAt), { addSuffix: true, locale: it }) : formatDate(doc.updatedAt)}
                          </div>
                          <div className="text-[10px] text-muted-foreground/70 flex items-center gap-2 mt-0.5">
                            <span className="flex items-center gap-1">
                              <HardDrive className="h-2.5 w-2.5" />
                              {formatFileSize(doc.content)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-2.5 w-2.5" />
                              {formatFullDateTime(doc.createdAt)}
                            </span>
                          </div>
                          {getDocTags(doc).length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {getDocTags(doc).map((tagName: string) => {
                                const tagInfo = availableTags.find(t => t.name === tagName);
                                return (
                                  <span
                                    key={tagName}
                                    className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-medium"
                                    style={{
                                      backgroundColor: tagInfo?.color + '20',
                                      color: tagInfo?.color || '#666'
                                    }}
                                  >
                                    <Tag className="h-2 w-2" />
                                    {tagName}
                                  </span>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {filteredDocs.map((doc: any) => (
                      <button
                        key={doc.id}
                        onClick={() => {
                          setSelectedDocId(doc.id);
                          setIsEditing(false);
                        }}
                        className={`flex flex-col p-3 rounded-lg text-left transition-all border ${selectedDocId === doc.id
                          ? 'bg-primary/10 border-primary shadow-md'
                          : 'hover:bg-muted border-transparent hover:border-border'
                          }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-2xl">{doc.icon || "📄"}</span>
                          <div className="flex items-center gap-1">
                            {doc.needsReview && (
                              <span className="w-2 h-2 rounded-full bg-orange-500" title="Da rivedere" />
                            )}
                            {doc.ownerId === user?.id ? (
                              <Badge variant="outline" className="text-[8px] px-1 py-0 h-3">Mio</Badge>
                            ) : doc.ownerId && (
                              <Badge variant="secondary" className="text-[8px] px-1 py-0 h-3">Cond.</Badge>
                            )}
                          </div>
                        </div>
                        <span className="font-medium text-xs truncate mb-1">{doc.title}</span>
                        <div className="text-[9px] text-muted-foreground space-y-0.5">
                          {/* File size removed as content is not in metadata */}
                          <div className="flex items-center gap-1">
                            <Calendar className="h-2.5 w-2.5" />
                            <span>{formatFullDateTime(doc.createdAt)}</span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {filteredDocs.length === 0 && (
                  <div className="text-center text-muted-foreground text-sm py-8">
                    Nessun documento trovato
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          <div className={`flex-1 flex flex-col transition-all duration-300 ${isFullscreen
            ? 'fixed inset-0 z-50 bg-background'
            : ''
            }`} style={{ backgroundColor: isFullscreen ? undefined : '#f8f7f4' }}>
            {selectedDoc ? (
              <>
                <div className="border-b px-6 py-3 flex items-center justify-between">
                  {isFullscreen && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setIsFullscreen(false)}
                      className="mr-2"
                    >
                      <Minimize2 className="h-4 w-4 mr-1" /> Esci
                    </Button>
                  )}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FileText className="h-4 w-4" />
                    <ChevronRight className="h-4 w-4" />
                    <span className="text-foreground font-medium">{selectedDoc.title}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {isEditing ? (
                      <>
                        <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)} className="flex items-center gap-1.5 h-8 px-3 text-xs rounded-lg border border-transparent hover:border-border">
                          <X className="h-4 w-4" />
                          <span>Annulla</span>
                        </Button>
                        <Button size="sm" onClick={handleSaveDocument} className="flex items-center gap-1.5 h-8 px-3 text-xs rounded-lg">
                          <Check className="h-4 w-4" />
                          <span>Salva</span>
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleOpenDocumentChat}
                          disabled={creatingChannel}
                          className="flex items-center gap-1.5 h-8 px-3 text-xs rounded-lg"
                        >
                          {creatingChannel ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : showChatPanel ? (
                            <span className="relative flex h-2.5 w-2.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                            </span>
                          ) : (
                            <MessageSquare className="h-4 w-4" />
                          )}
                          <span>Chat{chatMessages.length > 0 ? ` (${chatMessages.length})` : ''}</span>
                        </Button>
                        <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline" className="flex items-center gap-1.5 h-8 px-3 text-xs rounded-lg">
                              <Share2 className="h-4 w-4" />
                              <span>Condividi</span>
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2">
                                <Share2 className="h-5 w-5" />
                                Condividi documento
                              </DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="space-y-3">
                                <div className="relative">
                                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                  <Input
                                    placeholder="Cerca utente per nome..."
                                    className="pl-9"
                                    value={userSearchQuery}
                                    onChange={(e) => setUserSearchQuery(e.target.value)}
                                  />
                                </div>

                                {userSearchQuery && filteredUsers.length > 0 && (
                                  <div className="border rounded-md max-h-40 overflow-y-auto">
                                    {filteredUsers.map((u: any) => (
                                      <button
                                        key={u.id}
                                        onClick={() => {
                                          setSelectedUserId(u.id);
                                          setUserSearchQuery(u.name);
                                        }}
                                        className="w-full flex items-center gap-2 p-2 hover:bg-muted text-left"
                                      >
                                        <Avatar className="h-6 w-6">
                                          <AvatarFallback className="text-xs">{u.name[0]}</AvatarFallback>
                                        </Avatar>
                                        <span className="text-sm">{u.name}</span>
                                      </button>
                                    ))}
                                  </div>
                                )}

                                <div className="flex gap-2">
                                  <Select value={selectedPermission} onValueChange={setSelectedPermission}>
                                    <SelectTrigger className="w-40">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="view">Può visualizzare</SelectItem>
                                      <SelectItem value="edit">Può modificare</SelectItem>
                                      <SelectItem value="admin">Accesso completo</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <Button onClick={handleShare} disabled={!selectedUserId} className="flex-1">
                                    <Plus className="h-4 w-4 mr-1" /> Invita
                                  </Button>
                                </div>
                              </div>

                              <div className="border-t pt-4">
                                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                                  <Users className="h-4 w-4" />
                                  Persone con accesso ({shares.length + 1})
                                </h4>
                                <div className="space-y-2">
                                  {selectedDoc?.ownerId && (
                                    <div className="flex items-center justify-between py-2 px-3 bg-primary/5 rounded-md border border-primary/20">
                                      <div className="flex items-center gap-2">
                                        <Avatar className="h-8 w-8">
                                          <AvatarFallback>{getUserName(selectedDoc.ownerId)[0]}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                          <div className="text-sm font-medium">{getUserName(selectedDoc.ownerId)}</div>
                                          <div className="text-xs text-primary font-medium">Proprietario</div>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                  {shares.map((share: any) => (
                                    <div key={share.id} className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded-md">
                                      <div className="flex items-center gap-2">
                                        <Avatar className="h-8 w-8">
                                          <AvatarFallback>{getUserName(share.userId)[0]}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                          <div className="text-sm font-medium">{getUserName(share.userId)}</div>
                                          <div className="text-xs text-muted-foreground">
                                            {share.permission === 'view' ? 'Può visualizzare' : share.permission === 'edit' ? 'Può modificare' : 'Accesso completo'}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              onClick={() => handleCreateDocumentChat(share.userId, getUserName(share.userId))}
                                              disabled={createDocChatMutation.isPending}
                                            >
                                              <MessageSquare className="h-4 w-4 text-purple-500" />
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p>Crea chat per questo documento</p>
                                          </TooltipContent>
                                        </Tooltip>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => removeShareMutation.mutate({ docId: selectedDocId!, shareId: share.id })}
                                        >
                                          <X className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                  {shares.length === 0 && !selectedDoc?.ownerId && (
                                    <div className="text-center text-muted-foreground text-sm py-4">
                                      Non condiviso con nessuno
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Dialog open={linkProjectDialogOpen} onOpenChange={setLinkProjectDialogOpen}>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline" title="Collega a Progetto">
                              <FolderPlus className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Collega a Progetto</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="flex gap-2">
                                <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                                  <SelectTrigger className="flex-1">
                                    <SelectValue placeholder="Seleziona progetto..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {projects.map((project: any) => (
                                      <SelectItem key={project.id} value={project.id}>
                                        {project.title}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <Button onClick={handleLinkProject} disabled={!selectedProjectId}>
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>

                              {linkedProjects.length > 0 && (
                                <div className="border-t pt-4">
                                  <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                                    <FolderPlus className="h-4 w-4" />
                                    Progetti collegati ({linkedProjects.length})
                                  </h4>
                                  <div className="space-y-2">
                                    {linkedProjects.map((lp: any) => (
                                      <div key={lp.id} className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded-md">
                                        <span className="text-sm font-medium">{lp.project?.title || lp.title}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Button
                          size="sm"
                          variant={selectedDoc.needsReview ? "default" : "outline"}
                          className={`flex items-center gap-1.5 h-8 px-3 text-xs rounded-lg ${selectedDoc.needsReview ? "bg-orange-500 hover:bg-orange-600" : ""}`}
                          onClick={() => handleToggleReview(selectedDoc.id, selectedDoc.needsReview)}
                        >
                          {selectedDoc.needsReview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          <span>{selectedDoc.needsReview ? "Rivisto" : "Rivedere"}</span>
                        </Button>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="outline" className="flex items-center gap-1.5 h-8 px-3 text-xs rounded-lg">
                              <Tag className="h-4 w-4" />
                              <span>Etichette</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>Etichette</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {availableTags.map(tag => {
                              const isSelected = getDocTags(selectedDoc).includes(tag.name);
                              return (
                                <DropdownMenuItem
                                  key={tag.name}
                                  onClick={() => isSelected
                                    ? handleRemoveTag(selectedDoc.id, tag.name)
                                    : handleAddTag(selectedDoc.id, tag.name)
                                  }
                                  className="flex items-center gap-2"
                                >
                                  <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: tag.color }}
                                  />
                                  <span className="flex-1">{tag.name}</span>
                                  {isSelected && <Check className="h-4 w-4 text-green-600" />}
                                </DropdownMenuItem>
                              );
                            })}
                          </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Colore sfondo */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="outline" className="flex items-center gap-1.5 h-8 px-3 text-xs rounded-lg">
                              <Palette className="h-4 w-4" />
                              <span>Sfondo</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>Sfondo Documento</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {backgroundPresets.map(preset => (
                              <DropdownMenuItem
                                key={preset.value}
                                onClick={() => setDocBackground(preset.value)}
                                className="flex items-center gap-2"
                              >
                                <div
                                  className="w-5 h-5 rounded border"
                                  style={{ background: preset.style }}
                                />
                                <span className="flex-1">{preset.name}</span>
                                {docBackground === preset.value && <Check className="h-4 w-4 text-green-600" />}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Stampa */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handlePrint}
                          className="flex items-center gap-1.5 h-8 px-3 text-xs rounded-lg"
                        >
                          <Printer className="h-4 w-4" />
                          <span>Stampa</span>
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setIsEditing(true)}
                          className="flex items-center gap-1.5 h-8 px-3 text-xs rounded-lg"
                        >
                          <Edit3 className="h-4 w-4" />
                          <span>Modifica</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setIsFullscreen(!isFullscreen)}
                          className="flex items-center gap-1.5 h-8 px-3 text-xs rounded-lg"
                        >
                          {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                          <span>{isFullscreen ? "Esci" : "Full"}</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleDeleteDocument}
                          className="flex items-center gap-1.5 h-8 px-3 text-xs rounded-lg text-red-500 hover:text-red-600 hover:border-red-300"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span>Elimina</span>
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {isEditing && (
                  <div className="border-b px-6 py-2 flex items-center gap-1 bg-muted/50">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleBold}
                      className="h-8 w-8 p-0"
                      title="Grassetto"
                    >
                      <Bold className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleItalic}
                      className="h-8 w-8 p-0"
                      title="Corsivo"
                    >
                      <Italic className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleUnderline}
                      className="h-8 w-8 p-0"
                      title="Sottolineato"
                    >
                      <Underline className="h-4 w-4" />
                    </Button>

                    <div className="w-px h-6 bg-border mx-2" />

                    <Select onValueChange={handleFontFamily}>
                      <SelectTrigger className="h-8 w-[130px] text-xs" onMouseDown={saveSelection}>
                        <SelectValue placeholder="Carattere" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Arial">Arial</SelectItem>
                        <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                        <SelectItem value="Georgia">Georgia</SelectItem>
                        <SelectItem value="Verdana">Verdana</SelectItem>
                        <SelectItem value="Courier New">Courier New</SelectItem>
                        <SelectItem value="Trebuchet MS">Trebuchet MS</SelectItem>
                        <SelectItem value="Comic Sans MS">Comic Sans MS</SelectItem>
                        <SelectItem value="Impact">Impact</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select onValueChange={handleFontSize}>
                      <SelectTrigger className="h-8 w-[80px] text-xs" onMouseDown={saveSelection}>
                        <SelectValue placeholder="Dim." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">8px</SelectItem>
                        <SelectItem value="2">10px</SelectItem>
                        <SelectItem value="3">12px</SelectItem>
                        <SelectItem value="4">14px</SelectItem>
                        <SelectItem value="5">18px</SelectItem>
                        <SelectItem value="6">24px</SelectItem>
                        <SelectItem value="7">36px</SelectItem>
                      </SelectContent>
                    </Select>

                    <div className="w-px h-6 bg-border mx-2" />

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleBulletList}
                      className="h-8 w-8 p-0"
                      title="Elenco puntato"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleNumberedList}
                      className="h-8 w-8 p-0"
                      title="Elenco numerato"
                    >
                      <ListOrdered className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleToggleList}
                      className="h-8 w-8 p-0"
                      title="Toggle (espandi/comprimi)"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>

                    <div className="w-px h-6 bg-border mx-2" />

                    <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          title="Inserisci Immagine"
                        >
                          <Image className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Inserisci Immagine</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <Input
                            placeholder="URL dell'immagine..."
                            value={mediaUrl}
                            onChange={(e) => setMediaUrl(e.target.value)}
                          />
                          <Button onClick={handleInsertImage} className="w-full">
                            Inserisci
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <Dialog open={videoDialogOpen} onOpenChange={setVideoDialogOpen}>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          title="Inserisci Video"
                        >
                          <Video className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Inserisci Video</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <Input
                            placeholder="URL del video (YouTube o diretto)..."
                            value={mediaUrl}
                            onChange={(e) => setMediaUrl(e.target.value)}
                          />
                          <Button onClick={handleInsertVideo} className="w-full">
                            Inserisci
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <Dialog open={pdfDialogOpen} onOpenChange={setPdfDialogOpen}>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          title="Inserisci PDF"
                        >
                          <FileUp className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <File className="h-5 w-5 text-red-600" />
                            Inserisci PDF
                          </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <p className="text-sm text-muted-foreground">
                            Carica un file PDF per inserirlo nel documento con anteprima integrata.
                          </p>
                          <input
                            ref={pdfInputRef}
                            type="file"
                            accept=".pdf,application/pdf"
                            onChange={handlePdfUpload}
                            className="hidden"
                          />
                          {pdfUploading ? (
                            <div className="space-y-3">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Caricamento in corso...</span>
                                <span className="font-medium text-red-600">{pdfUploadProgress}%</span>
                              </div>
                              <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-red-500 to-red-600 rounded-full transition-all duration-300 ease-out"
                                  style={{ width: `${pdfUploadProgress}%` }}
                                />
                              </div>
                              <p className="text-xs text-center text-muted-foreground">
                                {pdfUploadProgress < 100 ? 'Attendere il completamento...' : 'Elaborazione...'}
                              </p>
                            </div>
                          ) : (
                            <Button
                              onClick={() => pdfInputRef.current?.click()}
                              className="w-full"
                            >
                              <FileUp className="h-4 w-4 mr-2" />
                              Seleziona PDF
                            </Button>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>

                    <Dialog open={excelDialogOpen} onOpenChange={setExcelDialogOpen}>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          title="Inserisci Excel"
                        >
                          <FileSpreadsheet className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <FileSpreadsheet className="h-5 w-5 text-green-600" />
                            Inserisci Excel
                          </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <p className="text-sm text-muted-foreground">
                            Carica un file Excel per visualizzarlo come tabella nel documento.
                          </p>
                          <input
                            ref={excelInputRef}
                            type="file"
                            accept=".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                            onChange={handleExcelUpload}
                            className="hidden"
                          />
                          {excelUploading ? (
                            <div className="space-y-3">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Caricamento in corso...</span>
                                <span className="font-medium text-green-600">{excelUploadProgress}%</span>
                              </div>
                              <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full transition-all duration-300 ease-out"
                                  style={{ width: `${excelUploadProgress}%` }}
                                />
                              </div>
                              <p className="text-xs text-center text-muted-foreground">
                                {excelUploadProgress < 100 ? 'Attendere il completamento...' : 'Elaborazione...'}
                              </p>
                            </div>
                          ) : (
                            <Button
                              onClick={() => excelInputRef.current?.click()}
                              className="w-full bg-green-600 hover:bg-green-700"
                            >
                              <FileSpreadsheet className="h-4 w-4 mr-2" />
                              Seleziona Excel
                            </Button>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>

                    <Dialog open={wordDialogOpen} onOpenChange={setWordDialogOpen}>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          title="Inserisci Word"
                        >
                          <FileText className="h-4 w-4 text-blue-600" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-blue-600" />
                            Inserisci Word
                          </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <p className="text-sm text-muted-foreground">
                            Carica un file Word per importare il contenuto nel documento.
                          </p>
                          <input
                            ref={wordInputRef}
                            type="file"
                            accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                            onChange={handleWordUpload}
                            className="hidden"
                          />
                          {wordUploading ? (
                            <div className="space-y-3">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Caricamento in corso...</span>
                                <span className="font-medium text-blue-600">{wordUploadProgress}%</span>
                              </div>
                              <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-300 ease-out"
                                  style={{ width: `${wordUploadProgress}%` }}
                                />
                              </div>
                              <p className="text-xs text-center text-muted-foreground">
                                {wordUploadProgress < 100 ? 'Attendere il completamento...' : 'Elaborazione...'}
                              </p>
                            </div>
                          ) : (
                            <Button
                              onClick={() => wordInputRef.current?.click()}
                              className="w-full bg-blue-600 hover:bg-blue-700"
                            >
                              <FileText className="h-4 w-4 mr-2" />
                              Seleziona Word
                            </Button>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>

                    <Dialog open={pptxDialogOpen} onOpenChange={setPptxDialogOpen}>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          title="Inserisci PowerPoint"
                        >
                          <Presentation className="h-4 w-4 text-orange-600" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <Presentation className="h-5 w-5 text-orange-600" />
                            Inserisci PowerPoint
                          </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <p className="text-sm text-muted-foreground">
                            Carica una presentazione PowerPoint per importare il testo nel documento.
                          </p>
                          <input
                            ref={pptxInputRef}
                            type="file"
                            accept=".ppt,.pptx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                            onChange={handlePptxUpload}
                            className="hidden"
                          />
                          {pptxUploading ? (
                            <div className="space-y-3">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Caricamento in corso...</span>
                                <span className="font-medium text-orange-600">{pptxUploadProgress}%</span>
                              </div>
                              <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-orange-500 to-orange-600 rounded-full transition-all duration-300 ease-out"
                                  style={{ width: `${pptxUploadProgress}%` }}
                                />
                              </div>
                              <p className="text-xs text-center text-muted-foreground">
                                {pptxUploadProgress < 100 ? 'Attendere il completamento...' : 'Elaborazione...'}
                              </p>
                            </div>
                          ) : (
                            <Button
                              onClick={() => pptxInputRef.current?.click()}
                              className="w-full bg-orange-600 hover:bg-orange-700"
                            >
                              <Presentation className="h-4 w-4 mr-2" />
                              Seleziona PowerPoint
                            </Button>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>

                    <div className="w-px h-6 bg-border mx-2" />

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleDivider}
                      className="h-8 w-8 p-0"
                      title="Linea Divisoria"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleChecklist}
                      className="h-8 w-8 p-0"
                      title="Checklist"
                    >
                      <CheckSquare className="h-4 w-4" />
                    </Button>

                    <div className="w-px h-6 bg-border mx-2" />

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleAlignLeft}
                      className="h-8 w-8 p-0"
                      title="Allinea a Sinistra"
                    >
                      <AlignLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleAlignCenter}
                      className="h-8 w-8 p-0"
                      title="Allinea al Centro"
                    >
                      <AlignCenter className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleAlignRight}
                      className="h-8 w-8 p-0"
                      title="Allinea a Destra"
                    >
                      <AlignRight className="h-4 w-4" />
                    </Button>

                    <div className="w-px h-6 bg-border mx-2" />

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleHighlight}
                      className="h-8 w-8 p-0"
                      title="Evidenzia"
                    >
                      <Highlighter className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleCallout}
                      className="h-8 w-8 p-0"
                      title="Callout"
                    >
                      <MessageCircle className="h-4 w-4" />
                    </Button>

                    <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          title="Inserisci Link"
                        >
                          <Link2 className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Inserisci Link</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <Input
                            placeholder="Testo del link..."
                            value={linkText}
                            onChange={(e) => setLinkText(e.target.value)}
                          />
                          <Input
                            placeholder="URL (es. https://...)..."
                            value={linkUrl}
                            onChange={(e) => setLinkUrl(e.target.value)}
                          />
                          <Button onClick={handleInsertLink} className="w-full">
                            Inserisci
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <div className="flex-1" />

                    {/* Indicatore collaboratori */}
                    <TooltipProvider>
                      <div className="flex items-center gap-1 mr-4">
                        {collaborators.length > 0 ? (
                          <>
                            <div className="flex -space-x-2">
                              {collaborators.slice(0, 3).map((collab, idx) => (
                                <Tooltip key={collab.odId || idx}>
                                  <TooltipTrigger asChild>
                                    <Avatar className="h-7 w-7 border-2 border-background" style={{ borderColor: collab.odColor }}>
                                      <AvatarFallback style={{ backgroundColor: collab.odColor, color: 'white' }} className="text-xs font-medium">
                                        {collab.odName.substring(0, 2).toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{collab.odName}</p>
                                  </TooltipContent>
                                </Tooltip>
                              ))}
                            </div>
                            {collaborators.length > 3 && (
                              <span className="text-xs text-muted-foreground ml-1">+{collaborators.length - 3}</span>
                            )}
                            <span className="text-xs text-muted-foreground ml-2">stanno modificando</span>
                          </>
                        ) : shares.length > 0 ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-help">
                                <Circle className="h-2 w-2 fill-green-500 text-green-500" />
                                <span>Collaborazione attiva</span>
                                <span className="text-[10px] bg-green-100 text-green-700 px-1.5 rounded-full">{shares.length}</span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Documento condiviso con {shares.length} utent{shares.length === 1 ? 'e' : 'i'}</p>
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-help">
                                <Circle className="h-2 w-2 fill-red-500 text-red-500" />
                                <span>Non condiviso</span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Documento privato - clicca "Condividi" per collaborare</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </TooltipProvider>

                    {autoSaveStatus !== "idle" && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {autoSaveStatus === "saving" && (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Salvataggio...</span>
                          </>
                        )}
                        {autoSaveStatus === "saved" && (
                          <>
                            <Check className="h-4 w-4 text-green-600" />
                            <span className="text-green-600">Salvato</span>
                          </>
                        )}
                      </div>
                    )}
                    {hasUnsavedChanges && autoSaveStatus === "idle" && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>Modifiche non salvate</span>
                      </div>
                    )}
                  </div>
                )}

                <ScrollArea className="flex-1 p-8" style={{ background: getBackgroundStyle(), color: docBackground === 'dark' ? '#fff' : undefined }}>
                  <div className="w-full">
                    <div className="flex items-center gap-3 mb-6">
                      <span className="text-5xl">{selectedDoc.icon || "📄"}</span>
                      {isEditing ? (
                        <Input
                          value={editTitle}
                          onChange={(e) => handleTitleChange(e.target.value)}
                          className="text-3xl font-bold border-none shadow-none focus-visible:ring-0 p-0 h-auto"
                          placeholder="Titolo documento..."
                        />
                      ) : (
                        <h1 className="text-3xl font-bold text-foreground">{selectedDoc.title}</h1>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-8 pb-4 border-b flex-wrap">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        Modificato: {formatDate(selectedDoc.updatedAt)}
                      </div>
                      {shares.length > 0 && (
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          Condiviso con {shares.length} {shares.length === 1 ? 'persona' : 'persone'}
                        </div>
                      )}
                      {linkedProjects.length > 0 && (
                        <div className="flex items-center gap-2">
                          <FolderPlus className="h-4 w-4" />
                          <span>Progetto:</span>
                          {linkedProjects.map((lp: any) => (
                            <span key={lp.id} className="px-2 py-0.5 bg-violet-100 text-violet-700 rounded-md text-xs font-medium">
                              {lp.project?.title || lp.title}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {embeddedPdfs.length > 0 && (
                      <div className="space-y-4 mb-8">
                        {embeddedPdfs.map((pdf) => (
                          <div key={pdf.id} className="border rounded-lg overflow-hidden bg-white">
                            <div className="flex items-center justify-between p-3 bg-gray-50 border-b">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
                                  <span className="text-white font-bold text-xs">PDF</span>
                                </div>
                                <div>
                                  <div className="font-semibold text-sm">{pdf.filename}</div>
                                  <div className="text-xs text-muted-foreground">{(pdf.size / 1024).toFixed(1)} KB</div>
                                </div>
                              </div>
                              {isEditing && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleRemovePdf(pdf.id)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                            <PDFViewer
                              url={pdf.url}
                              filename={pdf.filename}
                              onRequestSummary={() => handlePdfSummary(pdf.id, pdf.url, pdf.filename)}
                              summaryLoading={pdfSummaryLoading && activePdfSummary === pdf.id}
                              summary={activePdfSummary === pdf.id ? pdfSummaryContent : null}
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    {embeddedExcels.length > 0 && (
                      <div className="space-y-4 mb-8">
                        {embeddedExcels.map((excel) => (
                          <div key={excel.id} className="border rounded-lg overflow-hidden bg-white">
                            <div className="flex items-center justify-between p-3 bg-green-50 border-b">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                                  <FileSpreadsheet className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                  <div className="font-semibold text-sm">{excel.filename}</div>
                                  <div className="text-xs text-muted-foreground">{(excel.size / 1024).toFixed(1)} KB</div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setActiveExcelViewer(activeExcelViewer === excel.id ? null : excel.id)}
                                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                >
                                  <Table className="h-4 w-4 mr-1" />
                                  {activeExcelViewer === excel.id ? 'Nascondi' : 'Visualizza'}
                                </Button>
                                {isEditing && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleRemoveExcel(excel.id)}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                            {activeExcelViewer === excel.id && excel.sheets && (
                              <div className="h-96">
                                <ExcelViewer
                                  sheets={excel.sheets}
                                  filename={excel.filename}
                                />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {isEditing ? (
                      <div
                        ref={editorRef}
                        contentEditable
                        suppressContentEditableWarning
                        onInput={updateContentFromEditor}
                        onBlur={updateContentFromEditor}
                        onClick={(e) => { handleEditorCursor(); saveSelection(); }}
                        onKeyUp={(e) => { handleEditorCursor(); saveSelection(); }}
                        onMouseUp={saveSelection}
                        onSelect={saveSelection}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const selection = window.getSelection();
                            if (selection && selection.anchorNode) {
                              const checklistItem = (selection.anchorNode as Element).closest?.('.checklist-item') ||
                                (selection.anchorNode.parentElement as Element)?.closest?.('.checklist-item');
                              if (checklistItem) {
                                e.preventDefault();
                                const newItem = document.createElement('li');
                                newItem.className = 'checklist-item';
                                newItem.style.cssText = 'display: flex; align-items: center; gap: 8px; padding: 4px 0;';
                                newItem.innerHTML = `
                                <input type="checkbox" style="pointer-events: auto; cursor: pointer; width: 16px; height: 16px;" />
                                <span contenteditable="true" style="flex: 1; outline: none;"></span>
                              `;
                                checklistItem.parentNode?.insertBefore(newItem, checklistItem.nextSibling);
                                const newSpan = newItem.querySelector('span');
                                if (newSpan) {
                                  const range = document.createRange();
                                  range.setStart(newSpan, 0);
                                  range.collapse(true);
                                  selection.removeAllRanges();
                                  selection.addRange(range);
                                }
                                updateContentFromEditor();
                              }
                            }
                          }
                        }}
                        className="min-h-[400px] outline-none text-base leading-relaxed focus:outline-none prose prose-neutral max-w-none"
                        style={{ whiteSpace: 'pre-wrap' }}
                      />
                    ) : (
                      <div
                        className="prose prose-neutral max-w-none text-base leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: selectedDoc.content || '<div class="text-muted-foreground italic">Documento vuoto. Clicca su "Modifica" per aggiungere contenuto.</div>' }}
                      />
                    )}
                  </div>
                </ScrollArea>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <FileText className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-muted-foreground mb-2">
                    Seleziona un documento
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Scegli un documento dalla lista o creane uno nuovo
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Pannello Chat Documento */}
          {showChatPanel && (documentChannel || creatingChannel) && (
            <div className="w-80 border-l border-border flex flex-col bg-[#F5E6D3]">
              <div className="p-3 border-b bg-[#6B7A8A] text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    <span className="font-medium text-sm">Chat Documento</span>
                  </div>
                  <button
                    onClick={() => setShowChatPanel(false)}
                    className="hover:bg-[#5A6978] rounded p-1"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-xs text-gray-300 mt-1 truncate">{documentChannel.name}</p>
              </div>

              <ScrollArea className="flex-1 p-3">
                {chatMessages.length === 0 ? (
                  <div className="text-center text-muted-foreground text-sm py-8">
                    <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    Nessun messaggio. Inizia la conversazione!
                  </div>
                ) : (
                  <div className="space-y-3">
                    {chatMessages.map((msg: any) => (
                      <div key={msg.id} className="flex gap-2">
                        <Avatar className="h-7 w-7 rounded-md shrink-0">
                          <AvatarFallback className="bg-slate-200 text-slate-700 rounded-md text-[10px] font-bold">
                            {msg.senderAvatar || msg.senderName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-1 mb-0.5">
                            <span className="font-medium text-xs">{msg.senderName}</span>
                            <span className="text-[10px] text-muted-foreground">
                              {msg.createdAt && format(new Date(msg.createdAt), 'HH:mm')}
                            </span>
                          </div>
                          <p className="text-xs text-foreground break-words">{msg.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>

              <div className="p-3 border-t">
                <div className="flex gap-2">
                  <Input
                    placeholder="Scrivi un messaggio..."
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && chatMessage.trim()) {
                        sendChatMessageMutation.mutate(chatMessage);
                      }
                    }}
                    className="text-sm h-9"
                  />
                  <Button
                    size="sm"
                    onClick={() => chatMessage.trim() && sendChatMessageMutation.mutate(chatMessage)}
                    disabled={!chatMessage.trim() || sendChatMessageMutation.isPending}
                    className="bg-[#6B7A8A] hover:bg-[#5A6978] h-9 px-3"
                  >
                    {sendChatMessageMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <MessageSquare className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Pannello AI Riassunto */}
      <Dialog open={aiSummaryOpen} onOpenChange={setAiSummaryOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div>
                <span className="font-semibold">Riassunto AI</span>
                {aiSummaryTitle && (
                  <p className="text-sm text-muted-foreground font-normal">{aiSummaryTitle}</p>
                )}
              </div>
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-1 max-h-[60vh]">
            <div className="p-4">
              {aiSummaryLoading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                  <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
                  <p className="text-muted-foreground">Analisi del documento in corso...</p>
                </div>
              ) : (
                <div className="prose prose-sm max-w-none
                  prose-headings:text-foreground prose-headings:font-semibold
                  prose-h1:text-xl prose-h1:mb-3 prose-h1:mt-4
                  prose-h2:text-lg prose-h2:mb-2 prose-h2:mt-3
                  prose-h3:text-base prose-h3:mb-2 prose-h3:mt-2
                  prose-p:text-foreground prose-p:my-1.5 prose-p:text-sm
                  prose-li:text-foreground prose-li:text-sm
                  prose-ul:my-1.5 prose-ol:my-1.5
                  prose-strong:text-purple-700 dark:prose-strong:text-purple-400">
                  <ReactMarkdown>{aiSummaryContent}</ReactMarkdown>
                </div>
              )}
            </div>
          </ScrollArea>
          <div className="border-t pt-3 flex justify-end">
            <Button variant="outline" onClick={() => setAiSummaryOpen(false)}>
              Chiudi
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog per nuovo documento */}
      <Dialog open={newDocDialogOpen} onOpenChange={setNewDocDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Nuovo Documento
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome del documento</label>
              <Input
                placeholder="Inserisci il nome del documento..."
                value={newDocTitle}
                onChange={(e) => setNewDocTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newDocTitle.trim()) {
                    handleCreateDocument();
                  }
                }}
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setNewDocDialogOpen(false)}>
                Annulla
              </Button>
              <Button
                onClick={handleCreateDocument}
                disabled={!newDocTitle.trim()}
              >
                <Plus className="h-4 w-4 mr-2" />
                Crea
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default DocumentsContent;
