import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Truck, MapPin, Package, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import SignaturePad from "@/components/SignaturePad";

interface SpedizioneData {
  id: string;
  numero: string;
  data: string;
  stato: string;
  destinatario: string;
  indirizzo: string;
  citta: string;
  cap: string;
  provincia: string;
  noteConsegna: string;
  numeroColli: number;
  pesoTotale: string;
  firmaPresente: boolean;
}

export default function CourierPage() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [spedizione, setSpedizione] = useState<SpedizioneData | null>(null);
  const [companyName, setCompanyName] = useState("PULSE ERP");
  const [showSignature, setShowSignature] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    if (token) {
      fetchSpedizione();
    }
  }, [token]);

  const fetchSpedizione = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/corriere/${token}`);
      const data = await response.json();
      
      if (!response.ok) {
        setError(data.error || "Errore nel caricamento");
        return;
      }
      
      setSpedizione(data.spedizione);
      setCompanyName(data.companyName);
      
      if (data.spedizione.firmaPresente) {
        setConfirmed(true);
      }
    } catch (err) {
      setError("Errore di connessione");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSignature = async (data: { firma: string; nomeFirmatario: string }) => {
    try {
      setSaving(true);
      const response = await fetch(`/api/corriere/${token}/firma`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        toast({
          title: "Errore",
          description: result.error || "Errore nel salvataggio",
          variant: "destructive",
        });
        return;
      }
      
      setConfirmed(true);
      setShowSignature(false);
      toast({
        title: "Consegna confermata",
        description: "La firma è stata salvata con successo",
      });
    } catch (err) {
      toast({
        title: "Errore",
        description: "Errore di connessione",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-muted-foreground">Caricamento...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-50 to-white flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Link non valido</h2>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (confirmed) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <CheckCircle2 className="h-20 w-20 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-green-700 mb-2">Consegna Confermata</h2>
            <p className="text-muted-foreground mb-4">
              La spedizione {spedizione?.numero} è stata consegnata con successo.
            </p>
            <Badge variant="outline" className="text-green-600 border-green-600">
              Completata
            </Badge>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4">
      <div className="max-w-lg mx-auto space-y-4">
        <div className="text-center py-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-3">
            <Truck className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">{companyName}</h1>
          <p className="text-sm text-muted-foreground">Conferma Consegna</p>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Spedizione {spedizione?.numero}</CardTitle>
              <Badge variant="secondary">{spedizione?.stato}</Badge>
            </div>
            <CardDescription>Data: {spedizione?.data}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">{spedizione?.destinatario}</p>
                <p className="text-sm text-muted-foreground">
                  {spedizione?.indirizzo}<br />
                  {spedizione?.cap} {spedizione?.citta} ({spedizione?.provincia})
                </p>
              </div>
            </div>

            {(spedizione?.numeroColli || spedizione?.pesoTotale) && (
              <div className="flex items-center gap-3">
                <Package className="h-5 w-5 text-muted-foreground" />
                <div className="text-sm">
                  {spedizione?.numeroColli && <span>{spedizione.numeroColli} colli</span>}
                  {spedizione?.numeroColli && spedizione?.pesoTotale && <span> - </span>}
                  {spedizione?.pesoTotale && <span>{spedizione.pesoTotale} kg</span>}
                </div>
              </div>
            )}

            {spedizione?.noteConsegna && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-sm font-medium text-amber-800">Note per la consegna:</p>
                <p className="text-sm text-amber-700">{spedizione.noteConsegna}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {!showSignature ? (
          <Button 
            className="w-full h-14 text-lg"
            onClick={() => setShowSignature(true)}
          >
            <CheckCircle2 className="h-5 w-5 mr-2" />
            Conferma Consegna
          </Button>
        ) : (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Firma del Destinatario</CardTitle>
              <CardDescription>
                Il destinatario deve firmare per confermare la ricezione
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SignaturePad
                onSave={handleSaveSignature}
                onCancel={() => setShowSignature(false)}
                loading={saving}
              />
            </CardContent>
          </Card>
        )}

        <p className="text-center text-xs text-muted-foreground">
          Link valido per 24 ore dalla generazione
        </p>
      </div>
    </div>
  );
}
