import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Calendar, Target, Image, BarChart3, Plus, Search, MoreHorizontal, Loader2, Edit2, Trash2, Eye, Play, Pause, CheckCircle2, Clock, TrendingUp, TrendingDown, Users, Heart, MessageCircle, Share2, Youtube, Instagram, Facebook, Linkedin, Twitter, Globe, Video, FileImage, Music, ChevronLeft, ChevronRight, Euro, Megaphone, MapPin, Star, Phone, Navigation, MousePointer, ImageIcon, Building2, Reply, AlertCircle, Link2 } from "lucide-react";

type MarketingCampagna = {
  id: string;
  nome: string;
  descrizione?: string;
  obiettivo?: string;
  dataInizio?: string;
  dataFine?: string;
  budget?: string;
  spesaEffettiva?: string;
  stato: string;
  canali: string[];
  targetAudience?: string;
  kpiTarget?: string;
  kpiRaggiunto?: string;
  note?: string;
  createdAt: string;
};

type SocialContenuto = {
  id: string;
  titolo: string;
  tipo: string;
  piattaforma?: string;
  contenuto?: string;
  mediaUrl?: string;
  mediaType?: string;
  hashtags: string[];
  stato: string;
  dataPubblicazione?: string;
  oraPubblicazione?: string;
  campagnaId?: string;
  linkEsterno?: string;
  note?: string;
  createdAt: string;
};

type YoutubeVideo = {
  id: string;
  titolo: string;
  descrizione?: string;
  tags: string[];
  thumbnailUrl?: string;
  videoUrl?: string;
  youtubeId?: string;
  stato: string;
  dataPubblicazione?: string;
  durata?: string;
  categoria?: string;
  script?: string;
  storyboard?: string;
  views: number;
  likes: number;
  commenti: number;
  campagnaId?: string;
  note?: string;
  createdAt: string;
};

type SocialAnalytics = {
  id: string;
  piattaforma: string;
  dataRilevazione: string;
  followers: number;
  followersVariazione: number;
  engagement?: string;
  impressions: number;
  reach: number;
  clicks: number;
  likes: number;
  commenti: number;
  condivisioni: number;
  note?: string;
  createdAt: string;
};

type GoogleBusinessAccount = {
  id: string;
  accountId?: string;
  locationId?: string;
  nomeAttivita: string;
  indirizzo?: string;
  telefono?: string;
  sitoWeb?: string;
  categoria?: string;
  orariApertura?: string;
  isConnected: boolean;
  lastSync?: string;
  createdAt: string;
};

type GoogleBusinessReview = {
  id: string;
  accountId?: string;
  reviewId?: string;
  autore?: string;
  rating?: number;
  testo?: string;
  dataRecensione?: string;
  risposta?: string;
  dataRisposta?: string;
  rispostoTramiteApp: boolean;
  createdAt: string;
};

type GoogleBusinessPost = {
  id: string;
  accountId?: string;
  postId?: string;
  tipo: string;
  titolo?: string;
  contenuto?: string;
  callToAction?: string;
  linkCta?: string;
  mediaUrl?: string;
  stato: string;
  dataPubblicazione?: string;
  dataScadenza?: string;
  views: number;
  clicks: number;
  createdAt: string;
};

type GoogleBusinessInsight = {
  id: string;
  accountId?: string;
  dataRilevazione: string;
  visualizzazioniMappa: number;
  visualizzazioniRicerca: number;
  chiamate: number;
  richiesteDirezioni: number;
  clickSitoWeb: number;
  fotoVisualizzate: number;
  recensioniTotali: number;
  ratingMedio?: string;
  createdAt: string;
};

const PIATTAFORME = [
  { id: "youtube", nome: "YouTube", icon: Youtube, colore: "bg-red-500" },
  { id: "instagram", nome: "Instagram", icon: Instagram, colore: "bg-gradient-to-r from-purple-500 to-pink-500" },
  { id: "facebook", nome: "Facebook", icon: Facebook, colore: "bg-blue-600" },
  { id: "linkedin", nome: "LinkedIn", icon: Linkedin, colore: "bg-blue-700" },
  { id: "twitter", nome: "Twitter/X", icon: Twitter, colore: "bg-black" },
  { id: "tiktok", nome: "TikTok", icon: Play, colore: "bg-black" },
  { id: "website", nome: "Sito Web", icon: Globe, colore: "bg-green-600" },
];

const STATI_CAMPAGNA = [
  { value: "bozza", label: "Bozza", color: "bg-gray-100 text-gray-800" },
  { value: "pianificata", label: "Pianificata", color: "bg-blue-100 text-blue-800" },
  { value: "attiva", label: "Attiva", color: "bg-green-100 text-green-800" },
  { value: "in_pausa", label: "In Pausa", color: "bg-yellow-100 text-yellow-800" },
  { value: "completata", label: "Completata", color: "bg-purple-100 text-purple-800" },
  { value: "annullata", label: "Annullata", color: "bg-red-100 text-red-800" },
];

const STATI_CONTENUTO = [
  { value: "bozza", label: "Bozza", color: "bg-gray-100 text-gray-800" },
  { value: "in_revisione", label: "In Revisione", color: "bg-yellow-100 text-yellow-800" },
  { value: "approvato", label: "Approvato", color: "bg-blue-100 text-blue-800" },
  { value: "pianificato", label: "Pianificato", color: "bg-purple-100 text-purple-800" },
  { value: "pubblicato", label: "Pubblicato", color: "bg-green-100 text-green-800" },
];

