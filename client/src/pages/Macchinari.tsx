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
  Cog, 
  Fuel, 
  Euro, 
  Wrench, 
  Calendar,
  Bell,
  Search,
  MoreHorizontal,
  Edit2,
  Trash2,
  Eye,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Settings2,
  TrendingUp,
  Activity,
  Zap,
  Timer,
  BarChart3,
  AlertCircle,
  Building,
  Hash,
  Package,
  Upload,
  FileText,
  Loader2
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { it } from "date-fns/locale";

const STATI_MACCHINARIO = [
  { value: "attivo", label: "Attivo", color: "bg-green-500" },
  { value: "inattivo", label: "Inattivo", color: "bg-gray-500" },
  { value: "in_manutenzione", label: "In Manutenzione", color: "bg-yellow-500" },
  { value: "guasto", label: "Guasto", color: "bg-red-500" },
  { value: "dismesso", label: "Dismesso", color: "bg-gray-700" },
];

const CATEGORIE_MACCHINARIO = [
  { value: "produzione", label: "Produzione" },
  { value: "confezionamento", label: "Confezionamento" },
  { value: "trasporto", label: "Trasporto" },
  { value: "movimentazione", label: "Movimentazione" },
  { value: "utensili", label: "Utensili" },
  { value: "altro", label: "Altro" },
];

const TIPI_CONSUMO = [
  { value: "elettricita", label: "Elettricità", unita: "kWh" },
  { value: "gas", label: "Gas", unita: "m³" },
  { value: "gasolio", label: "Gasolio", unita: "L" },
  { value: "benzina", label: "Benzina", unita: "L" },
  { value: "olio", label: "Olio", unita: "L" },
  { value: "acqua", label: "Acqua", unita: "m³" },
  { value: "altro", label: "Altro", unita: "" },
];

const TIPI_COSTO = [
  { value: "manutenzione", label: "Manutenzione" },
  { value: "riparazione", label: "Riparazione" },
  { value: "ricambi", label: "Ricambi" },
  { value: "assicurazione", label: "Assicurazione" },
  { value: "leasing", label: "Leasing" },
  { value: "noleggio", label: "Noleggio" },
  { value: "certificazione", label: "Certificazione" },
  { value: "altro", label: "Altro" },
];

const TIPI_MANUTENZIONE = [
  { value: "ordinaria", label: "Ordinaria" },
  { value: "straordinaria", label: "Straordinaria" },
  { value: "preventiva", label: "Preventiva" },
  { value: "correttiva", label: "Correttiva" },
  { value: "predittiva", label: "Predittiva" },
];

const PRIORITA = [
  { value: "bassa", label: "Bassa", color: "bg-gray-400" },
  { value: "normale", label: "Normale", color: "bg-blue-400" },
  { value: "alta", label: "Alta", color: "bg-orange-400" },
  { value: "urgente", label: "Urgente", color: "bg-red-500" },
];

const STATI_EVENTO = [
  { value: "pianificato", label: "Pianificato", color: "bg-blue-500" },
  { value: "in_corso", label: "In Corso", color: "bg-yellow-500" },
  { value: "completato", label: "Completato", color: "bg-green-500" },
  { value: "annullato", label: "Annullato", color: "bg-red-500" },
];

