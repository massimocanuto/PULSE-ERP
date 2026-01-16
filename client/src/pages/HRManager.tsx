import { AppLayout } from "@/components/layout/AppLayout";
import { PersonaleTab } from "./Anagrafica";
import { CopyLinkButton } from "@/components/CopyLinkButton";
import { UserCog, Users, Clock, Calendar, FileText, MapPin, Plus, Trash2, Check, X, Loader2, BarChart3, Globe, Shield, AlertTriangle, TrendingUp, Umbrella, Activity, Euro, UserCheck, AlertCircle, CalendarDays, Thermometer, Pencil, CalendarClock, Bell, Stethoscope, GraduationCap, FileCheck, Award, MoreHorizontal, CheckCircle, Network, ChevronDown, ChevronRight, User, Copy, ExternalLink, Share2, Settings, Save, Printer, Maximize2, Minimize2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { useAuth } from "@/contexts/AuthContext";
import { Textarea } from "@/components/ui/textarea";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

function DashboardKPITab() {
  const { data: kpi, isLoading } = useQuery<any>({
    queryKey: ["hr-kpi"],
    queryFn: async () => {
      const res = await fetch("/api/hr/kpi");
      return res.json();
    },
    refetchInterval: 60000,
  });

  const { data: alerts = [] } = useQuery<any[]>({
    queryKey: ["hr-alerts"],
    queryFn: async () => {
      const res = await fetch("/api/hr/alerts");
      return res.json();
    },
    refetchInterval: 300000, // ogni 5 minuti
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const kpiCards = [
    { label: "Collaboratori Attivi", value: kpi?.totaleDipendenti || 0, icon: Users, color: "text-blue-600", bg: "bg-blue-100" },
    { label: "Online Ora", value: kpi?.collaboratoriOnline || 0, icon: Activity, color: "text-green-600", bg: "bg-green-100" },
    { label: "Tasso Assenteismo", value: `${kpi?.tassoAssenteismo || 0}%`, icon: TrendingUp, color: "text-amber-600", bg: "bg-amber-100" },
    { label: "Ore Straordinario (Mese)", value: kpi?.oreStraordinarioMese || 0, icon: Clock, color: "text-purple-600", bg: "bg-purple-100" },
    { label: "Richieste Ferie in Attesa", value: kpi?.richiesteInAttesa || 0, icon: Umbrella, color: "text-cyan-600", bg: "bg-cyan-100" },
    { label: "Straordinari da Approvare", value: kpi?.straordinariInAttesa || 0, icon: AlertCircle, color: "text-orange-600", bg: "bg-orange-100" },
    { label: "Giorni Malattia (Anno)", value: kpi?.giorniMalattiaTotali || 0, icon: Thermometer, color: "text-red-600", bg: "bg-red-100" },
    { label: "Turni Programmati (Mese)", value: kpi?.turniProgrammatiMese || 0, icon: CalendarDays, color: "text-indigo-600", bg: "bg-indigo-100" },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {kpiCards.map((card, idx) => (
          <Card key={idx} className="hover:shadow-md transition-shadow">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className={`h-8 w-8 rounded-lg ${card.bg} flex items-center justify-center`}>
                  <card.icon className={`h-4 w-4 ${card.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground truncate">{card.label}</p>
                  <p className={`text-lg font-bold ${card.color}`}>{card.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Euro className="h-4 w-4" />
              Costo Personale Mensile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              {new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(kpi?.costoPersonaleMese || 0)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Include stipendi base + straordinari approvati
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              Riepilogo Assenze Mese
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600">
              {kpi?.giorniAssenzaMese || 0} giorni
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Ferie, permessi e malattie approvate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Sezione Avvisi HR */}
      {alerts.length > 0 && (
        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Bell className="h-4 w-4 text-amber-600" />
              Avvisi HR ({alerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {alerts.slice(0, 5).map((alert: any, idx: number) => (
              <div
                key={idx}
                className={`flex items-center gap-3 p-2 rounded-lg ${alert.urgenza === 'high' ? 'bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900' :
                  alert.urgenza === 'medium' ? 'bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900' :
                    'bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900'
                  }`}
              >
                <div className={`h-8 w-8 rounded-full flex items-center justify-center ${alert.tipo === 'compleanno' ? 'bg-pink-100 text-pink-600' :
                  alert.urgenza === 'high' ? 'bg-red-100 text-red-600' :
                    alert.urgenza === 'medium' ? 'bg-amber-100 text-amber-600' :
                      'bg-blue-100 text-blue-600'
                  }`}>
                  {alert.tipo === 'compleanno' ? '🎂' : <AlertTriangle className="h-4 w-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{alert.messaggio}</p>
                  {alert.reparto && <p className="text-xs text-muted-foreground">{alert.reparto}</p>}
                </div>
                {alert.giorniMancanti && (
                  <Badge variant={alert.urgenza === 'high' ? 'destructive' : 'secondary'} className="shrink-0">
                    {alert.giorniMancanti}g
                  </Badge>
                )}
              </div>
            ))}
            {alerts.length > 5 && (
              <p className="text-xs text-muted-foreground text-center pt-2">
                +{alerts.length - 5} altri avvisi
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function FeriePermessiTab() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  const [showNewRequest, setShowNewRequest] = useState(false);
  const [newRequest, setNewRequest] = useState({
    personaleId: "",
    tipo: "ferie",
    dataInizio: "",
    dataFine: "",
    giorniTotali: "1",
    motivo: "",
  });

  const { data: personale = [] } = useQuery<any[]>({
    queryKey: ["anagrafica-personale"],
    queryFn: async () => {
      const res = await fetch("/api/anagrafica/personale");
      return res.json();
    },
  });

  const { data: richieste = [], isLoading } = useQuery<any[]>({
    queryKey: ["richieste-assenza"],
    queryFn: async () => {
      const res = await fetch("/api/richieste-assenza");
      return res.json();
    },
  });

  const createRichiesta = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/richieste-assenza", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Errore");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["richieste-assenza"] });
      queryClient.invalidateQueries({ queryKey: ["hr-kpi"] });
      toast({ title: "Richiesta creata" });
      setShowNewRequest(false);
      setNewRequest({ personaleId: "", tipo: "ferie", dataInizio: "", dataFine: "", giorniTotali: "1", motivo: "" });
    },
  });

  const approvaRichiesta = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/richieste-assenza/${id}/approva`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user?.id }),
      });
      if (!res.ok) throw new Error("Errore");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["richieste-assenza"] });
      queryClient.invalidateQueries({ queryKey: ["hr-kpi"] });
      toast({ title: "Richiesta approvata" });
    },
  });

  const rifiutaRichiesta = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/richieste-assenza/${id}/rifiuta`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user?.id }),
      });
      if (!res.ok) throw new Error("Errore");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["richieste-assenza"] });
      queryClient.invalidateQueries({ queryKey: ["hr-kpi"] });
      toast({ title: "Richiesta rifiutata" });
    },
  });

  const getPersonaleName = (id: string) => {
    const p = personale.find((p: any) => p.id === id);
    return p ? `${p.nome} ${p.cognome}` : "-";
  };

  const getTipoBadge = (tipo: string) => {
    const colors: Record<string, string> = {
      ferie: "bg-blue-100 text-blue-700",
      permesso: "bg-purple-100 text-purple-700",
      malattia: "bg-red-100 text-red-700",
      maternita: "bg-pink-100 text-pink-700",
      paternita: "bg-cyan-100 text-cyan-700",
      lutto: "bg-gray-100 text-gray-700",
      altro: "bg-amber-100 text-amber-700",
    };
    return colors[tipo] || "bg-gray-100 text-gray-700";
  };

  const getStatoBadge = (stato: string) => {
    const colors: Record<string, string> = {
      richiesta: "bg-yellow-100 text-yellow-700",
      approvata: "bg-green-100 text-green-700",
      rifiutata: "bg-red-100 text-red-700",
      annullata: "bg-gray-100 text-gray-700",
    };
    return colors[stato] || "bg-gray-100 text-gray-700";
  };

  useEffect(() => {
    if (newRequest.dataInizio && newRequest.dataFine) {
      const start = new Date(newRequest.dataInizio);
      const end = new Date(newRequest.dataFine);
      const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      if (diff > 0) {
        setNewRequest(prev => ({ ...prev, giorniTotali: diff.toString() }));
      }
    }
  }, [newRequest.dataInizio, newRequest.dataFine]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Umbrella className="h-4 w-4" />
              Richieste Ferie e Permessi
            </CardTitle>
            <Dialog open={showNewRequest} onOpenChange={setShowNewRequest}>
              <DialogTrigger asChild>
                <Button size="sm" className="h-7 text-xs">
                  <Plus className="h-3 w-3 mr-1" />
                  Nuova Richiesta
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nuova Richiesta Assenza</DialogTitle>
                </DialogHeader>
                <div className="space-y-3 pt-2">
                  <div>
                    <Label className="text-xs">Collaboratore</Label>
                    <Select value={newRequest.personaleId} onValueChange={(v) => setNewRequest({ ...newRequest, personaleId: v })}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Seleziona" />
                      </SelectTrigger>
                      <SelectContent>
                        {personale.filter((p: any) => p.stato === "attivo").map((p: any) => (
                          <SelectItem key={p.id} value={p.id} className="text-xs">{p.nome} {p.cognome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Tipo</Label>
                    <Select value={newRequest.tipo} onValueChange={(v) => setNewRequest({ ...newRequest, tipo: v })}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ferie" className="text-xs">Ferie</SelectItem>
                        <SelectItem value="permesso" className="text-xs">Permesso (ROL)</SelectItem>
                        <SelectItem value="malattia" className="text-xs">Malattia</SelectItem>
                        <SelectItem value="maternita" className="text-xs">Maternità</SelectItem>
                        <SelectItem value="paternita" className="text-xs">Paternità</SelectItem>
                        <SelectItem value="lutto" className="text-xs">Lutto</SelectItem>
                        <SelectItem value="altro" className="text-xs">Altro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Data Inizio</Label>
                      <Input
                        type="date"
                        className="h-8 text-xs"
                        value={newRequest.dataInizio}
                        onChange={(e) => setNewRequest({ ...newRequest, dataInizio: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Data Fine</Label>
                      <Input
                        type="date"
                        className="h-8 text-xs"
                        value={newRequest.dataFine}
                        onChange={(e) => setNewRequest({ ...newRequest, dataFine: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Giorni Totali</Label>
                    <Input
                      type="number"
                      className="h-8 text-xs"
                      value={newRequest.giorniTotali}
                      onChange={(e) => setNewRequest({ ...newRequest, giorniTotali: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Motivo (opzionale)</Label>
                    <Textarea
                      className="text-xs min-h-[60px]"
                      value={newRequest.motivo}
                      onChange={(e) => setNewRequest({ ...newRequest, motivo: e.target.value })}
                    />
                  </div>
                  <Button
                    className="w-full h-8 text-xs"
                    onClick={() => createRichiesta.mutate(newRequest)}
                    disabled={!newRequest.personaleId || !newRequest.dataInizio || !newRequest.dataFine || createRichiesta.isPending}
                  >
                    {createRichiesta.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Plus className="h-3 w-3 mr-1" />}
                    Crea Richiesta
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : richieste.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-xs">
              Nessuna richiesta presente
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 font-medium">Collaboratore</th>
                    <th className="text-left p-2 font-medium">Tipo</th>
                    <th className="text-left p-2 font-medium">Periodo</th>
                    <th className="text-center p-2 font-medium">Giorni</th>
                    <th className="text-center p-2 font-medium">Stato</th>
                    <th className="text-center p-2 font-medium">Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {richieste.map((r: any) => (
                    <tr key={r.id} className="border-b hover:bg-muted/50">
                      <td className="p-2 font-medium uppercase">{getPersonaleName(r.personaleId)}</td>
                      <td className="p-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${getTipoBadge(r.tipo)}`}>
                          {r.tipo.charAt(0).toUpperCase() + r.tipo.slice(1)}
                        </span>
                      </td>
                      <td className="p-2">
                        {r.dataInizio === r.dataFine
                          ? format(new Date(r.dataInizio), "dd MMM yyyy", { locale: it })
                          : `${format(new Date(r.dataInizio), "dd MMM", { locale: it })} - ${format(new Date(r.dataFine), "dd MMM yyyy", { locale: it })}`
                        }
                      </td>
                      <td className="p-2 text-center font-medium">{r.giorniTotali}</td>
                      <td className="p-2 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${getStatoBadge(r.stato)}`}>
                          {r.stato.charAt(0).toUpperCase() + r.stato.slice(1)}
                        </span>
                      </td>
                      <td className="p-2 text-center">
                        {r.stato === "richiesta" && (
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                              onClick={() => approvaRichiesta.mutate(r.id)}
                              disabled={approvaRichiesta.isPending}
                            >
                              <Check className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => rifiutaRichiesta.mutate(r.id)}
                              disabled={rifiutaRichiesta.isPending}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function PresenzeTab() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedPersonale, setSelectedPersonale] = useState<string>("");
  const [filtroPersonale, setFiltroPersonale] = useState<string>("tutti");
  const [location, setLocation] = useState<{ lat: string; lng: string; address: string } | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingTimbratura, setEditingTimbratura] = useState<any>(null);
  const [editFormData, setEditFormData] = useState({ data: "", ora: "", tipo: "entrata" });

  const { data: personale = [] } = useQuery<any[]>({
    queryKey: ["anagrafica-personale"],
    queryFn: async () => {
      const res = await fetch("/api/anagrafica/personale");
      return res.json();
    },
  });

  const { data: timbrature = [], isLoading } = useQuery<any[]>({
    queryKey: ["timbrature"],
    queryFn: async () => {
      const res = await fetch("/api/timbrature");
      return res.json();
    },
  });

  const { data: turni = [] } = useQuery<any[]>({
    queryKey: ["turni"],
    queryFn: async () => {
      const res = await fetch("/api/turni");
      return res.json();
    },
  });

  const isFuoriOrario = (timbratura: any) => {
    const dataTimbratura = new Date(timbratura.dataOra);
    const dataStr = dataTimbratura.toISOString().split("T")[0];
    const oraTimbratura = dataTimbratura.getHours() * 60 + dataTimbratura.getMinutes();

    const turnoGiorno = turni.find((t: any) =>
      t.personaleId === timbratura.personaleId && t.data === dataStr
    );

    if (!turnoGiorno) return { fuori: false, motivo: "nessun_turno" };

    const [oraInizioH, oraInizioM] = turnoGiorno.oraInizio.split(":").map(Number);
    const [oraFineH, oraFineM] = turnoGiorno.oraFine.split(":").map(Number);
    const inizioMinuti = oraInizioH * 60 + oraInizioM;
    const fineMinuti = oraFineH * 60 + oraFineM;

    const tolleranza = 15;

    if (timbratura.tipo === "entrata") {
      if (oraTimbratura < inizioMinuti - tolleranza) {
        return { fuori: true, motivo: "anticipo", turno: turnoGiorno };
      }
      if (oraTimbratura > inizioMinuti + tolleranza) {
        return { fuori: true, motivo: "ritardo", turno: turnoGiorno };
      }
    } else {
      if (oraTimbratura < fineMinuti - tolleranza) {
        return { fuori: true, motivo: "uscita_anticipata", turno: turnoGiorno };
      }
      if (oraTimbratura > fineMinuti + tolleranza) {
        return { fuori: true, motivo: "straordinario", turno: turnoGiorno };
      }
    }

    return { fuori: false, motivo: "in_orario", turno: turnoGiorno };
  };

  const getFuoriOrarioLabel = (check: any) => {
    switch (check.motivo) {
      case "ritardo": return "Ritardo";
      case "anticipo": return "Anticipo";
      case "uscita_anticipata": return "Uscita anticipata";
      case "straordinario": return "Straordinario";
      default: return "";
    }
  };

  const createTimbratura = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/timbrature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Errore");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timbrature"] });
      toast({ title: "Timbratura registrata" });
      setSelectedPersonale("");
      setLocation(null);
    },
  });

  const updateTimbratura = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await fetch(`/api/timbrature/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Errore");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timbrature"] });
      toast({ title: "Timbratura modificata" });
      setEditDialogOpen(false);
      setEditingTimbratura(null);
    },
  });

  const deleteTimbratura = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/timbrature/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timbrature"] });
      toast({ title: "Timbratura eliminata" });
    },
  });

  const handleEditTimbratura = (t: any) => {
    const dt = new Date(t.dataOra);
    setEditingTimbratura(t);
    setEditFormData({
      data: dt.toISOString().split("T")[0],
      ora: dt.toTimeString().slice(0, 5),
      tipo: t.tipo,
    });
    setEditDialogOpen(true);
  };

  const handleSaveTimbratura = () => {
    if (!editingTimbratura) return;
    const dataOra = new Date(`${editFormData.data}T${editFormData.ora}:00`);
    updateTimbratura.mutate({
      id: editingTimbratura.id,
      data: { dataOra: dataOra.toISOString(), tipo: editFormData.tipo },
    });
  };

  const getLocation = () => {
    setIsGettingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude.toString();
          const lng = position.coords.longitude.toString();
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
            const data = await res.json();
            setLocation({ lat, lng, address: data.display_name || "" });
          } catch {
            setLocation({ lat, lng, address: "" });
          }
          setIsGettingLocation(false);
        },
        () => {
          toast({ title: "Impossibile ottenere la posizione", variant: "destructive" });
          setIsGettingLocation(false);
        }
      );
    }
  };

  const registraTimbratura = (tipo: "entrata" | "uscita") => {
    if (!selectedPersonale) {
      toast({ title: "Seleziona un collaboratore", variant: "destructive" });
      return;
    }
    createTimbratura.mutate({
      personaleId: selectedPersonale,
      tipo,
      latitudine: location?.lat,
      longitudine: location?.lng,
      indirizzo: location?.address,
      dispositivo: navigator.userAgent.includes("Mobile") ? "Mobile" : "Desktop",
    });
  };

  const getPersonaleNome = (id: string) => {
    const p = personale.find((x: any) => x.id === id);
    return p ? `${p.nome} ${p.cognome}` : id;
  };

  const oggi = new Date().toISOString().split("T")[0];
  const timbraturaOggi = timbrature.filter((t: any) =>
    new Date(t.dataOra).toISOString().split("T")[0] === oggi
  );

  const timbratureFiltrate = filtroPersonale === "tutti"
    ? timbrature
    : timbrature.filter((t: any) => t.personaleId === filtroPersonale);

  const calcolaOreGiornaliere = (personaleId: string, dataStr: string) => {
    const timbGiorno = timbrature.filter((t: any) => {
      const d = new Date(t.dataOra).toISOString().split("T")[0];
      return t.personaleId === personaleId && d === dataStr;
    });

    const entrate = timbGiorno.filter((t: any) => t.tipo === "entrata").sort((a: any, b: any) => new Date(a.dataOra).getTime() - new Date(b.dataOra).getTime());
    const uscite = timbGiorno.filter((t: any) => t.tipo === "uscita").sort((a: any, b: any) => new Date(a.dataOra).getTime() - new Date(b.dataOra).getTime());

    if (entrate.length === 0 || uscite.length === 0) return { ordinarie: 0, straordinarie: 0 };

    const primaEntrata = new Date(entrate[0].dataOra);
    const ultimaUscita = new Date(uscite[uscite.length - 1].dataOra);
    const oreTotali = (ultimaUscita.getTime() - primaEntrata.getTime()) / (1000 * 60 * 60);

    const turnoGiorno = turni.find((t: any) => t.personaleId === personaleId && t.data === dataStr);
    if (!turnoGiorno) return { ordinarie: Math.max(0, oreTotali), straordinarie: 0 };

    const [hi, mi] = turnoGiorno.oraInizio.split(":").map(Number);
    const [hf, mf] = turnoGiorno.oraFine.split(":").map(Number);
    const oreTurno = ((hf * 60 + mf) - (hi * 60 + mi) - (turnoGiorno.pausa || 60)) / 60;

    const ordinarie = Math.min(oreTotali, oreTurno);
    const straordinarie = Math.max(0, oreTotali - oreTurno);

    return { ordinarie: Math.round(ordinarie * 10) / 10, straordinarie: Math.round(straordinarie * 10) / 10 };
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4" />
              Registra Timbratura
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-xs">Collaboratore</Label>
              <Select value={selectedPersonale} onValueChange={setSelectedPersonale}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Seleziona collaboratore..." />
                </SelectTrigger>
                <SelectContent>
                  {personale.filter((p: any) => p.stato === "attivo").map((p: any) => (
                    <SelectItem key={p.id} value={p.id} className="text-xs">{p.nome} {p.cognome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Posizione GPS</Label>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={getLocation} disabled={isGettingLocation} className="flex-1 text-xs h-8">
                  {isGettingLocation ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <MapPin className="h-3 w-3 mr-1" />}
                  {location ? "Posizione acquisita" : "Rileva posizione"}
                </Button>
              </div>
              {location && (
                <p className="text-[10px] text-muted-foreground mt-1 truncate">{location.address}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                size="sm"
                onClick={() => registraTimbratura("entrata")}
                disabled={!selectedPersonale || createTimbratura.isPending}
                className="bg-green-600 hover:bg-green-700 text-xs h-8"
              >
                <Clock className="h-3 w-3 mr-1" />
                ENTRATA
              </Button>
              <Button
                size="sm"
                onClick={() => registraTimbratura("uscita")}
                disabled={!selectedPersonale || createTimbratura.isPending}
                className="bg-red-600 hover:bg-red-700 text-xs h-8"
              >
                <Clock className="h-3 w-3 mr-1" />
                USCITA
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Timbrature di Oggi ({timbraturaOggi.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {timbraturaOggi.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-3">Nessuna timbratura oggi</p>
              ) : (
                timbraturaOggi.map((t: any) => {
                  const check = isFuoriOrario(t);
                  return (
                    <div key={t.id} className={`flex items-center justify-between p-1.5 rounded-lg ${check.fuori ? 'bg-orange-100 dark:bg-orange-900/30 border border-orange-300 dark:border-orange-700' : 'bg-muted/50'}`}>
                      <div className="flex items-center gap-1.5">
                        <Badge variant={t.tipo === "entrata" ? "default" : "destructive"} className="text-[10px] px-1.5 py-0">
                          {t.tipo.toUpperCase()}
                        </Badge>
                        <span className="font-medium text-xs">{getPersonaleNome(t.personaleId)}</span>
                        {check.fuori && (
                          <Badge variant="outline" className="text-[9px] px-1 py-0 bg-orange-500 text-white border-orange-500">
                            <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />
                            {getFuoriOrarioLabel(check)}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(t.dataOra), "HH:mm", { locale: it })}
                        </span>
                        {check.turno && (
                          <span className="text-[9px] text-muted-foreground">
                            (turno: {check.turno.oraInizio}-{check.turno.oraFine})
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Storico Timbrature</CardTitle>
            <div className="flex items-center gap-2">
              <Label className="text-xs">Filtra per:</Label>
              <Select value={filtroPersonale} onValueChange={setFiltroPersonale}>
                <SelectTrigger className="h-7 w-48 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tutti" className="text-xs">Tutti i collaboratori</SelectItem>
                  {personale.map((p: any) => (
                    <SelectItem key={p.id} value={p.id} className="text-xs">{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs table-auto">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-1.5 whitespace-nowrap">Data/Ora</th>
                  <th className="text-left p-1.5 whitespace-nowrap">Collaboratore</th>
                  <th className="text-left p-1.5 whitespace-nowrap w-16">Tipo</th>
                  <th className="text-left p-1.5 whitespace-nowrap w-24">Stato</th>
                  <th className="text-center p-1.5 whitespace-nowrap w-16">Ore Ord.</th>
                  <th className="text-center p-1.5 whitespace-nowrap w-16">Ore Str.</th>
                  <th className="text-left p-1.5 w-auto">Posizione</th>
                  <th className="text-center p-1.5 w-16">Azioni</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={7} className="text-center py-3"><Loader2 className="h-3 w-3 animate-spin mx-auto" /></td></tr>
                ) : timbratureFiltrate.slice(0, 50).map((t: any) => {
                  const check = isFuoriOrario(t);
                  const dataStr = new Date(t.dataOra).toISOString().split("T")[0];
                  const ore = calcolaOreGiornaliere(t.personaleId, dataStr);
                  return (
                    <tr key={t.id} className={`border-b ${check.fuori ? 'bg-orange-50 dark:bg-orange-900/20' : ''}`}>
                      <td className="p-1.5">{format(new Date(t.dataOra), "dd/MM/yyyy HH:mm", { locale: it })}</td>
                      <td className="p-1.5">{getPersonaleNome(t.personaleId)}</td>
                      <td className="p-1.5">
                        <Badge variant={t.tipo === "entrata" ? "default" : "destructive"} className="text-[10px] px-1.5 py-0">{t.tipo}</Badge>
                      </td>
                      <td className="p-1.5">
                        {check.fuori ? (
                          <Badge variant="outline" className="text-[9px] px-1 py-0 bg-orange-500 text-white border-orange-500">
                            <AlertTriangle className="h-2 w-2 mr-0.5" />
                            {getFuoriOrarioLabel(check)}
                          </Badge>
                        ) : check.turno ? (
                          <Badge variant="outline" className="text-[9px] px-1 py-0 bg-green-500 text-white border-green-500">
                            <Check className="h-2 w-2 mr-0.5" />
                            In orario
                          </Badge>
                        ) : (
                          <span className="text-[9px] text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="p-1.5 text-center">
                        {ore.ordinarie > 0 ? (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-blue-100 text-blue-700 border-blue-300">
                            {ore.ordinarie}h
                          </Badge>
                        ) : "-"}
                      </td>
                      <td className="p-1.5 text-center">
                        {ore.straordinarie > 0 ? (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-purple-100 text-purple-700 border-purple-300">
                            {ore.straordinarie}h
                          </Badge>
                        ) : "-"}
                      </td>
                      <td className="p-1.5 max-w-xs truncate text-[10px] text-muted-foreground">{t.indirizzo || "-"}</td>
                      <td className="p-1.5 text-center">
                        <div className="flex justify-center gap-0.5">
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleEditTimbratura(t)}>
                            <Pencil className="h-3 w-3 text-blue-500" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => deleteTimbratura.mutate(t.id)}>
                            <Trash2 className="h-3 w-3 text-red-500" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifica Timbratura</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Collaboratore</Label>
              <Input value={editingTimbratura ? getPersonaleNome(editingTimbratura.personaleId) : ""} disabled />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Data</Label>
                <Input
                  type="date"
                  value={editFormData.data}
                  onChange={(e) => setEditFormData({ ...editFormData, data: e.target.value })}
                />
              </div>
              <div>
                <Label>Ora</Label>
                <Input
                  type="time"
                  value={editFormData.ora}
                  onChange={(e) => setEditFormData({ ...editFormData, ora: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Tipo</Label>
              <Select value={editFormData.tipo} onValueChange={(v) => setEditFormData({ ...editFormData, tipo: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="entrata">Entrata</SelectItem>
                  <SelectItem value="uscita">Uscita</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleSaveTimbratura} disabled={updateTimbratura.isPending} className="w-full">
              {updateTimbratura.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Salva Modifiche
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TurniTab() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTurno, setEditingTurno] = useState<any>(null);
  const [isSavingRegole, setIsSavingRegole] = useState(false);
  const [formData, setFormData] = useState({
    personaleId: "",
    data: "",
    oraInizio: "09:00",
    oraFine: "18:00",
    pausa: 60,
    tipologia: "ordinario",
    note: "",
  });
  const [regoleFormData, setRegoleFormData] = useState({
    maxTimbratureGiorno: 4,
    giorniLavorativi: [1, 2, 3, 4, 5],
  });

  const { data: regole } = useQuery({
    queryKey: ["regole-timbrature"],
    queryFn: async () => {
      const res = await fetch("/api/regole-timbrature");
      return res.json();
    },
  });

  useEffect(() => {
    if (regole) {
      setRegoleFormData({
        maxTimbratureGiorno: regole.maxTimbratureGiorno || 4,
        giorniLavorativi: regole.giorniLavorativi || [1, 2, 3, 4, 5],
      });
    }
  }, [regole]);

  const handleSaveRegole = async () => {
    setIsSavingRegole(true);
    try {
      const res = await fetch("/api/regole-timbrature", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(regoleFormData),
      });
      if (res.ok) {
        toast({ title: "Regole salvate con successo" });
        queryClient.invalidateQueries({ queryKey: ["regole-timbrature"] });
      } else {
        throw new Error();
      }
    } catch {
      toast({ title: "Errore nel salvataggio", variant: "destructive" });
    } finally {
      setIsSavingRegole(false);
    }
  };

  const toggleGiorno = (giorno: number) => {
    setRegoleFormData(prev => ({
      ...prev,
      giorniLavorativi: prev.giorniLavorativi.includes(giorno)
        ? prev.giorniLavorativi.filter(g => g !== giorno)
        : [...prev.giorniLavorativi, giorno].sort((a, b) => a - b),
    }));
  };

  const GIORNI_SETTIMANA = [
    { value: 1, label: "Lun" },
    { value: 2, label: "Mar" },
    { value: 3, label: "Mer" },
    { value: 4, label: "Gio" },
    { value: 5, label: "Ven" },
    { value: 6, label: "Sab" },
    { value: 0, label: "Dom" },
  ];

  const { data: personale = [] } = useQuery<any[]>({
    queryKey: ["anagrafica-personale"],
    queryFn: async () => {
      const res = await fetch("/api/anagrafica/personale");
      return res.json();
    },
  });

  const { data: turni = [], isLoading } = useQuery<any[]>({
    queryKey: ["turni"],
    queryFn: async () => {
      const res = await fetch("/api/turni");
      return res.json();
    },
  });

  const createTurno = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/turni", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Errore");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["turni"] });
      toast({ title: "Turno creato" });
      setDialogOpen(false);
      setEditingTurno(null);
      setFormData({ personaleId: "", data: "", oraInizio: "09:00", oraFine: "18:00", pausa: 60, tipologia: "ordinario", note: "" });
    },
  });

  const updateTurno = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await fetch(`/api/turni/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Errore");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["turni"] });
      toast({ title: "Turno aggiornato" });
      setDialogOpen(false);
      setEditingTurno(null);
      setFormData({ personaleId: "", data: "", oraInizio: "09:00", oraFine: "18:00", pausa: 60, tipologia: "ordinario", note: "" });
    },
  });

  const handleEditTurno = (turno: any) => {
    setEditingTurno(turno);
    setFormData({
      personaleId: turno.personaleId,
      data: turno.data,
      oraInizio: turno.oraInizio,
      oraFine: turno.oraFine,
      pausa: turno.pausa || 60,
      tipologia: turno.tipologia || "ordinario",
      note: turno.note || "",
    });
    setDialogOpen(true);
  };

  const handleSaveTurno = () => {
    if (editingTurno) {
      updateTurno.mutate({ id: editingTurno.id, data: formData });
    } else {
      createTurno.mutate(formData);
    }
  };

  const handleCloseDialog = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setEditingTurno(null);
      setFormData({ personaleId: "", data: "", oraInizio: "09:00", oraFine: "18:00", pausa: 60, tipologia: "ordinario", note: "" });
    }
  };

  const deleteTurno = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/turni/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["turni"] });
      toast({ title: "Turno eliminato" });
    },
  });

  const getPersonaleNome = (id: string) => {
    const p = personale.find((x: any) => x.id === id);
    return p ? `${p.nome} ${p.cognome}` : id;
  };

  const calcolaOre = (inizio: string, fine: string, pausa: number) => {
    const [hi, mi] = inizio.split(":").map(Number);
    const [hf, mf] = fine.split(":").map(Number);
    const minTot = (hf * 60 + mf) - (hi * 60 + mi) - pausa;
    return (minTot / 60).toFixed(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Pianificazione Turni</h2>
        <Dialog open={dialogOpen} onOpenChange={handleCloseDialog}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Nuovo Turno</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingTurno ? "Modifica Turno" : "Aggiungi Turno"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Collaboratore</Label>
                <Select value={formData.personaleId} onValueChange={(v) => setFormData({ ...formData, personaleId: v })}>
                  <SelectTrigger><SelectValue placeholder="Seleziona..." /></SelectTrigger>
                  <SelectContent>
                    {personale.filter((p: any) => p.stato === "attivo").map((p: any) => (
                      <SelectItem key={p.id} value={p.id}>{p.nome} {p.cognome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Data</Label>
                <Input type="date" value={formData.data} onChange={(e) => setFormData({ ...formData, data: e.target.value })} />
              </div>
              <div>
                <Label>Orario Predefinito</Label>
                <div className="flex gap-2 mt-1">
                  <Button type="button" variant="outline" size="sm" onClick={() => setFormData({ ...formData, oraInizio: "08:00", oraFine: "17:00", pausa: 60 })}>
                    08:00-17:00
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => setFormData({ ...formData, oraInizio: "09:00", oraFine: "18:00", pausa: 60 })}>
                    09:00-18:00
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => setFormData({ ...formData, oraInizio: "08:30", oraFine: "17:30", pausa: 60 })}>
                    08:30-17:30
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => setFormData({ ...formData, oraInizio: "06:00", oraFine: "14:00", pausa: 30 })}>
                    06:00-14:00
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Ora Inizio</Label>
                  <Input type="time" value={formData.oraInizio} onChange={(e) => setFormData({ ...formData, oraInizio: e.target.value })} />
                </div>
                <div>
                  <Label>Ora Fine</Label>
                  <Input type="time" value={formData.oraFine} onChange={(e) => setFormData({ ...formData, oraFine: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Pausa (min)</Label>
                  <Input type="number" value={formData.pausa} onChange={(e) => setFormData({ ...formData, pausa: parseInt(e.target.value) || 0 })} />
                </div>
                <div>
                  <Label>Tipologia</Label>
                  <Select value={formData.tipologia} onValueChange={(v) => setFormData({ ...formData, tipologia: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ordinario">Ordinario</SelectItem>
                      <SelectItem value="notturno">Notturno</SelectItem>
                      <SelectItem value="festivo">Festivo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Note</Label>
                <Input value={formData.note} onChange={(e) => setFormData({ ...formData, note: e.target.value })} />
              </div>
              <Button onClick={handleSaveTurno} disabled={!formData.personaleId || !formData.data || createTurno.isPending || updateTurno.isPending} className="w-full">
                {(createTurno.isPending || updateTurno.isPending) ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {editingTurno ? "Aggiorna Turno" : "Salva Turno"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="pt-4">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-1.5">Data</th>
                  <th className="text-left p-1.5">Collaboratore</th>
                  <th className="text-left p-1.5">Orario</th>
                  <th className="text-left p-1.5">Pausa</th>
                  <th className="text-left p-1.5">Ore</th>
                  <th className="text-left p-1.5">Tipo</th>
                  <th className="text-left p-1.5">Azioni</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={7} className="text-center py-3"><Loader2 className="h-3 w-3 animate-spin mx-auto" /></td></tr>
                ) : turni.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-3 text-muted-foreground">Nessun turno pianificato</td></tr>
                ) : turni.map((t: any) => (
                  <tr key={t.id} className="border-b hover:bg-muted/50">
                    <td className="p-1.5">{t.data}</td>
                    <td className="p-1.5 uppercase font-medium">{getPersonaleNome(t.personaleId)}</td>
                    <td className="p-1.5 font-mono">{t.oraInizio} - {t.oraFine}</td>
                    <td className="p-1.5">{t.pausa}m</td>
                    <td className="p-1.5 font-medium">{calcolaOre(t.oraInizio, t.oraFine, t.pausa)}h</td>
                    <td className="p-1.5">
                      <Badge variant={t.tipologia === "notturno" ? "secondary" : t.tipologia === "festivo" ? "destructive" : "default"} className="text-[10px] px-1.5 py-0">
                        {t.tipologia}
                      </Badge>
                    </td>
                    <td className="p-1.5 flex gap-0.5">
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleEditTurno(t)}>
                        <Pencil className="h-3 w-3 text-blue-500" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => deleteTurno.mutate(t.id)}>
                        <Trash2 className="h-3 w-3 text-red-500" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="py-3">
          <div className="flex justify-between items-center">
            <CardTitle className="text-sm flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Regole Timbrature
            </CardTitle>
            <Button size="sm" onClick={handleSaveRegole} disabled={isSavingRegole}>
              {isSavingRegole ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Save className="h-3 w-3 mr-1" />}
              Salva Regole
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label className="text-xs flex items-center gap-1 mb-2">
                <Clock className="h-3 w-3" />
                Limite Timbrature Giornaliere
              </Label>
              <p className="text-[10px] text-muted-foreground mb-2">
                Numero massimo di timbrature (entrate + uscite) per collaboratore al giorno
              </p>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  max={20}
                  value={regoleFormData.maxTimbratureGiorno}
                  onChange={(e) => setRegoleFormData({ ...regoleFormData, maxTimbratureGiorno: parseInt(e.target.value) || 0 })}
                  className="w-20 h-8 text-xs"
                />
                <span className="text-xs text-muted-foreground">timbrature/giorno (0 = nessun limite)</span>
              </div>
            </div>
            <div>
              <Label className="text-xs flex items-center gap-1 mb-2">
                <Calendar className="h-3 w-3" />
                Giorni Lavorativi
              </Label>
              <p className="text-[10px] text-muted-foreground mb-2">
                Giorni in cui è permesso timbrare
              </p>
              <div className="flex flex-wrap gap-1">
                {GIORNI_SETTIMANA.map((g) => (
                  <Button
                    key={g.value}
                    variant={regoleFormData.giorniLavorativi.includes(g.value) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleGiorno(g.value)}
                    className="w-10 h-7 text-[10px]"
                  >
                    {g.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StraordinariTab() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    personaleId: "",
    data: "",
    ore: "",
    motivo: "",
  });

  const { data: personale = [] } = useQuery<any[]>({
    queryKey: ["anagrafica-personale"],
    queryFn: async () => {
      const res = await fetch("/api/anagrafica/personale");
      return res.json();
    },
  });

  const { data: straordinari = [], isLoading } = useQuery<any[]>({
    queryKey: ["straordinari"],
    queryFn: async () => {
      const res = await fetch("/api/straordinari");
      return res.json();
    },
  });

  const createStraordinario = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/straordinari", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Errore");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["straordinari"] });
      toast({ title: "Richiesta straordinario creata" });
      setDialogOpen(false);
      setFormData({ personaleId: "", data: "", ore: "", motivo: "" });
    },
  });

  const approvaStraordinario = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/straordinari/${id}/approva`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user?.id }),
      });
      if (!res.ok) throw new Error("Errore");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["straordinari"] });
      toast({ title: "Straordinario approvato" });
    },
  });

  const rifiutaStraordinario = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/straordinari/${id}/rifiuta`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user?.id }),
      });
      if (!res.ok) throw new Error("Errore");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["straordinari"] });
      toast({ title: "Straordinario rifiutato" });
    },
  });

  const getPersonaleNome = (id: string) => {
    const p = personale.find((x: any) => x.id === id);
    return p ? `${p.nome} ${p.cognome}` : id;
  };

  const pendenti = straordinari.filter((s: any) => s.stato === "richiesto");
  const meseCorrente = new Date().toISOString().slice(0, 7);
  const approvatiMese = straordinari.filter((s: any) => s.stato === "approvato" && s.data?.startsWith(meseCorrente));
  const approvati = straordinari.filter((s: any) => s.stato === "approvato");

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Gestione Straordinari</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Nuova Richiesta</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Richiesta Straordinario</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Collaboratore</Label>
                <Select value={formData.personaleId} onValueChange={(v) => setFormData({ ...formData, personaleId: v })}>
                  <SelectTrigger><SelectValue placeholder="Seleziona..." /></SelectTrigger>
                  <SelectContent>
                    {personale.filter((p: any) => p.stato === "attivo").map((p: any) => (
                      <SelectItem key={p.id} value={p.id}>{p.nome} {p.cognome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Data</Label>
                <Input type="date" value={formData.data} onChange={(e) => setFormData({ ...formData, data: e.target.value })} />
              </div>
              <div>
                <Label>Ore</Label>
                <Input type="number" step="0.5" value={formData.ore} onChange={(e) => setFormData({ ...formData, ore: e.target.value })} placeholder="Es. 2.5" />
              </div>
              <div>
                <Label>Motivo</Label>
                <Input value={formData.motivo} onChange={(e) => setFormData({ ...formData, motivo: e.target.value })} />
              </div>
              <Button onClick={() => createStraordinario.mutate(formData)} disabled={!formData.personaleId || !formData.data || !formData.ore} className="w-full">
                Invia Richiesta
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card className="bg-yellow-50 dark:bg-yellow-950/20">
          <CardHeader className="pb-1 pt-3 px-3">
            <CardTitle className="text-xs text-yellow-700 dark:text-yellow-400">In Attesa</CardTitle>
          </CardHeader>
          <CardContent className="pb-3 px-3">
            <p className="text-xl font-bold text-yellow-700 dark:text-yellow-400">{pendenti.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-green-50 dark:bg-green-950/20">
          <CardHeader className="pb-1 pt-3 px-3">
            <CardTitle className="text-xs text-green-700 dark:text-green-400">Approvati (mese)</CardTitle>
          </CardHeader>
          <CardContent className="pb-3 px-3">
            <p className="text-xl font-bold text-green-700 dark:text-green-400">{approvatiMese.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-50 dark:bg-blue-950/20">
          <CardHeader className="pb-1 pt-3 px-3">
            <CardTitle className="text-xs text-blue-700 dark:text-blue-400">Ore Mese Approvate</CardTitle>
          </CardHeader>
          <CardContent className="pb-3 px-3">
            <p className="text-xl font-bold text-blue-700 dark:text-blue-400">
              {approvatiMese.reduce((sum: number, s: any) => sum + parseFloat(s.ore || "0"), 0).toFixed(1)}h
            </p>
          </CardContent>
        </Card>
      </div>

      {pendenti.length > 0 && (
        <Card>
          <CardHeader className="py-2 px-3">
            <CardTitle className="text-sm text-yellow-600">Richieste in Attesa di Approvazione</CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="space-y-1.5">
              {pendenti.map((s: any) => (
                <div key={s.id} className="flex items-center justify-between p-2 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
                  <div>
                    <p className="font-medium text-xs">{getPersonaleNome(s.personaleId)}</p>
                    <p className="text-[10px] text-muted-foreground">{s.data} - {s.ore}h - {s.motivo}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="default" className="h-6 w-6 p-0 bg-green-600 hover:bg-green-700" onClick={() => approvaStraordinario.mutate(s.id)}>
                      <Check className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="destructive" className="h-6 w-6 p-0" onClick={() => rifiutaStraordinario.mutate(s.id)}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="py-2 px-3">
          <CardTitle className="text-sm">Storico Straordinari</CardTitle>
        </CardHeader>
        <CardContent className="px-3 pb-3">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-1.5">Data</th>
                  <th className="text-left p-1.5">Collaboratore</th>
                  <th className="text-left p-1.5">Ore</th>
                  <th className="text-left p-1.5">Motivo</th>
                  <th className="text-left p-1.5">Stato</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={5} className="text-center py-3"><Loader2 className="h-3 w-3 animate-spin mx-auto" /></td></tr>
                ) : straordinari.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-3 text-muted-foreground text-xs">Nessun straordinario</td></tr>
                ) : straordinari.map((s: any) => (
                  <tr key={s.id} className="border-b">
                    <td className="p-1.5">{s.data}</td>
                    <td className="p-1.5">{getPersonaleNome(s.personaleId)}</td>
                    <td className="p-1.5 font-medium">{s.ore}h</td>
                    <td className="p-1.5">{s.motivo || "-"}</td>
                    <td className="p-1.5">
                      <Badge variant={s.stato === "approvato" ? "default" : s.stato === "rifiutato" ? "destructive" : "secondary"} className="text-[10px]">
                        {s.stato}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ReportTab() {
  const { toast } = useToast();
  const [selectedPersonaleForChart, setSelectedPersonaleForChart] = useState<string>("");
  const [reportPersonale, setReportPersonale] = useState<string>("");
  const [reportMese, setReportMese] = useState<number>(new Date().getMonth() + 1);
  const [reportAnno, setReportAnno] = useState<number>(new Date().getFullYear());
  const [emailConsulente, setEmailConsulente] = useState<string>("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const { data: personale = [] } = useQuery<any[]>({
    queryKey: ["anagrafica-personale"],
    queryFn: async () => {
      const res = await fetch("/api/anagrafica/personale");
      return res.json();
    },
  });

  const { data: timbrature = [] } = useQuery<any[]>({
    queryKey: ["timbrature"],
    queryFn: async () => {
      const res = await fetch("/api/timbrature");
      return res.json();
    },
  });

  const { data: turni = [] } = useQuery<any[]>({
    queryKey: ["turni"],
    queryFn: async () => {
      const res = await fetch("/api/turni");
      return res.json();
    },
  });

  const { data: straordinari = [] } = useQuery<any[]>({
    queryKey: ["straordinari"],
    queryFn: async () => {
      const res = await fetch("/api/straordinari");
      return res.json();
    },
  });

  const { data: cedolini = [] } = useQuery<any[]>({
    queryKey: ["cedolini"],
    queryFn: async () => {
      const res = await fetch("/api/cedolini");
      return res.json();
    },
  });

  const getPersonaleNome = (id: string) => {
    const p = personale.find((x: any) => x.id === id);
    return p ? `${p.nome} ${p.cognome}` : id;
  };

  const personaleAttivo = personale.filter((p: any) => p.stato === "attivo");

  const calcolaOreTurni = (personaleId: string) => {
    const turniPersonale = turni.filter((t: any) => t.personaleId === personaleId);
    let totale = 0;
    turniPersonale.forEach((t: any) => {
      const [hi, mi] = t.oraInizio.split(":").map(Number);
      const [hf, mf] = t.oraFine.split(":").map(Number);
      const minTot = (hf * 60 + mf) - (hi * 60 + mi) - (t.pausa || 0);
      totale += minTot / 60;
    });
    return totale.toFixed(1);
  };

  const calcolaStraordinari = (personaleId: string) => {
    const straord = straordinari.filter((s: any) => s.personaleId === personaleId && s.stato === "approvato");
    return straord.reduce((sum: number, s: any) => sum + parseFloat(s.ore || "0"), 0).toFixed(1);
  };

  const MESI_NOMI = ["Gen", "Feb", "Mar", "Apr", "Mag", "Giu", "Lug", "Ago", "Set", "Ott", "Nov", "Dic"];

  const getStoricoRetributivo = () => {
    const personaleId = selectedPersonaleForChart;
    if (!personaleId) return [];

    const cedoliniPersonale = cedolini
      .filter((c: any) => c.personaleId === personaleId)
      .sort((a: any, b: any) => {
        if (a.anno !== b.anno) return a.anno - b.anno;
        return a.mese - b.mese;
      });

    return cedoliniPersonale.map((c: any) => ({
      periodo: `${MESI_NOMI[c.mese - 1]} ${c.anno}`,
      lordo: parseFloat(c.stipendioLordo) || 0,
      netto: parseFloat(c.stipendioNetto) || 0,
      straordinari: parseFloat(c.straordinari) || 0,
    }));
  };

  const storicoData = getStoricoRetributivo();

  const getTimbratureReport = () => {
    if (!reportPersonale) return [];
    const inizio = new Date(reportAnno, reportMese - 1, 1);
    const fine = new Date(reportAnno, reportMese, 0, 23, 59, 59);

    return timbrature
      .filter((t: any) => {
        const dt = new Date(t.dataOra);
        return t.personaleId === reportPersonale && dt >= inizio && dt <= fine;
      })
      .sort((a: any, b: any) => new Date(a.dataOra).getTime() - new Date(b.dataOra).getTime());
  };

  const exportToExcel = async () => {
    setIsExporting(true);
    try {
      const reportData = getTimbratureReport();
      const persona = personale.find((p: any) => p.id === reportPersonale);

      const res = await fetch("/api/timbrature/export-excel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personaleId: reportPersonale,
          personaleNome: persona ? `${persona.nome} ${persona.cognome}` : "",
          mese: reportMese,
          anno: reportAnno,
          timbrature: reportData,
        }),
      });

      if (!res.ok) throw new Error();

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Timbrature_${persona?.cognome || "Report"}_${reportMese}_${reportAnno}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Report esportato con successo" });
    } catch {
      toast({ title: "Errore nell'esportazione", variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  };

  const sendToConsulente = async () => {
    if (!emailConsulente) {
      toast({ title: "Inserisci l'email del consulente", variant: "destructive" });
      return;
    }
    setIsSendingEmail(true);
    try {
      const persona = personale.find((p: any) => p.id === reportPersonale);

      const res = await fetch("/api/timbrature/invia-consulente", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personaleId: reportPersonale,
          personaleNome: persona ? `${persona.nome} ${persona.cognome}` : "",
          mese: reportMese,
          anno: reportAnno,
          emailConsulente,
        }),
      });

      if (!res.ok) throw new Error();
      toast({ title: "Report inviato al consulente" });
    } catch {
      toast({ title: "Errore nell'invio email", variant: "destructive" });
    } finally {
      setIsSendingEmail(false);
    }
  };

  const reportTimbrature = getTimbratureReport();

  const getReportGiornaliero = () => {
    const persona = personale.find((p: any) => p.id === reportPersonale);
    const oreContrattuali = persona?.oreSettimanali ? parseFloat(persona.oreSettimanali) / 5 : 8;
    const costoOrario = persona?.costoOrario ? parseFloat(persona.costoOrario) : 0;
    const costoStraordinario = costoOrario * 1.25;

    const grouped: Record<string, { entrate: Date[], uscite: Date[] }> = {};

    reportTimbrature.forEach((t: any) => {
      const dt = new Date(t.dataOra);
      const dateKey = dt.toISOString().split("T")[0];
      if (!grouped[dateKey]) grouped[dateKey] = { entrate: [], uscite: [] };
      if (t.tipo === "entrata") grouped[dateKey].entrate.push(dt);
      else grouped[dateKey].uscite.push(dt);
    });

    return Object.entries(grouped).map(([dateKey, { entrate, uscite }]) => {
      const primaEntrata = entrate.length > 0 ? entrate.sort((a, b) => a.getTime() - b.getTime())[0] : null;
      const ultimaUscita = uscite.length > 0 ? uscite.sort((a, b) => b.getTime() - a.getTime())[0] : null;

      let oreLavorate = 0;
      if (primaEntrata && ultimaUscita) {
        oreLavorate = (ultimaUscita.getTime() - primaEntrata.getTime()) / (1000 * 60 * 60);
      }

      const oreOrdinarie = Math.min(oreLavorate, oreContrattuali);
      const oreStraordinarie = Math.max(0, oreLavorate - oreContrattuali);
      const costoOrdinarie = oreOrdinarie * costoOrario;
      const costoStraord = oreStraordinarie * costoStraordinario;

      return {
        data: dateKey,
        entrata: primaEntrata,
        uscita: ultimaUscita,
        oreOrdinarie: oreOrdinarie.toFixed(2),
        oreStraordinarie: oreStraordinarie.toFixed(2),
        costoOrdinarie: costoOrdinarie.toFixed(2),
        costoStraordinarie: costoStraord.toFixed(2),
        costoTotale: (costoOrdinarie + costoStraord).toFixed(2),
      };
    }).sort((a, b) => a.data.localeCompare(b.data));
  };

  const reportGiornaliero = getReportGiornaliero();
  const totali = reportGiornaliero.reduce((acc, r) => ({
    oreOrdinarie: acc.oreOrdinarie + parseFloat(r.oreOrdinarie),
    oreStraordinarie: acc.oreStraordinarie + parseFloat(r.oreStraordinarie),
    costoOrdinarie: acc.costoOrdinarie + parseFloat(r.costoOrdinarie),
    costoStraordinarie: acc.costoStraordinarie + parseFloat(r.costoStraordinarie),
    costoTotale: acc.costoTotale + parseFloat(r.costoTotale),
  }), { oreOrdinarie: 0, oreStraordinarie: 0, costoOrdinarie: 0, costoStraordinarie: 0, costoTotale: 0 });

  const printReport = () => {
    const persona = personale.find((p: any) => p.id === reportPersonale);
    const MESI = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"];
    const reportData = getReportGiornaliero();
    const tot = reportData.reduce((acc, r) => ({
      oreOrdinarie: acc.oreOrdinarie + parseFloat(r.oreOrdinarie),
      oreStraordinarie: acc.oreStraordinarie + parseFloat(r.oreStraordinarie),
      costoTotale: acc.costoTotale + parseFloat(r.costoTotale),
    }), { oreOrdinarie: 0, oreStraordinarie: 0, costoTotale: 0 });

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Report Timbrature - ${persona ? `${persona.nome} ${persona.cognome}`.toUpperCase() : ""}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { font-size: 18px; margin-bottom: 5px; }
          h2 { font-size: 14px; color: #666; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f5f5f5; }
          .text-right { text-align: right; }
          .footer { margin-top: 10px; font-size: 11px; color: #666; background: #f9f9f9; padding: 10px; }
          .totals { font-weight: bold; background: #f0f0f0; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <h1>Report Timbrature</h1>
        <h2>${persona ? `${persona.nome} ${persona.cognome}`.toUpperCase() : ""} - ${MESI[reportMese - 1]} ${reportAnno}</h2>
        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>Entrata</th>
              <th>Uscita</th>
              <th class="text-right">Ore Ord.</th>
              <th class="text-right">Ore Str.</th>
              <th class="text-right">Costo</th>
            </tr>
          </thead>
          <tbody>
            ${reportData.map((r: any) => `
              <tr>
                <td>${new Date(r.data).toLocaleDateString("it-IT", { weekday: "short", day: "2-digit", month: "2-digit" })}</td>
                <td>${r.entrata ? r.entrata.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }) : "-"}</td>
                <td>${r.uscita ? r.uscita.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }) : "-"}</td>
                <td class="text-right">${r.oreOrdinarie}</td>
                <td class="text-right">${r.oreStraordinarie}</td>
                <td class="text-right">${r.costoTotale} &euro;</td>
              </tr>
            `).join("")}
            <tr class="totals">
              <td colspan="3"><strong>TOTALE</strong></td>
              <td class="text-right"><strong>${tot.oreOrdinarie.toFixed(2)}</strong></td>
              <td class="text-right"><strong>${tot.oreStraordinarie.toFixed(2)}</strong></td>
              <td class="text-right"><strong>${tot.costoTotale.toFixed(2)} &euro;</strong></td>
            </tr>
          </tbody>
        </table>
        <div class="footer">${reportData.length} giorni lavorativi</div>
        <script>window.print();</script>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Card className="p-3">
          <CardHeader className="p-0 pb-1">
            <CardTitle className="text-xs text-muted-foreground">Collaboratori Attivi</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <p className="text-xl font-bold">{personaleAttivo.length}</p>
          </CardContent>
        </Card>
        <Card className="p-3">
          <CardHeader className="p-0 pb-1">
            <CardTitle className="text-xs text-muted-foreground">Timbrature Totali</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <p className="text-xl font-bold">{timbrature.length}</p>
          </CardContent>
        </Card>
        <Card className="p-3">
          <CardHeader className="p-0 pb-1">
            <CardTitle className="text-xs text-muted-foreground">Turni Pianificati</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <p className="text-xl font-bold">{turni.length}</p>
          </CardContent>
        </Card>
        <Card className="p-3">
          <CardHeader className="p-0 pb-1">
            <CardTitle className="text-xs text-muted-foreground">Straordinari Approvati</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <p className="text-xl font-bold">{straordinari.filter((s: any) => s.stato === "approvato").length}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="py-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <BarChart3 className="h-4 w-4" />
            Riepilogo Ore per Collaboratore
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-1.5">Collaboratore</th>
                  <th className="text-left p-1.5">Reparto</th>
                  <th className="text-right p-1.5">Ore Pianif.</th>
                  <th className="text-right p-1.5">Straord.</th>
                  <th className="text-right p-1.5">Totale</th>
                </tr>
              </thead>
              <tbody>
                {personaleAttivo.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-3 text-muted-foreground">Nessun collaboratore attivo</td></tr>
                ) : personaleAttivo.map((p: any) => {
                  const oreTurni = parseFloat(calcolaOreTurni(p.id));
                  const oreStraordinari = parseFloat(calcolaStraordinari(p.id));
                  return (
                    <tr key={p.id} className="border-b">
                      <td className="p-1.5 font-medium uppercase">{p.nome} {p.cognome}</td>
                      <td className="p-1.5 text-muted-foreground">{p.reparto || "-"}</td>
                      <td className="p-1.5 text-right">{oreTurni}h</td>
                      <td className="p-1.5 text-right text-green-600">{oreStraordinari}h</td>
                      <td className="p-1.5 text-right font-bold">{(oreTurni + oreStraordinari).toFixed(1)}h</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="py-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Euro className="h-4 w-4" />
            Storico Retributivo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Label className="text-xs">Seleziona Collaboratore</Label>
            <Select value={selectedPersonaleForChart} onValueChange={setSelectedPersonaleForChart}>
              <SelectTrigger className="w-64 h-8 text-xs">
                <SelectValue placeholder="Seleziona un collaboratore..." />
              </SelectTrigger>
              <SelectContent>
                {personaleAttivo.map((p: any) => (
                  <SelectItem key={p.id} value={p.id} className="text-xs">
                    {p.nome} {p.cognome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedPersonaleForChart ? (
            storicoData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={storicoData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-50" />
                    <XAxis dataKey="periodo" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `€${v}`} />
                    <Tooltip
                      formatter={(value: number) => [`€${value.toFixed(2)}`, ""]}
                      labelStyle={{ fontWeight: "bold" }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line type="monotone" dataKey="lordo" name="Lordo" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="netto" name="Netto" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="straordinari" name="Straordinari" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
                Nessun cedolino disponibile per questo collaboratore
              </div>
            )
          ) : (
            <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
              Seleziona un collaboratore per visualizzare lo storico retributivo
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="py-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4" />
            Report Timbrature per Consulente Paghe
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
            <div>
              <Label className="text-xs">Collaboratore</Label>
              <Select value={reportPersonale} onValueChange={setReportPersonale}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Seleziona..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tutti" className="text-xs">Tutti i collaboratori</SelectItem>
                  {personaleAttivo.map((p: any) => (
                    <SelectItem key={p.id} value={p.id} className="text-xs">
                      {p.nome} {p.cognome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Mese</Label>
              <Select value={reportMese.toString()} onValueChange={(v) => setReportMese(parseInt(v))}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MESI_NOMI.map((m, i) => (
                    <SelectItem key={i} value={(i + 1).toString()} className="text-xs">{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Anno</Label>
              <Select value={reportAnno.toString()} onValueChange={(v) => setReportAnno(parseInt(v))}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[2023, 2024, 2025, 2026].map((a) => (
                    <SelectItem key={a} value={a.toString()} className="text-xs">{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Email Consulente</Label>
              <Input
                type="email"
                placeholder="consulente@studio.it"
                value={emailConsulente}
                onChange={(e) => setEmailConsulente(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </div>

          <div className="flex gap-2 mb-4">
            <Button
              size="sm"
              variant="outline"
              onClick={exportToExcel}
              disabled={!reportPersonale || isExporting}
              className="text-xs"
            >
              {isExporting ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <FileText className="h-3 w-3 mr-1" />}
              Esporta Excel
            </Button>
            <Button
              size="sm"
              onClick={sendToConsulente}
              disabled={!reportPersonale || !emailConsulente || isSendingEmail}
              className="text-xs"
            >
              {isSendingEmail ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Activity className="h-3 w-3 mr-1" />}
              Invia al Consulente
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={printReport}
              disabled={!reportPersonale || reportGiornaliero.length === 0}
              className="text-xs"
            >
              <Printer className="h-3 w-3 mr-1" />
              Stampa
            </Button>
          </div>

          {reportPersonale && (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left px-2 py-1 text-xs font-medium">Data</th>
                    <th className="text-left px-2 py-1 text-xs font-medium">Giorno</th>
                    <th className="text-left px-2 py-1 text-xs font-medium">Entrata</th>
                    <th className="text-left px-2 py-1 text-xs font-medium">Uscita</th>
                    <th className="text-right px-2 py-1 text-xs font-medium">Ore Ordinarie</th>
                    <th className="text-right px-2 py-1 text-xs font-medium">Straordinari</th>
                    <th className="text-right px-2 py-1 text-xs font-medium">Costo</th>
                  </tr>
                </thead>
                <tbody>
                  {reportGiornaliero.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">Nessuna timbratura nel periodo selezionato</td></tr>
                  ) : reportGiornaliero.map((r: any) => {
                    const dataObj = new Date(r.data);
                    const giorno = dataObj.getDay();
                    const isWeekend = giorno === 0 || giorno === 6;
                    const hasStraordinari = parseFloat(r.oreStraordinarie) > 0;
                    const rowBg = isWeekend ? 'bg-blue-50/60 dark:bg-blue-950/30' :
                      hasStraordinari ? 'bg-orange-100/80 dark:bg-orange-950/40' : '';
                    const borderLeft = hasStraordinari ? 'border-l-4 border-l-orange-500' : '';
                    return (
                      <tr key={r.data} className={`border-t ${rowBg} ${borderLeft} hover:bg-muted/50`}>
                        <td className="px-2 py-1 font-medium">
                          <span className="flex items-center gap-1">
                            {format(dataObj, "dd/MM/yyyy")}
                            {hasStraordinari && <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>}
                          </span>
                        </td>
                        <td className="px-2 py-1 text-muted-foreground capitalize">{format(dataObj, "EEEE", { locale: it })}</td>
                        <td className="px-2 py-1 font-mono text-green-600 font-medium">{r.entrata ? r.entrata.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }) : <span className="text-muted-foreground">-</span>}</td>
                        <td className="px-2 py-1 font-mono text-red-600 font-medium">{r.uscita ? r.uscita.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }) : <span className="text-muted-foreground">-</span>}</td>
                        <td className="px-2 py-1 text-right font-mono font-medium">{r.oreOrdinarie}</td>
                        <td className="px-2 py-1 text-right font-mono text-orange-600 font-medium">{hasStraordinari ? r.oreStraordinarie : <span className="text-muted-foreground">-</span>}</td>
                        <td className="px-2 py-1 text-right font-mono font-semibold">{parseFloat(r.costoTotale).toFixed(2)} €</td>
                      </tr>
                    );
                  })}
                </tbody>
                {reportGiornaliero.length > 0 && (
                  <tfoot className="bg-muted/30 border-t-2">
                    <tr>
                      <td colSpan={4} className="px-2 py-2 text-right text-xs font-semibold">Totali:</td>
                      <td className="px-2 py-2 text-xs font-bold text-right font-mono">{totali.oreOrdinarie.toFixed(2)} h</td>
                      <td className="px-2 py-2 text-xs font-bold text-right font-mono text-orange-600">{totali.oreStraordinarie.toFixed(2)} h</td>
                      <td className="px-2 py-2 text-xs font-bold text-right font-mono">{totali.costoTotale.toFixed(2)} €</td>
                    </tr>
                  </tfoot>
                )}
              </table>
              {reportGiornaliero.length > 0 && (
                <div className="px-2 py-1.5 bg-muted/20 text-[10px] text-muted-foreground border-t flex items-center justify-between">
                  <span>{reportGiornaliero.length} giorni lavorativi</span>
                  <span className="flex items-center gap-3">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400"></span> Weekend</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-400"></span> Straordinari</span>
                  </span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function AccessiPortaleTab() {
  const { data: personale = [], isLoading } = useQuery<any[]>({
    queryKey: ["anagrafica-personale"],
    queryFn: async () => {
      const res = await fetch("/api/anagrafica/personale");
      return res.json();
    },
  });

  const personaleConPortale = personale.filter((p: any) => p.portalEnabled);
  const onlineNow = personaleConPortale.filter((p: any) => {
    if (!p.portalLastAccess) return false;
    const lastAccess = new Date(p.portalLastAccess);
    const now = new Date();
    const diffMinutes = (now.getTime() - lastAccess.getTime()) / (1000 * 60);
    return diffMinutes < 15;
  });

  const formatLastAccess = (date: string | null) => {
    if (!date) return "Mai";
    try {
      return format(new Date(date), "dd/MM/yyyy HH:mm", { locale: it });
    } catch {
      return "N/D";
    }
  };

  const getStatusBadge = (lastAccess: string | null) => {
    if (!lastAccess) return <Badge variant="outline" className="text-xs">Mai connesso</Badge>;
    const last = new Date(lastAccess);
    const now = new Date();
    const diffMinutes = (now.getTime() - last.getTime()) / (1000 * 60);

    if (diffMinutes < 15) {
      return <Badge className="bg-green-500 text-xs">Online</Badge>;
    } else if (diffMinutes < 60) {
      return <Badge variant="secondary" className="text-xs">Recente</Badge>;
    } else if (diffMinutes < 1440) {
      return <Badge variant="outline" className="text-xs">Oggi</Badge>;
    } else {
      return <Badge variant="outline" className="text-xs text-muted-foreground">Offline</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Shield className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xl font-bold">{personaleConPortale.length}</p>
                <p className="text-xs text-muted-foreground">Portale Abilitato</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Globe className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-xl font-bold">{onlineNow.length}</p>
                <p className="text-xs text-muted-foreground">Online Adesso</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Users className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <p className="text-xl font-bold">{personale.length - personaleConPortale.length}</p>
                <p className="text-xs text-muted-foreground">Senza Accesso</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Accessi Portale Collaboratori
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-1.5">Collaboratore</th>
                  <th className="text-left p-1.5">Username</th>
                  <th className="text-left p-1.5">Reparto</th>
                  <th className="text-left p-1.5">Ultimo Accesso</th>
                  <th className="text-center p-1.5">Stato</th>
                  <th className="text-center p-1.5">Azioni</th>
                </tr>
              </thead>
              <tbody>
                {personale.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-6 text-muted-foreground">
                      Nessun collaboratore registrato
                    </td>
                  </tr>
                ) : (
                  personale
                    .sort((a: any, b: any) => {
                      if (!a.portalLastAccess && !b.portalLastAccess) return 0;
                      if (!a.portalLastAccess) return 1;
                      if (!b.portalLastAccess) return -1;
                      return new Date(b.portalLastAccess).getTime() - new Date(a.portalLastAccess).getTime();
                    })
                    .map((p: any) => (
                      <tr key={p.id} className="border-b hover:bg-muted/50">
                        <td className="p-1.5">
                          <div className="flex items-center gap-1.5">
                            <div className="h-5 w-5 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center text-white text-[9px] font-medium">
                              {p.nome?.[0]}{p.cognome?.[0]}
                            </div>
                            <span className="font-medium text-xs uppercase">{p.nome} {p.cognome}</span>
                          </div>
                        </td>
                        <td className="p-1.5 text-muted-foreground">
                          {p.portalUsername || "-"}
                        </td>
                        <td className="p-1.5 text-muted-foreground">
                          {p.reparto || "-"}
                        </td>
                        <td className="p-1.5">
                          {p.portalEnabled ? formatLastAccess(p.portalLastAccess) : "-"}
                        </td>
                        <td className="p-1.5 text-center">
                          {p.portalEnabled ? getStatusBadge(p.portalLastAccess) : (
                            <Badge variant="outline" className="text-[10px] text-muted-foreground">Disabilitato</Badge>
                          )}
                        </td>
                        <td className="p-1.5 text-center">
                          {p.portalEnabled && p.portalToken ? (
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 text-[10px] px-2 bg-gradient-to-r from-teal-500 to-emerald-500 text-white border-0 hover:from-teal-600 hover:to-emerald-600"
                                onClick={() => window.open(`/portale-collaboratori?token=${p.portalToken}`, '_blank')}
                                title="Apri il portale"
                              >
                                <ExternalLink className="h-3 w-3 mr-1" />
                                Apri
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 w-6 p-0"
                                onClick={() => {
                                  navigator.clipboard.writeText(`${window.location.origin}/portale-collaboratori?token=${p.portalToken}`);
                                  const toast = document.createElement('div');
                                  toast.className = 'fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-in fade-in slide-in-from-bottom-4';
                                  toast.textContent = 'Link copiato!';
                                  document.body.appendChild(toast);
                                  setTimeout(() => toast.remove(), 2000);
                                }}
                                title="Copia link"
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-[10px]">-</span>
                          )}
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ScadenzarioTab() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingScadenza, setEditingScadenza] = useState<any>(null);
  const [filterTipo, setFilterTipo] = useState<string>("tutti");
  const [showCompleted, setShowCompleted] = useState(false);

  const { data: scadenze = [], isLoading } = useQuery<any[]>({
    queryKey: ["scadenze-hr"],
    queryFn: async () => {
      const res = await fetch("/api/scadenze-hr");
      return res.json();
    },
  });

  const { data: personale = [] } = useQuery<any[]>({
    queryKey: ["anagrafica-personale"],
    queryFn: async () => {
      const res = await fetch("/api/anagrafica/personale");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/scadenze-hr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scadenze-hr"] });
      toast({ title: "Scadenza creata" });
      setShowAddDialog(false);
    },
  });

  const completeMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/scadenze-hr/${id}/completa`, { method: "PUT" });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scadenze-hr"] });
      toast({ title: "Scadenza completata" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/scadenze-hr/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scadenze-hr"] });
      toast({ title: "Scadenza eliminata" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await fetch(`/api/scadenze-hr/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scadenze-hr"] });
      toast({ title: "Scadenza aggiornata" });
      setShowEditDialog(false);
      setEditingScadenza(null);
    },
  });

  const handleEdit = (scadenza: any) => {
    setEditingScadenza({
      id: scadenza.id,
      personaleId: scadenza.personaleId,
      tipo: scadenza.tipo,
      titolo: scadenza.titolo,
      descrizione: scadenza.descrizione || "",
      dataScadenza: scadenza.dataScadenza,
      priorita: scadenza.priorita || "normale",
    });
    setShowEditDialog(true);
  };

  const handleUpdate = () => {
    if (!editingScadenza?.personaleId || !editingScadenza?.titolo || !editingScadenza?.dataScadenza) {
      toast({ title: "Compila i campi obbligatori", variant: "destructive" });
      return;
    }
    const { id, ...data } = editingScadenza;
    updateMutation.mutate({ id, data });
  };

  const getPersonaleNome = (id: string) => {
    const p = personale.find((x: any) => x.id === id);
    return p ? `${p.nome} ${p.cognome}` : id;
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case "visita_medica": return <Stethoscope className="h-4 w-4" />;
      case "contratto": return <FileCheck className="h-4 w-4" />;
      case "formazione": return <GraduationCap className="h-4 w-4" />;
      case "documento": return <FileText className="h-4 w-4" />;
      case "certificazione": return <Award className="h-4 w-4" />;
      default: return <MoreHorizontal className="h-4 w-4" />;
    }
  };

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case "visita_medica": return "Visita Medica";
      case "contratto": return "Contratto";
      case "formazione": return "Formazione";
      case "documento": return "Documento";
      case "certificazione": return "Certificazione";
      default: return "Altro";
    }
  };

  const getPrioritaColor = (priorita: string) => {
    switch (priorita) {
      case "urgente": return "bg-red-100 text-red-700 border-red-300";
      case "alta": return "bg-orange-100 text-orange-700 border-orange-300";
      case "normale": return "bg-blue-100 text-blue-700 border-blue-300";
      default: return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  const getDaysUntil = (dataScadenza: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const scadenza = new Date(dataScadenza);
    scadenza.setHours(0, 0, 0, 0);
    const diffTime = scadenza.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getUrgencyBadge = (dataScadenza: string) => {
    const days = getDaysUntil(dataScadenza);
    if (days < 0) return <Badge variant="destructive">Scaduta</Badge>;
    if (days === 0) return <Badge variant="destructive">Oggi</Badge>;
    if (days <= 7) return <Badge className="bg-orange-500">Tra {days}g</Badge>;
    if (days <= 30) return <Badge className="bg-amber-500">Tra {days}g</Badge>;
    return <Badge variant="secondary">Tra {days}g</Badge>;
  };

  const filteredScadenze = scadenze
    .filter((s: any) => showCompleted || !s.completata)
    .filter((s: any) => filterTipo === "tutti" || s.tipo === filterTipo)
    .sort((a: any, b: any) => {
      if (a.completata !== b.completata) return a.completata ? 1 : -1;
      return new Date(a.dataScadenza).getTime() - new Date(b.dataScadenza).getTime();
    });

  const scadenzeUrgenti = scadenze.filter((s: any) => !s.completata && getDaysUntil(s.dataScadenza) <= 7).length;
  const scadenzeInArrivo = scadenze.filter((s: any) => !s.completata && getDaysUntil(s.dataScadenza) > 7 && getDaysUntil(s.dataScadenza) <= 30).length;

  const [newScadenza, setNewScadenza] = useState({
    personaleId: "",
    tipo: "altro",
    titolo: "",
    descrizione: "",
    dataScadenza: "",
    priorita: "normale",
    giorniAnticipo: 30,
  });

  const handleCreate = () => {
    if (!newScadenza.personaleId || !newScadenza.titolo || !newScadenza.dataScadenza) {
      toast({ title: "Compila i campi obbligatori", variant: "destructive" });
      return;
    }
    createMutation.mutate(newScadenza);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-2">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-md bg-red-100 flex items-center justify-center">
                <AlertTriangle className="h-3 w-3 text-red-600" />
              </div>
              <div>
                <p className="text-[10px] text-red-600">Urgenti (7g)</p>
                <p className="text-base font-bold text-red-700">{scadenzeUrgenti}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-2">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-md bg-amber-100 flex items-center justify-center">
                <Bell className="h-3 w-3 text-amber-600" />
              </div>
              <div>
                <p className="text-[10px] text-amber-600">In arrivo (30g)</p>
                <p className="text-base font-bold text-amber-700">{scadenzeInArrivo}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-2">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-md bg-blue-100 flex items-center justify-center">
                <CalendarClock className="h-3 w-3 text-blue-600" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">Totale Attive</p>
                <p className="text-base font-bold">{scadenze.filter((s: any) => !s.completata).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-2">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-md bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-3 w-3 text-green-600" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">Completate</p>
                <p className="text-base font-bold text-green-600">{scadenze.filter((s: any) => s.completata).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <CalendarClock className="h-4 w-4" />
              Scadenzario HR
            </CardTitle>
            <div className="flex items-center gap-2">
              <Select value={filterTipo} onValueChange={setFilterTipo}>
                <SelectTrigger className="w-[160px] h-8 text-xs">
                  <SelectValue placeholder="Filtra per tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tutti">Tutti i tipi</SelectItem>
                  <SelectItem value="visita_medica">Visita Medica</SelectItem>
                  <SelectItem value="contratto">Contratto</SelectItem>
                  <SelectItem value="formazione">Formazione</SelectItem>
                  <SelectItem value="documento">Documento</SelectItem>
                  <SelectItem value="certificazione">Certificazione</SelectItem>
                  <SelectItem value="altro">Altro</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCompleted(!showCompleted)}
                className="h-8 text-xs"
              >
                {showCompleted ? "Nascondi Completate" : "Mostra Completate"}
              </Button>
              <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" className="h-8 text-xs">
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Nuova Scadenza
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Nuova Scadenza</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Collaboratore *</Label>
                      <Select
                        value={newScadenza.personaleId}
                        onValueChange={(v) => setNewScadenza({ ...newScadenza, personaleId: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleziona collaboratore" />
                        </SelectTrigger>
                        <SelectContent>
                          {personale.filter((p: any) => p.stato === "attivo").map((p: any) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.nome} {p.cognome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Tipo *</Label>
                      <Select
                        value={newScadenza.tipo}
                        onValueChange={(v) => setNewScadenza({ ...newScadenza, tipo: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="visita_medica">Visita Medica</SelectItem>
                          <SelectItem value="contratto">Contratto</SelectItem>
                          <SelectItem value="formazione">Formazione</SelectItem>
                          <SelectItem value="documento">Documento</SelectItem>
                          <SelectItem value="certificazione">Certificazione</SelectItem>
                          <SelectItem value="altro">Altro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Titolo *</Label>
                      <Input
                        value={newScadenza.titolo}
                        onChange={(e) => setNewScadenza({ ...newScadenza, titolo: e.target.value })}
                        placeholder="es. Rinnovo visita oculistica"
                      />
                    </div>
                    <div>
                      <Label>Descrizione</Label>
                      <Textarea
                        value={newScadenza.descrizione}
                        onChange={(e) => setNewScadenza({ ...newScadenza, descrizione: e.target.value })}
                        placeholder="Note aggiuntive..."
                        rows={2}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Data Scadenza *</Label>
                        <Input
                          type="date"
                          value={newScadenza.dataScadenza}
                          onChange={(e) => setNewScadenza({ ...newScadenza, dataScadenza: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Priorita</Label>
                        <Select
                          value={newScadenza.priorita}
                          onValueChange={(v) => setNewScadenza({ ...newScadenza, priorita: v })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="bassa">Bassa</SelectItem>
                            <SelectItem value="normale">Normale</SelectItem>
                            <SelectItem value="alta">Alta</SelectItem>
                            <SelectItem value="urgente">Urgente</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button onClick={handleCreate} className="w-full" disabled={createMutation.isPending}>
                      {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Crea Scadenza
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Modifica Scadenza</DialogTitle>
                  </DialogHeader>
                  {editingScadenza && (
                    <div className="space-y-4">
                      <div>
                        <Label>Collaboratore *</Label>
                        <Select
                          value={editingScadenza.personaleId}
                          onValueChange={(v) => setEditingScadenza({ ...editingScadenza, personaleId: v })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleziona collaboratore" />
                          </SelectTrigger>
                          <SelectContent>
                            {personale.filter((p: any) => p.stato === "attivo").map((p: any) => (
                              <SelectItem key={p.id} value={p.id}>
                                {p.nome} {p.cognome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Tipo *</Label>
                        <Select
                          value={editingScadenza.tipo}
                          onValueChange={(v) => setEditingScadenza({ ...editingScadenza, tipo: v })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="visita_medica">Visita Medica</SelectItem>
                            <SelectItem value="contratto">Contratto</SelectItem>
                            <SelectItem value="formazione">Formazione</SelectItem>
                            <SelectItem value="documento">Documento</SelectItem>
                            <SelectItem value="certificazione">Certificazione</SelectItem>
                            <SelectItem value="altro">Altro</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Titolo *</Label>
                        <Input
                          value={editingScadenza.titolo}
                          onChange={(e) => setEditingScadenza({ ...editingScadenza, titolo: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Descrizione</Label>
                        <Textarea
                          value={editingScadenza.descrizione}
                          onChange={(e) => setEditingScadenza({ ...editingScadenza, descrizione: e.target.value })}
                          rows={2}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Data Scadenza *</Label>
                          <Input
                            type="date"
                            value={editingScadenza.dataScadenza}
                            onChange={(e) => setEditingScadenza({ ...editingScadenza, dataScadenza: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label>Priorita</Label>
                          <Select
                            value={editingScadenza.priorita}
                            onValueChange={(v) => setEditingScadenza({ ...editingScadenza, priorita: v })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="bassa">Bassa</SelectItem>
                              <SelectItem value="normale">Normale</SelectItem>
                              <SelectItem value="alta">Alta</SelectItem>
                              <SelectItem value="urgente">Urgente</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <Button onClick={handleUpdate} className="w-full" disabled={updateMutation.isPending}>
                        {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Salva Modifiche
                      </Button>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : filteredScadenze.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CalendarClock className="h-12 w-12 mx-auto mb-2 opacity-30" />
              <p>Nessuna scadenza trovata</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredScadenze.map((s: any) => (
                <div
                  key={s.id}
                  className={`p-3 rounded-lg border flex items-center gap-3 ${s.completata ? "bg-muted/50 opacity-60" : "bg-white hover:bg-muted/30"
                    }`}
                >
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${s.completata ? "bg-green-100" : getPrioritaColor(s.priorita)
                    }`}>
                    {s.completata ? <CheckCircle className="h-5 w-5 text-green-600" /> : getTipoIcon(s.tipo)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`font-medium ${s.completata ? "line-through text-muted-foreground" : ""}`}>
                        {s.titolo}
                      </p>
                      <Badge variant="outline" className="text-xs">
                        {getTipoLabel(s.tipo)}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {getPersonaleNome(s.personaleId)} - Scadenza: {format(new Date(s.dataScadenza), "dd/MM/yyyy")}
                    </p>
                    {s.descrizione && (
                      <p className="text-xs text-muted-foreground mt-1 truncate">{s.descrizione}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {!s.completata && getUrgencyBadge(s.dataScadenza)}
                    {!s.completata && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8"
                        onClick={() => handleEdit(s)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    {!s.completata && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8"
                        onClick={() => completeMutation.mutate(s.id)}
                        disabled={completeMutation.isPending}
                      >
                        <Check className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 text-destructive hover:text-destructive"
                      onClick={() => deleteMutation.mutate(s.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface OrgNode {
  id: string;
  nome: string;
  cognome: string;
  ruolo: string;
  reparto: string;
  responsabileId: string | null;
  children: OrgNode[];
}

function OrganigrammaTab() {
  const { data: personale = [], isLoading } = useQuery<any[]>({
    queryKey: ["anagrafica-personale"],
    queryFn: async () => {
      const res = await fetch("/api/anagrafica/personale");
      return res.json();
    },
  });

  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  const toggleNode = (id: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedNodes(newExpanded);
  };

  const buildTree = (items: any[]): OrgNode[] => {
    const map = new Map<string, OrgNode>();
    const roots: OrgNode[] = [];

    items.forEach(item => {
      const parentId = item.responsabileId && item.responsabileId.trim() !== "" ? item.responsabileId : null;
      map.set(item.id, {
        id: item.id,
        nome: item.nome,
        cognome: item.cognome,
        ruolo: item.ruolo || "Non specificato",
        reparto: item.reparto || "Generale",
        responsabileId: parentId,
        children: []
      });
    });

    map.forEach(node => {
      if (node.responsabileId && map.has(node.responsabileId)) {
        map.get(node.responsabileId)!.children.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  };

  const getRoleColor = (ruolo: string) => {
    const r = ruolo?.toUpperCase() || "";
    if (r.includes("AMMINISTR") || r.includes("DIRETT") || r.includes("CEO")) return "from-purple-500 to-violet-600";
    if (r.includes("RESPONS") || r.includes("MANAGER")) return "from-blue-500 to-indigo-600";
    if (r.includes("SUPERVIS") || r.includes("CAPO")) return "from-teal-500 to-cyan-600";
    if (r.includes("CONSULEN") || r.includes("SPECIALI")) return "from-amber-500 to-orange-600";
    return "from-slate-500 to-gray-600";
  };

  const renderNode = (node: OrgNode, level: number = 0) => {
    const hasChildren = node.children.length > 0;
    const isExpanded = expandedNodes.has(node.id);

    return (
      <div key={node.id} className="flex flex-col items-center">
        <div
          className={`
            relative bg-card rounded-xl shadow-lg border p-4 min-w-[200px] max-w-[250px]
            hover:shadow-xl transition-all cursor-pointer
            ${level === 0 ? "ring-2 ring-primary/30" : ""}
          `}
          onClick={() => hasChildren && toggleNode(node.id)}
        >
          <div className={`absolute -top-3 left-1/2 -translate-x-1/2 h-6 w-6 rounded-full bg-gradient-to-br ${getRoleColor(node.ruolo)} flex items-center justify-center shadow`}>
            <User className="h-3.5 w-3.5 text-white" />
          </div>
          <div className="mt-2 text-center">
            <p className="font-semibold text-sm">{node.nome} {node.cognome}</p>
            <Badge variant="outline" className="text-xs mt-1">{node.ruolo}</Badge>
            <p className="text-xs text-muted-foreground mt-1">{node.reparto}</p>
          </div>
          {hasChildren && (
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 h-5 w-5 rounded-full bg-muted border flex items-center justify-center">
              {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            </div>
          )}
        </div>

        {hasChildren && isExpanded && (
          <>
            <div className="w-0.5 h-6 bg-border" />
            <div className="flex gap-8 relative">
              {node.children.length > 1 && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 bg-border"
                  style={{ width: `calc(100% - 100px)` }} />
              )}
              {node.children.map((child, idx) => (
                <div key={child.id} className="flex flex-col items-center">
                  <div className="w-0.5 h-6 bg-border" />
                  {renderNode(child, level + 1)}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const attivi = personale.filter(p => p.stato === "attivo");
  const tree = buildTree(attivi);

  const reparti = [...new Set(attivi.map(p => p.reparto || "Generale"))];
  const ruoli = [...new Set(attivi.map(p => p.ruolo || "Non specificato"))];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Network className="h-4 w-4" />
            Organigramma Aziendale
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3 border border-blue-200 dark:border-blue-900">
              <p className="text-xs text-blue-600 dark:text-blue-400">Collaboratori Attivi</p>
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{attivi.length}</p>
            </div>
            <div className="bg-purple-50 dark:bg-purple-950/30 rounded-lg p-3 border border-purple-200 dark:border-purple-900">
              <p className="text-xs text-purple-600 dark:text-purple-400">Reparti</p>
              <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{reparti.length}</p>
            </div>
            <div className="bg-teal-50 dark:bg-teal-950/30 rounded-lg p-3 border border-teal-200 dark:border-teal-900">
              <p className="text-xs text-teal-600 dark:text-teal-400">Ruoli Unici</p>
              <p className="text-2xl font-bold text-teal-700 dark:text-teal-300">{ruoli.length}</p>
            </div>
          </div>

          {tree.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Network className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">Nessun collaboratore trovato</p>
              <p className="text-xs mt-1">Aggiungi collaboratori dall'Anagrafica per visualizzare l'organigramma</p>
            </div>
          ) : (
            <div className="overflow-x-auto py-6">
              <div className="flex justify-center gap-8 min-w-max">
                {tree.map(root => renderNode(root, 0))}
              </div>
            </div>
          )}

          <div className="mt-6 pt-4 border-t">
            <p className="text-xs text-muted-foreground mb-3">Legenda Ruoli</p>
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-gradient-to-r from-purple-500 to-violet-600 text-white">Direzione</Badge>
              <Badge className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white">Responsabili</Badge>
              <Badge className="bg-gradient-to-r from-teal-500 to-cyan-600 text-white">Supervisori</Badge>
              <Badge className="bg-gradient-to-r from-amber-500 to-orange-600 text-white">Specialisti</Badge>
              <Badge className="bg-gradient-to-r from-slate-500 to-gray-600 text-white">Staff</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Users className="h-4 w-4" />
            Distribuzione per Reparto
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {reparti.map(reparto => {
              const count = attivi.filter(p => (p.reparto || "Generale") === reparto).length;
              return (
                <div key={reparto} className="bg-muted/50 rounded-lg p-3 border">
                  <p className="font-medium text-sm">{reparto}</p>
                  <p className="text-xs text-muted-foreground">{count} collaborator{count !== 1 ? "i" : "e"}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function HRManager() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  return (
    <AppLayout>
      <div className={`h-full flex flex-col overflow-hidden bg-gradient-to-br from-[#f5f0e6] via-[#e8dcc8] to-[#ddd0b8] dark:from-[#2d3748] dark:via-[#374151] dark:to-[#3d4555] ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
        <div className="h-32 w-full flex-shrink-0 bg-gradient-to-r from-[#4a5568] via-[#5a6a7d] to-[#6b7a8f]" />

        <div className="flex-1 overflow-auto -mt-16 px-6">
          <Tabs defaultValue="dashboard" className="h-full flex flex-col">
            <div className="bg-stone-50 dark:bg-stone-900/50 rounded-xl shadow-lg border mb-6">
              <div className="p-4 pb-2">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg">
                    <UserCog className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h1 className="text-xl font-bold tracking-tight">HR Manager</h1>
                    <p className="text-xs text-muted-foreground">
                      Gestione del personale, presenze, turni e straordinari
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
                    <CopyLinkButton path="/hr-manager" />
                  </div>
                </div>

                <TabsList className="grid w-full max-w-5xl grid-cols-5 md:grid-cols-10 gap-1 h-auto bg-transparent p-0">
                  <TabsTrigger value="dashboard" className="flex flex-col items-center justify-center gap-0.5 px-1 py-2 text-[9px] data-[state=active]:bg-primary/20 rounded-lg">
                    <BarChart3 className="h-4 w-4" />
                    <span>Dashboard</span>
                  </TabsTrigger>
                  <TabsTrigger value="collaboratori" className="flex flex-col items-center justify-center gap-0.5 px-1 py-2 text-[9px] data-[state=active]:bg-primary/20 rounded-lg">
                    <Users className="h-4 w-4" />
                    <span>Collaboratori</span>
                  </TabsTrigger>
                  <TabsTrigger value="presenze" className="flex flex-col items-center justify-center gap-0.5 px-1 py-2 text-[9px] data-[state=active]:bg-primary/20 rounded-lg">
                    <Clock className="h-4 w-4" />
                    <span>Presenze</span>
                  </TabsTrigger>
                  <TabsTrigger value="turni" className="flex flex-col items-center justify-center gap-0.5 px-1 py-2 text-[9px] data-[state=active]:bg-primary/20 rounded-lg">
                    <Calendar className="h-4 w-4" />
                    <span>Turni</span>
                  </TabsTrigger>
                  <TabsTrigger value="ferie" className="flex flex-col items-center justify-center gap-0.5 px-1 py-2 text-[9px] data-[state=active]:bg-primary/20 rounded-lg">
                    <Umbrella className="h-4 w-4" />
                    <span>Ferie</span>
                  </TabsTrigger>
                  <TabsTrigger value="straordinari" className="flex flex-col items-center justify-center gap-0.5 px-1 py-2 text-[9px] data-[state=active]:bg-primary/20 rounded-lg">
                    <Clock className="h-4 w-4" />
                    <span>Straordinari</span>
                  </TabsTrigger>
                  <TabsTrigger value="scadenzario" className="flex flex-col items-center justify-center gap-0.5 px-1 py-2 text-[9px] data-[state=active]:bg-primary/20 rounded-lg">
                    <CalendarClock className="h-4 w-4" />
                    <span>Scadenze</span>
                  </TabsTrigger>
                  <TabsTrigger value="accessi" className="flex flex-col items-center justify-center gap-0.5 px-1 py-2 text-[9px] data-[state=active]:bg-primary/20 rounded-lg">
                    <Globe className="h-4 w-4" />
                    <span>Accessi</span>
                  </TabsTrigger>
                  <TabsTrigger value="report" className="flex flex-col items-center justify-center gap-0.5 px-1 py-2 text-[9px] data-[state=active]:bg-primary/20 rounded-lg">
                    <FileText className="h-4 w-4" />
                    <span>Cedolini</span>
                  </TabsTrigger>
                  <TabsTrigger value="organigramma" className="flex flex-col items-center justify-center gap-0.5 px-1 py-2 text-[9px] data-[state=active]:bg-primary/20 rounded-lg">
                    <Network className="h-4 w-4" />
                    <span>Organigramma</span>
                  </TabsTrigger>
                </TabsList>
              </div>
            </div>

            <div className="flex-1 overflow-auto pb-6">
              <TabsContent value="dashboard" className="m-0">
                <DashboardKPITab />
              </TabsContent>
              <TabsContent value="collaboratori" className="m-0 h-full">
                <PersonaleTab />
              </TabsContent>
              <TabsContent value="presenze" className="m-0">
                <PresenzeTab />
              </TabsContent>
              <TabsContent value="turni" className="m-0">
                <TurniTab />
              </TabsContent>
              <TabsContent value="ferie" className="m-0">
                <FeriePermessiTab />
              </TabsContent>
              <TabsContent value="straordinari" className="m-0">
                <StraordinariTab />
              </TabsContent>
              <TabsContent value="scadenzario" className="m-0">
                <ScadenzarioTab />
              </TabsContent>
              <TabsContent value="accessi" className="m-0">
                <AccessiPortaleTab />
              </TabsContent>
              <TabsContent value="report" className="m-0">
                <ReportTab />
              </TabsContent>
              <TabsContent value="organigramma" className="m-0">
                <OrganigrammaTab />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </AppLayout>
  );
}
