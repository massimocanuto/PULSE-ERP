// FORCE REFRESH: 20251218-1625
import { AppLayout } from "@/components/layout/AppLayout";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Search, Send, Plus, Phone, Video, Info, Loader2, 
  Hash, MessageCircle, Users, User, Paperclip, X, File, Image, FileText,
  Bell, BellOff, Trash2, FolderKanban, Check, CheckCircle2, MoreVertical, Copy, Reply, Archive, ArchiveRestore,
  Folder, FolderPlus, Save, PanelRightClose, PanelRightOpen, ChevronRight, ChevronDown
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState, useEffect, useRef } from "react";
import { Separator } from "@/components/ui/separator";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { chatApi, usersApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { useConfirm } from "@/components/ui/confirm-dialog";

interface Attachment {
  url: string;
  filename: string;
  mimetype: string;
  size: number;
}

export default function Chat() {
  const { user, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewChannelDialog, setShowNewChannelDialog] = useState(false);
  const [showNewDmDialog, setShowNewDmDialog] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");
  const [newChannelDescription, setNewChannelDescription] = useState("");
  const [pendingAttachments, setPendingAttachments] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState<Set<string>>(new Set());
  const [selectionMode, setSelectionMode] = useState(false);
  const [showRightPanel, setShowRightPanel] = useState(true);
  const [folders, setFolders] = useState<{id: string; name: string; color: string; isOpen: boolean}[]>([]);
  const [savedChats, setSavedChats] = useState<{id: string; title: string; channelName: string; messageCount: number; folderId?: string}[]>([]);
  const [newFolderName, setNewFolderName] = useState("");
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
  const [saveChatTitle, setSaveChatTitle] = useState("");
  const [showSaveChatDialog, setShowSaveChatDialog] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastMessageCountRef = useRef<number>(0);

  const toggleMessageSelection = (messageId: string) => {
    setSelectedMessages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
        if (newSet.size === 0) setSelectionMode(false);
      } else {
        newSet.add(messageId);
        setSelectionMode(true);
      }
      return newSet;
    });
  };

  const clearSelection = () => {
    setSelectedMessages(new Set());
    setSelectionMode(false);
  };

  const { data: channels = [], isLoading: channelsLoading } = useQuery({
    queryKey: ["chat-channels"],
    queryFn: chatApi.getChannels,
    refetchInterval: 5000,
  });

  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: usersApi.getAll,
  });

  const activeChannel = channels.find((c: any) => c.id === activeChannelId) || channels[0];

  useEffect(() => {
    if (channels.length > 0 && !activeChannelId) {
      setActiveChannelId(channels[0].id);
    }
  }, [channels, activeChannelId]);

  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ["chat-messages", activeChannel?.id],
    queryFn: () => activeChannel ? chatApi.getMessages(activeChannel.id) : Promise.resolve([]),
    enabled: !!activeChannel,
    refetchInterval: 3000,
  });

  useEffect(() => {
    lastMessageCountRef.current = messages.length;
  }, [messages.length]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    clearSelection();
  }, [activeChannelId]);

  useEffect(() => {
    if (activeChannel) {
      chatApi.markAsRead(activeChannel.id);
    }
  }, [activeChannel?.id]);

  const sendMutation = useMutation({
    mutationFn: (data: { content: string; attachments?: string }) => 
      chatApi.sendMessage(activeChannel.id, {
        senderId: user!.id,
        senderName: user!.name,
        senderAvatar: user!.name.slice(0, 2).toUpperCase(),
        content: data.content,
        attachments: data.attachments,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat-messages", activeChannel?.id] });
      setMessageInput("");
      setPendingAttachments([]);
    },
  });

  const createChannelMutation = useMutation({
    mutationFn: (data: { name: string; description?: string; type: string }) => 
      chatApi.createChannel(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat-channels"] });
      setShowNewChannelDialog(false);
      setNewChannelName("");
      setNewChannelDescription("");
    },
  });

  const createDmMutation = useMutation({
    mutationFn: (data: { userId1: string; userId2: string; user1Name: string; user2Name: string }) => 
      chatApi.createDm(data),
    onSuccess: (newChannel) => {
      queryClient.invalidateQueries({ queryKey: ["chat-channels"] });
      setActiveChannelId(newChannel.id);
      setShowNewDmDialog(false);
    },
  });

  const deleteChannelMutation = useMutation({
    mutationFn: (id: string) => chatApi.deleteChannel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat-channels"] });
      setActiveChannelId(null);
    },
  });

  const archiveChannelMutation = useMutation({
    mutationFn: (id: string) => chatApi.archiveChannel(id, user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat-channels"] });
    },
  });

  const deleteMessageMutation = useMutation({
    mutationFn: (messageId: string) => chatApi.deleteMessage(messageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat-messages", activeChannel?.id] });
    },
  });

  const deleteMultipleMessagesMutation = useMutation({
    mutationFn: (messageIds: string[]) => chatApi.deleteMessages(messageIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat-messages", activeChannel?.id] });
      clearSelection();
    },
  });

  const handleDeleteMessage = async (messageId: string) => {
    const confirmed = await confirm({
      title: "Elimina messaggio",
      description: "Sei sicuro di voler eliminare questo messaggio?",
      confirmText: "Elimina",
      variant: "destructive",
    });
    if (confirmed) {
      deleteMessageMutation.mutate(messageId);
    }
  };

  const handleDeleteSelectedMessages = async () => {
    if (selectedMessages.size === 0) return;
    const confirmed = await confirm({
      title: `Elimina ${selectedMessages.size} messaggi`,
      description: `Sei sicuro di voler eliminare ${selectedMessages.size} messaggi selezionati?`,
      confirmText: "Elimina tutti",
      variant: "destructive",
    });
    if (confirmed) {
      deleteMultipleMessagesMutation.mutate(Array.from(selectedMessages));
    }
  };

  const handleSendMessage = () => {
    if ((messageInput.trim() || pendingAttachments.length > 0) && activeChannel) {
      sendMutation.mutate({
        content: messageInput || (pendingAttachments.length > 0 ? "📎 Allegato" : ""),
        attachments: pendingAttachments.length > 0 ? JSON.stringify(pendingAttachments) : undefined,
      });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const result = await chatApi.uploadFile(file);
        setPendingAttachments(prev => [...prev, result]);
      }
    } catch (error) {
      console.error("Upload error:", error);
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeAttachment = (index: number) => {
    setPendingAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const formatTime = (date: string | Date) => {
    try {
      return format(new Date(date), "HH:mm", { locale: it });
    } catch {
      return "";
    }
  };

  const formatDate = (date: string | Date) => {
    try {
      return format(new Date(date), "d MMMM", { locale: it });
    } catch {
      return "";
    }
  };

  const getAttachmentIcon = (mimetype: string) => {
    if (mimetype.startsWith("image/")) return <Image className="h-4 w-4" />;
    if (mimetype.includes("pdf")) return <FileText className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  const filteredChannels = channels.filter((c: any) => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeChannels = filteredChannels.filter((c: any) => !c.isArchived);
  const archivedChannels = filteredChannels.filter((c: any) => c.isArchived);

  const channelsList = activeChannels.filter((c: any) => c.type === "channel");
  const dmsList = activeChannels.filter((c: any) => c.type === "dm");
  const groupsList = activeChannels.filter((c: any) => c.type === "group");
  const projectsList = activeChannels.filter((c: any) => c.type === "project");

  if (channelsLoading || authLoading || !user) {
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
      <div className="flex h-[calc(100vh-3rem)] overflow-hidden">
        <div className="w-72 bg-[#F7F7F5]/50 border-r border-border flex flex-col shrink-0">
          <div className="p-4 border-b border-border">
            <div className="font-bold flex items-center justify-between mb-3">
              <span className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-blue-600" />
                Team Chat
              </span>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cerca..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
          </div>
          
          <ScrollArea className="flex-1 p-2">
            <div className="mb-4">
              <div className="flex items-center justify-between px-2 mb-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase">Canali</h3>
                <Dialog open={showNewChannelDialog} onOpenChange={setShowNewChannelDialog}>
                  <DialogTrigger asChild>
                    <button className="hover:bg-neutral-200 p-1 rounded">
                      <Plus className="h-3 w-3" />
                    </button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Nuovo Canale</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div>
                        <Label>Nome canale</Label>
                        <Input 
                          value={newChannelName}
                          onChange={(e) => setNewChannelName(e.target.value)}
                          placeholder="es. marketing, sviluppo..."
                        />
                      </div>
                      <div>
                        <Label>Descrizione (opzionale)</Label>
                        <Textarea 
                          value={newChannelDescription}
                          onChange={(e) => setNewChannelDescription(e.target.value)}
                          placeholder="Descrivi lo scopo del canale..."
                        />
                      </div>
                      <Button 
                        className="w-full"
                        onClick={() => createChannelMutation.mutate({
                          name: newChannelName,
                          description: newChannelDescription,
                          type: "channel",
                        })}
                        disabled={!newChannelName.trim() || createChannelMutation.isPending}
                      >
                        {createChannelMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Crea Canale
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              {channelsList.map((channel: any) => (
                <button 
                  key={channel.id}
                  onClick={() => setActiveChannelId(channel.id)}
                  className={`
                    w-full text-left px-2 py-1.5 rounded-md text-sm flex items-center justify-between
                    ${activeChannel?.id === channel.id ? 'bg-blue-100 font-medium text-blue-700' : 'hover:bg-muted text-muted-foreground hover:text-foreground'}
                  `}
                >
                  <span className="flex items-center gap-2">
                    <Hash className="h-4 w-4 text-muted-foreground" />
                    {channel.name}
                  </span>
                  {channel.unreadCount > 0 && (
                    <Badge variant="destructive" className="text-[10px] px-1.5 h-5">{channel.unreadCount}</Badge>
                  )}
                </button>
              ))}
              {channelsList.length === 0 && (
                <p className="text-xs text-muted-foreground px-2 py-2">Nessun canale</p>
              )}
            </div>

            {projectsList.length > 0 && (
              <>
                <Separator className="my-2" />
                <div className="mb-4">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase px-2 mb-2">Progetti</h3>
                  {projectsList.map((project: any) => (
                    <button 
                      key={project.id}
                      onClick={() => setActiveChannelId(project.id)}
                      className={`
                        w-full text-left px-2 py-1.5 rounded-md text-sm flex items-center justify-between
                        ${activeChannel?.id === project.id ? 'bg-purple-100 font-medium text-purple-700' : 'hover:bg-muted text-muted-foreground hover:text-foreground'}
                      `}
                    >
                      <span className="flex items-center gap-2">
                        <FolderKanban className="h-4 w-4 text-purple-500" />
                        {project.name.replace('Chat: ', '')}
                      </span>
                      {project.unreadCount > 0 && (
                        <Badge variant="destructive" className="text-[10px] px-1.5 h-5">{project.unreadCount}</Badge>
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}

            <Separator className="my-2" />

            <div className="mb-4">
              <div className="flex items-center justify-between px-2 mb-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase">Messaggi Diretti</h3>
                <Dialog open={showNewDmDialog} onOpenChange={setShowNewDmDialog}>
                  <DialogTrigger asChild>
                    <button className="hover:bg-neutral-200 p-1 rounded">
                      <Plus className="h-3 w-3" />
                    </button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Nuovo Messaggio Diretto</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-2 pt-4">
                      <Label>Seleziona utente</Label>
                      <div className="space-y-1 max-h-60 overflow-auto">
                        {users.map((targetUser: any) => (
                          <button
                            key={targetUser.id}
                            onClick={() => createDmMutation.mutate({
                              userId1: user.id,
                              userId2: targetUser.id,
                              user1Name: user.name,
                              user2Name: targetUser.name,
                            })}
                            className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted text-left"
                          >
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
                                {targetUser.name?.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium text-sm">{targetUser.name}</div>
                              <div className="text-xs text-muted-foreground">{targetUser.email}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              {dmsList.map((dm: any) => (
                <button 
                  key={dm.id}
                  onClick={() => setActiveChannelId(dm.id)}
                  className={`
                    w-full text-left px-2 py-1.5 rounded-md text-sm flex items-center justify-between
                    ${activeChannel?.id === dm.id ? 'bg-blue-100 font-medium text-blue-700' : 'hover:bg-muted text-muted-foreground hover:text-foreground'}
                  `}
                >
                  <span className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    {dm.name}
                  </span>
                  {dm.unreadCount > 0 && (
                    <Badge variant="destructive" className="text-[10px] px-1.5 h-5">{dm.unreadCount}</Badge>
                  )}
                </button>
              ))}
              {dmsList.length === 0 && (
                <p className="text-xs text-muted-foreground px-2 py-2">Nessun messaggio</p>
              )}
            </div>

            {groupsList.length > 0 && (
              <>
                <Separator className="my-2" />
                <div className="mb-4">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase px-2 mb-2">Gruppi</h3>
                  {groupsList.map((group: any) => (
                    <button 
                      key={group.id}
                      onClick={() => setActiveChannelId(group.id)}
                      className={`
                        w-full text-left px-2 py-1.5 rounded-md text-sm flex items-center justify-between
                        ${activeChannel?.id === group.id ? 'bg-blue-100 font-medium text-blue-700' : 'hover:bg-muted text-muted-foreground hover:text-foreground'}
                      `}
                    >
                      <span className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        {group.name}
                      </span>
                      {group.unreadCount > 0 && (
                        <Badge variant="destructive" className="text-[10px] px-1.5 h-5">{group.unreadCount}</Badge>
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}

            {archivedChannels.length > 0 && (
              <>
                <Separator className="my-2" />
                <div className="mb-4">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase px-2 mb-2 flex items-center gap-2">
                    <Archive className="h-3 w-3" />
                    Chat Salvate
                  </h3>
                  {archivedChannels.map((chat: any) => (
                    <button 
                      key={chat.id}
                      onClick={() => setActiveChannelId(chat.id)}
                      className={`
                        w-full text-left px-2 py-1.5 rounded-md text-sm flex items-center justify-between
                        ${activeChannel?.id === chat.id ? 'bg-amber-100 font-medium text-amber-700' : 'hover:bg-muted text-muted-foreground hover:text-foreground'}
                      `}
                    >
                      <span className="flex items-center gap-2">
                        {chat.type === "dm" ? (
                          <User className="h-4 w-4 text-amber-500" />
                        ) : chat.type === "group" ? (
                          <Users className="h-4 w-4 text-amber-500" />
                        ) : chat.type === "project" ? (
                          <FolderKanban className="h-4 w-4 text-amber-500" />
                        ) : (
                          <Hash className="h-4 w-4 text-amber-500" />
                        )}
                        <span className="truncate">{chat.name}</span>
                      </span>
                      <Archive className="h-3 w-3 text-amber-500" />
                    </button>
                  ))}
                </div>
              </>
            )}

            <Separator className="my-2" />
            
            {/* Sezione Cartelle */}
            <div className="mb-4">
              <div className="flex items-center justify-between px-2 mb-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-2">
                  <Folder className="h-3 w-3" />
                  Cartelle
                </h3>
                <Dialog open={showNewFolderDialog} onOpenChange={setShowNewFolderDialog}>
                  <DialogTrigger asChild>
                    <button className="hover:bg-neutral-200 p-1 rounded" title="Nuova cartella">
                      <FolderPlus className="h-3 w-3" />
                    </button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Nuova Cartella</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div>
                        <Label>Nome cartella</Label>
                        <Input 
                          value={newFolderName}
                          onChange={(e) => setNewFolderName(e.target.value)}
                          placeholder="es. Clienti, Progetti..."
                        />
                      </div>
                      <Button 
                        className="w-full"
                        onClick={() => {
                          if (newFolderName.trim()) {
                            const newFolder = {
                              id: `folder-${Date.now()}`,
                              name: newFolderName,
                              color: 'blue',
                              isOpen: true
                            };
                            setFolders(prev => [...prev, newFolder]);
                            setNewFolderName("");
                            setShowNewFolderDialog(false);
                          }
                        }}
                        disabled={!newFolderName.trim()}
                      >
                        <FolderPlus className="h-4 w-4 mr-2" />
                        Crea Cartella
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              
              {folders.length === 0 ? (
                <p className="text-xs text-muted-foreground px-2 py-2">Nessuna cartella</p>
              ) : (
                folders.map((folder) => (
                  <div key={folder.id} className="mb-1">
                    <button 
                      onClick={() => setFolders(prev => prev.map(f => 
                        f.id === folder.id ? {...f, isOpen: !f.isOpen} : f
                      ))}
                      className="w-full text-left px-2 py-1.5 rounded-md text-sm flex items-center justify-between hover:bg-muted text-muted-foreground hover:text-foreground"
                    >
                      <span className="flex items-center gap-2">
                        {folder.isOpen ? (
                          <ChevronDown className="h-3 w-3" />
                        ) : (
                          <ChevronRight className="h-3 w-3" />
                        )}
                        <Folder className="h-4 w-4 text-blue-500" />
                        {folder.name}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setFolders(prev => prev.filter(f => f.id !== folder.id));
                        }}
                        className="opacity-0 group-hover:opacity-100 hover:text-red-500 p-1"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </button>
                    {folder.isOpen && (
                      <div className="ml-6 space-y-1">
                        {savedChats.filter(c => c.folderId === folder.id).map(chat => (
                          <div key={chat.id} className="text-xs text-muted-foreground px-2 py-1 flex items-center gap-2 hover:bg-muted rounded">
                            <MessageCircle className="h-3 w-3" />
                            <span className="truncate">{chat.title}</span>
                            <span className="text-[10px]">({chat.messageCount})</span>
                          </div>
                        ))}
                        {savedChats.filter(c => c.folderId === folder.id).length === 0 && (
                          <p className="text-[10px] text-muted-foreground/50 px-2 py-1 italic">Vuota</p>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Azioni rapide */}
            <Separator className="my-2" />
            <div className="px-2 space-y-1">
              <Dialog open={showSaveChatDialog} onOpenChange={setShowSaveChatDialog}>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start gap-2 text-xs"
                    disabled={!activeChannel}
                  >
                    <Save className="h-3 w-3" />
                    Salva Chat
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Salva Conversazione</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div>
                      <Label>Titolo</Label>
                      <Input 
                        value={saveChatTitle}
                        onChange={(e) => setSaveChatTitle(e.target.value)}
                        placeholder="es. Discussione progetto X..."
                      />
                    </div>
                    <div>
                      <Label>Cartella (opzionale)</Label>
                      <select
                        className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
                        value={selectedFolderId || ""}
                        onChange={(e) => setSelectedFolderId(e.target.value || null)}
                      >
                        <option value="">Nessuna cartella</option>
                        {folders.map(f => (
                          <option key={f.id} value={f.id}>{f.name}</option>
                        ))}
                      </select>
                    </div>
                    <Button 
                      className="w-full"
                      onClick={() => {
                        if (saveChatTitle.trim() && activeChannel) {
                          const newSavedChat = {
                            id: `saved-${Date.now()}`,
                            title: saveChatTitle,
                            channelName: activeChannel.name,
                            messageCount: messages.length,
                            folderId: selectedFolderId || undefined
                          };
                          setSavedChats(prev => [...prev, newSavedChat]);
                          setSaveChatTitle("");
                          setSelectedFolderId(null);
                          setShowSaveChatDialog(false);
                        }
                      }}
                      disabled={!saveChatTitle.trim()}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Salva
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-start gap-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                disabled={!activeChannel || activeChannel.type === "channel"}
                onClick={async () => {
                  if (activeChannel) {
                    const confirmed = await confirm({
                      title: "Elimina conversazione",
                      description: "Sei sicuro di voler eliminare questa conversazione?",
                      confirmText: "Elimina",
                      variant: "destructive",
                    });
                    if (confirmed) {
                      deleteChannelMutation.mutate(activeChannel.id);
                    }
                  }
                }}
              >
                <Trash2 className="h-3 w-3" />
                Elimina Chat
              </Button>
            </div>
          </ScrollArea>
        </div>

        <div className="flex-1 flex flex-col bg-background relative min-w-0">
          <div className="h-14 border-b border-border flex items-center justify-between px-6 shrink-0">
            <div className="font-bold flex items-center gap-2">
              {activeChannel?.type === "dm" ? (
                <User className="h-5 w-5 text-muted-foreground" />
              ) : activeChannel?.type === "group" ? (
                <Users className="h-5 w-5 text-muted-foreground" />
              ) : (
                <Hash className="h-5 w-5 text-muted-foreground" />
              )}
              {activeChannel?.name || "Seleziona una conversazione"}
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <button className="hover:text-foreground p-2 rounded-lg hover:bg-muted">
                <Phone className="h-4 w-4" />
              </button>
              <button className="hover:text-foreground p-2 rounded-lg hover:bg-muted">
                <Video className="h-4 w-4" />
              </button>
              <button 
                className={`p-2 rounded-lg ${showRightPanel ? 'text-primary bg-primary/10' : 'hover:text-foreground hover:bg-muted'}`}
                onClick={() => setShowRightPanel(!showRightPanel)}
                title={showRightPanel ? "Nascondi dettagli" : "Mostra dettagli"}
              >
                <Info className="h-4 w-4" />
              </button>
              {activeChannel && (
                <button 
                  className={`p-2 rounded-lg ${activeChannel.isArchived ? 'hover:text-green-600 hover:bg-green-50' : 'hover:text-amber-600 hover:bg-amber-50'}`}
                  onClick={() => archiveChannelMutation.mutate(activeChannel.id)}
                  title={activeChannel.isArchived ? "Ripristina chat" : "Salva chat"}
                >
                  {activeChannel.isArchived ? (
                    <ArchiveRestore className="h-4 w-4" />
                  ) : (
                    <Archive className="h-4 w-4" />
                  )}
                </button>
              )}
              {activeChannel && activeChannel.type !== "channel" && (
                <button 
                  className="hover:text-red-600 p-2 rounded-lg hover:bg-red-50"
                  onClick={async () => {
                    const confirmed = await confirm({
                      title: "Elimina conversazione",
                      description: "Sei sicuro di voler eliminare questa conversazione?",
                      confirmText: "Elimina",
                      variant: "destructive",
                    });
                    if (confirmed) {
                      deleteChannelMutation.mutate(activeChannel.id);
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          <ScrollArea className="flex-1 p-6" ref={scrollRef} style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23e5ddd5\' fill-opacity=\'0.4\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")', backgroundColor: '#ece5dd' }}>
            {messagesLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <MessageCircle className="h-12 w-12 mb-4 opacity-50" />
                <p>Nessun messaggio. Inizia la conversazione!</p>
              </div>
            ) : (
              <div className="space-y-2 max-w-3xl mx-auto">
                {messages.map((msg: any, index: number) => {
                  const showDate = index === 0 || 
                    formatDate(msg.createdAt) !== formatDate(messages[index - 1].createdAt);
                  const isOwnMessage = msg.senderId === user.id || msg.senderName === user.name;
                  
                  let parsedAttachments: Attachment[] = [];
                  try {
                    if (msg.attachments) {
                      parsedAttachments = JSON.parse(msg.attachments);
                    }
                  } catch (e) {}

                  return (
                    <div key={msg.id}>
                      {showDate && (
                        <div className="flex items-center justify-center my-4">
                          <div className="bg-white/80 text-gray-600 text-xs px-3 py-1.5 rounded-lg shadow-sm">
                            {formatDate(msg.createdAt)}
                          </div>
                        </div>
                      )}
                      <div 
                        className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} group ${
                          selectionMode ? 'cursor-pointer' : ''
                        }`}
                        onClick={() => selectionMode && toggleMessageSelection(msg.id)}
                      >
                        {selectionMode && (
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mr-2 mt-2 transition-all ${
                            selectedMessages.has(msg.id) 
                              ? 'bg-blue-500 border-blue-500' 
                              : 'border-gray-400 group-hover:border-blue-400'
                          }`}>
                            {selectedMessages.has(msg.id) && (
                              <Check className="h-3 w-3 text-white" />
                            )}
                          </div>
                        )}
                        <div 
                          className={`relative max-w-[75%] px-3 py-2 rounded-lg shadow-sm ${
                            isOwnMessage 
                              ? 'bg-[#dcf8c6] rounded-tr-none' 
                              : 'bg-white rounded-tl-none'
                          } ${selectedMessages.has(msg.id) ? 'ring-2 ring-blue-400' : ''}`}
                        >
                          {!isOwnMessage && (
                            <span className="text-xs font-semibold text-emerald-600 block mb-1">
                              {msg.senderName}
                            </span>
                          )}
                          <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                          {parsedAttachments.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {parsedAttachments.map((att, i) => (
                                <a 
                                  key={i}
                                  href={att.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 bg-black/5 hover:bg-black/10 px-2 py-1.5 rounded text-xs transition-colors"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {getAttachmentIcon(att.mimetype)}
                                  <span className="max-w-[100px] truncate">{att.filename}</span>
                                </a>
                              ))}
                            </div>
                          )}
                          <div className="flex items-center justify-end gap-1 mt-1">
                            <span className="text-[10px] text-gray-500">{formatTime(msg.createdAt)}</span>
                            {isOwnMessage && (
                              <CheckCircle2 className="h-3 w-3 text-blue-500" />
                            )}
                          </div>
                          {!selectionMode && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <button
                                  className="absolute -right-1 -top-1 opacity-0 group-hover:opacity-100 bg-white shadow-md rounded-full p-1 transition-all"
                                  title="Opzioni messaggio"
                                >
                                  <MoreVertical className="h-3 w-3 text-gray-500" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem 
                                  onClick={(e) => { 
                                    e.stopPropagation(); 
                                    navigator.clipboard.writeText(msg.content);
                                  }}
                                >
                                  <Copy className="h-4 w-4 mr-2" />
                                  Copia testo
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={(e) => { 
                                    e.stopPropagation(); 
                                    toggleMessageSelection(msg.id);
                                  }}
                                >
                                  <CheckCircle2 className="h-4 w-4 mr-2" />
                                  Seleziona
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={(e) => { e.stopPropagation(); handleDeleteMessage(msg.id); }}
                                  className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Elimina messaggio
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>

          {selectedMessages.size > 0 && (
            <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-card border shadow-lg rounded-full px-4 py-2 flex items-center gap-4 z-50">
              <span className="text-sm font-medium">
                {selectedMessages.size} {selectedMessages.size === 1 ? 'messaggio selezionato' : 'messaggi selezionati'}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSelection}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4 mr-1" />
                  Annulla
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteSelectedMessages}
                  disabled={deleteMultipleMessagesMutation.isPending}
                >
                  {deleteMultipleMessagesMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-1" />
                  )}
                  Elimina
                </Button>
              </div>
            </div>
          )}

          <div className="p-4 border-t border-border mt-auto">
            {pendingAttachments.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2 p-2 bg-muted/50 rounded-lg">
                {pendingAttachments.map((att, i) => (
                  <div key={i} className="flex items-center gap-2 bg-card border px-2 py-1 rounded text-sm">
                    {getAttachmentIcon(att.mimetype)}
                    <span className="max-w-[100px] truncate">{att.filename}</span>
                    <button onClick={() => removeAttachment(i)} className="text-red-500 hover:text-red-700">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="bg-muted/50 border border-input rounded-xl p-2 flex items-end gap-2 focus-within:ring-1 focus-within:ring-ring focus-within:border-primary transition-all shadow-sm">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
                multiple
              />
              <button 
                className="p-2 text-muted-foreground hover:text-foreground hover:bg-neutral-200 rounded-full h-9 w-9 flex items-center justify-center shrink-0"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Paperclip className="h-5 w-5" />}
              </button>
              <textarea 
                placeholder={`Scrivi un messaggio...`}
                className="flex-1 bg-transparent border-none focus:ring-0 resize-none max-h-32 min-h-[2.5rem] py-2 text-sm outline-none"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
              <div className="flex items-center gap-1 pb-1">
                <Button 
                  size="sm"
                  className="h-8 w-8 p-0 rounded-full"
                  onClick={handleSendMessage}
                  disabled={sendMutation.isPending || (!messageInput.trim() && pendingAttachments.length === 0)}
                >
                  {sendMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <div className="text-xs text-center text-muted-foreground mt-2">
              <strong>Shift + Invio</strong> per andare a capo
            </div>
          </div>
        </div>

        {showRightPanel && activeChannel && (
          <div className="w-72 border-l border-border bg-card flex flex-col shrink-0">
            <div className="h-14 border-b border-border flex items-center justify-between px-4 shrink-0">
              <h3 className="font-semibold text-sm">Dettagli</h3>
              <button 
                className="p-1.5 rounded hover:bg-muted"
                onClick={() => setShowRightPanel(false)}
              >
                <PanelRightClose className="h-4 w-4" />
              </button>
            </div>
            
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-4">
                <div className="flex flex-col items-center text-center pb-4 border-b">
                  <Avatar className="h-16 w-16 mb-3">
                    <AvatarFallback className={`text-lg font-bold ${
                      activeChannel.type === "dm" ? "bg-blue-100 text-blue-700" : 
                      activeChannel.type === "group" ? "bg-purple-100 text-purple-700" : 
                      "bg-green-100 text-green-700"
                    }`}>
                      {activeChannel.type === "dm" ? (
                        <User className="h-8 w-8" />
                      ) : activeChannel.type === "group" ? (
                        <Users className="h-8 w-8" />
                      ) : (
                        <Hash className="h-8 w-8" />
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <h4 className="font-bold text-base">{activeChannel.name}</h4>
                  <span className="text-xs text-muted-foreground capitalize">
                    {activeChannel.type === "dm" ? "Messaggio Diretto" : 
                     activeChannel.type === "group" ? "Gruppo" : "Canale"}
                  </span>
                  {activeChannel.description && (
                    <p className="text-xs text-muted-foreground mt-2">{activeChannel.description}</p>
                  )}
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Informazioni</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Messaggi</span>
                      <span className="font-medium">{messages.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Creato il</span>
                      <span className="font-medium">
                        {activeChannel.createdAt ? format(new Date(activeChannel.createdAt), "dd/MM/yyyy", { locale: it }) : "-"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Stato</span>
                      <Badge variant={activeChannel.isArchived ? "secondary" : "default"} className="text-xs">
                        {activeChannel.isArchived ? "Archiviato" : "Attivo"}
                      </Badge>
                    </div>
                  </div>
                </div>

                <Separator />

                {activeChannel.type !== "dm" && (
                  <>
                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                        Partecipanti ({users.length})
                      </h4>
                      <div className="space-y-2 max-h-32 overflow-auto">
                        {users.slice(0, 5).map((u: any) => (
                          <div key={u.id} className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-xs bg-blue-100 text-blue-700">
                                {u.name?.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm truncate">{u.name}</span>
                          </div>
                        ))}
                        {users.length > 5 && (
                          <span className="text-xs text-muted-foreground">+{users.length - 5} altri</span>
                        )}
                      </div>
                    </div>
                    <Separator />
                  </>
                )}

                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                    File Condivisi ({messages.filter((m: any) => m.attachments).length})
                  </h4>
                  <div className="space-y-1 max-h-40 overflow-auto">
                    {messages.filter((m: any) => m.attachments).slice(-5).reverse().map((m: any) => {
                      let atts: Attachment[] = [];
                      try { atts = JSON.parse(m.attachments); } catch {}
                      return atts.map((att, i) => (
                        <a 
                          key={`${m.id}-${i}`}
                          href={att.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 p-2 rounded hover:bg-muted text-sm"
                        >
                          {att.mimetype?.startsWith("image/") ? (
                            <Image className="h-4 w-4 text-blue-500" />
                          ) : (
                            <FileText className="h-4 w-4 text-gray-500" />
                          )}
                          <span className="truncate flex-1">{att.filename}</span>
                        </a>
                      ));
                    })}
                    {messages.filter((m: any) => m.attachments).length === 0 && (
                      <p className="text-xs text-muted-foreground">Nessun file condiviso</p>
                    )}
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Azioni Rapide</h4>
                  <div className="space-y-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start gap-2 h-8"
                      onClick={() => setSelectionMode(!selectionMode)}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      {selectionMode ? "Esci selezione" : "Seleziona messaggi"}
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`w-full justify-start gap-2 h-8 ${
                        activeChannel.isArchived ? "text-green-600" : "text-amber-600"
                      }`}
                      onClick={() => archiveChannelMutation.mutate(activeChannel.id)}
                    >
                      {activeChannel.isArchived ? (
                        <><ArchiveRestore className="h-4 w-4" /> Ripristina</>
                      ) : (
                        <><Archive className="h-4 w-4" /> Archivia</>
                      )}
                    </Button>

                    {activeChannel.type !== "channel" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start gap-2 h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={async () => {
                          const confirmed = await confirm({
                            title: "Elimina conversazione",
                            description: "Sei sicuro di voler eliminare questa conversazione e tutti i messaggi?",
                            confirmText: "Elimina",
                            variant: "destructive",
                          });
                          if (confirmed) {
                            deleteChannelMutation.mutate(activeChannel.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                        Elimina conversazione
                      </Button>
                    )}
                  </div>
                </div>

                {selectedMessages.size > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                        Selezione ({selectedMessages.size})
                      </h4>
                      <div className="space-y-1">
                        <Button
                          variant="destructive"
                          size="sm"
                          className="w-full justify-start gap-2 h-8"
                          onClick={handleDeleteSelectedMessages}
                          disabled={deleteMultipleMessagesMutation.isPending}
                        >
                          {deleteMultipleMessagesMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                          Elimina selezionati
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start gap-2 h-8"
                          onClick={clearSelection}
                        >
                          <X className="h-4 w-4" />
                          Annulla selezione
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </ScrollArea>
          </div>
        )}
        
        {!showRightPanel && activeChannel && (
          <button 
            className="absolute right-0 top-1/2 -translate-y-1/2 p-2 bg-card border border-r-0 rounded-l-lg hover:bg-muted"
            onClick={() => setShowRightPanel(true)}
          >
            <PanelRightOpen className="h-4 w-4" />
          </button>
        )}
      </div>
    </AppLayout>
  );
}
