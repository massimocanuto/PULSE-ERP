import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, Plus, Phone, Video, Info, Loader2, Bell, MessageSquare, Settings, Trash2, Pencil, X, Hash, Bookmark, Archive, Eye, Sparkles, Bot, User } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { chatApi, usersApi } from "@/lib/api";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";

const CHANNEL_COLORS = [
  { id: 'blue', name: 'Blu', class: 'bg-blue-500' },
  { id: 'green', name: 'Verde', class: 'bg-green-500' },
  { id: 'red', name: 'Rosso', class: 'bg-red-500' },
  { id: 'orange', name: 'Arancione', class: 'bg-orange-500' },
  { id: 'purple', name: 'Viola', class: 'bg-purple-500' },
  { id: 'pink', name: 'Rosa', class: 'bg-pink-500' },
  { id: 'yellow', name: 'Giallo', class: 'bg-yellow-500' },
  { id: 'teal', name: 'Teal', class: 'bg-teal-500' },
  { id: 'indigo', name: 'Indaco', class: 'bg-indigo-500' },
  { id: 'cyan', name: 'Ciano', class: 'bg-cyan-500' },
];

const getColorClass = (colorId: string) => {
  const color = CHANNEL_COLORS.find(c => c.id === colorId);
  return color?.class || 'bg-blue-500';
};

