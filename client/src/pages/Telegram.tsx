import { AppLayout } from "@/components/layout/AppLayout";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Search, Send, Paperclip, Smile, Loader2, Menu, Phone, MoreVertical, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { telegramApi } from "@/lib/api";
import { format } from "date-fns";

export default function Telegram() {
  const queryClient = useQueryClient();
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState("");

  const { data: botInfo, isLoading: botLoading } = useQuery({
    queryKey: ["telegram-bot-info"],
    queryFn: telegramApi.getBotInfo,
  });

  const { data: chats = [], isLoading: chatsLoading } = useQuery({
    queryKey: ["telegram-chats"],
    queryFn: telegramApi.getChats,
  });

  const selectedChat = chats.find((c: any) => c.id === selectedChatId) || chats[0];

  useEffect(() => {
    if (chats.length > 0 && !selectedChatId) {
      setSelectedChatId(chats[0].id);
    }
  }, [chats, selectedChatId]);

  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ["telegram-messages", selectedChat?.id],
    queryFn: () => selectedChat ? telegramApi.getMessages(selectedChat.id) : Promise.resolve([]),
    enabled: !!selectedChat,
    refetchInterval: 5000,
  });

  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      await telegramApi.sendTelegram(selectedChat.chatId, content);
      return telegramApi.sendMessage(selectedChat.id, {
        content,
        direction: "outgoing",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["telegram-messages", selectedChat?.id] });
      setMessageInput("");
    },
  });

  const handleSendMessage = () => {
    if (messageInput.trim() && selectedChat) {
      sendMutation.mutate(messageInput);
    }
  };

  const formatTime = (date: string | Date) => {
    try {
      return format(new Date(date), "h:mm a");
    } catch {
      return "";
    }
  };

  const getChatName = (chat: any) => {
    if (chat.firstName || chat.lastName) {
      return `${chat.firstName || ''} ${chat.lastName || ''}`.trim();
    }
    return chat.username || `Chat ${chat.chatId}`;
  };

  const getInitials = (chat: any) => {
    const name = getChatName(chat);
    return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'T';
  };

  if (botLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  if (!botInfo?.configured) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full p-8">
          <div className="max-w-md text-center space-y-4">
            <div className="w-16 h-16 bg-[#0088cc]/10 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="h-8 w-8 text-[#0088cc]" />
            </div>
            <h2 className="text-2xl font-bold">Telegram Bot Non Configurato</h2>
            <p className="text-muted-foreground">
              Per utilizzare Telegram, devi configurare un bot token. Ecco come fare:
            </p>
            <div className="text-left bg-muted/50 rounded-lg p-4 space-y-2">
              <p className="font-medium">1. Apri Telegram e cerca @BotFather</p>
              <p className="font-medium">2. Invia il comando /newbot</p>
              <p className="font-medium">3. Segui le istruzioni per creare il bot</p>
              <p className="font-medium">4. Copia il token API che ricevi</p>
              <p className="font-medium">5. Aggiungi il token come secret TELEGRAM_BOT_TOKEN</p>
            </div>
            <p className="text-sm text-muted-foreground">
              Una volta configurato, le persone potranno scriverti tramite il bot e tu potrai rispondere da qui.
            </p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="flex h-[calc(100vh-3rem)] overflow-hidden bg-[#17212B]">
        <div className="w-80 bg-[#17212B] border-r border-[#0E1621] flex flex-col z-10">
          <div className="h-14 px-4 flex items-center gap-3 border-b border-[#0E1621]">
            <button className="text-[#6C7883]">
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-2 h-4 w-4 text-[#6C7883]" />
              <Input 
                placeholder="Search" 
                className="pl-10 bg-[#242F3D] border-none h-9 text-sm text-white placeholder:text-[#6C7883] focus-visible:ring-0" 
              />
            </div>
          </div>

          <ScrollArea className="flex-1">
            {chatsLoading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-[#6C7883]" />
              </div>
            ) : chats.length === 0 ? (
              <div className="p-4 text-center text-[#6C7883] text-sm">
                Nessuna chat ancora. Quando qualcuno scrive al tuo bot, vedrai la conversazione qui.
              </div>
            ) : (
              chats.map((chat: any) => (
                <button 
                  key={chat.id}
                  onClick={() => setSelectedChatId(chat.id)}
                  className={`w-full flex items-center gap-3 p-3 hover:bg-[#202B36] transition-colors ${selectedChat?.id === chat.id ? 'bg-[#2B5278]' : ''}`}
                >
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-gradient-to-br from-[#5EACFD] to-[#A868FC] text-white font-medium">
                      {getInitials(chat)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left overflow-hidden">
                    <div className="flex justify-between items-baseline">
                      <span className="font-medium text-white truncate">{getChatName(chat)}</span>
                      <span className="text-xs text-[#6C7883]">
                        {formatTime(chat.lastMessageAt)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-sm text-[#6C7883] truncate block">
                        {chat.username ? `@${chat.username}` : 'Telegram user'}
                      </span>
                      {chat.unreadCount > 0 && (
                        <span className="bg-[#5EACFD] text-white text-[10px] font-bold h-5 min-w-[1.25rem] px-1 rounded-full flex items-center justify-center">
                          {chat.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </ScrollArea>
        </div>

        <div className="flex-1 flex flex-col bg-[#0E1621]">
          {selectedChat ? (
            <>
              <div className="h-14 bg-[#17212B] px-4 flex items-center justify-between border-b border-[#0E1621]">
                <div className="flex items-center gap-3 cursor-pointer">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-gradient-to-br from-[#5EACFD] to-[#A868FC] text-white font-medium">
                      {getInitials(selectedChat)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium text-white">{getChatName(selectedChat)}</div>
                    <div className="text-xs text-[#6C7883]">
                      {selectedChat.username ? `@${selectedChat.username}` : 'last seen recently'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-[#6C7883]">
                  <button><Search className="h-5 w-5" /></button>
                  <button><Phone className="h-5 w-5" /></button>
                  <button><MoreVertical className="h-5 w-5" /></button>
                </div>
              </div>

              <ScrollArea className="flex-1 p-4">
                {messagesLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-6 w-6 animate-spin text-[#6C7883]" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-[#6C7883]">
                    Nessun messaggio ancora. I messaggi appariranno qui.
                  </div>
                ) : (
                  <div className="space-y-2 flex flex-col">
                    {messages.map((msg: any) => (
                      <div 
                        key={msg.id} 
                        className={`
                          max-w-[60%] rounded-lg p-2 px-3 relative text-sm
                          ${msg.direction === 'outgoing' 
                            ? 'bg-[#2B5278] self-end rounded-tr-none' 
                            : 'bg-[#182533] self-start rounded-tl-none'}
                        `}
                      >
                        <div className="text-white leading-relaxed pr-10">{msg.content}</div>
                        <div className="text-[10px] text-[#6C7883] absolute bottom-1 right-2 flex items-center gap-1">
                          {formatTime(msg.createdAt)}
                          {msg.direction === 'outgoing' && <span className="text-[#5EACFD]">✓✓</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>

              <div className="p-3 bg-[#17212B]">
                <div className="flex items-center gap-2 bg-[#242F3D] rounded-lg px-3 py-2">
                  <button className="text-[#6C7883] hover:text-white">
                    <Paperclip className="h-5 w-5" />
                  </button>
                  <input 
                    type="text" 
                    placeholder="Write a message..." 
                    className="flex-1 bg-transparent border-none text-white placeholder:text-[#6C7883] outline-none text-sm" 
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />
                  <button className="text-[#6C7883] hover:text-white">
                    <Smile className="h-5 w-5" />
                  </button>
                  {messageInput && (
                    <button 
                      className="text-[#5EACFD] hover:text-[#7CBDFF]"
                      onClick={handleSendMessage}
                      disabled={sendMutation.isPending}
                    >
                      {sendMutation.isPending ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Send className="h-5 w-5" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-[#6C7883]">
                <div className="w-24 h-24 bg-[#17212B] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Send className="h-10 w-10" />
                </div>
                <p className="text-lg">Seleziona una chat per iniziare</p>
                <p className="text-sm mt-2">Oppure attendi che qualcuno scriva al tuo bot</p>
                {botInfo?.bot && (
                  <p className="text-sm mt-4 text-[#5EACFD]">
                    Il tuo bot: @{botInfo.bot.username}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
