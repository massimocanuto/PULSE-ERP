import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Database, ChevronLeft, ChevronRight, Loader2, AlertCircle, ShieldAlert } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface TableResponse {
  data: Record<string, any>[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export default function DatabaseExplorer() {
  const { user } = useAuth();
  const [selectedTable, setSelectedTable] = useState<string>("users");
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const getAuthHeaders = () => ({
    "x-user-id": user?.id || "",
    "x-user-role": user?.role || "",
  });

  const { data: tablesData } = useQuery<{ tables: string[] }>({
    queryKey: ["/api/admin/db/tables"],
    queryFn: async () => {
      const res = await fetch("/api/admin/db/tables", { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed to fetch tables");
      return res.json();
    },
    enabled: user?.role === "Admin",
  });

  const { data: tableData, isLoading, error } = useQuery<TableResponse>({
    queryKey: [`/api/admin/db/${selectedTable}`, page, pageSize],
    queryFn: async () => {
      const res = await fetch(`/api/admin/db/${selectedTable}?page=${page}&pageSize=${pageSize}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed to fetch table data");
      return res.json();
    },
    enabled: !!selectedTable && user?.role === "Admin",
  });

  if (user?.role !== "Admin") {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <ShieldAlert className="h-16 w-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Accesso Negato</h1>
        <p className="text-muted-foreground text-center">
          Questa sezione è riservata agli amministratori.
        </p>
      </div>
    );
  }

  const tables = tablesData?.tables || [];
  const rows = tableData?.data || [];
  const total = tableData?.total || 0;
  const totalPages = tableData?.totalPages || 1;

  const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

  const formatCellValue = (value: any): string => {
    if (value === null || value === undefined) return "-";
    if (typeof value === "boolean") return value ? "Sì" : "No";
    if (Array.isArray(value)) return value.join(", ") || "-";
    if (typeof value === "object") return JSON.stringify(value);
    const str = String(value);
    return str.length > 50 ? str.substring(0, 50) + "..." : str;
  };

  const tableDisplayNames: Record<string, string> = {
    users: "Utenti",
    projects: "Progetti",
    tasks: "Attività",
    emails: "Email",
    documents: "Documenti",
    todoItems: "To-Do",
    chatChannels: "Canali Chat",
    chatMessages: "Messaggi Chat",
    telegramChats: "Chat Telegram",
    telegramMessages: "Messaggi Telegram",
    activityFeed: "Feed Attività",
    taskComments: "Commenti Attività",
    appSettings: "Impostazioni App",
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Database className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Database Explorer</h1>
            <p className="text-muted-foreground">Visualizza le tabelle del database</p>
          </div>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-1">
          {total} record
        </Badge>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Seleziona Tabella</CardTitle>
            <Select value={selectedTable} onValueChange={(v) => { setSelectedTable(v); setPage(1); }}>
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="Seleziona tabella" />
              </SelectTrigger>
              <SelectContent>
                {tables.map((table) => (
                  <SelectItem key={table} value={table}>
                    {tableDisplayNames[table] || table}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12 text-destructive gap-2">
              <AlertCircle className="h-5 w-5" />
              <span>Errore nel caricamento dei dati</span>
            </div>
          ) : rows.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Nessun dato in questa tabella
            </div>
          ) : (
            <>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {columns.map((col) => (
                        <TableHead key={col} className="whitespace-nowrap font-semibold">
                          {col}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row, idx) => (
                      <TableRow key={idx}>
                        {columns.map((col) => (
                          <TableCell key={col} className="whitespace-nowrap max-w-[300px] truncate">
                            {formatCellValue(row[col])}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Pagina {page} di {totalPages} ({total} record totali)
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Precedente
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                  >
                    Successiva
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
