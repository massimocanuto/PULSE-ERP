import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Receipt, ArrowUpDown, Lock, AlertCircle, Building2 } from "lucide-react";

interface ShareData {
  tipo: "invoice" | "transaction";
  data: any;
}

export default function ShareView() {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requiresPassword, setRequiresPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [shareData, setShareData] = useState<ShareData | null>(null);

  const fetchData = async (pwd?: string) => {
    try {
      setLoading(true);
      setError(null);
      
      let url = `/api/public/share/${token}`;
      if (pwd) {
        url += `?p=${encodeURIComponent(pwd)}`;
      }
      
      const res = await fetch(url);
      const data = await res.json();
      
      if (res.ok) {
        setShareData(data);
        setRequiresPassword(false);
      } else if (data.requiresPassword) {
        setRequiresPassword(true);
      } else {
        setError(data.error || "Link non valido");
      }
    } catch (err) {
      setError("Errore nel caricamento");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token]);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData(password);
  };

  const formatCurrency = (value: string | number) => {
    const num = typeof value === "string" 
      ? parseFloat(value.replace(/\./g, "").replace(",", ".")) 
      : value;
    return new Intl.NumberFormat("it-IT", {
      style: "currency",
      currency: "EUR"
    }).format(num || 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (requiresPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <Lock className="h-12 w-12 mx-auto text-amber-600 mb-2" />
            <CardTitle>Contenuto Protetto</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                Questo documento è protetto da password.
              </p>
              <Input
                type="password"
                placeholder="Inserisci la password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Button type="submit" className="w-full">
                Accedi
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-2" />
            <CardTitle className="text-red-600">Link Non Valido</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!shareData) return null;

  if (shareData.tipo === "invoice") {
    const inv = shareData.data;
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Receipt className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle>Fattura {inv.numero}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {inv.tipo === "emessa" ? "Fattura Emessa" : "Fattura Ricevuta"}
                    </p>
                  </div>
                </div>
                <Badge variant={inv.stato === "pagata" ? "default" : inv.stato === "scaduta" ? "destructive" : "secondary"}>
                  {inv.stato}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Data Emissione</p>
                  <p className="font-medium">{inv.dataEmissione || inv.data}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Data Scadenza</p>
                  <p className="font-medium">{inv.dataScadenza || "-"}</p>
                </div>
              </div>
              
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {inv.tipo === "emessa" ? "Cliente" : "Fornitore"}
                  </p>
                </div>
                <p className="font-semibold">{inv.ragioneSociale || inv.fornitoreCliente}</p>
                {inv.partitaIva && (
                  <p className="text-sm text-muted-foreground">P.IVA: {inv.partitaIva}</p>
                )}
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center text-lg">
                  <span>Imponibile:</span>
                  <span>{formatCurrency(inv.imponibile)}</span>
                </div>
                <div className="flex justify-between items-center text-lg">
                  <span>IVA:</span>
                  <span>{formatCurrency(inv.iva)}</span>
                </div>
                <div className="flex justify-between items-center text-2xl font-bold mt-2 pt-2 border-t">
                  <span>Totale:</span>
                  <span className="text-blue-600">{formatCurrency(inv.totale)}</span>
                </div>
              </div>

              {inv.note && (
                <div className="p-3 bg-amber-50 rounded-lg">
                  <p className="text-sm font-medium text-amber-800">Note</p>
                  <p className="text-sm text-amber-700">{inv.note}</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          <p className="text-center text-xs text-muted-foreground mt-4">
            Documento condiviso tramite PULSE ERP
          </p>
        </div>
      </div>
    );
  }

  if (shareData.tipo === "transaction") {
    const trans = shareData.data;
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    trans.tipo === "entrata" ? "bg-green-100" : 
                    trans.tipo === "uscita" ? "bg-red-100" : "bg-gray-100"
                  }`}>
                    <ArrowUpDown className={`h-6 w-6 ${
                      trans.tipo === "entrata" ? "text-green-600" : 
                      trans.tipo === "uscita" ? "text-red-600" : "text-gray-600"
                    }`} />
                  </div>
                  <div>
                    <CardTitle>
                      {trans.tipo === "entrata" ? "Entrata" : 
                       trans.tipo === "uscita" ? "Uscita" : "Trasferimento"}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {trans.data}
                    </p>
                  </div>
                </div>
                <Badge variant={trans.tipo === "entrata" ? "default" : "destructive"}>
                  {trans.riconciliato ? "Riconciliato" : "Non riconciliato"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Descrizione</p>
                <p className="text-sm">{trans.descrizione}</p>
              </div>

              <div className={`text-3xl font-bold text-center p-4 rounded-lg ${
                trans.tipo === "entrata" ? "bg-green-50 text-green-600" : 
                trans.tipo === "uscita" ? "bg-red-50 text-red-600" : "bg-gray-50"
              }`}>
                {trans.tipo === "entrata" ? "+" : trans.tipo === "uscita" ? "-" : ""}
                {formatCurrency(trans.importo)}
              </div>

              {trans.note && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm font-medium">Note</p>
                  <p className="text-sm text-muted-foreground">{trans.note}</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          <p className="text-center text-xs text-muted-foreground mt-4">
            Documento condiviso tramite PULSE ERP
          </p>
        </div>
      </div>
    );
  }

  return null;
}