export default function ChatContent() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastMessageCountRef = useRef<Record<string, number>>({});
  const isFirstLoadRef = useRef(true);

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [channelToEdit, setChannelToEdit] = useState<any>(null);
  const [channelName, setChannelName] = useState("");
  const [channelDescription, setChannelDescription] = useState("");
  const [channelColor, setChannelColor] = useState("blue");

  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveTitle, setSaveTitle] = useState("");
  const [saveNotes, setSaveNotes] = useState("");
  const [showViewSavedDialog, setShowViewSavedDialog] = useState(false);
  const [selectedSavedConversation, setSelectedSavedConversation] = useState<any>(null);
  
  const [showAiDialog, setShowAiDialog] = useState(false);
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiConversation, setAiConversation] = useState<Array<{ role: 'user' | 'ai'; content: string }>>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSendToChat, setAiSendToChat] = useState(true);
  const aiScrollRef = useRef<HTMLDivElement>(null);

  const { data: channels = [], isLoading: channelsLoading } = useQuery({
    queryKey: ["chat-channels"],
    queryFn: chatApi.getChannels,
    refetchInterval: 5000,
  });

  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: usersApi.getAll,
  });

  const { data: savedConversations = [] } = useQuery({
    queryKey: ["saved-conversations", user?.id],
    queryFn: () => user ? chatApi.getSavedConversations(user.id) : Promise.resolve([]),
    enabled: !!user,
  });

  const activeChannel = channels.find((c: any) => c.id === activeChannelId) || channels.filter((c: any) => !c.isArchived)[0];

  useEffect(() => {
    if (channels.length > 0 && !activeChannelId) {
      const nonArchivedChannels = channels.filter((c: any) => !c.isArchived);
      if (nonArchivedChannels.length > 0) {
        setActiveChannelId(nonArchivedChannels[0].id);
      }
    }
  }, [channels, activeChannelId]);

  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ["chat-messages", activeChannel?.id],
    queryFn: () => activeChannel ? chatApi.getMessages(activeChannel.id) : Promise.resolve([]),
    enabled: !!activeChannel,
    refetchInterval: 3000,
  });

  useEffect(() => {
    if (!activeChannel?.id || messages.length === 0) return;
    
    const channelId = activeChannel.id;
    const currentCount = messages.length;
    const previousCount = lastMessageCountRef.current[channelId] || 0;
    
    if (!isFirstLoadRef.current && currentCount > previousCount) {
      const newMessages = messages.slice(previousCount);
      newMessages.forEach((msg: any) => {
        if (msg.senderId !== "me") {
          toast({
            title: `Nuovo messaggio da ${msg.senderName}`,
            description: msg.content.substring(0, 50) + (msg.content.length > 50 ? "..." : ""),
          });
          
          if ("Notification" in window && Notification.permission === "granted") {
            new Notification(`${msg.senderName} in #${activeChannel.name}`, {
              body: msg.content,
              icon: "/favicon.ico",
            });
          }
        }
      });
    }
    
    lastMessageCountRef.current[channelId] = currentCount;
    isFirstLoadRef.current = false;
  }, [messages, activeChannel, toast]);

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  const sendMutation = useMutation({
    mutationFn: (content: string) => chatApi.sendMessage(activeChannel.id, {
      senderId: user?.id || "me",
      senderName: user?.name || "You",
      senderAvatar: user?.name?.slice(0, 2).toUpperCase() || "ME",
      content,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat-messages", activeChannel?.id] });
      setMessageInput("");
    },
  });

  const createChannelMutation = useMutation({
    mutationFn: (data: { name: string; description?: string; color?: string }) => 
      chatApi.createChannel({ ...data, type: "channel", unreadCount: 0 }),
    onSuccess: (newChannel) => {
      queryClient.invalidateQueries({ queryKey: ["chat-channels"] });
      setShowCreateDialog(false);
      setChannelName("");
      setChannelDescription("");
      setChannelColor("blue");
      setActiveChannelId(newChannel.id);
      toast({
        title: "Canale creato",
        description: `Il canale #${newChannel.name} è stato creato`,
      });
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Impossibile creare il canale",
        variant: "destructive",
      });
    },
  });

  const updateChannelMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name: string; description?: string; color?: string } }) => 
      chatApi.updateChannel(id, data),
    onSuccess: (updatedChannel) => {
      queryClient.invalidateQueries({ queryKey: ["chat-channels"] });
      setShowEditDialog(false);
      setChannelToEdit(null);
      setChannelName("");
      setChannelDescription("");
      toast({
        title: "Canale aggiornato",
        description: `Il canale #${updatedChannel.name} è stato aggiornato`,
      });
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Impossibile aggiornare il canale",
        variant: "destructive",
      });
    },
  });

  const deleteChannelMutation = useMutation({
    mutationFn: (id: string) => chatApi.deleteChannel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat-channels"] });
      setShowDeleteDialog(false);
      setChannelToEdit(null);
      if (activeChannelId === channelToEdit?.id) {
        setActiveChannelId(null);
      }
      toast({
        title: "Canale eliminato",
        description: "Il canale è stato eliminato",
      });
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Impossibile eliminare il canale",
        variant: "destructive",
      });
    },
  });

  const archiveChannelMutation = useMutation({
    mutationFn: (id: string) => {
      if (!user) throw new Error("Not authenticated");
      return chatApi.archiveChannel(id, user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat-channels"] });
      if (activeChannelId === channelToEdit?.id) {
        setActiveChannelId(null);
      }
      toast({
        title: "Canale archiviato",
        description: "Il canale è stato spostato nell'archivio",
      });
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Impossibile archiviare il canale",
        variant: "destructive",
      });
    },
  });

  const saveConversationMutation = useMutation({
    mutationFn: (data: { title: string; notes?: string }) => {
      if (!user || !activeChannel) throw new Error("Not authenticated or no channel");
      return chatApi.saveConversation(activeChannel.id, {
        title: data.title,
        notes: data.notes,
        userId: user.id,
        userName: user.name,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-conversations"] });
      setShowSaveDialog(false);
      setSaveTitle("");
      setSaveNotes("");
      toast({
        title: "Conversazione salvata",
        description: "La conversazione è stata salvata con successo",
      });
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Impossibile salvare la conversazione",
        variant: "destructive",
      });
    },
  });

  const deleteSavedConversationMutation = useMutation({
    mutationFn: (id: string) => chatApi.deleteSavedConversation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-conversations"] });
      setShowViewSavedDialog(false);
      setSelectedSavedConversation(null);
      toast({
        title: "Conversazione eliminata",
        description: "La conversazione salvata è stata eliminata",
      });
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Impossibile eliminare la conversazione salvata",
        variant: "destructive",
      });
    },
  });

  const createDmMutation = useMutation({
    mutationFn: (targetUser: any) => {
      if (!user) throw new Error("Not authenticated");
      return chatApi.createDm({
        userId1: user.id,
        userId2: targetUser.id,
        user1Name: user.name,
        user2Name: targetUser.name,
      });
    },
    onSuccess: (newChannel) => {
      queryClient.invalidateQueries({ queryKey: ["chat-channels"] });
      setActiveChannelId(newChannel.id);
      toast({
        title: "Chat diretta creata",
        description: `Ora puoi chattare con questo utente`,
      });
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Impossibile creare la chat diretta",
        variant: "destructive",
      });
    },
  });

  const handleStartDm = (targetUser: any) => {
    if (!user || targetUser.id === user.id) return;
    
    const existingDm = channels.find((c: any) => 
      c.type === 'dm' && (
        c.name.includes(targetUser.name) || 
        (c.userId1 === user.id && c.userId2 === targetUser.id) ||
        (c.userId1 === targetUser.id && c.userId2 === user.id)
      )
    );
    
    if (existingDm) {
      setActiveChannelId(existingDm.id);
    } else {
      createDmMutation.mutate(targetUser);
    }
  };

  const handleSendMessage = () => {
    if (messageInput.trim() && activeChannel) {
      sendMutation.mutate(messageInput);
    }
  };

  const handleCreateChannel = () => {
    if (channelName.trim()) {
      createChannelMutation.mutate({
        name: channelName.trim(),
        description: channelDescription.trim() || undefined,
        color: channelColor,
      });
    }
  };

  const handleEditChannel = () => {
    if (channelToEdit && channelName.trim()) {
      updateChannelMutation.mutate({
        id: channelToEdit.id,
        data: {
          name: channelName.trim(),
          description: channelDescription.trim() || undefined,
          color: channelColor,
        },
      });
    }
  };

  const handleDeleteChannel = () => {
    if (channelToEdit) {
      deleteChannelMutation.mutate(channelToEdit.id);
    }
  };

  const handleArchiveChannel = (channel: any) => {
    archiveChannelMutation.mutate(channel.id);
  };

  const handleSaveConversation = () => {
    if (saveTitle.trim()) {
      saveConversationMutation.mutate({
        title: saveTitle.trim(),
        notes: saveNotes.trim() || undefined,
      });
    }
  };

  const handleAskAI = async () => {
    if (!aiQuestion.trim() || !activeChannel?.id || !user) return;
    
    const userMessage = aiQuestion.trim();
    setAiConversation(prev => [...prev, { role: 'user', content: userMessage }]);
    setAiQuestion("");
    setAiLoading(true);
    
    try {
      // Passa lo storico della conversazione AI per continuità
      const result = await chatApi.askAI(activeChannel.id, userMessage, user.id, aiSendToChat, aiConversation);
      setAiConversation(prev => [...prev, { role: 'ai', content: result.response }]);
      
      // Aggiorna i messaggi se sono stati inviati alla chat
      if (aiSendToChat) {
        queryClient.invalidateQueries({ queryKey: ["chat-messages", activeChannel.id] });
      }
      
      setTimeout(() => {
        aiScrollRef.current?.scrollTo({ top: aiScrollRef.current.scrollHeight, behavior: 'smooth' });
      }, 100);
    } catch (error) {
      setAiConversation(prev => [...prev, { role: 'ai', content: "Si è verificato un errore. Riprova più tardi." }]);
      toast({
        title: "Errore",
        description: "Impossibile ottenere la risposta dall'AI.",
        variant: "destructive",
      });
    } finally {
      setAiLoading(false);
    }
  };

  const openSaveDialog = () => {
    setSaveTitle(activeChannel?.name || "");
    setSaveNotes("");
    setShowSaveDialog(true);
  };

  const openViewSavedDialog = async (saved: any) => {
    try {
      const fullSaved = await chatApi.getSavedConversation(saved.id);
      setSelectedSavedConversation(fullSaved);
      setShowViewSavedDialog(true);
    } catch {
      toast({
        title: "Errore",
        description: "Impossibile caricare la conversazione salvata",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (channel: any) => {
    setChannelToEdit(channel);
    setChannelName(channel.name);
    setChannelDescription(channel.description || "");
    setChannelColor(channel.color || "blue");
    setShowEditDialog(true);
  };

  const openDeleteDialog = (channel: any) => {
    setChannelToEdit(channel);
    setShowDeleteDialog(true);
  };

  const formatTime = (date: string | Date) => {
    try {
      return format(new Date(date), "h:mm a");
    } catch {
      return "";
    }
  };

  const formatDate = (date: string | Date) => {
    try {
      return format(new Date(date), "dd/MM/yyyy HH:mm");
    } catch {
      return "";
    }
  };

  const publicChannels = channels.filter((c: any) => c.type === 'channel' && !c.isArchived);
  const documentChannels = channels.filter((c: any) => c.type === 'document' && !c.isArchived);
  const archivedChannels = channels.filter((c: any) => c.isArchived);
  const dmChannels = channels.filter((c: any) => c.type === 'dm' && !c.isArchived);

  if (channelsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex h-full">
      <div className="w-64 bg-gradient-to-b from-teal-600 via-cyan-600 to-blue-600 border-r border-border flex flex-col text-white">
        <div className="p-4 border-b border-white/20">
           <div className="font-bold flex items-center justify-between">
              <span>Team Chat</span>
              <button 
                onClick={() => {
                  setChannelName("");
                  setChannelDescription("");
                  setChannelColor("blue");
                  setShowCreateDialog(true);
                }}
                className="hover:bg-white/20 p-1 rounded"
                title="Crea nuovo canale"
              >
                <Plus className="h-4 w-4" />
              </button>
           </div>
        </div>
        
        <ScrollArea className="flex-1 p-2">
           <div className="mb-4">
              <h3 className="text-xs font-semibold text-white/70 uppercase px-2 mb-2">Canali</h3>
              {publicChannels.map((channel: any) => (
                 <div 
                    key={channel.id}
                    className={`
                       w-full text-left px-2 py-1.5 rounded-md text-sm flex items-center justify-between group
                       ${activeChannel?.id === channel.id ? 'bg-white/20 font-medium' : 'hover:bg-white/10 text-white/80 hover:text-white'}
                    `}
                 >
                    <button 
                      onClick={() => setActiveChannelId(channel.id)}
                      className="flex items-center gap-2 flex-1 text-left"
                    >
                       <span className={`w-3 h-3 rounded-full ${getColorClass(channel.color || 'blue')}`} />
                       <span>{channel.name}</span>
                    </button>
                    <div className="flex items-center gap-1">
                      {channel.unreadCount > 0 && (
                         <span className="bg-red-500 text-white text-[10px] px-1.5 rounded-full font-bold">{channel.unreadCount}</span>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/20 rounded transition-opacity">
                            <Settings className="h-3 w-3 text-white/70" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem onClick={() => openEditDialog(channel)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Modifica
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleArchiveChannel(channel)}>
                            <Archive className="h-4 w-4 mr-2" />
                            Archivia
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => openDeleteDialog(channel)}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Elimina
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                 </div>
              ))}
              {publicChannels.length === 0 && (
                <p className="text-xs text-white/60 px-2">Nessun canale. Creane uno!</p>
              )}
           </div>
           
           {documentChannels.length > 0 && (
             <div className="mb-4">
                <h3 className="text-xs font-semibold text-white/70 uppercase px-2 mb-2 flex items-center gap-1">
                  📄 Chat Documenti
                </h3>
                {documentChannels.map((channel: any) => (
                   <button 
                      key={channel.id}
                      onClick={() => setActiveChannelId(channel.id)}
                      className={`
                         w-full text-left px-2 py-1.5 rounded-md text-sm flex items-center justify-between
                         ${activeChannel?.id === channel.id ? 'bg-white/20 font-medium' : 'hover:bg-white/10 text-white/80 hover:text-white'}
                      `}
                   >
                      <span className="flex items-center gap-2 truncate">
                         <span className={`w-3 h-3 rounded-full ${getColorClass(channel.color || 'purple')}`} />
                         <span className="truncate">{channel.name}</span>
                      </span>
                      {channel.unreadCount > 0 && (
                         <span className="bg-red-500 text-white text-[10px] px-1.5 rounded-full font-bold">{channel.unreadCount}</span>
                      )}
                   </button>
                ))}
             </div>
           )}
           
           {dmChannels.length > 0 && (
             <div className="mb-4">
                <h3 className="text-xs font-semibold text-white/70 uppercase px-2 mb-2">Messaggi Diretti</h3>
                {dmChannels.map((channel: any) => (
                   <button 
                      key={channel.id}
                      onClick={() => setActiveChannelId(channel.id)}
                      className={`
                         w-full text-left px-2 py-1.5 rounded-md text-sm flex items-center justify-between
                         ${activeChannel?.id === channel.id ? 'bg-white/20 font-medium' : 'hover:bg-white/10 text-white/80 hover:text-white'}
                      `}
                   >
                      <span className="flex items-center gap-2 truncate">
                         <Avatar className="h-5 w-5">
                           <AvatarFallback className="bg-white/20 text-white text-[8px] font-bold">
                             {channel.name?.split(' - ')[1]?.slice(0, 2).toUpperCase() || 'DM'}
                           </AvatarFallback>
                         </Avatar>
                         <span className="truncate">{channel.name?.split(' - ').find((n: string) => n !== user?.name) || channel.name}</span>
                      </span>
                      {channel.unreadCount > 0 && (
                         <span className="bg-red-500 text-white text-[10px] px-1.5 rounded-full font-bold">{channel.unreadCount}</span>
                      )}
                   </button>
                ))}
             </div>
           )}

           {savedConversations.length > 0 && (
             <div className="mb-4">
                <h3 className="text-xs font-semibold text-white/70 uppercase px-2 mb-2 flex items-center gap-1">
                  <Bookmark className="h-3 w-3" />
                  Chat Salvate
                </h3>
                {savedConversations.map((saved: any) => (
                   <button 
                      key={saved.id}
                      onClick={() => openViewSavedDialog(saved)}
                      className="w-full text-left px-2 py-1.5 rounded-md text-sm flex items-center justify-between hover:bg-white/10 text-white/80 hover:text-white group"
                   >
                      <span className="flex items-center gap-2 truncate">
                         <Bookmark className="h-3.5 w-3.5 text-amber-300" />
                         <span className="truncate">{saved.title}</span>
                      </span>
                      <Eye className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                   </button>
                ))}
             </div>
           )}

           {archivedChannels.length > 0 && (
             <div className="mb-4">
                <h3 className="text-xs font-semibold text-white/70 uppercase px-2 mb-2 flex items-center gap-1">
                  <Archive className="h-3 w-3" />
                  Archiviato
                </h3>
                {archivedChannels.map((channel: any) => (
                   <button 
                      key={channel.id}
                      onClick={() => setActiveChannelId(channel.id)}
                      className={`
                         w-full text-left px-2 py-1.5 rounded-md text-sm flex items-center justify-between opacity-60 hover:opacity-100
                         ${activeChannel?.id === channel.id ? 'bg-white/20 font-medium' : 'hover:bg-white/10 text-white/80 hover:text-white'}
                      `}
                   >
                      <span className="flex items-center gap-2 truncate">
                         <span className={`w-3 h-3 rounded-full opacity-60 ${getColorClass(channel.color || 'blue')}`} />
                         <span className="truncate">{channel.name}</span>
                      </span>
                   </button>
                ))}
             </div>
           )}
           
           <div className="mb-4">
              <h3 className="text-xs font-semibold text-white/70 uppercase px-2 mb-2">Utenti Online</h3>
              <style>{`
                @keyframes pulse-status {
                  0%, 100% { opacity: 1; transform: scale(1); }
                  50% { opacity: 0.5; transform: scale(0.85); }
                }
                .status-blink {
                  animation: pulse-status 1.5s ease-in-out infinite;
                }
              `}</style>
              {users.filter((u: any) => u.id !== user?.id).map((otherUser: any) => (
                 <button 
                    key={otherUser.id}
                    onClick={() => handleStartDm(otherUser)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm hover:bg-white/10 cursor-pointer text-left group"
                    title={`Invia messaggio a ${otherUser.name}`}
                 >
                    <div className="relative">
                       <Avatar className="h-6 w-6">
                          <AvatarFallback className="bg-white/20 text-white text-[10px] font-bold">
                            {otherUser.avatar || otherUser.name?.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                       </Avatar>
                       <span 
                         className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white status-blink ${
                           otherUser.status === 'Active' ? 'bg-green-400' : 
                           otherUser.status === 'Offline' ? 'bg-red-400' : 'bg-yellow-400'
                         }`}
                       />
                    </div>
                    <span className="text-white truncate flex-1">{otherUser.name}</span>
                    <MessageSquare className="h-3.5 w-3.5 text-white/70 opacity-0 group-hover:opacity-100 transition-opacity" />
                 </button>
              ))}
           </div>
        </ScrollArea>
      </div>

      <div className="flex-1 flex flex-col bg-[#F5E6D3]">
         <div className="h-14 border-b border-border flex items-center justify-between px-6 shrink-0">
            <div className="font-bold flex items-center gap-2">
               <span className="text-muted-foreground text-lg">#</span>
               {activeChannel?.name || "Seleziona un canale"}
               {activeChannel?.description && (
                 <span className="text-sm font-normal text-muted-foreground ml-2">— {activeChannel.description}</span>
               )}
               {activeChannel?.isArchived && (
                 <span className="text-xs bg-neutral-200 text-muted-foreground px-2 py-0.5 rounded-full ml-2">Archiviato</span>
               )}
            </div>
            <div className="flex items-center gap-4 text-muted-foreground">
               <button 
                 className="hover:opacity-80 transition-opacity relative" 
                 onClick={() => {
                   setAiQuestion("");
                   setAiConversation([]);
                   setShowAiDialog(true);
                 }}
                 title="Chiedi all'AI"
                 disabled={!activeChannel}
               >
                 <span className="relative flex h-4 w-4">
                   <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                   <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500"></span>
                 </span>
               </button>
               <button 
                 className="hover:text-foreground" 
                 onClick={openSaveDialog}
                 title="Salva conversazione"
                 disabled={!activeChannel || messages.length === 0}
               >
                 <Bookmark className="h-4 w-4" />
               </button>
               <button className="hover:text-foreground"><Phone className="h-4 w-4" /></button>
               <button className="hover:text-foreground"><Video className="h-4 w-4" /></button>
               <button className="hover:text-foreground"><Info className="h-4 w-4" /></button>
            </div>
         </div>

         <ScrollArea className="flex-1 p-6" ref={scrollRef}>
            {messagesLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Nessun messaggio. Inizia la conversazione!
              </div>
            ) : (
              <div className="space-y-6">
                 {messages.map((msg: any) => (
                    <div key={msg.id} className="flex gap-4 group">
                       {msg.senderId === "pulse-ai" ? (
                         <div className="h-9 w-9 rounded-md bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                           <Bot className="h-5 w-5 text-white" />
                         </div>
                       ) : (
                         <Avatar className="h-9 w-9 rounded-md cursor-pointer hover:opacity-90">
                            <AvatarFallback className="bg-orange-100 text-orange-700 rounded-md text-xs font-bold">{msg.senderAvatar || msg.senderName?.[0]}</AvatarFallback>
                         </Avatar>
                       )}
                       <div className="flex-1">
                          <div className="flex items-baseline gap-2 mb-1">
                             <span className={`font-semibold text-sm ${msg.senderId === "pulse-ai" ? "text-purple-600" : "hover:underline cursor-pointer"}`}>
                               {msg.senderId === "pulse-ai" ? "PULSE AI" : msg.senderName}
                             </span>
                             <span className="text-xs text-muted-foreground">{formatTime(msg.createdAt)}</span>
                          </div>
                          <p className="text-sm text-foreground leading-relaxed">{msg.content}</p>
                       </div>
                    </div>
                 ))}
              </div>
            )}
         </ScrollArea>

         <div className="p-4 border-t border-border mt-auto">
            <div className="bg-muted/50 border border-input rounded-xl p-2 flex items-end gap-2 focus-within:ring-1 focus-within:ring-ring focus-within:border-primary transition-all shadow-sm">
               <button className="p-2 text-muted-foreground hover:bg-neutral-200 rounded-full h-9 w-9 flex items-center justify-center shrink-0">
                  <Plus className="h-5 w-5" />
               </button>
               <textarea 
                  placeholder={`Messaggio in #${activeChannel?.name || 'canale'}`}
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
                  <button 
                    className="p-2 text-primary hover:bg-primary/10 rounded-full h-8 w-8 flex items-center justify-center transition-colors"
                    onClick={handleSendMessage}
                  >
                     <Send className="h-4 w-4" />
                  </button>
               </div>
            </div>
            <div className="text-xs text-center text-muted-foreground mt-2">
               <strong>Shift + Invio</strong> per andare a capo
            </div>
         </div>
      </div>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Hash className="h-5 w-5" />
              Crea Nuovo Canale
            </DialogTitle>
            <DialogDescription>
              Crea un nuovo canale per comunicare con il tuo team
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="channel-name">Nome del canale</Label>
              <Input
                id="channel-name"
                placeholder="es. marketing, vendite, supporto..."
                value={channelName}
                onChange={(e) => setChannelName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="channel-description">Descrizione (opzionale)</Label>
              <Textarea
                id="channel-description"
                placeholder="Descrivi lo scopo del canale..."
                value={channelDescription}
                onChange={(e) => setChannelDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Colore del canale</Label>
              <div className="flex flex-wrap gap-2">
                {CHANNEL_COLORS.map((color) => (
                  <button
                    key={color.id}
                    type="button"
                    onClick={() => setChannelColor(color.id)}
                    className={`w-8 h-8 rounded-full ${color.class} transition-all ${
                      channelColor === color.id 
                        ? 'ring-2 ring-offset-2 ring-gray-900 scale-110' 
                        : 'hover:scale-105'
                    }`}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Annulla
            </Button>
            <Button onClick={handleCreateChannel} disabled={!channelName.trim() || createChannelMutation.isPending}>
              {createChannelMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Crea Canale
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5" />
              Modifica Canale
            </DialogTitle>
            <DialogDescription>
              Modifica le informazioni del canale #{channelToEdit?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-channel-name">Nome del canale</Label>
              <Input
                id="edit-channel-name"
                placeholder="es. marketing, vendite, supporto..."
                value={channelName}
                onChange={(e) => setChannelName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-channel-description">Descrizione (opzionale)</Label>
              <Textarea
                id="edit-channel-description"
                placeholder="Descrivi lo scopo del canale..."
                value={channelDescription}
                onChange={(e) => setChannelDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Colore del canale</Label>
              <div className="flex flex-wrap gap-2">
                {CHANNEL_COLORS.map((color) => (
                  <button
                    key={color.id}
                    type="button"
                    onClick={() => setChannelColor(color.id)}
                    className={`w-8 h-8 rounded-full ${color.class} transition-all ${
                      channelColor === color.id 
                        ? 'ring-2 ring-offset-2 ring-gray-900 scale-110' 
                        : 'hover:scale-105'
                    }`}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Annulla
            </Button>
            <Button onClick={handleEditChannel} disabled={!channelName.trim() || updateChannelMutation.isPending}>
              {updateChannelMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Salva Modifiche
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Elimina Canale
            </DialogTitle>
            <DialogDescription>
              Sei sicuro di voler eliminare il canale <strong>#{channelToEdit?.name}</strong>? 
              Questa azione eliminerà anche tutti i messaggi e non può essere annullata.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Annulla
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteChannel} 
              disabled={deleteChannelMutation.isPending}
            >
              {deleteChannelMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Elimina Canale
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bookmark className="h-5 w-5 text-amber-500" />
              Salva Conversazione
            </DialogTitle>
            <DialogDescription>
              Salva questa conversazione per riferimento futuro
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="save-title">Titolo</Label>
              <Input
                id="save-title"
                placeholder="es. Riunione progetto, Decisioni importanti..."
                value={saveTitle}
                onChange={(e) => setSaveTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="save-notes">Note (opzionale)</Label>
              <Textarea
                id="save-notes"
                placeholder="Aggiungi note o commenti..."
                value={saveNotes}
                onChange={(e) => setSaveNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Annulla
            </Button>
            <Button onClick={handleSaveConversation} disabled={!saveTitle.trim() || saveConversationMutation.isPending}>
              {saveConversationMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Salva
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showViewSavedDialog} onOpenChange={setShowViewSavedDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bookmark className="h-5 w-5 text-amber-500" />
              {selectedSavedConversation?.title}
            </DialogTitle>
            <DialogDescription>
              Salvata il {selectedSavedConversation?.createdAt && formatDate(selectedSavedConversation.createdAt)} da {selectedSavedConversation?.userName}
            </DialogDescription>
          </DialogHeader>
          {selectedSavedConversation?.notes && (
            <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-sm">
              <strong className="text-amber-800">Note:</strong> <span className="text-amber-700">{selectedSavedConversation.notes}</span>
            </div>
          )}
          <ScrollArea className="flex-1 border rounded-md p-4 bg-[#F5E6D3]">
            {selectedSavedConversation?.messages?.length > 0 ? (
              <div className="space-y-4">
                {selectedSavedConversation.messages.map((msg: any, index: number) => (
                  <div key={index} className="flex gap-3">
                    <Avatar className="h-8 w-8 rounded-md">
                      <AvatarFallback className="bg-orange-100 text-orange-700 rounded-md text-xs font-bold">
                        {msg.senderAvatar || msg.senderName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-baseline gap-2 mb-0.5">
                        <span className="font-semibold text-sm">{msg.senderName}</span>
                        <span className="text-xs text-muted-foreground">{formatTime(msg.createdAt)}</span>
                      </div>
                      <p className="text-sm text-foreground">{msg.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">Nessun messaggio nella conversazione salvata</p>
            )}
          </ScrollArea>
          <DialogFooter>
            <Button 
              variant="destructive" 
              onClick={() => selectedSavedConversation && deleteSavedConversationMutation.mutate(selectedSavedConversation.id)}
              disabled={deleteSavedConversationMutation.isPending}
            >
              {deleteSavedConversationMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
              Elimina
            </Button>
            <Button variant="outline" onClick={() => setShowViewSavedDialog(false)}>
              Chiudi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAiDialog} onOpenChange={setShowAiDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              PULSE AI Assistant
            </DialogTitle>
            <DialogDescription>
              Chiedi all'AI di analizzare la conversazione o rispondere alle tue domande
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4 flex-1 overflow-hidden flex flex-col">
            <div className="space-y-2">
              <Label htmlFor="ai-question">La tua domanda</Label>
              <div className="flex gap-2">
                <Input
                  id="ai-question"
                  placeholder="Es: Riassumi la conversazione, Quali sono i punti chiave discussi?..."
                  value={aiQuestion}
                  onChange={(e) => setAiQuestion(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !aiLoading && handleAskAI()}
                  className="flex-1"
                />
                <Button 
                  onClick={handleAskAI} 
                  disabled={!aiQuestion.trim() || aiLoading}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            
            <div className="flex gap-2 flex-wrap">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => { setAiQuestion("Riassumi la conversazione"); }}
                className="text-xs"
              >
                Riassumi
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => { setAiQuestion("Quali sono i punti chiave discussi?"); }}
                className="text-xs"
              >
                Punti chiave
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => { setAiQuestion("Quali azioni sono state proposte?"); }}
                className="text-xs"
              >
                Azioni proposte
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => { setAiQuestion("C'è qualcosa di urgente da gestire?"); }}
                className="text-xs"
              >
                Urgenze
              </Button>
            </div>
            
            <div className="flex items-center gap-2 py-2 px-3 bg-purple-50 rounded-lg">
              <input 
                type="checkbox"
                id="send-to-chat"
                checked={aiSendToChat}
                onChange={(e) => setAiSendToChat(e.target.checked)}
                className="h-4 w-4 rounded border-purple-300 text-purple-600 focus:ring-purple-500"
              />
              <Label htmlFor="send-to-chat" className="text-sm text-purple-700 cursor-pointer">
                Invia domanda e risposta nella chat del canale
              </Label>
            </div>
            
            {aiConversation.length > 0 && (
              <ScrollArea ref={aiScrollRef} className="flex-1 border rounded-md p-4 bg-purple-50 min-h-[200px]">
                <div className="space-y-4">
                  {aiConversation.map((msg, idx) => (
                    <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                      {msg.role === 'ai' && (
                        <div className="shrink-0">
                          <div className="h-8 w-8 rounded-full bg-purple-600 flex items-center justify-center">
                            <Bot className="h-4 w-4 text-white" />
                          </div>
                        </div>
                      )}
                      <div className={`flex-1 max-w-[80%] prose prose-sm ${msg.role === 'user' ? 'bg-blue-100 rounded-lg p-3' : ''}`}>
                        <p className="text-sm text-foreground whitespace-pre-wrap m-0">{msg.content}</p>
                      </div>
                      {msg.role === 'user' && (
                        <div className="shrink-0">
                          <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                            <User className="h-4 w-4 text-white" />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  {aiLoading && (
                    <div className="flex gap-3">
                      <div className="shrink-0">
                        <div className="h-8 w-8 rounded-full bg-purple-600 flex items-center justify-center">
                          <Loader2 className="h-4 w-4 text-white animate-spin" />
                        </div>
                      </div>
                      <div className="flex items-center text-purple-600 text-sm">
                        PULSE AI sta pensando...
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            )}
            
            {aiConversation.length === 0 && !aiLoading && (
              <div className="flex-1 border rounded-md p-8 bg-purple-50/50 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <Bot className="h-12 w-12 mx-auto mb-3 text-purple-300" />
                  <p className="text-sm">Fai una domanda per iniziare la conversazione con PULSE AI</p>
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAiDialog(false)}>
              Chiudi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
