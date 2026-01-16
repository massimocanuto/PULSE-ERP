import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, Receipt, AlertCircle, Building2, CheckCircle, Clock, XCircle, Loader2, Package, Lock, User, Eye, EyeOff, Download, ChevronDown, ChevronUp } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";

interface FatturaRiga {
  id: number;
  descrizione: string;
  quantita: number;
  prezzoUnitario: string;
  iva: number;
  totale: string;
  codiceArticolo?: string;
}

interface PortalData {
  cliente: {
    id: string;
    ragioneSociale: string;
    email: string;
  };
  documenti: {
    fatture: Array<{
      id: string;
      numero: string;
      data: string;
      dataScadenza?: string;
      importo: string;
      totalePagato?: string;
      stato: string;
      oggetto?: string;
      righe?: FatturaRiga[];
    }>;
    preventivi: Array<{
      id: string;
      numero: string;
      data: string;
      dataValidita?: string;
      importo: string;
      stato: string;
      oggetto?: string;
      righe?: FatturaRiga[];
    }>;
  };
}

const formatCurrency = (amount: string | number) => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(num || 0);
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('it-IT');
};

const getStatoBadge = (stato: string) => {
  const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", icon: React.ReactNode }> = {
    pagata: { variant: "default", icon: <CheckCircle className="h-3 w-3" /> },
    inviata: { variant: "secondary", icon: <Clock className="h-3 w-3" /> },
    bozza: { variant: "outline", icon: <FileText className="h-3 w-3" /> },
    scaduta: { variant: "destructive", icon: <XCircle className="h-3 w-3" /> },
    accettato: { variant: "default", icon: <CheckCircle className="h-3 w-3" /> },
    rifiutato: { variant: "destructive", icon: <XCircle className="h-3 w-3" /> },
  };
  const config = variants[stato] || { variant: "outline" as const, icon: null };
  return (
    <Badge variant={config.variant} className="flex items-center gap-1">
      {config.icon}
      {stato.charAt(0).toUpperCase() + stato.slice(1)}
    </Badge>
  );
};

