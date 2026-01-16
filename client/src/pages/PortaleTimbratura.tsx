import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Clock, LogIn, LogOut, MapPin, User, Lock, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

interface UserInfo {
  id: string;
  nome: string;
  cognome: string;
  reparto: string;
}

interface Timbratura {
  id: string;
  tipo: string;
  dataOra: string;
  latitudine: string | null;
  longitudine: string | null;
  indirizzo: string | null;
}

export default function PortaleTimbratura() {
  const { toast } = useToast();
  const [token, setToken] = useState<string | null>(localStorage.getItem("staffPortalToken"));
  const [user, setUser] = useState<UserInfo | null>(null);
  const [timbrature, setTimbrature] = useState<Timbratura[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTimbrating, setIsTimbrating] = useState(false);
  const [loginData, setLoginData] = useState({ username: "", password: "" });
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [location, setLocation] = useState<{ lat: number; lng: number; address?: string } | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (token) {
      loadUserData();
      getLocationAuto();
    }
  }, [token]);

  const getLocationAuto = () => {
    if (!navigator.geolocation) return;

    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        let address = "";
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          );
          const data = await response.json();
          address = data.display_name?.split(",").slice(0, 3).join(", ") || "";
        } catch (e) {
          console.log("Geocoding failed");
        }
        setLocation({ lat: latitude, lng: longitude, address });
        setGettingLocation(false);
      },
      (error) => {
        console.error("Geolocation error:", error);
        setGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const loadUserData = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const [userRes, timbratureRes] = await Promise.all([
        fetch("/api/staff-portal/me", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/staff-portal/timbrature", { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (!userRes.ok) {
        handleLogout();
        return;
      }

      const userData = await userRes.json();
      setUser(userData);

      if (timbratureRes.ok) {
        const timbratureData = await timbratureRes.json();
        setTimbrature(timbratureData);
      }
    } catch (error) {
      console.error("Error loading user data:", error);
      handleLogout();
    } finally {
      setIsLoading(false);
    }
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
    localStorage.removeItem("staffPortalToken");
    setToken(null);
    setUser(null);
    setTimbrature([]);
  };

  const handleTimbratura = async (tipo: "entrata" | "uscita") => {
    setIsTimbrating(true);
    
    const sendTimbratura = async (lat?: number, lng?: number, address?: string) => {
      try {
        const body: any = { tipo };
        if (lat !== undefined && lng !== undefined) {
          body.latitudine = lat;
          body.longitudine = lng;
          body.indirizzo = address || null;
        }

        const response = await fetch("/api/staff-portal/timbrature", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          const error = await response.json();
          toast({ title: "Errore", description: error.error || "Timbratura fallita", variant: "destructive" });
          return;
        }

        const newTimbratura = await response.json();
        setTimbrature([newTimbratura, ...timbrature]);
        toast({
          title: tipo === "entrata" ? "Entrata registrata" : "Uscita registrata",
          description: `Timbratura alle ${new Date().toLocaleTimeString("it-IT")}${lat ? " con posizione GPS" : ""}`,
        });
      } catch (error) {
        toast({ title: "Errore", description: "Impossibile registrare la timbratura", variant: "destructive" });
      } finally {
        setIsTimbrating(false);
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          let address = "";
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
            );
            const data = await response.json();
            address = data.display_name?.split(",").slice(0, 3).join(", ") || "";
          } catch (e) {
            console.log("Geocoding failed");
          }
          setLocation({ lat: latitude, lng: longitude, address });
          await sendTimbratura(latitude, longitude, address);
        },
        async () => {
          await sendTimbratura();
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      await sendTimbratura();
    }
  };

  const getTodayTimbrature = () => {
    const today = new Date().toISOString().split("T")[0];
    return timbrature.filter((t) => t.dataOra.startsWith(today));
  };

  const getLastTimbratura = () => {
    return timbrature.length > 0 ? timbrature[0] : null;
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto h-16 w-16 rounded-full bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center mb-4">
              <Clock className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl">Portale Timbratura</CardTitle>
            <CardDescription>Accedi per registrare la tua presenza</CardDescription>
          </CardHeader>
          <CardContent>
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
              <Button type="submit" className="w-full bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700" disabled={isLoggingIn}>
                {isLoggingIn ? "Accesso in corso..." : (
                  <><Lock className="h-4 w-4 mr-2" />Accedi</>
                )}
              </Button>
            </form>
            <div className="mt-4 text-center">
              <Link href="/portale-collaboratori">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Portale Collaboratori
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Caricamento...</p>
        </div>
      </div>
    );
  }

  const lastTimbratura = getLastTimbratura();
  const todayTimbrature = getTodayTimbrature();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center">
              <User className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-semibold">{user.nome} {user.cognome}</h1>
              <p className="text-sm text-muted-foreground">{user.reparto || "Collaboratore"}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-8">
        <Card className="mb-6">
          <CardContent className="pt-6 text-center">
            <p className="text-5xl font-mono font-bold text-green-600 dark:text-green-400">
              {currentTime.toLocaleTimeString("it-IT")}
            </p>
            <p className="text-muted-foreground mt-2">
              {currentTime.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Posizione GPS
            </CardTitle>
          </CardHeader>
          <CardContent>
            {location ? (
              <div className="text-sm">
                <p className="text-green-600 dark:text-green-400 font-medium">Posizione rilevata</p>
                {location.address && <p className="text-muted-foreground mt-1">{location.address}</p>}
              </div>
            ) : (
              <Button variant="outline" size="sm" onClick={getLocation} disabled={gettingLocation}>
                {gettingLocation ? "Rilevamento..." : "Rileva posizione"}
              </Button>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <Button
            size="lg"
            className="h-24 text-lg bg-green-600 hover:bg-green-700"
            onClick={() => handleTimbratura("entrata")}
            disabled={isTimbrating}
          >
            <LogIn className="h-6 w-6 mr-2" />
            Entrata
          </Button>
          <Button
            size="lg"
            className="h-24 text-lg bg-red-600 hover:bg-red-700"
            onClick={() => handleTimbratura("uscita")}
            disabled={isTimbrating}
          >
            <LogOut className="h-6 w-6 mr-2" />
            Uscita
          </Button>
        </div>

        {lastTimbratura && (
          <Card className="mb-6 bg-muted/50">
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground">Ultima timbratura</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={lastTimbratura.tipo === "entrata" ? "default" : "secondary"}>
                  {lastTimbratura.tipo === "entrata" ? "Entrata" : "Uscita"}
                </Badge>
                <span className="font-mono">
                  {new Date(lastTimbratura.dataOra).toLocaleTimeString("it-IT")}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Timbrature di oggi</CardTitle>
          </CardHeader>
          <CardContent>
            {todayTimbrature.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Nessuna timbratura oggi</p>
            ) : (
              <div className="space-y-2">
                {todayTimbrature.map((t) => (
                  <div key={t.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <Badge variant={t.tipo === "entrata" ? "default" : "secondary"}>
                      {t.tipo === "entrata" ? "Entrata" : "Uscita"}
                    </Badge>
                    <span className="font-mono text-sm">
                      {new Date(t.dataOra).toLocaleTimeString("it-IT")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <Link href="/portale-collaboratori">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Vai al Portale Collaboratori
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
