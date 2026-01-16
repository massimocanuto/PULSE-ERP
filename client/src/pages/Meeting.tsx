import { AppLayout } from "@/components/layout/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Video, Users, Calendar, ExternalLink, Plus, Clock, Copy, 
  CheckCircle2, Link2, Settings, Phone
} from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function Meeting() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("google-meet");
  const [meetLink, setMeetLink] = useState("");
  const [teamsLink, setTeamsLink] = useState("");
  const [copiedMeet, setCopiedMeet] = useState(false);
  const [copiedTeams, setCopiedTeams] = useState(false);

  const copyToClipboard = (text: string, type: "meet" | "teams") => {
    navigator.clipboard.writeText(text);
    if (type === "meet") {
      setCopiedMeet(true);
      setTimeout(() => setCopiedMeet(false), 2000);
    } else {
      setCopiedTeams(true);
      setTimeout(() => setCopiedTeams(false), 2000);
    }
    toast({
      title: "Link copiato",
      description: "Il link della riunione è stato copiato negli appunti",
    });
  };

  const openMeetingLink = (url: string) => {
    if (url) {
      window.open(url, "_blank");
    }
  };

  return (
    <AppLayout>
      <div className="h-full flex flex-col">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <div className="bg-stone-50 dark:bg-stone-900/50 rounded-xl shadow-lg border mb-6">
            <div className="p-6 pb-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                  <Video className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">Meeting</h1>
                  <p className="text-sm text-muted-foreground">
                    Gestisci le tue riunioni con Google Meet e Microsoft Teams
                  </p>
                </div>
              </div>
              
              <TabsList className="grid w-full max-w-md grid-cols-2">
                <TabsTrigger value="google-meet" className="flex items-center gap-2">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 16.894l-2.53-1.46v2.926c0 .354-.287.64-.64.64H6.64a.64.64 0 01-.64-.64V5.64c0-.354.287-.64.64-.64h8.084c.353 0 .64.286.64.64v2.926l2.53-1.46a.64.64 0 01.966.549v8.69a.64.64 0 01-.966.549z"/>
                  </svg>
                  <span className="hidden sm:inline">Google Meet</span>
                </TabsTrigger>
                <TabsTrigger value="microsoft-teams" className="flex items-center gap-2">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.625 8.073c-.024-.024-.024-.048-.048-.072l-.024-.024c-.072-.096-.168-.168-.264-.24l-7.44-4.296c-.528-.312-1.176-.312-1.704 0L3.705 7.737c-.096.072-.192.144-.264.24l-.024.024c-.024.024-.024.048-.048.072-.048.072-.096.144-.12.24-.024.072-.048.144-.048.216v7.944c0 .528.288 1.008.768 1.272l7.44 4.296c.264.144.552.216.84.216.288 0 .576-.072.84-.216l7.44-4.296c.48-.264.768-.744.768-1.272V8.529c0-.072-.024-.144-.048-.216-.024-.096-.072-.168-.12-.24zm-8.376-3.12l5.952 3.432-2.664 1.536-3.288-1.896v-3.072zm-1.248 0v3.072l-3.288 1.896-2.664-1.536 5.952-3.432zm-6.24 4.464l2.016 1.176-2.016 1.176V9.417zm6.24 9.216l-5.952-3.432 2.664-1.536 3.288 1.896v3.072zm.624-4.368l-2.712-1.56 2.712-1.56 2.712 1.56-2.712 1.56zm.624 4.368v-3.072l3.288-1.896 2.664 1.536-5.952 3.432zm6.24-5.808l-2.016-1.176 2.016-1.176v2.352z"/>
                  </svg>
                  <span className="hidden sm:inline">Microsoft Teams</span>
                </TabsTrigger>
              </TabsList>
            </div>
          </div>

          <TabsContent value="google-meet" className="flex-1 mt-0">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    Nuova Riunione Google Meet
                  </CardTitle>
                  <CardDescription>
                    Crea o partecipa a una riunione video con Google Meet
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    className="w-full bg-[#1a73e8] hover:bg-[#1557b0]"
                    onClick={() => window.open("https://meet.google.com/new", "_blank")}
                  >
                    <Video className="h-4 w-4 mr-2" />
                    Crea nuova riunione
                  </Button>
                  
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">oppure</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="meet-link">Inserisci link o codice riunione</Label>
                    <div className="flex gap-2">
                      <Input 
                        id="meet-link"
                        placeholder="meet.google.com/xxx-xxxx-xxx"
                        value={meetLink}
                        onChange={(e) => setMeetLink(e.target.value)}
                      />
                      <Button 
                        variant="secondary"
                        onClick={() => openMeetingLink(meetLink.startsWith("http") ? meetLink : `https://meet.google.com/${meetLink}`)}
                        disabled={!meetLink}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Accesso Rapido
                  </CardTitle>
                  <CardDescription>
                    Link utili per Google Meet
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => window.open("https://meet.google.com", "_blank")}
                  >
                    <Video className="h-4 w-4 mr-2" />
                    Apri Google Meet
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => window.open("https://calendar.google.com", "_blank")}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Google Calendar
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => window.open("https://meet.google.com/landing", "_blank")}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Impostazioni Meet
                  </Button>
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Suggerimenti per Google Meet
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                      <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                        <Video className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h4 className="font-medium text-sm">Qualità Video</h4>
                        <p className="text-xs text-muted-foreground">Assicurati di avere una buona connessione internet</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                      <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                        <Phone className="h-4 w-4 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <h4 className="font-medium text-sm">Audio</h4>
                        <p className="text-xs text-muted-foreground">Usa cuffie per evitare eco e rumori di fondo</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                      <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                        <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <h4 className="font-medium text-sm">Condivisione</h4>
                        <p className="text-xs text-muted-foreground">Condividi lo schermo per presentare documenti</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="microsoft-teams" className="flex-1 mt-0">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    Nuova Riunione Microsoft Teams
                  </CardTitle>
                  <CardDescription>
                    Crea o partecipa a una riunione video con Microsoft Teams
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    className="w-full bg-[#5b5fc7] hover:bg-[#4b4fb7]"
                    onClick={() => window.open("https://teams.microsoft.com/v2/", "_blank")}
                  >
                    <Video className="h-4 w-4 mr-2" />
                    Apri Microsoft Teams
                  </Button>
                  
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">oppure</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="teams-link">Inserisci link riunione Teams</Label>
                    <div className="flex gap-2">
                      <Input 
                        id="teams-link"
                        placeholder="teams.microsoft.com/l/meetup-join/..."
                        value={teamsLink}
                        onChange={(e) => setTeamsLink(e.target.value)}
                      />
                      <Button 
                        variant="secondary"
                        onClick={() => openMeetingLink(teamsLink)}
                        disabled={!teamsLink}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Accesso Rapido
                  </CardTitle>
                  <CardDescription>
                    Link utili per Microsoft Teams
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => window.open("https://teams.microsoft.com", "_blank")}
                  >
                    <Video className="h-4 w-4 mr-2" />
                    Apri Teams Web
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => window.open("https://outlook.office.com/calendar", "_blank")}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Outlook Calendar
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => window.open("https://www.microsoft.com/microsoft-teams/download-app", "_blank")}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Scarica Teams Desktop
                  </Button>
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Suggerimenti per Microsoft Teams
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                      <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                        <Video className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div>
                        <h4 className="font-medium text-sm">Background</h4>
                        <p className="text-xs text-muted-foreground">Usa sfondi virtuali per meeting professionali</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                      <div className="h-8 w-8 rounded-full bg-teal-100 dark:bg-teal-900 flex items-center justify-center">
                        <Clock className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                      </div>
                      <div>
                        <h4 className="font-medium text-sm">Registrazione</h4>
                        <p className="text-xs text-muted-foreground">Registra le riunioni per rivederle in seguito</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                      <div className="h-8 w-8 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center">
                        <Link2 className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                      </div>
                      <div>
                        <h4 className="font-medium text-sm">Integrazione</h4>
                        <p className="text-xs text-muted-foreground">Collega Teams con le altre app Microsoft 365</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
