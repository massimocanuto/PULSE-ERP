import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Mail, Server, Lock, CheckCircle, XCircle, Save, Trash2, Wand2, PenLine, Plus, ArrowLeft, MailQuestion, Eye, EyeOff } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface EmailConfig {
  id?: string;
  userId?: string;
  emailAddress: string;
  imapHost: string;
  imapPort: number;
  imapSecure: boolean;
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  password: string;
  displayName?: string;
  signature?: string;
  isActive?: boolean;
}

const EMAIL_PRESETS: Record<string, { name: string; imapHost: string; imapPort: number; imapSecure: boolean; smtpHost: string; smtpPort: number; smtpSecure: boolean }> = {
  aruba: {
    name: "Aruba",
    imapHost: "imaps.aruba.it",
    imapPort: 993,
    imapSecure: true,
    smtpHost: "smtps.aruba.it",
    smtpPort: 465,
    smtpSecure: true,
  },
  arubaPec: {
    name: "Aruba PEC",
    imapHost: "imaps.pec.aruba.it",
    imapPort: 993,
    imapSecure: true,
    smtpHost: "smtps.pec.aruba.it",
    smtpPort: 465,
    smtpSecure: true,
  },
  gmail: {
    name: "Gmail",
    imapHost: "imap.gmail.com",
    imapPort: 993,
    imapSecure: true,
    smtpHost: "smtp.gmail.com",
    smtpPort: 465,
    smtpSecure: true,
  },
  outlook: {
    name: "Outlook",
    imapHost: "outlook.office365.com",
    imapPort: 993,
    imapSecure: true,
    smtpHost: "smtp.office365.com",
    smtpPort: 587,
    smtpSecure: false,
  },
  libero: {
    name: "Libero",
    imapHost: "imapmail.libero.it",
    imapPort: 993,
    imapSecure: true,
    smtpHost: "smtp.libero.it",
    smtpPort: 465,
    smtpSecure: true,
  },
  virgilio: {
    name: "Virgilio",
    imapHost: "imap.virgilio.it",
    imapPort: 993,
    imapSecure: true,
    smtpHost: "out.virgilio.it",
    smtpPort: 465,
    smtpSecure: true,
  },
  tim: {
    name: "TIM / Alice",
    imapHost: "imap.tim.it",
    imapPort: 993,
    imapSecure: true,
    smtpHost: "smtp.tim.it",
    smtpPort: 465,
    smtpSecure: true,
  },
  yahoo: {
    name: "Yahoo",
    imapHost: "imap.mail.yahoo.com",
    imapPort: 993,
    imapSecure: true,
    smtpHost: "smtp.mail.yahoo.com",
    smtpPort: 465,
    smtpSecure: true,
  },
  icloud: {
    name: "iCloud",
    imapHost: "imap.mail.me.com",
    imapPort: 993,
    imapSecure: true,
    smtpHost: "smtp.mail.me.com",
    smtpPort: 587,
    smtpSecure: false,
  },
  register: {
    name: "Register.it",
    imapHost: "imap.register.it",
    imapPort: 993,
    imapSecure: true,
    smtpHost: "smtp.register.it",
    smtpPort: 465,
    smtpSecure: true,
  },
  legalmail: {
    name: "Legalmail PEC",
    imapHost: "mbox.cert.legalmail.it",
    imapPort: 993,
    imapSecure: true,
    smtpHost: "sendm.cert.legalmail.it",
    smtpPort: 465,
    smtpSecure: true,
  },
  custom: {
    name: "Personalizzato",
    imapHost: "",
    imapPort: 993,
    imapSecure: true,
    smtpHost: "",
    smtpPort: 465,
    smtpSecure: true,
  },
};

