import { AppLayout } from "@/components/layout/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Building2, Truck, BookUser, Plus, Search, MoreHorizontal, Trash2, Edit2, Loader2, Phone, Mail, MapPin, Filter, X, AlertTriangle, CheckCircle2, Tag, Copy, LinkIcon, ExternalLink, Check, Share2, Clock, Eye, Calendar, Receipt, Euro, Globe, Briefcase, Save, LayoutGrid, Map as MapIcon, Upload, FileSpreadsheet, Download, Key, Bell, User, Lock, FileText, Maximize2, Minimize2 } from "lucide-react";
import * as XLSX from "xlsx";
import { ClientiMap } from "@/components/ClientiMap";
import { findCittaInfo, searchCitta, CittaInfo } from "@/lib/cittaItaliane";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { CopyLinkButton } from "@/components/CopyLinkButton";
import { ContactsTab } from "@/components/ContactsTab";

const STATI = [
  { value: "attivo", label: "Attivo", color: "bg-green-500" },
  { value: "sospeso", label: "Sospeso", color: "bg-yellow-500" },
  { value: "cessato", label: "Cessato", color: "bg-red-500" },
];

const PROVINCE_ITALIANE = [
  "AG", "AL", "AN", "AO", "AR", "AP", "AT", "AV", "BA", "BT", "BL", "BN", "BG", "BI", "BO", "BZ", "BS", "BR", "CA", "CL", "CB", "CE", "CT", "CZ", "CH", "CO", "CS", "CR", "KR", "CN", "EN", "FM", "FE", "FI", "FG", "FC", "FR", "GE", "GO", "GR", "IM", "IS", "SP", "AQ", "LT", "LE", "LC", "LI", "LO", "LU", "MC", "MN", "MS", "MT", "ME", "MI", "MO", "MB", "NA", "NO", "NU", "OR", "PD", "PA", "PR", "PV", "PG", "PU", "PE", "PC", "PI", "PT", "PN", "PZ", "PO", "RG", "RA", "RC", "RE", "RI", "RN", "RM", "RO", "SA", "SS", "SV", "SI", "SR", "SO", "SU", "TA", "TE", "TR", "TO", "TP", "TN", "TV", "TS", "UD", "VA", "VE", "VB", "VC", "VR", "VV", "VI", "VT"
];

const REGIONE_COLORS: { [key: string]: string } = {
  "MI": "#3b82f6", "MB": "#3b82f6", "VA": "#3b82f6", "CO": "#3b82f6", "LC": "#3b82f6", "BG": "#3b82f6", "BS": "#3b82f6", "PV": "#3b82f6", "LO": "#3b82f6", "CR": "#3b82f6", "MN": "#3b82f6", "SO": "#3b82f6",
  "TO": "#8b5cf6", "VC": "#8b5cf6", "NO": "#8b5cf6", "CN": "#8b5cf6", "AT": "#8b5cf6", "AL": "#8b5cf6", "BI": "#8b5cf6", "VB": "#8b5cf6",
  "GE": "#06b6d4", "IM": "#06b6d4", "SP": "#06b6d4", "SV": "#06b6d4",
  "VE": "#10b981", "PD": "#10b981", "VR": "#10b981", "VI": "#10b981", "TV": "#10b981", "BL": "#10b981", "RO": "#10b981",
  "TS": "#14b8a6", "UD": "#14b8a6", "GO": "#14b8a6", "PN": "#14b8a6",
  "TN": "#f59e0b", "BZ": "#f59e0b",
  "BO": "#ef4444", "MO": "#ef4444", "RE": "#ef4444", "PR": "#ef4444", "PC": "#ef4444", "FE": "#ef4444", "RA": "#ef4444", "FC": "#ef4444", "RN": "#ef4444",
  "FI": "#f97316", "AR": "#f97316", "SI": "#f97316", "GR": "#f97316", "LI": "#f97316", "PI": "#f97316", "LU": "#f97316", "MS": "#f97316", "PT": "#f97316", "PO": "#f97316",
  "PG": "#84cc16", "TR": "#84cc16",
  "AN": "#22c55e", "PU": "#22c55e", "MC": "#22c55e", "AP": "#22c55e", "FM": "#22c55e",
  "RM": "#dc2626", "VT": "#dc2626", "RI": "#dc2626", "LT": "#dc2626", "FR": "#dc2626",
  "AQ": "#a855f7", "TE": "#a855f7", "PE": "#a855f7", "CH": "#a855f7",
  "CB": "#d946ef", "IS": "#d946ef",
  "NA": "#0ea5e9", "SA": "#0ea5e9", "CE": "#0ea5e9", "BN": "#0ea5e9", "AV": "#0ea5e9",
  "BA": "#6366f1", "TA": "#6366f1", "BR": "#6366f1", "LE": "#6366f1", "FG": "#6366f1", "BT": "#6366f1",
  "PZ": "#ec4899", "MT": "#ec4899",
  "CS": "#f43f5e", "CZ": "#f43f5e", "KR": "#f43f5e", "VV": "#f43f5e", "RC": "#f43f5e",
  "PA": "#eab308", "CT": "#eab308", "ME": "#eab308", "AG": "#eab308", "CL": "#eab308", "EN": "#eab308", "RG": "#eab308", "SR": "#eab308", "TP": "#eab308",
  "CA": "#64748b", "SS": "#64748b", "NU": "#64748b", "OR": "#64748b", "SU": "#64748b",
  "AO": "#7c3aed",
};

function getProvinciaColor(provincia: string | null | undefined): string {
  if (!provincia) return "#94a3b8";
  return REGIONE_COLORS[provincia.toUpperCase()] || "#94a3b8";
}

function validateCodiceFiscale(cf: string): { valid: boolean; message: string } {
  if (!cf) return { valid: true, message: "" };
  const cleanCf = cf.toUpperCase().replace(/\s/g, "");
  if (cleanCf.length !== 16) return { valid: false, message: "Il codice fiscale deve essere di 16 caratteri" };
  const regex = /^[A-Z]{6}[0-9]{2}[A-Z][0-9]{2}[A-Z][0-9]{3}[A-Z]$/;
  if (!regex.test(cleanCf)) return { valid: false, message: "Formato codice fiscale non valido" };

  const oddMap: { [key: string]: number } = {
    "0": 1, "1": 0, "2": 5, "3": 7, "4": 9, "5": 13, "6": 15, "7": 17, "8": 19, "9": 21,
    "A": 1, "B": 0, "C": 5, "D": 7, "E": 9, "F": 13, "G": 15, "H": 17, "I": 19, "J": 21,
    "K": 2, "L": 4, "M": 18, "N": 20, "O": 11, "P": 3, "Q": 6, "R": 8, "S": 12, "T": 14,
    "U": 16, "V": 10, "W": 22, "X": 25, "Y": 24, "Z": 23
  };
  const evenMap: { [key: string]: number } = {
    "0": 0, "1": 1, "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7, "8": 8, "9": 9,
    "A": 0, "B": 1, "C": 2, "D": 3, "E": 4, "F": 5, "G": 6, "H": 7, "I": 8, "J": 9,
    "K": 10, "L": 11, "M": 12, "N": 13, "O": 14, "P": 15, "Q": 16, "R": 17, "S": 18, "T": 19,
    "U": 20, "V": 21, "W": 22, "X": 23, "Y": 24, "Z": 25
  };
  const controlChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  let sum = 0;
  for (let i = 0; i < 15; i++) {
    const char = cleanCf[i];
    if (i % 2 === 0) {
      sum += oddMap[char] ?? 0;
    } else {
      sum += evenMap[char] ?? 0;
    }
  }
  const expectedControl = controlChars[sum % 26];
  if (cleanCf[15] !== expectedControl) {
    return { valid: false, message: "Codice fiscale non valido (cifra di controllo errata)" };
  }
  return { valid: true, message: "" };
}

