import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Users,
  Target,
  Phone,
  Mail,
  Calendar,
  TrendingUp,
  DollarSign,
  Search,
  MoreHorizontal,
  Edit2,
  Trash2,
  Eye,
  UserPlus,
  Building2,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Briefcase,
  MessageSquare,
  Activity,
  PieChart,
  BarChart3,
  Thermometer,
  Euro,
  AlertTriangle,
  FileText,
  Globe,
  MapPin,
  Star,
  Crown,
  Loader2,
  ChevronRight,
  User,
  LinkIcon,
  ExternalLink,
  Copy,
  Check,
  Maximize2,
  Minimize2
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { CopyLinkButton } from "@/components/CopyLinkButton";

const FONTI_LEAD = [
  { value: "web", label: "Sito Web" },
  { value: "fiera", label: "Fiera" },
  { value: "referral", label: "Referral" },
  { value: "cold_call", label: "Chiamata a freddo" },
  { value: "social", label: "Social Media" },
  { value: "email", label: "Email Marketing" },
  { value: "altro", label: "Altro" },
];

const STATI_LEAD = [
  { value: "nuovo", label: "Nuovo", color: "bg-blue-500" },
  { value: "contattato", label: "Contattato", color: "bg-yellow-500" },
  { value: "qualificato", label: "Qualificato", color: "bg-green-500" },
  { value: "non_qualificato", label: "Non Qualificato", color: "bg-gray-500" },
  { value: "convertito", label: "Convertito", color: "bg-purple-500" },
  { value: "perso", label: "Perso", color: "bg-red-500" },
];

const STATI_FATTURA = [
  { value: "bozza", label: "Bozza", color: "bg-gray-500" },
  { value: "inviata", label: "Inviata", color: "bg-blue-500" },
  { value: "pagata", label: "Pagata", color: "bg-green-500" },
  { value: "parziale", label: "Parziale", color: "bg-yellow-500" },
  { value: "scaduta", label: "Scaduta", color: "bg-red-500" },
  { value: "annullata", label: "Annullata", color: "bg-gray-400" },
];

const STATI_PREVENTIVO = [
  { value: "bozza", label: "Bozza", color: "bg-gray-500" },
  { value: "inviato", label: "Inviato", color: "bg-blue-500" },
  { value: "accettato", label: "Accettato", color: "bg-green-500" },
  { value: "rifiutato", label: "Rifiutato", color: "bg-red-500" },
  { value: "scaduto", label: "Scaduto", color: "bg-amber-500" },
  { value: "convertito", label: "Convertito", color: "bg-purple-500" },
];

const VALUTAZIONI_LEAD = [
  { value: "freddo", label: "Freddo", icon: Thermometer, color: "text-blue-500" },
  { value: "tiepido", label: "Tiepido", icon: Thermometer, color: "text-yellow-500" },
  { value: "caldo", label: "Caldo", icon: Thermometer, color: "text-red-500" },
];

const FASI_OPPORTUNITA = [
  { value: "prospetto", label: "Prospetto", prob: 10, color: "bg-gray-400" },
  { value: "qualificazione", label: "Qualificazione", prob: 25, color: "bg-blue-400" },
  { value: "proposta", label: "Proposta", prob: 50, color: "bg-yellow-400" },
  { value: "negoziazione", label: "Negoziazione", prob: 75, color: "bg-orange-400" },
  { value: "chiuso_vinto", label: "Chiuso Vinto", prob: 100, color: "bg-green-500" },
  { value: "chiuso_perso", label: "Chiuso Perso", prob: 0, color: "bg-red-500" },
];

const TIPI_ATTIVITA = [
  { value: "chiamata", label: "Chiamata", icon: Phone },
  { value: "email", label: "Email", icon: Mail },
  { value: "riunione", label: "Riunione", icon: Users },
  { value: "task", label: "Task", icon: CheckCircle2 },
  { value: "nota", label: "Nota", icon: MessageSquare },
  { value: "altro", label: "Altro", icon: Activity },
];

const PRIORITA = [
  { value: "bassa", label: "Bassa", color: "bg-gray-400" },
  { value: "normale", label: "Normale", color: "bg-blue-400" },
  { value: "alta", label: "Alta", color: "bg-orange-400" },
];

function parseItalianNumber(value: string | number | undefined): number {
  if (value === undefined || value === null || value === '') return 0;
  if (typeof value === 'number') return value;
  const str = String(value).trim();
  if (str.includes(',')) {
    const cleaned = str.replace(/\./g, '').replace(',', '.');
    return parseFloat(cleaned) || 0;
  }
  return parseFloat(str) || 0;
}

function formatCurrency(value: string | number | undefined): string {
  const num = parseItalianNumber(value);
  const parts = num.toFixed(2).split('.');
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const decimalPart = parts[1];
  return `€ ${integerPart},${decimalPart}`;
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  } catch {
    return dateStr;
  }
}

const CATEGORIE_CLIENTE = [
  { value: "vip", label: "VIP", color: "bg-yellow-500" },
  { value: "standard", label: "Standard", color: "bg-blue-500" },
  { value: "prospect", label: "Prospect", color: "bg-green-500" },
  { value: "inattivo", label: "Inattivo", color: "bg-gray-500" },
];

const AFFIDABILITA = [
  { value: "ottima", label: "Ottima", color: "text-green-600" },
  { value: "buona", label: "Buona", color: "text-blue-600" },
  { value: "media", label: "Media", color: "text-yellow-600" },
  { value: "scarsa", label: "Scarsa", color: "text-orange-600" },
  { value: "critica", label: "Critica", color: "text-red-600" },
];

type Cliente = {
  id: string;
  ragioneSociale: string;
  partitaIva?: string;
  codiceFiscale?: string;
  indirizzo?: string;
  citta?: string;
  cap?: string;
  provincia?: string;
  telefono?: string;
  cellulare?: string;
  email?: string;
  pec?: string;
  website?: string;
  categoriaCliente?: string;
  settoreMerceologico?: string;
  fatturatoTotale?: string;
  affidabilita?: string;
  origineCliente?: string;
  note?: string;
};

type Referente = {
  id: string;
  clienteId: string;
  nome: string;
  cognome?: string;
  ruolo?: string;
  email?: string;
  cellulare?: string;
  principale?: boolean;
};

