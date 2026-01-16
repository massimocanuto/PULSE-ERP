import { AppLayout } from "@/components/layout/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Wallet, Receipt, ArrowUpDown, Building2, PiggyBank, CalendarClock,
  Plus, Search, MoreHorizontal, Trash2, Edit2, Loader2, TrendingUp,
  TrendingDown, ArrowRightLeft, FileText, AlertCircle, CheckCircle2,
  Euro, CreditCard, Banknote, Clock, Filter, X, Eye, Download,
  Upload, Link2, RefreshCw, FileSpreadsheet, Check, AlertTriangle,
  FolderOpen, File, FileCheck, Zap, ScrollText, Briefcase, Expand, Minimize2, Maximize2,
  Lock, Share2, Copy, ExternalLink, StickyNote, Mail, History, MailCheck, MailX,
  Printer, Truck, Route, Navigation, Boxes, ClipboardList, Package, Edit
} from "lucide-react";
import { BankImportDialog } from "@/components/finance/BankImportDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import React, { useState, useMemo, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths } from "date-fns";
import { it } from "date-fns/locale";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { BarChart3 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { jsPDF } from "jspdf";
import { CopyLinkButton } from "@/components/CopyLinkButton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const TIPI_CONTO = [
  { value: "banca", label: "Conto Corrente", icon: Building2 },
  { value: "cassa", label: "Cassa", icon: Banknote },
  { value: "carta_credito", label: "Carta di Credito", icon: CreditCard },
  { value: "paypal", label: "PayPal", icon: Wallet },
  { value: "altro", label: "Altro", icon: Wallet },
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

const STATI_DDT = [
  { value: "bozza", label: "Bozza", color: "bg-gray-500" },
  { value: "in_preparazione", label: "In Preparazione", color: "bg-yellow-500" },
  { value: "in_spedizione", label: "In Spedizione", color: "bg-orange-500" },
  { value: "consegnato", label: "Consegnato", color: "bg-green-500" },
];

const CAUSALI_TRASPORTO = [
  "Vendita",
  "Conto visione",
  "Reso",
  "Riparazione",
  "Omaggio",
  "Altro",
];

const TIPI_TRASPORTO = [
  "Mittente",
  "Destinatario",
  "Vettore",
];

const ASPETTI_BENI = [
  "Scatole",
  "Pallet",
  "Sfuso",
  "Buste",
  "Altro",
];

const COLORI_CONTO = [
  "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6",
  "#EC4899", "#06B6D4", "#84CC16", "#F97316", "#6366F1"
];

interface FinanceAccount {
  id: string;
  nome: string;
  tipo: string;
  iban?: string;
  bic?: string;
  istituto?: string;
  saldoIniziale?: string;
  saldoAttuale?: string;
  valuta?: string;
  colore?: string;
  icona?: string;
  attivo: boolean;
  predefinito: boolean;
  note?: string;
  createdAt?: string;
}

interface Invoice {
  id: string;
  numero: string;
  tipo: string;
  stato: string;
  dataEmissione: string;
  dataScadenza?: string;
  dataPagamento?: string;
  clienteId?: string;
  ragioneSociale: string;
  partitaIva?: string;
  codiceFiscale?: string;
  indirizzo?: string;
  sdi?: string;
  pec?: string;
  metodoPagamento?: string;
  imponibile?: string;
  iva?: string;
  totale?: string;
  totalePagato?: string;
  valuta?: string;
  oggetto?: string;
  note?: string;
  noteInterne?: string;
  allegato?: string;
  projectId?: string;
  createdAt?: string;
}

interface Project {
  id: string;
  name: string;
  status: string;
}

interface InvoicePayment {
  id: string;
  invoiceId: string;
  importo: string;
  data: string;
  metodo?: string;
  note?: string;
  createdAt?: string;
}

interface Quote {
  id: string;
  numero: string;
  stato: string;
  dataEmissione: string;
  dataValidita?: string;
  clienteId?: string;
  ragioneSociale: string;
  partitaIva?: string;
  codiceFiscale?: string;
  indirizzo?: string;
  email?: string;
  telefono?: string;
  imponibile?: string;
  iva?: string;
  totale?: string;
  sconto?: string;
  valuta?: string;
  oggetto?: string;
  descrizione?: string;
  terminiPagamento?: string;
  note?: string;
  noteInterne?: string;
  invoiceId?: string;
  projectId?: string;
  createdAt?: string;
}

interface Ddt {
  id: string;
  numero: string;
  stato: string;
  dataEmissione: string;
  dataTrasporto?: string;
  oraTrasporto?: string;
  clienteId?: string;
  ragioneSociale: string;
  partitaIva?: string;
  codiceFiscale?: string;
  indirizzo?: string;
  cap?: string;
  citta?: string;
  provincia?: string;
  email?: string;
  telefono?: string;
  destinazioneDiversa?: boolean;
  destinazioneRagioneSociale?: string;
  destinazioneIndirizzo?: string;
  destinazioneCap?: string;
  destinazioneCitta?: string;
  destinazioneProvincia?: string;
  causaleTrasporto?: string;
  tipoTrasporto?: string;
  vettore?: string;
  aspettoBeni?: string;
  porto?: string;
  pesoLordo?: string;
  pesoNetto?: string;
  colli?: string;
  note?: string;
  noteInterne?: string;
  riferimentoOrdine?: string;
  invoiceId?: string;
  quoteId?: string;
  projectId?: string;
  createdAt?: string;
  lines?: DdtLine[];
}

interface DdtLine {
  id?: string;
  ddtId?: string;
  codiceArticolo?: string;
  descrizione: string;
  quantita?: string;
  unitaMisura?: string;
  note?: string;
  ordine?: number;
}

interface FinanceTransaction {
  id: string;
  tipo: string;
  descrizione: string;
  importo: string;
  data: string;
  contoId?: string;
  categoriaId?: string;
  riconciliato: boolean;
  note?: string;
  createdAt?: string;
}

interface FinanceCategory {
  id: string;
  nome: string;
  tipo: string;
  icona?: string;
  colore?: string;
  attivo: boolean;
}

interface FinanceStats {
  saldoTotale: number;
  totaleCrediti: number;
  totaleDebiti: number;
  scadenzeAttive: number;
  scadenzeOggi: number;
  contiAttivi: number;
  fattureEmesseMese: number;
  fattureRicevuteMese: number;
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

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return '';
  // Handle ISO format: 2025-03-31 → 31.03.2025
  if (dateStr.includes('-')) {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}.${parts[1]}.${parts[0]}`;
    }
  }
  // Handle slash format: 31/03/2025 → 31.03.2025
  if (dateStr.includes('/')) {
    return dateStr.replace(/\//g, '.');
  }
  return dateStr;
}

function AccountDialog({
  open,
  onOpenChange,
  account,
  onSave
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account?: FinanceAccount | null;
  onSave: (data: any) => void;
}) {
  const formatItalianNumber = (value: string | number): string => {
    const num = typeof value === 'string' ? parseFloat(value) || 0 : value;
    return num.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const parseItalianNumber = (value: string): string => {
    const cleaned = value.replace(/\./g, '').replace(',', '.');
    const num = parseFloat(cleaned);
    return isNaN(num) ? "0" : num.toFixed(2);
  };

  const [formData, setFormData] = useState({
    nome: account?.nome || "",
    tipo: account?.tipo || "banca",
    iban: account?.iban || "",
    bic: account?.bic || "",
    istituto: account?.istituto || "",
    saldoIniziale: formatItalianNumber(account?.saldoIniziale || "0"),
    colore: account?.colore || "#3B82F6",
    note: account?.note || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const saldoNumerico = parseItalianNumber(formData.saldoIniziale);
    onSave({ ...formData, saldoIniziale: saldoNumerico, saldoAttuale: saldoNumerico });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{account ? "Modifica Conto" : "Nuovo Conto"}</DialogTitle>
          <DialogDescription>
            {account ? "Modifica i dati del conto" : "Inserisci i dati del nuovo conto"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Nome Conto *</Label>
            <Input
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              placeholder="Es: Conto Principale"
              required
            />
          </div>
          <div>
            <Label>Tipo</Label>
            <Select value={formData.tipo} onValueChange={(v) => setFormData({ ...formData, tipo: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIPI_CONTO.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Istituto/Banca</Label>
            <Input
              value={formData.istituto}
              onChange={(e) => setFormData({ ...formData, istituto: e.target.value })}
              placeholder="Es: Intesa Sanpaolo"
            />
          </div>
          <div>
            <Label>IBAN</Label>
            <Input
              value={formData.iban}
              onChange={(e) => setFormData({ ...formData, iban: e.target.value.toUpperCase() })}
              placeholder="IT00X0000000000000000000000"
            />
          </div>
          <div>
            <Label>Saldo Iniziale</Label>
            <Input
              type="text"
              inputMode="decimal"
              value={formData.saldoIniziale}
              onChange={(e) => setFormData({ ...formData, saldoIniziale: e.target.value })}
              placeholder="Es: 15.000,00"
            />
          </div>
          <div>
            <Label>Colore</Label>
            <div className="flex gap-2 mt-1">
              {COLORI_CONTO.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setFormData({ ...formData, colore: c })}
                  className={`w-6 h-6 rounded-full border-2 ${formData.colore === c ? 'border-gray-900 dark:border-white' : 'border-transparent'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <div>
            <Label>Note</Label>
            <Textarea
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              rows={2}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annulla
            </Button>
            <Button type="submit">
              {account ? "Salva" : "Crea"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function InvoiceDialog({
  open,
  onOpenChange,
  invoice,
  tipo,
  onSave,
  projects = []
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice?: Invoice | null;
  tipo: string;
  onSave: (data: any) => void;
  projects?: Project[];
}) {
  const { data: clienti = [] } = useQuery<Array<{
    id: string;
    ragioneSociale: string;
    partitaIva?: string;
    codiceFiscale?: string;
    email?: string;
    pec?: string;
    sdi?: string;
    indirizzo?: string;
    citta?: string;
    cap?: string;
    provincia?: string;
    condizioniPagamento?: string;
  }>>({
    queryKey: ["/api/anagrafica/clienti"],
  });

  const [formData, setFormData] = useState({
    numero: invoice?.numero || "",
    tipo: invoice?.tipo || tipo,
    stato: invoice?.stato || "bozza",
    dataEmissione: invoice?.dataEmissione || new Date().toISOString().split('T')[0],
    dataScadenza: invoice?.dataScadenza || "",
    clienteId: invoice?.clienteId || "",
    ragioneSociale: invoice?.ragioneSociale || "",
    partitaIva: invoice?.partitaIva || "",
    codiceFiscale: invoice?.codiceFiscale || "",
    indirizzo: invoice?.indirizzo || "",
    sdi: invoice?.sdi || "",
    pec: invoice?.pec || "",
    metodoPagamento: invoice?.metodoPagamento || "",
    imponibile: invoice?.imponibile || "0",
    iva: invoice?.iva || "0",
    totale: invoice?.totale || "0",
    oggetto: invoice?.oggetto || "",
    note: invoice?.note || "",
    noteInterne: invoice?.noteInterne || "",
    allegato: invoice?.allegato || "",
    projectId: invoice?.projectId || "",
  });

  useEffect(() => {
    if (open && !invoice && tipo === "emessa") {
      fetch("/api/finance/invoices/next-numero")
        .then(res => res.json())
        .then(data => {
          if (data.numero) {
            setFormData(prev => ({ ...prev, numero: data.numero }));
          }
        })
        .catch(err => console.error("Error fetching next invoice number:", err));
    }
  }, [open, invoice, tipo]);

  const handleClienteSelect = (clienteId: string) => {
    if (clienteId === "_manual") {
      setFormData({
        ...formData,
        clienteId: "",
        ragioneSociale: "",
        partitaIva: "",
        codiceFiscale: "",
        indirizzo: "",
        sdi: "",
        pec: "",
        metodoPagamento: ""
      });
    } else {
      const cliente = clienti.find(c => c.id === clienteId);
      if (cliente) {
        const indirizzoCompleto = [
          cliente.indirizzo,
          cliente.cap,
          cliente.citta,
          cliente.provincia ? `(${cliente.provincia})` : ""
        ].filter(Boolean).join(" ");

        setFormData({
          ...formData,
          clienteId: cliente.id,
          ragioneSociale: cliente.ragioneSociale,
          partitaIva: cliente.partitaIva || "",
          codiceFiscale: cliente.codiceFiscale || "",
          indirizzo: indirizzoCompleto,
          sdi: cliente.sdi || "",
          pec: cliente.pec || "",
          metodoPagamento: cliente.condizioniPagamento || "",
        });
      }
    }
  };

  const calcTotale = () => {
    const imp = parseFloat(formData.imponibile) || 0;
    const ivaPerc = parseFloat(formData.iva) || 0;
    const tot = imp + (imp * ivaPerc / 100);
    setFormData({ ...formData, totale: tot.toFixed(2) });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {invoice ? "Modifica Fattura" : `Nuova Fattura ${tipo === "emessa" ? "Emessa" : "Ricevuta"}`}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Numero Fattura *</Label>
              <Input
                value={formData.numero}
                onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                placeholder="Es: 2024/001"
                required
              />
            </div>
            <div>
              <Label>Stato</Label>
              <Select value={formData.stato} onValueChange={(v) => setFormData({ ...formData, stato: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATI_FATTURA.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Data Emissione *</Label>
              <Input
                type="date"
                value={formData.dataEmissione}
                onChange={(e) => setFormData({ ...formData, dataEmissione: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Data Scadenza</Label>
              <Input
                type="date"
                value={formData.dataScadenza}
                onChange={(e) => setFormData({ ...formData, dataScadenza: e.target.value })}
              />
            </div>
          </div>
          {tipo === "emessa" ? (
            <div>
              <Label>Cliente *</Label>
              <Select value={formData.clienteId || "_manual"} onValueChange={handleClienteSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona cliente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_manual">Inserimento manuale</SelectItem>
                  {clienti.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.ragioneSociale} {c.partitaIva ? `(${c.partitaIva})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formData.clienteId ? (
                <p className="text-sm text-muted-foreground mt-1">{formData.ragioneSociale}</p>
              ) : (
                <Input
                  className="mt-2"
                  value={formData.ragioneSociale}
                  onChange={(e) => setFormData({ ...formData, ragioneSociale: e.target.value })}
                  placeholder="Ragione Sociale"
                  required
                />
              )}
            </div>
          ) : (
            <div>
              <Label>Fornitore *</Label>
              <Input
                value={formData.ragioneSociale}
                onChange={(e) => setFormData({ ...formData, ragioneSociale: e.target.value })}
                placeholder="Ragione Sociale"
                required
              />
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Partita IVA</Label>
              <Input
                value={formData.partitaIva}
                onChange={(e) => setFormData({ ...formData, partitaIva: e.target.value })}
                placeholder="00000000000"
                disabled={!!formData.clienteId}
              />
            </div>
            <div>
              <Label>Codice Fiscale</Label>
              <Input
                value={formData.codiceFiscale}
                onChange={(e) => setFormData({ ...formData, codiceFiscale: e.target.value })}
                placeholder="Codice Fiscale"
                disabled={!!formData.clienteId}
              />
            </div>
          </div>
          <div>
            <Label>Indirizzo</Label>
            <Input
              value={formData.indirizzo}
              onChange={(e) => setFormData({ ...formData, indirizzo: e.target.value })}
              placeholder="Via, CAP, Città (Prov)"
              disabled={!!formData.clienteId}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Codice SDI</Label>
              <Input
                value={formData.sdi}
                onChange={(e) => setFormData({ ...formData, sdi: e.target.value })}
                placeholder="Codice destinatario"
                disabled={!!formData.clienteId}
              />
            </div>
            <div>
              <Label>PEC</Label>
              <Input
                value={formData.pec}
                onChange={(e) => setFormData({ ...formData, pec: e.target.value })}
                placeholder="pec@example.it"
                disabled={!!formData.clienteId}
              />
            </div>
          </div>
          <div>
            <Label>Metodo Pagamento</Label>
            <Input
              value={formData.metodoPagamento}
              onChange={(e) => setFormData({ ...formData, metodoPagamento: e.target.value })}
              placeholder="Es: Bonifico 30gg"
              disabled={!!formData.clienteId}
            />
          </div>
          <div>
            <Label>Oggetto</Label>
            <Input
              value={formData.oggetto}
              onChange={(e) => setFormData({ ...formData, oggetto: e.target.value })}
              placeholder="Descrizione servizio/prodotto"
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Imponibile</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.imponibile}
                onChange={(e) => setFormData({ ...formData, imponibile: e.target.value })}
                onBlur={calcTotale}
              />
            </div>
            <div>
              <Label>IVA %</Label>
              <Input
                type="number"
                value={formData.iva}
                onChange={(e) => setFormData({ ...formData, iva: e.target.value })}
                onBlur={calcTotale}
              />
            </div>
            <div>
              <Label>Totale</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.totale}
                onChange={(e) => setFormData({ ...formData, totale: e.target.value })}
              />
            </div>
          </div>
          {projects.length > 0 && (
            <div>
              <Label>Collega a Progetto</Label>
              <Select value={formData.projectId || "none"} onValueChange={(v) => setFormData({ ...formData, projectId: v === "none" ? "" : v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Nessun progetto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nessun progetto</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div>
            <Label>Note (visibili al cliente)</Label>
            <Textarea
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              placeholder="Note che appariranno sulla fattura..."
              rows={2}
            />
          </div>
          <div>
            <Label>Note Interne (solo uso interno)</Label>
            <Textarea
              value={formData.noteInterne}
              onChange={(e) => setFormData({ ...formData, noteInterne: e.target.value })}
              placeholder="Note interne non visibili al cliente..."
              rows={2}
              className="bg-amber-50/50 dark:bg-amber-950/20"
            />
          </div>
          <div>
            <Label>Link Allegato (URL documento)</Label>
            <Input
              value={formData.allegato}
              onChange={(e) => setFormData({ ...formData, allegato: e.target.value })}
              placeholder="https://... oppure /archivio/documento.pdf"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annulla
            </Button>
            <Button type="submit">
              {invoice ? "Salva" : "Crea"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function TransactionDialog({
  open,
  onOpenChange,
  transaction,
  accounts,
  categories,
  onSave
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction?: FinanceTransaction | null;
  accounts: FinanceAccount[];
  categories: FinanceCategory[];
  onSave: (data: any) => void;
}) {
  const [formData, setFormData] = useState({
    tipo: transaction?.tipo || "uscita",
    descrizione: transaction?.descrizione || "",
    importo: transaction?.importo || "",
    data: transaction?.data || new Date().toISOString().split('T')[0],
    contoId: transaction?.contoId || "",
    categoriaId: transaction?.categoriaId || "",
    note: transaction?.note || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onOpenChange(false);
  };

  const filteredCategories = categories.filter(c => c.tipo === formData.tipo || formData.tipo === "trasferimento");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{transaction ? "Modifica Transazione" : "Nuova Transazione"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Tipo *</Label>
            <Select value={formData.tipo} onValueChange={(v) => setFormData({ ...formData, tipo: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="entrata">Entrata</SelectItem>
                <SelectItem value="uscita">Uscita</SelectItem>
                <SelectItem value="trasferimento">Trasferimento</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Descrizione *</Label>
            <Input
              value={formData.descrizione}
              onChange={(e) => setFormData({ ...formData, descrizione: e.target.value })}
              placeholder="Es: Pagamento fornitore XYZ"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Importo *</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.importo}
                onChange={(e) => setFormData({ ...formData, importo: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Data *</Label>
              <Input
                type="date"
                value={formData.data}
                onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                required
              />
            </div>
          </div>
          <div>
            <Label>Conto</Label>
            <Select value={formData.contoId} onValueChange={(v) => setFormData({ ...formData, contoId: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Seleziona conto" />
              </SelectTrigger>
              <SelectContent>
                {accounts.filter(a => a.attivo).map((a) => (
                  <SelectItem key={a.id} value={a.id}>{a.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {filteredCategories.length > 0 && (
            <div>
              <Label>Categoria</Label>
              <Select value={formData.categoriaId} onValueChange={(v) => setFormData({ ...formData, categoriaId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona categoria" />
                </SelectTrigger>
                <SelectContent>
                  {filteredCategories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div>
            <Label>Note</Label>
            <Textarea
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              rows={2}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annulla
            </Button>
            <Button type="submit">
              {transaction ? "Salva" : "Crea"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface InvoiceReminder {
  id: string;
  invoiceId: string;
  trackingToken: string;
  recipientEmail: string;
  recipientName?: string | null;
  subject: string;
  body: string;
  sentBy?: string | null;
  sentAt?: string | null;
  deliveryStatus: string;
  deliveryError?: string | null;
  openedAt?: string | null;
  openCount: number;
  lastOpenIp?: string | null;
  lastOpenUserAgent?: string | null;
  createdAt: string;
}

function ReminderDialog({
  open,
  onOpenChange,
  invoice,
  onSend
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: Invoice | null;
  onSend: (data: { recipientEmail: string; recipientName: string; subject: string; body: string }) => void;
}) {
  const [formData, setFormData] = useState({
    recipientEmail: "",
    recipientName: invoice?.ragioneSociale || "",
    subject: "",
    body: "",
  });
  const [reminders, setReminders] = useState<InvoiceReminder[]>([]);
  const [loadingReminders, setLoadingReminders] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return "-";
    try {
      return format(new Date(dateStr), "dd/MM/yyyy HH:mm", { locale: it });
    } catch { return dateStr; }
  };

  const loadReminders = async () => {
    if (!invoice) return;
    setLoadingReminders(true);
    try {
      const res = await fetch(`/api/finance/invoices/${invoice.id}/reminders`);
      if (res.ok) {
        const data = await res.json();
        setReminders(data);
      }
    } catch (error) {
      console.error("Error loading reminders:", error);
    }
    setLoadingReminders(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSend(formData);
  };

  const generateDefaultSubject = () => {
    if (!invoice) return "";
    return `Sollecito di pagamento - Fattura n. ${invoice.numero}`;
  };

  const generateDefaultBody = () => {
    if (!invoice) return "";
    const totale = parseFloat(invoice.totale || "0") || 0;
    return `Gentile ${invoice.ragioneSociale || "Cliente"},

con la presente desideriamo ricordarLe che la fattura n. ${invoice.numero} del ${invoice.dataEmissione ? format(new Date(invoice.dataEmissione), "dd/MM/yyyy") : ""} per un importo di € ${totale.toFixed(2).replace('.', ',')} risulta ancora non saldata.

La preghiamo di provvedere al pagamento quanto prima.

Per eventuali chiarimenti, non esiti a contattarci.

Cordiali saluti`;
  };

  if (!invoice) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Sollecito Fattura n. {invoice.numero}
          </DialogTitle>
          <DialogDescription>
            Invia un sollecito di pagamento via email al cliente
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2 mb-4">
          <Button
            variant={showHistory ? "outline" : "default"}
            size="sm"
            onClick={() => setShowHistory(false)}
          >
            <Mail className="h-4 w-4 mr-2" />
            Nuovo Sollecito
          </Button>
          <Button
            variant={showHistory ? "default" : "outline"}
            size="sm"
            onClick={() => { setShowHistory(true); loadReminders(); }}
          >
            <History className="h-4 w-4 mr-2" />
            Storico ({reminders.length})
          </Button>
        </div>

        {showHistory ? (
          <div className="space-y-3">
            {loadingReminders ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : reminders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Mail className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p>Nessun sollecito inviato per questa fattura</p>
              </div>
            ) : (
              reminders.map((r) => (
                <div key={r.id} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{r.subject}</span>
                    <div className="flex items-center gap-2">
                      {r.deliveryStatus === "sent" ? (
                        r.openedAt ? (
                          <Badge className="bg-green-100 text-green-800 text-xs flex items-center gap-1">
                            <MailCheck className="h-3 w-3" />
                            Letto ({r.openCount}x)
                          </Badge>
                        ) : (
                          <Badge className="bg-blue-100 text-blue-800 text-xs flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            Inviato
                          </Badge>
                        )
                      ) : r.deliveryStatus === "failed" ? (
                        <Badge className="bg-red-100 text-red-800 text-xs flex items-center gap-1">
                          <MailX className="h-3 w-3" />
                          Fallito
                        </Badge>
                      ) : (
                        <Badge className="bg-gray-100 text-gray-800 text-xs">
                          In attesa
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div><strong>A:</strong> {r.recipientEmail}</div>
                    <div><strong>Inviato:</strong> {formatDate(r.sentAt)}</div>
                    {r.openedAt && (
                      <div className="text-green-600">
                        <strong>Aperto:</strong> {formatDate(r.openedAt)}
                      </div>
                    )}
                    {r.deliveryError && (
                      <div className="text-red-600 text-xs mt-1">
                        <strong>Errore:</strong> {r.deliveryError}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Email Destinatario *</Label>
                <Input
                  type="email"
                  value={formData.recipientEmail}
                  onChange={(e) => setFormData({ ...formData, recipientEmail: e.target.value })}
                  placeholder="cliente@email.com"
                  required
                />
              </div>
              <div>
                <Label>Nome Destinatario</Label>
                <Input
                  value={formData.recipientName}
                  onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
                  placeholder={invoice.ragioneSociale || "Nome cliente"}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label>Oggetto *</Label>
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  className="h-auto p-0 text-xs"
                  onClick={() => setFormData({ ...formData, subject: generateDefaultSubject() })}
                >
                  Genera automatico
                </Button>
              </div>
              <Input
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="Oggetto dell'email"
                required
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label>Testo del sollecito *</Label>
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  className="h-auto p-0 text-xs"
                  onClick={() => setFormData({ ...formData, body: generateDefaultBody() })}
                >
                  Genera modello
                </Button>
              </div>
              <Textarea
                value={formData.body}
                onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                placeholder="Scrivi il testo del sollecito..."
                rows={8}
                required
              />
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-2 mb-1">
                <Eye className="h-4 w-4" />
                <span className="font-medium">Tracciamento lettura</span>
              </div>
              <p>
                L'email includerà un pixel di tracciamento per verificare se il destinatario l'ha aperta.
                Puoi controllare lo stato nella sezione "Storico".
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Annulla
              </Button>
              <Button type="submit">
                <Mail className="h-4 w-4 mr-2" />
                Invia Sollecito
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function Finanza() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  const ALLOWED_USERS = ["massimo.canuto"];
  // const hasAccess = user && ALLOWED_USERS.includes(user.username);
  const hasAccess = true;

  const [activeTab, setActiveTab] = useState("dashboard");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [accountDialogOpen, setAccountDialogOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<FinanceAccount | null>(null);
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [invoiceTipo, setInvoiceTipo] = useState("emessa");
  const [transactionDialogOpen, setTransactionDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<FinanceTransaction | null>(null);
  const [viewTransactionOpen, setViewTransactionOpen] = useState(false);
  const [viewTransaction, setViewTransaction] = useState<FinanceTransaction | null>(null);
  const [importAccountId, setImportAccountId] = useState<string>("");
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(new Set());
  const [transactionTypeFilter, setTransactionTypeFilter] = useState<string>("tutti");
  const [transactionAccountFilter, setTransactionAccountFilter] = useState<string>("tutti");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<FinanceTransaction | null>(null);
  const [showTrash, setShowTrash] = useState(false);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [noteTransaction, setNoteTransaction] = useState<FinanceTransaction | null>(null);
  const [noteText, setNoteText] = useState("");
  const [compactView, setCompactView] = useState(true);
  const [isImportingXml, setIsImportingXml] = useState(false);
  const [xmlImportProgress, setXmlImportProgress] = useState(0);
  const [isImportingCsv, setIsImportingCsv] = useState(false);
  const [csvImportProgress, setCsvImportProgress] = useState(0);
  const [isImportingXlsx, setIsImportingXlsx] = useState(false);
  const [xlsxImportProgress, setXlsxImportProgress] = useState(0);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareResource, setShareResource] = useState<{ tipo: "invoice" | "transaction"; id: string; name: string } | null>(null);
  const [shareLink, setShareLink] = useState("");
  const [isCreatingShare, setIsCreatingShare] = useState(false);
  const [invoiceFilterStato, setInvoiceFilterStato] = useState<string>("tutti");
  const [invoiceFilterPeriodo, setInvoiceFilterPeriodo] = useState<string>("tutti");
  const [invoiceFilterCliente, setInvoiceFilterCliente] = useState<string>("");
  const [ganttFilterCliente, setGanttFilterCliente] = useState<string>("tutti");
  const [ganttFilterMese, setGanttFilterMese] = useState<string>("tutti");
  const [invoiceFilterScadenza, setInvoiceFilterScadenza] = useState<string>("tutti");
  const [isReconciling, setIsReconciling] = useState(false);
  const [reconcileDialogOpen, setReconcileDialogOpen] = useState(false);
  const [reconcileConfirmOpen, setReconcileConfirmOpen] = useState(false);
  const [reconcileResetPrevious, setReconcileResetPrevious] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reconcileProgress, setReconcileProgress] = useState(0);
  const [reconcileCurrentBank, setReconcileCurrentBank] = useState("");
  const [reconcileResults, setReconcileResults] = useState<{ bank: string; matched: number }[]>([]);
  const [reconcileComplete, setReconcileComplete] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentInvoice, setPaymentInvoice] = useState<Invoice | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentNote, setPaymentNote] = useState("");
  const [reminderDialogOpen, setReminderDialogOpen] = useState(false);
  const [reminderInvoice, setReminderInvoice] = useState<Invoice | null>(null);
  const [invoiceDetailOpen, setInvoiceDetailOpen] = useState(false);
  const [invoiceDetail, setInvoiceDetail] = useState<Invoice | null>(null);
  const [quoteDialogOpen, setQuoteDialogOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [quoteFormData, setQuoteFormData] = useState({
    numero: "",
    dataEmissione: new Date().toISOString().split('T')[0],
    dataValidita: "",
    stato: "bozza",
    projectId: "none",
    clienteId: "",
    ragioneSociale: "",
    partitaIva: "",
    email: "",
    telefono: "",
    indirizzo: "",
    oggetto: "",
    descrizione: "",
    imponibile: "0",
    iva: "22",
    totale: "0",
    terminiPagamento: "",
    note: "",
  });
  const [quoteLines, setQuoteLines] = useState<Array<{
    id?: string;
    codiceArticolo: string;
    descrizione: string;
    quantita: string;
    unitaMisura: string;
    prezzoUnitario: string;
    sconto: string;
    aliquotaIva: string;
    importo: string;
  }>>([]);
  const [quoteNewArticleId, setQuoteNewArticleId] = useState("");
  const [quoteNewQuantity, setQuoteNewQuantity] = useState("1");
  const [isConverting, setIsConverting] = useState(false);
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [orderFormData, setOrderFormData] = useState({
    numero: "",
    dataOrdine: new Date().toISOString().split('T')[0],
    clienteId: "",
    ragioneSociale: "",
    partitaIva: "",
    email: "",
    telefono: "",
    indirizzo: "",
    note: "",
    stato: "confermato",
  });
  const [orderLines, setOrderLines] = useState<Array<{
    id?: string;
    codiceArticolo: string;
    descrizione: string;
    quantita: string;
    unitaMisura: string;
    prezzoUnitario: string;
    sconto: string;
    importo: string;
  }>>([]);
  const [orderNewArticleId, setOrderNewArticleId] = useState("");
  const [orderEmailDialogOpen, setOrderEmailDialogOpen] = useState(false);
  const [orderEmailAddress, setOrderEmailAddress] = useState("");
  const [isSendingOrderEmail, setIsSendingOrderEmail] = useState(false);
  const [ddtDialogOpen, setDdtDialogOpen] = useState(false);
  const [selectedDdt, setSelectedDdt] = useState<Ddt | null>(null);
  const [ddtFilterStato, setDdtFilterStato] = useState<string>("tutti");
  const [ddtFilterCliente, setDdtFilterCliente] = useState<string>("");
  const [isConvertingDdt, setIsConvertingDdt] = useState(false);
  const [ddtImportDialogOpen, setDdtImportDialogOpen] = useState(false);
  const [ddtImportProgress, setDdtImportProgress] = useState(0);
  const [isImportingDdt, setIsImportingDdt] = useState(false);
  const [ddtReportPercorsoOpen, setDdtReportPercorsoOpen] = useState(false);
  const [ddtReportPercorsoLoading, setDdtReportPercorsoLoading] = useState(false);
  const [ddtReportPercorsoData, setDdtReportPercorsoData] = useState<any>(null);
  const [ddtFormData, setDdtFormData] = useState({
    numero: "",
    dataEmissione: new Date().toISOString().split('T')[0],
    dataTrasporto: "",
    oraTrasporto: "",
    clienteId: "",
    ragioneSociale: "",
    partitaIva: "",
    codiceFiscale: "",
    indirizzo: "",
    cap: "",
    citta: "",
    provincia: "",
    causaleTrasporto: "Vendita",
    tipoTrasporto: "Mittente",
    vettore: "",
    aspettoBeni: "Scatole",
    porto: "Franco",
    colli: "",
    pesoLordo: "",
    note: "",
    stato: "bozza",
  });
  const [ddtLines, setDdtLines] = useState<Array<{
    id?: string;
    codiceArticolo: string;
    descrizione: string;
    quantita: string;
    unitaMisura: string;
    note: string;
  }>>([]);
  const [docUploadDialogOpen, setDocUploadDialogOpen] = useState(false);
  const [docUploadFile, setDocUploadFile] = useState<File | null>(null);
  const [docUploadCategory, setDocUploadCategory] = useState("fatture");
  const [docUploadDescription, setDocUploadDescription] = useState("");
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleShare = async (tipo: "invoice" | "transaction", id: string, name: string) => {
    setShareResource({ tipo, id, name });
    setShareLink("");
    setShareDialogOpen(true);
  };

  const createShareLink = async () => {
    if (!shareResource) return;
    setIsCreatingShare(true);
    try {
      const res = await fetch("/api/finance/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo: shareResource.tipo,
          resourceId: shareResource.id,
          expiresIn: 30, // 30 days default
        }),
      });
      const data = await res.json();
      if (res.ok) {
        const baseUrl = window.location.origin;
        const link = `${baseUrl}/share/${data.token}`;
        setShareLink(link);
        toast({ title: "Link creato", description: "Il link di condivisione è stato generato" });
      } else {
        toast({ title: "Errore", description: data.error, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Errore", description: "Impossibile creare il link", variant: "destructive" });
    } finally {
      setIsCreatingShare(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: "Copiato!", description: "Link copiato negli appunti" });
    } catch (error) {
      toast({ title: "Errore", description: "Impossibile copiare il link", variant: "destructive" });
    }
  };

  const handleToggleShareLink = async (id: string, isActive: boolean) => {
    try {
      await fetch(`/api/finance/share/${id}/toggle`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
      refetchShareLinks();
      toast({ title: isActive ? "Link attivato" : "Link disattivato" });
    } catch (error) {
      toast({ title: "Errore", description: "Impossibile aggiornare il link", variant: "destructive" });
    }
  };

  const handleDeleteShareLink = async (id: string) => {
    try {
      await fetch(`/api/finance/share/${id}`, { method: "DELETE" });
      refetchShareLinks();
      toast({ title: "Link eliminato" });
    } catch (error) {
      toast({ title: "Errore", description: "Impossibile eliminare il link", variant: "destructive" });
    }
  };

  const handleDocUpload = async () => {
    if (!docUploadFile) {
      toast({ title: "Errore", description: "Seleziona un file da caricare", variant: "destructive" });
      return;
    }

    setIsUploadingDoc(true);
    try {
      const formData = new FormData();
      formData.append("file", docUploadFile);
      formData.append("title", docUploadDescription || docUploadFile.name);
      formData.append("category", docUploadCategory);
      formData.append("tags", JSON.stringify([docUploadCategory]));

      const res = await fetch("/api/archive", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        toast({ title: "Documento caricato", description: `${docUploadFile.name} è stato archiviato con successo` });
        setDocUploadDialogOpen(false);
        setDocUploadFile(null);
        setDocUploadDescription("");
        setDocUploadCategory("fatture");
        queryClient.invalidateQueries({ queryKey: ["/api/archive"] });
      } else {
        const error = await res.json();
        toast({ title: "Errore", description: error.message || "Impossibile caricare il documento", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Errore", description: "Errore durante il caricamento", variant: "destructive" });
    } finally {
      setIsUploadingDoc(false);
    }
  };

  const handleAutoReconcile = async () => {
    if (accounts.length === 0) {
      toast({ title: "Nessun conto", description: "Non ci sono conti bancari da riconciliare", variant: "destructive" });
      return;
    }

    // Show confirmation dialog first
    setReconcileConfirmOpen(true);
  };

  const startReconciliation = async (resetPrevious: boolean) => {
    setReconcileConfirmOpen(false);
    setReconcileDialogOpen(true);
    setReconcileProgress(0);
    setReconcileCurrentBank(resetPrevious ? "Reset riconciliazioni..." : "Analisi tutti i conti...");
    setReconcileResults([]);
    setReconcileComplete(false);
    setIsReconciling(true);

    try {
      setReconcileProgress(30);
      setReconcileCurrentBank("Riconciliazione su tutti i conti...");

      const res = await fetch("/api/finance/auto-reconcile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resetPrevious
        }),
      });

      setReconcileProgress(80);
      const data = await res.json();

      if (res.ok) {
        setReconcileResults([{ bank: "Tutti i conti", matched: data.reconciled || 0 }]);
      } else {
        setReconcileResults([{ bank: "Tutti i conti", matched: 0 }]);
      }
    } catch (error) {
      setReconcileResults([{ bank: "Tutti i conti", matched: 0 }]);
    }

    setReconcileProgress(100);
    setReconcileCurrentBank("");
    setReconcileComplete(true);
    setIsReconciling(false);

    queryClient.invalidateQueries({ queryKey: ["/api/finance/invoices"] });
    queryClient.invalidateQueries({ queryKey: ["/api/finance/transactions"] });
  };

  const handleExportPDF = async (tipo: "emesse" | "ricevute") => {
    try {
      const fattureToExport = tipo === "emesse" ? fattureEmesse : fattureRicevute;
      const content = fattureToExport.map(f =>
        `${f.numero}\t${f.ragioneSociale}\t${formatDate(f.dataEmissione)}\t${formatCurrency(f.totale)}\t${f.stato}`
      ).join('\n');

      const header = `REPORT FATTURE ${tipo.toUpperCase()}\nGenerato il: ${formatDate(new Date().toISOString())}\n\nNumero\tCliente/Fornitore\tData\tTotale\tStato\n${'='.repeat(80)}\n`;
      const blob = new Blob([header + content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fatture_${tipo}_${format(new Date(), 'yyyy-MM-dd')}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Export completato", description: `Report fatture ${tipo} scaricato` });
    } catch (error) {
      toast({ title: "Errore", description: "Impossibile generare il report", variant: "destructive" });
    }
  };

  const handleRegisterPayment = async () => {
    if (!paymentInvoice || !paymentAmount) return;

    try {
      const importoPagamento = parseItalianNumber(paymentAmount);
      const totale = parseItalianNumber(paymentInvoice.totale);
      const giaPagato = parseItalianNumber(paymentInvoice.totalePagato);
      const nuovoTotalePagato = giaPagato + importoPagamento;

      const nuovoStato = nuovoTotalePagato >= totale ? 'pagata' : 'parziale';

      const res = await fetch(`/api/finance/invoices/${paymentInvoice.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          totalePagato: String(nuovoTotalePagato.toFixed(2)),
          stato: nuovoStato,
          dataPagamento: nuovoStato === 'pagata' ? paymentDate : (paymentInvoice.dataPagamento || null),
          noteInterne: paymentInvoice.noteInterne
            ? `${paymentInvoice.noteInterne}\n[${paymentDate}] Pagamento ${formatCurrency(importoPagamento)}${paymentNote ? ` - ${paymentNote}` : ''}`
            : `[${paymentDate}] Pagamento ${formatCurrency(importoPagamento)}${paymentNote ? ` - ${paymentNote}` : ''}`
        }),
      });

      if (res.ok) {
        toast({
          title: "Pagamento registrato",
          description: nuovoStato === 'pagata'
            ? "Fattura completamente saldata"
            : `Pagamento di ${formatCurrency(importoPagamento)} registrato. Residuo: ${formatCurrency(totale - nuovoTotalePagato)}`
        });
        queryClient.invalidateQueries({ queryKey: ["/api/finance/invoices"] });
        setPaymentDialogOpen(false);
        setPaymentAmount("");
        setPaymentNote("");
      } else {
        const data = await res.json();
        toast({ title: "Errore", description: data.error, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Errore", description: "Impossibile registrare il pagamento", variant: "destructive" });
    }
  };

  const openPaymentDialog = (invoice: Invoice) => {
    setPaymentInvoice(invoice);
    const totale = parseItalianNumber(invoice.totale);
    const pagato = parseItalianNumber(invoice.totalePagato);
    setPaymentAmount((totale - pagato).toFixed(2));
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setPaymentNote("");
    setPaymentDialogOpen(true);
  };

  if (!hasAccess) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <Lock className="h-5 w-5" />
                Accesso Negato
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Non hai i permessi per accedere al modulo Finanza.
                Questo modulo è riservato agli utenti autorizzati.
              </p>
              <Button onClick={() => navigate("/")}>
                Torna alla Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  const { data: stats, isLoading: statsLoading } = useQuery<FinanceStats>({
    queryKey: ["/api/finance/stats"],
  });

  const { data: accounts = [], isLoading: accountsLoading } = useQuery<FinanceAccount[]>({
    queryKey: ["/api/finance/accounts"],
  });

  const { data: invoices = [], isLoading: invoicesLoading } = useQuery<Invoice[]>({
    queryKey: ["/api/finance/invoices"],
  });

  const { data: transactions = [], isLoading: transactionsLoading } = useQuery<FinanceTransaction[]>({
    queryKey: ["/api/finance/transactions"],
  });

  const { data: categories = [] } = useQuery<FinanceCategory[]>({
    queryKey: ["/api/finance/categories"],
  });

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: quotes = [], isLoading: quotesLoading } = useQuery<Quote[]>({
    queryKey: ["/api/finance/quotes"],
  });

  // Sales Orders query
  const { data: salesOrders = [], isLoading: salesOrdersLoading } = useQuery<any[]>({
    queryKey: ["/api/sales-orders"],
    queryFn: async () => {
      const res = await fetch("/api/sales-orders");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: ddtList = [], isLoading: ddtLoading } = useQuery<Ddt[]>({
    queryKey: ["/api/finance/ddt"],
  });

  const { data: anagraficaClienti = [], refetch: refetchClienti } = useQuery<Array<{
    id: string;
    ragioneSociale: string;
    partitaIva?: string;
    codiceFiscale?: string;
    indirizzo?: string;
    cap?: string;
    citta?: string;
    provincia?: string;
    telefono?: string;
    email?: string;
  }>>({
    queryKey: ["anagrafica-clienti"],
    queryFn: async () => {
      const res = await fetch("/api/anagrafica/clienti", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch clients");
      return res.json();
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  const { data: trashedTransactions = [], refetch: refetchTrash } = useQuery<FinanceTransaction[]>({
    queryKey: ["/api/finance/transactions/trash"],
    enabled: showTrash,
  });

  const { data: shareLinks = [], refetch: refetchShareLinks } = useQuery<{
    id: string;
    token: string;
    tipo: string;
    resourceId: string;
    viewCount: number;
    isActive: boolean;
    expiresAt: string | null;
    lastViewedAt: string | null;
    lastViewedIp: string | null;
    createdAt: string;
  }[]>({
    queryKey: ["/api/finance/share-links"],
  });

  const { data: archiveDocuments = [] } = useQuery<{
    id: string;
    name: string;
    category: string;
    size: number;
    mimeType: string;
    createdAt: string;
    description?: string;
  }[]>({
    queryKey: ["/api/archive"],
  });

  const { data: warehouseProducts = [] } = useQuery<Array<{
    id: string;
    codice: string;
    nome: string;
    unitaMisura?: string;
  }>>({
    queryKey: ["/api/warehouse/products"],
  });

  const { data: catalogArticles = [] } = useQuery<Array<{
    id: string;
    codice: string;
    nome: string;
    unitaMisura?: string;
    prezzoListino?: string;
    giacenza?: number;
  }>>({
    queryKey: ["/api/catalogo/articoli"],
  });

  const { data: catalogOccupati = {} } = useQuery<Record<string, number>>({
    queryKey: ["/api/catalogo/occupati"],
  });

  // Filter documents for finance categories
  const financeDocuments = useMemo(() => {
    const financeCategories = ["Fatture", "Ri.Ba.", "Documento", "Contratti", "Certificazioni"];
    return archiveDocuments.filter(doc => financeCategories.includes(doc.category));
  }, [archiveDocuments]);

  // Count documents by category
  const docCounts = useMemo(() => ({
    fatture: archiveDocuments.filter(d => d.category === "Fatture").length,
    riba: archiveDocuments.filter(d => d.category === "Ri.Ba.").length,
    documenti: archiveDocuments.filter(d => d.category === "Documento").length,
    contratti: archiveDocuments.filter(d => d.category === "Contratti").length,
  }), [archiveDocuments]);

  // Abbina fatture emesse ai movimenti bancari per verificare pagamenti
  const matchedPaymentTransactions = useMemo(() => {
    const matchedIds = new Set<string>();
    const fattureEmesse = invoices.filter(inv => inv.tipo === "emessa" && inv.stato !== "pagata");

    fattureEmesse.forEach(fattura => {
      const importoFattura = typeof fattura.totale === 'string'
        ? parseFloat(fattura.totale.replace(/\./g, '').replace(',', '.'))
        : fattura.totale;

      // Cerca movimenti di entrata con importo simile
      transactions.forEach(trans => {
        if (trans.tipo !== "entrata") return;

        const importoTrans = typeof trans.importo === 'string'
          ? parseFloat(trans.importo.replace(/\./g, '').replace(',', '.'))
          : parseFloat(trans.importo);

        // Tolleranza di 0.01 per differenze di arrotondamento
        const match = Math.abs(importoTrans - importoFattura) < 0.02;

        // Verifica anche se la descrizione contiene il numero fattura o ragione sociale
        const descLower = (trans.descrizione || "").toLowerCase();
        const hasInvoiceRef = fattura.numero && descLower.includes(fattura.numero.toLowerCase());
        const hasClientRef = fattura.ragioneSociale && descLower.includes(fattura.ragioneSociale.toLowerCase().substring(0, 10));

        if (match || hasInvoiceRef || hasClientRef) {
          matchedIds.add(trans.id);
        }
      });
    });

    return matchedIds;
  }, [invoices, transactions]);

  // Mappa fattura -> movimento corrispondente (STRICT: importo DEVE corrispondere)
  const invoiceToTransaction = useMemo(() => {
    const map = new Map<string, FinanceTransaction>();

    invoices.forEach(fattura => {
      // Solo per fatture pagate o parziali mostriamo l'icona banca
      if (fattura.stato !== 'pagata' && fattura.stato !== 'parziale') return;

      const importoFattura = typeof fattura.totale === 'string'
        ? parseFloat(fattura.totale.replace(/\./g, '').replace(',', '.'))
        : fattura.totale;

      // Skip invalid amounts
      if (isNaN(importoFattura) || importoFattura <= 0) return;

      // Tolerance: max 1% or €0.02 for rounding differences
      const tolerance = Math.max(0.02, importoFattura * 0.01);

      // Prima cerca transazioni riconciliate con importo ESATTO
      let matchedTrans = transactions.find(trans => {
        if (trans.tipo !== "entrata" && fattura.tipo === "emessa") return false;
        if (trans.tipo !== "uscita" && fattura.tipo === "ricevuta") return false;

        const importoTrans = typeof trans.importo === 'string'
          ? parseFloat(trans.importo.replace(/\./g, '').replace(',', '.'))
          : parseFloat(trans.importo);

        // STRICT: Amount MUST match within tolerance
        const matchAmount = Math.abs(importoTrans - importoFattura) <= tolerance;
        if (!matchAmount) return false;

        const descLower = (trans.descrizione || "").toLowerCase();
        const invoiceNumClean = fattura.numero ? fattura.numero.replace(/[^0-9]/g, '') : '';
        const hasInvoiceRef = invoiceNumClean.length >= 3 && descLower.includes(invoiceNumClean);
        const hasClientRef = fattura.ragioneSociale && fattura.ragioneSociale.length >= 5 &&
          descLower.includes(fattura.ragioneSociale.toLowerCase().substring(0, 10));

        // Preferisci transazioni riconciliate con importo esatto + riferimento
        return trans.riconciliato && matchAmount && (hasInvoiceRef || hasClientRef);
      });

      // Se non trovata riconciliata, cerca non riconciliata con importo ESATTO
      if (!matchedTrans) {
        matchedTrans = transactions.find(trans => {
          if (trans.tipo !== "entrata" && fattura.tipo === "emessa") return false;
          if (trans.tipo !== "uscita" && fattura.tipo === "ricevuta") return false;

          const importoTrans = typeof trans.importo === 'string'
            ? parseFloat(trans.importo.replace(/\./g, '').replace(',', '.'))
            : parseFloat(trans.importo);

          // STRICT: Amount MUST match within tolerance
          const matchAmount = Math.abs(importoTrans - importoFattura) <= tolerance;
          if (!matchAmount) return false;

          const descLower = (trans.descrizione || "").toLowerCase();
          const invoiceNumClean = fattura.numero ? fattura.numero.replace(/[^0-9]/g, '') : '';
          const hasInvoiceRef = invoiceNumClean.length >= 3 && descLower.includes(invoiceNumClean);
          const hasClientRef = fattura.ragioneSociale && fattura.ragioneSociale.length >= 5 &&
            descLower.includes(fattura.ragioneSociale.toLowerCase().substring(0, 10));

          // STRICT: Amount must match AND have reference
          return matchAmount && (hasInvoiceRef || hasClientRef);
        });
      }

      if (matchedTrans) {
        map.set(fattura.id, matchedTrans);
      }
    });

    return map;
  }, [invoices, transactions]);

  const transactionToInvoice = useMemo(() => {
    const map = new Map<string, Invoice>();
    invoiceToTransaction.forEach((trans, invoiceId) => {
      const invoice = invoices.find(inv => inv.id === invoiceId);
      if (invoice) {
        map.set(trans.id, invoice);
      }
    });
    return map;
  }, [invoices, invoiceToTransaction]);

  const createAccountMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/finance/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Errore nella creazione");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/finance/accounts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/finance/stats"] });
      toast({ title: "Conto creato con successo" });
    },
    onError: () => toast({ title: "Errore nella creazione del conto", variant: "destructive" }),
  });

  const updateAccountMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await fetch(`/api/finance/accounts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Errore nell'aggiornamento");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/finance/accounts"] });
      toast({ title: "Conto aggiornato" });
    },
    onError: () => toast({ title: "Errore nell'aggiornamento", variant: "destructive" }),
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/finance/accounts/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Errore nell'eliminazione");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/finance/accounts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/finance/stats"] });
      toast({ title: "Conto eliminato" });
    },
    onError: () => toast({ title: "Errore nell'eliminazione", variant: "destructive" }),
  });

  const createInvoiceMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/finance/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Errore nella creazione");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/finance/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/finance/stats"] });
      toast({ title: "Fattura creata con successo" });
    },
    onError: () => toast({ title: "Errore nella creazione della fattura", variant: "destructive" }),
  });

  const updateInvoiceMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await fetch(`/api/finance/invoices/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Errore nell'aggiornamento");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/finance/invoices"] });
      toast({ title: "Fattura aggiornata" });
    },
    onError: () => toast({ title: "Errore nell'aggiornamento", variant: "destructive" }),
  });

  const deleteInvoiceMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/finance/invoices/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Errore nell'eliminazione");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/finance/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/finance/stats"] });
      toast({ title: "Fattura eliminata" });
    },
    onError: () => toast({ title: "Errore nell'eliminazione", variant: "destructive" }),
  });

  const deleteQuoteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/finance/quotes/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Errore nell'eliminazione");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/finance/quotes"] });
      toast({ title: "Preventivo eliminato" });
    },
    onError: () => toast({ title: "Errore nell'eliminazione", variant: "destructive" }),
  });

  const convertQuoteToOrderMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/finance/quotes/${id}/convert-to-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("Errore nella conversione");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/finance/quotes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sales-orders"] });
      toast({ title: `Ordine ${data.order.numero} creato con successo` });
    },
    onError: () => {
      toast({ title: "Errore nella conversione in ordine", variant: "destructive" });
    },
  });

  const openQuoteDialog = (quote: Quote | null = null) => {
    setSelectedQuote(quote);
    if (quote) {
      setQuoteFormData({
        numero: quote.numero || "",
        dataEmissione: quote.dataEmissione || new Date().toISOString().split('T')[0],
        dataValidita: quote.dataValidita || "",
        stato: quote.stato || "bozza",
        projectId: quote.projectId || "none",
        clienteId: quote.clienteId || "",
        ragioneSociale: quote.ragioneSociale || "",
        partitaIva: quote.partitaIva || "",
        email: quote.email || "",
        telefono: quote.telefono || "",
        indirizzo: quote.indirizzo || "",
        oggetto: quote.oggetto || "",
        descrizione: quote.descrizione || "",
        imponibile: quote.imponibile || "0",
        iva: quote.iva || "22",
        totale: quote.totale || "0",
        terminiPagamento: quote.terminiPagamento || "",
        note: quote.note || "",
      });
      // Carica gli articoli del preventivo
      fetch(`/api/finance/quotes/${quote.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.lines && Array.isArray(data.lines)) {
            setQuoteLines(data.lines);
          } else {
            setQuoteLines([]);
          }
        })
        .catch(() => setQuoteLines([]));
    } else {
      setQuoteFormData({
        numero: `PRV-${Date.now().toString().slice(-6)}`,
        dataEmissione: new Date().toISOString().split('T')[0],
        dataValidita: "",
        stato: "bozza",
        projectId: "none",
        clienteId: "",
        ragioneSociale: "",
        partitaIva: "",
        email: "",
        telefono: "",
        indirizzo: "",
        oggetto: "",
        descrizione: "",
        imponibile: "0",
        iva: "22",
        totale: "0",
        terminiPagamento: "",
        note: "",
      });
      setQuoteLines([]);
    }
    setQuoteDialogOpen(true);
  };

  const addQuoteArticle = (article: { id: string; codice: string; nome: string; prezzoListino?: string; unitaMisura?: string }) => {
    const newLine = {
      codiceArticolo: article.codice,
      descrizione: article.nome,
      quantita: "1",
      unitaMisura: article.unitaMisura || "pz",
      prezzoUnitario: article.prezzoListino || "0",
      sconto: "0",
      aliquotaIva: "22",
      importo: article.prezzoListino || "0",
    };
    setQuoteLines([...quoteLines, newLine]);
    recalcQuoteTotals([...quoteLines, newLine]);
  };

  const updateQuoteLine = (index: number, field: string, value: string) => {
    const updated = [...quoteLines];
    (updated[index] as any)[field] = value;
    if (field === "quantita" || field === "prezzoUnitario" || field === "sconto") {
      const qty = parseFloat(updated[index].quantita) || 0;
      const price = parseFloat(updated[index].prezzoUnitario) || 0;
      const disc = parseFloat(updated[index].sconto) || 0;
      updated[index].importo = (qty * price * (1 - disc / 100)).toFixed(2);
    }
    setQuoteLines(updated);
    recalcQuoteTotals(updated);
  };

  const removeQuoteLine = (index: number) => {
    const updated = quoteLines.filter((_, i) => i !== index);
    setQuoteLines(updated);
    recalcQuoteTotals(updated);
  };

  const recalcQuoteTotals = (lines: typeof quoteLines) => {
    const imponibile = lines.reduce((sum, l) => sum + (parseFloat(l.importo) || 0), 0);
    const ivaPerc = parseFloat(quoteFormData.iva) || 22;
    const totale = imponibile + (imponibile * ivaPerc / 100);
    setQuoteFormData(prev => ({
      ...prev,
      imponibile: imponibile.toFixed(2),
      totale: totale.toFixed(2),
    }));
  };

  const addOrderArticle = (article: { id: string; codice: string; nome: string; prezzoListino?: string; unitaMisura?: string }) => {
    const newLine = {
      codiceArticolo: article.codice,
      descrizione: article.nome,
      quantita: "1",
      unitaMisura: article.unitaMisura || "pz",
      prezzoUnitario: article.prezzoListino || "0",
      sconto: "0",
      importo: article.prezzoListino || "0",
    };
    setOrderLines([...orderLines, newLine]);
  };

  const updateOrderLine = (index: number, field: string, value: string) => {
    const updated = [...orderLines];
    (updated[index] as any)[field] = value;
    if (field === "quantita" || field === "prezzoUnitario" || field === "sconto") {
      const qty = parseFloat(updated[index].quantita) || 0;
      const price = parseFloat(updated[index].prezzoUnitario) || 0;
      const disc = parseFloat(updated[index].sconto) || 0;
      updated[index].importo = (qty * price * (1 - disc / 100)).toFixed(2);
    }
    setOrderLines(updated);
  };

  const removeOrderLine = (index: number) => {
    const updated = orderLines.filter((_, i) => i !== index);
    setOrderLines(updated);
  };

  const handleOrderClienteSelect = (clienteId: string) => {
    if (clienteId === "_manual") {
      setOrderFormData({ ...orderFormData, clienteId: "", ragioneSociale: "", partitaIva: "", email: "", telefono: "", indirizzo: "" });
    } else {
      const cliente = anagraficaClienti.find(c => c.id === clienteId);
      if (cliente) {
        setOrderFormData({
          ...orderFormData,
          clienteId: cliente.id,
          ragioneSociale: cliente.ragioneSociale || "",
          partitaIva: cliente.partitaIva || "",
          email: cliente.email || "",
          telefono: cliente.telefono || "",
          indirizzo: cliente.indirizzo || "",
        });
      }
    }
  };

  const handleSaveOrder = async () => {
    try {
      // Check for missing articles
      const missingArticles = orderLines.filter(line => !line.codiceArticolo || line.codiceArticolo.trim() === "");
      let workflowStatus = orderFormData.stato;

      // Se ci sono articoli senza codice, entrano in produzione
      if (missingArticles.length > 0) {
        workflowStatus = "in_produzione";
        toast({
          title: "Avviso",
          description: `${missingArticles.length} articolo/i entrerà/entreranno in produzione (da realizzare).`,
          variant: "default"
        });
      }

      const payload = {
        ...orderFormData,
        stato: workflowStatus,
        lines: orderLines,
      };
      const res = await fetch(`/api/sales-orders/${selectedOrder.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        toast({ title: "Ordine aggiornato" });
        queryClient.invalidateQueries({ queryKey: ["/api/sales-orders"] });
        setOrderDialogOpen(false);
      } else {
        throw new Error("Errore nell'aggiornamento");
      }
    } catch (error) {
      toast({ title: "Errore nel salvataggio dell'ordine", variant: "destructive" });
    }
  };

  const handleSendOrderEmail = async () => {
    if (!orderEmailAddress) {
      toast({ title: "Inserisci un indirizzo email", variant: "destructive" });
      return;
    }
    try {
      setIsSendingOrderEmail(true);
      const res = await fetch(`/api/sales-orders/${selectedOrder.id}/send-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: orderEmailAddress }),
      });
      if (res.ok) {
        toast({ title: "Ordine inviato", description: `Email inviata a ${orderEmailAddress}` });
        setOrderEmailDialogOpen(false);
        setOrderEmailAddress("");
      } else {
        throw new Error("Errore nell'invio");
      }
    } catch (error) {
      toast({ title: "Errore nell'invio dell'email", variant: "destructive" });
    } finally {
      setIsSendingOrderEmail(false);
    }
  };

  const handleQuoteClienteSelect = (clienteId: string) => {
    if (clienteId === "_manual") {
      setQuoteFormData({ ...quoteFormData, clienteId: "", ragioneSociale: "", partitaIva: "", email: "", telefono: "", indirizzo: "" });
    } else {
      const cliente = anagraficaClienti.find(c => c.id === clienteId);
      if (cliente) {
        setQuoteFormData({
          ...quoteFormData,
          clienteId: cliente.id,
          ragioneSociale: cliente.ragioneSociale || "",
          partitaIva: cliente.partitaIva || "",
          email: cliente.email || "",
          telefono: cliente.telefono || "",
          indirizzo: cliente.indirizzo || "",
        });
      }
    }
  };

  const calcQuoteTotale = () => {
    const imp = parseFloat(quoteFormData.imponibile) || 0;
    const ivaPerc = parseFloat(quoteFormData.iva) || 0;
    const tot = imp + (imp * ivaPerc / 100);
    setQuoteFormData({ ...quoteFormData, totale: tot.toFixed(2) });
  };

  const handleSaveQuote = async (quoteData: Partial<Quote>) => {
    try {
      if (selectedQuote) {
        const res = await fetch(`/api/finance/quotes/${selectedQuote.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(quoteData),
        });
        if (res.ok) {
          toast({ title: "Preventivo aggiornato" });
          queryClient.invalidateQueries({ queryKey: ["/api/finance/quotes"] });
          setQuoteDialogOpen(false);
        } else {
          throw new Error("Errore nell'aggiornamento");
        }
      } else {
        const res = await fetch("/api/finance/quotes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(quoteData),
        });
        if (res.ok) {
          toast({ title: "Preventivo creato" });
          queryClient.invalidateQueries({ queryKey: ["/api/finance/quotes"] });
          setQuoteDialogOpen(false);
        } else {
          throw new Error("Errore nella creazione");
        }
      }
    } catch (error) {
      toast({ title: "Errore nel salvataggio del preventivo", variant: "destructive" });
    }
  };

  const deleteDdtMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/finance/ddt/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Errore nell'eliminazione");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/finance/ddt"] });
      toast({ title: "DDT eliminato" });
    },
    onError: () => toast({ title: "Errore nell'eliminazione", variant: "destructive" }),
  });

  const convertDdtMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/finance/ddt/${id}/convert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("Errore nella conversione");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/finance/ddt"] });
      queryClient.invalidateQueries({ queryKey: ["/api/finance/invoices"] });
      toast({ title: "DDT convertito in fattura" });
      setIsConvertingDdt(false);
    },
    onError: () => {
      toast({ title: "Errore nella conversione", variant: "destructive" });
      setIsConvertingDdt(false);
    },
  });

  const handleDdtClienteSelect = (clienteId: string) => {
    if (clienteId === "_manual") {
      setDdtFormData(prev => ({
        ...prev,
        clienteId: "",
        ragioneSociale: "",
        partitaIva: "",
        codiceFiscale: "",
        indirizzo: "",
        cap: "",
        citta: "",
        provincia: "",
      }));
    } else {
      const cliente = anagraficaClienti.find(c => c.id === clienteId);
      if (cliente) {
        setDdtFormData(prev => ({
          ...prev,
          clienteId: cliente.id,
          ragioneSociale: cliente.ragioneSociale,
          partitaIva: cliente.partitaIva || "",
          codiceFiscale: cliente.codiceFiscale || "",
          indirizzo: cliente.indirizzo || "",
          cap: cliente.cap || "",
          citta: cliente.citta || "",
          provincia: cliente.provincia || "",
        }));
      }
    }
  };

  const resetDdtForm = async (ddt?: Ddt | null) => {
    if (ddt) {
      setDdtFormData({
        numero: ddt.numero || "",
        dataEmissione: ddt.dataEmissione || new Date().toISOString().split('T')[0],
        dataTrasporto: ddt.dataTrasporto || "",
        oraTrasporto: ddt.oraTrasporto || "",
        clienteId: ddt.clienteId || "",
        ragioneSociale: ddt.ragioneSociale || "",
        partitaIva: ddt.partitaIva || "",
        codiceFiscale: ddt.codiceFiscale || "",
        indirizzo: ddt.indirizzo || "",
        cap: ddt.cap || "",
        citta: ddt.citta || "",
        provincia: ddt.provincia || "",
        causaleTrasporto: ddt.causaleTrasporto || "Vendita",
        tipoTrasporto: ddt.tipoTrasporto || "Mittente",
        vettore: ddt.vettore || "",
        aspettoBeni: ddt.aspettoBeni || "Scatole",
        porto: ddt.porto || "Franco",
        colli: ddt.colli || "",
        pesoLordo: ddt.pesoLordo || "",
        note: ddt.note || "",
        stato: ddt.stato || "bozza",
      });
      try {
        const res = await fetch(`/api/finance/ddt/${ddt.id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.lines && Array.isArray(data.lines)) {
            setDdtLines(data.lines.map((l: any) => ({
              id: l.id,
              codiceArticolo: l.codiceArticolo || "",
              descrizione: l.descrizione || "",
              quantita: l.quantita || "1",
              unitaMisura: l.unitaMisura || "pz",
              note: l.note || "",
            })));
          } else {
            setDdtLines([]);
          }
        } else {
          console.error("Failed to load DDT lines");
          setDdtLines([]);
        }
      } catch (error) {
        console.error("Error loading DDT lines:", error);
        setDdtLines([]);
      }
    } else {
      // Fetch next available DDT number from server (finds gaps in sequence)
      let nextNumero = `DDT/${new Date().getFullYear()}/${String(ddtList.length + 1).padStart(5, '0')}`;
      try {
        const res = await fetch("/api/finance/ddt/next-number");
        if (res.ok) {
          const data = await res.json();
          nextNumero = data.numero;
        }
      } catch (error) {
        console.error("Error fetching next DDT number:", error);
      }

      setDdtFormData({
        numero: nextNumero,
        dataEmissione: new Date().toISOString().split('T')[0],
        dataTrasporto: "",
        oraTrasporto: "",
        clienteId: "",
        ragioneSociale: "",
        partitaIva: "",
        codiceFiscale: "",
        indirizzo: "",
        cap: "",
        citta: "",
        provincia: "",
        causaleTrasporto: "Vendita",
        tipoTrasporto: "Mittente",
        vettore: "",
        aspettoBeni: "Scatole",
        porto: "Franco",
        colli: "",
        pesoLordo: "",
        note: "",
        stato: "bozza",
      });
      setDdtLines([]);
    }
  };

  const openNewDdtDialog = async () => {
    refetchClienti();
    setSelectedDdt(null);
    await resetDdtForm(null);
    setDdtDialogOpen(true);
  };

  const openEditDdtDialog = async (ddt: Ddt) => {
    setSelectedDdt(ddt);
    await resetDdtForm(ddt);
    setDdtDialogOpen(true);
  };

  const loadDdtReportPercorso = async () => {
    setDdtReportPercorsoLoading(true);
    setDdtReportPercorsoOpen(true);
    try {
      const res = await fetch("/api/spedizioni/report-percorso");
      if (!res.ok) {
        throw new Error("Errore nella risposta del server");
      }
      const data = await res.json();
      setDdtReportPercorsoData(data);
    } catch (error) {
      toast({ title: "Errore", description: "Impossibile caricare il report del percorso", variant: "destructive" });
      setDdtReportPercorsoData({ stops: [], totalDistance: 0, totalDuration: 0, generatedAt: new Date().toISOString() });
    } finally {
      setDdtReportPercorsoLoading(false);
    }
  };

  const formatDurationDdt = (minutes: number) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hrs > 0) return `${hrs}h ${mins}min`;
    return `${mins}min`;
  };

  const generateDdtReportPdf = () => {
    if (!ddtReportPercorsoData?.stops?.length) return;

    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("Report Percorso Consegne DDT", 14, 20);

    doc.setFontSize(10);
    doc.text(`Generato il: ${new Date(ddtReportPercorsoData.generatedAt).toLocaleString("it-IT")}`, 14, 28);
    doc.text(`Totale: ${ddtReportPercorsoData.totalDistance} km - ${formatDurationDdt(ddtReportPercorsoData.totalDuration)}`, 14, 34);

    let y = 45;
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("#", 14, y);
    doc.text("Cliente", 22, y);
    doc.text("Indirizzo", 62, y);
    doc.text("Km", 140, y);
    doc.text("Tempo", 155, y);
    doc.text("Arrivo", 175, y);

    doc.setFont("helvetica", "normal");
    y += 8;

    for (const stop of ddtReportPercorsoData.stops) {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }

      doc.text(stop.ordine.toString(), 14, y);
      doc.text((stop.cliente || "N/D").substring(0, 25), 22, y);
      doc.text((stop.indirizzo || "").substring(0, 45), 62, y);
      doc.text(stop.distanzaCumulativa?.toString() || "-", 140, y);
      doc.text(formatDurationDdt(stop.durataCumulativa || 0), 155, y);
      doc.text(stop.arrivoStimato ? new Date(stop.arrivoStimato).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }) : "-", 175, y);
      y += 7;
    }

    doc.save(`report-percorso-ddt-${new Date().toISOString().split("T")[0]}.pdf`);
    toast({ title: "PDF generato", description: "Il report è stato scaricato" });
  };

  const handleSaveDdt = async (ddtData: Partial<Ddt>) => {
    try {
      // Sanitize data: remove empty strings for foreign keys and optional dates
      const payload = { ...ddtData };
      if (!payload.clienteId) delete payload.clienteId;
      if (!payload.projectId) delete payload.projectId;
      if (!payload.salesOrderId) delete payload.salesOrderId;
      if (!payload.invoiceId) delete payload.invoiceId;
      if (!payload.quoteId) delete payload.quoteId;
      if (!payload.dataTrasporto) payload.dataTrasporto = null;
      if (!payload.oraTrasporto) payload.oraTrasporto = null;

      let ddtId: string;
      if (selectedDdt) {
        const res = await fetch(`/api/finance/ddt/${selectedDdt.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Errore nell'aggiornamento");
        ddtId = selectedDdt.id;

        const existingRes = await fetch(`/api/finance/ddt/${ddtId}`);
        const existingData = await existingRes.json();
        const existingLineIds = (existingData.lines || []).map((l: any) => l.id);

        for (const lineId of existingLineIds) {
          if (!ddtLines.find(l => l.id === lineId)) {
            await fetch(`/api/finance/ddt/${ddtId}/lines/${lineId}`, { method: "DELETE" });
          }
        }

        for (const line of ddtLines) {
          if (line.id) {
            await fetch(`/api/finance/ddt/${ddtId}/lines/${line.id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(line),
            });
          } else {
            await fetch(`/api/finance/ddt/${ddtId}/lines`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(line),
            });
          }
        }

        toast({ title: "DDT aggiornato" });
      } else {
        const res = await fetch("/api/finance/ddt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Errore nella creazione");
        const newDdt = await res.json();
        ddtId = newDdt.id;

        for (const line of ddtLines) {
          await fetch(`/api/finance/ddt/${ddtId}/lines`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(line),
          });
        }

        toast({ title: "DDT creato" });
      }

      queryClient.invalidateQueries({ queryKey: ["/api/finance/ddt"] });
      setDdtDialogOpen(false);
    } catch (error) {
      toast({ title: "Errore nel salvataggio del DDT", variant: "destructive" });
    }
  };

  const generateOrderPdf = async (order: any) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    let y = 20;

    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("ORDINE CLIENTE", pageWidth / 2, y, { align: "center" });
    y += 10;

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`N. ${order.numero}`, pageWidth / 2, y, { align: "center" });
    y += 15;

    doc.setDrawColor(200);
    doc.line(margin, y, pageWidth - margin, y);
    y += 10;

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("CLIENTE:", margin, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.text(order.ragione_sociale || "", margin, y);
    y += 5;
    doc.text(`P.IVA: ${order.partita_iva || ""}`, margin, y);
    y += 5;
    doc.text(order.indirizzo || "", margin, y);
    y += 8;

    doc.setFont("helvetica", "bold");
    doc.text("Data Ordine:", margin, y);
    doc.setFont("helvetica", "normal");
    doc.text(formatDate(order.data_ordine), margin + 40, y);
    y += 8;

    doc.setFont("helvetica", "bold");
    doc.text("ARTICOLI:", margin, y);
    y += 8;

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("Codice", margin, y);
    doc.text("Descrizione", margin + 30, y);
    doc.text("Qtà", margin + 110, y);
    doc.text("UM", margin + 130, y);
    doc.text("Prezzo", margin + 150, y);
    doc.text("Importo", pageWidth - margin - 20, y, { align: "right" });
    y += 8;

    doc.setDrawColor(200);
    doc.line(margin, y - 2, pageWidth - margin, y - 2);
    y += 2;

    doc.setFont("helvetica", "normal");
    const lines = order.lines || orderLines;
    for (const line of lines) {
      if (y > 250) {
        doc.addPage();
        y = 20;
      }
      doc.text((line.codiceArticolo || "").substring(0, 10), margin, y);
      doc.text((line.descrizione || "").substring(0, 35), margin + 30, y);
      doc.text((line.quantita || "").toString(), margin + 110, y);
      doc.text(line.unitaMisura || "", margin + 130, y);
      doc.text(`€${parseFloat(line.prezzoUnitario || "0").toFixed(2)}`, margin + 150, y);
      doc.text(`€${parseFloat(line.importo || "0").toFixed(2)}`, pageWidth - margin - 20, y, { align: "right" });
      y += 7;
    }

    y += 5;
    doc.setDrawColor(200);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    doc.setFont("helvetica", "bold");
    doc.text("Totale:", pageWidth - margin - 50, y);
    const totale = lines.reduce((sum: number, l: any) => sum + (parseFloat(l.importo || "0") || 0), 0);
    doc.text(`€${totale.toFixed(2)}`, pageWidth - margin - 20, y, { align: "right" });

    doc.save(`ordine-${order.numero}.pdf`);
    toast({ title: "PDF scaricato", description: "L'ordine è stato stampato" });
  };

  const generateDdtPdf = async (ddt: Ddt) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    let y = 20;

    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("DOCUMENTO DI TRASPORTO", pageWidth / 2, y, { align: "center" });
    y += 10;

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`N. ${ddt.numero}`, pageWidth / 2, y, { align: "center" });
    y += 15;

    doc.setDrawColor(200);
    doc.line(margin, y, pageWidth - margin, y);
    y += 10;

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("MITTENTE:", margin, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.text("La Tua Azienda S.r.l.", margin, y);
    y += 5;
    doc.text("Via Example, 123 - 00000 Città (XX)", margin, y);
    y += 5;
    doc.text("P.IVA: 00000000000", margin, y);
    y += 15;

    doc.setFont("helvetica", "bold");
    doc.text("DESTINATARIO:", margin, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.text(ddt.ragioneSociale || "", margin, y);
    y += 5;
    if (ddt.indirizzo) {
      const indirizzo = `${ddt.indirizzo}${ddt.cap ? `, ${ddt.cap}` : ""}${ddt.citta ? ` ${ddt.citta}` : ""}${ddt.provincia ? ` (${ddt.provincia})` : ""}`;
      doc.text(indirizzo, margin, y);
      y += 5;
    }
    if (ddt.partitaIva) {
      doc.text(`P.IVA: ${ddt.partitaIva}`, margin, y);
      y += 5;
    }
    if (ddt.codiceFiscale) {
      doc.text(`C.F.: ${ddt.codiceFiscale}`, margin, y);
      y += 5;
    }
    y += 10;

    doc.setDrawColor(200);
    doc.line(margin, y, pageWidth - margin, y);
    y += 10;

    doc.setFont("helvetica", "bold");
    doc.text("DATI DOCUMENTO:", margin, y);
    y += 8;

    doc.setFont("helvetica", "normal");
    const col1X = margin;
    const col2X = pageWidth / 2;

    doc.text(`Data Emissione: ${ddt.dataEmissione ? formatDate(ddt.dataEmissione) : "-"}`, col1X, y);
    doc.text(`Data Trasporto: ${ddt.dataTrasporto ? formatDate(ddt.dataTrasporto) : "-"}`, col2X, y);
    y += 6;

    doc.text(`Ora Trasporto: ${ddt.oraTrasporto || "-"}`, col1X, y);
    doc.text(`Causale: ${ddt.causaleTrasporto || "Vendita"}`, col2X, y);
    y += 6;

    doc.text(`Tipo Trasporto: ${ddt.tipoTrasporto || "Mittente"}`, col1X, y);
    doc.text(`Porto: ${ddt.porto || "Franco"}`, col2X, y);
    y += 6;

    doc.text(`Aspetto Beni: ${ddt.aspettoBeni || "-"}`, col1X, y);
    doc.text(`Vettore: ${ddt.vettore || "-"}`, col2X, y);
    y += 6;

    doc.text(`N. Colli: ${ddt.colli || "-"}`, col1X, y);
    doc.text(`Peso Lordo: ${ddt.pesoLordo ? `${ddt.pesoLordo} kg` : "-"}`, col2X, y);
    y += 15;

    doc.setDrawColor(200);
    doc.line(margin, y, pageWidth - margin, y);
    y += 10;

    doc.setFont("helvetica", "bold");
    doc.text("DESCRIZIONE MERCE:", margin, y);
    y += 10;

    doc.setFillColor(240, 240, 240);
    doc.rect(margin, y - 5, pageWidth - 2 * margin, 8, "F");
    doc.setFont("helvetica", "bold");
    doc.text("Descrizione", margin + 5, y);
    doc.text("Q.tà", pageWidth - margin - 40, y);
    doc.text("U.M.", pageWidth - margin - 15, y);
    y += 10;

    doc.setFont("helvetica", "normal");
    doc.text("(Inserire articoli)", margin + 5, y);
    y += 30;

    doc.setDrawColor(200);
    doc.line(margin, y, pageWidth - margin, y);
    y += 10;

    if (ddt.note) {
      doc.setFont("helvetica", "bold");
      doc.text("NOTE:", margin, y);
      y += 6;
      doc.setFont("helvetica", "normal");
      const noteLines = doc.splitTextToSize(ddt.note, pageWidth - 2 * margin);
      doc.text(noteLines, margin, y);
      y += noteLines.length * 5 + 10;
    }

    y = doc.internal.pageSize.getHeight() - 50;
    doc.setDrawColor(200);
    doc.line(margin, y, pageWidth - margin, y);
    y += 10;

    doc.setFontSize(9);
    doc.text("Firma Mittente: ________________________", margin, y);
    doc.text("Firma Destinatario: ________________________", pageWidth / 2, y);
    y += 10;

    doc.text("Data e Ora Ritiro: ________________________", margin, y);
    doc.text("Data e Ora Consegna: ________________________", pageWidth / 2, y);

    // Apri anteprima in nuova finestra
    const pdfBlob = doc.output("blob");
    const pdfUrl = URL.createObjectURL(pdfBlob);
    window.open(pdfUrl, "_blank");
    toast({ title: "PDF generato", description: `Anteprima DDT ${ddt.numero}` });
  };

  const createTransactionMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/finance/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Errore nella creazione");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/finance/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/finance/stats"] });
      toast({ title: "Transazione registrata" });
    },
    onError: () => toast({ title: "Errore nella registrazione", variant: "destructive" }),
  });

  const deleteTransactionMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/finance/transactions/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Errore nell'eliminazione");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/finance/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/finance/stats"] });
      toast({ title: "Transazione spostata nel cestino" });
    },
    onError: () => toast({ title: "Errore nell'eliminazione", variant: "destructive" }),
  });

  const restoreTransactionMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/finance/transactions/${id}/restore`, { method: "POST" });
      if (!res.ok) throw new Error("Errore nel ripristino");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/finance/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/finance/transactions/trash"] });
      queryClient.invalidateQueries({ queryKey: ["/api/finance/stats"] });
      toast({ title: "Transazione ripristinata" });
    },
    onError: () => toast({ title: "Errore nel ripristino", variant: "destructive" }),
  });

  const permanentDeleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/finance/transactions/${id}/permanent`, { method: "DELETE" });
      if (!res.ok) throw new Error("Errore nell'eliminazione");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/finance/transactions/trash"] });
      toast({ title: "Transazione eliminata definitivamente" });
    },
    onError: () => toast({ title: "Errore nell'eliminazione", variant: "destructive" }),
  });

  const updateTransactionNoteMutation = useMutation({
    mutationFn: async ({ id, note }: { id: string; note: string }) => {
      const res = await fetch(`/api/finance/transactions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note }),
      });
      if (!res.ok) throw new Error("Errore nell'aggiornamento");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/finance/transactions"] });
      toast({ title: "Nota aggiornata" });
      setNoteDialogOpen(false);
      setNoteTransaction(null);
      setNoteText("");
    },
    onError: () => toast({ title: "Errore nell'aggiornamento", variant: "destructive" }),
  });

  const handleSaveAccount = (data: any) => {
    if (selectedAccount) {
      updateAccountMutation.mutate({ id: selectedAccount.id, data });
    } else {
      createAccountMutation.mutate(data);
    }
    setSelectedAccount(null);
  };

  const handleSaveInvoice = (data: any) => {
    if (selectedInvoice) {
      updateInvoiceMutation.mutate({ id: selectedInvoice.id, data });
    } else {
      createInvoiceMutation.mutate(data);
    }
    setSelectedInvoice(null);
  };

  const handleSaveTransaction = (data: any) => {
    createTransactionMutation.mutate(data);
    setSelectedTransaction(null);
  };

  const handleSendReminder = async (data: { recipientEmail: string; recipientName: string; subject: string; body: string }) => {
    if (!reminderInvoice) return;
    try {
      const res = await fetch(`/api/finance/invoices/${reminderInvoice.id}/reminders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (res.ok && result.success) {
        toast({ title: "Sollecito inviato", description: `Email inviata a ${data.recipientEmail}` });
        setReminderDialogOpen(false);
        setReminderInvoice(null);
      } else {
        toast({
          title: "Errore nell'invio",
          description: result.error || "Controlla la configurazione email",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({ title: "Errore di rete", variant: "destructive" });
    }
  };

  const getInvoiceScadenzaStatus = (inv: Invoice): "scaduta" | "settimana" | "mese" | "ok" | "pagata" => {
    if (inv.stato === "pagata") return "pagata";
    if (!inv.dataScadenza) return "ok";
    const oggi = new Date();
    oggi.setHours(0, 0, 0, 0);
    const scadenza = new Date(inv.dataScadenza);
    scadenza.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((scadenza.getTime() - oggi.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return "scaduta";
    if (diffDays <= 7) return "settimana";
    if (diffDays <= 30) return "mese";
    return "ok";
  };

  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const matchSearch = inv.numero.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.ragioneSociale.toLowerCase().includes(searchQuery.toLowerCase());

      let matchStato = true;
      if (invoiceFilterStato === "tutti") {
        matchStato = true;
      } else if (invoiceFilterStato === "pagate") {
        matchStato = inv.stato === "pagata";
      } else if (invoiceFilterStato === "nonPagate") {
        matchStato = inv.stato !== "pagata";
      } else {
        matchStato = inv.stato === invoiceFilterStato;
      }

      const matchCliente = !invoiceFilterCliente ||
        inv.ragioneSociale.toLowerCase().includes(invoiceFilterCliente.toLowerCase());

      let matchPeriodo = true;
      if (invoiceFilterPeriodo !== "tutti") {
        const dataEmissione = new Date(inv.dataEmissione);
        const oggi = new Date();
        if (invoiceFilterPeriodo === "mese") {
          matchPeriodo = dataEmissione.getMonth() === oggi.getMonth() &&
            dataEmissione.getFullYear() === oggi.getFullYear();
        } else if (invoiceFilterPeriodo === "trimestre") {
          const tresMesiFA = new Date(oggi);
          tresMesiFA.setMonth(tresMesiFA.getMonth() - 3);
          matchPeriodo = dataEmissione >= tresMesiFA;
        } else if (invoiceFilterPeriodo === "anno") {
          matchPeriodo = dataEmissione.getFullYear() === oggi.getFullYear();
        }
      }

      let matchScadenza = true;
      if (invoiceFilterScadenza !== "tutti") {
        const status = getInvoiceScadenzaStatus(inv);
        if (invoiceFilterScadenza === "scadute") {
          matchScadenza = status === "scaduta";
        } else if (invoiceFilterScadenza === "settimana") {
          matchScadenza = status === "scaduta" || status === "settimana";
        } else if (invoiceFilterScadenza === "mese") {
          matchScadenza = status === "scaduta" || status === "settimana" || status === "mese";
        } else if (invoiceFilterScadenza === "nonScadute") {
          matchScadenza = status !== "scaduta";
        }
      }

      return matchSearch && matchStato && matchCliente && matchPeriodo && matchScadenza;
    });
  }, [invoices, searchQuery, invoiceFilterStato, invoiceFilterCliente, invoiceFilterPeriodo, invoiceFilterScadenza]);

  const fattureEmesse = filteredInvoices
    .filter(f => f.tipo === "emessa")
    .sort((a, b) => new Date(a.dataEmissione || 0).getTime() - new Date(b.dataEmissione || 0).getTime());
  const fattureRicevute = filteredInvoices
    .filter(f => f.tipo === "ricevuta")
    .sort((a, b) => new Date(a.dataEmissione || 0).getTime() - new Date(b.dataEmissione || 0).getTime());

  const fattureInScadenza = useMemo(() => {
    const oggi = new Date();
    const tra7giorni = new Date(oggi);
    tra7giorni.setDate(tra7giorni.getDate() + 7);

    return invoices.filter(inv => {
      if (inv.stato === 'pagata' || !inv.dataScadenza) return false;
      const scadenza = new Date(inv.dataScadenza);
      return scadenza <= tra7giorni && scadenza >= oggi;
    });
  }, [invoices]);

  const fattureScadute = useMemo(() => {
    const oggi = new Date();
    return invoices.filter(inv => {
      if (inv.stato === 'pagata' || !inv.dataScadenza) return false;
      const scadenza = new Date(inv.dataScadenza);
      return scadenza < oggi;
    });
  }, [invoices]);

  // KPI avanzati: Flusso di cassa previsto
  const flussoCassa = useMemo(() => {
    const oggi = new Date();
    const calcola = (giorni: number) => {
      const limite = new Date(oggi);
      limite.setDate(limite.getDate() + giorni);

      const entratePreviste = invoices
        .filter(inv => inv.tipo === 'emessa' && inv.stato !== 'pagata' && inv.dataScadenza)
        .filter(inv => new Date(inv.dataScadenza!) <= limite)
        .reduce((sum, inv) => sum + parseFloat(String(inv.totale || 0)), 0);

      const uscitePreviste = invoices
        .filter(inv => inv.tipo === 'ricevuta' && inv.stato !== 'pagata' && inv.dataScadenza)
        .filter(inv => new Date(inv.dataScadenza!) <= limite)
        .reduce((sum, inv) => sum + parseFloat(String(inv.totale || 0)), 0);

      return entratePreviste - uscitePreviste;
    };

    return {
      giorni30: calcola(30),
      giorni60: calcola(60),
      giorni90: calcola(90),
    };
  }, [invoices]);

  // KPI: Margine operativo mensile
  const margineOperativo = useMemo(() => {
    const oggi = new Date();
    const inizioMese = new Date(oggi.getFullYear(), oggi.getMonth(), 1);

    const entrateMese = transactions
      .filter(t => t.tipo === 'entrata' && new Date(t.data) >= inizioMese)
      .reduce((sum, t) => sum + parseFloat(String(t.importo)), 0);

    const usciteMese = transactions
      .filter(t => t.tipo === 'uscita' && new Date(t.data) >= inizioMese)
      .reduce((sum, t) => sum + parseFloat(String(t.importo)), 0);

    const margine = entrateMese - usciteMese;
    const percentuale = entrateMese > 0 ? (margine / entrateMese) * 100 : 0;

    return { entrate: entrateMese, uscite: usciteMese, margine, percentuale };
  }, [transactions]);

  // KPI: Aging report crediti/debiti
  const agingReport = useMemo(() => {
    const oggi = new Date();

    const calcAgingCrediti = () => {
      const nonPagate = invoices.filter(inv => inv.tipo === 'emessa' && inv.stato !== 'pagata');
      const correnti = nonPagate.filter(inv => !inv.dataScadenza || new Date(inv.dataScadenza) >= oggi);
      const scadute30 = nonPagate.filter(inv => {
        if (!inv.dataScadenza) return false;
        const scad = new Date(inv.dataScadenza);
        const diff = (oggi.getTime() - scad.getTime()) / (1000 * 60 * 60 * 24);
        return diff > 0 && diff <= 30;
      });
      const scadute60 = nonPagate.filter(inv => {
        if (!inv.dataScadenza) return false;
        const scad = new Date(inv.dataScadenza);
        const diff = (oggi.getTime() - scad.getTime()) / (1000 * 60 * 60 * 24);
        return diff > 30 && diff <= 60;
      });
      const scadute90 = nonPagate.filter(inv => {
        if (!inv.dataScadenza) return false;
        const scad = new Date(inv.dataScadenza);
        const diff = (oggi.getTime() - scad.getTime()) / (1000 * 60 * 60 * 24);
        return diff > 60;
      });

      return {
        correnti: correnti.reduce((s, i) => s + parseItalianNumber(i.totale), 0),
        scadute30: scadute30.reduce((s, i) => s + parseItalianNumber(i.totale), 0),
        scadute60: scadute60.reduce((s, i) => s + parseItalianNumber(i.totale), 0),
        scadute90: scadute90.reduce((s, i) => s + parseItalianNumber(i.totale), 0),
      };
    };

    const calcAgingDebiti = () => {
      const nonPagate = invoices.filter(inv => inv.tipo === 'ricevuta' && inv.stato !== 'pagata');
      const correnti = nonPagate.filter(inv => !inv.dataScadenza || new Date(inv.dataScadenza) >= oggi);
      const scadute30 = nonPagate.filter(inv => {
        if (!inv.dataScadenza) return false;
        const scad = new Date(inv.dataScadenza);
        const diff = (oggi.getTime() - scad.getTime()) / (1000 * 60 * 60 * 24);
        return diff > 0 && diff <= 30;
      });
      const scadute60 = nonPagate.filter(inv => {
        if (!inv.dataScadenza) return false;
        const scad = new Date(inv.dataScadenza);
        const diff = (oggi.getTime() - scad.getTime()) / (1000 * 60 * 60 * 24);
        return diff > 30 && diff <= 60;
      });
      const scadute90 = nonPagate.filter(inv => {
        if (!inv.dataScadenza) return false;
        const scad = new Date(inv.dataScadenza);
        const diff = (oggi.getTime() - scad.getTime()) / (1000 * 60 * 60 * 24);
        return diff > 60;
      });

      return {
        correnti: correnti.reduce((s, i) => s + parseItalianNumber(i.totale), 0),
        scadute30: scadute30.reduce((s, i) => s + parseItalianNumber(i.totale), 0),
        scadute60: scadute60.reduce((s, i) => s + parseItalianNumber(i.totale), 0),
        scadute90: scadute90.reduce((s, i) => s + parseItalianNumber(i.totale), 0),
      };
    };

    return { crediti: calcAgingCrediti(), debiti: calcAgingDebiti() };
  }, [invoices]);

  return (
    <AppLayout>
      <div className={`h-full flex flex-col overflow-hidden bg-gradient-to-br from-[#f5f0e6] via-[#e8dcc8] to-[#ddd0b8] dark:from-[#2d3748] dark:via-[#374151] dark:to-[#3d4555] ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
        <div className="h-32 w-full flex-shrink-0 bg-gradient-to-r from-[#4a5568] via-[#5a6a7d] to-[#6b7a8f]" />

        <div className="flex-1 overflow-auto -mt-16 px-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <div className="bg-stone-50 dark:bg-stone-900/50 rounded-xl shadow-lg border mb-6" style={{ maxWidth: "95rem" }}>
              <div className="p-6 pb-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
                    <Wallet className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h1 className="text-2xl font-bold tracking-tight">Finanza Professionale</h1>
                    <p className="text-sm text-muted-foreground">
                      Gestione completa di conti, fatture, transazioni e budget
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsFullscreen(!isFullscreen)}
                    className="flex flex-col items-center justify-center gap-0.5 h-auto py-1.5 px-2 text-[9px]"
                  >
                    {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                  </Button>
                  <CopyLinkButton path="/finanza" />
                </div>

                <TabsList className="grid w-full grid-cols-6 md:grid-cols-12 gap-1 h-auto bg-transparent p-0">
                  <TabsTrigger value="dashboard" className="flex flex-col items-center justify-center gap-0.5 px-1 py-2 text-[9px] data-[state=active]:bg-primary/20 rounded-lg" title="Dashboard">
                    <PiggyBank className="h-4 w-4" />
                    <span>Dashboard</span>
                  </TabsTrigger>
                  <TabsTrigger value="conti" className="flex flex-col items-center justify-center gap-0.5 px-1 py-2 text-[9px] data-[state=active]:bg-primary/20 rounded-lg" title="Conti">
                    <Building2 className="h-4 w-4" />
                    <span>Conti</span>
                  </TabsTrigger>
                  <TabsTrigger value="preventivi" className="flex flex-col items-center justify-center gap-0.5 px-1 py-2 text-[9px] data-[state=active]:bg-primary/20 rounded-lg" title="Preventivi">
                    <FileText className="h-4 w-4" />
                    <span>Preventivi</span>
                  </TabsTrigger>
                  <TabsTrigger value="ordini" className="flex flex-col items-center justify-center gap-0.5 px-1 py-2 text-[9px] data-[state=active]:bg-primary/20 rounded-lg" title="Ordini">
                    <ClipboardList className="h-4 w-4" />
                    <span>Ordini</span>
                  </TabsTrigger>
                  <TabsTrigger value="ddt" className="flex flex-col items-center justify-center gap-0.5 px-1 py-2 text-[9px] data-[state=active]:bg-primary/20 rounded-lg" title="DDT">
                    <ScrollText className="h-4 w-4" />
                    <span>DDT</span>
                  </TabsTrigger>
                  <TabsTrigger value="fatture" className="flex flex-col items-center justify-center gap-0.5 px-1 py-2 text-[9px] data-[state=active]:bg-primary/20 rounded-lg" title="Fatture">
                    <Receipt className="h-4 w-4" />
                    <span>Fatture</span>
                  </TabsTrigger>
                  <TabsTrigger value="transazioni" className="flex flex-col items-center justify-center gap-0.5 px-1 py-2 text-[9px] data-[state=active]:bg-primary/20 rounded-lg" title="Movimenti">
                    <ArrowUpDown className="h-4 w-4" />
                    <span>Movimenti</span>
                  </TabsTrigger>
                  <TabsTrigger value="scadenze" className="flex flex-col items-center justify-center gap-0.5 px-1 py-2 text-[9px] data-[state=active]:bg-primary/20 rounded-lg" title="Scadenze">
                    <CalendarClock className="h-4 w-4" />
                    <span>Scadenze</span>
                  </TabsTrigger>
                  <TabsTrigger value="documenti" className="flex flex-col items-center justify-center gap-0.5 px-1 py-2 text-[9px] data-[state=active]:bg-primary/20 rounded-lg" title="Documenti">
                    <FolderOpen className="h-4 w-4" />
                    <span>Documenti</span>
                  </TabsTrigger>
                  <TabsTrigger value="import" className="flex flex-col items-center justify-center gap-0.5 px-1 py-2 text-[9px] data-[state=active]:bg-primary/20 rounded-lg" title="Import">
                    <Upload className="h-4 w-4" />
                    <span>Import</span>
                  </TabsTrigger>
                  <TabsTrigger value="condivisioni" className="flex flex-col items-center justify-center gap-0.5 px-1 py-2 text-[9px] data-[state=active]:bg-primary/20 rounded-lg" title="Condivisioni">
                    <Share2 className="h-4 w-4" />
                    <span>Condivisi</span>
                  </TabsTrigger>
                  <TabsTrigger value="integrazioni" className="flex flex-col items-center justify-center gap-0.5 px-1 py-2 text-[9px] data-[state=active]:bg-primary/20 rounded-lg" title="Integrazioni">
                    <Zap className="h-4 w-4" />
                    <span>Integrazioni</span>
                  </TabsTrigger>
                </TabsList>
              </div>
            </div>

            <div className="flex-1 overflow-auto">
              <TabsContent value="dashboard" className="m-0 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-3">
                      <CardTitle className="text-xs font-medium">Saldo Totale</CardTitle>
                      <Euro className="h-3 w-3 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="px-3 pb-3">
                      <div className="text-lg font-bold">
                        {statsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : formatCurrency(stats?.saldoTotale)}
                      </div>
                      {!statsLoading && accounts.filter(a => a.attivo).length > 0 && (
                        <div className="mt-2 space-y-1 border-t pt-2">
                          {accounts.filter(a => a.attivo).map(account => {
                            const accountTx = transactions.filter(t => t.contoId === account.id);
                            const saldoIniziale = parseItalianNumber(account.saldoIniziale || 0);
                            const entrate = accountTx.filter(t => t.tipo === 'entrata').reduce((sum, t) => sum + parseItalianNumber(t.importo), 0);
                            const uscite = accountTx.filter(t => t.tipo === 'uscita').reduce((sum, t) => sum + parseItalianNumber(t.importo), 0);
                            const saldoConto = saldoIniziale + entrate - uscite;
                            return (
                              <div key={account.id} className="flex items-center justify-between text-[10px]">
                                <div className="flex items-center gap-1">
                                  <span
                                    className="w-2 h-2 rounded-full"
                                    style={{ backgroundColor: account.colore || "#3B82F6" }}
                                  />
                                  <span className="text-muted-foreground truncate max-w-[80px]">{account.nome}</span>
                                </div>
                                <span className={`font-semibold ${saldoConto >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {formatCurrency(saldoConto)}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-3">
                      <CardTitle className="text-xs font-medium">Crediti</CardTitle>
                      <TrendingUp className="h-3 w-3 text-green-500" />
                    </CardHeader>
                    <CardContent className="px-3 pb-3">
                      <div className="text-lg font-bold text-green-600">
                        {statsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : formatCurrency(stats?.totaleCrediti)}
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        Da incassare
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-3">
                      <CardTitle className="text-xs font-medium">Debiti</CardTitle>
                      <TrendingDown className="h-3 w-3 text-red-500" />
                    </CardHeader>
                    <CardContent className="px-3 pb-3">
                      <div className="text-lg font-bold text-red-600">
                        {statsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : formatCurrency(stats?.totaleDebiti)}
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        Da pagare
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-3">
                      <CardTitle className="text-xs font-medium">Scadenze</CardTitle>
                      <Clock className="h-3 w-3 text-orange-500" />
                    </CardHeader>
                    <CardContent className="px-3 pb-3">
                      <div className="text-lg font-bold">
                        {statsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : stats?.scadenzeAttive || 0}
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        {stats?.scadenzeOggi || 0} oggi
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="py-2 px-3">
                      <CardTitle className="text-sm">Conti Bancari</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 px-3 pb-3">
                      {accountsLoading ? (
                        <div className="flex justify-center py-4">
                          <Loader2 className="h-5 w-5 animate-spin" />
                        </div>
                      ) : accounts.length === 0 ? (
                        <p className="text-muted-foreground text-center py-3 text-xs">Nessun conto configurato</p>
                      ) : (
                        accounts.filter(a => a.attivo).slice(0, 5).map((account) => (
                          <div key={account.id} className="flex items-center justify-between p-2 rounded-lg border">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-7 h-7 rounded-full flex items-center justify-center"
                                style={{ backgroundColor: account.colore || "#3B82F6" }}
                              >
                                <Building2 className="h-3.5 w-3.5 text-white" />
                              </div>
                              <div>
                                <p className="font-medium text-xs">{account.nome}</p>
                                <p className="text-[10px] text-muted-foreground">{account.istituto || account.tipo}</p>
                              </div>
                            </div>
                            <p className="font-semibold text-xs">{formatCurrency(account.saldoAttuale)}</p>
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="py-2 px-3">
                      <CardTitle className="text-base">Ultime Transazioni</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 px-3 pb-3">
                      {transactionsLoading ? (
                        <div className="flex justify-center py-4">
                          <Loader2 className="h-5 w-5 animate-spin" />
                        </div>
                      ) : transactions.length === 0 ? (
                        <p className="text-muted-foreground text-center py-3 text-sm">Nessuna transazione</p>
                      ) : (
                        transactions.slice(0, 5).map((trans) => (
                          <div key={trans.id} className="flex items-center justify-between p-2 rounded-lg border">
                            <div className="flex items-center gap-2">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${trans.tipo === "entrata" ? "bg-green-100 text-green-600" :
                                trans.tipo === "uscita" ? "bg-red-100 text-red-600" :
                                  "bg-blue-100 text-blue-600"
                                }`}>
                                {trans.tipo === "entrata" ? <TrendingUp className="h-3 w-3" /> :
                                  trans.tipo === "uscita" ? <TrendingDown className="h-3 w-3" /> :
                                    <ArrowRightLeft className="h-3 w-3" />}
                              </div>
                              <div>
                                <p className="font-medium text-xs">{trans.descrizione?.substring(0, 40)}{trans.descrizione && trans.descrizione.length > 40 ? '...' : ''}</p>
                                <p className="text-[10px] text-muted-foreground">{formatDate(trans.data)}</p>
                              </div>
                            </div>
                            <p className={`font-semibold text-xs ${trans.tipo === "entrata" ? "text-green-600" :
                              trans.tipo === "uscita" ? "text-red-600" : ""
                              }`}>
                              {trans.tipo === "entrata" ? "+" : trans.tipo === "uscita" ? "-" : ""}
                              {formatCurrency(trans.importo)}
                            </p>
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* KPI Avanzati */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* Flusso di Cassa Previsto */}
                  <Card>
                    <CardHeader className="pb-2 pt-3 px-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-blue-500" />
                        Flusso di Cassa Previsto
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 px-3 pb-3">
                      <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                        <span className="text-xs">30 giorni</span>
                        <span className={`font-bold text-xs ${flussoCassa.giorni30 >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {flussoCassa.giorni30 >= 0 ? '+' : ''}{formatCurrency(flussoCassa.giorni30)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                        <span className="text-xs">60 giorni</span>
                        <span className={`font-bold text-xs ${flussoCassa.giorni60 >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {flussoCassa.giorni60 >= 0 ? '+' : ''}{formatCurrency(flussoCassa.giorni60)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                        <span className="text-xs">90 giorni</span>
                        <span className={`font-bold text-xs ${flussoCassa.giorni90 >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {flussoCassa.giorni90 >= 0 ? '+' : ''}{formatCurrency(flussoCassa.giorni90)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Margine Operativo Mensile */}
                  <Card>
                    <CardHeader className="pb-2 pt-3 px-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-purple-500" />
                        Margine Operativo Mese
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 px-3 pb-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Entrate</span>
                        <span className="font-semibold text-xs text-green-600">{formatCurrency(margineOperativo.entrate)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Uscite</span>
                        <span className="font-semibold text-xs text-red-600">{formatCurrency(margineOperativo.uscite)}</span>
                      </div>
                      <div className="border-t pt-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-xs">Margine</span>
                          <span className={`text-base font-bold ${margineOperativo.margine >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(margineOperativo.margine)}
                          </span>
                        </div>
                        <div className="text-right text-[10px] text-muted-foreground mt-1">
                          {margineOperativo.percentuale.toFixed(1)}% del fatturato
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Aging Report */}
                  <Card>
                    <CardHeader className="pb-2 pt-3 px-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Clock className="h-5 w-5 text-orange-500" />
                        Aging Report
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-3 pb-3">
                      <div className="space-y-4">
                        <div>
                          <p className="text-xs font-medium text-green-600 mb-2">CREDITI</p>
                          <div className="grid grid-cols-4 gap-1.5 text-xs">
                            <div className="text-center p-2 bg-green-50 dark:bg-green-950/30 rounded">
                              <p className="text-muted-foreground text-[10px]">Correnti</p>
                              <p className="font-bold">{formatCurrency(agingReport.crediti.correnti)}</p>
                            </div>
                            <div className="text-center p-2 bg-yellow-50 dark:bg-yellow-950/30 rounded">
                              <p className="text-muted-foreground text-[10px]">1-30gg</p>
                              <p className="font-bold">{formatCurrency(agingReport.crediti.scadute30)}</p>
                            </div>
                            <div className="text-center p-2 bg-orange-50 dark:bg-orange-950/30 rounded">
                              <p className="text-muted-foreground text-[10px]">31-60gg</p>
                              <p className="font-bold">{formatCurrency(agingReport.crediti.scadute60)}</p>
                            </div>
                            <div className="text-center p-2 bg-red-50 dark:bg-red-950/30 rounded">
                              <p className="text-muted-foreground text-[10px]">&gt;60gg</p>
                              <p className="font-bold">{formatCurrency(agingReport.crediti.scadute90)}</p>
                            </div>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-red-600 mb-2">DEBITI</p>
                          <div className="grid grid-cols-4 gap-1.5 text-xs">
                            <div className="text-center p-2 bg-green-50 dark:bg-green-950/30 rounded">
                              <p className="text-muted-foreground text-[10px]">Correnti</p>
                              <p className="font-bold">{formatCurrency(agingReport.debiti.correnti)}</p>
                            </div>
                            <div className="text-center p-2 bg-yellow-50 dark:bg-yellow-950/30 rounded">
                              <p className="text-muted-foreground text-[10px]">1-30gg</p>
                              <p className="font-bold">{formatCurrency(agingReport.debiti.scadute30)}</p>
                            </div>
                            <div className="text-center p-2 bg-orange-50 dark:bg-orange-950/30 rounded">
                              <p className="text-muted-foreground text-[10px]">31-60gg</p>
                              <p className="font-bold">{formatCurrency(agingReport.debiti.scadute60)}</p>
                            </div>
                            <div className="text-center p-2 bg-red-50 dark:bg-red-950/30 rounded">
                              <p className="text-muted-foreground text-[10px]">&gt;60gg</p>
                              <p className="font-bold">{formatCurrency(agingReport.debiti.scadute90)}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="conti" className="m-0 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="relative w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Cerca conti..."
                      className="pl-9"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Button onClick={() => { setSelectedAccount(null); setAccountDialogOpen(true); }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nuovo Conto
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {accountsLoading ? (
                    <div className="col-span-full flex justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                  ) : accounts.length === 0 ? (
                    <div className="col-span-full text-center py-12">
                      <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium">Nessun conto</h3>
                      <p className="text-muted-foreground">Crea il tuo primo conto bancario o cassa</p>
                    </div>
                  ) : (
                    accounts.map((account) => (
                      <Card key={account.id} className={!account.attivo ? "opacity-50" : ""}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div
                                className="w-12 h-12 rounded-full flex items-center justify-center"
                                style={{ backgroundColor: account.colore || "#3B82F6" }}
                              >
                                <Building2 className="h-6 w-6 text-white" />
                              </div>
                              <div>
                                <h3 className="font-semibold">{account.nome}</h3>
                                <p className="text-sm text-muted-foreground">
                                  {TIPI_CONTO.find(t => t.value === account.tipo)?.label || account.tipo}
                                </p>
                              </div>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => { setSelectedAccount(account); setAccountDialogOpen(true); }}>
                                  <Edit2 className="h-4 w-4 mr-2" />
                                  Modifica
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={() => deleteAccountMutation.mutate(account.id)}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Elimina
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          <div className="mt-4">
                            <p className="text-2xl font-bold">{formatCurrency(account.saldoAttuale)}</p>
                            {account.iban && (
                              <p className="text-xs text-muted-foreground mt-1 font-mono">
                                {account.iban}
                              </p>
                            )}
                          </div>
                          {account.predefinito && (
                            <Badge variant="secondary" className="mt-2">Predefinito</Badge>
                          )}
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>

              {/* Tab Preventivi */}
              <TabsContent value="preventivi" className="m-0 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h2 className="text-lg font-semibold">Preventivi</h2>
                    <Badge variant="outline">{quotes.length} totali</Badge>
                  </div>
                  <Button onClick={() => openQuoteDialog(null)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nuovo Preventivo
                  </Button>
                </div>

                {/* Riepilogo preventivi */}
                <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                  {STATI_PREVENTIVO.map(stato => {
                    const count = quotes.filter(q => q.stato === stato.value).length;
                    const totale = quotes.filter(q => q.stato === stato.value).reduce((sum, q) => sum + parseItalianNumber(q.totale), 0);
                    return (
                      <div key={stato.value} className="bg-muted/50 rounded-lg p-3 border">
                        <div className="flex items-center gap-2">
                          <Badge className={`${stato.color} text-[10px]`}>{stato.label}</Badge>
                        </div>
                        <p className="text-xl font-bold mt-1">{count}</p>
                        <p className="text-xs text-muted-foreground">{formatCurrency(totale)}</p>
                      </div>
                    );
                  })}
                </div>

                {/* Tabella preventivi */}
                {quotesLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : quotes.length === 0 ? (
                  <div className="text-center py-12 border rounded-lg">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">Nessun preventivo</h3>
                    <p className="text-muted-foreground">Crea il tuo primo preventivo</p>
                    <Button
                      className="mt-4"
                      onClick={() => openQuoteDialog(null)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Nuovo Preventivo
                    </Button>
                  </div>
                ) : (
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-left px-3 py-2 font-medium">Numero</th>
                          <th className="text-left px-3 py-2 font-medium">Cliente</th>
                          <th className="text-left px-3 py-2 font-medium">Oggetto</th>
                          <th className="text-left px-3 py-2 font-medium">Data</th>
                          <th className="text-left px-3 py-2 font-medium">Validità</th>
                          <th className="text-right px-3 py-2 font-medium">Totale</th>
                          <th className="text-center px-3 py-2 font-medium">Stato</th>
                          <th className="text-center px-3 py-2 font-medium">Fattura</th>
                          <th className="text-right px-3 py-2 font-medium">Azioni</th>
                        </tr>
                      </thead>
                      <tbody>
                        {quotes.map((quote) => {
                          const stato = STATI_PREVENTIVO.find(s => s.value === quote.stato);
                          const isScaduto = quote.dataValidita && new Date(quote.dataValidita) < new Date() && quote.stato === 'inviato';
                          const linkedInvoice = quote.invoiceId ? invoices.find(inv => inv.id === quote.invoiceId) : null;
                          return (
                            <tr key={quote.id} className={`border-t ${isScaduto ? 'bg-amber-50 dark:bg-amber-950/30' : ''}`}>
                              <td className="px-3 py-2 font-medium">{quote.numero}</td>
                              <td className="px-3 py-2">{quote.ragioneSociale}</td>
                              <td className="px-3 py-2 text-muted-foreground max-w-[200px] truncate">{quote.oggetto || '-'}</td>
                              <td className="px-3 py-2 text-muted-foreground">{formatDate(quote.dataEmissione)}</td>
                              <td className={`px-3 py-2 ${isScaduto ? 'text-amber-600 font-medium' : 'text-muted-foreground'}`}>
                                {quote.dataValidita ? formatDate(quote.dataValidita) : '-'}
                                {isScaduto && <AlertCircle className="h-3 w-3 inline ml-1" />}
                              </td>
                              <td className="px-3 py-2 text-right font-semibold">{formatCurrency(quote.totale)}</td>
                              <td className="px-3 py-2 text-center">
                                <Badge className={`${stato?.color} text-[10px]`}>{stato?.label}</Badge>
                              </td>
                              <td className="px-3 py-2 text-center">
                                {linkedInvoice ? (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 px-2 text-xs text-green-600"
                                    onClick={() => { setSelectedInvoice(linkedInvoice); setInvoiceTipo("emessa"); setInvoiceDialogOpen(true); }}
                                  >
                                    <Receipt className="h-3 w-3 mr-1" />
                                    {linkedInvoice.numero}
                                  </Button>
                                ) : (
                                  <span className="text-muted-foreground text-xs">-</span>
                                )}
                              </td>
                              <td className="px-3 py-2 text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => openQuoteDialog(quote)}>
                                      <Edit2 className="h-4 w-4 mr-2" />
                                      Modifica
                                    </DropdownMenuItem>
                                    {quote.stato !== 'convertito' && quote.stato !== 'rifiutato' && (
                                      <DropdownMenuItem
                                        onClick={() => convertQuoteToOrderMutation.mutate(quote.id)}
                                      >
                                        <ClipboardList className="h-4 w-4 mr-2" />
                                        Converti in Ordine
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      className="text-red-600"
                                      onClick={() => deleteQuoteMutation.mutate(quote.id)}
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Elimina
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Confronto Preventivi vs Fatture */}
                {quotes.filter(q => q.invoiceId).length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Zap className="h-4 w-4" />
                        Confronto Preventivi vs Fatture
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="border rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-muted/50">
                            <tr>
                              <th className="text-left px-3 py-2 font-medium">Preventivo</th>
                              <th className="text-left px-3 py-2 font-medium">Cliente</th>
                              <th className="text-right px-3 py-2 font-medium">Prev. Totale</th>
                              <th className="text-left px-3 py-2 font-medium">Fattura</th>
                              <th className="text-right px-3 py-2 font-medium">Fatt. Totale</th>
                              <th className="text-right px-3 py-2 font-medium">Differenza</th>
                            </tr>
                          </thead>
                          <tbody>
                            {quotes.filter(q => q.invoiceId).map(quote => {
                              const inv = invoices.find(i => i.id === quote.invoiceId);
                              if (!inv) return null;
                              const quoteTotale = parseItalianNumber(quote.totale);
                              const invTotale = parseItalianNumber(inv.totale);
                              const diff = invTotale - quoteTotale;
                              return (
                                <tr key={quote.id} className="border-t">
                                  <td className="px-3 py-2 font-medium">{quote.numero}</td>
                                  <td className="px-3 py-2">{quote.ragioneSociale}</td>
                                  <td className="px-3 py-2 text-right">{formatCurrency(quoteTotale)}</td>
                                  <td className="px-3 py-2 font-medium">{inv.numero}</td>
                                  <td className="px-3 py-2 text-right">{formatCurrency(invTotale)}</td>
                                  <td className={`px-3 py-2 text-right font-semibold ${diff > 0 ? 'text-green-600' : diff < 0 ? 'text-red-600' : ''}`}>
                                    {diff > 0 ? '+' : ''}{formatCurrency(diff)}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* ORDINI CLIENTE - Sales Orders Tab */}
              <TabsContent value="ordini" className="m-0 space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <h2 className="text-lg font-semibold">Ordini Cliente</h2>
                    <Badge variant="outline">{salesOrders.length} totali</Badge>
                  </div>
                </div>

                {salesOrdersLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : salesOrders.length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                      <ClipboardList className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>Nessun ordine cliente</p>
                      <p className="text-sm">Converti un preventivo accettato per creare un ordine</p>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    {/* Workflow Pipeline Visualization */}
                    <Card className="mb-4">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Navigation className="h-4 w-4" />
                          Pipeline Ordini
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between gap-2">
                          {[
                            { stato: 'confermato', label: 'Confermati', icon: CheckCircle2, color: 'bg-blue-500' },
                            { stato: 'verifica_materiale', label: 'Verifica Mat.', icon: Boxes, color: 'bg-yellow-500' },
                            { stato: 'in_produzione', label: 'In Produzione', icon: Boxes, color: 'bg-orange-500' },
                            { stato: 'pronto', label: 'Pronti', icon: CheckCircle2, color: 'bg-green-500' },
                            { stato: 'spedito', label: 'Spediti', icon: Truck, color: 'bg-purple-500' },
                            { stato: 'fatturato', label: 'Fatturati', icon: Receipt, color: 'bg-emerald-500' },
                            { stato: 'consegnato', label: 'Consegnati', icon: CheckCircle2, color: 'bg-gray-500' },
                          ].map((step, index) => {
                            const count = salesOrders.filter(o => o.stato === step.stato).length;
                            return (
                              <div key={step.stato} className="flex-1 relative">
                                <div className={`flex flex-col items-center p-3 rounded-lg ${count > 0 ? 'bg-muted' : 'bg-muted/30'}`}>
                                  <div className={`w-8 h-8 rounded-full ${step.color} flex items-center justify-center mb-1`}>
                                    <step.icon className="h-4 w-4 text-white" />
                                  </div>
                                  <span className="text-xs font-medium">{step.label}</span>
                                  <span className="text-lg font-bold">{count}</span>
                                </div>
                                {index < 6 && (
                                  <div className="absolute top-1/2 -right-3 transform -translate-y-1/2 text-muted-foreground">
                                    →
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Orders Table */}
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full text-xs">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="text-left px-3 py-2 font-medium">Numero</th>
                            <th className="text-left px-3 py-2 font-medium">Cliente</th>
                            <th className="text-left px-3 py-2 font-medium">Data</th>
                            <th className="text-left px-3 py-2 font-medium">Preventivo</th>
                            <th className="text-right px-3 py-2 font-medium">Totale</th>
                            <th className="text-center px-3 py-2 font-medium">Pezzi</th>
                            <th className="text-center px-3 py-2 font-medium">Giacenza Min</th>
                            <th className="text-center px-3 py-2 font-medium">Stato</th>
                            <th className="text-center px-3 py-2 font-medium">Workflow</th>
                            <th className="text-right px-3 py-2 font-medium">Azioni</th>
                          </tr>
                        </thead>
                        <tbody>
                          {salesOrders.map((order) => {
                            const statiMap: Record<string, { label: string; color: string }> = {
                              confermato: { label: 'Confermato', color: 'bg-blue-500' },
                              verifica_materiale: { label: 'Verifica Mat.', color: 'bg-yellow-500' },
                              in_produzione: { label: 'In Produzione', color: 'bg-orange-500' },
                              pronto: { label: 'Pronto', color: 'bg-green-500' },
                              in_spedizione: { label: 'In Spedizione', color: 'bg-purple-500' },
                              spedito: { label: 'Spedito', color: 'bg-indigo-500' },
                              fatturato: { label: 'Fatturato', color: 'bg-emerald-500' },
                              consegnato: { label: 'Consegnato', color: 'bg-gray-500' },
                              annullato: { label: 'Annullato', color: 'bg-red-500' },
                            };
                            const stato = statiMap[order.stato] || { label: order.stato, color: 'bg-gray-500' };
                            const openOrderDialog = async () => {
                              const res = await fetch(`/api/sales-orders/${order.id}`);
                              const data = await res.json();
                              setSelectedOrder(data);
                              setOrderFormData({
                                numero: data.numero || "",
                                dataOrdine: data.data_ordine || new Date().toISOString().split('T')[0],
                                clienteId: data.cliente_id || "",
                                ragioneSociale: data.ragione_sociale || "",
                                partitaIva: data.partita_iva || "",
                                email: data.email || "",
                                telefono: data.telefono || "",
                                indirizzo: data.indirizzo || "",
                                note: data.note || "",
                                stato: data.stato || "confermato",
                              });
                              const mappedLines = (data.lines || []).map((l: any) => ({
                                id: l.id,
                                codiceArticolo: l.codice_articolo || "",
                                descrizione: l.descrizione || "",
                                quantita: (l.quantita || "").toString(),
                                unitaMisura: l.unita_misura || "pz",
                                prezzoUnitario: (l.prezzo_unitario || "").toString(),
                                sconto: (l.sconto || "0").toString(),
                                importo: (l.importo || "0").toString(),
                              }));
                              setOrderLines(mappedLines);
                              setOrderDialogOpen(true);
                            };

                            return (
                              <tr key={order.id} className="border-t hover:bg-muted/30 cursor-pointer" onClick={openOrderDialog}>
                                <td className="px-3 py-2 font-medium">{order.numero}</td>
                                <td className="px-3 py-2">{order.ragione_sociale}</td>
                                <td className="px-3 py-2 text-muted-foreground">{order.data_ordine}</td>
                                <td className="px-3 py-2">
                                  {order.preventivo_numero ? (
                                    <Badge variant="outline" className="text-xs">{order.preventivo_numero}</Badge>
                                  ) : '-'}
                                </td>
                                <td className="px-3 py-2 text-right font-semibold">{formatCurrency(order.totale)}</td>
                                <td className="px-3 py-2 text-center font-medium">{order.totale_pezzi || 0}</td>
                                <td className="px-3 py-2 text-center">
                                  <Badge className={order.giacenza_minima > 0 ? "bg-green-500 text-white" : "bg-red-500 text-white"}>
                                    {order.giacenza_minima || 0}
                                  </Badge>
                                </td>
                                <td className="px-3 py-2 text-center">
                                  <Badge className={`${stato.color} text-[10px]`}>{stato.label}</Badge>
                                </td>
                                <td className="px-3 py-2 text-center">
                                  <span className="text-xs text-muted-foreground">{order.workflow_status?.replace(/_/g, ' ')}</span>
                                </td>
                                <td className="px-3 py-2 text-right" onClick={(e) => e.stopPropagation()}>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon">
                                        <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={openOrderDialog}>
                                        <Edit className="h-4 w-4 mr-2" />
                                        Modifica
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => generateOrderPdf(order)}>
                                        <Printer className="h-4 w-4 mr-2" />
                                        Stampa
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => {
                                        setSelectedOrder(order);
                                        setOrderEmailAddress(order.email || "");
                                        setOrderEmailDialogOpen(true);
                                      }}>
                                        <Mail className="h-4 w-4 mr-2" />
                                        Invia Email
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={async () => {
                                        const res = await fetch(`/api/sales-orders/${order.id}/verify-material`, { method: 'POST' });
                                        const data = await res.json();
                                        toast({ title: data.message });
                                        queryClient.invalidateQueries({ queryKey: ["/api/sales-orders"] });
                                      }}>
                                        <Boxes className="h-4 w-4 mr-2" />
                                        Verifica Materiale
                                      </DropdownMenuItem>
                                      {order.produzione_richiesta && (
                                        <DropdownMenuItem onClick={async () => {
                                          const res = await fetch(`/api/sales-orders/${order.id}/generate-production`, { method: 'POST' });
                                          const data = await res.json();
                                          toast({ title: data.message });
                                          queryClient.invalidateQueries({ queryKey: ["/api/sales-orders"] });
                                          queryClient.invalidateQueries({ queryKey: ["/api/production/orders"] });
                                        }}>
                                          <Boxes className="h-4 w-4 mr-2" />
                                          Genera Produzione
                                        </DropdownMenuItem>
                                      )}
                                      {(order.materiale_disponibile || order.stato === 'pronto') && !order.ddt_id && (
                                        <DropdownMenuItem onClick={async () => {
                                          const res = await fetch(`/api/sales-orders/${order.id}/create-ddt`, { method: 'POST' });
                                          const data = await res.json();
                                          toast({ title: data.message || 'DDT creato' });
                                          queryClient.invalidateQueries({ queryKey: ["/api/sales-orders"] });
                                          queryClient.invalidateQueries({ queryKey: ["/api/finance/ddt"] });
                                        }}>
                                          <ScrollText className="h-4 w-4 mr-2" />
                                          Crea DDT
                                        </DropdownMenuItem>
                                      )}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </TabsContent>

              <TabsContent value="ddt" className="m-0 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Select value={ddtFilterStato} onValueChange={setDdtFilterStato}>
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Stato" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tutti">Tutti gli stati</SelectItem>
                        {STATI_DDT.map(stato => (
                          <SelectItem key={stato.value} value={stato.value}>{stato.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Cerca cliente..."
                        value={ddtFilterCliente}
                        onChange={(e) => setDdtFilterCliente(e.target.value)}
                        className="pl-8 w-[200px]"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={loadDdtReportPercorso}>
                      <Route className="h-4 w-4 mr-2" />
                      Report Percorso
                    </Button>
                    <Button variant="outline" onClick={() => setDdtImportDialogOpen(true)}>
                      <Upload className="h-4 w-4 mr-2" />
                      Importa XLS
                    </Button>
                    <Button onClick={openNewDdtDialog}>
                      <Plus className="h-4 w-4 mr-2" />
                      Nuovo DDT
                    </Button>
                  </div>
                </div>

                {ddtLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-xs">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-left px-1.5 py-0.5 font-medium">Numero</th>
                          <th className="text-left px-1.5 py-0.5 font-medium">Data</th>
                          <th className="text-left px-1.5 py-0.5 font-medium">Creato</th>
                          <th className="text-left px-1.5 py-0.5 font-medium">Cliente</th>
                          <th className="text-left px-1.5 py-0.5 font-medium">Causale</th>
                          <th className="text-left px-1.5 py-0.5 font-medium">Colli</th>
                          <th className="text-center px-1.5 py-0.5 font-medium">PDF</th>
                          <th className="text-left px-1.5 py-0.5 font-medium">Stato</th>
                          <th className="text-right px-1.5 py-0.5 font-medium">Azioni</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ddtList
                          .filter(d => ddtFilterStato === "tutti" || d.stato === ddtFilterStato)
                          .filter(d => !ddtFilterCliente || d.ragioneSociale.toLowerCase().includes(ddtFilterCliente.toLowerCase()))
                          .map(ddt => {
                            const statoInfo = STATI_DDT.find(s => s.value === ddt.stato);
                            return (
                              <tr key={ddt.id} className="border-t hover:bg-muted/30">
                                <td className="px-1.5 py-0.5 font-medium">{ddt.numero}</td>
                                <td className="px-1.5 py-0.5">{formatDate(ddt.dataEmissione)}</td>
                                <td className="px-1.5 py-0.5 text-muted-foreground">
                                  {ddt.createdAt ? format(new Date(ddt.createdAt), "dd/MM HH:mm", { locale: it }) : "-"}
                                </td>
                                <td className="px-1.5 py-0.5">{ddt.ragioneSociale}</td>
                                <td className="px-1.5 py-0.5">{ddt.causaleTrasporto || "Vendita"}</td>
                                <td className="px-1.5 py-0.5">{ddt.colli || "-"}</td>
                                <td className="px-1.5 py-0.5 text-center">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    onClick={() => generateDdtPdf(ddt)}
                                    title="Scarica PDF DDT"
                                  >
                                    <FileText className="h-4 w-4 text-red-500" />
                                  </Button>
                                </td>
                                <td className="px-1.5 py-0.5">
                                  <div className="flex items-center gap-1">
                                    <Badge className={`${statoInfo?.color || 'bg-gray-500'} text-[9px]`}>
                                      {statoInfo?.label || ddt.stato}
                                    </Badge>
                                    {ddt.stato === "in_spedizione" && (
                                      <>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-5 w-5 p-0"
                                          onClick={() => generateDdtPdf(ddt)}
                                          title="Stampa DDT"
                                        >
                                          <Printer className="h-3 w-3 text-blue-500" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-5 w-5 p-0"
                                          onClick={() => navigate("/produzione?tab=spedizioni")}
                                          title="Vai a Spedizioni"
                                        >
                                          <Truck className="h-3 w-3 text-orange-500" />
                                        </Button>
                                      </>
                                    )}
                                  </div>
                                </td>
                                <td className="px-1.5 py-0.5 text-right">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                        <MoreHorizontal className="h-3 w-3" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => openEditDdtDialog(ddt)}>
                                        <Edit2 className="h-4 w-4 mr-2" />
                                        Modifica
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => generateDdtPdf(ddt)}>
                                        <Download className="h-4 w-4 mr-2" />
                                        Scarica PDF
                                      </DropdownMenuItem>
                                      {ddt.stato !== "fatturato" && (
                                        <DropdownMenuItem
                                          onClick={() => {
                                            setIsConvertingDdt(true);
                                            convertDdtMutation.mutate(ddt.id);
                                          }}
                                          disabled={isConvertingDdt}
                                        >
                                          <Receipt className="h-4 w-4 mr-2" />
                                          Crea Fattura
                                        </DropdownMenuItem>
                                      )}
                                      {ddt.invoiceId && (
                                        <DropdownMenuItem onClick={() => {
                                          const inv = invoices.find(i => i.id === ddt.invoiceId);
                                          if (inv) {
                                            setInvoiceDetail(inv);
                                            setInvoiceDetailOpen(true);
                                          }
                                        }}>
                                          <Eye className="h-4 w-4 mr-2" />
                                          Vedi Fattura
                                        </DropdownMenuItem>
                                      )}
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        className="text-destructive"
                                        onClick={() => deleteDdtMutation.mutate(ddt.id)}
                                      >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Elimina
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                )}

                {ddtList.length === 0 && !ddtLoading && (
                  <div className="text-center py-12 text-muted-foreground">
                    <ScrollText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nessun DDT trovato</p>
                    <p className="text-sm">Clicca su "Nuovo DDT" per crearne uno</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="fatture" className="m-0 space-y-4">
                {/* Avvisi scadenze */}
                {(fattureScadute.length > 0 || fattureInScadenza.length > 0) && (
                  <div className="flex gap-3 flex-wrap">
                    {fattureScadute.length > 0 && (
                      <div className="bg-red-100 dark:bg-red-950/50 border border-red-300 dark:border-red-800 rounded-lg px-4 py-2 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <span className="text-sm font-medium text-red-700 dark:text-red-400">
                          {fattureScadute.length} fatture scadute
                        </span>
                      </div>
                    )}
                    {fattureInScadenza.length > 0 && (
                      <div className="bg-amber-100 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 rounded-lg px-4 py-2 flex items-center gap-2">
                        <Clock className="h-4 w-4 text-amber-600" />
                        <span className="text-sm font-medium text-amber-700 dark:text-amber-400">
                          {fattureInScadenza.length} fatture in scadenza (7 giorni)
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Riepilogo fatture */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-3 border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="text-xs font-medium">Emesse Pagate</span>
                    </div>
                    <p className="text-xl font-bold mt-1">{fattureEmesse.filter(f => f.stato === 'pagata').length}</p>
                    <p className="text-xs text-muted-foreground">{formatCurrency(fattureEmesse.filter(f => f.stato === 'pagata').reduce((sum, f) => sum + parseFloat(String(f.totale || 0)), 0))}</p>
                  </div>
                  <div className="bg-red-50 dark:bg-red-950/30 rounded-lg p-3 border border-red-200 dark:border-red-800">
                    <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                      <Clock className="h-4 w-4" />
                      <span className="text-xs font-medium">Emesse Da Incassare</span>
                    </div>
                    <p className="text-xl font-bold mt-1">{fattureEmesse.filter(f => f.stato !== 'pagata').length}</p>
                    <p className="text-xs text-muted-foreground">{formatCurrency(fattureEmesse.filter(f => f.stato !== 'pagata').reduce((sum, f) => sum + parseFloat(String(f.totale || 0)), 0))}</p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-3 border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="text-xs font-medium">Ricevute Pagate</span>
                    </div>
                    <p className="text-xl font-bold mt-1">{fattureRicevute.filter(f => f.stato === 'pagata').length}</p>
                    <p className="text-xs text-muted-foreground">{formatCurrency(fattureRicevute.filter(f => f.stato === 'pagata').reduce((sum, f) => sum + parseFloat(String(f.totale || 0)), 0))}</p>
                  </div>
                  <div className="bg-amber-50 dark:bg-amber-950/30 rounded-lg p-3 border border-amber-200 dark:border-amber-800">
                    <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                      <Clock className="h-4 w-4" />
                      <span className="text-xs font-medium">Ricevute Da Pagare</span>
                    </div>
                    <p className="text-xl font-bold mt-1">{fattureRicevute.filter(f => f.stato !== 'pagata').length}</p>
                    <p className="text-xs text-muted-foreground">{formatCurrency(fattureRicevute.filter(f => f.stato !== 'pagata').reduce((sum, f) => sum + parseFloat(String(f.totale || 0)), 0))}</p>
                  </div>
                </div>

                {/* Filtri avanzati */}
                <div className="flex items-center gap-3 flex-wrap bg-muted/30 rounded-lg p-3 sticky top-0 z-10">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Filtri:</span>
                  </div>
                  <Select value={invoiceFilterStato} onValueChange={setInvoiceFilterStato}>
                    <SelectTrigger className="w-32 h-8 text-xs">
                      <SelectValue placeholder="Stato" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tutti">Tutte</SelectItem>
                      <SelectItem value="pagate">Pagate</SelectItem>
                      <SelectItem value="nonPagate">Non pagate</SelectItem>
                      <SelectItem value="bozza">Bozza</SelectItem>
                      <SelectItem value="inviata">Inviata</SelectItem>
                      <SelectItem value="parziale">Parziale</SelectItem>
                      <SelectItem value="scaduta">Scaduta</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={invoiceFilterPeriodo} onValueChange={setInvoiceFilterPeriodo}>
                    <SelectTrigger className="w-32 h-8 text-xs">
                      <SelectValue placeholder="Periodo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tutti">Tutto</SelectItem>
                      <SelectItem value="mese">Questo mese</SelectItem>
                      <SelectItem value="trimestre">Ultimi 3 mesi</SelectItem>
                      <SelectItem value="anno">Quest'anno</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Filtra cliente/fornitore..."
                    className="w-48 h-8 text-xs"
                    value={invoiceFilterCliente}
                    onChange={(e) => setInvoiceFilterCliente(e.target.value)}
                  />
                  <Select value={invoiceFilterScadenza} onValueChange={setInvoiceFilterScadenza}>
                    <SelectTrigger className="w-40 h-8 text-xs">
                      <SelectValue placeholder="Scadenza" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tutti">Tutte</SelectItem>
                      <SelectItem value="scadute">
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-red-500" />
                          Scadute
                        </span>
                      </SelectItem>
                      <SelectItem value="settimana">
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-orange-500" />
                          Entro 7 giorni
                        </span>
                      </SelectItem>
                      <SelectItem value="mese">
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-yellow-500" />
                          Entro 30 giorni
                        </span>
                      </SelectItem>
                      <SelectItem value="nonScadute">Non scadute</SelectItem>
                    </SelectContent>
                  </Select>
                  {(invoiceFilterStato !== "tutti" || invoiceFilterPeriodo !== "tutti" || invoiceFilterCliente || invoiceFilterScadenza !== "tutti") && (
                    <Button variant="ghost" size="sm" className="h-8" onClick={() => { setInvoiceFilterStato("tutti"); setInvoiceFilterPeriodo("tutti"); setInvoiceFilterCliente(""); setInvoiceFilterScadenza("tutti"); }}>
                      <X className="h-3 w-3 mr-1" />
                      Reset
                    </Button>
                  )}
                  <div className="flex-1" />
                  <Button variant="outline" size="sm" className="h-8" onClick={handleAutoReconcile} disabled={isReconciling}>
                    {isReconciling ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <RefreshCw className="h-3 w-3 mr-1" />}
                    Riconcilia
                  </Button>
                  <Button variant="outline" size="sm" className="h-8" onClick={() => setReportDialogOpen(true)}>
                    <Printer className="h-3 w-3 mr-1" />
                    Stampa Report
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="h-8">
                        <Download className="h-3 w-3 mr-1" />
                        Export
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => handleExportPDF("emesse")}>
                        <FileText className="h-4 w-4 mr-2" />
                        Export Fatture Emesse
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExportPDF("ricevute")}>
                        <FileText className="h-4 w-4 mr-2" />
                        Export Fatture Ricevute
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <Tabs defaultValue="emesse">
                  <div className="flex items-center justify-between mb-4">
                    <TabsList>
                      <TabsTrigger value="emesse">
                        <TrendingUp className="h-4 w-4 mr-2" />
                        Emesse ({fattureEmesse.length})
                      </TabsTrigger>
                      <TabsTrigger value="ricevute">
                        <TrendingDown className="h-4 w-4 mr-2" />
                        Ricevute ({fattureRicevute.length})
                      </TabsTrigger>
                      <TabsTrigger value="gantt">
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Gantt
                      </TabsTrigger>
                      <TabsTrigger value="calendario">
                        <CalendarDays className="h-4 w-4 mr-2" />
                        Calendario
                      </TabsTrigger>
                    </TabsList>
                    <div className="flex items-center gap-2">
                      <div className="relative w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Cerca fatture..."
                          className="pl-9"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>
                      <Button onClick={() => { setSelectedInvoice(null); setInvoiceTipo("emessa"); setInvoiceDialogOpen(true); }}>
                        <Plus className="h-4 w-4 mr-2" />
                        Nuova Fattura
                      </Button>
                    </div>
                  </div>

                  <TabsContent value="emesse" className="m-0">
                    {invoicesLoading ? (
                      <div className="flex justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin" />
                      </div>
                    ) : fattureEmesse.length === 0 ? (
                      <div className="text-center py-12 border rounded-lg">
                        <Receipt className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium">Nessuna fattura emessa</h3>
                        <p className="text-muted-foreground">Crea la tua prima fattura</p>
                      </div>
                    ) : (
                      <div className="border rounded-lg overflow-hidden">
                        <table className="w-full text-xs">
                          <thead className="bg-muted/50">
                            <tr>
                              <th className="text-left px-2 py-1 text-xs font-medium">Numero</th>
                              <th className="text-left px-2 py-1 text-xs font-medium">Cliente</th>
                              <th className="text-left px-2 py-1 text-xs font-medium">Data</th>
                              <th className="text-left px-2 py-1 text-xs font-medium">Scadenza</th>
                              <th className="text-left px-2 py-1 text-xs font-medium">Imponibile</th>
                              <th className="text-left px-2 py-1 text-xs font-medium">Totale</th>
                              <th className="text-left px-2 py-1 text-xs font-medium">Stato</th>
                              <th className="text-center px-2 py-1 text-xs font-medium">Banca</th>
                              <th className="text-right px-2 py-1 text-xs font-medium">Azioni</th>
                            </tr>
                          </thead>
                          <tbody>
                            {fattureEmesse.map((inv) => {
                              const stato = STATI_FATTURA.find(s => s.value === inv.stato);
                              const matchedTrans = invoiceToTransaction.get(inv.id);
                              const scadenzaStatus = getInvoiceScadenzaStatus(inv);
                              const rowBg = scadenzaStatus === 'pagata' ? 'bg-green-50/50 dark:bg-green-950/20' :
                                scadenzaStatus === 'scaduta' ? 'bg-red-50/60 dark:bg-red-950/25' :
                                  scadenzaStatus === 'settimana' ? 'bg-orange-50/50 dark:bg-orange-950/20' :
                                    scadenzaStatus === 'mese' ? 'bg-yellow-50/50 dark:bg-yellow-950/15' : '';
                              const scadenzaTextClass = scadenzaStatus === 'scaduta' ? 'text-red-600 font-semibold' :
                                scadenzaStatus === 'settimana' ? 'text-orange-600 font-medium' :
                                  scadenzaStatus === 'mese' ? 'text-yellow-600' : 'text-muted-foreground';
                              return (
                                <tr
                                  key={inv.id}
                                  className={`border-t ${rowBg} cursor-pointer hover:bg-muted/50`}
                                  onClick={() => { setInvoiceDetail(inv); setInvoiceDetailOpen(true); }}
                                >
                                  <td className="px-2 py-1 font-medium">{inv.numero}</td>
                                  <td className="px-2 py-1">{inv.ragioneSociale}</td>
                                  <td className="px-2 py-1 text-muted-foreground">{formatDate(inv.dataEmissione)}</td>
                                  <td className={`px-2 py-1 ${scadenzaTextClass}`}>
                                    <span className="flex items-center gap-1">
                                      {inv.dataScadenza ? formatDate(inv.dataScadenza) : '-'}
                                      {scadenzaStatus === 'scaduta' && <AlertCircle className="h-3 w-3 text-red-600" />}
                                      {scadenzaStatus === 'settimana' && <Clock className="h-3 w-3 text-orange-500" />}
                                    </span>
                                  </td>
                                  <td className="px-2 py-1 text-muted-foreground">{formatCurrency(inv.imponibile || 0)}</td>
                                  <td className="px-2 py-1 font-semibold">{formatCurrency(inv.totale)}</td>
                                  <td className="px-2 py-1">
                                    <Badge className={`${stato?.color} text-[10px]`}>{stato?.label}</Badge>
                                  </td>
                                  <td className="px-2 py-1 text-center" onClick={(e) => e.stopPropagation()}>
                                    {matchedTrans ? (
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-5 w-5 bg-green-100 hover:bg-green-200 text-green-700"
                                        onClick={() => { setViewTransaction(matchedTrans); setViewTransactionOpen(true); }}
                                        title={`Movimento del ${formatDate(matchedTrans.data)}: ${formatCurrency(matchedTrans.importo)}`}
                                      >
                                        <Building2 className="h-3 w-3" />
                                      </Button>
                                    ) : (
                                      <span className="text-muted-foreground text-xs">-</span>
                                    )}
                                  </td>
                                  <td className="px-2 py-1 text-right" onClick={(e) => e.stopPropagation()}>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon">
                                          <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => { setSelectedInvoice(inv); setInvoiceTipo("emessa"); setInvoiceDialogOpen(true); }}>
                                          <Edit2 className="h-4 w-4 mr-2" />
                                          Modifica
                                        </DropdownMenuItem>
                                        {inv.stato !== 'pagata' && (
                                          <DropdownMenuItem onClick={() => openPaymentDialog(inv)}>
                                            <Euro className="h-4 w-4 mr-2" />
                                            Registra Incasso
                                          </DropdownMenuItem>
                                        )}
                                        <DropdownMenuItem onClick={() => handleShare("invoice", inv.id, `Fattura ${inv.numero}`)}>
                                          <Share2 className="h-4 w-4 mr-2" />
                                          Condividi
                                        </DropdownMenuItem>
                                        {inv.stato !== 'pagata' && (
                                          <DropdownMenuItem onClick={() => { setReminderInvoice(inv); setReminderDialogOpen(true); }}>
                                            <Mail className="h-4 w-4 mr-2" />
                                            Invia Sollecito
                                          </DropdownMenuItem>
                                        )}
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                          className="text-red-600"
                                          onClick={() => deleteInvoiceMutation.mutate(inv.id)}
                                        >
                                          <Trash2 className="h-4 w-4 mr-2" />
                                          Elimina
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                          <tfoot className="bg-muted/30 border-t-2">
                            <tr>
                              <td colSpan={4} className="px-2 py-2 text-right text-xs font-semibold">Totali:</td>
                              <td className="px-2 py-2 text-xs font-bold">
                                {formatCurrency(fattureEmesse.reduce((sum, inv) => sum + parseItalianNumber(inv.imponibile || 0), 0))}
                              </td>
                              <td className="px-2 py-2 text-xs font-bold">
                                {formatCurrency(fattureEmesse.reduce((sum, inv) => sum + parseItalianNumber(inv.totale), 0))}
                              </td>
                              <td colSpan={3}></td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="ricevute" className="m-0">
                    {invoicesLoading ? (
                      <div className="flex justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin" />
                      </div>
                    ) : fattureRicevute.length === 0 ? (
                      <div className="text-center py-12 border rounded-lg">
                        <Receipt className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium">Nessuna fattura ricevuta</h3>
                        <p className="text-muted-foreground">Registra le fatture dei fornitori</p>
                        <Button
                          className="mt-4"
                          onClick={() => { setSelectedInvoice(null); setInvoiceTipo("ricevuta"); setInvoiceDialogOpen(true); }}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Aggiungi Fattura
                        </Button>
                      </div>
                    ) : (
                      <div className="border rounded-lg overflow-hidden">
                        <table className="w-full text-xs">
                          <thead className="bg-muted/50">
                            <tr>
                              <th className="text-left px-2 py-1 text-xs font-medium">Numero</th>
                              <th className="text-left px-2 py-1 text-xs font-medium">Fornitore</th>
                              <th className="text-left px-2 py-1 text-xs font-medium">Data</th>
                              <th className="text-left px-2 py-1 text-xs font-medium">Scadenza</th>
                              <th className="text-left px-2 py-1 text-xs font-medium">Imponibile</th>
                              <th className="text-left px-2 py-1 text-xs font-medium">Totale</th>
                              <th className="text-left px-2 py-1 text-xs font-medium">Stato</th>
                              <th className="text-right px-2 py-1 text-xs font-medium">Azioni</th>
                            </tr>
                          </thead>
                          <tbody>
                            {fattureRicevute.map((inv) => {
                              const stato = STATI_FATTURA.find(s => s.value === inv.stato);
                              const scadenzaStatus = getInvoiceScadenzaStatus(inv);
                              const rowBg = scadenzaStatus === 'pagata' ? 'bg-green-50/50 dark:bg-green-950/20' :
                                scadenzaStatus === 'scaduta' ? 'bg-red-50/60 dark:bg-red-950/25' :
                                  scadenzaStatus === 'settimana' ? 'bg-orange-50/50 dark:bg-orange-950/20' :
                                    scadenzaStatus === 'mese' ? 'bg-yellow-50/50 dark:bg-yellow-950/15' : '';
                              const scadenzaTextClass = scadenzaStatus === 'scaduta' ? 'text-red-600 font-semibold' :
                                scadenzaStatus === 'settimana' ? 'text-orange-600 font-medium' :
                                  scadenzaStatus === 'mese' ? 'text-yellow-600' : 'text-muted-foreground';
                              return (
                                <tr
                                  key={inv.id}
                                  className={`border-t ${rowBg} cursor-pointer hover:bg-muted/50`}
                                  onClick={() => { setInvoiceDetail(inv); setInvoiceDetailOpen(true); }}
                                >
                                  <td className="px-2 py-1 font-medium">{inv.numero}</td>
                                  <td className="px-2 py-1">{inv.ragioneSociale}</td>
                                  <td className="px-2 py-1 text-muted-foreground">{formatDate(inv.dataEmissione)}</td>
                                  <td className={`px-2 py-1 ${scadenzaTextClass}`}>
                                    <span className="flex items-center gap-1">
                                      {inv.dataScadenza ? formatDate(inv.dataScadenza) : '-'}
                                      {scadenzaStatus === 'scaduta' && <AlertCircle className="h-3 w-3 text-red-600" />}
                                      {scadenzaStatus === 'settimana' && <Clock className="h-3 w-3 text-orange-500" />}
                                    </span>
                                  </td>
                                  <td className="px-2 py-1 text-muted-foreground">{formatCurrency(inv.imponibile || 0)}</td>
                                  <td className="px-2 py-1 font-semibold">{formatCurrency(inv.totale)}</td>
                                  <td className="px-2 py-1">
                                    <Badge className={`${stato?.color} text-[10px]`}>{stato?.label}</Badge>
                                  </td>
                                  <td className="px-2 py-1 text-right" onClick={(e) => e.stopPropagation()}>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon">
                                          <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => { setSelectedInvoice(inv); setInvoiceTipo("ricevuta"); setInvoiceDialogOpen(true); }}>
                                          <Edit2 className="h-4 w-4 mr-2" />
                                          Modifica
                                        </DropdownMenuItem>
                                        {inv.stato !== 'pagata' && (
                                          <DropdownMenuItem onClick={() => openPaymentDialog(inv)}>
                                            <Euro className="h-4 w-4 mr-2" />
                                            Registra Pagamento
                                          </DropdownMenuItem>
                                        )}
                                        <DropdownMenuItem onClick={() => handleShare("invoice", inv.id, `Fattura ${inv.numero}`)}>
                                          <Share2 className="h-4 w-4 mr-2" />
                                          Condividi
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                          className="text-red-600"
                                          onClick={() => deleteInvoiceMutation.mutate(inv.id)}
                                        >
                                          <Trash2 className="h-4 w-4 mr-2" />
                                          Elimina
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                          <tfoot className="bg-muted/30 border-t-2">
                            <tr>
                              <td colSpan={4} className="px-2 py-2 text-right text-xs font-semibold">Totali:</td>
                              <td className="px-2 py-2 text-xs font-bold">
                                {formatCurrency(fattureRicevute.reduce((sum, inv) => sum + parseItalianNumber(inv.imponibile || 0), 0))}
                              </td>
                              <td className="px-2 py-2 text-xs font-bold">
                                {formatCurrency(fattureRicevute.reduce((sum, inv) => sum + parseItalianNumber(inv.totale), 0))}
                              </td>
                              <td colSpan={2}></td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="gantt" className="m-0 h-[calc(100vh-280px)]">
                    <div className="border rounded-lg p-4 h-full flex flex-col">
                      <div className="mb-3 flex items-center justify-between flex-shrink-0">
                        <div>
                          <h3 className="text-sm font-semibold">Schedulatore Fatture Emesse</h3>
                          <p className="text-xs text-muted-foreground">Visualizzazione temporale delle fatture</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Select value={ganttFilterCliente} onValueChange={setGanttFilterCliente}>
                            <SelectTrigger className="w-48 h-8 text-xs">
                              <SelectValue placeholder="Tutti i clienti" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="tutti">Tutti i clienti</SelectItem>
                              {Array.from(new Set(fattureEmesse.map(f => f.ragioneSociale))).filter(Boolean).sort().map(cliente => (
                                <SelectItem key={cliente} value={cliente!}>{cliente}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Select value={ganttFilterMese} onValueChange={setGanttFilterMese}>
                            <SelectTrigger className="w-36 h-8 text-xs">
                              <SelectValue placeholder="Tutti i mesi" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="tutti">Tutti i mesi</SelectItem>
                              {Array.from(new Set(fattureEmesse.map(f => {
                                const d = new Date(f.dataEmissione);
                                return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                              }))).sort().reverse().map(m => {
                                const [y, mo] = m.split('-');
                                return (
                                  <SelectItem key={m} value={m}>
                                    {format(new Date(parseInt(y), parseInt(mo) - 1, 1), 'MMMM yyyy', { locale: it })}
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                          {(ganttFilterCliente !== "tutti" || ganttFilterMese !== "tutti") && (
                            <Button variant="ghost" size="sm" className="h-8" onClick={() => { setGanttFilterCliente("tutti"); setGanttFilterMese("tutti"); }}>
                              <X className="h-3 w-3 mr-1" />
                              Reset
                            </Button>
                          )}
                        </div>
                      </div>

                      {(() => {
                        const filteredFatture = fattureEmesse.filter(f => {
                          if (ganttFilterCliente !== "tutti" && f.ragioneSociale !== ganttFilterCliente) return false;
                          if (ganttFilterMese !== "tutti") {
                            const d = new Date(f.dataEmissione);
                            const meseKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                            if (meseKey !== ganttFilterMese) return false;
                          }
                          return true;
                        });

                        if (filteredFatture.length === 0) {
                          return (
                            <div className="text-center py-12 flex-1 flex items-center justify-center">
                              <div>
                                <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                <p className="text-muted-foreground">Nessuna fattura da visualizzare</p>
                              </div>
                            </div>
                          );
                        }

                        const allDates = filteredFatture.flatMap(f => [
                          new Date(f.dataEmissione),
                          f.dataScadenza ? new Date(f.dataScadenza) : new Date(f.dataEmissione)
                        ]);
                        const minDate = new Date(Math.min(...allDates.map(d => d.getTime())));
                        const maxDate = new Date(Math.max(...allDates.map(d => d.getTime())));
                        minDate.setDate(1);
                        maxDate.setMonth(maxDate.getMonth() + 1, 0);
                        const totalDays = Math.max(1, Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)));

                        const months: { label: string; start: number; width: number }[] = [];
                        let currentDate = new Date(minDate);
                        while (currentDate <= maxDate) {
                          const monthStart = Math.max(0, Math.ceil((currentDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)));
                          const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
                          const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
                          const width = Math.min(daysInMonth, Math.ceil((monthEnd.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)) - monthStart + 1);
                          months.push({
                            label: format(currentDate, 'MMM yyyy', { locale: it }),
                            start: monthStart,
                            width: Math.max(1, width)
                          });
                          currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
                        }

                        return (
                          <div className="flex-1 flex flex-col min-h-0">
                            <div className="flex items-center mb-2 flex-shrink-0">
                              <div className="w-52 flex-shrink-0" />
                              <div className="flex-1 flex">
                                {months.map((m, i) => (
                                  <div
                                    key={i}
                                    className="text-[10px] font-medium text-center border-l border-muted px-1 truncate"
                                    style={{ width: `${(m.width / totalDays) * 100}%` }}
                                  >
                                    {m.label}
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="space-y-1 flex-1 overflow-y-auto min-h-0">
                              {filteredFatture.map((fattura) => {
                                const startDate = new Date(fattura.dataEmissione);
                                const endDate = fattura.dataScadenza ? new Date(fattura.dataScadenza) : startDate;
                                const startOffset = Math.max(0, (startDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
                                const duration = Math.max(1, (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
                                const leftPercent = (startOffset / totalDays) * 100;
                                const widthPercent = Math.max(1, (duration / totalDays) * 100);

                                const scadenzaStatus = getInvoiceScadenzaStatus(fattura);
                                const barColor = scadenzaStatus === 'pagata' ? 'bg-green-500' :
                                  scadenzaStatus === 'scaduta' ? 'bg-red-500' :
                                    scadenzaStatus === 'settimana' ? 'bg-orange-500' :
                                      scadenzaStatus === 'mese' ? 'bg-yellow-500' : 'bg-blue-500';

                                return (
                                  <div key={fattura.id} className="flex items-center h-8 group hover:bg-muted/50 rounded">
                                    <div className="w-52 flex-shrink-0 flex items-center gap-1 px-2 overflow-hidden">
                                      <span className="text-[9px] font-semibold text-primary whitespace-nowrap">
                                        {fattura.numero}
                                      </span>
                                      <span className="text-[10px] truncate" title={fattura.ragioneSociale}>
                                        {fattura.ragioneSociale?.substring(0, 18)}{fattura.ragioneSociale && fattura.ragioneSociale.length > 18 ? '...' : ''}
                                      </span>
                                    </div>
                                    <div className="flex-1 relative h-5 bg-muted/30 rounded">
                                      <div
                                        className={`absolute h-full ${barColor} rounded shadow-sm flex items-center justify-center overflow-hidden transition-all group-hover:opacity-90`}
                                        style={{ left: `${leftPercent}%`, width: `${widthPercent}%`, minWidth: '4px' }}
                                        title={`${fattura.numero} - ${fattura.ragioneSociale}\n${formatDate(fattura.dataEmissione)} → ${fattura.dataScadenza ? formatDate(fattura.dataScadenza) : 'N/D'}\n${formatCurrency(fattura.totale)}`}
                                      >
                                        <span className="text-[8px] text-white font-medium truncate px-1">
                                          {formatCurrency(fattura.totale)}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            <div className="flex items-center gap-4 mt-3 pt-3 border-t flex-shrink-0">
                              <span className="text-[10px] text-muted-foreground">Legenda:</span>
                              <div className="flex items-center gap-1">
                                <span className="w-3 h-3 rounded bg-green-500" />
                                <span className="text-[10px]">Pagata</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="w-3 h-3 rounded bg-red-500" />
                                <span className="text-[10px]">Scaduta</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="w-3 h-3 rounded bg-orange-500" />
                                <span className="text-[10px]">Scade entro 7gg</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="w-3 h-3 rounded bg-yellow-500" />
                                <span className="text-[10px]">Scade entro 30gg</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="w-3 h-3 rounded bg-blue-500" />
                                <span className="text-[10px]">In corso</span>
                              </div>
                              <div className="flex-1" />
                              <span className="text-[10px] text-muted-foreground">{filteredFatture.length} fatture</span>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </TabsContent>

                  <TabsContent value="calendario" className="m-0">
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCalendarMonth(subMonths(calendarMonth, 1))}>
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <h3 className="text-lg font-semibold min-w-[180px] text-center">
                            {format(calendarMonth, 'MMMM yyyy', { locale: it })}
                          </h3>
                          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCalendarMonth(addMonths(calendarMonth, 1))}>
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-4 text-xs">
                          <div className="flex items-center gap-1">
                            <span className="w-3 h-3 rounded bg-green-500" />
                            <span>Pagata</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="w-3 h-3 rounded bg-red-500" />
                            <span>Scaduta</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="w-3 h-3 rounded bg-orange-500" />
                            <span>Entro 7gg</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="w-3 h-3 rounded bg-blue-500" />
                            <span>In scadenza</span>
                          </div>
                        </div>
                      </div>

                      {(() => {
                        const monthStart = startOfMonth(calendarMonth);
                        const monthEnd = endOfMonth(calendarMonth);
                        const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

                        // Group invoices by due date
                        const allInvoices = [...fattureEmesse, ...fattureRicevute];
                        const invoicesByDate = new Map<string, typeof allInvoices>();
                        allInvoices.forEach(inv => {
                          if (inv.dataScadenza) {
                            const dateKey = format(new Date(inv.dataScadenza), 'yyyy-MM-dd');
                            if (!invoicesByDate.has(dateKey)) {
                              invoicesByDate.set(dateKey, []);
                            }
                            invoicesByDate.get(dateKey)!.push(inv);
                          }
                        });

                        // Get day of week for first day (0 = Sunday, 1 = Monday, etc)
                        const firstDayOfWeek = monthStart.getDay();
                        const startPadding = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

                        return (
                          <div>
                            <div className="grid grid-cols-7 gap-1 mb-2">
                              {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map(day => (
                                <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                                  {day}
                                </div>
                              ))}
                            </div>
                            <div className="grid grid-cols-7 gap-1">
                              {Array.from({ length: startPadding }).map((_, i) => (
                                <div key={`pad-${i}`} className="min-h-[100px] bg-muted/20 rounded" />
                              ))}
                              {days.map(day => {
                                const dateKey = format(day, 'yyyy-MM-dd');
                                const dayInvoices = invoicesByDate.get(dateKey) || [];
                                const isToday = isSameDay(day, new Date());

                                return (
                                  <div
                                    key={dateKey}
                                    className={`min-h-[100px] border rounded p-1 ${isToday ? 'border-primary border-2' : 'border-muted'}`}
                                  >
                                    <div className={`text-xs font-medium mb-1 ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>
                                      {format(day, 'd')}
                                    </div>
                                    <div className="space-y-0.5 overflow-hidden max-h-[80px]">
                                      {dayInvoices.slice(0, 3).map(inv => {
                                        const scadenzaStatus = getInvoiceScadenzaStatus(inv);
                                        const bgColor = scadenzaStatus === 'pagata' ? 'bg-green-500' :
                                          scadenzaStatus === 'scaduta' ? 'bg-red-500' :
                                            scadenzaStatus === 'settimana' ? 'bg-orange-500' : 'bg-blue-500';
                                        return (
                                          <div
                                            key={inv.id}
                                            className={`${bgColor} text-white text-[9px] px-1 py-0.5 rounded truncate cursor-pointer hover:opacity-80`}
                                            title={`${inv.numero} - ${inv.ragioneSociale}\n${formatCurrency(inv.totale)}`}
                                            onClick={() => { setSelectedInvoice(inv); setInvoiceTipo(inv.tipo as "emessa" | "ricevuta"); setInvoiceDialogOpen(true); }}
                                          >
                                            {inv.numero} - {formatCurrency(inv.totale)}
                                          </div>
                                        );
                                      })}
                                      {dayInvoices.length > 3 && (
                                        <div className="text-[9px] text-muted-foreground text-center">
                                          +{dayInvoices.length - 3} altre
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </TabsContent>
                </Tabs>
              </TabsContent>

              <TabsContent value="transazioni" className="m-0 h-[calc(100vh-220px)]">
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-4 h-full">
                  {/* Colonna sinistra: Tabella movimenti */}
                  <div className="flex flex-col gap-4 h-full min-h-0">
                    <div className="flex items-center justify-between flex-wrap gap-2 sticky top-0 bg-background z-10 py-2 -mt-2">
                      <div className="flex items-center gap-3">
                        <div className="relative w-72">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Cerca movimenti..."
                            className="pl-9"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                          />
                        </div>
                        <Select value={transactionAccountFilter} onValueChange={setTransactionAccountFilter}>
                          <SelectTrigger className="w-48 h-9">
                            <SelectValue placeholder="Tutti i conti" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="tutti">Tutti i conti</SelectItem>
                            {accounts.map(acc => (
                              <SelectItem key={acc.id} value={acc.id}>
                                {acc.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Tabs value={transactionTypeFilter} onValueChange={setTransactionTypeFilter} className="w-auto">
                          <TabsList className="h-9">
                            <TabsTrigger value="tutti" className="text-xs px-3">Tutti</TabsTrigger>
                            <TabsTrigger value="entrata" className="text-xs px-3">
                              <TrendingUp className="h-3 w-3 mr-1 text-green-600" />
                              Entrate
                            </TabsTrigger>
                            <TabsTrigger value="uscita" className="text-xs px-3">
                              <TrendingDown className="h-3 w-3 mr-1 text-red-600" />
                              Uscite
                            </TabsTrigger>
                            <TabsTrigger value="trasferimento" className="text-xs px-3">
                              <ArrowRightLeft className="h-3 w-3 mr-1 text-blue-600" />
                              Trasf.
                            </TabsTrigger>
                          </TabsList>
                        </Tabs>
                      </div>
                      <div className="flex gap-2 items-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setCompactView(!compactView)}
                          title={compactView ? "Vista completa" : "Vista compatta"}
                        >
                          {compactView ? <Expand className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant={showTrash ? "default" : "outline"}
                          size="sm"
                          onClick={() => { setShowTrash(!showTrash); if (!showTrash) refetchTrash(); }}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Cestino {trashedTransactions.length > 0 && `(${trashedTransactions.length})`}
                        </Button>
                        <BankImportDialog accounts={accounts} />
                        <Button onClick={() => { setSelectedTransaction(null); setTransactionDialogOpen(true); }}>
                          <Plus className="h-4 w-4 mr-2" />
                          Nuovo Movimento
                        </Button>
                      </div>
                    </div>

                    {showTrash ? (
                      // Vista Cestino
                      <div className="border rounded-lg overflow-hidden flex-1 overflow-y-auto min-h-0">
                        {trashedTransactions.length === 0 ? (
                          <div className="text-center py-12">
                            <Trash2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <h3 className="text-lg font-medium">Cestino vuoto</h3>
                            <p className="text-muted-foreground">Nessuna transazione eliminata</p>
                          </div>
                        ) : (
                          <table className="w-full text-xs">
                            <thead className="bg-muted/50 sticky top-0">
                              <tr>
                                <th className="text-left p-2 text-xs font-medium w-20">Data</th>
                                <th className="text-left p-2 text-xs font-medium min-w-[200px]">Descrizione</th>
                                <th className="text-right p-2 text-xs font-medium w-28">Importo</th>
                                <th className="text-right p-2 text-xs font-medium w-32">Azioni</th>
                              </tr>
                            </thead>
                            <tbody>
                              {trashedTransactions.map((trans) => (
                                <tr key={trans.id} className="border-t bg-muted/20">
                                  <td className="p-2 text-muted-foreground text-xs">{formatDate(trans.data)}</td>
                                  <td className="p-2 text-xs">{trans.descrizione?.substring(0, 50)}...</td>
                                  <td className="p-2 text-right text-xs">{formatCurrency(trans.importo)}</td>
                                  <td className="p-2 text-right">
                                    <div className="flex gap-1 justify-end">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-6 text-xs"
                                        onClick={() => restoreTransactionMutation.mutate(trans.id)}
                                      >
                                        Ripristina
                                      </Button>
                                      <Button
                                        variant="destructive"
                                        size="sm"
                                        className="h-6 text-xs"
                                        onClick={() => permanentDeleteMutation.mutate(trans.id)}
                                      >
                                        Elimina
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    ) : transactionsLoading ? (
                      <div className="flex justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin" />
                      </div>
                    ) : transactions.length === 0 ? (
                      <div className="text-center py-12 border rounded-lg">
                        <ArrowUpDown className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium">Nessun movimento</h3>
                        <p className="text-muted-foreground">Registra il tuo primo movimento</p>
                      </div>
                    ) : (
                      <div className="border rounded-lg overflow-hidden flex-1 overflow-y-auto min-h-0">
                        {selectedTransactions.size > 0 && (
                          <div className="bg-primary/10 p-2 flex items-center justify-between">
                            <span className="text-sm font-medium">{selectedTransactions.size} selezionat{selectedTransactions.size === 1 ? 'o' : 'i'}</span>
                            <div className="flex gap-2">
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                  if (confirm(`Eliminare ${selectedTransactions.size} transazioni?`)) {
                                    selectedTransactions.forEach(id => deleteTransactionMutation.mutate(id));
                                    setSelectedTransactions(new Set());
                                  }
                                }}
                              >
                                <Trash2 className="h-3 w-3 mr-1" />
                                Elimina selezionati
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedTransactions(new Set())}
                              >
                                Deseleziona
                              </Button>
                            </div>
                          </div>
                        )}
                        <table className="w-full text-xs">
                          <thead className="bg-muted/50 sticky top-0">
                            <tr>
                              <th className="text-left p-2 text-xs font-medium w-8">
                                <Checkbox
                                  checked={transactions.length > 0 && selectedTransactions.size === transactions.filter(t => t.descrizione.toLowerCase().includes(searchQuery.toLowerCase())).filter(t => transactionTypeFilter === "tutti" || t.tipo === transactionTypeFilter).filter(t => transactionAccountFilter === "tutti" || t.contoId === transactionAccountFilter).length}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      const filtered = transactions.filter(t => t.descrizione.toLowerCase().includes(searchQuery.toLowerCase())).filter(t => transactionTypeFilter === "tutti" || t.tipo === transactionTypeFilter).filter(t => transactionAccountFilter === "tutti" || t.contoId === transactionAccountFilter);
                                      setSelectedTransactions(new Set(filtered.map(t => t.id)));
                                    } else {
                                      setSelectedTransactions(new Set());
                                    }
                                  }}
                                />
                              </th>
                              <th className="text-center p-2 text-xs font-medium w-12">N.</th>
                              <th className="text-left p-2 text-xs font-medium w-20 whitespace-nowrap">Data</th>
                              <th className="text-left p-2 text-xs font-medium min-w-[200px]">Descrizione</th>
                              <th className="text-left p-2 text-xs font-medium w-28">Conto</th>
                              <th className="text-left p-2 text-xs font-medium w-24">Fattura</th>
                              <th className="text-left p-2 text-xs font-medium w-20">Tipo</th>
                              <th className="text-right p-2 text-xs font-medium w-28">Importo</th>
                              <th className="text-center p-2 text-xs font-medium w-12">Nota</th>
                              <th className="text-right p-2 text-xs font-medium w-16">Azioni</th>
                            </tr>
                          </thead>
                          <tbody>
                            {transactions
                              .filter(t => t.descrizione.toLowerCase().includes(searchQuery.toLowerCase()))
                              .filter(t => transactionTypeFilter === "tutti" || t.tipo === transactionTypeFilter)
                              .filter(t => transactionAccountFilter === "tutti" || t.contoId === transactionAccountFilter)
                              .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
                              .map((trans, index) => (
                                <tr
                                  key={trans.id}
                                  className={`border-t cursor-pointer hover:bg-muted/50 transition-colors ${selectedTransactions.has(trans.id) ? "bg-yellow-100 dark:bg-yellow-900/30" :
                                    matchedPaymentTransactions.has(trans.id) ? "" :
                                      trans.tipo === "entrata" ? "bg-green-50/30 dark:bg-green-950/10" :
                                        trans.tipo === "uscita" ? "bg-red-50/50 dark:bg-red-950/20" : ""
                                    }`}
                                  style={matchedPaymentTransactions.has(trans.id) && !selectedTransactions.has(trans.id) ? {
                                    background: 'linear-gradient(90deg, #15803d 0%, #22c55e 50%, #16a34a 100%)',
                                    color: 'white'
                                  } : undefined}
                                  onClick={() => { setViewTransaction(trans); setViewTransactionOpen(true); }}
                                >
                                  <td className="p-2" onClick={(e) => e.stopPropagation()}>
                                    <Checkbox
                                      checked={selectedTransactions.has(trans.id)}
                                      onCheckedChange={(checked) => {
                                        const newSet = new Set(selectedTransactions);
                                        if (checked) {
                                          newSet.add(trans.id);
                                        } else {
                                          newSet.delete(trans.id);
                                        }
                                        setSelectedTransactions(newSet);
                                      }}
                                    />
                                  </td>
                                  <td className={`p-2 text-center text-xs font-medium ${selectedTransactions.has(trans.id) ? 'text-foreground' : matchedPaymentTransactions.has(trans.id) ? 'text-white' : 'text-muted-foreground'}`}>{index + 1}</td>
                                  <td className={`p-2 text-xs whitespace-nowrap ${selectedTransactions.has(trans.id) ? 'text-foreground' : matchedPaymentTransactions.has(trans.id) ? 'text-white' : 'text-muted-foreground'}`}>{formatDate(trans.data)}</td>
                                  <td className="p-2">
                                    <div className="flex items-center gap-2">
                                      {matchedPaymentTransactions.has(trans.id) ? (
                                        <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 bg-white/30">
                                          <CheckCircle2 className="h-3 w-3 text-white" />
                                        </div>
                                      ) : (
                                        <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${trans.tipo === "entrata" ? "bg-green-100/70 text-green-500" :
                                          trans.tipo === "uscita" ? "bg-red-100 text-red-600" :
                                            "bg-blue-100 text-blue-600"
                                          }`}>
                                          {trans.tipo === "entrata" ? <TrendingUp className="h-3 w-3" /> :
                                            trans.tipo === "uscita" ? <TrendingDown className="h-3 w-3" /> :
                                              <ArrowRightLeft className="h-3 w-3" />}
                                        </div>
                                      )}
                                      <span className={`font-medium text-xs ${selectedTransactions.has(trans.id) ? 'text-foreground' : matchedPaymentTransactions.has(trans.id) ? 'text-white' : ''}`}>
                                        {(() => {
                                          const desc = trans.descrizione || "";
                                          if (!compactView) {
                                            return desc;
                                          }
                                          const match = desc.match(/Ordinante:\s*([^,]+)/i);
                                          if (match) {
                                            const result = `Ordinante: ${match[1].trim()}`;
                                            return result.length > 50 ? result.substring(0, 50) + "..." : result;
                                          }
                                          return desc.length > 40 ? desc.substring(0, 40) + "..." : desc;
                                        })()}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="p-2">
                                    <span className="text-xs text-muted-foreground truncate">
                                      {accounts.find(a => a.id === trans.contoId)?.nome || '-'}
                                    </span>
                                  </td>
                                  <td className="p-2">
                                    {transactionToInvoice.get(trans.id) ? (
                                      <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-700 border-blue-200">
                                        <Receipt className="h-2.5 w-2.5 mr-1" />
                                        {transactionToInvoice.get(trans.id)?.numero}
                                      </Badge>
                                    ) : (
                                      <span className="text-xs text-muted-foreground">-</span>
                                    )}
                                  </td>
                                  <td className="p-2">
                                    <Badge variant={trans.tipo === "entrata" ? "default" : trans.tipo === "uscita" ? "destructive" : "secondary"} className="text-[10px] px-1.5 py-0.5">
                                      {trans.tipo === "entrata" ? "Entrata" : trans.tipo === "uscita" ? "Uscita" : "Trasf."}
                                    </Badge>
                                  </td>
                                  <td className={`p-2 text-right font-semibold text-xs ${selectedTransactions.has(trans.id) ? "text-foreground" :
                                    matchedPaymentTransactions.has(trans.id) ? "text-white" :
                                      trans.tipo === "entrata" ? "text-green-500" :
                                        trans.tipo === "uscita" ? "text-red-600" : ""
                                    }`}>
                                    {trans.tipo === "entrata" ? "+" : trans.tipo === "uscita" ? "-" : ""}
                                    {formatCurrency(trans.importo)}
                                  </td>
                                  <td className="p-2 text-center">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className={`h-6 w-6 ${trans.note ? 'text-amber-500' : 'text-muted-foreground'}`}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setNoteTransaction(trans);
                                        setNoteText(trans.note || "");
                                        setNoteDialogOpen(true);
                                      }}
                                      title={trans.note || "Aggiungi nota"}
                                    >
                                      <StickyNote className="h-3 w-3" />
                                    </Button>
                                  </td>
                                  <td className="p-2 text-right flex gap-1 justify-end">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleShare("transaction", trans.id, trans.descrizione?.substring(0, 30) || "Transazione");
                                      }}
                                    >
                                      <Share2 className="h-3 w-3 text-blue-500" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setTransactionToDelete(trans);
                                        setDeleteConfirmOpen(true);
                                      }}
                                    >
                                      <Trash2 className="h-3 w-3 text-red-500" />
                                    </Button>
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Colonna destra: Grafici */}
                  <div className="space-y-4">
                    {(() => {
                      const monthlyData = useMemo(() => {
                        const months: { [key: string]: { entrate: number; uscite: number; mese: string } } = {};
                        transactions.forEach(trans => {
                          if (!trans.data) return;
                          const date = new Date(trans.data);
                          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                          const monthLabel = format(date, 'MMM yy', { locale: it });
                          if (!months[monthKey]) {
                            months[monthKey] = { entrate: 0, uscite: 0, mese: monthLabel };
                          }
                          const importo = parseFloat(String(trans.importo).replace(/\./g, '').replace(',', '.')) || 0;
                          if (trans.tipo === 'entrata') months[monthKey].entrate += importo;
                          else if (trans.tipo === 'uscita') months[monthKey].uscite += importo;
                        });
                        return Object.entries(months).sort(([a], [b]) => a.localeCompare(b)).map(([, data]) => data);
                      }, [transactions]);

                      const totaleEntrate = transactions.filter(t => t.tipo === 'entrata')
                        .reduce((sum, t) => sum + (parseFloat(String(t.importo).replace(/\./g, '').replace(',', '.')) || 0), 0);
                      const totaleUscite = transactions.filter(t => t.tipo === 'uscita')
                        .reduce((sum, t) => sum + (parseFloat(String(t.importo).replace(/\./g, '').replace(',', '.')) || 0), 0);

                      const pieData = [
                        { name: 'Entrate', value: totaleEntrate, color: '#22c55e' },
                        { name: 'Uscite', value: totaleUscite, color: '#ef4444' },
                      ];

                      return (
                        <>
                          {/* Riepilogo */}
                          <Card>
                            <CardContent className="p-4">
                              <div className="grid grid-cols-3 gap-1">
                                <div className="text-center p-1.5 bg-green-50 dark:bg-green-950/30 rounded">
                                  <p className="text-[9px] text-muted-foreground">Entrate</p>
                                  <p className="text-[10px] font-bold text-green-600">{formatCurrency(totaleEntrate)}</p>
                                </div>
                                <div className="text-center p-1.5 bg-red-50 dark:bg-red-950/30 rounded">
                                  <p className="text-[9px] text-muted-foreground">Uscite</p>
                                  <p className="text-[10px] font-bold text-red-600">{formatCurrency(totaleUscite)}</p>
                                </div>
                                <div className="text-center p-1.5 bg-blue-50 dark:bg-blue-950/30 rounded">
                                  <p className="text-[9px] text-muted-foreground">Bilancio</p>
                                  <p className={`text-[10px] font-bold ${totaleEntrate - totaleUscite >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {formatCurrency(totaleEntrate - totaleUscite)}
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>

                          {/* Grafico a barre */}
                          <Card>
                            <CardHeader className="p-3 pb-0">
                              <CardTitle className="text-xs flex items-center gap-2">
                                <BarChart3 className="h-4 w-4" />
                                Andamento Mensile
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="p-3">
                              {monthlyData.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground text-xs">Nessun dato</div>
                              ) : (
                                <ResponsiveContainer width="100%" height={180}>
                                  <BarChart data={monthlyData}>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                    <XAxis dataKey="mese" tick={{ fontSize: 9 }} />
                                    <YAxis tick={{ fontSize: 9 }} tickFormatter={(v) => `€${(v / 1000).toFixed(0)}k`} width={40} />
                                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                                    <Bar dataKey="entrate" name="Entrate" fill="#22c55e" radius={[2, 2, 0, 0]} />
                                    <Bar dataKey="uscite" name="Uscite" fill="#ef4444" radius={[2, 2, 0, 0]} />
                                  </BarChart>
                                </ResponsiveContainer>
                              )}
                            </CardContent>
                          </Card>

                          {/* Grafico a torta */}
                          <Card>
                            <CardHeader className="p-3 pb-0">
                              <CardTitle className="text-xs flex items-center gap-2">
                                <PiggyBank className="h-4 w-4" />
                                Distribuzione
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="p-3">
                              {totaleEntrate === 0 && totaleUscite === 0 ? (
                                <div className="text-center py-8 text-muted-foreground text-xs">Nessun dato</div>
                              ) : (
                                <ResponsiveContainer width="100%" height={180}>
                                  <PieChart>
                                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={5} dataKey="value">
                                      {pieData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                                    </Pie>
                                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                                    <Legend wrapperStyle={{ fontSize: '10px' }} />
                                  </PieChart>
                                </ResponsiveContainer>
                              )}
                            </CardContent>
                          </Card>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="scadenze" className="m-0 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-semibold">Scadenze e Aging Report</h2>
                    <p className="text-xs text-muted-foreground">Analisi temporale crediti e debiti</p>
                  </div>
                </div>

                {/* Alert fatture scadute */}
                {fattureScadute.length > 0 && (
                  <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <div className="flex-1">
                        <h3 className="text-xs font-semibold text-red-700 dark:text-red-400">
                          {fattureScadute.length} fattur{fattureScadute.length === 1 ? 'a scaduta' : 'e scadute'}
                        </h3>
                        <p className="text-xs text-red-600 dark:text-red-400">
                          Totale: {formatCurrency(fattureScadute.reduce((sum, f) => sum + parseItalianNumber(f.totale), 0))}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs border-red-300 text-red-700 hover:bg-red-100"
                        onClick={() => { setActiveTab("fatture"); setInvoiceFilterScadenza("scadute"); }}
                      >
                        Visualizza
                      </Button>
                    </div>
                  </div>
                )}

                {/* Alert fatture in scadenza */}
                {fattureInScadenza.length > 0 && (
                  <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-orange-600" />
                      <div className="flex-1">
                        <h3 className="text-xs font-semibold text-orange-700 dark:text-orange-400">
                          {fattureInScadenza.length} fattur{fattureInScadenza.length === 1 ? 'a in scadenza' : 'e in scadenza'} entro 7 giorni
                        </h3>
                        <p className="text-xs text-orange-600 dark:text-orange-400">
                          Totale: {formatCurrency(fattureInScadenza.reduce((sum, f) => sum + parseItalianNumber(f.totale), 0))}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs border-orange-300 text-orange-700 hover:bg-orange-100"
                        onClick={() => { setActiveTab("fatture"); setInvoiceFilterScadenza("settimana"); }}
                      >
                        Visualizza
                      </Button>
                    </div>
                  </div>
                )}

                {/* Aging Report */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Crediti (Fatture Emesse) */}
                  <Card>
                    <CardHeader className="pb-2 p-3">
                      <CardTitle className="flex items-center gap-2 text-xs">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        Aging Crediti (Fatture Emesse)
                      </CardTitle>
                      <CardDescription className="text-xs">Suddivisione per anzianità</CardDescription>
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500" />
                            <span className="text-xs font-medium">Non scadute</span>
                          </div>
                          <span className="text-xs font-semibold">{formatCurrency(agingReport.crediti.correnti)}</span>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg border border-yellow-200 dark:border-yellow-800">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-yellow-500" />
                            <span className="text-xs font-medium">Scadute 1-30 gg</span>
                          </div>
                          <span className="text-xs font-semibold">{formatCurrency(agingReport.crediti.scadute30)}</span>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-orange-50 dark:bg-orange-950/30 rounded-lg border border-orange-200 dark:border-orange-800">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-orange-500" />
                            <span className="text-xs font-medium">Scadute 31-60 gg</span>
                          </div>
                          <span className="text-xs font-semibold">{formatCurrency(agingReport.crediti.scadute60)}</span>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-800">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-red-500" />
                            <span className="text-xs font-medium">Scadute oltre 60 gg</span>
                          </div>
                          <span className="text-xs font-semibold">{formatCurrency(agingReport.crediti.scadute90)}</span>
                        </div>
                        <div className="border-t pt-2 flex items-center justify-between">
                          <span className="text-xs font-semibold">Totale Crediti</span>
                          <span className="text-sm font-bold text-green-600">
                            {formatCurrency(agingReport.crediti.correnti + agingReport.crediti.scadute30 + agingReport.crediti.scadute60 + agingReport.crediti.scadute90)}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Debiti (Fatture Ricevute) */}
                  <Card>
                    <CardHeader className="pb-2 p-3">
                      <CardTitle className="flex items-center gap-2 text-xs">
                        <TrendingDown className="h-4 w-4 text-red-600" />
                        Aging Debiti (Fatture Ricevute)
                      </CardTitle>
                      <CardDescription className="text-xs">Suddivisione per anzianità</CardDescription>
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500" />
                            <span className="text-xs font-medium">Non scadute</span>
                          </div>
                          <span className="text-xs font-semibold">{formatCurrency(agingReport.debiti.correnti)}</span>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg border border-yellow-200 dark:border-yellow-800">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-yellow-500" />
                            <span className="text-xs font-medium">Scadute 1-30 gg</span>
                          </div>
                          <span className="text-xs font-semibold">{formatCurrency(agingReport.debiti.scadute30)}</span>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-orange-50 dark:bg-orange-950/30 rounded-lg border border-orange-200 dark:border-orange-800">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-orange-500" />
                            <span className="text-xs font-medium">Scadute 31-60 gg</span>
                          </div>
                          <span className="text-xs font-semibold">{formatCurrency(agingReport.debiti.scadute60)}</span>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-800">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-red-500" />
                            <span className="text-xs font-medium">Scadute oltre 60 gg</span>
                          </div>
                          <span className="text-xs font-semibold">{formatCurrency(agingReport.debiti.scadute90)}</span>
                        </div>
                        <div className="border-t pt-2 flex items-center justify-between">
                          <span className="text-xs font-semibold">Totale Debiti</span>
                          <span className="text-sm font-bold text-red-600">
                            {formatCurrency(agingReport.debiti.correnti + agingReport.debiti.scadute30 + agingReport.debiti.scadute60 + agingReport.debiti.scadute90)}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Lista fatture scadute */}
                {fattureScadute.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2 p-3">
                      <CardTitle className="flex items-center gap-2 text-xs">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        Dettaglio Fatture Scadute
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="border rounded-lg overflow-hidden">
                        <table className="w-full text-xs">
                          <thead className="bg-muted/50">
                            <tr>
                              <th className="text-left px-2 py-1.5 font-medium">Numero</th>
                              <th className="text-left px-2 py-1.5 font-medium">Cliente/Fornitore</th>
                              <th className="text-left px-2 py-1.5 font-medium">Tipo</th>
                              <th className="text-left px-2 py-1.5 font-medium">Scadenza</th>
                              <th className="text-left px-2 py-1.5 font-medium">Giorni</th>
                              <th className="text-right px-2 py-1.5 font-medium">Importo</th>
                            </tr>
                          </thead>
                          <tbody>
                            {fattureScadute.map((inv) => {
                              const oggi = new Date();
                              const scadenza = new Date(inv.dataScadenza!);
                              const giorniScaduti = Math.ceil((oggi.getTime() - scadenza.getTime()) / (1000 * 60 * 60 * 24));
                              return (
                                <tr key={inv.id} className="border-t bg-red-50/50 dark:bg-red-950/20">
                                  <td className="px-2 py-1.5 font-medium">{inv.numero}</td>
                                  <td className="px-2 py-1.5">{inv.ragioneSociale}</td>
                                  <td className="px-2 py-1.5">
                                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${inv.tipo === 'emessa' ? 'border-green-500 text-green-700' : 'border-blue-500 text-blue-700'}`}>
                                      {inv.tipo === 'emessa' ? 'Credito' : 'Debito'}
                                    </Badge>
                                  </td>
                                  <td className="px-2 py-1.5 text-red-600">{formatDate(inv.dataScadenza!)}</td>
                                  <td className="px-2 py-1.5">
                                    <span className="text-red-600 font-semibold">+{giorniScaduti} gg</span>
                                  </td>
                                  <td className="px-2 py-1.5 text-right font-semibold">{formatCurrency(inv.totale)}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="documenti" className="m-0 space-y-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold">Archivio Documenti Finanziari</h2>
                    <p className="text-sm text-muted-foreground">
                      Gestisci fatture, utenze, cedolini e contratti
                    </p>
                  </div>
                  <Button onClick={() => setDocUploadDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Carica Documento
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="cursor-pointer hover:shadow-lg transition-shadow border-l-4 border-l-blue-500">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Receipt className="h-5 w-5 text-blue-500" />
                        Fatture
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">{docCounts.fatture}</p>
                      <p className="text-sm text-muted-foreground">documenti archiviati</p>
                    </CardContent>
                  </Card>

                  <Card className="cursor-pointer hover:shadow-lg transition-shadow border-l-4 border-l-cyan-500">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <FileText className="h-5 w-5 text-cyan-500" />
                        Ri.Ba.
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">{docCounts.riba}</p>
                      <p className="text-sm text-muted-foreground">ricevute bancarie</p>
                    </CardContent>
                  </Card>

                  <Card className="cursor-pointer hover:shadow-lg transition-shadow border-l-4 border-l-slate-500">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <File className="h-5 w-5 text-slate-500" />
                        Documento
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">{docCounts.documenti}</p>
                      <p className="text-sm text-muted-foreground">documenti generici</p>
                    </CardContent>
                  </Card>

                  <Card className="cursor-pointer hover:shadow-lg transition-shadow border-l-4 border-l-purple-500">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Briefcase className="h-5 w-5 text-purple-500" />
                        Contratti
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">{docCounts.contratti}</p>
                      <p className="text-sm text-muted-foreground">contratti archiviati</p>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <FolderOpen className="h-5 w-5" />
                        Documenti Recenti ({financeDocuments.length})
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input placeholder="Cerca documenti..." className="pl-9 w-64" />
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {financeDocuments.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <h3 className="text-lg font-medium">Nessun documento</h3>
                        <p>Carica il primo documento per iniziare l'archiviazione</p>
                        <Button className="mt-4" onClick={() => setDocUploadDialogOpen(true)}>
                          <Upload className="h-4 w-4 mr-2" />
                          Carica Documento
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-10"></TableHead>
                              <TableHead>Nome</TableHead>
                              <TableHead>Categoria</TableHead>
                              <TableHead>Data</TableHead>
                              <TableHead className="text-right">Dimensione</TableHead>
                              <TableHead className="w-20"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {financeDocuments.slice(0, 20).map(doc => (
                              <TableRow key={doc.id} className="text-sm">
                                <TableCell>
                                  {doc.mimeType?.includes("pdf") ? (
                                    <FileText className="h-4 w-4 text-red-500" />
                                  ) : doc.mimeType?.includes("image") ? (
                                    <Image className="h-4 w-4 text-blue-500" />
                                  ) : doc.mimeType?.includes("spreadsheet") || doc.mimeType?.includes("excel") ? (
                                    <FileSpreadsheet className="h-4 w-4 text-green-500" />
                                  ) : (
                                    <File className="h-4 w-4 text-gray-500" />
                                  )}
                                </TableCell>
                                <TableCell className="font-medium">{doc.name}</TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="text-xs">
                                    {doc.category}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                  {doc.createdAt ? format(new Date(doc.createdAt), "dd/MM/yyyy", { locale: it }) : "-"}
                                </TableCell>
                                <TableCell className="text-right text-muted-foreground">
                                  {doc.size ? `${(doc.size / 1024).toFixed(1)} KB` : "-"}
                                </TableCell>
                                <TableCell>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => window.open(`/api/archive/${doc.id}/download`, '_blank')}
                                  >
                                    <Download className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                        {financeDocuments.length > 20 && (
                          <p className="text-center text-sm text-muted-foreground pt-2">
                            Mostrati 20 di {financeDocuments.length} documenti
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="import" className="m-0 space-y-4 text-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="border-2 border-dashed">
                    <CardHeader className="py-3">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <FileSpreadsheet className="h-4 w-4" />
                        Import Manuale
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-0">
                      <p className="text-xs text-muted-foreground">
                        Carica un file CSV o Excel esportato dalla tua banca per importare i movimenti.
                      </p>

                      <div>
                        <Label>Conto di destinazione</Label>
                        <Select value={importAccountId} onValueChange={setImportAccountId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleziona il conto" />
                          </SelectTrigger>
                          <SelectContent>
                            {accounts.map(acc => (
                              <SelectItem key={acc.id} value={acc.id}>
                                <span className="flex items-center gap-2">
                                  <span
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: acc.colore || "#3B82F6" }}
                                  />
                                  {acc.nome}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${importAccountId ? "hover:border-primary/50 cursor-pointer" : "opacity-50 cursor-not-allowed"}`}>
                        <input
                          type="file"
                          id="bank-import-file"
                          accept=".csv,.xlsx,.xls,.cbi,.txt"
                          className="hidden"
                          disabled={!importAccountId || isImporting}
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file || !importAccountId) return;

                            setIsImporting(true);
                            setImportProgress(0);
                            const formData = new FormData();
                            formData.append("file", file);
                            formData.append("accountId", importAccountId);

                            const xhr = new XMLHttpRequest();

                            xhr.upload.addEventListener("progress", (event) => {
                              if (event.lengthComputable) {
                                const percent = Math.round((event.loaded / event.total) * 100);
                                setImportProgress(percent);
                              }
                            });

                            xhr.addEventListener("load", () => {
                              try {
                                const result = JSON.parse(xhr.responseText);
                                if (xhr.status === 200) {
                                  toast({
                                    title: "Importazione completata",
                                    description: `${result.imported} movimenti importati da ${result.filename}`
                                  });
                                  queryClient.invalidateQueries({ queryKey: ["/api/finance/transactions"] });
                                  queryClient.invalidateQueries({ queryKey: ["/api/finance/stats"] });
                                } else {
                                  toast({
                                    title: "Errore",
                                    description: result.error || "Errore durante l'importazione",
                                    variant: "destructive"
                                  });
                                }
                              } catch {
                                toast({
                                  title: "Errore",
                                  description: "Errore durante l'elaborazione",
                                  variant: "destructive"
                                });
                              } finally {
                                setIsImporting(false);
                                setImportProgress(0);
                                e.target.value = "";
                              }
                            });

                            xhr.addEventListener("error", () => {
                              toast({
                                title: "Errore",
                                description: "Errore di connessione",
                                variant: "destructive"
                              });
                              setIsImporting(false);
                              setImportProgress(0);
                              e.target.value = "";
                            });

                            xhr.open("POST", "/api/finance/import-bank");
                            xhr.setRequestHeader("x-user-id", user?.id || "");
                            xhr.send(formData);
                          }}
                        />
                        <label htmlFor="bank-import-file" className={importAccountId ? "cursor-pointer" : "cursor-not-allowed"}>
                          {isImporting ? (
                            <div className="space-y-3">
                              <Loader2 className="h-10 w-10 mx-auto text-primary animate-spin" />
                              <div className="space-y-2">
                                <Progress value={importProgress} className="h-3" />
                                <p className="text-sm font-medium">{importProgress}% completato</p>
                              </div>
                            </div>
                          ) : (
                            <>
                              <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                              <p className="font-medium">Trascina qui il file o clicca per selezionare</p>
                              <p className="text-sm text-muted-foreground mt-1">
                                {importAccountId ? "Formati supportati: CSV, XLSX, XLS, CBI, PDF (Ri.Ba.)" : "Prima seleziona il conto di destinazione"}
                              </p>
                            </>
                          )}
                        </label>
                      </div>

                      <div className="bg-muted/50 rounded-lg p-3">
                        <h4 className="font-medium mb-1 flex items-center gap-2 text-xs">
                          <AlertTriangle className="h-3 w-3 text-amber-500" />
                          Formati supportati
                        </h4>
                        <ul className="text-xs text-muted-foreground space-y-0.5">
                          <li>• Intesa Sanpaolo, UniCredit, BNL, Banca Sella</li>
                          <li>• Formato generico: Data, Descrizione, Importo</li>
                        </ul>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="py-3">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Link2 className="h-4 w-4" />
                        Open Banking (Plaid)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-0">
                      <p className="text-xs text-muted-foreground">
                        Collega il tuo conto corrente per sincronizzare automaticamente i movimenti.
                      </p>

                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-lg p-4 text-center">
                        <Building2 className="h-8 w-8 mx-auto text-blue-600 mb-2" />
                        <h4 className="font-semibold mb-1 text-sm">Collegamento Sicuro PSD2</h4>
                        <p className="text-xs text-muted-foreground mb-3">
                          Accedi in sola lettura ai tuoi movimenti bancari.
                        </p>
                        <Button className="w-full" size="sm" disabled>
                          <Link2 className="h-3 w-3 mr-2" />
                          Collega Conto Bancario
                        </Button>
                        <p className="text-xs text-muted-foreground mt-1">
                          Richiede configurazione API Plaid
                        </p>
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-medium flex items-center gap-2 text-xs">
                          <Check className="h-3 w-3 text-green-500" />
                          Vantaggi Open Banking
                        </h4>
                        <ul className="text-xs text-muted-foreground space-y-1">
                          <li className="flex items-center gap-1">
                            <RefreshCw className="h-3 w-3" />
                            Sincronizzazione automatica
                          </li>
                          <li className="flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Riconciliazione fatture
                          </li>
                          <li className="flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" />
                            Analisi cash flow
                          </li>
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Import Fatture */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="border-2 border-dashed border-green-200 dark:border-green-800">
                    <CardHeader className="py-3">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <ScrollText className="h-4 w-4 text-green-600" />
                        Import Fatture XML (SDI)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-0">
                      <p className="text-xs text-muted-foreground">
                        Importa fatture elettroniche nel formato XML FatturaPA del Sistema di Interscambio.
                      </p>

                      <div className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors hover:border-green-500/50 cursor-pointer`}>
                        <input
                          type="file"
                          id="invoice-xml-import-file"
                          accept=".xml"
                          multiple
                          className="hidden"
                          disabled={isImportingXml}
                          onChange={(e) => {
                            const files = e.target.files;
                            if (!files || files.length === 0) return;

                            setIsImportingXml(true);
                            setXmlImportProgress(0);
                            const formData = new FormData();
                            for (let i = 0; i < files.length; i++) {
                              formData.append("files", files[i]);
                            }
                            formData.append("format", "xml");

                            const xhr = new XMLHttpRequest();

                            xhr.upload.addEventListener("progress", (event) => {
                              if (event.lengthComputable) {
                                const percent = Math.round((event.loaded / event.total) * 100);
                                setXmlImportProgress(percent);
                              }
                            });

                            xhr.addEventListener("load", () => {
                              try {
                                const result = JSON.parse(xhr.responseText);
                                if (xhr.status === 200 && result.imported > 0) {
                                  toast({
                                    title: "Importazione completata",
                                    description: `${result.imported} fatture importate`
                                  });
                                  queryClient.invalidateQueries({ queryKey: ["/api/finance/invoices"] });
                                } else if (xhr.status === 200 && result.imported === 0) {
                                  toast({
                                    title: "Nessuna fattura importata",
                                    description: "I file non contengono dati validi o il formato non è riconosciuto",
                                    variant: "destructive"
                                  });
                                } else {
                                  toast({
                                    title: "Errore importazione",
                                    description: result.error || "Errore durante l'importazione",
                                    variant: "destructive"
                                  });
                                }
                              } catch {
                                toast({
                                  title: "Errore",
                                  description: "Errore durante l'elaborazione",
                                  variant: "destructive"
                                });
                              } finally {
                                setIsImportingXml(false);
                                setXmlImportProgress(0);
                                e.target.value = "";
                              }
                            });

                            xhr.addEventListener("error", () => {
                              toast({
                                title: "Errore",
                                description: "Errore di connessione",
                                variant: "destructive"
                              });
                              setIsImportingXml(false);
                              setXmlImportProgress(0);
                              e.target.value = "";
                            });

                            xhr.open("POST", "/api/finance/import-invoices");
                            xhr.setRequestHeader("x-user-id", user?.id || "");
                            xhr.send(formData);
                          }}
                        />
                        <label
                          htmlFor="invoice-xml-import-file"
                          className="cursor-pointer"
                        >
                          {isImportingXml ? (
                            <div className="space-y-3">
                              <Loader2 className="h-10 w-10 mx-auto animate-spin text-green-600" />
                              <div className="space-y-2">
                                <Progress value={xmlImportProgress} className="h-3" />
                                <p className="text-sm font-medium">{xmlImportProgress}% completato</p>
                              </div>
                            </div>
                          ) : (
                            <>
                              <Upload className="h-10 w-10 mx-auto mb-3 text-green-600" />
                              <p className="font-medium">Clicca per caricare fatture XML</p>
                              <p className="text-sm text-muted-foreground mt-1">
                                Formato FatturaPA (.xml) - Puoi selezionare più file
                              </p>
                            </>
                          )}
                        </label>
                      </div>

                      <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-3">
                        <h4 className="font-medium mb-1 flex items-center gap-2 text-green-700 dark:text-green-400 text-xs">
                          <FileCheck className="h-3 w-3" />
                          Formato FatturaPA
                        </h4>
                        <ul className="text-xs text-muted-foreground space-y-0.5">
                          <li>• Fatture scaricate da SDI (XML)</li>
                          <li>• Estrae: numero, data, importo, fornitore</li>
                        </ul>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-2 border-dashed border-blue-200 dark:border-blue-800">
                    <CardHeader className="py-3">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <FileSpreadsheet className="h-4 w-4 text-blue-600" />
                        Import Fatture CSV
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-0">
                      <p className="text-xs text-muted-foreground">
                        Importa fatture da un file CSV con colonne personalizzabili.
                      </p>

                      <div className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors hover:border-blue-500/50 cursor-pointer`}>
                        <input
                          type="file"
                          id="invoice-csv-import-file"
                          accept=".csv"
                          className="hidden"
                          disabled={isImportingCsv}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;

                            setIsImportingCsv(true);
                            setCsvImportProgress(0);
                            const formData = new FormData();
                            formData.append("files", file);
                            formData.append("format", "csv");

                            const xhr = new XMLHttpRequest();

                            xhr.upload.addEventListener("progress", (event) => {
                              if (event.lengthComputable) {
                                const percent = Math.round((event.loaded / event.total) * 100);
                                setCsvImportProgress(percent);
                              }
                            });

                            xhr.addEventListener("load", () => {
                              try {
                                const result = JSON.parse(xhr.responseText);
                                if (xhr.status === 200 && result.imported > 0) {
                                  toast({
                                    title: "Importazione completata",
                                    description: `${result.imported} fatture importate`
                                  });
                                  queryClient.invalidateQueries({ queryKey: ["/api/finance/invoices"] });
                                } else if (xhr.status === 200 && result.imported === 0) {
                                  toast({
                                    title: "Nessuna fattura importata",
                                    description: "Il file non contiene dati validi o il formato non è riconosciuto",
                                    variant: "destructive"
                                  });
                                } else {
                                  toast({
                                    title: "Errore importazione",
                                    description: result.error || "Errore durante l'importazione",
                                    variant: "destructive"
                                  });
                                }
                              } catch {
                                toast({
                                  title: "Errore",
                                  description: "Errore durante l'elaborazione",
                                  variant: "destructive"
                                });
                              } finally {
                                setIsImportingCsv(false);
                                setCsvImportProgress(0);
                                e.target.value = "";
                              }
                            });

                            xhr.addEventListener("error", () => {
                              toast({
                                title: "Errore",
                                description: "Errore di connessione",
                                variant: "destructive"
                              });
                              setIsImportingCsv(false);
                              setCsvImportProgress(0);
                              e.target.value = "";
                            });

                            xhr.open("POST", "/api/finance/import-invoices");
                            xhr.setRequestHeader("x-user-id", user?.id || "");
                            xhr.send(formData);
                          }}
                        />
                        <label
                          htmlFor="invoice-csv-import-file"
                          className="cursor-pointer"
                        >
                          {isImportingCsv ? (
                            <div className="space-y-3">
                              <Loader2 className="h-10 w-10 mx-auto animate-spin text-blue-600" />
                              <div className="space-y-2">
                                <Progress value={csvImportProgress} className="h-3" />
                                <p className="text-sm font-medium">{csvImportProgress}% completato</p>
                              </div>
                            </div>
                          ) : (
                            <>
                              <Upload className="h-10 w-10 mx-auto mb-3 text-blue-600" />
                              <p className="font-medium">Clicca per caricare fatture CSV</p>
                              <p className="text-sm text-muted-foreground mt-1">
                                File CSV con separatore virgola o punto e virgola
                              </p>
                            </>
                          )}
                        </label>
                      </div>

                      <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3">
                        <h4 className="font-medium mb-1 flex items-center gap-2 text-blue-700 dark:text-blue-400 text-xs">
                          <AlertTriangle className="h-3 w-3" />
                          Colonne richieste
                        </h4>
                        <ul className="text-xs text-muted-foreground space-y-0.5">
                          <li>• numero, data, fornitore/cliente, importo, tipo</li>
                        </ul>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="md:col-span-2">
                    <CardHeader className="py-3">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <FileSpreadsheet className="h-4 w-4 text-purple-600" />
                        Import Fatture XLSX (SEAC Azienda Web)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-0">
                      <p className="text-xs text-muted-foreground">
                        Importa fatture dal portale SEAC Azienda Web in formato Excel.
                      </p>

                      <div className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors hover:border-purple-500/50 cursor-pointer`}>
                        <input
                          type="file"
                          id="invoice-xlsx-import-file"
                          accept=".xlsx,.xls"
                          className="hidden"
                          disabled={isImportingXlsx}
                          onChange={(e) => {
                            if (!e.target.files?.[0]) return;
                            setIsImportingXlsx(true);
                            setXlsxImportProgress(0);
                            const formData = new FormData();
                            formData.append("file", e.target.files[0]);
                            formData.append("format", "xlsx");

                            const xhr = new XMLHttpRequest();

                            xhr.upload.addEventListener("progress", (event) => {
                              if (event.lengthComputable) {
                                const percent = Math.round((event.loaded / event.total) * 100);
                                setXlsxImportProgress(percent);
                              }
                            });

                            xhr.addEventListener("load", () => {
                              try {
                                const result = JSON.parse(xhr.responseText);
                                if (xhr.status === 200 && result.imported > 0) {
                                  toast({
                                    title: "Importazione completata",
                                    description: `${result.imported} fatture importate da SEAC`
                                  });
                                  queryClient.invalidateQueries({ queryKey: ["/api/finance/invoices"] });
                                } else if (xhr.status === 200 && result.imported === 0) {
                                  toast({
                                    title: "Nessuna fattura importata",
                                    description: "Il file non contiene dati validi",
                                    variant: "destructive"
                                  });
                                } else {
                                  toast({
                                    title: "Errore importazione",
                                    description: result.error || "Errore durante l'importazione",
                                    variant: "destructive"
                                  });
                                }
                              } catch {
                                toast({
                                  title: "Errore",
                                  description: "Errore durante l'elaborazione",
                                  variant: "destructive"
                                });
                              } finally {
                                setIsImportingXlsx(false);
                                setXlsxImportProgress(0);
                                e.target.value = "";
                              }
                            });

                            xhr.addEventListener("error", () => {
                              toast({
                                title: "Errore",
                                description: "Errore di connessione",
                                variant: "destructive"
                              });
                              setIsImportingXlsx(false);
                              setXlsxImportProgress(0);
                              e.target.value = "";
                            });

                            xhr.open("POST", "/api/finance/import-invoices");
                            xhr.setRequestHeader("x-user-id", user?.id || "");
                            xhr.send(formData);
                          }}
                        />
                        <label
                          htmlFor="invoice-xlsx-import-file"
                          className="cursor-pointer"
                        >
                          {isImportingXlsx ? (
                            <div className="space-y-3">
                              <Loader2 className="h-10 w-10 mx-auto animate-spin text-purple-600" />
                              <div className="space-y-2">
                                <Progress value={xlsxImportProgress} className="h-3" />
                                <p className="text-sm font-medium">{xlsxImportProgress}% completato</p>
                              </div>
                            </div>
                          ) : (
                            <>
                              <Upload className="h-10 w-10 mx-auto mb-3 text-purple-600" />
                              <p className="font-medium">Clicca per caricare export SEAC (.xlsx)</p>
                              <p className="text-sm text-muted-foreground mt-1">
                                File Excel esportato da SEAC Azienda Web
                              </p>
                            </>
                          )}
                        </label>
                      </div>

                      <div className="bg-purple-50 dark:bg-purple-950/30 rounded-lg p-4">
                        <h4 className="font-medium mb-2 flex items-center gap-2 text-purple-700 dark:text-purple-400">
                          <Building2 className="h-4 w-4" />
                          Come esportare da SEAC
                        </h4>
                        <ol className="text-sm text-muted-foreground space-y-1 list-decimal ml-4">
                          <li>Vai su aziendaweb.seac.it → Fatturazione → Documento vendita emesso</li>
                          <li>Seleziona il periodo desiderato</li>
                          <li>Clicca su "Esporta" o "Export"</li>
                          <li>Scarica il file .xlsx e caricalo qui</li>
                        </ol>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Ultime Importazioni
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                      <FileSpreadsheet className="h-10 w-10 mx-auto mb-3 opacity-50" />
                      <p>Nessuna importazione effettuata</p>
                      <p className="text-sm">Le importazioni recenti appariranno qui</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="integrazioni" className="m-0 space-y-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="text-base font-semibold">Configurazione Integrazioni</h2>
                    <p className="text-xs text-muted-foreground">
                      Collega i tuoi servizi bancari e di fatturazione elettronica
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="py-3 px-4">
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-sm">
                          <Building2 className="h-4 w-4 text-blue-600" />
                          Plaid - Open Banking
                        </CardTitle>
                        <Badge variant="outline" className="text-xs text-amber-600 border-amber-600">
                          Non configurato
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3 px-4 pb-4 pt-0">
                      <p className="text-xs text-muted-foreground">
                        Collega i tuoi conti bancari per sincronizzare automaticamente i movimenti in tempo reale tramite Open Banking PSD2.
                      </p>

                      <div className="space-y-2">
                        <div>
                          <Label className="text-xs">Client ID</Label>
                          <Input className="h-8 text-xs" placeholder="Inserisci il Plaid Client ID" />
                        </div>
                        <div>
                          <Label className="text-xs">Secret Key</Label>
                          <Input className="h-8 text-xs" type="password" placeholder="Inserisci la Plaid Secret Key" />
                        </div>
                        <div>
                          <Label className="text-xs">Ambiente</Label>
                          <Select defaultValue="sandbox">
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="sandbox" className="text-xs">Sandbox (Test)</SelectItem>
                              <SelectItem value="development" className="text-xs">Development</SelectItem>
                              <SelectItem value="production" className="text-xs">Production</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3">
                        <h4 className="font-medium text-xs mb-1">Come ottenere le credenziali</h4>
                        <ol className="text-xs text-muted-foreground space-y-0.5 list-decimal list-inside">
                          <li>Registrati su <a href="https://dashboard.plaid.com/signup" target="_blank" rel="noopener" className="text-blue-600 underline">dashboard.plaid.com</a></li>
                          <li>Crea un nuovo progetto</li>
                          <li>Copia Client ID e Secret dalla dashboard</li>
                          <li>Inizia con ambiente Sandbox per i test</li>
                        </ol>
                      </div>

                      <div className="flex gap-2">
                        <Button className="flex-1 h-8 text-xs" disabled>
                          <Check className="h-3 w-3 mr-1" />
                          Salva Configurazione
                        </Button>
                        <Button variant="outline" className="h-8 text-xs" disabled>
                          Test Connessione
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="py-3 px-4">
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-sm">
                          <FileText className="h-4 w-4 text-green-600" />
                          SDI - Fatturazione Elettronica
                        </CardTitle>
                        <Badge variant="outline" className="text-xs text-amber-600 border-amber-600">
                          Non configurato
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3 px-4 pb-4 pt-0">
                      <p className="text-xs text-muted-foreground">
                        Configura la connessione al Sistema di Interscambio per inviare e ricevere fatture elettroniche.
                      </p>

                      <div>
                        <Label className="text-xs">Provider SDI</Label>
                        <Select defaultValue="">
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Seleziona il provider" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="aruba" className="text-xs">Aruba Fatturazione</SelectItem>
                            <SelectItem value="openapi" className="text-xs">OpenAPI.com</SelectItem>
                            <SelectItem value="invoicetronic" className="text-xs">Invoicetronic</SelectItem>
                            <SelectItem value="fattureincloud" className="text-xs">Fatture in Cloud</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <div>
                          <Label className="text-xs">Partita IVA</Label>
                          <Input className="h-8 text-xs" placeholder="IT12345678901" />
                        </div>
                        <div>
                          <Label className="text-xs">Codice Destinatario SDI</Label>
                          <Input className="h-8 text-xs" placeholder="XXXXXXX (7 caratteri)" maxLength={7} />
                        </div>
                        <div>
                          <Label className="text-xs">API Key / Username</Label>
                          <Input className="h-8 text-xs" placeholder="Credenziali del provider" />
                        </div>
                        <div>
                          <Label className="text-xs">API Secret / Password</Label>
                          <Input className="h-8 text-xs" type="password" placeholder="Password del provider" />
                        </div>
                      </div>

                      <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-3">
                        <h4 className="font-medium text-xs mb-1">Provider consigliati</h4>
                        <ul className="text-xs text-muted-foreground space-y-0.5">
                          <li><strong>Aruba:</strong> Se usi già Aruba per email/PEC</li>
                          <li><strong>OpenAPI:</strong> Professionale, tutto incluso</li>
                          <li><strong>Invoicetronic:</strong> Moderno, SDK completo</li>
                        </ul>
                      </div>

                      <div className="flex gap-2">
                        <Button className="flex-1 h-8 text-xs" disabled>
                          <Check className="h-3 w-3 mr-1" />
                          Salva Configurazione
                        </Button>
                        <Button variant="outline" className="h-8 text-xs" disabled>
                          Test Connessione
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader className="py-3 px-4">
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                      Stato Integrazioni
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 pt-0">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-2 border rounded-lg">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-blue-600" />
                          <div>
                            <p className="font-medium text-xs">Plaid - Open Banking</p>
                            <p className="text-xs text-muted-foreground">Sincronizzazione movimenti bancari</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs text-gray-500">
                          In attesa di configurazione
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between p-2 border rounded-lg">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-green-600" />
                          <div>
                            <p className="font-medium text-xs">SDI - Fatturazione Elettronica</p>
                            <p className="text-xs text-muted-foreground">Invio/ricezione fatture</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs text-gray-500">
                          In attesa di configurazione
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

              </TabsContent>

              <TabsContent value="condivisioni" className="m-0 space-y-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="text-base font-semibold">Link Condivisi</h2>
                    <p className="text-xs text-muted-foreground">
                      Gestisci i link pubblici per fatture e transazioni
                    </p>
                  </div>
                  <Badge variant="outline">{shareLinks.length} link attivi</Badge>
                </div>

                {shareLinks.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Share2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium">Nessun link condiviso</h3>
                      <p className="text-muted-foreground text-sm mt-1">
                        Condividi fatture o transazioni per vederle qui
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-xs">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-left px-3 py-2 font-medium">Tipo</th>
                          <th className="text-left px-3 py-2 font-medium">Risorsa</th>
                          <th className="text-center px-3 py-2 font-medium">Visualizzazioni</th>
                          <th className="text-left px-3 py-2 font-medium">Creato</th>
                          <th className="text-left px-3 py-2 font-medium">Ultimo Accesso</th>
                          <th className="text-left px-3 py-2 font-medium">IP</th>
                          <th className="text-center px-3 py-2 font-medium">Stato</th>
                          <th className="text-right px-3 py-2 font-medium">Azioni</th>
                        </tr>
                      </thead>
                      <tbody>
                        {shareLinks.map((link) => {
                          const resourceName = link.tipo === "invoice"
                            ? invoices.find(i => i.id === link.resourceId)?.numero || "Fattura"
                            : transactions.find(t => t.id === link.resourceId)?.descrizione?.substring(0, 25) || "Transazione";
                          const isExpired = link.expiresAt && new Date(link.expiresAt) < new Date();
                          return (
                            <tr key={link.id} className={`border-t hover:bg-muted/30 ${!link.isActive || isExpired ? 'opacity-60' : ''}`}>
                              <td className="px-3 py-2">
                                <div className="flex items-center gap-1">
                                  {link.tipo === "invoice" ? (
                                    <Receipt className="h-3 w-3 text-blue-500" />
                                  ) : (
                                    <ArrowUpDown className="h-3 w-3 text-green-500" />
                                  )}
                                  <span className="capitalize">{link.tipo === "invoice" ? "Fattura" : "Transazione"}</span>
                                </div>
                              </td>
                              <td className="px-3 py-2 font-medium max-w-40 truncate">{resourceName}</td>
                              <td className="px-3 py-2 text-center">
                                <Badge variant="secondary" className="text-[10px]">{link.viewCount}</Badge>
                              </td>
                              <td className="px-3 py-2 text-muted-foreground">
                                {link.createdAt ? format(new Date(link.createdAt), "dd/MM/yy HH:mm", { locale: it }) : "-"}
                              </td>
                              <td className="px-3 py-2 text-muted-foreground">
                                {link.lastViewedAt ? format(new Date(link.lastViewedAt), "dd/MM/yy HH:mm", { locale: it }) : "-"}
                              </td>
                              <td className="px-3 py-2 font-mono text-muted-foreground">
                                {link.lastViewedIp || "-"}
                              </td>
                              <td className="px-3 py-2 text-center">
                                {isExpired ? (
                                  <Badge variant="destructive" className="text-[10px]">Scaduto</Badge>
                                ) : link.isActive ? (
                                  <Badge variant="default" className="text-[10px] bg-green-500">Attivo</Badge>
                                ) : (
                                  <Badge variant="secondary" className="text-[10px]">Disattivo</Badge>
                                )}
                              </td>
                              <td className="px-3 py-2">
                                <div className="flex items-center justify-end gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0"
                                    onClick={() => copyToClipboard(`${window.location.origin}/share/${link.token}`)}
                                    title="Copia link"
                                  >
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0"
                                    onClick={() => window.open(`/share/${link.token}`, '_blank')}
                                    title="Apri link"
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0"
                                    onClick={() => handleToggleShareLink(link.id, !link.isActive)}
                                    title={link.isActive ? "Disattiva" : "Attiva"}
                                  >
                                    {link.isActive ? <X className="h-3 w-3" /> : <Check className="h-3 w-3" />}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 text-red-500 hover:text-red-600"
                                    onClick={() => handleDeleteShareLink(link.id)}
                                    title="Elimina"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>

      <AccountDialog
        open={accountDialogOpen}
        onOpenChange={setAccountDialogOpen}
        account={selectedAccount}
        onSave={handleSaveAccount}
      />

      <InvoiceDialog
        open={invoiceDialogOpen}
        onOpenChange={setInvoiceDialogOpen}
        invoice={selectedInvoice}
        tipo={invoiceTipo}
        onSave={handleSaveInvoice}
        projects={projects}
      />

      <TransactionDialog
        open={transactionDialogOpen}
        onOpenChange={setTransactionDialogOpen}
        transaction={selectedTransaction}
        accounts={accounts}
        categories={categories}
        onSave={handleSaveTransaction}
      />

      <ReminderDialog
        open={reminderDialogOpen}
        onOpenChange={setReminderDialogOpen}
        invoice={reminderInvoice}
        onSend={handleSendReminder}
      />

      {/* Report fatture stampabile */}
      <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto print:max-w-none print:max-h-none print:overflow-visible">
          <DialogHeader className="print:hidden">
            <DialogTitle className="flex items-center gap-2">
              <Printer className="h-5 w-5" />
              Report Fatture
            </DialogTitle>
            <DialogDescription>
              Stampa il report delle fatture con stato pagamento
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex justify-end gap-2 print:hidden">
              <Button variant="outline" onClick={() => setReportDialogOpen(false)}>
                Chiudi
              </Button>
              <Button onClick={() => window.print()}>
                <Printer className="h-4 w-4 mr-2" />
                Stampa
              </Button>
            </div>

            <div className="print:p-0" id="print-report">
              <div className="text-center mb-4 print:mb-6">
                <h2 className="text-lg font-bold">REPORT FATTURE</h2>
                <p className="text-xs text-muted-foreground">Generato il {format(new Date(), "dd/MM/yyyy HH:mm", { locale: it })}</p>
              </div>

              <table className="w-full text-[10px] border-collapse">
                <thead>
                  <tr className="bg-muted/50 print:bg-gray-100">
                    <th className="border px-2 py-1 text-left font-semibold">Cliente</th>
                    <th className="border px-2 py-1 text-left font-semibold">Fattura</th>
                    <th className="border px-2 py-1 text-left font-semibold">Data</th>
                    <th className="border px-2 py-1 text-left font-semibold">Scadenza</th>
                    <th className="border px-2 py-1 text-right font-semibold">Importo</th>
                    <th className="border px-2 py-1 text-center font-semibold">Pagato</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices
                    .filter(inv => inv.tipo === "emessa")
                    .sort((a, b) => (a.ragioneSociale || "").localeCompare(b.ragioneSociale || ""))
                    .map(inv => {
                      const isPagata = inv.stato === "pagata";
                      const matchedTrans = transactions.find(t => t.invoiceId === inv.id && t.riconciliato);
                      return (
                        <React.Fragment key={inv.id}>
                          <tr className={isPagata ? "bg-green-50/50 print:bg-green-50" : ""}>
                            <td className="border px-2 py-1">{inv.ragioneSociale}</td>
                            <td className="border px-2 py-1 font-mono">{inv.numero || "Bozza"}</td>
                            <td className="border px-2 py-1">{inv.dataEmissione ? format(new Date(inv.dataEmissione), "dd/MM/yyyy") : "-"}</td>
                            <td className={`border px-2 py-1 ${!isPagata && inv.dataScadenza && new Date(inv.dataScadenza) < new Date() ? "text-red-600 font-semibold" : ""}`}>
                              {inv.dataScadenza ? format(new Date(inv.dataScadenza), "dd/MM/yyyy") : "-"}
                            </td>
                            <td className="border px-2 py-1 text-right font-semibold">{formatCurrency(parseItalianNumber(inv.totale))}</td>
                            <td className="border px-2 py-1 text-center">
                              {isPagata ? (
                                <span className="text-green-600 font-semibold">SI</span>
                              ) : (
                                <span className="text-red-600">NO</span>
                              )}
                            </td>
                          </tr>
                          {isPagata && matchedTrans && (
                            <tr className="bg-green-50/30 print:bg-green-50">
                              <td colSpan={6} className="border px-2 py-1 text-[9px] text-muted-foreground italic pl-6">
                                Rif. pagamento: {matchedTrans.data ? format(new Date(matchedTrans.data), "dd/MM/yyyy") : ""} -
                                {" "}{formatCurrency(parseItalianNumber(matchedTrans.importo))} -
                                {" "}{matchedTrans.descrizione?.substring(0, 80)}...
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                </tbody>
                <tfoot>
                  <tr className="bg-muted/50 print:bg-gray-100 font-semibold">
                    <td colSpan={4} className="border px-2 py-1 text-right">TOTALE:</td>
                    <td className="border px-2 py-1 text-right">
                      {formatCurrency(invoices.filter(i => i.tipo === "emessa").reduce((sum, i) => sum + parseItalianNumber(i.totale), 0))}
                    </td>
                    <td className="border px-2 py-1 text-center text-[9px]">
                      {invoices.filter(i => i.tipo === "emessa" && i.stato === "pagata").length}/{invoices.filter(i => i.tipo === "emessa").length}
                    </td>
                  </tr>
                  <tr className="font-semibold">
                    <td colSpan={4} className="border px-2 py-1 text-right text-green-600">Totale Incassato:</td>
                    <td className="border px-2 py-1 text-right text-green-600">
                      {formatCurrency(invoices.filter(i => i.tipo === "emessa" && i.stato === "pagata").reduce((sum, i) => sum + parseItalianNumber(i.totale), 0))}
                    </td>
                    <td></td>
                  </tr>
                  <tr className="font-semibold">
                    <td colSpan={4} className="border px-2 py-1 text-right text-red-600">Da Incassare:</td>
                    <td className="border px-2 py-1 text-right text-red-600">
                      {formatCurrency(invoices.filter(i => i.tipo === "emessa" && i.stato !== "pagata").reduce((sum, i) => sum + parseItalianNumber(i.totale), 0))}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog dettagli fattura - stile documento fiscale */}
      <Dialog open={invoiceDetailOpen} onOpenChange={setInvoiceDetailOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b pb-3">
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-primary" />
                <span>Documento di Vendita {invoiceDetail?.tipo === "emessa" ? "Emesso" : "Ricevuto"}</span>
              </div>
              <Badge variant="outline" className="text-xs font-mono">
                TD01 Fattura
              </Badge>
            </DialogTitle>
          </DialogHeader>
          {invoiceDetail && (() => {
            const stato = STATI_FATTURA.find(s => s.value === invoiceDetail.stato);
            const matchedTrans = invoiceToTransaction.get(invoiceDetail.id);
            const matchedAccount = matchedTrans ? accounts.find(a => a.id === matchedTrans.contoId) : null;
            const linkedProject = projects.find(p => p.id === invoiceDetail.projectId);
            const totaleIva = parseItalianNumber(invoiceDetail.totale) - parseItalianNumber(invoiceDetail.imponibile || invoiceDetail.totale);
            return (
              <div className="space-y-4 text-sm">
                {/* Intestazione: Cedente / Cessionario */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="border rounded-lg p-3 bg-muted/20">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-2 font-semibold">Cedente/Prestatore (fornitore)</p>
                    <p className="font-bold">DOLOMITI FOOD S.R.L.</p>
                    <p className="text-xs text-muted-foreground">P.IVA: IT01271340257</p>
                    <p className="text-xs text-muted-foreground">Via Roma 9, 32040 Vodo Cadore (BL)</p>
                    <p className="text-xs text-muted-foreground">Regime fiscale: RF01 ordinario</p>
                  </div>
                  <div className="border rounded-lg p-3 bg-blue-50/50 dark:bg-blue-950/20">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-2 font-semibold">Cessionario/Committente (cliente)</p>
                    <p className="font-bold">{invoiceDetail.ragioneSociale}</p>
                    {invoiceDetail.partitaIva && (
                      <p className="text-xs text-muted-foreground">P.IVA: IT{invoiceDetail.partitaIva.replace(/^IT/i, '')}</p>
                    )}
                  </div>
                </div>

                {/* Dati documento */}
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-muted/50 px-3 py-2 border-b">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold">Dati Documento</p>
                  </div>
                  <div className="grid grid-cols-4 gap-4 p-3">
                    <div>
                      <p className="text-[10px] text-muted-foreground">Numero</p>
                      <p className="font-bold font-mono">{invoiceDetail.numero || "Bozza"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground">Data Emissione</p>
                      <p className="font-medium">{invoiceDetail.dataEmissione ? format(new Date(invoiceDetail.dataEmissione), "dd-MM-yyyy") : "-"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground">Data Scadenza</p>
                      <p className={`font-medium ${invoiceDetail.stato !== "pagata" && invoiceDetail.dataScadenza && new Date(invoiceDetail.dataScadenza) < new Date()
                        ? "text-red-600" : ""
                        }`}>
                        {invoiceDetail.dataScadenza ? format(new Date(invoiceDetail.dataScadenza), "dd-MM-yyyy") : "-"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-muted-foreground">Stato</p>
                      <Badge className={`${stato?.color} text-[10px]`}>{stato?.label}</Badge>
                    </div>
                  </div>
                </div>

                {/* Descrizione/Oggetto */}
                {invoiceDetail.oggetto && (
                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-muted/50 px-3 py-2 border-b">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold">Descrizione</p>
                    </div>
                    <div className="p-3">
                      <p className="text-sm">{invoiceDetail.oggetto}</p>
                    </div>
                  </div>
                )}

                {/* Riepilogo IVA e Totali */}
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-muted/50 px-3 py-2 border-b">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold">Riepilogo IVA e Totali</p>
                  </div>
                  <table className="w-full text-xs">
                    <thead className="bg-muted/30">
                      <tr>
                        <th className="text-left px-3 py-2">Esigibilità IVA</th>
                        <th className="text-center px-3 py-2">% IVA</th>
                        <th className="text-right px-3 py-2">Totale Imponibile</th>
                        <th className="text-right px-3 py-2">Totale Imposta</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-t">
                        <td className="px-3 py-2">I (esigibilità immediata)</td>
                        <td className="px-3 py-2 text-center">{invoiceDetail.iva || "22"}%</td>
                        <td className="px-3 py-2 text-right font-medium">{formatCurrency(invoiceDetail.imponibile || 0)}</td>
                        <td className="px-3 py-2 text-right font-medium">{formatCurrency(totaleIva)}</td>
                      </tr>
                    </tbody>
                    <tfoot className="bg-primary/5 border-t-2">
                      <tr>
                        <td colSpan={2} className="px-3 py-2 text-right font-bold">Totale Documento:</td>
                        <td colSpan={2} className="px-3 py-2 text-right text-lg font-bold text-primary">
                          {formatCurrency(invoiceDetail.totale)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Progetto collegato */}
                {linkedProject && (
                  <div className="p-3 border rounded-lg bg-blue-50/50 dark:bg-blue-950/20">
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-blue-600" />
                      <span className="text-xs text-muted-foreground">Progetto collegato:</span>
                      <span className="font-medium text-sm">{linkedProject.name}</span>
                    </div>
                  </div>
                )}

                {/* Movimento bancario */}
                {matchedTrans && (
                  <div className="border rounded-lg overflow-hidden bg-green-50/50 dark:bg-green-950/20">
                    <div className="bg-green-100/50 dark:bg-green-900/30 px-3 py-2 border-b flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-green-600" />
                      <span className="text-[10px] text-green-800 dark:text-green-200 uppercase tracking-wide font-semibold">Movimento Bancario Collegato</span>
                      <CheckCircle2 className="h-4 w-4 text-green-600 ml-auto" />
                    </div>
                    <div className="grid grid-cols-3 gap-4 p-3 text-sm">
                      <div>
                        <p className="text-[10px] text-muted-foreground">Data</p>
                        <p className="font-medium">{matchedTrans.data ? format(new Date(matchedTrans.data), "dd/MM/yyyy") : "-"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground">Importo</p>
                        <p className="font-medium text-green-600">+{formatCurrency(matchedTrans.importo)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground">Conto</p>
                        <p className="font-medium">{matchedAccount?.nome || "-"}</p>
                      </div>
                    </div>
                  </div>
                )}

                {!matchedTrans && invoiceDetail.stato !== "pagata" && (
                  <div className="p-3 border rounded-lg bg-amber-50/50 dark:bg-amber-950/20">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                      <span className="text-xs text-amber-800 dark:text-amber-200">
                        Nessun movimento bancario collegato - sarà associato durante la riconciliazione
                      </span>
                    </div>
                  </div>
                )}

                {/* Note */}
                {(invoiceDetail.note || invoiceDetail.noteInterne) && (
                  <div className="grid grid-cols-2 gap-4">
                    {invoiceDetail.note && (
                      <div className="border rounded-lg p-3">
                        <p className="text-[10px] text-muted-foreground uppercase mb-1">Note</p>
                        <p className="text-xs whitespace-pre-wrap">{invoiceDetail.note}</p>
                      </div>
                    )}
                    {invoiceDetail.noteInterne && (
                      <div className="border rounded-lg p-3 bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
                        <p className="text-[10px] text-muted-foreground uppercase mb-1 flex items-center gap-1">
                          <Lock className="h-3 w-3" /> Note Interne
                        </p>
                        <p className="text-xs whitespace-pre-wrap">{invoiceDetail.noteInterne}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Azioni */}
                <div className="flex justify-end gap-2 pt-4 border-t">
                  {invoiceDetail.tipo === "emessa" && invoiceDetail.stato !== "pagata" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => { setInvoiceDetailOpen(false); setReminderInvoice(invoiceDetail); setReminderDialogOpen(true); }}
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Invia Sollecito
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { setInvoiceDetailOpen(false); setSelectedInvoice(invoiceDetail); setInvoiceTipo(invoiceDetail.tipo); setInvoiceDialogOpen(true); }}
                  >
                    <Edit2 className="h-4 w-4 mr-2" />
                    Modifica
                  </Button>
                  <Button size="sm" onClick={() => setInvoiceDetailOpen(false)}>
                    Chiudi
                  </Button>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Dialog dettagli transazione */}
      <Dialog open={viewTransactionOpen} onOpenChange={setViewTransactionOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {viewTransaction?.tipo === "entrata" ? (
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </div>
              ) : viewTransaction?.tipo === "uscita" ? (
                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                  <TrendingDown className="h-4 w-4 text-red-600" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <ArrowRightLeft className="h-4 w-4 text-blue-600" />
                </div>
              )}
              Dettaglio Movimento
            </DialogTitle>
          </DialogHeader>
          {viewTransaction && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Data</p>
                  <p className="font-medium">{viewTransaction.data}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Tipo</p>
                  <Badge variant={viewTransaction.tipo === "entrata" ? "default" : viewTransaction.tipo === "uscita" ? "destructive" : "secondary"}>
                    {viewTransaction.tipo === "entrata" ? "Entrata" : viewTransaction.tipo === "uscita" ? "Uscita" : "Trasferimento"}
                  </Badge>
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-1">Descrizione</p>
                <div className="p-3 bg-muted/50 rounded-lg text-sm">
                  {viewTransaction.descrizione}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Importo</p>
                  <p className={`text-xl font-bold ${viewTransaction.tipo === "entrata" ? "text-green-600" :
                    viewTransaction.tipo === "uscita" ? "text-red-600" : ""
                    }`}>
                    {viewTransaction.tipo === "entrata" ? "+" : viewTransaction.tipo === "uscita" ? "-" : ""}
                    {formatCurrency(viewTransaction.importo)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Conto</p>
                  <p className="font-medium">
                    {accounts.find(a => a.id === viewTransaction.contoId)?.nome || "-"}
                  </p>
                </div>
              </div>

              {viewTransaction.note && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Note</p>
                  <p className="text-sm">{viewTransaction.note}</p>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setViewTransactionOpen(false)}>
                  Chiudi
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    setTransactionToDelete(viewTransaction);
                    setViewTransactionOpen(false);
                    setDeleteConfirmOpen(true);
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Elimina
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog conferma cancellazione */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Conferma Eliminazione
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">
              Sei sicuro di voler eliminare questa transazione?
            </p>
            {transactionToDelete && (
              <div className="p-3 bg-muted/50 rounded-lg space-y-1">
                <p className="text-xs text-muted-foreground">Data: {transactionToDelete.data}</p>
                <p className="text-sm font-medium">{transactionToDelete.descrizione?.substring(0, 80)}...</p>
                <p className={`font-bold ${transactionToDelete.tipo === "entrata" ? "text-green-600" : "text-red-600"}`}>
                  {formatCurrency(transactionToDelete.importo)}
                </p>
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-4">
              La transazione verrà spostata nel cestino e potrà essere ripristinata.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
              Annulla
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (transactionToDelete) {
                  deleteTransactionMutation.mutate(transactionToDelete.id);
                }
                setDeleteConfirmOpen(false);
                setTransactionToDelete(null);
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Elimina
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={noteDialogOpen} onOpenChange={(open) => { setNoteDialogOpen(open); if (!open) { setNoteTransaction(null); setNoteText(""); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <StickyNote className="h-5 w-5 text-amber-500" />
              Nota Movimento
            </DialogTitle>
            <DialogDescription>
              Aggiungi o modifica una nota per questo movimento
            </DialogDescription>
          </DialogHeader>
          {noteTransaction && (
            <div className="space-y-4">
              <div className="p-3 bg-muted/50 rounded-lg space-y-1">
                <p className="text-xs text-muted-foreground">Data: {noteTransaction.data}</p>
                <p className="text-sm font-medium">{noteTransaction.descrizione?.substring(0, 60)}...</p>
                <p className={`font-bold ${noteTransaction.tipo === "entrata" ? "text-green-500" : "text-red-600"}`}>
                  {noteTransaction.tipo === "entrata" ? "+" : "-"}{formatCurrency(noteTransaction.importo)}
                </p>
              </div>
              <div className="space-y-2">
                <Label>Nota</Label>
                <Textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Inserisci una nota per questo movimento..."
                  rows={4}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => { setNoteDialogOpen(false); setNoteTransaction(null); setNoteText(""); }}>
                  Annulla
                </Button>
                <Button
                  onClick={() => {
                    if (noteTransaction) {
                      updateTransactionNoteMutation.mutate({ id: noteTransaction.id, note: noteText });
                    }
                  }}
                  disabled={updateTransactionNoteMutation.isPending}
                >
                  {updateTransactionNoteMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
                  Salva Nota
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5 text-blue-600" />
              Condividi {shareResource?.tipo === "invoice" ? "Fattura" : "Transazione"}
            </DialogTitle>
            <DialogDescription>
              Genera un link per condividere "{shareResource?.name}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {!shareLink ? (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground mb-4">
                  Crea un link univoco che chiunque può usare per visualizzare questo documento.
                  Il link sarà valido per 30 giorni.
                </p>
                <Button
                  onClick={createShareLink}
                  disabled={isCreatingShare}
                  className="gap-2"
                >
                  {isCreatingShare ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Link2 className="h-4 w-4" />
                  )}
                  Genera Link
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={shareLink}
                    readOnly
                    className="font-mono text-xs"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(shareLink)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex gap-2 justify-center">
                  <Button
                    variant="outline"
                    onClick={() => copyToClipboard(shareLink)}
                    className="gap-2"
                  >
                    <Copy className="h-4 w-4" />
                    Copia Link
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => window.open(shareLink, "_blank")}
                    className="gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Apri
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Chiunque abbia questo link potrà visualizzare il documento.
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Conferma Riconciliazione */}
      <Dialog open={reconcileConfirmOpen} onOpenChange={setReconcileConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              Riconciliazione Automatica
            </DialogTitle>
            <DialogDescription>
              Scegli come procedere con la riconciliazione delle fatture
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">
                Vuoi eliminare le riconciliazioni precedenti?
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-300">
                Se scegli "Si, ricomincia", tutte le fatture marcate come "pagate" torneranno allo stato "inviata" e la riconciliazione partirà da zero.
              </p>
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setReconcileConfirmOpen(false)}
              >
                Annulla
              </Button>
              <Button
                variant="outline"
                onClick={() => startReconciliation(false)}
              >
                No, mantieni
              </Button>
              <Button
                variant="destructive"
                onClick={() => startReconciliation(true)}
              >
                Si, ricomincia
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Riconciliazione */}
      <Dialog open={reconcileDialogOpen} onOpenChange={(open) => { if (!isReconciling) setReconcileDialogOpen(open); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw className={`h-5 w-5 text-blue-600 ${isReconciling ? 'animate-spin' : ''}`} />
              Riconciliazione Automatica
            </DialogTitle>
            <DialogDescription>
              Verifica abbinamento fatture con movimenti bancari
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Lista banche */}
            <div className="border rounded-lg divide-y max-h-48 overflow-auto">
              {accounts.map((acc) => {
                const result = reconcileResults.find(r => r.bank === acc.nome);
                const isCurrent = reconcileCurrentBank === acc.nome;
                return (
                  <div key={acc.id} className={`flex items-center justify-between p-2 text-xs ${isCurrent ? 'bg-blue-50 dark:bg-blue-950/30' : ''}`}>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{acc.nome}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {isCurrent && <Loader2 className="h-3 w-3 animate-spin text-blue-600" />}
                      {result !== undefined && (
                        <Badge variant={result.matched > 0 ? "default" : "secondary"} className="text-[10px]">
                          {result.matched} abbinamenti
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Barra di avanzamento */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  {reconcileComplete ? 'Completato' : reconcileCurrentBank ? `Controllo: ${reconcileCurrentBank}` : 'Preparazione...'}
                </span>
                <span className="font-semibold">{reconcileProgress}%</span>
              </div>
              <Progress value={reconcileProgress} className="h-2" />
            </div>

            {/* Messaggio finale */}
            {reconcileComplete && (
              <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-3 text-center">
                <CheckCircle2 className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <p className="text-sm font-semibold text-green-700 dark:text-green-400">Ho fatto il controllo</p>
                <p className="text-xs text-green-600 dark:text-green-500 mt-1">
                  Totale abbinamenti: {reconcileResults.reduce((sum, r) => sum + r.matched, 0)}
                </p>
              </div>
            )}

            {reconcileComplete && (
              <div className="flex justify-center">
                <Button onClick={() => setReconcileDialogOpen(false)}>
                  Chiudi
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Registrazione Pagamenti */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Euro className="h-5 w-5" />
              {paymentInvoice?.tipo === 'emessa' ? 'Registra Incasso' : 'Registra Pagamento'}
            </DialogTitle>
            <DialogDescription>
              {paymentInvoice && (
                <>
                  Fattura {paymentInvoice.numero} - {paymentInvoice.ragioneSociale}
                  <br />
                  Totale: {formatCurrency(paymentInvoice.totale)} |
                  Già {paymentInvoice.tipo === 'emessa' ? 'incassato' : 'pagato'}: {formatCurrency(paymentInvoice.totalePagato || 0)} |
                  Residuo: {formatCurrency(parseItalianNumber(paymentInvoice.totale) - parseItalianNumber(paymentInvoice.totalePagato))}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="paymentAmount">Importo {paymentInvoice?.tipo === 'emessa' ? 'Incassato' : 'Pagato'}</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
                <Input
                  id="paymentAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="pl-8"
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentDate">Data</Label>
              <Input
                id="paymentDate"
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentNote">Note (opzionale)</Label>
              <Input
                id="paymentNote"
                value={paymentNote}
                onChange={(e) => setPaymentNote(e.target.value)}
                placeholder="Es: Bonifico bancario"
              />
            </div>
            {paymentInvoice?.noteInterne && (
              <div className="p-3 bg-muted rounded-lg text-xs">
                <p className="font-medium mb-1">Storico pagamenti:</p>
                <pre className="whitespace-pre-wrap text-muted-foreground">{paymentInvoice.noteInterne}</pre>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>
              Annulla
            </Button>
            <Button onClick={handleRegisterPayment}>
              <Check className="h-4 w-4 mr-2" />
              Conferma
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Preventivo */}
      <Dialog open={quoteDialogOpen} onOpenChange={setQuoteDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {selectedQuote ? 'Modifica Preventivo' : 'Nuovo Preventivo'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            handleSaveQuote({
              numero: quoteFormData.numero,
              stato: quoteFormData.stato || 'bozza',
              dataEmissione: quoteFormData.dataEmissione,
              dataValidita: quoteFormData.dataValidita || null,
              ragioneSociale: quoteFormData.ragioneSociale,
              partitaIva: quoteFormData.partitaIva || null,
              indirizzo: quoteFormData.indirizzo || null,
              email: quoteFormData.email || null,
              telefono: quoteFormData.telefono || null,
              imponibile: quoteFormData.imponibile || '0',
              iva: quoteFormData.iva || '0',
              totale: quoteFormData.totale || '0',
              oggetto: quoteFormData.oggetto || null,
              descrizione: quoteFormData.descrizione || null,
              terminiPagamento: quoteFormData.terminiPagamento || null,
              note: quoteFormData.note || null,
              projectId: quoteFormData.projectId && quoteFormData.projectId !== 'none' ? quoteFormData.projectId : null,
              clienteId: quoteFormData.clienteId || null,
            });
          }}>
            <div className="grid grid-cols-5 gap-6 py-4">
              {/* Colonna Sinistra - Form Dati */}
              <div className="col-span-3 space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="numero">Numero *</Label>
                    <Input
                      id="numero"
                      value={quoteFormData.numero}
                      onChange={(e) => setQuoteFormData({ ...quoteFormData, numero: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="dataEmissione">Data Emissione *</Label>
                    <Input
                      id="dataEmissione"
                      type="date"
                      value={quoteFormData.dataEmissione}
                      onChange={(e) => setQuoteFormData({ ...quoteFormData, dataEmissione: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="dataValidita">Validità Fino A</Label>
                    <Input
                      id="dataValidita"
                      type="date"
                      value={quoteFormData.dataValidita}
                      onChange={(e) => setQuoteFormData({ ...quoteFormData, dataValidita: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="stato">Stato</Label>
                    <Select value={quoteFormData.stato} onValueChange={(v) => setQuoteFormData({ ...quoteFormData, stato: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona stato" />
                      </SelectTrigger>
                      <SelectContent>
                        {STATI_PREVENTIVO.map((s) => (
                          <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="projectId">Progetto Collegato</Label>
                    <Select value={quoteFormData.projectId} onValueChange={(v) => setQuoteFormData({ ...quoteFormData, projectId: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Nessun progetto" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nessuno</SelectItem>
                        {projects.map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">Dati Cliente</h4>
                  <div className="mb-3">
                    <Label>Seleziona Cliente</Label>
                    <Select value={quoteFormData.clienteId || "_manual"} onValueChange={handleQuoteClienteSelect}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona cliente..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="_manual">Inserimento manuale</SelectItem>
                        {anagraficaClienti.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.ragioneSociale} {c.partitaIva ? `(${c.partitaIva})` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="ragioneSociale">Ragione Sociale *</Label>
                      <Input
                        id="ragioneSociale"
                        value={quoteFormData.ragioneSociale}
                        onChange={(e) => setQuoteFormData({ ...quoteFormData, ragioneSociale: e.target.value })}
                        required
                        disabled={!!quoteFormData.clienteId}
                      />
                    </div>
                    <div>
                      <Label htmlFor="partitaIva">Partita IVA</Label>
                      <Input
                        id="partitaIva"
                        value={quoteFormData.partitaIva}
                        onChange={(e) => setQuoteFormData({ ...quoteFormData, partitaIva: e.target.value })}
                        disabled={!!quoteFormData.clienteId}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mt-3">
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={quoteFormData.email}
                        onChange={(e) => setQuoteFormData({ ...quoteFormData, email: e.target.value })}
                        disabled={!!quoteFormData.clienteId}
                      />
                    </div>
                    <div>
                      <Label htmlFor="telefono">Telefono</Label>
                      <Input
                        id="telefono"
                        value={quoteFormData.telefono}
                        onChange={(e) => setQuoteFormData({ ...quoteFormData, telefono: e.target.value })}
                        disabled={!!quoteFormData.clienteId}
                      />
                    </div>
                    <div>
                      <Label htmlFor="indirizzo">Indirizzo</Label>
                      <Input
                        id="indirizzo"
                        value={quoteFormData.indirizzo}
                        onChange={(e) => setQuoteFormData({ ...quoteFormData, indirizzo: e.target.value })}
                        disabled={!!quoteFormData.clienteId}
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">Dettagli Preventivo</h4>
                  <div>
                    <Label htmlFor="oggetto">Oggetto</Label>
                    <Input
                      id="oggetto"
                      value={quoteFormData.oggetto}
                      onChange={(e) => setQuoteFormData({ ...quoteFormData, oggetto: e.target.value })}
                      placeholder="Es: Sviluppo sito web"
                    />
                  </div>
                  <div className="mt-3">
                    <Label htmlFor="descrizione">Descrizione</Label>
                    <Textarea
                      id="descrizione"
                      rows={3}
                      value={quoteFormData.descrizione}
                      onChange={(e) => setQuoteFormData({ ...quoteFormData, descrizione: e.target.value })}
                      placeholder="Descrizione dettagliata del preventivo..."
                    />
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">Importi</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="imponibile">Imponibile</Label>
                      <Input
                        id="imponibile"
                        type="number"
                        step="0.01"
                        value={quoteFormData.imponibile}
                        onChange={(e) => setQuoteFormData({ ...quoteFormData, imponibile: e.target.value })}
                        onBlur={calcQuoteTotale}
                      />
                    </div>
                    <div>
                      <Label htmlFor="iva">IVA %</Label>
                      <Input
                        id="iva"
                        type="number"
                        step="0.01"
                        value={quoteFormData.iva}
                        onChange={(e) => setQuoteFormData({ ...quoteFormData, iva: e.target.value })}
                        onBlur={calcQuoteTotale}
                      />
                    </div>
                    <div>
                      <Label htmlFor="totale">Totale</Label>
                      <Input
                        id="totale"
                        type="number"
                        step="0.01"
                        value={quoteFormData.totale}
                        onChange={(e) => setQuoteFormData({ ...quoteFormData, totale: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="terminiPagamento">Termini di Pagamento</Label>
                    <Input
                      id="terminiPagamento"
                      value={quoteFormData.terminiPagamento}
                      onChange={(e) => setQuoteFormData({ ...quoteFormData, terminiPagamento: e.target.value })}
                      placeholder="Es: 30 giorni DF"
                    />
                  </div>
                  <div>
                    <Label htmlFor="note">Note</Label>
                    <Input
                      id="note"
                      value={quoteFormData.note}
                      onChange={(e) => setQuoteFormData({ ...quoteFormData, note: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Colonna Destra - Articoli */}
              <div className="col-span-2 border-l pl-6">
                <h4 className="font-medium text-sm mb-3">Articoli</h4>

                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {quoteLines.map((line, idx) => (
                    <div key={idx} className="border rounded-lg p-2 bg-muted/30">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="font-mono text-[11px] text-muted-foreground mb-1 truncate">{line.codiceArticolo}</div>
                          <div className="text-xs font-medium line-clamp-2">{line.descrizione}</div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 p-0 text-destructive flex-shrink-0"
                          onClick={() => removeQuoteLine(idx)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-1 text-[11px] mb-2">
                        <div>
                          <Label className="text-[10px] text-muted-foreground">Qtà</Label>
                          <Input
                            type="number"
                            className="h-5 text-[11px] px-1"
                            value={line.quantita}
                            onChange={(e) => updateQuoteLine(idx, "quantita", e.target.value)}
                          />
                        </div>
                        <div>
                          <Label className="text-[10px] text-muted-foreground">UM: {line.unitaMisura}</Label>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-1 text-[11px] mb-2">
                        <div>
                          <Label className="text-[10px] text-muted-foreground">Prezzo</Label>
                          <Input
                            type="number"
                            step="0.01"
                            className="h-5 text-[11px] px-1"
                            value={line.prezzoUnitario}
                            onChange={(e) => updateQuoteLine(idx, "prezzoUnitario", e.target.value)}
                          />
                        </div>
                        <div>
                          <Label className="text-[10px] text-muted-foreground">Sconto %</Label>
                          <Input
                            type="number"
                            className="h-5 text-[11px] px-1"
                            value={line.sconto}
                            onChange={(e) => updateQuoteLine(idx, "sconto", e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="bg-white rounded p-1 border-t">
                        <div className="text-right font-semibold text-xs">
                          {parseFloat(line.importo).toFixed(2)} €
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Riga di Aggiunta */}
                  <div className="border rounded-lg p-2 bg-blue-50/30 border-blue-200">
                    <Label className="text-[10px] text-muted-foreground block mb-1">Seleziona Articolo</Label>
                    <Select value={quoteNewArticleId} onValueChange={(val) => {
                      setQuoteNewArticleId(val);
                      const article = catalogArticles.find(a => a.id === val);
                      if (article) {
                        addQuoteArticle(article);
                        setQuoteNewArticleId("");
                        setQuoteNewQuantity("1");
                      }
                    }}>
                      <SelectTrigger className="h-6 text-[11px]">
                        <SelectValue placeholder="Cerca articolo..." />
                      </SelectTrigger>
                      <SelectContent className="max-h-[250px]">
                        {catalogArticles.map((article) => (
                          <SelectItem key={article.id} value={article.id}>
                            <span className="text-xs">{article.codice} - {article.nome}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setQuoteDialogOpen(false)}>
                Annulla
              </Button>
              <Button type="submit">
                {selectedQuote ? "Salva" : "Crea"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Invia Ordine Email */}
      <Dialog open={orderEmailDialogOpen} onOpenChange={setOrderEmailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Invia Ordine via Email
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="orderEmail">Indirizzo Email</Label>
              <Input
                id="orderEmail"
                type="email"
                value={orderEmailAddress}
                onChange={(e) => setOrderEmailAddress(e.target.value)}
                placeholder="email@cliente.com"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              L'ordine sarà inviato a: <strong>{orderEmailAddress}</strong>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOrderEmailDialogOpen(false)}>
              Annulla
            </Button>
            <Button onClick={handleSendOrderEmail} disabled={isSendingOrderEmail}>
              {isSendingOrderEmail ? "Invio..." : "Invia Email"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Modifica Ordine */}
      <Dialog open={orderDialogOpen} onOpenChange={setOrderDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Modifica Ordine
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={(e) => {
            e.preventDefault();
            handleSaveOrder();
          }} className="space-y-4">
            <div className="grid grid-cols-5 gap-4">
              {/* Colonna Sinistra - Dati */}
              <div className="col-span-3 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="ordineNumero">Numero</Label>
                    <Input id="ordineNumero" value={orderFormData.numero} disabled />
                  </div>
                  <div>
                    <Label htmlFor="ordineData">Data Ordine</Label>
                    <Input
                      id="ordineData"
                      type="date"
                      value={orderFormData.dataOrdine}
                      onChange={(e) => setOrderFormData({ ...orderFormData, dataOrdine: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="ordineCliente">Cliente</Label>
                  <Select value={orderFormData.clienteId} onValueChange={handleOrderClienteSelect}>
                    <SelectTrigger id="ordineCliente">
                      <SelectValue placeholder="Seleziona cliente..." />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px]">
                      <SelectItem value="_manual">Manuale</SelectItem>
                      {anagraficaClienti.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.ragioneSociale}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="ordineRagione">Ragione Sociale</Label>
                    <Input
                      id="ordineRagione"
                      value={orderFormData.ragioneSociale}
                      onChange={(e) => setOrderFormData({ ...orderFormData, ragioneSociale: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="ordinePartita">Partita IVA</Label>
                    <Input
                      id="ordinePartita"
                      value={orderFormData.partitaIva}
                      onChange={(e) => setOrderFormData({ ...orderFormData, partitaIva: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="ordineIndirizzo">Indirizzo</Label>
                  <Input
                    id="ordineIndirizzo"
                    value={orderFormData.indirizzo}
                    onChange={(e) => setOrderFormData({ ...orderFormData, indirizzo: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="ordineEmail">Email</Label>
                    <Input
                      id="ordineEmail"
                      value={orderFormData.email}
                      onChange={(e) => setOrderFormData({ ...orderFormData, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="ordineTelefono">Telefono</Label>
                    <Input
                      id="ordineTelefono"
                      value={orderFormData.telefono}
                      onChange={(e) => setOrderFormData({ ...orderFormData, telefono: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="ordineNote">Note</Label>
                  <Input
                    id="ordineNote"
                    value={orderFormData.note}
                    onChange={(e) => setOrderFormData({ ...orderFormData, note: e.target.value })}
                  />
                </div>
              </div>

              {/* Colonna Destra - Articoli */}
              <div className="col-span-2 border-l pl-6">
                <h4 className="font-medium text-base mb-4">Articoli</h4>

                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {orderLines.map((line, idx) => (
                    <div key={idx} className="border rounded-lg p-4 bg-muted/30">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="font-mono text-sm text-muted-foreground mb-2 truncate">{line.codiceArticolo}</div>
                          <div className="text-sm font-medium line-clamp-2">{line.descrizione}</div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-destructive flex-shrink-0"
                          onClick={() => removeOrderLine(idx)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <div>
                          <Label className="text-xs text-muted-foreground block mb-1">Qtà</Label>
                          <Input
                            type="number"
                            className="h-8 text-sm px-2"
                            value={line.quantita}
                            onChange={(e) => updateOrderLine(idx, "quantita", e.target.value)}
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground block mb-1">UM: {line.unitaMisura}</Label>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <div>
                          <Label className="text-xs text-muted-foreground block mb-1">Prezzo</Label>
                          <Input
                            type="number"
                            step="0.01"
                            className="h-8 text-sm px-2"
                            value={line.prezzoUnitario}
                            onChange={(e) => updateOrderLine(idx, "prezzoUnitario", e.target.value)}
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground block mb-1">Sconto %</Label>
                          <Input
                            type="number"
                            className="h-8 text-sm px-2"
                            value={line.sconto}
                            onChange={(e) => updateOrderLine(idx, "sconto", e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="bg-white rounded p-2 border-t">
                        <div className="text-right font-semibold text-sm">
                          {parseFloat(line.importo).toFixed(2)} €
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Riga di Aggiunta */}
                  <div className="border rounded-lg p-3 bg-blue-50/30 border-blue-200">
                    <Label className="text-xs text-muted-foreground block mb-2">Aggiungi Articolo</Label>
                    <Select value={orderNewArticleId} onValueChange={(val) => {
                      setOrderNewArticleId(val);
                      const article = catalogArticles.find(a => a.id === val);
                      if (article) {
                        addOrderArticle(article);
                        setOrderNewArticleId("");
                      }
                    }}>
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue placeholder="Cerca articolo..." />
                      </SelectTrigger>
                      <SelectContent className="max-h-[250px]">
                        {catalogArticles.map((article) => (
                          <SelectItem key={article.id} value={article.id}>
                            <span className="text-sm">{article.codice} - {article.nome}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOrderDialogOpen(false)}>
                Annulla
              </Button>
              <Button type="submit">
                Salva
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={docUploadDialogOpen} onOpenChange={setDocUploadDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Carica Documento</DialogTitle>
            <DialogDescription>
              Carica un documento finanziario nell'archivio
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Categoria</Label>
              <Select value={docUploadCategory} onValueChange={setDocUploadCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fatture">Fatture</SelectItem>
                  <SelectItem value="utenze">Utenze</SelectItem>
                  <SelectItem value="cedolini">Cedolini</SelectItem>
                  <SelectItem value="contratti">Contratti</SelectItem>
                  <SelectItem value="altro">Altro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Descrizione</Label>
              <Input
                placeholder="Descrizione del documento..."
                value={docUploadDescription}
                onChange={(e) => setDocUploadDescription(e.target.value)}
              />
            </div>
            <div>
              <Label>File</Label>
              <div className="mt-2">
                <Input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                  onChange={(e) => setDocUploadFile(e.target.files?.[0] || null)}
                />
              </div>
              {docUploadFile && (
                <p className="text-sm text-muted-foreground mt-2">
                  Selezionato: {docUploadFile.name}
                </p>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDocUploadDialogOpen(false)}>
              Annulla
            </Button>
            <Button onClick={handleDocUpload} disabled={!docUploadFile || isUploadingDoc}>
              {isUploadingDoc ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Caricamento...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Carica
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={ddtDialogOpen} onOpenChange={setDdtDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <DialogTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <FileText className="h-4 w-4 text-white" />
              </div>
              {selectedDdt ? "Modifica DDT" : "Nuovo DDT"}
            </DialogTitle>
            <DialogDescription>
              {selectedDdt ? "Modifica i dati del documento di trasporto" : "Crea un nuovo documento di trasporto"}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto text-xs">
            <div className="grid grid-cols-5 gap-3 p-4">
              {/* COLONNA SINISTRA - Dati DDT */}
              <div className="col-span-2 space-y-3">
                {/* SEZIONE DOCUMENTO */}
                <Card className="border-blue-200 bg-blue-50/30">
                  <CardHeader className="pb-1 pt-2">
                    <CardTitle className="text-xs flex items-center gap-1.5 text-blue-700">
                      <ScrollText className="h-3 w-3" />
                      Dati Documento
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-2 pb-2">
                    <div>
                      <Label htmlFor="numero" className="text-[10px]">Numero DDT *</Label>
                      <Input
                        id="numero"
                        required
                        value={ddtFormData.numero}
                        onChange={(e) => setDdtFormData(prev => ({ ...prev, numero: e.target.value }))}
                        className="h-7 text-xs"
                      />
                    </div>
                    <div>
                      <Label htmlFor="dataEmissione" className="text-[10px]">Data Emissione *</Label>
                      <Input
                        id="dataEmissione"
                        type="date"
                        required
                        value={ddtFormData.dataEmissione}
                        onChange={(e) => setDdtFormData(prev => ({ ...prev, dataEmissione: e.target.value }))}
                        className="h-7 text-xs"
                      />
                    </div>
                    <div>
                      <Label htmlFor="causaleTrasporto" className="text-[10px]">Causale</Label>
                      <Select value={ddtFormData.causaleTrasporto} onValueChange={(v) => setDdtFormData(prev => ({ ...prev, causaleTrasporto: v }))}>
                        <SelectTrigger className="h-7 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CAUSALI_TRASPORTO.map(c => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="stato" className="text-[10px]">Stato</Label>
                      <Select value={ddtFormData.stato} onValueChange={(v) => setDdtFormData(prev => ({ ...prev, stato: v }))}>
                        <SelectTrigger className="h-7 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATI_DDT.map(stato => (
                            <SelectItem key={stato.value} value={stato.value}>{stato.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                {/* SEZIONE DESTINATARIO */}
                <Card className="border-green-200 bg-green-50/30">
                  <CardHeader className="pb-1 pt-2">
                    <CardTitle className="text-xs flex items-center gap-1.5 text-green-700">
                      <Building2 className="h-3 w-3" />
                      Destinatario
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 pb-2">
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Label className="text-[10px]">Seleziona da Anagrafica</Label>
                        <Select value={ddtFormData.clienteId || "_manual"} onValueChange={handleDdtClienteSelect}>
                          <SelectTrigger className="h-7 text-xs">
                            <SelectValue placeholder="Seleziona cliente" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="_manual">Inserimento manuale</SelectItem>
                            {anagraficaClienti.map((c) => (
                              <SelectItem key={c.id} value={c.id}>
                                {c.ragioneSociale} {c.partitaIva ? `(${c.partitaIva})` : ""}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {ddtFormData.clienteId && ddtFormData.clienteId !== "_manual" && (
                        <Badge variant="outline" className="text-green-600 self-end h-7 px-2 text-[10px]">
                          <Building2 className="h-2.5 w-2.5 mr-1" />
                          OK
                        </Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor="ragioneSociale" className="text-[10px]">Ragione Sociale *</Label>
                        <Input
                          id="ragioneSociale"
                          required
                          value={ddtFormData.ragioneSociale}
                          onChange={(e) => setDdtFormData(prev => ({ ...prev, ragioneSociale: e.target.value }))}
                          className="h-7 text-xs"
                        />
                      </div>
                      <div>
                        <Label htmlFor="partitaIva" className="text-[10px]">Partita IVA</Label>
                        <Input
                          id="partitaIva"
                          value={ddtFormData.partitaIva}
                          onChange={(e) => setDdtFormData(prev => ({ ...prev, partitaIva: e.target.value }))}
                          className="h-7 text-xs"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-6 gap-2">
                      <div className="col-span-3">
                        <Label htmlFor="indirizzo" className="text-[10px]">Indirizzo</Label>
                        <Input
                          id="indirizzo"
                          value={ddtFormData.indirizzo}
                          onChange={(e) => setDdtFormData(prev => ({ ...prev, indirizzo: e.target.value }))}
                          className="h-7 text-xs"
                        />
                      </div>
                      <div>
                        <Label htmlFor="cap" className="text-[10px]">CAP</Label>
                        <Input
                          id="cap"
                          value={ddtFormData.cap}
                          onChange={(e) => setDdtFormData(prev => ({ ...prev, cap: e.target.value }))}
                          className="h-7 text-xs"
                        />
                      </div>
                      <div className="col-span-2">
                        <Label htmlFor="citta" className="text-[10px]">Città</Label>
                        <Input
                          id="citta"
                          value={ddtFormData.citta}
                          onChange={(e) => setDdtFormData(prev => ({ ...prev, citta: e.target.value }))}
                          className="h-7 text-xs"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* SEZIONE TRASPORTO */}
                <Card className="border-orange-200 bg-orange-50/30">
                  <CardHeader className="pb-1 pt-2">
                    <CardTitle className="text-xs flex items-center gap-1.5 text-orange-700">
                      <Truck className="h-3 w-3" />
                      Dati Trasporto
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 pb-2">
                    <div className="grid grid-cols-4 gap-2">
                      <div>
                        <Label htmlFor="dataTrasporto" className="text-[10px]">Data</Label>
                        <Input
                          id="dataTrasporto"
                          type="date"
                          value={ddtFormData.dataTrasporto}
                          onChange={(e) => setDdtFormData(prev => ({ ...prev, dataTrasporto: e.target.value }))}
                          className="h-7 text-xs"
                        />
                      </div>
                      <div>
                        <Label htmlFor="oraTrasporto" className="text-[10px]">Ora</Label>
                        <Input
                          id="oraTrasporto"
                          type="time"
                          value={ddtFormData.oraTrasporto}
                          onChange={(e) => setDdtFormData(prev => ({ ...prev, oraTrasporto: e.target.value }))}
                          className="h-7 text-xs"
                        />
                      </div>
                      <div>
                        <Label htmlFor="tipoTrasporto" className="text-[10px]">Tipo</Label>
                        <Select value={ddtFormData.tipoTrasporto} onValueChange={(v) => setDdtFormData(prev => ({ ...prev, tipoTrasporto: v }))}>
                          <SelectTrigger className="h-7 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {TIPI_TRASPORTO.map(t => (
                              <SelectItem key={t} value={t}>{t}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="aspettoBeni" className="text-[10px]">Aspetto</Label>
                        <Select value={ddtFormData.aspettoBeni} onValueChange={(v) => setDdtFormData(prev => ({ ...prev, aspettoBeni: v }))}>
                          <SelectTrigger className="h-7 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ASPETTI_BENI.map(a => (
                              <SelectItem key={a} value={a}>{a}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <details className="group">
                      <summary className="cursor-pointer text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1">
                        <ChevronRight className="h-2.5 w-2.5 group-open:rotate-90 transition-transform" />
                        Opzioni avanzate
                      </summary>
                      <div className="grid grid-cols-4 gap-2 mt-1.5 pt-1.5 border-t">
                        <div>
                          <Label htmlFor="vettore" className="text-[10px]">Vettore</Label>
                          <Input
                            id="vettore"
                            value={ddtFormData.vettore}
                            onChange={(e) => setDdtFormData(prev => ({ ...prev, vettore: e.target.value }))}
                            placeholder="Corriere"
                            className="h-7 text-xs"
                          />
                        </div>
                        <div>
                          <Label htmlFor="porto" className="text-[10px]">Porto</Label>
                          <Select value={ddtFormData.porto} onValueChange={(v) => setDdtFormData(prev => ({ ...prev, porto: v }))}>
                            <SelectTrigger className="h-7 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Franco">Franco</SelectItem>
                              <SelectItem value="Assegnato">Assegnato</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="colli" className="text-[10px]">Colli</Label>
                          <Input
                            id="colli"
                            type="number"
                            value={ddtFormData.colli}
                            onChange={(e) => setDdtFormData(prev => ({ ...prev, colli: e.target.value }))}
                            className="h-7 text-xs"
                          />
                        </div>
                        <div>
                          <Label htmlFor="pesoLordo" className="text-[10px]">Peso (kg)</Label>
                          <Input
                            id="pesoLordo"
                            type="number"
                            step="0.01"
                            value={ddtFormData.pesoLordo}
                            onChange={(e) => setDdtFormData(prev => ({ ...prev, pesoLordo: e.target.value }))}
                            className="h-7 text-xs"
                          />
                        </div>
                      </div>
                    </details>
                  </CardContent>
                </Card>

                {/* NOTE */}
                <div>
                  <Label htmlFor="note" className="text-[10px] flex items-center gap-1">
                    <StickyNote className="h-2.5 w-2.5 text-muted-foreground" />
                    Note
                  </Label>
                  <Textarea
                    id="note"
                    value={ddtFormData.note}
                    onChange={(e) => setDdtFormData(prev => ({ ...prev, note: e.target.value }))}
                    rows={2}
                    placeholder="Note aggiuntive..."
                    className="text-xs"
                  />
                </div>
              </div>

              {/* COLONNA DESTRA - Articoli */}
              <div className="col-span-3">
                <Card className="border-purple-200 bg-purple-50/30 h-full flex flex-col">
                  <CardHeader className="pb-1 pt-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xs flex items-center gap-1.5 text-purple-700">
                        <Boxes className="h-3 w-3" />
                        Articoli ({ddtLines.length})
                      </CardTitle>
                    </div>
                    <div className="flex gap-1.5 mt-1.5">
                      <Select onValueChange={(articleId) => {
                        const article = catalogArticles?.find((a: any) => a.id === articleId);
                        if (article) {
                          setDdtLines(prev => [...prev, {
                            codiceArticolo: article.codice || "",
                            descrizione: article.nome || "",
                            quantita: "1",
                            unitaMisura: article.unitaMisura || "pz",
                            note: "",
                          }]);
                        }
                      }}>
                        <SelectTrigger className="flex-1 h-6 text-[10px]">
                          <SelectValue placeholder="+ Articolo" />
                        </SelectTrigger>
                        <SelectContent>
                          {catalogArticles?.map((a: any) => {
                            const giacenza = a.giacenza || 0;
                            const occupato = catalogOccupati[a.codice] || 0;
                            const disponibile = giacenza - occupato;
                            return (
                              <SelectItem key={a.id} value={a.id}>
                                <div className="flex items-center justify-between w-full gap-2">
                                  <span>{a.codice} - {a.nome}</span>
                                  <span className={`text-[10px] font-medium ${disponibile <= 0 ? 'text-red-600' : 'text-green-600'}`}>
                                    [{disponibile}]
                                  </span>
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-6 text-[10px] px-2"
                        onClick={() => setDdtLines(prev => [...prev, {
                          codiceArticolo: "",
                          descrizione: "",
                          quantita: "1",
                          unitaMisura: "pz",
                          note: "",
                        }])}
                      >
                        <Plus className="h-2.5 w-2.5 mr-0.5" /> +
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 overflow-y-auto pb-2">
                    {ddtLines.length > 0 ? (
                      <div className="space-y-1.5">
                        {ddtLines.map((line, idx) => (
                          <div key={idx} className="bg-white rounded border p-1.5 space-y-1">
                            <div className="flex items-center gap-1">
                              <Input
                                value={line.codiceArticolo}
                                onChange={(e) => {
                                  const newLines = [...ddtLines];
                                  newLines[idx].codiceArticolo = e.target.value;
                                  setDdtLines(newLines);
                                }}
                                placeholder="Cod."
                                className="h-6 text-[10px] w-16"
                              />
                              <Input
                                value={line.descrizione}
                                onChange={(e) => {
                                  const newLines = [...ddtLines];
                                  newLines[idx].descrizione = e.target.value;
                                  setDdtLines(newLines);
                                }}
                                placeholder="Descrizione"
                                className="h-6 text-[10px] flex-1"
                              />
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0"
                                onClick={() => setDdtLines(prev => prev.filter((_, i) => i !== idx))}
                              >
                                <Trash2 className="h-2.5 w-2.5 text-destructive" />
                              </Button>
                            </div>
                            <div className="flex items-center gap-1">
                              <Label className="text-[10px] text-muted-foreground">Q:</Label>
                              <Input
                                type="number"
                                value={line.quantita}
                                onChange={(e) => {
                                  const newLines = [...ddtLines];
                                  newLines[idx].quantita = e.target.value;
                                  setDdtLines(newLines);
                                }}
                                className="h-6 text-[10px] w-12"
                              />
                              <Select
                                value={line.unitaMisura}
                                onValueChange={(v) => {
                                  const newLines = [...ddtLines];
                                  newLines[idx].unitaMisura = v;
                                  setDdtLines(newLines);
                                }}
                              >
                                <SelectTrigger className="h-6 text-[10px] w-14">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pz">pz</SelectItem>
                                  <SelectItem value="kg">kg</SelectItem>
                                  <SelectItem value="lt">lt</SelectItem>
                                  <SelectItem value="mt">mt</SelectItem>
                                  <SelectItem value="mq">mq</SelectItem>
                                  <SelectItem value="mc">mc</SelectItem>
                                  <SelectItem value="conf">conf</SelectItem>
                                  <SelectItem value="scatola">scatola</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center text-muted-foreground py-4 border rounded-md bg-white border-dashed h-full flex flex-col items-center justify-center">
                        <Boxes className="h-6 w-6 mx-auto mb-1 opacity-50" />
                        <p className="text-[10px]">Nessun articolo</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {/* PULSANTI FOOTER */}
          <div className="flex justify-end gap-2 px-4 py-3 border-t bg-muted/30">
            <Button type="button" variant="outline" size="sm" onClick={() => setDdtDialogOpen(false)}>
              Annulla
            </Button>
            <Button size="sm" onClick={() => handleSaveDdt(ddtFormData)}>
              {selectedDdt ? "Salva" : "Crea DDT"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Importazione DDT */}
      <Dialog open={ddtImportDialogOpen} onOpenChange={setDdtImportDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Importa DDT da Excel</DialogTitle>
            <DialogDescription>
              Carica un file Excel con i dati dei DDT da importare
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="border-2 border-dashed border-muted rounded-lg p-6 text-center">
              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <Label
                htmlFor="ddt-import-file"
                className="cursor-pointer text-sm text-muted-foreground hover:text-foreground"
              >
                {isImportingDdt ? (
                  <div className="space-y-2">
                    <Progress value={ddtImportProgress} className="h-3" />
                    <p className="font-medium">{ddtImportProgress}% completato</p>
                  </div>
                ) : (
                  <>
                    <p className="font-medium">Clicca per caricare file Excel (.xlsx, .xls)</p>
                    <p className="text-xs mt-1">Oppure trascina qui il file</p>
                  </>
                )}
              </Label>
              <Input
                type="file"
                id="ddt-import-file"
                accept=".xlsx,.xls"
                className="hidden"
                disabled={isImportingDdt}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;

                  setIsImportingDdt(true);
                  setDdtImportProgress(10);

                  try {
                    const formData = new FormData();
                    formData.append("file", file);

                    setDdtImportProgress(30);

                    const res = await fetch("/api/finance/ddt/import", {
                      method: "POST",
                      body: formData,
                      credentials: "include",
                    });

                    setDdtImportProgress(80);

                    const result = await res.json();

                    if (!res.ok) {
                      throw new Error(result.error || "Errore importazione");
                    }

                    setDdtImportProgress(100);

                    toast({
                      title: "Importazione completata",
                      description: result.message,
                    });

                    if (result.errors && result.errors.length > 0) {
                      console.log("Errori importazione:", result.errors);
                    }

                    queryClient.invalidateQueries({ queryKey: ["/api/finance/ddt"] });
                    setDdtImportDialogOpen(false);
                  } catch (error) {
                    toast({
                      title: "Errore",
                      description: (error as Error).message,
                      variant: "destructive",
                    });
                  } finally {
                    setIsImportingDdt(false);
                    setDdtImportProgress(0);
                    e.target.value = "";
                  }
                }}
              />
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-xs space-y-1">
              <p className="font-medium">Colonne riconosciute:</p>
              <ul className="list-disc pl-4 space-y-0.5 text-muted-foreground">
                <li>Numero, Data</li>
                <li>Cliente/Destinatario, Partita IVA</li>
                <li>Indirizzo, CAP, Città, Provincia</li>
                <li>Causale, Colli, Peso</li>
                <li>Descrizione, Quantità, UM (per righe)</li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={ddtReportPercorsoOpen} onOpenChange={setDdtReportPercorsoOpen}>
        <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Route className="h-5 w-5" />
              Report Percorso Consegne DDT
            </DialogTitle>
            <DialogDescription>
              Itinerario ottimizzato per le consegne attive con tempi e distanze
            </DialogDescription>
          </DialogHeader>

          {ddtReportPercorsoLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Calcolo percorso ottimizzato in corso...</p>
              <p className="text-xs text-muted-foreground mt-2">Geocodifica indirizzi e calcolo route...</p>
            </div>
          ) : ddtReportPercorsoData?.stops?.length ? (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <Card className="p-4 bg-blue-50 dark:bg-blue-950/30">
                  <div className="flex items-center gap-2">
                    <Navigation className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-xs text-muted-foreground">Tappe</p>
                      <p className="text-xl font-bold">{ddtReportPercorsoData.stops.length}</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-4 bg-green-50 dark:bg-green-950/30">
                  <div className="flex items-center gap-2">
                    <Route className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-xs text-muted-foreground">Distanza Totale</p>
                      <p className="text-xl font-bold">{ddtReportPercorsoData.totalDistance} km</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-4 bg-orange-50 dark:bg-orange-950/30">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-orange-600" />
                    <div>
                      <p className="text-xs text-muted-foreground">Tempo Totale</p>
                      <p className="text-xl font-bold">{formatDurationDdt(ddtReportPercorsoData.totalDuration)}</p>
                    </div>
                  </div>
                </Card>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left px-3 py-2 font-medium w-12">#</th>
                      <th className="text-left px-3 py-2 font-medium">Spedizione</th>
                      <th className="text-left px-3 py-2 font-medium">Cliente</th>
                      <th className="text-left px-3 py-2 font-medium">Indirizzo</th>
                      <th className="text-right px-3 py-2 font-medium">Tratta</th>
                      <th className="text-right px-3 py-2 font-medium">Totale</th>
                      <th className="text-right px-3 py-2 font-medium">Arrivo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ddtReportPercorsoData.stops.map((stop: any) => (
                      <tr key={stop.spedizioneId} className="border-t hover:bg-muted/30">
                        <td className="px-3 py-2 font-bold text-lg text-blue-600">{stop.ordine}</td>
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
                          <span className="text-muted-foreground text-xs block">{formatDurationDdt(stop.durataCumulativa)}</span>
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-sm">
                          {stop.arrivoStimato ? new Date(stop.arrivoStimato).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }) : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDdtReportPercorsoOpen(false)}>
                  Chiudi
                </Button>
                <Button onClick={generateDdtReportPdf}>
                  <Download className="h-4 w-4 mr-2" />
                  Scarica PDF
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <Truck className="h-12 w-12 mb-4 text-blue-400" />
              {ddtReportPercorsoData?.message === "Nessun DDT in spedizione" ? (
                <>
                  <p className="font-medium text-foreground">Nessun DDT in spedizione</p>
                  <p className="text-sm text-muted-foreground mt-2 text-center max-w-md">
                    Per generare il report percorso, imposta lo stato "In Spedizione" su almeno un DDT dalla tabella sopra.
                  </p>
                </>
              ) : ddtReportPercorsoData?.error === "Nessun indirizzo valido trovato" ? (
                <>
                  <p className="font-medium text-orange-600">Indirizzi mancanti</p>
                  <p className="text-sm text-muted-foreground mt-2 text-center max-w-md">
                    I DDT in spedizione non hanno indirizzi di destinazione compilati. Modifica i DDT e aggiungi indirizzo, città e CAP del destinatario.
                  </p>
                </>
              ) : (
                <>
                  <p className="font-medium text-foreground">Nessun risultato</p>
                  <p className="text-sm text-muted-foreground mt-2 text-center max-w-md">
                    Verifica che i DDT in spedizione abbiano indirizzi validi.
                  </p>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
