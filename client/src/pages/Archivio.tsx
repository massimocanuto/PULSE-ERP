import { AppLayout } from "@/components/layout/AppLayout";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ReactMarkdown from "react-markdown";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Archive, Upload, Search, FileText, Image, FileSpreadsheet, 
  Download, Trash2, Eye, Plus, Loader2, X, File, Calendar, User, HardDrive,
  LayoutGrid, List, ArrowUpDown, Star, StarOff, Copy, Edit2, MessageSquare,
  Link, Clock, RotateCcw, Filter, SortAsc, SortDesc, Tag, Folder, FolderOpen, ChevronLeft, Sparkles, CheckSquare, Square, Save, Mail, Share2, Ban, Globe, Timer
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { it } from "date-fns/locale";

const ARCHIVE_CATEGORIES = [
  "Contratti",
  "Fatture", 
  "Documenti Legali",
  "Certificazioni",
  "Ri.Ba.",
  "Documento",
  "Altro"
];

const categoryColors: Record<string, string> = {
  "Contratti": "bg-blue-500",
  "Fatture": "bg-green-500",
  "Documenti Legali": "bg-purple-500",
  "Certificazioni": "bg-amber-500",
  "Ri.Ba.": "bg-cyan-500",
  "Documento": "bg-slate-500",
  "Altro": "bg-gray-500"
};

const archiveApi = {
  getAll: async (category?: string, includeDeleted?: boolean, userId?: string) => {
    let url = '/api/archive';
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (includeDeleted) params.append('includeDeleted', 'true');
    if (userId) params.append('userId', userId);
    if (params.toString()) url += '?' + params.toString();
    const res = await fetch(url, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to fetch');
    return res.json();
  },
  get: async (id: string) => {
    const res = await fetch(`/api/archive/${id}`, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to fetch');
    return res.json();
  },
  create: async (formData: FormData) => {
    const res = await fetch('/api/archive', { method: 'POST', body: formData, credentials: 'include' });
    if (!res.ok) throw new Error('Failed to create');
    return res.json();
  },
  update: async (id: string, data: any) => {
    const res = await fetch(`/api/archive/${id}/metadata`, { 
      method: 'PUT', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'include'
    });
    if (!res.ok) throw new Error('Failed to update');
    return res.json();
  },
  updateWithFile: async (id: string, formData: FormData) => {
    const res = await fetch(`/api/archive/${id}`, { method: 'PATCH', body: formData, credentials: 'include' });
    if (!res.ok) throw new Error('Failed to update');
    return res.json();
  },
  delete: async (id: string) => {
    const res = await fetch(`/api/archive/${id}`, { method: 'DELETE', credentials: 'include' });
    if (!res.ok) throw new Error('Failed to delete');
    return res.json();
  },
  softDelete: async (id: string) => {
    const res = await fetch(`/api/archive/${id}/soft-delete`, { method: 'POST', credentials: 'include' });
    if (!res.ok) throw new Error('Failed to delete');
    return res.json();
  },
  restore: async (id: string) => {
    const res = await fetch(`/api/archive/${id}/restore`, { method: 'POST', credentials: 'include' });
    if (!res.ok) throw new Error('Failed to restore');
    return res.json();
  },
  duplicate: async (id: string) => {
    const res = await fetch(`/api/archive/${id}/duplicate`, { method: 'POST', credentials: 'include' });
    if (!res.ok) throw new Error('Failed to duplicate');
    return res.json();
  },
  toggleStar: async (id: string) => {
    const res = await fetch(`/api/archive/${id}/star`, { method: 'POST', credentials: 'include' });
    if (!res.ok) throw new Error('Failed to toggle star');
    return res.json();
  },
  generateShareLink: async (id: string, expiresIn: number) => {
    const res = await fetch(`/api/archive/${id}/share`, { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ expiresIn }),
      credentials: 'include'
    });
    if (!res.ok) throw new Error('Failed to generate link');
    return res.json();
  },
  getSharedDocuments: async (userId?: string) => {
    const params = userId ? `?userId=${userId}` : '';
    const res = await fetch(`/api/archive/shared${params}`, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to fetch shared documents');
    return res.json();
  },
  unshare: async (id: string) => {
    const res = await fetch(`/api/archive/${id}/unshare`, { method: 'POST', credentials: 'include' });
    if (!res.ok) throw new Error('Failed to unshare');
    return res.json();
  },
  summarize: async (id: string) => {
    const res = await fetch(`/api/archive/${id}/summarize`, { method: 'POST', credentials: 'include' });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to summarize');
    }
    return res.json();
  },
  bulkSoftDelete: async (ids: string[]) => {
    const res = await fetch('/api/archive/bulk/soft-delete', { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ ids })
    });
    if (!res.ok) throw new Error('Failed to delete');
    return res.json();
  },
  bulkRestore: async (ids: string[]) => {
    const res = await fetch('/api/archive/bulk/restore', { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ ids })
    });
    if (!res.ok) throw new Error('Failed to restore');
    return res.json();
  },
  bulkDelete: async (ids: string[]) => {
    const res = await fetch('/api/archive/bulk/delete', { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ ids })
    });
    if (!res.ok) throw new Error('Failed to delete');
    return res.json();
  }
};

const getFileIcon = (fileType: string, size: "sm" | "md" | "lg" = "lg") => {
  const sizeClass = size === "sm" ? "h-4 w-4" : size === "md" ? "h-6 w-6" : "h-8 w-8";
  if (fileType?.startsWith('image/')) return <Image className={`${sizeClass} text-purple-500`} />;
  if (fileType?.includes('spreadsheet') || fileType?.includes('excel')) return <FileSpreadsheet className={`${sizeClass} text-green-500`} />;
  if (fileType?.includes('pdf')) return <FileText className={`${sizeClass} text-red-500`} />;
  return <File className={`${sizeClass} text-blue-500`} />;
};

const formatFileSize = (bytes: number | null | undefined): string => {
  if (!bytes) return "-";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getShareTimeRemaining = (expiresAt: string | Date | null): { text: string; isExpired: boolean; isActive: boolean } => {
  if (!expiresAt) return { text: "", isExpired: false, isActive: false };
  
  const now = new Date();
  const expires = new Date(expiresAt);
  const diff = expires.getTime() - now.getTime();
  
  if (diff <= 0) return { text: "Scaduto", isExpired: true, isActive: false };
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return { text: `${days}g ${hours % 24}h ${minutes}m`, isExpired: false, isActive: true };
  }
  if (hours > 0) {
    return { text: `${hours}h ${minutes}m ${seconds}s`, isExpired: false, isActive: true };
  }
  if (minutes > 0) {
    return { text: `${minutes}m ${seconds}s`, isExpired: false, isActive: true };
  }
  return { text: `${seconds}s`, isExpired: false, isActive: true };
};

const getAssignedTime = (createdAt: string | Date | null, expiresAt: string | Date | null): string => {
  if (!createdAt || !expiresAt) return "-";
  const created = new Date(createdAt);
  const expires = new Date(expiresAt);
  const diff = expires.getTime() - created.getTime();
  const hours = Math.round(diff / (1000 * 60 * 60));
  if (hours >= 1) return `${hours} ore`;
  const minutes = Math.round(diff / (1000 * 60));
  return `${minutes} minuti`;
};

