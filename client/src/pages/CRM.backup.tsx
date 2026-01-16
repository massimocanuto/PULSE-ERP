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
  Thermometer
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

export default function CRM() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("dashboard");
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
    const data = Object.fromEntries(formData.entries());
    
    if (selectedOpportunita?.id) {
      updateOpportunitaMutation.mutate({ id: selectedOpportunita.id, data });
    } else {
      createOpportunitaMutation.mutate(data);
    }
  };

  const handleSaveAttivita = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    
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
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">CRM</h1>
              <p className="text-muted-foreground">Gestione clienti, lead e opportunità</p>
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
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <div className="border-b px-6">
            <TabsList className="h-12">
              <TabsTrigger value="dashboard" className="gap-2">
                <PieChart className="h-4 w-4" />
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="leads" className="gap-2">
                <Users className="h-4 w-4" />
                Lead
              </TabsTrigger>
              <TabsTrigger value="opportunita" className="gap-2">
                <Target className="h-4 w-4" />
                Opportunità
              </TabsTrigger>
              <TabsTrigger value="attivita" className="gap-2">
                <Calendar className="h-4 w-4" />
                Attività
              </TabsTrigger>
              <TabsTrigger value="pipeline" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                Pipeline
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-6">
              <TabsContent value="dashboard" className="m-0">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Lead Totali</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats?.leads?.totale || 0}</div>
                      <div className="flex gap-2 mt-2 text-xs">
                        <Badge variant="outline" className="bg-blue-50">{stats?.leads?.nuovi || 0} nuovi</Badge>
                        <Badge variant="outline" className="bg-green-50">{stats?.leads?.qualificati || 0} qualificati</Badge>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Pipeline Attiva</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{formatCurrency(stats?.pipeline?.valore)}</div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {stats?.opportunita?.totale || 0} opportunità aperte
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Valore Chiuso</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">{formatCurrency(stats?.pipeline?.valoreVinto)}</div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {stats?.opportunita?.vinte || 0} opportunità vinte
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Tasso Conversione</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats?.opportunita?.tassoConversione || 0}%</div>
                      <Progress value={stats?.opportunita?.tassoConversione || 0} className="h-2 mt-2" />
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Lead Recenti</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {leads.slice(0, 5).map((lead: any) => (
                        <div key={lead.id} className="flex items-center justify-between py-3 border-b last:border-0">
                          <div>
                            <p className="font-medium">{lead.nome} {lead.cognome}</p>
                            <p className="text-sm text-muted-foreground">{lead.azienda || lead.email}</p>
                          </div>
                          <Badge className={STATI_LEAD.find(s => s.value === lead.stato)?.color}>
                            {STATI_LEAD.find(s => s.value === lead.stato)?.label}
                          </Badge>
                        </div>
                      ))}
                      {leads.length === 0 && (
                        <p className="text-muted-foreground text-center py-4">Nessun lead</p>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Attività di Oggi</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {attivita.filter((a: any) => a.stato === "pianificata").slice(0, 5).map((att: any) => {
                        const TipoIcon = TIPI_ATTIVITA.find(t => t.value === att.tipo)?.icon || Activity;
                        return (
                          <div key={att.id} className="flex items-center gap-3 py-3 border-b last:border-0">
                            <div className="p-2 rounded-full bg-muted">
                              <TipoIcon className="h-4 w-4" />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium">{att.oggetto}</p>
                              <p className="text-sm text-muted-foreground">
                                {att.dataOra && format(new Date(att.dataOra), "d MMM HH:mm", { locale: it })}
                              </p>
                            </div>
                            <Badge variant="outline">
                              {TIPI_ATTIVITA.find(t => t.value === att.tipo)?.label}
                            </Badge>
                          </div>
                        );
                      })}
                      {attivita.filter((a: any) => a.stato === "pianificata").length === 0 && (
                        <p className="text-muted-foreground text-center py-4">Nessuna attività pianificata</p>
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
                <h2 className="text-lg font-semibold mb-4">Pipeline di Vendita</h2>
                
                <div className="grid grid-cols-4 gap-4 mb-6">
                  {pipelineData.map((fase) => (
                    <Card key={fase.value}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm font-medium">{fase.label}</CardTitle>
                          <Badge className={fase.color}>{fase.count}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-xl font-bold">{formatCurrency(fase.value)}</p>
                        <p className="text-xs text-muted-foreground mt-1">Prob. media: {fase.prob}%</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Dettaglio Pipeline</CardTitle>
                    <CardDescription>Opportunità per fase</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {FASI_OPPORTUNITA.slice(0, 4).map((fase) => {
                        const faseOpps = opportunita.filter((o: any) => o.fase === fase.value);
                        const faseValue = faseOpps.reduce((sum: number, o: any) => sum + parseItalianNumber(o.valore), 0);
                        const totalValue = opportunita
                          .filter((o: any) => !["chiuso_vinto", "chiuso_perso"].includes(o.fase))
                          .reduce((sum: number, o: any) => sum + parseItalianNumber(o.valore), 0);
                        const percentage = totalValue > 0 ? (faseValue / totalValue) * 100 : 0;
                        
                        return (
                          <div key={fase.value}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium">{fase.label}</span>
                              <span className="text-sm text-muted-foreground">
                                {faseOpps.length} opp. • {formatCurrency(faseValue)}
                              </span>
                            </div>
                            <div className="h-3 bg-muted rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${fase.color} transition-all`} 
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </ScrollArea>
        </Tabs>
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedAttivita?.id ? "Modifica Attività" : "Nuova Attività"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveAttivita}>
            <div className="grid gap-4">
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
                <Label htmlFor="oggetto">Oggetto *</Label>
                <Input id="oggetto" name="oggetto" defaultValue={selectedAttivita?.oggetto} required />
              </div>
              <div>
                <Label htmlFor="dataOra">Data e Ora *</Label>
                <Input id="dataOra" name="dataOra" type="datetime-local" defaultValue={selectedAttivita?.dataOra} required />
              </div>
              <div>
                <Label htmlFor="durata">Durata (minuti)</Label>
                <Input id="durata" name="durata" type="number" defaultValue={selectedAttivita?.durata} />
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
                <Label htmlFor="stato">Stato</Label>
                <Select name="stato" defaultValue={selectedAttivita?.stato || "pianificata"}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona stato" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pianificata">Pianificata</SelectItem>
                    <SelectItem value="completata">Completata</SelectItem>
                    <SelectItem value="annullata">Annullata</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="descrizione">Descrizione</Label>
                <Textarea id="descrizione" name="descrizione" defaultValue={selectedAttivita?.descrizione} rows={3} />
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
