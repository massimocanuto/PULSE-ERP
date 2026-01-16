import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { 
  Bot, 
  Send, 
  Loader2, 
  Sparkles, 
  ListTodo, 
  FileText, 
  Mail, 
  BarChart3,
  Lightbulb,
  X,
  Wand2,
  MessageSquare,
  AlertCircle
} from "lucide-react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface Project {
  id: number;
  title: string;
  status: string;
}

interface AIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AIAssistant({ isOpen, onClose }: AIAssistantProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("chat");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [goalInput, setGoalInput] = useState("");
  const [documentInput, setDocumentInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const chatMutation = useMutation({
    mutationFn: async (messages: ChatMessage[]) => {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          messages,
          systemPrompt: "Sei un assistente AI per PULSE ERP, un software di gestione progetti e attività. Aiuta gli utenti con domande sul loro lavoro, progetti, attività e produttività. Rispondi sempre in italiano in modo chiaro e conciso."
        }),
      });
      if (!res.ok) throw new Error("Errore nella comunicazione con l'AI");
      return res.json();
    },
    onSuccess: (data) => {
      setChatMessages(prev => [...prev, { role: "assistant", content: data.response }]);
    },
    onError: () => {
      toast({ title: "Errore nella comunicazione con l'AI", variant: "destructive" });
    }
  });

  const generateTasksMutation = useMutation({
    mutationFn: async (goal: string) => {
      const res = await fetch("/api/ai/generate-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal }),
      });
      if (!res.ok) throw new Error("Errore nella generazione attività");
      return res.json();
    },
    onError: () => {
      toast({ title: "Errore nella generazione delle attività", variant: "destructive" });
    }
  });

  const summarizeMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await fetch("/api/ai/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error("Errore nel riassunto");
      return res.json();
    },
    onError: () => {
      toast({ title: "Errore nel riassunto del documento", variant: "destructive" });
    }
  });

  const analyzeEmailMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await fetch("/api/ai/analyze-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error("Errore nell'analisi email");
      return res.json();
    },
    onError: () => {
      toast({ title: "Errore nell'analisi dell'email", variant: "destructive" });
    }
  });

  const generateReportMutation = useMutation({
    mutationFn: async (projectId: number) => {
      const res = await fetch("/api/ai/generate-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });
      if (!res.ok) throw new Error("Errore nella generazione report");
      return res.json();
    },
    onError: () => {
      toast({ title: "Errore nella generazione del report", variant: "destructive" });
    }
  });

  const { data: suggestions, isLoading: suggestionsLoading, refetch: refetchSuggestions, isError: suggestionsError } = useQuery({
    queryKey: ["ai-suggestions"],
    queryFn: async () => {
      const res = await fetch("/api/ai/suggestions", { method: "POST" });
      if (!res.ok) throw new Error("Errore");
      return res.json();
    },
    enabled: activeTab === "suggestions",
    retry: 1,
  });

  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    const newMessage: ChatMessage = { role: "user", content: chatInput };
    const allMessages = [...chatMessages, newMessage];
    setChatMessages(allMessages);
    setChatInput("");
    chatMutation.mutate(allMessages);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl h-[80vh] flex flex-col">
        <CardHeader className="pb-2 border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                <Bot className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg">Assistente AI</CardTitle>
                <p className="text-xs text-muted-foreground">Powered by GPT</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid grid-cols-6 mx-4 mt-2">
            <TabsTrigger value="chat" className="text-xs px-1">
              <MessageSquare className="h-3.5 w-3.5 mr-1" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="tasks" className="text-xs px-1">
              <ListTodo className="h-3.5 w-3.5 mr-1" />
              Attività
            </TabsTrigger>
            <TabsTrigger value="docs" className="text-xs px-1">
              <FileText className="h-3.5 w-3.5 mr-1" />
              Riassunti
            </TabsTrigger>
            <TabsTrigger value="email" className="text-xs px-1">
              <Mail className="h-3.5 w-3.5 mr-1" />
              Email
            </TabsTrigger>
            <TabsTrigger value="reports" className="text-xs px-1">
              <BarChart3 className="h-3.5 w-3.5 mr-1" />
              Report
            </TabsTrigger>
            <TabsTrigger value="suggestions" className="text-xs px-1">
              <Lightbulb className="h-3.5 w-3.5 mr-1" />
              Tips
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="flex-1 flex flex-col overflow-hidden m-0 p-4">
            <ScrollArea className="flex-1 pr-4" ref={scrollRef}>
              <div className="space-y-4">
                {chatMessages.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Bot className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Ciao! Come posso aiutarti oggi?</p>
                    <p className="text-xs mt-1">Chiedimi qualsiasi cosa su progetti, attività o produttività.</p>
                  </div>
                )}
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      msg.role === "user" 
                        ? "bg-blue-600 text-white" 
                        : "bg-muted"
                    }`}>
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ))}
                {chatMutation.isPending && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-lg px-4 py-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
            <div className="flex gap-2 mt-4">
              <Input
                placeholder="Scrivi un messaggio..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendChat()}
                disabled={chatMutation.isPending}
              />
              <Button onClick={handleSendChat} disabled={chatMutation.isPending || !chatInput.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="tasks" className="flex-1 overflow-auto m-0 p-4">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Descrivi il tuo obiettivo</label>
                <Textarea
                  placeholder="Es: Lanciare una nuova campagna marketing per il prodotto X..."
                  value={goalInput}
                  onChange={(e) => setGoalInput(e.target.value)}
                  className="mt-2"
                  rows={3}
                />
                <Button 
                  onClick={() => generateTasksMutation.mutate(goalInput)} 
                  disabled={generateTasksMutation.isPending || !goalInput.trim()}
                  className="mt-2"
                >
                  {generateTasksMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Wand2 className="h-4 w-4 mr-2" />
                  )}
                  Genera Attività
                </Button>
              </div>

              {generateTasksMutation.data && (
                <div className="space-y-2">
                  <h4 className="font-medium">Attività Generate:</h4>
                  {generateTasksMutation.data.tasks?.length > 0 ? (
                    generateTasksMutation.data.tasks.map((task: any, i: number) => (
                      <div key={i} className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                        <Badge variant={
                          task.priority === "high" ? "destructive" : 
                          task.priority === "medium" ? "default" : "secondary"
                        }>
                          {task.priority}
                        </Badge>
                        <span className="text-sm flex-1">{task.title}</span>
                        {task.estimatedHours && (
                          <span className="text-xs text-muted-foreground">{task.estimatedHours}h</span>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">Nessuna attività generata</p>
                  )}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="docs" className="flex-1 overflow-auto m-0 p-4">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Incolla il contenuto del documento</label>
                <Textarea
                  placeholder="Incolla qui il testo del documento da riassumere..."
                  value={documentInput}
                  onChange={(e) => setDocumentInput(e.target.value)}
                  className="mt-2"
                  rows={6}
                />
                <Button 
                  onClick={() => summarizeMutation.mutate(documentInput)} 
                  disabled={summarizeMutation.isPending || documentInput.trim().length < 50}
                  className="mt-2"
                >
                  {summarizeMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <FileText className="h-4 w-4 mr-2" />
                  )}
                  Riassumi
                </Button>
                {documentInput.trim().length > 0 && documentInput.trim().length < 50 && (
                  <p className="text-xs text-muted-foreground mt-1">Il documento deve contenere almeno 50 caratteri</p>
                )}
              </div>

              {summarizeMutation.data && (
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Riassunto:</h4>
                  <p className="text-sm whitespace-pre-wrap">{summarizeMutation.data.summary}</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="email" className="flex-1 overflow-auto m-0 p-4">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Incolla il contenuto dell'email</label>
                <Textarea
                  placeholder="Incolla qui il testo dell'email da analizzare..."
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="mt-2"
                  rows={6}
                />
                <Button 
                  onClick={() => analyzeEmailMutation.mutate(emailInput)} 
                  disabled={analyzeEmailMutation.isPending || emailInput.trim().length < 20}
                  className="mt-2"
                >
                  {analyzeEmailMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Mail className="h-4 w-4 mr-2" />
                  )}
                  Analizza Email
                </Button>
                {emailInput.trim().length > 0 && emailInput.trim().length < 20 && (
                  <p className="text-xs text-muted-foreground mt-1">L'email deve contenere almeno 20 caratteri</p>
                )}
              </div>

              {analyzeEmailMutation.data && (
                <div className="space-y-3">
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">Analisi:</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Priorità:</span>
                        <Badge variant={
                          analyzeEmailMutation.data.priority === "high" ? "destructive" : 
                          analyzeEmailMutation.data.priority === "medium" ? "default" : "secondary"
                        }>
                          {analyzeEmailMutation.data.priority}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Sentiment:</span>
                        <Badge variant="outline">{analyzeEmailMutation.data.sentiment}</Badge>
                      </div>
                      <div>
                        <span className="font-medium">Riassunto:</span>
                        <p className="mt-1">{analyzeEmailMutation.data.summary}</p>
                      </div>
                      {analyzeEmailMutation.data.suggestedActions?.length > 0 && (
                        <div>
                          <span className="font-medium">Azioni Suggerite:</span>
                          <ul className="mt-1 list-disc list-inside">
                            {analyzeEmailMutation.data.suggestedActions.map((action: string, i: number) => (
                              <li key={i}>{action}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="reports" className="flex-1 overflow-auto m-0 p-4">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Seleziona un progetto</label>
                <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Scegli un progetto..." />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={String(project.id)}>
                        {project.title} ({project.status})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  onClick={() => generateReportMutation.mutate(Number(selectedProjectId))} 
                  disabled={generateReportMutation.isPending || !selectedProjectId}
                  className="mt-2"
                >
                  {generateReportMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <BarChart3 className="h-4 w-4 mr-2" />
                  )}
                  Genera Report
                </Button>
              </div>

              {projects.length === 0 && (
                <div className="text-center py-4 text-muted-foreground">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nessun progetto disponibile</p>
                  <p className="text-xs">Crea prima un progetto per generare report</p>
                </div>
              )}

              {generateReportMutation.data && (
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Report Progetto:</h4>
                  <div className="text-sm whitespace-pre-wrap">{generateReportMutation.data.report}</div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="suggestions" className="flex-1 overflow-auto m-0 p-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Suggerimenti Intelligenti</h4>
                <Button variant="outline" size="sm" onClick={() => refetchSuggestions()} disabled={suggestionsLoading}>
                  {suggestionsLoading ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4 mr-1" />
                  )}
                  Aggiorna
                </Button>
              </div>

              {suggestionsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : suggestionsError ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="h-12 w-12 mx-auto mb-2 text-destructive opacity-50" />
                  <p>Errore nel caricamento dei suggerimenti</p>
                  <Button variant="outline" size="sm" onClick={() => refetchSuggestions()} className="mt-2">
                    Riprova
                  </Button>
                </div>
              ) : suggestions?.suggestions?.length > 0 ? (
                <div className="space-y-2">
                  {suggestions.suggestions.map((suggestion: string, i: number) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg border border-purple-100 dark:border-purple-800">
                      <Lightbulb className="h-5 w-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                      <p className="text-sm">{suggestion}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Lightbulb className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Nessun suggerimento disponibile</p>
                  <p className="text-xs mt-1">Aggiungi attività e progetti per ricevere suggerimenti personalizzati</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
