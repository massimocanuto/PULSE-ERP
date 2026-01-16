import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  FileText, 
  Upload, 
  Download, 
  Trash2, 
  Search, 
  Calendar,
  Euro,
  User,
  Filter,
  Plus,
  Loader2
} from "lucide-react";

interface Cedolino {
  id: string;
  personaleId: string;
  mese: number;
  anno: number;
  filename: string;
  filepath: string;
  filesize: number;
  mimetype: string;
  stipendioLordo: string | null;
  stipendioNetto: string | null;
  contributiInps: string | null;
  irpef: string | null;
  bonus: string | null;
  straordinari: string | null;
  note: string | null;
  createdAt: string;
}

interface Collaboratore {
  id: string;
  nome: string;
  cognome: string;
  codiceFiscale: string;
  matricola: string | null;
}

const MESI = [
  "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
  "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"
];

const formatCurrency = (value: string | null) => {
  if (!value) return "-";
  const num = parseFloat(value);
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(num);
};

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function Cedolini() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [filterCollaboratore, setFilterCollaboratore] = useState<string>("all");
  const [filterAnno, setFilterAnno] = useState<string>("all");
  const [filterMese, setFilterMese] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  const [uploadData, setUploadData] = useState({
    personaleId: "",
    mese: new Date().getMonth() + 1,
    anno: new Date().getFullYear(),
    stipendioLordo: "",
    stipendioNetto: "",
    contributiInps: "",
    irpef: "",
    bonus: "",
    straordinari: "",
    note: "",
    file: null as File | null
  });

  const { data: cedolini = [], isLoading: loadingCedolini } = useQuery<Cedolino[]>({
    queryKey: ["cedolini"],
    queryFn: async () => {
      const res = await fetch("/api/cedolini");
      if (!res.ok) throw new Error("Errore nel recupero cedolini");
      return res.json();
    }
  });

  const { data: collaboratori = [] } = useQuery<Collaboratore[]>({
    queryKey: ["personale"],
    queryFn: async () => {
      const res = await fetch("/api/personale");
      if (!res.ok) throw new Error("Errore nel recupero collaboratori");
      return res.json();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/cedolini/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Errore nell'eliminazione");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cedolini"] });
      toast({ title: "Cedolino eliminato" });
    },
    onError: () => {
      toast({ title: "Errore", description: "Impossibile eliminare il cedolino", variant: "destructive" });
    }
  });

  const handleUpload = async () => {
    if (!uploadData.file || !uploadData.personaleId) {
      toast({ title: "Errore", description: "Seleziona un collaboratore e un file", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", uploadData.file);
      formData.append("personaleId", uploadData.personaleId);
      formData.append("mese", uploadData.mese.toString());
      formData.append("anno", uploadData.anno.toString());
      if (uploadData.stipendioLordo) formData.append("stipendioLordo", uploadData.stipendioLordo);
      if (uploadData.stipendioNetto) formData.append("stipendioNetto", uploadData.stipendioNetto);
      if (uploadData.contributiInps) formData.append("contributiInps", uploadData.contributiInps);
      if (uploadData.irpef) formData.append("irpef", uploadData.irpef);
      if (uploadData.bonus) formData.append("bonus", uploadData.bonus);
      if (uploadData.straordinari) formData.append("straordinari", uploadData.straordinari);
      if (uploadData.note) formData.append("note", uploadData.note);

      const res = await fetch("/api/cedolini", {
        method: "POST",
        body: formData
      });

      if (!res.ok) throw new Error("Errore nel caricamento");

      queryClient.invalidateQueries({ queryKey: ["cedolini"] });
      toast({ title: "Cedolino caricato con successo" });
      setShowUploadDialog(false);
      setUploadData({
        personaleId: "",
        mese: new Date().getMonth() + 1,
        anno: new Date().getFullYear(),
        stipendioLordo: "",
        stipendioNetto: "",
        contributiInps: "",
        irpef: "",
        bonus: "",
        straordinari: "",
        note: "",
        file: null
      });
    } catch (error) {
      toast({ title: "Errore", description: "Impossibile caricare il cedolino", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = (id: string) => {
    window.open(`/api/cedolini/download/${id}`, "_blank");
  };

  const getCollaboratoreNome = (personaleId: string) => {
    const collab = collaboratori.find(c => c.id === personaleId);
    return collab ? `${collab.cognome} ${collab.nome}` : "N/D";
  };

  const anni = [...new Set(cedolini.map(c => c.anno))].sort((a, b) => b - a);
  if (!anni.includes(new Date().getFullYear())) {
    anni.unshift(new Date().getFullYear());
  }

  const filteredCedolini = cedolini.filter(c => {
    if (filterCollaboratore !== "all" && c.personaleId !== filterCollaboratore) return false;
    if (filterAnno !== "all" && c.anno !== parseInt(filterAnno)) return false;
    if (filterMese !== "all" && c.mese !== parseInt(filterMese)) return false;
    if (searchQuery) {
      const nome = getCollaboratoreNome(c.personaleId).toLowerCase();
      if (!nome.includes(searchQuery.toLowerCase()) && !c.filename.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
    }
    return true;
  });

  const totaleNetto = filteredCedolini.reduce((sum, c) => sum + parseFloat(c.stipendioNetto || "0"), 0);
  const totaleLordo = filteredCedolini.reduce((sum, c) => sum + parseFloat(c.stipendioLordo || "0"), 0);

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Cedolini</h1>
            <p className="text-muted-foreground">Gestione buste paga collaboratori</p>
          </div>
          <Button onClick={() => setShowUploadDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Carica Cedolino
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xl font-bold">{filteredCedolini.length}</p>
                  <p className="text-xs text-muted-foreground">Cedolini</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Euro className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xl font-bold">{formatCurrency(totaleNetto.toString())}</p>
                  <p className="text-xs text-muted-foreground">Totale Netto</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-100 rounded-lg">
                  <Euro className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-xl font-bold">{formatCurrency(totaleLordo.toString())}</p>
                  <p className="text-xs text-muted-foreground">Totale Lordo</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <User className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xl font-bold">{collaboratori.length}</p>
                  <p className="text-xs text-muted-foreground">Collaboratori</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtri
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cerca collaboratore o file..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterCollaboratore} onValueChange={setFilterCollaboratore}>
                <SelectTrigger>
                  <SelectValue placeholder="Collaboratore" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutti i collaboratori</SelectItem>
                  {collaboratori.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.cognome} {c.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterAnno} onValueChange={setFilterAnno}>
                <SelectTrigger>
                  <SelectValue placeholder="Anno" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutti gli anni</SelectItem>
                  {anni.map(a => (
                    <SelectItem key={a} value={a.toString()}>{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterMese} onValueChange={setFilterMese}>
                <SelectTrigger>
                  <SelectValue placeholder="Mese" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutti i mesi</SelectItem>
                  {MESI.map((m, i) => (
                    <SelectItem key={i} value={(i + 1).toString()}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            {loadingCedolini ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredCedolini.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nessun cedolino trovato</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Collaboratore</TableHead>
                    <TableHead>Periodo</TableHead>
                    <TableHead>File</TableHead>
                    <TableHead className="text-right">Lordo</TableHead>
                    <TableHead className="text-right">Netto</TableHead>
                    <TableHead className="text-right">INPS</TableHead>
                    <TableHead className="text-right">IRPEF</TableHead>
                    <TableHead className="text-center">Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCedolini.map((cedolino) => (
                    <TableRow key={cedolino.id}>
                      <TableCell className="font-medium">
                        {getCollaboratoreNome(cedolino.personaleId)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          <Calendar className="h-3 w-3 mr-1" />
                          {MESI[cedolino.mese - 1]} {cedolino.anno}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm truncate max-w-[150px]">{cedolino.filename}</p>
                            <p className="text-xs text-muted-foreground">{formatFileSize(cedolino.filesize || 0)}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(cedolino.stipendioLordo)}
                      </TableCell>
                      <TableCell className="text-right font-medium text-green-600">
                        {formatCurrency(cedolino.stipendioNetto)}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {formatCurrency(cedolino.contributiInps)}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {formatCurrency(cedolino.irpef)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDownload(cedolino.id)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (confirm("Eliminare questo cedolino?")) {
                                deleteMutation.mutate(cedolino.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Carica Nuovo Cedolino
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Collaboratore *</Label>
              <Select value={uploadData.personaleId} onValueChange={(v) => setUploadData({ ...uploadData, personaleId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona collaboratore" />
                </SelectTrigger>
                <SelectContent>
                  {collaboratori.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.cognome} {c.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Mese *</Label>
              <Select value={uploadData.mese.toString()} onValueChange={(v) => setUploadData({ ...uploadData, mese: parseInt(v) })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MESI.map((m, i) => (
                    <SelectItem key={i} value={(i + 1).toString()}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Anno *</Label>
              <Select value={uploadData.anno.toString()} onValueChange={(v) => setUploadData({ ...uploadData, anno: parseInt(v) })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[...Array(5)].map((_, i) => {
                    const year = new Date().getFullYear() - i;
                    return <SelectItem key={year} value={year.toString()}>{year}</SelectItem>;
                  })}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Stipendio Lordo</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={uploadData.stipendioLordo}
                onChange={(e) => setUploadData({ ...uploadData, stipendioLordo: e.target.value })}
              />
            </div>
            <div>
              <Label>Stipendio Netto</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={uploadData.stipendioNetto}
                onChange={(e) => setUploadData({ ...uploadData, stipendioNetto: e.target.value })}
              />
            </div>
            <div>
              <Label>Contributi INPS</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={uploadData.contributiInps}
                onChange={(e) => setUploadData({ ...uploadData, contributiInps: e.target.value })}
              />
            </div>
            <div>
              <Label>IRPEF</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={uploadData.irpef}
                onChange={(e) => setUploadData({ ...uploadData, irpef: e.target.value })}
              />
            </div>
            <div>
              <Label>Bonus</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={uploadData.bonus}
                onChange={(e) => setUploadData({ ...uploadData, bonus: e.target.value })}
              />
            </div>
            <div>
              <Label>Straordinari</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={uploadData.straordinari}
                onChange={(e) => setUploadData({ ...uploadData, straordinari: e.target.value })}
              />
            </div>
            <div className="col-span-2">
              <Label>Note</Label>
              <Input
                placeholder="Note opzionali..."
                value={uploadData.note}
                onChange={(e) => setUploadData({ ...uploadData, note: e.target.value })}
              />
            </div>
            <div className="col-span-2">
              <Label>File Cedolino (PDF) *</Label>
              <div className="mt-2">
                <Input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setUploadData({ ...uploadData, file });
                  }}
                />
                {uploadData.file && (
                  <p className="text-sm text-muted-foreground mt-1">
                    File selezionato: {uploadData.file.name} ({formatFileSize(uploadData.file.size)})
                  </p>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
              Annulla
            </Button>
            <Button onClick={handleUpload} disabled={uploading}>
              {uploading ? (
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
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
