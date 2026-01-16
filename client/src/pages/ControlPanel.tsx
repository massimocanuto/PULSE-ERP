import { AppLayout } from "@/components/layout/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Shield, Database, Settings2, Plug, User, HardDrive, Mail, History, Stethoscope } from "lucide-react";
import UsersPanel from "@/components/control-panel/UsersPanel";
import PermissionsPanel from "@/components/control-panel/PermissionsPanel";
import DatabasePanel from "@/components/control-panel/DatabasePanel";
import IntegrationsPanel from "@/components/control-panel/IntegrationsPanel";
import UserProfilePanel from "@/components/control-panel/UserProfilePanel";
import BackupPanel from "@/components/control-panel/BackupPanel";
import EmailSettingsPanel from "@/components/control-panel/EmailSettingsPanel";
import AccessLogsPanel from "@/components/control-panel/AccessLogsPanel";
import DiagnosticaPanel from "@/components/control-panel/DiagnosticaPanel";
import { useUser } from "@/contexts/AuthContext";

import { useLocation, useSearch } from "wouter";

export default function ControlPanel() {
  const { user } = useUser();
  const isAdmin = user?.role === "Admin";
  const search = useSearch();
  const query = new URLSearchParams(search);
  const defaultTab = query.get("tab") || (isAdmin ? "users" : "profile");

  return (
    <AppLayout>
      <div className="h-full flex flex-col overflow-hidden bg-gradient-to-br from-[#f5f0e6] via-[#e8dcc8] to-[#ddd0b8] dark:from-[#2d3748] dark:via-[#374151] dark:to-[#3d4555]">
        <div className="h-32 w-full flex-shrink-0 bg-gradient-to-r from-[#4a5568] via-[#5a6a7d] to-[#6b7a8f]" />

        <div className="flex-1 overflow-auto -mt-16 px-6">
          <Tabs defaultValue={defaultTab} className="h-full flex flex-col">
            <div className="bg-stone-50 dark:bg-stone-900/50 rounded-xl shadow-lg border mb-6">
              <div className="p-6 pb-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
                    <Settings2 className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight">Pannello di Controllo</h1>
                    <p className="text-sm text-muted-foreground">
                      {isAdmin ? "Gestisci utenti, permessi e database" : "Gestisci il tuo profilo"}
                    </p>
                  </div>
                </div>

                {isAdmin ? (
                  <TabsList className="grid grid-cols-8 gap-1 h-auto bg-transparent p-0">
                    <TabsTrigger value="users" className="flex flex-col items-center justify-center gap-0.5 px-1 py-2 text-[9px] data-[state=active]:bg-primary/20 rounded-lg" title="Utenti">
                      <Users className="h-4 w-4" />
                      <span>Utenti</span>
                    </TabsTrigger>
                    <TabsTrigger value="access-logs" className="flex flex-col items-center justify-center gap-0.5 px-1 py-2 text-[9px] data-[state=active]:bg-primary/20 rounded-lg" title="Accessi">
                      <History className="h-4 w-4" />
                      <span>Accessi</span>
                    </TabsTrigger>
                    <TabsTrigger value="permissions" className="flex flex-col items-center justify-center gap-0.5 px-1 py-2 text-[9px] data-[state=active]:bg-primary/20 rounded-lg" title="Permessi">
                      <Shield className="h-4 w-4" />
                      <span>Permessi</span>
                    </TabsTrigger>
                    <TabsTrigger value="integrations" className="flex flex-col items-center justify-center gap-0.5 px-1 py-2 text-[9px] data-[state=active]:bg-primary/20 rounded-lg" title="Integrazioni">
                      <Plug className="h-4 w-4" />
                      <span>Integrazioni</span>
                    </TabsTrigger>
                    <TabsTrigger value="email" className="flex flex-col items-center justify-center gap-0.5 px-1 py-2 text-[9px] data-[state=active]:bg-primary/20 rounded-lg" title="Email">
                      <Mail className="h-4 w-4" />
                      <span>Email</span>
                    </TabsTrigger>
                    <TabsTrigger value="backup" className="flex flex-col items-center justify-center gap-0.5 px-1 py-2 text-[9px] data-[state=active]:bg-primary/20 rounded-lg" title="Backup">
                      <HardDrive className="h-4 w-4" />
                      <span>Backup</span>
                    </TabsTrigger>
                    <TabsTrigger value="database" className="flex flex-col items-center justify-center gap-0.5 px-1 py-2 text-[9px] data-[state=active]:bg-primary/20 rounded-lg" title="Database">
                      <Database className="h-4 w-4" />
                      <span>Database</span>
                    </TabsTrigger>
                    <TabsTrigger value="diagnostica" className="flex flex-col items-center justify-center gap-0.5 px-1 py-2 text-[9px] data-[state=active]:bg-primary/20 rounded-lg" title="Diagnostica">
                      <Stethoscope className="h-4 w-4" />
                      <span>Diagnostica</span>
                    </TabsTrigger>
                  </TabsList>
                ) : (
                  <TabsList className="grid grid-cols-2 gap-1 h-auto bg-transparent p-0 max-w-xs">
                    <TabsTrigger value="profile" className="flex flex-col items-center justify-center gap-0.5 px-1 py-2 text-[9px] data-[state=active]:bg-primary/20 rounded-lg" title="Il Mio Profilo">
                      <User className="h-4 w-4" />
                      <span>Il Mio Profilo</span>
                    </TabsTrigger>
                    <TabsTrigger value="email" className="flex flex-col items-center justify-center gap-0.5 px-1 py-2 text-[9px] data-[state=active]:bg-primary/20 rounded-lg" title="Email">
                      <Mail className="h-4 w-4" />
                      <span>Email</span>
                    </TabsTrigger>
                  </TabsList>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-auto">
              {isAdmin ? (
                <>
                  <TabsContent value="users" className="m-0 h-full">
                    <UsersPanel />
                  </TabsContent>
                  <TabsContent value="access-logs" className="m-0 h-full">
                    <AccessLogsPanel />
                  </TabsContent>
                  <TabsContent value="permissions" className="m-0 h-full">
                    <PermissionsPanel />
                  </TabsContent>
                  <TabsContent value="integrations" className="m-0 h-full">
                    <IntegrationsPanel />
                  </TabsContent>
                  <TabsContent value="email" className="m-0 h-full">
                    <EmailSettingsPanel />
                  </TabsContent>
                  <TabsContent value="backup" className="m-0 h-full">
                    <BackupPanel />
                  </TabsContent>
                  <TabsContent value="database" className="m-0 h-full">
                    <DatabasePanel />
                  </TabsContent>
                  <TabsContent value="diagnostica" className="m-0 h-full">
                    <DiagnosticaPanel />
                  </TabsContent>
                </>
              ) : (
                <>
                  <TabsContent value="profile" className="m-0 h-full">
                    <UserProfilePanel />
                  </TabsContent>
                  <TabsContent value="email" className="m-0 h-full">
                    <EmailSettingsPanel />
                  </TabsContent>
                </>
              )}
            </div>
          </Tabs>
        </div>
      </div>
    </AppLayout>
  );
}
