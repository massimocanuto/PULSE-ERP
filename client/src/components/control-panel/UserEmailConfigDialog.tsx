import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, Mail, Server, Lock, CheckCircle, XCircle, Settings } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

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

interface UserEmailConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
}

const EMAIL_PRESETS = {
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

export function UserEmailConfigDialog({ open, onOpenChange, userId, userName }: UserEmailConfigDialogProps) {
  const queryClient = useQueryClient();
  const [selectedPreset, setSelectedPreset] = useState<keyof typeof EMAIL_PRESETS>("aruba");
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [config, setConfig] = useState<EmailConfig>({
    emailAddress: "",
    imapHost: EMAIL_PRESETS.aruba.imapHost,
    imapPort: EMAIL_PRESETS.aruba.imapPort,
    imapSecure: EMAIL_PRESETS.aruba.imapSecure,
    smtpHost: EMAIL_PRESETS.aruba.smtpHost,
    smtpPort: EMAIL_PRESETS.aruba.smtpPort,
    smtpSecure: EMAIL_PRESETS.aruba.smtpSecure,
    password: "",
    displayName: "",
    signature: "",
  });

  const { data: existingConfig, refetch } = useQuery({
    queryKey: ["user-email-config", userId],
    queryFn: async () => {
      const res = await fetch(`/api/user-email-config/${userId}`);
      if (!res.ok) return null;
      return res.json() as Promise<EmailConfig | null>;
    },
    enabled: !!userId && open,
  });

  useEffect(() => {
    if (existingConfig) {
      setConfig({
        ...existingConfig,
        password: "",
      });
      const matchingPreset = Object.entries(EMAIL_PRESETS).find(
        ([_, preset]) => preset.imapHost === existingConfig.imapHost
      );
      if (matchingPreset) {
        setSelectedPreset(matchingPreset[0] as keyof typeof EMAIL_PRESETS);
      } else {
        setSelectedPreset("custom");
      }
    }
  }, [existingConfig]);

  const handlePresetChange = (preset: keyof typeof EMAIL_PRESETS) => {
    setSelectedPreset(preset);
    const presetConfig = EMAIL_PRESETS[preset];
    setConfig(prev => ({
      ...prev,
      imapHost: presetConfig.imapHost,
      imapPort: presetConfig.imapPort,
      imapSecure: presetConfig.imapSecure,
      smtpHost: presetConfig.smtpHost,
      smtpPort: presetConfig.smtpPort,
      smtpSecure: presetConfig.smtpSecure,
    }));
  };

  const testMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/email/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      return res.json();
    },
    onSuccess: (data) => {
      setTestResult(data);
    },
    onError: () => {
      setTestResult({ success: false, message: "Errore durante il test della connessione" });
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/user-email-config/${userId}`, {
        method: existingConfig ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...config, userId }),
      });
      if (!res.ok) throw new Error("Errore nel salvataggio");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-email-config", userId] });
      refetch();
      onOpenChange(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/user-email-config/${userId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Errore nella rimozione");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-email-config", userId] });
      setConfig({
        emailAddress: "",
        imapHost: EMAIL_PRESETS.aruba.imapHost,
        imapPort: EMAIL_PRESETS.aruba.imapPort,
        imapSecure: EMAIL_PRESETS.aruba.imapSecure,
        smtpHost: EMAIL_PRESETS.aruba.smtpHost,
        smtpPort: EMAIL_PRESETS.aruba.smtpPort,
        smtpSecure: EMAIL_PRESETS.aruba.smtpSecure,
        password: "",
        displayName: "",
        signature: "",
      });
      setTestResult(null);
      refetch();
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configura Email per {userName}
          </DialogTitle>
          <DialogDescription>
            Configura l'account email per questo utente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label>Provider Email</Label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {Object.entries(EMAIL_PRESETS).map(([key, preset]) => (
                <Button
                  key={key}
                  variant={selectedPreset === key ? "default" : "outline"}
                  size="sm"
                  className="text-xs"
                  onClick={() => handlePresetChange(key as keyof typeof EMAIL_PRESETS)}
                >
                  {preset.name}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="emailAddress">
                  <Mail className="h-4 w-4 inline mr-2" />
                  Indirizzo Email
                </Label>
                <Input
                  id="emailAddress"
                  type="email"
                  placeholder="tuoemail@esempio.it"
                  value={config.emailAddress}
                  onChange={(e) => setConfig({ ...config, emailAddress: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">
                  <Lock className="h-4 w-4 inline mr-2" />
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder={existingConfig?.emailAddress ? "••••••••" : "La password dell'email"}
                  value={config.password}
                  onChange={(e) => setConfig({ ...config, password: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayName">Nome Visualizzato (opzionale)</Label>
              <Input
                id="displayName"
                placeholder="Il nome da mostrare"
                value={config.displayName || ""}
                onChange={(e) => setConfig({ ...config, displayName: e.target.value })}
              />
            </div>

            {selectedPreset === "custom" && (
              <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
                <h4 className="font-medium flex items-center gap-2">
                  <Server className="h-4 w-4" />
                  Server IMAP (Ricezione)
                </h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2 space-y-2">
                    <Label>Host</Label>
                    <Input
                      placeholder="imap.esempio.it"
                      value={config.imapHost}
                      onChange={(e) => setConfig({ ...config, imapHost: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Porta</Label>
                    <Input
                      type="number"
                      value={config.imapPort}
                      onChange={(e) => setConfig({ ...config, imapPort: parseInt(e.target.value) })}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={config.imapSecure}
                    onCheckedChange={(checked) => setConfig({ ...config, imapSecure: checked })}
                  />
                  <Label>SSL/TLS</Label>
                </div>

                <h4 className="font-medium flex items-center gap-2 pt-4">
                  <Server className="h-4 w-4" />
                  Server SMTP (Invio)
                </h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2 space-y-2">
                    <Label>Host</Label>
                    <Input
                      placeholder="smtp.esempio.it"
                      value={config.smtpHost}
                      onChange={(e) => setConfig({ ...config, smtpHost: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Porta</Label>
                    <Input
                      type="number"
                      value={config.smtpPort}
                      onChange={(e) => setConfig({ ...config, smtpPort: parseInt(e.target.value) })}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={config.smtpSecure}
                    onCheckedChange={(checked) => setConfig({ ...config, smtpSecure: checked })}
                  />
                  <Label>SSL/TLS</Label>
                </div>
              </div>
            )}
          </div>

          {testResult && (
            <div className={`p-3 rounded-lg flex items-center gap-2 ${testResult.success ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {testResult.success ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
              {testResult.message}
            </div>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => testMutation.mutate()}
              disabled={testMutation.isPending || !config.emailAddress || !config.password}
            >
              {testMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Testa Connessione
            </Button>
            <Button
              className="flex-1"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending || !config.emailAddress}
            >
              {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Salva Configurazione
            </Button>
          </div>

          {existingConfig && (
            <Button
              variant="destructive"
              className="w-full"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Rimuovi Configurazione
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