export default function Archivio() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const confirm = useConfirm();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<any>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newTags, setNewTags] = useState<{name: string, color: string}[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [selectedTagColor, setSelectedTagColor] = useState("#3b82f6");
  
  const TAG_COLORS = [
    { name: "Blu", value: "#3b82f6" },
    { name: "Verde", value: "#22c55e" },
    { name: "Rosso", value: "#ef4444" },
    { name: "Giallo", value: "#eab308" },
    { name: "Viola", value: "#a855f7" },
    { name: "Rosa", value: "#ec4899" },
    { name: "Arancione", value: "#f97316" },
    { name: "Ciano", value: "#06b6d4" },
    { name: "Grigio", value: "#6b7280" },
    { name: "Indaco", value: "#6366f1" },
  ];
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list" | "folders">("list");
  const [openFolder, setOpenFolder] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"name" | "date" | "size" | "category">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [showTrash, setShowTrash] = useState(false);
  const [showStarred, setShowStarred] = useState(false);
  const [showShared, setShowShared] = useState(false);
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [editingTitle, setEditingTitle] = useState<string | null>(null);
  const [editTitleValue, setEditTitleValue] = useState("");
  const [notesDialogOpen, setNotesDialogOpen] = useState(false);
  const [notesDoc, setNotesDoc] = useState<any>(null);
  const [notesValue, setNotesValue] = useState("");
  const [tagsDialogOpen, setTagsDialogOpen] = useState(false);
  const [tagsDoc, setTagsDoc] = useState<any>(null);
  const [editTags, setEditTags] = useState<string[]>([]);
  const [editTagInput, setEditTagInput] = useState("");
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareDoc, setShareDoc] = useState<any>(null);
  const [shareLink, setShareLink] = useState("");
  const [shareExpiry, setShareExpiry] = useState("");
  const [shareEmail, setShareEmail] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);
  const [shareDialogCountdown, setShareDialogCountdown] = useState(5);
  const [shareDialogClosing, setShareDialogClosing] = useState(false);
  const shareDialogTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [aiPanelClosing, setAiPanelClosing] = useState(false);
  const [sharedGridOpen, setSharedGridOpen] = useState(false);
  const [sharedGridClosing, setSharedGridClosing] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteCountdown, setDeleteCountdown] = useState(5);
  const [deleteDocId, setDeleteDocId] = useState<string | null>(null);
  const deleteTimerRef = useRef<NodeJS.Timeout | null>(null);

  const openDeleteConfirm = (docId: string) => {
    setDeleteDocId(docId);
    setDeleteCountdown(5);
    setDeleteConfirmOpen(true);
    
    if (deleteTimerRef.current) {
      clearInterval(deleteTimerRef.current);
    }
    
    deleteTimerRef.current = setInterval(() => {
      setDeleteCountdown(prev => {
        if (prev <= 1) {
          clearInterval(deleteTimerRef.current!);
          setDeleteConfirmOpen(false);
          setDeleteDocId(null);
          return 5;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const confirmDelete = () => {
    if (deleteTimerRef.current) {
      clearInterval(deleteTimerRef.current);
    }
    if (deleteDocId) {
      softDeleteMutation.mutate(deleteDocId);
    }
    setDeleteConfirmOpen(false);
    setDeleteDocId(null);
    setDeleteCountdown(5);
  };

  const cancelDelete = () => {
    if (deleteTimerRef.current) {
      clearInterval(deleteTimerRef.current);
    }
    setDeleteConfirmOpen(false);
    setDeleteDocId(null);
    setDeleteCountdown(5);
  };
  
  const closeAiPanel = () => {
    setAiPanelClosing(true);
    setTimeout(() => {
      setAiPanelOpen(false);
      setAiPanelClosing(false);
    }, 200);
  };

  const closeSharedGrid = () => {
    setSharedGridClosing(true);
    setTimeout(() => {
      setSharedGridOpen(false);
      setSharedGridClosing(false);
    }, 200);
  };

  const [sharedCountdown, setSharedCountdown] = useState(0);
  useEffect(() => {
    if (sharedGridOpen) {
      const interval = setInterval(() => {
        setSharedCountdown(prev => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [sharedGridOpen]);

  const [confirmUnshareId, setConfirmUnshareId] = useState<string | null>(null);
  const [confirmUnshareTimeout, setConfirmUnshareTimeout] = useState<number>(8);
  
  useEffect(() => {
    if (confirmUnshareId) {
      setConfirmUnshareTimeout(8);
      const interval = setInterval(() => {
        setConfirmUnshareTimeout(prev => {
          if (prev <= 1) {
            setConfirmUnshareId(null);
            return 8;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [confirmUnshareId]);

  useEffect(() => {
    if (shareDialogOpen && !shareLink && !shareExpiry) {
      setShareDialogCountdown(5);
      setShareDialogClosing(false);
      
      shareDialogTimerRef.current = setInterval(() => {
        setShareDialogCountdown((prev) => {
          if (prev <= 1) {
            if (shareDialogTimerRef.current) {
              clearInterval(shareDialogTimerRef.current);
            }
            setShareDialogClosing(true);
            setTimeout(() => {
              setShareDialogOpen(false);
              setShareDialogClosing(false);
            }, 300);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (shareExpiry) {
      if (shareDialogTimerRef.current) {
        clearInterval(shareDialogTimerRef.current);
      }
    }
    
    return () => {
      if (shareDialogTimerRef.current) {
        clearInterval(shareDialogTimerRef.current);
      }
    };
  }, [shareDialogOpen, shareExpiry, shareLink]);

  const [aiSummaryContent, setAiSummaryContent] = useState<string>("");
  const [aiSummaryDoc, setAiSummaryDoc] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ["archive", filterCategory, showTrash, user?.id],
    queryFn: () => archiveApi.getAll(filterCategory === "all" ? undefined : filterCategory, showTrash, user?.id),
    enabled: !!user?.id,
  });

  const createMutation = useMutation({
    mutationFn: archiveApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["archive"] });
      setUploadDialogOpen(false);
      setNewTitle("");
      setNewCategory("");
      setNewTags([]);
      setTagInput("");
      setSelectedFile(null);
    },
  });

  const shareMutation = useMutation({
    mutationFn: ({ id, expiresIn }: { id: string; expiresIn: number }) => 
      archiveApi.generateShareLink(id, expiresIn),
    onSuccess: (data) => {
      const baseUrl = window.location.origin;
      setShareLink(`${baseUrl}${data.shareUrl}`);
    },
  });

  const { data: sharedDocuments = [], refetch: refetchShared } = useQuery({
    queryKey: ["archive-shared", user?.id],
    queryFn: () => archiveApi.getSharedDocuments(user?.id),
    enabled: sharedGridOpen && !!user?.id,
    refetchInterval: sharedGridOpen ? 10000 : false,
  });

  const unshareMutation = useMutation({
    mutationFn: archiveApi.unshare,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["archive-shared"] });
      queryClient.invalidateQueries({ queryKey: ["archive"] });
      toast({ title: "Condivisione bloccata" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: archiveApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["archive"] });
      setPreviewDoc(null);
    },
  });

  const softDeleteMutation = useMutation({
    mutationFn: archiveApi.softDelete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["archive"] });
      setPreviewDoc(null);
      setSelectedDocs([]);
      toast({
        title: "Documento spostato nel cestino",
        description: "Puoi ripristinarlo dalla sezione Cestino",
        duration: 3000,
      });
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: "Impossibile spostare il documento nel cestino",
        variant: "destructive",
      });
    },
  });

  const restoreMutation = useMutation({
    mutationFn: archiveApi.restore,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["archive"] });
    },
  });

  const toggleStarMutation = useMutation({
    mutationFn: archiveApi.toggleStar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["archive"] });
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: archiveApi.duplicate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["archive"] });
    },
  });

  const bulkSoftDeleteMutation = useMutation({
    mutationFn: archiveApi.bulkSoftDelete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["archive"] });
      setSelectedDocs([]);
      setPreviewDoc(null);
    },
  });

  const bulkRestoreMutation = useMutation({
    mutationFn: archiveApi.bulkRestore,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["archive"] });
      setSelectedDocs([]);
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: archiveApi.bulkDelete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["archive"] });
      setSelectedDocs([]);
      setPreviewDoc(null);
    },
  });

  const summarizeMutation = useMutation({
    mutationFn: archiveApi.summarize,
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: ["archive"] });
      if (previewDoc?.id === id) {
        setPreviewDoc({ ...previewDoc, aiSummary: data.summary });
        setAiSummaryDoc({ ...previewDoc, aiSummary: data.summary });
        setAiSummaryContent(data.summary);
        setAiPanelOpen(true);
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => archiveApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["archive"] });
      setEditingTitle(null);
      setNotesDialogOpen(false);
    },
  });

  // Filter and sort documents
  const processedDocs = documents
    .filter((doc: any) => {
      // Filter by trash/active
      if (showTrash) {
        if (!doc.deletedAt) return false;
      } else {
        if (doc.deletedAt) return false;
      }
      // Filter by starred
      if (showStarred && !doc.starred) return false;
      // Filter by shared
      if (showShared) {
        const shareStatus = getShareTimeRemaining(doc.shareExpiresAt);
        if (!shareStatus.isActive) return false;
      }
      // Filter by search
      const matchesSearch = !searchQuery || 
        doc.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.fileName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.tags?.some((t: string) => t.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesSearch;
    })
    .sort((a: any, b: any) => {
      let comparison = 0;
      switch (sortBy) {
        case "name":
          comparison = (a.fileName || "").localeCompare(b.fileName || "");
          break;
        case "date":
          comparison = new Date(a.archivedAt || 0).getTime() - new Date(b.archivedAt || 0).getTime();
          break;
        case "size":
          comparison = (a.fileSize || 0) - (b.fileSize || 0);
          break;
        case "category":
          comparison = (a.category || "").localeCompare(b.category || "");
          break;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

  const filteredDocs = processedDocs;

  const toggleDocSelection = (docId: string) => {
    setSelectedDocs(prev => 
      prev.includes(docId) 
        ? prev.filter(id => id !== docId) 
        : [...prev, docId]
    );
  };

  const selectAllDocs = () => {
    if (selectedDocs.length === filteredDocs.length) {
      setSelectedDocs([]);
    } else {
      setSelectedDocs(filteredDocs.map((d: any) => d.id));
    }
  };

  const handleBulkDelete = async () => {
    const confirmed = await confirm({
      title: "Elimina Documenti Selezionati",
      description: `Sei sicuro di voler spostare ${selectedDocs.length} documenti nel cestino?`,
      confirmText: "Elimina",
      cancelText: "Annulla",
      variant: "destructive"
    });
    if (confirmed) {
      bulkSoftDeleteMutation.mutate(selectedDocs);
    }
  };

  const handleBulkRestore = async () => {
    bulkRestoreMutation.mutate(selectedDocs);
  };

  const handleBulkPermanentDelete = async () => {
    const confirmed = await confirm({
      title: "Elimina Definitivamente",
      description: `Sei sicuro di voler eliminare definitivamente ${selectedDocs.length} documenti? Questa azione non può essere annullata.`,
      confirmText: "Elimina Definitivamente",
      cancelText: "Annulla",
      variant: "destructive"
    });
    if (confirmed) {
      bulkDeleteMutation.mutate(selectedDocs);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !newTitle || !newCategory) return;
    
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('title', newTitle);
    formData.append('category', newCategory);
    if (user?.id) {
      formData.append('uploadedBy', user.id);
    }
    if (newTags.length > 0) {
      formData.append('tags', JSON.stringify(newTags));
    }
    
    setIsUploading(true);
    setUploadProgress(0);
    
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/archive', true);
    
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        setUploadProgress(percent);
      }
    };
    
    xhr.onload = () => {
      setIsUploading(false);
      if (xhr.status >= 200 && xhr.status < 300) {
        queryClient.invalidateQueries({ queryKey: ["archive"] });
        setUploadDialogOpen(false);
        setNewTitle("");
        setNewCategory("");
        setNewTags([]);
        setTagInput("");
        setSelectedFile(null);
        setUploadProgress(0);
        toast({
          title: "Documento caricato",
          description: "Il documento è stato caricato con successo.",
        });
      } else {
        try {
          const response = JSON.parse(xhr.responseText);
          toast({
            title: "Errore caricamento",
            description: response.error || response.message || "Errore durante il caricamento del file.",
            variant: "destructive",
          });
        } catch {
          toast({
            title: "Errore caricamento",
            description: "Errore durante il caricamento del file.",
            variant: "destructive",
          });
        }
        setUploadProgress(0);
      }
    };
    
    xhr.onerror = () => {
      setIsUploading(false);
      setUploadProgress(0);
      toast({
        title: "Errore di rete",
        description: "Impossibile connettersi al server. Riprova più tardi.",
        variant: "destructive",
      });
    };
    
    xhr.send(formData);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!newTitle) {
        setNewTitle(file.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  return (
    <AppLayout>
      <div className="h-full flex flex-col bg-gradient-to-br from-[#f5f0e6] via-[#e8dcc8] to-[#ddd0b8] dark:from-[#2d3748] dark:via-[#374151] dark:to-[#3d4555]">
        <div className="h-32 w-full flex-shrink-0 bg-gradient-to-r from-[#4a5568] via-[#5a6a7d] to-[#6b7a8f]" />
        
        <div className="relative -mt-20 px-8 pb-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 bg-card rounded-xl flex items-center justify-center shadow-md">
              <Archive className="h-8 w-8 text-amber-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white drop-shadow-md">Archivio Documenti</h1>
              <p className="text-white/80">Gestisci e archivia i tuoi documenti</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between px-8 pb-4">
          <div></div>
          
          <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Carica Documento
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Carica Nuovo Documento</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="file">File</Label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    id="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif"
                    onChange={handleFileChange}
                  />
                  <div 
                    className={`mt-2 border-2 rounded-lg p-6 text-center cursor-pointer transition-all duration-300 ${
                      selectedFile 
                        ? 'border-amber-400 bg-amber-50 dark:bg-amber-950/40 scale-[1.02] shadow-lg shadow-amber-200 dark:shadow-amber-900/30 animate-pulse-border' 
                        : 'border-dashed hover:border-primary hover:bg-muted/50'
                    }`}
                    style={selectedFile ? {
                      animation: 'pulse-border 2s ease-in-out infinite',
                      boxShadow: '0 0 0 0 rgba(251, 191, 36, 0.4)'
                    } : {}}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <style>{`
                      @keyframes pulse-border {
                        0%, 100% { box-shadow: 0 0 0 0 rgba(251, 191, 36, 0.4); }
                        50% { box-shadow: 0 0 0 4px rgba(251, 191, 36, 0.2); }
                      }
                    `}</style>
                    {selectedFile ? (
                      <div className="flex items-center justify-center gap-2 animate-in fade-in zoom-in duration-300">
                        <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                          <FileText className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div className="text-left">
                          <span className="text-sm font-medium block">{selectedFile.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {(selectedFile.size / 1024).toFixed(1)} KB
                          </span>
                        </div>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          className="ml-2 hover:bg-red-100 hover:text-red-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedFile(null);
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="py-2">
                        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-muted flex items-center justify-center">
                          <Upload className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Clicca per selezionare un file
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          PDF, DOC, DOCX, XLS, XLSX, PNG, JPG (max 10MB)
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="title">Titolo</Label>
                  <Input
                    id="title"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Nome del documento"
                  />
                </div>
                
                <div>
                  <Label>Categoria</Label>
                  <Select value={newCategory} onValueChange={setNewCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {ARCHIVE_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Tag (opzionale)</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      className="flex-1"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      placeholder="Aggiungi tag..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && tagInput.trim()) {
                          e.preventDefault();
                          if (!newTags.some(t => t.name === tagInput.trim())) {
                            setNewTags([...newTags, { name: tagInput.trim(), color: selectedTagColor }]);
                          }
                          setTagInput("");
                        }
                      }}
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="icon"
                      className="h-10 w-10 shrink-0"
                      onClick={() => {
                        if (tagInput.trim() && !newTags.some(t => t.name === tagInput.trim())) {
                          setNewTags([...newTags, { name: tagInput.trim(), color: selectedTagColor }]);
                          setTagInput("");
                        }
                      }}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex gap-1 flex-wrap mt-2">
                    <span className="text-xs text-muted-foreground mr-1">Colore:</span>
                    {TAG_COLORS.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        className={`w-5 h-5 rounded-full border-2 transition-all ${
                          selectedTagColor === color.value 
                            ? 'border-foreground scale-110' 
                            : 'border-transparent hover:scale-105'
                        }`}
                        style={{ backgroundColor: color.value }}
                        onClick={() => setSelectedTagColor(color.value)}
                        title={color.name}
                      />
                    ))}
                  </div>
                  {newTags.length > 0 && (
                    <div className="flex gap-1 flex-wrap mt-2">
                      {newTags.map((tag) => (
                        <span 
                          key={tag.name} 
                          className="text-xs px-2 py-1 rounded flex items-center gap-1 font-bold text-white"
                          style={{ backgroundColor: tag.color }}
                        >
                          {tag.name}
                          <button onClick={() => setNewTags(newTags.filter(t => t.name !== tag.name))}>
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                
                {isUploading && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Caricamento in corso...</span>
                      <span className="font-medium text-primary">{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-300 ease-out"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
                
                <Button 
                  className="w-full" 
                  onClick={handleUpload}
                  disabled={!selectedFile || !newTitle || !newCategory || isUploading}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Caricamento... {uploadProgress}%
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Carica
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        
        <div className="flex items-center gap-2 p-4 border-b flex-wrap">
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cerca..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          
          <div className="flex border rounded-md overflow-hidden shrink-0">
            <Button
              variant={!showTrash && !showStarred && !showShared ? "secondary" : "ghost"}
              size="sm"
              onClick={() => { setShowTrash(false); setShowStarred(false); setShowShared(false); }}
              className="rounded-none h-9 px-2"
            >
              <Archive className="h-4 w-4" />
            </Button>
            <Button
              variant={showStarred ? "secondary" : "ghost"}
              size="sm"
              onClick={() => { setShowStarred(!showStarred); setShowTrash(false); setShowShared(false); }}
              className="rounded-none h-9 px-2"
            >
              <Star className="h-4 w-4" />
            </Button>
            <Button
              variant={showShared ? "secondary" : "ghost"}
              size="sm"
              onClick={() => { setShowShared(!showShared); setShowTrash(false); setShowStarred(false); }}
              className="rounded-none h-9 px-2"
              title="File condivisi"
            >
              <Link className="h-4 w-4" />
            </Button>
            <Button
              variant={showTrash ? "secondary" : "ghost"}
              size="sm"
              onClick={() => { setShowTrash(!showTrash); setShowStarred(false); setShowShared(false); }}
              className="rounded-none h-9 px-2"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setSharedGridOpen(true)}
            className="h-9 gap-2 shrink-0"
            title="Gestione condivisioni"
          >
            <Globe className="h-4 w-4" />
            Condivisioni
          </Button>

          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-32 h-9 shrink-0">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutte</SelectItem>
              {ARCHIVE_CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
            <SelectTrigger className="w-28 h-9 shrink-0">
              <ArrowUpDown className="h-3 w-3 mr-1" />
              <SelectValue placeholder="Ordina" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Data</SelectItem>
              <SelectItem value="name">Nome</SelectItem>
              <SelectItem value="size">Dimensione</SelectItem>
              <SelectItem value="category">Categoria</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            title={sortOrder === "asc" ? "Crescente" : "Decrescente"}
          >
            {sortOrder === "asc" ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
          </Button>

          <div className="flex border rounded-md overflow-hidden shrink-0">
            <Button
              variant={viewMode === "folders" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => { setViewMode("folders"); setOpenFolder(null); }}
              className="rounded-none h-9 px-2"
              title="Vista cartelle"
            >
              <Folder className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="rounded-none h-9 px-2"
              title="Vista griglia"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="rounded-none h-9 px-2"
              title="Vista lista"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {selectedDocs.length > 0 && (
          <div className="mx-8 mb-4 px-4 py-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Checkbox 
                checked={selectedDocs.length === filteredDocs.length && filteredDocs.length > 0}
                onCheckedChange={selectAllDocs}
              />
              <span className="font-medium text-amber-800 dark:text-amber-200">
                {selectedDocs.length} documento{selectedDocs.length > 1 ? 'i' : ''} selezionato{selectedDocs.length > 1 ? 'i' : ''}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {showTrash ? (
                <>
                  <Button size="sm" variant="outline" onClick={handleBulkRestore} disabled={bulkRestoreMutation.isPending}>
                    <RotateCcw className="h-4 w-4 mr-1" />
                    Ripristina
                  </Button>
                  <Button size="sm" variant="destructive" onClick={handleBulkPermanentDelete} disabled={bulkDeleteMutation.isPending}>
                    <Trash2 className="h-4 w-4 mr-1" />
                    Elimina Definitivamente
                  </Button>
                </>
              ) : (
                <Button size="sm" variant="destructive" onClick={handleBulkDelete} disabled={bulkSoftDeleteMutation.isPending}>
                  <Trash2 className="h-4 w-4 mr-1" />
                  Sposta nel Cestino
                </Button>
              )}
              <Button size="sm" variant="ghost" onClick={() => setSelectedDocs([])}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
        
        <div className="flex-1 overflow-hidden flex">
          <ScrollArea className="flex-1 p-5">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredDocs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                <Archive className="h-12 w-12 mb-4 opacity-50" />
                <p>Nessun documento nell'archivio</p>
                <p className="text-sm mt-1">Carica il primo documento per iniziare</p>
              </div>
            ) : viewMode === "folders" ? (
              (() => {
                const groupedByCategory = filteredDocs.reduce((acc: Record<string, any[]>, doc: any) => {
                  const cat = doc.category || "Altro";
                  if (!acc[cat]) acc[cat] = [];
                  acc[cat].push(doc);
                  return acc;
                }, {});
                
                if (openFolder) {
                  const folderDocs = groupedByCategory[openFolder] || [];
                  return (
                    <div>
                      <Button 
                        variant="ghost" 
                        className="mb-4"
                        onClick={() => setOpenFolder(null)}
                      >
                        <ChevronLeft className="h-4 w-4 mr-2" />
                        Torna alle cartelle
                      </Button>
                      <div className="flex items-center gap-3 mb-4 p-3 bg-muted rounded-lg">
                        <FolderOpen className={`h-8 w-8 ${categoryColors[openFolder]?.replace('bg-', 'text-') || 'text-gray-500'}`} />
                        <div>
                          <h2 className="font-semibold">{openFolder}</h2>
                          <p className="text-sm text-muted-foreground">{folderDocs.length} documenti</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                        {folderDocs.map((doc: any) => (
                          <Card 
                            key={doc.id} 
                            className={`cursor-pointer hover:shadow-md transition-shadow ${previewDoc?.id === doc.id ? 'selected-gradient' : ''} ${selectedDocs.includes(doc.id) ? 'selected-gradient' : ''}`}
                            onClick={() => setPreviewDoc(doc)}
                          >
                            <CardHeader className="p-3 pb-1">
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <div onClick={(e) => e.stopPropagation()}>
                                    <Checkbox 
                                      checked={selectedDocs.includes(doc.id)}
                                      onCheckedChange={() => toggleDocSelection(doc.id)}
                                      className="data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
                                    />
                                  </div>
                                  {getFileIcon(doc.fileType, "md")}
                                  <h3 className={`font-medium truncate ${previewDoc?.id === doc.id || selectedDocs.includes(doc.id) ? 'text-black' : 'dark:text-white'}`} title={doc.fileName}>
                                    {doc.fileName}
                                  </h3>
                                </div>
                                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                  <button
                                    className="p-1 hover:bg-muted rounded"
                                    onClick={() => toggleStarMutation.mutate(doc.id)}
                                    title={doc.starred ? "Rimuovi dai preferiti" : "Aggiungi ai preferiti"}
                                  >
                                    {doc.starred ? <Star className="h-4 w-4 text-amber-500 fill-amber-500" /> : <StarOff className="h-4 w-4 text-muted-foreground" />}
                                  </button>
                                </div>
                              </div>
                              <Badge className={`${categoryColors[doc.category]} text-white text-xs w-fit mt-1`}>
                                {doc.category}
                              </Badge>
                            </CardHeader>
                            <CardContent className="p-4 pt-2">
                              {doc.title && doc.title !== doc.fileName && (
                                <p className="text-sm text-muted-foreground truncate mb-2" title={doc.title}>
                                  {doc.title}
                                </p>
                              )}
                              <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <User className="h-3 w-3 flex-shrink-0" />
                                  <span className="font-medium">Caricato da:</span>
                                  <span className="truncate">{doc.uploaderName || 'Sconosciuto'}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3 flex-shrink-0" />
                                  <span className="truncate">{(doc.archivedAt || doc.createdAt) && format(new Date(doc.archivedAt || doc.createdAt), "dd/MM/yyyy HH:mm", { locale: it })}</span>
                                </div>
                                {doc.updaterName && doc.updatedAt && (
                                  <div className="flex items-center gap-1">
                                    <Edit2 className="h-3 w-3 flex-shrink-0" />
                                    <span className="font-medium">Modificato da:</span>
                                    <span className="truncate">{doc.updaterName} • {format(new Date(doc.updatedAt), "dd/MM/yyyy HH:mm", { locale: it })}</span>
                                  </div>
                                )}
                                <div className="flex items-center gap-1">
                                  <HardDrive className="h-3 w-3 flex-shrink-0" />
                                  {formatFileSize(doc.fileSize)}
                                </div>
                              </div>
                              {doc.notes && (
                                <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                                  <MessageSquare className="h-3 w-3" />
                                  <span className="truncate">{doc.notes}</span>
                                </div>
                              )}
                              {doc.tags && doc.tags.length > 0 && (
                                <div className="flex gap-1 mt-2 flex-wrap">
                                  {doc.tags.slice(0, 3).map((tag: string | {name: string, color: string}) => {
                                    const tagName = typeof tag === 'string' ? tag : tag.name;
                                    const tagColor = typeof tag === 'string' ? undefined : tag.color;
                                    return (
                                      <span 
                                        key={tagName} 
                                        className={`text-xs px-1.5 py-0.5 rounded font-bold ${tagColor ? 'text-white' : 'bg-muted'}`}
                                        style={tagColor ? { backgroundColor: tagColor } : undefined}
                                      >
                                        {tagName}
                                      </span>
                                    );
                                  })}
                                  {doc.tags.length > 3 && <span className="text-xs text-muted-foreground">+{doc.tags.length - 3}</span>}
                                </div>
                              )}
                              {(() => {
                                const shareStatus = getShareTimeRemaining(doc.shareExpiresAt);
                                if (shareStatus.isActive) {
                                  return (
                                    <div className="flex items-center gap-1.5 mt-2 text-xs">
                                      <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                      </span>
                                      <span className="text-red-600 dark:text-red-400 font-medium">
                                        Condiviso • {shareStatus.text}
                                        {doc.downloadCount > 0 && ` • ${doc.downloadCount} download`}
                                      </span>
                                    </div>
                                  );
                                }
                                return null;
                              })()}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  );
                }
                
                return (
                  <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}>
                    {Object.entries(groupedByCategory).map(([category, docs]: [string, any[]]) => (
                      <Card 
                        key={category}
                        className="cursor-pointer hover:shadow-lg transition-all hover:scale-[1.02] group"
                        onClick={() => setOpenFolder(category)}
                      >
                        <CardContent className="p-4 text-center">
                          <div className={`w-14 h-14 mx-auto mb-3 rounded-xl flex items-center justify-center ${categoryColors[category] || 'bg-gray-500'} bg-opacity-20 group-hover:bg-opacity-30 transition-colors`}>
                            <Folder className={`h-8 w-8 ${categoryColors[category]?.replace('bg-', 'text-') || 'text-gray-500'}`} />
                          </div>
                          <h3 className="font-semibold text-sm mb-1 truncate" title={category}>{category}</h3>
                          <p className="text-xs text-muted-foreground">
                            {docs.length} {docs.length === 1 ? 'documento' : 'documenti'}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                );
              })()
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                {filteredDocs.map((doc: any) => (
                  <Card 
                    key={doc.id} 
                    className={`cursor-pointer hover:shadow-md transition-shadow ${previewDoc?.id === doc.id ? 'selected-gradient' : ''} ${selectedDocs.includes(doc.id) ? 'selected-gradient' : ''}`}
                    onClick={() => setPreviewDoc(doc)}
                  >
                    <CardHeader className="p-3 pb-1">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div onClick={(e) => e.stopPropagation()}>
                            <Checkbox 
                              checked={selectedDocs.includes(doc.id)}
                              onCheckedChange={() => toggleDocSelection(doc.id)}
                              className="data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
                            />
                          </div>
                          {getFileIcon(doc.fileType, "md")}
                          <h3 className={`font-medium truncate ${previewDoc?.id === doc.id || selectedDocs.includes(doc.id) ? 'text-black' : 'dark:text-white'}`} title={doc.fileName}>
                            {doc.fileName}
                          </h3>
                        </div>
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            className="p-1 hover:bg-muted rounded"
                            onClick={() => toggleStarMutation.mutate(doc.id)}
                            title={doc.starred ? "Rimuovi dai preferiti" : "Aggiungi ai preferiti"}
                          >
                            {doc.starred ? <Star className="h-4 w-4 text-amber-500 fill-amber-500" /> : <StarOff className="h-4 w-4 text-muted-foreground" />}
                          </button>
                        </div>
                      </div>
                      <Badge className={`${categoryColors[doc.category]} text-white text-xs w-fit mt-1`}>
                        {doc.category}
                      </Badge>
                    </CardHeader>
                    <CardContent className="p-4 pt-2">
                      {doc.title && doc.title !== doc.fileName && (
                        <p className="text-sm text-muted-foreground truncate mb-2" title={doc.title}>
                          {doc.title}
                        </p>
                      )}
                      <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3 flex-shrink-0" />
                          <span className="font-medium">Caricato da:</span>
                          <span className="truncate">{doc.uploaderName || 'Sconosciuto'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{(doc.archivedAt || doc.createdAt) && format(new Date(doc.archivedAt || doc.createdAt), "dd/MM/yyyy HH:mm", { locale: it })}</span>
                        </div>
                        {doc.updaterName && doc.updatedAt && (
                          <div className="flex items-center gap-1">
                            <Edit2 className="h-3 w-3 flex-shrink-0" />
                            <span className="font-medium">Modificato da:</span>
                            <span className="truncate">{doc.updaterName} • {format(new Date(doc.updatedAt), "dd/MM/yyyy HH:mm", { locale: it })}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <HardDrive className="h-3 w-3 flex-shrink-0" />
                          {formatFileSize(doc.fileSize)}
                        </div>
                      </div>
                      {doc.notes && (
                        <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                          <MessageSquare className="h-3 w-3" />
                          <span className="truncate">{doc.notes}</span>
                        </div>
                      )}
                      {doc.tags && doc.tags.length > 0 && (
                        <div className="flex gap-1 mt-2 flex-wrap">
                          {doc.tags.slice(0, 3).map((tag: string | {name: string, color: string}) => {
                            const tagName = typeof tag === 'string' ? tag : tag.name;
                            const tagColor = typeof tag === 'string' ? undefined : tag.color;
                            return (
                              <span 
                                key={tagName} 
                                className={`text-xs px-1.5 py-0.5 rounded font-bold ${tagColor ? 'text-white' : 'bg-muted'}`}
                                style={tagColor ? { backgroundColor: tagColor } : undefined}
                              >
                                {tagName}
                              </span>
                            );
                          })}
                          {doc.tags.length > 3 && <span className="text-xs text-muted-foreground">+{doc.tags.length - 3}</span>}
                        </div>
                      )}
                      {(() => {
                        const shareStatus = getShareTimeRemaining(doc.shareExpiresAt);
                        if (shareStatus.isActive) {
                          return (
                            <div className="flex items-center gap-1.5 mt-2 text-xs">
                              <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                              </span>
                              <span className="text-red-600 dark:text-red-400 font-medium">
                                Condiviso • {shareStatus.text}
                                {doc.downloadCount > 0 && ` • ${doc.downloadCount} download`}
                              </span>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredDocs.map((doc: any) => (
                  <div 
                    key={doc.id} 
                    className={`flex items-center gap-4 p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors ${previewDoc?.id === doc.id ? 'selected-gradient' : ''} ${selectedDocs.includes(doc.id) ? 'selected-gradient' : ''}`}
                    onClick={() => setPreviewDoc(doc)}
                  >
                    <div onClick={(e) => e.stopPropagation()}>
                      <Checkbox 
                        checked={selectedDocs.includes(doc.id)}
                        onCheckedChange={() => toggleDocSelection(doc.id)}
                        className="data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
                      />
                    </div>
                    <button
                      className="p-1 hover:bg-muted rounded flex-shrink-0"
                      onClick={(e) => { e.stopPropagation(); toggleStarMutation.mutate(doc.id); }}
                      title={doc.starred ? "Rimuovi dai preferiti" : "Aggiungi ai preferiti"}
                    >
                      {doc.starred ? <Star className="h-4 w-4 text-amber-500 fill-amber-500" /> : <StarOff className="h-4 w-4 text-muted-foreground" />}
                    </button>
                    {getFileIcon(doc.fileType, "md")}
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-medium truncate ${previewDoc?.id === doc.id || selectedDocs.includes(doc.id) ? 'text-black' : 'dark:text-white'}`} title={doc.fileName}>
                        {doc.fileName}
                      </h3>
                      {doc.title && doc.title !== doc.fileName && (
                        <p className="text-xs text-muted-foreground truncate" title={doc.title}>
                          {doc.title}
                        </p>
                      )}
                    </div>
                    {doc.tags && doc.tags.length > 0 && (
                      <div className="flex gap-1 flex-shrink-0">
                        {doc.tags.slice(0, 2).map((tag: string | {name: string, color: string}) => {
                          const tagName = typeof tag === 'string' ? tag : tag.name;
                          const tagColor = typeof tag === 'string' ? undefined : tag.color;
                          return (
                            <span 
                              key={tagName} 
                              className={`text-xs px-1.5 py-0.5 rounded font-bold ${tagColor ? 'text-white' : 'bg-muted'}`}
                              style={tagColor ? { backgroundColor: tagColor } : undefined}
                            >
                              {tagName}
                            </span>
                          );
                        })}
                      </div>
                    )}
                    <Badge className={`${categoryColors[doc.category]} text-white text-xs flex-shrink-0`}>
                      {doc.category}
                    </Badge>
                    {(() => {
                      const shareStatus = getShareTimeRemaining(doc.shareExpiresAt);
                      if (shareStatus.isActive) {
                        return (
                          <div className="flex items-center gap-1.5 text-xs flex-shrink-0">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                            </span>
                            <span className="text-red-600 dark:text-red-400 font-medium">
                              {shareStatus.text}{doc.downloadCount > 0 && ` • ${doc.downloadCount}`}
                            </span>
                          </div>
                        );
                      }
                      return null;
                    })()}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground flex-shrink-0">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span className="truncate max-w-[100px]" title={doc.uploaderName}>{doc.uploaderName || 'Sconosciuto'}</span>
                      </div>
                      {doc.updaterName && doc.updatedAt && (
                        <div className="flex items-center gap-1">
                          <Edit2 className="h-3 w-3" />
                          <span className="truncate max-w-[150px]" title={`Modificato da: ${doc.updaterName}`}>{doc.updaterName} • {format(new Date(doc.updatedAt), "dd/MM HH:mm", { locale: it })}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {(doc.archivedAt || doc.createdAt) && format(new Date(doc.archivedAt || doc.createdAt), "dd/MM/yyyy HH:mm", { locale: it })}
                      </div>
                      <div className="flex items-center gap-1 w-20">
                        <HardDrive className="h-3 w-3" />
                        {formatFileSize(doc.fileSize)}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                      {showTrash ? (
                        <Button size="sm" variant="ghost" onClick={() => restoreMutation.mutate(doc.id)} title="Ripristina">
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      ) : (
                        <>
                          <Button size="sm" variant="ghost" onClick={() => duplicateMutation.mutate(doc.id)} title="Duplica">
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => softDeleteMutation.mutate(doc.id)} title="Elimina">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
          
          {/* Pannello Condivisioni */}
          {sharedGridOpen && (
            <div className={`w-[580px] min-w-[580px] max-w-[580px] border-l flex flex-col overflow-hidden bg-gradient-to-b from-blue-50/40 to-indigo-50/30 dark:from-blue-950/20 dark:to-indigo-950/10 transition-all duration-200 ${sharedGridClosing ? 'animate-out slide-out-to-right opacity-0' : 'animate-in slide-in-from-right'}`}>
              <div className="bg-slate-500 p-3 h-[52px] flex items-center">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2 text-white">
                    <Globe className="h-4 w-4" />
                    <span className="font-semibold text-sm">Gestione Condivisioni</span>
                    <span className="text-white/70 text-xs">({sharedDocuments.length})</span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 w-7 p-0 text-white hover:bg-white/20"
                    onClick={closeSharedGrid}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <ScrollArea className="flex-1 p-4">
                {sharedDocuments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <Share2 className="h-12 w-12 mb-4 opacity-50" />
                    <p className="text-lg font-medium">Nessun file condiviso</p>
                    <p className="text-sm">I file condivisi appariranno qui</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sharedDocuments.map((doc: any) => {
                      const timeInfo = getShareTimeRemaining(doc.shareExpiresAt);
                      
                      return (
                        <div 
                          key={doc.id} 
                          className={`p-3 border-2 rounded-lg ${
                            timeInfo.isExpired 
                              ? 'bg-red-50 border-red-300' 
                              : doc.downloadCount > 0 
                                ? 'bg-gradient-to-br from-green-50/70 via-emerald-50/60 to-teal-50/50 border-green-300 shadow-md shadow-green-100/40 dark:from-green-950/30 dark:via-emerald-900/20 dark:to-teal-950/20 dark:border-green-600 dark:shadow-green-900/20' 
                                : 'bg-white/60 dark:bg-slate-900/60 border-transparent'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              {getFileIcon(doc.fileType, "sm")}
                              <p className="font-medium truncate text-sm">{doc.title || doc.fileName}</p>
                            </div>
                            {confirmUnshareId === doc.id ? (
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  className="h-7 text-xs"
                                  onClick={() => {
                                    unshareMutation.mutate(doc.id);
                                    setConfirmUnshareId(null);
                                  }}
                                  disabled={unshareMutation.isPending}
                                >
                                  Conferma ({confirmUnshareTimeout})
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7"
                                  onClick={() => setConfirmUnshareId(null)}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : (
                              <Button
                                variant="destructive"
                                size="sm"
                                className="h-7"
                                onClick={() => setConfirmUnshareId(doc.id)}
                                disabled={unshareMutation.isPending}
                                title="Blocca condivisione"
                              >
                                <Ban className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                          <div className="space-y-1.5 text-xs">
                            <div className="flex items-center">
                              <span className="text-muted-foreground w-40">Condiviso da:</span>
                              <span>{doc.uploaderName}</span>
                            </div>
                            <div className="flex items-center">
                              <span className="text-muted-foreground w-40">Data condivisione:</span>
                              <span>
                                {doc.shareCreatedAt 
                                  ? format(new Date(doc.shareCreatedAt), "dd/MM/yyyy HH:mm", { locale: it }) 
                                  : "-"}
                              </span>
                            </div>
                            <div className="flex items-center">
                              <span className="text-muted-foreground w-40">Tempo assegnato:</span>
                              <span>{getAssignedTime(doc.shareCreatedAt, doc.shareExpiresAt)}</span>
                            </div>
                            <div className="flex items-center">
                              <span className="text-muted-foreground w-40">Tempo rimasto:</span>
                              <span className={`tabular-nums ${timeInfo.isExpired ? 'text-red-600' : 'text-red-500'}`}>
                                {timeInfo.text || "-"}
                              </span>
                            </div>
                            <div className="flex items-center">
                              <span className="text-muted-foreground w-40">Dimensione:</span>
                              <span>{formatFileSize(doc.fileSize)}</span>
                            </div>
                            <div className="flex items-center">
                              <span className="text-muted-foreground w-40">Download:</span>
                              <span className={`${doc.downloadCount > 0 ? 'text-green-600' : ''}`}>
                                {doc.downloadCount > 0 ? `${doc.downloadCount} volte` : "Mai scaricato"}
                              </span>
                            </div>
                            <div className="flex items-center">
                              <span className="text-muted-foreground w-40">Ultimo IP:</span>
                              <span className="font-mono">{doc.lastDownloadIp || "-"}</span>
                            </div>
                            <div className="flex items-center">
                              <span className="text-muted-foreground w-40">Data/Ora download:</span>
                              <span>
                                {doc.lastDownloadAt 
                                  ? format(new Date(doc.lastDownloadAt), "dd/MM/yyyy HH:mm:ss", { locale: it }) 
                                  : "-"}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
              
              <div className="p-3 border-t bg-background/80">
                <Button 
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={closeSharedGrid}
                >
                  Chiudi
                </Button>
              </div>
            </div>
          )}

          {/* Pannello AI Riassunto - a sinistra del pannello proprietà */}
          {aiPanelOpen && (
            <div className={`w-[580px] min-w-[580px] max-w-[580px] border-l flex flex-col overflow-hidden bg-gradient-to-b from-amber-50/40 to-orange-50/30 dark:from-amber-950/20 dark:to-orange-950/10 transition-all duration-200 ${aiPanelClosing ? 'animate-out slide-out-to-left opacity-0' : 'animate-in slide-in-from-left'}`}>
              <div className="bg-gradient-to-r from-slate-600 to-slate-500 p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-white">
                    <Sparkles className="h-4 w-4" />
                    <span className="font-semibold text-sm">Riassunto AI</span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 w-7 p-0 text-white hover:bg-white/20"
                    onClick={closeAiPanel}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                {aiSummaryDoc && (
                  <p className="text-white/80 text-xs mt-1 truncate">
                    {aiSummaryDoc.title || aiSummaryDoc.fileName}
                  </p>
                )}
              </div>
              
              <ScrollArea className="flex-1 p-4">
                <div className="prose prose-sm dark:prose-invert max-w-none
                  prose-headings:text-slate-700 dark:prose-headings:text-slate-300
                  prose-headings:font-semibold prose-headings:mt-3 prose-headings:mb-1
                  prose-p:text-foreground prose-p:my-1.5 prose-p:text-sm
                  prose-li:text-foreground prose-li:text-sm
                  prose-ul:my-1.5 prose-ol:my-1.5
                  prose-strong:text-slate-600 dark:prose-strong:text-slate-400
                  prose-a:text-slate-600 dark:prose-a:text-slate-400">
                  <ReactMarkdown>{aiSummaryContent}</ReactMarkdown>
                </div>
              </ScrollArea>
              
              <div className="p-3 border-t bg-background/80">
                <div className="flex flex-col gap-2">
                  <Button 
                    size="sm"
                    className="w-full bg-gradient-to-r from-slate-600 to-slate-500 hover:from-slate-700 hover:to-slate-600"
                    onClick={() => {
                      if (aiSummaryDoc && aiSummaryContent) {
                        updateMutation.mutate({ id: aiSummaryDoc.id, data: { aiSummary: aiSummaryContent } }, {
                          onSuccess: () => {
                            toast({
                              title: "✨ Riassunto salvato",
                              description: "Il riassunto AI è stato salvato con successo",
                              duration: 2000,
                            });
                          }
                        });
                      }
                    }}
                    disabled={updateMutation.isPending}
                  >
                    {updateMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Save className="h-3 w-3 mr-1" />}
                    Salva riassunto
                  </Button>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        navigator.clipboard.writeText(aiSummaryContent);
                        toast({
                          title: "📋 Copiato",
                          description: "Il riassunto è stato copiato negli appunti",
                          duration: 2000,
                        });
                      }}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copia
                    </Button>
                    <Button 
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={closeAiPanel}
                    >
                      Chiudi
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {previewDoc && (
            <div className="w-72 min-w-72 max-w-72 border-l flex flex-col overflow-hidden">
              <div className="bg-slate-500 p-3 h-[52px] flex items-center">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2 text-white">
                    <Eye className="h-4 w-4" />
                    <span className="font-semibold text-sm">Anteprima</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 w-7 p-0 text-white hover:bg-white/20"
                      onClick={() => toggleStarMutation.mutate(previewDoc.id)}
                      title={previewDoc.starred ? "Rimuovi dai preferiti" : "Aggiungi ai preferiti"}
                    >
                      {previewDoc.starred ? <Star className="h-4 w-4 text-amber-300 fill-amber-300" /> : <StarOff className="h-4 w-4" />}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 w-7 p-0 text-white hover:bg-white/20"
                      onClick={() => setPreviewDoc(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {previewDoc.fileType === 'application/pdf' ? (
                    <div className="w-full bg-muted rounded-lg overflow-hidden">
                      <iframe 
                        src={`${previewDoc.filePath}#zoom=100`}
                        className="w-full h-[300px] border-0"
                        title={previewDoc.fileName}
                      />
                    </div>
                  ) : previewDoc.fileType?.startsWith('image/') ? (
                    <div className="w-full bg-muted rounded-lg overflow-hidden">
                      <img 
                        src={previewDoc.filePath} 
                        alt={previewDoc.fileName}
                        className="w-full h-auto max-h-[300px] object-contain"
                      />
                    </div>
                  ) : (
                    <div className="flex justify-center p-4 bg-muted rounded-lg">
                      <div className="text-center py-2">
                        {getFileIcon(previewDoc.fileType)}
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <Label className="text-muted-foreground text-xs">Titolo</Label>
                    {editingTitle === previewDoc.id ? (
                      <div className="flex items-center gap-2 mt-1">
                        <Input 
                          value={editTitleValue}
                          onChange={(e) => setEditTitleValue(e.target.value)}
                          className="h-8 text-sm"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && editTitleValue.trim()) {
                              updateMutation.mutate({ id: previewDoc.id, data: { title: editTitleValue.trim() } });
                              setPreviewDoc({ ...previewDoc, title: editTitleValue.trim() });
                            } else if (e.key === 'Escape') {
                              setEditingTitle(null);
                            }
                          }}
                          onBlur={() => {
                            if (editTitleValue.trim() && editTitleValue !== previewDoc.title) {
                              updateMutation.mutate({ id: previewDoc.id, data: { title: editTitleValue.trim() } });
                              setPreviewDoc({ ...previewDoc, title: editTitleValue.trim() });
                            }
                            setEditingTitle(null);
                          }}
                        />
                      </div>
                    ) : (
                      <p 
                        className="font-medium break-words cursor-pointer hover:bg-muted px-1 py-0.5 -mx-1 rounded transition-colors group"
                        onDoubleClick={() => {
                          setEditingTitle(previewDoc.id);
                          setEditTitleValue(previewDoc.title || "");
                        }}
                        title="Doppio click per rinominare"
                      >
                        {previewDoc.title}
                        <Edit2 className="h-3 w-3 inline ml-2 opacity-0 group-hover:opacity-50" />
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <Label className="text-muted-foreground text-xs">Nome File</Label>
                    <p className="text-sm break-all">{previewDoc.fileName}</p>
                  </div>
                  
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <Label className="text-muted-foreground text-xs">Categoria</Label>
                      <Badge className={`${categoryColors[previewDoc.category]} text-white mt-1`}>
                        {previewDoc.category}
                      </Badge>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs">Dimensione</Label>
                      <p className="text-sm">{formatFileSize(previewDoc.fileSize)}</p>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-muted-foreground text-xs">Data Caricamento</Label>
                    <p className="text-sm">
                      {(previewDoc.archivedAt || previewDoc.createdAt) && format(new Date(previewDoc.archivedAt || previewDoc.createdAt), "dd MMMM yyyy, HH:mm", { locale: it })}
                    </p>
                  </div>

                  {previewDoc.tags && previewDoc.tags.length > 0 && (
                    <div>
                      <Label className="text-muted-foreground text-xs">Tag</Label>
                      <div className="flex gap-1 flex-wrap mt-1">
                        {previewDoc.tags.map((tag: string | {name: string, color: string}) => {
                          const tagName = typeof tag === 'string' ? tag : tag.name;
                          const tagColor = typeof tag === 'string' ? undefined : tag.color;
                          return (
                            <span 
                              key={tagName} 
                              className={`text-xs px-2 py-1 rounded font-bold ${tagColor ? 'text-white' : 'bg-muted'}`}
                              style={tagColor ? { backgroundColor: tagColor } : undefined}
                            >
                              {tagName}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div>
                    <Label className="text-muted-foreground text-xs">Note</Label>
                    {previewDoc.notes ? (
                      <div className="mt-2 relative">
                        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg overflow-hidden shadow-sm">
                          <div className="bg-gradient-to-r from-amber-400 to-yellow-400 dark:from-amber-600 dark:to-yellow-600 h-6 flex items-center px-3">
                            <div className="flex gap-1">
                              <div className="w-2 h-2 rounded-full bg-red-500"></div>
                              <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                              <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            </div>
                            <span className="ml-3 text-xs font-medium text-amber-900 dark:text-amber-100">Note</span>
                          </div>
                          <div className="p-4 max-h-40 overflow-y-auto">
                            <div className="prose prose-sm dark:prose-invert max-w-none 
                              prose-headings:text-amber-800 dark:prose-headings:text-amber-200 
                              prose-headings:font-semibold prose-headings:mt-3 prose-headings:mb-2
                              prose-p:text-amber-900 dark:prose-p:text-amber-100 prose-p:my-1
                              prose-li:text-amber-900 dark:prose-li:text-amber-100
                              prose-ul:my-1 prose-ol:my-1
                              prose-strong:text-amber-800 dark:prose-strong:text-amber-200">
                              <ReactMarkdown>{previewDoc.notes}</ReactMarkdown>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground mt-1">Nessuna nota</p>
                    )}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="mt-2 h-7 text-xs"
                      onClick={() => {
                        setNotesDoc(previewDoc);
                        setNotesValue(previewDoc.notes || "");
                        setNotesDialogOpen(true);
                      }}
                    >
                      <Edit2 className="h-3 w-3 mr-1" />
                      {previewDoc.notes ? "Modifica nota" : "Aggiungi nota"}
                    </Button>
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <Label className="text-muted-foreground text-xs">Riassunto AI</Label>
                      {(previewDoc.fileType === 'application/pdf' || previewDoc.fileType?.startsWith('text/')) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-slate-600 hover:text-slate-700 hover:bg-slate-100"
                          onClick={() => summarizeMutation.mutate(previewDoc.id)}
                          disabled={summarizeMutation.isPending}
                          title="Genera riassunto AI"
                        >
                          {summarizeMutation.isPending ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Sparkles className="h-3 w-3" />
                          )}
                        </Button>
                      )}
                    </div>
                    {previewDoc.aiSummary ? (
                      <div className="mt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full justify-start gap-2 bg-slate-50 hover:bg-slate-100 border-slate-200 dark:bg-slate-900/30 dark:hover:bg-slate-800/50 dark:border-slate-700"
                          onClick={() => {
                            setAiSummaryDoc(previewDoc);
                            setAiSummaryContent(previewDoc.aiSummary || "");
                            setAiPanelOpen(true);
                          }}
                        >
                          <div className="flex items-center justify-center w-5 h-5 rounded-full bg-gradient-to-r from-slate-600 to-slate-500 animate-[pulse-soft_2s_ease-in-out_infinite]">
                            <Sparkles className="h-3 w-3 text-white" />
                          </div>
                          <span className="text-sm text-slate-700 dark:text-slate-300">Riassunto disponibile</span>
                          <Eye className="h-3 w-3 ml-auto text-slate-400" />
                        </Button>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground mt-1">Nessun riassunto generato</p>
                    )}
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                    <Button className="flex-1" asChild>
                      <a href={previewDoc.filePath} download={previewDoc.fileName}>
                        <Download className="h-4 w-4 mr-2" />
                        Scarica
                      </a>
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => duplicateMutation.mutate(previewDoc.id)}
                      title="Duplica"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => {
                        setTagsDoc(previewDoc);
                        setEditTags(previewDoc.tags || []);
                        setEditTagInput("");
                        setTagsDialogOpen(true);
                      }}
                    >
                      <Tag className="h-4 w-4 mr-2" />
                      Tag
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => {
                        setShareDoc(previewDoc);
                        setShareLink("");
                        setShareExpiry("24");
                        setShareDialogOpen(true);
                      }}
                    >
                      <Link className="h-4 w-4 mr-2" />
                      Condividi
                    </Button>
                  </div>

                  {(previewDoc.fileType === 'application/pdf' || 
                    previewDoc.fileType?.startsWith('text/') ||
                    previewDoc.fileName?.endsWith('.txt') ||
                    previewDoc.fileName?.endsWith('.md')) && (
                    <Button 
                      variant="outline" 
                      className="w-full bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-purple-200 hover:border-purple-400"
                      onClick={() => summarizeMutation.mutate(previewDoc.id)}
                      disabled={summarizeMutation.isPending}
                    >
                      {summarizeMutation.isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4 mr-2 text-purple-500" />
                      )}
                      {summarizeMutation.isPending ? "Analisi in corso..." : "Riassunto AI"}
                    </Button>
                  )}

                  <div className="flex gap-2">
                    {showTrash ? (
                      <Button 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => restoreMutation.mutate(previewDoc.id)}
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Ripristina
                      </Button>
                    ) : (
                      <Button 
                        variant="outline" 
                        className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => openDeleteConfirm(previewDoc.id)}
                        disabled={softDeleteMutation.isPending}
                      >
                        {softDeleteMutation.isPending ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4 mr-2" />
                        )}
                        {softDeleteMutation.isPending ? "Eliminazione..." : "Sposta nel cestino"}
                      </Button>
                    )}
                  </div>
                  
                  {previewDoc.fileType === 'application/pdf' && (
                    <Button variant="outline" className="w-full" asChild>
                      <a href={previewDoc.filePath} target="_blank" rel="noopener noreferrer">
                        <Eye className="h-4 w-4 mr-2" />
                        Apri in nuova scheda
                      </a>
                    </Button>
                  )}
                </div>
              </ScrollArea>
            </div>
          )}


          <Dialog open={notesDialogOpen} onOpenChange={(open) => {
            if (!open && !updateMutation.isPending) {
              setNotesDialogOpen(false);
            }
          }}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Note documento</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <textarea
                  className="w-full min-h-[120px] p-3 border rounded-lg resize-none"
                  placeholder="Aggiungi note o commenti..."
                  value={notesValue}
                  onChange={(e) => setNotesValue(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button 
                    className="flex-1"
                    onClick={() => {
                      if (notesDoc) {
                        updateMutation.mutate({ id: notesDoc.id, data: { notes: notesValue } }, {
                          onSuccess: () => {
                            if (previewDoc?.id === notesDoc.id) {
                              setPreviewDoc({ ...previewDoc, notes: notesValue });
                            }
                            setNotesDialogOpen(false);
                            toast({
                              title: "📝 Nota salvata",
                              description: "La nota è stata salvata con successo",
                              duration: 2000,
                            });
                          }
                        });
                      }
                    }}
                    disabled={updateMutation.isPending}
                  >
                    {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Salva
                  </Button>
                  <Button variant="outline" onClick={() => setNotesDialogOpen(false)}>
                    Annulla
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={tagsDialogOpen} onOpenChange={setTagsDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Gestisci Tag</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="flex gap-2">
                  <Input
                    value={editTagInput}
                    onChange={(e) => setEditTagInput(e.target.value)}
                    placeholder="Nuovo tag..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && editTagInput.trim()) {
                        e.preventDefault();
                        if (!editTags.includes(editTagInput.trim())) {
                          setEditTags([...editTags, editTagInput.trim()]);
                        }
                        setEditTagInput("");
                      }
                    }}
                  />
                  <Button 
                    variant="outline"
                    onClick={() => {
                      if (editTagInput.trim() && !editTags.includes(editTagInput.trim())) {
                        setEditTags([...editTags, editTagInput.trim()]);
                        setEditTagInput("");
                      }
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex gap-1 flex-wrap min-h-[40px] p-2 border rounded-lg bg-muted/50">
                  {editTags.length === 0 ? (
                    <span className="text-sm text-muted-foreground">Nessun tag</span>
                  ) : (
                    editTags.map((tag) => (
                      <span key={tag} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded flex items-center gap-1">
                        {tag}
                        <button onClick={() => setEditTags(editTags.filter(t => t !== tag))}>
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))
                  )}
                </div>
                <div className="flex gap-2">
                  <Button 
                    className="flex-1"
                    onClick={() => {
                      if (tagsDoc) {
                        updateMutation.mutate({ id: tagsDoc.id, data: { tags: editTags } });
                        setTagsDialogOpen(false);
                      }
                    }}
                    disabled={updateMutation.isPending}
                  >
                    {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Salva
                  </Button>
                  <Button variant="outline" onClick={() => setTagsDialogOpen(false)}>
                    Annulla
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={shareDialogOpen} onOpenChange={(open) => {
            if (!open) {
              setShareExpiry("");
              setShareLink("");
              setShareEmail("");
            }
            setShareDialogOpen(open);
          }}>
            <DialogContent className={`transition-all duration-300 ${shareDialogClosing ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
              <DialogHeader>
                <DialogTitle>Condividi documento</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                {!shareLink ? (
                  <>
                    <p className="text-sm text-muted-foreground">
                      Genera un link di condivisione per questo documento.
                    </p>
                    <div className="space-y-2">
                      <Label>Scadenza link</Label>
                      <Select value={shareExpiry} onValueChange={setShareExpiry}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleziona durata..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 ora</SelectItem>
                          <SelectItem value="5">5 ore</SelectItem>
                          <SelectItem value="10">10 ore</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {!shareExpiry && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Chiusura automatica in {shareDialogCountdown}s</span>
                          <Clock className="h-3 w-3" />
                        </div>
                        <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-amber-500 transition-all duration-1000 ease-linear"
                            style={{ width: `${(shareDialogCountdown / 5) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}
                    <Button 
                      className="w-full"
                      onClick={() => {
                        if (shareDoc && shareExpiry) {
                          shareMutation.mutate({ id: shareDoc.id, expiresIn: parseInt(shareExpiry) * 60 * 60 * 1000 });
                        }
                      }}
                      disabled={shareMutation.isPending || !shareExpiry}
                    >
                      {shareMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Link className="h-4 w-4 mr-2" />}
                      Genera link
                    </Button>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground">
                      Link generato! Copialo o invialo via email.
                    </p>
                    <div className="flex gap-2">
                      <Input value={shareLink} readOnly className="flex-1" />
                      <Button
                        variant="outline"
                        onClick={() => {
                          navigator.clipboard.writeText(shareLink);
                          toast({ title: "Link copiato", duration: 2000 });
                        }}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="border-t pt-4 mt-2">
                      <Label className="mb-2 block">Invia via email</Label>
                      <div className="flex gap-2">
                        <Input 
                          type="email"
                          placeholder="email@esempio.com" 
                          value={shareEmail}
                          onChange={(e) => setShareEmail(e.target.value)}
                          className="flex-1"
                        />
                        <Button
                          onClick={async () => {
                            if (!shareEmail || !shareDoc) return;
                            setSendingEmail(true);
                            try {
                              const res = await fetch("/api/archive/share-email", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  email: shareEmail,
                                  shareLink,
                                  documentName: shareDoc.fileName,
                                  documentTitle: shareDoc.title
                                })
                              });
                              if (res.ok) {
                                toast({ title: "Email inviata", description: `Link inviato a ${shareEmail}`, duration: 3000 });
                                setShareEmail("");
                              } else {
                                throw new Error("Errore invio");
                              }
                            } catch (e) {
                              toast({ title: "Errore", description: "Impossibile inviare l'email", variant: "destructive", duration: 3000 });
                            } finally {
                              setSendingEmail(false);
                            }
                          }}
                          disabled={!shareEmail || sendingEmail}
                        >
                          {sendingEmail ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    <Button variant="outline" className="w-full" onClick={() => { setShareLink(""); setShareEmail(""); setShareDialogOpen(false); }}>
                      Chiudi
                    </Button>
                  </>
                )}
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={deleteConfirmOpen} onOpenChange={(open) => {
            if (!open) cancelDelete();
          }}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-red-600">
                  <Trash2 className="h-5 w-5" />
                  Conferma eliminazione
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <p className="text-sm text-muted-foreground">
                  Sei sicuro di voler spostare questo file nel cestino?
                </p>
                <div className="flex items-center justify-center">
                  <div className="relative w-16 h-16">
                    <svg className="w-16 h-16 transform -rotate-90">
                      <circle
                        cx="32"
                        cy="32"
                        r="28"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                        className="text-gray-200"
                      />
                      <circle
                        cx="32"
                        cy="32"
                        r="28"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                        className="text-red-500"
                        strokeDasharray={`${(deleteCountdown / 5) * 176} 176`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-red-600">
                      {deleteCountdown}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-center text-muted-foreground">
                  La finestra si chiuderà automaticamente tra {deleteCountdown} secondi
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={cancelDelete}
                >
                  Annulla
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={confirmDelete}
                  disabled={softDeleteMutation.isPending}
                >
                  {softDeleteMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  Conferma
                </Button>
              </div>
            </DialogContent>
          </Dialog>

        </div>
      </div>
    </AppLayout>
  );
}
