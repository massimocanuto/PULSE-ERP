import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { 
  Plus, 
  Wallet,
  CreditCard,
  TrendingUp,
  TrendingDown,
  ArrowRightLeft,
  Target,
  PiggyBank,
  BarChart3,
  Search,
  MoreHorizontal,
  Edit2,
  Trash2,
  Calendar,
  DollarSign,
  Loader2,
  Building,
  Receipt,
  ChevronRight,
  ArrowUpRight,
  ArrowDownLeft,
  PlusCircle,
  MinusCircle
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

const TIPI_CONTO = [
  { value: "conto_corrente", label: "Conto Corrente", icon: Building },
  { value: "carta_credito", label: "Carta di Credito", icon: CreditCard },
  { value: "carta_debito", label: "Carta di Debito", icon: CreditCard },
  { value: "contanti", label: "Contanti", icon: Wallet },
  { value: "risparmio", label: "Risparmio", icon: PiggyBank },
  { value: "investimento", label: "Investimento", icon: TrendingUp },
  { value: "altro", label: "Altro", icon: DollarSign },
];

const CATEGORIE_DEFAULT = [
  { nome: "Stipendio", tipo: "entrata", icona: "briefcase", colore: "#22c55e" },
  { nome: "Alimentari", tipo: "uscita", icona: "shopping-cart", colore: "#ef4444" },
  { nome: "Trasporti", tipo: "uscita", icona: "car", colore: "#f97316" },
  { nome: "Utenze", tipo: "uscita", icona: "zap", colore: "#eab308" },
  { nome: "Abbonamenti", tipo: "uscita", icona: "tv", colore: "#8b5cf6" },
  { nome: "Salute", tipo: "uscita", icona: "heart", colore: "#ec4899" },
  { nome: "Svago", tipo: "uscita", icona: "gamepad-2", colore: "#06b6d4" },
  { nome: "Altro", tipo: "entrambi", icona: "more-horizontal", colore: "#6b7280" },
];

const PERIODI_BUDGET = [
  { value: "settimanale", label: "Settimanale" },
  { value: "mensile", label: "Mensile" },
  { value: "trimestrale", label: "Trimestrale" },
  { value: "annuale", label: "Annuale" },
];

function useUserId() {
  const userStr = localStorage.getItem("user");
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      return user.id;
    } catch {
      return null;
    }
  }
  return null;
}

