
import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { whatsappApi } from "@/lib/api";
import { AppLayout } from "@/components/layout/AppLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Search, Phone, Video, MoreVertical, Paperclip, Smile, Mic, Send,
  Check, CheckCheck, Plus, UserPlus, QrCode, RefreshCw
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { it } from "date-fns/locale";

export default function WhatsApp() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [newContactOpen, setNewContactOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // New Contact State
  const [newContact, setNewContact] = useState({ name: "", phoneNumber: "", avatar: "" });

  // WhatsApp Status
  const { data: status, refetch: refetchStatus } = useQuery({
    queryKey: ["whatsapp-status"],
    queryFn: whatsappApi.getStatus,
    refetchInterval: 5000,
  });

  const { data: qrData } = useQuery({
    queryKey: ["whatsapp-qr"],
    queryFn: whatsappApi.getQr,
    enabled: !status?.connected,
    refetchInterval: 2000,
  });

  const initMutation = useMutation({
    mutationFn: whatsappApi.init,
    onSuccess: () => {
      toast({ title: "Inizializzazione avviata..." });
      refetchStatus();
    }
  });

  const disconnectMutation = useMutation({
    mutationFn: whatsappApi.disconnect,
    onSuccess: () => {
      toast({ title: "Disconnesso" });
      refetchStatus();
    }
  });

  // Fetch Contacts
  const { data: contacts = [], isLoading: contactsLoading } = useQuery({
    queryKey: ["whatsapp-contacts"],
    queryFn: whatsappApi.getContacts,
    refetchInterval: 10000,
  });

  // Fetch Messages for selected contact
  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ["whatsapp-messages", selectedContactId],
    queryFn: () => selectedContactId ? whatsappApi.getMessages(selectedContactId) : Promise.resolve([]),
    enabled: !!selectedContactId,
    refetchInterval: 3000,
  });

  // Scroll to bottom of chat
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Mutations
  const createContactMutation = useMutation({
    mutationFn: whatsappApi.createContact,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp-contacts"] });
      setNewContactOpen(false);
      setNewContact({ name: "", phoneNumber: "", avatar: "" });
      toast({ title: "Contatto creato" });
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: ({ contactId, text }: { contactId: string; text: string }) =>
      whatsappApi.sendMessage(contactId, { content: text, type: "text" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp-messages", selectedContactId] });
      setMessageText("");
    },
  });

  const handleSendMessage = () => {
    if (!selectedContactId || !messageText.trim()) return;
    sendMessageMutation.mutate({ contactId: selectedContactId, text: messageText });
  };

  const handleCreateContact = () => {
    if (!newContact.name || !newContact.phoneNumber) return;
    createContactMutation.mutate(newContact);
  };

  const filteredContacts = contacts.filter((c: any) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phoneNumber.includes(searchQuery)
  );

  const selectedContact = contacts.find((c: any) => c.id === selectedContactId);

  return (
    <AppLayout>
      <div className="flex h-[calc(100vh-2rem)] gap-4 p-4 max-w-[1600px] mx-auto bg-slate-50">

        {/* LEFT SIDEBAR - CONTACTS */}
        <div className="w-80 flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="p-4 bg-slate-100 border-b border-slate-200 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Avatar className="h-10 w-10">
                <AvatarImage src="https://github.com/shadcn.png" />
                <AvatarFallback>ME</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-sm font-medium">WhatsApp</span>
                <span className={`text-xs flex items-center gap-1 ${status?.connected ? 'text-green-600' : 'text-red-500'}`}>
                  <span className={`block w-2 h-2 rounded-full ${status?.connected ? 'bg-green-600' : 'bg-red-500'}`} />
                  {status?.connected ? 'Connesso' : status?.initializing ? 'Avvio...' : status?.error ? `Errore: ${status.error}` : 'Disconnesso'}
                </span>
              </div>
            </div>

            <div className="flex gap-1 text-slate-500">

              {/* Connection Dialog */}
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" title="Stato Connessione" className={!status?.connected ? "animate-pulse text-amber-600" : ""}>
                    <QrCode className="h-5 w-5" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Stato WhatsApp Web</DialogTitle>
                  </DialogHeader>
                  <div className="flex flex-col items-center gap-6 py-6">
                    {status?.connected ? (
                      <>
                        <div className="flex flex-col items-center gap-2 text-green-600">
                          <CheckCheck className="h-16 w-16" />
                          <span className="font-bold text-xl">Connesso!</span>
                        </div>
                        <p className="text-center text-muted-foreground">Pulse ERP è connesso al tuo account WhatsApp.</p>
                        <Button variant="destructive" onClick={() => disconnectMutation.mutate()}>
                          Disconnetti Sessione
                        </Button>
                      </>
                    ) : (
                      <>
                        <div className="text-center space-y-2">
                          <h3 className="font-medium">Collega il tuo account WhatsApp</h3>
                          <p className="text-sm text-muted-foreground">
                            1. Apri WhatsApp sul tuo telefono<br />
                            2. Menu {'>'} Dispositivi collegati {'>'} Collega un dispositivo<br />
                            3. Inquadra il codice QR qui sotto
                          </p>
                        </div>

                        {status?.initializing ? (
                          <div className="flex flex-col items-center gap-4">
                            {qrData?.qr ? (
                              <div className="bg-white p-2 rounded-lg border shadow-sm">
                                <img
                                  src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrData.qr)}`}
                                  alt="WhatsApp QR Code"
                                  className="w-48 h-48"
                                />
                              </div>
                            ) : (
                              <div className="h-48 w-48 flex items-center justify-center bg-slate-100 rounded-lg">
                                <RefreshCw className="h-8 w-8 animate-spin text-slate-400" />
                              </div>
                            )}
                            <p className="text-xs text-muted-foreground">In attesa di scansione...</p>
                          </div>
                        ) : (
                          <Button onClick={() => initMutation.mutate()} className="bg-[#25D366] hover:bg-[#128C7E]">
                            Avvia Connessione
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={newContactOpen} onOpenChange={setNewContactOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" title="Nuovo contatto">
                    <Plus className="h-5 w-5" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Nuovo Contatto WhatsApp</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Nome Contatto</Label>
                      <Input
                        value={newContact.name}
                        onChange={e => setNewContact({ ...newContact, name: e.target.value })}
                        placeholder="Mario Rossi"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Numero di Telefono</Label>
                      <Input
                        value={newContact.phoneNumber}
                        onChange={e => setNewContact({ ...newContact, phoneNumber: e.target.value })}
                        placeholder="+39 333 1234567"
                      />
                    </div>
                    <Button onClick={handleCreateContact} className="w-full bg-[#25D366] hover:bg-[#128C7E]">
                      Salva Contatto
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Button variant="ghost" size="icon">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Search */}
          <div className="p-3 bg-white border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Cerca o inizia una nuova chat"
                className="pl-9 bg-slate-100 border-none focus-visible:ring-1 focus-visible:ring-[#25D366]"
              />
            </div>
          </div>

          {/* Contact List */}
          <ScrollArea className="flex-1">
            {contactsLoading ? (
              <div className="p-4 text-center text-slate-400">Caricamento...</div>
            ) : filteredContacts.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">
                Nessun contatto trovato. <br /> Aggiungine uno nuovo!
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredContacts.map((contact: any) => (
                  <div
                    key={contact.id}
                    onClick={() => setSelectedContactId(contact.id)}
                    className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-slate-50 transition-colors ${selectedContactId === contact.id ? "bg-slate-100" : ""
                      }`}
                  >
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={contact.avatar} />
                      <AvatarFallback className="bg-[#25D366] text-white">
                        {contact.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-0.5">
                        <span className="font-medium text-slate-900 truncate">{contact.name}</span>
                        {contact.lastMessageTime && (
                          <span className="text-[10px] text-slate-400">
                            {format(new Date(contact.lastMessageTime), "HH:mm")}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-500 truncate flex items-center gap-1">
                        {contact.unreadCount > 0 ? (
                          <span className="font-semibold text-slate-800">{contact.lastMessagePreview || "Nuovo messaggio"}</span>
                        ) : (
                          <span>{contact.lastMessagePreview || "Nessun messaggio"}</span>
                        )}
                      </p>
                    </div>
                    {contact.unreadCount > 0 && (
                      <Badge className="bg-[#25D366] hover:bg-[#25D366] h-5 w-5 rounded-full p-0 flex items-center justify-center">
                        {contact.unreadCount}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* RIGHT AREA - CHAT */}
        {selectedContact ? (
          <div className="flex-1 flex flex-col bg-[#efeae2] rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
            {/* Chat Background Pattern */}
            <div className="absolute inset-0 opacity-10 pointer-events-none"
              style={{ backgroundImage: "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')" }}
            />

            {/* Header */}
            <div className="p-3 bg-slate-100 border-b border-slate-200 flex justify-between items-center z-10">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={selectedContact.avatar} />
                  <AvatarFallback className="bg-[#25D366] text-white">
                    {selectedContact.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-medium text-slate-900">{selectedContact.name}</h3>
                  <p className="text-xs text-slate-500">
                    {selectedContact.isOnline ? "Online" : "Ultimo accesso oggi alle 10:30"}
                  </p>
                </div>
              </div>
              <div className="flex gap-4 text-slate-500 pr-2">
                <Video className="h-5 w-5 cursor-pointer hover:text-slate-700" />
                <Phone className="h-5 w-5 cursor-pointer hover:text-slate-700" />
                <Search className="h-5 w-5 cursor-pointer hover:text-slate-700" />
                <MoreVertical className="h-5 w-5 cursor-pointer hover:text-slate-700" />
              </div>
            </div>

            {/* Messages Area */}
            <ScrollArea className="flex-1 p-4 z-10">
              <div className="space-y-4">
                {messages.map((msg: any) => {
                  const isMe = msg.direction === "outbound";
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg p-2 px-3 shadow-sm relative text-sm ${isMe ? "bg-[#d9fdd3] rounded-tr-none" : "bg-white rounded-tl-none"
                          }`}
                      >
                        <p className="text-slate-800 whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                        <div className="flex justify-end items-center gap-1 mt-1">
                          <span className="text-[10px] text-slate-500">
                            {format(new Date(msg.timestamp), "HH:mm")}
                          </span>
                          {isMe && (
                            msg.status === "read" ? <CheckCheck className="h-3 w-3 text-blue-500" /> : <Check className="h-3 w-3 text-slate-400" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="p-3 bg-slate-100 flex items-center gap-2 z-10">
              <Smile className="h-6 w-6 text-slate-500 cursor-pointer hover:text-slate-700" />
              <Paperclip className="h-6 w-6 text-slate-500 cursor-pointer hover:text-slate-700" />

              <Input
                value={messageText}
                onChange={e => setMessageText(e.target.value)}
                onKeyPress={e => e.key === "Enter" && handleSendMessage()}
                placeholder="Scrivi un messaggio"
                className="flex-1 bg-white border-none focus-visible:ring-0"
              />

              {messageText.trim() ? (
                <Button
                  onClick={handleSendMessage}
                  size="icon"
                  className="bg-[#25D366] hover:bg-[#128C7E] text-white rounded-full h-10 w-10 flex-shrink-0"
                >
                  <Send className="h-5 w-5 ml-0.5" />
                </Button>
              ) : (
                <Mic className="h-6 w-6 text-slate-500 cursor-pointer hover:text-slate-700" />
              )}
            </div>

          </div>
        ) : (
          /* Empty State */
          <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 border-b-8 border-[#25D366] rounded-2xl shadow-sm bg-[#f0f2f5]">
            <div className="text-center space-y-4 max-w-md">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/WhatsApp.svg/2044px-WhatsApp.svg.png"
                alt="WhatsApp Logo"
                className="h-24 w-24 mx-auto opacity-80"
              />
              <h2 className="text-2xl text-slate-700 font-light">WhatsApp per PULSE-ERP</h2>
              <p className="text-slate-500 text-sm">
                Invia e ricevi messaggi senza dover tenere il telefono connesso.<br />
                Usa WhatsApp fino a 4 dispositivi collegati e 1 telefono.
              </p>
              <div className="pt-8 flex items-center justify-center gap-2 text-xs text-slate-400">
                <LockIcon className="h-3 w-3" />
                Protetto da crittografia end-to-end
              </div>
            </div>
          </div>
        )}

      </div>
    </AppLayout>
  );
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
    </svg>
  );
}
