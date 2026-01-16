import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, LogOut, Send, Smartphone, Scan, CheckCircle2, AlertCircle, Menu, MoreVertical, Phone, Video, MessagesSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { ClipboardCheck } from "lucide-react";

interface WhatsAppStatus {
  connected: boolean;
  initializing: boolean;
  hasQR: boolean;
  error?: string;
}

export default function WhatsappContent() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<WhatsAppStatus>({
    connected: false,
    initializing: false,
    hasQR: false
  });
  const [qrCode, setQrCode] = useState<string>("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Poll status
  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/whatsapp/status");
      if (res.ok) {
        const data = await res.json();
        if (data.hasQR && !qrCode) {
          fetchQrCode();
        } else if (!data.hasQR) {
          setQrCode("");
        }
        setStatus(data);
      }
    } catch (error) {
      console.error("Error fetching status:", error);
    }
  };

  const fetchQrCode = async () => {
    try {
      const res = await fetch("/api/whatsapp/qr");
      if (res.ok) {
        const data = await res.json();
        setQrCode(data.qr);
      }
    } catch (error) {
      console.error("Error fetching QR:", error);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  // Fetch Contacts to find the ID of the current phone number
  const cleanPhone = phoneNumber.replace(/\D/g, "");
  const { data: contacts } = useQuery({
    queryKey: ["whatsapp-contacts"],
    queryFn: async () => {
      const res = await fetch("/api/whatsapp/contacts");
      if (!res.ok) throw new Error("Failed to fetch contacts");
      return res.json();
    },
    enabled: status.connected,
  });

  const activeContact = contacts?.find((c: any) => c.phoneNumber === cleanPhone);

  // Fetch Messages for active contact
  const { data: messages } = useQuery({
    queryKey: ["whatsapp-messages", activeContact?.id],
    queryFn: async () => {
      const res = await fetch(`/api/whatsapp/contacts/${activeContact.id}/messages`);
      if (!res.ok) throw new Error("Failed to fetch messages");
      return res.json();
    },
    enabled: !!activeContact && status.connected,
    refetchInterval: 2000, // Poll every 2s for new messages
  });

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, message]); // Scroll on new messages or typing

  const handleConnect = async () => {
    try {
      await fetch("/api/whatsapp/connect", { method: "POST" });
      fetchStatus();
    } catch (error) {
      toast({
        title: "Errore",
        description: "Impossibile avviare la connessione",
        variant: "destructive"
      });
    }
  };

  const handleDisconnect = async () => {
    try {
      await fetch("/api/whatsapp/disconnect", { method: "POST" });
      setStatus({ connected: false, initializing: false, hasQR: false });
      setQrCode("");
    } catch (error) {
      toast({
        title: "Errore",
        description: "Errore durante la disconnessione",
        variant: "destructive"
      });
    }
  };

  const handleSendMessage = async () => {
    if (!phoneNumber || !message) return;

    setSending(true);
    try {
      const res = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber, message })
      });

      if (!res.ok) throw new Error("Errore durante l'invio");

      setMessage("");
      toast({
        title: "Messaggio inviato",
        description: "Il messaggio è stato inviato correttamente.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/whatsapp/contacts/${activeContact?.id}/messages`] });
    } catch (error: any) {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  const handleCreateTodo = async (content: string) => {
    try {
      const res = await fetch("/api/personal-todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: content.length > 50 ? content.substring(0, 50) + "..." : content,
          description: content,
          completed: false,
          category: "WhatsApp",
          priority: "medium",
          starred: false,
          userId: user?.id
        })
      });

      if (res.ok) {
        toast({
          title: "Todo creato",
          description: "Il messaggio è stato salvato nella tua lista To-Do.",
        });
        queryClient.invalidateQueries({ queryKey: ["personal-todos"] });
      } else {
        throw new Error("Errore durante la creazione del todo");
      }
    } catch (error: any) {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full bg-[#111b21] p-4 md:p-8 overflow-hidden relative">
      {/* Background Accent */}
      <div className="absolute top-0 left-0 w-full h-32 bg-[#00a884] z-0" />

      <div className="flex-1 flex max-w-6xl mx-auto w-full gap-8 z-10 pt-4">

        {/* Left Column: Connection Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-1 flex flex-col"
        >
          <div className="bg-white rounded-[18px] shadow-xl overflow-hidden h-full flex flex-col">
            <div className="p-8 pb-4">
              <h2 className="text-[28px] font-light text-[#41525d] mb-2">Usa WhatsApp sul tuo computer</h2>
              <ol className="text-[18px] text-[#3b4a54] leading-8 list-decimal ml-6 space-y-1">
                <li>Apri WhatsApp sul tuo telefono</li>
                <li>Tocca <strong>Menu</strong> <Menu className="inline h-4 w-4" /> o <strong>Impostazioni</strong> <span className="inline-block"><MoreVertical className="inline h-4 w-4" /></span> e seleziona <strong>Dispositivi collegati</strong></li>
                <li>Tocca su <strong>Collega un dispositivo</strong></li>
                <li>Punta il tuo telefono su questo schermo per catturare il codice</li>
              </ol>
            </div>

            <div className="flex-1 flex items-center justify-center bg-white p-8 border-t border-gray-100 relative">
              {status.error && (
                <div className="absolute top-4 left-0 w-full px-8 z-20">
                  <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{status.error}</span>
                  </div>
                </div>
              )}
              {status.connected ? (
                <div className="flex flex-col w-full h-full overflow-hidden">
                  <div className="p-4 bg-[#f0f2f5] border-b flex items-center justify-between">
                    <h3 className="font-semibold text-[#41525d]">Chat Recenti</h3>
                    <Button onClick={handleDisconnect} variant="ghost" size="sm" className="text-red-500 hover:bg-red-50">
                      Disconnetti
                    </Button>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    {contacts && contacts.length > 0 ? (
                      contacts.map((contact: any) => (
                        <div
                          key={contact.id}
                          onClick={() => {
                            setPhoneNumber(contact.phoneNumber);
                            toast({ title: "Chat Selezionata", description: `Conversazione con ${contact.name}` });
                          }}
                          className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 border-b transition-colors ${cleanPhone === contact.phoneNumber ? "bg-emerald-50 border-emerald-200" : "border-gray-100"
                            }`}
                        >
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-100 to-teal-200 flex items-center justify-center text-[#00a884] font-bold shadow-sm">
                            {contact.name.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-baseline">
                              <h4 className="font-medium text-[#111b21] truncate">{contact.name}</h4>
                              {contact.lastMessageAt && (
                                <span className="text-[12px] text-[#667781]">
                                  {formatTime(contact.lastMessageAt)}
                                </span>
                              )}
                            </div>
                            <p className="text-[14px] text-[#667781] truncate">{contact.lastMessagePreview || "Nessun messaggio"}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-center p-8">
                        <MessagesSquare className="h-12 w-12 text-[#d1d7db] mb-2" />
                        <p className="text-[#667781] text-[14px]">Nessuna conversazione trovata</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : status.initializing ? (
                <div className="relative">
                  {status.hasQR && qrCode ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="bg-white p-2 rounded-lg border-2 border-gray-100 shadow-sm relative group"
                    >
                      <motion.div
                        animate={{ top: ["0%", "100%", "0%"] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                        className="absolute left-0 w-full h-1 bg-[#00a884]/50 shadow-[0_0_10px_#00a884] z-10 pointer-events-none"
                      />
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=264x264&data=${encodeURIComponent(qrCode)}`}
                        alt="WhatsApp QR Code"
                        className="w-[264px] h-[264px]"
                      />
                    </motion.div>
                  ) : (
                    <div className="w-[264px] h-[264px] flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-lg">
                      <Loader2 className="h-10 w-10 text-[#00a884] animate-spin mb-4" />
                      <span className="text-gray-400 text-sm">Generazione QR...</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Smartphone className="h-10 w-10 text-gray-400" />
                  </div>
                  <Button
                    onClick={handleConnect}
                    className="bg-[#00a884] hover:bg-[#008f6f] text-white rounded-full px-8 py-6 text-lg shadow-lg hover:shadow-xl transition-all"
                  >
                    Genera codice QR
                  </Button>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Right Column: Phone Mockup / Sender */}
        <AnimatePresence>
          {status.connected && (
            <motion.div
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 50, opacity: 0 }}
              className="w-[380px] hidden lg:block"
            >
              {/* Phone Mockup */}
              <div className="bg-[#111b21] border-[8px] border-[#2a3942] rounded-[3rem] h-[calc(100vh-120px)] overflow-hidden shadow-2xl relative flex flex-col">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 h-6 w-32 bg-[#2a3942] rounded-b-xl z-20" />

                {/* Header */}
                <div className="bg-[#202c33] p-4 pt-8 flex items-center justify-between z-10 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center text-white font-bold text-xs">
                      P
                    </div>
                    <div>
                      <div className="text-[#e9edef] font-medium text-sm">{activeContact?.name || cleanPhone || "Chat"}</div>
                      <div className="text-[#8696a0] text-xs">Online</div>
                    </div>
                  </div>
                  <div className="flex gap-4 text-[#00a884]">
                    <Video className="h-5 w-5" />
                    <Phone className="h-5 w-5" />
                  </div>
                </div>

                {/* Chat Body */}
                <div className="flex-1 bg-[#0b141a] bg-opacity-95 relative p-4 overflow-y-auto flex flex-col gap-3">
                  <div className="absolute inset-0 opacity-[0.06] bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] pointer-events-none" />

                  <div className="self-center bg-[#202c33] rounded-lg px-3 py-1 text-[10px] text-[#8696a0] shadow-sm mb-4 z-10">
                    Messaggi protetti con crittografia end-to-end
                  </div>

                  {/* Historic Messages */}
                  {messages && messages.map((msg: any) => (
                    <div
                      key={msg.id}
                      className={`max-w-[85%] z-10 shadow-sm rounded-lg p-2 group relative ${msg.type === "sent"
                        ? "self-end bg-[#005c4b] rounded-tr-none"
                        : "self-start bg-[#202c33] rounded-tl-none"
                        }`}
                    >
                      <button
                        onClick={() => handleCreateTodo(msg.content)}
                        className="absolute -left-8 top-1 opacity-0 group-hover:opacity-100 transition-opacity bg-[#202c33] p-1.5 rounded-full text-[#8696a0] hover:text-[#00a884] shadow-lg border border-[#2a3942]"
                        title="Salva come To-Do"
                      >
                        <ClipboardCheck className="h-4 w-4" />
                      </button>
                      <p className="text-[#e9edef] text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                      <span className="text-[10px] text-[#8696a0] float-right mt-1 ml-2 flex items-center gap-1">
                        {formatTime(msg.createdAt)}
                        {msg.type === "sent" && <CheckCircle2 className="h-3 w-3" />}
                      </span>
                    </div>
                  ))}

                  {/* Typing Preview (only if typing and not sent yet) */}
                  {!sending && message && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.5 }}
                      className="self-end bg-[#005c4b] rounded-lg rounded-tr-none p-2 max-w-[85%] z-10 shadow-sm"
                    >
                      <p className="text-[#e9edef] text-sm whitespace-pre-wrap break-words">{message}</p>
                    </motion.div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Footer Input */}
                <div className="bg-[#202c33] p-2 z-10">
                  <div className="flex flex-col gap-2">
                    <Input
                      placeholder="Numero (es. 39333...)"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="bg-[#2a3942] border-0 h-8 text-xs text-white placeholder:text-[#8696a0] focus-visible:ring-0 rounded-lg px-3"
                    />
                    <div className="flex items-end gap-2">
                      <div className="flex-1 bg-[#2a3942] rounded-2xl min-h-[40px] px-4 py-2 flex items-center">
                        <Textarea
                          placeholder="Messaggio..."
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleSendMessage();
                            }
                          }}
                          className="bg-transparent border-0 p-0 text-sm text-white placeholder:text-[#8696a0] focus-visible:ring-0 resize-none min-h-[20px] max-h-[80px]"
                          rows={1}
                        />
                      </div>
                      <Button
                        onClick={handleSendMessage}
                        disabled={sending || !phoneNumber || !message}
                        size="icon"
                        className="bg-[#00a884] hover:bg-[#008f6f] rounded-full h-10 w-10 shrink-0"
                      >
                        {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5 pl-0.5" />}
                      </Button>
                    </div>
                  </div>
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
