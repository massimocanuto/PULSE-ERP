import { AppLayout } from "@/components/layout/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, MoreHorizontal, Filter, ArrowUpDown, Loader2, Mountain, Clock, Pencil, Trash2, X, Check, CalendarDays, LayoutGrid, ChevronLeft, ChevronRight, Flag, MessageSquare, Send, Share2, Copy, Link2, Search, UserPlus, FileText, Archive, Briefcase, CheckSquare, Euro, StickyNote } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { projectsApi, tasksApi, chatApi, usersApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MountainProgress } from "@/components/MountainProgress";
import { differenceInDays, parseISO, isValid, format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, isWithinInterval } from "date-fns";
import { it } from "date-fns/locale";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useAuth } from "@/lib/auth";
import { DocumentsContent } from "./DocumentsContent";
import { ArchivioContent } from "./ArchivioContent";

const priorityColors: Record<string, string> = {
  High: "bg-red-500",
  Medium: "bg-yellow-500",
  Low: "bg-green-500",
  high: "bg-red-500",
  medium: "bg-yellow-500",
  low: "bg-green-500",
};

const statusColors: Record<string, string> = {
  "Not Started": "bg-gray-400",
  "In Progress": "bg-blue-500",
  "On Hold": "bg-yellow-500",
  "Completed": "bg-green-500",
  "Done": "bg-green-500",
};

const COLUMNS = ["Not Started", "In Progress", "Done"];

