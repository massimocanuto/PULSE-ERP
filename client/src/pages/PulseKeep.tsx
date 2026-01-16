import { AppLayout } from "@/components/layout/AppLayout";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  StickyNote, Plus, Search, Pin, Archive, Trash2, Loader2,
  CheckSquare, X, LayoutGrid, List, Copy, RotateCcw, MoreVertical,
  Bold, Italic, Underline, Image as ImageIcon, Check, Sparkles, Inbox, BookOpen,
  Folder, FolderOpen, ChevronRight, ChevronDown, Volume2, Download, Square, Pause,
  Bell, BellRing, Calendar, Book, FolderInput, History, Tag, Pencil
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useState, useRef, useMemo } from "react";
import { BookViewer } from "@/components/BookViewer";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { useAuth } from "@/contexts/AuthContext";
import { useConfirm } from "@/components/ui/confirm-dialog";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface KeepNote {
  id: string;
  userId: string;
  title?: string;
  content?: string;
  color: string;
  pinned: boolean;
  archived: boolean;
  deleted?: boolean;
  deletedAt?: string;
  labels: string[];
  checklistItems?: string;
  reminder?: string;
  imageUrl?: string;
  orderIndex?: number;
  createdAt: string;
  updatedAt: string;
}

interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
}

type ViewMode = "grid" | "list";
type FilterMode = "active" | "archived" | "trash";
type TabMode = "inbox" | "wiki";

// Helper per estrarre info Wiki dal titolo (es. "Wiki: Nome Contatto V.02 (20/12/2024)")
function parseWikiTitle(title: string | undefined): { contact: string; version: string | null; date: string | null; isWiki: boolean } {
  if (!title || !title.toLowerCase().startsWith("wiki:")) {
    return { contact: "", version: null, date: null, isWiki: false };
  }

  const afterWiki = title.substring(5).trim();

  // Pattern per estrarre versione (V.01, V.02, etc.) e data (20/12/2024)
  const versionMatch = afterWiki.match(/V\.(\d+)/i);
  const dateMatch = afterWiki.match(/\((\d{2}\/\d{2}\/\d{4})\)/);

  // Estrai il nome del contatto rimuovendo versione e data
  let contact = afterWiki
    .replace(/V\.\d+/i, "")
    .replace(/\(\d{2}\/\d{2}\/\d{4}\)/, "")
    .trim();

  return {
    contact: contact || "Senza nome",
    version: versionMatch ? `V.${versionMatch[1].padStart(2, "0")}` : null,
    date: dateMatch ? dateMatch[1] : null,
    isWiki: true
  };
}

// Raggruppa le Wiki per contatto con le versioni
function groupWikiByContactWithVersions(notes: KeepNote[]): Record<string, { notes: KeepNote[]; versions: string[] }> {
  const groups: Record<string, { notes: KeepNote[]; versions: string[] }> = {};

  notes.forEach(note => {
    const parsed = parseWikiTitle(note.title);
    if (!parsed.isWiki) return;

    if (!groups[parsed.contact]) {
      groups[parsed.contact] = { notes: [], versions: [] };
    }
    groups[parsed.contact].notes.push(note);
    if (parsed.version && !groups[parsed.contact].versions.includes(parsed.version)) {
      groups[parsed.contact].versions.push(parsed.version);
    }
  });

  // Ordina versioni in modo decrescente
  Object.values(groups).forEach(group => {
    group.versions.sort((a, b) => b.localeCompare(a));
    group.notes.sort((a, b) => {
      const vA = parseWikiTitle(a.title).version || "V.00";
      const vB = parseWikiTitle(b.title).version || "V.00";
      return vB.localeCompare(vA);
    });
  });

  return groups;
}

const NOTE_COLORS: { [key: string]: { bg: string; border: string; name: string; selector: string } } = {
  default: { bg: "bg-card", border: "border-border", name: "Bianco", selector: "bg-white" },
  red: { bg: "bg-red-50", border: "border-red-200", name: "Rosso", selector: "bg-red-400" },
  orange: { bg: "bg-orange-50", border: "border-orange-200", name: "Arancione", selector: "bg-orange-400" },
  yellow: { bg: "bg-yellow-50", border: "border-yellow-200", name: "Giallo", selector: "bg-yellow-400" },
  green: { bg: "bg-green-50", border: "border-green-200", name: "Verde", selector: "bg-green-400" },
  teal: { bg: "bg-teal-50", border: "border-teal-200", name: "Turchese", selector: "bg-teal-400" },
  blue: { bg: "bg-blue-50", border: "border-blue-200", name: "Blu", selector: "bg-blue-400" },
  purple: { bg: "bg-purple-50", border: "border-purple-200", name: "Viola", selector: "bg-purple-400" },
  pink: { bg: "bg-pink-50", border: "border-pink-200", name: "Rosa", selector: "bg-pink-400" },
  brown: { bg: "bg-amber-100", border: "border-amber-300", name: "Marrone", selector: "bg-amber-500" },
  gray: { bg: "bg-gray-100", border: "border-border", name: "Grigio", selector: "bg-gray-400" },
};

const API_BASE = "/api";

interface KeepLabel {
  id: string;
  userId: string;
  name: string;
  color: string;
  createdAt: string;
}

const LABEL_COLORS = [
  { value: "#EF4444", name: "Rosso", bg: "bg-red-500" },
  { value: "#F97316", name: "Arancione", bg: "bg-orange-500" },
  { value: "#EAB308", name: "Giallo", bg: "bg-yellow-500" },
  { value: "#22C55E", name: "Verde", bg: "bg-green-500" },
  { value: "#06B6D4", name: "Ciano", bg: "bg-cyan-500" },
  { value: "#3B82F6", name: "Blu", bg: "bg-blue-500" },
  { value: "#8B5CF6", name: "Viola", bg: "bg-violet-500" },
  { value: "#EC4899", name: "Rosa", bg: "bg-pink-500" },
  { value: "#6B7280", name: "Grigio", bg: "bg-gray-500" },
];

