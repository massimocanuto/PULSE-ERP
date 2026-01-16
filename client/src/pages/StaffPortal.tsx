import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { User, Lock, LogOut, FileText, Download, Calendar, Briefcase, Clock, Euro, MapPin, LogIn, Fingerprint, Smartphone, Shield, CheckCircle, XCircle, Umbrella, Plus, Trash2, Send, Edit, Save, Phone, Mail, Home, Maximize, Minimize } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "wouter";

const MESI_NOMI = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"];

interface UserInfo {
  id: string;
  nome: string;
  cognome: string;
  email: string;
  ruolo: string;
  reparto: string;
  oreSettimanali: string;
  tipoContratto: string;
  dataAssunzione: string;
  iban: string;
  banca: string;
  abi: string;
  cab: string;
  telefono?: string;
  cellulare?: string;
  indirizzo?: string;
  citta?: string;
  cap?: string;
  provincia?: string;
  codiceFiscale?: string;
  dataNascita?: string;
  luogoNascita?: string;
}

interface Cedolino {
  id: string;
  mese: number;
  anno: number;
  filename: string;
  stipendioLordo: string;
  stipendioNetto: string;
  straordinari: string;
  createdAt: string;
}

interface Timbratura {
  id: string;
  tipo: string;
  dataOra: string;
  latitudine: string | null;
  longitudine: string | null;
  indirizzo: string | null;
}

interface RichiestaAssenza {
  id: string;
  tipo: string;
  dataInizio: string;
  dataFine: string;
  giorniTotali: string;
  motivo: string;
  stato: string;
  createdAt: string;
}