export default function Projects() {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const { user } = useAuth();
  const [newProjectTitle, setNewProjectTitle] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ title: "", status: "", priority: "", dueDate: "" });
  const [activeTab, setActiveTab] = useState("board");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showChatPanel, setShowChatPanel] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareLink, setShareLink] = useState("");
  const [shareExpiresAt, setShareExpiresAt] = useState<Date | null>(null);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedPermission, setSelectedPermission] = useState("view");
  const { toast } = useToast();

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: projectsApi.getAll,
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ["tasks"],
    queryFn: tasksApi.getAll,
  });

  const { data: projectChannel } = useQuery({
    queryKey: ["projectChannel", selectedProject?.id],
    queryFn: () => chatApi.getProjectChannel(selectedProject.id),
    enabled: !!selectedProject?.id,
  });

  const { data: chatMessages = [], refetch: refetchMessages } = useQuery({
    queryKey: ["projectChatMessages", projectChannel?.id],
    queryFn: () => chatApi.getMessages(projectChannel.id),
    enabled: !!projectChannel?.id,
    refetchInterval: 3000,
  });

  const createChannelMutation = useMutation({
    mutationFn: () => chatApi.createProjectChannel(selectedProject.id, {
      projectName: selectedProject.title,
      createdBy: user?.id || "",
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projectChannel", selectedProject?.id] });
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: (content: string) => chatApi.sendMessage(projectChannel.id, {
      content,
      senderId: user?.id || "",
      senderName: user?.name || "Utente",
    }),
    onSuccess: () => {
      refetchMessages();
      setChatMessage("");
    },
  });

  const generateShareLinkMutation = useMutation({
    mutationFn: (projectId: string) => projectsApi.generateShareLink(projectId, 7),
    onSuccess: (data) => {
      const fullUrl = `${window.location.origin}${data.shareUrl}`;
      setShareLink(fullUrl);
      setShareExpiresAt(new Date(data.expiresAt));
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });

  const removeShareLinkMutation = useMutation({
    mutationFn: (projectId: string) => projectsApi.removeShareLink(projectId),
    onSuccess: () => {
      setShareLink("");
      setShareExpiresAt(null);
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ["users"],
    queryFn: usersApi.getAll,
    enabled: showShareDialog,
  });

  const { data: projectShares = [] } = useQuery({
    queryKey: ["project-shares", selectedProject?.id],
    queryFn: () => projectsApi.getShares(selectedProject!.id),
    enabled: !!selectedProject && showShareDialog,
  });

  const addShareMutation = useMutation({
    mutationFn: ({ projectId, data }: { projectId: string; data: { userId: string; permission: string; sharedById?: string } }) =>
      projectsApi.addShare(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-shares", selectedProject?.id] });
      setSelectedUserId("");
      setUserSearchQuery("");
      toast({
        title: "Progetto condiviso",
        description: "L'utente può ora accedere a questo progetto.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile condividere il progetto",
        variant: "destructive",
      });
    },
  });

  const removeShareMutation = useMutation({
    mutationFn: ({ projectId, shareId }: { projectId: string; shareId: string }) =>
      projectsApi.removeShare(projectId, shareId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-shares", selectedProject?.id] });
      toast({
        title: "Condivisione rimossa",
        description: "L'utente non può più accedere a questo progetto.",
      });
    },
  });

  const filteredUsers = allUsers.filter((u: any) =>
    u.id !== user?.id &&
    !projectShares.some((s: any) => s.userId === u.id) &&
    (userSearchQuery.length < 2 ||
      u.name?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      u.username?.toLowerCase().includes(userSearchQuery.toLowerCase()))
  );

  const handleShareWithUser = () => {
    if (selectedProject && selectedUserId) {
      addShareMutation.mutate({
        projectId: selectedProject.id,
        data: {
          userId: selectedUserId,
          permission: selectedPermission,
          sharedById: user?.id,
        },
      });
    }
  };

  const handleShare = async () => {
    if (!selectedProject) return;

    if (selectedProject.shareToken) {
      const fullUrl = `${window.location.origin}/shared/project/${selectedProject.shareToken}`;
      setShareLink(fullUrl);
      setShareExpiresAt(selectedProject.shareExpiresAt ? new Date(selectedProject.shareExpiresAt) : null);
    } else {
      await generateShareLinkMutation.mutateAsync(selectedProject.id);
    }
    setShowShareDialog(true);
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(shareLink);
  };

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  useEffect(() => {
    if (!selectedProject) {
      setShowChatPanel(false);
    }
  }, [selectedProject]);

  const handleSendMessage = () => {
    if (chatMessage.trim() && projectChannel) {
      sendMessageMutation.mutate(chatMessage);
    }
  };

  const getProjectTasks = (project: any) => {
    const projectTasks = tasks.filter((t: any) =>
      t.tag?.toLowerCase().includes(project.title.toLowerCase().split(' ')[0]) ||
      project.title.toLowerCase().includes(t.tag?.toLowerCase() || '')
    );

    if (projectTasks.length === 0) {
      const statusProgress = project.status === 'Done' ? 100 :
        project.status === 'In Progress' ? 50 : 0;
      const total = 5;
      const done = Math.round((statusProgress / 100) * total);
      return Array.from({ length: total }, (_, i) => ({
        title: `Task ${i + 1}`,
        done: i < done
      }));
    }
    return projectTasks;
  };

  const getProjectProgress = (project: any) => {
    const projectTasks = getProjectTasks(project);
    if (projectTasks.length === 0) return 0;
    const completedTasks = projectTasks.filter((t: any) => t.done).length;
    return Math.round((completedTasks / projectTasks.length) * 100);
  };

  const getDaysUntilDeadline = (dueDate: string | null | undefined) => {
    if (!dueDate || dueDate === 'TBD') return null;
    try {
      const formats = [
        /^\d{4}-\d{2}-\d{2}$/,
        /^\d{2}\/\d{2}\/\d{4}$/,
        /^[A-Za-z]+ \d{1,2}, \d{4}$/,
      ];

      let date: Date | null = null;
      if (formats[0].test(dueDate)) {
        date = parseISO(dueDate);
      } else {
        date = new Date(dueDate);
      }

      if (!date || !isValid(date)) return null;

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      date.setHours(0, 0, 0, 0);

      return differenceInDays(date, today);
    } catch {
      return null;
    }
  };

  const createMutation = useMutation({
    mutationFn: projectsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setNewProjectTitle("");
      setDialogOpen(false);
      toast({ title: "Progetto creato", description: "Il progetto è stato creato con successo" });
    },
    onError: (error: any) => {
      console.error("Errore creazione progetto:", error);
      toast({
        title: "Errore creazione progetto",
        description: error?.message || "Si è verificato un errore durante la creazione del progetto",
        variant: "destructive"
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => projectsApi.update(id, data),
    onSuccess: (updatedProject) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setSelectedProject(updatedProject);
      setIsEditing(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => projectsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setSelectedProject(null);
    },
  });

  const startEditing = () => {
    if (selectedProject) {
      setEditForm({
        title: selectedProject.title || "",
        status: selectedProject.status || "Not Started",
        priority: selectedProject.priority || "Medium",
        dueDate: selectedProject.dueDate || "",
      });
      setIsEditing(true);
    }
  };

  const saveEdit = () => {
    if (selectedProject && editForm.title.trim()) {
      updateMutation.mutate({
        id: selectedProject.id,
        data: {
          title: editForm.title,
          status: editForm.status,
          priority: editForm.priority,
          dueDate: editForm.dueDate || "TBD",
        },
      });
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (selectedProject) {
      const confirmed = await confirm({
        title: "Elimina progetto",
        description: "Sei sicuro di voler eliminare questo progetto?",
        confirmText: "Elimina",
        variant: "destructive",
      });
      if (confirmed) {
        deleteMutation.mutate(selectedProject.id);
      }
    }
  };

  const handleCreateProject = () => {
    if (newProjectTitle.trim()) {
      createMutation.mutate({
        title: newProjectTitle,
        status: "Not Started",
        priority: "Medium",
        dueDate: "TBD",
      });
    }
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getProjectPosition = (project: any) => {
    const start = project.startDate ? parseISO(project.startDate) : parseISO(project.createdAt);
    const end = project.dueDate && project.dueDate !== 'TBD' ? parseISO(project.dueDate) : addMonths(start, 1);

    const monthStartTime = monthStart.getTime();
    const monthEndTime = monthEnd.getTime();
    const startTime = Math.max(start.getTime(), monthStartTime);
    const endTime = Math.min(end.getTime(), monthEndTime);

    if (startTime > monthEndTime || endTime < monthStartTime) return null;

    const totalDays = differenceInDays(monthEnd, monthStart) + 1;
    const leftOffset = Math.max(0, differenceInDays(new Date(startTime), monthStart));
    const width = Math.min(totalDays - leftOffset, differenceInDays(new Date(endTime), new Date(startTime)) + 1);

    return {
      left: `${(leftOffset / totalDays) * 100}%`,
      width: `${Math.max((width / totalDays) * 100, 3)}%`,
    };
  };

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
      <div className="h-full flex flex-col overflow-hidden bg-gradient-to-br from-[#f5f0e6] via-[#e8dcc8] to-[#ddd0b8] dark:from-[#2d3748] dark:via-[#374151] dark:to-[#3d4555]">
        <div className="h-32 w-full flex-shrink-0 bg-gradient-to-r from-[#4a5568] via-[#5a6a7d] to-[#6b7a8f]" />

        <div className="flex-1 overflow-auto -mt-16 px-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <div className="bg-stone-50 dark:bg-stone-900/50 rounded-xl shadow-lg border mb-6" style={{ maxWidth: "95rem" }}>
              <div className="p-6 pb-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
                    <Briefcase className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight">Progetti e Attività</h1>
                    <p className="text-sm text-muted-foreground">
                      Gestione completa di progetti, documenti e archivio
                    </p>
                  </div>
                </div>

                <TabsList className="grid grid-cols-4 gap-1 h-auto bg-transparent p-0">
                  <TabsTrigger value="board" className="flex flex-col items-center justify-center gap-0.5 px-1 py-2 text-[9px] data-[state=active]:bg-primary/20 rounded-lg" title="Board">
                    <LayoutGrid className="h-4 w-4" />
                    <span>Board</span>
                  </TabsTrigger>
                  <TabsTrigger value="timeline" className="flex flex-col items-center justify-center gap-0.5 px-1 py-2 text-[9px] data-[state=active]:bg-primary/20 rounded-lg" title="Timeline">
                    <CalendarDays className="h-4 w-4" />
                    <span>Timeline</span>
                  </TabsTrigger>
                  <TabsTrigger value="documents" className="flex flex-col items-center justify-center gap-0.5 px-1 py-2 text-[9px] data-[state=active]:bg-primary/20 rounded-lg" title="Documenti">
                    <FileText className="h-4 w-4" />
                    <span>Documenti</span>
                  </TabsTrigger>
                  <TabsTrigger value="archivio" className="flex flex-col items-center justify-center gap-0.5 px-1 py-2 text-[9px] data-[state=active]:bg-primary/20 rounded-lg" title="Archivio">
                    <Archive className="h-4 w-4" />
                    <span>Archivio</span>
                  </TabsTrigger>
                </TabsList>
              </div>
            </div>

            <div className="flex-1 overflow-hidden">
              {(activeTab === "board" || activeTab === "timeline") ? (
                <div className="h-full flex flex-col">
                  <div className="flex items-center justify-between mb-4 flex-shrink-0">
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" className="h-8 text-xs font-normal">
                        <Filter className="h-3.5 w-3.5 mr-1.5" /> Filtro
                      </Button>
                      <Button variant="outline" size="sm" className="h-8 text-xs font-normal">
                        <ArrowUpDown className="h-3.5 w-3.5 mr-1.5" /> Ordina
                      </Button>
                      {activeTab === "timeline" && (
                        <div className="flex items-center gap-2 ml-4">
                          <Button variant="outline" size="sm" className="h-8" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <span className="text-sm font-medium min-w-[150px] text-center">
                            {format(currentMonth, "MMMM yyyy", { locale: it })}
                          </span>
                          <Button variant="outline" size="sm" className="h-8" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" className="h-8 text-xs bg-primary hover:bg-primary/90" data-testid="button-new-project">
                          <Plus className="h-3.5 w-3.5 mr-1.5" /> Nuovo Progetto
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Crea Nuovo Progetto</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 pt-4">
                          <Input
                            placeholder="Titolo del progetto..."
                            value={newProjectTitle}
                            onChange={(e) => setNewProjectTitle(e.target.value)}
                            data-testid="input-project-title"
                          />
                          <Button onClick={handleCreateProject} className="w-full" data-testid="button-create-project">
                            Crea Progetto
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>

                  <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-0">
                    <div className="lg:col-span-2 overflow-auto border rounded-lg bg-card p-4">
                      {activeTab === "board" ? (
                        <ScrollArea className="h-full">
                          <div className="flex gap-4 min-w-max pb-4">
                            {COLUMNS.map(col => (
                              <div key={col} className="w-72 flex-shrink-0">
                                <div className="flex items-center justify-between mb-3 px-1">
                                  <div className="flex items-center gap-2">
                                    <span className={`px-2 py-0.5 rounded text-xs font-medium 
                                      ${col === 'Not Started' ? 'bg-neutral-200 text-neutral-700' :
                                        col === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                                          'bg-green-100 text-green-700'}
                                    `}>
                                      {col}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      {projects.filter((p: any) => p.status === col).length}
                                    </span>
                                  </div>
                                  <div className="flex gap-1">
                                    <button className="text-muted-foreground hover:bg-muted p-1 rounded"><Plus className="h-3 w-3" /></button>
                                    <button className="text-muted-foreground hover:bg-muted p-1 rounded"><MoreHorizontal className="h-3 w-3" /></button>
                                  </div>
                                </div>

                                <div className="space-y-3">
                                  {projects.filter((p: any) => p.status === col).map((project: any) => (
                                    <div
                                      key={project.id}
                                      data-testid={`card-project-${project.id}`}
                                      onClick={() => setSelectedProject(project)}
                                      className={`group bg-card border shadow-[0_1px_2px_rgba(0,0,0,0.05)] rounded-md p-3 hover:bg-muted/50 cursor-pointer transition-all hover:shadow-md ${selectedProject?.id === project.id ? 'border-primary ring-1 ring-primary/20' : 'border-border/60'
                                        }`}
                                    >
                                      <div className="flex items-start justify-between mb-2">
                                        <h3 className="font-medium text-sm text-foreground">{project.title}</h3>
                                        <button className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:bg-neutral-200 p-0.5 rounded">
                                          <MoreHorizontal className="h-3 w-3" />
                                        </button>
                                      </div>

                                      <div className="space-y-2">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <span className={`text-[10px] px-1.5 py-0.5 rounded border 
                                            ${project.priority === 'High' ? 'bg-red-50 text-red-700 border-red-100' :
                                              project.priority === 'Medium' ? 'bg-orange-50 text-orange-700 border-orange-100' :
                                                'bg-muted/50 text-muted-foreground border-neutral-100'}
                                          `}>
                                            {project.priority === 'High' ? 'Alta' : project.priority === 'Medium' ? 'Media' : 'Bassa'}
                                          </span>
                                          {(() => {
                                            const projectTasks = getProjectTasks(project);
                                            const completedTasks = projectTasks.filter((t: any) => t.done).length;
                                            return projectTasks.length > 0 && (
                                              <span className="text-[10px] px-1.5 py-0.5 rounded border bg-blue-50 text-blue-700 border-blue-100 flex items-center gap-1">
                                                <CheckSquare className="h-2.5 w-2.5" />
                                                {completedTasks}/{projectTasks.length}
                                              </span>
                                            );
                                          })()}
                                          {project.budget && parseFloat(project.budget) > 0 && (
                                            <span className="text-[10px] px-1.5 py-0.5 rounded border bg-green-50 text-green-700 border-green-100 flex items-center gap-1">
                                              <Euro className="h-2.5 w-2.5" />
                                              {parseFloat(project.budget).toLocaleString('it-IT')}
                                            </span>
                                          )}
                                        </div>

                                        {project.notes && (
                                          <p className="text-[10px] text-muted-foreground line-clamp-2 flex items-start gap-1">
                                            <StickyNote className="h-2.5 w-2.5 mt-0.5 flex-shrink-0" />
                                            {project.notes}
                                          </p>
                                        )}

                                        <div className="space-y-1">
                                          <div className="flex items-center justify-between text-[10px]">
                                            <span className="text-muted-foreground">Progresso</span>
                                            <span className="font-medium">{getProjectProgress(project)}%</span>
                                          </div>
                                          <Progress value={getProjectProgress(project)} className="h-1.5" />
                                        </div>

                                        <div className="flex items-center justify-between pt-1">
                                          <div className="flex -space-x-1.5">
                                            {(project.teamMembers || []).map((initial: string, i: number) => (
                                              <div key={i} className="h-5 w-5 rounded-full bg-muted border border-white flex items-center justify-center text-[8px] font-bold text-muted-foreground ring-1 ring-neutral-200">
                                                {initial}
                                              </div>
                                            ))}
                                          </div>
                                          <div className="flex items-center gap-1.5">
                                            {(() => {
                                              const daysLeft = getDaysUntilDeadline(project.dueDate);
                                              if (daysLeft === null) {
                                                return <span className="text-[10px] text-muted-foreground">{project.dueDate}</span>;
                                              }
                                              const isOverdue = daysLeft < 0;
                                              const isUrgent = daysLeft >= 0 && daysLeft <= 3;
                                              return (
                                                <span className={`text-[10px] flex items-center gap-1 font-medium ${isOverdue ? 'text-red-600' :
                                                    isUrgent ? 'text-orange-600' :
                                                      'text-muted-foreground'
                                                  }`}>
                                                  <Clock className="h-3 w-3" />
                                                  {isOverdue
                                                    ? `${Math.abs(daysLeft)} giorni fa`
                                                    : daysLeft === 0
                                                      ? 'Oggi!'
                                                      : `${daysLeft} giorni`
                                                  }
                                                </span>
                                              );
                                            })()}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                  <button
                                    onClick={() => {
                                      setNewProjectTitle("");
                                      setDialogOpen(true);
                                    }}
                                    className="flex items-center gap-2 text-muted-foreground hover:bg-muted w-full p-2 rounded text-sm transition-colors"
                                  >
                                    <Plus className="h-4 w-4" /> New
                                  </button>
                                </div>
                              </div>
                            ))}
                            <div className="w-8"></div>
                          </div>
                          <ScrollBar orientation="horizontal" />
                        </ScrollArea>
                      ) : (
                        <ScrollArea className="h-full px-4 pb-4">
                          <div className="bg-card rounded-lg border shadow-sm">
                            <div className="grid border-b" style={{ gridTemplateColumns: `200px repeat(${daysInMonth.length}, 1fr)` }}>
                              <div className="p-3 border-r bg-muted/50 font-medium text-sm">Progetto</div>
                              {daysInMonth.map((day, i) => (
                                <div
                                  key={i}
                                  className={`p-1 text-center text-xs border-r ${day.getDay() === 0 || day.getDay() === 6 ? 'bg-muted' : 'bg-muted/50'
                                    }`}
                                >
                                  <div className="font-medium">{format(day, "d")}</div>
                                  <div className="text-muted-foreground text-[10px]">{format(day, "EEE", { locale: it })}</div>
                                </div>
                              ))}
                            </div>

                            {projects.length === 0 ? (
                              <div className="p-8 text-center text-muted-foreground">
                                <CalendarDays className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>Nessun progetto da visualizzare</p>
                                <p className="text-sm">Crea un nuovo progetto per vederlo nella timeline</p>
                              </div>
                            ) : (
                              projects.map((project: any) => {
                                const position = getProjectPosition(project);
                                return (
                                  <div
                                    key={project.id}
                                    className="grid border-b last:border-b-0 hover:bg-muted/50"
                                    style={{ gridTemplateColumns: `200px repeat(${daysInMonth.length}, 1fr)` }}
                                  >
                                    <div className="p-3 border-r flex items-center gap-2">
                                      <div className={`w-2 h-2 rounded-full ${priorityColors[project.priority] || 'bg-gray-400'}`} />
                                      <span className="text-sm font-medium truncate">{project.title}</span>
                                    </div>
                                    <div
                                      className="relative col-span-full"
                                      style={{ gridColumn: `2 / span ${daysInMonth.length}` }}
                                    >
                                      {position && (
                                        <div
                                          className={`absolute top-1/2 -translate-y-1/2 h-6 rounded-full ${statusColors[project.status] || 'bg-blue-500'
                                            } opacity-80 hover:opacity-100 transition-opacity cursor-pointer flex items-center px-2`}
                                          style={{ left: position.left, width: position.width }}
                                          title={`${project.title} - ${project.status}`}
                                          onClick={() => setSelectedProject(project)}
                                        >
                                          <span className="text-white text-[10px] font-medium truncate">{project.title}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>

                          <div className="mt-6 flex items-center gap-6 text-xs">
                            <span className="font-medium">Legenda:</span>
                            {Object.entries(statusColors).map(([status, color]) => (
                              <div key={status} className="flex items-center gap-1.5">
                                <div className={`w-3 h-3 rounded-full ${color}`} />
                                <span>{status}</span>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      )}
                    </div>

                    <div className="lg:col-span-1 border rounded-lg bg-card p-4 overflow-auto">
                      {selectedProject ? (
                        <>
                          <div className="flex items-center justify-between mb-4">
                            {isEditing ? (
                              <Input
                                value={editForm.title}
                                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                className="font-semibold text-lg h-8"
                                autoFocus
                              />
                            ) : (
                              <h3 className="font-semibold text-lg">{selectedProject.title}</h3>
                            )}
                            <div className="flex items-center gap-1">
                              {isEditing ? (
                                <>
                                  <button
                                    onClick={saveEdit}
                                    className="text-green-600 hover:text-green-700 p-1 rounded hover:bg-green-50"
                                    title="Salva"
                                  >
                                    <Check className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={cancelEdit}
                                    className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-muted"
                                    title="Annulla"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={handleShare}
                                    className="text-muted-foreground hover:text-blue-600 p-1 rounded hover:bg-blue-50"
                                    title="Condividi"
                                  >
                                    <Share2 className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={startEditing}
                                    className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-muted"
                                    title="Modifica"
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={handleDelete}
                                    className="text-muted-foreground hover:text-red-600 p-1 rounded hover:bg-red-50"
                                    title="Elimina"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => setSelectedProject(null)}
                                    className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-muted"
                                    title="Chiudi"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 mb-4">
                            {projectChannel ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setShowChatPanel(!showChatPanel)}
                              >
                                {showChatPanel ? (
                                  <span className="relative flex h-2.5 w-2.5 mr-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                                  </span>
                                ) : (
                                  <MessageSquare className="h-4 w-4 mr-1" />
                                )}
                                Chat {chatMessages.length > 0 && `(${chatMessages.length})`}
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => createChannelMutation.mutate()}
                                disabled={createChannelMutation.isPending}
                              >
                                <MessageSquare className="h-4 w-4 mr-1" />
                                {createChannelMutation.isPending ? "Creazione..." : "Crea Chat"}
                              </Button>
                            )}
                          </div>

                          {isEditing ? (
                            <div className="space-y-3 mb-4">
                              <div>
                                <label className="text-xs text-muted-foreground mb-1 block">Stato</label>
                                <Select value={editForm.status} onValueChange={(v) => setEditForm({ ...editForm, status: v })}>
                                  <SelectTrigger className="h-8 text-sm">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Not Started">Not Started</SelectItem>
                                    <SelectItem value="In Progress">In Progress</SelectItem>
                                    <SelectItem value="Done">Done</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <label className="text-xs text-muted-foreground mb-1 block">Priorità</label>
                                <Select value={editForm.priority} onValueChange={(v) => setEditForm({ ...editForm, priority: v })}>
                                  <SelectTrigger className="h-8 text-sm">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Low">Low</SelectItem>
                                    <SelectItem value="Medium">Medium</SelectItem>
                                    <SelectItem value="High">High</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <label className="text-xs text-muted-foreground mb-1 block">Data Scadenza</label>
                                <Input
                                  type="date"
                                  value={editForm.dueDate}
                                  onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })}
                                  className="h-8 text-sm"
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 mb-4">
                              <span className={`px-2 py-0.5 rounded text-xs font-medium 
                                ${selectedProject.status === 'Not Started' ? 'bg-neutral-200 text-neutral-700' :
                                  selectedProject.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                                    'bg-green-100 text-green-700'}
                              `}>
                                {selectedProject.status}
                              </span>
                              <span className={`text-xs px-1.5 py-0.5 rounded border 
                                ${selectedProject.priority === 'High' ? 'bg-red-50 text-red-700 border-red-100' :
                                  selectedProject.priority === 'Medium' ? 'bg-orange-50 text-orange-700 border-orange-100' :
                                    'bg-muted/50 text-muted-foreground border-neutral-100'}
                              `}>
                                {selectedProject.priority}
                              </span>
                            </div>
                          )}

                          <div className="text-sm text-muted-foreground mb-4">
                            <Mountain className="inline h-4 w-4 mr-1" />
                            Progresso Attività
                          </div>

                          <MountainProgress
                            projectTitle={selectedProject.title}
                            tasks={getProjectTasks(selectedProject)}
                          />

                          <div className="mt-4 pt-4 border-t">
                            <div className="text-xs text-muted-foreground mb-2">Team</div>
                            <div className="flex -space-x-2">
                              {(selectedProject.teamMembers || []).map((initial: string, i: number) => (
                                <div key={i} className="h-8 w-8 rounded-full bg-neutral-200 border-2 border-white flex items-center justify-center text-xs font-bold text-muted-foreground">
                                  {initial}
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="mt-4 text-xs text-muted-foreground">
                            Scadenza: {selectedProject.dueDate}
                          </div>
                        </>
                      ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-4 min-h-[300px]">
                          <Briefcase className="h-12 w-12 text-muted-foreground/30 mb-4" />
                          <h3 className="font-medium text-muted-foreground mb-2">Dettagli Progetto</h3>
                          <p className="text-sm text-muted-foreground/70">
                            Seleziona un progetto per vedere i dettagli qui
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : activeTab === "documents" ? (
                <div className="flex-1 overflow-hidden px-4">
                  <DocumentsContent />
                </div>
              ) : activeTab === "archivio" ? (
                <div className="flex-1 overflow-hidden">
                  <ArchivioContent />
                </div>
              ) : null}

              {showChatPanel && projectChannel && (
                <div className="fixed inset-y-0 right-0 w-80 border-l border-border flex flex-col bg-stone-50 shadow-2xl z-50 animate-in slide-in-from-right duration-300">
                  <div className="bg-stone-800 text-white px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      <span className="font-medium text-sm">Chat Progetto</span>
                    </div>
                    <button
                      onClick={() => setShowChatPanel(false)}
                      className="text-white/80 hover:text-white"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div
                    ref={chatScrollRef}
                    className="flex-1 overflow-y-auto p-4 space-y-4"
                  >
                    {chatMessages.length === 0 ? (
                      <div className="text-center text-muted-foreground text-sm py-12 px-4">
                        <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-10" />
                        <p>Nessun messaggio. Inizia la conversazione!</p>
                      </div>
                    ) : (
                      chatMessages.map((msg: any) => (
                        <div key={msg.id} className={`flex gap-3 ${msg.senderId === user?.id ? 'flex-row-reverse' : ''}`}>
                          <Avatar className="h-8 w-8 flex-shrink-0">
                            <AvatarFallback className="text-[10px] bg-stone-200">
                              {msg.senderName?.[0] || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <div className={`max-w-[75%] ${msg.senderId === user?.id ? 'text-right' : ''}`}>
                            <div className="text-[10px] text-muted-foreground mb-1 px-1">
                              {msg.senderName} • {msg.createdAt && format(new Date(msg.createdAt), "HH:mm")}
                            </div>
                            <div className={`rounded-2xl px-3 py-2 text-sm shadow-sm ${msg.senderId === user?.id
                                ? 'bg-stone-800 text-white rounded-tr-none'
                                : 'bg-white border text-foreground rounded-tl-none'
                              }`}>
                              {msg.content}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="p-4 border-t bg-stone-100">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Scrivi un messaggio..."
                        value={chatMessage}
                        onChange={(e) => setChatMessage(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                        className="flex-1 text-sm bg-white"
                      />
                      <Button
                        size="icon"
                        onClick={handleSendMessage}
                        disabled={!chatMessage.trim() || sendMessageMutation.isPending}
                        className="bg-stone-800 hover:bg-stone-700"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Tabs>
        </div>

        <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Share2 className="h-5 w-5 text-blue-500" />
                Condividi Progetto
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="space-y-3">
                <Label className="text-sm font-medium">Condividi con utenti specifici</Label>
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
                          <AvatarFallback className="text-xs">{u.name?.[0] || "U"}</AvatarFallback>
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
                  <Button
                    onClick={handleShareWithUser}
                    disabled={!selectedUserId || addShareMutation.isPending}
                    className="flex-1"
                  >
                    <UserPlus className="h-4 w-4 mr-1" />
                    Aggiungi
                  </Button>
                </div>

                {projectShares.length > 0 && (
                  <div className="border rounded-md divide-y max-h-32 overflow-y-auto">
                    {projectShares.map((share: any) => {
                      const sharedUser = allUsers.find((u: any) => u.id === share.userId);
                      return (
                        <div key={share.id} className="flex items-center justify-between p-2">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-xs">{sharedUser?.name?.[0] || "U"}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">{sharedUser?.name || "Utente"}</p>
                              <p className="text-xs text-muted-foreground">
                                {share.permission === "view" ? "Visualizzazione" : share.permission === "edit" ? "Modifica" : "Admin"}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeShareMutation.mutate({ projectId: selectedProject!.id, shareId: share.id })}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="border-t" />

              <div className="space-y-3">
                <Label className="text-sm font-medium">Condividi tramite link pubblico</Label>
                <p className="text-xs text-muted-foreground">
                  Chi ha il link potrà visualizzare il progetto e le sue attività.
                </p>

                <div className="flex items-center gap-2">
                  <Input
                    value={shareLink}
                    readOnly
                    placeholder="Genera un link di condivisione..."
                    className="flex-1 text-sm font-mono"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={copyShareLink}
                    title="Copia link"
                    disabled={!shareLink}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>

                {shareExpiresAt && (
                  <p className="text-xs text-muted-foreground">
                    Il link scade il {format(shareExpiresAt, "d MMMM yyyy", { locale: it })}
                  </p>
                )}

                <div className="flex justify-between items-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      generateShareLinkMutation.mutate(selectedProject?.id);
                    }}
                    disabled={generateShareLinkMutation.isPending}
                  >
                    <Link2 className="h-4 w-4 mr-1" />
                    {shareLink ? "Rigenera link" : "Genera link"}
                  </Button>

                  {shareLink && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        removeShareLinkMutation.mutate(selectedProject?.id);
                      }}
                      disabled={removeShareLinkMutation.isPending}
                    >
                      Rimuovi link
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