const keepApi = {
  getNotes: async (userId: string): Promise<KeepNote[]> => {
    const res = await fetch(`${API_BASE}/keep/notes/${userId}`);
    if (!res.ok) throw new Error("Failed to fetch notes");
    return res.json();
  },
  getLabels: async (userId: string): Promise<KeepLabel[]> => {
    const res = await fetch(`${API_BASE}/keep/labels/${userId}`);
    if (!res.ok) throw new Error("Failed to fetch labels");
    return res.json();
  },
  createLabel: async (label: { userId: string; name: string; color: string }): Promise<KeepLabel> => {
    const res = await fetch(`${API_BASE}/keep/labels`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(label),
    });
    if (!res.ok) throw new Error("Failed to create label");
    return res.json();
  },
  deleteLabel: async (id: string): Promise<void> => {
    const res = await fetch(`${API_BASE}/keep/labels/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete label");
  },
  getTrashNotes: async (userId: string): Promise<KeepNote[]> => {
    const res = await fetch(`${API_BASE}/keep/notes/${userId}/trash`);
    if (!res.ok) throw new Error("Failed to fetch trash notes");
    return res.json();
  },
  createNote: async (note: Partial<KeepNote>): Promise<KeepNote> => {
    const res = await fetch(`${API_BASE}/keep/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(note),
    });
    if (!res.ok) throw new Error("Failed to create note");
    return res.json();
  },
  updateNote: async (id: string, note: Partial<KeepNote>): Promise<KeepNote> => {
    const res = await fetch(`${API_BASE}/keep/notes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(note),
    });
    if (!res.ok) throw new Error("Failed to update note");
    return res.json();
  },
  moveToTrash: async (id: string): Promise<KeepNote> => {
    const res = await fetch(`${API_BASE}/keep/notes/${id}/trash`, { method: "POST" });
    if (!res.ok) throw new Error("Failed to move to trash");
    return res.json();
  },
  restoreNote: async (id: string): Promise<KeepNote> => {
    const res = await fetch(`${API_BASE}/keep/notes/${id}/restore`, { method: "POST" });
    if (!res.ok) throw new Error("Failed to restore note");
    return res.json();
  },
  deleteNote: async (id: string): Promise<void> => {
    const res = await fetch(`${API_BASE}/keep/notes/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete note");
  },
  duplicateNote: async (id: string): Promise<KeepNote> => {
    const res = await fetch(`${API_BASE}/keep/notes/${id}/duplicate`, { method: "POST" });
    if (!res.ok) throw new Error("Failed to duplicate note");
    return res.json();
  },
  updateOrder: async (updates: { id: string; orderIndex: number }[]): Promise<void> => {
    const res = await fetch(`${API_BASE}/keep/notes/order`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error("Failed to update order");
  },
};

function SortableNoteCard({ note, onEdit, onPin, onArchive, onTrash, onDuplicate, viewMode }: {
  note: KeepNote;
  onEdit: (note: KeepNote) => void;
  onPin: (note: KeepNote) => void;
  onArchive: (note: KeepNote) => void;
  onTrash: (note: KeepNote) => void;
  onDuplicate: (note: KeepNote) => void;
  viewMode: ViewMode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: note.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 1,
  };

  const colorStyle = NOTE_COLORS[note.color] || NOTE_COLORS.default;
  let parsedChecklist: ChecklistItem[] = [];
  try {
    if (note.checklistItems) parsedChecklist = JSON.parse(note.checklistItems);
  } catch { }

  const formatDate = (date: string) => {
    try {
      return format(new Date(date), "d MMM yyyy, HH:mm", { locale: it });
    } catch {
      return "";
    }
  };

  if (viewMode === "list") {
    return (
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className={`p-3 cursor-grab active:cursor-grabbing border-b hover:bg-muted/50 hover:translate-x-1 transition-all duration-150 ease-out flex items-center gap-4 ${colorStyle.bg}`}
        onClick={() => onEdit(note)}
      >
        {note.imageUrl && (
          <img src={note.imageUrl} alt="" className="w-10 h-10 object-cover rounded flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm truncate">{note.title || "Senza titolo"}</h3>
          <p className="text-xs text-muted-foreground truncate">{note.content}</p>
        </div>
        <span className="text-[10px] text-muted-foreground whitespace-nowrap">{formatDate(note.updatedAt)}</span>
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onPin(note)}
            className={`p-1 rounded hover:bg-black/10 ${note.pinned ? "text-amber-600" : "text-gray-400"}`}
          >
            <Pin className={`h-3.5 w-3.5 ${note.pinned ? "fill-current" : ""}`} />
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-1 rounded hover:bg-black/10 text-gray-400">
                <MoreVertical className="h-3.5 w-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onDuplicate(note)}>
                <Copy className="h-4 w-4 mr-2" /> Duplica
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onArchive(note)}>
                <Archive className="h-4 w-4 mr-2" /> {note.archived ? "Rimuovi da archivio" : "Archivia"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onTrash(note)} className="text-red-500">
                <Trash2 className="h-4 w-4 mr-2" /> Cestina
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    );
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`p-4 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all duration-200 ease-out rounded-xl ${colorStyle.bg} ${colorStyle.border} border`}
      onClick={() => onEdit(note)}
    >
      {note.imageUrl && (
        <div className="mb-3 -mx-4 -mt-4 relative">
          <img src={note.imageUrl} alt="" className="w-full h-32 object-cover rounded-t-xl" />
          <div className="absolute bottom-2 right-2 bg-black/50 backdrop-blur-sm rounded-full p-1">
            <ImageIcon className="h-3 w-3 text-white" />
          </div>
        </div>
      )}
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-semibold text-sm line-clamp-1 flex items-center gap-1.5">
          {note.title || "Senza titolo"}
          {note.imageUrl && !note.imageUrl && <ImageIcon className="h-3 w-3 text-muted-foreground" />}
        </h3>
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onPin(note)}
            className={`p-1 rounded hover:bg-black/10 ${note.pinned ? "text-amber-600" : "text-gray-400"}`}
          >
            <Pin className={`h-3.5 w-3.5 ${note.pinned ? "fill-current" : ""}`} />
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-1 rounded hover:bg-black/10 text-gray-400">
                <MoreVertical className="h-3.5 w-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onDuplicate(note)}>
                <Copy className="h-4 w-4 mr-2" /> Duplica
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onArchive(note)}>
                <Archive className="h-4 w-4 mr-2" /> {note.archived ? "Rimuovi da archivio" : "Archivia"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onTrash(note)} className="text-red-500">
                <Trash2 className="h-4 w-4 mr-2" /> Cestina
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {parsedChecklist.length > 0 ? (
        <div className="space-y-1">
          {parsedChecklist.slice(0, 5).map(item => (
            <div key={item.id} className="flex items-center gap-2 text-xs">
              <div className={`w-3 h-3 border rounded ${item.checked ? "bg-green-500 border-green-500" : "border-gray-400"}`} />
              <span className={item.checked ? "line-through text-muted-foreground" : ""}>{item.text}</span>
            </div>
          ))}
          {parsedChecklist.length > 5 && (
            <p className="text-xs text-muted-foreground">+{parsedChecklist.length - 5} altri elementi</p>
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground line-clamp-4 whitespace-pre-wrap">{note.content}</p>
      )}

      <div className="flex items-center justify-between mt-3 pt-2 border-t border-dashed">
        <span className="text-[10px] text-muted-foreground">{formatDate(note.updatedAt)}</span>
      </div>
    </Card>
  );
}

function TrashNoteCard({ note, onRestore, onConfirmDelete }: {
  note: KeepNote;
  onRestore: (note: KeepNote) => void;
  onConfirmDelete: (note: KeepNote) => void;
}) {
  const colorStyle = NOTE_COLORS[note.color] || NOTE_COLORS.default;

  const formatDate = (date?: string) => {
    if (!date) return "";
    try {
      return format(new Date(date), "d MMM yyyy, HH:mm", { locale: it });
    } catch {
      return "";
    }
  };

  return (
    <Card className={`p-4 shadow-sm hover:shadow-md hover:opacity-90 transition-all duration-200 ease-out rounded-xl ${colorStyle.bg} ${colorStyle.border} border opacity-60`}>
      <h3 className="font-semibold text-sm line-clamp-1 mb-2">{note.title || "Senza titolo"}</h3>
      <p className="text-sm text-muted-foreground line-clamp-3 whitespace-pre-wrap">{note.content}</p>
      <div className="flex items-center justify-between mt-3 pt-2 border-t border-dashed">
        <span className="text-[10px] text-muted-foreground">Eliminata: {formatDate(note.deletedAt)}</span>
        <div className="flex gap-1">
          <button
            onClick={() => onRestore(note)}
            className="p-1 rounded hover:bg-black/10 text-green-600"
            title="Ripristina"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onConfirmDelete(note)}
            className="p-1 rounded hover:bg-black/10 text-red-500"
            title="Elimina definitivamente"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </Card>
  );
}

