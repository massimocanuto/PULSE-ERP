import { useState, useEffect, useRef } from "react";
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
  Package, 
  Factory, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  RefreshCw, 
  Search,
  MoreHorizontal,
  Edit2,
  Trash2,
  Eye,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Clock,
  Boxes,
  ClipboardList,
  FileText,
  Settings2,
  Printer,
  Tag,
  Truck,
  MapPin,
  ExternalLink,
  Copy,
  Route,
  Loader2,
  Download,
  Navigation,
  Building,
  Mail,
  PenTool,
  Send,
  Link,
  Maximize2,
  Minimize2
} from "lucide-react";
import JsBarcode from "jsbarcode";
import { jsPDF } from "jspdf";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { lazy, Suspense } from "react";

import { ShipmentMap } from "@/components/ShipmentMap";
import { CopyLinkButton } from "@/components/CopyLinkButton";
import { SignaturePad } from "@/components/SignaturePad";
import CatalogoArticoli from "./CatalogoArticoli";

const UNITA_MISURA = [
  { value: "pz", label: "Pezzi" },
  { value: "kg", label: "Chilogrammi" },
  { value: "lt", label: "Litri" },
  { value: "m", label: "Metri" },
  { value: "m2", label: "Metri quadri" },
  { value: "m3", label: "Metri cubi" },
];

const STATI_ORDINE = [
  { value: "pianificato", label: "Pianificato", color: "bg-blue-500" },
  { value: "in_corso", label: "In Corso", color: "bg-yellow-500" },
  { value: "completato", label: "Completato", color: "bg-green-500" },
  { value: "sospeso", label: "Sospeso", color: "bg-orange-500" },
  { value: "annullato", label: "Annullato", color: "bg-red-500" },
];

const PRIORITA = [
  { value: "bassa", label: "Bassa", color: "bg-gray-400" },
  { value: "normale", label: "Normale", color: "bg-blue-400" },
  { value: "alta", label: "Alta", color: "bg-orange-400" },
  { value: "urgente", label: "Urgente", color: "bg-red-500" },
];

const TIPI_MOVIMENTO = [
  { value: "carico", label: "Carico", icon: ArrowUpCircle, color: "text-green-600" },
  { value: "scarico", label: "Scarico", icon: ArrowDownCircle, color: "text-red-600" },
  { value: "rettifica", label: "Rettifica", icon: RefreshCw, color: "text-blue-600" },
];

const CAUSALI = [
  { value: "acquisto", label: "Acquisto" },
  { value: "vendita", label: "Vendita" },
  { value: "produzione", label: "Produzione" },
  { value: "reso", label: "Reso" },
  { value: "inventario", label: "Inventario" },
  { value: "consumo", label: "Consumo interno" },
];

const STATI_SPEDIZIONE = [
  { value: "da_preparare", label: "Da Preparare", color: "bg-gray-500" },
  { value: "in_preparazione", label: "In Preparazione", color: "bg-yellow-500" },
  { value: "pronta", label: "Pronta", color: "bg-blue-500" },
  { value: "spedita", label: "Spedita", color: "bg-purple-500" },
  { value: "consegnata", label: "Consegnata", color: "bg-green-500" },
  { value: "annullata", label: "Annullata", color: "bg-red-500" },
];