export default function CustomerPortal() {
  const params = useParams<{ token: string }>();
  const { toast } = useToast();
  const [data, setData] = useState<PortalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authenticating, setAuthenticating] = useState(false);
  const [clienteName, setClienteName] = useState<string>("");
  const [viewDialog, setViewDialog] = useState<{ open: boolean; tipo: 'fattura' | 'preventivo'; doc: any } | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [expandedFattura, setExpandedFattura] = useState<string | null>(null);
  const [expandedPreventivo, setExpandedPreventivo] = useState<string | null>(null);

  const handleViewDocument = (tipo: 'fattura' | 'preventivo', doc: any) => {
    setViewDialog({ open: true, tipo, doc });
  };

  const handleDownloadPDF = async (tipo: 'fattura' | 'preventivo', doc: any) => {
    setDownloading(doc.id);
    try {
      const pdf = new jsPDF();
      const clienteNome = data?.cliente.ragioneSociale || '';
      const tipoLabel = tipo === 'fattura' ? 'FATTURA' : 'PREVENTIVO';
      
      pdf.setFontSize(20);
      pdf.setFont("helvetica", "bold");
      pdf.text(tipoLabel, 105, 30, { align: "center" });
      
      pdf.setFontSize(14);
      pdf.text(`N. ${doc.numero}`, 105, 40, { align: "center" });
      
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      
      let y = 60;
      pdf.text("Cliente:", 20, y);
      pdf.setFont("helvetica", "bold");
      pdf.text(clienteNome, 50, y);
      
      y += 10;
      pdf.setFont("helvetica", "normal");
      pdf.text("Data:", 20, y);
      pdf.text(formatDate(doc.data), 50, y);
      
      if (tipo === 'fattura' && doc.dataScadenza) {
        y += 8;
        pdf.text("Scadenza:", 20, y);
        pdf.text(formatDate(doc.dataScadenza), 50, y);
      }
      
      if (tipo === 'preventivo' && doc.dataValidita) {
        y += 8;
        pdf.text("Validita:", 20, y);
        pdf.text(formatDate(doc.dataValidita), 50, y);
      }
      
      y += 8;
      pdf.text("Stato:", 20, y);
      pdf.text(doc.stato.charAt(0).toUpperCase() + doc.stato.slice(1), 50, y);
      
      if (doc.oggetto) {
        y += 12;
        pdf.text("Oggetto:", 20, y);
        y += 6;
        const lines = pdf.splitTextToSize(doc.oggetto, 170);
        pdf.text(lines, 20, y);
        y += lines.length * 5;
      }
      
      y += 15;
      pdf.setDrawColor(200);
      pdf.line(20, y, 190, y);
      
      y += 15;
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.text("Importo Totale:", 20, y);
      pdf.text(formatCurrency(doc.importo), 190, y, { align: "right" });
      
      if (tipo === 'fattura' && doc.totalePagato && parseFloat(doc.totalePagato) > 0) {
        y += 10;
        pdf.setFontSize(10);
        pdf.setFont("helvetica", "normal");
        pdf.text("Gia pagato:", 20, y);
        pdf.text(formatCurrency(doc.totalePagato), 190, y, { align: "right" });
      }
      
      y += 30;
      pdf.setFontSize(8);
      pdf.setTextColor(128);
      pdf.text("Documento generato dal Portale Clienti", 105, y, { align: "center" });
      pdf.text(new Date().toLocaleString('it-IT'), 105, y + 5, { align: "center" });
      
      pdf.save(`${tipoLabel}_${doc.numero}.pdf`);
      toast({ title: "Download completato", description: `${tipo === 'fattura' ? 'Fattura' : 'Preventivo'} ${doc.numero} scaricato` });
    } catch (err) {
      console.error("Errore generazione PDF:", err);
      toast({ title: "Errore", description: "Impossibile generare il documento", variant: "destructive" });
    } finally {
      setDownloading(null);
    }
  };

  const token = params.token || window.location.pathname.split('/portal/')[1];

  useEffect(() => {
    const checkPortalAccess = async () => {
      try {
        const res = await fetch(`/api/portal/${token}/check`);
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Errore nel caricamento');
        }
        const checkData = await res.json();
        
        if (checkData.requiresAuth) {
          setNeedsAuth(true);
          setClienteName(checkData.clienteName || "");
          setLoading(false);
        } else {
          // Accesso diretto senza credenziali
          const dataRes = await fetch(`/api/portal/${token}`);
          if (!dataRes.ok) {
            const err = await dataRes.json();
            throw new Error(err.error || 'Errore nel caricamento');
          }
          const portalData = await dataRes.json();
          setData(portalData);
          setLoading(false);
        }
      } catch (err: any) {
        setError(err.message);
        setLoading(false);
      }
    };

    if (token) {
      checkPortalAccess();
    } else {
      setError('Token non valido');
      setLoading(false);
    }
  }, [token]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthenticating(true);

    try {
      const res = await fetch(`/api/portal/${token}/auth`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Credenziali non valide');
      }
      
      const portalData = await res.json();
      setData(portalData);
      setNeedsAuth(false);
    } catch (err: any) {
      setAuthError(err.message);
    } finally {
      setAuthenticating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f5f0e6] via-[#e8dcc8] to-[#ddd0b8] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-amber-700" />
          <p className="text-muted-foreground">Caricamento portale...</p>
        </div>
      </div>
    );
  }

  if (needsAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f5f0e6] via-[#e8dcc8] to-[#ddd0b8]">
        <div className="flex items-center justify-center p-4 min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mb-4">
              <Lock className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-xl">Accesso Portale Documenti</CardTitle>
            {clienteName && (
              <p className="text-muted-foreground text-sm mt-1">{clienteName}</p>
            )}
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {authError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  {authError}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="username">Nome Utente</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Inserisci il tuo username"
                    className="pl-10"
                    required
                    autoComplete="username"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Inserisci la tua password"
                    className="pl-10 pr-10"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={authenticating}>
                {authenticating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Accesso in corso...
                  </>
                ) : (
                  "Accedi"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f5f0e6] via-[#e8dcc8] to-[#ddd0b8]">
        <div className="flex items-center justify-center min-h-screen">
          <Card className="max-w-md w-full mx-4">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center gap-4">
                <AlertCircle className="h-12 w-12 text-red-500" />
                <div>
                  <h2 className="text-xl font-semibold">Accesso non disponibile</h2>
                  <p className="text-muted-foreground mt-2">{error}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { cliente, documenti } = data;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f5f0e6] via-[#e8dcc8] to-[#ddd0b8]">
      <header className="bg-gradient-to-r from-[#f5f0e6] to-[#e8dcc8] border-b shadow-sm">
        <div className="max-w-[1480px] mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">Portale Documenti</h1>
              <p className="text-muted-foreground">{cliente.ragioneSociale}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1480px] mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Receipt className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{documenti.fatture.length}</p>
                  <p className="text-sm text-muted-foreground">Fatture</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{documenti.preventivi.length}</p>
                  <p className="text-sm text-muted-foreground">Preventivi</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Receipt className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {formatCurrency(
                      documenti.fatture
                        .filter(f => f.stato === 'pagata')
                        .reduce((sum, f) => sum + parseFloat(f.importo || '0'), 0)
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground">Totale Pagato</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="fatture" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="fatture" className="flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              Fatture ({documenti.fatture.length})
            </TabsTrigger>
            <TabsTrigger value="preventivi" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Preventivi ({documenti.preventivi.length})
            </TabsTrigger>
            <TabsTrigger value="listino" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Listino
            </TabsTrigger>
          </TabsList>

          <TabsContent value="fatture">
            <Card>
              <CardHeader>
                <CardTitle>Le tue Fatture</CardTitle>
              </CardHeader>
              <CardContent>
                {documenti.fatture.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Nessuna fattura disponibile
                  </p>
                ) : (
                  <div className="space-y-2">
                    {documenti.fatture.map((fattura) => (
                      <div key={fattura.id} className="rounded-lg bg-gradient-to-r from-[#f5f0e6]/50 to-[#e8dcc8]/50 border border-[#d4c4a8] overflow-hidden">
                        <div 
                          className="p-4 cursor-pointer hover:bg-[#e8dcc8]/30 transition-colors"
                          onClick={() => setExpandedFattura(expandedFattura === fattura.id ? null : fattura.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="p-2 bg-gray-100 rounded">
                                <Receipt className="h-4 w-4 text-gray-600" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-medium">Fattura {fattura.numero}</p>
                                  {expandedFattura === fattura.id ? (
                                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  Emessa il {formatDate(fattura.data)}
                                  {fattura.dataScadenza && ` • Scadenza ${formatDate(fattura.dataScadenza)}`}
                                </p>
                                {fattura.oggetto && (
                                  <p className="text-sm text-muted-foreground mt-1">{fattura.oggetto}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="flex flex-col items-end gap-1">
                                <span className="font-semibold">
                                  {formatCurrency(fattura.importo)}
                                </span>
                                {getStatoBadge(fattura.stato)}
                              </div>
                              <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleViewDocument('fattura', fattura)}
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  Visualizza
                                </Button>
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => handleDownloadPDF('fattura', fattura)}
                                  disabled={downloading === fattura.id}
                                >
                                  {downloading === fattura.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <>
                                      <Download className="h-4 w-4 mr-1" />
                                      Scarica PDF
                                    </>
                                  )}
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                        {expandedFattura === fattura.id && fattura.righe && fattura.righe.length > 0 && (
                          <div className="border-t border-[#d4c4a8] bg-white/50 p-4">
                            <p className="text-sm font-medium mb-3 text-muted-foreground">Dettaglio Articoli</p>
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="border-b border-[#d4c4a8]">
                                    <th className="text-left py-2 px-2 font-medium text-muted-foreground">Codice</th>
                                    <th className="text-left py-2 px-2 font-medium text-muted-foreground">Descrizione</th>
                                    <th className="text-right py-2 px-2 font-medium text-muted-foreground">Qtà</th>
                                    <th className="text-right py-2 px-2 font-medium text-muted-foreground">Prezzo Unit.</th>
                                    <th className="text-right py-2 px-2 font-medium text-muted-foreground">IVA</th>
                                    <th className="text-right py-2 px-2 font-medium text-muted-foreground">Totale</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {fattura.righe.map((riga, idx) => (
                                    <tr key={riga.id || idx} className="border-b border-[#e8dcc8] last:border-0">
                                      <td className="py-2 px-2 text-muted-foreground">{riga.codiceArticolo || '-'}</td>
                                      <td className="py-2 px-2">{riga.descrizione}</td>
                                      <td className="py-2 px-2 text-right">{riga.quantita}</td>
                                      <td className="py-2 px-2 text-right">{formatCurrency(riga.prezzoUnitario)}</td>
                                      <td className="py-2 px-2 text-right">{riga.iva}%</td>
                                      <td className="py-2 px-2 text-right font-medium">{formatCurrency(riga.totale)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                        {expandedFattura === fattura.id && (!fattura.righe || fattura.righe.length === 0) && (
                          <div className="border-t border-[#d4c4a8] bg-white/50 p-4">
                            <p className="text-sm text-muted-foreground text-center">Nessun articolo disponibile</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preventivi">
            <Card>
              <CardHeader>
                <CardTitle>I tuoi Preventivi</CardTitle>
              </CardHeader>
              <CardContent>
                {documenti.preventivi.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Nessun preventivo disponibile
                  </p>
                ) : (
                  <div className="space-y-2">
                    {documenti.preventivi.map((preventivo) => (
                      <div key={preventivo.id} className="p-4 rounded-lg bg-gradient-to-r from-[#f5f0e6]/50 to-[#e8dcc8]/50 border border-[#d4c4a8] flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-gray-100 rounded">
                            <FileText className="h-4 w-4 text-gray-600" />
                          </div>
                          <div>
                            <p className="font-medium">Preventivo {preventivo.numero}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatDate(preventivo.data)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex flex-col items-end gap-1">
                            <span className="font-semibold">
                              {formatCurrency(preventivo.importo)}
                            </span>
                            {getStatoBadge(preventivo.stato)}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewDocument('preventivo', preventivo)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Visualizza
                            </Button>
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleDownloadPDF('preventivo', preventivo)}
                              disabled={downloading === preventivo.id}
                            >
                              {downloading === preventivo.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <Download className="h-4 w-4 mr-1" />
                                  Scarica PDF
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="listino">
            <Card>
              <CardHeader>
                <CardTitle>Listino Prezzi</CardTitle>
              </CardHeader>
              <CardContent>
                <ListinoPrezzi />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <footer className="mt-auto py-6 text-center text-sm text-muted-foreground">
        <p>Portale riservato ai clienti</p>
      </footer>

      <Dialog open={viewDialog?.open || false} onOpenChange={(open) => !open && setViewDialog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {viewDialog?.tipo === 'fattura' ? (
                <Receipt className="h-5 w-5 text-green-600" />
              ) : (
                <FileText className="h-5 w-5 text-blue-600" />
              )}
              {viewDialog?.tipo === 'fattura' ? 'Fattura' : 'Preventivo'} {viewDialog?.doc?.numero}
            </DialogTitle>
          </DialogHeader>
          {viewDialog?.doc && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Numero</p>
                  <p className="font-medium">{viewDialog.doc.numero}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Data</p>
                  <p className="font-medium">{formatDate(viewDialog.doc.data)}</p>
                </div>
                {viewDialog.tipo === 'fattura' && viewDialog.doc.dataScadenza && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Scadenza</p>
                    <p className="font-medium">{formatDate(viewDialog.doc.dataScadenza)}</p>
                  </div>
                )}
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Stato</p>
                  {getStatoBadge(viewDialog.doc.stato)}
                </div>
              </div>
              
              {viewDialog.doc.oggetto && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Oggetto</p>
                  <p className="font-medium">{viewDialog.doc.oggetto}</p>
                </div>
              )}
              
              <div className="pt-4 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-medium">Importo Totale</span>
                  <span className="text-2xl font-bold text-green-600">
                    {formatCurrency(viewDialog.doc.importo)}
                  </span>
                </div>
                {viewDialog.tipo === 'fattura' && viewDialog.doc.totalePagato && parseFloat(viewDialog.doc.totalePagato) > 0 && (
                  <div className="flex justify-between items-center mt-2 text-sm">
                    <span className="text-muted-foreground">Già pagato</span>
                    <span className="font-medium">{formatCurrency(viewDialog.doc.totalePagato)}</span>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setViewDialog(null)}
                >
                  Chiudi
                </Button>
                <Button
                  onClick={() => {
                    handleDownloadPDF(viewDialog.tipo, viewDialog.doc);
                    setViewDialog(null);
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Scarica PDF
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ListinoPrezzi() {
  const [articoli, setArticoli] = useState<any[]>([]);
  const [categorie, setCategorie] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategoria, setFilterCategoria] = useState("tutti");

  useEffect(() => {
    const fetchListino = async () => {
      try {
        const [artRes, catRes] = await Promise.all([
          fetch("/api/catalogo/pubblico/articoli"),
          fetch("/api/catalogo/pubblico/categorie")
        ]);
        if (artRes.ok) setArticoli(await artRes.json());
        if (catRes.ok) setCategorie(await catRes.json());
      } catch (e) {
        console.error("Errore caricamento listino:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchListino();
  }, []);

  const filtered = articoli.filter((a: any) => 
    filterCategoria === "tutti" || a.categoriaId === filterCategoria
  );

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilterCategoria("tutti")}
          className={`px-3 py-1 rounded-full text-sm ${filterCategoria === "tutti" ? "bg-blue-600 text-white" : "bg-gray-100"}`}
        >
          Tutti
        </button>
        {categorie.map((c: any) => (
          <button
            key={c.id}
            onClick={() => setFilterCategoria(c.id)}
            className={`px-3 py-1 rounded-full text-sm ${filterCategoria === c.id ? "bg-blue-600 text-white" : "bg-gray-100"}`}
          >
            {c.nome}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">
          Nessun articolo disponibile
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((articolo: any) => (
            <div key={articolo.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold">{articolo.nome}</p>
                  <p className="text-xs text-muted-foreground font-mono">{articolo.codice}</p>
                  {articolo.descrizione && (
                    <p className="text-sm text-muted-foreground mt-1">{articolo.descrizione}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-blue-600">
                    {parseFloat(articolo.prezzoListino || "0").toLocaleString("it-IT", { style: "currency", currency: "EUR" })}
                  </p>
                  <p className="text-xs text-muted-foreground">/{articolo.unitaMisura}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
