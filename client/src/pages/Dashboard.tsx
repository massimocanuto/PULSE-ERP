import { AppLayout } from "@/components/layout/AppLayout";
import { EditTodoDialog } from "@/components/EditTodoDialog";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  CheckCircle2, Clock, Plus, Trash2, Calendar as CalendarIcon,
  TrendingUp, Target, Loader2, Check, X, Edit2, MoreVertical,
  Briefcase, ListTodo, Zap, BarChart3, Users, FileText, Sparkles,
  Cloud, CloudRain, Sun, CloudSnow, Wind, AlertCircle, Bell,
  StickyNote, Save, TrendingDown, ArrowUp, ArrowDown, Minus, Mail, ExternalLink
} from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { tasksApi, projectsApi, personalTodosApi, keepNotesApi } from "@/lib/api";
import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export default function Dashboard() {
  const queryClient = useQueryClient();
  const { user: authUser } = useAuth();
  const [newTodoText, setNewTodoText] = useState("");
  const [newTodoDate, setNewTodoDate] = useState<Date | undefined>(new Date());
  const [newTodoTime, setNewTodoTime] = useState(new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }));
  const [editingTodo, setEditingTodo] = useState<any>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [stickyNote, setStickyNote] = useState("");
  const todoListRef = useRef<HTMLDivElement>(null);
  const [, navigate] = useLocation();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Load dashboard note from Pulse Keep
  const { data: dashboardNote } = useQuery({
    queryKey: ['dashboard-note', authUser?.id],
    queryFn: async () => {
      if (!authUser?.id) return null;
      const notes = await keepNotesApi.getAll(authUser.id);
      return notes.find((n: any) => n.title === '__DASHBOARD_NOTE__') || null;
    },
    enabled: !!authUser?.id,
  });


  // Sync sticky note state when data is loaded
  useEffect(() => {
    if (dashboardNote?.content) {
      setStickyNote(dashboardNote.content);
    }
  }, [dashboardNote]);

  const { data: todos = [], isLoading: todosLoading } = useQuery({
    queryKey: ["personal-todos", authUser?.id],
    queryFn: () => personalTodosApi.getAll(authUser?.id),
    enabled: !!authUser?.id,
  });

  const { data: recentEmails, isLoading: emailsLoading } = useQuery({
    queryKey: ["recent-emails", authUser?.id],
    queryFn: async () => {
      if (!authUser?.id) return [];
      const res = await fetch("/api/emails?limit=10", {
        headers: { "x-user-id": authUser.id }
      });
      if (!res.ok) throw new Error("Failed to fetch emails");
      const data = await res.json();
      console.log("DASHBOARD EMAILS:", data);
      return data;
    },
    // Refresh every minute
    refetchInterval: 60000,
  });

  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: projectsApi.getAll,
  });

  const createTodoMutation = useMutation({
    mutationFn: personalTodosApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["personal-todos"] });
      setNewTodoText("");
    },
  });

  const updateTodoMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => personalTodosApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["personal-todos"] });
      setEditingTodo(null);
    },
  });

  const deleteTodoMutation = useMutation({
    mutationFn: personalTodosApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["personal-todos"] });
    },
  });

  // Mutation for saving dashboard note
  const saveDashboardNoteMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!authUser?.id) throw new Error('User not authenticated');

      if (dashboardNote) {
        // Update existing note
        return keepNotesApi.update(dashboardNote.id, { content });
      } else {
        // Create new note
        return keepNotesApi.create({
          userId: authUser.id,
          title: '__DASHBOARD_NOTE__',
          content,
          color: 'yellow',
          pinned: true,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-note', authUser?.id] });
    },
  });

  const handleAddTodo = () => {
    if (!newTodoText.trim() || !authUser?.id) return;
    if (!newTodoDate || !newTodoTime) {
      alert("Seleziona data e ora per l'attività");
      return;
    }

    let dueDate = new Date();
    // newTodoDate is now a Date object
    const dateVal = new Date(newTodoDate);
    const [hours, minutes] = newTodoTime.split(':').map(Number);
    dateVal.setHours(hours, minutes);
    dueDate = dateVal;

    createTodoMutation.mutate({
      title: newTodoText,
      completed: false,
      priority: "medium",
      userId: authUser.id,
      dueDate: dueDate.toISOString(),
    });
  };

  const handleToggleTodo = (todo: any) => {
    updateTodoMutation.mutate({
      id: todo.id,
      data: { completed: !todo.completed },
    });
  };

  const handleDeleteTodo = (id: string) => {
    if (confirm("Eliminare questa attività?")) {
      deleteTodoMutation.mutate(id);
    }
  };

  const handleEditClick = (todo: any) => {
    setEditingTodo(todo);
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = (id: string, data: any) => {
    updateTodoMutation.mutate({
      id,
      data
    });
  };

  const handleSaveNote = () => {
    saveDashboardNoteMutation.mutate(stickyNote);
  };

  const scrollToTodoList = () => {
    navigate("/projects?tab=todo");
  };

  const isLoading = todosLoading || projectsLoading;

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full flex-col gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground text-sm">Caricamento workspace...</p>
        </div>
      </AppLayout>
    );
  }

  const pendingTodos = todos
    .filter((t: any) => !t.completed)
    .sort((a: any, b: any) => {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });
  const completedTodos = todos.filter((t: any) => t.completed);
  const activeProjects = projects.filter((p: any) => p.status === "In Progress");
  const todayTodos = todos.filter((t: any) => {
    if (!t.dueDate) return false;
    const today = new Date().toISOString().split('T')[0];
    return t.dueDate.split('T')[0] === today;
  });

  // Calculate weekly productivity data (last 7 days)
  const getLast7Days = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push(date.toISOString().split('T')[0]);
    }
    return days;
  };

  const last7Days = getLast7Days();
  const weeklyData = last7Days.map(day => {
    const completed = completedTodos.filter((t: any) =>
      t.updatedAt && t.updatedAt.split('T')[0] === day
    ).length;
    return { day, completed };
  });

  const maxCompleted = Math.max(...weeklyData.map(d => d.completed), 1);

  // Get urgent alerts
  const now = new Date();
  const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);

  const dueSoon = pendingTodos.filter((t: any) => {
    if (!t.dueDate) return false;
    const dueDate = new Date(t.dueDate);
    return dueDate > now && dueDate <= twoHoursFromNow;
  });

  const overdue = pendingTodos.filter((t: any) => {
    if (!t.dueDate) return false;
    const dueDate = new Date(t.dueDate);
    return dueDate < now;
  });

  // Calculate stats trends (mock data for demo)
  const todayCompletedCount = completedTodos.filter((t: any) => {
    if (!t.updatedAt) return false;
    return t.updatedAt.split('T')[0] === new Date().toISOString().split('T')[0];
  }).length;

  const yesterdayCompletedCount = completedTodos.filter((t: any) => {
    if (!t.updatedAt) return false;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return t.updatedAt.split('T')[0] === yesterday.toISOString().split('T')[0];
  }).length;

  const completionTrend = todayCompletedCount - yesterdayCompletedCount;

  // Mock weather data (in production, use real API)
  const weatherData = {
    temp: 18,
    condition: "Nuvoloso",
    icon: Cloud,
    humidity: 65,
    wind: 12
  };

  return (
    <>
      <AppLayout>
        <div className="w-full min-h-full bg-gradient-to-br from-slate-100 via-gray-50 to-slate-50">
          {/* Hero Header */}
          <div className="bg-gradient-to-br from-blue-950 via-blue-800 to-blue-600 text-white shadow-xl">
            <div className="px-4 py-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-bold mb-1">
                    Benvenuto, {authUser?.name || "User"} 👋
                  </h1>
                  <p className="text-white/90 text-sm">
                    {currentTime.toLocaleDateString('it-IT', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                </div>
                {/* Live Clock & Weather Widget */}
                <div className="flex gap-3">
                  <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/30">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4" />
                      <span className="text-lg font-mono font-bold">
                        {currentTime.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/30">
                    <div className="flex items-center gap-2">
                      <weatherData.icon className="h-4 w-4" />
                      <span className="font-bold">{weatherData.temp}°C</span>
                      <span className="text-xs opacity-90">{weatherData.condition}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Enhanced Quick Stats with Trends */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20 relative overflow-hidden">
                  <div className="flex items-center justify-between relative z-10">
                    <div>
                      <p className="text-white/80 text-xs">Tasks Oggi</p>
                      <p className="text-xl font-bold">{todayTodos.length}</p>
                      <div className="flex items-center gap-1 mt-1">
                        {completionTrend > 0 ? (
                          <ArrowUp className="h-3 w-3 text-green-300" />
                        ) : completionTrend < 0 ? (
                          <ArrowDown className="h-3 w-3 text-red-300" />
                        ) : (
                          <Minus className="h-3 w-3 text-yellow-300" />
                        )}
                        <span className="text-[10px] text-white/70">
                          {Math.abs(completionTrend)} vs ieri
                        </span>
                      </div>
                    </div>
                    <Target className="h-5 w-5 text-white/60" />
                  </div>
                  {/* Sparkline background */}
                  <svg className="absolute bottom-0 right-0 h-8 w-20 opacity-20" viewBox="0 0 80 32">
                    <polyline
                      fill="none"
                      stroke="white"
                      strokeWidth="2"
                      points="0,20 20,15 40,18 60,10 80,12"
                    />
                  </svg>
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20 relative overflow-hidden">
                  <div className="flex items-center justify-between relative z-10">
                    <div>
                      <p className="text-white/80 text-xs">Completate</p>
                      <p className="text-xl font-bold">{completedTodos.length}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <TrendingUp className="h-3 w-3 text-green-300" />
                        <span className="text-[10px] text-white/70">
                          {Math.round((completedTodos.length / Math.max(todos.length, 1)) * 100)}% totale
                        </span>
                      </div>
                    </div>
                    <CheckCircle2 className="h-5 w-5 text-white/60" />
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20 relative overflow-hidden">
                  <div className="flex items-center justify-between relative z-10">
                    <div>
                      <p className="text-white/80 text-xs">In Corso</p>
                      <p className="text-xl font-bold">{pendingTodos.length}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Clock className="h-3 w-3 text-orange-300" />
                        <span className="text-[10px] text-white/70">
                          {overdue.length} scadute
                        </span>
                      </div>
                    </div>
                    <Clock className="h-5 w-5 text-white/60" />
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20 relative overflow-hidden">
                  <div className="flex items-center justify-between relative z-10">
                    <div>
                      <p className="text-white/80 text-xs">Progetti</p>
                      <p className="text-xl font-bold">{activeProjects.length}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Briefcase className="h-3 w-3 text-blue-300" />
                        <span className="text-[10px] text-white/70">
                          attivi ora
                        </span>
                      </div>
                    </div>
                    <Briefcase className="h-5 w-5 text-white/60" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="px-4 py-8 -mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column - Alerts & Weekly Chart */}
              <div className="lg:col-span-3 space-y-6">
                {/* Alerts Widget */}
                <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
                  <CardHeader className="border-b bg-gradient-to-r from-amber-50 to-orange-50 py-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Bell className={`h-4 w-4 text-red-600 -ml-1 ${(overdue.length > 0 || dueSoon.length > 0) ? 'animate-bell-ring' : ''}`} />
                      Notifiche Urgenti
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 space-y-2">
                    {/* Email notification removed as per user request */}

                    {overdue.length > 0 && (
                      <div
                        className="bg-red-50 border border-red-200 rounded-lg p-2 cursor-pointer hover:bg-red-100 transition-colors"
                        onClick={scrollToTodoList}
                        title="Clicca per vedere le task scadute"
                      >
                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-xs font-bold text-red-900">{overdue.length} Task Scadute</p>
                            <p className="text-[10px] text-red-700 mt-1">
                              {overdue.slice(0, 2).map((t: any) => t.title).join(', ')}
                              {overdue.length > 2 && ` +${overdue.length - 2} altre`}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {dueSoon.length > 0 && (
                      <div
                        className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 cursor-pointer hover:bg-yellow-100 transition-colors"
                        onClick={scrollToTodoList}
                        title="Clicca per vedere le task in scadenza"
                      >
                        <div className="flex items-start gap-2">
                          <Clock className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-xs font-bold text-yellow-900">{dueSoon.length} In Scadenza</p>
                            <p className="text-[10px] text-yellow-700 mt-1">
                              Entro 2 ore
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {overdue.length === 0 && dueSoon.length === 0 && (
                      <div className="text-center py-4">
                        <CheckCircle2 className="h-8 w-8 mx-auto text-green-500 mb-2" />
                        <p className="text-xs text-muted-foreground">Tutto sotto controllo!</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Weekly Productivity Chart */}
                <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
                  <CardHeader className="border-b bg-gradient-to-r from-cyan-50 to-blue-50 py-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-cyan-600" />
                      Produttività Settimanale
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      {weeklyData.map((data, index) => {
                        const date = new Date(data.day);
                        const dayName = date.toLocaleDateString('it-IT', { weekday: 'short' });
                        const percentage = (data.completed / maxCompleted) * 100;

                        return (
                          <div key={data.day} className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-medium text-muted-foreground uppercase">
                                {dayName}
                              </span>
                              <span className="text-xs font-bold text-purple-600">
                                {data.completed}
                              </span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-4 pt-3 border-t">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Media giornaliera</span>
                        <span className="font-bold text-cyan-600">
                          {(weeklyData.reduce((acc, d) => acc + d.completed, 0) / 7).toFixed(1)} task
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Sticky Notes Widget */}
                <Card className="shadow-lg border-0 bg-gradient-to-br from-yellow-50 to-amber-50">
                  <CardHeader className="border-b border-yellow-200 py-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <StickyNote className="h-4 w-4 text-yellow-600" />
                        Note Veloci
                      </CardTitle>
                      <Link href="/keep" title="Apri Pulse Keep">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-yellow-700 hover:text-yellow-900 hover:bg-yellow-100">
                          <FileText className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </CardHeader>
                  <CardContent className="p-3">
                    <Textarea
                      placeholder="Scrivi una nota veloce..."
                      value={stickyNote}
                      onChange={(e) => setStickyNote(e.target.value)}
                      className="min-h-[120px] text-xs bg-white/50 border-yellow-200 focus:border-yellow-400 resize-none"
                    />
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[10px] text-muted-foreground">
                        {saveDashboardNoteMutation.isPending
                          ? "Salvando..."
                          : (dashboardNote?.content === stickyNote)
                            ? "Salvato"
                            : "Non salvato"}
                      </span>
                      <Button
                        size="sm"
                        onClick={handleSaveNote}
                        disabled={saveDashboardNoteMutation.isPending || (dashboardNote?.content === stickyNote)}
                        className="h-7 text-xs bg-yellow-600 hover:bg-yellow-700"
                      >
                        {saveDashboardNoteMutation.isPending ? (
                          <>
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            Salvando...
                          </>
                        ) : (
                          <>
                            <Save className="h-3 w-3 mr-1" />
                            Salva
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Center Column - To-Do List & Email */}
              <div className="lg:col-span-6 space-y-6">
                <Card ref={todoListRef} className="shadow-lg border-0 bg-white/80 backdrop-blur scroll-mt-4">
                  <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-cyan-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <ListTodo className="h-5 w-5 text-blue-600" />
                          To-Do List
                        </CardTitle>
                        <CardDescription className="text-xs">Gestisci le tue attività quotidiane</CardDescription>
                      </div>
                      <Badge variant="outline" className="text-xs px-2 py-0.5">
                        {pendingTodos.length} da fare
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    {/* Add New Todo */}
                    <div className="mb-4 flex items-center gap-2">
                      <Input
                        placeholder="Nuova attività..."
                        value={newTodoText}
                        onChange={(e) => setNewTodoText(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddTodo()}
                        className="flex-1 h-9 text-sm"
                      />
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className={cn(
                              "h-9 justify-start text-left font-normal bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200 text-xs px-3",
                              !newTodoDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4 text-blue-600" />
                            {newTodoDate ? (
                              <span>
                                {format(newTodoDate, "d MMM yyyy", { locale: it })}, {newTodoTime}
                              </span>
                            ) : (
                              <span>Seleziona data</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                          <div className="flex flex-col sm:flex-row">
                            <div className="p-4">
                              <Calendar
                                mode="single"
                                selected={newTodoDate}
                                onSelect={(d) => d && setNewTodoDate(d)}
                                initialFocus
                                showOutsideDays={false}
                                showWeekNumber
                                className="p-2 pointer-events-auto [&_.rdp-cell]:w-14 [&_.rdp-cell]:h-14 [&_.rdp-cell]:text-sm [&_.rdp-head_cell]:w-14 [&_.rdp-head_cell]:text-xs [&_.rdp-head_cell]:font-normal [&_.rdp-caption_label]:text-lg [&_.rdp-nav_button]:w-9 [&_.rdp-nav_button]:h-9 [&_.rdp-weeknumber]:w-10 [&_.rdp-weeknumber]:h-14 [&_.rdp-weeknumber]:text-[10px] [&_.rdp-weeknumber]:text-muted-foreground/50 [&_.rdp-weeknumber]:items-center [&_.rdp-weeknumber]:justify-center [&_.rdp-weeknumber]:flex"
                              />
                            </div>
                            <div className="p-4 border-t sm:border-t-0 sm:border-l bg-muted/10 w-full sm:w-[200px] flex flex-col gap-4">
                              <div className="space-y-2">
                                <label className="text-sm font-semibold flex items-center gap-2">
                                  <Clock className="h-4 w-4" />
                                  Orario Scadenza
                                </label>
                                <Input
                                  type="time"
                                  value={newTodoTime}
                                  onChange={(e) => setNewTodoTime(e.target.value)}
                                  className="h-10 text-base bg-background"
                                />
                              </div>
                              <div className="space-y-1.5 pt-4 border-t mt-auto">
                                <span className="text-[10px] text-muted-foreground uppercase font-bold">Rapidi</span>
                                <Button variant="outline" size="sm" className="w-full justify-start h-8 text-xs bg-white" onClick={() => setNewTodoTime("09:00")}>
                                  09:00 - Inizio giornata
                                </Button>
                                <Button variant="outline" size="sm" className="w-full justify-start h-8 text-xs bg-white" onClick={() => setNewTodoTime("13:00")}>
                                  13:00 - Pausa pranzo
                                </Button>
                                <Button variant="outline" size="sm" className="w-full justify-start h-8 text-xs bg-white" onClick={() => setNewTodoTime("18:00")}>
                                  18:00 - Fine giornata
                                </Button>
                              </div>
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                      <Button
                        onClick={handleAddTodo}
                        disabled={!newTodoText.trim() || !newTodoDate || !newTodoTime || createTodoMutation.isPending}
                        size="sm"
                        className="h-9 px-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white"
                      >
                        {createTodoMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Plus className="h-4 w-4" />
                        )}
                      </Button>
                    </div>

                    {/* Tasks List */}
                    <div className="space-y-1 max-h-[500px] overflow-y-auto">
                      {pendingTodos.length === 0 && completedTodos.length === 0 ? (
                        <div className="text-center py-8">
                          <Sparkles className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                          <p className="text-sm font-medium text-muted-foreground">Nessuna attività</p>
                          <p className="text-xs text-muted-foreground">Aggiungi la tua prima task!</p>
                        </div>
                      ) : (
                        <>
                          {/* Pending Tasks */}
                          <style>{`
                        @keyframes yellow-pulse-custom {
                          0% { box-shadow: 0 0 0 0 rgba(234, 179, 8, 0); border-color: #fde047; }
                          50% { box-shadow: 0 0 0 4px rgba(234, 179, 8, 0.2); border-color: #eab308; }
                          100% { box-shadow: 0 0 0 0 rgba(234, 179, 8, 0); border-color: #fde047; }
                        }
                        .animate-yellow-pulse-custom {
                          animation: yellow-pulse-custom 2s infinite;
                        }
                      `}</style>
                          {pendingTodos.map((todo: any) => {
                            let isDueToday = false;
                            if (todo.dueDate) {
                              const today = new Date();
                              const due = new Date(todo.dueDate);
                              isDueToday = today.getDate() === due.getDate() &&
                                today.getMonth() === due.getMonth() &&
                                today.getFullYear() === due.getFullYear();
                            }

                            let daysUntilDue: number | null = null;
                            if (todo.dueDate) {
                              const today = new Date();
                              const due = new Date(todo.dueDate);
                              // Reset hours to midnight for accurate day diff
                              const todayZero = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                              const dueZero = new Date(due.getFullYear(), due.getMonth(), due.getDate());
                              const diffTime = dueZero.getTime() - todayZero.getTime();
                              daysUntilDue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                            }

                            return (
                              <div
                                key={todo.id}
                                className={`flex items-center gap-2 p-2.5 rounded-lg border bg-white hover:shadow-sm transition-all group cursor-pointer ${isDueToday ? "bg-gradient-to-r from-yellow-50 to-orange-50 animate-yellow-pulse-custom border-yellow-300" : ""
                                  }`}
                                onClick={(e) => {
                                  // Prevent trigger if clicking checkbox or dropdown
                                  if ((e.target as HTMLElement).closest('[role="checkbox"]') || (e.target as HTMLElement).closest('[data-radix-collection-item]')) return;
                                  handleEditClick(todo);
                                }}
                              >
                                <Checkbox
                                  checked={false}
                                  onCheckedChange={() => handleToggleTodo(todo)}
                                  onClick={(e) => e.stopPropagation()}
                                  className={`h-4 w-4 ${isDueToday ? "border-yellow-600 data-[state=checked]:bg-yellow-600 data-[state=checked]:border-yellow-600" : ""}`}
                                />

                                {editingTodo?.id === todo.id ? (
                                  <div className="flex-1 flex flex-col gap-2">
                                    <Input
                                      value={editingTodo.title}
                                      onChange={(e) => setEditingTodo({ ...editingTodo, title: e.target.value })}
                                      className="h-8 text-sm"
                                      autoFocus
                                    />
                                    <div className="flex gap-2">
                                      <Input
                                        type="date"
                                        value={editingTodo.dateVal}
                                        onChange={(e) => setEditingTodo({ ...editingTodo, dateVal: e.target.value })}
                                        className="h-7 text-xs w-[120px]"
                                      />
                                      <Input
                                        type="time"
                                        value={editingTodo.timeVal}
                                        onChange={(e) => setEditingTodo({ ...editingTodo, timeVal: e.target.value })}
                                        className="h-7 text-xs w-[80px]"
                                      />
                                      <div className="flex-1"></div>
                                      <Button size="sm" variant="ghost" onClick={() => setEditingTodo(null)} className="h-7 w-7 p-0">
                                        <X className="h-4 w-4 text-red-500" />
                                      </Button>
                                      <Button size="sm" variant="ghost" onClick={handleSaveEdit} className="h-7 w-7 p-0">
                                        <Check className="h-4 w-4 text-green-500" />
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    <div className="flex-1">
                                      <p className={`font-medium text-xs uppercase ${isDueToday ? "text-yellow-800 font-bold" : ""}`}>{todo.title}</p>
                                      {todo.dueDate && (
                                        <p className={`text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5 ${isDueToday ? "text-yellow-700 font-medium" : ""}`}>
                                          <CalendarIcon className="h-2.5 w-2.5" />
                                          {new Date(todo.dueDate).toLocaleDateString('it-IT')}
                                          <span className={`text-gray-300 ${isDueToday ? "text-yellow-400" : ""}`}>|</span>
                                          <Clock className="h-2.5 w-2.5" />
                                          {new Date(todo.dueDate).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                                          {daysUntilDue !== null && (
                                            <>
                                              <span className={`text-gray-300 ${isDueToday ? "text-yellow-400" : ""}`}>|</span>
                                              <span className={`${daysUntilDue < 0 ? "text-red-500 font-bold" :
                                                daysUntilDue === 0 ? "text-yellow-600 font-bold" :
                                                  daysUntilDue <= 3 ? "text-orange-500" : "text-green-600"
                                                }`}>
                                                {daysUntilDue === 0 ? "Oggi" :
                                                  daysUntilDue === 1 ? "Domani" :
                                                    daysUntilDue > 0 ? `${daysUntilDue} giorni` :
                                                      `${Math.abs(daysUntilDue)} gg scaduto`}
                                              </span>
                                            </>
                                          )}
                                        </p>
                                      )}
                                    </div>
                                    {todo.priority === 'high' && (
                                      <Badge variant="destructive" className="text-xs">
                                        <Zap className="h-3 w-3 mr-1" />
                                        Urgente
                                      </Badge>
                                    )}
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 h-8 w-8 p-0" onClick={(e) => e.stopPropagation()}>
                                          <MoreVertical className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEditClick(todo); }}>
                                          <Edit2 className="h-4 w-4 mr-2" />
                                          Modifica
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDeleteTodo(todo.id); }} className="text-red-600">
                                          <Trash2 className="h-4 w-4 mr-2" />
                                          Elimina
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </>
                                )}
                              </div>
                            );
                          })}

                          {/* Completed Tasks */}
                          {completedTodos.length > 0 && (
                            <div className="mt-6">
                              <p className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                                <Check className="h-4 w-4" />
                                Completate ({completedTodos.length})
                              </p>
                              {completedTodos.slice(0, 10).map((todo: any) => (
                                <div
                                  key={todo.id}
                                  className="flex items-center gap-3 p-3 rounded-lg bg-green-50/50 border border-green-100 opacity-60 mb-2"
                                >
                                  <Checkbox checked={true} disabled className="h-5 w-5" />
                                  <p className="flex-1 line-through text-muted-foreground text-xs uppercase">{todo.title}</p>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteTodo(todo.id)}
                                    className="h-8 w-8 p-0"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      )
                      }
                    </div>
                  </CardContent>
                </Card>

                {/* Email Widget (New) */}
                <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
                  <CardHeader className="border-b bg-gradient-to-r from-indigo-50 to-blue-50 py-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Mail className="h-4 w-4 text-indigo-600" />
                        Email da Leggere
                      </CardTitle>
                      <Link href="/communications">
                        <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50">
                          Vedi tutte
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    {emailsLoading ? (
                      <div className="flex justify-center items-center py-6">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      </div>
                    ) : recentEmails?.error ? (
                      <div className="text-center py-8 px-4 text-red-500">
                        <AlertCircle className="h-5 w-5 mx-auto mb-2" />
                        <p className="text-xs font-medium">{recentEmails.error}</p>
                      </div>
                    ) : Array.isArray(recentEmails) && recentEmails.length > 0 ? (
                      <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
                        {recentEmails
                          .slice(0, 10)
                          .slice(0, 10)
                          .map((email: any) => (
                            <div key={email.id} className="p-3 hover:bg-indigo-50/50 transition-colors group cursor-pointer" onClick={() => navigate(`/communications?emailId=${email.id}`)}>
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <span className="font-semibold text-xs text-indigo-900 truncate flex-1">
                                  {email.fromName || email.fromAddress}
                                </span>
                                <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                  {format(new Date(email.receivedAt), "d MMM HH:mm", { locale: it })}
                                </span>
                              </div>
                              <p className="text-xs text-gray-700 font-medium truncate mb-0.5">
                                {email.subject || "(Nessun oggetto)"}
                              </p>
                              <p className="text-[10px] text-muted-foreground line-clamp-1">
                                {email.preview}
                              </p>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 px-4">
                        <div className="bg-indigo-50 rounded-full h-10 w-10 flex items-center justify-center mx-auto mb-2">
                          <Mail className="h-5 w-5 text-indigo-300" />
                        </div>
                        <p className="text-xs font-medium text-gray-500">Nessuna nuova email</p>
                        <p className="text-[10px] text-gray-400 mt-1">Sei in pari con la posta!</p>
                      </div>
                    )}
                    {/* Status Footer */}
                    <div className="bg-gray-50/50 border-t p-2 flex justify-between items-center text-[10px] text-muted-foreground">
                      <span>
                        {recentEmails?.configured ? (
                          <>Account: <span className="font-medium text-indigo-700">Attivo</span></>
                        ) : (
                          <Link href="/control-panel?tab=email" className="text-red-500 hover:underline flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" /> Configura
                          </Link>
                        )}
                      </span>
                      {recentEmails?.emails?.filter((e: any) => e.unread).length > 10 && (
                        <span>+{recentEmails.emails.filter((e: any) => e.unread).length - 10} altre</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Sidebar */}
              <div className="lg:col-span-3 space-y-6">
                {/* Progress Card */}
                <Card className="shadow-lg border-0">
                  <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50 border-b py-3">
                    <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                      <TrendingUp className="h-4 w-4 text-teal-600" />
                      Progresso Giornaliero
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="relative inline-flex items-center justify-center w-24 h-24 mb-2">
                        <svg className="transform -rotate-90 w-24 h-24">
                          <circle
                            cx="48"
                            cy="48"
                            r="42"
                            stroke="currentColor"
                            strokeWidth="6"
                            fill="transparent"
                            className="text-gray-200"
                          />
                          <circle
                            cx="48"
                            cy="48"
                            r="42"
                            stroke="currentColor"
                            strokeWidth="6"
                            fill="transparent"
                            strokeDasharray={`${((completedTodos.length / Math.max(todos.length, 1)) * 100 * 2.64)} 264`}
                            className="text-cyan-500"
                          />
                        </svg>
                        <span className="absolute text-xl font-bold text-cyan-600">
                          {Math.round((completedTodos.length / Math.max(todos.length, 1)) * 100)}%
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {completedTodos.length} di {todos.length} completate
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Active Projects */}
                <Card className="shadow-lg border-0">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b py-3">
                    <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                      <Briefcase className="h-4 w-4 text-blue-600" />
                      Progetti Attivi
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3">
                    {activeProjects.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-2">
                        Nessun progetto attivo
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {activeProjects.slice(0, 4).map((project: any) => (
                          <Link key={project.id} href="/projects">
                            <div className="p-2 rounded-lg border bg-white hover:shadow-md transition-all cursor-pointer">
                              <p className="font-medium text-xs truncate">{project.title}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-[10px] px-1 py-0">
                                  {project.status}
                                </Badge>
                                {project.priority && (
                                  <Badge variant="secondary" className="text-[10px] px-1 py-0">
                                    {project.priority}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                    <Link href="/projects">
                      <Button variant="outline" className="w-full mt-3 h-8 text-xs">
                        Vedi tutti i progetti
                      </Button>
                    </Link>
                  </CardContent>
                </Card>

                {/* Quick Links */}
                <Card className="shadow-lg border-0">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b py-3">
                    <CardTitle className="text-sm font-semibold">Azioni Rapide</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 space-y-2">
                    <Link href="/projects">
                      <Button variant="outline" className="w-full justify-start h-8 text-xs">
                        <Briefcase className="h-3 w-3 mr-2" />
                        Gestisci Progetti
                      </Button>
                    </Link>
                    <Link href="/todolist">
                      <Button variant="outline" className="w-full justify-start h-8 text-xs">
                        <ListTodo className="h-3 w-3 mr-2" />
                        Lista Completa Task
                      </Button>
                    </Link>
                    <Link href="/documents">
                      <Button variant="outline" className="w-full justify-start h-8 text-xs">
                        <FileText className="h-3 w-3 mr-2" />
                        Documenti
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div >
        </div >
      </AppLayout >
      <EditTodoDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        todo={editingTodo}
        onSave={handleSaveEdit}
        onDelete={handleDeleteTodo}
      />
    </>
  );
}