export default function SocialMarketing() {
  const [activeTab, setActiveTab] = useState("calendario");

  return (
    <AppLayout>
      <div className="h-full flex flex-col overflow-hidden bg-gradient-to-br from-[#f5f0e6] via-[#e8dcc8] to-[#ddd0b8] dark:from-[#2d3748] dark:via-[#374151] dark:to-[#3d4555]">
        <div className="h-32 w-full flex-shrink-0 bg-gradient-to-r from-[#4a5568] via-[#5a6a7d] to-[#6b7a8f]" />

        <div className="flex-1 overflow-auto -mt-16 px-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <div className="bg-stone-50 dark:bg-stone-900/50 rounded-xl shadow-lg border mb-6" style={{ maxWidth: "95rem" }}>
              <div className="p-6 pb-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center shadow-lg">
                      <Megaphone className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h1 className="text-2xl font-bold tracking-tight">Social & Marketing</h1>
                      <p className="text-sm text-muted-foreground">
                        Gestisci campagne, contenuti e analizza le performance
                      </p>
                    </div>
                  </div>
                </div>

                <TabsList className="grid w-full max-w-3xl grid-cols-5 gap-1 h-auto bg-transparent p-0">
                  <TabsTrigger value="calendario" className="flex flex-col items-center justify-center gap-0.5 px-1 py-2 text-[9px] data-[state=active]:bg-primary/20 rounded-lg">
                    <Calendar className="h-4 w-4" />
                    <span>Calendario</span>
                  </TabsTrigger>
                  <TabsTrigger value="campagne" className="flex flex-col items-center justify-center gap-0.5 px-1 py-2 text-[9px] data-[state=active]:bg-primary/20 rounded-lg">
                    <Target className="h-4 w-4" />
                    <span>Campagne</span>
                  </TabsTrigger>
                  <TabsTrigger value="contenuti" className="flex flex-col items-center justify-center gap-0.5 px-1 py-2 text-[9px] data-[state=active]:bg-primary/20 rounded-lg">
                    <Image className="h-4 w-4" />
                    <span>Contenuti</span>
                  </TabsTrigger>
                  <TabsTrigger value="analytics" className="flex flex-col items-center justify-center gap-0.5 px-1 py-2 text-[9px] data-[state=active]:bg-primary/20 rounded-lg">
                    <BarChart3 className="h-4 w-4" />
                    <span>Analytics</span>
                  </TabsTrigger>
                  <TabsTrigger value="google-business" className="flex flex-col items-center justify-center gap-0.5 px-1 py-2 text-[9px] data-[state=active]:bg-primary/20 rounded-lg">
                    <MapPin className="h-4 w-4" />
                    <span>Google Business</span>
                  </TabsTrigger>
                </TabsList>
              </div>
            </div>

            <TabsContent value="calendario" className="m-0">
              <CalendarioTab />
            </TabsContent>
            <TabsContent value="campagne" className="m-0">
              <CampagneTab />
            </TabsContent>
            <TabsContent value="contenuti" className="m-0">
              <ContenutiTab />
            </TabsContent>
            <TabsContent value="analytics" className="m-0">
              <AnalyticsTab />
            </TabsContent>
            <TabsContent value="google-business" className="m-0">
              <GoogleBusinessTab />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppLayout>
  );
}