export default function PulseKeep() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState<FilterMode>("active");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [activeTab, setActiveTab] = useState<TabMode>("inbox");
  const [selectedWikiFolder, setSelectedWikiFolder] = useState<string | null>(null);
  const [moveToFolderOpen, setMoveToFolderOpen] = useState<string | null>(null); // note id
  const [wikiDirExpanded, setWikiDirExpanded] = useState(true);
  const [newFolderName, setNewFolderName] = useState("");
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [newNoteOpen, setNewNoteOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<KeepNote | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newColor, setNewColor] = useState("default");
  const [isChecklist, setIsChecklist] = useState(false);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [newChecklistItem, setNewChecklistItem] = useState("");
  const [newImageUrl, setNewImageUrl] = useState("");
  const [saveSuccess, setSaveSuccess] = useState<"create" | "update" | null>(null);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [reminderPopoverOpen, setReminderPopoverOpen] = useState(false);
  const [reminderDate, setReminderDate] = useState("");
  const [reminderTime, setReminderTime] = useState("09:00");
  const [bookViewerOpen, setBookViewerOpen] = useState(false);
  const [labelDialogOpen, setLabelDialogOpen] = useState(false);
  const [newLabelName, setNewLabelName] = useState("");
  const [newLabelColor, setNewLabelColor] = useState("#3B82F6");
  const [labelPopoverNoteId, setLabelPopoverNoteId] = useState<string | null>(null);
  const [renameFolderDialog, setRenameFolderDialog] = useState<{ open: boolean; folderName: string }>({ open: false, folderName: "" });
  const [newFolderNameInput, setNewFolderNameInput] = useState("");
  const [folderMenuOpen, setFolderMenuOpen] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const userId = user?.id || "";

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const { data: notes = [], isLoading } = useQuery({
    queryKey: ["keep-notes", userId],
    queryFn: () => keepApi.getNotes(userId),
    enabled: !!userId,
  });

  const { data: trashNotes = [], isLoading: isLoadingTrash } = useQuery({
    queryKey: ["keep-notes-trash", userId],
    queryFn: () => keepApi.getTrashNotes(userId),
    enabled: !!userId && filterMode === "trash",
  });

  const { data: keepLabels = [] } = useQuery({
    queryKey: ["keep-labels", userId],
    queryFn: () => keepApi.getLabels(userId),
    enabled: !!userId,
  });

  const createLabelMutation = useMutation({
    mutationFn: (data: { userId: string; name: string; color: string }) => keepApi.createLabel(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["keep-labels"] });
    },
  });

  const deleteLabelMutation = useMutation({
    mutationFn: (id: string) => keepApi.deleteLabel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["keep-labels"] });
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<KeepNote>) => keepApi.createNote(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["keep-notes"] });
      setSaveSuccess("create");
      setTimeout(() => {
        setSaveSuccess(null);
        resetForm();
        setNewNoteOpen(false);
      }, 800);
    },
    onError: (error: any) => {
      console.error("Errore creazione nota:", error);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<KeepNote> }) => keepApi.updateNote(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["keep-notes"] });
      setSaveSuccess("update");
      setTimeout(() => {
        setSaveSuccess(null);
        setEditingNote(null);
      }, 800);
    },
  });

  const trashMutation = useMutation({
    mutationFn: (id: string) => keepApi.moveToTrash(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["keep-notes"] });
      queryClient.invalidateQueries({ queryKey: ["keep-notes-trash"] });
      setEditingNote(null);
    },
  });

  const restoreMutation = useMutation({
    mutationFn: (id: string) => keepApi.restoreNote(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["keep-notes"] });
      queryClient.invalidateQueries({ queryKey: ["keep-notes-trash"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => keepApi.deleteNote(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["keep-notes"] });
      queryClient.invalidateQueries({ queryKey: ["keep-notes-trash"] });
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: (id: string) => keepApi.duplicateNote(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["keep-notes"] });
    },
  });

  const orderMutation = useMutation({
    mutationFn: (updates: { id: string; orderIndex: number }[]) => keepApi.updateOrder(updates),
  });

  const resetForm = () => {
    setNewTitle("");
    setNewContent("");
    setNewColor("default");
    setIsChecklist(false);
    setChecklistItems([]);
    setNewChecklistItem("");
    setNewImageUrl("");
  };

  const getNoteLabels = (note: KeepNote): KeepLabel[] => {
    if (!note.labels || note.labels.length === 0) return [];
    return keepLabels.filter(l => note.labels.includes(l.id));
  };

  const toggleLabelOnNote = async (noteId: string, labelId: string) => {
    const note = notes.find(n => n.id === noteId);
    if (!note) return;

    const currentLabels = note.labels || [];
    const hasLabel = currentLabels.includes(labelId);
    const newLabels = hasLabel
      ? currentLabels.filter(id => id !== labelId)
      : [...currentLabels, labelId];

    await keepApi.updateNote(noteId, { labels: newLabels });
    queryClient.invalidateQueries({ queryKey: ["keep-notes"] });
  };

  const handleCreateLabel = () => {
    if (!newLabelName.trim()) return;
    createLabelMutation.mutate({
      userId,
      name: newLabelName.trim(),
      color: newLabelColor,
    }, {
      onSuccess: () => {
        setNewLabelName("");
        setNewLabelColor("#3B82F6");
      }
    });
  };

  const handleRenameFolder = async () => {
    if (!renameFolderDialog.folderName || !newFolderNameInput.trim()) return;

    const notesToRename = notes.filter(note => {
      const parsed = parseWikiTitle(note.title);
      return parsed.isWiki && parsed.contact === renameFolderDialog.folderName;
    });

    for (const note of notesToRename) {
      const parsed = parseWikiTitle(note.title);
      const newTitle = `Wiki: ${newFolderNameInput.trim()}${parsed.version ? ` ${parsed.version}` : ""}${parsed.date ? ` (${parsed.date})` : ""}`;
      await keepApi.updateNote(note.id, { title: newTitle });
    }

    queryClient.invalidateQueries({ queryKey: ["keep-notes"] });
    setRenameFolderDialog({ open: false, folderName: "" });
    setNewFolderNameInput("");
    if (selectedWikiFolder === renameFolderDialog.folderName) {
      setSelectedWikiFolder(newFolderNameInput.trim());
    }
  };

  const handleDeleteFolder = async (folderName: string) => {
    const notesToDelete = notes.filter(note => {
      const parsed = parseWikiTitle(note.title);
      return parsed.isWiki && parsed.contact === folderName;
    });

    for (const note of notesToDelete) {
      await keepApi.moveToTrash(note.id);
    }

    queryClient.invalidateQueries({ queryKey: ["keep-notes"] });
    queryClient.invalidateQueries({ queryKey: ["keep-notes-trash"] });
    if (selectedWikiFolder === folderName) {
      setSelectedWikiFolder(null);
    }
  };

  const applyFormatting = (format: "bold" | "italic" | "underline") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = newContent.substring(start, end);

    if (!selectedText) return;

    let formattedText = "";
    switch (format) {
      case "bold":
        formattedText = `**${selectedText}**`;
        break;
      case "italic":
        formattedText = `*${selectedText}*`;
        break;
      case "underline":
        formattedText = `__${selectedText}__`;
        break;
    }

    const newText = newContent.substring(0, start) + formattedText + newContent.substring(end);
    setNewContent(newText);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        setNewImageUrl(data.url || data.path);
      }
    } catch (error) {
      console.error("Upload failed:", error);
    }
  };

  const handleCreateNote = () => {
    // Se stiamo usando editingNote per il titolo/contenuto (nuova UI)
    if (editingNote) {
      if (!editingNote.title?.trim() && !editingNote.content?.trim() && checklistItems.length === 0 && !newImageUrl) return;

      createMutation.mutate({
        userId,
        title: editingNote.title,
        content: isChecklist ? undefined : editingNote.content,
        color: editingNote.color,
        checklistItems: isChecklist ? JSON.stringify(checklistItems) : undefined,
        imageUrl: newImageUrl || undefined,
        pinned: false,
        archived: false,
      });
    } else {
      // Fallback alla vecchia logica (se necessario)
      if (!newTitle.trim() && !newContent.trim() && checklistItems.length === 0 && !newImageUrl) return;

      createMutation.mutate({
        userId,
        title: newTitle,
        content: isChecklist ? undefined : newContent,
        color: newColor,
        checklistItems: isChecklist ? JSON.stringify(checklistItems) : undefined,
        imageUrl: newImageUrl || undefined,
        pinned: false,
        archived: false,
      });
    }
  };

  const handleUpdateNote = () => {
    if (!editingNote) return;

    updateMutation.mutate({
      id: editingNote.id,
      data: {
        title: editingNote.title,
        content: editingNote.content,
        color: editingNote.color,
        checklistItems: editingNote.checklistItems,
      },
    });
  };

  const handleTogglePin = (note: KeepNote) => {
    updateMutation.mutate({ id: note.id, data: { pinned: !note.pinned } });
  };

  const handleToggleArchive = (note: KeepNote) => {
    updateMutation.mutate({ id: note.id, data: { archived: !note.archived } });
  };

  const handleMoveToTrash = (note: KeepNote) => {
    trashMutation.mutate(note.id);
  };

  const handleRestore = (note: KeepNote) => {
    restoreMutation.mutate(note.id);
  };

  const handlePermanentDelete = (note: KeepNote) => {
    deleteMutation.mutate(note.id);
  };

  const handleGenerateAudio = async () => {
    if (!editingNote?.content) return;

    setIsGeneratingAudio(true);
    try {
      const response = await fetch("/api/ai/text-to-speech", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: `${editingNote.title || ""}. ${editingNote.content}`,
          voice: "nova"
        }),
      });

      if (!response.ok) throw new Error("Errore nella generazione audio");

      const audioBlob = await response.blob();
      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);

      // Avvia la riproduzione automatica
      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error("TTS error:", error);
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  const handlePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleStopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
  };

  const handleDownloadAudio = () => {
    if (!audioUrl) return;

    const a = document.createElement("a");
    a.href = audioUrl;
    a.download = `${editingNote?.title || "wiki"}-audio.mp3`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleSetReminder = () => {
    if (!editingNote || !reminderDate) return;

    const reminderDateTime = new Date(`${reminderDate}T${reminderTime}`);
    updateMutation.mutate({
      id: editingNote.id,
      data: { reminder: reminderDateTime.toISOString() }
    });
    setReminderPopoverOpen(false);
    setReminderDate("");
    setReminderTime("09:00");
  };

  const handleRemoveReminder = () => {
    if (!editingNote) return;
    updateMutation.mutate({
      id: editingNote.id,
      data: { reminder: null }
    });
    setReminderPopoverOpen(false);
  };

  const handleConfirmPermanentDelete = async (note: KeepNote) => {
    const confirmed = await confirm({
      title: "Elimina definitivamente",
      description: "Sei sicuro di voler eliminare definitivamente questa nota? L'azione non può essere annullata.",
      confirmText: "Elimina",
      variant: "destructive",
    });
    if (confirmed) {
      handlePermanentDelete(note);
    }
  };

  const handleDuplicate = (note: KeepNote) => {
    duplicateMutation.mutate(note.id);
  };

  // Sposta nota Wiki in un'altra cartella
  const handleMoveToFolder = (note: KeepNote, targetFolder: string) => {
    const parsed = parseWikiTitle(note.title);
    if (!parsed.isWiki) return;

    // Mantieni versione e data se presenti
    let newTitle = `Wiki: ${targetFolder}`;
    if (parsed.version) {
      newTitle += ` ${parsed.version}`;
    }
    if (parsed.date) {
      newTitle += ` (${parsed.date})`;
    }

    updateMutation.mutate({
      id: note.id,
      data: { title: newTitle }
    });
    setMoveToFolderOpen(null);
  };

  // Copia nota Wiki in un'altra cartella
  const handleCopyToFolder = (note: KeepNote, targetFolder: string) => {
    const parsed = parseWikiTitle(note.title);

    // Crea nuovo titolo per la copia
    let newTitle = `Wiki: ${targetFolder}`;
    if (parsed.version) {
      newTitle += ` ${parsed.version}`;
    }
    // Aggiungi data corrente
    const today = format(new Date(), "dd/MM/yyyy");
    newTitle += ` (${today})`;

    // Crea una copia della nota nella nuova cartella
    createMutation.mutate({
      userId: note.userId,
      title: newTitle,
      content: note.content,
      color: note.color,
      pinned: false,
      archived: false,
      labels: note.labels || ["wiki"],
    });
    setMoveToFolderOpen(null);
  };

  // Ottieni lista cartelle Wiki disponibili
  const availableWikiFolders = useMemo(() => {
    const folders = new Set<string>();
    notes.forEach(note => {
      const parsed = parseWikiTitle(note.title);
      if (parsed.isWiki && parsed.contact) {
        folders.add(parsed.contact);
      }
    });
    return Array.from(folders).sort();
  }, [notes]);

  const addChecklistItem = () => {
    if (!newChecklistItem.trim()) return;
    setChecklistItems([...checklistItems, { id: Date.now().toString(), text: newChecklistItem, checked: false }]);
    setNewChecklistItem("");
  };

  const toggleChecklistItem = (itemId: string) => {
    setChecklistItems(checklistItems.map(item =>
      item.id === itemId ? { ...item, checked: !item.checked } : item
    ));
  };

  const removeChecklistItem = (itemId: string) => {
    setChecklistItems(checklistItems.filter(item => item.id !== itemId));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = displayNotes.findIndex(n => n.id === active.id);
    const newIndex = displayNotes.findIndex(n => n.id === over.id);

    const newOrder = arrayMove(displayNotes, oldIndex, newIndex);
    const updates = newOrder.map((note, index) => ({ id: note.id, orderIndex: index }));
    orderMutation.mutate(updates);
  };

  const filteredNotes = notes.filter(note => {
    const matchesSearch = !searchQuery ||
      note.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content?.toLowerCase().includes(searchQuery.toLowerCase());

    const isWiki = note.title?.toLowerCase().startsWith("wiki:") || note.labels?.includes("wiki");

    if (activeTab === "wiki" && !isWiki) return false;
    if (activeTab === "inbox" && isWiki) return false;

    if (filterMode === "archived") return matchesSearch && note.archived;
    return matchesSearch && !note.archived;
  });

  // Calcola conteggi Wiki e Inbox dai dati filtrati per search/archived
  const wikiFilteredNotes = useMemo(() => {
    return notes.filter(note => {
      const matchesSearch = !searchQuery ||
        note.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.content?.toLowerCase().includes(searchQuery.toLowerCase());

      const isWiki = note.title?.toLowerCase().startsWith("wiki:") || note.labels?.includes("wiki");
      if (!isWiki) return false;

      if (filterMode === "archived") return matchesSearch && note.archived;
      return matchesSearch && !note.archived;
    });
  }, [notes, searchQuery, filterMode]);

  const wikiCount = wikiFilteredNotes.length;
  const inboxCount = filteredNotes.filter(n => !n.title?.toLowerCase().startsWith("wiki:") && !n.labels?.includes("wiki")).length;

  // Raggruppamento Wiki per contatto (directory) - basato sui dati filtrati
  const wikiContacts = useMemo(() => {
    const contactMap: Record<string, { name: string; count: number; notes: KeepNote[] }> = {};

    wikiFilteredNotes.forEach(note => {
      // Estrai il nome del contatto dal titolo "Wiki: nome_contatto"
      let contactName = "Altro";
      if (note.title?.toLowerCase().startsWith("wiki:")) {
        contactName = note.title.substring(5).trim() || "Senza nome";
      }

      if (!contactMap[contactName]) {
        contactMap[contactName] = { name: contactName, count: 0, notes: [] };
      }
      contactMap[contactName].count++;
      contactMap[contactName].notes.push(note);
    });

    // Ordina alfabeticamente
    return Object.values(contactMap).sort((a, b) => a.name.localeCompare(b.name));
  }, [wikiFilteredNotes]);

  // Filtra per cartella selezionata (solo in tab Wiki)
  const filteredByFolder = useMemo(() => {
    if (activeTab !== "wiki" || !selectedWikiFolder) return filteredNotes;

    return filteredNotes.filter(note => {
      if (note.title?.toLowerCase().startsWith("wiki:")) {
        const contactName = note.title.substring(5).trim() || "Senza nome";
        return contactName === selectedWikiFolder;
      }
      return selectedWikiFolder === "Altro";
    });
  }, [filteredNotes, selectedWikiFolder, activeTab]);

  const displayNotes = selectedWikiFolder && activeTab === "wiki" ? filteredByFolder : filteredNotes;

  const pinnedNotes = displayNotes.filter(n => n.pinned);
  const otherNotes = displayNotes.filter(n => !n.pinned);

  const activeCount = notes.filter(n => !n.archived).length;
  const archivedCount = notes.filter(n => n.archived).length;
  const trashCount = trashNotes.length;

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="flex flex-col h-[calc(100vh-3rem)] overflow-hidden bg-gradient-to-br from-[#f5f0e6] via-[#e8dcc8] to-[#ddd0b8] dark:from-[#2d3748] dark:via-[#374151] dark:to-[#3d4555]">
        <div className="h-32 w-full flex-shrink-0 bg-gradient-to-r from-[#4a5568] via-[#5a6a7d] to-[#6b7a8f]" />

        <div className="relative -mt-16 px-8 pb-4">
          <div className="bg-card rounded-xl shadow-lg border p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-md">
                  <StickyNote className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Pulse Keep</h1>
                  <p className="text-sm text-muted-foreground">Le tue note personali</p>
                </div>
              </div>

              {/* Tab bar */}
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "inbox" | "wiki")}>
                <TabsList className="grid grid-cols-2 gap-1 h-auto bg-transparent p-0 w-48">
                  <TabsTrigger value="inbox" className="flex flex-col items-center justify-center gap-0.5 px-2 py-2 text-[9px] data-[state=active]:bg-primary/20 rounded-lg" title="Inbox">
                    <Inbox className="h-4 w-4" />
                    <span>Inbox ({inboxCount})</span>
                  </TabsTrigger>
                  <TabsTrigger value="wiki" className="flex flex-col items-center justify-center gap-0.5 px-2 py-2 text-[9px] data-[state=active]:bg-primary/20 rounded-lg" title="Wiki">
                    <BookOpen className="h-4 w-4" />
                    <span>Wiki ({wikiCount})</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-hidden px-8 pb-8">
          <div className="rounded-xl border shadow-sm h-full flex bg-card">
            {/* Colonna sinistra - Lista note */}
            <div className="w-[450px] border-r flex flex-col flex-shrink-0">
              <div className="p-3 border-b space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cerca..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-9"
                  />
                </div>

                <div className="flex gap-1">
                  <Button
                    variant={filterMode === "active" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setFilterMode("active")}
                    className="flex-1 h-8 text-xs"
                  >
                    <StickyNote className="h-3 w-3 mr-1" />
                    {activeCount}
                  </Button>
                  <Button
                    variant={filterMode === "archived" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setFilterMode("archived")}
                    className="flex-1 h-8 text-xs"
                  >
                    <Archive className="h-3 w-3 mr-1" />
                    {archivedCount}
                  </Button>
                  <Button
                    variant={filterMode === "trash" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setFilterMode("trash")}
                    className="flex-1 h-8 text-xs"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    {trashCount}
                  </Button>
                </div>

                {filterMode !== "trash" && (
                  <Button
                    className={`w-full h-8 ${activeTab === "wiki" ? "bg-cyan-600 hover:bg-cyan-700" : "bg-amber-600 hover:bg-amber-700"}`}
                    size="sm"
                    onClick={() => {
                      resetForm();
                      const defaultTitle = activeTab === "wiki" && selectedWikiFolder
                        ? `Wiki: ${selectedWikiFolder}`
                        : activeTab === "wiki"
                          ? "Wiki: "
                          : "";
                      setEditingNote({
                        id: "",
                        userId,
                        title: defaultTitle,
                        content: "",
                        color: activeTab === "wiki" ? "blue" : "default",
                        pinned: false,
                        archived: false,
                        labels: activeTab === "wiki" ? ["wiki"] : [],
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                      });
                    }}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    {activeTab === "wiki" ? "Nuovo Documento Wiki" : "Nuova Nota"}
                  </Button>
                )}
              </div>

              <ScrollArea className="flex-1">
                {/* Directory Wiki - Visualizzazione migliorata */}
                {activeTab === "wiki" && filterMode !== "trash" && (
                  <div className="border-b bg-gradient-to-b from-slate-50/50 to-transparent dark:from-slate-900/30">
                    <div className="flex items-center border-b border-dashed">
                      <button
                        onClick={() => setWikiDirExpanded(!wikiDirExpanded)}
                        className="flex-1 px-4 py-3 flex items-center gap-3 text-sm font-semibold text-foreground hover:bg-muted/50 transition-colors"
                      >
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-sm">
                          <Folder className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex-1 text-left">
                          <div className="font-semibold">Cartelle Wiki</div>
                          <div className="text-[10px] text-muted-foreground font-normal">
                            {wikiContacts.length} cartelle • {wikiCount} documenti
                          </div>
                        </div>
                        {wikiDirExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                      </button>
                      <button
                        onClick={() => setShowNewFolderInput(true)}
                        className="px-3 py-3 text-cyan-600 hover:text-cyan-700 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 transition-colors rounded-lg mr-2"
                        title="Nuova cartella"
                      >
                        <Plus className="h-5 w-5" />
                      </button>
                    </div>
                    {wikiDirExpanded && (
                      <div className="p-3 space-y-1">
                        {/* Input nuova cartella - seleziona solo, non crea file */}
                        {showNewFolderInput && (
                          <div className="p-2 mb-2 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg border border-cyan-200 dark:border-cyan-800">
                            <div className="flex items-center gap-2 mb-2">
                              <Folder className="h-4 w-4 text-cyan-600" />
                              <span className="text-xs text-cyan-700 dark:text-cyan-300">Inserisci nome cartella per filtrare</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Input
                                value={newFolderName}
                                onChange={(e) => setNewFolderName(e.target.value)}
                                placeholder="Nome cartella..."
                                className="h-8 text-sm flex-1 border-cyan-300 focus:ring-cyan-500"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" && newFolderName.trim()) {
                                    setSelectedWikiFolder(newFolderName.trim());
                                    setNewFolderName("");
                                    setShowNewFolderInput(false);
                                  }
                                  if (e.key === "Escape") {
                                    setNewFolderName("");
                                    setShowNewFolderInput(false);
                                  }
                                }}
                              />
                              <Button
                                size="sm"
                                className="h-8 bg-cyan-600 hover:bg-cyan-700"
                                onClick={() => {
                                  if (newFolderName.trim()) {
                                    setSelectedWikiFolder(newFolderName.trim());
                                    setNewFolderName("");
                                    setShowNewFolderInput(false);
                                  }
                                }}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8"
                                onClick={() => {
                                  setNewFolderName("");
                                  setShowNewFolderInput(false);
                                }}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-1.5">
                              Usa "Nuova Nota" per creare un documento in questa cartella
                            </p>
                          </div>
                        )}

                        {/* Cartella "Tutte" */}
                        <button
                          onClick={() => setSelectedWikiFolder(null)}
                          className={`w-full p-2.5 flex items-center gap-3 rounded-lg transition-all duration-200 ${!selectedWikiFolder
                            ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-md shadow-cyan-200 dark:shadow-cyan-900/50"
                            : "hover:bg-muted/70 text-foreground"
                            }`}
                        >
                          <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${!selectedWikiFolder
                            ? "bg-white/20"
                            : "bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800"
                            }`}>
                            <FolderOpen className={`h-5 w-5 ${!selectedWikiFolder ? "text-white" : "text-slate-600 dark:text-slate-300"}`} />
                          </div>
                          <div className="flex-1 text-left">
                            <div className="font-medium text-sm">Tutte le Wiki</div>
                            <div className={`text-[10px] ${!selectedWikiFolder ? "text-white/70" : "text-muted-foreground"}`}>
                              Visualizza tutti i documenti
                            </div>
                          </div>
                          <span className={`text-xs font-bold px-2 py-1 rounded-full ${!selectedWikiFolder
                            ? "bg-white/20 text-white"
                            : "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-300"
                            }`}>
                            {wikiCount}
                          </span>
                        </button>

                        {/* Lista cartelle */}
                        <div className="grid gap-1 mt-2">
                          {wikiContacts.map((contact, index) => {
                            const displayName = contact.name.includes("@")
                              ? contact.name.split("@")[0]
                              : contact.name;
                            const isSelected = selectedWikiFolder === contact.name;
                            const folderColors = [
                              "from-amber-400 to-orange-500",
                              "from-emerald-400 to-teal-500",
                              "from-violet-400 to-purple-500",
                              "from-rose-400 to-pink-500",
                              "from-sky-400 to-indigo-500",
                            ];
                            const colorClass = folderColors[index % folderColors.length];

                            return (
                              <div
                                key={contact.name}
                                className={`w-full p-2.5 flex items-center gap-3 rounded-lg transition-all duration-200 cursor-pointer group ${isSelected
                                  ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-md shadow-cyan-200 dark:shadow-cyan-900/50"
                                  : "hover:bg-muted/70 text-foreground"
                                  }`}
                                onClick={() => setSelectedWikiFolder(contact.name)}
                              >
                                <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${isSelected
                                  ? "bg-white/20"
                                  : `bg-gradient-to-br ${colorClass} shadow-sm`
                                  }`}>
                                  <Folder className={`h-5 w-5 ${isSelected ? "text-white" : "text-white"}`} />
                                </div>
                                <div className="flex-1 text-left min-w-0">
                                  <div className="font-medium text-sm truncate">{displayName}</div>
                                  <div className={`text-[10px] ${isSelected ? "text-white/70" : "text-muted-foreground"}`}>
                                    {contact.count} {contact.count === 1 ? "documento" : "documenti"}
                                  </div>
                                </div>
                                <span className={`text-xs font-bold px-2 py-1 rounded-full flex-shrink-0 ${isSelected
                                  ? "bg-white/20 text-white"
                                  : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                                  }`}>
                                  {contact.count}
                                </span>

                                {/* Menu contestuale cartella */}
                                <DropdownMenu open={folderMenuOpen === contact.name} onOpenChange={(open) => setFolderMenuOpen(open ? contact.name : null)}>
                                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className={`h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ${isSelected ? "hover:bg-white/20" : "hover:bg-muted"
                                        }`}
                                    >
                                      <MoreVertical className="h-3 w-3" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-40" onClick={(e) => e.stopPropagation()}>
                                    <DropdownMenuItem
                                      className="text-xs"
                                      onClick={() => {
                                        setNewFolderNameInput(contact.name);
                                        setRenameFolderDialog({ open: true, folderName: contact.name });
                                        setFolderMenuOpen(null);
                                      }}
                                    >
                                      <Pencil className="h-3 w-3 mr-2" /> Rinomina
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      className="text-xs text-red-600"
                                      onClick={() => {
                                        if (confirm(`Eliminare la cartella "${displayName}" e tutti i suoi ${contact.count} documenti? Potrai recuperarli dal cestino.`)) {
                                          handleDeleteFolder(contact.name);
                                        }
                                        setFolderMenuOpen(null);
                                      }}
                                    >
                                      <Trash2 className="h-3 w-3 mr-2" /> Elimina cartella
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {filterMode === "trash" ? (
                  <>
                    {isLoadingTrash ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : trashNotes.length > 0 ? (
                      <div className="divide-y">
                        {trashNotes.map(note => {
                          const colorStyle = NOTE_COLORS[note.color] || NOTE_COLORS.default;
                          return (
                            <div
                              key={note.id}
                              className={`p-3 cursor-pointer hover:bg-muted/50 transition-colors ${colorStyle.bg} ${editingNote?.id === note.id ? "bg-muted" : ""}`}
                              onClick={() => setEditingNote(note)}
                            >
                              <div className="flex items-center gap-2">
                                <h3 className="font-medium text-sm truncate flex-1">{note.title || "Senza titolo"}</h3>
                              </div>
                              <p className="text-xs text-muted-foreground truncate mt-1">{note.content}</p>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-12 px-4">
                        <Trash2 className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                        <p className="text-sm text-muted-foreground">Cestino vuoto</p>
                      </div>
                    )}
                  </>
                ) : activeTab === "wiki" && !selectedWikiFolder ? (
                  /* Nel tab Wiki senza cartella selezionata: mostra solo messaggio */
                  <div className="text-center py-12 px-4">
                    <Folder className="h-12 w-12 mx-auto text-cyan-500/50 mb-3" />
                    <p className="text-sm font-medium text-foreground mb-1">Seleziona una cartella</p>
                    <p className="text-xs text-muted-foreground">
                      Clicca su una cartella per visualizzare i documenti
                    </p>
                  </div>
                ) : (
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    {pinnedNotes.length > 0 && (
                      <div>
                        <div className="px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase flex items-center gap-1">
                          <Pin className="h-3 w-3" /> Fissate
                        </div>
                        <SortableContext items={pinnedNotes.map(n => n.id)} strategy={rectSortingStrategy}>
                          <div className="divide-y">
                            {pinnedNotes.map(note => {
                              const colorStyle = NOTE_COLORS[note.color] || NOTE_COLORS.default;
                              const wikiInfo = parseWikiTitle(note.title);
                              return (
                                <div
                                  key={note.id}
                                  className={`p-3 cursor-pointer hover:bg-muted/50 transition-colors ${colorStyle.bg} ${editingNote?.id === note.id ? "ring-2 ring-amber-500 ring-inset" : ""}`}
                                  onClick={() => setEditingNote(note)}
                                >
                                  <div className="flex items-center gap-2">
                                    <Pin className="h-3 w-3 text-amber-600 fill-current flex-shrink-0" />
                                    <h3 className="font-medium text-sm truncate flex-1 flex items-center gap-1.5">
                                      {wikiInfo.isWiki ? (
                                        <>
                                          <span className="truncate">{wikiInfo.contact}</span>
                                          {wikiInfo.version && (
                                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 font-medium flex-shrink-0">
                                              {wikiInfo.version}
                                            </span>
                                          )}
                                        </>
                                      ) : (
                                        note.title || "Senza titolo"
                                      )}
                                    </h3>
                                  </div>
                                  {wikiInfo.isWiki ? (
                                    <div className="flex items-center gap-2 mt-1 pl-5">
                                      {wikiInfo.date && (
                                        <span className="text-[10px] text-muted-foreground">{wikiInfo.date}</span>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2 mt-1 pl-5">
                                      <p className="text-xs text-muted-foreground truncate flex-1">{note.content}</p>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </SortableContext>
                      </div>
                    )}

                    {otherNotes.length > 0 && (
                      <div>
                        {pinnedNotes.length > 0 && (
                          <div className="px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase">Altre</div>
                        )}
                        <SortableContext items={otherNotes.map(n => n.id)} strategy={rectSortingStrategy}>
                          <div className="divide-y">
                            {otherNotes.map(note => {
                              const colorStyle = NOTE_COLORS[note.color] || NOTE_COLORS.default;
                              const wikiInfo = parseWikiTitle(note.title);
                              return (
                                <div
                                  key={note.id}
                                  className={`p-3 cursor-pointer hover:bg-muted/50 transition-colors ${colorStyle.bg} ${editingNote?.id === note.id ? "ring-2 ring-amber-500 ring-inset" : ""}`}
                                  onClick={() => setEditingNote(note)}
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <h3 className="font-medium text-sm truncate flex items-center gap-1.5 flex-1">
                                      {wikiInfo.isWiki ? (
                                        <>
                                          <BookOpen className="h-3 w-3 text-cyan-600 flex-shrink-0" />
                                          <span className="truncate">{wikiInfo.contact}</span>
                                          {wikiInfo.version && (
                                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 font-medium flex-shrink-0">
                                              {wikiInfo.version}
                                            </span>
                                          )}
                                        </>
                                      ) : (
                                        <span className="truncate">{note.title || "Senza titolo"}</span>
                                      )}
                                      {note.reminder && <BellRing className="h-3 w-3 text-orange-500 flex-shrink-0" />}
                                    </h3>
                                    {wikiInfo.isWiki && activeTab === "wiki" && (
                                      <DropdownMenu open={moveToFolderOpen === note.id} onOpenChange={(open) => setMoveToFolderOpen(open ? note.id : null)}>
                                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                          <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0">
                                            <MoreVertical className="h-3 w-3" />
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-56" onClick={(e) => e.stopPropagation()}>
                                          <DropdownMenuItem className="text-xs" onClick={() => handleDuplicate(note)}>
                                            <Copy className="h-3 w-3 mr-2" /> Duplica qui
                                          </DropdownMenuItem>
                                          <DropdownMenuSeparator />
                                          <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground flex items-center gap-1">
                                            <Tag className="h-3 w-3" /> Etichette:
                                          </div>
                                          {keepLabels.length > 0 ? (
                                            <div className="px-2 pb-2 flex flex-wrap gap-1">
                                              {keepLabels.map(label => {
                                                const isAssigned = note.labels?.includes(label.id);
                                                return (
                                                  <button
                                                    key={label.id}
                                                    onClick={() => toggleLabelOnNote(note.id, label.id)}
                                                    className={`text-[9px] px-2 py-1 rounded-full font-medium transition-all ${isAssigned
                                                      ? "text-white ring-2 ring-offset-1 ring-black/20"
                                                      : "text-white/70 opacity-50 hover:opacity-100"
                                                      }`}
                                                    style={{ backgroundColor: label.color }}
                                                  >
                                                    {isAssigned && <Check className="h-2 w-2 inline mr-0.5" />}
                                                    {label.name}
                                                  </button>
                                                );
                                              })}
                                            </div>
                                          ) : (
                                            <div className="px-2 py-1 text-[10px] text-muted-foreground">
                                              Nessuna etichetta
                                            </div>
                                          )}
                                          <DropdownMenuItem
                                            className="text-xs text-cyan-600"
                                            onClick={() => setLabelDialogOpen(true)}
                                          >
                                            <Plus className="h-3 w-3 mr-2" /> Gestisci etichette
                                          </DropdownMenuItem>
                                          <DropdownMenuSeparator />
                                          <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground">Copia in:</div>
                                          {availableWikiFolders.filter(f => f !== wikiInfo.contact).map(folder => (
                                            <DropdownMenuItem key={`copy-${folder}`} className="text-xs" onClick={() => handleCopyToFolder(note, folder)}>
                                              <Copy className="h-3 w-3 mr-2 text-green-600" /> {folder}
                                            </DropdownMenuItem>
                                          ))}
                                          <DropdownMenuSeparator />
                                          <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground">Sposta in:</div>
                                          {availableWikiFolders.filter(f => f !== wikiInfo.contact).map(folder => (
                                            <DropdownMenuItem key={`move-${folder}`} className="text-xs" onClick={() => handleMoveToFolder(note, folder)}>
                                              <FolderInput className="h-3 w-3 mr-2 text-blue-600" /> {folder}
                                            </DropdownMenuItem>
                                          ))}
                                          <DropdownMenuSeparator />
                                          <DropdownMenuItem className="text-xs text-red-600" onClick={() => softDeleteMutation.mutate(note.id)}>
                                            <Trash2 className="h-3 w-3 mr-2" /> Elimina
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    )}
                                  </div>
                                  {wikiInfo.isWiki ? (
                                    <div className="flex flex-col gap-1 mt-1">
                                      <div className="flex items-center gap-2">
                                        {wikiInfo.date && (
                                          <span className="text-[10px] text-muted-foreground">{wikiInfo.date}</span>
                                        )}
                                      </div>
                                      {/* Etichette colorate */}
                                      {getNoteLabels(note).length > 0 && (
                                        <div className="flex flex-wrap gap-1">
                                          {getNoteLabels(note).map(label => (
                                            <span
                                              key={label.id}
                                              className="text-[9px] px-1.5 py-0.5 rounded-full text-white font-medium"
                                              style={{ backgroundColor: label.color }}
                                            >
                                              {label.name}
                                            </span>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2 mt-1">
                                      <p className="text-xs text-muted-foreground truncate flex-1">{note.content}</p>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </SortableContext>
                      </div>
                    )}

                    {displayNotes.length === 0 && (
                      <div className="text-center py-12 px-4">
                        <StickyNote className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                        <p className="text-sm text-muted-foreground">
                          {filterMode === "archived" ? "Nessuna nota archiviata" : "Nessuna nota"}
                        </p>
                      </div>
                    )}
                  </DndContext>
                )}
              </ScrollArea>
            </div>

            {/* Colonna destra - Visualizzazione/Modifica nota */}
            <div className="flex-1 flex flex-col">
              {editingNote ? (
                <>
                  <div className={`p-4 border-b flex items-center justify-between ${NOTE_COLORS[editingNote.color]?.bg || ""}`}>
                    <div className="flex items-center gap-2">
                      {editingNote.id ? (
                        <span className="text-xs text-muted-foreground">
                          Ultima modifica: {format(new Date(editingNote.updatedAt), "d MMM yyyy, HH:mm", { locale: it })}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground font-medium">Nuova nota</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {editingNote.id && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleTogglePin(editingNote)}
                            title={editingNote.pinned ? "Rimuovi fissaggio" : "Fissa"}
                          >
                            <Pin className={`h-4 w-4 ${editingNote.pinned ? "fill-current text-amber-600" : ""}`} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDuplicate(editingNote)}
                            title="Duplica"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleArchive(editingNote)}
                            title={editingNote.archived ? "Rimuovi da archivio" : "Archivia"}
                          >
                            <Archive className="h-4 w-4" />
                          </Button>

                          {/* Reminder controls */}
                          <Popover open={reminderPopoverOpen} onOpenChange={(open) => {
                            setReminderPopoverOpen(open);
                            if (open && !editingNote.reminder) {
                              const now = new Date();
                              setReminderDate(now.toISOString().split('T')[0]);
                              const hours = now.getHours().toString().padStart(2, '0');
                              const minutes = now.getMinutes().toString().padStart(2, '0');
                              setReminderTime(`${hours}:${minutes}`);
                            }
                          }}>
                            <PopoverTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                title={editingNote.reminder ? `Promemoria: ${format(new Date(editingNote.reminder), "d MMM yyyy HH:mm", { locale: it })}` : "Imposta promemoria"}
                                className={editingNote.reminder ? "text-orange-500" : ""}
                              >
                                {editingNote.reminder ? (
                                  <BellRing className="h-4 w-4 fill-current" />
                                ) : (
                                  <Bell className="h-4 w-4" />
                                )}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-72 p-3" align="end">
                              <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm font-medium">Promemoria</span>
                                </div>

                                {editingNote.reminder && (
                                  <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded-md text-xs">
                                    <span className="text-orange-600 dark:text-orange-400">
                                      Attivo: {format(new Date(editingNote.reminder), "d MMMM yyyy 'alle' HH:mm", { locale: it })}
                                    </span>
                                  </div>
                                )}

                                <div className="space-y-2">
                                  <Label className="text-xs">Data</Label>
                                  <Input
                                    type="date"
                                    value={reminderDate}
                                    onChange={(e) => setReminderDate(e.target.value)}
                                    min={new Date().toISOString().split('T')[0]}
                                    className="h-8 text-sm"
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label className="text-xs">Ora</Label>
                                  <Input
                                    type="time"
                                    value={reminderTime}
                                    onChange={(e) => setReminderTime(e.target.value)}
                                    className="h-8 text-sm"
                                  />
                                </div>

                                <div className="flex gap-2">
                                  {editingNote.reminder && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="flex-1 text-red-500"
                                      onClick={handleRemoveReminder}
                                    >
                                      Rimuovi
                                    </Button>
                                  )}
                                  <Button
                                    size="sm"
                                    className="flex-1"
                                    onClick={handleSetReminder}
                                    disabled={!reminderDate}
                                  >
                                    {editingNote.reminder ? "Aggiorna" : "Imposta"}
                                  </Button>
                                </div>
                              </div>
                            </PopoverContent>
                          </Popover>

                          {/* Wiki controls: Book viewer + Audio TTS */}
                          {editingNote.title?.startsWith("Wiki:") && (
                            <div className="flex items-center gap-1 border-l pl-2 ml-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setBookViewerOpen(true)}
                                title="Leggi come libro"
                                className="text-amber-600"
                              >
                                <Book className="h-4 w-4" />
                              </Button>
                              {!audioUrl ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={handleGenerateAudio}
                                  disabled={isGeneratingAudio}
                                  title="Leggi ad alta voce"
                                  className="text-cyan-600"
                                >
                                  {isGeneratingAudio ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Volume2 className="h-4 w-4" />
                                  )}
                                </Button>
                              ) : (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handlePlayPause}
                                    title={isPlaying ? "Pausa" : "Riproduci"}
                                    className="text-cyan-600"
                                  >
                                    {isPlaying ? (
                                      <Pause className="h-4 w-4" />
                                    ) : (
                                      <Volume2 className="h-4 w-4" />
                                    )}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleStopAudio}
                                    title="Stop"
                                  >
                                    <Square className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleDownloadAudio}
                                    title="Scarica audio"
                                    className="text-green-600"
                                  >
                                    <Download className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          )}

                          {filterMode === "trash" ? (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => restoreMutation.mutate(editingNote.id)}
                                className="text-green-600"
                                title="Ripristina"
                              >
                                <RotateCcw className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleConfirmPermanentDelete(editingNote)}
                                className="text-red-500"
                                title="Elimina definitivamente"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMoveToTrash(editingNote)}
                              className="text-red-500"
                              title="Cestina"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  <ScrollArea className={`flex-1 ${NOTE_COLORS[editingNote.color]?.bg || ""}`}>
                    <div className="p-6 space-y-4">
                      <Input
                        placeholder="Titolo"
                        value={editingNote.title || ""}
                        onChange={(e) => setEditingNote({ ...editingNote, title: e.target.value })}
                        className={`text-xl font-semibold border-none focus-visible:ring-0 px-0 transition-colors ${!editingNote.id
                          ? "bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 pl-3 py-2 rounded-r-md shadow-sm"
                          : "bg-transparent"
                          }`}
                      />

                      <Textarea
                        placeholder="Scrivi la tua nota..."
                        value={editingNote.content || ""}
                        onChange={(e) => setEditingNote({ ...editingNote, content: e.target.value })}
                        className="min-h-[400px] resize-none border-none focus-visible:ring-0 px-0 bg-transparent text-sm"
                      />
                    </div>
                  </ScrollArea>

                  <div className={`p-4 border-t flex items-center gap-3 ${NOTE_COLORS[editingNote.color]?.bg || ""}`}>
                    <div className="flex gap-1 flex-wrap">
                      {Object.entries(NOTE_COLORS).map(([key, value]) => (
                        <button
                          key={key}
                          onClick={() => setEditingNote({ ...editingNote, color: key })}
                          className={`w-6 h-6 rounded-full ${value.selector} border border-gray-300 transition-transform hover:scale-110 ${editingNote.color === key ? "ring-2 ring-offset-1 ring-amber-500" : ""
                            }`}
                          title={value.name}
                        />
                      ))}
                    </div>
                    <div className="flex-1" />
                    <Button
                      variant="outline"
                      onClick={() => setEditingNote(null)}
                    >
                      Annulla
                    </Button>
                    <Button
                      onClick={() => {
                        if (editingNote.id) {
                          handleUpdateNote();
                        } else {
                          handleCreateNote();
                        }
                      }}
                      disabled={(!editingNote.title?.trim() && !editingNote.content?.trim()) || updateMutation.isPending || createMutation.isPending || !!saveSuccess}
                      className={`gap-2 transition-all duration-300 ${saveSuccess
                        ? "bg-green-600 hover:bg-green-600 text-white"
                        : "bg-primary hover:bg-primary/90"
                        }`}
                    >
                      {(updateMutation.isPending || createMutation.isPending) ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : saveSuccess ? (
                        <Check className="h-4 w-4 mr-2" />
                      ) : null}
                      {saveSuccess ? (saveSuccess === "update" ? "Salvata!" : "Creata!") : editingNote.id ? "Salva" : "Crea Nota"}
                    </Button>

                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <StickyNote className="h-16 w-16 mx-auto mb-4 opacity-30" />
                    <p className="text-lg">Seleziona una nota</p>
                    <p className="text-sm opacity-70">oppure creane una nuova</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Hidden audio element for TTS playback */}
      <audio
        ref={audioRef}
        onEnded={() => setIsPlaying(false)}
        className="hidden"
      />

      {/* Book Viewer for Wiki notes */}
      {
        bookViewerOpen && editingNote && (
          <BookViewer
            title={editingNote.title || "Wiki"}
            content={editingNote.content || ""}
            onClose={() => setBookViewerOpen(false)}
          />
        )
      }

      {/* Dialog per rinominare cartella */}
      <Dialog open={renameFolderDialog.open} onOpenChange={(open) => setRenameFolderDialog({ ...renameFolderDialog, open })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5 text-cyan-600" />
              Rinomina Cartella
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm">Nuovo nome cartella</Label>
              <Input
                placeholder="Nome cartella..."
                value={newFolderNameInput}
                onChange={(e) => setNewFolderNameInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleRenameFolder()}
              />
              <p className="text-xs text-muted-foreground">
                Tutti i documenti della cartella "{renameFolderDialog.folderName}" saranno rinominati.
              </p>
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setRenameFolderDialog({ open: false, folderName: "" })}>
                Annulla
              </Button>
              <Button
                onClick={handleRenameFolder}
                disabled={!newFolderNameInput.trim() || newFolderNameInput === renameFolderDialog.folderName}
                className="bg-cyan-600 hover:bg-cyan-700"
              >
                Rinomina
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog per gestire le etichette */}
      <Dialog open={labelDialogOpen} onOpenChange={setLabelDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5 text-cyan-600" />
              Gestione Etichette
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Crea nuova etichetta */}
            <div className="flex gap-2">
              <Input
                placeholder="Nome etichetta..."
                value={newLabelName}
                onChange={(e) => setNewLabelName(e.target.value)}
                className="flex-1"
                onKeyDown={(e) => e.key === "Enter" && handleCreateLabel()}
              />
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-10 h-10 p-0"
                    style={{ backgroundColor: newLabelColor }}
                  >
                    <span className="sr-only">Colore</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-2">
                  <div className="grid grid-cols-3 gap-1">
                    {LABEL_COLORS.map(color => (
                      <button
                        key={color.value}
                        onClick={() => setNewLabelColor(color.value)}
                        className={`w-8 h-8 rounded-full transition-transform hover:scale-110 ${newLabelColor === color.value ? "ring-2 ring-offset-2 ring-black/50" : ""
                          }`}
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                      />
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
              <Button
                onClick={handleCreateLabel}
                disabled={!newLabelName.trim() || createLabelMutation.isPending}
                className="bg-cyan-600 hover:bg-cyan-700"
              >
                {createLabelMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Lista etichette esistenti */}
            <div className="border rounded-lg divide-y max-h-[300px] overflow-y-auto">
              {keepLabels.length > 0 ? (
                keepLabels.map(label => (
                  <div key={label.id} className="flex items-center justify-between p-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: label.color }}
                      />
                      <span className="text-sm font-medium">{label.name}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteLabelMutation.mutate(label.id)}
                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      disabled={deleteLabelMutation.isPending}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-muted-foreground text-sm">
                  Nessuna etichetta creata
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout >
  );
}