function validatePartitaIva(piva: string): { valid: boolean; message: string } {
  if (!piva) return { valid: true, message: "" };
  const cleanPiva = piva.replace(/\s/g, "");
  if (cleanPiva.length !== 11) return { valid: false, message: "La partita IVA deve essere di 11 cifre" };
  if (!/^\d{11}$/.test(cleanPiva)) return { valid: false, message: "La partita IVA deve contenere solo numeri" };
  let sum = 0;
  for (let i = 0; i < 10; i++) {
    const digit = parseInt(cleanPiva[i]);
    if (i % 2 === 0) {
      sum += digit;
    } else {
      const doubled = digit * 2;
      sum += doubled > 9 ? doubled - 9 : doubled;
    }
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  if (checkDigit !== parseInt(cleanPiva[10])) return { valid: false, message: "Partita IVA non valida (controllo cifra)" };
  return { valid: true, message: "" };
}

function validateIban(iban: string): { valid: boolean; message: string } {
  if (!iban) return { valid: true, message: "" };
  const cleanIban = iban.toUpperCase().replace(/\s/g, "");
  if (cleanIban.length !== 27) return { valid: false, message: "L'IBAN italiano deve essere di 27 caratteri" };
  if (!cleanIban.startsWith("IT")) return { valid: false, message: "L'IBAN deve iniziare con IT" };
  const regex = /^IT[0-9]{2}[A-Z][0-9]{10}[0-9A-Z]{12}$/;
  if (!regex.test(cleanIban)) return { valid: false, message: "Formato IBAN non valido" };

  const rearranged = cleanIban.slice(4) + cleanIban.slice(0, 4);
  let numericIban = "";
  for (const char of rearranged) {
    if (char >= "A" && char <= "Z") {
      numericIban += (char.charCodeAt(0) - 55).toString();
    } else {
      numericIban += char;
    }
  }
  let remainder = 0;
  for (let i = 0; i < numericIban.length; i += 7) {
    const chunk = remainder.toString() + numericIban.slice(i, i + 7);
    remainder = parseInt(chunk, 10) % 97;
  }
  if (remainder !== 1) {
    return { valid: false, message: "IBAN non valido (controllo mod-97 fallito)" };
  }
  return { valid: true, message: "" };
}

function StatoBadge({ stato }: { stato: string }) {
  const config = STATI.find(s => s.value === stato) || STATI[0];
  return (
    <Badge variant="outline" className="gap-1 text-xs">
      <div className={`h-2 w-2 rounded-full ${config.color}`} />
      {config.label}
    </Badge>
  );
}

function TagsDisplay({ tags }: { tags: string | null }) {
  if (!tags) return null;
  const tagList = tags.split(",").filter(t => t.trim());
  if (tagList.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1 mt-2">
      {tagList.map((tag, i) => (
        <Badge key={i} variant="secondary" className="text-xs">
          <Tag className="h-2 w-2 mr-1" />
          {tag.trim()}
        </Badge>
      ))}
    </div>
  );
}

function ValidationInput({
  label, value, onChange, validate, placeholder, type = "text", required = false
}: {
  label: string; value: string; onChange: (v: string) => void;
  validate?: (v: string) => { valid: boolean; message: string };
  placeholder?: string; type?: string; required?: boolean;
}) {
  const validation = validate ? validate(value) : { valid: true, message: "" };
  return (
    <div>
      <Label>{label} {required && "*"}</Label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={!validation.valid ? "border-red-500" : ""}
      />
      {!validation.valid && (
        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          {validation.message}
        </p>
      )}
    </div>
  );
}

const apiPersonale = {
  getAll: async () => {
    const res = await fetch("/api/anagrafica/personale", { credentials: "include" });
    if (!res.ok) throw new Error("Errore");
    return res.json();
  },
  create: async (data: any) => {
    const res = await fetch("/api/anagrafica/personale", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      credentials: "include",
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || "Errore nel salvataggio");
    }
    return res.json();
  },
  update: async (id: string, data: any) => {
    const res = await fetch(`/api/anagrafica/personale/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      credentials: "include",
    });
    if (!res.ok) throw new Error("Errore");
    return res.json();
  },
  delete: async (id: string) => {
    const res = await fetch(`/api/anagrafica/personale/${id}`, { method: "DELETE", credentials: "include" });
    if (!res.ok) throw new Error("Errore");
  },
};

const apiClienti = {
  getAll: async () => {
    const res = await fetch("/api/anagrafica/clienti");
    if (!res.ok) throw new Error("Errore");
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  },
  create: async (data: any) => {
    const res = await fetch("/api/anagrafica/clienti", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Errore");
    return res.json();
  },
  update: async (id: string, data: any) => {
    const res = await fetch(`/api/anagrafica/clienti/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Errore");
    return res.json();
  },
  delete: async (id: string) => {
    const res = await fetch(`/api/anagrafica/clienti/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Errore");
  },
};

const apiFornitori = {
  getAll: async () => {
    const res = await fetch("/api/anagrafica/fornitori");
    if (!res.ok) throw new Error("Errore");
    return res.json();
  },
  create: async (data: any) => {
    const res = await fetch("/api/anagrafica/fornitori", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Errore");
    return res.json();
  },
  update: async (id: string, data: any) => {
    const res = await fetch(`/api/anagrafica/fornitori/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Errore");
    return res.json();
  },
  delete: async (id: string) => {
    const res = await fetch(`/api/anagrafica/fornitori/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Errore");
  },
};

const apiCompanyInfo = {
  get: async () => {
    const res = await fetch("/api/company-info");
    if (!res.ok) throw new Error("Errore");
    return res.json();
  },
  save: async (data: any) => {
    const res = await fetch("/api/company-info", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Errore");
    return res.json();
  },
};

const apiContiBancari = {
  getAll: async () => {
    const res = await fetch("/api/azienda/conti-bancari");
    if (!res.ok) throw new Error("Errore");
    return res.json();
  },
  create: async (data: any) => {
    const res = await fetch("/api/azienda/conti-bancari", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Errore");
    return res.json();
  },
  update: async (id: string, data: any) => {
    const res = await fetch(`/api/azienda/conti-bancari/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Errore");
    return res.json();
  },
  delete: async (id: string) => {
    const res = await fetch(`/api/azienda/conti-bancari/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Errore");
  },
};

function AziendaTab() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    ragioneSociale: "",
    partitaIva: "",
    codiceFiscale: "",
    codiceDestinatario: "",
    pec: "",
    indirizzoSede: "",
    capSede: "",
    cittaSede: "",
    provinciaSede: "",
    nazioneSede: "Italia",
    indirizzoOperativo: "",
    capOperativo: "",
    cittaOperativo: "",
    provinciaOperativo: "",
    nazioneOperativo: "Italia",
    latitudine: "",
    longitudine: "",
    telefono: "",
    fax: "",
    email: "",
    website: "",
    iban: "",
    banca: "",
    swift: "",
    note: "",
  });
  const [contiBancari, setContiBancari] = useState<any[]>([]);
  const [loadingConti, setLoadingConti] = useState(false);
  const [showContoDialog, setShowContoDialog] = useState(false);
  const [editingConto, setEditingConto] = useState<any>(null);
  const [newConto, setNewConto] = useState({ nome: "", iban: "", banca: "", swift: "", abi: "", cab: "", intestatario: "", filiale: "", note: "", principale: false });
  const [isLoadingBancaConto, setIsLoadingBancaConto] = useState(false);

  const loadContiBancari = async () => {
    setLoadingConti(true);
    try {
      const data = await apiContiBancari.getAll();
      setContiBancari(data);
    } catch (error) {
      console.error("Errore nel caricamento conti:", error);
    } finally {
      setLoadingConti(false);
    }
  };

  useEffect(() => {
    loadContiBancari();
  }, []);

  const handleIbanChangeConto = async (iban: string, isEditing: boolean = false) => {
    const cleanIban = iban.toUpperCase().replace(/\s/g, "");
    if (isEditing) {
      setEditingConto((prev: any) => ({ ...prev, iban: cleanIban }));
    } else {
      setNewConto(prev => ({ ...prev, iban: cleanIban }));
    }

    if (cleanIban.length === 27 && cleanIban.startsWith("IT")) {
      const abi = cleanIban.substring(5, 10);
      const cab = cleanIban.substring(10, 15);

      const bankInfo = ITALIAN_BANKS[abi];
      if (bankInfo) {
        if (isEditing) {
          setEditingConto((prev: any) => ({ ...prev, abi, cab, banca: bankInfo.nome }));
        } else {
          setNewConto(prev => ({ ...prev, abi, cab, banca: bankInfo.nome }));
        }
        return;
      }

      setIsLoadingBancaConto(true);
      try {
        const response = await fetch(`https://openiban.com/validate/${cleanIban}?getBIC=true&validateBankCode=true`);
        if (response.ok) {
          const data = await response.json();
          if (data.valid && data.bankData) {
            if (isEditing) {
              setEditingConto((prev: any) => ({ ...prev, abi, cab, banca: data.bankData.name || "", swift: data.bankData.bic || "" }));
            } else {
              setNewConto(prev => ({ ...prev, abi, cab, banca: data.bankData.name || "", swift: data.bankData.bic || "" }));
            }
          }
        }
      } catch (e) {
        console.error("Errore OpenIBAN:", e);
      } finally {
        setIsLoadingBancaConto(false);
      }
    }
  };

  const handleSaveConto = async () => {
    if (!newConto.nome || !newConto.iban) {
      toast({ title: "Errore", description: "Nome e IBAN sono obbligatori", variant: "destructive" });
      return;
    }
    try {
      await apiContiBancari.create(newConto);
      toast({ title: "Conto aggiunto", description: "Il conto bancario è stato salvato" });
      setShowContoDialog(false);
      setNewConto({ nome: "", iban: "", banca: "", swift: "", abi: "", cab: "", intestatario: "", filiale: "", note: "", principale: false });
      loadContiBancari();
    } catch (error) {
      toast({ title: "Errore", description: "Errore nel salvataggio del conto", variant: "destructive" });
    }
  };

  const handleUpdateConto = async () => {
    if (!editingConto?.nome || !editingConto?.iban) {
      toast({ title: "Errore", description: "Nome e IBAN sono obbligatori", variant: "destructive" });
      return;
    }
    try {
      await apiContiBancari.update(editingConto.id, editingConto);
      toast({ title: "Conto aggiornato", description: "Il conto bancario è stato modificato" });
      setEditingConto(null);
      loadContiBancari();
    } catch (error) {
      toast({ title: "Errore", description: "Errore nell'aggiornamento del conto", variant: "destructive" });
    }
  };

  const handleDeleteConto = async (id: string) => {
    if (!confirm("Eliminare questo conto bancario?")) return;
    try {
      await apiContiBancari.delete(id);
      toast({ title: "Conto eliminato" });
      loadContiBancari();
    } catch (error) {
      toast({ title: "Errore", description: "Errore nell'eliminazione", variant: "destructive" });
    }
  };

  const { data: companyInfo, isLoading } = useQuery({
    queryKey: ["company-info"],
    queryFn: apiCompanyInfo.get,
  });

  useEffect(() => {
    if (companyInfo) {
      setFormData({
        ragioneSociale: companyInfo.ragioneSociale || "",
        partitaIva: companyInfo.partitaIva || "",
        codiceFiscale: companyInfo.codiceFiscale || "",
        codiceDestinatario: companyInfo.codiceDestinatario || "",
        pec: companyInfo.pec || "",
        indirizzoSede: companyInfo.indirizzoSede || "",
        capSede: companyInfo.capSede || "",
        cittaSede: companyInfo.cittaSede || "",
        provinciaSede: companyInfo.provinciaSede || "",
        nazioneSede: companyInfo.nazioneSede || "Italia",
        indirizzoOperativo: companyInfo.indirizzoOperativo || "",
        capOperativo: companyInfo.capOperativo || "",
        cittaOperativo: companyInfo.cittaOperativo || "",
        provinciaOperativo: companyInfo.provinciaOperativo || "",
        nazioneOperativo: companyInfo.nazioneOperativo || "Italia",
        latitudine: companyInfo.latitudine || "",
        longitudine: companyInfo.longitudine || "",
        telefono: companyInfo.telefono || "",
        fax: companyInfo.fax || "",
        email: companyInfo.email || "",
        website: companyInfo.website || "",
        iban: companyInfo.iban || "",
        banca: companyInfo.banca || "",
        swift: companyInfo.swift || "",
        note: companyInfo.note || "",
      });
    }
  }, [companyInfo]);

  const handleSave = async () => {
    const missingFields = [];
    if (!formData.ragioneSociale.trim()) missingFields.push("Ragione Sociale");
    if (!formData.partitaIva.trim()) missingFields.push("Partita IVA");
    if (!formData.codiceFiscale.trim()) missingFields.push("Codice Fiscale");
    if (!formData.codiceDestinatario.trim()) missingFields.push("Codice Destinatario (SDI)");

    if (missingFields.length > 0) {
      toast({
        title: "Errore di validazione",
        description: `I seguenti campi sono obbligatori: ${missingFields.join(", ")}`,
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      await apiCompanyInfo.save(formData);
      queryClient.invalidateQueries({ queryKey: ["company-info"] });
      toast({ title: "Salvato", description: "Dati aziendali salvati con successo" });
    } catch {
      toast({ title: "Errore", description: "Errore nel salvataggio", variant: "destructive" });
    }
    setSaving(false);
  };

  const update = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <Card className="p-8">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <Briefcase className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">La Mia Azienda</h2>
            <p className="text-sm text-muted-foreground">Inserisci i dati della tua azienda - verranno usati per fatture, DDT e spedizioni</p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Salva
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="p-4 bg-muted/50 rounded-lg">
            <h3 className="font-medium mb-4 flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Dati Societari
            </h3>
            <div className="space-y-3">
              <div>
                <Label>Ragione Sociale *</Label>
                <Input value={formData.ragioneSociale} onChange={e => update("ragioneSociale", e.target.value)} placeholder="Es: Azienda SRL" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <ValidationInput label="Partita IVA" value={formData.partitaIva} onChange={v => update("partitaIva", v)} validate={validatePartitaIva} placeholder="12345678901" required={true} />
                <ValidationInput label="Codice Fiscale" value={formData.codiceFiscale} onChange={v => update("codiceFiscale", v)} validate={validateCodiceFiscale} required={true} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Codice Destinatario (SDI) *</Label>
                  <Input value={formData.codiceDestinatario} onChange={e => update("codiceDestinatario", e.target.value)} placeholder="0000000" maxLength={7} />
                </div>
                <div>
                  <Label>PEC</Label>
                  <Input type="email" value={formData.pec} onChange={e => update("pec", e.target.value)} placeholder="azienda@pec.it" />
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-muted/50 rounded-lg">
            <h3 className="font-medium mb-4 flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Sede Legale
            </h3>
            <div className="space-y-3">
              <div>
                <Label>Indirizzo</Label>
                <Input value={formData.indirizzoSede} onChange={e => update("indirizzoSede", e.target.value)} placeholder="Via Roma, 1" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>CAP</Label>
                  <Input value={formData.capSede} onChange={e => update("capSede", e.target.value)} placeholder="00100" maxLength={5} />
                </div>
                <div>
                  <Label>Città</Label>
                  <Input value={formData.cittaSede} onChange={e => update("cittaSede", e.target.value)} placeholder="Roma" />
                </div>
                <div>
                  <Label>Provincia</Label>
                  <Select value={formData.provinciaSede} onValueChange={v => update("provinciaSede", v)}>
                    <SelectTrigger><SelectValue placeholder="Sel." /></SelectTrigger>
                    <SelectContent>
                      {PROVINCE_ITALIANE.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-900">
            <h3 className="font-medium mb-4 flex items-center gap-2 text-blue-700 dark:text-blue-300">
              <Truck className="h-4 w-4" />
              Sede Operativa (per Spedizioni)
            </h3>
            <p className="text-xs text-blue-600 dark:text-blue-400 mb-3">Questo indirizzo verrà usato come punto di partenza per calcolare i percorsi delle spedizioni</p>
            <div className="space-y-3">
              <div>
                <Label>Indirizzo Operativo</Label>
                <Input value={formData.indirizzoOperativo} onChange={e => update("indirizzoOperativo", e.target.value)} placeholder="Via del Magazzino, 10" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>CAP</Label>
                  <Input value={formData.capOperativo} onChange={e => update("capOperativo", e.target.value)} placeholder="00100" maxLength={5} />
                </div>
                <div>
                  <Label>Città</Label>
                  <Input value={formData.cittaOperativo} onChange={e => update("cittaOperativo", e.target.value)} placeholder="Roma" />
                </div>
                <div>
                  <Label>Provincia</Label>
                  <Select value={formData.provinciaOperativo} onValueChange={v => update("provinciaOperativo", v)}>
                    <SelectTrigger><SelectValue placeholder="Sel." /></SelectTrigger>
                    <SelectContent>
                      {PROVINCE_ITALIANE.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Latitudine (opzionale)</Label>
                  <Input value={formData.latitudine} onChange={e => update("latitudine", e.target.value)} placeholder="41.9028" />
                </div>
                <div>
                  <Label>Longitudine (opzionale)</Label>
                  <Input value={formData.longitudine} onChange={e => update("longitudine", e.target.value)} placeholder="12.4964" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-4 bg-muted/50 rounded-lg">
            <h3 className="font-medium mb-4 flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Contatti
            </h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Telefono</Label>
                  <Input value={formData.telefono} onChange={e => update("telefono", e.target.value)} placeholder="+39 06 1234567" />
                </div>
                <div>
                  <Label>Fax</Label>
                  <Input value={formData.fax} onChange={e => update("fax", e.target.value)} placeholder="+39 06 1234568" />
                </div>
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" value={formData.email} onChange={e => update("email", e.target.value)} placeholder="info@azienda.it" />
              </div>
              <div>
                <Label>Sito Web</Label>
                <Input value={formData.website} onChange={e => update("website", e.target.value)} placeholder="https://www.azienda.it" />
              </div>
            </div>
          </div>

          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium flex items-center gap-2">
                <Euro className="h-4 w-4" />
                Conti Bancari Aziendali
              </h3>
              <Button size="sm" onClick={() => setShowContoDialog(true)}>
                <Plus className="h-4 w-4 mr-1" /> Aggiungi Conto
              </Button>
            </div>
            {loadingConti ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : contiBancari.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Nessun conto bancario configurato</p>
            ) : (
              <div className="space-y-2">
                {contiBancari.map((conto: any) => (
                  <div key={conto.id} className={`p-3 rounded-lg border ${conto.principale ? 'bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800' : 'bg-background'}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{conto.nome}</span>
                          {conto.principale && <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 px-2 py-0.5 rounded">Principale</span>}
                        </div>
                        <p className="text-sm font-mono text-muted-foreground mt-1">{conto.iban}</p>
                        {conto.banca && <p className="text-xs text-muted-foreground">{conto.banca} {conto.swift && `- ${conto.swift}`}</p>}
                      </div>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => setEditingConto(conto)}>
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDeleteConto(conto.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Dialog Nuovo Conto Bancario */}
          <Dialog open={showContoDialog} onOpenChange={setShowContoDialog}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Nuovo Conto Bancario</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>Nome Conto *</Label>
                  <Input value={newConto.nome} onChange={e => setNewConto(prev => ({ ...prev, nome: e.target.value }))} placeholder="Es. Conto Principale, Conto Operativo..." />
                </div>
                <div>
                  <Label>IBAN *</Label>
                  <Input value={newConto.iban} onChange={e => handleIbanChangeConto(e.target.value)} placeholder="IT60X0542811101000000123456" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Banca {isLoadingBancaConto && <Loader2 className="h-3 w-3 animate-spin inline ml-1" />}</Label>
                    <Input value={newConto.banca} onChange={e => setNewConto(prev => ({ ...prev, banca: e.target.value }))} placeholder="Rilevata automaticamente" />
                  </div>
                  <div>
                    <Label>SWIFT/BIC</Label>
                    <Input value={newConto.swift} onChange={e => setNewConto(prev => ({ ...prev, swift: e.target.value }))} placeholder="ABCDITXX" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>ABI</Label>
                    <Input value={newConto.abi} onChange={e => setNewConto(prev => ({ ...prev, abi: e.target.value }))} disabled />
                  </div>
                  <div>
                    <Label>CAB</Label>
                    <Input value={newConto.cab} onChange={e => setNewConto(prev => ({ ...prev, cab: e.target.value }))} disabled />
                  </div>
                </div>
                <div>
                  <Label>Intestatario</Label>
                  <Input value={newConto.intestatario} onChange={e => setNewConto(prev => ({ ...prev, intestatario: e.target.value }))} placeholder="Ragione sociale intestatario" />
                </div>
                <div>
                  <Label>Filiale</Label>
                  <Input value={newConto.filiale} onChange={e => setNewConto(prev => ({ ...prev, filiale: e.target.value }))} placeholder="Nome filiale" />
                </div>
                <div>
                  <Label>Note</Label>
                  <Input value={newConto.note} onChange={e => setNewConto(prev => ({ ...prev, note: e.target.value }))} placeholder="Note aggiuntive" />
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="principale" checked={newConto.principale} onChange={e => setNewConto(prev => ({ ...prev, principale: e.target.checked }))} />
                  <Label htmlFor="principale" className="cursor-pointer">Imposta come conto principale</Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowContoDialog(false)}>Annulla</Button>
                <Button onClick={handleSaveConto}>Salva Conto</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Dialog Modifica Conto Bancario */}
          <Dialog open={!!editingConto} onOpenChange={(open) => !open && setEditingConto(null)}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Modifica Conto Bancario</DialogTitle>
              </DialogHeader>
              {editingConto && (
                <div className="space-y-3">
                  <div>
                    <Label>Nome Conto *</Label>
                    <Input value={editingConto.nome} onChange={e => setEditingConto((prev: any) => ({ ...prev, nome: e.target.value }))} />
                  </div>
                  <div>
                    <Label>IBAN *</Label>
                    <Input value={editingConto.iban} onChange={e => handleIbanChangeConto(e.target.value, true)} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Banca {isLoadingBancaConto && <Loader2 className="h-3 w-3 animate-spin inline ml-1" />}</Label>
                      <Input value={editingConto.banca || ""} onChange={e => setEditingConto((prev: any) => ({ ...prev, banca: e.target.value }))} />
                    </div>
                    <div>
                      <Label>SWIFT/BIC</Label>
                      <Input value={editingConto.swift || ""} onChange={e => setEditingConto((prev: any) => ({ ...prev, swift: e.target.value }))} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>ABI</Label>
                      <Input value={editingConto.abi || ""} disabled />
                    </div>
                    <div>
                      <Label>CAB</Label>
                      <Input value={editingConto.cab || ""} disabled />
                    </div>
                  </div>
                  <div>
                    <Label>Intestatario</Label>
                    <Input value={editingConto.intestatario || ""} onChange={e => setEditingConto((prev: any) => ({ ...prev, intestatario: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Filiale</Label>
                    <Input value={editingConto.filiale || ""} onChange={e => setEditingConto((prev: any) => ({ ...prev, filiale: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Note</Label>
                    <Input value={editingConto.note || ""} onChange={e => setEditingConto((prev: any) => ({ ...prev, note: e.target.value }))} />
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="principale-edit" checked={editingConto.principale} onChange={e => setEditingConto((prev: any) => ({ ...prev, principale: e.target.checked }))} />
                    <Label htmlFor="principale-edit" className="cursor-pointer">Imposta come conto principale</Label>
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditingConto(null)}>Annulla</Button>
                <Button onClick={handleUpdateConto}>Salva Modifiche</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <div className="p-4 bg-muted/50 rounded-lg">
            <h3 className="font-medium mb-4">Note</h3>
            <textarea
              className="w-full min-h-[100px] p-3 rounded-md border bg-background text-sm resize-none"
              value={formData.note}
              onChange={e => update("note", e.target.value)}
              placeholder="Note aggiuntive..."
            />
          </div>
        </div>
      </div>
    </Card>
  );
}

export function PersonaleTab() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStato, setFilterStato] = useState<string>("tutti");
  const [filterReparto, setFilterReparto] = useState<string>("tutti");
  const [birthdayPerson, setBirthdayPerson] = useState<{ nome: string; cognome: string } | null>(null);
  const [birthdayShown, setBirthdayShown] = useState(false);
  const [isParsingCedolino, setIsParsingCedolino] = useState(false);
  const cedolinoInputRef = useRef<HTMLInputElement>(null);
  const [cedoliniDialogOpen, setCedoliniDialogOpen] = useState(false);
  const [cedoliniPersonaleId, setCedoliniPersonaleId] = useState<string | null>(null);
  const [cedoliniPersonaleNome, setCedoliniPersonaleNome] = useState<string>("");
  const [cedoliniList, setCedoliniList] = useState<any[]>([]);
  const [isLoadingCedolini, setIsLoadingCedolini] = useState(false);
  const [uploadingCedolino, setUploadingCedolino] = useState(false);
  const [nuovoCedolino, setNuovoCedolino] = useState({ mese: new Date().getMonth() + 1, anno: new Date().getFullYear(), stipendioLordo: "", stipendioNetto: "", contributiInps: "", irpef: "", bonus: "", straordinari: "", note: "" });
  const cedolinoUploadRef = useRef<HTMLInputElement>(null);

  const MESI_NOMI = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"];

  const loadCedolini = async (personaleId: string) => {
    setIsLoadingCedolini(true);
    try {
      const response = await fetch(`/api/cedolini/personale/${personaleId}`);
      if (response.ok) {
        const data = await response.json();
        setCedoliniList(data);
      }
    } catch (error) {
      console.error("Errore nel caricamento cedolini:", error);
    } finally {
      setIsLoadingCedolini(false);
    }
  };

  const handleUploadCedolino = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !cedoliniPersonaleId) return;

    setUploadingCedolino(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("personaleId", cedoliniPersonaleId);
      formData.append("mese", String(nuovoCedolino.mese));
      formData.append("anno", String(nuovoCedolino.anno));
      formData.append("stipendioLordo", nuovoCedolino.stipendioLordo);
      formData.append("stipendioNetto", nuovoCedolino.stipendioNetto);
      formData.append("contributiInps", nuovoCedolino.contributiInps);
      formData.append("irpef", nuovoCedolino.irpef);
      formData.append("bonus", nuovoCedolino.bonus);
      formData.append("straordinari", nuovoCedolino.straordinari);
      formData.append("note", nuovoCedolino.note);

      const response = await fetch("/api/cedolini", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        toast({ title: "Cedolino caricato", description: "Il cedolino è stato salvato con successo" });
        loadCedolini(cedoliniPersonaleId);
        setNuovoCedolino({ mese: new Date().getMonth() + 1, anno: new Date().getFullYear(), stipendioLordo: "", stipendioNetto: "", contributiInps: "", irpef: "", bonus: "", straordinari: "", note: "" });
      } else {
        toast({ title: "Errore", description: "Impossibile caricare il cedolino", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Errore", description: "Errore nel caricamento", variant: "destructive" });
    } finally {
      setUploadingCedolino(false);
      if (cedolinoUploadRef.current) cedolinoUploadRef.current.value = "";
    }
  };

  const deleteCedolino = async (id: string) => {
    if (!confirm("Eliminare questo cedolino?")) return;
    try {
      const response = await fetch(`/api/cedolini/${id}`, { method: "DELETE" });
      if (response.ok) {
        toast({ title: "Eliminato", description: "Cedolino rimosso" });
        if (cedoliniPersonaleId) loadCedolini(cedoliniPersonaleId);
      }
    } catch (error) {
      toast({ title: "Errore", description: "Impossibile eliminare", variant: "destructive" });
    }
  };

  const openCedoliniDialog = (item: any) => {
    setCedoliniPersonaleId(item.id);
    setCedoliniPersonaleNome(`${item.nome} ${item.cognome}`);
    setCedoliniDialogOpen(true);
    loadCedolini(item.id);
  };

  const [portalCredentialsDialogOpen, setPortalCredentialsDialogOpen] = useState(false);
  const [portalCredentialsItem, setPortalCredentialsItem] = useState<any>(null);
  const [portalCredentials, setPortalCredentials] = useState({ username: "", password: "", enabled: false });
  const [savingCredentials, setSavingCredentials] = useState(false);

  const openPortalCredentialsDialog = (item: any) => {
    setPortalCredentialsItem(item);
    setPortalCredentials({
      username: item.portalUsername || "",
      password: "",
      enabled: item.portalEnabled || false,
    });
    setPortalCredentialsDialogOpen(true);
  };

  const savePortalCredentials = async () => {
    if (!portalCredentialsItem) return;
    setSavingCredentials(true);
    try {
      const response = await fetch(`/api/anagrafica/personale/${portalCredentialsItem.id}/portal-credentials`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(portalCredentials),
      });
      if (response.ok) {
        toast({ title: "Salvato", description: "Credenziali portale aggiornate" });
        queryClient.invalidateQueries({ queryKey: ["anagrafica-personale"] });
        setPortalCredentialsDialogOpen(false);
      } else {
        toast({ title: "Errore", description: "Impossibile salvare le credenziali", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Errore", description: "Errore nel salvataggio", variant: "destructive" });
    } finally {
      setSavingCredentials(false);
    }
  };

  const [newItem, setNewItem] = useState({
    nome: "", cognome: "", codiceFiscale: "", email: "", emailPrivata: "", emailCedolini: "", telefono: "",
    cellulare: "", indirizzo: "", citta: "", cap: "", provincia: "",
    ruolo: "", reparto: "", dataAssunzione: "", dataFinePeriodoProva: "", tipoContratto: "", stipendio: "", iban: "", note: "", stato: "attivo", tags: "",
    dataNascita: "", sesso: "M", comuneNascita: "",
    // Dati bancari
    banca: "", abi: "", cab: "", sitoBanca: "",
    // Dati cedolino
    livelloContrattuale: "", ccnl: "", oreSettimanali: "", percentualePartTime: "", ralAnnua: "",
    superminimo: "", indennitaMensile: "", buoniPasto: "", familariACarico: 0, coniugeACarico: false,
    figlioDisabile: false, aliquotaIrpef: "", contributiInps: "", tfr: "", fondiPensione: "",
    // Accesso Portale
    portalUsername: "", portalPassword: "", portalEnabled: false,
    // Organigramma
    responsabileId: ""
  });

  const [isLoadingBanca, setIsLoadingBanca] = useState(false);

  // Database banche italiane principali con ABI e sito web
  const BANCHE_ITALIANE: { [abi: string]: { nome: string; sito: string } } = {
    "03069": { nome: "Intesa Sanpaolo", sito: "https://www.intesasanpaolo.com" },
    "05034": { nome: "Banca Sella", sito: "https://www.sella.it" },
    "03268": { nome: "Banca Mediolanum", sito: "https://www.bancamediolanum.it" },
    "03015": { nome: "Fineco Bank", sito: "https://www.finecobank.com" },
    "03111": { nome: "UBI Banca", sito: "https://www.ubibanca.it" },
    "02008": { nome: "UniCredit", sito: "https://www.unicredit.it" },
    "05428": { nome: "Banco BPM", sito: "https://www.bancobpm.it" },
    "03599": { nome: "Banca Popolare di Sondrio", sito: "https://www.popso.it" },
    "05387": { nome: "BPER Banca", sito: "https://www.bper.it" },
    "01005": { nome: "Banca Nazionale del Lavoro (BNL)", sito: "https://www.bnl.it" },
    "03127": { nome: "Monte dei Paschi di Siena", sito: "https://www.mps.it" },
    "05696": { nome: "Credem", sito: "https://www.credem.it" },
    "03075": { nome: "Cassa di Risparmio di Bolzano", sito: "https://www.bancageneralisparkasse.it" },
    "06230": { nome: "Credito Emiliano", sito: "https://www.credem.it" },
    "08327": { nome: "Banca Ifis", sito: "https://www.bancaifis.it" },
    "03589": { nome: "Banca Popolare di Milano", sito: "https://www.bancobpm.it" },
    "05000": { nome: "Banca Monte Parma", sito: "https://www.monteparma.com" },
    "03062": { nome: "Banca Passadore", sito: "https://www.passadore.it" },
    "03211": { nome: "Banca di Credito Cooperativo", sito: "https://www.creditocooperativo.it" },
    "36000": { nome: "ING Direct", sito: "https://www.ing.it" },
    "03240": { nome: "Widiba", sito: "https://www.widiba.it" },
    "03296": { nome: "Hello Bank", sito: "https://www.hellobank.it" },
    "03032": { nome: "Poste Italiane (BancoPosta)", sito: "https://www.poste.it" },
    "07601": { nome: "Poste Italiane (BancoPosta)", sito: "https://www.poste.it" },
    "03566": { nome: "N26 Bank", sito: "https://www.n26.com" },
    "03440": { nome: "Revolut", sito: "https://www.revolut.com" },
    "08917": { nome: "Illimity Bank", sito: "https://www.illimitybank.com" },
  };

  // Funzione per estrarre ABI/CAB dall'IBAN italiano e fare lookup della banca
  const handleIbanChange = async (iban: string) => {
    const cleanIban = iban.toUpperCase().replace(/\s/g, "");
    setNewItem(prev => ({ ...prev, iban: cleanIban }));

    // IBAN italiano: IT + 2 check + 1 CIN + 5 ABI + 5 CAB + 12 conto
    if (cleanIban.length === 27 && cleanIban.startsWith("IT")) {
      const abi = cleanIban.substring(5, 10);
      const cab = cleanIban.substring(10, 15);

      setNewItem(prev => ({ ...prev, abi, cab }));

      // Prima controlla il database locale
      const bancaLocale = BANCHE_ITALIANE[abi];
      if (bancaLocale) {
        setNewItem(prev => ({ ...prev, banca: bancaLocale.nome, sitoBanca: bancaLocale.sito }));
        return;
      }

      // Se non trovata, prova con OpenIBAN
      setIsLoadingBanca(true);
      try {
        const response = await fetch(`https://openiban.com/validate/${cleanIban}?getBIC=true&validateBankCode=true`);
        if (response.ok) {
          const data = await response.json();
          if (data.valid && data.bankData?.name) {
            setNewItem(prev => ({ ...prev, banca: data.bankData.name }));
          }
        }
      } catch (error) {
        console.log("Lookup banca non disponibile");
      } finally {
        setIsLoadingBanca(false);
      }
    }
  };

  const handleIbanChangeEdit = async (iban: string) => {
    const cleanIban = iban.toUpperCase().replace(/\s/g, "");
    setEditingItem((prev: any) => ({ ...prev, iban: cleanIban }));

    if (cleanIban.length === 27 && cleanIban.startsWith("IT")) {
      const abi = cleanIban.substring(5, 10);
      const cab = cleanIban.substring(10, 15);

      setEditingItem((prev: any) => ({ ...prev, abi, cab }));

      const bancaLocale = BANCHE_ITALIANE[abi];
      if (bancaLocale) {
        setEditingItem((prev: any) => ({ ...prev, banca: bancaLocale.nome, sitoBanca: bancaLocale.sito }));
        return;
      }

      setIsLoadingBanca(true);
      try {
        const response = await fetch(`https://openiban.com/validate/${cleanIban}?getBIC=true&validateBankCode=true`);
        if (response.ok) {
          const data = await response.json();
          if (data.valid && data.bankData?.name) {
            setEditingItem((prev: any) => ({ ...prev, banca: data.bankData.name }));
          }
        }
      } catch (error) {
        console.log("Lookup banca non disponibile");
      } finally {
        setIsLoadingBanca(false);
      }
    }
  };

  const MESI_CF = ["A", "B", "C", "D", "E", "H", "L", "M", "P", "R", "S", "T"];
  const CONSONANTI = "BCDFGHJKLMNPQRSTVWXYZ";
  const VOCALI = "AEIOU";
  const ODD_MAP: { [key: string]: number } = {
    "0": 1, "1": 0, "2": 5, "3": 7, "4": 9, "5": 13, "6": 15, "7": 17, "8": 19, "9": 21,
    "A": 1, "B": 0, "C": 5, "D": 7, "E": 9, "F": 13, "G": 15, "H": 17, "I": 19, "J": 21,
    "K": 2, "L": 4, "M": 18, "N": 20, "O": 11, "P": 3, "Q": 6, "R": 8, "S": 12, "T": 14,
    "U": 16, "V": 10, "W": 22, "X": 25, "Y": 24, "Z": 23
  };
  const EVEN_MAP: { [key: string]: number } = {
    "0": 0, "1": 1, "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7, "8": 8, "9": 9,
    "A": 0, "B": 1, "C": 2, "D": 3, "E": 4, "F": 5, "G": 6, "H": 7, "I": 8, "J": 9,
    "K": 10, "L": 11, "M": 12, "N": 13, "O": 14, "P": 15, "Q": 16, "R": 17, "S": 18, "T": 19,
    "U": 20, "V": 21, "W": 22, "X": 23, "Y": 24, "Z": 25
  };

  const estraiConsonanti = (str: string) => str.toUpperCase().split("").filter(c => CONSONANTI.includes(c)).join("");
  const estraiVocali = (str: string) => str.toUpperCase().split("").filter(c => VOCALI.includes(c)).join("");

  const calcolaCognomeCF = (cognome: string) => {
    const cons = estraiConsonanti(cognome);
    const voc = estraiVocali(cognome);
    return (cons + voc + "XXX").substring(0, 3);
  };

  const calcolaNomeCF = (nome: string) => {
    const cons = estraiConsonanti(nome);
    if (cons.length >= 4) {
      return cons[0] + cons[2] + cons[3];
    }
    const voc = estraiVocali(nome);
    return (cons + voc + "XXX").substring(0, 3);
  };

  const calcolaDataCF = (data: string, sesso: string) => {
    if (!data) return "00A00";
    const d = new Date(data);
    const anno = String(d.getFullYear()).slice(-2);
    const mese = MESI_CF[d.getMonth()];
    let giorno = d.getDate();
    if (sesso === "F") giorno += 40;
    return anno + mese + String(giorno).padStart(2, "0");
  };

  const calcolaCarattereControllo = (cf15: string) => {
    let sum = 0;
    for (let i = 0; i < 15; i++) {
      const c = cf15[i];
      sum += (i % 2 === 0) ? ODD_MAP[c] : EVEN_MAP[c];
    }
    return String.fromCharCode(65 + (sum % 26));
  };

  const calcolaCodiceFiscale = () => {
    if (!newItem.nome || !newItem.cognome) return;
    const cognomeCF = calcolaCognomeCF(newItem.cognome);
    const nomeCF = calcolaNomeCF(newItem.nome);
    const dataCF = calcolaDataCF(newItem.dataNascita, newItem.sesso);
    const comuneCF = newItem.comuneNascita ? newItem.comuneNascita.toUpperCase().substring(0, 4).padEnd(4, "X") : "XXXX";
    const cf15 = cognomeCF + nomeCF + dataCF + comuneCF;
    const carattereControllo = calcolaCarattereControllo(cf15);
    setNewItem({ ...newItem, codiceFiscale: cf15 + carattereControllo });
  };

  const handleCedolinoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsParsingCedolino(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/parse-cedolino", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Errore nel parsing del cedolino");

      const data = await response.json();

      setNewItem(prev => ({
        ...prev,
        nome: data.nome || prev.nome,
        cognome: data.cognome || prev.cognome,
        codiceFiscale: data.codiceFiscale || prev.codiceFiscale,
        indirizzo: data.indirizzo || prev.indirizzo,
        citta: data.citta || prev.citta,
        cap: data.cap || prev.cap,
        provincia: data.provincia || prev.provincia,
        ccnl: data.ccnl || prev.ccnl,
        livelloContrattuale: data.livelloContrattuale || prev.livelloContrattuale,
        oreSettimanali: data.oreSettimanali || prev.oreSettimanali,
        percentualePartTime: data.percentualePartTime || prev.percentualePartTime,
        ralAnnua: data.ralAnnua || prev.ralAnnua,
        superminimo: data.superminimo || prev.superminimo,
        indennitaMensile: data.indennitaMensile || prev.indennitaMensile,
        contributiInps: data.contributiInps || prev.contributiInps,
        iban: data.iban || prev.iban,
        dataAssunzione: data.dataAssunzione || prev.dataAssunzione,
        tipoContratto: data.tipoContratto || prev.tipoContratto,
      }));

      toast({ title: "Cedolino importato", description: "I dati sono stati estratti con successo" });
    } catch (error) {
      toast({ title: "Errore", description: "Impossibile elaborare il cedolino", variant: "destructive" });
    } finally {
      setIsParsingCedolino(false);
      if (cedolinoInputRef.current) cedolinoInputRef.current.value = "";
    }
  };

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["anagrafica-personale"],
    queryFn: apiPersonale.getAll,
  });

  useEffect(() => {
    if (!birthdayShown && items.length > 0) {
      const today = new Date();
      const todayDay = today.getDate();
      const todayMonth = today.getMonth();

      const birthdayPeople = items.filter((item: any) => {
        if (!item.dataNascita) return false;
        const birthDate = new Date(item.dataNascita);
        return birthDate.getDate() === todayDay && birthDate.getMonth() === todayMonth;
      });

      if (birthdayPeople.length > 0) {
        setBirthdayPerson({ nome: birthdayPeople[0].nome, cognome: birthdayPeople[0].cognome });
        setBirthdayShown(true);
      }
    }
  }, [items, birthdayShown]);

  const reparti = useMemo(() => {
    const set = new Set(items.map((i: any) => i.reparto).filter(Boolean));
    return Array.from(set) as string[];
  }, [items]);

  const duplicates = useMemo(() => {
    const cfMap = new Map<string, string[]>();
    items.forEach((item: any) => {
      if (item.codiceFiscale) {
        const cf = item.codiceFiscale.toUpperCase();
        if (!cfMap.has(cf)) cfMap.set(cf, []);
        cfMap.get(cf)!.push(item.id);
      }
    });
    const dups = new Set<string>();
    cfMap.forEach((ids) => { if (ids.length > 1) ids.forEach(id => dups.add(id)); });
    return dups;
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item: any) => {
      const matchSearch = `${item.nome} ${item.cognome} ${item.email || ""}`.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStato = filterStato === "tutti" || item.stato === filterStato;
      const matchReparto = filterReparto === "tutti" || item.reparto === filterReparto;
      return matchSearch && matchStato && matchReparto;
    });
  }, [items, searchTerm, filterStato, filterReparto]);

  const createMutation = useMutation({
    mutationFn: apiPersonale.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["anagrafica-personale"] });
      setNewItem({ nome: "", cognome: "", codiceFiscale: "", email: "", telefono: "", cellulare: "", indirizzo: "", citta: "", cap: "", provincia: "", ruolo: "", reparto: "", dataAssunzione: "", tipoContratto: "", stipendio: "", iban: "", note: "", stato: "attivo", tags: "", dataNascita: "", sesso: "M", comuneNascita: "" });
      setDialogOpen(false);
      toast({ title: "Collaboratore aggiunto", description: "Il record è stato salvato con successo" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message || "Impossibile salvare il collaboratore", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiPersonale.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["anagrafica-personale"] });
      setEditDialogOpen(false);
      setEditingItem(null);
      toast({ title: "Modifiche salvate", description: "Il record è stato aggiornato" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: apiPersonale.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["anagrafica-personale"] });
      toast({ title: "Eliminato", description: "Il record è stato rimosso" });
    },
  });

  const isFormValid = () => {
    if (!newItem.nome || !newItem.cognome) return false;
    if (newItem.codiceFiscale && !validateCodiceFiscale(newItem.codiceFiscale).valid) return false;
    if (newItem.iban && !validateIban(newItem.iban).valid) return false;
    return true;
  };

  if (isLoading) return <div className="flex items-center justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <div className="p-6 space-y-4">
      {/* Birthday Dialog */}
      <Dialog open={!!birthdayPerson} onOpenChange={() => setBirthdayPerson(null)}>
        <DialogContent className="max-w-md text-center">
          <div className="flex flex-col items-center gap-3 py-3">
            <div className="text-4xl">🎂</div>
            <DialogTitle className="text-lg font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 bg-clip-text text-transparent">
              BUON COMPLEANNO
            </DialogTitle>
            <p className="text-base font-medium">
              {birthdayPerson?.nome} {birthdayPerson?.cognome}
            </p>
            <Button
              className="mt-3 px-6 h-8 text-sm"
              onClick={() => setBirthdayPerson(null)}
            >
              Grazie
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Cerca personale..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
        </div>
        <Select value={filterStato} onValueChange={setFilterStato}>
          <SelectTrigger className="w-[140px]"><Filter className="h-4 w-4 mr-2" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="tutti">Tutti gli stati</SelectItem>
            {STATI.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterReparto} onValueChange={setFilterReparto}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Reparto" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="tutti">Tutti i reparti</SelectItem>
            {reparti.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
          </SelectContent>
        </Select>
        {(filterStato !== "tutti" || filterReparto !== "tutti") && (
          <Button variant="ghost" size="sm" onClick={() => { setFilterStato("tutti"); setFilterReparto("tutti"); }}>
            <X className="h-4 w-4 mr-1" />Rimuovi filtri
          </Button>
        )}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="ml-auto"><Plus className="h-4 w-4 mr-2" />Aggiungi</Button>
          </DialogTrigger>
          <DialogContent className="max-w-[1024px] max-h-[85vh] overflow-y-auto text-sm">
            <DialogHeader>
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                    <Users className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <DialogTitle className="text-base">Nuovo Collaboratore</DialogTitle>
                    <DialogDescription className="text-xs">Inserisci i dati del nuovo collaboratore</DialogDescription>
                  </div>
                </div>
                <div>
                  <input
                    type="file"
                    ref={cedolinoInputRef}
                    onChange={handleCedolinoUpload}
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => cedolinoInputRef.current?.click()}
                    disabled={isParsingCedolino}
                    className="h-8 text-xs"
                  >
                    {isParsingCedolino ? (
                      <><Loader2 className="h-3 w-3 animate-spin mr-1" />Analisi...</>
                    ) : (
                      <><Upload className="h-3 w-3 mr-1" />Importa da Cedolino</>
                    )}
                  </Button>
                </div>
              </div>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-3 mt-2">
              {/* Colonna Sinistra */}
              <div className="space-y-3">
                {/* Dati Anagrafici */}
                <div className="p-3 bg-muted/50 rounded-lg">
                  <h3 className="text-xs font-medium mb-3 flex items-center gap-2">
                    <Users className="h-3 w-3" />
                    Dati Anagrafici
                  </h3>
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Nome *</Label>
                        <Input className="h-8 text-sm uppercase" value={newItem.nome} onChange={(e) => setNewItem({ ...newItem, nome: e.target.value.toUpperCase() })} placeholder="MARIO" />
                      </div>
                      <div>
                        <Label className="text-xs">Cognome *</Label>
                        <Input className="h-8 text-sm uppercase" value={newItem.cognome} onChange={(e) => setNewItem({ ...newItem, cognome: e.target.value.toUpperCase() })} placeholder="ROSSI" />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Label className="text-xs">Data Nascita</Label>
                        <Input className="h-8 text-sm" type="date" value={newItem.dataNascita} onChange={(e) => setNewItem({ ...newItem, dataNascita: e.target.value })} />
                      </div>
                      <div>
                        <Label className="text-xs">Sesso</Label>
                        <Select value={newItem.sesso} onValueChange={(v) => setNewItem({ ...newItem, sesso: v })}>
                          <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="M">Maschio</SelectItem>
                            <SelectItem value="F">Femmina</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Comune Nascita</Label>
                        <Input className="h-8 text-sm" value={newItem.comuneNascita} onChange={(e) => setNewItem({ ...newItem, comuneNascita: e.target.value.toUpperCase() })} placeholder="H501" maxLength={4} />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Codice Fiscale</Label>
                      <div className="flex gap-1">
                        <Input className="h-8 text-sm flex-1" value={newItem.codiceFiscale} onChange={(e) => setNewItem({ ...newItem, codiceFiscale: e.target.value.toUpperCase() })} placeholder="RSSMRA80A01H501Z" />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 px-2"
                          onClick={calcolaCodiceFiscale}
                          disabled={!newItem.nome || !newItem.cognome}
                          title="Calcola CF automaticamente"
                        >
                          Calcola
                        </Button>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1">Inserisci nome, cognome, data nascita, sesso e codice comune per il calcolo automatico</p>
                    </div>
                  </div>
                </div>

                {/* Residenza */}
                <div className="p-3 bg-muted/50 rounded-lg">
                  <h3 className="text-xs font-medium mb-3 flex items-center gap-2">
                    <MapPin className="h-3 w-3" />
                    Residenza
                  </h3>
                  <div className="space-y-2">
                    <div>
                      <Label className="text-xs">Indirizzo</Label>
                      <Input className="h-8 text-sm uppercase" value={newItem.indirizzo} onChange={(e) => setNewItem({ ...newItem, indirizzo: e.target.value.toUpperCase() })} placeholder="VIA ROMA, 1" />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Label className="text-xs">CAP</Label>
                        <Input className="h-8 text-sm" value={newItem.cap} onChange={(e) => setNewItem({ ...newItem, cap: e.target.value })} placeholder="00100" maxLength={5} />
                      </div>
                      <div>
                        <Label className="text-xs">Città</Label>
                        <Input className="h-8 text-sm uppercase" value={newItem.citta} onChange={(e) => setNewItem({ ...newItem, citta: e.target.value.toUpperCase() })} placeholder="ROMA" />
                      </div>
                      <div>
                        <Label className="text-xs">Prov.</Label>
                        <Select value={newItem.provincia} onValueChange={(v) => setNewItem({ ...newItem, provincia: v })}>
                          <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="..." /></SelectTrigger>
                          <SelectContent>{PROVINCE_ITALIANE.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Note */}
                <div className="p-3 bg-muted/50 rounded-lg">
                  <h3 className="text-xs font-medium mb-3 flex items-center gap-2">
                    <Tag className="h-3 w-3" />
                    Note e Tags
                  </h3>
                  <div className="space-y-2">
                    <div>
                      <Label className="text-xs">Tags (separati da virgola)</Label>
                      <Input className="h-8 text-sm" value={newItem.tags} onChange={(e) => setNewItem({ ...newItem, tags: e.target.value })} placeholder="senior, remote, part-time" />
                    </div>
                    <div>
                      <Label className="text-xs">Note</Label>
                      <Input className="h-8 text-sm" value={newItem.note} onChange={(e) => setNewItem({ ...newItem, note: e.target.value })} placeholder="Note aggiuntive..." />
                    </div>
                  </div>
                </div>
              </div>

              {/* Colonna Destra */}
              <div className="space-y-3">
                {/* Contatti */}
                <div className="p-3 bg-muted/50 rounded-lg">
                  <h3 className="text-xs font-medium mb-3 flex items-center gap-2">
                    <Phone className="h-3 w-3" />
                    Contatti
                  </h3>
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Telefono</Label>
                        <Input className="h-8 text-sm" value={newItem.telefono} onChange={(e) => setNewItem({ ...newItem, telefono: e.target.value })} placeholder="+39 06 1234567" />
                      </div>
                      <div>
                        <Label className="text-xs">Cellulare</Label>
                        <Input className="h-8 text-sm" value={newItem.cellulare} onChange={(e) => setNewItem({ ...newItem, cellulare: e.target.value })} placeholder="+39 333 1234567" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Email Aziendale</Label>
                        <Input className="h-8 text-sm" type="email" value={newItem.email} onChange={(e) => setNewItem({ ...newItem, email: e.target.value })} placeholder="mario.rossi@azienda.it" />
                      </div>
                      <div>
                        <Label className="text-xs">Email Privata</Label>
                        <Input className="h-8 text-sm" type="email" value={newItem.emailPrivata} onChange={(e) => setNewItem({ ...newItem, emailPrivata: e.target.value })} placeholder="mario.rossi@gmail.com" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dati Lavorativi */}
                <div className="p-3 bg-indigo-50 dark:bg-indigo-950/30 rounded-lg border border-indigo-200 dark:border-indigo-900">
                  <h3 className="text-xs font-medium mb-3 flex items-center gap-2 text-indigo-700 dark:text-indigo-300">
                    <Briefcase className="h-3 w-3" />
                    Dati Lavorativi
                  </h3>
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Ruolo</Label>
                        <Select value={newItem.ruolo} onValueChange={(v) => setNewItem({ ...newItem, ruolo: v })}>
                          <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Seleziona ruolo" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="AMMINISTRATORE">Amministratore</SelectItem>
                            <SelectItem value="RESPONSABILE">Responsabile</SelectItem>
                            <SelectItem value="IMPIEGATO">Impiegato</SelectItem>
                            <SelectItem value="OPERAIO">Operaio</SelectItem>
                            <SelectItem value="TECNICO">Tecnico</SelectItem>
                            <SelectItem value="COMMERCIALE">Commerciale</SelectItem>
                            <SelectItem value="MAGAZZINIERE">Magazziniere</SelectItem>
                            <SelectItem value="AUTISTA">Autista</SelectItem>
                            <SelectItem value="STAGISTA">Stagista</SelectItem>
                            <SelectItem value="CONSULENTE">Consulente</SelectItem>
                            <SelectItem value="ALTRO">Altro</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Reparto</Label>
                        <Input className="h-8 text-sm" value={newItem.reparto} onChange={(e) => setNewItem({ ...newItem, reparto: e.target.value })} placeholder="IT" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Responsabile</Label>
                        <Select value={newItem.responsabileId || "__none__"} onValueChange={(v) => setNewItem({ ...newItem, responsabileId: v === "__none__" ? "" : v })}>
                          <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Nessun responsabile" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">Nessuno (livello apicale)</SelectItem>
                            {items?.filter((p: any) => p.stato === "attivo").map((p: any) => (
                              <SelectItem key={p.id} value={p.id}>{p.cognome} {p.nome} - {p.ruolo || "N/D"}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Tipo Contratto</Label>
                        <Input className="h-8 text-sm" value={newItem.tipoContratto} onChange={(e) => setNewItem({ ...newItem, tipoContratto: e.target.value })} placeholder="Indeterminato" />
                      </div>
                      <div>
                        <Label className="text-xs">Data Assunzione</Label>
                        <Input className="h-8 text-sm" type="date" value={newItem.dataAssunzione} onChange={(e) => setNewItem({ ...newItem, dataAssunzione: e.target.value })} />
                      </div>
                      <div>
                        <Label className="text-xs">Fine Periodo Prova</Label>
                        <Input className="h-8 text-sm" type="date" value={newItem.dataFinePeriodoProva} onChange={(e) => setNewItem({ ...newItem, dataFinePeriodoProva: e.target.value })} />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Stato</Label>
                      <Select value={newItem.stato} onValueChange={(v) => setNewItem({ ...newItem, stato: v })}>
                        <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>{STATI.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Dati Bancari */}
                <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-900">
                  <h3 className="text-xs font-medium mb-3 flex items-center gap-2 text-green-700 dark:text-green-300">
                    <Euro className="h-3 w-3" />
                    Dati Bancari
                  </h3>
                  <div className="space-y-2">
                    <div>
                      <Label className="text-xs">IBAN</Label>
                      <Input className="h-8 text-sm" value={newItem.iban} onChange={(e) => handleIbanChange(e.target.value)} placeholder="IT60X0542811101000000123456" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Banca {isLoadingBanca && <Loader2 className="h-2 w-2 animate-spin inline ml-1" />}</Label>
                        <Input className="h-8 text-sm" value={newItem.banca} onChange={(e) => setNewItem({ ...newItem, banca: e.target.value })} placeholder="Nome banca" />
                      </div>
                      <div>
                        <Label className="text-xs">Sito Banca</Label>
                        <Input className="h-8 text-sm" value={newItem.sitoBanca} onChange={(e) => setNewItem({ ...newItem, sitoBanca: e.target.value })} placeholder="https://www.banca.it" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">ABI</Label>
                        <Input value={newItem.abi} readOnly className="h-8 text-sm bg-muted" placeholder="00000" />
                      </div>
                      <div>
                        <Label className="text-xs">CAB</Label>
                        <Input value={newItem.cab} readOnly className="h-8 text-sm bg-muted" placeholder="00000" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sezione Dati Cedolino */}
            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-900 mt-3">
              <h3 className="text-xs font-medium mb-3 flex items-center gap-2 text-amber-700 dark:text-amber-300">
                <FileText className="h-3 w-3" />
                Dati Cedolino
              </h3>
              <div className="grid grid-cols-4 gap-2">
                <div>
                  <Label className="text-xs">CCNL</Label>
                  <Input className="h-8 text-sm" value={newItem.ccnl} onChange={(e) => setNewItem({ ...newItem, ccnl: e.target.value })} placeholder="Commercio" />
                </div>
                <div>
                  <Label className="text-xs">Livello</Label>
                  <Input className="h-8 text-sm" value={newItem.livelloContrattuale} onChange={(e) => setNewItem({ ...newItem, livelloContrattuale: e.target.value })} placeholder="3" />
                </div>
                <div>
                  <Label className="text-xs">Ore Sett.</Label>
                  <Input className="h-8 text-sm" value={newItem.oreSettimanali} onChange={(e) => setNewItem({ ...newItem, oreSettimanali: e.target.value })} placeholder="40" />
                </div>
                <div>
                  <Label className="text-xs">% Part-Time</Label>
                  <Input className="h-8 text-sm" value={newItem.percentualePartTime} onChange={(e) => setNewItem({ ...newItem, percentualePartTime: e.target.value })} placeholder="100" />
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2 mt-2">
                <div>
                  <Label className="text-xs">RAL Annua</Label>
                  <Input className="h-8 text-sm" value={newItem.ralAnnua} onChange={(e) => setNewItem({ ...newItem, ralAnnua: e.target.value })} placeholder="28.000" />
                </div>
                <div>
                  <Label className="text-xs">Superminimo</Label>
                  <Input className="h-8 text-sm" value={newItem.superminimo} onChange={(e) => setNewItem({ ...newItem, superminimo: e.target.value })} placeholder="200" />
                </div>
                <div>
                  <Label className="text-xs">Indennita Mens.</Label>
                  <Input className="h-8 text-sm" value={newItem.indennitaMensile} onChange={(e) => setNewItem({ ...newItem, indennitaMensile: e.target.value })} placeholder="100" />
                </div>
                <div>
                  <Label className="text-xs">Buoni Pasto</Label>
                  <Input className="h-8 text-sm" value={newItem.buoniPasto} onChange={(e) => setNewItem({ ...newItem, buoniPasto: e.target.value })} placeholder="7,00" />
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2 mt-2">
                <div>
                  <Label className="text-xs">Familiari a Carico</Label>
                  <Input className="h-8 text-sm" type="number" min="0" value={newItem.familariACarico} onChange={(e) => setNewItem({ ...newItem, familariACarico: parseInt(e.target.value) || 0 })} />
                </div>
                <div className="flex items-center gap-2 pt-4">
                  <input type="checkbox" id="coniuge" checked={newItem.coniugeACarico} onChange={(e) => setNewItem({ ...newItem, coniugeACarico: e.target.checked })} className="h-4 w-4" />
                  <Label htmlFor="coniuge" className="text-xs">Coniuge a Carico</Label>
                </div>
                <div className="flex items-center gap-2 pt-4">
                  <input type="checkbox" id="disabile" checked={newItem.figlioDisabile} onChange={(e) => setNewItem({ ...newItem, figlioDisabile: e.target.checked })} className="h-4 w-4" />
                  <Label htmlFor="disabile" className="text-xs">Figlio Disabile</Label>
                </div>
                <div>
                  <Label className="text-xs">Aliquota IRPEF</Label>
                  <Input className="h-8 text-sm" value={newItem.aliquotaIrpef} onChange={(e) => setNewItem({ ...newItem, aliquotaIrpef: e.target.value })} placeholder="23%" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-2">
                <div>
                  <Label className="text-xs">Contributi INPS %</Label>
                  <Input className="h-8 text-sm" value={newItem.contributiInps} onChange={(e) => setNewItem({ ...newItem, contributiInps: e.target.value })} placeholder="9,19" />
                </div>
                <div>
                  <Label className="text-xs">TFR Destinazione</Label>
                  <Input className="h-8 text-sm" value={newItem.tfr} onChange={(e) => setNewItem({ ...newItem, tfr: e.target.value })} placeholder="Azienda" />
                </div>
                <div>
                  <Label className="text-xs">Fondi Pensione</Label>
                  <Input className="h-8 text-sm" value={newItem.fondiPensione} onChange={(e) => setNewItem({ ...newItem, fondiPensione: e.target.value })} placeholder="Nessuno" />
                </div>
              </div>
            </div>

            {/* Sezione Accesso Portale */}
            <div className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-200 dark:border-purple-900 mt-3">
              <h3 className="text-xs font-medium mb-3 flex items-center gap-2 text-purple-700 dark:text-purple-300">
                <Key className="h-3 w-3" />
                Accesso Portale Collaboratori
              </h3>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-xs">Username</Label>
                  <Input className="h-8 text-sm" value={newItem.portalUsername} onChange={(e) => setNewItem({ ...newItem, portalUsername: e.target.value })} placeholder="mario.rossi" />
                </div>
                <div>
                  <Label className="text-xs">Password</Label>
                  <Input className="h-8 text-sm" type="password" value={newItem.portalPassword} onChange={(e) => setNewItem({ ...newItem, portalPassword: e.target.value })} placeholder="••••••••" />
                </div>
                <div className="flex items-center gap-2 pt-5">
                  <input type="checkbox" id="portalEnabled" checked={newItem.portalEnabled} onChange={(e) => setNewItem({ ...newItem, portalEnabled: e.target.checked })} className="h-4 w-4" />
                  <Label htmlFor="portalEnabled" className="text-xs">Abilita Accesso</Label>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground mt-2">Il collaboratore potrà accedere al portale per visualizzare i propri cedolini. Il link verrà generato dopo il salvataggio.</p>
            </div>

            <Button onClick={() => createMutation.mutate(newItem)} disabled={!isFormValid()} className="w-full mt-4 h-9 text-sm">
              {createMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <Save className="h-3 w-3 mr-2" />}
              Salva Collaboratore
            </Button>
          </DialogContent>
        </Dialog>
      </div>

      {duplicates.size > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <span className="text-sm text-yellow-800 dark:text-yellow-200">Attenzione: rilevati {duplicates.size} possibili duplicati (stesso codice fiscale)</span>
        </div>
      )}

      <div className="text-sm text-muted-foreground">
        {filteredItems.length} di {items.length} record
      </div>

      <div className="grid gap-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {filteredItems.map((item: any) => {
          const repartoColor = item.reparto ? getProvinciaColor(item.reparto) : "#6366f1";
          return (
            <Card key={item.id} className={`hover:shadow-md transition-shadow ${duplicates.has(item.id) ? "ring-2 ring-yellow-400" : ""}`} style={{ borderLeft: `4px solid ${repartoColor}` }}>
              <CardContent className="p-2">
                <div className="flex items-start justify-between gap-1">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className="h-7 w-7 rounded-full flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: `${repartoColor}20` }}>
                      <Users className="h-3.5 w-3.5" style={{ color: repartoColor }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium text-sm truncate" title={`${item.nome} ${item.cognome}`}>{item.nome} {item.cognome}</h3>
                      {item.ruolo && <span className="text-[10px] text-muted-foreground truncate block">{item.ruolo}</span>}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-6 w-6"><MoreHorizontal className="h-3 w-3" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => { setEditingItem({ ...item }); setEditDialogOpen(true); }}><Edit2 className="h-4 w-4 mr-2" />Modifica</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openCedoliniDialog(item)}><FileText className="h-4 w-4 mr-2" />Cedolini</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openPortalCredentialsDialog(item)}><Key className="h-4 w-4 mr-2" />Accesso Portale</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => { setNewItem({ ...item, id: undefined }); setDialogOpen(true); }}><Copy className="h-4 w-4 mr-2" />Duplica</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => deleteMutation.mutate(item.id)} className="text-destructive"><Trash2 className="h-4 w-4 mr-2" />Elimina</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="mt-1 flex items-center gap-1 flex-wrap">
                  <StatoBadge stato={item.stato || "attivo"} />
                  {item.reparto && <Badge variant="outline" className="text-[10px] px-1 py-0">{item.reparto}</Badge>}
                </div>
                <div className="mt-1.5 space-y-0.5 text-xs">
                  {item.email && <div className="flex items-center gap-1 text-muted-foreground truncate"><Mail className="h-2.5 w-2.5 flex-shrink-0" /><span className="truncate">{item.email}</span></div>}
                  {item.telefono && <div className="flex items-center gap-1 text-muted-foreground"><Phone className="h-2.5 w-2.5 flex-shrink-0" />{item.telefono}</div>}
                  {item.portalEnabled && item.portalToken && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 px-1.5 text-[10px] mt-1 bg-gradient-to-r from-teal-500/10 to-emerald-500/10 hover:from-teal-500/20 hover:to-emerald-500/20 text-teal-700 dark:text-teal-400"
                      onClick={(e) => { e.stopPropagation(); window.open(`/portale-collaboratori?token=${item.portalToken}`, '_blank'); }}
                    >
                      <ExternalLink className="h-2.5 w-2.5 mr-1" />
                      Portale
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <p>Nessun dipendente trovato</p>
        </div>
      )}

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-[1024px] max-h-[85vh] overflow-y-auto text-sm">
          <DialogHeader>
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <Users className="h-4 w-4 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-base">Modifica Collaboratore</DialogTitle>
                  <DialogDescription className="text-xs">Modifica i dati del collaboratore</DialogDescription>
                </div>
              </div>
              {editingItem?.portalEnabled && editingItem?.portalToken && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs bg-gradient-to-r from-teal-500 to-emerald-500 text-white border-0 hover:from-teal-600 hover:to-emerald-600"
                  onClick={() => window.open(`/portale-collaboratori?token=${editingItem.portalToken}`, '_blank')}
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Apri Portale
                </Button>
              )}
            </div>
          </DialogHeader>
          {editingItem && (
            <>
              <div className="grid grid-cols-2 gap-3 mt-2">
                {/* Colonna Sinistra */}
                <div className="space-y-3">
                  {/* Dati Anagrafici */}
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <h3 className="text-xs font-medium mb-3 flex items-center gap-2">
                      <Users className="h-3 w-3" />
                      Dati Anagrafici
                    </h3>
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">Nome *</Label>
                          <Input className="h-8 text-sm uppercase" value={editingItem.nome || ""} onChange={(e) => setEditingItem({ ...editingItem, nome: e.target.value.toUpperCase() })} />
                        </div>
                        <div>
                          <Label className="text-xs">Cognome *</Label>
                          <Input className="h-8 text-sm uppercase" value={editingItem.cognome || ""} onChange={(e) => setEditingItem({ ...editingItem, cognome: e.target.value.toUpperCase() })} />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <Label className="text-xs">Data Nascita</Label>
                          <Input className="h-8 text-sm" type="date" value={editingItem.dataNascita || ""} onChange={(e) => setEditingItem({ ...editingItem, dataNascita: e.target.value })} />
                        </div>
                        <div>
                          <Label className="text-xs">Sesso</Label>
                          <Select value={editingItem.sesso || "M"} onValueChange={(v) => setEditingItem({ ...editingItem, sesso: v })}>
                            <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="M">Maschio</SelectItem>
                              <SelectItem value="F">Femmina</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs">Comune Nascita</Label>
                          <Input className="h-8 text-sm" value={editingItem.comuneNascita || ""} onChange={(e) => setEditingItem({ ...editingItem, comuneNascita: e.target.value.toUpperCase() })} maxLength={4} />
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs">Codice Fiscale</Label>
                        <Input className="h-8 text-sm" value={editingItem.codiceFiscale || ""} onChange={(e) => setEditingItem({ ...editingItem, codiceFiscale: e.target.value.toUpperCase() })} />
                      </div>
                    </div>
                  </div>

                  {/* Residenza */}
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <h3 className="text-xs font-medium mb-3 flex items-center gap-2">
                      <MapPin className="h-3 w-3" />
                      Residenza
                    </h3>
                    <div className="space-y-2">
                      <div>
                        <Label className="text-xs">Indirizzo</Label>
                        <Input className="h-8 text-sm uppercase" value={editingItem.indirizzo || ""} onChange={(e) => setEditingItem({ ...editingItem, indirizzo: e.target.value.toUpperCase() })} />
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <Label className="text-xs">CAP</Label>
                          <Input className="h-8 text-sm" value={editingItem.cap || ""} onChange={(e) => setEditingItem({ ...editingItem, cap: e.target.value })} maxLength={5} />
                        </div>
                        <div>
                          <Label className="text-xs">Citta</Label>
                          <Input className="h-8 text-sm uppercase" value={editingItem.citta || ""} onChange={(e) => setEditingItem({ ...editingItem, citta: e.target.value.toUpperCase() })} />
                        </div>
                        <div>
                          <Label className="text-xs">Prov.</Label>
                          <Select value={editingItem.provincia || ""} onValueChange={(v) => setEditingItem({ ...editingItem, provincia: v })}>
                            <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="..." /></SelectTrigger>
                            <SelectContent>{PROVINCE_ITALIANE.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Note */}
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <h3 className="text-xs font-medium mb-3 flex items-center gap-2">
                      <Tag className="h-3 w-3" />
                      Note e Tags
                    </h3>
                    <div className="space-y-2">
                      <div>
                        <Label className="text-xs">Tags (separati da virgola)</Label>
                        <Input className="h-8 text-sm" value={editingItem.tags || ""} onChange={(e) => setEditingItem({ ...editingItem, tags: e.target.value })} />
                      </div>
                      <div>
                        <Label className="text-xs">Note</Label>
                        <Input className="h-8 text-sm" value={editingItem.note || ""} onChange={(e) => setEditingItem({ ...editingItem, note: e.target.value })} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Colonna Destra */}
                <div className="space-y-3">
                  {/* Contatti */}
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <h3 className="text-xs font-medium mb-3 flex items-center gap-2">
                      <Phone className="h-3 w-3" />
                      Contatti
                    </h3>
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">Telefono</Label>
                          <Input className="h-8 text-sm" value={editingItem.telefono || ""} onChange={(e) => setEditingItem({ ...editingItem, telefono: e.target.value })} />
                        </div>
                        <div>
                          <Label className="text-xs">Cellulare</Label>
                          <Input className="h-8 text-sm" value={editingItem.cellulare || ""} onChange={(e) => setEditingItem({ ...editingItem, cellulare: e.target.value })} />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">Email Aziendale</Label>
                          <Input className="h-8 text-sm" type="email" value={editingItem.email || ""} onChange={(e) => setEditingItem({ ...editingItem, email: e.target.value })} />
                        </div>
                        <div>
                          <Label className="text-xs">Email Privata</Label>
                          <Input className="h-8 text-sm" type="email" value={editingItem.emailPrivata || ""} onChange={(e) => setEditingItem({ ...editingItem, emailPrivata: e.target.value })} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Dati Lavorativi */}
                  <div className="p-3 bg-indigo-50 dark:bg-indigo-950/30 rounded-lg border border-indigo-200 dark:border-indigo-900">
                    <h3 className="text-xs font-medium mb-3 flex items-center gap-2 text-indigo-700 dark:text-indigo-300">
                      <Briefcase className="h-3 w-3" />
                      Dati Lavorativi
                    </h3>
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">Ruolo</Label>
                          <Select value={editingItem.ruolo || ""} onValueChange={(v) => setEditingItem({ ...editingItem, ruolo: v })}>
                            <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Seleziona ruolo" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="AMMINISTRATORE">Amministratore</SelectItem>
                              <SelectItem value="RESPONSABILE">Responsabile</SelectItem>
                              <SelectItem value="IMPIEGATO">Impiegato</SelectItem>
                              <SelectItem value="OPERAIO">Operaio</SelectItem>
                              <SelectItem value="TECNICO">Tecnico</SelectItem>
                              <SelectItem value="COMMERCIALE">Commerciale</SelectItem>
                              <SelectItem value="MAGAZZINIERE">Magazziniere</SelectItem>
                              <SelectItem value="AUTISTA">Autista</SelectItem>
                              <SelectItem value="STAGISTA">Stagista</SelectItem>
                              <SelectItem value="CONSULENTE">Consulente</SelectItem>
                              <SelectItem value="ALTRO">Altro</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs">Reparto</Label>
                          <Input className="h-8 text-sm" value={editingItem.reparto || ""} onChange={(e) => setEditingItem({ ...editingItem, reparto: e.target.value })} />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">Responsabile</Label>
                          <Select value={editingItem.responsabileId || "__none__"} onValueChange={(v) => setEditingItem({ ...editingItem, responsabileId: v === "__none__" ? "" : v })}>
                            <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Nessun responsabile" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__none__">Nessuno (livello apicale)</SelectItem>
                              {items?.filter((p: any) => p.stato === "attivo" && p.id !== editingItem.id).map((p: any) => (
                                <SelectItem key={p.id} value={p.id}>{p.cognome} {p.nome} - {p.ruolo || "N/D"}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs">Tipo Contratto</Label>
                          <Input className="h-8 text-sm" value={editingItem.tipoContratto || ""} onChange={(e) => setEditingItem({ ...editingItem, tipoContratto: e.target.value })} />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">Data Assunzione</Label>
                          <Input className="h-8 text-sm" type="date" value={editingItem.dataAssunzione || ""} onChange={(e) => setEditingItem({ ...editingItem, dataAssunzione: e.target.value })} />
                        </div>
                        <div>
                          <Label className="text-xs">Stato</Label>
                          <Select value={editingItem.stato || "attivo"} onValueChange={(v) => setEditingItem({ ...editingItem, stato: v })}>
                            <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                            <SelectContent>{STATI.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Dati Bancari */}
                  <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-900">
                    <h3 className="text-xs font-medium mb-3 flex items-center gap-2 text-green-700 dark:text-green-300">
                      <Euro className="h-3 w-3" />
                      Dati Bancari
                    </h3>
                    <div className="space-y-2">
                      <div>
                        <Label className="text-xs">IBAN</Label>
                        <Input className="h-8 text-sm" value={editingItem.iban || ""} onChange={(e) => handleIbanChangeEdit(e.target.value)} />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">Banca</Label>
                          <Input className="h-8 text-sm" value={editingItem.banca || ""} onChange={(e) => setEditingItem({ ...editingItem, banca: e.target.value })} />
                        </div>
                        <div>
                          <Label className="text-xs">Sito Banca</Label>
                          <Input className="h-8 text-sm" value={editingItem.sitoBanca || ""} onChange={(e) => setEditingItem({ ...editingItem, sitoBanca: e.target.value })} />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">ABI</Label>
                          <Input value={editingItem.abi || ""} readOnly className="h-8 text-sm bg-muted" />
                        </div>
                        <div>
                          <Label className="text-xs">CAB</Label>
                          <Input value={editingItem.cab || ""} readOnly className="h-8 text-sm bg-muted" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sezione Dati Cedolino */}
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-900 mt-3">
                <h3 className="text-xs font-medium mb-3 flex items-center gap-2 text-amber-700 dark:text-amber-300">
                  <FileText className="h-3 w-3" />
                  Dati Cedolino
                </h3>
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <Label className="text-xs">CCNL</Label>
                    <Input className="h-8 text-sm" value={editingItem.ccnl || ""} onChange={(e) => setEditingItem({ ...editingItem, ccnl: e.target.value })} />
                  </div>
                  <div>
                    <Label className="text-xs">Livello</Label>
                    <Input className="h-8 text-sm" value={editingItem.livelloContrattuale || ""} onChange={(e) => setEditingItem({ ...editingItem, livelloContrattuale: e.target.value })} />
                  </div>
                  <div>
                    <Label className="text-xs">Ore Sett.</Label>
                    <Input className="h-8 text-sm" value={editingItem.oreSettimanali || ""} onChange={(e) => setEditingItem({ ...editingItem, oreSettimanali: e.target.value })} />
                  </div>
                  <div>
                    <Label className="text-xs">% Part-Time</Label>
                    <Input className="h-8 text-sm" value={editingItem.percentualePartTime || ""} onChange={(e) => setEditingItem({ ...editingItem, percentualePartTime: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2 mt-2">
                  <div>
                    <Label className="text-xs">RAL Annua</Label>
                    <Input className="h-8 text-sm" value={editingItem.ralAnnua || ""} onChange={(e) => setEditingItem({ ...editingItem, ralAnnua: e.target.value })} />
                  </div>
                  <div>
                    <Label className="text-xs">Superminimo</Label>
                    <Input className="h-8 text-sm" value={editingItem.superminimo || ""} onChange={(e) => setEditingItem({ ...editingItem, superminimo: e.target.value })} />
                  </div>
                  <div>
                    <Label className="text-xs">Indennita Mens.</Label>
                    <Input className="h-8 text-sm" value={editingItem.indennitaMensile || ""} onChange={(e) => setEditingItem({ ...editingItem, indennitaMensile: e.target.value })} />
                  </div>
                  <div>
                    <Label className="text-xs">Buoni Pasto</Label>
                    <Input className="h-8 text-sm" value={editingItem.buoniPasto || ""} onChange={(e) => setEditingItem({ ...editingItem, buoniPasto: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2 mt-2">
                  <div>
                    <Label className="text-xs">Familiari a Carico</Label>
                    <Input className="h-8 text-sm" type="number" min="0" value={editingItem.familariACarico || 0} onChange={(e) => setEditingItem({ ...editingItem, familariACarico: parseInt(e.target.value) || 0 })} />
                  </div>
                  <div className="flex items-center gap-2 pt-4">
                    <input type="checkbox" id="coniuge-edit" checked={editingItem.coniugeACarico || false} onChange={(e) => setEditingItem({ ...editingItem, coniugeACarico: e.target.checked })} className="h-4 w-4" />
                    <Label htmlFor="coniuge-edit" className="text-xs">Coniuge a Carico</Label>
                  </div>
                  <div className="flex items-center gap-2 pt-4">
                    <input type="checkbox" id="disabile-edit" checked={editingItem.figlioDisabile || false} onChange={(e) => setEditingItem({ ...editingItem, figlioDisabile: e.target.checked })} className="h-4 w-4" />
                    <Label htmlFor="disabile-edit" className="text-xs">Figlio Disabile</Label>
                  </div>
                  <div>
                    <Label className="text-xs">Aliquota IRPEF</Label>
                    <Input className="h-8 text-sm" value={editingItem.aliquotaIrpef || ""} onChange={(e) => setEditingItem({ ...editingItem, aliquotaIrpef: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <div>
                    <Label className="text-xs">Contributi INPS %</Label>
                    <Input className="h-8 text-sm" value={editingItem.contributiInps || ""} onChange={(e) => setEditingItem({ ...editingItem, contributiInps: e.target.value })} />
                  </div>
                  <div>
                    <Label className="text-xs">TFR Destinazione</Label>
                    <Input className="h-8 text-sm" value={editingItem.tfr || ""} onChange={(e) => setEditingItem({ ...editingItem, tfr: e.target.value })} />
                  </div>
                  <div>
                    <Label className="text-xs">Fondi Pensione</Label>
                    <Input className="h-8 text-sm" value={editingItem.fondiPensione || ""} onChange={(e) => setEditingItem({ ...editingItem, fondiPensione: e.target.value })} />
                  </div>
                </div>
              </div>

              {/* Sezione Accesso Portale */}
              <div className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-200 dark:border-purple-900 mt-3">
                <h3 className="text-xs font-medium mb-3 flex items-center gap-2 text-purple-700 dark:text-purple-300">
                  <Key className="h-3 w-3" />
                  Accesso Portale Collaboratori
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label className="text-xs">Username</Label>
                    <Input className="h-8 text-sm" value={editingItem.portalUsername || ""} onChange={(e) => setEditingItem({ ...editingItem, portalUsername: e.target.value })} />
                  </div>
                  <div>
                    <Label className="text-xs">Password</Label>
                    <Input className="h-8 text-sm" type="password" value={editingItem.portalPassword || ""} onChange={(e) => setEditingItem({ ...editingItem, portalPassword: e.target.value })} placeholder="Lascia vuoto per non cambiare" />
                  </div>
                  <div className="flex items-center gap-2 pt-4">
                    <input type="checkbox" id="portal-edit" checked={editingItem.portalEnabled || false} onChange={(e) => setEditingItem({ ...editingItem, portalEnabled: e.target.checked })} className="h-4 w-4" />
                    <Label htmlFor="portal-edit" className="text-xs">Accesso Abilitato</Label>
                  </div>
                </div>
                {editingItem.portalEnabled && editingItem.portalToken && (
                  <div className="mt-3 p-2 bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-950/30 dark:to-emerald-950/30 rounded-lg border border-teal-200 dark:border-teal-800">
                    <Label className="text-xs text-teal-700 dark:text-teal-300 flex items-center gap-1 mb-1">
                      <Globe className="h-3 w-3" />
                      Link Portale Smartphone
                    </Label>
                    <div className="flex items-center gap-2">
                      <Input
                        className="h-7 text-xs flex-1 bg-white dark:bg-gray-900"
                        value={`${window.location.origin}/portale-collaboratori?token=${editingItem.portalToken}`}
                        readOnly
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={() => {
                          navigator.clipboard.writeText(`${window.location.origin}/portale-collaboratori?token=${editingItem.portalToken}`);
                          toast({ title: "Link copiato!", description: "Puoi condividerlo con il collaboratore" });
                        }}
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Copia
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs bg-gradient-to-r from-teal-500 to-emerald-500 text-white border-0 hover:from-teal-600 hover:to-emerald-600"
                        onClick={() => window.open(`/portale-collaboratori?token=${editingItem.portalToken}`, '_blank')}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Apri
                      </Button>
                    </div>
                    <p className="text-[9px] text-teal-600 dark:text-teal-400 mt-1">Condividi questo link con il collaboratore per l'accesso da smartphone</p>
                  </div>
                )}
              </div>

              <Button onClick={() => updateMutation.mutate({ id: editingItem.id, data: editingItem })} className="w-full mt-4">
                {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salva Modifiche"}
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog Gestione Cedolini */}
      <Dialog open={cedoliniDialogOpen} onOpenChange={setCedoliniDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Cedolini - {cedoliniPersonaleNome}
            </DialogTitle>
            <DialogDescription>Gestisci i cedolini del collaboratore</DialogDescription>
          </DialogHeader>

          {/* Form nuovo cedolino */}
          <div className="p-4 bg-muted/50 rounded-lg space-y-3">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Carica Nuovo Cedolino
            </h4>
            <div className="grid grid-cols-4 gap-3">
              <div>
                <Label className="text-xs">Mese</Label>
                <Select value={String(nuovoCedolino.mese)} onValueChange={(v) => setNuovoCedolino({ ...nuovoCedolino, mese: parseInt(v) })}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MESI_NOMI.map((m, i) => <SelectItem key={i + 1} value={String(i + 1)}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Anno</Label>
                <Select value={String(nuovoCedolino.anno)} onValueChange={(v) => setNuovoCedolino({ ...nuovoCedolino, anno: parseInt(v) })}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[2024, 2025, 2026].map(a => <SelectItem key={a} value={String(a)}>{a}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Lordo</Label>
                <Input className="h-8 text-sm" value={nuovoCedolino.stipendioLordo} onChange={(e) => setNuovoCedolino({ ...nuovoCedolino, stipendioLordo: e.target.value })} placeholder="2.500,00" />
              </div>
              <div>
                <Label className="text-xs">Netto</Label>
                <Input className="h-8 text-sm" value={nuovoCedolino.stipendioNetto} onChange={(e) => setNuovoCedolino({ ...nuovoCedolino, stipendioNetto: e.target.value })} placeholder="1.800,00" />
              </div>
            </div>
            <div className="flex gap-2 items-end">
              <input
                type="file"
                ref={cedolinoUploadRef}
                onChange={handleUploadCedolino}
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
              />
              <Button
                onClick={() => cedolinoUploadRef.current?.click()}
                disabled={uploadingCedolino}
                className="h-9"
              >
                {uploadingCedolino ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" />Caricamento...</>
                ) : (
                  <><Upload className="h-4 w-4 mr-2" />Seleziona File e Carica</>
                )}
              </Button>
            </div>
          </div>

          {/* Lista cedolini */}
          <div className="mt-4">
            <h4 className="font-medium text-sm mb-3">Storico Cedolini</h4>
            {isLoadingCedolini ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : cedoliniList.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-2 opacity-20" />
                <p>Nessun cedolino caricato</p>
              </div>
            ) : (
              <div className="space-y-2">
                {cedoliniList.map((ced: any) => (
                  <div key={ced.id} className="flex items-center justify-between p-3 bg-background border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                        <FileText className="h-5 w-5 text-amber-600" />
                      </div>
                      <div>
                        <div className="font-medium text-sm">{MESI_NOMI[ced.mese - 1]} {ced.anno}</div>
                        <div className="text-xs text-muted-foreground">{ced.filename}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {ced.stipendioNetto && (
                        <div className="text-right">
                          <div className="text-xs text-muted-foreground">Netto</div>
                          <div className="font-medium text-sm text-green-600">{ced.stipendioNetto}</div>
                        </div>
                      )}
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => window.open(`/api/cedolini/download/${ced.id}`, "_blank")}>
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteCedolino(ced.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Credenziali Portale */}
      <Dialog open={portalCredentialsDialogOpen} onOpenChange={setPortalCredentialsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Accesso Portale Collaboratori
            </DialogTitle>
            <DialogDescription>
              Configura le credenziali per {portalCredentialsItem?.nome} {portalCredentialsItem?.cognome}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <input
                type="checkbox"
                id="portalEnabled"
                checked={portalCredentials.enabled}
                onChange={(e) => setPortalCredentials({ ...portalCredentials, enabled: e.target.checked })}
                className="h-4 w-4"
              />
              <Label htmlFor="portalEnabled" className="flex-1 cursor-pointer">
                <span className="font-medium">Abilita accesso al portale</span>
                <p className="text-xs text-muted-foreground mt-0.5">Il collaboratore potrà visualizzare i propri cedolini</p>
              </Label>
            </div>
            <div>
              <Label>Nome Utente</Label>
              <Input
                value={portalCredentials.username}
                onChange={(e) => setPortalCredentials({ ...portalCredentials, username: e.target.value })}
                placeholder="es. mario.rossi"
              />
            </div>
            <div>
              <Label>Password {portalCredentialsItem?.portalPasswordHash ? "(lascia vuoto per non modificare)" : ""}</Label>
              <Input
                type="password"
                value={portalCredentials.password}
                onChange={(e) => setPortalCredentials({ ...portalCredentials, password: e.target.value })}
                placeholder="Nuova password"
              />
            </div>
            {portalCredentials.enabled && portalCredentials.username && (
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm">
                <p className="font-medium text-blue-800 dark:text-blue-200 mb-1">Link Portale:</p>
                <code className="text-xs bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded">/staff-portal</code>
              </div>
            )}
          </div>
          <div className="flex gap-2 mt-4">
            <Button variant="outline" onClick={() => setPortalCredentialsDialogOpen(false)} className="flex-1">Annulla</Button>
            <Button onClick={savePortalCredentials} disabled={savingCredentials} className="flex-1">
              {savingCredentials ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salva"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ClientiTab() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [portalDialogOpen, setPortalDialogOpen] = useState(false);
  const [portalClienteId, setPortalClienteId] = useState<string | null>(null);
  const [portalLink, setPortalLink] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [promemoriaDialogOpen, setPromemoriaDialogOpen] = useState(false);
  const [promemoriaEntita, setPromemoriaEntita] = useState<{ tipo: string; id: string; nome: string } | null>(null);
  const [promemoria, setPromemoria] = useState<any[]>([]);
  const [nuovoPromemoria, setNuovoPromemoria] = useState({ titolo: "", descrizione: "", dataScadenza: "", priorita: "normale", colore: "#3B82F6", notificaEmail: false });
  const [editingItem, setEditingItem] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStato, setFilterStato] = useState<string>("tutti");
  const [filterCategoria, setFilterCategoria] = useState<string>("tutti");
  const [viewMode, setViewMode] = useState<"grid" | "map">("grid");
  const [mapDialogOpen, setMapDialogOpen] = useState(false);
  const [newItem, setNewItem] = useState({
    ragioneSociale: "", partitaIva: "", codiceFiscale: "", email: "", pec: "",
    telefono: "", cellulare: "", indirizzo: "", citta: "", cap: "", provincia: "",
    nazione: "Italia", sdi: "", website: "", referente: "", categoria: "", condizioniPagamento: "", sconto: "", note: "", stato: "attivo", tags: ""
  });
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupError, setLookupError] = useState("");
  const [indirizziSpedizione, setIndirizziSpedizione] = useState<any[]>([]);
  const [showIndirizziDialog, setShowIndirizziDialog] = useState(false);
  const [nuovoIndirizzo, setNuovoIndirizzo] = useState<any>({ nome: "", indirizzo: "", cap: "", citta: "", provincia: "", telefono: "", email: "", referente: "", orariConsegna: "", noteConsegna: "", principale: false, orariLunedi: "", orariMartedi: "", orariMercoledi: "", orariGiovedi: "", orariVenerdi: "", orariSabato: "", orariDomenica: "" });
  const [editingIndirizzo, setEditingIndirizzo] = useState<any>(null);
  const [nuoviPuntiConsegna, setNuoviPuntiConsegna] = useState<any[]>([]);
  const [showNuovoPuntoDialog, setShowNuovoPuntoDialog] = useState(false);
  const [nuovoPuntoTemp, setNuovoPuntoTemp] = useState<any>({ nome: "", indirizzo: "", cap: "", citta: "", provincia: "", telefono: "", email: "", referente: "", noteConsegna: "", principale: false, orariLunedi: "", orariMartedi: "", orariMercoledi: "", orariGiovedi: "", orariVenerdi: "", orariSabato: "", orariDomenica: "" });
  const [cittaSuggestions, setCittaSuggestions] = useState<CittaInfo[]>([]);
  const [showCittaSuggestions, setShowCittaSuggestions] = useState(false);
  const [editCittaSuggestions, setEditCittaSuggestions] = useState<CittaInfo[]>([]);
  const [showEditCittaSuggestions, setShowEditCittaSuggestions] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importData, setImportData] = useState<any[]>([]);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0, importing: false });
  const [importErrors, setImportErrors] = useState<string[]>([]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportData([]);
    setImportErrors([]);

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(sheet, { defval: "" });

      const mappedData = data.map((row: any) => ({
        ragioneSociale: row["Ragione Sociale"] || row["ragioneSociale"] || row["Nome"] || row["nome"] || "",
        partitaIva: String(row["Partita IVA"] || row["partitaIva"] || row["P.IVA"] || row["piva"] || "").replace(/\D/g, ""),
        codiceFiscale: String(row["Codice Fiscale"] || row["codiceFiscale"] || row["CF"] || "").toUpperCase(),
        email: row["Email"] || row["email"] || row["E-mail"] || "",
        pec: row["PEC"] || row["pec"] || "",
        telefono: row["Telefono"] || row["telefono"] || row["Tel"] || "",
        cellulare: row["Cellulare"] || row["cellulare"] || row["Cell"] || "",
        indirizzo: row["Indirizzo"] || row["indirizzo"] || row["Via"] || "",
        citta: row["Città"] || row["citta"] || row["Comune"] || "",
        cap: String(row["CAP"] || row["cap"] || ""),
        provincia: String(row["Provincia"] || row["provincia"] || row["Prov"] || "").toUpperCase().slice(0, 2),
        nazione: row["Nazione"] || row["nazione"] || "Italia",
        sdi: String(row["SDI"] || row["sdi"] || row["Codice SDI"] || "").toUpperCase(),
        website: row["Website"] || row["website"] || row["Sito"] || "",
        referente: row["Referente"] || row["referente"] || "",
        categoria: row["Categoria"] || row["categoria"] || "",
        condizioniPagamento: row["Condizioni Pagamento"] || row["condizioniPagamento"] || row["Pagamento"] || "",
        note: row["Note"] || row["note"] || "",
        stato: "attivo",
        tags: row["Tags"] || row["tags"] || "",
      })).filter((item: any) => item.ragioneSociale);

      setImportData(mappedData);

      if (mappedData.length === 0) {
        setImportErrors(["Nessun dato valido trovato nel file. Assicurati che ci sia una colonna 'Ragione Sociale' o 'Nome'."]);
      }
    } catch (error) {
      console.error("Errore parsing file:", error);
      setImportErrors(["Errore nella lettura del file. Assicurati che sia un file Excel o CSV valido."]);
    }

    e.target.value = "";
  };

  const executeImport = async () => {
    if (importData.length === 0) return;

    setImportProgress({ current: 0, total: importData.length, importing: true });
    setImportErrors([]);
    const errors: string[] = [];

    for (let i = 0; i < importData.length; i++) {
      try {
        await apiClienti.create(importData[i]);
      } catch (error: any) {
        errors.push(`Riga ${i + 1} (${importData[i].ragioneSociale}): ${error.message || "Errore"}`);
      }
      setImportProgress({ current: i + 1, total: importData.length, importing: true });
    }

    setImportProgress({ current: importData.length, total: importData.length, importing: false });
    setImportErrors(errors);

    if (errors.length === 0) {
      toast({ title: "Importazione completata", description: `${importData.length} clienti importati con successo` });
      queryClient.invalidateQueries({ queryKey: ["anagrafica-clienti"] });
      setImportDialogOpen(false);
      setImportData([]);
    } else {
      queryClient.invalidateQueries({ queryKey: ["anagrafica-clienti"] });
      toast({ title: "Importazione parziale", description: `${importData.length - errors.length} importati, ${errors.length} errori`, variant: "destructive" });
    }
  };

  const downloadTemplate = () => {
    const template = [
      { "Ragione Sociale": "Esempio Srl", "Partita IVA": "12345678901", "Codice Fiscale": "", "Email": "info@esempio.it", "PEC": "", "Telefono": "0123456789", "Cellulare": "", "Indirizzo": "Via Roma 1", "Città": "Milano", "CAP": "20100", "Provincia": "MI", "SDI": "0000000", "Website": "", "Referente": "", "Categoria": "B2B", "Condizioni Pagamento": "30gg", "Note": "", "Tags": "" }
    ];
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Clienti");
    XLSX.writeFile(wb, "template_clienti.xlsx");
  };

  const handleCittaChange = (value: string, isEdit: boolean = false) => {
    if (isEdit) {
      setEditingItem({ ...editingItem, citta: value });
      const suggestions = searchCitta(value);
      setEditCittaSuggestions(suggestions);
      setShowEditCittaSuggestions(suggestions.length > 0);
    } else {
      setNewItem({ ...newItem, citta: value });
      const suggestions = searchCitta(value);
      setCittaSuggestions(suggestions);
      setShowCittaSuggestions(suggestions.length > 0);
    }
  };

  const selectCitta = (citta: CittaInfo, isEdit: boolean = false) => {
    if (isEdit) {
      setEditingItem({ ...editingItem, citta: citta.nome, cap: citta.cap, provincia: citta.provincia });
      setShowEditCittaSuggestions(false);
    } else {
      setNewItem({ ...newItem, citta: citta.nome, cap: citta.cap, provincia: citta.provincia });
      setShowCittaSuggestions(false);
    }
  };

  const loadIndirizziSpedizione = async (clienteId: string) => {
    try {
      const res = await fetch(`/api/anagrafica/clienti/${clienteId}/indirizzi-spedizione`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setIndirizziSpedizione(data);
      }
    } catch (error) {
      console.error("Errore caricamento indirizzi:", error);
    }
  };

  const saveIndirizzo = async () => {
    if (!editingItem?.id) return;
    try {
      const payload = editingIndirizzo || nuovoIndirizzo;
      const url = editingIndirizzo
        ? `/api/anagrafica/clienti/${editingItem.id}/indirizzi-spedizione/${editingIndirizzo.id}`
        : `/api/anagrafica/clienti/${editingItem.id}/indirizzi-spedizione`;
      const res = await fetch(url, {
        method: editingIndirizzo ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });
      if (res.ok) {
        toast({ title: "Salvato", description: "Indirizzo salvato con successo" });
        loadIndirizziSpedizione(editingItem.id);
        setNuovoIndirizzo({ nome: "", indirizzo: "", cap: "", citta: "", provincia: "", telefono: "", email: "", referente: "", orariConsegna: "", noteConsegna: "", principale: false, orariLunedi: "", orariMartedi: "", orariMercoledi: "", orariGiovedi: "", orariVenerdi: "", orariSabato: "", orariDomenica: "" });
        setEditingIndirizzo(null);
        setShowIndirizziDialog(false);
      }
    } catch (error) {
      toast({ title: "Errore", description: "Impossibile salvare l'indirizzo", variant: "destructive" });
    }
  };

  const deleteIndirizzo = async (id: string) => {
    if (!editingItem?.id) return;
    try {
      const res = await fetch(`/api/anagrafica/clienti/${editingItem.id}/indirizzi-spedizione/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        toast({ title: "Eliminato", description: "Indirizzo rimosso" });
        loadIndirizziSpedizione(editingItem.id);
      }
    } catch (error) {
      toast({ title: "Errore", description: "Impossibile eliminare l'indirizzo", variant: "destructive" });
    }
  };

  const lookupPiva = async (piva: string, setItem: (fn: (prev: any) => any) => void) => {
    if (!piva || piva.length < 11) {
      toast({ title: "P.IVA non valida", description: "Inserisci una P.IVA di 11 cifre", variant: "destructive" });
      return;
    }
    setIsLookingUp(true);
    setLookupError("");
    try {
      const res = await fetch(`/api/lookup/piva/${piva}`);
      const data = await res.json();
      if (data.valid) {
        setItem(prev => ({
          ...prev,
          ragioneSociale: data.ragioneSociale || prev.ragioneSociale,
          partitaIva: data.partitaIva || prev.partitaIva,
          indirizzo: data.indirizzo || prev.indirizzo,
          cap: data.cap || prev.cap,
          citta: data.citta || prev.citta,
          provincia: data.provincia || prev.provincia,
        }));
        toast({ title: "Dati trovati", description: `${data.ragioneSociale}` });
      } else {
        setLookupError(data.error || "P.IVA non trovata");
        toast({ title: "Non trovato", description: data.error || "P.IVA non trovata nel database VIES", variant: "destructive" });
      }
    } catch (error) {
      setLookupError("Errore nella ricerca");
      toast({ title: "Errore", description: "Impossibile contattare il servizio", variant: "destructive" });
    } finally {
      setIsLookingUp(false);
    }
  };

  const generatePortalMutation = useMutation({
    mutationFn: async (clienteId: string) => {
      const res = await fetch(`/api/anagrafica/clienti/${clienteId}/portal-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expiresInDays: 30 }),
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
    setPortalClienteId(clienteId);
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

  const openPromemoriaDialog = async (tipo: string, id: string, nome: string) => {
    setPromemoriaEntita({ tipo, id, nome });
    setNuovoPromemoria({ titolo: "", descrizione: "", dataScadenza: "", priorita: "normale", colore: "#3B82F6", notificaEmail: false });
    setPromemoriaDialogOpen(true);
    try {
      const res = await fetch(`/api/promemoria/${tipo}/${id}`);
      const data = await res.json();
      setPromemoria(data);
    } catch { setPromemoria([]); }
  };

  const savePromemoria = async () => {
    if (!promemoriaEntita || !nuovoPromemoria.titolo.trim()) return;
    try {
      const res = await fetch("/api/promemoria", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...nuovoPromemoria, tipo: promemoriaEntita.tipo, entitaId: promemoriaEntita.id }),
      });
      if (res.ok) {
        const newProm = await res.json();
        setPromemoria([newProm, ...promemoria]);
        setNuovoPromemoria({ titolo: "", descrizione: "", dataScadenza: "", priorita: "normale", colore: "#3B82F6", notificaEmail: false });
        toast({ title: "Promemoria creato" });
      }
    } catch { toast({ title: "Errore", variant: "destructive" }); }
  };

  const completePromemoria = async (id: string) => {
    try {
      await fetch(`/api/promemoria/${id}/completa`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
      setPromemoria(promemoria.map(p => p.id === id ? { ...p, stato: "completato" } : p));
      toast({ title: "Completato" });
    } catch { toast({ title: "Errore", variant: "destructive" }); }
  };

  const deletePromemoria = async (id: string) => {
    try {
      await fetch(`/api/promemoria/${id}`, { method: "DELETE" });
      setPromemoria(promemoria.filter(p => p.id !== id));
      toast({ title: "Eliminato" });
    } catch { toast({ title: "Errore", variant: "destructive" }); }
  };

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["anagrafica-clienti"],
    queryFn: apiClienti.getAll,
  });

  const { data: condizioniPagamento = [] } = useQuery({
    queryKey: ["condizioni-pagamento"],
    queryFn: async () => {
      const res = await fetch("/api/condizioni-pagamento");
      return res.json();
    },
  });

  const [condizioniDialogOpen, setCondizioniDialogOpen] = useState(false);
  const [nuovaCondizione, setNuovaCondizione] = useState({ codice: "", descrizione: "", giorniScadenza: 0 });

  const createCondizioneMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/condizioni-pagamento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["condizioni-pagamento"] });
      setNuovaCondizione({ codice: "", descrizione: "", giorniScadenza: 0 });
      toast({ title: "Condizione aggiunta", description: "La nuova condizione di pagamento è stata salvata" });
    },
  });

  const deleteCondizioneMutation = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/condizioni-pagamento/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["condizioni-pagamento"] });
      toast({ title: "Eliminata", description: "Condizione di pagamento rimossa" });
    },
  });

  const categorie = useMemo(() => {
    const set = new Set(items.map((i: any) => i.categoria).filter(Boolean));
    return Array.from(set) as string[];
  }, [items]);

  const duplicates = useMemo(() => {
    const pivaMap = new Map<string, string[]>();
    items.forEach((item: any) => {
      if (item.partitaIva) {
        const piva = item.partitaIva.replace(/\s/g, "");
        if (!pivaMap.has(piva)) pivaMap.set(piva, []);
        pivaMap.get(piva)!.push(item.id);
      }
    });
    const dups = new Set<string>();
    pivaMap.forEach((ids) => { if (ids.length > 1) ids.forEach(id => dups.add(id)); });
    return dups;
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item: any) => {
      const matchSearch = `${item.ragioneSociale} ${item.email || ""} ${item.partitaIva || ""}`.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStato = filterStato === "tutti" || item.stato === filterStato;
      const matchCategoria = filterCategoria === "tutti" || item.categoria === filterCategoria;
      return matchSearch && matchStato && matchCategoria;
    });
  }, [items, searchTerm, filterStato, filterCategoria]);

  const createMutation = useMutation({
    mutationFn: apiClienti.create,
    onSuccess: async (newCliente: any) => {
      if (nuoviPuntiConsegna.length > 0 && newCliente?.id) {
        for (const punto of nuoviPuntiConsegna) {
          try {
            await fetch(`/api/anagrafica/clienti/${newCliente.id}/indirizzi-spedizione`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(punto),
              credentials: "include",
            });
          } catch (e) {
            console.error("Errore salvataggio punto consegna:", e);
          }
        }
      }
      queryClient.invalidateQueries({ queryKey: ["anagrafica-clienti"] });
      setNewItem({ ragioneSociale: "", partitaIva: "", codiceFiscale: "", email: "", pec: "", telefono: "", cellulare: "", indirizzo: "", citta: "", cap: "", provincia: "", nazione: "Italia", sdi: "", website: "", referente: "", categoria: "", condizioniPagamento: "", sconto: "", note: "", stato: "attivo", tags: "" });
      setNuoviPuntiConsegna([]);
      setDialogOpen(false);
      toast({ title: "Cliente aggiunto", description: nuoviPuntiConsegna.length > 0 ? `Cliente e ${nuoviPuntiConsegna.length} punti consegna salvati` : "Il record è stato salvato con successo" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiClienti.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["anagrafica-clienti"] });
      setEditDialogOpen(false);
      setEditingItem(null);
      toast({ title: "Modifiche salvate", description: "Il record è stato aggiornato" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: apiClienti.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["anagrafica-clienti"] });
      toast({ title: "Eliminato", description: "Il record è stato rimosso" });
    },
  });

  const isFormValid = () => {
    if (!newItem.ragioneSociale) return false;
    if (newItem.partitaIva && !validatePartitaIva(newItem.partitaIva).valid) return false;
    if (newItem.codiceFiscale && !validateCodiceFiscale(newItem.codiceFiscale).valid) return false;
    return true;
  };

  if (isLoading) return <div className="flex items-center justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <div className="p-6 space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Cerca clienti..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
        </div>
        <Select value={filterStato} onValueChange={setFilterStato}>
          <SelectTrigger className="w-[140px]"><Filter className="h-4 w-4 mr-2" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="tutti">Tutti gli stati</SelectItem>
            {STATI.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterCategoria} onValueChange={setFilterCategoria}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Categoria" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="tutti">Tutte le categorie</SelectItem>
            {categorie.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        {(filterStato !== "tutti" || filterCategoria !== "tutti") && (
          <Button variant="ghost" size="sm" onClick={() => { setFilterStato("tutti"); setFilterCategoria("tutti"); }}>
            <X className="h-4 w-4 mr-1" />Rimuovi filtri
          </Button>
        )}
        <Dialog open={mapDialogOpen} onOpenChange={setMapDialogOpen}>
          <DialogContent className="max-w-[90vw] h-[85vh] p-0 overflow-hidden">
            <DialogHeader className="px-4 py-2 border-b">
              <DialogTitle>Mappa Clienti</DialogTitle>
            </DialogHeader>
            <div className="w-full h-full relative">
              <ClientiMap clienti={filteredItems} />
            </div>
          </DialogContent>
        </Dialog>
        <Button variant="default" size="sm" onClick={() => setMapDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
          <MapIcon className="h-4 w-4 mr-2" />
          Mappa Clienti
        </Button>
        <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm"><Upload className="h-4 w-4 mr-2" />Importa</Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><FileSpreadsheet className="h-5 w-5" />Importa Clienti da Excel/CSV</DialogTitle>
              <DialogDescription>Carica un file Excel o CSV con i dati dei clienti</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Label htmlFor="import-file">Seleziona file</Label>
                  <Input
                    id="import-file"
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileUpload}
                    className="mt-1"
                  />
                </div>
                <div className="pt-6">
                  <Button variant="outline" size="sm" onClick={downloadTemplate}>
                    <Download className="h-4 w-4 mr-2" />Scarica Template
                  </Button>
                </div>
              </div>

              {importErrors.length > 0 && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-red-800 dark:text-red-200 font-medium mb-2">
                    <AlertTriangle className="h-4 w-4" />Errori
                  </div>
                  <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
                    {importErrors.slice(0, 5).map((err, i) => <li key={i}>{err}</li>)}
                    {importErrors.length > 5 && <li>...e altri {importErrors.length - 5} errori</li>}
                  </ul>
                </div>
              )}

              {importData.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{importData.length} clienti pronti per l'importazione</span>
                    {importProgress.importing && (
                      <span className="text-sm text-muted-foreground">
                        Importazione: {importProgress.current}/{importProgress.total}
                      </span>
                    )}
                  </div>
                  <div className="border rounded-lg max-h-60 overflow-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50 sticky top-0">
                        <tr>
                          <th className="text-left p-2">Ragione Sociale</th>
                          <th className="text-left p-2">P.IVA</th>
                          <th className="text-left p-2">Città</th>
                          <th className="text-left p-2">Email</th>
                        </tr>
                      </thead>
                      <tbody>
                        {importData.slice(0, 50).map((item, i) => (
                          <tr key={i} className="border-t">
                            <td className="p-2">{item.ragioneSociale}</td>
                            <td className="p-2">{item.partitaIva}</td>
                            <td className="p-2">{item.citta} {item.provincia && `(${item.provincia})`}</td>
                            <td className="p-2 truncate max-w-[150px]">{item.email}</td>
                          </tr>
                        ))}
                        {importData.length > 50 && (
                          <tr className="border-t bg-muted/30">
                            <td colSpan={4} className="p-2 text-center text-muted-foreground">
                              ...e altri {importData.length - 50} record
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  <Button onClick={executeImport} disabled={importProgress.importing} className="w-full">
                    {importProgress.importing ? (
                      <><Loader2 className="h-4 w-4 animate-spin mr-2" />Importazione in corso...</>
                    ) : (
                      <><Upload className="h-4 w-4 mr-2" />Importa {importData.length} Clienti</>
                    )}
                  </Button>
                </div>
              )}

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Colonne supportate:</strong> Ragione Sociale, Partita IVA, Codice Fiscale, Email, PEC, Telefono, Cellulare, Indirizzo, Città, CAP, Provincia, SDI, Website, Referente, Categoria, Condizioni Pagamento, Note, Tags
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="ml-auto"><Plus className="h-4 w-4 mr-2" />Aggiungi</Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto text-sm">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                  <Building2 className="h-4 w-4 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-base">Nuovo Cliente</DialogTitle>
                  <DialogDescription className="text-xs">Inserisci i dati del nuovo cliente</DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-3">
              {/* Colonna Sinistra */}
              <div className="space-y-3">
                {/* Dati Societari */}
                <div className="p-3 bg-muted/50 rounded-lg">
                  <h3 className="text-xs font-medium mb-3 flex items-center gap-2">
                    <Building2 className="h-3 w-3" />
                    Dati Societari
                  </h3>
                  <div className="space-y-2">
                    <div>
                      <Label className="text-xs">Ragione Sociale *</Label>
                      <Input className="h-8 text-sm" value={newItem.ragioneSociale} onChange={(e) => setNewItem({ ...newItem, ragioneSociale: e.target.value })} placeholder="Es: Azienda SRL" />
                    </div>
                    <div>
                      <Label className="text-xs">Partita IVA</Label>
                      <div className="flex gap-1">
                        <Input
                          className="h-8 text-sm flex-1"
                          value={newItem.partitaIva}
                          onChange={(e) => setNewItem({ ...newItem, partitaIva: e.target.value })}
                          placeholder="12345678901"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => lookupPiva(newItem.partitaIva, setNewItem)}
                          disabled={isLookingUp || newItem.partitaIva.length < 11}
                          title="Cerca dati azienda da P.IVA"
                        >
                          {isLookingUp ? <Loader2 className="h-3 w-3 animate-spin" /> : <Globe className="h-3 w-3" />}
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Codice Fiscale</Label>
                        <Input className="h-8 text-sm" value={newItem.codiceFiscale} onChange={(e) => setNewItem({ ...newItem, codiceFiscale: e.target.value.toUpperCase() })} />
                      </div>
                      <div>
                        <Label className="text-xs">Codice SDI</Label>
                        <Input className="h-8 text-sm" value={newItem.sdi} onChange={(e) => setNewItem({ ...newItem, sdi: e.target.value.toUpperCase() })} placeholder="0000000" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sede */}
                <div className="p-3 bg-muted/50 rounded-lg">
                  <h3 className="text-xs font-medium mb-3 flex items-center gap-2">
                    <MapPin className="h-3 w-3" />
                    Sede
                  </h3>
                  <div className="space-y-2">
                    <div>
                      <Label className="text-xs">Indirizzo</Label>
                      <Input className="h-8 text-sm" value={newItem.indirizzo} onChange={(e) => setNewItem({ ...newItem, indirizzo: e.target.value })} placeholder="Via Roma, 1" />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Label className="text-xs">CAP</Label>
                        <Input className="h-8 text-sm" value={newItem.cap} onChange={(e) => setNewItem({ ...newItem, cap: e.target.value })} placeholder="00100" maxLength={5} />
                      </div>
                      <div className="relative">
                        <Label className="text-xs">Città</Label>
                        <Input
                          className="h-8 text-sm"
                          value={newItem.citta}
                          onChange={(e) => handleCittaChange(e.target.value, false)}
                          onBlur={() => setTimeout(() => setShowCittaSuggestions(false), 200)}
                          placeholder="Città..."
                        />
                        {showCittaSuggestions && cittaSuggestions.length > 0 && (
                          <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-40 overflow-y-auto">
                            {cittaSuggestions.map((c) => (
                              <div
                                key={`${c.nome}-${c.cap}`}
                                className="px-2 py-1.5 hover:bg-accent cursor-pointer text-xs flex justify-between"
                                onMouseDown={() => selectCitta(c, false)}
                              >
                                <span>{c.nome}</span>
                                <span className="text-muted-foreground">{c.cap} ({c.provincia})</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div>
                        <Label className="text-xs">Prov.</Label>
                        <Select value={newItem.provincia} onValueChange={(v) => setNewItem({ ...newItem, provincia: v })}>
                          <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="..." /></SelectTrigger>
                          <SelectContent>{PROVINCE_ITALIANE.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Note */}
                <div className="p-3 bg-muted/50 rounded-lg">
                  <h3 className="text-xs font-medium mb-3 flex items-center gap-2">
                    <Tag className="h-3 w-3" />
                    Note e Tags
                  </h3>
                  <div className="space-y-2">
                    <div>
                      <Label className="text-xs">Tags (separati da virgola)</Label>
                      <Input className="h-8 text-sm" value={newItem.tags} onChange={(e) => setNewItem({ ...newItem, tags: e.target.value })} placeholder="vip, puntuale, estero" />
                    </div>
                    <div>
                      <Label className="text-xs">Note</Label>
                      <Input className="h-8 text-sm" value={newItem.note} onChange={(e) => setNewItem({ ...newItem, note: e.target.value })} placeholder="Note aggiuntive..." />
                    </div>
                  </div>
                </div>
              </div>

              {/* Colonna Destra */}
              <div className="space-y-3">
                {/* Contatti */}
                <div className="p-3 bg-muted/50 rounded-lg">
                  <h3 className="text-xs font-medium mb-3 flex items-center gap-2">
                    <Phone className="h-3 w-3" />
                    Contatti
                  </h3>
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Telefono</Label>
                        <Input className="h-8 text-sm" value={newItem.telefono} onChange={(e) => setNewItem({ ...newItem, telefono: e.target.value })} placeholder="+39 06 1234567" />
                      </div>
                      <div>
                        <Label className="text-xs">Cellulare</Label>
                        <Input className="h-8 text-sm" value={newItem.cellulare} onChange={(e) => setNewItem({ ...newItem, cellulare: e.target.value })} placeholder="+39 333 1234567" />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Email</Label>
                      <Input className="h-8 text-sm" type="email" value={newItem.email} onChange={(e) => setNewItem({ ...newItem, email: e.target.value })} placeholder="info@azienda.it" />
                    </div>
                    <div>
                      <Label className="text-xs">PEC</Label>
                      <Input className="h-8 text-sm" type="email" value={newItem.pec} onChange={(e) => setNewItem({ ...newItem, pec: e.target.value })} placeholder="azienda@pec.it" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Sito Web</Label>
                        <Input className="h-8 text-sm" value={newItem.website} onChange={(e) => setNewItem({ ...newItem, website: e.target.value })} placeholder="www.azienda.it" />
                      </div>
                      <div>
                        <Label className="text-xs">Referente</Label>
                        <Input className="h-8 text-sm" value={newItem.referente} onChange={(e) => setNewItem({ ...newItem, referente: e.target.value })} placeholder="Nome" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Impostazioni Commerciali */}
                <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-900">
                  <h3 className="text-xs font-medium mb-3 flex items-center gap-2 text-blue-700 dark:text-blue-300">
                    <Euro className="h-3 w-3" />
                    Impostazioni Commerciali
                  </h3>
                  <div className="space-y-2">
                    <div>
                      <Label className="text-xs">Categoria</Label>
                      <Input className="h-8 text-sm" value={newItem.categoria} onChange={(e) => setNewItem({ ...newItem, categoria: e.target.value })} placeholder="Retail, B2B..." />
                    </div>
                    <div>
                      <Label className="text-xs">Condizioni Pagamento</Label>
                      <div className="flex gap-1">
                        <Select value={newItem.condizioniPagamento} onValueChange={(v) => setNewItem({ ...newItem, condizioniPagamento: v })}>
                          <SelectTrigger className="h-8 text-sm flex-1"><SelectValue placeholder="Seleziona..." /></SelectTrigger>
                          <SelectContent>
                            {condizioniPagamento.map((c: any) => (
                              <SelectItem key={c.id} value={c.descrizione}>{c.codice} - {c.descrizione}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={() => setCondizioniDialogOpen(true)} title="Gestisci condizioni">
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Stato</Label>
                      <Select value={newItem.stato} onValueChange={(v) => setNewItem({ ...newItem, stato: v })}>
                        <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>{STATI.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Accesso Portale */}
                <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-900">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-medium flex items-center gap-2 text-green-700 dark:text-green-300">
                      <Key className="h-3 w-3" />
                      Accesso Portale Cliente
                    </h3>
                    <div className="flex items-center gap-2">
                      <Label htmlFor="nuovo-portale-abilitato" className="text-xs">Abilitato</Label>
                      <input
                        type="checkbox"
                        id="nuovo-portale-abilitato"
                        checked={newItem.portaleAbilitato || false}
                        onChange={(e) => setNewItem({ ...newItem, portaleAbilitato: e.target.checked })}
                        className="h-3 w-3"
                      />
                    </div>
                  </div>
                  {newItem.portaleAbilitato && (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Username</Label>
                        <Input
                          className="h-8 text-sm"
                          value={newItem.portaleUsername || ""}
                          onChange={(e) => setNewItem({ ...newItem, portaleUsername: e.target.value })}
                          placeholder="username.cliente"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Password</Label>
                        <Input
                          className="h-8 text-sm"
                          type="password"
                          value={newItem.portalePassword || ""}
                          onChange={(e) => setNewItem({ ...newItem, portalePassword: e.target.value })}
                          placeholder="Imposta password"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sezione Punti Consegna */}
            <div className="p-3 bg-orange-50 dark:bg-orange-950/30 rounded-lg border border-orange-200 dark:border-orange-900 mt-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-medium flex items-center gap-2 text-orange-700 dark:text-orange-300">
                  <Truck className="h-3 w-3" />
                  Punti di Consegna
                  {nuoviPuntiConsegna.length > 0 && (
                    <Badge variant="secondary" className="text-xs">{nuoviPuntiConsegna.length}</Badge>
                  )}
                </h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setShowNuovoPuntoDialog(true)}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Aggiungi
                </Button>
              </div>
              {nuoviPuntiConsegna.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-2">Nessun punto di consegna aggiunto</p>
              ) : (
                <div className="space-y-2">
                  {nuoviPuntiConsegna.map((punto, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-background rounded border text-xs">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3 w-3 text-orange-500" />
                        <div>
                          <span className="font-medium">{punto.nome || "Punto " + (idx + 1)}</span>
                          <span className="text-muted-foreground ml-2">{punto.indirizzo}, {punto.citta}</span>
                          {punto.principale && <Badge variant="default" className="ml-2 text-[10px] px-1">Principale</Badge>}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => setNuoviPuntiConsegna(nuoviPuntiConsegna.filter((_, i) => i !== idx))}
                      >
                        <Trash2 className="h-3 w-3 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Dialog Nuovo Punto Consegna */}
            <Dialog open={showNuovoPuntoDialog} onOpenChange={setShowNuovoPuntoDialog}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-sm flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    Nuovo Punto di Consegna
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs">Nome punto</Label>
                    <Input className="h-8 text-sm" value={nuovoPuntoTemp.nome} onChange={(e) => setNuovoPuntoTemp({ ...nuovoPuntoTemp, nome: e.target.value })} placeholder="Es: Magazzino Nord" />
                  </div>
                  <div>
                    <Label className="text-xs">Indirizzo *</Label>
                    <Input className="h-8 text-sm" value={nuovoPuntoTemp.indirizzo} onChange={(e) => setNuovoPuntoTemp({ ...nuovoPuntoTemp, indirizzo: e.target.value })} placeholder="Via Roma, 1" />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label className="text-xs">CAP</Label>
                      <Input className="h-8 text-sm" value={nuovoPuntoTemp.cap} onChange={(e) => setNuovoPuntoTemp({ ...nuovoPuntoTemp, cap: e.target.value })} maxLength={5} />
                    </div>
                    <div>
                      <Label className="text-xs">Città *</Label>
                      <Input className="h-8 text-sm" value={nuovoPuntoTemp.citta} onChange={(e) => setNuovoPuntoTemp({ ...nuovoPuntoTemp, citta: e.target.value })} />
                    </div>
                    <div>
                      <Label className="text-xs">Prov.</Label>
                      <Select value={nuovoPuntoTemp.provincia} onValueChange={(v) => setNuovoPuntoTemp({ ...nuovoPuntoTemp, provincia: v })}>
                        <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="..." /></SelectTrigger>
                        <SelectContent>{PROVINCE_ITALIANE.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Telefono</Label>
                      <Input className="h-8 text-sm" value={nuovoPuntoTemp.telefono} onChange={(e) => setNuovoPuntoTemp({ ...nuovoPuntoTemp, telefono: e.target.value })} />
                    </div>
                    <div>
                      <Label className="text-xs">Referente</Label>
                      <Input className="h-8 text-sm" value={nuovoPuntoTemp.referente} onChange={(e) => setNuovoPuntoTemp({ ...nuovoPuntoTemp, referente: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Note consegna</Label>
                    <Input className="h-8 text-sm" value={nuovoPuntoTemp.noteConsegna} onChange={(e) => setNuovoPuntoTemp({ ...nuovoPuntoTemp, noteConsegna: e.target.value })} placeholder="Orari, accesso, ecc." />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="punto-principale"
                      checked={nuovoPuntoTemp.principale}
                      onChange={(e) => setNuovoPuntoTemp({ ...nuovoPuntoTemp, principale: e.target.checked })}
                      className="h-3 w-3"
                    />
                    <Label htmlFor="punto-principale" className="text-xs">Punto principale</Label>
                  </div>
                  <Button
                    className="w-full h-8 text-sm"
                    disabled={!nuovoPuntoTemp.indirizzo || !nuovoPuntoTemp.citta}
                    onClick={() => {
                      setNuoviPuntiConsegna([...nuoviPuntiConsegna, { ...nuovoPuntoTemp }]);
                      setNuovoPuntoTemp({ nome: "", indirizzo: "", cap: "", citta: "", provincia: "", telefono: "", email: "", referente: "", noteConsegna: "", principale: false, orariLunedi: "", orariMartedi: "", orariMercoledi: "", orariGiovedi: "", orariVenerdi: "", orariSabato: "", orariDomenica: "" });
                      setShowNuovoPuntoDialog(false);
                    }}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Aggiungi Punto
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Button onClick={() => createMutation.mutate(newItem)} disabled={!isFormValid()} className="w-full mt-4 h-9 text-sm">
              {createMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <Save className="h-3 w-3 mr-2" />}
              Salva Cliente
            </Button>
          </DialogContent>
        </Dialog>
      </div>

      {duplicates.size > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <span className="text-sm text-yellow-800 dark:text-yellow-200">Attenzione: rilevati {duplicates.size} possibili duplicati (stessa P.IVA)</span>
        </div>
      )}

      <div className="text-sm text-muted-foreground">{filteredItems.length} di {items.length} record</div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredItems.map((item: any) => (
          <Card key={item.id} className={`hover:shadow-md transition-shadow ${duplicates.has(item.id) ? "ring-2 ring-yellow-400" : ""}`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{item.ragioneSociale}</h3>
                    {item.categoria && <p className="text-sm text-muted-foreground">{item.categoria}</p>}
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => { setEditingItem({ ...item }); loadIndirizziSpedizione(item.id); setEditDialogOpen(true); }}><Edit2 className="h-4 w-4 mr-2" />Modifica</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => { setNewItem({ ...item, id: undefined }); setDialogOpen(true); }}><Copy className="h-4 w-4 mr-2" />Duplica</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => openPortalDialog(item.id)}><LinkIcon className="h-4 w-4 mr-2" />Portale Cliente</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => openPromemoriaDialog("cliente", item.id, item.ragioneSociale)}><Bell className="h-4 w-4 mr-2" />Promemoria</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => deleteMutation.mutate(item.id)} className="text-destructive"><Trash2 className="h-4 w-4 mr-2" />Elimina</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <StatoBadge stato={item.stato || "attivo"} />
                {item.partitaIva && <Badge variant="outline" className="text-xs">P.IVA: {item.partitaIva}</Badge>}
              </div>
              <div className="mt-3 space-y-1 text-sm">
                {item.email && <div className="flex items-center gap-2 text-muted-foreground"><Mail className="h-3 w-3" />{item.email}</div>}
                {item.telefono && <div className="flex items-center gap-2 text-muted-foreground"><Phone className="h-3 w-3" />{item.telefono}</div>}
                {item.citta && <div className="flex items-center gap-2 text-muted-foreground"><MapPin className="h-3 w-3" />{item.citta}{item.provincia && ` (${item.provincia})`}</div>}
              </div>
              <TagsDisplay tags={item.tags} />
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Building2 className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <p>Nessun cliente trovato</p>
        </div>
      )}

      <Dialog open={mapDialogOpen} onOpenChange={setMapDialogOpen}>
        <DialogContent className="max-w-[98vw] w-[98vw] max-h-[95vh] h-[95vh] overflow-hidden p-0">
          <div className="flex h-full">
            <div className="flex-1 relative">
              <div className="h-full">
                <ClientiMap clienti={filteredItems} />
              </div>
            </div>
            <div className="w-72 border-l bg-background flex flex-col">
              <div className="p-3 border-b bg-muted/50">
                <h3 className="font-semibold text-sm">Lista Clienti</h3>
                <p className="text-xs text-muted-foreground">{filteredItems.length} clienti</p>
              </div>
              <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                  {filteredItems.map((item: any) => {
                    const provinciaColor = getProvinciaColor(item.provincia);
                    return (
                      <div
                        key={item.id}
                        className="p-2 rounded-lg border hover:bg-accent/50 cursor-pointer transition-colors"
                        style={{ borderLeftWidth: 3, borderLeftColor: provinciaColor }}
                      >
                        <div className="font-medium text-sm truncate">{item.ragioneSociale}</div>
                        <div className="flex items-center gap-2 mt-1">
                          {item.provincia && (
                            <span
                              className="text-[10px] px-1.5 py-0.5 rounded text-white"
                              style={{ backgroundColor: provinciaColor }}
                            >
                              {item.provincia}
                            </span>
                          )}
                          {item.citta && (
                            <span className="text-xs text-muted-foreground truncate">{item.citta}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
              <div className="p-3 border-t bg-muted/30">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    const url = `${window.location.origin}/tv/mappa-clienti`;
                    navigator.clipboard.writeText(url);
                    toast({ title: "Link copiato!", description: "Apri questo link sul TV per visualizzare la mappa a schermo intero" });
                  }}
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Condividi
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto text-sm">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <Building2 className="h-4 w-4 text-white" />
              </div>
              <div>
                <DialogTitle className="text-base">Modifica Cliente</DialogTitle>
                <DialogDescription className="text-xs">Modifica i dati del cliente</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          {editingItem && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-3">
              {/* Colonna Sinistra */}
              <div className="space-y-3">
                {/* Dati Societari */}
                <div className="p-3 bg-muted/50 rounded-lg">
                  <h3 className="text-xs font-medium mb-3 flex items-center gap-2">
                    <Building2 className="h-3 w-3" />
                    Dati Societari
                  </h3>
                  <div className="space-y-2">
                    <div>
                      <Label className="text-xs">Ragione Sociale *</Label>
                      <Input className="h-8 text-sm" value={editingItem.ragioneSociale || ""} onChange={(e) => setEditingItem({ ...editingItem, ragioneSociale: e.target.value })} placeholder="Es: Azienda SRL" />
                    </div>
                    <div>
                      <Label className="text-xs">Partita IVA</Label>
                      <div className="flex gap-1">
                        <Input
                          className="h-8 text-sm flex-1"
                          value={editingItem.partitaIva || ""}
                          onChange={(e) => setEditingItem({ ...editingItem, partitaIva: e.target.value })}
                          placeholder="12345678901"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => lookupPiva(editingItem.partitaIva || "", setEditingItem)}
                          disabled={isLookingUp || (editingItem.partitaIva || "").length < 11}
                          title="Cerca dati azienda da P.IVA"
                        >
                          {isLookingUp ? <Loader2 className="h-3 w-3 animate-spin" /> : <Globe className="h-3 w-3" />}
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Codice Fiscale</Label>
                        <Input className="h-8 text-sm" value={editingItem.codiceFiscale || ""} onChange={(e) => setEditingItem({ ...editingItem, codiceFiscale: e.target.value.toUpperCase() })} />
                      </div>
                      <div>
                        <Label className="text-xs">Codice SDI</Label>
                        <Input className="h-8 text-sm" value={editingItem.sdi || ""} onChange={(e) => setEditingItem({ ...editingItem, sdi: e.target.value.toUpperCase() })} placeholder="0000000" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sede */}
                <div className="p-3 bg-muted/50 rounded-lg">
                  <h3 className="text-xs font-medium mb-3 flex items-center gap-2">
                    <MapPin className="h-3 w-3" />
                    Sede
                  </h3>
                  <div className="space-y-2">
                    <div>
                      <Label className="text-xs">Indirizzo</Label>
                      <Input className="h-8 text-sm" value={editingItem.indirizzo || ""} onChange={(e) => setEditingItem({ ...editingItem, indirizzo: e.target.value })} placeholder="Via Roma, 1" />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Label className="text-xs">CAP</Label>
                        <Input className="h-8 text-sm" value={editingItem.cap || ""} onChange={(e) => setEditingItem({ ...editingItem, cap: e.target.value })} placeholder="00100" maxLength={5} />
                      </div>
                      <div className="relative">
                        <Label className="text-xs">Città</Label>
                        <Input
                          className="h-8 text-sm"
                          value={editingItem.citta || ""}
                          onChange={(e) => handleCittaChange(e.target.value, true)}
                          onBlur={() => setTimeout(() => setShowEditCittaSuggestions(false), 200)}
                          placeholder="Città..."
                        />
                        {showEditCittaSuggestions && editCittaSuggestions.length > 0 && (
                          <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-40 overflow-y-auto">
                            {editCittaSuggestions.map((c) => (
                              <div
                                key={`edit-${c.nome}-${c.cap}`}
                                className="px-2 py-1.5 hover:bg-accent cursor-pointer text-xs flex justify-between"
                                onMouseDown={() => selectCitta(c, true)}
                              >
                                <span>{c.nome}</span>
                                <span className="text-muted-foreground">{c.cap} ({c.provincia})</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div>
                        <Label className="text-xs">Prov.</Label>
                        <Select value={editingItem.provincia || ""} onValueChange={(v) => setEditingItem({ ...editingItem, provincia: v })}>
                          <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="..." /></SelectTrigger>
                          <SelectContent>{PROVINCE_ITALIANE.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Note */}
                <div className="p-3 bg-muted/50 rounded-lg">
                  <h3 className="text-xs font-medium mb-3 flex items-center gap-2">
                    <Tag className="h-3 w-3" />
                    Note e Tags
                  </h3>
                  <div className="space-y-2">
                    <div>
                      <Label className="text-xs">Tags (separati da virgola)</Label>
                      <Input className="h-8 text-sm" value={editingItem.tags || ""} onChange={(e) => setEditingItem({ ...editingItem, tags: e.target.value })} placeholder="vip, puntuale, estero" />
                    </div>
                    <div>
                      <Label className="text-xs">Note</Label>
                      <Input className="h-8 text-sm" value={editingItem.note || ""} onChange={(e) => setEditingItem({ ...editingItem, note: e.target.value })} placeholder="Note aggiuntive..." />
                    </div>
                  </div>
                </div>

                {/* Indirizzi di Spedizione */}
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-medium flex items-center gap-2"><Truck className="h-3 w-3" />Punti Consegna</h3>
                    <Button type="button" variant="outline" size="sm" className="h-6 text-xs" onClick={() => { setEditingIndirizzo(null); setNuovoIndirizzo({ nome: "", indirizzo: "", cap: "", citta: "", provincia: "", telefono: "", email: "", referente: "", orariConsegna: "", noteConsegna: "", principale: false, orariLunedi: "", orariMartedi: "", orariMercoledi: "", orariGiovedi: "", orariVenerdi: "", orariSabato: "", orariDomenica: "" }); setShowIndirizziDialog(true); }}>
                      <Plus className="h-3 w-3 mr-1" />Aggiungi
                    </Button>
                  </div>
                  {indirizziSpedizione.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Nessun punto consegna configurato.</p>
                  ) : (
                    <div className="space-y-1.5 max-h-32 overflow-y-auto">
                      {indirizziSpedizione.map((ind: any) => (
                        <div key={ind.id} className="flex items-center justify-between p-1.5 border rounded text-xs">
                          <div className="flex items-center gap-1.5 min-w-0">
                            {ind.principale && <Badge variant="secondary" className="text-[9px] px-1">Pred.</Badge>}
                            <div className="min-w-0">
                              <p className="font-medium truncate">{ind.nome}</p>
                              <p className="text-muted-foreground text-[10px] truncate">{ind.citta} ({ind.provincia})</p>
                            </div>
                          </div>
                          <div className="flex gap-0.5">
                            <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => { setEditingIndirizzo(ind); setShowIndirizziDialog(true); }}><Edit2 className="h-2.5 w-2.5" /></Button>
                            <Button variant="ghost" size="icon" className="h-5 w-5 text-destructive" onClick={() => deleteIndirizzo(ind.id)}><Trash2 className="h-2.5 w-2.5" /></Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Colonna Destra */}
              <div className="space-y-3">
                {/* Contatti */}
                <div className="p-3 bg-muted/50 rounded-lg">
                  <h3 className="text-xs font-medium mb-3 flex items-center gap-2">
                    <Phone className="h-3 w-3" />
                    Contatti
                  </h3>
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Telefono</Label>
                        <Input className="h-8 text-sm" value={editingItem.telefono || ""} onChange={(e) => setEditingItem({ ...editingItem, telefono: e.target.value })} placeholder="+39 06 1234567" />
                      </div>
                      <div>
                        <Label className="text-xs">Cellulare</Label>
                        <Input className="h-8 text-sm" value={editingItem.cellulare || ""} onChange={(e) => setEditingItem({ ...editingItem, cellulare: e.target.value })} placeholder="+39 333 1234567" />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Email</Label>
                      <Input className="h-8 text-sm" type="email" value={editingItem.email || ""} onChange={(e) => setEditingItem({ ...editingItem, email: e.target.value })} placeholder="info@azienda.it" />
                    </div>
                    <div>
                      <Label className="text-xs">PEC</Label>
                      <Input className="h-8 text-sm" type="email" value={editingItem.pec || ""} onChange={(e) => setEditingItem({ ...editingItem, pec: e.target.value })} placeholder="azienda@pec.it" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Sito Web</Label>
                        <Input className="h-8 text-sm" value={editingItem.website || ""} onChange={(e) => setEditingItem({ ...editingItem, website: e.target.value })} placeholder="www.azienda.it" />
                      </div>
                      <div>
                        <Label className="text-xs">Referente</Label>
                        <Input className="h-8 text-sm" value={editingItem.referente || ""} onChange={(e) => setEditingItem({ ...editingItem, referente: e.target.value })} placeholder="Nome" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Impostazioni Commerciali */}
                <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-900">
                  <h3 className="text-xs font-medium mb-3 flex items-center gap-2 text-blue-700 dark:text-blue-300">
                    <Euro className="h-3 w-3" />
                    Impostazioni Commerciali
                  </h3>
                  <div className="space-y-2">
                    <div>
                      <Label className="text-xs">Categoria</Label>
                      <Input className="h-8 text-sm" value={editingItem.categoria || ""} onChange={(e) => setEditingItem({ ...editingItem, categoria: e.target.value })} placeholder="Retail, B2B..." />
                    </div>
                    <div>
                      <Label className="text-xs">Condizioni Pagamento</Label>
                      <div className="flex gap-1">
                        <Select value={editingItem.condizioniPagamento || ""} onValueChange={(v) => setEditingItem({ ...editingItem, condizioniPagamento: v })}>
                          <SelectTrigger className="h-8 text-sm flex-1"><SelectValue placeholder="Seleziona..." /></SelectTrigger>
                          <SelectContent>
                            {condizioniPagamento.map((c: any) => (
                              <SelectItem key={c.id} value={c.descrizione}>{c.codice} - {c.descrizione}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={() => setCondizioniDialogOpen(true)} title="Gestisci condizioni">
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Stato</Label>
                      <Select value={editingItem.stato || "attivo"} onValueChange={(v) => setEditingItem({ ...editingItem, stato: v })}>
                        <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>{STATI.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Accesso Portale */}
                <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-900">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-medium flex items-center gap-2 text-green-700 dark:text-green-300">
                      <Key className="h-3 w-3" />
                      Accesso Portale Cliente
                    </h3>
                    <div className="flex items-center gap-2">
                      <Label htmlFor="portale-abilitato" className="text-xs">Abilitato</Label>
                      <input
                        type="checkbox"
                        id="portale-abilitato"
                        checked={editingItem.portaleAbilitato || false}
                        onChange={(e) => setEditingItem({ ...editingItem, portaleAbilitato: e.target.checked })}
                        className="h-3 w-3"
                      />
                    </div>
                  </div>
                  {editingItem.portaleAbilitato && (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Username</Label>
                        <Input
                          className="h-8 text-sm"
                          value={editingItem.portaleUsername || ""}
                          onChange={(e) => setEditingItem({ ...editingItem, portaleUsername: e.target.value })}
                          placeholder="username.cliente"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Password {editingItem.portalePassword ? "(impostata)" : ""}</Label>
                        <Input
                          className="h-8 text-sm"
                          type="password"
                          value={editingItem.nuovaPassword || ""}
                          onChange={(e) => setEditingItem({ ...editingItem, nuovaPassword: e.target.value })}
                          placeholder={editingItem.portalePassword ? "Lascia vuoto" : "Nuova password"}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          <Button onClick={() => {
            const dataToSave = { ...editingItem };
            if (editingItem.nuovaPassword) {
              dataToSave.portalePassword = editingItem.nuovaPassword;
            }
            delete dataToSave.nuovaPassword;
            updateMutation.mutate({ id: editingItem.id, data: dataToSave });
          }} className="w-full mt-4 h-9 text-sm">
            {updateMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <Save className="h-3 w-3 mr-2" />}
            Salva Modifiche
          </Button>
        </DialogContent>
      </Dialog>

      {/* Dialog Aggiungi/Modifica Indirizzo Spedizione */}
      <Dialog open={showIndirizziDialog} onOpenChange={setShowIndirizziDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base">{editingIndirizzo ? "Modifica Punto Consegna" : "Nuovo Punto di Consegna"}</DialogTitle>
            <DialogDescription className="text-xs">Configura indirizzo e orari di apertura per le consegne</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            {/* Colonna sinistra - Dati indirizzo */}
            <div className="space-y-3">
              <div className="p-3 bg-muted/50 rounded-lg">
                <h4 className="text-xs font-medium mb-2 flex items-center gap-1"><MapPin className="h-3 w-3" />Indirizzo</h4>
                <div className="space-y-2">
                  <div>
                    <Label className="text-xs">Nome Punto Consegna *</Label>
                    <Input className="h-8 text-sm" placeholder="es: Magazzino Nord" value={editingIndirizzo?.nome || nuovoIndirizzo.nome} onChange={(e) => editingIndirizzo ? setEditingIndirizzo({ ...editingIndirizzo, nome: e.target.value }) : setNuovoIndirizzo({ ...nuovoIndirizzo, nome: e.target.value })} />
                  </div>
                  <div>
                    <Label className="text-xs">Indirizzo *</Label>
                    <Input className="h-8 text-sm" placeholder="Via/Piazza..." value={editingIndirizzo?.indirizzo || nuovoIndirizzo.indirizzo} onChange={(e) => editingIndirizzo ? setEditingIndirizzo({ ...editingIndirizzo, indirizzo: e.target.value }) : setNuovoIndirizzo({ ...nuovoIndirizzo, indirizzo: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    <div>
                      <Label className="text-xs">CAP</Label>
                      <Input className="h-8 text-sm" value={editingIndirizzo?.cap || nuovoIndirizzo.cap} onChange={(e) => editingIndirizzo ? setEditingIndirizzo({ ...editingIndirizzo, cap: e.target.value }) : setNuovoIndirizzo({ ...nuovoIndirizzo, cap: e.target.value })} />
                    </div>
                    <div>
                      <Label className="text-xs">Città</Label>
                      <Input className="h-8 text-sm" value={editingIndirizzo?.citta || nuovoIndirizzo.citta} onChange={(e) => editingIndirizzo ? setEditingIndirizzo({ ...editingIndirizzo, citta: e.target.value }) : setNuovoIndirizzo({ ...nuovoIndirizzo, citta: e.target.value })} />
                    </div>
                    <div>
                      <Label className="text-xs">Prov.</Label>
                      <Select value={editingIndirizzo?.provincia || nuovoIndirizzo.provincia} onValueChange={(v) => editingIndirizzo ? setEditingIndirizzo({ ...editingIndirizzo, provincia: v }) : setNuovoIndirizzo({ ...nuovoIndirizzo, provincia: v })}>
                        <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="--" /></SelectTrigger>
                        <SelectContent>{PROVINCE_ITALIANE.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-muted/50 rounded-lg">
                <h4 className="text-xs font-medium mb-2 flex items-center gap-1"><Phone className="h-3 w-3" />Contatti</h4>
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Telefono</Label>
                      <Input className="h-8 text-sm" value={editingIndirizzo?.telefono || nuovoIndirizzo.telefono} onChange={(e) => editingIndirizzo ? setEditingIndirizzo({ ...editingIndirizzo, telefono: e.target.value }) : setNuovoIndirizzo({ ...nuovoIndirizzo, telefono: e.target.value })} />
                    </div>
                    <div>
                      <Label className="text-xs">Email</Label>
                      <Input className="h-8 text-sm" value={editingIndirizzo?.email || nuovoIndirizzo.email || ""} onChange={(e) => editingIndirizzo ? setEditingIndirizzo({ ...editingIndirizzo, email: e.target.value }) : setNuovoIndirizzo({ ...nuovoIndirizzo, email: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Referente</Label>
                    <Input className="h-8 text-sm" placeholder="Persona di riferimento" value={editingIndirizzo?.referente || nuovoIndirizzo.referente} onChange={(e) => editingIndirizzo ? setEditingIndirizzo({ ...editingIndirizzo, referente: e.target.value }) : setNuovoIndirizzo({ ...nuovoIndirizzo, referente: e.target.value })} />
                  </div>
                </div>
              </div>

              <div className="p-3 bg-muted/50 rounded-lg">
                <h4 className="text-xs font-medium mb-2">Note</h4>
                <div className="space-y-2">
                  <div>
                    <Label className="text-xs">Note Consegna</Label>
                    <Input className="h-8 text-sm" placeholder="Istruzioni speciali..." value={editingIndirizzo?.noteConsegna || nuovoIndirizzo.noteConsegna} onChange={(e) => editingIndirizzo ? setEditingIndirizzo({ ...editingIndirizzo, noteConsegna: e.target.value }) : setNuovoIndirizzo({ ...nuovoIndirizzo, noteConsegna: e.target.value })} />
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="principale" checked={editingIndirizzo?.principale || nuovoIndirizzo.principale} onChange={(e) => editingIndirizzo ? setEditingIndirizzo({ ...editingIndirizzo, principale: e.target.checked }) : setNuovoIndirizzo({ ...nuovoIndirizzo, principale: e.target.checked })} />
                    <Label htmlFor="principale" className="text-xs">Indirizzo predefinito</Label>
                  </div>
                </div>
              </div>
            </div>

            {/* Colonna destra - Orari apertura */}
            <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-900">
              <h4 className="text-xs font-medium mb-3 flex items-center gap-1 text-green-700 dark:text-green-300">
                <Clock className="h-3 w-3" />
                Orari di Apertura
              </h4>
              <div className="space-y-2">
                {[
                  { key: "orariLunedi", label: "Lunedì" },
                  { key: "orariMartedi", label: "Martedì" },
                  { key: "orariMercoledi", label: "Mercoledì" },
                  { key: "orariGiovedi", label: "Giovedì" },
                  { key: "orariVenerdi", label: "Venerdì" },
                  { key: "orariSabato", label: "Sabato" },
                  { key: "orariDomenica", label: "Domenica" },
                ].map(({ key, label }) => {
                  const orario = editingIndirizzo?.[key] || nuovoIndirizzo[key] || "";
                  const isChiuso = orario === "CHIUSO";
                  return (
                    <div key={key} className="flex items-center gap-2">
                      <span className="text-xs w-16 font-medium">{label}</span>
                      <Input
                        className="h-7 text-xs flex-1"
                        placeholder="08:00-18:00"
                        value={isChiuso ? "" : orario}
                        disabled={isChiuso}
                        onChange={(e) => {
                          const value = e.target.value;
                          editingIndirizzo
                            ? setEditingIndirizzo({ ...editingIndirizzo, [key]: value })
                            : setNuovoIndirizzo({ ...nuovoIndirizzo, [key]: value });
                        }}
                      />
                      <button
                        type="button"
                        className={`text-[10px] px-2 py-1 rounded ${isChiuso ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600 hover:bg-red-50'}`}
                        onClick={() => {
                          const newValue = isChiuso ? "" : "CHIUSO";
                          editingIndirizzo
                            ? setEditingIndirizzo({ ...editingIndirizzo, [key]: newValue })
                            : setNuovoIndirizzo({ ...nuovoIndirizzo, [key]: newValue });
                        }}
                      >
                        {isChiuso ? "Chiuso" : "X"}
                      </button>
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 pt-2 border-t border-green-200 dark:border-green-800">
                <Label className="text-xs text-green-700 dark:text-green-300">Note orari</Label>
                <Input
                  className="h-7 text-xs mt-1"
                  placeholder="es: pausa pranzo 12-14, previo appuntamento..."
                  value={editingIndirizzo?.orariConsegna || nuovoIndirizzo.orariConsegna}
                  onChange={(e) => editingIndirizzo ? setEditingIndirizzo({ ...editingIndirizzo, orariConsegna: e.target.value }) : setNuovoIndirizzo({ ...nuovoIndirizzo, orariConsegna: e.target.value })}
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" size="sm" onClick={() => setShowIndirizziDialog(false)}>Annulla</Button>
            <Button size="sm" onClick={saveIndirizzo} disabled={!(editingIndirizzo?.nome || nuovoIndirizzo.nome) || !(editingIndirizzo?.indirizzo || nuovoIndirizzo.indirizzo)}>Salva Punto Consegna</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={portalDialogOpen} onOpenChange={(open) => { setPortalDialogOpen(open); if (!open) { setPortalLink(null); setPortalClienteId(null); } }}>
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
                <Button variant="outline" size="sm" onClick={() => portalClienteId && generatePortalMutation.mutate(portalClienteId)}>
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

      <Dialog open={promemoriaDialogOpen} onOpenChange={setPromemoriaDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Promemoria - {promemoriaEntita?.nome}
            </DialogTitle>
            <DialogDescription>Aggiungi note e scadenze per questo cliente</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <div className="col-span-2">
                <Label className="text-xs">Titolo</Label>
                <Input className="h-8 text-sm" value={nuovoPromemoria.titolo} onChange={(e) => setNuovoPromemoria({ ...nuovoPromemoria, titolo: e.target.value })} placeholder="es: Chiamare per conferma ordine" />
              </div>
              <div className="col-span-2">
                <Label className="text-xs">Descrizione</Label>
                <Input className="h-8 text-sm" value={nuovoPromemoria.descrizione} onChange={(e) => setNuovoPromemoria({ ...nuovoPromemoria, descrizione: e.target.value })} placeholder="Dettagli..." />
              </div>
              <div>
                <Label className="text-xs">Scadenza</Label>
                <Input className="h-8 text-sm" type="date" value={nuovoPromemoria.dataScadenza} onChange={(e) => setNuovoPromemoria({ ...nuovoPromemoria, dataScadenza: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Priorita</Label>
                <Select value={nuovoPromemoria.priorita} onValueChange={(v) => setNuovoPromemoria({ ...nuovoPromemoria, priorita: v })}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bassa">Bassa</SelectItem>
                    <SelectItem value="normale">Normale</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="urgente">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Label className="text-xs">Colore</Label>
                  <input type="color" className="h-6 w-8 rounded cursor-pointer" value={nuovoPromemoria.colore} onChange={(e) => setNuovoPromemoria({ ...nuovoPromemoria, colore: e.target.value })} />
                </div>
              </div>
            </div>
            <Button onClick={savePromemoria} disabled={!nuovoPromemoria.titolo.trim()} className="w-full h-8 text-sm">
              <Plus className="h-4 w-4 mr-2" />Aggiungi Promemoria
            </Button>

            {promemoria.length > 0 && (
              <div className="border-t pt-3 space-y-2 max-h-48 overflow-y-auto">
                {promemoria.map((p) => (
                  <div key={p.id} className={`p-2 rounded border flex items-start gap-2 ${p.stato === "completato" ? "opacity-50" : ""}`} style={{ borderLeftWidth: 3, borderLeftColor: p.colore }}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate">{p.titolo}</span>
                        {p.priorita === "urgente" && <Badge variant="destructive" className="text-[10px] px-1">Urgente</Badge>}
                        {p.priorita === "alta" && <Badge className="text-[10px] px-1 bg-orange-500">Alta</Badge>}
                      </div>
                      {p.descrizione && <p className="text-xs text-muted-foreground truncate">{p.descrizione}</p>}
                      {p.dataScadenza && <p className="text-[10px] text-muted-foreground mt-1"><Calendar className="h-3 w-3 inline mr-1" />{new Date(p.dataScadenza).toLocaleDateString("it-IT")}</p>}
                    </div>
                    <div className="flex gap-1">
                      {p.stato !== "completato" && <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => completePromemoria(p.id)}><Check className="h-3 w-3 text-green-500" /></Button>}
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => deletePromemoria(p.id)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={condizioniDialogOpen} onOpenChange={setCondizioniDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Gestione Condizioni di Pagamento</DialogTitle>
            <DialogDescription>Aggiungi o rimuovi condizioni di pagamento disponibili</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label>Codice</Label>
                <Input
                  value={nuovaCondizione.codice}
                  onChange={(e) => setNuovaCondizione({ ...nuovaCondizione, codice: e.target.value })}
                  placeholder="30GG"
                />
              </div>
              <div className="col-span-2">
                <Label>Descrizione</Label>
                <Input
                  value={nuovaCondizione.descrizione}
                  onChange={(e) => setNuovaCondizione({ ...nuovaCondizione, descrizione: e.target.value })}
                  placeholder="Pagamento a 30 giorni"
                />
              </div>
            </div>
            <Button
              onClick={() => createCondizioneMutation.mutate(nuovaCondizione)}
              disabled={!nuovaCondizione.codice || !nuovaCondizione.descrizione}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Aggiungi Condizione
            </Button>

            <div className="border-t pt-4">
              <Label className="text-sm text-muted-foreground mb-2 block">Condizioni esistenti:</Label>
              {condizioniPagamento.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nessuna condizione configurata</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {condizioniPagamento.map((c: any) => (
                    <div key={c.id} className="flex items-center justify-between p-2 border rounded-lg">
                      <div>
                        <span className="font-medium">{c.codice}</span>
                        <span className="text-muted-foreground ml-2">- {c.descrizione}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive"
                        onClick={() => deleteCondizioneMutation.mutate(c.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FornitoriTab() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStato, setFilterStato] = useState<string>("tutti");
  const [filterCategoria, setFilterCategoria] = useState<string>("tutti");
  const [condizioniDialogOpen, setCondizioniDialogOpen] = useState(false);
  const [nuovaCondizione, setNuovaCondizione] = useState({ codice: "", descrizione: "" });
  const [promemoriaDialogOpen, setPromemoriaDialogOpen] = useState(false);
  const [promemoriaEntita, setPromemoriaEntita] = useState<{ tipo: string; id: string; nome: string } | null>(null);
  const [promemoria, setPromemoria] = useState<any[]>([]);
  const [nuovoPromemoria, setNuovoPromemoria] = useState({ titolo: "", descrizione: "", dataScadenza: "", priorita: "normale", colore: "#F97316", notificaEmail: false });
  const [newItem, setNewItem] = useState({
    ragioneSociale: "", partitaIva: "", codiceFiscale: "", email: "", pec: "",
    telefono: "", cellulare: "", indirizzo: "", citta: "", cap: "", provincia: "",
    nazione: "Italia", sdi: "", website: "", referente: "", categoria: "", condizioniPagamento: "", iban: "", note: "", stato: "attivo", tags: ""
  });

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["anagrafica-fornitori"],
    queryFn: apiFornitori.getAll,
  });

  const { data: condizioniPagamento = [] } = useQuery({
    queryKey: ["condizioni-pagamento"],
    queryFn: async () => {
      const res = await fetch("/api/condizioni-pagamento");
      if (!res.ok) throw new Error("Errore caricamento condizioni");
      return res.json();
    },
  });

  const createCondizioneMutation = useMutation({
    mutationFn: async (data: { codice: string; descrizione: string }) => {
      const res = await fetch("/api/condizioni-pagamento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Errore creazione condizione");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["condizioni-pagamento"] });
      setNuovaCondizione({ codice: "", descrizione: "" });
      toast({ title: "Condizione aggiunta" });
    },
  });

  const deleteCondizioneMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/condizioni-pagamento/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Errore eliminazione");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["condizioni-pagamento"] });
      toast({ title: "Condizione eliminata" });
    },
  });

  const categorie = useMemo(() => {
    const set = new Set(items.map((i: any) => i.categoria).filter(Boolean));
    return Array.from(set) as string[];
  }, [items]);

  const duplicates = useMemo(() => {
    const pivaMap = new Map<string, string[]>();
    items.forEach((item: any) => {
      if (item.partitaIva) {
        const piva = item.partitaIva.replace(/\s/g, "");
        if (!pivaMap.has(piva)) pivaMap.set(piva, []);
        pivaMap.get(piva)!.push(item.id);
      }
    });
    const dups = new Set<string>();
    pivaMap.forEach((ids) => { if (ids.length > 1) ids.forEach(id => dups.add(id)); });
    return dups;
  }, [items]);

  const checkIbanDuplicato = (iban: string, excludeId?: string) => {
    if (!iban || iban.length < 15) return null;
    const cleanIban = iban.toUpperCase().replace(/\s/g, "");
    const found = items.find((item: any) => {
      if (excludeId && item.id === excludeId) return false;
      const itemIban = (item.iban || "").toUpperCase().replace(/\s/g, "");
      return itemIban === cleanIban && itemIban.length > 0;
    });
    return found ? found.ragioneSociale : null;
  };

  const handleIbanChangeFornitore = (iban: string, isEdit = false, editId?: string) => {
    const cleanIban = iban.toUpperCase().replace(/\s/g, "");
    if (isEdit) {
      setEditingItem((prev: any) => ({ ...prev, iban: cleanIban }));
    } else {
      setNewItem(prev => ({ ...prev, iban: cleanIban }));
    }

    if (cleanIban.length >= 20) {
      const duplicato = checkIbanDuplicato(cleanIban, isEdit ? editId : undefined);
      if (duplicato) {
        toast({
          title: "IBAN già presente",
          description: `Questo IBAN è già associato a: ${duplicato}`,
          variant: "destructive"
        });
      }
    }
  };

  const filteredItems = useMemo(() => {
    return items.filter((item: any) => {
      const matchSearch = `${item.ragioneSociale} ${item.email || ""} ${item.partitaIva || ""}`.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStato = filterStato === "tutti" || item.stato === filterStato;
      const matchCategoria = filterCategoria === "tutti" || item.categoria === filterCategoria;
      return matchSearch && matchStato && matchCategoria;
    });
  }, [items, searchTerm, filterStato, filterCategoria]);

  const createMutation = useMutation({
    mutationFn: apiFornitori.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["anagrafica-fornitori"] });
      setNewItem({ ragioneSociale: "", partitaIva: "", codiceFiscale: "", email: "", pec: "", telefono: "", cellulare: "", indirizzo: "", citta: "", cap: "", provincia: "", nazione: "Italia", sdi: "", website: "", referente: "", categoria: "", condizioniPagamento: "", iban: "", note: "", stato: "attivo", tags: "" });
      setDialogOpen(false);
      toast({ title: "Fornitore aggiunto", description: "Il record è stato salvato con successo" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiFornitori.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["anagrafica-fornitori"] });
      setEditDialogOpen(false);
      setEditingItem(null);
      toast({ title: "Modifiche salvate", description: "Il record è stato aggiornato" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: apiFornitori.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["anagrafica-fornitori"] });
      toast({ title: "Eliminato", description: "Il record è stato rimosso" });
    },
  });

  const isFormValid = () => {
    if (!newItem.ragioneSociale) return false;
    if (newItem.partitaIva && !validatePartitaIva(newItem.partitaIva).valid) return false;
    if (newItem.iban && !validateIban(newItem.iban).valid) return false;
    return true;
  };

  const openPromemoriaDialog = async (tipo: string, id: string, nome: string) => {
    setPromemoriaEntita({ tipo, id, nome });
    setNuovoPromemoria({ titolo: "", descrizione: "", dataScadenza: "", priorita: "normale", colore: "#F97316", notificaEmail: false });
    setPromemoriaDialogOpen(true);
    try {
      const res = await fetch(`/api/promemoria/${tipo}/${id}`);
      const data = await res.json();
      setPromemoria(data);
    } catch { setPromemoria([]); }
  };

  const savePromemoria = async () => {
    if (!promemoriaEntita || !nuovoPromemoria.titolo.trim()) return;
    try {
      const res = await fetch("/api/promemoria", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...nuovoPromemoria, tipo: promemoriaEntita.tipo, entitaId: promemoriaEntita.id }),
      });
      if (res.ok) {
        const newProm = await res.json();
        setPromemoria([newProm, ...promemoria]);
        setNuovoPromemoria({ titolo: "", descrizione: "", dataScadenza: "", priorita: "normale", colore: "#F97316", notificaEmail: false });
        toast({ title: "Promemoria creato" });
      }
    } catch { toast({ title: "Errore", variant: "destructive" }); }
  };

  const completePromemoria = async (id: string) => {
    try {
      await fetch(`/api/promemoria/${id}/completa`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
      setPromemoria(promemoria.map(p => p.id === id ? { ...p, stato: "completato" } : p));
      toast({ title: "Completato" });
    } catch { toast({ title: "Errore", variant: "destructive" }); }
  };

  const deletePromemoria = async (id: string) => {
    try {
      await fetch(`/api/promemoria/${id}`, { method: "DELETE" });
      setPromemoria(promemoria.filter(p => p.id !== id));
      toast({ title: "Eliminato" });
    } catch { toast({ title: "Errore", variant: "destructive" }); }
  };

  if (isLoading) return <div className="flex items-center justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <div className="p-6 space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Cerca fornitori..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
        </div>
        <Select value={filterStato} onValueChange={setFilterStato}>
          <SelectTrigger className="w-[140px]"><Filter className="h-4 w-4 mr-2" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="tutti">Tutti gli stati</SelectItem>
            {STATI.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterCategoria} onValueChange={setFilterCategoria}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Categoria" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="tutti">Tutte le categorie</SelectItem>
            {categorie.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        {(filterStato !== "tutti" || filterCategoria !== "tutti") && (
          <Button variant="ghost" size="sm" onClick={() => { setFilterStato("tutti"); setFilterCategoria("tutti"); }}>
            <X className="h-4 w-4 mr-1" />Rimuovi filtri
          </Button>
        )}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="ml-auto"><Plus className="h-4 w-4 mr-2" />Aggiungi</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Nuovo Fornitore</DialogTitle><DialogDescription>Inserisci i dati del nuovo fornitore</DialogDescription></DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2"><ValidationInput label="Ragione Sociale" value={newItem.ragioneSociale} onChange={(v) => setNewItem({ ...newItem, ragioneSociale: v })} required /></div>
              <ValidationInput label="Partita IVA" value={newItem.partitaIva} onChange={(v) => setNewItem({ ...newItem, partitaIva: v })} validate={validatePartitaIva} placeholder="12345678901" />
              <ValidationInput label="Codice Fiscale" value={newItem.codiceFiscale} onChange={(v) => setNewItem({ ...newItem, codiceFiscale: v.toUpperCase() })} validate={validateCodiceFiscale} />
              <ValidationInput label="Email" value={newItem.email} onChange={(v) => setNewItem({ ...newItem, email: v })} type="email" />
              <ValidationInput label="PEC" value={newItem.pec} onChange={(v) => setNewItem({ ...newItem, pec: v })} type="email" />
              <ValidationInput label="Telefono" value={newItem.telefono} onChange={(v) => setNewItem({ ...newItem, telefono: v })} />
              <ValidationInput label="Cellulare" value={newItem.cellulare} onChange={(v) => setNewItem({ ...newItem, cellulare: v })} />
              <div className="col-span-2"><ValidationInput label="Indirizzo" value={newItem.indirizzo} onChange={(v) => setNewItem({ ...newItem, indirizzo: v })} /></div>
              <ValidationInput label="Città" value={newItem.citta} onChange={(v) => setNewItem({ ...newItem, citta: v })} />
              <ValidationInput label="CAP" value={newItem.cap} onChange={(v) => setNewItem({ ...newItem, cap: v })} />
              <div>
                <Label>Provincia</Label>
                <Select value={newItem.provincia} onValueChange={(v) => setNewItem({ ...newItem, provincia: v })}>
                  <SelectTrigger><SelectValue placeholder="Seleziona" /></SelectTrigger>
                  <SelectContent>{PROVINCE_ITALIANE.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <ValidationInput label="Codice SDI" value={newItem.sdi} onChange={(v) => setNewItem({ ...newItem, sdi: v.toUpperCase() })} placeholder="0000000" />
              <ValidationInput label="IBAN" value={newItem.iban} onChange={(v) => handleIbanChangeFornitore(v)} validate={validateIban} placeholder="IT60X0542811101000000123456" />
              <ValidationInput label="Website" value={newItem.website} onChange={(v) => setNewItem({ ...newItem, website: v })} />
              <ValidationInput label="Referente" value={newItem.referente} onChange={(v) => setNewItem({ ...newItem, referente: v })} />
              <ValidationInput label="Categoria" value={newItem.categoria} onChange={(v) => setNewItem({ ...newItem, categoria: v })} placeholder="Materiali, Servizi, IT..." />
              <div>
                <Label>Condizioni Pagamento</Label>
                <div className="flex gap-2">
                  <Select value={newItem.condizioniPagamento} onValueChange={(v) => setNewItem({ ...newItem, condizioniPagamento: v })}>
                    <SelectTrigger className="flex-1"><SelectValue placeholder="Seleziona condizioni..." /></SelectTrigger>
                    <SelectContent>
                      {condizioniPagamento.map((c: any) => (
                        <SelectItem key={c.id} value={c.descrizione}>{c.codice} - {c.descrizione}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button type="button" variant="outline" size="icon" onClick={() => setCondizioniDialogOpen(true)} title="Gestisci condizioni">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div>
                <Label>Stato</Label>
                <Select value={newItem.stato} onValueChange={(v) => setNewItem({ ...newItem, stato: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{STATI.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <ValidationInput label="Tags (separati da virgola)" value={newItem.tags} onChange={(v) => setNewItem({ ...newItem, tags: v })} placeholder="affidabile, economico, locale" />
              <div className="col-span-2"><ValidationInput label="Note" value={newItem.note} onChange={(v) => setNewItem({ ...newItem, note: v })} /></div>
            </div>
            <Button onClick={() => createMutation.mutate(newItem)} disabled={!isFormValid()} className="w-full mt-4">
              {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salva"}
            </Button>
          </DialogContent>
        </Dialog>
      </div>

      {duplicates.size > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <span className="text-sm text-yellow-800 dark:text-yellow-200">Attenzione: rilevati {duplicates.size} possibili duplicati (stessa P.IVA)</span>
        </div>
      )}

      <div className="text-sm text-muted-foreground">{filteredItems.length} di {items.length} record</div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredItems.map((item: any) => (
          <Card key={item.id} className={`hover:shadow-md transition-shadow ${duplicates.has(item.id) ? "ring-2 ring-yellow-400" : ""}`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                    <Truck className="h-5 w-5 text-orange-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{item.ragioneSociale}</h3>
                    {item.categoria && <p className="text-sm text-muted-foreground">{item.categoria}</p>}
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => { setEditingItem({ ...item }); setEditDialogOpen(true); }}><Edit2 className="h-4 w-4 mr-2" />Modifica</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => { setNewItem({ ...item, id: undefined }); setDialogOpen(true); }}><Copy className="h-4 w-4 mr-2" />Duplica</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => openPromemoriaDialog("fornitore", item.id, item.ragioneSociale)}><Bell className="h-4 w-4 mr-2" />Promemoria</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => deleteMutation.mutate(item.id)} className="text-destructive"><Trash2 className="h-4 w-4 mr-2" />Elimina</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <StatoBadge stato={item.stato || "attivo"} />
                {item.partitaIva && <Badge variant="outline" className="text-xs">P.IVA: {item.partitaIva}</Badge>}
              </div>
              <div className="mt-3 space-y-1 text-sm">
                {item.email && <div className="flex items-center gap-2 text-muted-foreground"><Mail className="h-3 w-3" />{item.email}</div>}
                {item.telefono && <div className="flex items-center gap-2 text-muted-foreground"><Phone className="h-3 w-3" />{item.telefono}</div>}
                {item.citta && <div className="flex items-center gap-2 text-muted-foreground"><MapPin className="h-3 w-3" />{item.citta}{item.provincia && ` (${item.provincia})`}</div>}
              </div>
              <TagsDisplay tags={item.tags} />
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Truck className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <p>Nessun fornitore trovato</p>
        </div>
      )}

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Modifica Fornitore</DialogTitle><DialogDescription>Modifica i dati del fornitore</DialogDescription></DialogHeader>
          {editingItem && (
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2"><ValidationInput label="Ragione Sociale" value={editingItem.ragioneSociale || ""} onChange={(v) => setEditingItem({ ...editingItem, ragioneSociale: v })} required /></div>
              <ValidationInput label="Partita IVA" value={editingItem.partitaIva || ""} onChange={(v) => setEditingItem({ ...editingItem, partitaIva: v })} validate={validatePartitaIva} />
              <ValidationInput label="Codice Fiscale" value={editingItem.codiceFiscale || ""} onChange={(v) => setEditingItem({ ...editingItem, codiceFiscale: v.toUpperCase() })} validate={validateCodiceFiscale} />
              <ValidationInput label="Email" value={editingItem.email || ""} onChange={(v) => setEditingItem({ ...editingItem, email: v })} type="email" />
              <ValidationInput label="PEC" value={editingItem.pec || ""} onChange={(v) => setEditingItem({ ...editingItem, pec: v })} type="email" />
              <ValidationInput label="Telefono" value={editingItem.telefono || ""} onChange={(v) => setEditingItem({ ...editingItem, telefono: v })} />
              <ValidationInput label="Cellulare" value={editingItem.cellulare || ""} onChange={(v) => setEditingItem({ ...editingItem, cellulare: v })} />
              <div className="col-span-2"><ValidationInput label="Indirizzo" value={editingItem.indirizzo || ""} onChange={(v) => setEditingItem({ ...editingItem, indirizzo: v })} /></div>
              <ValidationInput label="Città" value={editingItem.citta || ""} onChange={(v) => setEditingItem({ ...editingItem, citta: v })} />
              <ValidationInput label="CAP" value={editingItem.cap || ""} onChange={(v) => setEditingItem({ ...editingItem, cap: v })} />
              <div>
                <Label>Provincia</Label>
                <Select value={editingItem.provincia || ""} onValueChange={(v) => setEditingItem({ ...editingItem, provincia: v })}>
                  <SelectTrigger><SelectValue placeholder="Seleziona" /></SelectTrigger>
                  <SelectContent>{PROVINCE_ITALIANE.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <ValidationInput label="Codice SDI" value={editingItem.sdi || ""} onChange={(v) => setEditingItem({ ...editingItem, sdi: v.toUpperCase() })} />
              <ValidationInput label="IBAN" value={editingItem.iban || ""} onChange={(v) => handleIbanChangeFornitore(v, true, editingItem?.id)} validate={validateIban} />
              <ValidationInput label="Website" value={editingItem.website || ""} onChange={(v) => setEditingItem({ ...editingItem, website: v })} />
              <ValidationInput label="Referente" value={editingItem.referente || ""} onChange={(v) => setEditingItem({ ...editingItem, referente: v })} />
              <ValidationInput label="Categoria" value={editingItem.categoria || ""} onChange={(v) => setEditingItem({ ...editingItem, categoria: v })} />
              <div>
                <Label>Condizioni Pagamento</Label>
                <div className="flex gap-2">
                  <Select value={editingItem.condizioniPagamento || ""} onValueChange={(v) => setEditingItem({ ...editingItem, condizioniPagamento: v })}>
                    <SelectTrigger className="flex-1"><SelectValue placeholder="Seleziona condizioni..." /></SelectTrigger>
                    <SelectContent>
                      {condizioniPagamento.map((c: any) => (
                        <SelectItem key={c.id} value={c.descrizione}>{c.codice} - {c.descrizione}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button type="button" variant="outline" size="icon" onClick={() => setCondizioniDialogOpen(true)} title="Gestisci condizioni">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div>
                <Label>Stato</Label>
                <Select value={editingItem.stato || "attivo"} onValueChange={(v) => setEditingItem({ ...editingItem, stato: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{STATI.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <ValidationInput label="Tags (separati da virgola)" value={editingItem.tags || ""} onChange={(v) => setEditingItem({ ...editingItem, tags: v })} />
              <div className="col-span-2"><ValidationInput label="Note" value={editingItem.note || ""} onChange={(v) => setEditingItem({ ...editingItem, note: v })} /></div>

              {/* Sezione Accesso Portale Fornitore */}
              <div className="col-span-2 border-t pt-4 mt-2">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium flex items-center gap-2"><Key className="h-4 w-4" />Accesso Portale Fornitore</h4>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="portale-abilitato-fornitore" className="text-sm">Abilitato</Label>
                    <input
                      type="checkbox"
                      id="portale-abilitato-fornitore"
                      checked={editingItem.portaleAbilitato || false}
                      onChange={(e) => setEditingItem({ ...editingItem, portaleAbilitato: e.target.checked })}
                    />
                  </div>
                </div>
                {editingItem.portaleAbilitato && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Username</Label>
                      <Input
                        value={editingItem.portaleUsername || ""}
                        onChange={(e) => setEditingItem({ ...editingItem, portaleUsername: e.target.value })}
                        placeholder="username.fornitore"
                      />
                    </div>
                    <div>
                      <Label>Password {editingItem.portalePassword ? "(già impostata)" : ""}</Label>
                      <Input
                        type="password"
                        value={editingItem.nuovaPassword || ""}
                        onChange={(e) => setEditingItem({ ...editingItem, nuovaPassword: e.target.value })}
                        placeholder={editingItem.portalePassword ? "Lascia vuoto per mantenere" : "Imposta password"}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          <Button onClick={() => {
            const dataToSave = { ...editingItem };
            if (editingItem.nuovaPassword) {
              dataToSave.portalePassword = editingItem.nuovaPassword;
            }
            delete dataToSave.nuovaPassword;
            updateMutation.mutate({ id: editingItem.id, data: dataToSave });
          }} className="w-full mt-4">
            {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salva Modifiche"}
          </Button>
        </DialogContent>
      </Dialog>

      <Dialog open={condizioniDialogOpen} onOpenChange={setCondizioniDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Gestione Condizioni di Pagamento</DialogTitle>
            <DialogDescription>Aggiungi o rimuovi condizioni di pagamento disponibili</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label>Codice</Label>
                <Input
                  value={nuovaCondizione.codice}
                  onChange={(e) => setNuovaCondizione({ ...nuovaCondizione, codice: e.target.value })}
                  placeholder="30GG"
                />
              </div>
              <div className="col-span-2">
                <Label>Descrizione</Label>
                <Input
                  value={nuovaCondizione.descrizione}
                  onChange={(e) => setNuovaCondizione({ ...nuovaCondizione, descrizione: e.target.value })}
                  placeholder="Pagamento a 30 giorni"
                />
              </div>
            </div>
            <Button
              onClick={() => createCondizioneMutation.mutate(nuovaCondizione)}
              disabled={!nuovaCondizione.codice || !nuovaCondizione.descrizione}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Aggiungi Condizione
            </Button>

            <div className="border-t pt-4">
              <Label className="text-sm text-muted-foreground mb-2 block">Condizioni esistenti:</Label>
              {condizioniPagamento.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nessuna condizione configurata</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {condizioniPagamento.map((c: any) => (
                    <div key={c.id} className="flex items-center justify-between p-2 border rounded-lg">
                      <div>
                        <span className="font-medium">{c.codice}</span>
                        <span className="text-muted-foreground ml-2">- {c.descrizione}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive"
                        onClick={() => deleteCondizioneMutation.mutate(c.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={promemoriaDialogOpen} onOpenChange={setPromemoriaDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-orange-500" />
              Promemoria - {promemoriaEntita?.nome}
            </DialogTitle>
            <DialogDescription>Aggiungi note e scadenze per questo fornitore</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <div className="col-span-2">
                <Label className="text-xs">Titolo</Label>
                <Input className="h-8 text-sm" value={nuovoPromemoria.titolo} onChange={(e) => setNuovoPromemoria({ ...nuovoPromemoria, titolo: e.target.value })} placeholder="es: Verificare consegna materiale" />
              </div>
              <div className="col-span-2">
                <Label className="text-xs">Descrizione</Label>
                <Input className="h-8 text-sm" value={nuovoPromemoria.descrizione} onChange={(e) => setNuovoPromemoria({ ...nuovoPromemoria, descrizione: e.target.value })} placeholder="Dettagli..." />
              </div>
              <div>
                <Label className="text-xs">Scadenza</Label>
                <Input className="h-8 text-sm" type="date" value={nuovoPromemoria.dataScadenza} onChange={(e) => setNuovoPromemoria({ ...nuovoPromemoria, dataScadenza: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Priorita</Label>
                <Select value={nuovoPromemoria.priorita} onValueChange={(v) => setNuovoPromemoria({ ...nuovoPromemoria, priorita: v })}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bassa">Bassa</SelectItem>
                    <SelectItem value="normale">Normale</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="urgente">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Label className="text-xs">Colore</Label>
                  <input type="color" className="h-6 w-8 rounded cursor-pointer" value={nuovoPromemoria.colore} onChange={(e) => setNuovoPromemoria({ ...nuovoPromemoria, colore: e.target.value })} />
                </div>
              </div>
            </div>
            <Button onClick={savePromemoria} disabled={!nuovoPromemoria.titolo.trim()} className="w-full h-8 text-sm">
              <Plus className="h-4 w-4 mr-2" />Aggiungi Promemoria
            </Button>

            {promemoria.length > 0 && (
              <div className="border-t pt-3 space-y-2 max-h-48 overflow-y-auto">
                {promemoria.map((p) => (
                  <div key={p.id} className={`p-2 rounded border flex items-start gap-2 ${p.stato === "completato" ? "opacity-50" : ""}`} style={{ borderLeftWidth: 3, borderLeftColor: p.colore }}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate">{p.titolo}</span>
                        {p.priorita === "urgente" && <Badge variant="destructive" className="text-[10px] px-1">Urgente</Badge>}
                        {p.priorita === "alta" && <Badge className="text-[10px] px-1 bg-orange-500">Alta</Badge>}
                      </div>
                      {p.descrizione && <p className="text-xs text-muted-foreground truncate">{p.descrizione}</p>}
                      {p.dataScadenza && <p className="text-[10px] text-muted-foreground mt-1"><Calendar className="h-3 w-3 inline mr-1" />{new Date(p.dataScadenza).toLocaleDateString("it-IT")}</p>}
                    </div>
                    <div className="flex gap-1">
                      {p.stato !== "completato" && <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => completePromemoria(p.id)}><Check className="h-3 w-3 text-green-500" /></Button>}
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => deletePromemoria(p.id)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

type SharedClient = {
  id: string;
  token: string;
  clienteId: string;
  ragioneSociale: string;
  email?: string;
  citta?: string;
  scadenza: string;
  ultimoAccesso?: string;
  accessiTotali: number;
  createdAt: string;
  fattureCount: number;
  fattureTotale: string;
  ultimoIp?: string;
  connessioneAttiva?: boolean;
  ultimaAttivita?: string;
};

type PortalEntity = {
  id: string;
  tipo: "cliente" | "fornitore";
  ragioneSociale: string;
  email?: string;
  citta?: string;
  telefono?: string;
  partitaIva?: string;
  portaleUsername?: string;
  portaleAbilitato: boolean;
  createdAt: string;
};

function CondivisioniTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"clienti" | "fornitori">("clienti");

  const { data: sharedClients = [], isLoading: loadingClients } = useQuery<SharedClient[]>({
    queryKey: ["/api/customer-portal/shared"],
  });

  const { data: clientiCredentials = [], isLoading: loadingCredentials } = useQuery<PortalEntity[]>({
    queryKey: ["/api/customer-portal/credentials"],
  });

  const { data: fornitoriPortale = [], isLoading: loadingFornitori } = useQuery<PortalEntity[]>({
    queryKey: ["/api/supplier-portal/shared"],
  });

  const revokeMutation = useMutation({
    mutationFn: async (tokenId: string) => {
      const res = await fetch(`/api/customer-portal/tokens/${tokenId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Errore nella revoca");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customer-portal/shared"] });
      toast({ title: "Accesso revocato", description: "Il link del portale e stato disattivato" });
    },
    onError: () => {
      toast({ title: "Errore", description: "Impossibile revocare l'accesso", variant: "destructive" });
    },
  });

  const copyLink = (client: SharedClient) => {
    const link = `${window.location.origin}/portal/${client.token}`;
    navigator.clipboard.writeText(link);
    setCopiedId(client.id);
    toast({ title: "Link copiato", description: "Il link e stato copiato negli appunti" });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const copyCredentials = (entity: PortalEntity) => {
    const text = `Username: ${entity.portaleUsername || "Non impostato"}\nPortale: ${window.location.origin}/cliente-login`;
    navigator.clipboard.writeText(text);
    setCopiedId(entity.id);
    toast({ title: "Credenziali copiate", description: "Username e link portale copiati" });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return "Mai";
    return new Date(dateStr).toLocaleDateString("it-IT", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getTimeRemaining = (scadenza: string) => {
    const now = new Date();
    const expiry = new Date(scadenza);
    const diff = expiry.getTime() - now.getTime();
    if (diff <= 0) return { text: "Scaduto", color: "text-red-500" };
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (days > 7) return { text: `${days} giorni`, color: "text-green-600" };
    if (days > 0) return { text: `${days}g ${hours}h`, color: "text-yellow-600" };
    return { text: `${hours} ore`, color: "text-orange-600" };
  };

  const isLoading = loadingClients || loadingCredentials || loadingFornitori;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const totalClienti = clientiCredentials.length;
  const totalFornitori = fornitoriPortale.length;

  if (totalClienti === 0 && totalFornitori === 0 && sharedClients.length === 0) {
    return (
      <Card className="p-12 text-center">
        <Share2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Nessun accesso portale configurato</h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          Non ci sono clienti o fornitori con portale attivo. Puoi abilitare l'accesso dal menu di modifica di ogni anagrafica.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button
          variant={activeTab === "clienti" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveTab("clienti")}
        >
          <Building2 className="h-4 w-4 mr-2" />
          Clienti ({totalClienti + sharedClients.length})
        </Button>
        <Button
          variant={activeTab === "fornitori" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveTab("fornitori")}
        >
          <Truck className="h-4 w-4 mr-2" />
          Fornitori ({totalFornitori})
        </Button>
      </div>

      {activeTab === "clienti" && (
        <div className="space-y-4">
          {clientiCredentials.length > 0 && (
            <Card>
              <div className="p-4 border-b bg-blue-50 dark:bg-blue-950/30">
                <div className="flex items-center gap-2">
                  <Key className="h-4 w-4 text-blue-600" />
                  <h3 className="font-semibold text-blue-700 dark:text-blue-300">Accesso con Credenziali</h3>
                  <Badge variant="secondary" className="ml-auto">{clientiCredentials.length}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Clienti con username e password per accesso al portale</p>
              </div>
              <div className="divide-y">
                {clientiCredentials.map((entity) => (
                  <div key={entity.id} className="p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Building2 className="h-4 w-4 text-blue-500 flex-shrink-0" />
                          <span className="font-medium truncate">{entity.ragioneSociale}</span>
                          <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">Attivo</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                            <User className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">Username:</span>
                            <code className="text-xs font-mono bg-background px-1 rounded">{entity.portaleUsername || "Non impostato"}</code>
                          </div>
                          <div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                            <Lock className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">Password:</span>
                            <code className="text-xs font-mono bg-background px-1 rounded">••••••••</code>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs mt-2 text-muted-foreground">
                          {entity.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {entity.email}</span>}
                          {entity.telefono && <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {entity.telefono}</span>}
                          {entity.citta && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {entity.citta}</span>}
                        </div>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => copyCredentials(entity)} title="Copia credenziali">
                          {copiedId === entity.id ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {sharedClients.length > 0 && (
            <Card>
              <div className="p-4 border-b bg-green-50 dark:bg-green-950/30">
                <div className="flex items-center gap-2">
                  <LinkIcon className="h-4 w-4 text-green-600" />
                  <h3 className="font-semibold text-green-700 dark:text-green-300">Link Temporanei</h3>
                  <Badge variant="secondary" className="ml-auto">{sharedClients.length}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Clienti con link di accesso temporaneo al portale</p>
              </div>
              <div className="divide-y">
                {sharedClients.map((client) => {
                  const timeRemaining = getTimeRemaining(client.scadenza);
                  return (
                    <div key={client.id} className="p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="relative flex-shrink-0">
                              <div className={`h-3 w-3 rounded-full ${client.connessioneAttiva ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                            </div>
                            <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <span className="font-medium truncate">{client.ragioneSociale}</span>
                            {client.connessioneAttiva && (
                              <Badge variant="default" className="bg-green-500 text-white text-xs">Online</Badge>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                            {client.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {client.email}</span>}
                            {client.citta && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {client.citta}</span>}
                          </div>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs mt-2">
                            <span className="flex items-center gap-1">
                              <Receipt className="h-3 w-3 text-green-600" />
                              <span className="text-green-600 font-medium">{client.fattureCount} fatture</span>
                            </span>
                            <span className="flex items-center gap-1">
                              <Euro className="h-3 w-3 text-blue-600" />
                              <span className="text-blue-600 font-medium">
                                {new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(parseFloat(client.fattureTotale) || 0)}
                              </span>
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className={`h-3 w-3 ${timeRemaining.color}`} />
                              <span className={timeRemaining.color}>Scade tra: {timeRemaining.text}</span>
                            </span>
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <Eye className="h-3 w-3" /> {client.accessiTotali} accessi
                            </span>
                          </div>
                          {client.ultimoIp && (
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs mt-2 p-2 bg-muted/50 rounded">
                              <span className="flex items-center gap-1 text-muted-foreground">
                                <Globe className="h-3 w-3" /> IP: <code className="font-mono bg-background px-1 rounded">{client.ultimoIp}</code>
                              </span>
                              {client.ultimaAttivita && (
                                <span className="flex items-center gap-1 text-muted-foreground">
                                  <Clock className="h-3 w-3" /> Ultima attività: {new Date(client.ultimaAttivita).toLocaleString('it-IT')}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => copyLink(client)}>
                            {copiedId === client.id ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                          </Button>
                          <Button variant="outline" size="icon" className="h-8 w-8" asChild>
                            <a href={`/portal/${client.token}`} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => revokeMutation.mutate(client.id)} className="text-red-600">
                                <Trash2 className="h-4 w-4 mr-2" /> Revoca Accesso
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </div>
      )}

      {activeTab === "fornitori" && (
        <Card>
          <div className="p-4 border-b bg-orange-50 dark:bg-orange-950/30">
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-orange-600" />
              <h3 className="font-semibold text-orange-700 dark:text-orange-300">Fornitori con Accesso Portale</h3>
              <Badge variant="secondary" className="ml-auto">{totalFornitori}</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Fornitori con username e password per accesso al portale</p>
          </div>
          {fornitoriPortale.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Truck className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Nessun fornitore con portale attivo</p>
            </div>
          ) : (
            <div className="divide-y">
              {fornitoriPortale.map((entity) => (
                <div key={entity.id} className="p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Truck className="h-4 w-4 text-orange-500 flex-shrink-0" />
                        <span className="font-medium truncate">{entity.ragioneSociale}</span>
                        <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">Attivo</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                          <User className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">Username:</span>
                          <code className="text-xs font-mono bg-background px-1 rounded">{entity.portaleUsername || "Non impostato"}</code>
                        </div>
                        <div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                          <Lock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">Password:</span>
                          <code className="text-xs font-mono bg-background px-1 rounded">••••••••</code>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs mt-2 text-muted-foreground">
                        {entity.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {entity.email}</span>}
                        {entity.telefono && <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {entity.telefono}</span>}
                        {entity.citta && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {entity.citta}</span>}
                        {entity.partitaIva && <span className="flex items-center gap-1"><Building2 className="h-3 w-3" /> P.IVA: {entity.partitaIva}</span>}
                      </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => copyCredentials(entity)} title="Copia credenziali">
                        {copiedId === entity.id ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

export default function Anagrafica() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  return (
    <AppLayout>
      <div className={`h-full flex flex-col overflow-hidden bg-gradient-to-br from-[#f5f0e6] via-[#e8dcc8] to-[#ddd0b8] dark:from-[#2d3748] dark:via-[#374151] dark:to-[#3d4555] ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
        <div className="h-32 w-full flex-shrink-0 bg-gradient-to-r from-[#4a5568] via-[#5a6a7d] to-[#6b7a8f]" />

        <div className="flex-1 overflow-auto -mt-16 px-6">
          <Tabs defaultValue={new URLSearchParams(window.location.search).get("tab") || "azienda"} className="h-full flex flex-col">
            <div className="bg-stone-50 dark:bg-stone-900/50 rounded-xl shadow-lg border mb-6">
              <div className="p-4 pb-2">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
                    <BookUser className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h1 className="text-xl font-bold tracking-tight">Anagrafica</h1>
                    <p className="text-xs text-muted-foreground">
                      Gestione azienda, clienti e fornitori
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
                    <CopyLinkButton path="/anagrafica" />
                  </div>
                </div>

                <TabsList className="grid w-full max-w-2xl grid-cols-5 gap-1 h-auto bg-transparent p-0">
                  <TabsTrigger value="azienda" className="flex flex-col items-center justify-center gap-0.5 px-1 py-2 text-[9px] data-[state=active]:bg-primary/20 rounded-lg">
                    <Briefcase className="h-4 w-4" />
                    <span>Azienda</span>
                  </TabsTrigger>
                  <TabsTrigger value="contatti" className="flex flex-col items-center justify-center gap-0.5 px-1 py-2 text-[9px] data-[state=active]:bg-primary/20 rounded-lg">
                    <Phone className="h-4 w-4" />
                    <span>Contatti</span>
                  </TabsTrigger>
                  <TabsTrigger value="clienti" className="flex flex-col items-center justify-center gap-0.5 px-1 py-2 text-[9px] data-[state=active]:bg-primary/20 rounded-lg">
                    <Building2 className="h-4 w-4" />
                    <span>Clienti</span>
                  </TabsTrigger>
                  <TabsTrigger value="fornitori" className="flex flex-col items-center justify-center gap-0.5 px-1 py-2 text-[9px] data-[state=active]:bg-primary/20 rounded-lg">
                    <Truck className="h-4 w-4" />
                    <span>Fornitori</span>
                  </TabsTrigger>
                  <TabsTrigger value="condivisioni" className="flex flex-col items-center justify-center gap-0.5 px-1 py-2 text-[9px] data-[state=active]:bg-primary/20 rounded-lg">
                    <Share2 className="h-4 w-4" />
                    <span>Portale</span>
                  </TabsTrigger>
                </TabsList>
              </div>
            </div>

            <div className="flex-1 overflow-auto">
              <TabsContent value="azienda" className="m-0 h-full">
                <AziendaTab />
              </TabsContent>
              <TabsContent value="contatti" className="m-0 h-full">
                <ContactsTab />
              </TabsContent>
              <TabsContent value="clienti" className="m-0 h-full">
                <ClientiTab />
              </TabsContent>
              <TabsContent value="fornitori" className="m-0 h-full">
                <FornitoriTab />
              </TabsContent>
              <TabsContent value="condivisioni" className="m-0 h-full">
                <CondivisioniTab />
              </TabsContent>

            </div>
          </Tabs>
        </div>
      </div>
    </AppLayout>
  );
}
