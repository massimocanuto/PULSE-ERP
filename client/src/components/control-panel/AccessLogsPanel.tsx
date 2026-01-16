import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { Loader2, Monitor, Globe, CheckCircle2, XCircle, Clock, Filter } from "lucide-react";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export default function AccessLogsPanel() {
  const [filterUserId, setFilterUserId] = useState<string>("all");

  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await fetch("/api/users");
      if (!res.ok) throw new Error("Errore nel caricamento utenti");
      return res.json();
    }
  });

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["access-logs", filterUserId],
    queryFn: async () => {
      const url = filterUserId === "all" 
        ? "/api/user-access-logs" 
        : `/api/user-access-logs?userId=${filterUserId}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Errore nel caricamento log");
      return res.json();
    }
  });

  const getUserName = (userId: string) => {
    const user = users.find((u: any) => u.id === userId);
    return user ? user.name : "Utente sconosciuto";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Log Accessi</h3>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={filterUserId} onValueChange={setFilterUserId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filtra per utente" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti gli utenti</SelectItem>
              {users.map((user: any) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {logs.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>Nessun accesso registrato</p>
        </div>
      ) : (
        <div className="border border-border/60 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs text-muted-foreground uppercase font-medium border-b border-border/60">
              <tr>
                <th className="px-4 py-3 text-left">Utente</th>
                <th className="px-4 py-3 text-left">Data e Ora</th>
                <th className="px-4 py-3 text-left">Indirizzo IP</th>
                <th className="px-4 py-3 text-left">Dispositivo</th>
                <th className="px-4 py-3 text-center">Esito</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {logs.map((log: any) => (
                <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <span className="font-medium">{getUserName(log.userId)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>
                        {log.loginAt 
                          ? format(new Date(log.loginAt), "dd MMM yyyy, HH:mm:ss", { locale: it })
                          : "-"
                        }
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                      <code className="bg-muted px-1.5 py-0.5 rounded text-xs">
                        {log.ipAddress || "-"}
                      </code>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Monitor className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground truncate max-w-[200px]" title={log.userAgent}>
                        {log.userAgent ? parseUserAgent(log.userAgent) : "-"}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {log.success ? (
                      <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Successo
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/30">
                        <XCircle className="h-3 w-3 mr-1" />
                        Fallito
                      </Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-muted-foreground text-center">
        Ultimi {logs.length} accessi registrati
      </p>
    </div>
  );
}

function parseUserAgent(ua: string): string {
  if (ua.includes("Chrome")) return "Chrome";
  if (ua.includes("Firefox")) return "Firefox";
  if (ua.includes("Safari")) return "Safari";
  if (ua.includes("Edge")) return "Edge";
  if (ua.includes("Mobile")) return "Mobile";
  return "Browser";
}
