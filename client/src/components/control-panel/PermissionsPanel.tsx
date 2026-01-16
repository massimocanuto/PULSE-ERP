import { Loader2, Shield } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const MODULES = [
  { id: 'projects', name: 'Progetti', icon: '📁' },
  { id: 'tasks', name: 'Attività', icon: '✅' },
  { id: 'email', name: 'Email', icon: '📧' },
  { id: 'chat', name: 'Chat', icon: '💬' },
  { id: 'documents', name: 'Documenti', icon: '📄' },
  { id: 'archivio', name: 'Archivio', icon: '🗄️' },
  { id: 'users', name: 'Utenti', icon: '👥' },
];

const ROLES = ['Admin', 'Manager', 'Member', 'Viewer'];

const ACTIONS = [
  { id: 'canView', name: 'Visualizza', description: 'Può vedere i contenuti' },
  { id: 'canCreate', name: 'Crea', description: 'Può creare nuovi elementi' },
  { id: 'canEdit', name: 'Modifica', description: 'Può modificare elementi esistenti' },
  { id: 'canDelete', name: 'Elimina', description: 'Può eliminare elementi' },
];

interface RolePermission {
  id: string;
  role: string;
  module: string;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export default function PermissionsPanel() {
  const queryClient = useQueryClient();
  const [selectedRole, setSelectedRole] = useState('Admin');

  const { data: permissions = [], isLoading } = useQuery<RolePermission[]>({
    queryKey: ["permissions"],
    queryFn: async () => {
      const res = await fetch("/api/permissions");
      if (!res.ok) throw new Error("Errore nel caricamento permessi");
      return res.json();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ role, module, field, value }: { role: string; module: string; field: string; value: boolean }) => {
      const res = await fetch(`/api/permissions/${role}/${module}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      if (!res.ok) throw new Error("Errore aggiornamento permesso");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["permissions"] });
    },
  });

  const getPermission = (role: string, module: string) => {
    return permissions.find((p) => p.role === role && p.module === module);
  };

  const handleToggle = (role: string, module: string, field: string, value: boolean) => {
    updateMutation.mutate({ role, module, field, value });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold">Gestione Permessi</h2>
        <p className="text-sm text-muted-foreground">Configura i permessi per ogni ruolo</p>
      </div>

      <Tabs value={selectedRole} onValueChange={setSelectedRole}>
        <TabsList className="mb-6">
          {ROLES.map((role) => (
            <TabsTrigger key={role} value={role} className="px-6">
              <Shield className="h-4 w-4 mr-2" />
              {role}
            </TabsTrigger>
          ))}
        </TabsList>

        {ROLES.map((role) => (
          <TabsContent key={role} value={role}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Permessi per {role}
                </CardTitle>
                <CardDescription>
                  {role === 'Admin' && 'Accesso completo a tutte le funzionalità'}
                  {role === 'Manager' && 'Gestione progetti, task e team'}
                  {role === 'Member' && 'Collaborazione su progetti e task assegnati'}
                  {role === 'Viewer' && 'Solo visualizzazione dei contenuti'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 border-b">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">Modulo</th>
                        {ACTIONS.map((action) => (
                          <th key={action.id} className="px-4 py-3 text-center font-medium text-muted-foreground">
                            {action.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {MODULES.map((module) => {
                        const perm = getPermission(role, module.id);
                        return (
                          <tr key={module.id} className="hover:bg-muted/30">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <span>{module.icon}</span>
                                <span className="font-medium">{module.name}</span>
                              </div>
                            </td>
                            {ACTIONS.map((action) => {
                              const isEnabled = perm ? (perm as any)[action.id] : false;
                              return (
                                <td key={action.id} className="px-4 py-3 text-center">
                                  <Switch
                                    checked={isEnabled}
                                    onCheckedChange={(checked) => handleToggle(role, module.id, action.id, checked)}
                                    disabled={updateMutation.isPending}
                                  />
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
        <h3 className="font-semibold text-amber-800 dark:text-amber-200 mb-2">Legenda Permessi</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-amber-700 dark:text-amber-300">
          {ACTIONS.map((action) => (
            <div key={action.id}>
              <strong>{action.name}:</strong> {action.description}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