function CalendarioTab() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"month" | "week">("month");

  const { data: contenuti = [], isLoading } = useQuery<SocialContenuto[]>({
    queryKey: ["/api/social/contenuti"],
  });

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const getContenutiForDate = (date: Date | null) => {
    if (!date) return [];
    const dateStr = date.toISOString().split('T')[0];
    return contenuti.filter(c => c.dataPubblicazione === dateStr);
  };

  const navigateMonth = (direction: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const days = getDaysInMonth(currentDate);
  const weekDays = ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"];

  const getPiattaformaIcon = (piattaforma?: string) => {
    const p = PIATTAFORME.find(pl => pl.id === piattaforma);
    if (p) {
      const Icon = p.icon;
      return <Icon className="h-3 w-3" />;
    }
    return <Globe className="h-3 w-3" />;
  };

  const getPiattaformaColor = (piattaforma?: string) => {
    const p = PIATTAFORME.find(pl => pl.id === piattaforma);
    return p?.colore || "bg-gray-500";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => navigateMonth(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-lg font-semibold min-w-[200px] text-center">
              {currentDate.toLocaleDateString("it-IT", { month: "long", year: "numeric" })}
            </h2>
            <Button variant="outline" size="icon" onClick={() => navigateMonth(1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex gap-2">
            <Button
              variant={viewMode === "month" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("month")}
            >
              Mese
            </Button>
            <Button
              variant={viewMode === "week" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("week")}
            >
              Settimana
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {weekDays.map(day => (
            <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
              {day}
            </div>
          ))}
          {days.map((day, index) => {
            const dayContenuti = getContenutiForDate(day);
            const isToday = day && day.toDateString() === new Date().toDateString();

            return (
              <div
                key={index}
                className={`min-h-[100px] p-1 border rounded-lg ${day ? 'bg-background hover:bg-muted/50' : 'bg-muted/20'
                  } ${isToday ? 'ring-2 ring-primary' : ''}`}
              >
                {day && (
                  <>
                    <div className={`text-sm font-medium mb-1 ${isToday ? 'text-primary' : ''}`}>
                      {day.getDate()}
                    </div>
                    <div className="space-y-1">
                      {dayContenuti.slice(0, 3).map(contenuto => (
                        <div
                          key={contenuto.id}
                          className={`text-xs p-1 rounded flex items-center gap-1 text-white ${getPiattaformaColor(contenuto.piattaforma)}`}
                        >
                          {getPiattaformaIcon(contenuto.piattaforma)}
                          <span className="truncate">{contenuto.titolo}</span>
                        </div>
                      ))}
                      {dayContenuti.length > 3 && (
                        <div className="text-xs text-muted-foreground">
                          +{dayContenuti.length - 3} altri
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="font-semibold mb-3">Prossimi Contenuti Pianificati</h3>
        {contenuti.filter(c => c.stato === "pianificato").length === 0 ? (
          <p className="text-sm text-muted-foreground">Nessun contenuto pianificato</p>
        ) : (
          <div className="space-y-2">
            {contenuti
              .filter(c => c.stato === "pianificato")
              .sort((a, b) => (a.dataPubblicazione || "").localeCompare(b.dataPubblicazione || ""))
              .slice(0, 5)
              .map(contenuto => (
                <div key={contenuto.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className={`h-8 w-8 rounded flex items-center justify-center text-white ${getPiattaformaColor(contenuto.piattaforma)}`}>
                      {getPiattaformaIcon(contenuto.piattaforma)}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{contenuto.titolo}</p>
                      <p className="text-xs text-muted-foreground">
                        {contenuto.dataPubblicazione} {contenuto.oraPubblicazione && `alle ${contenuto.oraPubblicazione}`}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {contenuto.tipo}
                  </Badge>
                </div>
              ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function CampagneTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [editingCampagna, setEditingCampagna] = useState<MarketingCampagna | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStato, setFilterStato] = useState<string>("tutti");

  const { data: campagne = [], isLoading } = useQuery<MarketingCampagna[]>({
    queryKey: ["/api/marketing/campagne"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: Partial<MarketingCampagna>) => {
      const res = await fetch("/api/marketing/campagne", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Errore nella creazione");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketing/campagne"] });
      toast({ title: "Campagna creata", description: "La campagna e stata creata con successo" });
      setShowDialog(false);
      setEditingCampagna(null);
    },
    onError: () => {
      toast({ title: "Errore", description: "Impossibile creare la campagna", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<MarketingCampagna>) => {
      const res = await fetch(`/api/marketing/campagne/${data.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Errore nell'aggiornamento");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketing/campagne"] });
      toast({ title: "Campagna aggiornata" });
      setShowDialog(false);
      setEditingCampagna(null);
    },
    onError: () => {
      toast({ title: "Errore", description: "Impossibile aggiornare la campagna", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/marketing/campagne/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Errore nell'eliminazione");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketing/campagne"] });
      toast({ title: "Campagna eliminata" });
    },
    onError: () => {
      toast({ title: "Errore", description: "Impossibile eliminare la campagna", variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      nome: formData.get("nome") as string,
      descrizione: formData.get("descrizione") as string,
      obiettivo: formData.get("obiettivo") as string,
      dataInizio: formData.get("dataInizio") as string,
      dataFine: formData.get("dataFine") as string,
      budget: formData.get("budget") as string,
      stato: formData.get("stato") as string,
      targetAudience: formData.get("targetAudience") as string,
      kpiTarget: formData.get("kpiTarget") as string,
      canali: (formData.get("canali") as string)?.split(",").map(c => c.trim()).filter(Boolean) || [],
    };

    if (editingCampagna) {
      updateMutation.mutate({ ...data, id: editingCampagna.id });
    } else {
      createMutation.mutate(data);
    }
  };

  const filteredCampagne = campagne.filter(c => {
    const matchSearch = c.nome.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStato = filterStato === "tutti" || c.stato === filterStato;
    return matchSearch && matchStato;
  });

  const getStatoBadge = (stato: string) => {
    const s = STATI_CAMPAGNA.find(st => st.value === stato);
    return s ? <Badge className={s.color}>{s.label}</Badge> : <Badge>{stato}</Badge>;
  };

  const calculateROI = (campagna: MarketingCampagna) => {
    const budget = parseFloat(campagna.budget || "0");
    const spesa = parseFloat(campagna.spesaEffettiva || "0");
    if (budget === 0) return null;
    const roi = ((budget - spesa) / budget * 100).toFixed(1);
    return roi;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cerca campagne..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={filterStato} onValueChange={setFilterStato}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Stato" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tutti">Tutti gli stati</SelectItem>
              {STATI_CAMPAGNA.map(s => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingCampagna(null)}>
              <Plus className="h-4 w-4 mr-2" />
              Nuova Campagna
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingCampagna ? "Modifica Campagna" : "Nuova Campagna"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="nome">Nome Campagna *</Label>
                  <Input id="nome" name="nome" defaultValue={editingCampagna?.nome} required />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="descrizione">Descrizione</Label>
                  <Textarea id="descrizione" name="descrizione" defaultValue={editingCampagna?.descrizione} />
                </div>
                <div>
                  <Label htmlFor="obiettivo">Obiettivo</Label>
                  <Select name="obiettivo" defaultValue={editingCampagna?.obiettivo || "awareness"}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="awareness">Brand Awareness</SelectItem>
                      <SelectItem value="engagement">Engagement</SelectItem>
                      <SelectItem value="leads">Lead Generation</SelectItem>
                      <SelectItem value="vendite">Vendite</SelectItem>
                      <SelectItem value="traffico">Traffico Web</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="stato">Stato</Label>
                  <Select name="stato" defaultValue={editingCampagna?.stato || "bozza"}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATI_CAMPAGNA.map(s => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="dataInizio">Data Inizio</Label>
                  <Input id="dataInizio" name="dataInizio" type="date" defaultValue={editingCampagna?.dataInizio} />
                </div>
                <div>
                  <Label htmlFor="dataFine">Data Fine</Label>
                  <Input id="dataFine" name="dataFine" type="date" defaultValue={editingCampagna?.dataFine} />
                </div>
                <div>
                  <Label htmlFor="budget">Budget (EUR)</Label>
                  <Input id="budget" name="budget" type="number" step="0.01" defaultValue={editingCampagna?.budget} />
                </div>
                <div>
                  <Label htmlFor="targetAudience">Target Audience</Label>
                  <Input id="targetAudience" name="targetAudience" defaultValue={editingCampagna?.targetAudience} />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="canali">Canali (separati da virgola)</Label>
                  <Input
                    id="canali"
                    name="canali"
                    placeholder="facebook, instagram, youtube"
                    defaultValue={editingCampagna?.canali?.join(", ")}
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="kpiTarget">KPI Target</Label>
                  <Input id="kpiTarget" name="kpiTarget" placeholder="es. 1000 nuovi follower, 5000 visualizzazioni" defaultValue={editingCampagna?.kpiTarget} />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>Annulla</Button>
                <Button type="submit">{editingCampagna ? "Salva" : "Crea"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {filteredCampagne.length === 0 ? (
        <Card className="p-12 text-center">
          <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nessuna campagna</h3>
          <p className="text-muted-foreground">Crea la tua prima campagna marketing</p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredCampagne.map(campagna => {
            const roi = calculateROI(campagna);
            return (
              <Card key={campagna.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg">{campagna.nome}</h3>
                      {getStatoBadge(campagna.stato)}
                    </div>
                    {campagna.descrizione && (
                      <p className="text-sm text-muted-foreground mb-3">{campagna.descrizione}</p>
                    )}
                    <div className="flex flex-wrap gap-4 text-sm">
                      {campagna.dataInizio && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {campagna.dataInizio} - {campagna.dataFine || "In corso"}
                        </span>
                      )}
                      {campagna.budget && (
                        <span className="flex items-center gap-1">
                          <Euro className="h-4 w-4 text-muted-foreground" />
                          Budget: {new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(parseFloat(campagna.budget))}
                        </span>
                      )}
                      {roi !== null && (
                        <span className={`flex items-center gap-1 ${parseFloat(roi) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {parseFloat(roi) >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                          ROI: {roi}%
                        </span>
                      )}
                    </div>
                    {campagna.canali && campagna.canali.length > 0 && (
                      <div className="flex gap-1 mt-2">
                        {campagna.canali.map(canale => (
                          <Badge key={canale} variant="outline" className="text-xs">{canale}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => { setEditingCampagna(campagna); setShowDialog(true); }}>
                        <Edit2 className="h-4 w-4 mr-2" /> Modifica
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => deleteMutation.mutate(campagna.id)} className="text-red-600">
                        <Trash2 className="h-4 w-4 mr-2" /> Elimina
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ContenutiTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [editingContenuto, setEditingContenuto] = useState<SocialContenuto | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPiattaforma, setFilterPiattaforma] = useState<string>("tutte");
  const [activeSubTab, setActiveSubTab] = useState<"social" | "youtube">("social");

  const { data: contenuti = [], isLoading: loadingContenuti } = useQuery<SocialContenuto[]>({
    queryKey: ["/api/social/contenuti"],
  });

  const { data: videos = [], isLoading: loadingVideos } = useQuery<YoutubeVideo[]>({
    queryKey: ["/api/youtube/videos"],
  });

  const { data: campagne = [] } = useQuery<MarketingCampagna[]>({
    queryKey: ["/api/marketing/campagne"],
  });

  const createContenutoMutation = useMutation({
    mutationFn: async (data: Partial<SocialContenuto>) => {
      const res = await fetch("/api/social/contenuti", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Errore nella creazione");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/social/contenuti"] });
      toast({ title: "Contenuto creato" });
      setShowDialog(false);
      setEditingContenuto(null);
    },
    onError: () => {
      toast({ title: "Errore", description: "Impossibile creare il contenuto", variant: "destructive" });
    },
  });

  const deleteContenutoMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/social/contenuti/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Errore nell'eliminazione");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/social/contenuti"] });
      toast({ title: "Contenuto eliminato" });
    },
  });

  const handleSubmitContenuto = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      titolo: formData.get("titolo") as string,
      tipo: formData.get("tipo") as string,
      piattaforma: formData.get("piattaforma") as string,
      contenuto: formData.get("contenuto") as string,
      stato: formData.get("stato") as string,
      dataPubblicazione: formData.get("dataPubblicazione") as string,
      oraPubblicazione: formData.get("oraPubblicazione") as string,
      campagnaId: formData.get("campagnaId") as string || null,
      hashtags: (formData.get("hashtags") as string)?.split(" ").filter(h => h.startsWith("#")) || [],
    };
    createContenutoMutation.mutate(data);
  };

  const getStatoBadge = (stato: string) => {
    const s = STATI_CONTENUTO.find(st => st.value === stato);
    return s ? <Badge className={s.color}>{s.label}</Badge> : <Badge>{stato}</Badge>;
  };

  const getPiattaformaInfo = (piattaforma?: string) => {
    return PIATTAFORME.find(p => p.id === piattaforma);
  };

  const isLoading = loadingContenuti || loadingVideos;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 mb-4">
        <Button
          variant={activeSubTab === "social" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveSubTab("social")}
        >
          <Share2 className="h-4 w-4 mr-2" />
          Post Social ({contenuti.length})
        </Button>
        <Button
          variant={activeSubTab === "youtube" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveSubTab("youtube")}
        >
          <Youtube className="h-4 w-4 mr-2" />
          Video YouTube ({videos.length})
        </Button>
      </div>

      {activeSubTab === "social" && (
        <>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cerca contenuti..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={filterPiattaforma} onValueChange={setFilterPiattaforma}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Piattaforma" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tutte">Tutte</SelectItem>
                  {PIATTAFORME.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditingContenuto(null)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nuovo Contenuto
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Nuovo Contenuto Social</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmitContenuto} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Label htmlFor="titolo">Titolo *</Label>
                      <Input id="titolo" name="titolo" required />
                    </div>
                    <div>
                      <Label htmlFor="piattaforma">Piattaforma</Label>
                      <Select name="piattaforma" defaultValue="instagram">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PIATTAFORME.map(p => (
                            <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="tipo">Tipo</Label>
                      <Select name="tipo" defaultValue="post">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="post">Post</SelectItem>
                          <SelectItem value="story">Story</SelectItem>
                          <SelectItem value="reel">Reel</SelectItem>
                          <SelectItem value="video">Video</SelectItem>
                          <SelectItem value="carosello">Carosello</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="contenuto">Testo/Caption</Label>
                      <Textarea id="contenuto" name="contenuto" rows={4} />
                    </div>
                    <div>
                      <Label htmlFor="dataPubblicazione">Data Pubblicazione</Label>
                      <Input id="dataPubblicazione" name="dataPubblicazione" type="date" />
                    </div>
                    <div>
                      <Label htmlFor="oraPubblicazione">Ora</Label>
                      <Input id="oraPubblicazione" name="oraPubblicazione" type="time" />
                    </div>
                    <div>
                      <Label htmlFor="stato">Stato</Label>
                      <Select name="stato" defaultValue="bozza">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATI_CONTENUTO.map(s => (
                            <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="campagnaId">Campagna</Label>
                      <Select name="campagnaId">
                        <SelectTrigger>
                          <SelectValue placeholder="Nessuna" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Nessuna</SelectItem>
                          {campagne.map(c => (
                            <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="hashtags">Hashtags</Label>
                      <Input id="hashtags" name="hashtags" placeholder="#marketing #social #business" />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>Annulla</Button>
                    <Button type="submit">Crea</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {contenuti.length === 0 ? (
            <Card className="p-12 text-center">
              <Image className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nessun contenuto</h3>
              <p className="text-muted-foreground">Crea il tuo primo contenuto social</p>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {contenuti
                .filter(c => {
                  const matchSearch = c.titolo.toLowerCase().includes(searchTerm.toLowerCase());
                  const matchPiattaforma = filterPiattaforma === "tutte" || c.piattaforma === filterPiattaforma;
                  return matchSearch && matchPiattaforma;
                })
                .map(contenuto => {
                  const piattaforma = getPiattaformaInfo(contenuto.piattaforma);
                  const PIcon = piattaforma?.icon || Globe;
                  return (
                    <Card key={contenuto.id} className="overflow-hidden">
                      <div className={`h-2 ${piattaforma?.colore || 'bg-gray-500'}`} />
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <PIcon className="h-4 w-4" />
                            <span className="text-xs text-muted-foreground">{piattaforma?.nome}</span>
                          </div>
                          {getStatoBadge(contenuto.stato)}
                        </div>
                        <h3 className="font-semibold mb-1">{contenuto.titolo}</h3>
                        {contenuto.contenuto && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{contenuto.contenuto}</p>
                        )}
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{contenuto.dataPubblicazione || "Non pianificato"}</span>
                          <Badge variant="outline">{contenuto.tipo}</Badge>
                        </div>
                        {contenuto.hashtags && contenuto.hashtags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {contenuto.hashtags.slice(0, 3).map((tag, i) => (
                              <span key={i} className="text-xs text-blue-600">{tag}</span>
                            ))}
                          </div>
                        )}
                        <div className="flex justify-end mt-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600"
                            onClick={() => deleteContenutoMutation.mutate(contenuto.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
            </div>
          )}
        </>
      )}

      {activeSubTab === "youtube" && (
        <Card className="p-8 text-center">
          <Youtube className="h-12 w-12 mx-auto text-red-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Gestione Video YouTube</h3>
          <p className="text-muted-foreground mb-4">Pianifica, gestisci script e monitora i tuoi video</p>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Aggiungi Video
          </Button>
        </Card>
      )}
    </div>
  );
}

function AnalyticsTab() {
  const { data: analytics = [], isLoading } = useQuery<SocialAnalytics[]>({
    queryKey: ["/api/social/analytics"],
  });

  const { data: campagne = [] } = useQuery<MarketingCampagna[]>({
    queryKey: ["/api/marketing/campagne"],
  });

  const totalFollowers = analytics.reduce((sum, a) => sum + (a.followers || 0), 0);
  const totalEngagement = analytics.reduce((sum, a) => sum + (a.likes || 0) + (a.commenti || 0) + (a.condivisioni || 0), 0);
  const totalReach = analytics.reduce((sum, a) => sum + (a.reach || 0), 0);
  const campagneAttive = campagne.filter(c => c.stato === "attiva").length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Followers Totali</p>
              <p className="text-2xl font-bold">{totalFollowers.toLocaleString('it-IT')}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-pink-100 flex items-center justify-center">
              <Heart className="h-5 w-5 text-pink-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Engagement Totale</p>
              <p className="text-2xl font-bold">{totalEngagement.toLocaleString('it-IT')}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
              <Eye className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Reach Totale</p>
              <p className="text-2xl font-bold">{totalReach.toLocaleString('it-IT')}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Target className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Campagne Attive</p>
              <p className="text-2xl font-bold">{campagneAttive}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-4">
          <h3 className="font-semibold mb-4">Performance per Piattaforma</h3>
          <div className="space-y-3">
            {PIATTAFORME.slice(0, 5).map(piattaforma => {
              const Icon = piattaforma.icon;
              const piattaformaData = analytics.filter(a => a.piattaforma === piattaforma.id);
              const followers = piattaformaData.reduce((sum, a) => sum + (a.followers || 0), 0);
              return (
                <div key={piattaforma.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className={`h-8 w-8 rounded flex items-center justify-center text-white ${piattaforma.colore}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="font-medium">{piattaforma.nome}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{followers.toLocaleString('it-IT')} followers</span>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="font-semibold mb-4">Campagne Recenti</h3>
          {campagne.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nessuna campagna</p>
          ) : (
            <div className="space-y-3">
              {campagne.slice(0, 5).map(campagna => {
                const stato = STATI_CAMPAGNA.find(s => s.value === campagna.stato);
                return (
                  <div key={campagna.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{campagna.nome}</p>
                      <p className="text-xs text-muted-foreground">{campagna.dataInizio || "Non iniziata"}</p>
                    </div>
                    <Badge className={stato?.color}>{stato?.label}</Badge>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      <Card className="p-6 text-center bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-950/20 dark:to-purple-950/20">
        <BarChart3 className="h-12 w-12 mx-auto text-purple-500 mb-4" />
        <h3 className="text-lg font-semibold mb-2">Inserisci Statistiche</h3>
        <p className="text-muted-foreground mb-4 max-w-md mx-auto">
          Aggiungi manualmente le statistiche delle tue piattaforme social per tenere traccia delle performance nel tempo
        </p>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Aggiungi Statistiche
        </Button>
      </Card>
    </div>
  );
}

function GoogleBusinessTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeSubTab, setActiveSubTab] = useState("panoramica");
  const [showAccountDialog, setShowAccountDialog] = useState(false);
  const [showPostDialog, setShowPostDialog] = useState(false);
  const [showReplyDialog, setShowReplyDialog] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Partial<GoogleBusinessAccount>>({});
  const [editingPost, setEditingPost] = useState<Partial<GoogleBusinessPost>>({});
  const [selectedReview, setSelectedReview] = useState<GoogleBusinessReview | null>(null);
  const [replyText, setReplyText] = useState("");

  const { data: accounts = [], isLoading: loadingAccounts } = useQuery<GoogleBusinessAccount[]>({
    queryKey: ["/api/google-business/accounts"],
  });

  const { data: reviews = [] } = useQuery<GoogleBusinessReview[]>({
    queryKey: ["/api/google-business/reviews"],
  });

  const { data: posts = [] } = useQuery<GoogleBusinessPost[]>({
    queryKey: ["/api/google-business/posts"],
  });

  const { data: insights = [] } = useQuery<GoogleBusinessInsight[]>({
    queryKey: ["/api/google-business/insights"],
  });

  const createAccountMutation = useMutation({
    mutationFn: async (data: Partial<GoogleBusinessAccount>) => {
      const res = await fetch("/api/google-business/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Errore creazione account");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/google-business/accounts"] });
      setShowAccountDialog(false);
      setEditingAccount({});
      toast({ title: "Account aggiunto", description: "L'attività è stata registrata" });
    },
  });

  const updateAccountMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<GoogleBusinessAccount> & { id: string }) => {
      console.log('Sending PUT to update account id:', id, 'data:', data);
      const res = await fetch(`/api/google-business/accounts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Update failed:', res.status, errorText);
        throw new Error("Errore aggiornamento: " + errorText);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/google-business/accounts"] });
      setShowAccountDialog(false);
      setEditingAccount({});
      toast({ title: "Account aggiornato" });
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/google-business/accounts/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Errore eliminazione");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/google-business/accounts"] });
      toast({ title: "Account eliminato" });
    },
  });

  const createPostMutation = useMutation({
    mutationFn: async (data: Partial<GoogleBusinessPost>) => {
      const res = await fetch("/api/google-business/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Errore creazione post");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/google-business/posts"] });
      setShowPostDialog(false);
      setEditingPost({});
      toast({ title: "Post creato", description: "Il post è stato salvato" });
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/google-business/posts/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Errore eliminazione");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/google-business/posts"] });
      toast({ title: "Post eliminato" });
    },
  });

  const updateReviewMutation = useMutation({
    mutationFn: async ({ id, risposta }: { id: string; risposta: string }) => {
      const res = await fetch(`/api/google-business/reviews/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ risposta, dataRisposta: new Date().toISOString(), rispostoTramiteApp: true }),
      });
      if (!res.ok) throw new Error("Errore risposta");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/google-business/reviews"] });
      setShowReplyDialog(false);
      setSelectedReview(null);
      setReplyText("");
      toast({ title: "Risposta salvata", description: "La risposta alla recensione è stata salvata" });
    },
  });

  const handleSaveAccount = () => {
    if (!editingAccount.nomeAttivita) {
      toast({ title: "Errore", description: "Il nome attività è obbligatorio", variant: "destructive" });
      return;
    }
    if (editingAccount.id) {
      updateAccountMutation.mutate(editingAccount as GoogleBusinessAccount & { id: string });
    } else {
      createAccountMutation.mutate(editingAccount);
    }
  };

  const handleSavePost = () => {
    if (!editingPost.contenuto) {
      toast({ title: "Errore", description: "Il contenuto è obbligatorio", variant: "destructive" });
      return;
    }
    createPostMutation.mutate(editingPost);
  };

  const handleReply = () => {
    if (!selectedReview || !replyText) return;
    updateReviewMutation.mutate({ id: selectedReview.id, risposta: replyText });
  };

  const renderStars = (rating?: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${star <= (rating || 0) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
          />
        ))}
      </div>
    );
  };

  const latestInsight = insights[0];
  const totalViews = (latestInsight?.visualizzazioniMappa || 0) + (latestInsight?.visualizzazioniRicerca || 0);
  const avgRating = latestInsight?.ratingMedio ? parseFloat(latestInsight.ratingMedio) : 0;
  const pendingReviews = reviews.filter(r => !r.risposta).length;

  if (loadingAccounts) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center">
            <MapPin className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Google Business Profile</h2>
            <p className="text-sm text-muted-foreground">Gestisci la tua presenza su Google</p>
          </div>
        </div>
        <Button onClick={() => { setEditingAccount({}); setShowAccountDialog(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Aggiungi Attività
        </Button>
      </div>

      {accounts.length === 0 ? (
        <Card className="p-12 text-center">
          <Building2 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nessuna attività collegata</h3>
          <p className="text-muted-foreground mb-4 max-w-md mx-auto">
            Aggiungi la tua attività per gestire recensioni, post e statistiche di Google Business Profile
          </p>
          <Button onClick={() => { setEditingAccount({}); setShowAccountDialog(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Aggiungi Attività
          </Button>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Eye className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Visualizzazioni</p>
                  <p className="text-2xl font-bold">{totalViews.toLocaleString('it-IT')}</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                  <Star className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Rating Medio</p>
                  <p className="text-2xl font-bold">{avgRating.toFixed(1)}</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <MessageCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Recensioni Totali</p>
                  <p className="text-2xl font-bold">{reviews.length}</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center">
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Da Rispondere</p>
                  <p className="text-2xl font-bold">{pendingReviews}</p>
                </div>
              </div>
            </Card>
          </div>

          <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
            <TabsList>
              <TabsTrigger value="panoramica">Panoramica</TabsTrigger>
              <TabsTrigger value="recensioni">Recensioni</TabsTrigger>
              <TabsTrigger value="post">Post</TabsTrigger>
              <TabsTrigger value="statistiche">Statistiche</TabsTrigger>
            </TabsList>

            <TabsContent value="panoramica" className="mt-4">
              <div className="grid gap-4 md:grid-cols-2">
                {accounts.map(account => (
                  <Card key={account.id} className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center">
                          <Building2 className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{account.nomeAttivita}</h3>
                          {account.categoria && (
                            <p className="text-sm text-muted-foreground">{account.categoria}</p>
                          )}
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { setEditingAccount(account); setShowAccountDialog(true); }}>
                            <Edit2 className="h-4 w-4 mr-2" />
                            Modifica
                          </DropdownMenuItem>
                          {account.isConnected && (
                            <DropdownMenuItem onClick={async () => {
                              try {
                                const res = await fetch(`/api/google-business/sync/${account.id}`, { method: "POST" });
                                if (res.ok) {
                                  toast({ title: "Sincronizzazione completata", description: "Dati aggiornati da Google" });
                                  queryClient.invalidateQueries({ queryKey: ["/api/google-business/accounts"] });
                                  queryClient.invalidateQueries({ queryKey: ["/api/google-business/reviews"] });
                                } else {
                                  const error = await res.json();
                                  toast({ title: "Errore", description: error.error || "Sincronizzazione fallita", variant: "destructive" });
                                }
                              } catch (err) {
                                toast({ title: "Errore", description: "Errore di connessione", variant: "destructive" });
                              }
                            }}>
                              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                              Sincronizza
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem className="text-red-600" onClick={() => deleteAccountMutation.mutate(account.id)}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Elimina
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="space-y-2 text-sm">
                      {account.indirizzo && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span>{account.indirizzo}</span>
                        </div>
                      )}
                      {account.telefono && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="h-4 w-4" />
                          <span>{account.telefono}</span>
                        </div>
                      )}
                      {account.sitoWeb && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Globe className="h-4 w-4" />
                          <span>{account.sitoWeb}</span>
                        </div>
                      )}
                      {account.orariApertura && (
                        <div className="mt-2 p-2 bg-muted/30 rounded text-[11px] leading-tight">
                          <div className="font-semibold mb-1 flex items-center gap-1">
                            <Clock className="h-3 w-3" /> Orari di apertura:
                          </div>
                          <div className="grid grid-cols-2 gap-x-4">
                            {account.orariApertura.split('\n').map((line, i) => (
                              <div key={i} className="flex justify-between border-b border-muted py-0.5">
                                <span className="text-muted-foreground">{line.split(': ')[0]}</span>
                                <span className="font-medium text-foreground">{line.split(': ')[1]}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="mt-4 pt-3 border-t flex items-center justify-between">
                      <Badge variant={account.isConnected ? "default" : "secondary"}>
                        {account.isConnected ? "Connesso" : "Non connesso"}
                      </Badge>
                      {account.lastSync && (
                        <span className="text-xs text-muted-foreground">
                          Ultimo sync: {(() => {
                            const d = new Date(account.lastSync);
                            const date = d.toLocaleDateString('it-IT').replace(/\//g, '.');
                            const time = d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
                            return `${date} - ${time}`;
                          })()}
                        </span>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="recensioni" className="mt-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Recensioni Clienti</h3>
                <Button
                  variant="outline"
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = '.csv,.xlsx,.xls';
                    input.onchange = async (e: any) => {
                      const file = e.target.files[0];
                      if (!file) return;

                      const formData = new FormData();
                      formData.append('file', file);
                      formData.append('accountId', accounts[0]?.id || '');

                      try {
                        const res = await fetch('/api/google-business/import-reviews', {
                          method: 'POST',
                          body: formData
                        });

                        if (res.ok) {
                          const result = await res.json();
                          toast({
                            title: "Importazione completata",
                            description: `${result.imported} recensioni importate`
                          });
                          queryClient.invalidateQueries({ queryKey: ["/api/google-business/reviews"] });
                        } else {
                          const error = await res.json();
                          toast({
                            title: "Errore",
                            description: error.error || "Importazione fallita",
                            variant: "destructive"
                          });
                        }
                      } catch (err) {
                        toast({ title: "Errore", description: "Errore durante l'importazione", variant: "destructive" });
                      }
                    };
                    input.click();
                  }}
                >
                  <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Importa Recensioni
                </Button>
              </div>
              <div className="space-y-4">
                {reviews.length === 0 ? (
                  <Card className="p-8 text-center">
                    <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-semibold mb-2">Nessuna recensione</h3>
                    <p className="text-sm text-muted-foreground">Le recensioni appariranno qui quando verranno sincronizzate</p>
                  </Card>
                ) : (
                  reviews.map(review => (
                    <Card key={review.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-white font-semibold">
                            {review.autore?.charAt(0).toUpperCase() || "?"}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{review.autore || "Anonimo"}</span>
                              {renderStars(review.rating)}
                            </div>
                            {review.dataRecensione && (
                              <p className="text-xs text-muted-foreground">
                                {new Date(review.dataRecensione).toLocaleDateString('it-IT')}
                              </p>
                            )}
                            {review.testo && (
                              <p className="mt-2 text-sm">{review.testo}</p>
                            )}
                            {review.risposta && (
                              <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                                <p className="text-xs font-medium text-muted-foreground mb-1">La tua risposta:</p>
                                <p className="text-sm">{review.risposta}</p>
                              </div>
                            )}
                          </div>
                        </div>
                        {!review.risposta && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => { setSelectedReview(review); setShowReplyDialog(true); }}
                          >
                            <Reply className="h-4 w-4 mr-2" />
                            Rispondi
                          </Button>
                        )}
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="post" className="mt-4">
              <div className="flex justify-end mb-4">
                <Button onClick={() => { setEditingPost({ tipo: "update", stato: "bozza" }); setShowPostDialog(true); }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nuovo Post
                </Button>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {posts.length === 0 ? (
                  <Card className="p-8 text-center col-span-2">
                    <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-semibold mb-2">Nessun post</h3>
                    <p className="text-sm text-muted-foreground">Crea il tuo primo post per Google Business</p>
                  </Card>
                ) : (
                  posts.map(post => (
                    <Card key={post.id} className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <Badge variant={post.stato === "pubblicato" ? "default" : "secondary"}>
                          {post.stato === "pubblicato" ? "Pubblicato" : post.stato === "bozza" ? "Bozza" : post.stato}
                        </Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem className="text-red-600" onClick={() => deletePostMutation.mutate(post.id)}>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Elimina
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      {post.titolo && <h4 className="font-semibold mb-1">{post.titolo}</h4>}
                      <p className="text-sm text-muted-foreground line-clamp-3">{post.contenuto}</p>
                      {post.callToAction && (
                        <div className="mt-3 flex items-center gap-2 text-sm">
                          <Link2 className="h-4 w-4 text-blue-500" />
                          <span className="text-blue-500">{post.callToAction}</span>
                        </div>
                      )}
                      <div className="mt-3 pt-3 border-t flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {post.views || 0} views
                        </span>
                        <span className="flex items-center gap-1">
                          <MousePointer className="h-3 w-3" />
                          {post.clicks || 0} clicks
                        </span>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="statistiche" className="mt-4">
              <div className="grid gap-4 md:grid-cols-3">
                <Card className="p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <MapPin className="h-5 w-5 text-blue-500" />
                    <h4 className="font-semibold">Visualizzazioni Mappa</h4>
                  </div>
                  <p className="text-3xl font-bold">{(latestInsight?.visualizzazioniMappa || 0).toLocaleString('it-IT')}</p>
                </Card>
                <Card className="p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <Search className="h-5 w-5 text-green-500" />
                    <h4 className="font-semibold">Visualizzazioni Ricerca</h4>
                  </div>
                  <p className="text-3xl font-bold">{(latestInsight?.visualizzazioniRicerca || 0).toLocaleString('it-IT')}</p>
                </Card>
                <Card className="p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <Phone className="h-5 w-5 text-purple-500" />
                    <h4 className="font-semibold">Chiamate</h4>
                  </div>
                  <p className="text-3xl font-bold">{(latestInsight?.chiamate || 0).toLocaleString('it-IT')}</p>
                </Card>
                <Card className="p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <Navigation className="h-5 w-5 text-orange-500" />
                    <h4 className="font-semibold">Richieste Direzioni</h4>
                  </div>
                  <p className="text-3xl font-bold">{(latestInsight?.richiesteDirezioni || 0).toLocaleString('it-IT')}</p>
                </Card>
                <Card className="p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <MousePointer className="h-5 w-5 text-cyan-500" />
                    <h4 className="font-semibold">Click Sito Web</h4>
                  </div>
                  <p className="text-3xl font-bold">{(latestInsight?.clickSitoWeb || 0).toLocaleString('it-IT')}</p>
                </Card>
                <Card className="p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <ImageIcon className="h-5 w-5 text-pink-500" />
                    <h4 className="font-semibold">Foto Visualizzate</h4>
                  </div>
                  <p className="text-3xl font-bold">{(latestInsight?.fotoVisualizzate || 0).toLocaleString('it-IT')}</p>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}

      <Dialog open={showAccountDialog} onOpenChange={setShowAccountDialog}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <div className="h-16 -mx-6 -mt-6 mb-4 bg-gradient-to-r from-blue-500 to-green-500 rounded-t-lg flex items-center justify-center">
              <Building2 className="h-8 w-8 text-white" />
            </div>
            <DialogTitle>{editingAccount.id ? "Modifica Attività" : "Nuova Attività"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div>
              <Label>Nome Attività *</Label>
              <Input
                value={editingAccount.nomeAttivita || ""}
                onChange={(e) => setEditingAccount({ ...editingAccount, nomeAttivita: e.target.value })}
                placeholder="Nome della tua attività"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Categoria</Label>
                <Input
                  value={editingAccount.categoria || ""}
                  onChange={(e) => setEditingAccount({ ...editingAccount, categoria: e.target.value })}
                  placeholder="es. Ristorante, Negozio..."
                />
              </div>
              <div>
                <Label>Telefono</Label>
                <Input
                  value={editingAccount.telefono || ""}
                  onChange={(e) => setEditingAccount({ ...editingAccount, telefono: e.target.value })}
                  placeholder="+39..."
                />
              </div>
            </div>
            <div>
              <Label>Indirizzo</Label>
              <Input
                value={editingAccount.indirizzo || ""}
                onChange={(e) => setEditingAccount({ ...editingAccount, indirizzo: e.target.value })}
                placeholder="Via, Numero, Città"
              />
            </div>
            <div>
              <Label>Sito Web</Label>
              <Input
                value={editingAccount.sitoWeb || ""}
                onChange={(e) => setEditingAccount({ ...editingAccount, sitoWeb: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div>
              <Label className="mb-2 block">Orari di Apertura</Label>
              <div className="space-y-2 max-h-[200px] overflow-y-auto p-2 border rounded-md bg-muted/20">
                {['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'].map((giorno) => {
                  // Estrai l'orario attuale per il giorno se esiste nel formato "Giorno: Orario"
                  const currentHours = (editingAccount.orariApertura || "").split('\n').find(line => line.startsWith(giorno))?.split(': ')[1] || "";

                  return (
                    <div key={giorno} className="flex items-center justify-between gap-4 text-sm">
                      <span className="w-20 font-medium">{giorno}</span>
                      <Input
                        className="h-8 py-1"
                        value={currentHours}
                        placeholder="Es: 09:00 - 18:00"
                        onChange={(e) => {
                          const lines = (editingAccount.orariApertura || "").split('\n').filter(l => l && !l.startsWith(giorno));
                          if (e.target.value) {
                            lines.push(`${giorno}: ${e.target.value}`);
                          }
                          // Riordina per giorno della settimana
                          const sortedLines = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica']
                            .map(g => lines.find(l => l.startsWith(g)))
                            .filter(Boolean);

                          setEditingAccount({ ...editingAccount, orariApertura: sortedLines.join('\n') });
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {editingAccount.id && (
              <div className="pt-4 border-t space-y-3">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full flex items-center justify-center gap-2"
                  onClick={async () => {
                    const res = await fetch(`/api/google-business/auth-url?accountId=${editingAccount.id}`);
                    if (res.ok) {
                      const { url } = await res.json();
                      window.location.href = url;
                    } else {
                      toast({ title: "Errore", description: "Impossibile avviare la connessione", variant: "destructive" });
                    }
                  }}
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /><path d="M1 1h22v22H1z" fill="none" /></svg>
                  {editingAccount.isConnected ? "Riconnetti account Google" : "Connetti con Google"}
                </Button>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  {editingAccount.isConnected
                    ? "Account già connesso. Clicca per aggiornare la connessione o cambiare account."
                    : "Collega il tuo account Google per sincronizzare automaticamente recensioni e post."
                  }
                </p>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAccountDialog(false)}>Annulla</Button>
              <Button type="button" onClick={handleSaveAccount} disabled={createAccountMutation.isPending || updateAccountMutation.isPending}>
                {(createAccountMutation.isPending || updateAccountMutation.isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Salva
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showPostDialog} onOpenChange={setShowPostDialog}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <div className="h-16 -mx-6 -mt-6 mb-4 bg-gradient-to-r from-blue-500 to-green-500 rounded-t-lg flex items-center justify-center">
              <ImageIcon className="h-8 w-8 text-white" />
            </div>
            <DialogTitle>Nuovo Post</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div>
              <Label>Tipo di Post</Label>
              <Select value={editingPost.tipo || "update"} onValueChange={(v) => setEditingPost({ ...editingPost, tipo: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="update">Aggiornamento</SelectItem>
                  <SelectItem value="event">Evento</SelectItem>
                  <SelectItem value="offer">Offerta</SelectItem>
                  <SelectItem value="product">Prodotto</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Titolo (opzionale)</Label>
              <Input
                value={editingPost.titolo || ""}
                onChange={(e) => setEditingPost({ ...editingPost, titolo: e.target.value })}
                placeholder="Titolo del post"
              />
            </div>
            <div>
              <Label>Contenuto *</Label>
              <Textarea
                value={editingPost.contenuto || ""}
                onChange={(e) => setEditingPost({ ...editingPost, contenuto: e.target.value })}
                placeholder="Scrivi il contenuto del post..."
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Call to Action</Label>
                <Select value={editingPost.callToAction || ""} onValueChange={(v) => setEditingPost({ ...editingPost, callToAction: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BOOK">Prenota</SelectItem>
                    <SelectItem value="ORDER">Ordina</SelectItem>
                    <SelectItem value="SHOP">Acquista</SelectItem>
                    <SelectItem value="LEARN_MORE">Scopri di più</SelectItem>
                    <SelectItem value="SIGN_UP">Iscriviti</SelectItem>
                    <SelectItem value="CALL">Chiama</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Link CTA</Label>
                <Input
                  value={editingPost.linkCta || ""}
                  onChange={(e) => setEditingPost({ ...editingPost, linkCta: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </div>
            <div>
              <Label>URL Immagine</Label>
              <Input
                value={editingPost.mediaUrl || ""}
                onChange={(e) => setEditingPost({ ...editingPost, mediaUrl: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowPostDialog(false)}>Annulla</Button>
              <Button onClick={handleSavePost} disabled={createPostMutation.isPending}>
                {createPostMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Salva
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showReplyDialog} onOpenChange={setShowReplyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rispondi alla Recensione</DialogTitle>
          </DialogHeader>
          {selectedReview && (
            <div className="space-y-4">
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-semibold">{selectedReview.autore || "Anonimo"}</span>
                  {renderStars(selectedReview.rating)}
                </div>
                <p className="text-sm">{selectedReview.testo}</p>
              </div>
              <div>
                <Label>La tua risposta</Label>
                <Textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Scrivi la tua risposta..."
                  rows={4}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowReplyDialog(false)}>Annulla</Button>
                <Button onClick={handleReply} disabled={updateReviewMutation.isPending || !replyText}>
                  {updateReviewMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Invia Risposta
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