export default function StaffPortal() {
  const { toast } = useToast();
  const [token, setToken] = useState<string | null>(localStorage.getItem("staffPortalToken"));
  const [user, setUser] = useState<UserInfo | null>(null);
  const [cedolini, setCedolini] = useState<Cedolino[]>([]);
  const [timbrature, setTimbrature] = useState<Timbratura[]>([]);
  const [richiesteAssenza, setRichiesteAssenza] = useState<RichiestaAssenza[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loginData, setLoginData] = useState({ username: "", password: "" });
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showNewRequestDialog, setShowNewRequestDialog] = useState(false);
  const [newRequest, setNewRequest] = useState({ tipo: "ferie", dataInizio: "", dataFine: "", giorniTotali: "1", motivo: "" });
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [biometricStatus, setBiometricStatus] = useState<{ enabled: boolean; available: boolean }>({ enabled: false, available: false });
  const [isRegisteringBiometric, setIsRegisteringBiometric] = useState(false);
  const [isBiometricLogin, setIsBiometricLogin] = useState(false);
  const [storedCredentialId, setStoredCredentialId] = useState<string | null>(localStorage.getItem("biometricCredentialId"));
  const [isTokenLoading, setIsTokenLoading] = useState(false);
  const [showEditProfileDialog, setShowEditProfileDialog] = useState(false);
  const [editProfileData, setEditProfileData] = useState({
    telefono: "", cellulare: "", indirizzo: "", citta: "", cap: "", provincia: "",
    iban: "", banca: "", abi: "", cab: "", email: ""
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [logoutCountdown, setLogoutCountdown] = useState(5);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Login automatico tramite token dalla URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get("token");
    
    if (urlToken && !token) {
      setIsTokenLoading(true);
      fetch("/api/staff-portal/login-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ portalToken: urlToken }),
      })
        .then(async (res) => {
          if (res.ok) {
            const data = await res.json();
            localStorage.setItem("staffPortalToken", data.token);
            setToken(data.token);
            toast({ title: "Benvenuto", description: `Ciao ${data.personale.nome}!` });
            // Rimuovi il token dalla URL per sicurezza
            window.history.replaceState({}, document.title, window.location.pathname);
          } else {
            toast({ title: "Errore", description: "Link non valido o scaduto", variant: "destructive" });
          }
        })
        .catch(() => {
          toast({ title: "Errore", description: "Impossibile accedere", variant: "destructive" });
        })
        .finally(() => {
          setIsTokenLoading(false);
        });
    }
  }, []);

  useEffect(() => {
    const checkBiometricAvailability = async () => {
      if (window.PublicKeyCredential) {
        try {
          const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
          setBiometricStatus(prev => ({ ...prev, available }));
        } catch {
          setBiometricStatus(prev => ({ ...prev, available: false }));
        }
      }
    };
    checkBiometricAvailability();
  }, []);

  useEffect(() => {
    if (token) {
      loadUserData();
      loadBiometricStatus();
    }
  }, [token]);

  const loadBiometricStatus = async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/staff-portal/biometric/status", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setBiometricStatus(prev => ({ ...prev, enabled: data.biometricEnabled }));
      }
    } catch (error) {
      console.error("Error loading biometric status:", error);
    }
  };

  const handleBiometricLogin = async () => {
    if (!storedCredentialId) {
      toast({ title: "Errore", description: "Nessuna credenziale biometrica salvata", variant: "destructive" });
      return;
    }

    setIsBiometricLogin(true);
    try {
      const startRes = await fetch("/api/staff-portal/biometric/auth-start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credentialId: storedCredentialId }),
      });

      if (!startRes.ok) {
        const error = await startRes.json();
        toast({ title: "Errore", description: error.error || "Autenticazione biometrica fallita", variant: "destructive" });
        localStorage.removeItem("biometricCredentialId");
        setStoredCredentialId(null);
        return;
      }

      const options = await startRes.json();

      const credential = await navigator.credentials.get({
        publicKey: {
          challenge: Uint8Array.from(atob(options.challenge.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0)),
          rpId: options.rpId,
          allowCredentials: [{
            type: "public-key",
            id: Uint8Array.from(atob(storedCredentialId.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0)),
          }],
          userVerification: "required",
          timeout: 60000,
        },
      }) as PublicKeyCredential;

      if (!credential) {
        toast({ title: "Errore", description: "Autenticazione biometrica annullata", variant: "destructive" });
        return;
      }

      const completeRes = await fetch("/api/staff-portal/biometric/auth-complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          credentialId: storedCredentialId,
          personaleId: options.personaleId,
        }),
      });

      if (!completeRes.ok) {
        toast({ title: "Errore", description: "Autenticazione fallita", variant: "destructive" });
        return;
      }

      const data = await completeRes.json();
      localStorage.setItem("staffPortalToken", data.token);
      setToken(data.token);
      toast({ title: "Benvenuto", description: `Ciao ${data.personale.nome}!` });
    } catch (error: any) {
      console.error("Biometric login error:", error);
      if (error.name === "NotAllowedError") {
        toast({ title: "Annullato", description: "Autenticazione biometrica annullata", variant: "destructive" });
      } else {
        toast({ title: "Errore", description: "Impossibile completare l'autenticazione biometrica", variant: "destructive" });
      }
    } finally {
      setIsBiometricLogin(false);
    }
  };

  const handleRegisterBiometric = async () => {
    if (!token) return;

    setIsRegisteringBiometric(true);
    try {
      const startRes = await fetch("/api/staff-portal/biometric/register-start", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!startRes.ok) {
        toast({ title: "Errore", description: "Impossibile avviare la registrazione biometrica", variant: "destructive" });
        return;
      }

      const options = await startRes.json();

      const credential = await navigator.credentials.create({
        publicKey: {
          challenge: Uint8Array.from(atob(options.challenge.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0)),
          rp: options.rp,
          user: {
            id: Uint8Array.from(atob(options.user.id.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0)),
            name: options.user.name,
            displayName: options.user.displayName,
          },
          pubKeyCredParams: options.pubKeyCredParams,
          authenticatorSelection: options.authenticatorSelection,
          timeout: options.timeout,
        },
      }) as PublicKeyCredential;

      if (!credential) {
        toast({ title: "Errore", description: "Registrazione biometrica annullata", variant: "destructive" });
        return;
      }

      const credentialId = btoa(String.fromCharCode(...new Uint8Array(credential.rawId)))
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

      const response = credential.response as AuthenticatorAttestationResponse;
      const publicKey = btoa(String.fromCharCode(...new Uint8Array(response.getPublicKey()!)))
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

      const completeRes = await fetch("/api/staff-portal/biometric/register-complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ credentialId, publicKey }),
      });

      if (completeRes.ok) {
        localStorage.setItem("biometricCredentialId", credentialId);
        setStoredCredentialId(credentialId);
        setBiometricStatus(prev => ({ ...prev, enabled: true }));
        toast({ title: "Attivato!", description: "Accesso biometrico configurato con successo" });
      } else {
        toast({ title: "Errore", description: "Impossibile salvare le credenziali biometriche", variant: "destructive" });
      }
    } catch (error: any) {
      console.error("Biometric registration error:", error);
      if (error.name === "NotAllowedError") {
        toast({ title: "Annullato", description: "Registrazione biometrica annullata", variant: "destructive" });
      } else {
        toast({ title: "Errore", description: "Impossibile completare la registrazione biometrica", variant: "destructive" });
      }
    } finally {
      setIsRegisteringBiometric(false);
    }
  };

  const handleDisableBiometric = async () => {
    if (!token) return;

    try {
      const res = await fetch("/api/staff-portal/biometric/disable", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        localStorage.removeItem("biometricCredentialId");
        setStoredCredentialId(null);
        setBiometricStatus(prev => ({ ...prev, enabled: false }));
        toast({ title: "Disattivato", description: "Accesso biometrico disattivato" });
      }
    } catch (error) {
      toast({ title: "Errore", description: "Impossibile disattivare l'accesso biometrico", variant: "destructive" });
    }
  };

  const loadUserData = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const [userRes, cedoliniRes, timbratureRes, richiesteRes] = await Promise.all([
        fetch("/api/staff-portal/me", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/staff-portal/cedolini", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/staff-portal/timbrature", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/staff-portal/richieste-assenza", { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (!userRes.ok) {
        handleLogout();
        return;
      }

      const userData = await userRes.json();
      setUser(userData);

      if (cedoliniRes.ok) {
        const cedoliniData = await cedoliniRes.json();
        setCedolini(cedoliniData);
      }

      if (timbratureRes.ok) {
        const timbratureData = await timbratureRes.json();
        setTimbrature(timbratureData);
      }

      if (richiesteRes.ok) {
        const richiesteData = await richiesteRes.json();
        setRichiesteAssenza(richiesteData);
      }
    } catch (error) {
      console.error("Error loading user data:", error);
      handleLogout();
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateRequest = async () => {
    if (!token || !newRequest.dataInizio || !newRequest.dataFine) return;
    
    setIsSubmittingRequest(true);
    try {
      const response = await fetch("/api/staff-portal/richieste-assenza", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(newRequest),
      });

      if (!response.ok) {
        const error = await response.json();
        toast({ title: "Errore", description: error.error || "Impossibile creare la richiesta", variant: "destructive" });
        return;
      }

      const newRichiesta = await response.json();
      setRichiesteAssenza([newRichiesta, ...richiesteAssenza]);
      setShowNewRequestDialog(false);
      setNewRequest({ tipo: "ferie", dataInizio: "", dataFine: "", giorniTotali: "1", motivo: "" });
      toast({ title: "Richiesta inviata", description: "La tua richiesta è stata inviata con successo" });
    } catch (error) {
      toast({ title: "Errore", description: "Impossibile creare la richiesta", variant: "destructive" });
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  const handleDeleteRequest = async (id: string) => {
    if (!token) return;
    
    try {
      const response = await fetch(`/api/staff-portal/richieste-assenza/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const error = await response.json();
        toast({ title: "Errore", description: error.error || "Impossibile eliminare la richiesta", variant: "destructive" });
        return;
      }

      setRichiesteAssenza(richiesteAssenza.filter(r => r.id !== id));
      toast({ title: "Eliminata", description: "Richiesta eliminata con successo" });
    } catch (error) {
      toast({ title: "Errore", description: "Impossibile eliminare la richiesta", variant: "destructive" });
    }
  };

  const getTipoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      ferie: "Ferie",
      permesso: "Permesso ROL",
      malattia: "Malattia",
      maternita: "Maternità",
      paternita: "Paternità",
      lutto: "Lutto",
      altro: "Altro",
    };
    return labels[tipo] || tipo;
  };

  const getStatoBadge = (stato: string) => {
    const styles: Record<string, string> = {
      richiesta: "bg-yellow-100 text-yellow-700",
      approvata: "bg-green-100 text-green-700",
      rifiutata: "bg-red-100 text-red-700",
    };
    const labels: Record<string, string> = {
      richiesta: "In attesa",
      approvata: "Approvata",
      rifiutata: "Rifiutata",
    };
    return <Badge className={styles[stato] || "bg-gray-100 text-gray-700"}>{labels[stato] || stato}</Badge>;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    try {
      const response = await fetch("/api/staff-portal/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginData),
      });

      if (!response.ok) {
        const error = await response.json();
        toast({ title: "Errore", description: error.error || "Login fallito", variant: "destructive" });
        return;
      }

      const data = await response.json();
      localStorage.setItem("staffPortalToken", data.token);
      setToken(data.token);
      toast({ title: "Benvenuto", description: `Ciao ${data.personale.nome}!` });
    } catch (error) {
      toast({ title: "Errore", description: "Impossibile effettuare il login", variant: "destructive" });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    setShowLogoutDialog(true);
    setLogoutCountdown(5);
  };

  const cancelLogout = () => {
    setShowLogoutDialog(false);
    setLogoutCountdown(5);
  };

  const confirmLogout = () => {
    localStorage.removeItem("staffPortalToken");
    setToken(null);
    setUser(null);
    setCedolini([]);
    setTimbrature([]);
    setShowLogoutDialog(false);
    // Prova a chiudere la finestra
    window.close();
  };

  useEffect(() => {
    if (showLogoutDialog && logoutCountdown > 0) {
      const timer = setTimeout(() => {
        setLogoutCountdown(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (showLogoutDialog && logoutCountdown === 0) {
      confirmLogout();
    }
  }, [showLogoutDialog, logoutCountdown]);

  const downloadCedolino = async (cedolino: Cedolino) => {
    try {
      const response = await fetch(`/api/staff-portal/cedolini/${cedolino.id}/download`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Download fallito");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = cedolino.filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      toast({ title: "Errore", description: "Impossibile scaricare il file", variant: "destructive" });
    }
  };

  const openEditProfileDialog = () => {
    if (user) {
      setEditProfileData({
        telefono: user.telefono || "",
        cellulare: user.cellulare || "",
        indirizzo: user.indirizzo || "",
        citta: user.citta || "",
        cap: user.cap || "",
        provincia: user.provincia || "",
        iban: user.iban || "",
        banca: user.banca || "",
        abi: user.abi || "",
        cab: user.cab || "",
        email: user.email || "",
      });
      setShowEditProfileDialog(true);
    }
  };

  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    try {
      const response = await fetch("/api/staff-portal/me", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editProfileData),
      });

      if (!response.ok) {
        const error = await response.json();
        toast({ title: "Errore", description: error.error || "Salvataggio fallito", variant: "destructive" });
        return;
      }

      // Ricarica i dati utente
      const meResponse = await fetch("/api/staff-portal/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (meResponse.ok) {
        const userData = await meResponse.json();
        setUser(userData);
      }

      setShowEditProfileDialog(false);
      toast({ title: "Salvato", description: "I tuoi dati sono stati aggiornati" });
    } catch (error) {
      toast({ title: "Errore", description: "Impossibile salvare i dati", variant: "destructive" });
    } finally {
      setIsSavingProfile(false);
    }
  };

  if (isTokenLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Accesso in corso...</p>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto h-16 w-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-4">
              <User className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl">Portale Collaboratori</CardTitle>
            <CardDescription>Accedi per visualizzare i tuoi cedolini</CardDescription>
          </CardHeader>
          <CardContent>
            {storedCredentialId && biometricStatus.available && (
              <div className="mb-6">
                <Button 
                  onClick={handleBiometricLogin} 
                  className="w-full h-14 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white"
                  disabled={isBiometricLogin}
                >
                  {isBiometricLogin ? (
                    <>
                      <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2" />
                      Verifica in corso...
                    </>
                  ) : (
                    <>
                      <Fingerprint className="h-6 w-6 mr-2" />
                      Accedi con Impronta / Face ID
                    </>
                  )}
                </Button>
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">oppure</span>
                  </div>
                </div>
              </div>
            )}
            <form onSubmit={handleLogin} className="space-y-4" autoComplete="off">
              <div>
                <Label htmlFor="username">Nome Utente</Label>
                <Input
                  id="username"
                  value={loginData.username}
                  onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                  placeholder="Inserisci il tuo username"
                  required
                  autoComplete="off"
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  placeholder="Inserisci la password"
                  required
                  autoComplete="new-password"
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoggingIn}>
                {isLoggingIn ? "Accesso in corso..." : (
                  <><Lock className="h-4 w-4 mr-2" />Accedi</>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Caricamento...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b sticky top-0 z-10">
        <div className="max-w-[1400px] mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <User className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-semibold uppercase">{user.nome} {user.cognome}</h1>
              <p className="text-sm text-muted-foreground">{user.ruolo || "Collaboratore"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={openEditProfileDialog}>
              <Edit className="h-4 w-4 mr-2" />
              Modifica Dati
            </Button>
            <Button variant="outline" size="sm" onClick={toggleFullscreen} title={isFullscreen ? "Esci da schermo intero" : "Schermo intero"}>
              {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            </Button>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Esci
            </Button>
          </div>
        </div>
      </header>

      {/* Dialog Modifica Dati Personali */}
      <Dialog open={showEditProfileDialog} onOpenChange={setShowEditProfileDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Modifica Dati Personali
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-email" className="text-xs">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editProfileData.email}
                  onChange={(e) => setEditProfileData({ ...editProfileData, email: e.target.value })}
                  placeholder="email@esempio.com"
                  className="h-9"
                />
              </div>
              <div>
                <Label htmlFor="edit-telefono" className="text-xs">Telefono</Label>
                <Input
                  id="edit-telefono"
                  value={editProfileData.telefono}
                  onChange={(e) => setEditProfileData({ ...editProfileData, telefono: e.target.value })}
                  placeholder="Telefono fisso"
                  className="h-9"
                />
              </div>
              <div>
                <Label htmlFor="edit-cellulare" className="text-xs">Cellulare</Label>
                <Input
                  id="edit-cellulare"
                  value={editProfileData.cellulare}
                  onChange={(e) => setEditProfileData({ ...editProfileData, cellulare: e.target.value })}
                  placeholder="Numero cellulare"
                  className="h-9"
                />
              </div>
            </div>
            
            <div className="border-t pt-4 mt-2">
              <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                <Home className="h-4 w-4" />
                Indirizzo di Residenza
              </h4>
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="edit-indirizzo" className="text-xs">Indirizzo</Label>
                  <Input
                    id="edit-indirizzo"
                    value={editProfileData.indirizzo}
                    onChange={(e) => setEditProfileData({ ...editProfileData, indirizzo: e.target.value.toUpperCase() })}
                    placeholder="Via/Piazza e numero civico"
                    className="h-9"
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label htmlFor="edit-citta" className="text-xs">Città</Label>
                    <Input
                      id="edit-citta"
                      value={editProfileData.citta}
                      onChange={(e) => setEditProfileData({ ...editProfileData, citta: e.target.value.toUpperCase() })}
                      placeholder="Città"
                      className="h-9"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-cap" className="text-xs">CAP</Label>
                    <Input
                      id="edit-cap"
                      value={editProfileData.cap}
                      onChange={(e) => setEditProfileData({ ...editProfileData, cap: e.target.value })}
                      placeholder="CAP"
                      className="h-9"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-provincia" className="text-xs">Provincia</Label>
                    <Input
                      id="edit-provincia"
                      value={editProfileData.provincia}
                      onChange={(e) => setEditProfileData({ ...editProfileData, provincia: e.target.value.toUpperCase() })}
                      placeholder="ES. MI"
                      maxLength={2}
                      className="h-9"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t pt-4 mt-2">
              <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                <Euro className="h-4 w-4" />
                Dati Bancari
              </h4>
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="edit-iban" className="text-xs">IBAN</Label>
                  <Input
                    id="edit-iban"
                    value={editProfileData.iban}
                    onChange={(e) => setEditProfileData({ ...editProfileData, iban: e.target.value.toUpperCase() })}
                    placeholder="IT00X0000000000000000000000"
                    className="h-9 font-mono"
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label htmlFor="edit-banca" className="text-xs">Banca</Label>
                    <Input
                      id="edit-banca"
                      value={editProfileData.banca}
                      onChange={(e) => setEditProfileData({ ...editProfileData, banca: e.target.value })}
                      placeholder="Nome banca"
                      className="h-9"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-abi" className="text-xs">ABI</Label>
                    <Input
                      id="edit-abi"
                      value={editProfileData.abi}
                      onChange={(e) => setEditProfileData({ ...editProfileData, abi: e.target.value })}
                      placeholder="ABI"
                      className="h-9 font-mono"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-cab" className="text-xs">CAB</Label>
                    <Input
                      id="edit-cab"
                      value={editProfileData.cab}
                      onChange={(e) => setEditProfileData({ ...editProfileData, cab: e.target.value })}
                      placeholder="CAB"
                      className="h-9 font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowEditProfileDialog(false)}>
              Annulla
            </Button>
            <Button onClick={handleSaveProfile} disabled={isSavingProfile}>
              {isSavingProfile ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  Salvataggio...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salva Modifiche
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Conferma Logout */}
      <Dialog open={showLogoutDialog} onOpenChange={(open) => !open && cancelLogout()}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-center justify-center">
              <LogOut className="h-5 w-5" />
              Uscita in corso...
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-6">
            <div className="relative inline-flex items-center justify-center">
              <div className="h-24 w-24 rounded-full border-4 border-primary/20 flex items-center justify-center">
                <span className="text-4xl font-bold text-primary">{logoutCountdown}</span>
              </div>
              <svg className="absolute h-24 w-24 -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50" cy="50" r="46"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  strokeDasharray={`${(logoutCountdown / 5) * 289} 289`}
                  className="text-primary transition-all duration-1000"
                />
              </svg>
            </div>
            <p className="mt-4 text-muted-foreground">
              Chiusura automatica tra {logoutCountdown} secondi...
            </p>
          </div>
          <div className="flex justify-center gap-3">
            <Button variant="outline" onClick={cancelLogout}>
              Annulla
            </Button>
            <Button variant="destructive" onClick={confirmLogout}>
              Esci Subito
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <main className="max-w-[1400px] mx-auto px-4 py-6">
        <div className="grid md:grid-cols-3 gap-4 mb-4">
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Briefcase className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Reparto</p>
                  <p className="font-medium text-sm">{user.reparto || "-"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <Clock className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Ore Settimanali</p>
                  <p className="font-medium text-sm">{user.oreSettimanali || "40"}h</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Contratto</p>
                  <p className="font-medium text-sm">{user.tipoContratto || "Indeterminato"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Dati Bancari */}
        <Card className="mb-6">
          <CardHeader className="pb-2 pt-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Euro className="h-4 w-4" />
              Dati Bancari
            </CardTitle>
            <CardDescription className="text-xs">Verifica che i dati siano corretti per l'accredito dello stipendio</CardDescription>
          </CardHeader>
          <CardContent className="pb-3">
            <div className="grid md:grid-cols-4 gap-3">
              <div className="p-2 bg-muted/50 rounded-lg">
                <p className="text-[10px] text-muted-foreground mb-0.5">IBAN</p>
                <p className="font-mono text-xs font-medium">{user.iban || "-"}</p>
              </div>
              <div className="p-2 bg-muted/50 rounded-lg">
                <p className="text-[10px] text-muted-foreground mb-0.5">Banca</p>
                <p className="font-medium text-xs">{user.banca || "-"}</p>
              </div>
              <div className="p-2 bg-muted/50 rounded-lg">
                <p className="text-[10px] text-muted-foreground mb-0.5">ABI</p>
                <p className="font-mono font-medium text-xs">{user.abi || "-"}</p>
              </div>
              <div className="p-2 bg-muted/50 rounded-lg">
                <p className="text-[10px] text-muted-foreground mb-0.5">CAB</p>
                <p className="font-mono font-medium text-xs">{user.cab || "-"}</p>
              </div>
            </div>
            {(!user.iban || !user.banca) && (
              <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-2 flex items-center gap-1">
                <span>⚠️</span> Se i dati non sono corretti, contatta l'amministrazione
              </p>
            )}
          </CardContent>
        </Card>

        {/* Accesso Biometrico */}
        {biometricStatus.available && (
          <Card className="mb-6 bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-950/30 dark:to-emerald-950/30 border-teal-200 dark:border-teal-800">
            <CardHeader className="pb-2 pt-3">
              <CardTitle className="flex items-center gap-2 text-sm text-teal-700 dark:text-teal-300">
                <Fingerprint className="h-4 w-4" />
                Accesso Biometrico
              </CardTitle>
              <CardDescription className="text-xs">Accedi rapidamente con impronta digitale o Face ID</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center ${biometricStatus.enabled ? 'bg-green-100 dark:bg-green-900/30' : 'bg-gray-100 dark:bg-gray-800'}`}>
                    {biometricStatus.enabled ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <Smartphone className="h-5 w-5 text-gray-500" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">
                      {biometricStatus.enabled ? "Accesso biometrico attivo" : "Accesso biometrico non configurato"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {biometricStatus.enabled 
                        ? "Puoi accedere con impronta o Face ID" 
                        : "Attiva per un accesso più veloce"}
                    </p>
                  </div>
                </div>
                {biometricStatus.enabled ? (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleDisableBiometric}
                    className="border-red-300 text-red-600 hover:bg-red-50"
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Disattiva
                  </Button>
                ) : (
                  <Button 
                    size="sm"
                    onClick={handleRegisterBiometric}
                    disabled={isRegisteringBiometric}
                    className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600"
                  >
                    {isRegisteringBiometric ? (
                      <>
                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-1" />
                        Configurazione...
                      </>
                    ) : (
                      <>
                        <Fingerprint className="h-4 w-4 mr-1" />
                        Attiva ora
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Richieste Ferie/Permessi */}
        <Card className="mb-6">
          <CardHeader className="pb-2 pt-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Umbrella className="h-4 w-4" />
                  Ferie e Permessi
                </CardTitle>
                <CardDescription className="text-xs">Richiedi ferie, permessi e visualizza lo storico</CardDescription>
              </div>
              <Dialog open={showNewRequestDialog} onOpenChange={setShowNewRequestDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Nuova Richiesta
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Nuova Richiesta Ferie/Permessi</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div>
                      <Label>Tipo</Label>
                      <Select value={newRequest.tipo} onValueChange={(v) => setNewRequest({ ...newRequest, tipo: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ferie">Ferie</SelectItem>
                          <SelectItem value="permesso">Permesso (ROL)</SelectItem>
                          <SelectItem value="malattia">Malattia</SelectItem>
                          <SelectItem value="maternita">Maternità</SelectItem>
                          <SelectItem value="paternita">Paternità</SelectItem>
                          <SelectItem value="lutto">Lutto</SelectItem>
                          <SelectItem value="altro">Altro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Data Inizio</Label>
                        <Input
                          type="date"
                          value={newRequest.dataInizio}
                          onChange={(e) => setNewRequest({ ...newRequest, dataInizio: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Data Fine</Label>
                        <Input
                          type="date"
                          value={newRequest.dataFine}
                          onChange={(e) => setNewRequest({ ...newRequest, dataFine: e.target.value })}
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Giorni Totali</Label>
                      <Input
                        type="number"
                        min="0.5"
                        step="0.5"
                        value={newRequest.giorniTotali}
                        onChange={(e) => setNewRequest({ ...newRequest, giorniTotali: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Note (opzionale)</Label>
                      <Input
                        value={newRequest.motivo}
                        onChange={(e) => setNewRequest({ ...newRequest, motivo: e.target.value })}
                        placeholder="Eventuali note..."
                      />
                    </div>
                    <Button 
                      onClick={handleCreateRequest} 
                      disabled={isSubmittingRequest || !newRequest.dataInizio || !newRequest.dataFine}
                      className="w-full"
                    >
                      {isSubmittingRequest ? (
                        <>
                          <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                          Invio in corso...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Invia Richiesta
                        </>
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {richiesteAssenza.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Umbrella className="h-10 w-10 mx-auto mb-3 opacity-20" />
                <p>Nessuna richiesta effettuata</p>
                <p className="text-sm">Clicca "Nuova Richiesta" per richiedere ferie o permessi</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {richiesteAssenza.map((r) => (
                  <div key={r.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{getTipoLabel(r.tipo)}</span>
                          {getStatoBadge(r.stato)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {new Date(r.dataInizio).toLocaleDateString("it-IT")} - {new Date(r.dataFine).toLocaleDateString("it-IT")}
                          <span className="ml-2">({r.giorniTotali} giorni)</span>
                        </p>
                        {r.motivo && <p className="text-xs text-muted-foreground italic">{r.motivo}</p>}
                      </div>
                    </div>
                    {r.stato === "richiesta" && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDeleteRequest(r.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Timbrature con Tabs */}
        <Card className="mb-6">
          <CardHeader className="pb-2 pt-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4" />
                  Le Mie Timbrature
                </CardTitle>
                <CardDescription className="text-xs">Registra e visualizza le tue presenze</CardDescription>
              </div>
              <a href="/portale-timbratura">
                <Button size="sm" className="h-7 text-xs bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700">
                  <LogIn className="h-3 w-3 mr-1" />
                  Timbra ora
                </Button>
              </a>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <Tabs defaultValue="oggi" className="w-full">
              <TabsList className="grid w-full grid-cols-2 h-8">
                <TabsTrigger value="oggi" className="text-xs">Oggi</TabsTrigger>
                <TabsTrigger value="storico" className="text-xs">Storico</TabsTrigger>
              </TabsList>
              <TabsContent value="oggi" className="mt-3">
                {(() => {
                  const oggi = new Date().toDateString();
                  const timbratureOggi = timbrature.filter(t => new Date(t.dataOra).toDateString() === oggi);
                  return timbratureOggi.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground">
                      <Clock className="h-8 w-8 mx-auto mb-2 opacity-20" />
                      <p className="text-sm">Nessuna timbratura oggi</p>
                      <p className="text-xs">Clicca "Timbra ora" per registrare la presenza</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {timbratureOggi.map((t) => (
                        <div key={t.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <Badge variant={t.tipo === "entrata" ? "default" : "secondary"}>
                              {t.tipo === "entrata" ? "Entrata" : "Uscita"}
                            </Badge>
                            <div>
                              <p className="font-medium text-sm font-mono">
                                {new Date(t.dataOra).toLocaleTimeString("it-IT")}
                              </p>
                            </div>
                          </div>
                          {t.indirizzo && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground max-w-[200px] truncate">
                              <MapPin className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate">{t.indirizzo}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </TabsContent>
              <TabsContent value="storico" className="mt-3">
                {timbrature.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <Clock className="h-8 w-8 mx-auto mb-2 opacity-20" />
                    <p className="text-sm">Nessuna timbratura registrata</p>
                  </div>
                ) : (
                  <div className="max-h-64 overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead className="sticky top-0 bg-background border-b">
                        <tr>
                          <th className="text-left py-1.5 px-2 font-medium">Data</th>
                          <th className="text-center py-1.5 px-2 font-medium">Entrata</th>
                          <th className="text-center py-1.5 px-2 font-medium">Uscita</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          const grouped: Record<string, { entrata?: string; uscita?: string; date: Date }> = {};
                          timbrature.forEach((t) => {
                            const d = new Date(t.dataOra);
                            const key = d.toISOString().split("T")[0];
                            if (!grouped[key]) grouped[key] = { date: d };
                            if (t.tipo === "entrata" && !grouped[key].entrata) {
                              grouped[key].entrata = d.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
                            }
                            if (t.tipo === "uscita") {
                              grouped[key].uscita = d.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
                            }
                          });
                          return Object.entries(grouped)
                            .sort(([a], [b]) => b.localeCompare(a))
                            .slice(0, 30)
                            .map(([key, val]) => (
                              <tr key={key} className="border-b last:border-0 hover:bg-muted/50">
                                <td className="py-1.5 px-2 font-mono">
                                  {val.date.toLocaleDateString("it-IT", { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric" })}
                                </td>
                                <td className="py-1.5 px-2 text-center font-mono">
                                  {val.entrata ? (
                                    <span className="text-green-600 font-medium">{val.entrata}</span>
                                  ) : (
                                    <span className="text-muted-foreground">-</span>
                                  )}
                                </td>
                                <td className="py-1.5 px-2 text-center font-mono">
                                  {val.uscita ? (
                                    <span className="text-orange-600 font-medium">{val.uscita}</span>
                                  ) : (
                                    <span className="text-muted-foreground">-</span>
                                  )}
                                </td>
                              </tr>
                            ));
                        })()}
                      </tbody>
                    </table>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 pt-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4" />
              I Miei Cedolini
            </CardTitle>
            <CardDescription className="text-xs">Visualizza e scarica i tuoi cedolini</CardDescription>
          </CardHeader>
          <CardContent>
            {cedolini.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>Nessun cedolino disponibile</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cedolini.map((cedolino) => (
                  <div key={cedolino.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                        <FileText className="h-6 w-6 text-amber-600" />
                      </div>
                      <div>
                        <div className="font-medium">{MESI_NOMI[cedolino.mese - 1]} {cedolino.anno}</div>
                        <div className="text-sm text-muted-foreground">{cedolino.filename}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      {cedolino.stipendioNetto && (
                        <div className="text-right hidden sm:block">
                          <div className="text-xs text-muted-foreground">Netto</div>
                          <div className="font-semibold text-green-600 flex items-center">
                            <Euro className="h-3 w-3 mr-0.5" />
                            {cedolino.stipendioNetto}
                          </div>
                        </div>
                      )}
                      {cedolino.straordinari && parseFloat(cedolino.straordinari.replace(",", ".")) > 0 && (
                        <Badge variant="secondary" className="hidden sm:flex">
                          +{cedolino.straordinari}h straord.
                        </Badge>
                      )}
                      <Button variant="outline" size="sm" onClick={() => downloadCedolino(cedolino)}>
                        <Download className="h-4 w-4 mr-2" />
                        Scarica
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
