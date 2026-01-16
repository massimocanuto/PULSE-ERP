import { AppLayout } from "@/components/layout/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Plus, MoreHorizontal, Filter, ArrowUpDown, Loader2, Mountain, Clock,
  Pencil, Trash2, X, Check, Calendar, ListTodo, LayoutGrid, List, GripVertical, Mail, Link, FileText, MessageCircle, CalendarDays, ChevronLeft, ChevronRight,
  Share2, Copy, Link2, Search, UserPlus, FolderOpen, Archive, Briefcase, Wallet, Receipt, ArrowDownUp, Euro, FileCheck, ExternalLink, Settings, Target, Zap, TrendingUp, Activity, Sun, AlertTriangle, CheckCircle2, BarChart3, PieChart, CheckSquare, Maximize2, Minimize2
} from "lucide-react";
import { DocumentsContent } from "@/pages/DocumentsContent";
import { ArchivioContent } from "@/pages/ArchivioContent";
import { ToDoListContent } from "@/pages/ToDoListContent";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths } from "date-fns";
import { it } from "date-fns/locale";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { projectsApi, tasksApi, usersApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MountainProgress } from "@/components/MountainProgress";
import { TaskComments } from "@/components/TaskComments";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { differenceInDays, parseISO, isValid } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { DefaultLayout, NotionLayout, LinearLayout, FinanzaLayout } from "@/components/ProjectPanelLayouts";
import { CompactDashboardLayout, FullMountainLayout, HybridTableLayout, MinimalGridLayout } from "@/components/AnalysisLayouts";

const COLUMNS = ["Not Started", "In Progress", "Done"];

function parseItalianNumber(value: string | number | undefined): number {
  if (value === undefined || value === null || value === '') return 0;
  if (typeof value === 'number') return isNaN(value) ? 0 : value;
  const cleanValue = value.toString().replace(/\./g, '').replace(',', '.');
  const parsed = parseFloat(cleanValue);
  return isNaN(parsed) ? 0 : parsed;
}

interface ProjectEmail {
  id: string;
  projectId: string;
  emailId: string;
  emailSubject: string;
  emailFrom: string;
  emailPreview: string | null;
  emailDate: string | null;
  addedAt: string;
}

