import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, User as UserIcon, Plus, Loader2, MessageSquare, Send, X } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { tasksApi, chatApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { format } from "date-fns";

export default function TasksContent() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [newTask, setNewTask] = useState("");
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [showChatPanel, setShowChatPanel] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const chatScrollRef = useRef<HTMLDivElement>(null);

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

  const createMutation = useMutation({
    mutationFn: tasksApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setNewTask("");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => tasksApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  useEffect(() => {
    if (!selectedTask) {
      setShowChatPanel(false);
    }
  }, [selectedTask]);

  const toggleTask = (id: string, done: boolean) => {
    updateMutation.mutate({ id, data: { done: !done } });
  };

  const handleAddTask = () => {
    if (newTask.trim()) {
      createMutation.mutate({ title: newTask, done: false, dueDate: "No Date", tag: "General" });
    }
  };

  const handleSendMessage = () => {
    if (chatMessage.trim() && taskChannel) {
      sendMessageMutation.mutate(chatMessage);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="w-full h-full flex">
      <div className="flex-1 overflow-auto px-8 py-6">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-3xl">✅</span>
          <h1 className="text-2xl font-bold text-foreground">Task List</h1>
        </div>

        <div className="bg-card border border-border/60 rounded-lg shadow-sm overflow-hidden">
          <div className="grid grid-cols-[30px_1fr_100px_100px_40px] gap-4 p-3 px-4 border-b border-border/60 bg-muted/50 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            <div></div>
            <div>Task Name</div>
            <div>Due Date</div>
            <div>Tag</div>
            <div></div>
          </div>

          <div className="divide-y divide-border/40">
            {tasks.map((task: any) => (
              <div 
                key={task.id} 
                className={`grid grid-cols-[30px_1fr_100px_100px_40px] gap-4 p-3 px-4 items-center group hover:bg-muted/50 transition-colors cursor-pointer ${
                  selectedTask?.id === task.id ? 'bg-primary/5 border-l-2 border-l-primary' : ''
                }`}
                onClick={() => setSelectedTask(task)}
              >
                <div className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                  <Checkbox 
                    checked={task.done} 
                    onCheckedChange={() => toggleTask(task.id, task.done)}
                    className="data-[state=checked]:bg-primary data-[state=checked]:border-primary border-muted-foreground/40"
                  />
                </div>
                <div className={`${task.done ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                  {task.title}
                </div>
                <div className={`text-sm flex items-center gap-1.5 ${task.dueDate === 'Today' ? 'text-red-600' : 'text-muted-foreground'}`}>
                  <CalendarIcon className="h-3.5 w-3.5" />
                  {task.dueDate}
                </div>
                <div>
                  <span className="bg-muted text-muted-foreground text-xs px-2 py-0.5 rounded border border-border">
                    {task.tag}
                  </span>
                </div>
                <div className="opacity-0 group-hover:opacity-100 text-muted-foreground cursor-pointer hover:bg-neutral-200 rounded p-1">
                  <UserIcon className="h-4 w-4" />
                </div>
              </div>
            ))}
            
            <div className="grid grid-cols-[30px_1fr] gap-4 p-3 px-4 items-center text-muted-foreground hover:text-foreground cursor-text group" onClick={() => document.getElementById('new-task-input-content')?.focus()}>
              <div className="flex items-center justify-center">
                <Plus className="h-4 w-4" />
              </div>
              <Input 
                id="new-task-input-content"
                placeholder="New task..." 
                className="border-none shadow-none focus-visible:ring-0 p-0 h-auto bg-transparent text-sm placeholder:text-muted-foreground"
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddTask();
                  }
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {selectedTask && (
        <div className="w-72 border-l border-border bg-card p-4 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-base truncate flex-1">{selectedTask.title}</h3>
            <button
              onClick={() => setSelectedTask(null)}
              className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-center gap-2 mb-4">
            {taskChannel ? (
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

          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Stato</span>
              <span className={`font-medium ${selectedTask.done ? 'text-green-600' : 'text-orange-600'}`}>
                {selectedTask.done ? 'Completato' : 'In corso'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Scadenza</span>
              <span className="font-medium">{selectedTask.dueDate}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Tag</span>
              <span className="bg-muted text-muted-foreground text-xs px-2 py-0.5 rounded border border-border">
                {selectedTask.tag}
              </span>
            </div>
          </div>
        </div>
      )}

      {showChatPanel && taskChannel && (
        <div className="w-80 border-l border-border flex flex-col bg-[#F5E6D3]">
          <div className="bg-[#6B7A8A] text-white px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              <span className="font-medium text-sm">Chat Attività</span>
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
            className="flex-1 overflow-y-auto p-3 space-y-3"
          >
            {chatMessages.length === 0 ? (
              <div className="text-center text-muted-foreground text-sm py-8">
                Nessun messaggio. Inizia la conversazione!
              </div>
            ) : (
              chatMessages.map((msg: any) => (
                <div key={msg.id} className={`flex gap-2 ${msg.senderId === user?.id ? 'flex-row-reverse' : ''}`}>
                  <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 text-xs font-medium flex-shrink-0">
                    {msg.senderName?.[0] || '?'}
                  </div>
                  <div className={`max-w-[70%] ${msg.senderId === user?.id ? 'text-right' : ''}`}>
                    <div className="text-xs text-muted-foreground mb-0.5">
                      {msg.senderName}
                    </div>
                    <div className={`rounded-lg px-3 py-2 text-sm ${
                      msg.senderId === user?.id 
                        ? 'bg-[#6B7A8A] text-white' 
                        : 'bg-white border'
                    }`}>
                      {msg.content}
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      {msg.createdAt && format(new Date(msg.createdAt), "HH:mm")}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-3 border-t bg-white">
            <div className="flex gap-2">
              <Input
                placeholder="Scrivi un messaggio..."
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                className="flex-1 text-sm"
              />
              <Button
                size="sm"
                onClick={handleSendMessage}
                disabled={!chatMessage.trim() || sendMessageMutation.isPending}
                className="bg-[#6B7A8A] hover:bg-[#5A6979]"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