function SpedizioniTab() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStato, setFilterStato] = useState<string>("tutti");
  const [spedizioneDialogOpen, setSpedizioneDialogOpen] = useState(false);
  const [selectedSpedizione, setSelectedSpedizione] = useState<any>(null);
  const [corriereDialogOpen, setCorriereDialogOpen] = useState(false);
  const [selectedCorriere, setSelectedCorriere] = useState<any>(null);
  const [showMap, setShowMap] = useState(false);
  const [mapAddress, setMapAddress] = useState({ indirizzo: "", citta: "", cap: "" });
  const [reportPercorsoOpen, setReportPercorsoOpen] = useState(false);
  const [reportPercorsoLoading, setReportPercorsoLoading] = useState(false);
  const [reportPercorsoData, setReportPercorsoData] = useState<any>(null);
  const [ddtLines, setDdtLines] = useState<any[]>([]);
  const [confirmedItems, setConfirmedItems] = useState<Set<string>>(new Set());
  const [loadingDdtLines, setLoadingDdtLines] = useState(false);
  const [firmaDialogOpen, setFirmaDialogOpen] = useState(false);
  const [firmaSpedizioneId, setFirmaSpedizioneId] = useState<string | null>(null);
  const [savingFirma, setSavingFirma] = useState(false);
  const [sendingNotifica, setSendingNotifica] = useState<string | null>(null);
  const [generatingLink, setGeneratingLink] = useState<string | null>(null);

  const generateCourierLink = async (spedizioneId: string) => {
    try {
      setGeneratingLink(spedizioneId);
      const res = await fetch(`/api/spedizioni/${spedizioneId}/genera-link-corriere`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Errore generazione link");
      }
      await navigator.clipboard.writeText(data.link);
      toast({
        title: "Link generato e copiato",
        description: "Il link per il corriere è stato copiato negli appunti. Valido 24 ore.",
      });
    } catch (error: any) {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setGeneratingLink(null);
    }
  };

  const loadDdtLines = async (ddtId: string) => {
    if (!ddtId) {
      setDdtLines([]);
      return;
    }
    setLoadingDdtLines(true);
    try {
      const res = await fetch(`/api/finance/ddt/${ddtId}`);
      if (res.ok) {
        const data = await res.json();
        setDdtLines(data.lines || []);
        setConfirmedItems(new Set());
      }
    } catch (error) {
      console.error("Errore caricamento righe DDT:", error);
    } finally {
      setLoadingDdtLines(false);
    }
  };

  const toggleItemConfirm = (lineId: string) => {
    setConfirmedItems(prev => {
      const next = new Set(prev);
      if (next.has(lineId)) {
        next.delete(lineId);
      } else {
        next.add(lineId);
      }
      return next;
    });
  };

  const allItemsConfirmed = ddtLines.length > 0 && ddtLines.every(line => confirmedItems.has(line.id));

  const { data: spedizioni = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/spedizioni"],
  });

  const { data: corrieri = [] } = useQuery<any[]>({
    queryKey: ["/api/corrieri"],
  });

  const { data: clienti = [] } = useQuery<any[]>({
    queryKey: ["/api/anagrafica/clienti"],
  });

  const { data: ddtList = [] } = useQuery<any[]>({
    queryKey: ["/api/finance/ddt"],
  });

  const { data: companyInfo } = useQuery<any>({
    queryKey: ["/api/company-info"],
  });

  const createSpedizioneMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/spedizioni", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Errore creazione");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/spedizioni"] });
      queryClient.invalidateQueries({ queryKey: ["/api/finance/ddt"] });
      setSpedizioneDialogOpen(false);
      setSelectedSpedizione(null);
      toast({ title: "Spedizione creata", description: "La spedizione è stata registrata" });
    },
  });

  const updateSpedizioneMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const res = await fetch(`/api/spedizioni/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Errore aggiornamento");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/spedizioni"] });
      queryClient.invalidateQueries({ queryKey: ["/api/finance/ddt"] });
      setSpedizioneDialogOpen(false);
      setSelectedSpedizione(null);
      toast({ title: "Salvato", description: "Spedizione aggiornata" });
    },
  });

  const deleteSpedizioneMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/spedizioni/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Errore eliminazione");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/spedizioni"] });
      toast({ title: "Eliminata", description: "Spedizione rimossa" });
    },
  });

  const createCorriereMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/corrieri", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Errore creazione");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/corrieri"] });
      setCorriereDialogOpen(false);
      setSelectedCorriere(null);
      toast({ title: "Corriere aggiunto" });
    },
  });

  const filteredSpedizioni = spedizioni.filter((s: any) => {
    const matchesSearch = !searchQuery || 
      s.numero?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.destinatario?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.numeroTracking?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStato = filterStato === "tutti" || s.stato === filterStato;
    return matchesSearch && matchesStato;
  });

  const getClienteName = (id: string) => clienti.find((c: any) => c.id === id)?.ragioneSociale || "-";
  const getCorriereName = (id: string) => corrieri.find((c: any) => c.id === id)?.nome || "-";

  const handleSpedizioneSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    // For new shipments, stato is required
    const stato = formData.get("stato") as string;
    if (!selectedSpedizione?.id && !stato) {
      toast({ title: "Errore", description: "Seleziona lo stato della spedizione", variant: "destructive" });
      return;
    }

    const data: any = {
      numero: formData.get("numero"),
      data: formData.get("data"),
      clienteId: formData.get("clienteId") || null,
      corriereId: formData.get("corriereId") || null,
      destinatario: formData.get("destinatario"),
      indirizzoDestinazione: formData.get("indirizzoDestinazione"),
      capDestinazione: formData.get("capDestinazione"),
      cittaDestinazione: formData.get("cittaDestinazione"),
      provinciaDestinazione: formData.get("provinciaDestinazione"),
      telefonoDestinazione: formData.get("telefonoDestinazione"),
      referenteDestinazione: formData.get("referenteDestinazione"),
      stato: stato || selectedSpedizione?.stato,
      numeroTracking: formData.get("numeroTracking"),
      numeroColli: parseInt(formData.get("numeroColli") as string) || 1,
      pesoTotale: formData.get("pesoTotale"),
      notePreparazione: formData.get("notePreparazione"),
      noteConsegna: formData.get("noteConsegna"),
      ddtId: selectedSpedizione?.ddtId || null,
    };

    if (allItemsConfirmed && selectedSpedizione?.ddtId) {
      try {
        await fetch(`/api/finance/ddt/${selectedSpedizione.ddtId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ stato: "in_spedizione" }),
        });
        queryClient.invalidateQueries({ queryKey: ["/api/finance/ddt"] });
        toast({ title: "DDT aggiornato", description: "Lo stato del DDT è passato a 'In Spedizione'" });
      } catch (error) {
        console.error("Errore aggiornamento DDT:", error);
      }
    }

    if (selectedSpedizione?.id) {
      updateSpedizioneMutation.mutate({ id: selectedSpedizione.id, ...data });
    } else {
      createSpedizioneMutation.mutate(data);
    }
  };

  const openNewSpedizione = async () => {
    setDdtLines([]);
    setConfirmedItems(new Set());
    try {
      const res = await fetch("/api/spedizioni/next-numero");
      const { numero } = await res.json();
      setSelectedSpedizione({ numero, data: new Date().toISOString().split("T")[0] });
      setSpedizioneDialogOpen(true);
    } catch {
      setSelectedSpedizione({ numero: "", data: new Date().toISOString().split("T")[0] });
      setSpedizioneDialogOpen(true);
    }
  };

  const handleSaveFirma = async (firmaData: string, nomeFirmatario: string) => {
    if (!firmaSpedizioneId) return;
    setSavingFirma(true);
    try {
      const res = await fetch(`/api/spedizioni/${firmaSpedizioneId}/firma`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firmaDestinatario: firmaData, nomeFirmatario }),
      });
      if (res.ok) {
        toast({ title: "Firma salvata", description: "La consegna è stata confermata con firma" });
        queryClient.invalidateQueries({ queryKey: ["/api/spedizioni"] });
        setFirmaDialogOpen(false);
        setFirmaSpedizioneId(null);
      } else {
        const err = await res.json();
        toast({ title: "Errore", description: err.error || "Errore nel salvataggio della firma", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Errore", description: "Errore nel salvataggio della firma", variant: "destructive" });
    } finally {
      setSavingFirma(false);
    }
  };

  const sendNotificaPartenza = async (spedizioneId: string, email?: string) => {
    setSendingNotifica(spedizioneId);
    try {
      const res = await fetch(`/api/spedizioni/${spedizioneId}/notifica-partenza`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        toast({ title: "Notifica inviata", description: "Email di partenza inviata al cliente" });
        queryClient.invalidateQueries({ queryKey: ["/api/spedizioni"] });
      } else {
        const err = await res.json();
        toast({ title: "Errore", description: err.error || "Errore nell'invio della notifica", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Errore", description: "Errore nell'invio della notifica", variant: "destructive" });
    } finally {
      setSendingNotifica(null);
    }
  };

  const sendNotificaConsegna = async (spedizioneId: string, email?: string) => {
    setSendingNotifica(spedizioneId);
    try {
      const res = await fetch(`/api/spedizioni/${spedizioneId}/notifica-consegna`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        toast({ title: "Notifica inviata", description: "Email di consegna inviata al cliente" });
        queryClient.invalidateQueries({ queryKey: ["/api/spedizioni"] });
      } else {
        const err = await res.json();
        toast({ title: "Errore", description: err.error || "Errore nell'invio della notifica", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Errore", description: "Errore nell'invio della notifica", variant: "destructive" });
    } finally {
      setSendingNotifica(null);
    }
  };

  const loadReportPercorso = async () => {
    setReportPercorsoLoading(true);
    setReportPercorsoOpen(true);
    try {
      const res = await fetch("/api/spedizioni/report-percorso");
      const data = await res.json();
      setReportPercorsoData(data);
    } catch (error) {
      toast({ title: "Errore", description: "Impossibile caricare il report del percorso", variant: "destructive" });
    } finally {
      setReportPercorsoLoading(false);
    }
  };

  const formatDuration = (minutes: number) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hrs > 0) return `${hrs}h ${mins}min`;
    return `${mins}min`;
  };

  const generateReportPdf = () => {
    if (!reportPercorsoData?.stops?.length) return;
    
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const today = new Date().toLocaleDateString("it-IT", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
    
    // Header blu
    doc.setFillColor(59, 130, 246);
    doc.rect(0, 0, pageWidth, 25, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("FOGLIO DI VIAGGIO", 14, 16);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(today, pageWidth - 14, 16, { align: "right" });
    
    doc.setTextColor(0, 0, 0);
    
    // Info partenza
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Partenza:", 14, 35);
    doc.setFont("helvetica", "normal");
    doc.text(reportPercorsoData.originName || "Sede Aziendale", 40, 35);
    
    // Riepilogo box grigio
    doc.setFillColor(240, 240, 240);
    doc.rect(14, 40, pageWidth - 28, 18, "F");
    doc.setFontSize(10);
    doc.text(`Tappe: ${reportPercorsoData.stops.length}`, 20, 50);
    doc.text(`Distanza totale: ${reportPercorsoData.totalDistance} km`, 60, 50);
    doc.text(`Tempo stimato: ${formatDuration(reportPercorsoData.totalDuration)}`, 120, 50);
    
    // Tabella header
    let y = 68;
    doc.setFillColor(59, 130, 246);
    doc.rect(14, y - 5, pageWidth - 28, 8, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("#", 16, y);
    doc.text("Tipo", 24, y);
    doc.text("Doc.", 40, y);
    doc.text("Cliente", 62, y);
    doc.text("Indirizzo", 105, y);
    doc.text("Arrivo", 160, y);
    doc.text("Firma", 180, y);
    
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");
    y += 10;
    
    // Righe destinazioni
    for (let i = 0; i < reportPercorsoData.stops.length; i++) {
      const stop = reportPercorsoData.stops[i];
      
      if (y > 250) {
        doc.addPage();
        y = 20;
      }
      
      // Sfondo alternato
      if (i % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(14, y - 4, pageWidth - 28, 14, "F");
      }
      
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text(stop.ordine.toString(), 17, y);
      
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      
      // Tipo badge colorato
      if (stop.tipo === "ddt") {
        doc.setFillColor(139, 92, 246);
      } else {
        doc.setFillColor(59, 130, 246);
      }
      doc.roundedRect(24, y - 3, 14, 5, 1, 1, "F");
      doc.setTextColor(255, 255, 255);
      doc.text(stop.tipo === "ddt" ? "DDT" : "SPED", 26, y);
      doc.setTextColor(0, 0, 0);
      
      doc.setFontSize(8);
      doc.text((stop.numero || "").substring(0, 14), 40, y);
      doc.text((stop.cliente || "N/D").substring(0, 24), 62, y);
      
      // Indirizzo
      const addr = stop.indirizzo || "";
      if (addr.length > 28) {
        doc.text(addr.substring(0, 28), 105, y - 2);
        doc.text(addr.substring(28, 52), 105, y + 2);
      } else {
        doc.text(addr, 105, y);
      }
      
      // Orario arrivo
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text(stop.arrivoStimato ? new Date(stop.arrivoStimato).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }) : "-", 162, y);
      
      // Box firma vuoto
      doc.setDrawColor(200, 200, 200);
      doc.rect(177, y - 4, 18, 12);
      
      y += 16;
    }
    
    // Footer con note autista
    if (y > 230) {
      doc.addPage();
      y = 20;
    }
    
    y += 10;
    doc.setDrawColor(200, 200, 200);
    doc.line(14, y, pageWidth - 14, y);
    y += 8;
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Note Autista:", 14, y);
    y += 5;
    doc.setDrawColor(220, 220, 220);
    for (let i = 0; i < 4; i++) {
      doc.line(14, y + (i * 8), pageWidth - 14, y + (i * 8));
    }
    
    doc.save(`foglio-viaggio-${new Date().toISOString().split("T")[0]}.pdf`);
    toast({ title: "PDF generato", description: "Foglio di viaggio scaricato" });
  };

  const loadClienteAddress = (clienteId: string) => {
    const cliente = clienti.find((c: any) => c.id === clienteId);
    if (cliente) {
      setSelectedSpedizione((prev: any) => ({
        ...(prev ?? {}),
        clienteId,
        destinatario: cliente.ragioneSociale,
        indirizzoDestinazione: cliente.indirizzo,
        capDestinazione: cliente.cap,
        cittaDestinazione: cliente.citta,
        provinciaDestinazione: cliente.provincia,
        telefonoDestinazione: cliente.telefono,
        referenteDestinazione: cliente.referente,
        ddtId: prev?.ddtId,
      }));
    }
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cerca spedizione..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 w-64"
            />
          </div>
          <Select value={filterStato} onValueChange={setFilterStato}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Stato" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tutti">Tutti gli stati</SelectItem>
              {STATI_SPEDIZIONE.map(s => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={loadReportPercorso}>
            <Route className="h-4 w-4 mr-2" />
            Report Percorso
          </Button>
          <Button variant="outline" onClick={() => setCorriereDialogOpen(true)}>
            <Settings2 className="h-4 w-4 mr-2" />
            Corrieri
          </Button>
          <Button onClick={openNewSpedizione}>
            <Plus className="h-4 w-4 mr-2" />
            Nuova Spedizione
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-4">
        {STATI_SPEDIZIONE.filter(s => s.value !== "annullata").map(stato => (
          <Card key={stato.value} className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-3 h-3 rounded-full ${stato.color}`} />
              <span className="text-sm font-medium">{stato.label}</span>
            </div>
            <p className="text-lg font-bold">
              {spedizioni.filter((s: any) => s.stato === stato.value).length}
            </p>
          </Card>
        ))}
      </div>

      {(() => {
        const ddtDaPreparare = ddtList.filter((d: any) => d.stato === "bozza" || d.stato === "in_preparazione");
        const ddtInSpedizione = ddtList.filter((d: any) => d.stato === "in_spedizione");
        if (ddtDaPreparare.length === 0 && ddtInSpedizione.length === 0) return null;
        return (
          <div className="space-y-4">
            {ddtDaPreparare.length > 0 && (
              <Card className="border-red-200 bg-red-50/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-5 w-5 text-red-500" />
                    DDT da Evadere
                    <Badge variant="destructive" className="ml-2">{ddtDaPreparare.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="max-h-[200px]">
                    <table className="w-full text-sm">
                      <thead className="bg-red-100/50 sticky top-0">
                        <tr>
                          <th className="text-left px-4 py-2 font-medium">Numero DDT</th>
                          <th className="text-left px-4 py-2 font-medium">Data</th>
                          <th className="text-left px-4 py-2 font-medium">Cliente</th>
                          <th className="text-left px-4 py-2 font-medium">Destinazione</th>
                          <th className="text-left px-4 py-2 font-medium">Stato</th>
                          <th className="text-center px-4 py-2 font-medium">Azione</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ddtDaPreparare.map((ddt: any) => {
                          const cliente = clienti.find((c: any) => c.id === ddt.clienteId);
                          return (
                            <tr key={ddt.id} className="border-t border-red-100 bg-red-50/30 hover:bg-red-100/50">
                              <td className="px-4 py-2 font-mono font-semibold">{ddt.numero}</td>
                              <td className="px-4 py-2">{ddt.data}</td>
                              <td className="px-4 py-2">{ddt.ragioneSociale || cliente?.ragioneSociale || "-"}</td>
                              <td className="px-4 py-2">
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3 text-muted-foreground" />
                                  <span className="truncate max-w-[150px]">
                                    {ddt.luogoDestinazione || ddt.citta || cliente?.citta || "-"}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-2">
                                <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300">
                                  {ddt.stato === "in_preparazione" ? "In Preparazione" : "Bozza"} - Da Evadere
                                </Badge>
                              </td>
                              <td className="px-4 py-2 text-center">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  className="border-red-300 text-red-700 hover:bg-red-100"
                                  onClick={async () => {
                                    const prefillData = {
                                      clienteId: ddt.clienteId,
                                      ddtId: ddt.id,
                                      destinatario: ddt.ragioneSociale || cliente?.ragioneSociale,
                                      indirizzoDestinazione: ddt.indirizzo || cliente?.indirizzo,
                                      capDestinazione: ddt.cap || cliente?.cap,
                                      cittaDestinazione: ddt.citta || cliente?.citta,
                                      provinciaDestinazione: ddt.provincia || cliente?.provincia,
                                      telefonoDestinazione: cliente?.telefono,
                                      referenteDestinazione: cliente?.referente,
                                    };
                                    try {
                                      const res = await fetch("/api/spedizioni/next-numero");
                                      const { numero } = await res.json();
                                      setSelectedSpedizione({
                                        ...prefillData,
                                        numero,
                                        data: new Date().toISOString().split("T")[0],
                                      });
                                    } catch {
                                      setSelectedSpedizione({
                                        ...prefillData,
                                        numero: "",
                                        data: new Date().toISOString().split("T")[0],
                                      });
                                    }
                                    loadDdtLines(ddt.id);
                                    setSpedizioneDialogOpen(true);
                                  }}
                                >
                                  <Truck className="h-3 w-3 mr-1" />
                                  Evadi DDT
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}

            {ddtInSpedizione.length > 0 && (
              <Card className="border-orange-200 bg-orange-50/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Truck className="h-5 w-5 text-orange-500" />
                    DDT In Spedizione
                    <Badge className="bg-orange-500 ml-2">{ddtInSpedizione.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="max-h-[150px]">
                    <table className="w-full text-sm">
                      <thead className="bg-orange-100/50 sticky top-0">
                        <tr>
                          <th className="text-left px-4 py-2 font-medium">Numero DDT</th>
                          <th className="text-left px-4 py-2 font-medium">Data</th>
                          <th className="text-left px-4 py-2 font-medium">Cliente</th>
                          <th className="text-left px-4 py-2 font-medium">Destinazione</th>
                          <th className="text-left px-4 py-2 font-medium">Stato</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ddtInSpedizione.map((ddt: any) => {
                          const cliente = clienti.find((c: any) => c.id === ddt.clienteId);
                          return (
                            <tr key={ddt.id} className="border-t border-orange-100 bg-orange-50/30 hover:bg-orange-100/50">
                              <td className="px-4 py-2 font-mono font-semibold">{ddt.numero}</td>
                              <td className="px-4 py-2">{ddt.data}</td>
                              <td className="px-4 py-2">{ddt.ragioneSociale || cliente?.ragioneSociale || "-"}</td>
                              <td className="px-4 py-2">
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3 text-muted-foreground" />
                                  <span className="truncate max-w-[150px]">
                                    {ddt.luogoDestinazione || ddt.citta || cliente?.citta || "-"}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-2">
                                <Badge className="bg-orange-500">In Spedizione</Badge>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </div>
        );
      })()}

      <Card>
        <CardContent className="p-0">
          <ScrollArea className="h-[500px]">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 sticky top-0">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Numero</th>
                  <th className="text-left px-4 py-3 font-medium">Data</th>
                  <th className="text-left px-4 py-3 font-medium">Cliente</th>
                  <th className="text-left px-4 py-3 font-medium">Destinazione</th>
                  <th className="text-left px-4 py-3 font-medium">Corriere</th>
                  <th className="text-left px-4 py-3 font-medium">Tracking</th>
                  <th className="text-left px-4 py-3 font-medium">Stato</th>
                  <th className="text-right px-4 py-3 font-medium">Azioni</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={8} className="text-center py-8">Caricamento...</td></tr>
                ) : filteredSpedizioni.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-muted-foreground">
                      <Truck className="h-12 w-12 mx-auto mb-2 opacity-30" />
                      <p>Nessuna spedizione trovata</p>
                      <Button variant="outline" className="mt-4" onClick={openNewSpedizione}>
                        <Plus className="h-4 w-4 mr-2" />
                        Crea la prima spedizione
                      </Button>
                    </td>
                  </tr>
                ) : (
                  filteredSpedizioni.map((spedizione: any) => {
                    const stato = STATI_SPEDIZIONE.find(s => s.value === spedizione.stato);
                    return (
                      <tr key={spedizione.id} className="border-t hover:bg-muted/30">
                        <td className="px-4 py-3 font-mono font-semibold">{spedizione.numero}</td>
                        <td className="px-4 py-3">{spedizione.data}</td>
                        <td className="px-4 py-3">{getClienteName(spedizione.clienteId)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            <span className="truncate max-w-[150px]">
                              {spedizione.cittaDestinazione || spedizione.destinatario || "-"}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">{getCorriereName(spedizione.corriereId)}</td>
                        <td className="px-4 py-3">
                          {spedizione.numeroTracking ? (
                            <span className="font-mono text-xs">{spedizione.numeroTracking}</span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={`${stato?.color} text-white`}>{stato?.label}</Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => { 
                                setSelectedSpedizione(spedizione); 
                                if (spedizione.ddtId) loadDdtLines(spedizione.ddtId);
                                else setDdtLines([]);
                                setSpedizioneDialogOpen(true); 
                              }}>
                                <Edit2 className="h-4 w-4 mr-2" />
                                Modifica
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {
                                setMapAddress({
                                  indirizzo: spedizione.indirizzoDestinazione || "",
                                  citta: spedizione.cittaDestinazione || "",
                                  cap: spedizione.capDestinazione || ""
                                });
                                setShowMap(true);
                              }}>
                                <MapPin className="h-4 w-4 mr-2" />
                                Visualizza Mappa
                              </DropdownMenuItem>
                              {spedizione.stato === "da_preparare" && (
                                <DropdownMenuItem onClick={() => updateSpedizioneMutation.mutate({ id: spedizione.id, stato: "in_preparazione" })}>
                                  <Package className="h-4 w-4 mr-2" />
                                  Inizia Preparazione
                                </DropdownMenuItem>
                              )}
                              {spedizione.stato === "in_preparazione" && (
                                <DropdownMenuItem onClick={() => updateSpedizioneMutation.mutate({ id: spedizione.id, stato: "pronta" })}>
                                  <CheckCircle2 className="h-4 w-4 mr-2" />
                                  Segna Pronta
                                </DropdownMenuItem>
                              )}
                              {spedizione.stato === "pronta" && (
                                <>
                                  <DropdownMenuItem onClick={() => updateSpedizioneMutation.mutate({ id: spedizione.id, stato: "spedita", dataSpedizione: new Date().toISOString().split("T")[0] })}>
                                    <Truck className="h-4 w-4 mr-2" />
                                    Segna Spedita
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => generateCourierLink(spedizione.id)}
                                    disabled={generatingLink === spedizione.id}
                                  >
                                    <Link className="h-4 w-4 mr-2" />
                                    {generatingLink === spedizione.id ? "Generando..." : "Link Corriere"}
                                  </DropdownMenuItem>
                                </>
                              )}
                              {spedizione.stato === "spedita" && (
                                <>
                                  <DropdownMenuItem 
                                    onClick={() => generateCourierLink(spedizione.id)}
                                    disabled={generatingLink === spedizione.id}
                                  >
                                    <Link className="h-4 w-4 mr-2" />
                                    {generatingLink === spedizione.id ? "Generando..." : "Link Corriere"}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => {
                                    setFirmaSpedizioneId(spedizione.id);
                                    setFirmaDialogOpen(true);
                                  }}>
                                    <PenTool className="h-4 w-4 mr-2" />
                                    Raccogli Firma
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => updateSpedizioneMutation.mutate({ id: spedizione.id, stato: "consegnata", dataConsegnaEffettiva: new Date().toISOString().split("T")[0] })}>
                                    <CheckCircle2 className="h-4 w-4 mr-2" />
                                    Segna Consegnata
                                  </DropdownMenuItem>
                                </>
                              )}
                              <DropdownMenuSeparator />
                              {(spedizione.stato === "spedita" || spedizione.stato === "pronta") && !spedizione.notificaPartenzaInviata && (
                                <DropdownMenuItem 
                                  onClick={() => sendNotificaPartenza(spedizione.id)}
                                  disabled={sendingNotifica === spedizione.id}
                                >
                                  <Send className="h-4 w-4 mr-2" />
                                  {sendingNotifica === spedizione.id ? "Invio..." : "Notifica Partenza"}
                                </DropdownMenuItem>
                              )}
                              {spedizione.stato === "consegnata" && !spedizione.notificaConsegnaInviata && (
                                <DropdownMenuItem 
                                  onClick={() => sendNotificaConsegna(spedizione.id)}
                                  disabled={sendingNotifica === spedizione.id}
                                >
                                  <Mail className="h-4 w-4 mr-2" />
                                  {sendingNotifica === spedizione.id ? "Invio..." : "Notifica Consegna"}
                                </DropdownMenuItem>
                              )}
                              {(spedizione.notificaPartenzaInviata || spedizione.notificaConsegnaInviata) && (
                                <DropdownMenuItem disabled className="text-green-600">
                                  <CheckCircle2 className="h-4 w-4 mr-2" />
                                  {spedizione.notificaConsegnaInviata ? "Notifica consegna inviata" : "Notifica partenza inviata"}
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-red-600"
                                onClick={() => deleteSpedizioneMutation.mutate(spedizione.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Elimina
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </ScrollArea>
        </CardContent>
      </Card>

      <Dialog open={spedizioneDialogOpen} onOpenChange={setSpedizioneDialogOpen}>
        <DialogContent className={`${ddtLines.length > 0 ? "max-w-7xl" : "max-w-2xl"} max-h-[85vh] overflow-y-auto`}>
          <DialogHeader>
            <DialogTitle>{selectedSpedizione?.id ? "Modifica Spedizione" : "Nuova Spedizione"}</DialogTitle>
          </DialogHeader>
          <div className={`${ddtLines.length > 0 ? "grid grid-cols-6 gap-4" : ""}`}>
          <form name="spedizioneForm" onSubmit={handleSpedizioneSubmit} className={`space-y-4 ${ddtLines.length > 0 ? "col-span-3" : ""}`}>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Numero *</Label>
                <Input name="numero" required defaultValue={selectedSpedizione?.numero} />
              </div>
              <div className="space-y-2">
                <Label>Data *</Label>
                <Input name="data" type="date" required defaultValue={selectedSpedizione?.data} />
              </div>
              <div className="space-y-2">
                <Label>Stato *</Label>
                <Select name="stato" required defaultValue={selectedSpedizione?.stato || ""}>
                  <SelectTrigger><SelectValue placeholder={selectedSpedizione?.id ? undefined : "Seleziona stato"} /></SelectTrigger>
                  <SelectContent>
                    {STATI_SPEDIZIONE.map(s => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cliente</Label>
                <Select 
                  name="clienteId" 
                  defaultValue={selectedSpedizione?.clienteId || ""}
                  onValueChange={(v) => loadClienteAddress(v)}
                >
                  <SelectTrigger><SelectValue placeholder="Seleziona cliente" /></SelectTrigger>
                  <SelectContent>
                    {clienti.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>{c.ragioneSociale}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Corriere</Label>
                <Select name="corriereId" defaultValue={selectedSpedizione?.corriereId || ""}>
                  <SelectTrigger><SelectValue placeholder="Seleziona corriere" /></SelectTrigger>
                  <SelectContent>
                    {corrieri.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="border rounded-lg p-4 space-y-3">
              <p className="font-medium text-sm flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Indirizzo di Destinazione
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-2">
                  <Label>Destinatario</Label>
                  <Input name="destinatario" defaultValue={selectedSpedizione?.destinatario} />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>Indirizzo</Label>
                  <Input name="indirizzoDestinazione" defaultValue={selectedSpedizione?.indirizzoDestinazione} />
                </div>
                <div className="space-y-2">
                  <Label>Città</Label>
                  <Input name="cittaDestinazione" defaultValue={selectedSpedizione?.cittaDestinazione} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label>CAP</Label>
                    <Input name="capDestinazione" defaultValue={selectedSpedizione?.capDestinazione} />
                  </div>
                  <div className="space-y-2">
                    <Label>Prov.</Label>
                    <Input name="provinciaDestinazione" defaultValue={selectedSpedizione?.provinciaDestinazione} maxLength={2} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Telefono</Label>
                  <Input name="telefonoDestinazione" defaultValue={selectedSpedizione?.telefonoDestinazione} />
                </div>
                <div className="space-y-2">
                  <Label>Referente</Label>
                  <Input name="referenteDestinazione" defaultValue={selectedSpedizione?.referenteDestinazione} />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={() => {
                  const form = document.querySelector('form[name="spedizioneForm"]') as HTMLFormElement;
                  const formData = form ? new FormData(form) : null;
                  const indirizzo = formData?.get("indirizzoDestinazione")?.toString() || selectedSpedizione?.indirizzoDestinazione || "";
                  const citta = formData?.get("cittaDestinazione")?.toString() || selectedSpedizione?.cittaDestinazione || "";
                  const cap = formData?.get("capDestinazione")?.toString() || selectedSpedizione?.capDestinazione || "";
                  
                  if (!indirizzo && !citta) {
                    toast({ 
                      title: "Errore", 
                      description: "Inserisci almeno indirizzo o città per visualizzare la mappa", 
                      variant: "destructive" 
                    });
                    return;
                  }
                  
                  setMapAddress({
                    indirizzo,
                    citta,
                    cap
                  });
                  setShowMap(true);
                }}
                className="flex items-center gap-2"
              >
                <MapPin className="h-4 w-4" />
                Visualizza Mappa Percorso
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>N° Tracking</Label>
                <Input name="numeroTracking" defaultValue={selectedSpedizione?.numeroTracking} placeholder="Numero tracking corriere" />
              </div>
              <div className="space-y-2">
                <Label>N° Colli</Label>
                <Input name="numeroColli" type="number" min="1" defaultValue={selectedSpedizione?.numeroColli || 1} />
              </div>
              <div className="space-y-2">
                <Label>Peso (kg)</Label>
                <Input name="pesoTotale" defaultValue={selectedSpedizione?.pesoTotale} placeholder="0.00" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Note Preparazione</Label>
                <Textarea name="notePreparazione" defaultValue={selectedSpedizione?.notePreparazione} rows={2} />
              </div>
              <div className="space-y-2">
                <Label>Note Consegna</Label>
                <Textarea name="noteConsegna" defaultValue={selectedSpedizione?.noteConsegna} rows={2} />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setSpedizioneDialogOpen(false)}>Annulla</Button>
              <Button type="submit">{selectedSpedizione?.id ? "Salva" : "Crea Spedizione"}</Button>
            </DialogFooter>
          </form>

          {ddtLines.length > 0 && (
            <div className="col-span-3 border-l pl-4">
              <div className="flex items-center gap-2 mb-3">
                <ClipboardList className="h-4 w-4 text-orange-500" />
                <h3 className="font-semibold text-sm">Articoli DDT da Prelevare</h3>
              </div>
              {loadingDdtLines ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  <ScrollArea className="max-h-[400px]">
                    <div className="space-y-2">
                      {ddtLines.map((line: any, index: number) => (
                        <div 
                          key={line.id} 
                          className={`p-3 rounded-lg border transition-colors ${
                            confirmedItems.has(line.id) 
                              ? "bg-green-50 border-green-300" 
                              : "bg-gray-50 border-gray-200"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <Checkbox
                              id={`item-${line.id}`}
                              checked={confirmedItems.has(line.id)}
                              onCheckedChange={() => toggleItemConfirm(line.id)}
                              className="mt-0.5"
                            />
                            <div className="flex-1 min-w-0">
                              <label 
                                htmlFor={`item-${line.id}`}
                                className={`text-sm font-medium cursor-pointer ${
                                  confirmedItems.has(line.id) ? "line-through text-muted-foreground" : ""
                                }`}
                              >
                                {index + 1}. {line.descrizione}
                              </label>
                              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                <span className="font-mono bg-gray-200 px-1.5 py-0.5 rounded">
                                  Q.tà: {line.quantita} {line.unitaMisura || "pz"}
                                </span>
                              </div>
                            </div>
                            {confirmedItems.has(line.id) && (
                              <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                  
                  <div className="mt-4 pt-3 border-t">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Avanzamento:</span>
                      <span className="font-medium">
                        {confirmedItems.size} / {ddtLines.length} articoli
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-500 transition-all duration-300"
                        style={{ width: `${(confirmedItems.size / ddtLines.length) * 100}%` }}
                      />
                    </div>
                    {allItemsConfirmed && (
                      <div className="mt-3 p-2 bg-green-100 border border-green-300 rounded-lg">
                        <p className="text-xs text-green-700 font-medium flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Tutti gli articoli confermati! Il DDT passerà a "In Spedizione" al salvataggio.
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={corriereDialogOpen} onOpenChange={setCorriereDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gestione Corrieri</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="border rounded-lg divide-y max-h-[200px] overflow-y-auto">
              {corrieri.length === 0 ? (
                <p className="p-4 text-center text-muted-foreground text-sm">Nessun corriere configurato</p>
              ) : (
                corrieri.map((c: any) => (
                  <div key={c.id} className="p-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{c.nome}</p>
                      {c.telefono && <p className="text-xs text-muted-foreground">{c.telefono}</p>}
                    </div>
                    <Badge variant="outline">{c.codice || "-"}</Badge>
                  </div>
                ))
              )}
            </div>
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                createCorriereMutation.mutate({
                  nome: formData.get("nome"),
                  codice: formData.get("codice"),
                  telefono: formData.get("telefono"),
                });
                e.currentTarget.reset();
              }}
              className="border rounded-lg p-3 space-y-3"
            >
              <p className="font-medium text-sm">Aggiungi Corriere</p>
              <div className="grid grid-cols-3 gap-2">
                <Input name="nome" placeholder="Nome *" required />
                <Input name="codice" placeholder="Codice" />
                <Input name="telefono" placeholder="Telefono" />
              </div>
              <Button type="submit" size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Aggiungi
              </Button>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={reportPercorsoOpen} onOpenChange={setReportPercorsoOpen}>
        <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Route className="h-5 w-5" />
              Report Percorso Ottimizzato
            </DialogTitle>
            <DialogDescription>
              Itinerario ottimizzato per spedizioni e DDT con tempi e distanze
            </DialogDescription>
          </DialogHeader>
          
          {reportPercorsoLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Calcolo percorso ottimizzato in corso...</p>
              <p className="text-xs text-muted-foreground mt-2">Geocodifica indirizzi e calcolo route...</p>
            </div>
          ) : reportPercorsoData?.stops?.length ? (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <Card className="p-4 bg-blue-50 dark:bg-blue-950/30">
                  <div className="flex items-center gap-2">
                    <Navigation className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-xs text-muted-foreground">Tappe</p>
                      <p className="text-xl font-bold">{reportPercorsoData.stops.length}</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-4 bg-green-50 dark:bg-green-950/30">
                  <div className="flex items-center gap-2">
                    <Route className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-xs text-muted-foreground">Distanza Totale</p>
                      <p className="text-xl font-bold">{reportPercorsoData.totalDistance} km</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-4 bg-orange-50 dark:bg-orange-950/30">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-orange-600" />
                    <div>
                      <p className="text-xs text-muted-foreground">Tempo Totale</p>
                      <p className="text-xl font-bold">{formatDuration(reportPercorsoData.totalDuration)}</p>
                    </div>
                  </div>
                </Card>
              </div>
              
              {reportPercorsoData.originName && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <Building className="h-4 w-4" />
                  <span>Partenza da: <strong className="text-foreground">{reportPercorsoData.originName}</strong></span>
                </div>
              )}
              
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left px-3 py-2 font-medium w-12">#</th>
                      <th className="text-left px-3 py-2 font-medium">Tipo</th>
                      <th className="text-left px-3 py-2 font-medium">Documento</th>
                      <th className="text-left px-3 py-2 font-medium">Cliente</th>
                      <th className="text-left px-3 py-2 font-medium">Indirizzo</th>
                      <th className="text-right px-3 py-2 font-medium">Tratta</th>
                      <th className="text-right px-3 py-2 font-medium">Totale</th>
                      <th className="text-right px-3 py-2 font-medium">Arrivo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportPercorsoData.stops.map((stop: any, idx: number) => (
                      <tr key={`${stop.tipo}-${stop.id}`} className="border-t hover:bg-muted/30">
                        <td className="px-3 py-2 font-bold text-lg text-blue-600">{stop.ordine}</td>
                        <td className="px-3 py-2">
                          <Badge variant={stop.tipo === "ddt" ? "secondary" : "default"} className="text-xs">
                            {stop.tipo === "ddt" ? "DDT" : "SPED"}
                          </Badge>
                        </td>
                        <td className="px-3 py-2">
                          <Badge variant="outline">{stop.numero}</Badge>
                        </td>
                        <td className="px-3 py-2 font-medium">{stop.cliente || "N/D"}</td>
                        <td className="px-3 py-2 text-muted-foreground text-xs">{stop.indirizzo}</td>
                        <td className="px-3 py-2 text-right">
                          <span className="text-xs">{stop.distanzaTratta} km</span>
                          <span className="text-muted-foreground text-xs ml-1">({stop.durataTratta}min)</span>
                        </td>
                        <td className="px-3 py-2 text-right font-medium">
                          {stop.distanzaCumulativa} km
                          <span className="text-muted-foreground text-xs block">{formatDuration(stop.durataCumulativa)}</span>
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-sm">
                          {stop.arrivoStimato ? new Date(stop.arrivoStimato).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }) : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Mappa con tutte le destinazioni */}
              {reportPercorsoData.stops.length > 0 && (
                <Card className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Mappa Destinazioni
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="h-[300px] w-full">
                      <iframe
                        width="100%"
                        height="100%"
                        frameBorder="0"
                        scrolling="no"
                        src={(() => {
                          const stops = reportPercorsoData.stops;
                          if (stops.length === 1) {
                            const s = stops[0];
                            return `https://www.openstreetmap.org/export/embed.html?bbox=${(s.lon - 0.05).toFixed(4)}%2C${(s.lat - 0.03).toFixed(4)}%2C${(s.lon + 0.05).toFixed(4)}%2C${(s.lat + 0.03).toFixed(4)}&layer=mapnik&marker=${s.lat.toFixed(4)}%2C${s.lon.toFixed(4)}`;
                          }
                          const lats = stops.map((s: any) => s.lat);
                          const lons = stops.map((s: any) => s.lon);
                          const minLat = Math.min(...lats) - 0.02;
                          const maxLat = Math.max(...lats) + 0.02;
                          const minLon = Math.min(...lons) - 0.02;
                          const maxLon = Math.max(...lons) + 0.02;
                          const centerLat = (minLat + maxLat) / 2;
                          const centerLon = (minLon + maxLon) / 2;
                          return `https://www.openstreetmap.org/export/embed.html?bbox=${minLon.toFixed(4)}%2C${minLat.toFixed(4)}%2C${maxLon.toFixed(4)}%2C${maxLat.toFixed(4)}&layer=mapnik&marker=${centerLat.toFixed(4)}%2C${centerLon.toFixed(4)}`;
                        })()}
                        style={{ border: 0 }}
                        title="Mappa destinazioni"
                      />
                    </div>
                    <div className="p-3 bg-muted/30 flex justify-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const stops = reportPercorsoData.stops;
                          const waypoints = stops.map((s: any) => `${s.lat},${s.lon}`).join("/");
                          const originLat = 46.5369;
                          const originLon = 12.1357;
                          window.open(`https://www.google.com/maps/dir/${originLat},${originLon}/${waypoints}`, "_blank");
                        }}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Apri in Google Maps
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const stops = reportPercorsoData.stops;
                          const originLat = 46.5369;
                          const originLon = 12.1357;
                          const route = [`${originLat},${originLon}`, ...stops.map((s: any) => `${s.lat},${s.lon}`)].join(";");
                          window.open(`https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${route.replace(/,/g, "%2C").replace(/;/g, "%3B")}`, "_blank");
                        }}
                      >
                        <MapPin className="h-4 w-4 mr-2" />
                        Apri in OpenStreetMap
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setReportPercorsoOpen(false)}>
                  Chiudi
                </Button>
                <Button onClick={generateReportPdf}>
                  <Download className="h-4 w-4 mr-2" />
                  Scarica PDF
                </Button>
              </div>
            </div>
          ) : reportPercorsoData?.error ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <AlertCircle className="h-12 w-12 mb-4 text-orange-500" />
              <p className="font-medium text-foreground">Problema con il report</p>
              <p className="text-sm mt-2">{reportPercorsoData.error}</p>
              <p className="text-xs mt-4">Verifica che i DDT abbiano indirizzi compilati</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Truck className="h-12 w-12 mb-4 opacity-50" />
              <p>Nessun DDT in spedizione trovato</p>
              <p className="text-xs mt-2">Imposta lo stato "In Spedizione" sui DDT per generare il report</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showMap} onOpenChange={setShowMap}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Mappa Percorso Spedizione
            </DialogTitle>
            <DialogDescription>
              {mapAddress.indirizzo && `${mapAddress.indirizzo}, `}
              {mapAddress.citta && `${mapAddress.citta} `}
              {mapAddress.cap && `(${mapAddress.cap})`}
            </DialogDescription>
          </DialogHeader>
          {(mapAddress.indirizzo || mapAddress.citta) ? (
            <ShipmentMap
              destinationAddress={mapAddress.indirizzo}
              destinationCity={mapAddress.citta}
              destinationCap={mapAddress.cap}
              originAddress={companyInfo?.indirizzoOperativo || companyInfo?.indirizzoSede}
              originCity={companyInfo?.cittaOperativo || companyInfo?.cittaSede}
              originCap={companyInfo?.capOperativo || companyInfo?.capSede}
            />
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground border rounded-lg">
              <div className="text-center">
                <MapPin className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Inserisci un indirizzo di destinazione per visualizzare la mappa</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={firmaDialogOpen} onOpenChange={(open) => {
        setFirmaDialogOpen(open);
        if (!open) setFirmaSpedizioneId(null);
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PenTool className="h-5 w-5 text-blue-600" />
              Conferma Consegna
            </DialogTitle>
            <DialogDescription>
              Raccogli la firma del destinatario per confermare la consegna
            </DialogDescription>
          </DialogHeader>
          <SignaturePad
            onSave={handleSaveFirma}
            onCancel={() => {
              setFirmaDialogOpen(false);
              setFirmaSpedizioneId(null);
            }}
            loading={savingFirma}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

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
  return `${integerPart},${decimalPart} €`;
}

export default function Produzione() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Leggi tab da URL params (solo al mount)
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      return params.get("tab") || "dashboard";
    }
    return "dashboard";
  });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [warehouseSubTab, setWarehouseSubTab] = useState("prodotti");
  const [productionSubTab, setProductionSubTab] = useState("ordini");
  const [searchTerm, setSearchTerm] = useState("");
  
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [productCodice, setProductCodice] = useState("");
  const [productCategoriaId, setProductCategoriaId] = useState("");
  const [autoGenerateCodice, setAutoGenerateCodice] = useState(true);
  const [isLoadingCodice, setIsLoadingCodice] = useState(false);
  const [movementDialogOpen, setMovementDialogOpen] = useState(false);
  const [selectedProductForMovement, setSelectedProductForMovement] = useState<any>(null);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [bomDialogOpen, setBomDialogOpen] = useState(false);
  const [selectedBom, setSelectedBom] = useState<any>(null);
  const [bomDetailOpen, setBomDetailOpen] = useState(false);
  const [selectedBomDetail, setSelectedBomDetail] = useState<any>(null);
  const [bomComponents, setBomComponents] = useState<any[]>([]);
  const [newComponent, setNewComponent] = useState({ componenteId: "", quantita: "" });
  const [labelDialogOpen, setLabelDialogOpen] = useState(false);
  const [labelProduct, setLabelProduct] = useState<any>(null);
  const [labelQuantity, setLabelQuantity] = useState(1);
  const [completeOrderDialogOpen, setCompleteOrderDialogOpen] = useState(false);
  const [orderToComplete, setOrderToComplete] = useState<any>(null);
  const [orderArticoli, setOrderArticoli] = useState<any[]>([]);

  const openOrderForEdit = async (order: any) => {
    try {
      // Fetch full order with lines
      const res = await fetch(`/api/production/orders/${order.id}`);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const fullOrder = await res.json();
      setSelectedOrder(fullOrder);
      // Load existing articoli
      if (fullOrder.articoli && Array.isArray(fullOrder.articoli)) {
        setOrderArticoli(fullOrder.articoli.map((a: any) => ({
          codiceArticolo: a.codice_articolo,
          descrizione: a.descrizione,
          quantita: a.quantita,
          unitaMisura: a.unita_misura || 'pz',
        })));
      } else {
        setOrderArticoli([]);
      }
      setOrderDialogOpen(true);
    } catch (error) {
      console.error("Error loading order:", error);
      toast({ title: "Errore nel caricamento dell'ordine", variant: "destructive" });
      // Fallback: use basic order data
      setSelectedOrder(order);
      setOrderArticoli([]);
      setOrderDialogOpen(true);
    }
  };

  useEffect(() => {
    if (labelDialogOpen && labelProduct?.codice) {
      setTimeout(() => {
        const svgElement = document.getElementById(`barcode-preview-${labelProduct.id}`);
        if (svgElement) {
          try {
            JsBarcode(svgElement, labelProduct.codice, {
              format: "CODE128",
              width: 2,
              height: 50,
              displayValue: false,
              margin: 0
            });
          } catch (e) {
            console.error("Error generating barcode:", e);
          }
        }
      }, 100);
    }
  }, [labelDialogOpen, labelProduct]);

  const { data: products = [] } = useQuery({
    queryKey: ["warehouse-products"],
    queryFn: async () => {
      const res = await fetch("/api/warehouse/products");
      return res.json();
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["warehouse-categories"],
    queryFn: async () => {
      const res = await fetch("/api/warehouse/categories");
      return res.json();
    },
  });

  const { data: movements = [] } = useQuery({
    queryKey: ["warehouse-movements"],
    queryFn: async () => {
      const res = await fetch("/api/warehouse/movements");
      return res.json();
    },
  });

  const { data: catalogArticles = [] } = useQuery({
    queryKey: ["/api/catalogo/articoli"],
    queryFn: async () => {
      const res = await fetch("/api/catalogo/articoli");
      return res.json();
    },
  });

  const { data: orders = [] } = useQuery({
    queryKey: ["production-orders"],
    queryFn: async () => {
      const res = await fetch("/api/production/orders");
      return res.json();
    },
  });

  const { data: productionOrders = [], isLoading: productionOrdersLoading } = useQuery({
    queryKey: ["/api/sales-orders/status/production"],
    queryFn: async () => {
      const res = await fetch("/api/sales-orders/status/production");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: boms = [] } = useQuery({
    queryKey: ["production-bom"],
    queryFn: async () => {
      const res = await fetch("/api/production/bom");
      return res.json();
    },
  });

  const { data: articoliSottoscorta = [] } = useQuery({
    queryKey: ["catalogo-sottoscorta"],
    queryFn: async () => {
      const res = await fetch("/api/catalogo/sottoscorta");
      return res.json();
    },
  });

  const createProductMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/warehouse/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouse-products"] });
      setProductDialogOpen(false);
      setSelectedProduct(null);
      toast({ title: "Prodotto creato con successo" });
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await fetch(`/api/warehouse/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Errore nell'aggiornamento");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouse-products"] });
      setProductDialogOpen(false);
      setSelectedProduct(null);
      toast({ title: "Prodotto aggiornato" });
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/warehouse/products/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Errore nell'eliminazione");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouse-products"] });
      toast({ title: "Prodotto eliminato" });
    },
  });

  const createMovementMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/warehouse/movements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouse-movements"] });
      queryClient.invalidateQueries({ queryKey: ["warehouse-products"] });
      setMovementDialogOpen(false);
      setSelectedProductForMovement(null);
      toast({ title: "Movimento registrato" });
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const createCategoryMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/warehouse/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouse-categories"] });
      setCategoryDialogOpen(false);
      setSelectedCategory(null);
      toast({ title: "Categoria creata" });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/warehouse/categories/${id}`, { method: "DELETE" });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouse-categories"] });
      toast({ title: "Categoria eliminata" });
    },
  });

  const createOrderMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/production/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["production-orders"] });
      setOrderDialogOpen(false);
      setSelectedOrder(null);
      toast({ title: "Ordine di produzione creato" });
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const updateOrderMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await fetch(`/api/production/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["production-orders"] });
      toast({ title: "Ordine aggiornato" });
    },
  });

  const deleteOrderMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/production/orders/${id}`, { method: "DELETE" });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["production-orders"] });
      toast({ title: "Ordine eliminato" });
    },
  });

  const createBomMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/production/bom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["production-bom"] });
      setBomDialogOpen(false);
      setSelectedBom(null);
      toast({ title: "Distinta base creata" });
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const updateBomMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await fetch(`/api/production/bom/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["production-bom"] });
      setBomDialogOpen(false);
      setSelectedBom(null);
      toast({ title: "Distinta base aggiornata" });
    },
  });

  const deleteBomMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/production/bom/${id}`, { method: "DELETE" });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["production-bom"] });
      toast({ title: "Distinta base eliminata" });
    },
  });

  const addComponentMutation = useMutation({
    mutationFn: async ({ bomId, data }: { bomId: string; data: any }) => {
      const res = await fetch(`/api/production/bom/${bomId}/components`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["production-bom"] });
      setNewComponent({ componenteId: "", quantita: "" });
      toast({ title: "Componente aggiunto" });
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const deleteComponentMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/production/bom/components/${id}`, { method: "DELETE" });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["production-bom"] });
      toast({ title: "Componente rimosso" });
    },
  });

  const completeOrderMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/production/orders/${id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["production-orders"] });
      queryClient.invalidateQueries({ queryKey: ["warehouse-products"] });
      queryClient.invalidateQueries({ queryKey: ["warehouse-movements"] });
      setCompleteOrderDialogOpen(false);
      setOrderToComplete(null);
      toast({ title: "Ordine completato", description: "I materiali sono stati scalati dal magazzino" });
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const filteredProducts = products.filter((p: any) =>
    p.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.codice?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const lowStockProducts = products.filter((p: any) => {
    const giacenza = parseFloat(p.giacenza) || 0;
    const minima = parseFloat(p.giacenzaMinima) || 0;
    return giacenza <= minima && minima > 0;
  });

  const formatCurrency = (val: any) => {
    const num = parseFloat(val) || 0;
    return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(num);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    try {
      return format(new Date(dateStr), "dd/MM/yyyy", { locale: it });
    } catch {
      return dateStr;
    }
  };

  const getCategoryName = (id: string) => categories.find((c: any) => c.id === id)?.nome || "-";
  const getProductName = (id: string) => products.find((p: any) => p.id === id)?.nome || "-";

  const fetchNextCodice = async (categoriaId?: string) => {
    setIsLoadingCodice(true);
    try {
      const url = categoriaId 
        ? `/api/warehouse/products/next-codice?categoriaId=${categoriaId}`
        : "/api/warehouse/products/next-codice";
      const res = await fetch(url);
      const { codice } = await res.json();
      setProductCodice(codice);
    } catch (e) {
      console.error("Error fetching next code:", e);
    }
    setIsLoadingCodice(false);
  };

  const openNewProductDialog = async () => {
    setSelectedProduct(null);
    setProductCategoriaId("");
    setAutoGenerateCodice(true);
    await fetchNextCodice();
    setProductDialogOpen(true);
  };

  const openEditProductDialog = (product: any) => {
    setSelectedProduct(product);
    setProductCodice(product.codice);
    setProductCategoriaId(product.categoriaId || "");
    setAutoGenerateCodice(false);
    setProductDialogOpen(true);
  };

  const handleCategoryChange = async (categoriaId: string) => {
    setProductCategoriaId(categoriaId);
    if (autoGenerateCodice && !selectedProduct) {
      await fetchNextCodice(categoriaId);
    }
  };

  const handleProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const data: any = {};
    formData.forEach((value, key) => { data[key] = value; });
    
    if (selectedProduct) {
      updateProductMutation.mutate({ id: selectedProduct.id, data });
    } else {
      createProductMutation.mutate(data);
    }
  };

  const handleMovementSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const data: any = { prodottoId: selectedProductForMovement?.id };
    formData.forEach((value, key) => { data[key] = value; });
    createMovementMutation.mutate(data);
  };

  const handleCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const data: any = {};
    formData.forEach((value, key) => { data[key] = value; });
    if (data.prefisso) {
      data.prefisso = data.prefisso.toUpperCase().trim();
    }
    createCategoryMutation.mutate(data);
  };

  const handleOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const data: any = { articoli: orderArticoli };
    formData.forEach((value, key) => { data[key] = value; });
    
    if (selectedOrder) {
      updateOrderMutation.mutate({ id: selectedOrder.id, data });
    } else {
      createOrderMutation.mutate(data);
    }
    setOrderArticoli([]);
  };

  const handleBomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const data: any = {};
    formData.forEach((value, key) => { data[key] = value; });
    
    if (selectedBom) {
      updateBomMutation.mutate({ id: selectedBom.id, data });
    } else {
      createBomMutation.mutate(data);
    }
  };

  const handleAddComponent = () => {
    if (!selectedBomDetail?.id || !newComponent.componenteId || !newComponent.quantita) {
      toast({ title: "Errore", description: "Seleziona un componente e inserisci la quantità", variant: "destructive" });
      return;
    }
    addComponentMutation.mutate({ 
      bomId: selectedBomDetail.id, 
      data: newComponent 
    });
  };

  const calculateBomCost = (bom: any) => {
    if (!bom.components || bom.components.length === 0) return 0;
    return bom.components.reduce((total: number, comp: any) => {
      const product = products.find((p: any) => p.id === comp.componenteId);
      const price = parseFloat(product?.prezzoAcquisto) || 0;
      const qty = parseFloat(comp.quantita) || 0;
      return total + (price * qty);
    }, 0);
  };

  const openBomDetail = async (bom: any) => {
    try {
      const res = await fetch(`/api/production/bom/${bom.id}`);
      const fullBom = await res.json();
      setSelectedBomDetail(fullBom);
      setBomDetailOpen(true);
    } catch (error) {
      toast({ title: "Errore nel caricamento della distinta", variant: "destructive" });
    }
  };

  return (
    <AppLayout>
      <div className={`h-full flex flex-col overflow-hidden bg-gradient-to-br from-[#f5f0e6] via-[#e8dcc8] to-[#ddd0b8] dark:from-[#2d3748] dark:via-[#374151] dark:to-[#3d4555] ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
        <div className="h-32 w-full flex-shrink-0 bg-gradient-to-r from-[#4a5568] via-[#5a6a7d] to-[#6b7a8f]" />
        
        <div className="flex-1 overflow-auto -mt-16 px-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <div className="bg-stone-50 dark:bg-stone-900/50 rounded-xl shadow-lg border mb-6">
              <div className="p-4 pb-2">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
                    <Factory className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h1 className="text-xl font-bold tracking-tight">Produzione</h1>
                    <p className="text-xs text-muted-foreground">
                      Gestione magazzino e ordini di produzione
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
                    <CopyLinkButton path="/produzione" />
                  </div>
                </div>
                
                <TabsList className="grid w-full max-w-3xl grid-cols-5 gap-1 h-auto bg-transparent p-0">
                  <TabsTrigger value="dashboard" className="flex flex-col items-center justify-center gap-0.5 px-1 py-2 text-[9px] data-[state=active]:bg-primary/20 rounded-lg">
                    <ClipboardList className="h-4 w-4" />
                    <span>Dashboard</span>
                  </TabsTrigger>
                  <TabsTrigger value="magazzino" className="flex flex-col items-center justify-center gap-0.5 px-1 py-2 text-[9px] data-[state=active]:bg-primary/20 rounded-lg">
                    <Package className="h-4 w-4" />
                    <span>Magazzino</span>
                  </TabsTrigger>
                  <TabsTrigger value="produzione" className="flex flex-col items-center justify-center gap-0.5 px-1 py-2 text-[9px] data-[state=active]:bg-primary/20 rounded-lg">
                    <Factory className="h-4 w-4" />
                    <span>Produzione</span>
                  </TabsTrigger>
                  <TabsTrigger value="catalogo" className="flex flex-col items-center justify-center gap-0.5 px-1 py-2 text-[9px] data-[state=active]:bg-primary/20 rounded-lg">
                    <Boxes className="h-4 w-4" />
                    <span>Articoli</span>
                  </TabsTrigger>
                  <TabsTrigger value="spedizioni" className="flex flex-col items-center justify-center gap-0.5 px-1 py-2 text-[9px] data-[state=active]:bg-primary/20 rounded-lg">
                    <Truck className="h-4 w-4" />
                    <span>Spedizioni</span>
                  </TabsTrigger>
                </TabsList>
              </div>
            </div>

            <div className="flex-1 overflow-auto pb-6">
              <TabsContent value="dashboard" className="m-0 space-y-6">
            <div className="grid grid-cols-4 gap-4">
              <Card className="border-orange-200 bg-orange-50/50 dark:border-orange-800 dark:bg-orange-950/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-300 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Materie Prime
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xl font-bold text-orange-600">
                    {products.filter((p: any) => {
                      const giacenza = parseFloat(p.giacenza) || 0;
                      const minima = parseFloat(p.giacenzaMinima) || 0;
                      return minima > 0 && giacenza <= minima;
                    }).length}
                  </p>
                  <p className="text-xs text-muted-foreground">sottoscorta magazzino</p>
                </CardContent>
              </Card>

              <Card className="border-purple-200 bg-purple-50/50 dark:border-purple-800 dark:bg-purple-950/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300 flex items-center gap-2">
                    <Boxes className="h-4 w-4" />
                    Articoli Finiti
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xl font-bold text-purple-600">
                    {articoliSottoscorta.length}
                  </p>
                  <p className="text-xs text-muted-foreground">sottoscorta catalogo</p>
                </CardContent>
              </Card>
              
              <Card className="border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-red-700 dark:text-red-300 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Ordini in Ritardo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xl font-bold text-red-600">
                    {orders.filter((o: any) => 
                      o.dataFineStimata && 
                      new Date(o.dataFineStimata) < new Date() && 
                      o.stato !== "completato" && 
                      o.stato !== "annullato"
                    ).length}
                  </p>
                  <p className="text-xs text-muted-foreground">ordini oltre la data prevista</p>
                </CardContent>
              </Card>
              
              <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300 flex items-center gap-2">
                    <Factory className="h-4 w-4" />
                    In Lavorazione
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xl font-bold text-blue-600">
                    {orders.filter((o: any) => o.stato === "in_corso").length}
                  </p>
                  <p className="text-xs text-muted-foreground">ordini attualmente in corso</p>
                </CardContent>
              </Card>
            </div>

            {articoliSottoscorta.length > 0 && (
              <Card className="border-purple-200 bg-purple-50/30 dark:border-purple-800 dark:bg-purple-950/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-purple-600" />
                    Avviso Sottoscorta Articoli
                  </CardTitle>
                  <CardDescription>Articoli finiti da produrre urgentemente</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[200px]">
                    <div className="space-y-2">
                      {articoliSottoscorta.map((a: any) => {
                        const disponibile = (a.giacenza || 0) - (parseInt(a.occupato) || 0);
                        return (
                          <div key={a.id} className="flex items-center justify-between p-3 border rounded-lg bg-white dark:bg-background">
                            <div>
                              <p className="font-medium text-sm">{a.nome}</p>
                              <p className="text-xs text-muted-foreground font-mono">{a.codice}</p>
                            </div>
                            <div className="text-right">
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">Giacenza:</span>
                                <span className={`font-bold text-sm ${(a.giacenza || 0) <= (a.stock_minimo || 0) ? 'text-red-600' : ''}`}>
                                  {a.giacenza || 0}
                                </span>
                              </div>
                              {parseInt(a.occupato) > 0 && (
                                <div className="flex items-center gap-2 text-xs">
                                  <span className="text-muted-foreground">Occ:</span>
                                  <span className="text-orange-600">{a.occupato}</span>
                                  <span className="text-muted-foreground">Disp:</span>
                                  <span className={disponibile < 0 ? 'text-red-600 font-bold' : 'text-green-600'}>{disponibile}</span>
                                </div>
                              )}
                              <p className="text-xs text-muted-foreground">min: {a.stock_minimo || 0}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                    Materie Prime Sottoscorta
                  </CardTitle>
                  <CardDescription>Prodotti magazzino da rifornire</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px]">
                    {products.filter((p: any) => {
                      const giacenza = parseFloat(p.giacenza) || 0;
                      const minima = parseFloat(p.giacenzaMinima) || 0;
                      return minima > 0 && giacenza <= minima;
                    }).length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
                        <p>Tutti i prodotti sono a scorta adeguata</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {products.filter((p: any) => {
                          const giacenza = parseFloat(p.giacenza) || 0;
                          const minima = parseFloat(p.giacenzaMinima) || 0;
                          return minima > 0 && giacenza <= minima;
                        }).map((p: any) => (
                          <div key={p.id} className="flex items-center justify-between p-3 border rounded-lg bg-orange-50 dark:bg-orange-950/20">
                            <div>
                              <p className="font-medium">{p.nome}</p>
                              <p className="text-xs text-muted-foreground font-mono">{p.codice}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-orange-600">
                                {parseFloat(p.giacenza || "0").toLocaleString("it-IT")} {p.unitaMisura}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                min: {parseFloat(p.giacenzaMinima || "0").toLocaleString("it-IT")}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Clock className="h-5 w-5 text-red-500" />
                    Ordini in Ritardo
                  </CardTitle>
                  <CardDescription>Ordini di produzione oltre la data prevista</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px]">
                    {orders.filter((o: any) => 
                      o.dataFineStimata && 
                      new Date(o.dataFineStimata) < new Date() && 
                      o.stato !== "completato" && 
                      o.stato !== "annullato"
                    ).length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
                        <p>Nessun ordine in ritardo</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {orders.filter((o: any) => 
                          o.dataFineStimata && 
                          new Date(o.dataFineStimata) < new Date() && 
                          o.stato !== "completato" && 
                          o.stato !== "annullato"
                        ).map((o: any) => {
                          const product = products.find((p: any) => p.id === o.prodottoId);
                          const daysLate = Math.floor((new Date().getTime() - new Date(o.dataFineStimata).getTime()) / (1000 * 60 * 60 * 24));
                          return (
                            <div key={o.id} className="flex items-center justify-between p-3 border rounded-lg bg-red-50 dark:bg-red-950/20">
                              <div>
                                <p className="font-mono font-medium">{o.numero}</p>
                                <p className="text-xs text-muted-foreground">{product?.nome}</p>
                              </div>
                              <div className="text-right">
                                <Badge variant="destructive" className="text-xs">
                                  {daysLate} giorni di ritardo
                                </Badge>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Scadenza: {formatDate(o.dataFineStimata)}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Ordini di Produzione in Corso</CardTitle>
                <CardDescription>Stato attuale della produzione</CardDescription>
              </CardHeader>
              <CardContent>
                {orders.filter((o: any) => o.stato === "in_corso").length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Factory className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Nessun ordine in lavorazione</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-4">
                    {orders.filter((o: any) => o.stato === "in_corso").slice(0, 6).map((o: any) => {
                      const product = products.find((p: any) => p.id === o.prodottoId);
                      const progress = o.quantitaRichiesta > 0 
                        ? Math.round((o.quantitaProdotta || 0) / o.quantitaRichiesta * 100) 
                        : 0;
                      return (
                        <div key={o.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-mono font-medium text-sm">{o.numero}</p>
                            <Badge className="bg-yellow-500 text-white text-xs">In corso</Badge>
                          </div>
                          <p className="text-sm font-medium truncate">{product?.nome}</p>
                          <div className="mt-3">
                            <div className="flex justify-between text-xs text-muted-foreground mb-1">
                              <span>Progresso</span>
                              <span>{o.quantitaProdotta || 0}/{o.quantitaRichiesta}</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2">
                              <div 
                                className="bg-yellow-500 h-2 rounded-full transition-all"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="magazzino" className="space-y-4">
            <div className="grid grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Prodotti</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-bold">{products.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Categorie</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-bold">{categories.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Movimenti Oggi</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-bold">
                    {movements.filter((m: any) => {
                      const today = new Date().toISOString().split("T")[0];
                      return m.createdAt?.startsWith(today);
                    }).length}
                  </div>
                </CardContent>
              </Card>
              <Card className={lowStockProducts.length > 0 ? "border-orange-500" : ""}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    {lowStockProducts.length > 0 && <AlertTriangle className="h-4 w-4 text-orange-500" />}
                    Sottoscorta
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-lg font-bold ${lowStockProducts.length > 0 ? "text-orange-500" : ""}`}>
                    {lowStockProducts.length}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Tabs value={warehouseSubTab} onValueChange={setWarehouseSubTab}>
              <div className="flex items-center justify-between">
                <TabsList>
                  <TabsTrigger value="prodotti">Prodotti</TabsTrigger>
                  <TabsTrigger value="movimenti">Movimenti</TabsTrigger>
                  <TabsTrigger value="categorie">Categorie</TabsTrigger>
                </TabsList>
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
                  {warehouseSubTab === "prodotti" && (
                    <Button onClick={openNewProductDialog}>
                      <Plus className="h-4 w-4 mr-2" />
                      Nuovo Prodotto
                    </Button>
                  )}
                  {warehouseSubTab === "categorie" && (
                    <Button onClick={() => { setSelectedCategory(null); setCategoryDialogOpen(true); }}>
                      <Plus className="h-4 w-4 mr-2" />
                      Nuova Categoria
                    </Button>
                  )}
                </div>
              </div>

              <TabsContent value="prodotti" className="mt-4">
                <Card>
                  <CardContent className="p-0">
                    <ScrollArea className="h-[500px]">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50 sticky top-0">
                          <tr>
                            <th className="text-left px-4 py-3 font-medium">Codice</th>
                            <th className="text-left px-4 py-3 font-medium">Nome</th>
                            <th className="text-left px-4 py-3 font-medium">Categoria</th>
                            <th className="text-left px-4 py-3 font-medium">Giacenza</th>
                            <th className="text-left px-4 py-3 font-medium">U.M.</th>
                            <th className="text-left px-4 py-3 font-medium">Prezzo Acq.</th>
                            <th className="text-left px-4 py-3 font-medium">Prezzo Vend.</th>
                            <th className="text-right px-4 py-3 font-medium">Azioni</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredProducts.length === 0 ? (
                            <tr>
                              <td colSpan={8} className="text-center py-8 text-muted-foreground">
                                <Boxes className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>Nessun prodotto trovato</p>
                                <Button 
                                  variant="outline" 
                                  className="mt-4"
                                  onClick={openNewProductDialog}
                                >
                                  <Plus className="h-4 w-4 mr-2" />
                                  Aggiungi il primo prodotto
                                </Button>
                              </td>
                            </tr>
                          ) : (
                            filteredProducts.map((p: any) => {
                              const giacenza = parseFloat(p.giacenza) || 0;
                              const minima = parseFloat(p.giacenzaMinima) || 0;
                              const isLowStock = giacenza <= minima && minima > 0;
                              return (
                                <tr key={p.id} className={`border-t hover:bg-muted/30 ${isLowStock ? "bg-orange-50/50 dark:bg-orange-950/20" : ""}`}>
                                  <td className="px-4 py-3 font-mono text-xs">{p.codice}</td>
                                  <td className="px-4 py-3 font-medium">{p.nome}</td>
                                  <td className="px-4 py-3 text-muted-foreground">{getCategoryName(p.categoriaId)}</td>
                                  <td className="px-4 py-3">
                                    <span className={`font-semibold ${isLowStock ? "text-orange-600" : ""}`}>
                                      {giacenza}
                                    </span>
                                    {isLowStock && <AlertTriangle className="h-3 w-3 text-orange-500 inline ml-1" />}
                                  </td>
                                  <td className="px-4 py-3 text-muted-foreground">
                                    {UNITA_MISURA.find(u => u.value === p.unitaMisura)?.label || p.unitaMisura}
                                  </td>
                                  <td className="px-4 py-3">{formatCurrency(p.prezzoAcquisto)}</td>
                                  <td className="px-4 py-3">{formatCurrency(p.prezzoVendita)}</td>
                                  <td className="px-4 py-3 text-right">
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon">
                                          <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => { setSelectedProductForMovement(p); setMovementDialogOpen(true); }}>
                                          <ArrowUpCircle className="h-4 w-4 mr-2" />
                                          Registra Movimento
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => openEditProductDialog(p)}>
                                          <Edit2 className="h-4 w-4 mr-2" />
                                          Modifica
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => { setLabelProduct(p); setLabelQuantity(1); setLabelDialogOpen(true); }}>
                                          <Tag className="h-4 w-4 mr-2" />
                                          Stampa Etichette
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem 
                                          className="text-red-600"
                                          onClick={() => deleteProductMutation.mutate(p.id)}
                                        >
                                          <Trash2 className="h-4 w-4 mr-2" />
                                          Elimina
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="movimenti" className="mt-4">
                <Card>
                  <CardContent className="p-0">
                    <ScrollArea className="h-[500px]">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50 sticky top-0">
                          <tr>
                            <th className="text-left px-4 py-3 font-medium">Data</th>
                            <th className="text-left px-4 py-3 font-medium">Prodotto</th>
                            <th className="text-left px-4 py-3 font-medium">Tipo</th>
                            <th className="text-left px-4 py-3 font-medium">Causale</th>
                            <th className="text-left px-4 py-3 font-medium">Quantità</th>
                            <th className="text-left px-4 py-3 font-medium">Giacenza</th>
                            <th className="text-left px-4 py-3 font-medium">Note</th>
                          </tr>
                        </thead>
                        <tbody>
                          {movements.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="text-center py-8 text-muted-foreground">
                                <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>Nessun movimento registrato</p>
                              </td>
                            </tr>
                          ) : (
                            movements.map((m: any) => {
                              const tipoInfo = TIPI_MOVIMENTO.find(t => t.value === m.tipo);
                              const TipoIcon = tipoInfo?.icon || RefreshCw;
                              return (
                                <tr key={m.id} className="border-t hover:bg-muted/30">
                                  <td className="px-4 py-3 text-muted-foreground">
                                    {formatDate(m.createdAt)}
                                  </td>
                                  <td className="px-4 py-3 font-medium">{getProductName(m.prodottoId)}</td>
                                  <td className="px-4 py-3">
                                    <span className={`flex items-center gap-1 ${tipoInfo?.color}`}>
                                      <TipoIcon className="h-4 w-4" />
                                      {tipoInfo?.label || m.tipo}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-muted-foreground">
                                    {CAUSALI.find(c => c.value === m.causale)?.label || m.causale}
                                  </td>
                                  <td className="px-4 py-3 font-semibold">{m.quantita}</td>
                                  <td className="px-4 py-3 text-xs text-muted-foreground">
                                    {m.giacenzaPrecedente} → {m.giacenzaSuccessiva}
                                  </td>
                                  <td className="px-4 py-3 text-muted-foreground text-xs max-w-[200px] truncate">
                                    {m.note || "-"}
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="categorie" className="mt-4">
                <div className="grid grid-cols-3 gap-4">
                  {categories.length === 0 ? (
                    <Card className="col-span-3">
                      <CardContent className="py-12 text-center">
                        <Settings2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                        <p className="text-muted-foreground">Nessuna categoria creata</p>
                        <Button 
                          variant="outline" 
                          className="mt-4"
                          onClick={() => { setSelectedCategory(null); setCategoryDialogOpen(true); }}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Crea la prima categoria
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    categories.map((c: any) => (
                      <Card key={c.id} className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: c.colore || "#3B82F6" }}
                              />
                              <CardTitle className="text-base">{c.nome}</CardTitle>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => deleteCategoryMutation.mutate(c.id)}
                            >
                              <Trash2 className="h-4 w-4 text-muted-foreground hover:text-red-500" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground">
                            {c.descrizione || "Nessuna descrizione"}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {products.filter((p: any) => p.categoriaId === c.id).length} prodotti
                          </p>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="produzione" className="space-y-4">
            <div className="grid grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Ordini Totali</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-bold">{orders.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">In Corso</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-bold text-yellow-600">
                    {orders.filter((o: any) => o.stato === "in_corso").length}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Pianificati</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-bold text-blue-600">
                    {orders.filter((o: any) => o.stato === "pianificato").length}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Completati</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-bold text-green-600">
                    {orders.filter((o: any) => o.stato === "completato").length}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Tabs value={productionSubTab} onValueChange={setProductionSubTab}>
              <div className="flex items-center justify-between">
                <TabsList>
                  <TabsTrigger value="ordini-cliente">Ordini Cliente</TabsTrigger>
                  <TabsTrigger value="ordini">Ordini di Produzione</TabsTrigger>
                  <TabsTrigger value="distinte">Distinte Base</TabsTrigger>
                  <TabsTrigger value="pianificazione">Pianificazione</TabsTrigger>
                  <TabsTrigger value="marginalita">Marginalità</TabsTrigger>
                </TabsList>
                <div className="flex items-center gap-2">
                  {productionSubTab === "ordini-cliente" && productionOrders.length > 0 && (
                    <Button variant="outline" size="sm" onClick={() => {
                      queryClient.invalidateQueries({ queryKey: ["/api/sales-orders/status/production"] });
                    }}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Aggiorna
                    </Button>
                  )}
                  {productionSubTab === "ordini" && (
                    <Button onClick={() => { setSelectedOrder(null); setOrderDialogOpen(true); }}>
                      <Plus className="h-4 w-4 mr-2" />
                      Nuovo Ordine
                    </Button>
                  )}
                </div>
              </div>

              <TabsContent value="ordini-cliente" className="mt-4">
                {productionOrdersLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : productionOrders.length === 0 ? (
                  <div className="text-center py-12 border rounded-lg">
                    <Boxes className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">Nessun ordine in produzione</h3>
                    <p className="text-muted-foreground">I nuovi ordini appariranno qui quando entreranno in produzione</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {productionOrders.map(order => (
                      <Card key={order.id}>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="text-base">{order.numero}</CardTitle>
                              <CardDescription>{order.ragione_sociale}</CardDescription>
                            </div>
                            <Badge className="bg-orange-500">{order.totale_pezzi} pz</Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <p className="text-xs text-muted-foreground">Articoli: {order.lines?.length || 0}</p>
                            <div className="border rounded p-2 bg-muted/30">
                              {order.lines?.map((line: any, idx: number) => {
                                const giacenza = parseInt(line.giacenza) || 0;
                                const stockMinimo = parseInt(line.stock_minimo) || 0;
                                const quantitaRichiesta = parseInt(line.quantita) || 0;
                                const isSottoscorta = line.giacenza !== null && giacenza <= stockMinimo;
                                const daProdurre = Math.max(0, quantitaRichiesta - giacenza);
                                return (
                                  <div key={idx} className={`text-xs py-1.5 flex items-center justify-between border-b last:border-b-0 ${isSottoscorta ? 'bg-red-50' : ''}`}>
                                    <div className="flex-1 flex items-center gap-2">
                                      <span className="font-medium">{line.codice_articolo || 'Custom'}</span> - {line.descrizione}
                                      {isSottoscorta && (
                                        <Badge variant="destructive" className="text-[10px] px-1 py-0">Sottoscorta</Badge>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <span className="text-[10px] text-muted-foreground">Giac: {giacenza}</span>
                                      <span className="font-medium">Ord: {quantitaRichiesta} pz</span>
                                      {daProdurre > 0 && (
                                        <Badge className="bg-orange-500 text-[10px] px-1.5">Da produrre: {daProdurre}</Badge>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                            {order.lines?.some((l: any) => parseInt(l.giacenza || 0) <= parseInt(l.stock_minimo || 0)) && (
                              <div className="mt-3 p-2 bg-orange-50 border border-orange-200 rounded">
                                <p className="text-xs font-medium text-orange-700 flex items-center gap-1">
                                  <AlertTriangle className="h-3 w-3" />
                                  Articoli da produrre:
                                </p>
                                <ul className="mt-1 text-xs text-orange-600">
                                  {order.lines?.filter((l: any) => parseInt(l.giacenza || 0) <= parseInt(l.stock_minimo || 0))
                                    .map((l: any, i: number) => (
                                      <li key={i}>• {l.codice_articolo}: {Math.max(0, parseInt(l.quantita) - parseInt(l.giacenza || 0))} pz</li>
                                    ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="ordini" className="mt-4">
                <Card>
                  <CardContent className="p-0">
                    <ScrollArea className="h-[500px]">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50 sticky top-0">
                          <tr>
                            <th className="text-left px-4 py-3 font-medium">Numero</th>
                            <th className="text-left px-4 py-3 font-medium">Prodotto</th>
                            <th className="text-left px-4 py-3 font-medium">Quantità</th>
                            <th className="text-left px-4 py-3 font-medium">Stato</th>
                            <th className="text-left px-4 py-3 font-medium">Priorità</th>
                            <th className="text-left px-4 py-3 font-medium">Data Inizio</th>
                            <th className="text-left px-4 py-3 font-medium">Data Fine</th>
                            <th className="text-right px-4 py-3 font-medium">Azioni</th>
                          </tr>
                        </thead>
                        <tbody>
                          {orders.length === 0 ? (
                            <tr>
                              <td colSpan={8} className="text-center py-8 text-muted-foreground">
                                <Factory className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>Nessun ordine di produzione</p>
                                <Button 
                                  variant="outline" 
                                  className="mt-4"
                                  onClick={() => { setSelectedOrder(null); setOrderDialogOpen(true); }}
                                >
                                  <Plus className="h-4 w-4 mr-2" />
                                  Crea il primo ordine
                                </Button>
                              </td>
                            </tr>
                          ) : (
                            orders.map((o: any) => {
                              const stato = STATI_ORDINE.find(s => s.value === o.stato);
                              const priorita = PRIORITA.find(p => p.value === o.priorita);
                              return (
                                <tr key={o.id} className="border-t hover:bg-muted/30">
                                  <td className="px-4 py-3 font-mono font-semibold">{o.numero}</td>
                                  <td className="px-4 py-3">{getProductName(o.prodottoId)}</td>
                                  <td className="px-4 py-3">
                                    <span className="font-semibold">{o.quantitaProdotta || 0}</span>
                                    <span className="text-muted-foreground">/{o.quantitaRichiesta}</span>
                                  </td>
                                  <td className="px-4 py-3">
                                    <Badge className={`${stato?.color} text-white`}>{stato?.label}</Badge>
                                  </td>
                                  <td className="px-4 py-3">
                                    <Badge variant="outline" className={priorita?.color.replace("bg-", "border-")}>
                                      {priorita?.label}
                                    </Badge>
                                  </td>
                                  <td className="px-4 py-3 text-muted-foreground">{formatDate(o.dataInizio)}</td>
                                  <td className="px-4 py-3 text-muted-foreground">{formatDate(o.dataFineStimata)}</td>
                                  <td className="px-4 py-3 text-right">
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon">
                                          <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        {o.stato === "pianificato" && (
                                          <DropdownMenuItem onClick={() => updateOrderMutation.mutate({ id: o.id, data: { stato: "in_corso" } })}>
                                            <Clock className="h-4 w-4 mr-2" />
                                            Avvia Produzione
                                          </DropdownMenuItem>
                                        )}
                                        {o.stato === "in_corso" && (
                                          <DropdownMenuItem onClick={() => { setOrderToComplete(o); setCompleteOrderDialogOpen(true); }}>
                                            <CheckCircle2 className="h-4 w-4 mr-2" />
                                            Completa con Consumo Materiali
                                          </DropdownMenuItem>
                                        )}
                                        <DropdownMenuItem onClick={() => openOrderForEdit(o)}>
                                          <Edit2 className="h-4 w-4 mr-2" />
                                          Modifica
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem 
                                          className="text-red-600"
                                          onClick={() => deleteOrderMutation.mutate(o.id)}
                                        >
                                          <Trash2 className="h-4 w-4 mr-2" />
                                          Elimina
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="distinte" className="mt-4">
                <div className="flex justify-end mb-4">
                  <Button onClick={() => { setSelectedBom(null); setBomDialogOpen(true); }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nuova Distinta Base
                  </Button>
                </div>
                <Card>
                  <CardContent className="p-0">
                    <ScrollArea className="h-[500px]">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50 sticky top-0">
                          <tr>
                            <th className="text-left px-4 py-3 font-medium">Nome</th>
                            <th className="text-left px-4 py-3 font-medium">Prodotto Finito</th>
                            <th className="text-left px-4 py-3 font-medium">Versione</th>
                            <th className="text-left px-4 py-3 font-medium">Componenti</th>
                            <th className="text-left px-4 py-3 font-medium">Costo Stimato</th>
                            <th className="text-left px-4 py-3 font-medium">Stato</th>
                            <th className="text-right px-4 py-3 font-medium">Azioni</th>
                          </tr>
                        </thead>
                        <tbody>
                          {boms.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="text-center py-8 text-muted-foreground">
                                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>Nessuna distinta base creata</p>
                                <Button 
                                  variant="outline" 
                                  className="mt-4"
                                  onClick={() => { setSelectedBom(null); setBomDialogOpen(true); }}
                                >
                                  <Plus className="h-4 w-4 mr-2" />
                                  Crea la prima distinta
                                </Button>
                              </td>
                            </tr>
                          ) : (
                            boms.map((bom: any) => (
                              <tr key={bom.id} className="border-t hover:bg-muted/30 cursor-pointer" onClick={() => openBomDetail(bom)}>
                                <td className="px-4 py-3 font-medium">{bom.nome}</td>
                                <td className="px-4 py-3">{getProductName(bom.prodottoFinito)}</td>
                                <td className="px-4 py-3 font-mono text-xs">{bom.versione || "1.0"}</td>
                                <td className="px-4 py-3">
                                  <Badge variant="outline">{bom.components?.length || 0} componenti</Badge>
                                </td>
                                <td className="px-4 py-3">{formatCurrency(calculateBomCost(bom))}</td>
                                <td className="px-4 py-3">
                                  <Badge className={bom.attiva ? "bg-green-500 text-white" : "bg-gray-400 text-white"}>
                                    {bom.attiva ? "Attiva" : "Non attiva"}
                                  </Badge>
                                </td>
                                <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon">
                                        <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => openBomDetail(bom)}>
                                        <Eye className="h-4 w-4 mr-2" />
                                        Visualizza Componenti
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => { setSelectedBom(bom); setBomDialogOpen(true); }}>
                                        <Edit2 className="h-4 w-4 mr-2" />
                                        Modifica
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem 
                                        className="text-red-600"
                                        onClick={() => deleteBomMutation.mutate(bom.id)}
                                      >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Elimina
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="pianificazione" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Timeline Ordini di Produzione</CardTitle>
                    <CardDescription>Vista temporale degli ordini pianificati e in corso</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {orders.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Nessun ordine di produzione da visualizzare</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="grid grid-cols-4 gap-4 mb-6">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded bg-blue-500" />
                            <span className="text-sm">Pianificato</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded bg-yellow-500" />
                            <span className="text-sm">In Corso</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded bg-green-500" />
                            <span className="text-sm">Completato</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded bg-orange-500" />
                            <span className="text-sm">Sospeso</span>
                          </div>
                        </div>
                        
                        <div className="relative">
                          {orders
                            .filter((o: any) => o.stato !== "annullato")
                            .sort((a: any, b: any) => {
                              const dateA = a.dataInizio ? new Date(a.dataInizio).getTime() : 0;
                              const dateB = b.dataInizio ? new Date(b.dataInizio).getTime() : 0;
                              return dateA - dateB;
                            })
                            .map((order: any, idx: number) => {
                              const stato = STATI_ORDINE.find(s => s.value === order.stato);
                              const priorita = PRIORITA.find(p => p.value === order.priorita);
                              const product = products.find((p: any) => p.id === order.prodottoId);
                              const startDate = order.dataInizio ? formatDate(order.dataInizio) : "Non definita";
                              const endDate = order.dataFineStimata ? formatDate(order.dataFineStimata) : "Non definita";
                              const isOverdue = order.dataFineStimata && 
                                new Date(order.dataFineStimata) < new Date() && 
                                order.stato !== "completato";
                              
                              return (
                                <div 
                                  key={order.id} 
                                  className={`relative flex items-stretch gap-4 py-3 ${idx !== 0 ? "border-t" : ""}`}
                                >
                                  <div className="flex flex-col items-center">
                                    <div className={`w-4 h-4 rounded-full ${stato?.color || "bg-gray-400"}`} />
                                    {idx < orders.filter((o: any) => o.stato !== "annullato").length - 1 && (
                                      <div className="w-0.5 flex-1 bg-muted-foreground/20 mt-1" />
                                    )}
                                  </div>
                                  
                                  <div className="flex-1 grid grid-cols-5 gap-4 items-center">
                                    <div>
                                      <p className="font-mono font-semibold text-sm">{order.numero}</p>
                                      <p className="text-xs text-muted-foreground">{product?.nome || "Prodotto"}</p>
                                    </div>
                                    
                                    <div className="text-center">
                                      <Badge className={`${stato?.color} text-white text-xs`}>{stato?.label}</Badge>
                                      {priorita?.value === "urgente" && (
                                        <Badge variant="outline" className="ml-1 border-red-500 text-red-500 text-xs">
                                          Urgente
                                        </Badge>
                                      )}
                                    </div>
                                    
                                    <div className="text-center">
                                      <p className="text-sm font-medium">{order.quantitaProdotta || 0}/{order.quantitaRichiesta}</p>
                                      <p className="text-xs text-muted-foreground">unità</p>
                                    </div>
                                    
                                    <div className="text-center">
                                      <p className="text-xs text-muted-foreground">Inizio</p>
                                      <p className="text-sm">{startDate}</p>
                                    </div>
                                    
                                    <div className="text-center">
                                      <p className="text-xs text-muted-foreground">Fine stimata</p>
                                      <p className={`text-sm ${isOverdue ? "text-red-600 font-semibold" : ""}`}>
                                        {endDate}
                                        {isOverdue && <AlertTriangle className="h-3 w-3 inline ml-1" />}
                                      </p>
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center">
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      onClick={() => openOrderForEdit(order)}
                                    >
                                      <Edit2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              );
                            })}
                        </div>

                        <div className="mt-6 p-4 bg-muted/30 rounded-lg">
                          <h4 className="font-medium mb-3">Riepilogo Capacità</h4>
                          <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                              <p className="text-lg font-bold text-blue-600">
                                {orders.filter((o: any) => o.stato === "pianificato").length}
                              </p>
                              <p className="text-xs text-muted-foreground">Ordini Pianificati</p>
                            </div>
                            <div>
                              <p className="text-lg font-bold text-yellow-600">
                                {orders.filter((o: any) => o.stato === "in_corso").length}
                              </p>
                              <p className="text-xs text-muted-foreground">In Lavorazione</p>
                            </div>
                            <div>
                              <p className="text-lg font-bold text-red-600">
                                {orders.filter((o: any) => 
                                  o.dataFineStimata && 
                                  new Date(o.dataFineStimata) < new Date() && 
                                  o.stato !== "completato" && 
                                  o.stato !== "annullato"
                                ).length}
                              </p>
                              <p className="text-xs text-muted-foreground">In Ritardo</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="marginalita" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Report Marginalità Prodotti</CardTitle>
                    <CardDescription>Analisi costi di produzione vs prezzo di vendita per ogni prodotto</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[500px]">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b text-left text-sm font-medium text-muted-foreground">
                            <th className="p-3">Prodotto</th>
                            <th className="p-3 text-right">Prezzo Vendita</th>
                            <th className="p-3 text-right">Costo Produzione</th>
                            <th className="p-3 text-right">Margine</th>
                            <th className="p-3 text-right">Margine %</th>
                          </tr>
                        </thead>
                        <tbody>
                          {products.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="text-center py-8 text-muted-foreground">
                                Nessun prodotto trovato
                              </td>
                            </tr>
                          ) : (
                            products.map((product: any) => {
                              const bom = boms.find((b: any) => b.prodottoFinitoId === product.id);
                              const prezzoVendita = parseItalianNumber(product.prezzoVendita);
                              
                              let costoProduzione = 0;
                              if (bom && Array.isArray(bom.components)) {
                                costoProduzione = bom.components.reduce((sum: number, comp: any) => {
                                  const compProduct = products.find((p: any) => p.id === comp.componenteId);
                                  const prezzo = parseItalianNumber(compProduct?.prezzoAcquisto);
                                  return sum + (prezzo * (comp.quantita || 1));
                                }, 0);
                              }
                              
                              const margine = prezzoVendita - costoProduzione;
                              const marginePerc = prezzoVendita > 0 ? ((margine / prezzoVendita) * 100) : 0;
                              
                              return (
                                <tr key={product.id} className="border-b hover:bg-muted/50">
                                  <td className="p-3">
                                    <div className="flex items-center gap-2">
                                      <div className={`w-2 h-2 rounded-full ${margine >= 0 ? "bg-green-500" : "bg-red-500"}`} />
                                      <div>
                                        <p className="font-medium">{product.nome}</p>
                                        <p className="text-xs text-muted-foreground font-mono">{product.codice}</p>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="p-3 text-right font-mono">
                                    {formatCurrency(prezzoVendita)}
                                  </td>
                                  <td className="p-3 text-right font-mono">
                                    {costoProduzione > 0 ? (
                                      formatCurrency(costoProduzione)
                                    ) : (
                                      <span className="text-muted-foreground text-xs">
                                        {bom ? "N/D" : "Nessuna BOM"}
                                      </span>
                                    )}
                                  </td>
                                  <td className="p-3 text-right font-mono">
                                    {costoProduzione > 0 || prezzoVendita > 0 ? (
                                      <span className={margine >= 0 ? "text-green-600" : "text-red-600"}>
                                        {formatCurrency(margine)}
                                      </span>
                                    ) : (
                                      <span className="text-muted-foreground">-</span>
                                    )}
                                  </td>
                                  <td className="p-3 text-right">
                                    {costoProduzione > 0 || prezzoVendita > 0 ? (
                                      <Badge 
                                        variant="outline" 
                                        className={marginePerc >= 30 ? "border-green-500 text-green-600" : marginePerc >= 15 ? "border-yellow-500 text-yellow-600" : marginePerc >= 0 ? "border-orange-500 text-orange-600" : "border-red-500 text-red-600"}
                                      >
                                        {marginePerc.toFixed(1)}%
                                      </Badge>
                                    ) : (
                                      <span className="text-muted-foreground">-</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </ScrollArea>

                    <div className="mt-6 p-4 bg-muted/30 rounded-lg">
                      <h4 className="font-medium mb-3">Riepilogo Marginalità</h4>
                      <div className="grid grid-cols-4 gap-4 text-center">
                        <div>
                          <p className="text-lg font-bold text-green-600">
                            {products.filter((p: any) => {
                              const bom = boms.find((b: any) => b.prodottoFinitoId === p.id);
                              if (!bom) return false;
                              const prezzo = parseItalianNumber(p.prezzoVendita);
                              let costo = 0;
                              if (bom && Array.isArray(bom.components)) {
                                costo = bom.components.reduce((sum: number, comp: any) => {
                                  const compProduct = products.find((pr: any) => pr.id === comp.componenteId);
                                  return sum + (parseItalianNumber(compProduct?.prezzoAcquisto) * (comp.quantita || 1));
                                }, 0);
                              }
                              return prezzo > 0 && costo > 0 && ((prezzo - costo) / prezzo) >= 0.30;
                            }).length}
                          </p>
                          <p className="text-xs text-muted-foreground">Margine &gt;30%</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-yellow-600">
                            {products.filter((p: any) => {
                              const bom = boms.find((b: any) => b.prodottoFinitoId === p.id);
                              if (!bom) return false;
                              const prezzo = parseItalianNumber(p.prezzoVendita);
                              let costo = 0;
                              if (bom && Array.isArray(bom.components)) {
                                costo = bom.components.reduce((sum: number, comp: any) => {
                                  const compProduct = products.find((pr: any) => pr.id === comp.componenteId);
                                  return sum + (parseItalianNumber(compProduct?.prezzoAcquisto) * (comp.quantita || 1));
                                }, 0);
                              }
                              const marginePerc = prezzo > 0 ? ((prezzo - costo) / prezzo) : 0;
                              return prezzo > 0 && costo > 0 && marginePerc >= 0.15 && marginePerc < 0.30;
                            }).length}
                          </p>
                          <p className="text-xs text-muted-foreground">Margine 15-30%</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-orange-600">
                            {products.filter((p: any) => {
                              const bom = boms.find((b: any) => b.prodottoFinitoId === p.id);
                              if (!bom) return false;
                              const prezzo = parseItalianNumber(p.prezzoVendita);
                              let costo = 0;
                              if (bom && Array.isArray(bom.components)) {
                                costo = bom.components.reduce((sum: number, comp: any) => {
                                  const compProduct = products.find((pr: any) => pr.id === comp.componenteId);
                                  return sum + (parseItalianNumber(compProduct?.prezzoAcquisto) * (comp.quantita || 1));
                                }, 0);
                              }
                              const marginePerc = prezzo > 0 ? ((prezzo - costo) / prezzo) : 0;
                              return prezzo > 0 && costo > 0 && marginePerc >= 0 && marginePerc < 0.15;
                            }).length}
                          </p>
                          <p className="text-xs text-muted-foreground">Margine 0-15%</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-red-600">
                            {products.filter((p: any) => {
                              const bom = boms.find((b: any) => b.prodottoFinitoId === p.id);
                              if (!bom) return false;
                              const prezzo = parseItalianNumber(p.prezzoVendita);
                              let costo = 0;
                              if (bom && Array.isArray(bom.components)) {
                                costo = bom.components.reduce((sum: number, comp: any) => {
                                  const compProduct = products.find((pr: any) => pr.id === comp.componenteId);
                                  return sum + (parseItalianNumber(compProduct?.prezzoAcquisto) * (comp.quantita || 1));
                                }, 0);
                              }
                              return prezzo > 0 && costo > 0 && (prezzo - costo) < 0;
                            }).length}
                          </p>
                          <p className="text-xs text-muted-foreground">In Perdita</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="catalogo" className="m-0 space-y-4">
            <CatalogoArticoli />
          </TabsContent>

          <TabsContent value="spedizioni" className="m-0 space-y-4">
            <SpedizioniTab />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  </div>

      <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedProduct ? "Modifica Prodotto" : "Nuovo Prodotto"}</DialogTitle>
            <DialogDescription>
              {selectedProduct ? "Modifica i dati del prodotto" : "Inserisci i dati del nuovo prodotto"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleProductSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="categoriaId">Categoria</Label>
                <Select 
                  name="categoriaId" 
                  value={productCategoriaId}
                  onValueChange={handleCategoryChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>
                        <span className="font-mono text-xs text-muted-foreground mr-2">[{c.prefisso || "GEN"}]</span>
                        {c.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="codice">Codice *</Label>
                <div className="flex gap-2">
                  <Input 
                    id="codice" 
                    name="codice" 
                    required 
                    value={productCodice}
                    onChange={(e) => { setProductCodice(e.target.value); setAutoGenerateCodice(false); }}
                    placeholder={isLoadingCodice ? "Generazione..." : "es. MAT-0001"}
                    className="font-mono"
                    disabled={isLoadingCodice}
                  />
                </div>
                {!selectedProduct && (
                  <p className="text-xs text-muted-foreground">
                    {autoGenerateCodice ? "Codice generato automaticamente dalla categoria" : "Codice manuale"}
                  </p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome *</Label>
                <Input 
                  id="nome" 
                  name="nome" 
                  required 
                  defaultValue={selectedProduct?.nome}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unitaMisura">Unità di Misura</Label>
                <Select name="unitaMisura" defaultValue={selectedProduct?.unitaMisura || "pz"}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {UNITA_MISURA.map((u) => (
                      <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="descrizione">Descrizione</Label>
              <Textarea 
                id="descrizione" 
                name="descrizione"
                defaultValue={selectedProduct?.descrizione}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="giacenza">Giacenza Iniziale</Label>
                <Input 
                  id="giacenza" 
                  name="giacenza" 
                  type="number"
                  step="0.01"
                  defaultValue={selectedProduct?.giacenza || "0"}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prezzoAcquisto">Prezzo Acquisto</Label>
                <Input 
                  id="prezzoAcquisto" 
                  name="prezzoAcquisto" 
                  type="number"
                  step="0.01"
                  defaultValue={selectedProduct?.prezzoAcquisto || "0"}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prezzoVendita">Prezzo Vendita</Label>
                <Input 
                  id="prezzoVendita" 
                  name="prezzoVendita" 
                  type="number"
                  step="0.01"
                  defaultValue={selectedProduct?.prezzoVendita || "0"}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="aliquotaIva">% IVA</Label>
                <Select name="aliquotaIva" defaultValue={selectedProduct?.aliquotaIva || "22"}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="22">22%</SelectItem>
                    <SelectItem value="10">10%</SelectItem>
                    <SelectItem value="4">4%</SelectItem>
                    <SelectItem value="0">Esente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="giacenzaMinima">Scorta Minima</Label>
                <Input 
                  id="giacenzaMinima" 
                  name="giacenzaMinima" 
                  type="number"
                  step="0.01"
                  defaultValue={selectedProduct?.giacenzaMinima || "0"}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ubicazione">Ubicazione</Label>
                <Input 
                  id="ubicazione" 
                  name="ubicazione" 
                  defaultValue={selectedProduct?.ubicazione}
                  placeholder="es. Scaffale A-1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="barcode">Barcode</Label>
                <Input 
                  id="barcode" 
                  name="barcode" 
                  defaultValue={selectedProduct?.barcode}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setProductDialogOpen(false)}>
                Annulla
              </Button>
              <Button type="submit">
                {selectedProduct ? "Salva Modifiche" : "Crea Prodotto"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={movementDialogOpen} onOpenChange={setMovementDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registra Movimento</DialogTitle>
            <DialogDescription>
              Prodotto: {selectedProductForMovement?.nome} (Giacenza attuale: {selectedProductForMovement?.giacenza})
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleMovementSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo Movimento *</Label>
              <Select name="tipo" required defaultValue="carico">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPI_MOVIMENTO.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      <span className={`flex items-center gap-2 ${t.color}`}>
                        <t.icon className="h-4 w-4" />
                        {t.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="causale">Causale *</Label>
              <Select name="causale" required defaultValue="acquisto">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CAUSALI.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantita">Quantità *</Label>
              <Input 
                id="quantita" 
                name="quantita" 
                type="number"
                step="0.01"
                required
                min="0.01"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="documentoRif">Documento di Riferimento</Label>
              <Input 
                id="documentoRif" 
                name="documentoRif"
                placeholder="es. DDT-2024-001"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="note">Note</Label>
              <Textarea id="note" name="note" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setMovementDialogOpen(false)}>
                Annulla
              </Button>
              <Button type="submit">Registra Movimento</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuova Categoria</DialogTitle>
            <DialogDescription>
              Il prefisso viene usato per la generazione automatica dei codici prodotto
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCategorySubmit} className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="nome">Nome *</Label>
                <Input id="nome" name="nome" required placeholder="es. Materie Prime" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prefisso">Prefisso *</Label>
                <Input 
                  id="prefisso" 
                  name="prefisso" 
                  required 
                  placeholder="MAT" 
                  maxLength={5}
                  className="font-mono uppercase"
                  style={{ textTransform: "uppercase" }}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="descrizione">Descrizione</Label>
              <Textarea id="descrizione" name="descrizione" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="colore">Colore</Label>
              <Input id="colore" name="colore" type="color" defaultValue="#3B82F6" className="h-10 w-20" />
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Esempio codici:</strong> Se inserisci "MAT" come prefisso, i prodotti avranno codici come MAT-0001, MAT-0002, ecc.
              </p>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCategoryDialogOpen(false)}>
                Annulla
              </Button>
              <Button type="submit">Crea Categoria</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={orderDialogOpen} onOpenChange={setOrderDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedOrder ? "Modifica Ordine" : "Nuovo Ordine di Produzione"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleOrderSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="numero">Numero Ordine *</Label>
                <Input 
                  id="numero" 
                  name="numero" 
                  required 
                  defaultValue={selectedOrder?.numero}
                  placeholder="es. OP-2024-001"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prodottoId">Prodotto da Produrre *</Label>
                <Select name="prodottoId" required defaultValue={selectedOrder?.prodottoId || ""}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona prodotto" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((p: any) => (
                      <SelectItem key={p.id} value={p.id}>{p.codice} - {p.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantitaRichiesta">Quantità *</Label>
                <Input 
                  id="quantitaRichiesta" 
                  name="quantitaRichiesta" 
                  type="number"
                  step="1"
                  required
                  min="1"
                  defaultValue={selectedOrder?.quantitaRichiesta || "1"}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priorita">Priorità</Label>
                <Select name="priorita" defaultValue={selectedOrder?.priorita || "normale"}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITA.map((p) => (
                      <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="stato">Stato</Label>
                <Select name="stato" defaultValue={selectedOrder?.stato || "pianificato"}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATI_ORDINE.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dataInizio">Data Inizio</Label>
                <Input 
                  id="dataInizio" 
                  name="dataInizio" 
                  type="date"
                  defaultValue={selectedOrder?.dataInizio}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dataFineStimata">Data Fine Stimata</Label>
                <Input 
                  id="dataFineStimata" 
                  name="dataFineStimata" 
                  type="date"
                  defaultValue={selectedOrder?.dataFineStimata}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="note">Note</Label>
              <Textarea 
                id="note" 
                name="note"
                defaultValue={selectedOrder?.note}
              />
            </div>
            
            {/* Sezione Articoli da Catalogo */}
            <div className="space-y-2 border-t pt-4">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Articoli da Produrre ({orderArticoli.length})
                </Label>
              </div>
              <Select onValueChange={(articleId) => {
                const article = (catalogArticles as any[])?.find((a: any) => a.id === articleId);
                if (article) {
                  setOrderArticoli(prev => [...prev, {
                    codiceArticolo: article.codice || "",
                    descrizione: article.nome || "",
                    quantita: "1",
                    unitaMisura: article.unitaMisura || "pz",
                  }]);
                }
              }}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="+ Aggiungi articolo dal catalogo" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {(catalogArticles as any[])?.map((a: any) => {
                    const giacenza = a.giacenza || 0;
                    const isLow = giacenza <= (a.stockMinimo || 0);
                    return (
                      <SelectItem key={a.id} value={a.id}>
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${isLow ? 'bg-red-500' : 'bg-green-500'}`} />
                          <span className="font-mono text-xs">{a.codice}</span>
                          <span>{a.nome}</span>
                          <span className="text-xs text-muted-foreground ml-auto">({giacenza} {a.unitaMisura})</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              
              {orderArticoli.length > 0 && (
                <div className="border rounded-md overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-muted">
                      <tr>
                        <th className="p-2 text-left">Codice</th>
                        <th className="p-2 text-left">Descrizione</th>
                        <th className="p-2 text-center w-20">Qtà</th>
                        <th className="p-2 text-center w-12"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {orderArticoli.map((art, idx) => (
                        <tr key={idx} className="border-t">
                          <td className="p-2 font-mono">{art.codiceArticolo}</td>
                          <td className="p-2">{art.descrizione}</td>
                          <td className="p-2">
                            <Input
                              type="number"
                              min="1"
                              value={art.quantita}
                              onChange={(e) => {
                                const newArticoli = [...orderArticoli];
                                newArticoli[idx].quantita = e.target.value;
                                setOrderArticoli(newArticoli);
                              }}
                              className="h-7 text-center w-16"
                            />
                          </td>
                          <td className="p-2 text-center">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setOrderArticoli(prev => prev.filter((_, i) => i !== idx))}
                              className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setOrderDialogOpen(false); setOrderArticoli([]); }}>
                Annulla
              </Button>
              <Button type="submit">
                {selectedOrder ? "Salva Modifiche" : "Crea Ordine"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={bomDialogOpen} onOpenChange={setBomDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{selectedBom ? "Modifica Distinta Base" : "Nuova Distinta Base"}</DialogTitle>
            <DialogDescription>
              Definisci la ricetta per produrre un prodotto finito
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleBomSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome Distinta *</Label>
                <Input 
                  id="nome" 
                  name="nome" 
                  required 
                  defaultValue={selectedBom?.nome}
                  placeholder="es. Sedia Mod. A - Standard"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="versione">Versione</Label>
                <Input 
                  id="versione" 
                  name="versione" 
                  defaultValue={selectedBom?.versione || "1.0"}
                  placeholder="1.0"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="prodottoFinito">Prodotto Finito *</Label>
              <Select name="prodottoFinito" required defaultValue={selectedBom?.prodottoFinito || ""}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona il prodotto da produrre" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>{p.codice} - {p.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tempoLavorazione">Tempo Lavorazione (minuti)</Label>
              <Input 
                id="tempoLavorazione" 
                name="tempoLavorazione" 
                type="number"
                defaultValue={selectedBom?.tempoLavorazione || ""}
                placeholder="es. 60"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="descrizione">Descrizione</Label>
              <Textarea 
                id="descrizione" 
                name="descrizione"
                defaultValue={selectedBom?.descrizione}
                placeholder="Note sulla lavorazione..."
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setBomDialogOpen(false)}>
                Annulla
              </Button>
              <Button type="submit">
                {selectedBom ? "Salva Modifiche" : "Crea Distinta"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={bomDetailOpen} onOpenChange={setBomDetailOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {selectedBomDetail?.nome}
            </DialogTitle>
            <DialogDescription>
              Prodotto: {getProductName(selectedBomDetail?.prodottoFinito)} | Versione: {selectedBomDetail?.versione || "1.0"}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Costo Materiali Stimato</p>
                <p className="text-lg font-bold">{formatCurrency(calculateBomCost(selectedBomDetail || {}))}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tempo Lavorazione</p>
                <p className="text-lg font-bold">{selectedBomDetail?.tempoLavorazione || "-"} min</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Componenti</p>
                <p className="text-lg font-bold">{selectedBomDetail?.components?.length || 0}</p>
              </div>
            </div>

            <div className="border rounded-lg">
              <div className="p-3 bg-muted/30 border-b font-medium">Componenti della Distinta</div>
              <div className="divide-y">
                {(!selectedBomDetail?.components || selectedBomDetail.components.length === 0) ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <Boxes className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Nessun componente aggiunto</p>
                  </div>
                ) : (
                  selectedBomDetail.components.map((comp: any) => {
                    const product = products.find((p: any) => p.id === comp.componenteId);
                    const unitCost = parseFloat(product?.prezzoAcquisto) || 0;
                    const qty = parseFloat(comp.quantita) || 0;
                    const giacenza = parseFloat(product?.giacenza) || 0;
                    const isLowStock = giacenza < qty;
                    return (
                      <div key={comp.id} className="p-3 flex items-center justify-between hover:bg-muted/20">
                        <div className="flex items-center gap-3">
                          <Package className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{product?.nome || "Prodotto non trovato"}</p>
                            <p className="text-xs text-muted-foreground">{product?.codice}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="font-semibold">{comp.quantita} {product?.unitaMisura}</p>
                            <p className="text-xs text-muted-foreground">
                              Giacenza: <span className={isLowStock ? "text-orange-500" : ""}>{giacenza}</span>
                              {isLowStock && <AlertTriangle className="h-3 w-3 inline ml-1 text-orange-500" />}
                            </p>
                          </div>
                          <div className="text-right w-24">
                            <p className="font-medium">{formatCurrency(unitCost * qty)}</p>
                            <p className="text-xs text-muted-foreground">{formatCurrency(unitCost)}/u</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteComponentMutation.mutate(comp.id)}
                          >
                            <Trash2 className="h-4 w-4 text-muted-foreground hover:text-red-500" />
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <p className="font-medium mb-3">Aggiungi Componente</p>
              <div className="flex gap-3">
                <div className="flex-1">
                  <Select 
                    value={newComponent.componenteId} 
                    onValueChange={(v) => setNewComponent({ ...newComponent, componenteId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona componente..." />
                    </SelectTrigger>
                    <SelectContent>
                      {products
                        .filter((p: any) => p.id !== selectedBomDetail?.prodottoFinito)
                        .map((p: any) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.codice} - {p.nome} (Giac: {p.giacenza})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-32">
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="Quantità"
                    value={newComponent.quantita}
                    onChange={(e) => setNewComponent({ ...newComponent, quantita: e.target.value })}
                  />
                </div>
                <Button onClick={handleAddComponent} disabled={!newComponent.componenteId || !newComponent.quantita}>
                  <Plus className="h-4 w-4 mr-1" />
                  Aggiungi
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setBomDetailOpen(false)}>
              Chiudi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={completeOrderDialogOpen} onOpenChange={setCompleteOrderDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Completa Ordine di Produzione
            </DialogTitle>
            <DialogDescription>
              Ordine: {orderToComplete?.numero}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">Prodotto:</span>
                <span className="font-medium">{getProductName(orderToComplete?.prodottoId)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Quantità da produrre:</span>
                <span className="font-bold text-lg">{orderToComplete?.quantitaRichiesta}</span>
              </div>
            </div>

            {orderToComplete?.bomId ? (
              <div className="border border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/30 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-orange-800 dark:text-orange-200">Consumo Materiali Automatico</p>
                    <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                      Completando questo ordine, i componenti della distinta base verranno automaticamente scalati dal magazzino.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="border rounded-lg p-4 bg-blue-50 dark:bg-blue-950/30">
                <p className="text-sm text-muted-foreground">
                  Nessuna distinta base associata. Il prodotto finito verrà caricato in magazzino senza consumare componenti.
                </p>
              </div>
            )}

            <div className="border rounded-lg p-4 bg-green-50 dark:bg-green-950/30">
              <div className="flex items-start gap-2">
                <ArrowUpCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-green-800 dark:text-green-200">Carico Prodotto Finito</p>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                    Verranno aggiunte {orderToComplete?.quantitaRichiesta} unità di {getProductName(orderToComplete?.prodottoId)} alla giacenza.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCompleteOrderDialogOpen(false)}>
              Annulla
            </Button>
            <Button 
              onClick={() => orderToComplete && completeOrderMutation.mutate(orderToComplete.id)}
              disabled={completeOrderMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {completeOrderMutation.isPending ? "Completamento..." : "Conferma Completamento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={labelDialogOpen} onOpenChange={setLabelDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Printer className="h-5 w-5" />
              Stampa Etichette Prodotto
            </DialogTitle>
            <DialogDescription>
              Genera e stampa etichette con codice a barre per {labelProduct?.nome}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <p className="font-medium">{labelProduct?.nome}</p>
                <p className="text-sm text-muted-foreground font-mono">{labelProduct?.codice}</p>
              </div>
              <div className="flex items-center gap-2">
                <Label>Quantità etichette:</Label>
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={labelQuantity}
                  onChange={(e) => setLabelQuantity(parseInt(e.target.value) || 1)}
                  className="w-20"
                />
              </div>
            </div>

            <div className="border rounded-lg p-6 bg-white dark:bg-gray-900">
              <p className="text-sm text-muted-foreground mb-4">Anteprima etichetta:</p>
              <div className="border-2 border-dashed rounded-lg p-4 text-center bg-white">
                <p className="font-bold text-lg mb-1">{labelProduct?.nome}</p>
                <svg id={`barcode-preview-${labelProduct?.id}`} className="mx-auto my-2" />
                <p className="font-mono text-sm text-gray-600">{labelProduct?.codice}</p>
                {labelProduct?.prezzoVendita && (
                  <p className="text-lg font-semibold mt-2">
                    {parseFloat(labelProduct.prezzoVendita).toLocaleString("it-IT", {
                      style: "currency",
                      currency: "EUR"
                    })}
                  </p>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setLabelDialogOpen(false)}>
              Annulla
            </Button>
            <Button 
              onClick={() => {
                const printWindow = window.open("", "_blank");
                if (printWindow && labelProduct) {
                  let labelsHtml = "";
                  for (let i = 0; i < labelQuantity; i++) {
                    labelsHtml += `
                      <div class="label" style="display: inline-block; width: 200px; padding: 10px; border: 1px dashed #ccc; margin: 5px; text-align: center; page-break-inside: avoid;">
                        <p style="font-weight: bold; font-size: 14px; margin: 0 0 5px 0;">${labelProduct.nome}</p>
                        <svg id="barcode-${i}"></svg>
                        <p style="font-family: monospace; font-size: 12px; margin: 5px 0;">${labelProduct.codice}</p>
                        ${labelProduct.prezzoVendita ? `<p style="font-size: 16px; font-weight: bold; margin: 5px 0;">${parseFloat(labelProduct.prezzoVendita).toLocaleString("it-IT", { style: "currency", currency: "EUR" })}</p>` : ""}
                      </div>
                    `;
                  }
                  
                  printWindow.document.write(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                      <title>Etichette - ${labelProduct.nome}</title>
                      <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
                      <style>
                        body { font-family: Arial, sans-serif; padding: 20px; }
                        @media print { .no-print { display: none; } }
                      </style>
                    </head>
                    <body>
                      <div class="no-print" style="margin-bottom: 20px;">
                        <button onclick="window.print()" style="padding: 10px 20px; font-size: 16px; cursor: pointer;">Stampa</button>
                        <button onclick="window.close()" style="padding: 10px 20px; font-size: 16px; cursor: pointer; margin-left: 10px;">Chiudi</button>
                      </div>
                      <div style="display: flex; flex-wrap: wrap;">
                        ${labelsHtml}
                      </div>
                      <script>
                        document.querySelectorAll('svg[id^="barcode-"]').forEach(function(svg, idx) {
                          JsBarcode(svg, "${labelProduct.codice || "000000"}", {
                            format: "CODE128",
                            width: 1.5,
                            height: 40,
                            displayValue: false,
                            margin: 0
                          });
                        });
                      </script>
                    </body>
                    </html>
                  `);
                  printWindow.document.close();
                }
                setLabelDialogOpen(false);
              }}
            >
              <Printer className="h-4 w-4 mr-2" />
              Genera e Stampa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
