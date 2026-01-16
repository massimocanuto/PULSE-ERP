import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, Mail, Server, Lock, CheckCircle, XCircle, Settings } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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

interface EmailConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfigured?: () => void;
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

export function EmailConfigDialog({ open, onOpenChange, onConfigured }: EmailConfigDialogProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
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

  const { data: existingConfig } = useQuery({
    queryKey: ["user-email-config"],
    queryFn: async () => {
      if (!user?.id) return null;
      const res = await fetch("/api/user-email-config", {
        headers: {
          "x-user-id": user.id
        }
      });
      if (!res.ok) throw new Error("Failed to fetch config");
      const data = await res.json();
      // Backend returns an array, frontend expects checking if one exists for "personal config"
      return Array.isArray(data) && data.length > 0 ? data[0] : null;
    },
  });

  useEffect(() => {
    if (open) {
      if (existingConfig && existingConfig.emailAddress) {
        setConfig({
          ...existingConfig,
          password: "",
        });
      } else {
        // Reset to default if no existing config or creating new
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
        setSelectedPreset("aruba");
      }
      setTestResult(null);
    }
  }, [open, existingConfig]);

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
      password: "", // Reset password on preset change usually not needed but safer
    }));
  };

  const testMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/user-email-config/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(user?.id ? { "x-user-id": user.id } : {})
        },
        body: JSON.stringify(config),
      });
      return res.json();
    },
    onSuccess: (data) => {
      setTestResult(data);
    },
    onError: (error: any) => {
      setTestResult({ success: false, message: error.message });
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const isEdit = !!existingConfig?.id;
      const url = isEdit
        ? `/api/user-email-config/${existingConfig.id}`
        : "/api/user-email-config";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(user?.id ? { "x-user-id": user.id } : {})
        },
        body: JSON.stringify(config),
      });
      if (!res.ok) {
        const errorData = await res.json();
        const errorMessage = typeof errorData.error === 'object'
          ? JSON.stringify(errorData.error)
          : errorData.error || "Failed to save";
        throw new Error(errorMessage);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-email-config"] });
      onOpenChange(false);
      onConfigured?.();
    },
    onError: (error: any) => {
      setTestResult({ success: false, message: error.message });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!existingConfig?.id) throw new Error("No config to delete");
      const res = await fetch(`/api/user-email-config/${existingConfig.id}`, {
        method: "DELETE",
        headers: {
          ...(user?.id ? { "x-user-id": user.id } : {})
        }
      });
      if (!res.ok) throw new Error("Failed to delete");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-email-config"] });
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
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configura Account Email
          </DialogTitle>
          <DialogDescription>
            Configura il tuo account email personale per inviare e ricevere messaggi.
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
                  placeholder={existingConfig?.emailAddress ? "••••••••" : "La tua password"}
                  value={config.password}
                  onChange={(e) => setConfig({ ...config, password: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayName">Nome Visualizzato (opzionale)</Label>
              <Input
                id="displayName"
                placeholder="Il tuo nome"
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
                    <Label>Host IMAP</Label>
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
                  <Label>Usa SSL/TLS</Label>
                </div>

                <h4 className="font-medium flex items-center gap-2 pt-4">
                  <Server className="h-4 w-4" />
                  Server SMTP (Invio)
                </h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2 space-y-2">
                    <Label>Host SMTP</Label>
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
                  <Label>Usa SSL/TLS</Label>
                </div>
              </div>
            )}

            {testResult && (
              <div className={`p-4 rounded-lg flex items-center gap-3 ${testResult.success ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                {testResult.success ? <CheckCircle className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                <span>{testResult.message}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-between pt-4 border-t">
          <div>
            {existingConfig?.emailAddress && (
              <Button
                variant="destructive"
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Rimuovi Configurazione
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => testMutation.mutate()}
              disabled={!config.emailAddress || !config.password || testMutation.isPending}
            >
              {testMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Testa Connessione
            </Button>
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={!config.emailAddress || (!config.password && !existingConfig?.emailAddress) || saveMutation.isPending}
            >
              {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Salva Configurazione
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