function ClientiTab() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategoria, setFilterCategoria] = useState<string>("tutti");
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Partial<Cliente>>({});
  const [referenteDialogOpen, setReferenteDialogOpen] = useState(false);
  const [editingReferente, setEditingReferente] = useState<Partial<Referente>>({});
  const [portalDialogOpen, setPortalDialogOpen] = useState(false);
  const [portalLink, setPortalLink] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  const generatePortalMutation = useMutation({
    mutationFn: async (clienteId: string) => {
      const res = await fetch("/api/customer-portal/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clienteId, nome: "Portale Documenti" }),
      });
      if (!res.ok) throw new Error("Errore nella generazione del link");
      return res.json();
    },
    onSuccess: (data) => {
      const link = `${window.location.origin}/portal/${data.token}`;
      setPortalLink(link);
      toast({ title: "Link generato", description: "Il link del portale cliente è pronto" });
    },
    onError: () => {
      toast({ title: "Errore", description: "Impossibile generare il link", variant: "destructive" });
    },
  });

  const openPortalDialog = (clienteId: string) => {
    setPortalLink(null);
    setLinkCopied(false);
    setPortalDialogOpen(true);
    generatePortalMutation.mutate(clienteId);
  };

  const copyPortalLink = () => {
    if (portalLink) {
      navigator.clipboard.writeText(portalLink);
      setLinkCopied(true);
      toast({ title: "Link copiato", description: "Il link è stato copiato negli appunti" });
      setTimeout(() => setLinkCopied(false), 2000);
    }
  };

  const { data: clienti = [], isLoading } = useQuery<Cliente[]>({
    queryKey: ["/api/anagrafica/clienti"],
  });

  const { data: analytics } = useQuery({
    queryKey: ["/api/clienti/analytics"],
  });

  const { data: clienteDashboard, isLoading: loadingDashboard } = useQuery({
    queryKey: [`/api/anagrafica/clienti/${selectedCliente?.id}/dashboard`],
    enabled: !!selectedCliente?.id,
  });

  const createMutation = useMutation({
    mutationFn: async (data: Partial<Cliente>) => {
      const res = await fetch("/api/anagrafica/clienti", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Errore creazione");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/anagrafica/clienti"] });
      queryClient.invalidateQueries({ queryKey: ["anagrafica-clienti"] });
      queryClient.invalidateQueries({ queryKey: ["/api/clienti/analytics"] });
      setEditDialogOpen(false);
      setEditingCliente({});
      toast({ title: "Cliente creato", description: "Il cliente è stato aggiunto all'anagrafica" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<Cliente> & { id: string }) => {
      const res = await fetch(`/api/anagrafica/clienti/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Errore aggiornamento");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/anagrafica/clienti"] });
      queryClient.invalidateQueries({ queryKey: ["anagrafica-clienti"] });
      queryClient.invalidateQueries({ queryKey: ["/api/clienti/analytics"] });
      setEditDialogOpen(false);
      setEditingCliente({});
      toast({ title: "Salvato", description: "Le modifiche sono state salvate" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/anagrafica/clienti/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Errore eliminazione");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/anagrafica/clienti"] });
      queryClient.invalidateQueries({ queryKey: ["anagrafica-clienti"] });
      queryClient.invalidateQueries({ queryKey: ["/api/clienti/analytics"] });
      setSelectedCliente(null);
      toast({ title: "Eliminato", description: "Il cliente è stato eliminato" });
    },
  });

  const createReferenteMutation = useMutation({
    mutationFn: async (data: Partial<Referente>) => {
      const res = await fetch(`/api/clienti/${selectedCliente?.id}/referenti`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Errore creazione referente");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/anagrafica/clienti/${selectedCliente?.id}/dashboard`] });
      setReferenteDialogOpen(false);
      setEditingReferente({});
    },
  });

  const filteredClienti = clienti.filter(c => {
    const matchesSearch = !searchQuery ||
      c.ragioneSociale.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.partitaIva?.includes(searchQuery);
    const matchesCategoria = filterCategoria === "tutti" || c.categoriaCliente === filterCategoria;
    return matchesSearch && matchesCategoria;
  });

  const getCategoriaInfo = (cat?: string) => CATEGORIE_CLIENTE.find(c => c.value === cat) || CATEGORIE_CLIENTE[1];

  return (
    <>
      <div className="flex h-[calc(100vh-220px)] border rounded-lg overflow-hidden">
        <div className="w-72 border-r flex flex-col bg-muted/30">
          <div className="p-3 border-b">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-sm">Clienti</span>
              <Button size="sm" variant="outline" onClick={() => { setEditingCliente({}); setEditDialogOpen(true); }}>
                <Plus className="h-3 w-3 mr-1" /> Nuovo
              </Button>
            </div>
            <Select value={filterCategoria} onValueChange={setFilterCategoria}>
              <SelectTrigger className="h-7 text-xs">
                <SelectValue placeholder="Filtra categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tutti">Tutte le categorie</SelectItem>
                {CATEGORIE_CLIENTE.map(c => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <ScrollArea className="flex-1">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : filteredClienti.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Building2 className="h-6 w-6 mx-auto mb-2 opacity-50" />
                <p className="text-xs">Nessun cliente trovato</p>
              </div>
            ) : (
              <div className="divide-y">
                {filteredClienti.map(cliente => {
                  const catInfo = getCategoriaInfo(cliente.categoriaCliente);
                  return (
                    <div
                      key={cliente.id}
                      onClick={() => setSelectedCliente(cliente)}
                      className={`p-2.5 cursor-pointer hover:bg-muted/50 transition-colors ${selectedCliente?.id === cliente.id ? "bg-blue-50 dark:bg-blue-950/30" : ""
                        }`}
                    >
                      <div className="flex items-start gap-2">
                        <div className={`w-2 h-2 rounded-full mt-1.5 ${catInfo.color}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            {cliente.categoriaCliente === "vip" && <Crown className="h-3 w-3 text-yellow-500" />}
                            <span className="font-medium text-xs truncate">{cliente.ragioneSociale}</span>
                          </div>
                          {cliente.citta && (
                            <p className="text-[10px] text-muted-foreground truncate">{cliente.citta}</p>
                          )}
                        </div>
                        <ChevronRight className="h-3 w-3 text-muted-foreground" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>

          <div className="p-2 border-t bg-muted/50 text-center text-xs">
            <span className="text-muted-foreground">{filteredClienti.length} clienti</span>
          </div>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          {selectedCliente ? (
            <>
              <div className="p-3 border-b bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                      {selectedCliente.ragioneSociale[0]}
                    </div>
                    <div>
                      <div className="flex items-center gap-1">
                        <h3 className="font-semibold text-sm">{selectedCliente.ragioneSociale}</h3>
                        {selectedCliente.categoriaCliente === "vip" && (
                          <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 text-[10px] px-1 py-0">
                            <Crown className="h-2 w-2 mr-0.5" /> VIP
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                        {selectedCliente.citta && <span><MapPin className="h-2.5 w-2.5 inline" /> {selectedCliente.citta}</span>}
                        {selectedCliente.telefono && <span><Phone className="h-2.5 w-2.5 inline" /> {selectedCliente.telefono}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => { setEditingCliente(selectedCliente); setEditDialogOpen(true); }}>
                      <Edit2 className="h-3 w-3 mr-1" /> Modifica
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-3 w-3" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openPortalDialog(selectedCliente.id)} className="text-xs">
                          <LinkIcon className="h-3 w-3 mr-2" /> Portale Cliente
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => deleteMutation.mutate(selectedCliente.id)} className="text-red-600 text-xs">
                          <Trash2 className="h-3 w-3 mr-2" /> Elimina
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>

              <ScrollArea className="flex-1 p-3">
                {loadingDashboard ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <Tabs defaultValue="panoramica">
                    <TabsList className="mb-3 h-7">
                      <TabsTrigger value="panoramica" className="text-xs px-2 py-1">Panoramica</TabsTrigger>
                      <TabsTrigger value="fatture" className="text-xs px-2 py-1">Fatture</TabsTrigger>
                      <TabsTrigger value="preventivi" className="text-xs px-2 py-1">Preventivi</TabsTrigger>
                      <TabsTrigger value="referenti" className="text-xs px-2 py-1">Referenti</TabsTrigger>
                    </TabsList>

                    <TabsContent value="panoramica">
                      <div className="grid grid-cols-4 gap-2 mb-4">
                        <Card className="p-2">
                          <p className="text-[10px] text-muted-foreground">Fatturato Totale</p>
                          <p className="text-lg font-bold text-green-600">{formatCurrency(clienteDashboard?.statistiche?.fatturatoTotale)}</p>
                        </Card>
                        <Card className="p-2">
                          <p className="text-[10px] text-muted-foreground">Anno Corrente</p>
                          <p className="text-lg font-bold text-blue-600">{formatCurrency(clienteDashboard?.statistiche?.fatturatoAnnoCorrente)}</p>
                        </Card>
                        <Card className="p-2">
                          <p className="text-[10px] text-muted-foreground">Credito Aperto</p>
                          <p className="text-lg font-bold text-orange-600">{formatCurrency(clienteDashboard?.statistiche?.creditoAperto)}</p>
                        </Card>
                        <Card className="p-2">
                          <p className="text-[10px] text-muted-foreground">Fatture</p>
                          <p className="text-lg font-bold">{clienteDashboard?.statistiche?.numeroFatture || 0}</p>
                        </Card>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <Card className="p-3">
                          <h4 className="text-xs font-semibold mb-2">Informazioni</h4>
                          <div className="space-y-1 text-xs">
                            {selectedCliente.partitaIva && (
                              <div className="flex justify-between"><span className="text-muted-foreground">P.IVA</span><span className="font-mono">{selectedCliente.partitaIva}</span></div>
                            )}
                            {selectedCliente.email && (
                              <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span>{selectedCliente.email}</span></div>
                            )}
                            {selectedCliente.pec && (
                              <div className="flex justify-between"><span className="text-muted-foreground">PEC</span><span>{selectedCliente.pec}</span></div>
                            )}
                            {selectedCliente.website && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Sito</span>
                                <a href={selectedCliente.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-0.5">
                                  <Globe className="h-3 w-3" /> Visita
                                </a>
                              </div>
                            )}
                          </div>
                        </Card>

                        <Card className="p-3">
                          <h4 className="text-xs font-semibold mb-2">Statistiche</h4>
                          <div className="space-y-1 text-xs">
                            <div className="flex justify-between"><span className="text-muted-foreground">Progetti</span><span>{clienteDashboard?.statistiche?.numeroProgetti || 0}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Preventivi</span><span>{clienteDashboard?.statistiche?.numeroPreventivi || 0}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Opportunità</span><span>{clienteDashboard?.statistiche?.opportunitaAperte || 0}</span></div>
                          </div>
                        </Card>
                      </div>

                      {selectedCliente.note && (
                        <Card className="p-3 mt-3">
                          <h4 className="text-xs font-semibold mb-1">Note</h4>
                          <p className="text-xs text-muted-foreground">{selectedCliente.note}</p>
                        </Card>
                      )}
                    </TabsContent>

                    <TabsContent value="fatture">
                      {clienteDashboard?.fatture?.length > 0 ? (
                        <div className="border rounded-lg overflow-hidden">
                          <table className="w-full text-xs">
                            <thead className="bg-muted/50">
                              <tr>
                                <th className="text-center px-1.5 py-0.5 text-[10px] font-medium w-6">#</th>
                                <th className="text-left px-1.5 py-0.5 text-[10px] font-medium">Numero</th>
                                <th className="text-left px-1.5 py-0.5 text-[10px] font-medium">Data</th>
                                <th className="text-left px-1.5 py-0.5 text-[10px] font-medium">Scadenza</th>
                                <th className="text-left px-1.5 py-0.5 text-[10px] font-medium">Imponibile</th>
                                <th className="text-left px-1.5 py-0.5 text-[10px] font-medium">Totale</th>
                                <th className="text-left px-1.5 py-0.5 text-[10px] font-medium">Stato</th>
                              </tr>
                            </thead>
                            <tbody>
                              {clienteDashboard.fatture.map((f: any, index: number) => {
                                const stato = STATI_FATTURA.find(s => s.value === f.stato);
                                const scadenza = f.dataScadenza ? new Date(f.dataScadenza) : null;
                                const oggi = new Date();
                                const isPagata = f.stato === 'pagata';
                                const isScaduta = scadenza && scadenza < oggi && !isPagata;
                                const inSettimana = scadenza && !isPagata && scadenza >= oggi && scadenza <= new Date(oggi.getTime() + 7 * 24 * 60 * 60 * 1000);
                                const inMese = scadenza && !isPagata && scadenza >= oggi && scadenza <= new Date(oggi.getTime() + 30 * 24 * 60 * 60 * 1000) && !inSettimana;
                                const rowBg = isPagata ? 'bg-green-50/50 dark:bg-green-950/20' :
                                  isScaduta ? 'bg-red-50/60 dark:bg-red-950/25' :
                                    inSettimana ? 'bg-orange-50/50 dark:bg-orange-950/20' :
                                      inMese ? 'bg-yellow-50/50 dark:bg-yellow-950/15' : '';
                                const scadenzaClass = isScaduta ? 'text-red-600 font-semibold' :
                                  inSettimana ? 'text-orange-600 font-medium' :
                                    inMese ? 'text-yellow-600' : 'text-muted-foreground';
                                return (
                                  <tr key={f.id} className={`border-t ${rowBg} hover:bg-muted/50`}>
                                    <td className="px-1.5 py-0.5 text-center text-muted-foreground text-[10px]">{index + 1}</td>
                                    <td className="px-1.5 py-0.5 font-medium text-[10px]">{f.numero || "Bozza"}</td>
                                    <td className="px-1.5 py-0.5 text-muted-foreground text-[10px]">{formatDate(f.dataEmissione)}</td>
                                    <td className={`px-1.5 py-0.5 text-[10px] ${scadenzaClass}`}>{formatDate(f.dataScadenza)}</td>
                                    <td className="px-1.5 py-0.5 text-muted-foreground text-[10px]">{formatCurrency(f.imponibile || 0)}</td>
                                    <td className="px-1.5 py-0.5 font-semibold text-[10px]">{formatCurrency(f.totale)}</td>
                                    <td className="px-1.5 py-0.5">
                                      <Badge className={`${stato?.color} text-[9px] px-1 py-0`}>{stato?.label || f.stato}</Badge>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                            <tfoot className="bg-muted/30 border-t-2">
                              <tr>
                                <td colSpan={4} className="px-1.5 py-0.5 text-right text-[10px] font-semibold">Totali:</td>
                                <td className="px-1.5 py-0.5 text-[10px] font-bold">
                                  {formatCurrency(clienteDashboard.fatture.reduce((sum: number, f: any) => sum + parseItalianNumber(f.imponibile || 0), 0))}
                                </td>
                                <td className="px-1.5 py-0.5 text-[10px] font-bold">
                                  {formatCurrency(clienteDashboard.fatture.reduce((sum: number, f: any) => sum + parseItalianNumber(f.totale), 0))}
                                </td>
                                <td></td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      ) : (
                        <div className="text-center py-6 text-muted-foreground">
                          <FileText className="h-6 w-6 mx-auto mb-1 opacity-50" />
                          <p className="text-xs">Nessuna fattura</p>
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="preventivi">
                      {clienteDashboard?.preventivi?.length > 0 ? (
                        <div className="border rounded-lg overflow-hidden">
                          <table className="w-full text-xs">
                            <thead className="bg-muted/50">
                              <tr>
                                <th className="text-left px-1.5 py-0.5 text-[10px] font-medium">Numero</th>
                                <th className="text-left px-1.5 py-0.5 text-[10px] font-medium">Oggetto</th>
                                <th className="text-left px-1.5 py-0.5 text-[10px] font-medium">Data</th>
                                <th className="text-left px-1.5 py-0.5 text-[10px] font-medium">Validità</th>
                                <th className="text-right px-1.5 py-0.5 text-[10px] font-medium">Totale</th>
                                <th className="text-center px-1.5 py-0.5 text-[10px] font-medium">Stato</th>
                              </tr>
                            </thead>
                            <tbody>
                              {clienteDashboard.preventivi.map((p: any) => {
                                const stato = STATI_PREVENTIVO.find(s => s.value === p.stato);
                                return (
                                  <tr key={p.id} className="border-t hover:bg-muted/30">
                                    <td className="px-1.5 py-0.5 font-medium text-[10px]">{p.numero || "Bozza"}</td>
                                    <td className="px-1.5 py-0.5 text-muted-foreground truncate max-w-[120px] text-[10px]">{p.oggetto || '-'}</td>
                                    <td className="px-1.5 py-0.5 text-muted-foreground text-[10px]">{formatDate(p.dataEmissione)}</td>
                                    <td className="px-1.5 py-0.5 text-muted-foreground text-[10px]">{formatDate(p.dataValidita)}</td>
                                    <td className="px-1.5 py-0.5 text-right font-semibold text-[10px]">{formatCurrency(p.totale)}</td>
                                    <td className="px-1.5 py-0.5 text-center">
                                      <Badge className={`${stato?.color} text-[9px] px-1 py-0`}>{stato?.label || p.stato}</Badge>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                            <tfoot className="bg-muted/30 border-t-2">
                              <tr>
                                <td colSpan={4} className="px-1.5 py-0.5 text-right text-[10px] font-semibold">Totale:</td>
                                <td className="px-1.5 py-0.5 text-right text-[10px] font-bold">
                                  {formatCurrency(clienteDashboard.preventivi.reduce((sum: number, p: any) => sum + parseItalianNumber(p.totale), 0))}
                                </td>
                                <td></td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      ) : (
                        <div className="text-center py-6 text-muted-foreground">
                          <FileText className="h-6 w-6 mx-auto mb-1 opacity-50" />
                          <p className="text-xs">Nessun preventivo</p>
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="referenti">
                      <div className="flex justify-end mb-2">
                        <Button size="sm" variant="outline" className="h-6 text-xs" onClick={() => { setEditingReferente({}); setReferenteDialogOpen(true); }}>
                          <Plus className="h-3 w-3 mr-1" /> Nuovo Referente
                        </Button>
                      </div>
                      {clienteDashboard?.referenti?.length > 0 ? (
                        <div className="grid grid-cols-2 gap-2">
                          {clienteDashboard.referenti.map((ref: Referente) => (
                            <Card key={ref.id} className="p-2">
                              <div className="flex items-start gap-2">
                                <div className="h-7 w-7 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-white text-xs font-bold">
                                  {ref.nome[0]}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1">
                                    <p className="text-xs font-medium truncate">{ref.nome} {ref.cognome}</p>
                                    {ref.principale && <Star className="h-2.5 w-2.5 text-yellow-500 fill-yellow-500" />}
                                  </div>
                                  {ref.ruolo && <p className="text-[10px] text-muted-foreground">{ref.ruolo}</p>}
                                  {ref.email && <p className="text-[10px] text-blue-600 truncate">{ref.email}</p>}
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6 text-muted-foreground">
                          <User className="h-6 w-6 mx-auto mb-1 opacity-50" />
                          <p className="text-xs">Nessun referente</p>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                )}
              </ScrollArea>
            </>
          ) : (
            <div className="flex-1 flex flex-col p-4">
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-blue-600" />
                Analytics Clienti
              </h3>
              {analytics ? (
                <>
                  <div className="grid grid-cols-4 gap-2 mb-4">
                    <Card className="p-2">
                      <p className="text-[10px] text-muted-foreground">Clienti Totali</p>
                      <p className="text-xl font-bold">{analytics.totaleClienti}</p>
                    </Card>
                    <Card className="p-2">
                      <p className="text-[10px] text-muted-foreground">Attivi</p>
                      <p className="text-xl font-bold text-green-600">{analytics.clientiAttivi}</p>
                    </Card>
                    <Card className="p-2">
                      <p className="text-[10px] text-muted-foreground">VIP</p>
                      <p className="text-xl font-bold text-yellow-600">{analytics.clientiVIP}</p>
                    </Card>
                    <Card className="p-2">
                      <p className="text-[10px] text-muted-foreground">Fatturato Anno</p>
                      <p className="text-lg font-bold text-blue-600">{formatCurrency(analytics.fatturatoTotaleAnno)}</p>
                    </Card>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Card className="p-3">
                      <h4 className="text-xs font-semibold mb-2 flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" /> Top 10 Clienti
                      </h4>
                      <div className="space-y-1">
                        {analytics.topClienti?.slice(0, 10).map((c: any, idx: number) => (
                          <div key={c.id} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1">
                              <span className="text-muted-foreground w-3">{idx + 1}.</span>
                              <span className="truncate max-w-[140px]">{c.ragioneSociale}</span>
                            </div>
                            <span className="font-medium text-green-600">{formatCurrency(c.fatturato?.toString())}</span>
                          </div>
                        ))}
                      </div>
                    </Card>

                    <Card className="p-3">
                      <h4 className="text-xs font-semibold mb-2 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3 text-orange-500" /> Clienti Inattivi
                      </h4>
                      {analytics.clientiInattivi?.length > 0 ? (
                        <div className="space-y-1">
                          {analytics.clientiInattivi.slice(0, 8).map((c: any) => (
                            <div key={c.id} className="flex items-center justify-between text-xs">
                              <span className="truncate max-w-[140px]">{c.ragioneSociale}</span>
                              <span className="text-[10px] text-muted-foreground">{c.email}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">Nessun cliente inattivo</p>
                      )}
                    </Card>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCliente.id ? "Modifica Cliente" : "Nuovo Cliente"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="col-span-2">
              <Label className="text-xs">Ragione Sociale *</Label>
              <Input value={editingCliente.ragioneSociale || ""} onChange={(e) => setEditingCliente({ ...editingCliente, ragioneSociale: e.target.value })} className="h-8" />
            </div>
            <div>
              <Label className="text-xs">Partita IVA</Label>
              <Input value={editingCliente.partitaIva || ""} onChange={(e) => setEditingCliente({ ...editingCliente, partitaIva: e.target.value })} className="h-8" />
            </div>
            <div>
              <Label className="text-xs">Codice Fiscale</Label>
              <Input value={editingCliente.codiceFiscale || ""} onChange={(e) => setEditingCliente({ ...editingCliente, codiceFiscale: e.target.value })} className="h-8" />
            </div>
            <div>
              <Label className="text-xs">Email</Label>
              <Input type="email" value={editingCliente.email || ""} onChange={(e) => setEditingCliente({ ...editingCliente, email: e.target.value })} className="h-8" />
            </div>
            <div>
              <Label className="text-xs">PEC</Label>
              <Input type="email" value={editingCliente.pec || ""} onChange={(e) => setEditingCliente({ ...editingCliente, pec: e.target.value })} className="h-8" />
            </div>
            <div>
              <Label className="text-xs">Telefono</Label>
              <Input value={editingCliente.telefono || ""} onChange={(e) => setEditingCliente({ ...editingCliente, telefono: e.target.value })} className="h-8" />
            </div>
            <div>
              <Label className="text-xs">Cellulare</Label>
              <Input value={editingCliente.cellulare || ""} onChange={(e) => setEditingCliente({ ...editingCliente, cellulare: e.target.value })} className="h-8" />
            </div>
            <div className="col-span-2">
              <Label className="text-xs">Indirizzo</Label>
              <Input value={editingCliente.indirizzo || ""} onChange={(e) => setEditingCliente({ ...editingCliente, indirizzo: e.target.value })} className="h-8" />
            </div>
            <div>
              <Label className="text-xs">Città</Label>
              <Input value={editingCliente.citta || ""} onChange={(e) => setEditingCliente({ ...editingCliente, citta: e.target.value })} className="h-8" />
            </div>
            <div>
              <Label className="text-xs">CAP</Label>
              <Input value={editingCliente.cap || ""} onChange={(e) => setEditingCliente({ ...editingCliente, cap: e.target.value })} className="h-8" />
            </div>
            <div>
              <Label className="text-xs">Provincia</Label>
              <Input value={editingCliente.provincia || ""} onChange={(e) => setEditingCliente({ ...editingCliente, provincia: e.target.value })} className="h-8" />
            </div>
            <div className="col-span-2 flex items-center gap-2 py-1">
              <input
                type="checkbox"
                id="stessoIndirizzoSpedizione"
                checked={(editingCliente as any).stessoIndirizzoSpedizione !== false}
                onChange={(e) => setEditingCliente({ ...editingCliente, stessoIndirizzoSpedizione: e.target.checked } as any)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="stessoIndirizzoSpedizione" className="text-xs cursor-pointer">
                Usa questo indirizzo anche per le spedizioni
              </Label>
            </div>
            <div>
              <Label className="text-xs">Website</Label>
              <Input value={editingCliente.website || ""} onChange={(e) => setEditingCliente({ ...editingCliente, website: e.target.value })} className="h-8" />
            </div>
            <div>
              <Label className="text-xs">Categoria Cliente</Label>
              <Select value={editingCliente.categoriaCliente || "standard"} onValueChange={(v) => setEditingCliente({ ...editingCliente, categoriaCliente: v })}>
                <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIE_CLIENTE.map(c => (<SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Affidabilità</Label>
              <Select value={editingCliente.affidabilita || "buona"} onValueChange={(v) => setEditingCliente({ ...editingCliente, affidabilita: v })}>
                <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {AFFIDABILITA.map(a => (<SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Settore</Label>
              <Input value={editingCliente.settoreMerceologico || ""} onChange={(e) => setEditingCliente({ ...editingCliente, settoreMerceologico: e.target.value })} className="h-8" />
            </div>
            <div>
              <Label className="text-xs">Origine</Label>
              <Select value={editingCliente.origineCliente || ""} onValueChange={(v) => setEditingCliente({ ...editingCliente, origineCliente: v })}>
                <SelectTrigger className="h-8"><SelectValue placeholder="Seleziona" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="web">Web</SelectItem>
                  <SelectItem value="fiera">Fiera</SelectItem>
                  <SelectItem value="passaparola">Passaparola</SelectItem>
                  <SelectItem value="social">Social</SelectItem>
                  <SelectItem value="altro">Altro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Codice SDI</Label>
              <Input value={(editingCliente as any).sdi || ""} onChange={(e) => setEditingCliente({ ...editingCliente, sdi: e.target.value.toUpperCase() } as any)} placeholder="0000000" className="h-8" />
            </div>
            <div>
              <Label className="text-xs">Referente</Label>
              <Input value={(editingCliente as any).referente || ""} onChange={(e) => setEditingCliente({ ...editingCliente, referente: e.target.value } as any)} className="h-8" />
            </div>
            <div>
              <Label className="text-xs">Condizioni Pagamento</Label>
              <Input value={(editingCliente as any).condizioniPagamento || ""} onChange={(e) => setEditingCliente({ ...editingCliente, condizioniPagamento: e.target.value } as any)} placeholder="30gg, 60gg, RiBa..." className="h-8" />
            </div>
            <div>
              <Label className="text-xs">Stato</Label>
              <Select value={(editingCliente as any).stato || "attivo"} onValueChange={(v) => setEditingCliente({ ...editingCliente, stato: v } as any)}>
                <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="attivo">Attivo</SelectItem>
                  <SelectItem value="sospeso">Sospeso</SelectItem>
                  <SelectItem value="inattivo">Inattivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Tags</Label>
              <Input value={(editingCliente as any).tags || ""} onChange={(e) => setEditingCliente({ ...editingCliente, tags: e.target.value } as any)} placeholder="vip, puntuale, estero" className="h-8" />
            </div>
            <div className="col-span-2">
              <Label className="text-xs">Note</Label>
              <Textarea value={editingCliente.note || ""} onChange={(e) => setEditingCliente({ ...editingCliente, note: e.target.value })} rows={2} />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-3">
            <Button variant="outline" size="sm" onClick={() => setEditDialogOpen(false)}>Annulla</Button>
            <Button
              size="sm"
              onClick={() => {
                if (editingCliente.id) {
                  updateMutation.mutate(editingCliente as Cliente & { id: string });
                } else {
                  createMutation.mutate(editingCliente);
                }
              }}
              disabled={!editingCliente.ragioneSociale || createMutation.isPending || updateMutation.isPending}
            >
              {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
              {editingCliente.id ? "Salva" : "Crea"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={referenteDialogOpen} onOpenChange={setReferenteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuovo Referente</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Nome *</Label>
                <Input value={editingReferente.nome || ""} onChange={(e) => setEditingReferente({ ...editingReferente, nome: e.target.value })} className="h-8" />
              </div>
              <div>
                <Label className="text-xs">Cognome</Label>
                <Input value={editingReferente.cognome || ""} onChange={(e) => setEditingReferente({ ...editingReferente, cognome: e.target.value })} className="h-8" />
              </div>
            </div>
            <div>
              <Label className="text-xs">Ruolo</Label>
              <Input value={editingReferente.ruolo || ""} onChange={(e) => setEditingReferente({ ...editingReferente, ruolo: e.target.value })} className="h-8" />
            </div>
            <div>
              <Label className="text-xs">Email</Label>
              <Input type="email" value={editingReferente.email || ""} onChange={(e) => setEditingReferente({ ...editingReferente, email: e.target.value })} className="h-8" />
            </div>
            <div>
              <Label className="text-xs">Cellulare</Label>
              <Input value={editingReferente.cellulare || ""} onChange={(e) => setEditingReferente({ ...editingReferente, cellulare: e.target.value })} className="h-8" />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-3">
            <Button variant="outline" size="sm" onClick={() => setReferenteDialogOpen(false)}>Annulla</Button>
            <Button
              size="sm"
              onClick={() => createReferenteMutation.mutate(editingReferente)}
              disabled={!editingReferente.nome || createReferenteMutation.isPending}
            >
              {createReferenteMutation.isPending && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
              Salva
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={portalDialogOpen} onOpenChange={(open) => { setPortalDialogOpen(open); if (!open) setPortalLink(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LinkIcon className="h-5 w-5" />
              Portale Cliente
            </DialogTitle>
            <DialogDescription>
              Condividi questo link con il cliente per permettergli di vedere fatture e preventivi
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {generatePortalMutation.isPending ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : generatePortalMutation.isError ? (
              <div className="text-center py-4">
                <p className="text-destructive mb-2">Errore nella generazione del link</p>
                <Button variant="outline" size="sm" onClick={() => selectedCliente && generatePortalMutation.mutate(selectedCliente.id)}>
                  Riprova
                </Button>
              </div>
            ) : portalLink ? (
              <>
                <div className="flex gap-2">
                  <Input value={portalLink} readOnly className="text-sm" />
                  <Button variant="outline" size="icon" onClick={copyPortalLink}>
                    {linkCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                  <Button variant="outline" size="icon" asChild>
                    <a href={portalLink} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Il link e valido per 30 giorni. Il cliente puo accedere senza login.
                </p>
              </>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function CRM() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [leadDialogOpen, setLeadDialogOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [opportunitaDialogOpen, setOpportunitaDialogOpen] = useState(false);
  const [selectedOpportunita, setSelectedOpportunita] = useState<any>(null);
  const [attivitaDialogOpen, setAttivitaDialogOpen] = useState(false);
  const [selectedAttivita, setSelectedAttivita] = useState<any>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [detailEntity, setDetailEntity] = useState<any>(null);
  const [detailType, setDetailType] = useState<"lead" | "opportunita" | null>(null);
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);
  const [leadToConvert, setLeadToConvert] = useState<any>(null);

  const { data: stats } = useQuery({
    queryKey: ["crm-stats"],
    queryFn: async () => {
      const res = await fetch("/api/crm/stats");
      if (!res.ok) throw new Error("Errore nel caricamento delle statistiche");
      return res.json();
    },
  });

  const { data: leads = [] } = useQuery({
    queryKey: ["crm-leads"],
    queryFn: async () => {
      const res = await fetch("/api/crm/leads");
      if (!res.ok) throw new Error("Errore nel caricamento dei lead");
      return res.json();
    },
  });

  const { data: opportunita = [] } = useQuery({
    queryKey: ["crm-opportunita"],
    queryFn: async () => {
      const res = await fetch("/api/crm/opportunita");
      if (!res.ok) throw new Error("Errore nel caricamento delle opportunità");
      return res.json();
    },
  });

  const { data: attivita = [] } = useQuery({
    queryKey: ["crm-attivita"],
    queryFn: async () => {
      const res = await fetch("/api/crm/attivita");
      if (!res.ok) throw new Error("Errore nel caricamento delle attività");
      return res.json();
    },
  });

  const { data: clienti = [] } = useQuery({
    queryKey: ["anagrafica-clienti"],
    queryFn: async () => {
      const res = await fetch("/api/anagrafica/clienti");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await fetch("/api/users");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const createLeadMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/crm/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Errore nella creazione del lead");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-leads"] });
      queryClient.invalidateQueries({ queryKey: ["crm-stats"] });
      toast({ title: "Lead creato con successo" });
      setLeadDialogOpen(false);
      setSelectedLead(null);
    },
  });

  const updateLeadMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await fetch(`/api/crm/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Errore nell'aggiornamento del lead");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-leads"] });
      queryClient.invalidateQueries({ queryKey: ["crm-stats"] });
      toast({ title: "Lead aggiornato con successo" });
      setLeadDialogOpen(false);
      setSelectedLead(null);
    },
  });

  const deleteLeadMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/crm/leads/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Errore nell'eliminazione del lead");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-leads"] });
      queryClient.invalidateQueries({ queryKey: ["crm-stats"] });
      toast({ title: "Lead eliminato" });
    },
  });

  const convertLeadMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/crm/leads/${id}/convert`, { method: "POST" });
      if (!res.ok) throw new Error("Errore nella conversione del lead");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-leads"] });
      queryClient.invalidateQueries({ queryKey: ["crm-stats"] });
      queryClient.invalidateQueries({ queryKey: ["anagrafica-clienti"] });
      toast({ title: "Lead convertito in cliente con successo" });
      setConvertDialogOpen(false);
      setLeadToConvert(null);
    },
  });

  const createOpportunitaMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/crm/opportunita", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Errore nella creazione dell'opportunità");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-opportunita"] });
      queryClient.invalidateQueries({ queryKey: ["crm-stats"] });
      toast({ title: "Opportunità creata con successo" });
      setOpportunitaDialogOpen(false);
      setSelectedOpportunita(null);
    },
  });

  const updateOpportunitaMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await fetch(`/api/crm/opportunita/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Errore nell'aggiornamento dell'opportunità");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-opportunita"] });
      queryClient.invalidateQueries({ queryKey: ["crm-stats"] });
      toast({ title: "Opportunità aggiornata con successo" });
      setOpportunitaDialogOpen(false);
      setSelectedOpportunita(null);
    },
  });

  const deleteOpportunitaMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/crm/opportunita/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Errore nell'eliminazione dell'opportunità");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-opportunita"] });
      queryClient.invalidateQueries({ queryKey: ["crm-stats"] });
      toast({ title: "Opportunità eliminata" });
    },
  });

  const createAttivitaMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/crm/attivita", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Errore nella creazione dell'attività");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-attivita"] });
      queryClient.invalidateQueries({ queryKey: ["crm-stats"] });
      toast({ title: "Attività creata con successo" });
      setAttivitaDialogOpen(false);
      setSelectedAttivita(null);
    },
  });

  const updateAttivitaMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await fetch(`/api/crm/attivita/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Errore nell'aggiornamento dell'attività");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-attivita"] });
      toast({ title: "Attività aggiornata con successo" });
      setAttivitaDialogOpen(false);
      setSelectedAttivita(null);
    },
  });

  const deleteAttivitaMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/crm/attivita/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Errore nell'eliminazione dell'attività");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-attivita"] });
      toast({ title: "Attività eliminata" });
    },
  });

  const handleSaveLead = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    if (selectedLead?.id) {
      updateLeadMutation.mutate({ id: selectedLead.id, data });
    } else {
      createLeadMutation.mutate(data);
    }
  };

  const handleSaveOpportunita = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: any = Object.fromEntries(formData.entries());

    // Parse numeric fields
    if (data.probabilita) data.probabilita = parseInt(data.probabilita as string);
    else delete data.probabilita;

    // Handle FKs - set to null if empty string to prevent FK constraint violations
    ['clienteId', 'leadId', 'assegnatoA', 'projectId'].forEach(key => {
      if (data[key] === "") data[key] = null;
    });

    if (selectedOpportunita?.id) {
      updateOpportunitaMutation.mutate({ id: selectedOpportunita.id, data });
    } else {
      createOpportunitaMutation.mutate(data);
    }
  };

  const handleSaveAttivita = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: any = Object.fromEntries(formData.entries());

    // Parse numeric fields
    if (data.durata) data.durata = parseInt(data.durata as string);
    else delete data.durata;

    // Handle FKs - set to null if empty string to prevent FK constraint violations
    ['clienteId', 'leadId', 'opportunitaId', 'assegnatoA'].forEach(key => {
      if (data[key] === "") data[key] = null;
    });

    if (selectedAttivita?.id) {
      updateAttivitaMutation.mutate({ id: selectedAttivita.id, data });
    } else {
      createAttivitaMutation.mutate(data);
    }
  };

  const filteredLeads = leads.filter((l: any) =>
    l.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.cognome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.azienda?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredOpportunita = opportunita.filter((o: any) =>
    o.titolo?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pipelineData = FASI_OPPORTUNITA.slice(0, 4).map(fase => ({
    ...fase,
    count: opportunita.filter((o: any) => o.fase === fase.value).length,
    value: opportunita
      .filter((o: any) => o.fase === fase.value)
      .reduce((sum: number, o: any) => sum + parseItalianNumber(o.valore), 0),
  }));

  return (
    <AppLayout>
      <div className={`h-full flex flex-col overflow-hidden bg-gradient-to-br from-[#f5f0e6] via-[#e8dcc8] to-[#ddd0b8] dark:from-[#2d3748] dark:via-[#374151] dark:to-[#3d4555] ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
        <div className="h-32 w-full flex-shrink-0 bg-gradient-to-r from-[#4a5568] via-[#5a6a7d] to-[#6b7a8f]" />

        <div className="flex-1 overflow-auto -mt-16 px-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <div className="bg-stone-50 dark:bg-stone-900/50 rounded-xl shadow-lg border mb-6" style={{ maxWidth: "95rem" }}>
              <div className="p-6 pb-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h1 className="text-2xl font-bold tracking-tight">CRM</h1>
                      <p className="text-sm text-muted-foreground">
                        Gestione clienti, lead e opportunità
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
                      <CopyLinkButton path="/crm" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Cerca..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 w-64"
                      />
                    </div>
                  </div>
                </div>

                <TabsList className="grid grid-cols-6 gap-1 h-auto bg-transparent p-0">
                  <TabsTrigger value="dashboard" className="flex flex-col items-center justify-center gap-0.5 px-1 py-2 text-[9px] data-[state=active]:bg-primary/20 rounded-lg" title="Dashboard">
                    <PieChart className="h-4 w-4" />
                    <span>Dashboard</span>
                  </TabsTrigger>
                  <TabsTrigger value="leads" className="flex flex-col items-center justify-center gap-0.5 px-1 py-2 text-[9px] data-[state=active]:bg-primary/20 rounded-lg" title="Lead">
                    <Users className="h-4 w-4" />
                    <span>Lead</span>
                  </TabsTrigger>
                  <TabsTrigger value="opportunita" className="flex flex-col items-center justify-center gap-0.5 px-1 py-2 text-[9px] data-[state=active]:bg-primary/20 rounded-lg" title="Opportunità">
                    <Target className="h-4 w-4" />
                    <span>Opportunità</span>
                  </TabsTrigger>
                  <TabsTrigger value="attivita" className="flex flex-col items-center justify-center gap-0.5 px-1 py-2 text-[9px] data-[state=active]:bg-primary/20 rounded-lg" title="Attività">
                    <Calendar className="h-4 w-4" />
                    <span>Attività</span>
                  </TabsTrigger>
                  <TabsTrigger value="pipeline" className="flex flex-col items-center justify-center gap-0.5 px-1 py-2 text-[9px] data-[state=active]:bg-primary/20 rounded-lg" title="Pipeline">
                    <BarChart3 className="h-4 w-4" />
                    <span>Pipeline</span>
                  </TabsTrigger>
                  <TabsTrigger value="clienti" className="flex flex-col items-center justify-center gap-0.5 px-1 py-2 text-[9px] data-[state=active]:bg-primary/20 rounded-lg" title="Clienti">
                    <Building2 className="h-4 w-4" />
                    <span>Clienti</span>
                  </TabsTrigger>
                </TabsList>
              </div>
            </div>

            <TabsContent value="dashboard" className="m-0 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md shadow-blue-500/20">
                  <div className="absolute top-0 right-0 p-3 opacity-20">
                    <Users className="h-12 w-12" />
                  </div>
                  <CardHeader className="pb-1 pt-3 px-3">
                    <CardTitle className="text-xs font-medium text-blue-100">Lead Totali</CardTitle>
                  </CardHeader>
                  <CardContent className="px-3 pb-3">
                    <div className="text-xl font-bold">{stats?.leads?.totale || 0}</div>
                    <div className="flex gap-1 mt-2">
                      <Badge className="bg-white/20 text-white border-0 hover:bg-white/30 text-[10px] px-1.5 py-0">{stats?.leads?.nuovi || 0} nuovi</Badge>
                      <Badge className="bg-white/20 text-white border-0 hover:bg-white/30 text-[10px] px-1.5 py-0">{stats?.leads?.qualificati || 0} qualificati</Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-md shadow-purple-500/20">
                  <div className="absolute top-0 right-0 p-3 opacity-20">
                    <TrendingUp className="h-12 w-12" />
                  </div>
                  <CardHeader className="pb-1 pt-3 px-3">
                    <CardTitle className="text-xs font-medium text-purple-100">Pipeline Attiva</CardTitle>
                  </CardHeader>
                  <CardContent className="px-3 pb-3">
                    <div className="text-xl font-bold">{formatCurrency(stats?.pipeline?.valore)}</div>
                    <p className="text-xs text-purple-100 mt-1">
                      {stats?.opportunita?.totale || 0} opportunità aperte
                    </p>
                  </CardContent>
                </Card>

                <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-md shadow-emerald-500/20">
                  <div className="absolute top-0 right-0 p-3 opacity-20">
                    <DollarSign className="h-12 w-12" />
                  </div>
                  <CardHeader className="pb-1 pt-3 px-3">
                    <CardTitle className="text-xs font-medium text-emerald-100">Valore Chiuso</CardTitle>
                  </CardHeader>
                  <CardContent className="px-3 pb-3">
                    <div className="text-xl font-bold">{formatCurrency(stats?.pipeline?.valoreVinto)}</div>
                    <p className="text-xs text-emerald-100 mt-1">
                      {stats?.opportunita?.vinte || 0} opportunità vinte
                    </p>
                  </CardContent>
                </Card>

                <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/20">
                  <div className="absolute top-0 right-0 p-3 opacity-20">
                    <Target className="h-12 w-12" />
                  </div>
                  <CardHeader className="pb-1 pt-3 px-3">
                    <CardTitle className="text-xs font-medium text-amber-100">Tasso Conversione</CardTitle>
                  </CardHeader>
                  <CardContent className="px-3 pb-3">
                    <div className="text-xl font-bold">{stats?.opportunita?.tassoConversione || 0}%</div>
                    <div className="mt-2 h-1.5 bg-white/20 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-white transition-all duration-500"
                        style={{ width: `${stats?.opportunita?.tassoConversione || 0}%` }}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card className="shadow-sm">
                  <CardHeader className="border-b bg-muted/30 py-2 px-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Users className="h-4 w-4 text-blue-500" />
                        Lead Recenti
                      </CardTitle>
                      <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setActiveTab("leads")}>
                        Vedi tutti
                        <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    {leads.slice(0, 5).map((lead: any, index: number) => {
                      const statoInfo = STATI_LEAD.find(s => s.value === lead.stato);
                      const valutazioneInfo = VALUTAZIONI_LEAD.find(v => v.value === lead.valutazione);
                      return (
                        <div
                          key={lead.id}
                          className={`flex items-center justify-between p-2.5 hover:bg-muted/50 transition-colors cursor-pointer ${index !== leads.slice(0, 5).length - 1 ? 'border-b' : ''}`}
                          onClick={() => {
                            setDetailEntity(lead);
                            setDetailType("lead");
                            setDetailDialogOpen(true);
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-semibold">
                              {lead.nome?.charAt(0)}{lead.cognome?.charAt(0) || ''}
                            </div>
                            <div>
                              <p className="text-sm font-medium">{lead.nome} {lead.cognome}</p>
                              <p className="text-xs text-muted-foreground">{lead.azienda || lead.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            {valutazioneInfo && (
                              <valutazioneInfo.icon className={`h-3 w-3 ${valutazioneInfo.color}`} />
                            )}
                            <Badge className={`${statoInfo?.color} text-white text-[10px] px-1.5 py-0`}>
                              {statoInfo?.label}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                    {leads.length === 0 && (
                      <div className="p-6 text-center">
                        <Users className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                        <p className="text-sm text-muted-foreground">Nessun lead</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="shadow-sm">
                  <CardHeader className="border-b bg-muted/30 py-2 px-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-purple-500" />
                        Attività Pianificate
                      </CardTitle>
                      <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setActiveTab("attivita")}>
                        Vedi tutte
                        <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    {attivita.filter((a: any) => a.stato === "pianificata").slice(0, 5).map((att: any, index: number) => {
                      const tipoInfo = TIPI_ATTIVITA.find(t => t.value === att.tipo);
                      const TipoIcon = tipoInfo?.icon || Activity;
                      const tipoColors: Record<string, string> = {
                        chiamata: "from-green-400 to-green-600",
                        email: "from-blue-400 to-blue-600",
                        riunione: "from-purple-400 to-purple-600",
                        task: "from-amber-400 to-amber-600",
                        nota: "from-gray-400 to-gray-600",
                        altro: "from-slate-400 to-slate-600"
                      };
                      return (
                        <div
                          key={att.id}
                          className={`flex items-center gap-2 p-2.5 hover:bg-muted/50 transition-colors cursor-pointer ${index !== attivita.filter((a: any) => a.stato === "pianificata").slice(0, 5).length - 1 ? 'border-b' : ''}`}
                          onClick={() => {
                            setSelectedAttivita(att);
                            setAttivitaDialogOpen(true);
                          }}
                        >
                          <div className={`p-2 rounded-lg bg-gradient-to-br ${tipoColors[att.tipo] || tipoColors.altro}`}>
                            <TipoIcon className="h-3 w-3 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{att.oggetto}</p>
                            <p className="text-xs text-muted-foreground">
                              {att.dataOra && format(new Date(att.dataOra), "EEE d MMM, HH:mm", { locale: it })}
                            </p>
                          </div>
                          <Badge variant="outline" className="shrink-0 text-[10px] px-1.5 py-0">
                            {tipoInfo?.label}
                          </Badge>
                        </div>
                      );
                    })}
                    {attivita.filter((a: any) => a.stato === "pianificata").length === 0 && (
                      <div className="p-6 text-center">
                        <Calendar className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                        <p className="text-sm text-muted-foreground">Nessuna attività pianificata</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="leads" className="m-0">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Gestione Lead</h2>
                <Button onClick={() => { setSelectedLead(null); setLeadDialogOpen(true); }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nuovo Lead
                </Button>
              </div>

              <div className="grid gap-4">
                {filteredLeads.map((lead: any) => {
                  const statoInfo = STATI_LEAD.find(s => s.value === lead.stato);
                  const valutazioneInfo = VALUTAZIONI_LEAD.find(v => v.value === lead.valutazione);
                  return (
                    <Card key={lead.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4">
                            <div className="p-3 rounded-full bg-primary/10">
                              <Users className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-semibold">{lead.nome} {lead.cognome}</h3>
                              {lead.azienda && (
                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                  <Building2 className="h-3 w-3" />
                                  {lead.azienda}
                                </p>
                              )}
                              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                {lead.email && (
                                  <span className="flex items-center gap-1">
                                    <Mail className="h-3 w-3" />
                                    {lead.email}
                                  </span>
                                )}
                                {lead.telefono && (
                                  <span className="flex items-center gap-1">
                                    <Phone className="h-3 w-3" />
                                    {lead.telefono}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={statoInfo?.color}>{statoInfo?.label}</Badge>
                            {valutazioneInfo && (
                              <Badge variant="outline" className={valutazioneInfo.color}>
                                {valutazioneInfo.label}
                              </Badge>
                            )}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => {
                                  setDetailEntity(lead);
                                  setDetailType("lead");
                                  setDetailDialogOpen(true);
                                }}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Visualizza
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => {
                                  setSelectedLead(lead);
                                  setLeadDialogOpen(true);
                                }}>
                                  <Edit2 className="h-4 w-4 mr-2" />
                                  Modifica
                                </DropdownMenuItem>
                                {lead.stato !== "convertito" && (
                                  <DropdownMenuItem onClick={() => {
                                    setLeadToConvert(lead);
                                    setConvertDialogOpen(true);
                                  }}>
                                    <UserPlus className="h-4 w-4 mr-2" />
                                    Converti in Cliente
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={() => deleteLeadMutation.mutate(lead.id)}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Elimina
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                        {lead.interesse && (
                          <p className="mt-3 text-sm text-muted-foreground">{lead.interesse}</p>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
                {filteredLeads.length === 0 && (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">Nessun lead trovato</p>
                      <Button className="mt-4" onClick={() => { setSelectedLead(null); setLeadDialogOpen(true); }}>
                        <Plus className="h-4 w-4 mr-2" />
                        Crea il primo lead
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="opportunita" className="m-0">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Gestione Opportunità</h2>
                <Button onClick={() => { setSelectedOpportunita(null); setOpportunitaDialogOpen(true); }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nuova Opportunità
                </Button>
              </div>

              <div className="grid gap-4">
                {filteredOpportunita.map((opp: any) => {
                  const faseInfo = FASI_OPPORTUNITA.find(f => f.value === opp.fase);
                  const cliente = clienti.find((c: any) => c.id === opp.clienteId);
                  return (
                    <Card key={opp.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4">
                            <div className="p-3 rounded-full bg-primary/10">
                              <Target className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-semibold">{opp.titolo}</h3>
                              {cliente && (
                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                  <Building2 className="h-3 w-3" />
                                  {cliente.ragioneSociale}
                                </p>
                              )}
                              <div className="flex items-center gap-4 mt-2">
                                <span className="text-lg font-bold text-primary">
                                  {formatCurrency(opp.valore)}
                                </span>
                                <span className="text-sm text-muted-foreground">
                                  Prob: {opp.probabilita || faseInfo?.prob}%
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={faseInfo?.color}>{faseInfo?.label}</Badge>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => {
                                  setDetailEntity(opp);
                                  setDetailType("opportunita");
                                  setDetailDialogOpen(true);
                                }}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Visualizza
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => {
                                  setSelectedOpportunita(opp);
                                  setOpportunitaDialogOpen(true);
                                }}>
                                  <Edit2 className="h-4 w-4 mr-2" />
                                  Modifica
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={() => deleteOpportunitaMutation.mutate(opp.id)}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Elimina
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                        {opp.descrizione && (
                          <p className="mt-3 text-sm text-muted-foreground">{opp.descrizione}</p>
                        )}
                        {opp.dataChiusuraStimata && (
                          <p className="mt-2 text-sm flex items-center gap-1 text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            Chiusura stimata: {format(new Date(opp.dataChiusuraStimata), "d MMM yyyy", { locale: it })}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
                {filteredOpportunita.length === 0 && (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">Nessuna opportunità trovata</p>
                      <Button className="mt-4" onClick={() => { setSelectedOpportunita(null); setOpportunitaDialogOpen(true); }}>
                        <Plus className="h-4 w-4 mr-2" />
                        Crea la prima opportunità
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="attivita" className="m-0">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Gestione Attività</h2>
                <Button onClick={() => { setSelectedAttivita(null); setAttivitaDialogOpen(true); }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nuova Attività
                </Button>
              </div>

              <div className="grid gap-4">
                {attivita.map((att: any) => {
                  const tipoInfo = TIPI_ATTIVITA.find(t => t.value === att.tipo);
                  const TipoIcon = tipoInfo?.icon || Activity;
                  return (
                    <Card key={att.id} className={`hover:shadow-md transition-shadow ${att.stato === "completata" ? "opacity-60" : ""}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4">
                            <div className={`p-3 rounded-full ${att.stato === "completata" ? "bg-green-100" : "bg-primary/10"}`}>
                              <TipoIcon className={`h-5 w-5 ${att.stato === "completata" ? "text-green-600" : "text-primary"}`} />
                            </div>
                            <div>
                              <h3 className="font-semibold">{att.oggetto}</h3>
                              <p className="text-sm text-muted-foreground">
                                {att.dataOra && format(new Date(att.dataOra), "EEEE d MMMM yyyy, HH:mm", { locale: it })}
                              </p>
                              {att.descrizione && (
                                <p className="mt-2 text-sm text-muted-foreground">{att.descrizione}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{tipoInfo?.label}</Badge>
                            <Badge className={att.stato === "completata" ? "bg-green-500" : att.stato === "annullata" ? "bg-red-500" : "bg-blue-500"}>
                              {att.stato === "completata" ? "Completata" : att.stato === "annullata" ? "Annullata" : "Pianificata"}
                            </Badge>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {att.stato === "pianificata" && (
                                  <DropdownMenuItem onClick={() => {
                                    updateAttivitaMutation.mutate({ id: att.id, data: { stato: "completata" } });
                                  }}>
                                    <CheckCircle2 className="h-4 w-4 mr-2" />
                                    Completa
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={() => {
                                  setSelectedAttivita(att);
                                  setAttivitaDialogOpen(true);
                                }}>
                                  <Edit2 className="h-4 w-4 mr-2" />
                                  Modifica
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={() => deleteAttivitaMutation.mutate(att.id)}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Elimina
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                {attivita.length === 0 && (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">Nessuna attività trovata</p>
                      <Button className="mt-4" onClick={() => { setSelectedAttivita(null); setAttivitaDialogOpen(true); }}>
                        <Plus className="h-4 w-4 mr-2" />
                        Crea la prima attività
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="pipeline" className="m-0">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold">Pipeline di Vendita</h2>
                  <p className="text-muted-foreground text-sm">Trascina le opportunità tra le fasi</p>
                </div>
                <Button onClick={() => { setSelectedOpportunita(null); setOpportunitaDialogOpen(true); }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nuova Opportunità
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 overflow-x-auto pb-4">
                {FASI_OPPORTUNITA.slice(0, 4).map((fase) => {
                  const faseOpps = opportunita.filter((o: any) => o.fase === fase.value);
                  const faseValue = faseOpps.reduce((sum: number, o: any) => sum + parseItalianNumber(o.valore), 0);

                  return (
                    <div key={fase.value} className="flex flex-col min-h-[500px]">
                      <div className={`rounded-t-lg px-4 py-3 ${fase.color}`}>
                        <div className="flex items-center justify-between text-white">
                          <h3 className="font-semibold">{fase.label}</h3>
                          <Badge className="bg-white/20 text-white border-0">{faseOpps.length}</Badge>
                        </div>
                        <p className="text-white/80 text-sm mt-1">{formatCurrency(faseValue)}</p>
                      </div>

                      <div className="flex-1 bg-muted/30 rounded-b-lg p-2 space-y-2 border border-t-0">
                        {faseOpps.length === 0 ? (
                          <div className="flex items-center justify-center h-24 border-2 border-dashed border-muted rounded-lg">
                            <p className="text-muted-foreground text-sm">Nessuna opportunità</p>
                          </div>
                        ) : (
                          faseOpps.map((opp: any) => {
                            const cliente = clienti.find((c: any) => c.id === opp.clienteId);
                            return (
                              <Card
                                key={opp.id}
                                className="cursor-pointer hover:shadow-md transition-all hover:-translate-y-0.5 bg-background"
                                onClick={() => {
                                  setDetailEntity(opp);
                                  setDetailType("opportunita");
                                  setDetailDialogOpen(true);
                                }}
                              >
                                <CardContent className="p-3">
                                  <h4 className="font-medium text-sm line-clamp-2">{opp.titolo}</h4>
                                  {cliente && (
                                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                      <Building2 className="h-3 w-3" />
                                      {cliente.ragioneSociale}
                                    </p>
                                  )}
                                  <div className="flex items-center justify-between mt-2">
                                    <span className="text-sm font-bold text-primary">{formatCurrency(opp.valore)}</span>
                                    <span className="text-xs text-muted-foreground">{opp.probabilita || fase.prob}%</span>
                                  </div>
                                  {opp.dataChiusuraStimata && (
                                    <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {format(new Date(opp.dataChiusuraStimata), "d MMM", { locale: it })}
                                    </p>
                                  )}
                                </CardContent>
                              </Card>
                            );
                          })
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <CardTitle className="text-base text-green-700 dark:text-green-400">Chiuse Vinte</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(opportunita.filter((o: any) => o.fase === "chiuso_vinto").reduce((sum: number, o: any) => sum + parseItalianNumber(o.valore), 0))}
                    </div>
                    <p className="text-sm text-green-600/70 mt-1">
                      {opportunita.filter((o: any) => o.fase === "chiuso_vinto").length} opportunità
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-red-200 bg-red-50/50 dark:bg-red-950/20">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-5 w-5 text-red-600" />
                      <CardTitle className="text-base text-red-700 dark:text-red-400">Chiuse Perse</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">
                      {formatCurrency(opportunita.filter((o: any) => o.fase === "chiuso_perso").reduce((sum: number, o: any) => sum + parseItalianNumber(o.valore), 0))}
                    </div>
                    <p className="text-sm text-red-600/70 mt-1">
                      {opportunita.filter((o: any) => o.fase === "chiuso_perso").length} opportunità
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="clienti" className="m-0">
              <ClientiTab />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Dialog open={leadDialogOpen} onOpenChange={setLeadDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedLead?.id ? "Modifica Lead" : "Nuovo Lead"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveLead}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nome">Nome *</Label>
                <Input id="nome" name="nome" defaultValue={selectedLead?.nome} required />
              </div>
              <div>
                <Label htmlFor="cognome">Cognome</Label>
                <Input id="cognome" name="cognome" defaultValue={selectedLead?.cognome} />
              </div>
              <div>
                <Label htmlFor="azienda">Azienda</Label>
                <Input id="azienda" name="azienda" defaultValue={selectedLead?.azienda} />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" defaultValue={selectedLead?.email} />
              </div>
              <div>
                <Label htmlFor="telefono">Telefono</Label>
                <Input id="telefono" name="telefono" defaultValue={selectedLead?.telefono} />
              </div>
              <div>
                <Label htmlFor="cellulare">Cellulare</Label>
                <Input id="cellulare" name="cellulare" defaultValue={selectedLead?.cellulare} />
              </div>
              <div>
                <Label htmlFor="fonte">Fonte</Label>
                <Select name="fonte" defaultValue={selectedLead?.fonte || ""}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona fonte" />
                  </SelectTrigger>
                  <SelectContent>
                    {FONTI_LEAD.map((fonte) => (
                      <SelectItem key={fonte.value} value={fonte.value}>{fonte.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="stato">Stato</Label>
                <Select name="stato" defaultValue={selectedLead?.stato || "nuovo"}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona stato" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATI_LEAD.map((stato) => (
                      <SelectItem key={stato.value} value={stato.value}>{stato.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="valutazione">Valutazione</Label>
                <Select name="valutazione" defaultValue={selectedLead?.valutazione || "freddo"}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona valutazione" />
                  </SelectTrigger>
                  <SelectContent>
                    {VALUTAZIONI_LEAD.map((val) => (
                      <SelectItem key={val.value} value={val.value}>{val.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="budgetStimato">Budget Stimato (€)</Label>
                <Input id="budgetStimato" name="budgetStimato" defaultValue={selectedLead?.budgetStimato} />
              </div>
              <div>
                <Label htmlFor="settore">Settore</Label>
                <Input id="settore" name="settore" defaultValue={selectedLead?.settore} />
              </div>
              <div>
                <Label htmlFor="dataProssimoContatto">Prossimo Contatto</Label>
                <Input id="dataProssimoContatto" name="dataProssimoContatto" type="date" defaultValue={selectedLead?.dataProssimoContatto} />
              </div>
              <div className="col-span-2">
                <Label htmlFor="interesse">Interesse</Label>
                <Textarea id="interesse" name="interesse" defaultValue={selectedLead?.interesse} rows={2} />
              </div>
              <div className="col-span-2">
                <Label htmlFor="note">Note</Label>
                <Textarea id="note" name="note" defaultValue={selectedLead?.note} rows={2} />
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setLeadDialogOpen(false)}>Annulla</Button>
              <Button type="submit">Salva</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={opportunitaDialogOpen} onOpenChange={setOpportunitaDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedOpportunita?.id ? "Modifica Opportunità" : "Nuova Opportunità"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveOpportunita}>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="titolo">Titolo *</Label>
                <Input id="titolo" name="titolo" defaultValue={selectedOpportunita?.titolo} required />
              </div>
              <div>
                <Label htmlFor="clienteId">Cliente</Label>
                <Select name="clienteId" defaultValue={selectedOpportunita?.clienteId || ""}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clienti.map((cliente: any) => (
                      <SelectItem key={cliente.id} value={cliente.id}>{cliente.ragioneSociale}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="leadId">Lead</Label>
                <Select name="leadId" defaultValue={selectedOpportunita?.leadId || ""}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona lead" />
                  </SelectTrigger>
                  <SelectContent>
                    {leads.map((lead: any) => (
                      <SelectItem key={lead.id} value={lead.id}>{lead.nome} {lead.cognome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="valore">Valore (€)</Label>
                <Input id="valore" name="valore" defaultValue={selectedOpportunita?.valore} />
              </div>
              <div>
                <Label htmlFor="probabilita">Probabilità (%)</Label>
                <Input id="probabilita" name="probabilita" type="number" min="0" max="100" defaultValue={selectedOpportunita?.probabilita || 20} />
              </div>
              <div>
                <Label htmlFor="fase">Fase</Label>
                <Select name="fase" defaultValue={selectedOpportunita?.fase || "prospetto"}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona fase" />
                  </SelectTrigger>
                  <SelectContent>
                    {FASI_OPPORTUNITA.map((fase) => (
                      <SelectItem key={fase.value} value={fase.value}>{fase.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="priorita">Priorità</Label>
                <Select name="priorita" defaultValue={selectedOpportunita?.priorita || "normale"}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona priorità" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITA.map((p) => (
                      <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="dataChiusuraStimata">Chiusura Stimata</Label>
                <Input id="dataChiusuraStimata" name="dataChiusuraStimata" type="date" defaultValue={selectedOpportunita?.dataChiusuraStimata} />
              </div>
              <div>
                <Label htmlFor="assegnatoA">Assegnato a</Label>
                <Select name="assegnatoA" defaultValue={selectedOpportunita?.assegnatoA || ""}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona utente" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user: any) => (
                      <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label htmlFor="prodottiServizi">Prodotti/Servizi</Label>
                <Textarea id="prodottiServizi" name="prodottiServizi" defaultValue={selectedOpportunita?.prodottiServizi} rows={2} />
              </div>
              <div className="col-span-2">
                <Label htmlFor="descrizione">Descrizione</Label>
                <Textarea id="descrizione" name="descrizione" defaultValue={selectedOpportunita?.descrizione} rows={2} />
              </div>
              <div className="col-span-2">
                <Label htmlFor="note">Note</Label>
                <Textarea id="note" name="note" defaultValue={selectedOpportunita?.note} rows={2} />
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setOpportunitaDialogOpen(false)}>Annulla</Button>
              <Button type="submit">Salva</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={attivitaDialogOpen} onOpenChange={setAttivitaDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>{selectedAttivita?.id ? "Modifica Attività" : "Nuova Attività"}</DialogTitle>
              <a
                href="https://calendar.google.com/calendar/u/0/r/tasks"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-md transition-colors"
                title="Visualizza attività su Google Calendar"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.5 3h-3V1.5h-1.5V3h-6V1.5H7.5V3h-3C3.675 3 3 3.675 3 4.5v15c0 .825.675 1.5 1.5 1.5h15c.825 0 1.5-.675 1.5-1.5v-15c0-.825-.675-1.5-1.5-1.5zm0 16.5h-15V9h15v10.5zm0-12h-15v-3h3V6H9V4.5h6V6h1.5V4.5h3v3z" />
                </svg>
                Google Calendar
              </a>
            </div>
          </DialogHeader>
          <form onSubmit={handleSaveAttivita}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tipo">Tipo *</Label>
                <Select name="tipo" defaultValue={selectedAttivita?.tipo || "chiamata"}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPI_ATTIVITA.map((tipo) => (
                      <SelectItem key={tipo.value} value={tipo.value}>{tipo.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="priorita">Priorità</Label>
                <Select name="priorita" defaultValue={selectedAttivita?.priorita || "normale"}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona priorità" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bassa">🟢 Bassa</SelectItem>
                    <SelectItem value="normale">🟡 Normale</SelectItem>
                    <SelectItem value="alta">🟠 Alta</SelectItem>
                    <SelectItem value="urgente">🔴 Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label htmlFor="oggetto">Oggetto *</Label>
                <Input id="oggetto" name="oggetto" defaultValue={selectedAttivita?.oggetto} required placeholder="Titolo dell'attività" />
              </div>
              <div>
                <Label htmlFor="dataOra">Data e Ora *</Label>
                <Input id="dataOra" name="dataOra" type="datetime-local" defaultValue={selectedAttivita?.dataOra} required />
              </div>
              <div>
                <Label htmlFor="durata">Durata (minuti)</Label>
                <Input id="durata" name="durata" type="number" defaultValue={selectedAttivita?.durata} placeholder="30" />
              </div>
              <div>
                <Label htmlFor="clienteId">Cliente</Label>
                <Select name="clienteId" defaultValue={selectedAttivita?.clienteId || ""}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clienti.map((cliente: any) => (
                      <SelectItem key={cliente.id} value={cliente.id}>{cliente.ragioneSociale}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="assegnatoA">Assegnato a</Label>
                <Select name="assegnatoA" defaultValue={selectedAttivita?.assegnatoA || ""}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona utente" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user: any) => (
                      <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="stato">Stato</Label>
                <Select name="stato" defaultValue={selectedAttivita?.stato || "pianificata"}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona stato" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pianificata">📅 Pianificata</SelectItem>
                    <SelectItem value="in_corso">🔄 In Corso</SelectItem>
                    <SelectItem value="completata">✅ Completata</SelectItem>
                    <SelectItem value="annullata">❌ Annullata</SelectItem>
                    <SelectItem value="rinviata">⏸️ Rinviata</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="promemoria">Promemoria</Label>
                <Select name="promemoria" defaultValue={selectedAttivita?.promemoria || "nessuno"}>
                  <SelectTrigger>
                    <SelectValue placeholder="Promemoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nessuno">Nessuno</SelectItem>
                    <SelectItem value="5min">5 minuti prima</SelectItem>
                    <SelectItem value="15min">15 minuti prima</SelectItem>
                    <SelectItem value="30min">30 minuti prima</SelectItem>
                    <SelectItem value="1ora">1 ora prima</SelectItem>
                    <SelectItem value="1giorno">1 giorno prima</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label htmlFor="luogo">Luogo</Label>
                <Input id="luogo" name="luogo" defaultValue={selectedAttivita?.luogo} placeholder="Es: Ufficio, sede cliente, videochiamata..." />
              </div>
              <div className="col-span-2">
                <Label htmlFor="partecipanti">Partecipanti</Label>
                <Input id="partecipanti" name="partecipanti" defaultValue={selectedAttivita?.partecipanti} placeholder="Email dei partecipanti separate da virgola" />
              </div>
              <div className="col-span-2">
                <Label htmlFor="descrizione">Descrizione</Label>
                <Textarea id="descrizione" name="descrizione" defaultValue={selectedAttivita?.descrizione} rows={3} placeholder="Note e dettagli sull'attività..." />
              </div>
              <div className="col-span-2">
                <Label htmlFor="risultato">Risultato/Esito</Label>
                <Textarea id="risultato" name="risultato" defaultValue={selectedAttivita?.risultato} rows={2} placeholder="Esito dell'attività (dopo averla completata)" />
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setAttivitaDialogOpen(false)}>Annulla</Button>
              <Button type="submit">Salva</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={convertDialogOpen} onOpenChange={setConvertDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Converti Lead in Cliente</DialogTitle>
            <DialogDescription>
              Vuoi convertire il lead "{leadToConvert?.nome} {leadToConvert?.cognome}" in un nuovo cliente?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Questa operazione creerà un nuovo record cliente nell'anagrafica con i dati del lead.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConvertDialogOpen(false)}>Annulla</Button>
            <Button onClick={() => leadToConvert && convertLeadMutation.mutate(leadToConvert.id)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Converti
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {detailType === "lead" ? "Dettaglio Lead" : "Dettaglio Opportunità"}
            </DialogTitle>
          </DialogHeader>
          {detailType === "lead" && detailEntity && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Nome</p>
                  <p className="font-medium">{detailEntity.nome} {detailEntity.cognome}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Azienda</p>
                  <p className="font-medium">{detailEntity.azienda || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{detailEntity.email || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Telefono</p>
                  <p className="font-medium">{detailEntity.telefono || detailEntity.cellulare || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Stato</p>
                  <Badge className={STATI_LEAD.find(s => s.value === detailEntity.stato)?.color}>
                    {STATI_LEAD.find(s => s.value === detailEntity.stato)?.label}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Valutazione</p>
                  <p className="font-medium">{VALUTAZIONI_LEAD.find(v => v.value === detailEntity.valutazione)?.label || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Fonte</p>
                  <p className="font-medium">{FONTI_LEAD.find(f => f.value === detailEntity.fonte)?.label || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Budget Stimato</p>
                  <p className="font-medium">{detailEntity.budgetStimato ? formatCurrency(detailEntity.budgetStimato) : "-"}</p>
                </div>
              </div>
              {detailEntity.interesse && (
                <div>
                  <p className="text-sm text-muted-foreground">Interesse</p>
                  <p>{detailEntity.interesse}</p>
                </div>
              )}
              {detailEntity.note && (
                <div>
                  <p className="text-sm text-muted-foreground">Note</p>
                  <p>{detailEntity.note}</p>
                </div>
              )}
            </div>
          )}
          {detailType === "opportunita" && detailEntity && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Titolo</p>
                  <p className="font-medium text-lg">{detailEntity.titolo}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Valore</p>
                  <p className="font-bold text-xl text-primary">{formatCurrency(detailEntity.valore)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Probabilità</p>
                  <p className="font-medium">{detailEntity.probabilita}%</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Fase</p>
                  <Badge className={FASI_OPPORTUNITA.find(f => f.value === detailEntity.fase)?.color}>
                    {FASI_OPPORTUNITA.find(f => f.value === detailEntity.fase)?.label}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Chiusura Stimata</p>
                  <p className="font-medium">
                    {detailEntity.dataChiusuraStimata
                      ? format(new Date(detailEntity.dataChiusuraStimata), "d MMMM yyyy", { locale: it })
                      : "-"}
                  </p>
                </div>
              </div>
              {detailEntity.prodottiServizi && (
                <div>
                  <p className="text-sm text-muted-foreground">Prodotti/Servizi</p>
                  <p>{detailEntity.prodottiServizi}</p>
                </div>
              )}
              {detailEntity.descrizione && (
                <div>
                  <p className="text-sm text-muted-foreground">Descrizione</p>
                  <p>{detailEntity.descrizione}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