function DashboardTab() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/machinery-stats"],
    queryFn: async () => {
      const res = await fetch("/api/machinery-stats");
      if (!res.ok) throw new Error("Errore caricamento statistiche");
      return res.json();
    }
  });

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Clock className="animate-spin h-8 w-8" /></div>;
  }

  const kpis = [
    { label: "Totale Macchinari", value: stats?.totalMachinery || 0, icon: Cog, color: "text-blue-500" },
    { label: "Attivi", value: stats?.activeMachinery || 0, icon: CheckCircle2, color: "text-green-500" },
    { label: "In Manutenzione", value: stats?.inMaintenance || 0, icon: Wrench, color: "text-yellow-500" },
    { label: "Costi Consumi", value: `€${(stats?.totalConsumptionCost || 0).toLocaleString('it-IT', { minimumFractionDigits: 2 })}`, icon: Fuel, color: "text-orange-500" },
    { label: "Costi Manutenzione", value: `€${(stats?.totalMaintenanceCost || 0).toLocaleString('it-IT', { minimumFractionDigits: 2 })}`, icon: Euro, color: "text-red-500" },
    { label: "Manutenzioni Pendenti", value: stats?.pendingMaintenance || 0, icon: Clock, color: "text-purple-500" },
    { label: "Manutenzioni Completate", value: stats?.completedMaintenance || 0, icon: CheckCircle2, color: "text-green-600" },
    { label: "Scadenze Prossime", value: stats?.upcomingMaintenance || 0, icon: Bell, color: "text-amber-500" },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {kpis.map((kpi, idx) => (
          <Card key={idx} className="p-3">
            <div className="flex items-center gap-2">
              <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
              <div>
                <p className="text-[10px] text-muted-foreground">{kpi.label}</p>
                <p className="text-lg font-semibold">{kpi.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function AnagraficaTab() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [importedData, setImportedData] = useState<any>(null);
  const [editingMachinery, setEditingMachinery] = useState<any>(null);
  const [formData, setFormData] = useState({
    codice: "",
    nome: "",
    tipo: "",
    categoria: "",
    marca: "",
    modello: "",
    numeroSerie: "",
    annoAcquisto: "",
    dataAcquisto: "",
    valoreAcquisto: "",
    ubicazione: "",
    reparto: "",
    stato: "attivo",
    potenza: "",
    consumoOrario: "",
    unitaConsumo: "",
    note: ""
  });

  const { data: machineryList = [], isLoading } = useQuery({
    queryKey: ["/api/machinery"],
    queryFn: async () => {
      const res = await fetch("/api/machinery");
      if (!res.ok) throw new Error("Errore caricamento macchinari");
      return res.json();
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/machinery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error("Errore creazione");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/machinery"] });
      queryClient.invalidateQueries({ queryKey: ["/api/machinery-stats"] });
      setDialogOpen(false);
      resetForm();
      toast({ title: "Macchinario creato con successo" });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`/api/machinery/${data.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error("Errore aggiornamento");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/machinery"] });
      queryClient.invalidateQueries({ queryKey: ["/api/machinery-stats"] });
      setDialogOpen(false);
      setEditingMachinery(null);
      resetForm();
      toast({ title: "Macchinario aggiornato con successo" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/machinery/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Errore eliminazione");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/machinery"] });
      queryClient.invalidateQueries({ queryKey: ["/api/machinery-stats"] });
      toast({ title: "Macchinario eliminato" });
    }
  });

  const resetForm = () => {
    setFormData({
      codice: "",
      nome: "",
      tipo: "",
      categoria: "",
      marca: "",
      modello: "",
      numeroSerie: "",
      annoAcquisto: "",
      dataAcquisto: "",
      valoreAcquisto: "",
      ubicazione: "",
      reparto: "",
      stato: "attivo",
      potenza: "",
      consumoOrario: "",
      unitaConsumo: "",
      note: ""
    });
  };

  const handleEdit = (m: any) => {
    setEditingMachinery(m);
    setFormData({
      codice: m.codice || "",
      nome: m.nome || "",
      tipo: m.tipo || "",
      categoria: m.categoria || "",
      marca: m.marca || "",
      modello: m.modello || "",
      numeroSerie: m.numeroSerie || "",
      annoAcquisto: m.annoAcquisto || "",
      dataAcquisto: m.dataAcquisto || "",
      valoreAcquisto: m.valoreAcquisto || "",
      ubicazione: m.ubicazione || "",
      reparto: m.reparto || "",
      stato: m.stato || "attivo",
      potenza: m.potenza || "",
      consumoOrario: m.consumoOrario || "",
      unitaConsumo: m.unitaConsumo || "",
      note: m.note || ""
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.codice || !formData.nome) {
      toast({ title: "Compila codice e nome", variant: "destructive" });
      return;
    }
    if (editingMachinery) {
      updateMutation.mutate({ ...formData, id: editingMachinery.id });
    } else {
      createMutation.mutate(formData);
    }
  };

  const filteredList = machineryList.filter((m: any) =>
    m.nome?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.codice?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.marca?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleImportSchedaTecnica = async (file: File) => {
    setImportLoading(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append("file", file);
      
      const res = await fetch("/api/machinery/import-scheda-tecnica", {
        method: "POST",
        body: formDataUpload
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Errore nell'elaborazione");
      }
      
      const data = await res.json();
      setImportedData(data);
      toast({ title: "Scheda tecnica analizzata", description: "Verifica i dati estratti" });
    } catch (error: any) {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    } finally {
      setImportLoading(false);
    }
  };

  const handleConfirmImport = () => {
    if (!importedData) return;
    
    const codice = `MAC-${Date.now().toString(36).toUpperCase()}`;
    
    setFormData({
      codice: codice,
      nome: importedData.nome || "",
      tipo: importedData.tipo || "",
      categoria: importedData.categoria || "",
      marca: importedData.marca || "",
      modello: importedData.modello || "",
      numeroSerie: importedData.numeroSerie || "",
      annoAcquisto: importedData.annoFabbricazione || "",
      dataAcquisto: "",
      valoreAcquisto: "",
      ubicazione: "",
      reparto: "",
      stato: "attivo",
      potenza: importedData.potenza || "",
      consumoOrario: importedData.consumoOrario || "",
      unitaConsumo: importedData.unitaConsumo || "",
      note: [
        importedData.dimensioni ? `Dimensioni: ${importedData.dimensioni}` : null,
        importedData.peso ? `Peso: ${importedData.peso} kg` : null,
        importedData.alimentazione ? `Alimentazione: ${importedData.alimentazione}` : null,
        importedData.tensione ? `Tensione: ${importedData.tensione}` : null,
        importedData.certificazioni?.length ? `Certificazioni: ${importedData.certificazioni.join(", ")}` : null,
        importedData.manutenzioneConsigliata ? `Manutenzione: ${importedData.manutenzioneConsigliata}` : null
      ].filter(Boolean).join(" | ")
    });
    
    setImportDialogOpen(false);
    setImportedData(null);
    setEditingMachinery(null);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cerca macchinari..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-xs"
          />
        </div>
        <Button size="sm" variant="outline" onClick={() => setImportDialogOpen(true)}>
          <Upload className="h-3 w-3 mr-1" /> Importa PDF
        </Button>
        <Button size="sm" onClick={() => { resetForm(); setEditingMachinery(null); setDialogOpen(true); }}>
          <Plus className="h-3 w-3 mr-1" /> Nuovo
        </Button>
      </div>

      <ScrollArea className="h-[calc(100vh-280px)]">
        <div className="space-y-2">
          {filteredList.map((m: any) => {
            const statoInfo = STATI_MACCHINARIO.find(s => s.value === m.stato);
            return (
              <Card key={m.id} className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Cog className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-xs">{m.nome}</span>
                        <Badge variant="outline" className="text-[9px]">{m.codice}</Badge>
                        <Badge className={`text-[9px] ${statoInfo?.color || 'bg-gray-500'}`}>
                          {statoInfo?.label || m.stato}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-muted-foreground mt-0.5">
                        {m.marca && <span>{m.marca} {m.modello}</span>}
                        {m.ubicazione && <span className="flex items-center gap-1"><Building className="h-3 w-3" />{m.ubicazione}</span>}
                        {m.oreLavoro > 0 && <span className="flex items-center gap-1"><Timer className="h-3 w-3" />{m.oreLavoro}h</span>}
                      </div>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(m)}>
                        <Edit2 className="h-3 w-3 mr-2" /> Modifica
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600" onClick={() => deleteMutation.mutate(m.id)}>
                        <Trash2 className="h-3 w-3 mr-2" /> Elimina
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </Card>
            );
          })}
          {filteredList.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Nessun macchinario trovato
            </div>
          )}
        </div>
      </ScrollArea>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-sm">{editingMachinery ? "Modifica Macchinario" : "Nuovo Macchinario"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Codice *</Label>
              <Input className="h-8 text-xs" value={formData.codice} onChange={(e) => setFormData({...formData, codice: e.target.value})} />
            </div>
            <div>
              <Label className="text-xs">Nome *</Label>
              <Input className="h-8 text-xs" value={formData.nome} onChange={(e) => setFormData({...formData, nome: e.target.value})} />
            </div>
            <div>
              <Label className="text-xs">Categoria</Label>
              <Select value={formData.categoria} onValueChange={(v) => setFormData({...formData, categoria: v})}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Seleziona" /></SelectTrigger>
                <SelectContent>
                  {CATEGORIE_MACCHINARIO.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Stato</Label>
              <Select value={formData.stato} onValueChange={(v) => setFormData({...formData, stato: v})}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATI_MACCHINARIO.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Marca</Label>
              <Input className="h-8 text-xs" value={formData.marca} onChange={(e) => setFormData({...formData, marca: e.target.value})} />
            </div>
            <div>
              <Label className="text-xs">Modello</Label>
              <Input className="h-8 text-xs" value={formData.modello} onChange={(e) => setFormData({...formData, modello: e.target.value})} />
            </div>
            <div>
              <Label className="text-xs">Numero Serie</Label>
              <Input className="h-8 text-xs" value={formData.numeroSerie} onChange={(e) => setFormData({...formData, numeroSerie: e.target.value})} />
            </div>
            <div>
              <Label className="text-xs">Anno Acquisto</Label>
              <Input className="h-8 text-xs" type="number" value={formData.annoAcquisto} onChange={(e) => setFormData({...formData, annoAcquisto: e.target.value})} />
            </div>
            <div>
              <Label className="text-xs">Data Acquisto</Label>
              <Input className="h-8 text-xs" type="date" value={formData.dataAcquisto} onChange={(e) => setFormData({...formData, dataAcquisto: e.target.value})} />
            </div>
            <div>
              <Label className="text-xs">Valore Acquisto (€)</Label>
              <Input className="h-8 text-xs" type="number" step="0.01" value={formData.valoreAcquisto} onChange={(e) => setFormData({...formData, valoreAcquisto: e.target.value})} />
            </div>
            <div>
              <Label className="text-xs">Ubicazione</Label>
              <Input className="h-8 text-xs" value={formData.ubicazione} onChange={(e) => setFormData({...formData, ubicazione: e.target.value})} />
            </div>
            <div>
              <Label className="text-xs">Reparto</Label>
              <Input className="h-8 text-xs" value={formData.reparto} onChange={(e) => setFormData({...formData, reparto: e.target.value})} />
            </div>
            <div>
              <Label className="text-xs">Potenza (kW)</Label>
              <Input className="h-8 text-xs" value={formData.potenza} onChange={(e) => setFormData({...formData, potenza: e.target.value})} />
            </div>
            <div>
              <Label className="text-xs">Consumo Orario</Label>
              <Input className="h-8 text-xs" value={formData.consumoOrario} onChange={(e) => setFormData({...formData, consumoOrario: e.target.value})} />
            </div>
            <div className="col-span-2">
              <Label className="text-xs">Note</Label>
              <Textarea className="text-xs min-h-[60px]" value={formData.note} onChange={(e) => setFormData({...formData, note: e.target.value})} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>Annulla</Button>
            <Button size="sm" onClick={handleSubmit}>{editingMachinery ? "Salva" : "Crea"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={importDialogOpen} onOpenChange={(open) => { setImportDialogOpen(open); if (!open) setImportedData(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-sm flex items-center gap-2">
              <FileText className="h-4 w-4" /> Importa Scheda Tecnica
            </DialogTitle>
            <DialogDescription className="text-xs">
              Carica un PDF della scheda tecnica del macchinario per estrarre automaticamente le informazioni
            </DialogDescription>
          </DialogHeader>
          
          {!importedData ? (
            <div className="space-y-4">
              <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                <input
                  type="file"
                  accept=".pdf"
                  id="scheda-tecnica-upload"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImportSchedaTecnica(file);
                  }}
                  disabled={importLoading}
                />
                <label htmlFor="scheda-tecnica-upload" className="cursor-pointer">
                  {importLoading ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <span className="text-sm text-muted-foreground">Analisi in corso con AI...</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="h-8 w-8 text-muted-foreground" />
                      <span className="text-sm font-medium">Clicca per caricare</span>
                      <span className="text-xs text-muted-foreground">Supportati: PDF schede tecniche macchinari</span>
                    </div>
                  )}
                </label>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-400 mb-2">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="text-sm font-medium">Dati estratti con successo</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="space-y-1 col-span-2 bg-muted/50 p-2 rounded">
                  <span className="text-muted-foreground">Nome Macchinario</span>
                  <p className="font-bold text-sm">{importedData.nome || "N/D"}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground">Tipo</span>
                  <p className="font-medium">{importedData.tipo || "N/D"}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground">Categoria</span>
                  <p className="font-medium">{importedData.categoria || "N/D"}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground">Marca</span>
                  <p className="font-medium">{importedData.marca || "N/D"}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground">Modello</span>
                  <p className="font-medium">{importedData.modello || "N/D"}</p>
                </div>
                {importedData.numeroSerie && (
                  <div className="space-y-1">
                    <span className="text-muted-foreground">N. Serie</span>
                    <p className="font-medium">{importedData.numeroSerie}</p>
                  </div>
                )}
                {importedData.potenza && (
                  <div className="space-y-1">
                    <span className="text-muted-foreground">Potenza</span>
                    <p className="font-medium">{importedData.potenza}</p>
                  </div>
                )}
                {importedData.dimensioni && (
                  <div className="space-y-1">
                    <span className="text-muted-foreground">Dimensioni</span>
                    <p className="font-medium">{importedData.dimensioni}</p>
                  </div>
                )}
                {importedData.peso && (
                  <div className="space-y-1">
                    <span className="text-muted-foreground">Peso</span>
                    <p className="font-medium">{importedData.peso} kg</p>
                  </div>
                )}
                {importedData.alimentazione && (
                  <div className="space-y-1">
                    <span className="text-muted-foreground">Alimentazione</span>
                    <p className="font-medium">{importedData.alimentazione}</p>
                  </div>
                )}
                {importedData.certificazioni?.length > 0 && (
                  <div className="space-y-1 col-span-2">
                    <span className="text-muted-foreground">Certificazioni</span>
                    <div className="flex flex-wrap gap-1">
                      {importedData.certificazioni.map((c: string, i: number) => (
                        <Badge key={i} variant="outline" className="text-[9px]">{c}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {importedData.caratteristicheTecniche?.length > 0 && (
                  <div className="space-y-1 col-span-2">
                    <span className="text-muted-foreground">Caratteristiche Tecniche</span>
                    <ul className="text-[10px] list-disc list-inside">
                      {importedData.caratteristicheTecniche.slice(0, 5).map((c: string, i: number) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              
              <DialogFooter>
                <Button variant="outline" size="sm" onClick={() => { setImportedData(null); }}>Ricarica</Button>
                <Button size="sm" onClick={handleConfirmImport}>
                  <CheckCircle2 className="h-3 w-3 mr-1" /> Usa questi dati
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ConsumiTab() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [importedData, setImportedData] = useState<any>(null);
  const [formData, setFormData] = useState({
    machineryId: "",
    data: new Date().toISOString().split('T')[0],
    tipoConsumo: "",
    quantita: "",
    unitaMisura: "",
    costoUnitario: "",
    oreLavoro: "",
    note: ""
  });

  const { data: consumptions = [] } = useQuery({
    queryKey: ["/api/machinery-consumptions"],
    queryFn: async () => {
      const res = await fetch("/api/machinery-consumptions");
      if (!res.ok) throw new Error("Errore");
      return res.json();
    }
  });

  const { data: machineryList = [] } = useQuery({
    queryKey: ["/api/machinery"],
    queryFn: async () => {
      const res = await fetch("/api/machinery");
      if (!res.ok) throw new Error("Errore");
      return res.json();
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const costoTotale = (parseFloat(data.quantita) * parseFloat(data.costoUnitario || "0")).toFixed(2);
      const res = await fetch("/api/machinery-consumptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, costoTotale })
      });
      if (!res.ok) throw new Error("Errore");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/machinery-consumptions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/machinery-stats"] });
      setDialogOpen(false);
      toast({ title: "Consumo registrato" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/machinery-consumptions/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Errore");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/machinery-consumptions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/machinery-stats"] });
      toast({ title: "Consumo eliminato" });
    }
  });

  const getMachineryName = (id: string) => machineryList.find((m: any) => m.id === id)?.nome || "-";

  const handleImportBolletta = async (file: File) => {
    setImportLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      
      const res = await fetch("/api/machinery/import-bolletta", {
        method: "POST",
        body: formData
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Errore nell'elaborazione");
      }
      
      const data = await res.json();
      setImportedData(data);
      toast({ title: "Bolletta analizzata", description: "Verifica i dati estratti" });
    } catch (error: any) {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    } finally {
      setImportLoading(false);
    }
  };

  const handleConfirmImport = () => {
    if (!importedData) return;
    
    const tipoConsumo = importedData.tipoUtenza === "gas" ? "gas" : "elettricita";
    const tipoInfo = TIPI_CONSUMO.find(t => t.value === tipoConsumo);
    
    setFormData({
      machineryId: "",
      data: importedData.periodoFine || new Date().toISOString().split('T')[0],
      tipoConsumo: tipoConsumo,
      quantita: String(importedData.consumoTotale || ""),
      unitaMisura: importedData.unitaMisura || tipoInfo?.unita || "",
      costoUnitario: importedData.costoUnitario || "",
      oreLavoro: "",
      note: `Fornitore: ${importedData.fornitore || "N/D"} | POD/PDR: ${importedData.podPdr || "N/D"} | Periodo: ${importedData.periodoInizio || ""} - ${importedData.periodoFine || ""} | Totale bolletta: €${importedData.totale || 0}`
    });
    
    setImportDialogOpen(false);
    setImportedData(null);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-end gap-2">
        <Button size="sm" variant="outline" onClick={() => setImportDialogOpen(true)}>
          <Upload className="h-3 w-3 mr-1" /> Importa Bolletta
        </Button>
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="h-3 w-3 mr-1" /> Registra Consumo
        </Button>
      </div>

      <ScrollArea className="h-[calc(100vh-280px)]">
        <div className="space-y-2">
          {consumptions.map((c: any) => (
            <Card key={c.id} className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                    <Fuel className="h-4 w-4 text-orange-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-xs">{getMachineryName(c.machineryId)}</span>
                      <Badge variant="outline" className="text-[9px]">{TIPI_CONSUMO.find(t => t.value === c.tipoConsumo)?.label || c.tipoConsumo}</Badge>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground mt-0.5">
                      <span>{c.data}</span>
                      <span>{c.quantita} {c.unitaMisura}</span>
                      {c.costoTotale && <span className="text-orange-600">€{parseFloat(c.costoTotale).toLocaleString('it-IT', { minimumFractionDigits: 2 })}</span>}
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500" onClick={() => deleteMutation.mutate(c.id)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </Card>
          ))}
          {consumptions.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Nessun consumo registrato
            </div>
          )}
        </div>
      </ScrollArea>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm">Registra Consumo</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Macchinario *</Label>
              <Select value={formData.machineryId} onValueChange={(v) => setFormData({...formData, machineryId: v})}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Seleziona" /></SelectTrigger>
                <SelectContent>
                  {machineryList.map((m: any) => <SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Data</Label>
              <Input className="h-8 text-xs" type="date" value={formData.data} onChange={(e) => setFormData({...formData, data: e.target.value})} />
            </div>
            <div>
              <Label className="text-xs">Tipo Consumo *</Label>
              <Select value={formData.tipoConsumo} onValueChange={(v) => {
                const tipo = TIPI_CONSUMO.find(t => t.value === v);
                setFormData({...formData, tipoConsumo: v, unitaMisura: tipo?.unita || ""});
              }}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Seleziona" /></SelectTrigger>
                <SelectContent>
                  {TIPI_CONSUMO.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Quantità *</Label>
                <Input className="h-8 text-xs" type="number" step="0.01" value={formData.quantita} onChange={(e) => setFormData({...formData, quantita: e.target.value})} />
              </div>
              <div>
                <Label className="text-xs">Unità</Label>
                <Input className="h-8 text-xs" value={formData.unitaMisura} onChange={(e) => setFormData({...formData, unitaMisura: e.target.value})} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Costo Unitario (€)</Label>
                <Input className="h-8 text-xs" type="number" step="0.01" value={formData.costoUnitario} onChange={(e) => setFormData({...formData, costoUnitario: e.target.value})} />
              </div>
              <div>
                <Label className="text-xs">Ore Lavoro</Label>
                <Input className="h-8 text-xs" type="number" step="0.5" value={formData.oreLavoro} onChange={(e) => setFormData({...formData, oreLavoro: e.target.value})} />
              </div>
            </div>
            <div>
              <Label className="text-xs">Note</Label>
              <Textarea className="text-xs min-h-[50px]" value={formData.note} onChange={(e) => setFormData({...formData, note: e.target.value})} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>Annulla</Button>
            <Button size="sm" onClick={() => createMutation.mutate(formData)}>Registra</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={importDialogOpen} onOpenChange={(open) => { setImportDialogOpen(open); if (!open) setImportedData(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-sm flex items-center gap-2">
              <FileText className="h-4 w-4" /> Importa Bolletta Gas/Luce
            </DialogTitle>
            <DialogDescription className="text-xs">
              Carica una bolletta in PDF per estrarre automaticamente i dati di consumo con l'AI
            </DialogDescription>
          </DialogHeader>
          
          {!importedData ? (
            <div className="space-y-4">
              <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                <input
                  type="file"
                  accept=".pdf"
                  id="bolletta-upload"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImportBolletta(file);
                  }}
                  disabled={importLoading}
                />
                <label htmlFor="bolletta-upload" className="cursor-pointer">
                  {importLoading ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <span className="text-sm text-muted-foreground">Analisi in corso con AI...</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="h-8 w-8 text-muted-foreground" />
                      <span className="text-sm font-medium">Clicca per caricare</span>
                      <span className="text-xs text-muted-foreground">Supportati: PDF bollette gas e luce</span>
                    </div>
                  )}
                </label>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-400 mb-2">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="text-sm font-medium">Dati estratti con successo</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="space-y-1">
                  <span className="text-muted-foreground">Tipo Utenza</span>
                  <p className="font-medium flex items-center gap-1">
                    {importedData.tipoUtenza === "gas" ? <Fuel className="h-3 w-3" /> : <Zap className="h-3 w-3" />}
                    {importedData.tipoUtenza === "gas" ? "Gas" : "Elettricità"}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground">Fornitore</span>
                  <p className="font-medium">{importedData.fornitore || "N/D"}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground">POD/PDR</span>
                  <p className="font-medium text-[10px]">{importedData.podPdr || "N/D"}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground">Periodo</span>
                  <p className="font-medium">{importedData.periodoInizio} - {importedData.periodoFine}</p>
                </div>
                <div className="space-y-1 col-span-2 bg-muted/50 p-2 rounded">
                  <span className="text-muted-foreground">Consumo Totale</span>
                  <p className="font-bold text-lg text-primary">{importedData.consumoTotale} {importedData.unitaMisura}</p>
                </div>
                {importedData.costoEnergia && (
                  <div className="space-y-1">
                    <span className="text-muted-foreground">Costo Energia</span>
                    <p className="font-medium">€{Number(importedData.costoEnergia).toFixed(2)}</p>
                  </div>
                )}
                {importedData.costoTrasporto && (
                  <div className="space-y-1">
                    <span className="text-muted-foreground">Trasporto</span>
                    <p className="font-medium">€{Number(importedData.costoTrasporto).toFixed(2)}</p>
                  </div>
                )}
                {importedData.totale && (
                  <div className="space-y-1 col-span-2 bg-primary/10 p-2 rounded">
                    <span className="text-muted-foreground">Totale Bolletta</span>
                    <p className="font-bold text-lg">€{Number(importedData.totale).toFixed(2)}</p>
                    {importedData.costoUnitario && (
                      <p className="text-[10px] text-muted-foreground">Costo unitario: €{importedData.costoUnitario}/{importedData.unitaMisura}</p>
                    )}
                  </div>
                )}
              </div>
              
              <DialogFooter>
                <Button variant="outline" size="sm" onClick={() => { setImportedData(null); }}>Ricarica</Button>
                <Button size="sm" onClick={handleConfirmImport}>
                  <CheckCircle2 className="h-3 w-3 mr-1" /> Usa questi dati
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CostiTab() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    machineryId: "",
    data: new Date().toISOString().split('T')[0],
    tipoCosto: "",
    descrizione: "",
    importo: "",
    fatturaRif: "",
    note: ""
  });

  const { data: costs = [] } = useQuery({
    queryKey: ["/api/machinery-costs"],
    queryFn: async () => {
      const res = await fetch("/api/machinery-costs");
      if (!res.ok) throw new Error("Errore");
      return res.json();
    }
  });

  const { data: machineryList = [] } = useQuery({
    queryKey: ["/api/machinery"],
    queryFn: async () => {
      const res = await fetch("/api/machinery");
      if (!res.ok) throw new Error("Errore");
      return res.json();
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/machinery-costs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error("Errore");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/machinery-costs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/machinery-stats"] });
      setDialogOpen(false);
      toast({ title: "Costo registrato" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/machinery-costs/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Errore");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/machinery-costs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/machinery-stats"] });
      toast({ title: "Costo eliminato" });
    }
  });

  const getMachineryName = (id: string) => machineryList.find((m: any) => m.id === id)?.nome || "-";

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="h-3 w-3 mr-1" /> Registra Costo
        </Button>
      </div>

      <ScrollArea className="h-[calc(100vh-280px)]">
        <div className="space-y-2">
          {costs.map((c: any) => (
            <Card key={c.id} className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                    <Euro className="h-4 w-4 text-red-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-xs">{getMachineryName(c.machineryId)}</span>
                      <Badge variant="outline" className="text-[9px]">{TIPI_COSTO.find(t => t.value === c.tipoCosto)?.label || c.tipoCosto}</Badge>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground mt-0.5">
                      <span>{c.data}</span>
                      {c.descrizione && <span>{c.descrizione}</span>}
                      <span className="text-red-600 font-medium">€{parseFloat(c.importo).toLocaleString('it-IT', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500" onClick={() => deleteMutation.mutate(c.id)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </Card>
          ))}
          {costs.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Nessun costo registrato
            </div>
          )}
        </div>
      </ScrollArea>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm">Registra Costo</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Macchinario *</Label>
              <Select value={formData.machineryId} onValueChange={(v) => setFormData({...formData, machineryId: v})}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Seleziona" /></SelectTrigger>
                <SelectContent>
                  {machineryList.map((m: any) => <SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Data</Label>
              <Input className="h-8 text-xs" type="date" value={formData.data} onChange={(e) => setFormData({...formData, data: e.target.value})} />
            </div>
            <div>
              <Label className="text-xs">Tipo Costo *</Label>
              <Select value={formData.tipoCosto} onValueChange={(v) => setFormData({...formData, tipoCosto: v})}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Seleziona" /></SelectTrigger>
                <SelectContent>
                  {TIPI_COSTO.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Descrizione</Label>
              <Input className="h-8 text-xs" value={formData.descrizione} onChange={(e) => setFormData({...formData, descrizione: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Importo (€) *</Label>
                <Input className="h-8 text-xs" type="number" step="0.01" value={formData.importo} onChange={(e) => setFormData({...formData, importo: e.target.value})} />
              </div>
              <div>
                <Label className="text-xs">Rif. Fattura</Label>
                <Input className="h-8 text-xs" value={formData.fatturaRif} onChange={(e) => setFormData({...formData, fatturaRif: e.target.value})} />
              </div>
            </div>
            <div>
              <Label className="text-xs">Note</Label>
              <Textarea className="text-xs min-h-[50px]" value={formData.note} onChange={(e) => setFormData({...formData, note: e.target.value})} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>Annulla</Button>
            <Button size="sm" onClick={() => createMutation.mutate(formData)}>Registra</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PianiManutenzioneTab() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    machineryId: "",
    nome: "",
    tipo: "",
    descrizione: "",
    frequenza: "",
    intervalloGiorni: "",
    prossimaScadenza: "",
    costoStimato: "",
    priorita: "normale"
  });

  const { data: plans = [] } = useQuery({
    queryKey: ["/api/maintenance-plans"],
    queryFn: async () => {
      const res = await fetch("/api/maintenance-plans");
      if (!res.ok) throw new Error("Errore");
      return res.json();
    }
  });

  const { data: machineryList = [] } = useQuery({
    queryKey: ["/api/machinery"],
    queryFn: async () => {
      const res = await fetch("/api/machinery");
      if (!res.ok) throw new Error("Errore");
      return res.json();
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/maintenance-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error("Errore");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/maintenance-plans"] });
      setDialogOpen(false);
      toast({ title: "Piano creato" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/maintenance-plans/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Errore");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/maintenance-plans"] });
      toast({ title: "Piano eliminato" });
    }
  });

  const getMachineryName = (id: string) => machineryList.find((m: any) => m.id === id)?.nome || "-";

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="h-3 w-3 mr-1" /> Nuovo Piano
        </Button>
      </div>

      <ScrollArea className="h-[calc(100vh-280px)]">
        <div className="space-y-2">
          {plans.map((p: any) => {
            const prioritaInfo = PRIORITA.find(pr => pr.value === p.priorita);
            return (
              <Card key={p.id} className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                      <Calendar className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-xs">{p.nome}</span>
                        <Badge variant="outline" className="text-[9px]">{TIPI_MANUTENZIONE.find(t => t.value === p.tipo)?.label || p.tipo}</Badge>
                        <Badge className={`text-[9px] ${prioritaInfo?.color || 'bg-gray-400'}`}>{prioritaInfo?.label || p.priorita}</Badge>
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-muted-foreground mt-0.5">
                        <span>{getMachineryName(p.machineryId)}</span>
                        {p.frequenza && <span>Ogni {p.frequenza}</span>}
                        {p.prossimaScadenza && <span className="text-amber-600">Scadenza: {p.prossimaScadenza}</span>}
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500" onClick={() => deleteMutation.mutate(p.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </Card>
            );
          })}
          {plans.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Nessun piano di manutenzione
            </div>
          )}
        </div>
      </ScrollArea>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm">Nuovo Piano di Manutenzione</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Macchinario *</Label>
              <Select value={formData.machineryId} onValueChange={(v) => setFormData({...formData, machineryId: v})}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Seleziona" /></SelectTrigger>
                <SelectContent>
                  {machineryList.map((m: any) => <SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Nome Piano *</Label>
              <Input className="h-8 text-xs" value={formData.nome} onChange={(e) => setFormData({...formData, nome: e.target.value})} />
            </div>
            <div>
              <Label className="text-xs">Tipo *</Label>
              <Select value={formData.tipo} onValueChange={(v) => setFormData({...formData, tipo: v})}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Seleziona" /></SelectTrigger>
                <SelectContent>
                  {TIPI_MANUTENZIONE.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Descrizione</Label>
              <Textarea className="text-xs min-h-[50px]" value={formData.descrizione} onChange={(e) => setFormData({...formData, descrizione: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Frequenza</Label>
                <Input className="h-8 text-xs" placeholder="es. 30 giorni" value={formData.frequenza} onChange={(e) => setFormData({...formData, frequenza: e.target.value})} />
              </div>
              <div>
                <Label className="text-xs">Intervallo (giorni)</Label>
                <Input className="h-8 text-xs" type="number" value={formData.intervalloGiorni} onChange={(e) => setFormData({...formData, intervalloGiorni: e.target.value})} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Prossima Scadenza</Label>
                <Input className="h-8 text-xs" type="date" value={formData.prossimaScadenza} onChange={(e) => setFormData({...formData, prossimaScadenza: e.target.value})} />
              </div>
              <div>
                <Label className="text-xs">Priorità</Label>
                <Select value={formData.priorita} onValueChange={(v) => setFormData({...formData, priorita: v})}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PRIORITA.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>Annulla</Button>
            <Button size="sm" onClick={() => createMutation.mutate(formData)}>Crea</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EventiManutenzioneTab() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    machineryId: "",
    tipo: "",
    titolo: "",
    descrizione: "",
    dataPianificata: "",
    stato: "pianificato",
    costoManodopera: "",
    costoRicambi: ""
  });

  const { data: events = [] } = useQuery({
    queryKey: ["/api/maintenance-events"],
    queryFn: async () => {
      const res = await fetch("/api/maintenance-events");
      if (!res.ok) throw new Error("Errore");
      return res.json();
    }
  });

  const { data: machineryList = [] } = useQuery({
    queryKey: ["/api/machinery"],
    queryFn: async () => {
      const res = await fetch("/api/machinery");
      if (!res.ok) throw new Error("Errore");
      return res.json();
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const costoTotale = ((parseFloat(data.costoManodopera) || 0) + (parseFloat(data.costoRicambi) || 0)).toFixed(2);
      const res = await fetch("/api/maintenance-events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, costoTotale })
      });
      if (!res.ok) throw new Error("Errore");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/maintenance-events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/machinery-stats"] });
      setDialogOpen(false);
      toast({ title: "Evento creato" });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, stato }: { id: string; stato: string }) => {
      const dataEsecuzione = stato === "completato" ? new Date().toISOString().split('T')[0] : undefined;
      const res = await fetch(`/api/maintenance-events/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stato, dataEsecuzione })
      });
      if (!res.ok) throw new Error("Errore");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/maintenance-events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/machinery-stats"] });
      toast({ title: "Stato aggiornato" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/maintenance-events/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Errore");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/maintenance-events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/machinery-stats"] });
      toast({ title: "Evento eliminato" });
    }
  });

  const getMachineryName = (id: string) => machineryList.find((m: any) => m.id === id)?.nome || "-";

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="h-3 w-3 mr-1" /> Nuovo Evento
        </Button>
      </div>

      <ScrollArea className="h-[calc(100vh-280px)]">
        <div className="space-y-2">
          {events.map((e: any) => {
            const statoInfo = STATI_EVENTO.find(s => s.value === e.stato);
            return (
              <Card key={e.id} className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <Wrench className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-xs">{e.titolo}</span>
                        <Badge className={`text-[9px] ${statoInfo?.color || 'bg-gray-500'}`}>{statoInfo?.label || e.stato}</Badge>
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-muted-foreground mt-0.5">
                        <span>{getMachineryName(e.machineryId)}</span>
                        {e.dataPianificata && <span>Pianificato: {e.dataPianificata}</span>}
                        {e.costoTotale && <span className="text-red-600">€{parseFloat(e.costoTotale).toLocaleString('it-IT', { minimumFractionDigits: 2 })}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {e.stato === "pianificato" && (
                      <Button variant="outline" size="sm" className="h-6 text-[10px]" onClick={() => updateMutation.mutate({ id: e.id, stato: "in_corso" })}>
                        Avvia
                      </Button>
                    )}
                    {e.stato === "in_corso" && (
                      <Button variant="outline" size="sm" className="h-6 text-[10px] text-green-600" onClick={() => updateMutation.mutate({ id: e.id, stato: "completato" })}>
                        Completa
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500" onClick={() => deleteMutation.mutate(e.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
          {events.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Nessun evento di manutenzione
            </div>
          )}
        </div>
      </ScrollArea>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm">Nuovo Evento di Manutenzione</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Macchinario *</Label>
              <Select value={formData.machineryId} onValueChange={(v) => setFormData({...formData, machineryId: v})}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Seleziona" /></SelectTrigger>
                <SelectContent>
                  {machineryList.map((m: any) => <SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Titolo *</Label>
              <Input className="h-8 text-xs" value={formData.titolo} onChange={(e) => setFormData({...formData, titolo: e.target.value})} />
            </div>
            <div>
              <Label className="text-xs">Tipo *</Label>
              <Select value={formData.tipo} onValueChange={(v) => setFormData({...formData, tipo: v})}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Seleziona" /></SelectTrigger>
                <SelectContent>
                  {TIPI_MANUTENZIONE.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Data Pianificata</Label>
              <Input className="h-8 text-xs" type="date" value={formData.dataPianificata} onChange={(e) => setFormData({...formData, dataPianificata: e.target.value})} />
            </div>
            <div>
              <Label className="text-xs">Descrizione</Label>
              <Textarea className="text-xs min-h-[50px]" value={formData.descrizione} onChange={(e) => setFormData({...formData, descrizione: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Costo Manodopera (€)</Label>
                <Input className="h-8 text-xs" type="number" step="0.01" value={formData.costoManodopera} onChange={(e) => setFormData({...formData, costoManodopera: e.target.value})} />
              </div>
              <div>
                <Label className="text-xs">Costo Ricambi (€)</Label>
                <Input className="h-8 text-xs" type="number" step="0.01" value={formData.costoRicambi} onChange={(e) => setFormData({...formData, costoRicambi: e.target.value})} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>Annulla</Button>
            <Button size="sm" onClick={() => createMutation.mutate(formData)}>Crea</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AvvisiTab() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: alerts = [] } = useQuery({
    queryKey: ["/api/maintenance-alerts"],
    queryFn: async () => {
      const res = await fetch("/api/maintenance-alerts");
      if (!res.ok) throw new Error("Errore");
      return res.json();
    }
  });

  const { data: machineryList = [] } = useQuery({
    queryKey: ["/api/machinery"],
    queryFn: async () => {
      const res = await fetch("/api/machinery");
      if (!res.ok) throw new Error("Errore");
      return res.json();
    }
  });

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/maintenance-alerts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ letto: true })
      });
      if (!res.ok) throw new Error("Errore");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/maintenance-alerts"] });
    }
  });

  const archiveMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/maintenance-alerts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archiviato: true })
      });
      if (!res.ok) throw new Error("Errore");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/maintenance-alerts"] });
      toast({ title: "Avviso archiviato" });
    }
  });

  const getMachineryName = (id: string) => machineryList.find((m: any) => m.id === id)?.nome || "-";

  return (
    <div className="space-y-3">
      <ScrollArea className="h-[calc(100vh-240px)]">
        <div className="space-y-2">
          {alerts.map((a: any) => {
            const prioritaInfo = PRIORITA.find(p => p.value === a.priorita);
            return (
              <Card key={a.id} className={`p-3 ${!a.letto ? 'border-l-4 border-l-amber-500' : ''}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                      <Bell className="h-4 w-4 text-amber-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-xs">{a.messaggio}</span>
                        <Badge className={`text-[9px] ${prioritaInfo?.color || 'bg-gray-400'}`}>{prioritaInfo?.label || a.priorita}</Badge>
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-muted-foreground mt-0.5">
                        <span>{getMachineryName(a.machineryId)}</span>
                        {a.dataScadenza && <span>Scadenza: {a.dataScadenza}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {!a.letto && (
                      <Button variant="outline" size="sm" className="h-6 text-[10px]" onClick={() => markReadMutation.mutate(a.id)}>
                        Letto
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => archiveMutation.mutate(a.id)}>
                      <CheckCircle2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
          {alerts.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Nessun avviso attivo
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

export default function Macchinari() {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <AppLayout>
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Macchinari</h1>
            <p className="text-xs text-muted-foreground">Gestione macchinari, consumi e manutenzioni</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-7 w-full h-auto p-1">
            <TabsTrigger value="dashboard" className="flex flex-col items-center gap-1 py-2 px-1 data-[state=active]:bg-primary/20">
              <BarChart3 className="h-4 w-4" />
              <span className="text-[9px]">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="anagrafica" className="flex flex-col items-center gap-1 py-2 px-1 data-[state=active]:bg-primary/20">
              <Cog className="h-4 w-4" />
              <span className="text-[9px]">Anagrafica</span>
            </TabsTrigger>
            <TabsTrigger value="consumi" className="flex flex-col items-center gap-1 py-2 px-1 data-[state=active]:bg-primary/20">
              <Fuel className="h-4 w-4" />
              <span className="text-[9px]">Consumi</span>
            </TabsTrigger>
            <TabsTrigger value="costi" className="flex flex-col items-center gap-1 py-2 px-1 data-[state=active]:bg-primary/20">
              <Euro className="h-4 w-4" />
              <span className="text-[9px]">Costi</span>
            </TabsTrigger>
            <TabsTrigger value="piani" className="flex flex-col items-center gap-1 py-2 px-1 data-[state=active]:bg-primary/20">
              <Calendar className="h-4 w-4" />
              <span className="text-[9px]">Piani</span>
            </TabsTrigger>
            <TabsTrigger value="eventi" className="flex flex-col items-center gap-1 py-2 px-1 data-[state=active]:bg-primary/20">
              <Wrench className="h-4 w-4" />
              <span className="text-[9px]">Eventi</span>
            </TabsTrigger>
            <TabsTrigger value="avvisi" className="flex flex-col items-center gap-1 py-2 px-1 data-[state=active]:bg-primary/20">
              <Bell className="h-4 w-4" />
              <span className="text-[9px]">Avvisi</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="mt-4">
            <DashboardTab />
          </TabsContent>
          <TabsContent value="anagrafica" className="mt-4">
            <AnagraficaTab />
          </TabsContent>
          <TabsContent value="consumi" className="mt-4">
            <ConsumiTab />
          </TabsContent>
          <TabsContent value="costi" className="mt-4">
            <CostiTab />
          </TabsContent>
          <TabsContent value="piani" className="mt-4">
            <PianiManutenzioneTab />
          </TabsContent>
          <TabsContent value="eventi" className="mt-4">
            <EventiManutenzioneTab />
          </TabsContent>
          <TabsContent value="avvisi" className="mt-4">
            <AvvisiTab />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