export function ProjectFinanceTab({ projectId, projectTitle }: { projectId: string; projectTitle: string }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState<'fatture' | 'preventivi' | 'movimenti'>('fatture');
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);

  const { data: projectInvoices = [], isLoading: loadingInvoices } = useQuery({
    queryKey: ["project-invoices", projectId],
    queryFn: () => projectsApi.getInvoices(projectId),
    enabled: !!projectId,
  });

  const { data: projectQuotes = [], isLoading: loadingQuotes } = useQuery({
    queryKey: ["project-quotes", projectId],
    queryFn: () => projectsApi.getQuotes(projectId),
    enabled: !!projectId,
  });

  const { data: projectTransactions = [], isLoading: loadingTransactions } = useQuery({
    queryKey: ["project-transactions", projectId],
    queryFn: () => projectsApi.getTransactions(projectId),
    enabled: !!projectId,
  });

  const { data: allInvoices = [] } = useQuery({
    queryKey: ["finance-invoices"],
    queryFn: async () => {
      const res = await fetch("/api/finance/invoices");
      return res.json();
    },
  });

  const { data: allQuotes = [] } = useQuery({
    queryKey: ["finance-quotes"],
    queryFn: async () => {
      const res = await fetch("/api/finance/quotes");
      return res.json();
    },
  });

  const { data: allTransactions = [] } = useQuery({
    queryKey: ["finance-transactions"],
    queryFn: async () => {
      const res = await fetch("/api/finance/transactions");
      return res.json();
    },
  });

  const linkInvoiceMutation = useMutation({
    mutationFn: (invoiceId: string) => projectsApi.linkInvoice(invoiceId, projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-invoices", projectId] });
      queryClient.invalidateQueries({ queryKey: ["finance-invoices"] });
      toast({ title: "Fattura collegata", description: "La fattura è stata collegata al progetto." });
    },
  });

  const linkQuoteMutation = useMutation({
    mutationFn: (quoteId: string) => projectsApi.linkQuote(quoteId, projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-quotes", projectId] });
      queryClient.invalidateQueries({ queryKey: ["finance-quotes"] });
      toast({ title: "Preventivo collegato", description: "Il preventivo è stato collegato al progetto." });
    },
  });

  const linkTransactionMutation = useMutation({
    mutationFn: (transactionId: string) => projectsApi.linkTransaction(transactionId, projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-transactions", projectId] });
      queryClient.invalidateQueries({ queryKey: ["finance-transactions"] });
      toast({ title: "Movimento collegato", description: "Il movimento è stato collegato al progetto." });
    },
  });

  const unlinkInvoiceMutation = useMutation({
    mutationFn: (invoiceId: string) => projectsApi.linkInvoice(invoiceId, null),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-invoices", projectId] });
      queryClient.invalidateQueries({ queryKey: ["finance-invoices"] });
    },
  });

  const unlinkQuoteMutation = useMutation({
    mutationFn: (quoteId: string) => projectsApi.linkQuote(quoteId, null),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-quotes", projectId] });
      queryClient.invalidateQueries({ queryKey: ["finance-quotes"] });
    },
  });

  const unlinkTransactionMutation = useMutation({
    mutationFn: (transactionId: string) => projectsApi.linkTransaction(transactionId, null),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-transactions", projectId] });
      queryClient.invalidateQueries({ queryKey: ["finance-transactions"] });
    },
  });

  const availableInvoices = allInvoices.filter((inv: any) => !inv.projectId);
  const availableQuotes = allQuotes.filter((q: any) => !q.projectId);
  const availableTransactions = allTransactions.filter((t: any) => !t.projectId);

  const totalFatturato = projectInvoices.reduce((sum: number, inv: any) => {
    return sum + parseItalianNumber(inv.totale);
  }, 0);

  const totalPreventivato = projectQuotes.reduce((sum: number, q: any) => {
    return sum + parseItalianNumber(q.totale);
  }, 0);

  const totalMovimenti = projectTransactions.reduce((sum: number, t: any) => {
    const importo = parseItalianNumber(t.importo);
    return sum + (t.tipo === 'entrata' ? importo : -importo);
  }, 0);

  const isLoading = loadingInvoices || loadingQuotes || loadingTransactions;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="p-4 border-b bg-muted/30">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-white rounded-lg p-2 shadow-sm">
            <div className="text-[10px] text-muted-foreground">Fatturato</div>
            <div className="text-sm font-bold text-green-600">{totalFatturato.toLocaleString('it-IT', { minimumFractionDigits: 2 })} €</div>
          </div>
          <div className="bg-white rounded-lg p-2 shadow-sm">
            <div className="text-[10px] text-muted-foreground">Preventivato</div>
            <div className="text-sm font-bold text-blue-600">{totalPreventivato.toLocaleString('it-IT', { minimumFractionDigits: 2 })} €</div>
          </div>
          <div className="bg-white rounded-lg p-2 shadow-sm">
            <div className="text-[10px] text-muted-foreground">Saldo Mov.</div>
            <div className={`text-sm font-bold ${totalMovimenti >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {totalMovimenti >= 0 ? '+' : ''}{totalMovimenti.toLocaleString('it-IT', { minimumFractionDigits: 2 })} €
            </div>
          </div>
        </div>
      </div>

      <div className="flex border-b">
        <button
          onClick={() => setActiveSection('fatture')}
          className={`flex-1 py-2 text-xs font-medium flex items-center justify-center gap-1 ${activeSection === 'fatture' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'
            }`}
        >
          <Receipt className="h-3 w-3" /> Fatture ({projectInvoices.length})
        </button>
        <button
          onClick={() => setActiveSection('preventivi')}
          className={`flex-1 py-2 text-xs font-medium flex items-center justify-center gap-1 ${activeSection === 'preventivi' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'
            }`}
        >
          <FileCheck className="h-3 w-3" /> Preventivi ({projectQuotes.length})
        </button>
        <button
          onClick={() => setActiveSection('movimenti')}
          className={`flex-1 py-2 text-xs font-medium flex items-center justify-center gap-1 ${activeSection === 'movimenti' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'
            }`}
        >
          <ArrowDownUp className="h-3 w-3" /> Movimenti ({projectTransactions.length})
        </button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {activeSection === 'fatture' && (
            <>
              {projectInvoices.map((inv: any) => (
                <div key={inv.id} className="p-3 border rounded-lg hover:bg-muted/50 group">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Receipt className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span className="font-medium text-sm">#{inv.numero}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${inv.stato === 'pagata' ? 'bg-green-100 text-green-700' :
                          inv.stato === 'inviata' ? 'bg-blue-100 text-blue-700' :
                            inv.stato === 'scaduta' ? 'bg-red-100 text-red-700' :
                              'bg-gray-100 text-gray-700'
                          }`}>{inv.stato}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">{inv.ragioneSociale}</div>
                      <div className="text-xs font-medium mt-1">{parseItalianNumber(inv.totale).toLocaleString('it-IT', { minimumFractionDigits: 2 })} €</div>
                    </div>
                    <button
                      onClick={() => unlinkInvoiceMutation.mutate(inv.id)}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-600 p-1"
                      title="Scollega"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
              {projectInvoices.length === 0 && (
                <div className="text-center text-muted-foreground text-sm py-4">
                  Nessuna fattura collegata
                </div>
              )}
            </>
          )}

          {activeSection === 'preventivi' && (
            <>
              {projectQuotes.map((q: any) => (
                <div key={q.id} className="p-3 border rounded-lg hover:bg-muted/50 group">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <FileCheck className="h-4 w-4 text-blue-500 flex-shrink-0" />
                        <span className="font-medium text-sm">#{q.numero}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${q.stato === 'accettato' ? 'bg-green-100 text-green-700' :
                          q.stato === 'inviato' ? 'bg-blue-100 text-blue-700' :
                            q.stato === 'rifiutato' ? 'bg-red-100 text-red-700' :
                              'bg-gray-100 text-gray-700'
                          }`}>{q.stato}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">{q.ragioneSociale}</div>
                      <div className="text-xs font-medium mt-1">{parseItalianNumber(q.totale).toLocaleString('it-IT', { minimumFractionDigits: 2 })} €</div>
                    </div>
                    <button
                      onClick={() => unlinkQuoteMutation.mutate(q.id)}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-600 p-1"
                      title="Scollega"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
              {projectQuotes.length === 0 && (
                <div className="text-center text-muted-foreground text-sm py-4">
                  Nessun preventivo collegato
                </div>
              )}
            </>
          )}

          {activeSection === 'movimenti' && (
            <>
              {projectTransactions.map((t: any) => (
                <div key={t.id} className="p-3 border rounded-lg hover:bg-muted/50 group">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <ArrowDownUp className={`h-4 w-4 flex-shrink-0 ${t.tipo === 'entrata' ? 'text-green-500' : 'text-red-500'}`} />
                        <span className="font-medium text-sm truncate">{t.descrizione || 'Movimento'}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">{t.data}</div>
                      <div className={`text-xs font-medium mt-1 ${t.tipo === 'entrata' ? 'text-green-600' : 'text-red-600'}`}>
                        {t.tipo === 'entrata' ? '+' : '-'}{parseItalianNumber(t.importo).toLocaleString('it-IT', { minimumFractionDigits: 2 })} €
                      </div>
                    </div>
                    <button
                      onClick={() => unlinkTransactionMutation.mutate(t.id)}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-600 p-1"
                      title="Scollega"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
              {projectTransactions.length === 0 && (
                <div className="text-center text-muted-foreground text-sm py-4">
                  Nessun movimento collegato
                </div>
              )}
            </>
          )}
        </div>
      </ScrollArea>

      <div className="p-3 border-t">
        <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="w-full">
              <Link className="h-4 w-4 mr-2" />
              Collega {activeSection === 'fatture' ? 'Fattura' : activeSection === 'preventivi' ? 'Preventivo' : 'Movimento'}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[70vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Collega {activeSection === 'fatture' ? 'Fattura' : activeSection === 'preventivi' ? 'Preventivo' : 'Movimento'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-2 mt-4">
              {activeSection === 'fatture' && (
                availableInvoices.length > 0 ? availableInvoices.map((inv: any) => (
                  <button
                    key={inv.id}
                    onClick={() => { linkInvoiceMutation.mutate(inv.id); setLinkDialogOpen(false); }}
                    className="w-full p-3 border rounded-lg hover:bg-muted/50 text-left"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-sm">#{inv.numero} - {inv.ragioneSociale}</div>
                        <div className="text-xs text-muted-foreground">{inv.dataEmissione}</div>
                      </div>
                      <div className="text-sm font-medium">{parseItalianNumber(inv.totale).toLocaleString('it-IT', { minimumFractionDigits: 2 })} €</div>
                    </div>
                  </button>
                )) : <p className="text-center text-muted-foreground text-sm py-4">Nessuna fattura disponibile</p>
              )}

              {activeSection === 'preventivi' && (
                availableQuotes.length > 0 ? availableQuotes.map((q: any) => (
                  <button
                    key={q.id}
                    onClick={() => { linkQuoteMutation.mutate(q.id); setLinkDialogOpen(false); }}
                    className="w-full p-3 border rounded-lg hover:bg-muted/50 text-left"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-sm">#{q.numero} - {q.ragioneSociale}</div>
                        <div className="text-xs text-muted-foreground">{q.dataEmissione}</div>
                      </div>
                      <div className="text-sm font-medium">{parseItalianNumber(q.totale).toLocaleString('it-IT', { minimumFractionDigits: 2 })} €</div>
                    </div>
                  </button>
                )) : <p className="text-center text-muted-foreground text-sm py-4">Nessun preventivo disponibile</p>
              )}

              {activeSection === 'movimenti' && (
                availableTransactions.length > 0 ? availableTransactions.map((t: any) => (
                  <button
                    key={t.id}
                    onClick={() => { linkTransactionMutation.mutate(t.id); setLinkDialogOpen(false); }}
                    className="w-full p-3 border rounded-lg hover:bg-muted/50 text-left"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-sm">{t.descrizione || 'Movimento'}</div>
                        <div className="text-xs text-muted-foreground">{t.data}</div>
                      </div>
                      <div className={`text-sm font-medium ${t.tipo === 'entrata' ? 'text-green-600' : 'text-red-600'}`}>
                        {t.tipo === 'entrata' ? '+' : '-'}{parseItalianNumber(t.importo).toLocaleString('it-IT', { minimumFractionDigits: 2 })} €
                      </div>
                    </div>
                  </button>
                )) : <p className="text-center text-muted-foreground text-sm py-4">Nessun movimento disponibile</p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export function ProjectEmailsTab({ projectId, projectTitle }: { projectId: string; projectTitle: string }) {
  const queryClient = useQueryClient();
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [newEmailSubject, setNewEmailSubject] = useState("");
  const [newEmailFrom, setNewEmailFrom] = useState("");
  const [newEmailPreview, setNewEmailPreview] = useState("");

  const { data: projectEmails = [], isLoading } = useQuery({
    queryKey: ["project-emails", projectId],
    queryFn: () => projectsApi.getEmails(projectId),
    enabled: !!projectId,
  });

  const addEmailMutation = useMutation({
    mutationFn: (data: any) => projectsApi.addEmail(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-emails", projectId] });
      setLinkDialogOpen(false);
      setNewEmailSubject("");
      setNewEmailFrom("");
      setNewEmailPreview("");
    },
  });

  const removeEmailMutation = useMutation({
    mutationFn: (emailId: string) => projectsApi.removeEmail(projectId, emailId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-emails", projectId] });
    },
  });

  const handleAddEmail = () => {
    if (!newEmailSubject || !newEmailFrom) return;
    addEmailMutation.mutate({
      emailId: `manual-${Date.now()}`,
      emailSubject: newEmailSubject,
      emailFrom: newEmailFrom,
      emailPreview: newEmailPreview || null,
      emailDate: new Date().toISOString(),
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {projectEmails.map((email: ProjectEmail) => (
            <div key={email.id} className="p-3 border rounded-lg hover:bg-muted/50 group">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Mail className="h-4 w-4 text-blue-500 flex-shrink-0" />
                    <span className="font-medium text-sm truncate">{email.emailSubject}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mb-1">
                    Da: {email.emailFrom}
                  </div>
                  {email.emailPreview && (
                    <div className="text-xs text-muted-foreground truncate">
                      {email.emailPreview}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => removeEmailMutation.mutate(email.id)}
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-600 p-1"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
          {projectEmails.length === 0 && (
            <div className="text-center text-muted-foreground text-sm py-8">
              <Mail className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Nessuna email collegata a questo progetto</p>
              <p className="text-xs mt-1">Collega email per tenere traccia della corrispondenza</p>
            </div>
          )}
        </div>
      </ScrollArea>
      <div className="p-4 border-t">
        <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="w-full">
              <Link className="h-4 w-4 mr-2" />
              Collega Email
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Collega Email a "{projectTitle}"</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Oggetto Email *</Label>
                <Input
                  placeholder="Oggetto dell'email..."
                  value={newEmailSubject}
                  onChange={(e) => setNewEmailSubject(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Mittente *</Label>
                <Input
                  placeholder="email@esempio.com"
                  value={newEmailFrom}
                  onChange={(e) => setNewEmailFrom(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Anteprima (opzionale)</Label>
                <Input
                  placeholder="Breve descrizione del contenuto..."
                  value={newEmailPreview}
                  onChange={(e) => setNewEmailPreview(e.target.value)}
                />
              </div>
              <Button
                onClick={handleAddEmail}
                disabled={!newEmailSubject || !newEmailFrom || addEmailMutation.isPending}
                className="w-full"
              >
                {addEmailMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Collega Email
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

interface ProjectDocument {
  id: string;
  projectId: string;
  documentId: string;
  addedAt: string;
  document: {
    id: string;
    title: string;
    icon: string | null;
    content: string | null;
  };
}

export function ProjectDocumentsTab({ projectId, projectTitle }: { projectId: string; projectTitle: string }) {
  const queryClient = useQueryClient();
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<ProjectDocument["document"] | null>(null);
  const [, navigate] = useLocation();

  const { data: projectDocuments = [], isLoading } = useQuery({
    queryKey: ["project-documents", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/documents`);
      return res.json();
    },
    enabled: !!projectId,
  });

  const { data: allDocuments = [] } = useQuery({
    queryKey: ["documents"],
    queryFn: async () => {
      const res = await fetch("/api/documents");
      return res.json();
    },
  });

  const addDocumentMutation = useMutation({
    mutationFn: async (documentId: string) => {
      const res = await fetch(`/api/projects/${projectId}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-documents", projectId] });
      setLinkDialogOpen(false);
    },
  });

  const removeDocumentMutation = useMutation({
    mutationFn: async (docId: string) => {
      await fetch(`/api/projects/${projectId}/documents/${docId}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-documents", projectId] });
    },
  });

  const linkedDocIds = new Set(projectDocuments.map((pd: ProjectDocument) => pd.documentId));
  const availableDocuments = allDocuments.filter((doc: any) => !linkedDocIds.has(doc.id));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {projectDocuments.map((pd: ProjectDocument) => (
            <div
              key={pd.id}
              className="p-3 border rounded-lg hover:bg-muted/50 group cursor-pointer transition-all hover:shadow-sm"
              onClick={() => setPreviewDoc(pd.document)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{pd.document?.icon || "📄"}</span>
                    <span className="font-medium text-sm truncate">{pd.document?.title}</span>
                  </div>
                  {pd.document?.content && (
                    <div className="text-xs text-muted-foreground line-clamp-2" dangerouslySetInnerHTML={{ __html: pd.document.content.substring(0, 150) }} />
                  )}
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); removeDocumentMutation.mutate(pd.id); }}
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-600 p-1"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
          {projectDocuments.length === 0 && (
            <div className="text-center text-muted-foreground text-sm py-8">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Nessun documento collegato a questo progetto</p>
              <p className="text-xs mt-1">Collega documenti per organizzare il lavoro</p>
            </div>
          )}
        </div>
      </ScrollArea>
      <div className="p-4 border-t">
        <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="w-full">
              <Link className="h-4 w-4 mr-2" />
              Collega Documento
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Collega Documento a "{projectTitle}"</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              {availableDocuments.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {availableDocuments.map((doc: any) => (
                    <button
                      key={doc.id}
                      onClick={() => addDocumentMutation.mutate(doc.id)}
                      className="w-full p-3 border rounded-lg hover:bg-muted/50 text-left flex items-center gap-3"
                      disabled={addDocumentMutation.isPending}
                    >
                      <span className="text-xl">{doc.icon || "📄"}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{doc.title}</div>
                      </div>
                      <Plus className="h-4 w-4 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-4">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nessun documento disponibile</p>
                  <p className="text-xs mt-1">Crea documenti nella sezione Documenti</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={!!previewDoc} onOpenChange={(open) => !open && setPreviewDoc(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-2xl">{previewDoc?.icon || "📄"}</span>
              {previewDoc?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto py-4 border rounded-lg bg-muted/20 p-4">
            {previewDoc?.content ? (
              <div
                className="prose prose-sm max-w-none text-sm"
                dangerouslySetInnerHTML={{ __html: previewDoc.content }}
              />
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <FileText className="h-12 w-12 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Documento vuoto</p>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setPreviewDoc(null)}>
              Chiudi
            </Button>
            <Button onClick={() => {
              navigate("/projects?tab=documenti&docId=" + previewDoc?.id);
              setPreviewDoc(null);
            }}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Apri
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function ProjectsAndTasks() {
  const queryClient = useQueryClient();
  const { user: authUser } = useAuth();
  const [newProjectTitle, setNewProjectTitle] = useState("");
  const [newProjectOwner, setNewProjectOwner] = useState("");
  const [newProjectStatus, setNewProjectStatus] = useState("Not Started");
  const [newProjectDueDate, setNewProjectDueDate] = useState("");
  const [newProjectNotes, setNewProjectNotes] = useState("");
  const [newProjectPriority, setNewProjectPriority] = useState("Medium");
  const [newProjectBudget, setNewProjectBudget] = useState("");
  const [newProjectFile, setNewProjectFile] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ title: "", status: "", priority: "", dueDate: "" });
  const [activeTab, setActiveTab] = useState("overview");
  const [mainTab, setMainTab] = useState("dashboard");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [newTask, setNewTask] = useState("");
  const [showAllTasks, setShowAllTasks] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);
  const [draggedProject, setDraggedProject] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"board" | "timeline">("board");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareLink, setShareLink] = useState("");
  const [shareExpiresAt, setShareExpiresAt] = useState<Date | null>(null);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedPermission, setSelectedPermission] = useState("view");
  const [dashboardStyle, setDashboardStyle] = useState<'classica' | 'focus' | 'bento' | 'notion' | 'executive'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('pulse-dashboard-style');
      return (saved as 'classica' | 'focus' | 'bento' | 'notion' | 'executive') || 'classica';
    }
    return 'classica';
  });
  const [panelLayout, setPanelLayout] = useState<'default' | 'notion' | 'linear' | 'finanza'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('pulse-panel-layout');
      return (saved as 'default' | 'notion' | 'linear' | 'finanza') || 'default';
    }
    return 'default';
  });
  const [analysisLayout, setAnalysisLayout] = useState<'compact' | 'mountain' | 'table' | 'grid'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('pulse-analysis-layout');
      return (saved as 'compact' | 'mountain' | 'table' | 'grid') || 'mountain';
    }
    return 'mountain';
  });
  const [analysisSelectedProject, setAnalysisSelectedProject] = useState<string | null>(null);
  const { toast } = useToast();

  const saveDashboardStyle = (style: 'classica' | 'focus' | 'bento' | 'notion' | 'executive') => {
    setDashboardStyle(style);
    if (typeof window !== 'undefined') {
      localStorage.setItem('pulse-dashboard-style', style);
    }
  };

  const savePanelLayout = (layout: 'default' | 'notion' | 'linear' | 'finanza') => {
    setPanelLayout(layout);
    if (typeof window !== 'undefined') {
      localStorage.setItem('pulse-panel-layout', layout);
    }
  };

  const saveAnalysisLayout = (layout: 'compact' | 'mountain' | 'table' | 'grid') => {
    setAnalysisLayout(layout);
    if (typeof window !== 'undefined') {
      localStorage.setItem('pulse-analysis-layout', layout);
    }
  };

  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: projectsApi.getAll,
  });

  const { data: sharedProjects = [], isLoading: sharedProjectsLoading } = useQuery({
    queryKey: ["shared-projects"],
    queryFn: async () => {
      const res = await fetch("/api/projects/shared");
      if (!res.ok) throw new Error("Errore nel recupero progetti condivisi");
      return res.json();
    },
  });

  useEffect(() => {
    if (projects.length > 0) {
      const urlParams = new URLSearchParams(window.location.search);
      const projectIdFromUrl = urlParams.get('id');
      if (projectIdFromUrl) {
        const project = projects.find((p: any) => p.id === projectIdFromUrl);
        if (project) {
          setSelectedProject(project);
          setMainTab("progetti");
          window.history.replaceState({}, '', '/projects');
        }
      }
    }
  }, [projects]);

  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ["tasks"],
    queryFn: tasksApi.getAll,
  });

  const { data: personalTodos = [] } = useQuery({
    queryKey: ["personal-todos", authUser?.id],
    queryFn: async () => {
      const params = new URLSearchParams({ _t: Date.now().toString() });
      if (authUser?.id) params.append("userId", String(authUser.id));
      const res = await fetch(`/api/personal-todos?${params.toString()}`, {
        cache: "no-store",
        credentials: "include",
        headers: { "Cache-Control": "no-cache" }
      });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!authUser?.id,
  });

  // Define isLoading early to prevent undefined reference
  const isLoading = projectsLoading || tasksLoading;

  const getProjectTasks = (project: any) => {
    if (!project) return [];
    const projectTasks = tasks.filter((t: any) =>
      t.tag?.toLowerCase().includes(project.title.toLowerCase().split(' ')[0]) ||
      project.title.toLowerCase().includes(t.tag?.toLowerCase() || '')
    );
    return projectTasks;
  };

  const getProjectProgress = (project: any) => {
    const projectTasks = getProjectTasks(project);
    if (projectTasks.length === 0) {
      return project.status === 'Done' ? 100 : project.status === 'In Progress' ? 50 : 0;
    }
    const completedTasks = projectTasks.filter((t: any) => t.done).length;
    return Math.round((completedTasks / projectTasks.length) * 100);
  };

  const getDaysUntilDeadline = (dueDate: string | null | undefined) => {
    if (!dueDate || dueDate === 'TBD') return null;
    try {
      let date: Date | null = null;
      if (/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
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

  const getTimeProgress = (createdAt: string | null | undefined, dueDate: string | null | undefined) => {
    if (!createdAt || !dueDate || dueDate === 'TBD') return null;
    try {
      let startDate = new Date(createdAt);
      let endDate: Date;
      if (/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
        endDate = parseISO(dueDate);
      } else {
        endDate = new Date(dueDate);
      }
      if (!isValid(startDate) || !isValid(endDate)) return null;

      const today = new Date();
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);

      const totalDays = differenceInDays(endDate, startDate);
      const elapsedDays = differenceInDays(today, startDate);

      if (totalDays <= 0) return { percent: 100, elapsed: elapsedDays, total: totalDays };

      const percent = Math.min(100, Math.max(0, Math.round((elapsedDays / totalDays) * 100)));
      return { percent, elapsed: elapsedDays, total: totalDays };
    } catch {
      return null;
    }
  };

  const createProjectMutation = useMutation({
    mutationFn: async (data: any) => {
      const project = await projectsApi.create(data);

      try {
        await fetch('/api/archive-folders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            name: data.title,
            color: '#8B5CF6',
            icon: 'folder',
            createdBy: authUser?.id
          })
        });
      } catch (e) {
        console.log('Cartella archivio già esistente o errore:', e);
      }

      return project;
    },
    onError: (error: any) => {
      console.error("Errore creazione progetto:", error);
      toast({
        title: "Errore",
        description: error.message || "Impossibile creare il progetto",
        variant: "destructive",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["archive-folders"] });
      resetNewProjectForm();
      setDialogOpen(false);
      toast({
        title: "Progetto creato",
        description: "Cartella creata automaticamente nell'Archivio"
      });
    },
  });

  const updateProjectMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => projectsApi.update(id, data),
    onSuccess: (updatedProject) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setSelectedProject(updatedProject);
      setIsEditing(false);
    },
  });

  const handleDragStart = (e: React.DragEvent, projectId: string) => {
    e.dataTransfer.setData("projectId", projectId);
    setDraggedProject(projectId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    const projectId = e.dataTransfer.getData("projectId");
    if (projectId) {
      updateProjectMutation.mutate({
        id: projectId,
        data: { status: newStatus },
      });
    }
    setDraggedProject(null);
  };

  const handleDragEnd = () => {
    setDraggedProject(null);
  };

  const deleteProjectMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || data.error || "Errore durante l'eliminazione");
      }
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setSelectedProject(null);
      toast({
        title: "Progetto eliminato",
        description: "Il progetto è stato eliminato con successo.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Impossibile eliminare il progetto",
        description: error.message,
        variant: "destructive",
      });
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
      queryClient.invalidateQueries({ queryKey: ["shared-projects"] });
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
    u.id !== authUser?.id &&
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
          sharedById: authUser?.id,
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
    toast({
      title: "Link copiato",
      description: "Il link di condivisione è stato copiato negli appunti.",
    });
  };

  const createTaskMutation = useMutation({
    mutationFn: tasksApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setNewTask("");
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => tasksApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: tasksApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
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
      updateProjectMutation.mutate({
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

  const handleCreateProject = () => {
    if (newProjectTitle.trim()) {
      createProjectMutation.mutate({
        title: newProjectTitle,
        status: newProjectStatus,
        priority: newProjectPriority,
        dueDate: newProjectDueDate || "TBD",
        owner: newProjectOwner || authUser?.name || null,
        notes: newProjectNotes || null,
        budget: newProjectBudget || null,
        files: newProjectFile ? JSON.stringify([newProjectFile]) : "[]",
      });
    }
  };

  const resetNewProjectForm = () => {
    setNewProjectTitle("");
    setNewProjectOwner("");
    setNewProjectStatus("Not Started");
    setNewProjectDueDate("");
    setNewProjectNotes("");
    setNewProjectPriority("Medium");
    setNewProjectBudget("");
    setNewProjectFile("");
  };

  const handleAddTask = () => {
    if (newTask.trim()) {
      const tag = selectedProject ? selectedProject.title.split(' ')[0] : "General";
      createTaskMutation.mutate({
        title: newTask,
        done: false,
        dueDate: "No Date",
        tag: tag,
        projectId: selectedProject?.id || null
      });
    }
  };

  const toggleTask = (id: string, done: boolean) => {
    updateTaskMutation.mutate({ id, data: { done: !done } });
  };

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const statusColors: Record<string, string> = {
    "Not Started": "bg-gray-500",
    "In Progress": "bg-blue-500",
    "Done": "bg-green-500",
  };

  const priorityColors: Record<string, string> = {
    "High": "bg-red-500",
    "Medium": "bg-yellow-500",
    "Low": "bg-green-500",
  };

  const getProjectPosition = (project: any) => {
    if (!project.dueDate || project.dueDate === "TBD") return null;

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const totalDays = daysInMonth.length;

    let startDate = project.createdAt ? new Date(project.createdAt) : monthStart;
    let endDate: Date;

    try {
      endDate = new Date(project.dueDate);
      if (isNaN(endDate.getTime())) return null;
    } catch {
      return null;
    }

    if (startDate > monthEnd || endDate < monthStart) return null;

    const effectiveStart = startDate < monthStart ? monthStart : startDate;
    const effectiveEnd = endDate > monthEnd ? monthEnd : endDate;

    const startDay = Math.max(0, Math.floor((effectiveStart.getTime() - monthStart.getTime()) / (1000 * 60 * 60 * 24)));
    const endDay = Math.min(totalDays - 1, Math.floor((effectiveEnd.getTime() - monthStart.getTime()) / (1000 * 60 * 60 * 24)));

    const leftPercent = (startDay / totalDays) * 100;
    const widthPercent = Math.max(3, ((endDay - startDay + 1) / totalDays) * 100);

    return { left: `${leftPercent}%`, width: `${widthPercent}%` };
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

  const displayedTasks = showAllTasks
    ? tasks
    : selectedProject
      ? getProjectTasks(selectedProject)
      : [];

  return (
    <AppLayout>
      <div className={`h-full flex flex-col overflow-hidden bg-gradient-to-br from-[#f5f0e6] via-[#e8dcc8] to-[#ddd0b8] dark:from-[#2d3748] dark:via-[#374151] dark:to-[#3d4555] ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
        <div className="h-32 w-full flex-shrink-0 bg-gradient-to-r from-[#4a5568] via-[#5a6a7d] to-[#6b7a8f]" />

        <div className="flex-1 overflow-auto -mt-16 px-6">
          <Tabs value={mainTab} onValueChange={setMainTab} className="h-full flex flex-col">
            <div className="bg-stone-50 dark:bg-stone-900/50 rounded-xl shadow-lg border mb-6" style={{ maxWidth: "95rem" }}>
              <div className="p-6 pb-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
                    <Briefcase className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h1 className="text-2xl font-bold tracking-tight">Progetti e Attività</h1>
                    <p className="text-sm text-muted-foreground">
                      Gestisci progetti, documenti e archivio
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsFullscreen(!isFullscreen)}
                      className="flex flex-col items-center justify-center gap-0.5 h-auto py-1.5 px-2"
                    >
                      {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <TabsList className="grid grid-cols-7 gap-1 h-auto bg-transparent p-0">
                  <TabsTrigger value="dashboard" className="flex flex-col items-center justify-center gap-0.5 px-1 py-2 text-[9px] data-[state=active]:bg-primary/20 rounded-lg" title="Dashboard">
                    <BarChart3 className="h-4 w-4" />
                    <span>Dashboard</span>
                  </TabsTrigger>
                  <TabsTrigger value="mountain" className="flex flex-col items-center justify-center gap-0.5 px-1 py-2 text-[9px] data-[state=active]:bg-primary/20 rounded-lg" title="Analisi">
                    <Mountain className="h-4 w-4" />
                    <span>Analisi</span>
                  </TabsTrigger>
                  <TabsTrigger value="board" className="flex flex-col items-center justify-center gap-0.5 px-1 py-2 text-[9px] data-[state=active]:bg-primary/20 rounded-lg" title="Progetti">
                    <LayoutGrid className="h-4 w-4" />
                    <span>Progetti</span>
                  </TabsTrigger>
                  <TabsTrigger value="todo" className="flex flex-col items-center justify-center gap-0.5 px-1 py-2 text-[9px] data-[state=active]:bg-primary/20 rounded-lg" title="To-Do">
                    <CheckSquare className="h-4 w-4" />
                    <span>To-Do</span>
                  </TabsTrigger>
                  <TabsTrigger value="documenti" className="flex flex-col items-center justify-center gap-0.5 px-1 py-2 text-[9px] data-[state=active]:bg-primary/20 rounded-lg" title="Documenti">
                    <FileText className="h-4 w-4" />
                    <span>Documenti</span>
                  </TabsTrigger>
                  <TabsTrigger value="archivio" className="flex flex-col items-center justify-center gap-0.5 px-1 py-2 text-[9px] data-[state=active]:bg-primary/20 rounded-lg" title="Archivio">
                    <Archive className="h-4 w-4" />
                    <span>Archivio</span>
                  </TabsTrigger>
                  <TabsTrigger value="condivisi" className="flex flex-col items-center justify-center gap-0.5 px-1 py-2 text-[9px] data-[state=active]:bg-primary/20 rounded-lg" title="Condivisi">
                    <Share2 className="h-4 w-4" />
                    <span>Condivisi</span>
                  </TabsTrigger>
                </TabsList>
              </div>
            </div>

            <TabsContent value="dashboard" className="flex-1 overflow-hidden mt-0 px-8 py-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">
                  {dashboardStyle === 'classica' && 'Dashboard Classica'}
                  {dashboardStyle === 'focus' && 'Focus del Giorno'}
                  {dashboardStyle === 'bento' && 'Bento Grid'}
                  {dashboardStyle === 'notion' && 'Notion Style'}
                  {dashboardStyle === 'executive' && 'Executive Summary'}
                </h2>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Settings className="h-4 w-4" />
                      Stile Dashboard
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-56 p-2" align="end">
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground px-2 py-1">Scegli Layout</p>
                      {[
                        { id: 'classica', label: 'Classica', icon: LayoutGrid },
                        { id: 'focus', label: 'Focus del Giorno', icon: Target },
                        { id: 'bento', label: 'Bento Grid', icon: LayoutGrid },
                        { id: 'notion', label: 'Notion Style', icon: FileText },
                        { id: 'executive', label: 'Executive Summary', icon: BarChart3 },
                      ].map((style) => (
                        <button
                          key={style.id}
                          onClick={() => saveDashboardStyle(style.id as any)}
                          className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm hover:bg-muted transition-colors ${dashboardStyle === style.id ? 'bg-violet-100 text-violet-700' : ''
                            }`}
                        >
                          <style.icon className="h-4 w-4" />
                          {style.label}
                          {dashboardStyle === style.id && <Check className="h-3 w-3 ml-auto" />}
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {dashboardStyle === 'classica' && (
                <ScrollArea className="h-[calc(100vh-220px)]">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                    <Card className="bg-gradient-to-br from-violet-50 to-purple-50 border-violet-200">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-muted-foreground">Progetti Totali</p>
                            <p className="text-xl font-bold text-violet-700">{projects.length}</p>
                          </div>
                          <div className="h-8 w-8 rounded-full bg-violet-100 flex items-center justify-center">
                            <Briefcase className="h-4 w-4 text-violet-600" />
                          </div>
                        </div>
                        <div className="mt-1.5 flex gap-1.5 text-[10px]">
                          <span className="px-1.5 py-0.5 rounded-full bg-green-100 text-green-700">
                            {projects.filter((p: any) => p.status === 'Done').length} completati
                          </span>
                          <span className="px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700">
                            {projects.filter((p: any) => p.status === 'In Progress').length} attivi
                          </span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-muted-foreground">To-Do Personali</p>
                            <p className="text-xl font-bold text-blue-700">{personalTodos.length}</p>
                          </div>
                          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <ListTodo className="h-4 w-4 text-blue-600" />
                          </div>
                        </div>
                        <div className="mt-1.5 flex gap-1.5 text-[10px]">
                          <span className="px-1.5 py-0.5 rounded-full bg-green-100 text-green-700">
                            {personalTodos.filter((t: any) => t.completed).length} completati
                          </span>
                          <span className="px-1.5 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
                            {personalTodos.filter((t: any) => !t.completed).length} da fare
                          </span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-muted-foreground">In Scadenza</p>
                            <p className="text-xl font-bold text-amber-700">
                              {personalTodos.filter((t: any) => {
                                if (!t.dueDate || t.completed) return false;
                                const due = new Date(t.dueDate);
                                const now = new Date();
                                const diff = differenceInDays(due, now);
                                return diff >= 0 && diff <= 7;
                              }).length}
                            </p>
                          </div>
                          <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center">
                            <Clock className="h-4 w-4 text-amber-600" />
                          </div>
                        </div>
                        <p className="mt-1.5 text-[10px] text-muted-foreground">Prossimi 7 giorni</p>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-red-50 to-rose-50 border-red-200">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-muted-foreground">In Ritardo</p>
                            <p className="text-xl font-bold text-red-700">
                              {personalTodos.filter((t: any) => {
                                if (!t.dueDate || t.completed) return false;
                                const due = new Date(t.dueDate);
                                return due < new Date();
                              }).length}
                            </p>
                          </div>
                          <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                            <Clock className="h-4 w-4 text-red-600" />
                          </div>
                        </div>
                        <p className="mt-1.5 text-[10px] text-muted-foreground">To-Do scaduti</p>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="mb-4">
                    <p className="text-xs text-muted-foreground mb-2">Azioni Rapide</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <Button variant="outline" className="h-auto py-3 flex flex-col items-center gap-1.5 hover:bg-violet-50 hover:border-violet-300" onClick={() => { setMainTab("board"); setTimeout(() => setDialogOpen(true), 100); }}>
                        <Briefcase className="h-5 w-5 text-violet-600" />
                        <span className="text-xs">Nuovo Progetto</span>
                      </Button>
                      <Button variant="outline" className="h-auto py-3 flex flex-col items-center gap-1.5 hover:bg-blue-50 hover:border-blue-300" onClick={() => setMainTab("todo")}>
                        <ListTodo className="h-5 w-5 text-blue-600" />
                        <span className="text-xs">Nuovo Task</span>
                      </Button>
                      <Button variant="outline" className="h-auto py-3 flex flex-col items-center gap-1.5 hover:bg-emerald-50 hover:border-emerald-300" onClick={() => setMainTab("documenti")}>
                        <FileText className="h-5 w-5 text-emerald-600" />
                        <span className="text-xs">Nuovo Documento</span>
                      </Button>
                      <Button variant="outline" className="h-auto py-3 flex flex-col items-center gap-1.5 hover:bg-amber-50 hover:border-amber-300" onClick={() => setMainTab("archivio")}>
                        <FolderOpen className="h-5 w-5 text-amber-600" />
                        <span className="text-xs">Archivia File</span>
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-2 pt-3 px-4">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Mountain className="h-4 w-4 text-violet-600" />
                          Progresso Progetti
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="px-4 pb-3">
                        <div className="space-y-3 max-h-[300px] overflow-y-auto">
                          {projects.slice(0, 5).map((project: any) => {
                            const projectTasks = tasks.filter((t: any) => t.projectId === project.id);
                            const completedTasks = projectTasks.filter((t: any) => t.status === 'Done').length;
                            const progress = projectTasks.length > 0 ? Math.round((completedTasks / projectTasks.length) * 100) : 0;
                            return (
                              <div key={project.id} className="space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="font-medium text-xs">{project.title}</span>
                                  <span className="text-[10px] text-muted-foreground">{progress}%</span>
                                </div>
                                <Progress value={progress} className="h-1.5" />
                              </div>
                            );
                          })}
                          {projects.length === 0 && <p className="text-center text-muted-foreground text-xs py-6">Nessun progetto</p>}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2 pt-3 px-4">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <ListTodo className="h-4 w-4 text-blue-600" />
                          Task Recenti
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="px-4 pb-3">
                        <div className="space-y-2 max-h-[300px] overflow-y-auto">
                          {tasks.slice(0, 8).map((task: any) => {
                            const project = projects.find((p: any) => p.id === task.projectId);
                            return (
                              <div key={task.id} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-muted/50">
                                <div className={`w-1.5 h-1.5 rounded-full ${task.status === 'Done' ? 'bg-green-500' : task.status === 'In Progress' ? 'bg-blue-500' : 'bg-gray-400'}`} />
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium truncate">{task.title}</p>
                                  <p className="text-[10px] text-muted-foreground truncate">{project?.title || 'Senza progetto'}</p>
                                </div>
                              </div>
                            );
                          })}
                          {tasks.length === 0 && <p className="text-center text-muted-foreground text-xs py-6">Nessun task</p>}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </ScrollArea>
              )}

              {dashboardStyle === 'focus' && (
                <ScrollArea className="h-[calc(100vh-220px)]">
                  <div className="flex items-center gap-3 mb-6">
                    <Sun className="h-8 w-8 text-amber-500" />
                    <div>
                      <h3 className="text-xl font-bold">Buongiorno, {authUser?.name || 'Utente'}!</h3>
                      <p className="text-sm text-muted-foreground">{format(new Date(), "EEEE d MMMM yyyy", { locale: it })}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-4">
                      <Card className="border-l-4 border-l-violet-500">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Target className="h-4 w-4 text-violet-600" />
                            Priorita del Giorno
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {personalTodos.filter((t: any) => !t.completed && t.priority === 'high').slice(0, 3).map((todo: any) => (
                              <div key={todo.id} className="flex items-center gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
                                <div className="h-2 w-2 rounded-full bg-red-500" />
                                <span className="font-medium text-sm flex-1">{todo.title}</span>
                                {todo.dueDate && <span className="text-xs text-muted-foreground">{format(new Date(todo.dueDate), 'dd MMM', { locale: it })}</span>}
                              </div>
                            ))}
                            {personalTodos.filter((t: any) => !t.completed && t.priority === 'high').length === 0 && (
                              <p className="text-center text-muted-foreground text-sm py-4">Nessuna priorita alta per oggi</p>
                            )}
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <ListTodo className="h-4 w-4 text-blue-600" />
                            To-Do di Oggi ({personalTodos.filter((t: any) => !t.completed).length})
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2 max-h-[300px] overflow-y-auto">
                            {personalTodos.filter((t: any) => !t.completed).slice(0, 8).map((todo: any) => (
                              <div key={todo.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 group">
                                <Checkbox checked={todo.completed} className="h-4 w-4" />
                                <span className="flex-1 text-sm">{todo.title}</span>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full ${todo.priority === 'high' ? 'bg-red-100 text-red-700' :
                                  todo.priority === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'
                                  }`}>{todo.priority === 'high' ? 'Alta' : todo.priority === 'medium' ? 'Media' : 'Bassa'}</span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="space-y-4">
                      <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                        <CardContent className="p-4 text-center">
                          <CheckCircle2 className="h-8 w-8 text-green-600 mx-auto mb-2" />
                          <p className="text-2xl font-bold text-green-700">{personalTodos.filter((t: any) => t.completed).length}</p>
                          <p className="text-xs text-muted-foreground">Completati oggi</p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-xs flex items-center gap-2">
                            <Calendar className="h-3 w-3" />
                            Prossime Scadenze
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          {personalTodos.filter((t: any) => t.dueDate && !t.completed).sort((a: any, b: any) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()).slice(0, 5).map((todo: any) => (
                            <div key={todo.id} className="flex items-center gap-2 text-xs">
                              <Clock className="h-3 w-3 text-muted-foreground" />
                              <span className="flex-1 truncate">{todo.title}</span>
                              <span className="text-muted-foreground">{format(new Date(todo.dueDate), 'dd/MM', { locale: it })}</span>
                            </div>
                          ))}
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-xs flex items-center gap-2">
                            <Briefcase className="h-3 w-3" />
                            Progetti Attivi
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          {projects.filter((p: any) => p.status === 'In Progress').slice(0, 4).map((project: any) => (
                            <div key={project.id} className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full bg-blue-500" />
                              <span className="text-xs truncate flex-1">{project.title}</span>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </ScrollArea>
              )}

              {dashboardStyle === 'bento' && (
                <ScrollArea className="h-[calc(100vh-220px)]">
                  <div className="grid grid-cols-4 gap-4 auto-rows-[120px]">
                    <Card className="col-span-2 row-span-2 bg-gradient-to-br from-violet-500 to-purple-600 text-white border-0">
                      <CardContent className="p-6 h-full flex flex-col justify-between">
                        <div>
                          <p className="text-violet-200 text-sm">Progetti Attivi</p>
                          <p className="text-5xl font-bold">{projects.filter((p: any) => p.status === 'In Progress').length}</p>
                        </div>
                        <div className="flex gap-2">
                          <span className="bg-white/20 px-2 py-1 rounded text-xs">{projects.filter((p: any) => p.status === 'Done').length} completati</span>
                          <span className="bg-white/20 px-2 py-1 rounded text-xs">{projects.filter((p: any) => p.status === 'Not Started').length} da iniziare</span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
                      <CardContent className="p-4 h-full flex flex-col justify-center items-center">
                        <ListTodo className="h-6 w-6 text-blue-600 mb-1" />
                        <p className="text-2xl font-bold text-blue-700">{personalTodos.filter((t: any) => !t.completed).length}</p>
                        <p className="text-[10px] text-muted-foreground">Da fare</p>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                      <CardContent className="p-4 h-full flex flex-col justify-center items-center">
                        <CheckCircle2 className="h-6 w-6 text-green-600 mb-1" />
                        <p className="text-2xl font-bold text-green-700">{personalTodos.filter((t: any) => t.completed).length}</p>
                        <p className="text-[10px] text-muted-foreground">Completati</p>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-red-50 to-rose-50 border-red-200">
                      <CardContent className="p-4 h-full flex flex-col justify-center items-center">
                        <AlertTriangle className="h-6 w-6 text-red-600 mb-1" />
                        <p className="text-2xl font-bold text-red-700">{personalTodos.filter((t: any) => !t.completed && t.dueDate && new Date(t.dueDate) < new Date()).length}</p>
                        <p className="text-[10px] text-muted-foreground">In ritardo</p>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
                      <CardContent className="p-4 h-full flex flex-col justify-center items-center">
                        <Clock className="h-6 w-6 text-amber-600 mb-1" />
                        <p className="text-2xl font-bold text-amber-700">{personalTodos.filter((t: any) => { if (!t.dueDate || t.completed) return false; const diff = differenceInDays(new Date(t.dueDate), new Date()); return diff >= 0 && diff <= 7; }).length}</p>
                        <p className="text-[10px] text-muted-foreground">7 giorni</p>
                      </CardContent>
                    </Card>

                    <Card className="col-span-2 row-span-2">
                      <CardHeader className="pb-2 pt-3">
                        <CardTitle className="text-sm">Progetti Recenti</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {projects.slice(0, 4).map((project: any) => {
                          const projectTasks = tasks.filter((t: any) => t.projectId === project.id);
                          const progress = projectTasks.length > 0 ? Math.round((projectTasks.filter((t: any) => t.status === 'Done').length / projectTasks.length) * 100) : 0;
                          return (
                            <div key={project.id} className="space-y-1">
                              <div className="flex justify-between text-xs">
                                <span className="font-medium truncate">{project.title}</span>
                                <span>{progress}%</span>
                              </div>
                              <Progress value={progress} className="h-1" />
                            </div>
                          );
                        })}
                      </CardContent>
                    </Card>

                    <Card className="col-span-2">
                      <CardContent className="p-4 h-full">
                        <p className="text-xs text-muted-foreground mb-2">Azioni Rapide</p>
                        <div className="grid grid-cols-4 gap-2">
                          <Button variant="ghost" size="sm" className="h-auto py-2 flex flex-col gap-1" onClick={() => { setMainTab("board"); setTimeout(() => setDialogOpen(true), 100); }}>
                            <Briefcase className="h-4 w-4 text-violet-600" />
                            <span className="text-[10px]">Progetto</span>
                          </Button>
                          <Button variant="ghost" size="sm" className="h-auto py-2 flex flex-col gap-1" onClick={() => setMainTab("todo")}>
                            <ListTodo className="h-4 w-4 text-blue-600" />
                            <span className="text-[10px]">Task</span>
                          </Button>
                          <Button variant="ghost" size="sm" className="h-auto py-2 flex flex-col gap-1" onClick={() => setMainTab("documenti")}>
                            <FileText className="h-4 w-4 text-emerald-600" />
                            <span className="text-[10px]">Doc</span>
                          </Button>
                          <Button variant="ghost" size="sm" className="h-auto py-2 flex flex-col gap-1" onClick={() => setMainTab("archivio")}>
                            <FolderOpen className="h-4 w-4 text-amber-600" />
                            <span className="text-[10px]">Archivio</span>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </ScrollArea>
              )}

              {dashboardStyle === 'notion' && (
                <ScrollArea className="h-[calc(100vh-220px)]">
                  <div className="max-w-4xl mx-auto">
                    <div className="mb-6">
                      <p className="text-sm text-muted-foreground">{format(new Date(), "EEEE, d MMMM yyyy", { locale: it })}</p>
                      <h2 className="text-2xl font-bold mt-1">Ciao, {authUser?.name || 'Utente'}</h2>
                    </div>

                    <div className="grid grid-cols-3 gap-6">
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                          <ListTodo className="h-4 w-4" />
                          To-Do Oggi
                        </div>
                        <div className="space-y-1">
                          {personalTodos.filter((t: any) => !t.completed).slice(0, 8).map((todo: any) => (
                            <div key={todo.id} className="flex items-center gap-2 p-2 rounded hover:bg-muted/50 group">
                              <Checkbox checked={todo.completed} className="h-4 w-4" />
                              <span className={`text-sm flex-1 ${todo.completed ? 'line-through text-muted-foreground' : ''}`}>{todo.title}</span>
                            </div>
                          ))}
                          <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground" onClick={() => setMainTab("todo")}>
                            <Plus className="h-4 w-4 mr-2" /> Aggiungi task
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                          <Briefcase className="h-4 w-4" />
                          Progetti Attivi
                        </div>
                        <div className="space-y-2">
                          {projects.filter((p: any) => p.status === 'In Progress').slice(0, 6).map((project: any) => {
                            const projectTasks = tasks.filter((t: any) => t.projectId === project.id);
                            const progress = projectTasks.length > 0 ? Math.round((projectTasks.filter((t: any) => t.status === 'Done').length / projectTasks.length) * 100) : 0;
                            return (
                              <div key={project.id} className="p-3 border rounded-lg hover:shadow-sm transition-shadow cursor-pointer" onClick={() => { setMainTab("board"); setSelectedProject(project); }}>
                                <p className="font-medium text-sm">{project.title}</p>
                                <div className="flex items-center gap-2 mt-2">
                                  <Progress value={progress} className="h-1 flex-1" />
                                  <span className="text-[10px] text-muted-foreground">{progress}%</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                          <Activity className="h-4 w-4" />
                          Attivita Recente
                        </div>
                        <div className="space-y-2">
                          {tasks.slice(0, 6).map((task: any) => {
                            const project = projects.find((p: any) => p.id === task.projectId);
                            return (
                              <div key={task.id} className="flex items-start gap-2 p-2 rounded text-sm">
                                <div className={`mt-1.5 h-1.5 w-1.5 rounded-full flex-shrink-0 ${task.status === 'Done' ? 'bg-green-500' : task.status === 'In Progress' ? 'bg-blue-500' : 'bg-gray-400'}`} />
                                <div className="min-w-0">
                                  <p className="truncate">{task.title}</p>
                                  <p className="text-[10px] text-muted-foreground">{project?.title}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              )}

              {dashboardStyle === 'executive' && (
                <ScrollArea className="h-[calc(100vh-220px)]">
                  <div className="grid grid-cols-5 gap-3 mb-6">
                    <Card>
                      <CardContent className="p-3 text-center">
                        <p className="text-3xl font-bold text-violet-600">{projects.length}</p>
                        <p className="text-[10px] text-muted-foreground">Progetti Totali</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-3 text-center">
                        <p className="text-3xl font-bold text-blue-600">{projects.filter((p: any) => p.status === 'In Progress').length}</p>
                        <p className="text-[10px] text-muted-foreground">In Corso</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-3 text-center">
                        <p className="text-3xl font-bold text-green-600">{projects.filter((p: any) => p.status === 'Done').length}</p>
                        <p className="text-[10px] text-muted-foreground">Completati</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-3 text-center">
                        <p className="text-3xl font-bold text-amber-600">{personalTodos.filter((t: any) => !t.completed).length}</p>
                        <p className="text-[10px] text-muted-foreground">Task Aperti</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-3 text-center">
                        <p className="text-3xl font-bold text-red-600">{personalTodos.filter((t: any) => !t.completed && t.dueDate && new Date(t.dueDate) < new Date()).length}</p>
                        <p className="text-[10px] text-muted-foreground">In Ritardo</p>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <Card className="col-span-2">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-violet-600" />
                          Panoramica Progetti
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {projects.slice(0, 5).map((project: any) => {
                            const projectTasks = tasks.filter((t: any) => t.projectId === project.id);
                            const completed = projectTasks.filter((t: any) => t.status === 'Done').length;
                            const progress = projectTasks.length > 0 ? Math.round((completed / projectTasks.length) * 100) : 0;
                            return (
                              <div key={project.id} className="flex items-center gap-4">
                                <span className="w-40 text-sm font-medium truncate">{project.title}</span>
                                <div className="flex-1">
                                  <Progress value={progress} className="h-2" />
                                </div>
                                <span className="w-12 text-right text-sm font-medium">{progress}%</span>
                                <span className={`w-16 text-center text-[10px] px-2 py-1 rounded-full ${project.status === 'Done' ? 'bg-green-100 text-green-700' :
                                  project.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                                    'bg-gray-100 text-gray-700'
                                  }`}>{project.status === 'Done' ? 'Fatto' : project.status === 'In Progress' ? 'Attivo' : 'Fermo'}</span>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <PieChart className="h-4 w-4 text-blue-600" />
                          Distribuzione Progetti
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-col items-center">
                          <div className="relative h-32 w-32 mb-4">
                            <svg className="h-32 w-32 -rotate-90" viewBox="0 0 36 36">
                              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#22c55e" strokeWidth="3" strokeDasharray={`${projects.length > 0 ? (projects.filter((p: any) => p.status === 'Done').length / projects.length) * 100 : 0}, 100`} />
                              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#3b82f6" strokeWidth="3" strokeDasharray={`${projects.length > 0 ? (projects.filter((p: any) => p.status === 'In Progress').length / projects.length) * 100 : 0}, 100`} strokeDashoffset={`-${projects.length > 0 ? (projects.filter((p: any) => p.status === 'Done').length / projects.length) * 100 : 0}`} />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-2xl font-bold">{projects.length}</span>
                            </div>
                          </div>
                          <div className="flex gap-4 text-xs">
                            <div className="flex items-center gap-1"><div className="h-2 w-2 rounded-full bg-green-500" /> Completati</div>
                            <div className="flex items-center gap-1"><div className="h-2 w-2 rounded-full bg-blue-500" /> Attivi</div>
                            <div className="flex items-center gap-1"><div className="h-2 w-2 rounded-full bg-gray-300" /> Fermi</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        Priorita Urgenti
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4">
                        {personalTodos.filter((t: any) => !t.completed && (t.priority === 'high' || (t.dueDate && new Date(t.dueDate) < new Date()))).slice(0, 6).map((todo: any) => {
                          const isOverdue = todo.dueDate && new Date(todo.dueDate) < new Date();
                          return (
                            <div key={todo.id} className={`p-3 rounded-lg border ${isOverdue ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
                              <p className="font-medium text-sm truncate">{todo.title}</p>
                              <div className="flex items-center gap-2 mt-1">
                                {isOverdue && <span className="text-[10px] text-red-600 font-medium">SCADUTO</span>}
                                {todo.dueDate && <span className="text-[10px] text-muted-foreground">{format(new Date(todo.dueDate), 'dd/MM/yy', { locale: it })}</span>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </ScrollArea>
              )}
            </TabsContent>

            <TabsContent value="mountain" className="flex-1 overflow-hidden mt-0 px-4 py-4">
              <div className="h-full flex gap-4">
                {/* Lista progetti */}
                <div className="w-72 flex-shrink-0 border rounded-lg bg-muted/30 flex flex-col">
                  <div className="p-3 border-b bg-background rounded-t-lg">
                    <div className="flex items-center gap-2">
                      <Mountain className="h-4 w-4 text-violet-600" />
                      <h3 className="font-semibold text-sm">Progetti</h3>
                      <span className="text-xs text-muted-foreground ml-auto">{projects?.length || 0}</span>
                    </div>
                  </div>
                  <ScrollArea className="flex-1">
                    <div className="p-2 space-y-1">
                      {projects?.map((project: any) => {
                        const projectTasks = tasks?.filter((t: any) => t.projectId === project.id) || [];
                        const progress = projectTasks.length > 0
                          ? Math.round((projectTasks.filter((t: any) => t.done).length / projectTasks.length) * 100)
                          : 0;
                        const isSelected = analysisSelectedProject === project.id;

                        return (
                          <button
                            key={project.id}
                            onClick={() => setAnalysisSelectedProject(project.id)}
                            className={`w-full text-left p-3 rounded-lg transition-all ${isSelected
                              ? 'bg-primary text-primary-foreground shadow-sm'
                              : 'hover:bg-muted'
                              }`}
                          >
                            <p className={`font-medium text-xs truncate ${isSelected ? '' : 'text-foreground'}`}>
                              {project.title}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <div className={`flex-1 h-1.5 rounded-full ${isSelected ? 'bg-primary-foreground/30' : 'bg-muted'}`}>
                                <div
                                  className={`h-full rounded-full transition-all ${isSelected
                                    ? 'bg-primary-foreground'
                                    : progress >= 70 ? 'bg-green-500' : progress >= 30 ? 'bg-yellow-500' : 'bg-red-400'
                                    }`}
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                              <span className={`text-xs font-medium min-w-[32px] text-right ${isSelected ? '' : 'text-muted-foreground'}`}>
                                {progress}%
                              </span>
                            </div>
                            <p className={`text-[10px] mt-1 ${isSelected ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                              {projectTasks.filter((t: any) => t.done).length}/{projectTasks.length} attività
                            </p>
                          </button>
                        );
                      })}
                      {(!projects || projects.length === 0) && (
                        <div className="text-center py-8 text-muted-foreground">
                          <Mountain className="h-8 w-8 mx-auto mb-2 opacity-30" />
                          <p className="text-sm">Nessun progetto</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>

                {/* Visualizzazione montagna */}
                <div className="flex-1 border rounded-lg bg-background overflow-hidden flex flex-col">
                  {analysisSelectedProject ? (
                    (() => {
                      const project = projects?.find((p: any) => p.id === analysisSelectedProject);
                      const projectTasks = tasks?.filter((t: any) => t.projectId === analysisSelectedProject) || [];
                      if (!project) return null;

                      return (
                        <>
                          <div className="p-4 border-b flex items-center justify-between">
                            <div>
                              <h2 className="text-lg font-semibold">{project.title}</h2>
                              <p className="text-sm text-muted-foreground">
                                {projectTasks.filter((t: any) => t.done).length}/{projectTasks.length} attività completate
                              </p>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedProject(project)}
                            >
                              Apri progetto
                            </Button>
                          </div>
                          <div className="flex-1 overflow-auto p-6">
                            <MountainProgress
                              projectTitle={project.title}
                              projectId={project.id}
                              tasks={projectTasks.map((t: any) => ({ title: t.title, done: t.done }))}
                            />
                          </div>
                        </>
                      );
                    })()
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <Mountain className="h-16 w-16 mx-auto mb-4 opacity-30" />
                        <p className="text-lg font-medium">Seleziona un progetto</p>
                        <p className="text-sm mt-1">Clicca su un progetto dalla lista per vedere l'analisi</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="board" className="flex-1 overflow-hidden mt-0 px-0 py-0">
              <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-background">
                <div className="flex items-center gap-2">
                  <Button
                    variant={showAllTasks ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setShowAllTasks(!showAllTasks);
                      if (!showAllTasks) setSelectedProject(null);
                    }}
                  >
                    <List className="h-4 w-4 mr-2" />
                    Tutte le Attività
                  </Button>
                  <Button
                    variant={showTimeline ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowTimeline(!showTimeline)}
                  >
                    <CalendarDays className="h-4 w-4 mr-2" />
                    Timeline
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="h-8 text-xs font-normal">
                      <Filter className="h-3.5 w-3.5 mr-1.5" /> Filtra
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 text-xs font-normal">
                      <ArrowUpDown className="h-3.5 w-3.5 mr-1.5" /> Ordina
                    </Button>
                  </div>
                  <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="h-8 text-xs bg-primary hover:bg-primary/90">
                        <Plus className="h-3.5 w-3.5 mr-1.5" /> Nuovo Progetto
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Crea Nuovo Progetto</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 pt-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Titolo *</Label>
                          <Input
                            placeholder="Titolo progetto..."
                            value={newProjectTitle}
                            onChange={(e) => setNewProjectTitle(e.target.value)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Proprietario</Label>
                          <Input
                            placeholder="Nome del proprietario..."
                            value={newProjectOwner || (authUser?.name ?? "")}
                            onChange={(e) => setNewProjectOwner(e.target.value)}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">Stato</Label>
                            <Select value={newProjectStatus} onValueChange={setNewProjectStatus}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Not Started">Da Iniziare</SelectItem>
                                <SelectItem value="In Progress">In Corso</SelectItem>
                                <SelectItem value="Done">Completato</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-sm font-medium">Priorità</Label>
                            <Select value={newProjectPriority} onValueChange={setNewProjectPriority}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Low">Bassa</SelectItem>
                                <SelectItem value="Medium">Media</SelectItem>
                                <SelectItem value="High">Alta</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">Scadenza</Label>
                            <Input
                              type="date"
                              value={newProjectDueDate}
                              onChange={(e) => setNewProjectDueDate(e.target.value)}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label className="text-sm font-medium">Budget (€)</Label>
                            <Input
                              type="number"
                              placeholder="0.00"
                              value={newProjectBudget}
                              onChange={(e) => setNewProjectBudget(e.target.value)}
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Note</Label>
                          <textarea
                            placeholder="Note sul progetto..."
                            value={newProjectNotes}
                            onChange={(e) => setNewProjectNotes(e.target.value)}
                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium">File (URL o nome file)</Label>
                          <Input
                            placeholder="Link al file o nome documento..."
                            value={newProjectFile}
                            onChange={(e) => setNewProjectFile(e.target.value)}
                          />
                        </div>

                        <Button onClick={handleCreateProject} className="w-full" disabled={!newProjectTitle.trim()}>
                          Crea Progetto
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              <div className="flex-1 flex h-full min-h-0 overflow-hidden">
                {showTimeline ? (
                  <div className="flex-1 overflow-auto px-8 pb-8">
                    <div className="flex items-center gap-2 mb-4">
                      <Button variant="outline" size="sm" className="h-8" onClick={() => setCurrentMonth(addMonths(currentMonth, -1))}>
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-xs font-medium px-3 min-w-[120px] text-center">
                        {format(currentMonth, "MMMM yyyy", { locale: it })}
                      </span>
                      <Button variant="outline" size="sm" className="h-8" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                    <ScrollArea className="flex-1">
                      <div className="bg-card rounded-lg border shadow-sm">
                        <div className="grid border-b" style={{ gridTemplateColumns: `180px repeat(${daysInMonth.length}, 1fr)` }}>
                          <div className="p-2 border-r bg-muted/50 font-medium text-xs">Progetto</div>
                          {daysInMonth.map((day, i) => (
                            <div
                              key={i}
                              className={`p-1 text-center text-[10px] border-r ${day.getDay() === 0 || day.getDay() === 6 ? 'bg-muted' : 'bg-muted/50'
                                }`}
                            >
                              <div className="font-medium">{format(day, "d")}</div>
                              <div className="text-muted-foreground text-[8px]">{format(day, "EEE", { locale: it })}</div>
                            </div>
                          ))}
                        </div>

                        {projects.length === 0 ? (
                          <div className="p-6 text-center text-muted-foreground">
                            <CalendarDays className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p className="text-xs">Nessun progetto da visualizzare</p>
                          </div>
                        ) : (
                          projects.map((project: any) => {
                            const position = getProjectPosition(project);
                            return (
                              <div
                                key={project.id}
                                className="grid border-b last:border-b-0 hover:bg-muted/50"
                                style={{ gridTemplateColumns: `180px repeat(${daysInMonth.length}, 1fr)` }}
                              >
                                <div className="p-2 border-r flex items-center gap-2">
                                  <div className={`w-1.5 h-1.5 rounded-full ${priorityColors[project.priority] || 'bg-gray-400'}`} />
                                  <span className="text-xs font-medium truncate">{project.title}</span>
                                </div>
                                <div
                                  className="relative col-span-full"
                                  style={{ gridColumn: `2 / span ${daysInMonth.length}` }}
                                >
                                  {position && (
                                    <div
                                      className={`absolute top-1/2 -translate-y-1/2 h-5 rounded-full ${statusColors[project.status] || 'bg-blue-500'
                                        } opacity-80 hover:opacity-100 transition-opacity cursor-pointer flex items-center px-2`}
                                      style={{ left: position.left, width: position.width }}
                                      title={`${project.title} - ${project.status}`}
                                      onClick={() => {
                                        setSelectedProject(project);
                                        setActiveTab("tasks");
                                        setShowTimeline(false);
                                      }}
                                    >
                                      <span className="text-white text-[8px] font-medium truncate">{project.title}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>

                      <div className="mt-4 flex items-center gap-4 text-[10px]">
                        <span className="font-medium">Legenda:</span>
                        {Object.entries(statusColors).map(([status, color]) => (
                          <div key={status} className="flex items-center gap-1">
                            <div className={`w-2 h-2 rounded-full ${color}`} />
                            <span>{status === "Not Started" ? "Da Iniziare" : status === "In Progress" ? "In Corso" : "Completato"}</span>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                ) : !showAllTasks ? (
                  <ScrollArea className="flex-1 px-4 py-3">
                    <div className="flex gap-3 min-w-max">
                      {COLUMNS.map(col => (
                        <div
                          key={col}
                          className="w-80 flex-shrink-0"
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDrop(e, col)}
                        >
                          <div className="flex items-center justify-between mb-3 px-1">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded text-xs font-medium 
                          ${col === 'Not Started' ? 'bg-neutral-200 text-neutral-700' :
                                  col === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                                    'bg-green-100 text-green-700'}
                        `}>
                                {col === 'Not Started' ? 'Da Iniziare' : col === 'In Progress' ? 'In Corso' : 'Completato'}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {projects.filter((p: any) => p.status === col).length}
                              </span>
                            </div>
                          </div>

                          <div className={`space-y-3 min-h-[100px] rounded-lg p-2 transition-colors ${col === 'Not Started' ? 'bg-gradient-to-b from-yellow-50/80 to-amber-50/40' :
                            col === 'In Progress' ? 'bg-gradient-to-b from-blue-50/80 to-sky-50/40' :
                              'bg-gradient-to-b from-green-50/80 to-emerald-50/40'
                            }`}>
                            {projects.filter((p: any) => p.status === col).map((project: any) => {
                              const timeProgress = getTimeProgress(project.createdAt, project.dueDate);
                              const taskProgress = getProjectProgress(project);
                              const isBehind = timeProgress && timeProgress.percent > taskProgress + 15;
                              const isOnTrack = timeProgress && taskProgress >= timeProgress.percent;
                              const daysLeft = getDaysUntilDeadline(project.dueDate);
                              const isOverdue = daysLeft !== null && daysLeft < 0;
                              const isUrgent = daysLeft !== null && daysLeft >= 0 && daysLeft <= 3;

                              return (
                                <div
                                  key={project.id}
                                  draggable
                                  onDragStart={(e) => handleDragStart(e, project.id)}
                                  onDragEnd={handleDragEnd}
                                  onClick={() => {
                                    setSelectedProject(project);
                                    setShowAllTasks(false);
                                    setActiveTab("tasks");
                                  }}
                                  className={`group bg-white border rounded-xl p-4 cursor-grab active:cursor-grabbing transition-all hover:shadow-lg hover:-translate-y-0.5 ${selectedProject?.id === project.id ? 'border-violet-400 ring-2 ring-violet-200 shadow-md' : 'border-border/60 shadow-sm'
                                    } ${draggedProject === project.id ? 'opacity-50 scale-95' : ''}`}
                                >
                                  <div className="flex items-start justify-between gap-2 mb-3">
                                    <div className="flex-1">
                                      <h3 className="font-semibold text-sm leading-tight text-foreground mb-1">{project.title}</h3>
                                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${project.priority === 'High' ? 'bg-red-100 text-red-700' :
                                        project.priority === 'Medium' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'
                                        }`}>
                                        {project.priority === 'High' ? 'Alta' : project.priority === 'Medium' ? 'Media' : 'Bassa'}
                                      </span>
                                    </div>
                                    <GripVertical className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 flex-shrink-0" />
                                  </div>

                                  {project.description && (
                                    <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{project.description}</p>
                                  )}

                                  <div className="space-y-2 mb-3">
                                    <div>
                                      <div className="flex items-center justify-between text-[10px] mb-1">
                                        <span className="text-muted-foreground flex items-center gap-1">
                                          <ListTodo className="h-3 w-3" />
                                          Attività
                                        </span>
                                        <span className="font-medium">{taskProgress}%</span>
                                      </div>
                                      <div className="relative h-2 w-full overflow-hidden rounded-full bg-gray-100">
                                        <div
                                          className={`h-full transition-all ${col === 'Done' ? 'bg-green-500' : 'bg-violet-500'}`}
                                          style={{ width: `${taskProgress}%` }}
                                        />
                                      </div>
                                    </div>

                                    {timeProgress && (
                                      <div>
                                        <div className="flex items-center justify-between text-[10px] mb-1">
                                          <span className="text-muted-foreground flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            Tempo
                                          </span>
                                          <span className={`font-medium ${isBehind ? 'text-red-600' : isOnTrack ? 'text-green-600' : 'text-orange-500'}`}>
                                            {timeProgress.percent}% ({timeProgress.elapsed}/{timeProgress.total}g)
                                          </span>
                                        </div>
                                        <div className="relative h-2 w-full overflow-hidden rounded-full bg-gray-100">
                                          <div
                                            className={`h-full transition-all ${isBehind ? 'bg-red-400' : isOnTrack ? 'bg-green-500' : 'bg-orange-400'}`}
                                            style={{ width: `${timeProgress.percent}%` }}
                                          />
                                          <div
                                            className="absolute top-0 h-full w-0.5 bg-violet-600"
                                            style={{ left: `${taskProgress}%` }}
                                            title={`Progresso attività: ${taskProgress}%`}
                                          />
                                        </div>
                                        <div className="text-[9px] text-muted-foreground mt-1">
                                          {isBehind ? '⚠️ In ritardo rispetto al piano' : isOnTrack ? '✓ In linea con i tempi' : '→ Da monitorare'}
                                        </div>
                                      </div>
                                    )}
                                  </div>

                                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                                    <div className="flex items-center gap-2">
                                      {(() => {
                                        // Safely parse teamMembers - it might be stored as JSON string
                                        let members: string[] = [];
                                        try {
                                          if (typeof project.teamMembers === 'string') {
                                            members = JSON.parse(project.teamMembers);
                                          } else if (Array.isArray(project.teamMembers)) {
                                            members = project.teamMembers;
                                          }
                                        } catch {
                                          members = [];
                                        }

                                        return members.length > 0 ? (
                                          <div className="flex -space-x-1.5">
                                            {members.slice(0, 4).map((initial: string, i: number) => (
                                              <div key={i} className="h-6 w-6 rounded-full bg-violet-100 border-2 border-white flex items-center justify-center text-[9px] font-bold text-violet-600">
                                                {initial}
                                              </div>
                                            ))}
                                            {members.length > 4 && (
                                              <div className="h-6 w-6 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-[9px] font-medium text-gray-500">
                                                +{members.length - 4}
                                              </div>
                                            )}
                                          </div>
                                        ) : (
                                          <span className="text-[10px] text-muted-foreground">Nessun membro</span>
                                        );
                                      })()}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                        <ListTodo className="h-3 w-3" />
                                        {getProjectTasks(project).filter((t: any) => t.done).length}/{getProjectTasks(project).length}
                                      </span>
                                      {daysLeft !== null && (
                                        <span className={`text-[10px] flex items-center gap-1 font-medium px-2 py-1 rounded-full ${isOverdue ? 'bg-red-100 text-red-700' : isUrgent ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'
                                          }`}>
                                          <Calendar className="h-3 w-3" />
                                          {isOverdue ? `${Math.abs(daysLeft)}g fa` : daysLeft === 0 ? 'Oggi' : `${daysLeft}g`}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                            <button
                              onClick={() => setDialogOpen(true)}
                              className="flex items-center gap-2 text-muted-foreground hover:bg-muted w-full p-2 rounded text-sm transition-colors"
                            >
                              <Plus className="h-4 w-4" /> Nuovo
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <ScrollBar orientation="horizontal" />
                  </ScrollArea>
                ) : null}

                <div className="w-[420px] flex-shrink-0 h-full min-h-0 border-l border-border bg-card flex flex-col shadow-lg">
                  {showAllTasks ? (
                    <>
                      <div className="p-3 border-b bg-gradient-to-r from-violet-50 to-purple-50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-lg bg-violet-500 flex items-center justify-center">
                              <ListTodo className="h-4 w-4 text-white" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-sm">Tutte le Attività</h3>
                              <span className="text-xs text-muted-foreground">{tasks.length} task</span>
                            </div>
                          </div>
                          <button onClick={() => setShowAllTasks(false)} className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-white/50">
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <ScrollArea className="flex-1">
                        <div className="p-4">
                          <div className="space-y-2">
                            {tasks.map((task: any) => (
                              <div key={task.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg hover:bg-muted group">
                                <Checkbox checked={task.done} onCheckedChange={() => toggleTask(task.id, task.done)} />
                                <div className="flex-1">
                                  <span className={`text-sm ${task.done ? 'line-through text-muted-foreground' : ''}`}>{task.title}</span>
                                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                                    <span className="text-xs bg-neutral-200 px-1.5 py-0.5 rounded">{task.tag}</span>
                                    {task.startDate && (
                                      <span className="text-xs text-green-600 flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        {new Date(task.startDate).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })}
                                      </span>
                                    )}
                                    {task.startDate && task.dueDate && task.dueDate !== 'No Date' && (
                                      <span className="text-xs text-muted-foreground">→</span>
                                    )}
                                    {task.dueDate && task.dueDate !== 'No Date' && (
                                      <span className="text-xs text-orange-600 flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {new Date(task.dueDate).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <button className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-blue-600"><MessageCircle className="h-4 w-4" /></button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-96" align="end">
                                    <TaskComments taskId={task.id} taskTitle={task.title} currentUserId={authUser?.id || ''} />
                                  </PopoverContent>
                                </Popover>
                                <button onClick={() => deleteTaskMutation.mutate(task.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                              </div>
                            ))}
                          </div>
                          <div className="mt-4 flex gap-2">
                            <Input placeholder="Nuova attività..." value={newTask} onChange={(e) => setNewTask(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddTask()} className="flex-1" />
                            <Button onClick={handleAddTask} size="sm"><Plus className="h-4 w-4" /></Button>
                          </div>
                        </div>
                      </ScrollArea>
                    </>
                  ) : selectedProject ? (
                    <>
                      {panelLayout === 'default' && (
                        <DefaultLayout
                          project={selectedProject}
                          tasks={getProjectTasks(selectedProject)}
                          isEditing={isEditing}
                          editForm={editForm}
                          setEditForm={setEditForm}
                          setIsEditing={setIsEditing}
                          saveEdit={saveEdit}
                          startEditing={startEditing}
                          handleShare={handleShare}
                          deleteProject={() => deleteProjectMutation.mutate(selectedProject.id)}
                          closePanel={() => setSelectedProject(null)}
                          getProgress={() => getProjectProgress(selectedProject)}
                          newTask={newTask}
                          setNewTask={setNewTask}
                          handleAddTask={handleAddTask}
                          toggleTask={toggleTask}
                          deleteTask={(id: string) => deleteTaskMutation.mutate(id)}
                          updateTask={(id: string, data: any) => updateTaskMutation.mutate({ id, data })}
                          authUserId={authUser?.id || ''}
                          activeTab={activeTab}
                          setActiveTab={setActiveTab}
                          renderFinanceTab={() => <ProjectFinanceTab projectId={selectedProject.id} projectTitle={selectedProject.title} />}
                          renderEmailsTab={() => <ProjectEmailsTab projectId={selectedProject.id} projectTitle={selectedProject.title} />}
                          renderDocumentsTab={() => <ProjectDocumentsTab projectId={selectedProject.id} projectTitle={selectedProject.title} />}
                        />
                      )}
                      {panelLayout === 'notion' && (
                        <NotionLayout
                          project={selectedProject}
                          tasks={getProjectTasks(selectedProject)}
                          isEditing={isEditing}
                          editForm={editForm}
                          setEditForm={setEditForm}
                          setIsEditing={setIsEditing}
                          saveEdit={saveEdit}
                          startEditing={startEditing}
                          handleShare={handleShare}
                          deleteProject={() => deleteProjectMutation.mutate(selectedProject.id)}
                          closePanel={() => setSelectedProject(null)}
                          getProgress={() => getProjectProgress(selectedProject)}
                          newTask={newTask}
                          setNewTask={setNewTask}
                          handleAddTask={handleAddTask}
                          toggleTask={toggleTask}
                          deleteTask={(id: string) => deleteTaskMutation.mutate(id)}
                          updateTask={(id: string, data: any) => updateTaskMutation.mutate({ id, data })}
                          authUserId={authUser?.id || ''}
                          activeTab={activeTab}
                          setActiveTab={setActiveTab}
                          renderFinanceTab={() => <ProjectFinanceTab projectId={selectedProject.id} projectTitle={selectedProject.title} />}
                          renderEmailsTab={() => <ProjectEmailsTab projectId={selectedProject.id} projectTitle={selectedProject.title} />}
                          renderDocumentsTab={() => <ProjectDocumentsTab projectId={selectedProject.id} projectTitle={selectedProject.title} />}
                        />
                      )}
                      {panelLayout === 'linear' && (
                        <LinearLayout
                          project={selectedProject}
                          tasks={getProjectTasks(selectedProject)}
                          isEditing={isEditing}
                          editForm={editForm}
                          setEditForm={setEditForm}
                          setIsEditing={setIsEditing}
                          saveEdit={saveEdit}
                          startEditing={startEditing}
                          handleShare={handleShare}
                          deleteProject={() => deleteProjectMutation.mutate(selectedProject.id)}
                          closePanel={() => setSelectedProject(null)}
                          getProgress={() => getProjectProgress(selectedProject)}
                          newTask={newTask}
                          setNewTask={setNewTask}
                          handleAddTask={handleAddTask}
                          toggleTask={toggleTask}
                          deleteTask={(id: string) => deleteTaskMutation.mutate(id)}
                          updateTask={(id: string, data: any) => updateTaskMutation.mutate({ id, data })}
                          authUserId={authUser?.id || ''}
                          activeTab={activeTab}
                          setActiveTab={setActiveTab}
                          renderFinanceTab={() => <ProjectFinanceTab projectId={selectedProject.id} projectTitle={selectedProject.title} />}
                          renderEmailsTab={() => <ProjectEmailsTab projectId={selectedProject.id} projectTitle={selectedProject.title} />}
                          renderDocumentsTab={() => <ProjectDocumentsTab projectId={selectedProject.id} projectTitle={selectedProject.title} />}
                        />
                      )}
                      {panelLayout === 'finanza' && (
                        <FinanzaLayout
                          project={selectedProject}
                          tasks={getProjectTasks(selectedProject)}
                          isEditing={isEditing}
                          editForm={editForm}
                          setEditForm={setEditForm}
                          setIsEditing={setIsEditing}
                          saveEdit={saveEdit}
                          startEditing={startEditing}
                          handleShare={handleShare}
                          deleteProject={() => deleteProjectMutation.mutate(selectedProject.id)}
                          closePanel={() => setSelectedProject(null)}
                          getProgress={() => getProjectProgress(selectedProject)}
                          newTask={newTask}
                          setNewTask={setNewTask}
                          handleAddTask={handleAddTask}
                          toggleTask={toggleTask}
                          deleteTask={(id: string) => deleteTaskMutation.mutate(id)}
                          updateTask={(id: string, data: any) => updateTaskMutation.mutate({ id, data })}
                          authUserId={authUser?.id || ''}
                          activeTab={activeTab}
                          setActiveTab={setActiveTab}
                          renderFinanceTab={() => <ProjectFinanceTab projectId={selectedProject.id} projectTitle={selectedProject.title} />}
                          renderEmailsTab={() => <ProjectEmailsTab projectId={selectedProject.id} projectTitle={selectedProject.title} />}
                          renderDocumentsTab={() => <ProjectDocumentsTab projectId={selectedProject.id} projectTitle={selectedProject.title} />}
                        />
                      )}
                      <div className="border-t p-2 bg-muted/30">
                        <div className="flex items-center justify-center gap-1">
                          <span className="text-[10px] text-muted-foreground mr-2">Layout:</span>
                          <button onClick={() => savePanelLayout('default')} className={`px-2 py-1 rounded text-[10px] ${panelLayout === 'default' ? 'bg-violet-100 text-violet-700' : 'hover:bg-muted text-muted-foreground'}`}>Default</button>
                          <button onClick={() => savePanelLayout('notion')} className={`px-2 py-1 rounded text-[10px] ${panelLayout === 'notion' ? 'bg-violet-100 text-violet-700' : 'hover:bg-muted text-muted-foreground'}`}>Notion</button>
                          <button onClick={() => savePanelLayout('linear')} className={`px-2 py-1 rounded text-[10px] ${panelLayout === 'linear' ? 'bg-violet-100 text-violet-700' : 'hover:bg-muted text-muted-foreground'}`}>Linear</button>
                          <button onClick={() => savePanelLayout('finanza')} className={`px-2 py-1 rounded text-[10px] ${panelLayout === 'finanza' ? 'bg-violet-100 text-violet-700' : 'hover:bg-muted text-muted-foreground'}`}>Finanza</button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                      <Briefcase className="h-16 w-16 text-muted-foreground/30 mb-4" />
                      <h3 className="font-semibold text-lg text-muted-foreground mb-2">Dettagli Progetto</h3>
                      <p className="text-sm text-muted-foreground/70 max-w-[250px]">
                        Seleziona un progetto dalla board per visualizzare i dettagli qui
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="timeline" className="flex-1 overflow-hidden mt-0 px-8 py-4">
              <div className="flex items-center gap-2 mb-4">
                <Button variant="outline" size="sm" className="h-8" onClick={() => setCurrentMonth(addMonths(currentMonth, -1))}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium px-3 min-w-[140px] text-center">
                  {format(currentMonth, "MMMM yyyy", { locale: it })}
                </span>
                <Button variant="outline" size="sm" className="h-8" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <ScrollArea className="flex-1">
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
                                onClick={() => {
                                  setSelectedProject(project);
                                  setActiveTab("tasks");
                                }}
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
                      <span>{status === "Not Started" ? "Da Iniziare" : status === "In Progress" ? "In Corso" : "Completato"}</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="documenti" className="flex-1 overflow-hidden mt-0">
              <DocumentsContent />
            </TabsContent>

            <TabsContent value="archivio" className="flex-1 overflow-hidden mt-0">
              <ArchivioContent />
            </TabsContent>

            <TabsContent value="todo" className="flex-1 overflow-hidden mt-0">
              <ToDoListContent />
            </TabsContent>

            <TabsContent value="condivisi" className="flex-1 overflow-hidden mt-0 px-8 py-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Share2 className="h-5 w-5 text-violet-500" />
                    Progetti Condivisi Attivi
                  </CardTitle>
                  <CardDescription>
                    Visualizza tutti i progetti attualmente condivisi tramite link pubblico
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {sharedProjectsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : sharedProjects.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Share2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p className="text-lg font-medium">Nessun progetto condiviso</p>
                      <p className="text-sm">
                        Condividi un progetto dalla vista Progetti per vederlo qui
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {sharedProjects.map((project: any) => (
                        <Card key={project.id} className="hover:bg-muted/50 transition-colors">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-semibold text-base truncate">{project.title}</h3>
                                  <Badge variant={
                                    project.status === 'Done' ? 'secondary' :
                                      project.status === 'In Progress' ? 'default' :
                                        'outline'
                                  } className="shrink-0">
                                    {project.status === 'Done' ? 'Completato' :
                                      project.status === 'In Progress' ? 'In Corso' :
                                        'Da Iniziare'}
                                  </Badge>
                                </div>
                                {project.description && (
                                  <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                                    {project.description}
                                  </p>
                                )}
                                <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <ListTodo className="h-3.5 w-3.5" />
                                    {project.completedTasksCount}/{project.tasksCount} attività
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <FileText className="h-3.5 w-3.5" />
                                    {project.documentsCount} documenti
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Mail className="h-3.5 w-3.5" />
                                    {project.emailsCount} email
                                  </span>
                                  <span className="flex items-center gap-1.5">
                                    <Clock className="h-3.5 w-3.5" />
                                    {project.timeRemaining > 24 ? (
                                      <span>{Math.floor(project.timeRemaining / 24)} giorni rimasti</span>
                                    ) : project.timeRemaining > 0 ? (
                                      <span className="text-amber-600">{project.timeRemaining}h rimaste</span>
                                    ) : (
                                      <span className="text-red-500">Scaduto</span>
                                    )}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={async () => {
                                    const url = `${window.location.origin}${project.shareUrl}`;
                                    try {
                                      if (navigator.clipboard && navigator.clipboard.writeText) {
                                        await navigator.clipboard.writeText(url);
                                      } else {
                                        const textarea = document.createElement('textarea');
                                        textarea.value = url;
                                        document.body.appendChild(textarea);
                                        textarea.select();
                                        document.execCommand('copy');
                                        document.body.removeChild(textarea);
                                      }
                                      toast({
                                        title: "Link copiato",
                                        description: "Il link è stato copiato negli appunti.",
                                      });
                                    } catch {
                                      toast({
                                        title: "Errore",
                                        description: "Impossibile copiare il link.",
                                        variant: "destructive",
                                      });
                                    }
                                  }}
                                >
                                  <Copy className="h-4 w-4 mr-1" />
                                  Copia Link
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => window.open(project.shareUrl, '_blank')}
                                >
                                  <ExternalLink className="h-4 w-4 mr-1" />
                                  Apri
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => {
                                    removeShareLinkMutation.mutate(project.id);
                                    queryClient.invalidateQueries({ queryKey: ["shared-projects"] });
                                  }}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            <div className="mt-3">
                              <Progress
                                value={project.tasksCount > 0 ? (project.completedTasksCount / project.tasksCount) * 100 : 0}
                                className="h-1.5"
                              />
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Dialog Condivisione */}
            <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Share2 className="h-5 w-5 text-blue-500" />
                    Condividi Progetto
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-6">
                  {/* Sezione Condivisione con Utenti */}
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

                    {/* Lista condivisioni esistenti */}
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

                  {/* Divider */}
                  <div className="border-t" />

                  {/* Sezione Link Pubblico */}
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
                        className="flex-1 text-sm"
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
          </Tabs>
        </div>
      </div>
    </AppLayout>
  );
}
