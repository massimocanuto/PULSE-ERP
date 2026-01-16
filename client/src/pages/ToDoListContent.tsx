import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  CheckSquare, Plus, Trash2, Calendar, Flag, Clock,
  Loader2, Star, Filter, Search, Edit2, X, Check, BarChart3, CalendarDays, FolderOpen, Mail,
  Repeat, Bell, Link2, Timer, LayoutGrid, List, Play, Pause, Square, RotateCcw, ChevronDown, ChevronRight,
  FileText, Save, Copy, Hourglass, Mountain, Trophy, Circle, Share2, CalendarPlus
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, getWeek } from "date-fns";
import { it } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const MOUNTAIN_COLORS = ["#EF4444", "#F59E0B", "#06B6D4", "#3B82F6", "#8B5CF6"];

function ToDoMountain({ tasks }: { tasks: { id: string; title: string; completed: boolean; dueDate?: string }[] }) {
  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.dueDate && b.dueDate) return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;
    return a.title.localeCompare(b.title);
  });

  const totalTasks = sortedTasks.length;
  const completedTasks = sortedTasks.filter(t => t.completed).length;
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  const displayTasks = sortedTasks.slice(0, 5);
  const numTiers = displayTasks.length;

  if (totalTasks === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground text-sm">
        <Mountain className="h-8 w-8 mx-auto mb-2 opacity-30" />
        Nessuna attività per oggi
      </div>
    );
  }

  const tierHeight = 26;
  const baseY = 160;
  const peakY = baseY - (numTiers * tierHeight);

  return (
    <div className="relative">
      <svg viewBox="0 0 240 180" className="w-full" style={{ height: '180px' }}>
        <defs>
          <linearGradient id="todoBgGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#94a3b8" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#cbd5e1" stopOpacity="0.2" />
          </linearGradient>
          <filter id="todoShadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="1" dy="1" stdDeviation="1" floodOpacity="0.15" />
          </filter>
        </defs>

        <polygon
          points={`30,${baseY} 120,${Math.max(peakY - 20, 20)} 210,${baseY}`}
          fill="url(#todoBgGradient)"
        />

        {[...displayTasks].reverse().map((task, reverseIndex) => {
          const index = numTiers - 1 - reverseIndex;
          const startY = baseY - (index * tierHeight);
          const endY = startY - tierHeight;
          const midY = startY - tierHeight / 2;

          const mountainHeight = baseY - (peakY - 20);
          const getXAtY = (y: number) => {
            const ratio = (baseY - y) / mountainHeight;
            const halfWidth = 90 * (1 - ratio * 0.9);
            return 120 - halfWidth;
          };

          const x1 = getXAtY(startY);
          const x2 = getXAtY(endY);
          const width1 = (120 - x1) * 2;
          const width2 = (120 - x2) * 2;
          const centerX = 120;

          const colorIndex = index % MOUNTAIN_COLORS.length;
          const opacity = task.completed ? 1 : 0.4;

          return (
            <g key={task.id}>
              <polygon
                points={`${x1},${startY} ${x1 + width1},${startY} ${x2 + width2},${endY} ${x2},${endY}`}
                fill={MOUNTAIN_COLORS[colorIndex]}
                opacity={opacity}
                filter="url(#todoShadow)"
                className="transition-opacity duration-300"
              />
              <text
                x={centerX}
                y={midY + 4}
                textAnchor="middle"
                fill="white"
                fontSize="10"
                fontWeight="bold"
              >
                {String(index + 1).padStart(2, '0')}
              </text>
              {task.completed && (
                <g transform={`translate(${Math.min(x1 + width1 + 12, 170)}, ${midY})`}>
                  <circle r="7" fill="#22c55e" />
                  <path d="M-3,0 L-1,3 L4,-3" stroke="white" strokeWidth="2" fill="none" />
                </g>
              )}
            </g>
          );
        })}

        {progress >= 100 && (
          <g transform={`translate(120, ${peakY - 25})`}>
            <polygon points="0,-8 5,0 0,16 -5,0" fill="#EF4444" />
            <rect x="-2" y="-16" width="4" height="12" fill="#8B4513" />
          </g>
        )}
      </svg>

      {progress >= 100 && (
        <div className="flex items-center justify-center gap-1 text-yellow-600 text-xs font-medium py-1">
          <Trophy className="h-4 w-4" />
          Vetta raggiunta!
        </div>
      )}

      <div className="text-center mt-2 border-t pt-2">
        <div className="text-lg font-bold text-foreground">{Math.round(progress)}%</div>
        <div className="text-xs text-muted-foreground">
          {completedTasks}/{totalTasks} completate
        </div>
      </div>
    </div>
  );
}

interface Subtask {
  id: string;
  todoId: string;
  title: string;
  completed: boolean;
  order: number;
}

interface PersonalTodo {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: "low" | "medium" | "high";
  dueDate?: string;
  category?: string;
  starred: boolean;
  projectId?: string;
  recurrenceType?: string;
  recurrenceEndDate?: string;
  reminderBefore?: number;
  reminderSent?: boolean;
  dependsOn?: string[];
  pomodoroSessions?: number;
  pomodoroMinutes?: number;
  orderIndex?: number;
  createdAt: string;
}

interface Project {
  id: string;
  title: string;
}

interface TodoTemplate {
  id: string;
  name: string;
  description?: string;
  priority: string;
  category?: string;
  estimatedMinutes?: number;
  recurrenceType?: string;
  reminderBefore?: number;
}

interface TimeEntry {
  id: string;
  todoId?: string;
  projectId?: string;
  description?: string;
  startTime: string;
  endTime?: string;
  durationMinutes?: number;
}

const RECURRENCE_OPTIONS = [
  { value: "none", label: "Nessuna" },
  { value: "daily", label: "Giornaliera" },
  { value: "weekly", label: "Settimanale" },
  { value: "biweekly", label: "Ogni 2 settimane" },
  { value: "monthly", label: "Mensile" },
];

const REMINDER_OPTIONS = [
  { value: 0, label: "Nessun promemoria" },
  { value: 15, label: "15 minuti prima" },
  { value: 30, label: "30 minuti prima" },
  { value: 60, label: "1 ora prima" },
  { value: 1440, label: "1 giorno prima" },
  { value: 10080, label: "1 settimana prima" },
];

const API_BASE = "/api";

const PREDEFINED_CATEGORIES = [
  { value: "lavoro", label: "Lavoro", icon: "briefcase" },
  { value: "personale", label: "Personale", icon: "user" },
  { value: "casa", label: "Casa", icon: "home" },
  { value: "famiglia", label: "Famiglia", icon: "users" },
  { value: "salute", label: "Salute", icon: "heart" },
  { value: "finanze", label: "Finanze", icon: "wallet" },
  { value: "studio", label: "Studio", icon: "book" },
  { value: "shopping", label: "Shopping", icon: "cart" },
  { value: "viaggi", label: "Viaggi", icon: "plane" },
  { value: "altro", label: "Altro", icon: "tag" },
];