export default function EmailSettingsPanel() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [selectedPreset, setSelectedPreset] = useState<string>("custom");
  const [testStatus, setTestStatus] = useState<"idle" | "testing" | "success" | "error">("idle");
  const [testError, setTestError] = useState<string>("");
  const [signatureEnabled, setSignatureEnabled] = useState(false);

  const [config, setConfig] = useState<EmailConfig>({
    emailAddress: "",
    imapHost: "",
    imapPort: 993,
    imapSecure: true,
    smtpHost: "",
    smtpPort: 465,
    smtpSecure: true,
    password: "",
    displayName: "",
    signature: "",
  });

  const { data: accounts, isLoading } = useQuery({
    queryKey: ["user-email-config"],
    queryFn: async () => {
      const res = await fetch("/api/user-email-config");
      if (!res.ok) return [];
      return res.json() as Promise<EmailConfig[]>;
    },
  });

  const generateAutoSignature = () => {
    if (!user) return;

    const parts = [];
    parts.push("--");
    if (user.name) parts.push(user.name);
    if (user.role) parts.push(user.role);
    if (user.department) parts.push(user.department);
    if (user.email) parts.push(user.email);
    parts.push("");
    parts.push("PULSE ERP");

    const signature = parts.join("\n");
    setConfig(prev => ({ ...prev, signature }));
    setSignatureEnabled(true);

    toast({
      title: "Firma generata",
      description: "La firma è stata creata automaticamente dal tuo profilo",
    });
  };

  const handlePresetChange = (preset: string) => {
    setSelectedPreset(preset);
    if (preset !== "custom" && EMAIL_PRESETS[preset]) {
      const p = EMAIL_PRESETS[preset];
      setConfig(prev => ({
        ...prev,
        imapHost: p.imapHost,
        imapPort: p.imapPort,
        imapSecure: p.imapSecure,
        smtpHost: p.smtpHost,
        smtpPort: p.smtpPort,
        smtpSecure: p.smtpSecure,
      }));
    }
  };

  const handleAddNew = () => {
    setConfig({
      emailAddress: "",
      imapHost: "",
      imapPort: 993,
      imapSecure: true,
      smtpHost: "",
      smtpPort: 465,
      smtpSecure: true,
      password: "",
      displayName: "",
      signature: "",
    });
    setEditingId(null);
    setIsEditing(true);
    setTestStatus("idle");
    setSignatureEnabled(false);
  };

  const handleEdit = (account: EmailConfig) => {
    setConfig({
      ...account,
      password: "", // Clear password for security, user must re-enter if changing
    });
    setEditingId(account.id || null);
    setIsEditing(true);
    setTestStatus("idle");
    setSignatureEnabled(!!account.signature);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditingId(null);
  };

  const saveMutation = useMutation({
    mutationFn: async (data: EmailConfig) => {
      const url = editingId
        ? `/api/user-email-config/${editingId}`
        : "/api/user-email-config";

      const method = editingId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Errore nel salvataggio");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-email-config"] });
      queryClient.invalidateQueries({ queryKey: ["aruba-emails"] });
      toast({
        title: "Configurazione salvata",
        description: "Le impostazioni email sono state aggiornate",
      });
      setIsEditing(false);
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Impossibile salvare la configurazione",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/user-email-config/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Errore nell'eliminazione");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-email-config"] });
      toast({
        title: "Account eliminato",
        description: "L'account email è stato rimosso correttamente",
      });
    },
  });

  const [showPassword, setShowPassword] = useState(false);

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const testConnection = async () => {
    if (!validateEmail(config.emailAddress)) {
      toast({
        title: "Indirizzo Email non valido",
        description: "Inserisci un indirizzo email valido (es. nome@dominio.it)",
        variant: "destructive",
      });
      return;
    }
    setTestStatus("testing");
    setTestError("");
    try {
      const res = await fetch("/api/user-email-config/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || data.error || "Connessione fallita");
      }
      setTestStatus("success");
      toast({
        title: "Test riuscito",
        description: "La connessione email funziona correttamente",
      });
    } catch (err: any) {
      setTestStatus("error");
      setTestError(err.message);
      toast({
        title: "Test fallito",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  const handleSave = () => {
    if (!validateEmail(config.emailAddress)) {
      toast({
        title: "Indirizzo Email non valido",
        description: "Inserisci un indirizzo email valido per proseguire.",
        variant: "destructive",
      });
      return;
    }
    if (!config.password && !editingId) {
      toast({
        title: "Password mancante",
        description: "La password è obbligatoria per una nuova configurazione.",
        variant: "destructive",
      });
      return;
    }
    saveMutation.mutate(config);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // LIST VIEW
  if (!isEditing) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Mail className="h-4 w-4" />
                  Account Email Configurati
                </CardTitle>
                <CardDescription className="text-xs">
                  Gestisci i tuoi account email per inviare e ricevere messaggi direttamente da PULSE.
                </CardDescription>
              </div>
              <Button onClick={handleAddNew}>
                <Plus className="h-4 w-4 mr-2" />
                Aggiungi Account
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {accounts && accounts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {accounts.map((account) => (
                  <Card key={account.id} className="overflow-hidden border-l-4 border-l-primary">
                    <CardHeader className="pb-2 bg-muted/20">
                      <CardTitle className="text-base font-medium flex items-center justify-between">
                        {account.displayName || "Account Email"}
                        {account.isActive && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full border border-green-200">
                            Attivo
                          </span>
                        )}
                      </CardTitle>
                      <CardDescription className="font-mono text-xs truncate">
                        {account.emailAddress}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-4 pb-2 text-sm text-muted-foreground space-y-1">
                      <div className="flex items-center gap-2">
                        <Server className="h-3 w-3" />
                        <span>IMAP: {account.imapHost}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Server className="h-3 w-3" />
                        <span>SMTP: {account.smtpHost}</span>
                      </div>
                    </CardContent>
                    <CardFooter className="bg-muted/10 p-2 flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(account)}>
                        <PenLine className="h-4 w-4 mr-1" /> Modifica
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => {
                          if (confirm("Sei sicuro di voler eliminare questo account?")) {
                            deleteMutation.mutate(account.id!);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-1" /> Elimina
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 border-2 border-dashed rounded-lg bg-muted/10">
                <MailQuestion className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <h3 className="text-lg font-medium">Nessun account configurato</h3>
                <p className="text-muted-foreground mb-4 max-w-sm mx-auto">
                  Collega il tuo account email per gestire la posta direttamente da qui.
                </p>
                <Button onClick={handleAddNew}>
                  <Plus className="h-4 w-4 mr-2" />
                  Configura il primo account
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // EDIT/ADD VIEW
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Button variant="ghost" size="sm" onClick={handleCancel}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Torna alla lista
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Mail className="h-4 w-4" />
            {editingId ? "Modifica Account Email" : "Nuova Configurazione Email"}
          </CardTitle>
          <CardDescription className="text-xs">
            {editingId
              ? "Aggiorna le impostazioni del tuo account."
              : "Inserisci i parametri del tuo provider email."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs">Provider Email</Label>
              <Select value={selectedPreset} onValueChange={handlePresetChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(EMAIL_PRESETS).map(([key, preset]) => (
                    <SelectItem key={key} value={key}>{preset.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="emailAddress" className="text-xs">Indirizzo Email</Label>
              <Input
                id="emailAddress"
                type="email"
                value={config.emailAddress}
                onChange={(e) => setConfig(prev => ({ ...prev, emailAddress: e.target.value }))}
                placeholder="email@esempio.it"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={config.password}
                  onChange={(e) => setConfig(prev => ({ ...prev, password: e.target.value }))}
                  placeholder={editingId ? "•••••••• (lascia vuoto per mantenere)" : "Password"}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="displayName" className="text-xs">Nome Visualizzato</Label>
              <Input
                id="displayName"
                value={config.displayName || ""}
                onChange={(e) => setConfig(prev => ({ ...prev, displayName: e.target.value }))}
                placeholder="Mario Rossi"
              />
            </div>
          </div>

          <div className="border rounded-lg p-4 space-y-4">
            <h4 className="font-medium flex items-center gap-2 text-sm">
              <Server className="h-3 w-3" />
              Server IMAP (Ricezione)
            </h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Host</Label>
                <Input
                  value={config.imapHost}
                  onChange={(e) => setConfig(prev => ({ ...prev, imapHost: e.target.value }))}
                  placeholder="imap.esempio.it"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Porta</Label>
                <Input
                  type="number"
                  value={config.imapPort}
                  onChange={(e) => setConfig(prev => ({ ...prev, imapPort: parseInt(e.target.value) || 993 }))}
                />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <Switch
                  checked={config.imapSecure}
                  onCheckedChange={(checked) => setConfig(prev => ({ ...prev, imapSecure: checked }))}
                />
                <Label className="text-xs">SSL/TLS</Label>
              </div>
            </div>
          </div>

          <div className="border rounded-lg p-4 space-y-4">
            <h4 className="font-medium flex items-center gap-2 text-sm">
              <Server className="h-3 w-3" />
              Server SMTP (Invio)
            </h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Host</Label>
                <Input
                  value={config.smtpHost}
                  onChange={(e) => setConfig(prev => ({ ...prev, smtpHost: e.target.value }))}
                  placeholder="smtp.esempio.it"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Porta</Label>
                <Input
                  type="number"
                  value={config.smtpPort}
                  onChange={(e) => setConfig(prev => ({ ...prev, smtpPort: parseInt(e.target.value) || 465 }))}
                />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <Switch
                  checked={config.smtpSecure}
                  onCheckedChange={(checked) => setConfig(prev => ({ ...prev, smtpSecure: checked }))}
                />
                <Label className="text-xs">SSL/TLS</Label>
              </div>
            </div>
          </div>

          <div className="space-y-4 p-4 border border-border rounded-lg bg-muted/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PenLine className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="signatureEnabled" className="font-medium">Firma Email Automatica</Label>
              </div>
              <Switch
                id="signatureEnabled"
                checked={signatureEnabled}
                onCheckedChange={(checked) => {
                  setSignatureEnabled(checked);
                  if (!checked) {
                    setConfig(prev => ({ ...prev, signature: "" }));
                  }
                }}
              />
            </div>

            {signatureEnabled && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={generateAutoSignature}
                  >
                    <Wand2 className="h-4 w-4 mr-2" />
                    Genera dal Profilo
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    Crea automaticamente la firma con i tuoi dati
                  </span>
                </div>
                <Textarea
                  id="signature"
                  value={config.signature || ""}
                  onChange={(e) => setConfig(prev => ({ ...prev, signature: e.target.value }))}
                  placeholder="--&#10;Nome Cognome&#10;Ruolo&#10;Email&#10;&#10;PULSE ERP"
                  rows={5}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Questa firma verrà aggiunta automaticamente a tutti i nuovi messaggi email.
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={testConnection}
              disabled={testStatus === "testing" || !config.emailAddress || !config.imapHost}
            >
              {testStatus === "testing" ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : testStatus === "success" ? (
                <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
              ) : testStatus === "error" ? (
                <XCircle className="h-4 w-4 mr-2 text-red-500" />
              ) : (
                <Lock className="h-4 w-4 mr-2" />
              )}
              Testa Connessione
            </Button>

            <Button
              onClick={handleSave}
              disabled={saveMutation.isPending || !config.emailAddress}
            >
              {saveMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {editingId ? "Aggiorna Configurazione" : "Salva Configurazione"}
            </Button>
          </div>

          {testStatus === "error" && testError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {testError}
            </div>
          )}

          {testStatus === "success" && (
            <div className="p-3 bg-green-50 border border-green-200 rounded text-green-700 text-sm">
              Connessione riuscita! L'account è configurato correttamente.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
