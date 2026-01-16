
import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { tasksApi, chatApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { format } from "date-fns";
import { Drawer } from "vaul";
import {
    Plus,
    Calendar,
    Tag,
    MessageSquare,
    Send,
    X,
    CheckCircle2,
    Circle,
    MoreVertical,
    ChevronLeft
} from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

export default function MobileTasks() {
    const [location, setLocation] = useLocation();
    const queryClient = useQueryClient();
    const { user } = useAuth();

    // State
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<any>(null);
    const [newTaskTitle, setNewTaskTitle] = useState("");
    const [chatMessage, setChatMessage] = useState("");
    const [viewMode, setViewMode] = useState<'list' | 'chat'>('list');

    const chatScrollRef = useRef<HTMLDivElement>(null);

    // Queries
    const { data: tasks = [], isLoading } = useQuery({
        queryKey: ["tasks"],
        queryFn: tasksApi.getAll,
    });

    const { data: taskChannel } = useQuery({
        queryKey: ["taskChannel", selectedTask?.id],
        queryFn: () => chatApi.getTaskChannel(selectedTask.id),
        enabled: !!selectedTask?.id,
    });

    const { data: chatMessages = [], refetch: refetchMessages } = useQuery({
        queryKey: ["taskChatMessages", taskChannel?.id],
        queryFn: () => chatApi.getMessages(taskChannel.id),
        enabled: !!taskChannel?.id,
        refetchInterval: 3000,
    });

    // Mutations
    const createMutation = useMutation({
        mutationFn: tasksApi.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["tasks"] });
            setNewTaskTitle("");
            setIsDrawerOpen(false);
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => tasksApi.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["tasks"] });
            // Don't close drawer if we are just updating status inside it
        },
    });

    const createChannelMutation = useMutation({
        mutationFn: () => chatApi.createTaskChannel(selectedTask.id, {
            taskTitle: selectedTask.title,
            createdBy: user?.id || "",
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["taskChannel", selectedTask?.id] });
        },
    });

    const sendMessageMutation = useMutation({
        mutationFn: (content: string) => chatApi.sendMessage(taskChannel.id, {
            content,
            senderId: user?.id || "",
            senderName: user?.name || "Utente",
        }),
        onSuccess: () => {
            refetchMessages();
            setChatMessage("");
        },
    });

    // Effects
    useEffect(() => {
        if (chatScrollRef.current) {
            chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
        }
    }, [chatMessages, viewMode]);

    // Handlers
    const handleToggleTask = (e: React.MouseEvent, task: any) => {
        e.stopPropagation();
        updateMutation.mutate({ id: task.id, data: { done: !task.done } });
    };

    const handleOpenTask = (task: any) => {
        setSelectedTask(task);
        setViewMode('list');
        setIsDrawerOpen(true);
    };

    const handleCreateTask = () => {
        if (newTaskTitle.trim()) {
            createMutation.mutate({
                title: newTaskTitle,
                done: false,
                dueDate: "No Date",
                tag: "General"
            });
        }
    };

    const handleSendMessage = () => {
        if (chatMessage.trim() && taskChannel) {
            sendMessageMutation.mutate(chatMessage);
        }
    };

    // Group tasks
    const pendingTasks = tasks.filter((t: any) => !t.done);
    const completedTasks = tasks.filter((t: any) => t.done);

    return (
        <div className="flex flex-col h-[100dvh] bg-background">
            {/* Header */}
            <div className="px-4 py-4 border-b flex items-center justify-between bg-card/50 backdrop-blur-sm sticky top-0 z-10">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="-ml-2" onClick={() => setLocation('/')}>
                        <ChevronLeft className="h-6 w-6" />
                    </Button>
                    <h1 className="text-xl font-bold">Tasks</h1>
                </div>
                <div className="flex items-center gap-2">
                    <div className="bg-primary/10 text-primary px-2.5 py-0.5 rounded-full text-xs font-medium">
                        {pendingTasks.length} pending
                    </div>
                </div>
            </div>

            {/* Task List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-24">
                {/* Pending Section */}
                <div className="space-y-3">
                    <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider ml-1">Da fare</h2>
                    {pendingTasks.map((task: any) => (
                        <div
                            key={task.id}
                            onClick={() => handleOpenTask(task)}
                            className="bg-card border rounded-xl p-4 shadow-sm active:scale-[0.98] transition-transform duration-200"
                        >
                            <div className="flex items-start gap-3">
                                <button
                                    onClick={(e) => handleToggleTask(e, task)}
                                    className="mt-0.5 text-muted-foreground hover:text-primary transition-colors"
                                >
                                    <Circle className="h-5 w-5" />
                                </button>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-base leading-tight mb-1">{task.title}</p>
                                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                        <span className="flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            {task.dueDate}
                                        </span>
                                        <span className="bg-muted px-1.5 py-0.5 rounded border">
                                            {task.tag}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    {pendingTasks.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground italic text-sm">
                            Nessun task in sospeso 🎉
                        </div>
                    )}
                </div>

                {/* Completed Section */}
                {completedTasks.length > 0 && (
                    <div className="space-y-3">
                        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider ml-1">Completati</h2>
                        {completedTasks.map((task: any) => (
                            <div
                                key={task.id}
                                onClick={() => handleOpenTask(task)}
                                className="bg-muted/30 border rounded-xl p-4 opacity-75"
                            >
                                <div className="flex items-start gap-3">
                                    <button
                                        onClick={(e) => handleToggleTask(e, task)}
                                        className="mt-0.5 text-green-600 transition-colors"
                                    >
                                        <CheckCircle2 className="h-5 w-5" />
                                    </button>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-base leading-tight mb-1 line-through text-muted-foreground">{task.title}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Floating Action Button */}
            <div className="fixed bottom-6 right-6 z-20">
                <Drawer.Root open={isDrawerOpen} onOpenChange={(open) => {
                    setIsDrawerOpen(open);
                    if (!open) {
                        setSelectedTask(null);
                        setNewTaskTitle("");
                        setViewMode('list');
                    }
                }}>
                    <Drawer.Trigger asChild>
                        <Button
                            size="icon"
                            className="h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground"
                            onClick={() => setSelectedTask(null)}
                        >
                            <Plus className="h-7 w-7" />
                        </Button>
                    </Drawer.Trigger>

                    <Drawer.Portal>
                        <Drawer.Overlay className="fixed inset-0 bg-black/40" />
                        <Drawer.Content className="bg-background flex flex-col rounded-t-[10px] h-[90dvh] mt-24 fixed bottom-0 left-0 right-0 focus:outline-none">
                            <div className="p-4 bg-background border-b rounded-t-[10px] flex-none">
                                <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-muted mb-6" />

                                {selectedTask ? (
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1 min-w-0 mr-4">
                                            <h2 className="text-lg font-semibold truncate">{selectedTask.title}</h2>
                                        </div>
                                        <div className="flex bg-muted rounded-lg p-1">
                                            <button
                                                onClick={() => setViewMode('list')}
                                                className={cn(
                                                    "px-3 py-1.5 text-sm font-medium rounded-md transition-all",
                                                    viewMode === 'list' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"
                                                )}
                                            >
                                                Info
                                            </button>
                                            <button
                                                onClick={() => setViewMode('chat')}
                                                className={cn(
                                                    "px-3 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-1.5",
                                                    viewMode === 'chat' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"
                                                )}
                                            >
                                                Chat
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <h2 className="text-lg font-semibold">Nuovo Task</h2>
                                )}
                            </div>

                            <div className="flex-1 overflow-y-auto bg-muted/10">
                                {selectedTask ? (
                                    // EDIT EXISTING TASK
                                    viewMode === 'list' ? (
                                        <div className="p-4 space-y-6">
                                            <div className="bg-card rounded-xl p-4 border space-y-4 shadow-sm">
                                                <div className="flex items-center justify-between pb-4 border-b">
                                                    <span className="text-muted-foreground">Stato</span>
                                                    <button
                                                        className={cn(
                                                            "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
                                                            selectedTask.done ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
                                                        )}
                                                        onClick={() => updateMutation.mutate({ id: selectedTask.id, data: { done: !selectedTask.done } })}
                                                    >
                                                        {selectedTask.done ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                                                        {selectedTask.done ? "Completato" : "In corso"}
                                                    </button>
                                                </div>

                                                <div className="space-y-1">
                                                    <label className="text-xs font-medium text-muted-foreground uppercase">Data Scadenza</label>
                                                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                                                        <Calendar className="h-5 w-5 text-muted-foreground" />
                                                        <span className="font-medium">{selectedTask.dueDate}</span>
                                                    </div>
                                                </div>

                                                <div className="space-y-1">
                                                    <label className="text-xs font-medium text-muted-foreground uppercase">Tag</label>
                                                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                                                        <Tag className="h-5 w-5 text-muted-foreground" />
                                                        <span className="font-medium">{selectedTask.tag}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        // CHAT VIEW
                                        <div className="flex flex-col h-full">
                                            <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={chatScrollRef}>
                                                {!taskChannel ? (
                                                    <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-4">
                                                        <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center">
                                                            <MessageSquare className="h-8 w-8 text-muted-foreground" />
                                                        </div>
                                                        <div>
                                                            <h3 className="font-medium text-lg">Nessuna conversazione</h3>
                                                            <p className="text-sm text-muted-foreground mt-1">
                                                                Inizia una chat per discutere di questo task.
                                                            </p>
                                                        </div>
                                                        <Button
                                                            onClick={() => createChannelMutation.mutate()}
                                                            disabled={createChannelMutation.isPending}
                                                        >
                                                            Crea Chat
                                                        </Button>
                                                    </div>
                                                ) : chatMessages.length === 0 ? (
                                                    <div className="text-center py-12 text-muted-foreground opacity-50">
                                                        Nessun messaggio. Scrivi qualcosa!
                                                    </div>
                                                ) : (
                                                    chatMessages.map((msg: any) => (
                                                        <div key={msg.id} className={cn("flex gap-2 max-w-[85%]", msg.senderId === user?.id ? "ml-auto flex-row-reverse" : "")}>
                                                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold flex-shrink-0">
                                                                {msg.senderName?.[0] || '?'}
                                                            </div>
                                                            <div className={cn(
                                                                "p-3 rounded-2xl text-sm shadow-sm",
                                                                msg.senderId === user?.id ? "bg-primary text-primary-foreground rounded-tr-none" : "bg-card border rounded-tl-none"
                                                            )}>
                                                                <p>{msg.content}</p>
                                                                <p className={cn("text-[10px] mt-1 opacity-70", msg.senderId === user?.id ? "text-primary-foreground" : "text-muted-foreground")}>
                                                                    {msg.createdAt && format(new Date(msg.createdAt), "HH:mm")}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>

                                            {taskChannel && (
                                                <div className="p-4 border-t bg-background mt-auto pb-8">
                                                    <form
                                                        className="flex gap-2"
                                                        onSubmit={(e) => {
                                                            e.preventDefault();
                                                            handleSendMessage();
                                                        }}
                                                    >
                                                        <Input
                                                            value={chatMessage}
                                                            onChange={(e) => setChatMessage(e.target.value)}
                                                            placeholder="Scrivi..."
                                                            className="flex-1 rounded-full"
                                                        />
                                                        <Button size="icon" type="submit" className="rounded-full flex-shrink-0" disabled={!chatMessage.trim()}>
                                                            <Send className="h-4 w-4" />
                                                        </Button>
                                                    </form>
                                                </div>
                                            )}
                                        </div>
                                    )
                                ) : (
                                    // CREATE NEW TASK
                                    <div className="p-4 space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Titolo del task</label>
                                            <Input
                                                autoFocus
                                                placeholder="Cosa devi fare?"
                                                value={newTaskTitle}
                                                onChange={(e) => setNewTaskTitle(e.target.value)}
                                                className="text-lg py-6"
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') handleCreateTask();
                                                }}
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-muted-foreground">Scadenza</label>
                                                <Button variant="outline" className="w-full justify-start text-muted-foreground font-normal" disabled>
                                                    <Calendar className="mr-2 h-4 w-4" />
                                                    <span>Presto</span>
                                                </Button>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-muted-foreground">Tag</label>
                                                <Button variant="outline" className="w-full justify-start text-muted-foreground font-normal" disabled>
                                                    <Tag className="mr-2 h-4 w-4" />
                                                    <span>Generale</span>
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="pt-4">
                                            <Button
                                                className="w-full h-12 text-base shadow-lg"
                                                onClick={handleCreateTask}
                                                disabled={!newTaskTitle.trim() || createMutation.isPending}
                                            >
                                                {createMutation.isPending ? "Aggiunta in corso..." : "Aggiungi Task"}
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </Drawer.Content>
                    </Drawer.Portal>
                </Drawer.Root>
            </div>
        </div>
    );
}
