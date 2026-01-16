import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2, Lock, User, Mail, CheckCircle, Eye, EyeOff, KeyRound, Settings, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export default function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
  const [clientIP, setClientIP] = useState<string>("");
  const [inactivityTimer, setInactivityTimer] = useState<number | null>(null);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [recoverySent, setRecoverySent] = useState(false);
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [serverStatus, setServerStatus] = useState<"checking" | "online" | "offline">("checking");
  const [onlineUsers, setOnlineUsers] = useState<number | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => {
    return localStorage.getItem("pulse_remember_me") === "true";
  });
  
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [changePasswordUsername, setChangePasswordUsername] = useState("");
  const [currentPasswordForChange, setCurrentPasswordForChange] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);
  const [changePasswordError, setChangePasswordError] = useState("");
  const [changePasswordSuccess, setChangePasswordSuccess] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [setupConfirmOpen, setSetupConfirmOpen] = useState(false);
  const [setupLoading, setSetupLoading] = useState(false);
  const [setupConfirmText, setSetupConfirmText] = useState("");
  const [cacheClearing, setCacheClearing] = useState(true);
  const [cacheProgress, setCacheProgress] = useState(0);
  const [cacheStep, setCacheStep] = useState("");

  // Auto clear cache on page load
  useEffect(() => {
    const clearCache = async () => {
      setCacheClearing(true);
      setCacheProgress(0);
      
      // Step 1: Clear caches API
      setCacheStep("1. Pulizia cache...");
      setCacheProgress(33);
      if ('caches' in window) {
        try {
          const names = await caches.keys();
          await Promise.all(names.map(name => caches.delete(name)));
        } catch (e) {
          console.log('Cache clear:', e);
        }
      }
      
      await new Promise(r => setTimeout(r, 400));
      
      // Step 2: Clear localStorage (except remember me settings)
      setCacheStep("2. Ottimizzazione memoria...");
      setCacheProgress(66);
      const rememberMeSetting = localStorage.getItem("pulse_remember_me");
      const savedUser = localStorage.getItem("pulse_saved_username");
      localStorage.clear();
      if (rememberMeSetting) localStorage.setItem("pulse_remember_me", rememberMeSetting);
      if (savedUser) localStorage.setItem("pulse_saved_username", savedUser);
      
      await new Promise(r => setTimeout(r, 400));
      
      // Step 3: Clear sessionStorage
      setCacheStep("3. Completamento...");
      setCacheProgress(100);
      sessionStorage.clear();
      
      await new Promise(r => setTimeout(r, 500));
      setCacheClearing(false);
    };
    
    clearCache();
  }, []);

  // Load saved username on mount or auto-fill by IP
  useEffect(() => {
    const loadUserByIP = async () => {
      try {
        const res = await fetch("/api/users/by-ip");
        if (res.ok) {
          const data = await res.json();
          if (data.username) {
            setUsername(data.username);
            return;
          }
        }
      } catch {}
      
      // Fallback to saved username
      if (rememberMe) {
        const savedUsername = localStorage.getItem("pulse_saved_username");
        if (savedUsername) {
          setUsername(savedUsername);
        }
      }
    };
    
    loadUserByIP();
  }, [rememberMe]);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour >= 5 && hour < 12) return "Buongiorno";
    if (hour >= 12 && hour < 18) return "Buon pomeriggio";
    if (hour >= 18 && hour < 22) return "Buonasera";
    return "Buonanotte";
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetch("https://api.ipify.org?format=json")
      .then(res => res.json())
      .then(data => setClientIP(data.ip))
      .catch(() => setClientIP("N/A"));
  }, []);

  useEffect(() => {
    const checkServer = async () => {
      try {
        const res = await fetch("/api/setup/status");
        if (res.ok) {
          setServerStatus("online");
        } else {
          setServerStatus("offline");
        }
      } catch {
        setServerStatus("offline");
      }
    };
    
    checkServer();
    const interval = setInterval(checkServer, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchOnlineUsers = async () => {
      try {
        const res = await fetch("/api/online-users");
        if (res.ok) {
          const data = await res.json();
          setOnlineUsers(data.count);
        }
      } catch {
        setOnlineUsers(null);
      }
    };
    
    fetchOnlineUsers();
    const interval = setInterval(fetchOnlineUsers, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (username && !password) {
      const timer = window.setTimeout(() => {
        setUsername("");
        setPassword("");
        setInactivityTimer(null);
      }, 10000);
      setInactivityTimer(timer);
      return () => window.clearTimeout(timer);
    } else if (password) {
      if (inactivityTimer) {
        window.clearTimeout(inactivityTimer);
        setInactivityTimer(null);
      }
    }
  }, [username, password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    
    const currentUsername = username;
    const currentPassword = password;
    
    // Save remember me preference (only username for security)
    if (rememberMe) {
      localStorage.setItem("pulse_remember_me", "true");
      localStorage.setItem("pulse_saved_username", currentUsername);
    } else {
      localStorage.removeItem("pulse_remember_me");
      localStorage.removeItem("pulse_saved_username");
    }
    
    const result = await login(currentUsername, currentPassword);
    
    if (!result.success) {
      setError(result.error || "Login fallito");
      setPassword("");
    } else {
      setUsername("");
      setPassword("");
    }
    
    setIsLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryLoading(true);
    
    // Simula invio email (in produzione collegare a un vero servizio email)
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setRecoveryLoading(false);
    setRecoverySent(true);
  };

  const closeForgotPassword = () => {
    setForgotPasswordOpen(false);
    setRecoveryEmail("");
    setRecoverySent(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangePasswordError("");
    
    if (newPassword !== confirmNewPassword) {
      setChangePasswordError("Le password non coincidono");
      return;
    }
    
    if (newPassword.length < 4) {
      setChangePasswordError("La nuova password deve avere almeno 4 caratteri");
      return;
    }
    
    setChangePasswordLoading(true);
    
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: changePasswordUsername,
          currentPassword: currentPasswordForChange,
          newPassword: newPassword,
        }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setChangePasswordError(data.error || "Errore durante il cambio password");
      } else {
        setChangePasswordSuccess(true);
      }
    } catch (error) {
      setChangePasswordError("Errore di connessione");
    }
    
    setChangePasswordLoading(false);
  };

  const closeChangePassword = () => {
    setChangePasswordOpen(false);
    setChangePasswordUsername("");
    setCurrentPasswordForChange("");
    setNewPassword("");
    setConfirmNewPassword("");
    setChangePasswordError("");
    setChangePasswordSuccess(false);
  };

  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-indigo-950 flex items-center justify-center p-4">
      <style>{`
        @keyframes heartbeat {
          0% { transform: scale(1); }
          14% { transform: scale(1.15); }
          28% { transform: scale(1); }
          42% { transform: scale(1.15); }
          70% { transform: scale(1); }
        }
        .heartbeat {
          animation: heartbeat 1s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% { 
            transform: scale(1);
            box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.4);
          }
          50% { 
            transform: scale(1.05);
            box-shadow: 0 0 20px 5px rgba(37, 99, 235, 0.2);
          }
        }
        .pulse-icon {
          animation: pulse 2s ease-in-out infinite;
        }
        @keyframes inputPulse {
          0%, 100% { 
            box-shadow: 0 0 0 0 rgba(253, 224, 71, 0.4);
          }
          50% { 
            box-shadow: 0 0 12px 3px rgba(253, 224, 71, 0.6);
          }
        }
        .pulse-input {
          animation: inputPulse 2s ease-in-out infinite;
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes bounce-subtle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        @keyframes glow-new {
          0%, 100% { 
            box-shadow: 0 0 5px rgba(34, 197, 94, 0.5), 0 0 10px rgba(34, 197, 94, 0.3);
          }
          50% { 
            box-shadow: 0 0 15px rgba(34, 197, 94, 0.8), 0 0 25px rgba(34, 197, 94, 0.5);
          }
        }
        .new-badge {
          background: linear-gradient(90deg, #22c55e, #4ade80, #22c55e);
          background-size: 200% auto;
          animation: shimmer 2s linear infinite, bounce-subtle 2s ease-in-out infinite, glow-new 2s ease-in-out infinite;
        }
        @keyframes sparkle {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.1); }
        }
        .sparkle {
          animation: sparkle 1.5s ease-in-out infinite;
        }
      `}</style>
      
      <Card className="w-full max-w-md shadow-xl border-0 bg-[#F5F0E6]">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center mb-4 pulse-icon">
            <span className="text-2xl font-bold text-white">PE</span>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">PULSE ERP</CardTitle>
          <div className="flex items-center justify-center gap-2 mt-1">
            <p className="text-sm font-bold text-blue-600">v5.0</p>
            <span className="new-badge text-xs font-bold text-white px-2 py-0.5 rounded-full">
              NEW
            </span>
          </div>
          <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
            <p>IP: {clientIP || "..."}</p>
            <p>{currentTime.toLocaleDateString("it-IT")} - {currentTime.toLocaleTimeString("it-IT")}</p>
            <div className="flex items-center justify-center gap-3 mt-1">
              <div className="flex items-center gap-1.5">
                <span 
                  className={`w-2 h-2 rounded-full ${
                    serverStatus === "checking" 
                      ? "bg-yellow-500 animate-pulse" 
                      : serverStatus === "online" 
                        ? "bg-green-500" 
                        : "bg-red-500"
                  }`}
                />
                <span className={
                  serverStatus === "checking" 
                    ? "text-yellow-600" 
                    : serverStatus === "online" 
                      ? "text-green-600" 
                      : "text-red-600"
                }>
                  {serverStatus === "checking" ? "Verifica..." : serverStatus === "online" ? "Online" : "Offline"}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-blue-600">
                  {onlineUsers !== null ? `${onlineUsers} utent${onlineUsers === 1 ? 'e' : 'i'}` : "..."}
                </span>
              </div>
            </div>
          </div>
          <p className="text-muted-foreground mt-2">{getGreeting()}! Accedi al tuo workspace</p>
          <div className="flex items-center justify-center gap-3 mt-1">
            <button
              type="button"
              onClick={() => setForgotPasswordOpen(true)}
              className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
            >
              Password dimenticata?
            </button>
            <span className="text-xs text-muted-foreground">|</span>
            <button
              type="button"
              onClick={() => {
                setChangePasswordUsername(username);
                setChangePasswordOpen(true);
              }}
              className="text-xs text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
            >
              <KeyRound className="h-3 w-3" />
              Cambia password
            </button>
            <span className="text-xs text-muted-foreground">|</span>
            <button
              type="button"
              onClick={() => setSetupConfirmOpen(true)}
              className="text-xs text-orange-600 hover:text-orange-800 hover:underline flex items-center gap-1"
            >
              <Settings className="h-3 w-3" />
              Setup
            </button>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off" data-form-type="other" data-lpignore="true" data-1p-ignore="true" data-bwignore="true" data-dashlane-noautofill="true">
            {/* Hidden fields to trick browser password manager */}
            <input type="text" name="fake_user" style={{ display: 'none', position: 'absolute', opacity: 0, pointerEvents: 'none' }} tabIndex={-1} autoComplete="username" aria-hidden="true" />
            <input type="password" name="fake_pass" style={{ display: 'none', position: 'absolute', opacity: 0, pointerEvents: 'none' }} tabIndex={-1} autoComplete="current-password" aria-hidden="true" />
            
            <div className="space-y-2">
              <Label htmlFor="pulse_user_field" className="text-sm font-medium">
                Nome utente
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="pulse_user_field"
                  name="pulse_user_field_nopwd"
                  type="text"
                  placeholder="Inserisci il nome utente"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10 focus:bg-yellow-100 pulse-input"
                  style={{ backgroundColor: '#fef9c3' }}
                  required
                  disabled={isLoading}
                  autoComplete="nope"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  autoFocus
                  data-lpignore="true"
                  data-1p-ignore="true"
                  data-form-type="other"
                  data-bwignore="true"
                  data-dashlane-noautofill="true"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pulse_pass_field" className="text-sm font-medium">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="pulse_pass_field"
                  name="pulse_pass_field_nopwd"
                  type={showPassword ? "text" : "password"}
                  placeholder="Inserisci la password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  required
                  disabled={isLoading}
                  autoComplete="nope"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  data-lpignore="true"
                  data-1p-ignore="true"
                  data-form-type="other"
                  data-bwignore="true"
                  data-dashlane-noautofill="true"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="remember-me"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-border text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <label 
                htmlFor="remember-me" 
                className="text-sm text-muted-foreground cursor-pointer select-none"
              >
                Ricordami
              </label>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100">
                {error}
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700" 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Accesso in corso...
                </>
              ) : (
                "Accedi"
              )}
            </Button>
          </form>
          
          {/* Cache Clear Section */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            {cacheClearing ? (
              <div className="space-y-3">
                <p className="text-xs text-center text-muted-foreground">
                  {cacheStep || "Avvio..."}
                </p>
                <div className="relative h-6 w-full bg-gray-200 rounded-lg overflow-hidden border border-gray-300 shadow-inner">
                  <div 
                    className="h-full transition-all duration-300 ease-out"
                    style={{
                      width: `${cacheProgress}%`,
                      background: 'linear-gradient(180deg, #60a5fa 0%, #3b82f6 50%, #2563eb 100%)',
                      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3), inset 0 -1px 0 rgba(0,0,0,0.1)'
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-bold text-gray-700 drop-shadow-sm">
                      {cacheProgress}%
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="h-1 w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full mb-4" />
                <div className="text-center">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                    onClick={() => {
                      if (window.confirm('Sei sicuro di voler chiudere PULSE ERP?')) {
                        window.close();
                        window.location.href = 'about:blank';
                      }
                    }}
                  >
                    ✕ Chiudi Software
                  </Button>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={forgotPasswordOpen} onOpenChange={closeForgotPassword}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Recupera Password</DialogTitle>
            <DialogDescription>
              Inserisci la tua email per ricevere le istruzioni di recupero.
            </DialogDescription>
          </DialogHeader>
          
          {!recoverySent ? (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="recovery-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="recovery-email"
                    type="email"
                    placeholder="nome@azienda.com"
                    value={recoveryEmail}
                    onChange={(e) => setRecoveryEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={closeForgotPassword} className="flex-1">
                  Annulla
                </Button>
                <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700" disabled={recoveryLoading}>
                  {recoveryLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Invio...
                    </>
                  ) : (
                    "Invia"
                  )}
                </Button>
              </div>
            </form>
          ) : (
            <div className="text-center py-6">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Email Inviata!</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Abbiamo inviato le istruzioni per il recupero password a <strong>{recoveryEmail}</strong>
              </p>
              <Button onClick={closeForgotPassword} className="bg-blue-600 hover:bg-blue-700">
                Torna al Login
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={changePasswordOpen} onOpenChange={closeChangePassword}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5" />
              Cambia Password
            </DialogTitle>
            <DialogDescription>
              Inserisci le tue credenziali per cambiare la password.
            </DialogDescription>
          </DialogHeader>
          
          {!changePasswordSuccess ? (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="change-username">Nome utente</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="change-username"
                    type="text"
                    placeholder="Inserisci il nome utente"
                    value={changePasswordUsername}
                    className="pl-10 bg-muted cursor-not-allowed"
                    readOnly
                    disabled
                    required
                  />
                </div>
                {!changePasswordUsername && (
                  <p className="text-xs text-amber-600">
                    Inserisci prima il nome utente nel campo di login
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="current-password">Password attuale</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="current-password"
                    type={showCurrentPassword ? "text" : "password"}
                    placeholder="Inserisci la password attuale"
                    value={currentPasswordForChange}
                    onChange={(e) => setCurrentPasswordForChange(e.target.value)}
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">Nuova password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="new-password"
                    type={showNewPassword ? "text" : "password"}
                    placeholder="Inserisci la nuova password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Conferma nuova password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirm-password"
                    type={showNewPassword ? "text" : "password"}
                    placeholder="Conferma la nuova password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              
              {changePasswordError && (
                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100">
                  {changePasswordError}
                </div>
              )}
              
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={closeChangePassword} className="flex-1">
                  Annulla
                </Button>
                <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700" disabled={changePasswordLoading}>
                  {changePasswordLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Cambio...
                    </>
                  ) : (
                    "Cambia Password"
                  )}
                </Button>
              </div>
            </form>
          ) : (
            <div className="text-center py-6">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Password Cambiata!</h3>
              <p className="text-sm text-muted-foreground mb-4">
                La tua password è stata cambiata con successo. Ora puoi accedere con la nuova password.
              </p>
              <Button onClick={closeChangePassword} className="bg-blue-600 hover:bg-blue-700">
                Torna al Login
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Setup Confirmation Dialog */}
      <Dialog open={setupConfirmOpen} onOpenChange={(open) => {
        setSetupConfirmOpen(open);
        if (!open) setSetupConfirmText("");
      }}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-orange-600">
              <AlertTriangle className="h-5 w-5" />
              Avvia Configurazione Sistema
            </DialogTitle>
            <DialogDescription>
              Questa operazione resetterà il sistema e avvierà il wizard di configurazione iniziale. 
              Dovrai creare un nuovo account amministratore.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm text-orange-800">
            <strong>Attenzione:</strong> Usa questa opzione solo se non riesci ad accedere al sistema 
            o se è la prima configurazione dopo un reset del database.
          </div>
          <div className="space-y-2 mt-4">
            <Label htmlFor="setup-confirm-text" className="text-sm font-medium">
              Digita <span className="font-bold text-orange-600">RESET</span> per confermare:
            </Label>
            <Input
              id="setup-confirm-text"
              type="text"
              placeholder="Digita RESET"
              value={setupConfirmText}
              onChange={(e) => setSetupConfirmText(e.target.value.toUpperCase())}
              className="text-center font-mono"
              disabled={setupLoading}
            />
          </div>
          <div className="flex gap-2 mt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                setSetupConfirmOpen(false);
                setSetupConfirmText("");
              }} 
              className="flex-1"
              disabled={setupLoading}
            >
              Annulla
            </Button>
            <Button 
              type="button" 
              className="flex-1 bg-orange-600 hover:bg-orange-700"
              disabled={setupLoading || setupConfirmText !== "RESET"}
              onClick={async () => {
                if (setupConfirmText !== "RESET") return;
                setSetupLoading(true);
                try {
                  const res = await fetch("/api/setup/reset-now", { 
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ confirmCode: setupConfirmText })
                  });
                  if (res.ok) {
                    setSetupConfirmOpen(false);
                    setSetupConfirmText("");
                    window.location.reload();
                  } else {
                    const data = await res.json();
                    alert(data.error || "Errore durante il reset del setup. Riprova.");
                  }
                } catch (e) {
                  alert("Errore di connessione. Verifica che il server sia online.");
                } finally {
                  setSetupLoading(false);
                }
              }}
            >
              {setupLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Reset...
                </>
              ) : (
                <>
                  <Settings className="mr-2 h-4 w-4" />
                  Avvia Setup
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
