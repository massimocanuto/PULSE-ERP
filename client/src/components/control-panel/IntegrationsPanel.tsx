import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Calendar, 
  Mail, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Loader2,
  Send,
  Phone,
  ExternalLink,
  Settings
} from "lucide-react";

export default function IntegrationsPanel() {
  const { user } = useAuth();
  const userId = user?.id || "";

  const [calendarConnected, setCalendarConnected] = useState<boolean | null>(null);
  const [calendarLoading, setCalendarLoading] = useState(true);
  const [emailConnected, setEmailConnected] = useState<boolean | null>(null);
  const [emailLoading, setEmailLoading] = useState(true);
  const [telegramConnected, setTelegramConnected] = useState<boolean | null>(null);
  const [telegramLoading, setTelegramLoading] = useState(true);
  const [whatsappConnected, setWhatsappConnected] = useState<boolean | null>(null);
  const [whatsappLoading, setWhatsappLoading] = useState(true);

  const checkCalendarStatus = async () => {
    setCalendarLoading(true);
    try {
      const res = await fetch("/api/calendar/status");
      if (res.ok) {
        const data = await res.json();
        setCalendarConnected(data.connected);
      } else {
        setCalendarConnected(false);
      }
    } catch {
      setCalendarConnected(false);
    }
    setCalendarLoading(false);
  };

  const checkEmailStatus = async () => {
    setEmailLoading(true);
    try {
      const res = await fetch("/api/email/status");
      if (res.ok) {
        const data = await res.json();
        setEmailConnected(data.connected);
      } else {
        setEmailConnected(false);
      }
    } catch {
      setEmailConnected(false);
    }
    setEmailLoading(false);
  };

  const checkTelegramStatus = async () => {
    setTelegramLoading(true);
    try {
      const res = await fetch("/api/telegram/status");
      if (res.ok) {
        const data = await res.json();
        setTelegramConnected(data.connected);
      } else {
        setTelegramConnected(false);
      }
    } catch {
      setTelegramConnected(false);
    }
    setTelegramLoading(false);
  };

  const checkWhatsappStatus = async () => {
    setWhatsappLoading(true);
    try {
      const res = await fetch(`/api/whatsapp/status?userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setWhatsappConnected(data.connected);
      } else {
        setWhatsappConnected(false);
      }
    } catch {
      setWhatsappConnected(false);
    }
    setWhatsappLoading(false);
  };

  useEffect(() => {
    checkCalendarStatus();
    checkEmailStatus();
    checkTelegramStatus();
    if (userId) checkWhatsappStatus();
  }, [userId]);

  const integrations = [
    {
      id: "google-calendar",
      name: "Google Calendar",
      description: "Sincronizza le tue attività e progetti con Google Calendar",
      icon: Calendar,
      connected: calendarConnected,
      loading: calendarLoading,
      onRefresh: checkCalendarStatus,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      configuredViaReplit: true,
    },
    {
      id: "email",
      name: "Email (Aruba)",
      description: "Connetti la tua casella email per inviare e ricevere messaggi",
      icon: Mail,
      connected: emailConnected,
      loading: emailLoading,
      onRefresh: checkEmailStatus,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      configuredViaSecrets: true,
    },
    {
      id: "telegram",
      name: "Telegram Bot",
      description: "Ricevi notifiche e messaggi tramite Telegram",
      icon: Send,
      connected: telegramConnected,
      loading: telegramLoading,
      onRefresh: checkTelegramStatus,
      color: "text-sky-600",
      bgColor: "bg-sky-100",
      configuredViaSecrets: true,
    },
    {
      id: "whatsapp",
      name: "WhatsApp Business",
      description: "Invia e ricevi messaggi WhatsApp tramite API Business",
      icon: Phone,
      connected: whatsappConnected,
      loading: whatsappLoading,
      onRefresh: checkWhatsappStatus,
      color: "text-green-600",
      bgColor: "bg-green-100",
      configuredViaSecrets: true,
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {integrations.map((integration) => (
          <Card key={integration.id} className="relative overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className={`h-12 w-12 rounded-lg ${integration.bgColor} flex items-center justify-center`}>
                  <integration.icon className={`h-6 w-6 ${integration.color}`} />
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={integration.onRefresh}
                    disabled={integration.loading}
                  >
                    <RefreshCw className={`h-4 w-4 ${integration.loading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </div>
              <CardTitle className="text-lg mt-3">{integration.name}</CardTitle>
              <CardDescription className="text-sm">
                {integration.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {integration.loading ? (
                    <Badge variant="outline" className="gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Verifica...
                    </Badge>
                  ) : integration.connected ? (
                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100 gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Connesso
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground gap-1">
                      <XCircle className="h-3 w-3" />
                      Non connesso
                    </Badge>
                  )}
                </div>
                
                {!integration.loading && (
                  <>
                    {integration.configuredViaReplit && (
                      <span className="text-xs text-muted-foreground">
                        Integrazione Replit
                      </span>
                    )}
                    {integration.configuredViaSecrets && (
                      <span className="text-xs text-muted-foreground">
                        Configurato via secrets
                      </span>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configurazione Integrazioni
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium text-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4 text-purple-600" />
              Google Calendar
            </h4>
            <p>L'integrazione è gestita automaticamente da Replit. Quando connesso, puoi sincronizzare attività e progetti.</p>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium text-foreground flex items-center gap-2">
              <Mail className="h-4 w-4 text-blue-600" />
              Email (Aruba)
            </h4>
            <p>Richiede i seguenti secrets: <code className="bg-muted px-1 rounded">ARUBA_EMAIL_ADDRESS</code> e <code className="bg-muted px-1 rounded">ARUBA_EMAIL_PASSWORD</code></p>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium text-foreground flex items-center gap-2">
              <Send className="h-4 w-4 text-sky-600" />
              Telegram
            </h4>
            <p>Richiede: <code className="bg-muted px-1 rounded">TELEGRAM_BOT_TOKEN</code> e <code className="bg-muted px-1 rounded">TELEGRAM_CHAT_ID</code></p>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium text-foreground flex items-center gap-2">
              <Phone className="h-4 w-4 text-green-600" />
              WhatsApp
            </h4>
            <p>Puoi usare WhatsApp Web direttamente dal browser oppure configurare WhatsApp Business API.</p>
            
            <div className="flex flex-wrap gap-2">
              <a 
                href="https://web.whatsapp.com/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
              >
                <Phone className="h-4 w-4" />
                Apri WhatsApp Web
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground mb-2">Per l'integrazione automatica via API:</p>
              <p className="text-xs">Richiede: <code className="bg-muted px-1 rounded">WHATSAPP_API_KEY</code> e <code className="bg-muted px-1 rounded">WHATSAPP_PHONE_ID</code></p>
              <a 
                href="https://developers.facebook.com/docs/whatsapp/cloud-api/get-started" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-green-600 hover:underline text-xs mt-1"
              >
                <ExternalLink className="h-3 w-3" />
                Documentazione WhatsApp Cloud API
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