function DashboardTab() {
  const userId = useUserId();
  const { data: accounts = [] } = useQuery({
    queryKey: ["/api/personal-finance/accounts", userId],
    queryFn: async () => {
      const res = await fetch(`/api/personal-finance/accounts/${userId}`);
      if (!res.ok) throw new Error("Errore");
      return res.json();
    },
    enabled: !!userId
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ["/api/personal-finance/transactions", userId],
    queryFn: async () => {
      const res = await fetch(`/api/personal-finance/transactions/${userId}`);
      if (!res.ok) throw new Error("Errore");
      return res.json();
    },
    enabled: !!userId
  });

  const { data: goals = [] } = useQuery({
    queryKey: ["/api/personal-finance/goals", userId],
    queryFn: async () => {
      const res = await fetch(`/api/personal-finance/goals/${userId}`);
      if (!res.ok) throw new Error("Errore");
      return res.json();
    },
    enabled: !!userId
  });

  const patrimonio = accounts.reduce((sum: number, acc: any) => sum + parseFloat(acc.saldoAttuale || "0"), 0);
  const entrateDelMese = transactions
    .filter((t: any) => t.tipo === "entrata" && new Date(t.data).getMonth() === new Date().getMonth())
    .reduce((sum: number, t: any) => sum + parseFloat(t.importo || "0"), 0);
  const usciteDelMese = transactions
    .filter((t: any) => t.tipo === "uscita" && new Date(t.data).getMonth() === new Date().getMonth())
    .reduce((sum: number, t: any) => sum + parseFloat(t.importo || "0"), 0);
  const bilancioMese = entrateDelMese - usciteDelMese;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Patrimonio Totale</p>
                <p className="text-2xl font-bold">{patrimonio.toLocaleString("it-IT", { style: "currency", currency: "EUR" })}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Wallet className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Entrate del Mese</p>
                <p className="text-2xl font-bold text-green-600">+{entrateDelMese.toLocaleString("it-IT", { style: "currency", currency: "EUR" })}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Uscite del Mese</p>
                <p className="text-2xl font-bold text-red-600">-{usciteDelMese.toLocaleString("it-IT", { style: "currency", currency: "EUR" })}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                <TrendingDown className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Bilancio del Mese</p>
                <p className={`text-2xl font-bold ${bilancioMese >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {bilancioMese >= 0 ? "+" : ""}{bilancioMese.toLocaleString("it-IT", { style: "currency", currency: "EUR" })}
                </p>
              </div>
              <div className={`h-12 w-12 rounded-full ${bilancioMese >= 0 ? "bg-green-100" : "bg-red-100"} flex items-center justify-center`}>
                <BarChart3 className={`h-6 w-6 ${bilancioMese >= 0 ? "text-green-600" : "text-red-600"}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Conti</CardTitle>
            <CardDescription>Panoramica dei tuoi conti</CardDescription>
          </CardHeader>
          <CardContent>
            {accounts.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">Nessun conto configurato</p>
            ) : (
              <div className="space-y-3">
                {accounts.slice(0, 5).map((account: any) => {
                  const tipo = TIPI_CONTO.find(t => t.value === account.tipo);
                  const Icon = tipo?.icon || Wallet;
                  return (
                    <div key={account.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{account.nome}</p>
                          <p className="text-sm text-muted-foreground">{tipo?.label || account.tipo}</p>
                        </div>
                      </div>
                      <p className="font-semibold">{parseFloat(account.saldoAttuale || "0").toLocaleString("it-IT", { style: "currency", currency: "EUR" })}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Obiettivi di Risparmio</CardTitle>
            <CardDescription>Progresso verso i tuoi obiettivi</CardDescription>
          </CardHeader>
          <CardContent>
            {goals.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">Nessun obiettivo configurato</p>
            ) : (
              <div className="space-y-4">
                {goals.slice(0, 4).map((goal: any) => {
                  const importoObiettivo = parseFloat(goal.importoObiettivo || "0");
                  const importoAttuale = parseFloat(goal.importoAttuale || "0");
                  const percentuale = importoObiettivo > 0 ? (importoAttuale / importoObiettivo) * 100 : 0;
                  return (
                    <div key={goal.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4 text-primary" />
                          <span className="font-medium">{goal.nome}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">{Math.round(percentuale)}%</span>
                      </div>
                      <Progress value={percentuale} className="h-2" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{importoAttuale.toLocaleString("it-IT", { style: "currency", currency: "EUR" })}</span>
                        <span>{importoObiettivo.toLocaleString("it-IT", { style: "currency", currency: "EUR" })}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ultime Transazioni</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">Nessuna transazione registrata</p>
          ) : (
            <div className="space-y-2">
              {transactions.slice(0, 10).map((tx: any) => (
                <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                      tx.tipo === "entrata" ? "bg-green-100" : tx.tipo === "uscita" ? "bg-red-100" : "bg-blue-100"
                    }`}>
                      {tx.tipo === "entrata" ? (
                        <ArrowDownLeft className="h-4 w-4 text-green-600" />
                      ) : tx.tipo === "uscita" ? (
                        <ArrowUpRight className="h-4 w-4 text-red-600" />
                      ) : (
                        <ArrowRightLeft className="h-4 w-4 text-blue-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{tx.descrizione || "Transazione"}</p>
                      <p className="text-xs text-muted-foreground">{format(new Date(tx.data), "d MMM yyyy", { locale: it })}</p>
                    </div>
                  </div>
                  <p className={`font-semibold ${tx.tipo === "entrata" ? "text-green-600" : tx.tipo === "uscita" ? "text-red-600" : ""}`}>
                    {tx.tipo === "entrata" ? "+" : tx.tipo === "uscita" ? "-" : ""}
                    {parseFloat(tx.importo || "0").toLocaleString("it-IT", { style: "currency", currency: "EUR" })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ContiTab() {
  const userId = useUserId();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [formData, setFormData] = useState({
    nome: "",
    tipo: "conto_corrente",
    istituto: "",
    numeroConto: "",
    saldoIniziale: "0",
  });

  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ["/api/personal-finance/accounts", userId],
    queryFn: async () => {
      const res = await fetch(`/api/personal-finance/accounts/${userId}`);
      if (!res.ok) throw new Error("Errore");
      return res.json();
    },
    enabled: !!userId
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/personal-finance/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, userId, saldoAttuale: data.saldoIniziale })
      });
      if (!res.ok) throw new Error("Errore");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/personal-finance/accounts"] });
      toast({ title: "Conto creato" });
      setDialogOpen(false);
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await fetch(`/api/personal-finance/accounts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error("Errore");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/personal-finance/accounts"] });
      toast({ title: "Conto aggiornato" });
      setDialogOpen(false);
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/personal-finance/accounts/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Errore");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/personal-finance/accounts"] });
      toast({ title: "Conto eliminato" });
    }
  });

  const resetForm = () => {
    setFormData({ nome: "", tipo: "conto_corrente", istituto: "", numeroConto: "", saldoIniziale: "0" });
    setEditing(null);
  };

  const openEdit = (account: any) => {
    setEditing(account);
    setFormData({
      nome: account.nome,
      tipo: account.tipo,
      istituto: account.istituto || "",
      numeroConto: account.numeroConto || "",
      saldoIniziale: account.saldoIniziale || "0",
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.nome.trim()) {
      toast({ title: "Inserisci il nome del conto", variant: "destructive" });
      return;
    }
    if (editing) {
      updateMutation.mutate({ id: editing.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin h-8 w-8" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">I Tuoi Conti</h2>
        <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" /> Nuovo Conto
        </Button>
      </div>

      {accounts.length === 0 ? (
        <Card className="p-8 text-center">
          <Wallet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Nessun conto configurato. Aggiungi il tuo primo conto per iniziare.</p>
          <Button className="mt-4" onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> Aggiungi Conto
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((account: any) => {
            const tipo = TIPI_CONTO.find(t => t.value === account.tipo);
            const Icon = tipo?.icon || Wallet;
            return (
              <Card key={account.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{account.nome}</h3>
                        <p className="text-sm text-muted-foreground">{tipo?.label}</p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(account)}>
                          <Edit2 className="h-4 w-4 mr-2" /> Modifica
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => deleteMutation.mutate(account.id)} className="text-red-600">
                          <Trash2 className="h-4 w-4 mr-2" /> Elimina
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  {account.istituto && <p className="text-sm text-muted-foreground mb-2">{account.istituto}</p>}
                  <div className="text-2xl font-bold">
                    {parseFloat(account.saldoAttuale || "0").toLocaleString("it-IT", { style: "currency", currency: "EUR" })}
                  </div>
                  {account.predefinito && <Badge className="mt-2">Predefinito</Badge>}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Modifica Conto" : "Nuovo Conto"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome Conto *</Label>
              <Input value={formData.nome} onChange={(e) => setFormData({ ...formData, nome: e.target.value })} placeholder="Es: Conto BancoPosta" />
            </div>
            <div>
              <Label>Tipo Conto</Label>
              <Select value={formData.tipo} onValueChange={(v) => setFormData({ ...formData, tipo: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIPI_CONTO.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Istituto / Banca</Label>
              <Input value={formData.istituto} onChange={(e) => setFormData({ ...formData, istituto: e.target.value })} placeholder="Es: Poste Italiane" />
            </div>
            <div>
              <Label>Numero Conto</Label>
              <Input value={formData.numeroConto} onChange={(e) => setFormData({ ...formData, numeroConto: e.target.value })} placeholder="Facoltativo" />
            </div>
            <div>
              <Label>Saldo Iniziale</Label>
              <Input type="number" step="0.01" value={formData.saldoIniziale} onChange={(e) => setFormData({ ...formData, saldoIniziale: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annulla</Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
              {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="animate-spin h-4 w-4 mr-2" />}
              {editing ? "Salva" : "Crea"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TransazioniTab() {
  const userId = useUserId();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    tipo: "uscita",
    descrizione: "",
    importo: "",
    data: format(new Date(), "yyyy-MM-dd"),
    accountId: "",
    accountDestinazioneId: "",
    categoria: "",
  });

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ["/api/personal-finance/transactions", userId],
    queryFn: async () => {
      const res = await fetch(`/api/personal-finance/transactions/${userId}`);
      if (!res.ok) throw new Error("Errore");
      return res.json();
    },
    enabled: !!userId
  });

  const { data: accounts = [] } = useQuery({
    queryKey: ["/api/personal-finance/accounts", userId],
    queryFn: async () => {
      const res = await fetch(`/api/personal-finance/accounts/${userId}`);
      if (!res.ok) throw new Error("Errore");
      return res.json();
    },
    enabled: !!userId
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["/api/personal-finance/categories", userId],
    queryFn: async () => {
      const res = await fetch(`/api/personal-finance/categories/${userId}`);
      if (!res.ok) throw new Error("Errore");
      return res.json();
    },
    enabled: !!userId
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/personal-finance/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, userId })
      });
      if (!res.ok) throw new Error("Errore");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/personal-finance/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/personal-finance/accounts"] });
      toast({ title: "Transazione registrata" });
      setDialogOpen(false);
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/personal-finance/transactions/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Errore");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/personal-finance/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/personal-finance/accounts"] });
      toast({ title: "Transazione eliminata" });
    }
  });

  const resetForm = () => {
    setFormData({
      tipo: "uscita",
      descrizione: "",
      importo: "",
      data: format(new Date(), "yyyy-MM-dd"),
      accountId: accounts[0]?.id || "",
      accountDestinazioneId: "",
      categoria: "",
    });
  };

  const handleSubmit = () => {
    if (!formData.accountId) {
      toast({ title: "Seleziona un conto", variant: "destructive" });
      return;
    }
    if (!formData.importo || parseFloat(formData.importo) <= 0) {
      toast({ title: "Inserisci un importo valido", variant: "destructive" });
      return;
    }
    if (formData.tipo === "trasferimento" && !formData.accountDestinazioneId) {
      toast({ title: "Seleziona il conto di destinazione", variant: "destructive" });
      return;
    }
    createMutation.mutate(formData);
  };

  const filteredTransactions = transactions.filter((tx: any) =>
    tx.descrizione?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tx.categoria?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin h-8 w-8" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Cerca transazioni..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" /> Nuova Transazione
        </Button>
      </div>

      {accounts.length === 0 ? (
        <Card className="p-8 text-center">
          <Receipt className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Crea prima un conto per registrare le transazioni.</p>
        </Card>
      ) : filteredTransactions.length === 0 ? (
        <Card className="p-8 text-center">
          <Receipt className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Nessuna transazione registrata.</p>
        </Card>
      ) : (
        <Card>
          <ScrollArea className="h-[600px]">
            <div className="divide-y">
              {filteredTransactions.map((tx: any) => (
                <div key={tx.id} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                      tx.tipo === "entrata" ? "bg-green-100" : tx.tipo === "uscita" ? "bg-red-100" : "bg-blue-100"
                    }`}>
                      {tx.tipo === "entrata" ? (
                        <PlusCircle className="h-5 w-5 text-green-600" />
                      ) : tx.tipo === "uscita" ? (
                        <MinusCircle className="h-5 w-5 text-red-600" />
                      ) : (
                        <ArrowRightLeft className="h-5 w-5 text-blue-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{tx.descrizione || "Transazione"}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{format(new Date(tx.data), "d MMM yyyy", { locale: it })}</span>
                        {tx.categoria && <Badge variant="outline" className="text-xs">{tx.categoria}</Badge>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className={`font-semibold text-lg ${tx.tipo === "entrata" ? "text-green-600" : tx.tipo === "uscita" ? "text-red-600" : ""}`}>
                      {tx.tipo === "entrata" ? "+" : tx.tipo === "uscita" ? "-" : ""}
                      {parseFloat(tx.importo || "0").toLocaleString("it-IT", { style: "currency", currency: "EUR" })}
                    </p>
                    <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(tx.id)}>
                      <Trash2 className="h-4 w-4 text-muted-foreground hover:text-red-600" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuova Transazione</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Tipo</Label>
              <Select value={formData.tipo} onValueChange={(v) => setFormData({ ...formData, tipo: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="entrata">Entrata</SelectItem>
                  <SelectItem value="uscita">Uscita</SelectItem>
                  <SelectItem value="trasferimento">Trasferimento</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Conto {formData.tipo === "trasferimento" ? "di Origine" : ""}</Label>
              <Select value={formData.accountId} onValueChange={(v) => setFormData({ ...formData, accountId: v })}>
                <SelectTrigger><SelectValue placeholder="Seleziona conto" /></SelectTrigger>
                <SelectContent>
                  {accounts.map((acc: any) => (
                    <SelectItem key={acc.id} value={acc.id}>{acc.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {formData.tipo === "trasferimento" && (
              <div>
                <Label>Conto di Destinazione</Label>
                <Select value={formData.accountDestinazioneId} onValueChange={(v) => setFormData({ ...formData, accountDestinazioneId: v })}>
                  <SelectTrigger><SelectValue placeholder="Seleziona conto" /></SelectTrigger>
                  <SelectContent>
                    {accounts.filter((acc: any) => acc.id !== formData.accountId).map((acc: any) => (
                      <SelectItem key={acc.id} value={acc.id}>{acc.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label>Importo *</Label>
              <Input type="number" step="0.01" value={formData.importo} onChange={(e) => setFormData({ ...formData, importo: e.target.value })} placeholder="0.00" />
            </div>
            <div>
              <Label>Data</Label>
              <Input type="date" value={formData.data} onChange={(e) => setFormData({ ...formData, data: e.target.value })} />
            </div>
            <div>
              <Label>Descrizione</Label>
              <Input value={formData.descrizione} onChange={(e) => setFormData({ ...formData, descrizione: e.target.value })} placeholder="Es: Spesa supermercato" />
            </div>
            <div>
              <Label>Categoria</Label>
              <Input value={formData.categoria} onChange={(e) => setFormData({ ...formData, categoria: e.target.value })} placeholder="Es: Alimentari" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annulla</Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="animate-spin h-4 w-4 mr-2" />}
              Registra
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function BudgetTab() {
  const userId = useUserId();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    categoria: "",
    importoLimite: "",
    periodo: "mensile",
    dataInizio: format(new Date(), "yyyy-MM-dd"),
  });

  const { data: budgets = [], isLoading } = useQuery({
    queryKey: ["/api/personal-finance/budgets", userId],
    queryFn: async () => {
      const res = await fetch(`/api/personal-finance/budgets/${userId}`);
      if (!res.ok) throw new Error("Errore");
      return res.json();
    },
    enabled: !!userId
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/personal-finance/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, userId, importoSpeso: "0" })
      });
      if (!res.ok) throw new Error("Errore");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/personal-finance/budgets"] });
      toast({ title: "Budget creato" });
      setDialogOpen(false);
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/personal-finance/budgets/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Errore");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/personal-finance/budgets"] });
      toast({ title: "Budget eliminato" });
    }
  });

  const resetForm = () => {
    setFormData({ categoria: "", importoLimite: "", periodo: "mensile", dataInizio: format(new Date(), "yyyy-MM-dd") });
  };

  const handleSubmit = () => {
    if (!formData.categoria.trim()) {
      toast({ title: "Inserisci una categoria", variant: "destructive" });
      return;
    }
    if (!formData.importoLimite || parseFloat(formData.importoLimite) <= 0) {
      toast({ title: "Inserisci un limite valido", variant: "destructive" });
      return;
    }
    createMutation.mutate(formData);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin h-8 w-8" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">I Tuoi Budget</h2>
        <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" /> Nuovo Budget
        </Button>
      </div>

      {budgets.length === 0 ? (
        <Card className="p-8 text-center">
          <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Nessun budget configurato. Crea un budget per monitorare le tue spese.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgets.map((budget: any) => {
            const limite = parseFloat(budget.importoLimite || "0");
            const speso = parseFloat(budget.importoSpeso || "0");
            const percentuale = limite > 0 ? (speso / limite) * 100 : 0;
            const isOverBudget = percentuale > 100;
            return (
              <Card key={budget.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold">{budget.categoria}</h3>
                      <p className="text-sm text-muted-foreground capitalize">{budget.periodo}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(budget.id)}>
                      <Trash2 className="h-4 w-4 text-muted-foreground hover:text-red-600" />
                    </Button>
                  </div>
                  <Progress value={Math.min(percentuale, 100)} className={`h-2 mb-2 ${isOverBudget ? "[&>div]:bg-red-500" : ""}`} />
                  <div className="flex justify-between text-sm">
                    <span className={isOverBudget ? "text-red-600 font-semibold" : ""}>
                      {speso.toLocaleString("it-IT", { style: "currency", currency: "EUR" })}
                    </span>
                    <span className="text-muted-foreground">
                      / {limite.toLocaleString("it-IT", { style: "currency", currency: "EUR" })}
                    </span>
                  </div>
                  {isOverBudget && (
                    <Badge variant="destructive" className="mt-2">Budget superato!</Badge>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuovo Budget</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Categoria *</Label>
              <Input value={formData.categoria} onChange={(e) => setFormData({ ...formData, categoria: e.target.value })} placeholder="Es: Alimentari" />
            </div>
            <div>
              <Label>Limite di Spesa *</Label>
              <Input type="number" step="0.01" value={formData.importoLimite} onChange={(e) => setFormData({ ...formData, importoLimite: e.target.value })} placeholder="0.00" />
            </div>
            <div>
              <Label>Periodo</Label>
              <Select value={formData.periodo} onValueChange={(v) => setFormData({ ...formData, periodo: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PERIODI_BUDGET.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Data Inizio</Label>
              <Input type="date" value={formData.dataInizio} onChange={(e) => setFormData({ ...formData, dataInizio: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annulla</Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="animate-spin h-4 w-4 mr-2" />}
              Crea
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ObiettiviTab() {
  const userId = useUserId();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [contributionDialogOpen, setContributionDialogOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<any>(null);
  const [contributionAmount, setContributionAmount] = useState("");
  const [formData, setFormData] = useState({
    nome: "",
    descrizione: "",
    importoObiettivo: "",
    dataScadenza: "",
    icona: "target",
    colore: "#3b82f6",
  });

  const { data: goals = [], isLoading } = useQuery({
    queryKey: ["/api/personal-finance/goals", userId],
    queryFn: async () => {
      const res = await fetch(`/api/personal-finance/goals/${userId}`);
      if (!res.ok) throw new Error("Errore");
      return res.json();
    },
    enabled: !!userId
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/personal-finance/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, userId, importoAttuale: "0", completato: false })
      });
      if (!res.ok) throw new Error("Errore");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/personal-finance/goals"] });
      toast({ title: "Obiettivo creato" });
      setDialogOpen(false);
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/personal-finance/goals/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Errore");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/personal-finance/goals"] });
      toast({ title: "Obiettivo eliminato" });
    }
  });

  const contributionMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/personal-finance/goal-contributions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error("Errore");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/personal-finance/goals"] });
      toast({ title: "Versamento registrato" });
      setContributionDialogOpen(false);
      setContributionAmount("");
      setSelectedGoal(null);
    }
  });

  const resetForm = () => {
    setFormData({ nome: "", descrizione: "", importoObiettivo: "", dataScadenza: "", icona: "target", colore: "#3b82f6" });
  };

  const handleSubmit = () => {
    if (!formData.nome.trim()) {
      toast({ title: "Inserisci il nome dell'obiettivo", variant: "destructive" });
      return;
    }
    if (!formData.importoObiettivo || parseFloat(formData.importoObiettivo) <= 0) {
      toast({ title: "Inserisci un importo obiettivo valido", variant: "destructive" });
      return;
    }
    createMutation.mutate(formData);
  };

  const handleContribution = () => {
    if (!contributionAmount || parseFloat(contributionAmount) <= 0) {
      toast({ title: "Inserisci un importo valido", variant: "destructive" });
      return;
    }
    contributionMutation.mutate({
      goalId: selectedGoal.id,
      importo: contributionAmount,
      data: format(new Date(), "yyyy-MM-dd"),
    });
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin h-8 w-8" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Obiettivi di Risparmio</h2>
        <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" /> Nuovo Obiettivo
        </Button>
      </div>

      {goals.length === 0 ? (
        <Card className="p-8 text-center">
          <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Nessun obiettivo configurato. Crea un obiettivo per iniziare a risparmiare.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goals.map((goal: any) => {
            const importoObiettivo = parseFloat(goal.importoObiettivo || "0");
            const importoAttuale = parseFloat(goal.importoAttuale || "0");
            const percentuale = importoObiettivo > 0 ? (importoAttuale / importoObiettivo) * 100 : 0;
            const isCompleted = percentuale >= 100;
            return (
              <Card key={goal.id} className={isCompleted ? "border-green-500" : ""}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full flex items-center justify-center" style={{ backgroundColor: goal.colore + "20" }}>
                        <Target className="h-6 w-6" style={{ color: goal.colore }} />
                      </div>
                      <div>
                        <h3 className="font-semibold">{goal.nome}</h3>
                        {goal.descrizione && <p className="text-sm text-muted-foreground">{goal.descrizione}</p>}
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => { setSelectedGoal(goal); setContributionDialogOpen(true); }}>
                          <Plus className="h-4 w-4 mr-2" /> Aggiungi Versamento
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => deleteMutation.mutate(goal.id)} className="text-red-600">
                          <Trash2 className="h-4 w-4 mr-2" /> Elimina
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <Progress value={Math.min(percentuale, 100)} className={`h-3 mb-3 ${isCompleted ? "[&>div]:bg-green-500" : ""}`} />
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-xl font-bold">{importoAttuale.toLocaleString("it-IT", { style: "currency", currency: "EUR" })}</span>
                      <span className="text-muted-foreground"> / {importoObiettivo.toLocaleString("it-IT", { style: "currency", currency: "EUR" })}</span>
                    </div>
                    <Badge variant={isCompleted ? "default" : "secondary"} className={isCompleted ? "bg-green-500" : ""}>
                      {Math.round(percentuale)}%
                    </Badge>
                  </div>
                  {goal.dataScadenza && (
                    <p className="text-sm text-muted-foreground mt-2">
                      <Calendar className="inline h-3 w-3 mr-1" />
                      Scadenza: {format(new Date(goal.dataScadenza), "d MMMM yyyy", { locale: it })}
                    </p>
                  )}
                  {!isCompleted && (
                    <Button className="w-full mt-4" variant="outline" onClick={() => { setSelectedGoal(goal); setContributionDialogOpen(true); }}>
                      <Plus className="h-4 w-4 mr-2" /> Aggiungi Versamento
                    </Button>
                  )}
                  {isCompleted && (
                    <div className="mt-4 p-3 bg-green-50 rounded-lg text-center text-green-700 font-medium">
                      Obiettivo raggiunto!
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuovo Obiettivo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome Obiettivo *</Label>
              <Input value={formData.nome} onChange={(e) => setFormData({ ...formData, nome: e.target.value })} placeholder="Es: Vacanza estiva" />
            </div>
            <div>
              <Label>Descrizione</Label>
              <Input value={formData.descrizione} onChange={(e) => setFormData({ ...formData, descrizione: e.target.value })} placeholder="Facoltativo" />
            </div>
            <div>
              <Label>Importo Obiettivo *</Label>
              <Input type="number" step="0.01" value={formData.importoObiettivo} onChange={(e) => setFormData({ ...formData, importoObiettivo: e.target.value })} placeholder="0.00" />
            </div>
            <div>
              <Label>Data Scadenza</Label>
              <Input type="date" value={formData.dataScadenza} onChange={(e) => setFormData({ ...formData, dataScadenza: e.target.value })} />
            </div>
            <div>
              <Label>Colore</Label>
              <Input type="color" value={formData.colore} onChange={(e) => setFormData({ ...formData, colore: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annulla</Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="animate-spin h-4 w-4 mr-2" />}
              Crea
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={contributionDialogOpen} onOpenChange={setContributionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aggiungi Versamento</DialogTitle>
            <DialogDescription>Registra un nuovo versamento per "{selectedGoal?.nome}"</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Importo *</Label>
              <Input type="number" step="0.01" value={contributionAmount} onChange={(e) => setContributionAmount(e.target.value)} placeholder="0.00" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setContributionDialogOpen(false)}>Annulla</Button>
            <Button onClick={handleContribution} disabled={contributionMutation.isPending}>
              {contributionMutation.isPending && <Loader2 className="animate-spin h-4 w-4 mr-2" />}
              Versa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ReportTab() {
  const userId = useUserId();
  
  const { data: transactions = [] } = useQuery({
    queryKey: ["/api/personal-finance/transactions", userId],
    queryFn: async () => {
      const res = await fetch(`/api/personal-finance/transactions/${userId}`);
      if (!res.ok) throw new Error("Errore");
      return res.json();
    },
    enabled: !!userId
  });

  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();

  const entratePerCategoria = transactions
    .filter((t: any) => t.tipo === "entrata")
    .reduce((acc: any, t: any) => {
      const cat = t.categoria || "Altro";
      acc[cat] = (acc[cat] || 0) + parseFloat(t.importo || "0");
      return acc;
    }, {});

  const uscitePerCategoria = transactions
    .filter((t: any) => t.tipo === "uscita")
    .reduce((acc: any, t: any) => {
      const cat = t.categoria || "Altro";
      acc[cat] = (acc[cat] || 0) + parseFloat(t.importo || "0");
      return acc;
    }, {});

  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const monthTransactions = transactions.filter((t: any) => {
      const d = new Date(t.data);
      return d.getMonth() === i && d.getFullYear() === thisYear;
    });
    const entrate = monthTransactions.filter((t: any) => t.tipo === "entrata").reduce((sum: number, t: any) => sum + parseFloat(t.importo || "0"), 0);
    const uscite = monthTransactions.filter((t: any) => t.tipo === "uscita").reduce((sum: number, t: any) => sum + parseFloat(t.importo || "0"), 0);
    return { month: i, entrate, uscite, bilancio: entrate - uscite };
  });

  const MONTHS = ["Gen", "Feb", "Mar", "Apr", "Mag", "Giu", "Lug", "Ago", "Set", "Ott", "Nov", "Dic"];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Uscite per Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(uscitePerCategoria).length === 0 ? (
              <p className="text-center text-muted-foreground py-4">Nessun dato disponibile</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(uscitePerCategoria)
                  .sort((a: any, b: any) => b[1] - a[1])
                  .map(([cat, amount]: any) => {
                    const total = Object.values(uscitePerCategoria).reduce((a: any, b: any) => a + b, 0) as number;
                    const percentage = (amount / total) * 100;
                    return (
                      <div key={cat} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>{cat}</span>
                          <span className="font-medium">{amount.toLocaleString("it-IT", { style: "currency", currency: "EUR" })} ({percentage.toFixed(1)}%)</span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Entrate per Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(entratePerCategoria).length === 0 ? (
              <p className="text-center text-muted-foreground py-4">Nessun dato disponibile</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(entratePerCategoria)
                  .sort((a: any, b: any) => b[1] - a[1])
                  .map(([cat, amount]: any) => {
                    const total = Object.values(entratePerCategoria).reduce((a: any, b: any) => a + b, 0) as number;
                    const percentage = (amount / total) * 100;
                    return (
                      <div key={cat} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>{cat}</span>
                          <span className="font-medium">{amount.toLocaleString("it-IT", { style: "currency", currency: "EUR" })} ({percentage.toFixed(1)}%)</span>
                        </div>
                        <Progress value={percentage} className="h-2 [&>div]:bg-green-500" />
                      </div>
                    );
                  })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Andamento Mensile {thisYear}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {monthlyData.filter(m => m.entrate > 0 || m.uscite > 0).map((m) => (
              <div key={m.month} className="flex items-center gap-4">
                <div className="w-12 font-medium">{MONTHS[m.month]}</div>
                <div className="flex-1 flex items-center gap-2">
                  <div className="flex-1 flex gap-1">
                    <div className="h-6 bg-green-500 rounded" style={{ width: `${(m.entrate / Math.max(...monthlyData.map(x => Math.max(x.entrate, x.uscite))) * 100) || 0}%` }} />
                  </div>
                  <div className="flex-1 flex gap-1">
                    <div className="h-6 bg-red-500 rounded" style={{ width: `${(m.uscite / Math.max(...monthlyData.map(x => Math.max(x.entrate, x.uscite))) * 100) || 0}%` }} />
                  </div>
                </div>
                <div className={`w-24 text-right font-medium ${m.bilancio >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {m.bilancio >= 0 ? "+" : ""}{m.bilancio.toLocaleString("it-IT", { style: "currency", currency: "EUR" })}
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-6 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 bg-green-500 rounded" />
              <span>Entrate</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 bg-red-500 rounded" />
              <span>Uscite</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function FinanzaPersonale() {
  return (
    <AppLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Wallet className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Finanza Personale</h1>
            <p className="text-muted-foreground">Gestisci i tuoi conti, transazioni e obiettivi di risparmio</p>
          </div>
        </div>

        <Tabs defaultValue="dashboard" className="space-y-4">
          <TabsList className="grid grid-cols-6 w-full max-w-3xl">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="conti" className="flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              <span className="hidden sm:inline">Conti</span>
            </TabsTrigger>
            <TabsTrigger value="transazioni" className="flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              <span className="hidden sm:inline">Transazioni</span>
            </TabsTrigger>
            <TabsTrigger value="budget" className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4" />
              <span className="hidden sm:inline">Budget</span>
            </TabsTrigger>
            <TabsTrigger value="obiettivi" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              <span className="hidden sm:inline">Obiettivi</span>
            </TabsTrigger>
            <TabsTrigger value="report" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Report</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <DashboardTab />
          </TabsContent>
          <TabsContent value="conti">
            <ContiTab />
          </TabsContent>
          <TabsContent value="transazioni">
            <TransazioniTab />
          </TabsContent>
          <TabsContent value="budget">
            <BudgetTab />
          </TabsContent>
          <TabsContent value="obiettivi">
            <ObiettiviTab />
          </TabsContent>
          <TabsContent value="report">
            <ReportTab />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
