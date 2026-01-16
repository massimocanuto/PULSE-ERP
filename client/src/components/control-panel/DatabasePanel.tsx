import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Database, ChevronLeft, ChevronRight, Loader2, AlertCircle, ShieldAlert, Trash2, AlertTriangle, Terminal, Play, Pause, RefreshCw } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface TableResponse {
  data: Record<string, any>[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export default function DatabasePanel() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
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

  const [autoScroll, setAutoScroll] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: dbLogs = [] } = useQuery({
    queryKey: ["db-logs"],
    queryFn: async () => {
      const res = await fetch("/api/system/db-logs");
      if (!res.ok) return [];
      return res.json();
    },
    refetchInterval: 1000,
    enabled: user?.role === "Admin",
  });

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [dbLogs, autoScroll]);

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

  const purgeTableMutation = useMutation({
    mutationFn: async (tableName: string) => {
      const res = await fetch(`/api/admin/db/${tableName}/purge`, {
        method: "POST",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Errore nella cancellazione");
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/db/${selectedTable}`] });
      toast({
        title: "Cancellazione completata",
        description: `${data.deleted} record eliminati con successo`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const purgeAllMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/admin/db/purge-all`, {
        method: "POST",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Errore nella cancellazione");
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries();
      toast({
        title: "Database svuotato",
        description: `${data.totalDeleted} record eliminati da ${data.tablesCleared} tabelle`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    },
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
    projectShares: "Condivisioni Progetti",
    tasks: "Attività",
    emails: "Email",
    projectEmails: "Email Progetti",
    documents: "Documenti",
    documentShares: "Condivisioni Documenti",
    documentComments: "Commenti Documenti",
    projectDocuments: "Documenti Progetti",
    chatChannels: "Canali Chat",
    chatMessages: "Messaggi Chat",
    chatSavedConversations: "Conversazioni Salvate",
    chatFolders: "Cartelle Chat",
    chatFolderItems: "Elementi Cartelle Chat",
    whatsappContacts: "Contatti WhatsApp",
    whatsappMessages: "Messaggi WhatsApp",
    telegramChats: "Chat Telegram",
    telegramMessages: "Messaggi Telegram",
    rolePermissions: "Permessi Ruoli",
    archiveFolders: "Cartelle Archivio",
    archivedDocuments: "Documenti Archiviati",
    userPermissions: "Permessi Utente",
    personalTodos: "To-Do Personali",
    subtasks: "Sotto-attività",
    taskComments: "Commenti Attività",
    activityFeed: "Feed Attività",
    appSettings: "Impostazioni App",
    projectComments: "Commenti Progetti",
    sharedLinks: "Link Condivisi",
    teamAvailability: "Disponibilità Team",
    notifications: "Notifiche",
    todoTemplates: "Template To-Do",
    timeEntries: "Registrazioni Tempo",
    keepNotes: "Note Pulse Keep",
    keepLabels: "Etichette Keep",
    keepNoteTemplates: "Template Note",
    whiteboards: "Lavagne",
    whiteboardElements: "Elementi Lavagna",
    userEmailConfigs: "Configurazioni Email",
    userWhatsappConfigs: "Configurazioni WhatsApp",
    anagraficaClienti: "Clienti",
    anagraficaFornitori: "Fornitori",
    anagraficaPersonale: "Personale",
    fatture: "Fatture",
    fattureRighe: "Righe Fatture",
    preventivi: "Preventivi",
    preventiviRighe: "Righe Preventivi",
    ddt: "DDT",
    ddtLines: "Righe DDT",
    bankTransactions: "Transazioni Bancarie",
    financeIntegrations: "Integrazioni Finanza",
    financeShareLinks: "Link Condivisione Finanza",
    invoiceReminders: "Solleciti Fatture",
    invoiceCounters: "Contatori Fatture",
    warehouseCategories: "Categorie Magazzino",
    warehouseCodeCounters: "Contatori Codici Magazzino",
    warehouseProducts: "Prodotti Magazzino",
    warehouseMovements: "Movimenti Magazzino",
    billOfMaterials: "Distinte Base",
    bomComponents: "Componenti Distinte",
    productionOrders: "Ordini Produzione",
    productionPhases: "Fasi Produzione",
    crmLeads: "Lead CRM",
    crmOpportunita: "Opportunità CRM",
    crmAttivita: "Attività CRM",
    crmInterazioni: "Interazioni CRM",
    emailLabels: "Etichette Email",
    emailLabelAssignments: "Assegnazioni Etichette Email",
    corrieri: "Corrieri",
    spedizioni: "Spedizioni",
    spedizioniRighe: "Righe Spedizioni",
    customerPortalTokens: "Token Portale Clienti",
    session: "Sessioni",
  };

  const protectedTables = ["users", "session", "rolePermissions", "userPermissions", "appSettings"];
  const canPurge = !protectedTables.includes(selectedTable) && total > 0;

  return (
    <div className="p-6 space-y-8">
      {/* DB Terminal Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Terminal className="h-5 w-5" />
              Terminale Database
            </h2>
            <p className="text-sm text-muted-foreground">Monitoraggio query in tempo reale</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutoScroll(!autoScroll)}
              className={autoScroll ? "bg-green-50 text-green-700 border-green-200" : ""}
            >
              {autoScroll ? <Pause className="h-4 w-4 mr-1" /> : <Play className="h-4 w-4 mr-1" />}
              {autoScroll ? "Pausa Scorrimento" : "Riprendi Scorrimento"}
            </Button>
          </div>
        </div>

        <Card className="bg-black border-slate-800 shadow-2xl overflow-hidden font-mono text-base">
          <div className="bg-slate-900 px-4 py-2 border-b border-slate-800 flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/80"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/80"></div>
            </div>
            <span className="ml-2 text-slate-400">pulse-db-monitor ~ node</span>
          </div>
          <div
            ref={scrollRef}
            className="p-4 h-[300px] overflow-y-auto space-y-1.5 text-green-400 selection:bg-green-900/30"
          >
            {dbLogs.length === 0 && (
              <div className="opacity-50 italic">In attesa di attività database...</div>
            )}
            {dbLogs.slice().reverse().map((log: any, i: number) => {
              let colorClass = "text-slate-300"; // Default
              let prefix = ">";

              if (log.type === 'db') {
                colorClass = "text-green-400";
                prefix = "$";
              } else if (log.type === 'stderr') {
                colorClass = "text-red-400";
                prefix = "!";
              } else if (log.type === 'stdout') {
                colorClass = "text-blue-300";
                prefix = "i";
              }

              // Handle legacy format if any
              const query = log.message || log.query;

              return (
                <div key={i} className="flex gap-3 group hover:bg-white/5 p-0.5 -mx-2 px-2 rounded">
                  <span className="text-slate-500 shrink-0">
                    [{new Date(log.timestamp).toLocaleTimeString()}]
                  </span>
                  {log.duration !== undefined && (
                    <span className="text-blue-400 shrink-0 font-bold min-w-[60px]">
                      {log.duration}ms
                    </span>
                  )}
                  <div className="break-all flex-1">
                    <span className={`${colorClass} font-bold mr-2`}>{prefix}</span>
                    <span className={colorClass}>{query}</span>
                    {log.params && log.params.length > 0 && (
                      <div className="text-slate-500 mt-0.5 pl-4 text-sm">
                        PARAMS: {JSON.stringify(log.params)}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
            <div className="animate-pulse text-green-500 font-bold">_</div>
          </div>
        </Card>
      </div>

      <div className="border-t pt-6"></div>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Database Explorer</h2>
          <p className="text-sm text-muted-foreground">Visualizza e gestisci le tabelle del database</p>
        </div>
        <div className="flex items-center gap-3">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={purgeAllMutation.isPending}>
                {purgeAllMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <AlertTriangle className="h-4 w-4 mr-2" />
                )}
                Cancella Tutti i Dati
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="text-red-600 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Attenzione: Cancellazione Totale
                </AlertDialogTitle>
                <AlertDialogDescription className="space-y-2">
                  <p>Stai per eliminare <strong>tutti i dati</strong> dal database, inclusi:</p>
                  <ul className="list-disc list-inside text-sm space-y-1 mt-2">
                    <li>Progetti, attività e commenti</li>
                    <li>Fatture, preventivi e DDT</li>
                    <li>Clienti, fornitori e personale</li>
                    <li>Email, documenti e note</li>
                    <li>CRM, spedizioni e magazzino</li>
                  </ul>
                  <p className="mt-3"><strong>NON verranno eliminati:</strong> Utenti, permessi e configurazioni.</p>
                  <p className="text-red-600 font-medium mt-3">Questa azione non può essere annullata!</p>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annulla</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => purgeAllMutation.mutate()}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Conferma Cancellazione
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Badge variant="outline" className="text-lg px-4 py-1">
            {total} record
          </Badge>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="text-lg">Seleziona Tabella</CardTitle>
            <div className="flex items-center gap-3">
              {protectedTables.includes(selectedTable) && (
                <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                  <ShieldAlert className="h-3 w-3 mr-1" />
                  Tabella Protetta
                </Badge>
              )}
              {canPurge && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" disabled={purgeTableMutation.isPending}>
                      {purgeTableMutation.isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4 mr-2" />
                      )}
                      Svuota Tabella
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-red-600">
                        Conferma Cancellazione
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        Stai per eliminare definitivamente <strong>{total}</strong> record dalla tabella <strong>{tableDisplayNames[selectedTable] || selectedTable}</strong>.
                        <br /><br />
                        <span className="text-red-600 font-medium">Questa azione non può essere annullata!</span>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annulla</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => purgeTableMutation.mutate(selectedTable)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Elimina Tutto
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
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
