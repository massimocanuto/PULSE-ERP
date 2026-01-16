import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  HardDrive,
  Clock,
  Plus,
  Trash2,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  RefreshCw,
  Download,
  Settings,
  Play,
  Pause,
  FolderOpen
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { it } from "date-fns/locale";

interface Backup {
  id: string;
  name: string;
  status: string;
  type: string;
  size: string | null;
  tables: string | null;
  createdAt: string;
  completedAt: string | null;
  errorMessage: string | null;
}

interface BackupSchedule {
  id: string;
  name: string;
  frequency: string;
  dayOfWeek: number | null;
  dayOfMonth: number | null;
  hour: number;
  minute: number;
  enabled: boolean;
  retentionDays: number;
  lastRun: string | null;
  nextRun: string | null;
  createdAt: string;
}

export default function BackupPanel() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [newSchedule, setNewSchedule] = useState({
    name: "Backup Automatico",
    frequency: "daily",
    dayOfWeek: 1,
    dayOfMonth: 1,
    hour: 2,
    minute: 0,
    retentionDays: 30,
  });
  const [backupPathInput, setBackupPathInput] = useState("");

  const { data: backupPathData } = useQuery<{ path: string }>({
    queryKey: ["/api/settings/backup-path"],
    queryFn: async () => {
      const res = await fetch("/api/settings/backup-path", { headers: getAuthHeaders() });
      if (!res.ok) return { path: "" };
      return res.json();
    },
    enabled: user?.role === "Admin",
  });

  // Sync state with fetched data
  useEffect(() => {
    if (backupPathData?.path) {
      setBackupPathInput(backupPathData.path);
    }
  }, [backupPathData]);

  const updateBackupPathMutation = useMutation({
    mutationFn: async (path: string) => {
      const res = await fetch("/api/settings/backup-path", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ path }),
      });
      if (!res.ok) throw new Error("Failed to update backup path");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/backup-path"] });
    },
  });
  const getAuthHeaders = () => ({
    "Content-Type": "application/json",
    "x-user-id": user?.id || "",
    "x-user-role": user?.role || "",
  });

  const { data: backups = [], isLoading: loadingBackups, refetch: refetchBackups } = useQuery<Backup[]>({
    queryKey: ["/api/backups"],
    queryFn: async () => {
      const res = await fetch("/api/backups", { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed to fetch backups");
      return res.json();
    },
    refetchInterval: 5000,
    enabled: user?.role === "Admin",
  });

  const { data: schedules = [], isLoading: loadingSchedules } = useQuery<BackupSchedule[]>({
    queryKey: ["/api/backup-schedules"],
    queryFn: async () => {
      const res = await fetch("/api/backup-schedules", { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed to fetch schedules");
      return res.json();
    },
    enabled: user?.role === "Admin",
  });

  const createBackupMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/backups", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error("Failed to create backup");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/backups"] });
    },
  });

  const deleteBackupMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/backups/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed to delete backup");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/backups"] });
    },
  });

  const createScheduleMutation = useMutation({
    mutationFn: async (data: typeof newSchedule) => {
      const res = await fetch("/api/backup-schedules", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create schedule");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/backup-schedules"] });
      setShowScheduleDialog(false);
    },
  });

  const toggleScheduleMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const res = await fetch(`/api/backup-schedules/${id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ enabled }),
      });
      if (!res.ok) throw new Error("Failed to update schedule");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/backup-schedules"] });
    },
  });

  const deleteScheduleMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/backup-schedules/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed to delete schedule");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/backup-schedules"] });
    },
  });

  if (user?.role !== "Admin") {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <HardDrive className="h-16 w-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Accesso Negato</h1>
        <p className="text-muted-foreground text-center">
          Questa sezione è riservata agli amministratori.
        </p>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Completato</Badge>;
      case "in_progress":
        return <Badge className="bg-blue-500"><Loader2 className="h-3 w-3 mr-1 animate-spin" />In Corso</Badge>;
      case "failed":
        return <Badge className="bg-red-500"><XCircle className="h-3 w-3 mr-1" />Fallito</Badge>;
      default:
        return <Badge className="bg-yellow-500"><AlertCircle className="h-3 w-3 mr-1" />In Attesa</Badge>;
    }
  };

  const getFrequencyLabel = (frequency: string) => {
    switch (frequency) {
      case "daily": return "Giornaliero";
      case "weekly": return "Settimanale";
      case "monthly": return "Mensile";
      default: return frequency;
    }
  };

  const getDayOfWeekLabel = (day: number) => {
    const days = ["Domenica", "Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato"];
    return days[day] || "";
  };

  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return "-";
    try {
      return format(new Date(dateStr), "dd MMM yyyy HH:mm", { locale: it });
    } catch {
      return "-";
    }
  };

  const handleSelectFolder = async () => {
    if ((window as any).electronAPI?.dialog?.openDirectory) {
      try {
        const path = await (window as any).electronAPI.dialog.openDirectory();
        if (path) {
          setBackupPathInput(path);
          updateBackupPathMutation.mutate(path);
        }
      } catch (error) {
        console.error("Failed to open directory dialog:", error);
      }
    } else {
      alert("Funzionalità disponibile solo nell'app desktop");
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configurazione Percorso
          </CardTitle>
          <CardDescription>
            Definisci dove salvare i file di backup (percorso assoluto sul server)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1 space-y-2">
              <Label>Percorso Cartella Backup</Label>
              <Input
                value={backupPathInput}
                onChange={(e) => setBackupPathInput(e.target.value)}
                placeholder="Es: C:\Backups\PULSE-ERP"
              />
            </div>
            <Button
              variant="outline"
              onClick={handleSelectFolder}
              title="Sfoglia..."
              type="button"
            >
              <FolderOpen className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => updateBackupPathMutation.mutate(backupPathInput)}
              disabled={updateBackupPathMutation.isPending || !backupPathInput}
            >
              {updateBackupPathMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Settings className="h-4 w-4 mr-2" />
              )}
              Salva Percorso
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="h-5 w-5" />
              Backup Database
            </CardTitle>
            <CardDescription>
              Gestisci i backup del database per proteggere i tuoi dati
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchBackups()}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Aggiorna
            </Button>
            <Button
              size="sm"
              onClick={() => createBackupMutation.mutate()}
              disabled={createBackupMutation.isPending}
            >
              {createBackupMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Nuovo Backup
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loadingBackups ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : backups.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <HardDrive className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nessun backup trovato</p>
              <p className="text-sm">Crea il tuo primo backup per proteggere i dati</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Dimensione</TableHead>
                  <TableHead>Data Creazione</TableHead>
                  <TableHead>Completato</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {backups.map((backup) => (
                  <TableRow key={backup.id}>
                    <TableCell className="font-medium">{backup.name}</TableCell>
                    <TableCell>{getStatusBadge(backup.status)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {backup.type === "manual" ? "Manuale" : "Automatico"}
                      </Badge>
                    </TableCell>
                    <TableCell>{backup.size || "-"}</TableCell>
                    <TableCell>{formatDateTime(backup.createdAt)}</TableCell>
                    <TableCell>{formatDateTime(backup.completedAt)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteBackupMutation.mutate(backup.id)}
                        disabled={deleteBackupMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Backup Schedulati
            </CardTitle>
            <CardDescription>
              Configura backup automatici a intervalli regolari
            </CardDescription>
          </div>
          <Button size="sm" onClick={() => setShowScheduleDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nuova Schedulazione
          </Button>
        </CardHeader>
        <CardContent>
          {loadingSchedules ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : schedules.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nessuna schedulazione configurata</p>
              <p className="text-sm">Imposta backup automatici per non perdere mai i dati</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Frequenza</TableHead>
                  <TableHead>Orario</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead>Prossima Esecuzione</TableHead>
                  <TableHead>Ultima Esecuzione</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedules.map((schedule) => (
                  <TableRow key={schedule.id}>
                    <TableCell className="font-medium">{schedule.name}</TableCell>
                    <TableCell>
                      {getFrequencyLabel(schedule.frequency)}
                      {schedule.frequency === "weekly" && schedule.dayOfWeek !== null && (
                        <span className="text-muted-foreground text-sm ml-1">
                          ({getDayOfWeekLabel(schedule.dayOfWeek)})
                        </span>
                      )}
                      {schedule.frequency === "monthly" && schedule.dayOfMonth !== null && (
                        <span className="text-muted-foreground text-sm ml-1">
                          (giorno {schedule.dayOfMonth})
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {String(schedule.hour).padStart(2, "0")}:{String(schedule.minute).padStart(2, "0")}
                    </TableCell>
                    <TableCell>
                      <Badge className={schedule.enabled ? "bg-green-500" : "bg-gray-500"}>
                        {schedule.enabled ? "Attivo" : "Disattivato"}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDateTime(schedule.nextRun)}</TableCell>
                    <TableCell>{formatDateTime(schedule.lastRun)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleScheduleMutation.mutate({
                            id: schedule.id,
                            enabled: !schedule.enabled
                          })}
                        >
                          {schedule.enabled ? (
                            <Pause className="h-4 w-4 text-yellow-500" />
                          ) : (
                            <Play className="h-4 w-4 text-green-500" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteScheduleMutation.mutate(schedule.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuova Schedulazione Backup</DialogTitle>
            <DialogDescription>
              Configura un backup automatico che verrà eseguito regolarmente
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                value={newSchedule.name}
                onChange={(e) => setNewSchedule({ ...newSchedule, name: e.target.value })}
                placeholder="Backup Giornaliero"
              />
            </div>

            <div className="space-y-2">
              <Label>Frequenza</Label>
              <Select
                value={newSchedule.frequency}
                onValueChange={(value) => setNewSchedule({ ...newSchedule, frequency: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Giornaliero</SelectItem>
                  <SelectItem value="weekly">Settimanale</SelectItem>
                  <SelectItem value="monthly">Mensile</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {newSchedule.frequency === "weekly" && (
              <div className="space-y-2">
                <Label>Giorno della settimana</Label>
                <Select
                  value={String(newSchedule.dayOfWeek)}
                  onValueChange={(value) => setNewSchedule({ ...newSchedule, dayOfWeek: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Domenica</SelectItem>
                    <SelectItem value="1">Lunedì</SelectItem>
                    <SelectItem value="2">Martedì</SelectItem>
                    <SelectItem value="3">Mercoledì</SelectItem>
                    <SelectItem value="4">Giovedì</SelectItem>
                    <SelectItem value="5">Venerdì</SelectItem>
                    <SelectItem value="6">Sabato</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {newSchedule.frequency === "monthly" && (
              <div className="space-y-2">
                <Label>Giorno del mese</Label>
                <Input
                  type="number"
                  min={1}
                  max={31}
                  value={newSchedule.dayOfMonth}
                  onChange={(e) => setNewSchedule({ ...newSchedule, dayOfMonth: parseInt(e.target.value) })}
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ora</Label>
                <Input
                  type="number"
                  min={0}
                  max={23}
                  value={newSchedule.hour}
                  onChange={(e) => setNewSchedule({ ...newSchedule, hour: parseInt(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Minuti</Label>
                <Input
                  type="number"
                  min={0}
                  max={59}
                  value={newSchedule.minute}
                  onChange={(e) => setNewSchedule({ ...newSchedule, minute: parseInt(e.target.value) })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Giorni di conservazione</Label>
              <Input
                type="number"
                min={1}
                max={365}
                value={newSchedule.retentionDays}
                onChange={(e) => setNewSchedule({ ...newSchedule, retentionDays: parseInt(e.target.value) })}
              />
              <p className="text-xs text-muted-foreground">
                I backup più vecchi verranno eliminati automaticamente
              </p>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setShowScheduleDialog(false)}>
                Annulla
              </Button>
              <Button
                onClick={() => createScheduleMutation.mutate(newSchedule)}
                disabled={createScheduleMutation.isPending}
              >
                {createScheduleMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Crea Schedulazione
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