const projectsApi = {
  getAll: async (): Promise<Project[]> => {
    const res = await fetch(`${API_BASE}/projects`, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to fetch projects");
    return res.json();
  },
};

const todosApi = {
  getAll: async (userId?: string): Promise<PersonalTodo[]> => {
    const params = new URLSearchParams({ _t: Date.now().toString() });
    if (userId) params.append("userId", userId);
    const res = await fetch(`${API_BASE}/personal-todos?${params.toString()}`, {
      cache: "no-store",
      credentials: "include",
      headers: { "Cache-Control": "no-cache" }
    });
    if (!res.ok) throw new Error("Failed to fetch todos");
    return res.json();
  },
  create: async (data: Partial<PersonalTodo> & { userId?: string }): Promise<PersonalTodo> => {
    const res = await fetch(`${API_BASE}/personal-todos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create todo");
    return res.json();
  },
  update: async (id: string, data: Partial<PersonalTodo>): Promise<PersonalTodo> => {
    const res = await fetch(`${API_BASE}/personal-todos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to update todo");
    return res.json();
  },
  delete: async (id: string): Promise<void> => {
    const res = await fetch(`${API_BASE}/personal-todos/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to delete todo");
  },
};

const subtasksApi = {
  getAll: async (todoId: string): Promise<Subtask[]> => {
    const res = await fetch(`${API_BASE}/personal-todos/${todoId}/subtasks`);
    if (!res.ok) throw new Error("Failed to fetch subtasks");
    return res.json();
  },
  create: async (todoId: string, title: string): Promise<Subtask> => {
    const res = await fetch(`${API_BASE}/personal-todos/${todoId}/subtasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    if (!res.ok) throw new Error("Failed to create subtask");
    return res.json();
  },
  update: async (id: string, data: Partial<Subtask>): Promise<Subtask> => {
    const res = await fetch(`${API_BASE}/subtasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to update subtask");
    return res.json();
  },
  delete: async (id: string): Promise<void> => {
    const res = await fetch(`${API_BASE}/subtasks/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to delete subtask");
  },
};

const templatesApi = {
  getAll: async (): Promise<TodoTemplate[]> => {
    const res = await fetch(`${API_BASE}/todo-templates`, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to fetch templates");
    return res.json();
  },
  create: async (data: Partial<TodoTemplate>): Promise<TodoTemplate> => {
    const res = await fetch(`${API_BASE}/todo-templates`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create template");
    return res.json();
  },
  delete: async (id: string): Promise<void> => {
    const res = await fetch(`${API_BASE}/todo-templates/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to delete template");
  },
};

const timeEntriesApi = {
  getByTodo: async (todoId: string): Promise<TimeEntry[]> => {
    const res = await fetch(`${API_BASE}/time-entries/todo/${todoId}`);
    if (!res.ok) throw new Error("Failed to fetch time entries");
    return res.json();
  },
  create: async (data: Partial<TimeEntry>): Promise<TimeEntry> => {
    const res = await fetch(`${API_BASE}/time-entries`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create time entry");
    return res.json();
  },
  update: async (id: string, data: Partial<TimeEntry>): Promise<TimeEntry> => {
    const res = await fetch(`${API_BASE}/time-entries/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to update time entry");
    return res.json();
  },
};

export function ToDoListContent() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [showCompleted, setShowCompleted] = useState(true);
  const [newTodoDialogOpen, setNewTodoDialogOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState<PersonalTodo | null>(null);
  const [planningOpen, setPlanningOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; title: string; countdown: number } | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const [emailDialog, setEmailDialog] = useState<{ todo: PersonalTodo; recipientEmail: string } | null>(null);
  const [sendingEmail, setSendingEmail] = useState(false);

  const [viewMode, setViewMode] = useState<"list" | "kanban" | "calendar">("kanban");
  const [selectedCalendarId, setSelectedCalendarId] = useState<string>("primary");
  const [calendarSelectorOpen, setCalendarSelectorOpen] = useState(false);
  const [expandedTodos, setExpandedTodos] = useState<Set<string>>(new Set());
  const [pomodoroActive, setPomodoroActive] = useState<string | null>(null);
  const [pomodoroTime, setPomodoroTime] = useState(25 * 60);
  const [pomodoroRunning, setPomodoroRunning] = useState(false);
  const pomodoroRef = useRef<NodeJS.Timeout | null>(null);

  const [newTodo, setNewTodo] = useState({
    title: "",
    description: "",
    priority: "medium" as "low" | "medium" | "high",
    dueDate: "",
    category: "",
    projectId: "",
    recurrenceType: "none",
    reminderBefore: 0,
    dependsOn: [] as string[],
    calendarId: "primary",
  });

  const { data: todos = [], isLoading, refetch } = useQuery({
    queryKey: ["personal-todos", user?.id],
    queryFn: () => todosApi.getAll(user?.id),
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    enabled: !!user?.id,
  });

  useEffect(() => {
    refetch();
  }, [refetch]);

  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: projectsApi.getAll,
  });

  const { data: templates = [] } = useQuery({
    queryKey: ["todo-templates"],
    queryFn: templatesApi.getAll,
  });

  const { data: calendarConnected } = useQuery({
    queryKey: ["calendar-connected"],
    queryFn: async () => {
      const res = await fetch("/api/calendar/status");
      if (!res.ok) return false;
      const data = await res.json();
      return data.connected;
    },
  });

  const { data: googleCalendarList = [] } = useQuery({
    queryKey: ["google-calendar-list"],
    queryFn: async () => {
      const res = await fetch("/api/calendar/list");
      if (!res.ok) return [];
      const data = await res.json();
      return data.calendars || [];
    },
    enabled: !!calendarConnected,
  });

  const calendarToday = new Date();
  const firstOfMonth = new Date(calendarToday.getFullYear(), calendarToday.getMonth(), 1);
  const lastOfMonth = new Date(calendarToday.getFullYear(), calendarToday.getMonth() + 1, 0);

  const { data: googleCalendarEvents = [] } = useQuery({
    queryKey: ["google-calendar-events", selectedCalendarId, format(firstOfMonth, "yyyy-MM-dd"), format(lastOfMonth, "yyyy-MM-dd")],
    queryFn: async () => {
      const res = await fetch(`/api/calendar/events-range?calendarId=${encodeURIComponent(selectedCalendarId)}&startDate=${format(firstOfMonth, "yyyy-MM-dd")}&endDate=${format(lastOfMonth, "yyyy-MM-dd")}`);
      if (!res.ok) return [];
      const data = await res.json();
      return data.events || [];
    },
    enabled: !!calendarConnected,
  });

  const createTemplateMutation = useMutation({
    mutationFn: templatesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["todo-templates"] });
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: templatesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["todo-templates"] });
    },
  });

  const [activeTimeEntry, setActiveTimeEntry] = useState<{ todoId: string; entryId: string; startTime: Date } | null>(null);
  const [trackingElapsed, setTrackingElapsed] = useState(0);
  const trackingRef = useRef<NodeJS.Timeout | null>(null);

  const createTimeEntryMutation = useMutation({
    mutationFn: timeEntriesApi.create,
  });

  const updateTimeEntryMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TimeEntry> }) => timeEntriesApi.update(id, data),
  });

  useEffect(() => {
    if (activeTimeEntry) {
      trackingRef.current = setInterval(() => {
        setTrackingElapsed(Math.floor((Date.now() - activeTimeEntry.startTime.getTime()) / 1000));
      }, 1000);
    } else {
      if (trackingRef.current) clearInterval(trackingRef.current);
      setTrackingElapsed(0);
    }
    return () => {
      if (trackingRef.current) clearInterval(trackingRef.current);
    };
  }, [activeTimeEntry]);

  const startTimeTracking = async (todoId: string) => {
    const entry = await createTimeEntryMutation.mutateAsync({
      todoId,
      startTime: new Date().toISOString(),
    });
    setActiveTimeEntry({ todoId, entryId: entry.id, startTime: new Date() });
  };

  const stopTimeTracking = async () => {
    if (activeTimeEntry) {
      const endTime = new Date();
      const durationMinutes = Math.floor((endTime.getTime() - activeTimeEntry.startTime.getTime()) / 60000);
      await updateTimeEntryMutation.mutateAsync({
        id: activeTimeEntry.entryId,
        data: { endTime: endTime.toISOString(), durationMinutes },
      });
      setActiveTimeEntry(null);
    }
  };

  const applyTemplate = (template: TodoTemplate) => {
    setNewTodo({
      ...newTodo,
      title: "",
      description: template.description || "",
      priority: template.priority as "low" | "medium" | "high",
      category: template.category || "",
      recurrenceType: template.recurrenceType || "none",
      reminderBefore: template.reminderBefore || 0,
    });
  };

  const saveAsTemplate = (todo: PersonalTodo) => {
    const name = prompt("Nome del template:");
    if (name) {
      createTemplateMutation.mutate({
        name,
        description: todo.description,
        priority: todo.priority,
        category: todo.category,
        recurrenceType: todo.recurrenceType,
        reminderBefore: todo.reminderBefore,
      });
    }
  };

  const createMutation = useMutation({
    mutationFn: todosApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["personal-todos"] });
      setNewTodoDialogOpen(false);
      setNewTodo({ title: "", description: "", priority: "medium", dueDate: "", category: "", projectId: "", recurrenceType: "none", reminderBefore: 0, dependsOn: [], calendarId: "primary" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<PersonalTodo> }) => todosApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["personal-todos"] });
      setEditingTodo(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: todosApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["personal-todos"] });
    },
  });

  const handleCreateTodo = async () => {
    if (newTodo.title.trim() && newTodo.dueDate) {
      const { calendarId, ...todoData } = newTodo;
      createMutation.mutate({
        title: todoData.title,
        description: todoData.description || undefined,
        priority: todoData.priority,
        dueDate: todoData.dueDate,
        category: todoData.category || undefined,
        projectId: todoData.projectId || undefined,
        recurrenceType: todoData.recurrenceType === "none" ? undefined : todoData.recurrenceType,
        reminderBefore: todoData.reminderBefore || undefined,
        dependsOn: todoData.dependsOn.length > 0 ? todoData.dependsOn : undefined,
        completed: false,
        starred: false,
        userId: user?.id,
      }, {
        onSuccess: async (createdTodo) => {
          if (calendarConnected && newTodo.calendarId) {
            try {
              await fetch("/api/calendar/sync-personal-todo", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  todoId: createdTodo.id,
                  calendarId: newTodo.calendarId,
                }),
              });
            } catch (e) {
              console.error("Failed to sync to calendar:", e);
            }
          }
        },
      });
    }
  };

  const toggleExpandTodo = (todoId: string) => {
    setExpandedTodos(prev => {
      const next = new Set(prev);
      if (next.has(todoId)) {
        next.delete(todoId);
      } else {
        next.add(todoId);
      }
      return next;
    });
  };

  const startPomodoro = (todoId: string) => {
    setPomodoroActive(todoId);
    setPomodoroTime(25 * 60);
    setPomodoroRunning(true);
  };

  const pausePomodoro = () => {
    setPomodoroRunning(false);
  };

  const resumePomodoro = () => {
    setPomodoroRunning(true);
  };

  const resetPomodoro = () => {
    setPomodoroRunning(false);
    setPomodoroTime(25 * 60);
  };

  const stopPomodoro = () => {
    if (pomodoroActive && pomodoroTime < 25 * 60) {
      const minutesWorked = Math.floor((25 * 60 - pomodoroTime) / 60);
      if (minutesWorked > 0) {
        const todo = todos.find(t => t.id === pomodoroActive);
        if (todo) {
          updateMutation.mutate({
            id: pomodoroActive,
            data: {
              pomodoroSessions: (todo.pomodoroSessions || 0) + 1,
              pomodoroMinutes: (todo.pomodoroMinutes || 0) + minutesWorked,
            },
          });
        }
      }
    }
    setPomodoroActive(null);
    setPomodoroRunning(false);
    setPomodoroTime(25 * 60);
  };

  useEffect(() => {
    if (pomodoroRunning && pomodoroTime > 0) {
      pomodoroRef.current = setInterval(() => {
        setPomodoroTime(prev => {
          if (prev <= 1) {
            setPomodoroRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (pomodoroRef.current) {
        clearInterval(pomodoroRef.current);
      }
    };
  }, [pomodoroRunning]);

  const formatPomodoroTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const canStartTodo = (todo: PersonalTodo) => {
    const dependsOn = Array.isArray(todo.dependsOn) ? todo.dependsOn : [];
    if (dependsOn.length === 0) return true;
    return dependsOn.every(depId => {
      const depTodo = todos.find(t => t.id === depId);
      return depTodo?.completed;
    });
  };

  const handleToggleComplete = (todo: PersonalTodo) => {
    if (!todo.completed && !canStartTodo(todo)) {
      return;
    }
    updateMutation.mutate({ id: todo.id, data: { completed: !todo.completed } });
  };

  const handleToggleStar = (todo: PersonalTodo) => {
    updateMutation.mutate({ id: todo.id, data: { starred: !todo.starred } });
  };

  const handleDeleteTodo = (id: string, title: string) => {
    setDeleteConfirm({ id, title, countdown: 5 });
  };

  const handleSyncToCalendar = async (todo: PersonalTodo) => {
    if (!todo.dueDate) {
      toast({
        title: "Data mancante",
        description: "Il todo deve avere una data di scadenza per essere sincronizzato con Google Calendar",
        variant: "destructive",
      });
      return;
    }

    try {
      const res = await fetch("/api/calendar/sync-personal-todo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          todoId: todo.id,
          calendarId: selectedCalendarId
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast({
          title: "Sincronizzato!",
          description: `Todo sincronizzato con Google Calendar${data.eventLink ? `. Link: ${data.eventLink}` : ''}`,
        });
      } else {
        toast({
          title: "Errore",
          description: data.error || "Errore nella sincronizzazione",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Sync error:", error);
      toast({
        title: "Errore di connessione",
        description: "Errore di connessione durante la sincronizzazione",
        variant: "destructive",
      });
    }
  };

  const confirmDelete = () => {
    if (deleteConfirm) {
      deleteMutation.mutate(deleteConfirm.id);
      cancelDelete();
    }
  };

  const cancelDelete = () => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    setDeleteConfirm(null);
  };

  const handleSendEmail = async () => {
    if (!emailDialog || !emailDialog.recipientEmail.trim()) return;

    setSendingEmail(true);
    try {
      const todo = emailDialog.todo;
      const projectName = getProjectName(todo.projectId);
      const categoryLabel = todo.category ? (PREDEFINED_CATEGORIES.find(c => c.value === todo.category)?.label || todo.category) : null;

      const htmlBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #10b981; border-bottom: 2px solid #10b981; padding-bottom: 10px;">
            📋 Dettagli Attività
          </h2>
          <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
            <tr>
              <td style="padding: 10px; background: #f3f4f6; font-weight: bold; width: 30%;">Titolo</td>
              <td style="padding: 10px; border: 1px solid #e5e7eb;">${todo.title}</td>
            </tr>
            ${todo.description ? `
            <tr>
              <td style="padding: 10px; background: #f3f4f6; font-weight: bold;">Descrizione</td>
              <td style="padding: 10px; border: 1px solid #e5e7eb;">${todo.description}</td>
            </tr>` : ''}
            <tr>
              <td style="padding: 10px; background: #f3f4f6; font-weight: bold;">Priorità</td>
              <td style="padding: 10px; border: 1px solid #e5e7eb;">
                <span style="padding: 4px 8px; border-radius: 4px; background: ${todo.priority === 'high' ? '#fef2f2' : todo.priority === 'medium' ? '#fefce8' : '#f0fdf4'
        }; color: ${todo.priority === 'high' ? '#dc2626' : todo.priority === 'medium' ? '#ca8a04' : '#16a34a'
        };">
                  ${todo.priority === 'high' ? 'Alta' : todo.priority === 'medium' ? 'Media' : 'Bassa'}
                </span>
              </td>
            </tr>
            <tr>
              <td style="padding: 10px; background: #f3f4f6; font-weight: bold;">Scadenza</td>
              <td style="padding: 10px; border: 1px solid #e5e7eb;">${todo.dueDate ? format(new Date(todo.dueDate), (todo.dueDate.includes('T') || todo.dueDate.includes(':')) ? "d MMMM yyyy 'alle' HH:mm" : "d MMMM yyyy", { locale: it }) : 'Non specificata'}</td>
            </tr>
            ${categoryLabel ? `
            <tr>
              <td style="padding: 10px; background: #f3f4f6; font-weight: bold;">Categoria</td>
              <td style="padding: 10px; border: 1px solid #e5e7eb;">${categoryLabel}</td>
            </tr>` : ''}
            ${projectName ? `
            <tr>
              <td style="padding: 10px; background: #f3f4f6; font-weight: bold;">Progetto</td>
              <td style="padding: 10px; border: 1px solid #e5e7eb;">${projectName}</td>
            </tr>` : ''}
            <tr>
              <td style="padding: 10px; background: #f3f4f6; font-weight: bold;">Stato</td>
              <td style="padding: 10px; border: 1px solid #e5e7eb;">
                <span style="padding: 4px 8px; border-radius: 4px; background: ${todo.completed ? '#f0fdf4' : '#fef3c7'}; color: ${todo.completed ? '#16a34a' : '#d97706'};">
                  ${todo.completed ? 'Completata ✓' : 'Da fare'}
                </span>
              </td>
            </tr>
          </table>
          <p style="margin-top: 20px; color: #6b7280; font-size: 12px;">
            Inviato da PULSE ERP
          </p>
        </div>
      `;

      const res = await fetch('/api/aruba/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: emailDialog.recipientEmail,
          subject: `📋 Attività: ${todo.title}`,
          html: htmlBody,
        }),
      });

      if (!res.ok) throw new Error('Failed to send email');

      setEmailDialog(null);
      toast({
        title: "Successo",
        description: "Email inviata con successo!",
      });
    } catch (error) {
      toast({
        title: "Errore",
        description: "Errore nell'invio dell'email. Verifica la configurazione.",
        variant: "destructive",
      });
    } finally {
      setSendingEmail(false);
    }
  };

  useEffect(() => {
    if (deleteConfirm && deleteConfirm.countdown > 0) {
      countdownRef.current = setInterval(() => {
        setDeleteConfirm(prev => {
          if (!prev) return null;
          if (prev.countdown <= 1) {
            clearInterval(countdownRef.current!);
            countdownRef.current = null;
            return null;
          }
          return { ...prev, countdown: prev.countdown - 1 };
        });
      }, 1000);
    }
    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, [deleteConfirm?.id]);

  const categories = Array.from(new Set(todos.map((t) => t.category).filter(Boolean))) as string[];

  const filteredTodos = todos.filter((todo) => {
    const matchesSearch = todo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (todo.description || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPriority = filterPriority === "all" || todo.priority === filterPriority;
    const matchesCategory = filterCategory === "all" || todo.category === filterCategory;
    const matchesCompleted = showCompleted || !todo.completed;
    return matchesSearch && matchesPriority && matchesCategory && matchesCompleted;
  });

  const starredTodos = filteredTodos.filter((t) => t.starred && !t.completed);
  const pendingTodos = filteredTodos.filter((t) => !t.starred && !t.completed);
  const completedTodos = filteredTodos.filter((t) => t.completed);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-700 border-red-200";
      case "medium": return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "low": return "bg-green-100 text-green-700 border-green-200";
      default: return "bg-muted text-muted-foreground border-border";
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case "high": return "Alta";
      case "medium": return "Media";
      case "low": return "Bassa";
      default: return priority;
    }
  };

  const getCategoryLabel = (categoryValue?: string) => {
    if (!categoryValue) return null;
    const category = PREDEFINED_CATEGORIES.find(c => c.value === categoryValue);
    return category?.label || categoryValue;
  };

  const formatDate = (date: string) => {
    try {
      const d = new Date(date);
      if (date.includes('T') || date.includes(':')) {
        return format(d, "d MMM yyyy 'alle' HH:mm", { locale: it });
      }
      return format(d, "d MMM yyyy", { locale: it });
    } catch {
      return date;
    }
  };

  const isOverdue = (dueDate?: string) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  const isToday = (dueDate?: string) => {
    if (!dueDate) return false;
    const today = new Date();
    const date = new Date(dueDate);
    return date.toDateString() === today.toDateString();
  };

  const getDaysRemaining = (dueDate?: string) => {
    if (!dueDate) return null;
    const due = new Date(dueDate);
    if (isNaN(due.getTime())) return null; // Handle invalid date "TBD"

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getDaysLabel = (days: number | null) => {
    if (days === null || isNaN(days)) return null;
    if (days < 0) return `${Math.abs(days)} giorni fa`;
    if (days === 0) return "Oggi";
    if (days === 1) return "Domani";
    return `Tra ${days} giorni`;
  };

  const todayTodos = todos.filter((t) => isToday(t.dueDate));
  const sortedTodayTodos = [...todayTodos].sort((a, b) => {
    const dateA = a.dueDate ? new Date(a.dueDate).getTime() : 0;
    const dateB = b.dueDate ? new Date(b.dueDate).getTime() : 0;
    return dateB - dateA;
  });
  const allTodayCompleted = todayTodos.length > 0 && todayTodos.every((t) => t.completed);

  const priorityStats = [
    { name: "Alta", value: todos.filter(t => t.priority === "high" && !t.completed).length, color: "#ef4444" },
    { name: "Media", value: todos.filter(t => t.priority === "medium" && !t.completed).length, color: "#eab308" },
    { name: "Bassa", value: todos.filter(t => t.priority === "low" && !t.completed).length, color: "#22c55e" },
    { name: "Completate", value: todos.filter(t => t.completed).length, color: "#94a3b8" },
  ].filter(s => s.value > 0);

  const getNext7Days = () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const getTasksForDate = (date: Date) => {
    return todos.filter(t => {
      if (!t.dueDate || t.completed) return false;
      const taskDate = new Date(t.dueDate);
      return taskDate.toDateString() === date.toDateString();
    });
  };

  const getOverdueTasks = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return todos.filter(t => {
      if (!t.dueDate || t.completed) return false;
      const taskDate = new Date(t.dueDate);
      taskDate.setHours(0, 0, 0, 0);
      return taskDate < today;
    });
  };

  const formatDayName = (date: Date) => {
    const today = new Date();
    if (date.toDateString() === today.toDateString()) return "Oggi";
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (date.toDateString() === tomorrow.toDateString()) return "Domani";
    return format(date, "EEEE", { locale: it });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const getProjectName = (projectId?: string) => {
    if (!projectId) return null;
    const project = projects?.find(p => p.id === projectId);
    return project?.title;
  };

  const TodoItem = ({ todo }: { todo: PersonalTodo }) => {
    const isTaskOverdue = isOverdue(todo.dueDate) && !todo.completed;
    const daysRemaining = getDaysRemaining(todo.dueDate);
    const daysLabel = getDaysLabel(daysRemaining);
    const projectName = getProjectName(todo.projectId);
    const isBlocked = !canStartTodo(todo);
    const isPomodoroActive = pomodoroActive === todo.id;

    return (
      <div
        className={`flex items-start gap-2 p-4 rounded-lg border-2 transition-all hover:shadow-sm ${todo.completed
          ? "bg-muted/50 opacity-60 border"
          : isBlocked
            ? "border-border opacity-70"
            : isTaskOverdue
              ? "border-red-500 shadow-lg shadow-red-200"
              : isPomodoroActive
                ? "border-emerald-400 ring-2 ring-emerald-200"
                : todo.priority === "high"
                  ? "border-purple-200"
                  : todo.priority === "medium"
                    ? "border-yellow-200"
                    : "border-border"
          }`}
        style={
          isTaskOverdue
            ? {
              background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
              boxShadow: '0 0 15px rgba(239, 68, 68, 0.3), inset 0 0 0 1px rgba(239, 68, 68, 0.2)'
            }
            : todo.completed
              ? undefined
              : isPomodoroActive
                ? { background: '#ecfdf5' }
                : todo.priority === "high"
                  ? { background: '#f3e8ff' }
                  : todo.priority === "medium"
                    ? { background: '#fefce8' }
                    : { background: 'white' }
        }
      >
        <Checkbox
          checked={todo.completed}
          onCheckedChange={() => handleToggleComplete(todo)}
          className="mt-1"
          disabled={isBlocked}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`font-medium text-xs uppercase ${todo.completed ? "line-through text-muted-foreground" : ""}`}>
              {todo.title}
            </span>
            {todo.googleCalendarEventId && (
              <Badge variant="outline" className="text-xs bg-purple-50 text-purple-600 border-purple-200">
                <Calendar className="h-3 w-3 mr-1" />
                Google
              </Badge>
            )}
            {isBlocked && (
              <Badge variant="outline" className="text-xs bg-muted text-muted-foreground border-border">
                <Link2 className="h-3 w-3 mr-1" />
                Bloccata
              </Badge>
            )}
            {todo.recurrenceType && todo.recurrenceType !== "none" && (
              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-600 border-blue-200">
                <Repeat className="h-3 w-3 mr-1" />
                {RECURRENCE_OPTIONS.find(r => r.value === todo.recurrenceType)?.label || todo.recurrenceType}
              </Badge>
            )}
            {todo.category && (
              <Badge variant="secondary" className="text-xs">
                {getCategoryLabel(todo.category)}
              </Badge>
            )}
            {projectName && (
              <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                <FolderOpen className="h-3 w-3 mr-1" />
                {projectName}
              </Badge>
            )}
          </div>
          {todo.description && (
            <p className="text-xs text-muted-foreground mb-2">{todo.description}</p>
          )}
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium ${getPriorityColor(todo.priority)}`}>
              <Flag className="h-3 w-3" />
              {getPriorityLabel(todo.priority)}
            </div>
            {todo.dueDate && (
              <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium ${isTaskOverdue
                ? "bg-red-600 text-white"
                : daysRemaining === 0
                  ? "bg-orange-100 text-orange-700 border border-orange-200"
                  : daysRemaining === 1
                    ? "bg-yellow-100 text-yellow-700 border border-yellow-200"
                    : "bg-muted text-foreground border border-border"
                }`}>
                {isTaskOverdue ? (
                  <>
                    <X className="h-3 w-3" />
                    IN RITARDO
                  </>
                ) : (
                  <>
                    <Clock className="h-3 w-3" />
                    {daysLabel}
                  </>
                )}
              </div>
            )}
            {todo.dueDate && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {formatDate(todo.dueDate)}
              </div>
            )}
            {(todo.pomodoroSessions || 0) > 0 && (
              <div className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                <Timer className="h-3 w-3" />
                {todo.pomodoroSessions} sessioni ({todo.pomodoroMinutes || 0} min)
              </div>
            )}
          </div>
          {isPomodoroActive && (
            <div className="flex items-center gap-3 mt-3 p-2 bg-card rounded-lg border border-emerald-200">
              <div className="text-2xl font-mono font-bold text-emerald-600">
                {formatPomodoroTime(pomodoroTime)}
              </div>
              <div className="flex gap-1">
                {pomodoroRunning ? (
                  <Button size="sm" variant="outline" onClick={pausePomodoro}>
                    <Pause className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" onClick={resumePomodoro}>
                    <Play className="h-4 w-4" />
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={resetPomodoro}>
                  <RotateCcw className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" className="text-red-500" onClick={stopPomodoro}>
                  <Square className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1">
          {!isPomodoroActive && !todo.completed && !isBlocked && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => startPomodoro(todo.id)}
              className="text-emerald-600 hover:text-emerald-700"
              title="Avvia Pomodoro"
            >
              <Timer className="h-4 w-4" />
            </Button>
          )}
          {activeTimeEntry?.todoId === todo.id ? (
            <Button
              size="sm"
              variant="ghost"
              onClick={stopTimeTracking}
              className="text-red-500 hover:text-red-700"
              title={`Stop tracciamento (${Math.floor(trackingElapsed / 60)}:${(trackingElapsed % 60).toString().padStart(2, '0')})`}
            >
              <Hourglass className="h-4 w-4 animate-pulse" />
            </Button>
          ) : !todo.completed && !activeTimeEntry && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => startTimeTracking(todo.id)}
              className="text-indigo-500 hover:text-indigo-700"
              title="Traccia tempo"
            >
              <Hourglass className="h-4 w-4" />
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => saveAsTemplate(todo)}
            className="text-purple-500 hover:text-purple-700"
            title="Salva come template"
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleToggleStar(todo)}
            className={todo.starred ? "text-yellow-500" : "text-muted-foreground"}
          >
            <Star className={`h-4 w-4 ${todo.starred ? "fill-current" : ""}`} />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setEmailDialog({ todo, recipientEmail: '' })}
            className="text-blue-500 hover:text-blue-700"
            title="Invia per email"
          >
            <Mail className="h-4 w-4" />
          </Button>
          {calendarConnected && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleSyncToCalendar(todo)}
              className="text-purple-500 hover:text-purple-700"
              title="Sincronizza con Google Calendar"
            >
              <CalendarPlus className="h-4 w-4" />
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setEditingTodo(todo)}
          >
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleDeleteTodo(todo.id, todo.title)}
            className="text-red-500 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  const handleMoveToColumn = async (todo: PersonalTodo, targetColumn: "todo" | "inprogress" | "completed") => {
    let updates: Partial<PersonalTodo> = {};

    if (targetColumn === "todo") {
      updates = { starred: false, completed: false };
    } else if (targetColumn === "inprogress") {
      updates = { starred: true, completed: false };
    } else if (targetColumn === "completed") {
      updates = { completed: true };
    }

    try {
      await todosApi.update(todo.id, updates);
      queryClient.invalidateQueries({ queryKey: ["personal-todos"] });
    } catch (error) {
      console.error("Error updating todo:", error);
    }
  };

  const KanbanCard = ({ todo, currentColumn }: { todo: PersonalTodo; currentColumn: "todo" | "inprogress" | "completed" }) => {
    const isTaskOverdue = isOverdue(todo.dueDate) && !todo.completed;
    const daysRemaining = getDaysRemaining(todo.dueDate);
    const daysLabel = getDaysLabel(daysRemaining);
    const projectName = getProjectName(todo.projectId);
    const isBlocked = !canStartTodo(todo);
    const isPomodoroActive = pomodoroActive === todo.id;

    return (
      <div
        className={`p-3 rounded-lg border-2 transition-all hover:shadow-md ${todo.completed
          ? "bg-muted/50 opacity-60 border"
          : isBlocked
            ? "border-border opacity-70"
            : isTaskOverdue
              ? "border-red-500 shadow-lg shadow-red-200"
              : isPomodoroActive
                ? "border-emerald-400 ring-2 ring-emerald-200"
                : todo.priority === "high"
                  ? "border-purple-200"
                  : todo.priority === "medium"
                    ? "border-yellow-200"
                    : "border-border"
          }`}
        style={
          isTaskOverdue
            ? {
              background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
              boxShadow: '0 0 15px rgba(239, 68, 68, 0.3), inset 0 0 0 1px rgba(239, 68, 68, 0.2)'
            }
            : todo.completed
              ? undefined
              : isPomodoroActive
                ? { background: '#ecfdf5' }
                : todo.priority === "high"
                  ? { background: '#f3e8ff' }
                  : todo.priority === "medium"
                    ? { background: '#fefce8' }
                    : { background: 'white' }
        }
      >
        <div className="flex items-start gap-2 mb-2">
          <Checkbox
            checked={todo.completed}
            onCheckedChange={() => handleToggleComplete(todo)}
            className="mt-0.5"
            disabled={isBlocked}
          />
          <span
            className={`font-medium text-xs uppercase cursor-pointer hover:text-blue-600 flex-1 ${todo.completed ? "line-through text-muted-foreground" : ""}`}
            onClick={() => setEditingTodo(todo)}
          >
            {todo.title}
          </span>
          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${todo.priority === "high" ? "bg-purple-500" :
            todo.priority === "medium" ? "bg-yellow-500" : "bg-gray-400"
            }`} />
        </div>

        <div className="flex flex-wrap gap-1 mb-2">
          {isBlocked && (
            <Badge variant="outline" className="text-[10px] py-0 bg-muted text-muted-foreground border-border">
              <Link2 className="h-2.5 w-2.5 mr-0.5" />
              Bloccata
            </Badge>
          )}
          {todo.recurrenceType && todo.recurrenceType !== "none" && (
            <Badge variant="outline" className="text-[10px] py-0 bg-blue-50 text-blue-600 border-blue-200">
              <Repeat className="h-2.5 w-2.5 mr-0.5" />
              {RECURRENCE_OPTIONS.find(r => r.value === todo.recurrenceType)?.label?.split(' ')[0] || todo.recurrenceType}
            </Badge>
          )}
          {todo.category && (
            <Badge variant="secondary" className="text-[10px] py-0">
              {getCategoryLabel(todo.category)}
            </Badge>
          )}
          {projectName && (
            <Badge variant="outline" className="text-[10px] py-0 bg-purple-50 text-purple-700 border-purple-200">
              <FolderOpen className="h-2.5 w-2.5 mr-0.5" />
              {projectName}
            </Badge>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1 mb-2">
          <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${getPriorityColor(todo.priority)}`}>
            <Flag className="h-2.5 w-2.5" />
            {getPriorityLabel(todo.priority)}
          </div>
          {todo.dueDate && (
            <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${isTaskOverdue
              ? "bg-red-600 text-white"
              : daysRemaining === 0
                ? "bg-orange-100 text-orange-700"
                : daysRemaining === 1
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-muted text-foreground"
              }`}>
              {isTaskOverdue ? (
                <>
                  <X className="h-2.5 w-2.5" />
                  RITARDO
                </>
              ) : (
                <>
                  <Clock className="h-2.5 w-2.5" />
                  {daysLabel}
                </>
              )}
            </div>
          )}
          {todo.dueDate && (
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Calendar className="h-2.5 w-2.5" />
              {formatDate(todo.dueDate)}
            </div>
          )}
        </div>

        {(todo.pomodoroSessions || 0) > 0 && (
          <div className="flex items-center gap-1 text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded mb-2">
            <Timer className="h-2.5 w-2.5" />
            {todo.pomodoroSessions} sess. ({todo.pomodoroMinutes || 0} min)
          </div>
        )}

        {isPomodoroActive && (
          <div className="flex items-center gap-2 mb-2 p-1.5 bg-card rounded border border-emerald-200">
            <div className="text-sm font-mono font-bold text-emerald-600">
              {formatPomodoroTime(pomodoroTime)}
            </div>
            <div className="flex gap-0.5">
              {pomodoroRunning ? (
                <Button size="sm" variant="ghost" onClick={pausePomodoro} className="h-5 w-5 p-0">
                  <Pause className="h-3 w-3" />
                </Button>
              ) : (
                <Button size="sm" variant="ghost" onClick={resumePomodoro} className="h-5 w-5 p-0">
                  <Play className="h-3 w-3" />
                </Button>
              )}
              <Button size="sm" variant="ghost" onClick={resetPomodoro} className="h-5 w-5 p-0">
                <RotateCcw className="h-3 w-3" />
              </Button>
              <Button size="sm" variant="ghost" className="text-red-500 h-5 w-5 p-0" onClick={stopPomodoro}>
                <Square className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}

        <div className="flex items-center gap-0.5 pt-2 border-t border-dashed">
          {!isPomodoroActive && !todo.completed && !isBlocked && (
            <Button size="sm" variant="ghost" onClick={() => startPomodoro(todo.id)} className="h-6 w-6 p-0 text-emerald-600" title="Pomodoro">
              <Timer className="h-3 w-3" />
            </Button>
          )}
          {activeTimeEntry?.todoId === todo.id ? (
            <Button size="sm" variant="ghost" onClick={stopTimeTracking} className="h-6 w-6 p-0 text-red-500" title="Stop">
              <Hourglass className="h-3 w-3 animate-pulse" />
            </Button>
          ) : !todo.completed && !activeTimeEntry && (
            <Button size="sm" variant="ghost" onClick={() => startTimeTracking(todo.id)} className="h-6 w-6 p-0 text-indigo-500" title="Traccia">
              <Hourglass className="h-3 w-3" />
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={() => saveAsTemplate(todo)} className="h-6 w-6 p-0 text-purple-500" title="Template">
            <Copy className="h-3 w-3" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => handleToggleStar(todo)} className={`h-6 w-6 p-0 ${todo.starred ? "text-yellow-500" : "text-muted-foreground"}`}>
            <Star className={`h-3 w-3 ${todo.starred ? "fill-current" : ""}`} />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setEmailDialog({ todo, recipientEmail: '' })} className="h-6 w-6 p-0 text-blue-500" title="Email">
            <Mail className="h-3 w-3" />
          </Button>
          {calendarConnected && (
            <Button size="sm" variant="ghost" onClick={() => handleSyncToCalendar(todo)} className="h-6 w-6 p-0 text-purple-500" title="Google Calendar">
              <CalendarPlus className="h-3 w-3" />
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={() => setEditingTodo(todo)} className="h-6 w-6 p-0" title="Modifica">
            <Edit2 className="h-3 w-3" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => handleDeleteTodo(todo.id, todo.title)} className="h-6 w-6 p-0 text-red-500" title="Elimina">
            <Trash2 className="h-3 w-3" />
          </Button>

          <div className="flex-1" />

          {currentColumn !== "todo" && (
            <Button size="sm" variant="ghost" className="h-5 px-1.5 text-[10px] text-yellow-600 hover:bg-yellow-50" onClick={() => handleMoveToColumn(todo, "todo")}>
              Da Fare
            </Button>
          )}
          {currentColumn !== "inprogress" && (
            <Button size="sm" variant="ghost" className="h-5 px-1.5 text-[10px] text-blue-600 hover:bg-blue-50" onClick={() => handleMoveToColumn(todo, "inprogress")}>
              In Corso
            </Button>
          )}
          {currentColumn !== "completed" && (
            <Button size="sm" variant="ghost" className="h-5 px-1.5 text-[10px] text-green-600 hover:bg-green-50" onClick={() => handleMoveToColumn(todo, "completed")}>
              Fatto
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="flex flex-col h-full overflow-hidden">
        <div className="flex-1 overflow-hidden py-4">
          <div className="flex gap-6 h-full">
            <div className="flex-1 rounded-xl border shadow-sm flex flex-col" style={{ backgroundColor: '#faf8f5' }}>
              <div className="p-4 border-b flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cerca attività..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>

                <Select value={filterPriority} onValueChange={setFilterPriority}>
                  <SelectTrigger className="w-[130px]">
                    <Flag className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Priorità" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutte</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="medium">Media</SelectItem>
                    <SelectItem value="low">Bassa</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-[150px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutte</SelectItem>
                    {PREDEFINED_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  variant={showCompleted ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => setShowCompleted(!showCompleted)}
                >
                  <CheckSquare className="h-4 w-4 mr-2" />
                  {showCompleted ? "Nascondi completate" : "Mostra completate"}
                </Button>

                <div className="flex items-center border rounded-md">
                  <Button
                    variant={viewMode === "list" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                    className="rounded-r-none"
                    title="Vista Lista"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "kanban" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("kanban")}
                    className="rounded-none border-x"
                    title="Vista Kanban"
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "calendar" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("calendar")}
                    className="rounded-l-none"
                    title="Vista Calendario"
                  >
                    <CalendarDays className="h-4 w-4" />
                  </Button>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPlanningOpen(true)}
                >
                  <CalendarDays className="h-4 w-4 mr-2" />
                  Planning
                </Button>

                <Dialog open={newTodoDialogOpen} onOpenChange={setNewTodoDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-emerald-600 hover:bg-emerald-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Nuova Attività
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Nuova Attività</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      {templates.length > 0 && (
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Usa Template
                          </Label>
                          <Select onValueChange={(v) => {
                            const tmpl = templates.find(t => t.id === v);
                            if (tmpl) applyTemplate(tmpl);
                          }}>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleziona un template..." />
                            </SelectTrigger>
                            <SelectContent>
                              {templates.map((tmpl) => (
                                <SelectItem key={tmpl.id} value={tmpl.id}>
                                  {tmpl.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      <div className="space-y-2">
                        <Label>Titolo *</Label>
                        <Input
                          placeholder="Cosa devi fare?"
                          value={newTodo.title}
                          onChange={(e) => setNewTodo({ ...newTodo, title: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Descrizione</Label>
                        <Textarea
                          placeholder="Dettagli aggiuntivi..."
                          value={newTodo.description}
                          onChange={(e) => setNewTodo({ ...newTodo, description: e.target.value })}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Priorità</Label>
                          <Select
                            value={newTodo.priority}
                            onValueChange={(v) => setNewTodo({ ...newTodo, priority: v as any })}
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
                          <Label>Scadenza *</Label>
                          <Input
                            type="datetime-local"
                            value={newTodo.dueDate}
                            onChange={(e) => setNewTodo({ ...newTodo, dueDate: e.target.value })}
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Categoria</Label>
                        <Select
                          value={newTodo.category}
                          onValueChange={(v) => setNewTodo({ ...newTodo, category: v === "none" ? "" : v })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleziona categoria..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Nessuna categoria</SelectItem>
                            {PREDEFINED_CATEGORIES.map((cat) => (
                              <SelectItem key={cat.value} value={cat.value}>
                                {cat.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Progetto (opzionale)</Label>
                        <Select
                          value={newTodo.projectId}
                          onValueChange={(v) => setNewTodo({ ...newTodo, projectId: v === "none" ? "" : v })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleziona un progetto..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Nessun progetto</SelectItem>
                            {projects.map((project) => (
                              <SelectItem key={project.id} value={project.id}>
                                {project.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2">
                            <Repeat className="h-4 w-4" /> Ricorrenza
                          </Label>
                          <Select
                            value={newTodo.recurrenceType}
                            onValueChange={(v) => setNewTodo({ ...newTodo, recurrenceType: v })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {RECURRENCE_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2">
                            <Bell className="h-4 w-4" /> Promemoria
                          </Label>
                          <Select
                            value={String(newTodo.reminderBefore)}
                            onValueChange={(v) => setNewTodo({ ...newTodo, reminderBefore: parseInt(v) })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {REMINDER_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={String(opt.value)}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Link2 className="h-4 w-4" /> Dipende da (opzionale)
                        </Label>
                        <Select
                          value={newTodo.dependsOn.length > 0 ? newTodo.dependsOn[0] : "none"}
                          onValueChange={(v) => setNewTodo({ ...newTodo, dependsOn: v === "none" ? [] : [v] })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleziona attività prerequisito..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Nessuna dipendenza</SelectItem>
                            {todos.filter(t => !t.completed).map((todo) => (
                              <SelectItem key={todo.id} value={todo.id}>
                                {todo.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {calendarConnected && googleCalendarList.length > 0 && (
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2">
                            <CalendarPlus className="h-4 w-4" /> Salva su Calendario
                          </Label>
                          <Select
                            value={newTodo.calendarId}
                            onValueChange={(v) => setNewTodo({ ...newTodo, calendarId: v })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Seleziona calendario..." />
                            </SelectTrigger>
                            <SelectContent>
                              {googleCalendarList.map((cal: any) => (
                                <SelectItem key={cal.id} value={cal.id}>
                                  <div className="flex items-center gap-2">
                                    <div
                                      className="w-3 h-3 rounded-full"
                                      style={{ backgroundColor: cal.backgroundColor || "#4285f4" }}
                                    />
                                    {cal.summary || cal.id}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      <Button
                        onClick={handleCreateTodo}
                        className="w-full bg-emerald-600 hover:bg-emerald-700"
                        disabled={!newTodo.title.trim() || !newTodo.dueDate}
                      >
                        Crea Attività
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <ScrollArea className="flex-1 p-4">
                {viewMode === "list" ? (
                  <div className="space-y-6">
                    {starredTodos.length > 0 && (
                      <div>
                        <h3 className="flex items-center gap-2 text-sm font-semibold text-yellow-600 mb-3">
                          <Star className="h-4 w-4 fill-current" />
                          Preferite ({starredTodos.length})
                        </h3>
                        <div className="space-y-2">
                          {starredTodos.map((todo) => (
                            <TodoItem key={todo.id} todo={todo} />
                          ))}
                        </div>
                      </div>
                    )}

                    {pendingTodos.length > 0 && (
                      <div>
                        <h3 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground mb-3">
                          <Clock className="h-4 w-4" />
                          Da fare ({pendingTodos.length})
                        </h3>
                        <div className="space-y-2">
                          {pendingTodos.map((todo) => (
                            <TodoItem key={todo.id} todo={todo} />
                          ))}
                        </div>
                      </div>
                    )}

                    {showCompleted && completedTodos.length > 0 && (
                      <div>
                        <h3 className="flex items-center gap-2 text-sm font-semibold text-green-600 mb-3">
                          <CheckSquare className="h-4 w-4" />
                          Completate ({completedTodos.length})
                        </h3>
                        <div className="space-y-2">
                          {completedTodos.map((todo) => (
                            <TodoItem key={todo.id} todo={todo} />
                          ))}
                        </div>
                      </div>
                    )}

                    {filteredTodos.length === 0 && (
                      <div className="text-center py-12">
                        <CheckSquare className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                        <h3 className="text-lg font-medium text-muted-foreground">Nessuna attività</h3>
                        <p className="text-sm text-muted-foreground/70">
                          {todos.length === 0
                            ? "Inizia creando la tua prima attività!"
                            : "Nessuna attività corrisponde ai filtri selezionati"}
                        </p>
                      </div>
                    )}
                  </div>
                ) : viewMode === "kanban" ? (
                  <div className="grid grid-cols-3 gap-4 h-full">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2 mb-3 pb-2 border-b">
                        <div className="w-3 h-3 rounded-full bg-yellow-500" />
                        <h3 className="text-sm font-semibold">Da Fare</h3>
                        <Badge variant="secondary" className="ml-auto">{pendingTodos.filter(t => !t.starred).length}</Badge>
                      </div>
                      <div className="space-y-2 flex-1 overflow-auto">
                        {pendingTodos.filter(t => !t.starred).map((todo) => (
                          <KanbanCard key={todo.id} todo={todo} currentColumn="todo" />
                        ))}
                        {pendingTodos.filter(t => !t.starred).length === 0 && (
                          <div className="text-center py-8 text-muted-foreground text-sm">
                            Nessuna attività
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2 mb-3 pb-2 border-b">
                        <div className="w-3 h-3 rounded-full bg-blue-500" />
                        <h3 className="text-sm font-semibold">In Corso</h3>
                        <Badge variant="secondary" className="ml-auto">{starredTodos.length}</Badge>
                      </div>
                      <div className="space-y-2 flex-1 overflow-auto">
                        {starredTodos.map((todo) => (
                          <KanbanCard key={todo.id} todo={todo} currentColumn="inprogress" />
                        ))}
                        {starredTodos.length === 0 && (
                          <div className="text-center py-8 text-muted-foreground text-sm">
                            Nessuna attività
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2 mb-3 pb-2 border-b">
                        <div className="w-3 h-3 rounded-full bg-green-500" />
                        <h3 className="text-sm font-semibold">Completate</h3>
                        <Badge variant="secondary" className="ml-auto">{completedTodos.length}</Badge>
                      </div>
                      <div className="space-y-2 flex-1 overflow-auto">
                        {completedTodos.map((todo) => (
                          <KanbanCard key={todo.id} todo={todo} currentColumn="completed" />
                        ))}
                        {completedTodos.length === 0 && (
                          <div className="text-center py-8 text-muted-foreground text-sm">
                            Nessuna attività
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(() => {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);

                      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
                      const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

                      const startDay = firstDayOfMonth.getDay();
                      const adjustedStartDay = startDay === 0 ? 6 : startDay - 1;

                      const calendarDays: (Date | null)[] = [];

                      for (let i = 0; i < adjustedStartDay; i++) {
                        calendarDays.push(null);
                      }

                      for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
                        calendarDays.push(new Date(today.getFullYear(), today.getMonth(), day));
                      }

                      while (calendarDays.length % 7 !== 0) {
                        calendarDays.push(null);
                      }

                      const getTasksForDate = (date: Date) => {
                        const dateStr = format(date, "yyyy-MM-dd");
                        return filteredTodos.filter(todo => {
                          if (!todo.dueDate) return false;
                          const todoDate = todo.dueDate.split("T")[0];
                          return todoDate === dateStr;
                        });
                      };

                      const getGoogleEventsForDate = (date: Date) => {
                        const dateStr = format(date, "yyyy-MM-dd");
                        return googleCalendarEvents.filter((event: any) => {
                          const eventStart = event.start?.date || event.start?.dateTime?.split("T")[0];
                          return eventStart === dateStr;
                        });
                      };

                      const overdueTasks = filteredTodos.filter(todo => {
                        if (!todo.dueDate || todo.completed) return false;
                        const todoDate = new Date(todo.dueDate);
                        todoDate.setHours(0, 0, 0, 0);
                        return todoDate < today;
                      });

                      const noDateTasks = filteredTodos.filter(todo => !todo.dueDate && !todo.completed);

                      const currentMonth = format(today, "MMMM yyyy", { locale: it });

                      const weekDays = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];

                      const selectedCalendar = googleCalendarList.find((cal: any) => cal.id === selectedCalendarId);

                      return (
                        <>
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold capitalize">{currentMonth}</h3>

                            {calendarConnected && (
                              <div className="flex items-center gap-2">
                                <Dialog open={calendarSelectorOpen} onOpenChange={setCalendarSelectorOpen}>
                                  <DialogTrigger asChild>
                                    <Button variant="outline" size="sm" className="gap-2">
                                      <CalendarDays className="h-4 w-4 text-purple-600" />
                                      {selectedCalendar?.summary || "Calendario principale"}
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Seleziona Calendario Google</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-2 max-h-[400px] overflow-auto py-4">
                                      {googleCalendarList.map((cal: any) => (
                                        <div
                                          key={cal.id}
                                          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors ${selectedCalendarId === cal.id ? 'border-purple-500 bg-purple-50' : ''
                                            }`}
                                          onClick={() => {
                                            setSelectedCalendarId(cal.id);
                                            setCalendarSelectorOpen(false);
                                          }}
                                        >
                                          <div
                                            className="w-4 h-4 rounded-full flex-shrink-0"
                                            style={{ backgroundColor: cal.backgroundColor || '#9333ea' }}
                                          />
                                          <div className="flex-1 min-w-0">
                                            <p className="font-medium truncate">{cal.summary}</p>
                                            <p className="text-xs text-muted-foreground">
                                              {cal.primary ? "Calendario principale" :
                                                cal.accessRole === "owner" ? "Proprietario" :
                                                  cal.accessRole === "writer" ? "Può modificare" :
                                                    cal.accessRole === "reader" ? "Sola lettura" : "Condiviso"}
                                            </p>
                                          </div>
                                          {selectedCalendarId === cal.id && (
                                            <CheckSquare className="h-4 w-4 text-purple-600" />
                                          )}
                                        </div>
                                      ))}
                                      {googleCalendarList.length === 0 && (
                                        <div className="text-center py-8 text-muted-foreground">
                                          Nessun calendario disponibile
                                        </div>
                                      )}
                                    </div>
                                  </DialogContent>
                                </Dialog>

                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => window.open("https://calendar.google.com/calendar/r/settings/createcalendar", "_blank")}
                                  title="Crea nuovo calendario Google"
                                  className="gap-1"
                                >
                                  <Plus className="h-4 w-4" />
                                  <span className="hidden sm:inline">Nuovo</span>
                                </Button>

                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => window.open("https://calendar.google.com/calendar/r/settings/browsecalendars", "_blank")}
                                  title="Iscriviti a calendari condivisi"
                                  className="gap-1"
                                >
                                  <Share2 className="h-4 w-4" />
                                  <span className="hidden sm:inline">Condivisi</span>
                                </Button>
                              </div>
                            )}
                          </div>

                          {overdueTasks.length > 0 && (
                            <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                              <h4 className="font-semibold text-red-700 mb-3 flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                In Ritardo ({overdueTasks.length})
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                {overdueTasks.map(todo => (
                                  <div
                                    key={todo.id}
                                    className={`flex items-center gap-3 p-3 bg-card rounded-lg border border-red-100 ${todo.completed ? 'opacity-60' : ''
                                      }`}
                                  >
                                    <Checkbox
                                      checked={todo.completed}
                                      onCheckedChange={() => handleToggleComplete(todo)}
                                    />
                                    <div className="flex-1 min-w-0">
                                      <p className={`text-sm font-medium truncate ${todo.completed ? 'line-through text-muted-foreground' : ''}`}>
                                        {todo.title}
                                      </p>
                                      <p className="text-xs text-red-600">
                                        {todo.dueDate && format(new Date(todo.dueDate), "d MMM HH:mm", { locale: it })}
                                      </p>
                                    </div>
                                    <div className={`w-2 h-2 rounded-full ${todo.priority === "high" ? "bg-red-500" :
                                      todo.priority === "medium" ? "bg-yellow-500" : "bg-green-500"
                                      }`} />
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="space-y-2">
                            <div className="flex gap-2">
                              <div className="w-10 flex-shrink-0" />
                              <div className="grid grid-cols-7 gap-2 flex-1">
                                {weekDays.map((day, idx) => (
                                  <div key={idx} className={`text-center text-xs font-semibold py-2 ${idx >= 5 ? 'text-muted-foreground' : ''}`}>
                                    {day}
                                  </div>
                                ))}
                              </div>
                            </div>
                            {(() => {
                              const weeks: (Date | null)[][] = [];
                              for (let i = 0; i < calendarDays.length; i += 7) {
                                weeks.push(calendarDays.slice(i, i + 7));
                              }
                              return weeks.map((week, weekIdx) => {
                                const firstValidDay = week.find(d => d !== null);
                                return (
                                  <div key={weekIdx} className="flex gap-2">
                                    <div className="w-10 flex-shrink-0 flex items-center justify-center">
                                      {firstValidDay && (
                                        <span className="text-xs font-bold text-muted-foreground bg-muted rounded px-2 py-1">
                                          S{getWeek(firstValidDay, { weekStartsOn: 1 })}
                                        </span>
                                      )}
                                    </div>
                                    <div className="grid grid-cols-7 gap-2 flex-1">
                                      {week.map((date, dayIdx) => {
                                        if (!date) {
                                          return <div key={dayIdx} className="min-h-[100px]" />;
                                        }

                                        const tasks = getTasksForDate(date);
                                        const googleEvents = getGoogleEventsForDate(date);
                                        const isToday = date.toDateString() === new Date().toDateString();
                                        const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                                        const isPast = date < today;
                                        const totalItems = tasks.length + googleEvents.length;

                                        return (
                                          <div
                                            key={dayIdx}
                                            className={`min-h-[100px] p-2 rounded-lg border ${isToday
                                              ? 'bg-blue-50 border-blue-300'
                                              : isPast
                                                ? 'bg-muted/30 border-border opacity-60'
                                                : isWeekend
                                                  ? 'bg-gray-50 border-gray-200'
                                                  : 'bg-card border-border'
                                              }`}
                                          >
                                            <div className={`text-xs font-semibold mb-1 ${isToday ? 'text-blue-700' : isPast ? 'text-muted-foreground' : 'text-foreground'}`}>
                                              <div className={`text-lg ${isToday ? 'text-blue-700' : ''}`}>
                                                {format(date, "d")}
                                              </div>
                                            </div>
                                            <div className="space-y-1">
                                              {googleEvents.slice(0, 2).map((event: any) => (
                                                <div
                                                  key={event.id}
                                                  className="text-xs p-1 rounded bg-purple-100 text-purple-800 border-l-2 border-purple-500"
                                                  title={event.summary}
                                                >
                                                  <p className="truncate flex items-center gap-1">
                                                    <CalendarDays className="h-3 w-3 flex-shrink-0" />
                                                    {event.summary}
                                                  </p>
                                                </div>
                                              ))}
                                              {tasks.slice(0, 3 - Math.min(googleEvents.length, 2)).map(todo => (
                                                <div
                                                  key={todo.id}
                                                  className={`text-xs p-1 rounded cursor-pointer hover:opacity-80 ${todo.completed
                                                    ? 'bg-green-100 text-green-800 line-through'
                                                    : todo.priority === "high"
                                                      ? 'bg-red-100 text-red-800'
                                                      : todo.priority === "medium"
                                                        ? 'bg-yellow-100 text-yellow-800'
                                                        : 'bg-muted text-foreground'
                                                    }`}
                                                  onClick={() => setEditingTodo(todo)}
                                                >
                                                  <p className="truncate">{todo.title}</p>
                                                </div>
                                              ))}
                                              {totalItems > 3 && (
                                                <div className="text-xs text-muted-foreground text-center">
                                                  +{totalItems - 3}
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                );
                              });
                            })()}
                          </div>

                          {noDateTasks.length > 0 && (
                            <div className="p-4 rounded-lg bg-muted border border-border mt-4">
                              <h4 className="font-semibold text-foreground mb-3">Senza Scadenza ({noDateTasks.length})</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
                                {noDateTasks.map(todo => (
                                  <div
                                    key={todo.id}
                                    className="flex items-center gap-3 p-2 bg-card rounded border cursor-pointer hover:bg-muted/50"
                                    onClick={() => setEditingTodo(todo)}
                                  >
                                    <Checkbox
                                      checked={todo.completed}
                                      onCheckedChange={() => handleToggleComplete(todo)}
                                    />
                                    <span className="text-sm truncate flex-1">{todo.title}</span>
                                    <div className={`w-2 h-2 rounded-full ${todo.priority === "high" ? "bg-red-500" :
                                      todo.priority === "medium" ? "bg-yellow-500" : "bg-green-500"
                                      }`} />
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                )}
              </ScrollArea>
            </div>

            <div className="w-72 flex-shrink-0 rounded-xl border shadow-sm p-4 bg-card flex flex-col">
              <h3 className="flex items-center gap-2 text-sm font-semibold mb-4">
                <BarChart3 className="h-4 w-4" />
                Attività per Priorità
              </h3>
              {priorityStats.length > 0 ? (
                <>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={priorityStats}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={70}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {priorityStats.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: number) => [`${value} attività`, '']}
                          contentStyle={{ fontSize: '12px' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 space-y-2">
                    {priorityStats.map((stat) => (
                      <div key={stat.name} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: stat.color }}
                          />
                          <span>{stat.name}</span>
                        </div>
                        <span className="font-medium">{stat.value}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{todos.length}</div>
                      <div className="text-xs text-muted-foreground">Totale attività</div>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <h4 className="flex items-center gap-2 text-sm font-semibold mb-3">
                      <Mountain className="h-4 w-4" />
                      Scalata del Giorno
                    </h4>
                    <ToDoMountain
                      tasks={todayTodos.map(t => ({
                        id: t.id,
                        title: t.title,
                        completed: t.completed,
                        dueDate: t.dueDate
                      }))}
                    />
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
                  Nessuna attività
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <Dialog open={!!editingTodo} onOpenChange={(open) => !open && setEditingTodo(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifica Attività</DialogTitle>
          </DialogHeader>
          {editingTodo && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Titolo</Label>
                <Input
                  value={editingTodo.title}
                  onChange={(e) => setEditingTodo({ ...editingTodo, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Descrizione</Label>
                <Textarea
                  value={editingTodo.description || ""}
                  onChange={(e) => setEditingTodo({ ...editingTodo, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Priorità</Label>
                  <Select
                    value={editingTodo.priority}
                    onValueChange={(v) => setEditingTodo({ ...editingTodo, priority: v as any })}
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
                  <Label>Scadenza</Label>
                  <Input
                    type="datetime-local"
                    value={editingTodo.dueDate || ""}
                    onChange={(e) => setEditingTodo({ ...editingTodo, dueDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select
                  value={editingTodo.category || "none"}
                  onValueChange={(v) => setEditingTodo({ ...editingTodo, category: v === "none" ? "" : v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona categoria..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nessuna categoria</SelectItem>
                    {PREDEFINED_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Progetto (opzionale)</Label>
                <Select
                  value={editingTodo.projectId || "none"}
                  onValueChange={(v) => setEditingTodo({ ...editingTodo, projectId: v === "none" ? undefined : v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona un progetto..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nessun progetto</SelectItem>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Repeat className="h-4 w-4" /> Ricorrenza
                  </Label>
                  <Select
                    value={editingTodo.recurrenceType || "none"}
                    onValueChange={(v) => setEditingTodo({ ...editingTodo, recurrenceType: v === "none" ? undefined : v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona ricorrenza..." />
                    </SelectTrigger>
                    <SelectContent>
                      {RECURRENCE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {editingTodo.recurrenceType && editingTodo.recurrenceType !== "none" && (
                  <div className="space-y-2">
                    <Label>Fine ricorrenza</Label>
                    <Input
                      type="date"
                      value={editingTodo.recurrenceEndDate || ""}
                      onChange={(e) => setEditingTodo({ ...editingTodo, recurrenceEndDate: e.target.value })}
                    />
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Bell className="h-4 w-4" /> Promemoria
                </Label>
                <Select
                  value={editingTodo.reminderBefore !== undefined ? String(editingTodo.reminderBefore) : "0"}
                  onValueChange={(v) => setEditingTodo({ ...editingTodo, reminderBefore: v === "0" ? undefined : parseInt(v) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona promemoria..." />
                  </SelectTrigger>
                  <SelectContent>
                    {REMINDER_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={String(opt.value)}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Link2 className="h-4 w-4" /> Dipende da (opzionale)
                </Label>
                <Select
                  value={(editingTodo.dependsOn && editingTodo.dependsOn.length > 0) ? editingTodo.dependsOn[0] : "none"}
                  onValueChange={(v) => setEditingTodo({ ...editingTodo, dependsOn: v === "none" ? [] : [v] })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona attività prerequisito..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nessuna dipendenza</SelectItem>
                    {todos.filter(t => !t.completed && t.id !== editingTodo.id).map((todo) => (
                      <SelectItem key={todo.id} value={todo.id}>
                        {todo.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={() => updateMutation.mutate({
                  id: editingTodo.id,
                  data: {
                    title: editingTodo.title,
                    description: editingTodo.description,
                    priority: editingTodo.priority,
                    dueDate: editingTodo.dueDate,
                    category: editingTodo.category,
                    projectId: editingTodo.projectId,
                    recurrenceType: editingTodo.recurrenceType,
                    recurrenceEndDate: editingTodo.recurrenceEndDate,
                    reminderBefore: editingTodo.reminderBefore,
                    dependsOn: editingTodo.dependsOn,
                  }
                })}
                className="w-full bg-emerald-600 hover:bg-emerald-700"
              >
                Salva Modifiche
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={planningOpen} onOpenChange={setPlanningOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Planning Settimanale
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-4 py-4">
              {getOverdueTasks().length > 0 && (
                <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                  <h4 className="font-semibold text-red-700 mb-3 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    In Ritardo ({getOverdueTasks().length})
                  </h4>
                  <div className="space-y-2">
                    {getOverdueTasks().map(task => (
                      <div key={task.id} className="flex items-center gap-3 p-2 bg-card rounded border border-red-100">
                        <div className={`w-2 h-2 rounded-full ${task.priority === "high" ? "bg-red-500" :
                          task.priority === "medium" ? "bg-yellow-500" : "bg-green-500"
                          }`} />
                        <span className="flex-1 text-sm">{task.title}</span>
                        <span className="text-xs text-red-600">{formatDate(task.dueDate!)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {getNext7Days().map(date => {
                const tasksForDay = getTasksForDate(date);
                const isToday = date.toDateString() === new Date().toDateString();

                return (
                  <div
                    key={date.toISOString()}
                    className={`p-4 rounded-lg border ${isToday ? "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800" : "bg-muted border-border"
                      }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4 className={`font-semibold capitalize ${isToday ? "text-blue-700 dark:text-blue-300" : "text-foreground"}`}>
                        {formatDayName(date)}
                      </h4>
                      <span className="text-sm text-muted-foreground">
                        {format(date, "d MMMM", { locale: it })}
                      </span>
                    </div>
                    {tasksForDay.length > 0 ? (
                      <div className="space-y-2">
                        {tasksForDay.map(task => (
                          <div key={task.id} className="flex items-center gap-3 p-2 bg-card rounded border">
                            <div className={`w-2 h-2 rounded-full ${task.priority === "high" ? "bg-red-500" :
                              task.priority === "medium" ? "bg-yellow-500" : "bg-green-500"
                              }`} />
                            <span className="flex-1 text-sm">{task.title}</span>
                            <Badge variant="outline" className={`text-xs ${getPriorityColor(task.priority)}`}>
                              {getPriorityLabel(task.priority)}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">Nessuna attività programmata</p>
                    )}
                  </div>
                );
              })}

              <div className="p-4 rounded-lg bg-muted border border-border">
                <h4 className="font-semibold text-foreground mb-2">Senza Scadenza</h4>
                <div className="space-y-2">
                  {todos.filter(t => !t.dueDate && !t.completed).length > 0 ? (
                    todos.filter(t => !t.dueDate && !t.completed).map(task => (
                      <div key={task.id} className="flex items-center gap-3 p-2 bg-card rounded border">
                        <div className={`w-2 h-2 rounded-full ${task.priority === "high" ? "bg-red-500" :
                          task.priority === "medium" ? "bg-yellow-500" : "bg-green-500"
                          }`} />
                        <span className="flex-1 text-sm">{task.title}</span>
                        <Badge variant="outline" className={`text-xs ${getPriorityColor(task.priority)}`}>
                          {getPriorityLabel(task.priority)}
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground italic">Nessuna attività senza scadenza</p>
                  )}
                </div>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteConfirm} onOpenChange={(open) => !open && cancelDelete()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Conferma Eliminazione
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-muted-foreground mb-4">
              Stai per eliminare l'attività:
            </p>
            <p className="font-semibold text-lg mb-6">"{deleteConfirm?.title}"</p>

            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                <span className="text-2xl font-bold text-red-600">{deleteConfirm?.countdown}</span>
              </div>
            </div>

            <p className="text-sm text-center text-muted-foreground mb-4">
              La finestra si chiuderà tra {deleteConfirm?.countdown} secondi
            </p>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={cancelDelete}
              >
                <X className="h-4 w-4 mr-2" />
                Annulla
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={confirmDelete}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Elimina Ora
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!emailDialog} onOpenChange={(open) => !open && setEmailDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-blue-600">
              <Mail className="h-5 w-5" />
              Invia Attività per Email
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="p-3 bg-muted rounded-lg">
              <p className="font-medium">{emailDialog?.todo.title}</p>
              {emailDialog?.todo.dueDate && (
                <p className="text-sm text-muted-foreground mt-1">
                  Scadenza: {format(new Date(emailDialog.todo.dueDate), "d MMMM yyyy", { locale: it })}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Indirizzo Email Destinatario *</Label>
              <Input
                type="email"
                placeholder="esempio@email.com"
                value={emailDialog?.recipientEmail || ''}
                onChange={(e) => setEmailDialog(prev => prev ? { ...prev, recipientEmail: e.target.value } : null)}
              />
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setEmailDialog(null)}
              >
                Annulla
              </Button>
              <Button
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                onClick={handleSendEmail}
                disabled={!emailDialog?.recipientEmail.trim() || sendingEmail}
              >
                {sendingEmail ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Invio...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Invia Email
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
