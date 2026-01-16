import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Mail, Shield, Trash2, Edit2, Loader2, UserPlus, UserCheck, UserX, Settings, Clock, Calendar, Wifi, Plus, Fingerprint, Users } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usersApi } from "@/lib/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { UserEmailConfigDialog } from "./UserEmailConfigDialog";
import { format, startOfWeek, addDays, parseISO } from "date-fns";
import { it } from "date-fns/locale";

export default function UsersPanel() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [emailConfigDialogOpen, setEmailConfigDialogOpen] = useState(false);
  const [selectedUserForEmail, setSelectedUserForEmail] = useState<{ id: string; name: string } | null>(null);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [newUser, setNewUser] = useState({ name: "", email: "", role: "Member", department: "", username: "", password: "", allowedIp: "" });
  const [userTurni, setUserTurni] = useState<any[]>([]);
  const [linkedCollaboratore, setLinkedCollaboratore] = useState<any>(null);
  const [loadingTurni, setLoadingTurni] = useState(false);
  const [fetchingIp, setFetchingIp] = useState(false);
  const [showAddTurno, setShowAddTurno] = useState(false);
  const [savingTurno, setSavingTurno] = useState(false);
  const [turniPredefiniti, setTurniPredefiniti] = useState<any[]>([]);
  const [selectedTurnoId, setSelectedTurnoId] = useState<string | null>(null);
  const [newTurno, setNewTurno] = useState({
    oraInizio: "08:00",
    oraFine: "17:00",
    giorni: [0, 1, 2, 3, 4] as number[]
  });

  const [collaboratori, setCollaboratori] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/turni-predefiniti")
      .then(res => res.json())
      .then(data => setTurniPredefiniti(data))
      .catch(console.error);
    
    fetch("/api/anagrafica-personale")
      .then(res => res.json())
      .then(data => setCollaboratori(data))
      .catch(console.error);
  }, []);

  const fetchCurrentIp = async (target: "new" | "edit") => {
    setFetchingIp(true);
    try {
      const res = await fetch("/api/client-ip");
      if (res.ok) {
        const data = await res.json();
        if (data.ip) {
          if (target === "new") {
            setNewUser({ ...newUser, allowedIp: data.ip });
          } else if (target === "edit" && editingUser) {
            setEditingUser({ ...editingUser, allowedIp: data.ip });
          }
        }
      }
    } catch (error) {
      console.error("Error fetching IP:", error);
    } finally {
      setFetchingIp(false);
    }
  };

  const handleConfigureEmail = (user: any) => {
    setSelectedUserForEmail({ id: user.id, name: user.name });
    setEmailConfigDialogOpen(true);
  };

  const generateUsername = (name: string) => {
    const parts = name.toLowerCase().trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0]}.${parts[parts.length - 1]}`;
    }
    return parts[0] || "";
  };

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: usersApi.getAll,
  });

  const createMutation = useMutation({
    mutationFn: usersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setNewUser({ name: "", email: "", role: "Member", department: "", username: "", password: "", allowedIp: "" });
      setDialogOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: usersApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => usersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setEditDialogOpen(false);
      setEditingUser(null);
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch(`/api/users/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Errore nel cambio stato");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const saveWeeklyTurni = async () => {
    if (!linkedCollaboratore) return;
    
    setSavingTurno(true);
    try {
      const today = new Date();
      const weekStart = startOfWeek(today, { weekStartsOn: 1 });
      
      for (const dayIdx of newTurno.giorni) {
        const dateStr = format(addDays(weekStart, dayIdx), "yyyy-MM-dd");
        
        await fetch("/api/turni", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            personaleId: linkedCollaboratore.id,
            data: dateStr,
            oraInizio: newTurno.oraInizio,
            oraFine: newTurno.oraFine,
            pausa: 60,
            tipologia: "ordinario"
          })
        });
      }
      
      if (editingUser?.email) {
        await loadUserTurni(editingUser.email);
      }
      setShowAddTurno(false);
    } catch (error) {
      console.error("Error saving turni:", error);
    } finally {
      setSavingTurno(false);
    }
  };

  const toggleGiorno = (idx: number) => {
    setNewTurno(prev => ({
      ...prev,
      giorni: prev.giorni.includes(idx)
        ? prev.giorni.filter(g => g !== idx)
        : [...prev.giorni, idx].sort()
    }));
  };

  const loadUserTurni = async (userEmail: string) => {
    setLoadingTurni(true);
    setUserTurni([]);
    setLinkedCollaboratore(null);
    
    try {
      const personaleRes = await fetch("/api/anagrafica/personale");
      if (personaleRes.ok) {
        const personaleList = await personaleRes.json();
        const collaboratore = personaleList.find((p: any) => 
          p.email?.toLowerCase() === userEmail?.toLowerCase() ||
          p.emailPrivata?.toLowerCase() === userEmail?.toLowerCase()
        );
        
        if (collaboratore) {
          setLinkedCollaboratore(collaboratore);
          
          const turniRes = await fetch("/api/turni");
          if (turniRes.ok) {
            const allTurni = await turniRes.json();
            const today = new Date();
            const weekStart = startOfWeek(today, { weekStartsOn: 1 });
            
            const weekDates = Array.from({ length: 7 }, (_, i) => 
              format(addDays(weekStart, i), "yyyy-MM-dd")
            );
            
            const userShifts = allTurni.filter((t: any) => 
              t.personaleId === collaboratore.id && weekDates.includes(t.data)
            );
            
            setUserTurni(userShifts);
          }
        }
      }
    } catch (error) {
      console.error("Error loading turni:", error);
    } finally {
      setLoadingTurni(false);
    }
  };

  const handleEditUser = (user: any) => {
    setEditingUser({ ...user });
    setEditDialogOpen(true);
    if (user.email) {
      loadUserTurni(user.email);
    }
  };

  const handleSaveUser = () => {
    if (editingUser && editingUser.name && editingUser.email) {
      const data: any = {
        name: editingUser.name,
        email: editingUser.email,
        username: editingUser.username,
        role: editingUser.role,
        department: editingUser.department,
        status: editingUser.status,
        avatar: editingUser.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2),
        allowedIp: editingUser.allowedIp || null
      };
      if (editingUser.password && editingUser.password.trim() !== "") {
        data.password = editingUser.password;
      }
      updateMutation.mutate({ id: editingUser.id, data });
    }
  };

  const handleCreateUser = () => {
    if (newUser.name && newUser.email) {
      const username = newUser.username || generateUsername(newUser.name);
      const userData: any = {
        name: newUser.name,
        email: newUser.email,
        username,
        role: newUser.role,
        department: newUser.department,
        status: "Active",
        avatar: newUser.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2),
        allowedIp: newUser.allowedIp || null
      };
      if (newUser.password && newUser.password.trim() !== "") {
        userData.password = newUser.password;
      }
      createMutation.mutate(userData);
    }
  };

  const handleNameChange = (name: string) => {
    const username = generateUsername(name);
    setNewUser({ ...newUser, name, username });
  };

  const handleEditNameChange = (name: string) => {
    const username = editingUser.username || generateUsername(name);
    setEditingUser({ ...editingUser, name, username: editingUser.username ? editingUser.username : username });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const activeUsers = users.filter((u: any) => u.status === "Active").length;
  const disabledUsers = users.filter((u: any) => u.status === "Disabled").length;
  const adminUsers = users.filter((u: any) => u.role === "Admin").length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 rounded-xl p-4 border border-blue-500/20">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{users.length}</div>
              <div className="text-xs text-muted-foreground">Totale Utenti</div>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 rounded-xl p-4 border border-green-500/20">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <UserCheck className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{activeUsers}</div>
              <div className="text-xs text-muted-foreground">Utenti Attivi</div>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-red-500/10 to-red-600/5 rounded-xl p-4 border border-red-500/20">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-red-500/20 flex items-center justify-center">
              <UserX className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{disabledUsers}</div>
              <div className="text-xs text-muted-foreground">Disabilitati</div>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 rounded-xl p-4 border border-amber-500/20">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <Shield className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{adminUsers}</div>
              <div className="text-xs text-muted-foreground">Amministratori</div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Elenco Utenti</h2>
          <p className="text-xs text-muted-foreground">Gestisci accessi e ruoli del workspace</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2"><UserPlus className="h-4 w-4" /> Nuovo Utente</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nuovo Utente</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Nome completo</Label>
                <Input 
                  placeholder="Nome Cognome" 
                  value={newUser.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input 
                  placeholder="email@esempio.com" 
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Username (auto-generato)</Label>
                <Input 
                  placeholder="nome.cognome" 
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <Input 
                  placeholder="Password" 
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Dipartimento</Label>
                <Input 
                  placeholder="Dipartimento" 
                  value={newUser.department}
                  onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>IP Autorizzato (auto-login)</Label>
                <div className="flex gap-2">
                  <Input 
                    placeholder="es. 192.168.1.100" 
                    value={newUser.allowedIp}
                    onChange={(e) => setNewUser({ ...newUser, allowedIp: e.target.value })}
                    className="flex-1"
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="icon"
                    onClick={() => fetchCurrentIp("new")}
                    disabled={fetchingIp}
                    title="Recupera IP corrente"
                  >
                    {fetchingIp ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wifi className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Se l'IP corrisponde, lo username verrà precompilato</p>
              </div>
              <Button onClick={handleCreateUser} className="w-full">
                Crea Utente
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Modifica Utente</DialogTitle>
            </DialogHeader>
            {editingUser && (
              <div className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nome completo</Label>
                    <Input 
                      placeholder="Nome completo" 
                      value={editingUser.name}
                      onChange={(e) => handleEditNameChange(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input 
                      placeholder="Indirizzo email" 
                      type="email"
                      value={editingUser.email}
                      onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Username</Label>
                    <Input 
                      placeholder="nome.cognome" 
                      value={editingUser.username || ""}
                      onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Password</Label>
                    <Input 
                      placeholder="Nuova password (lascia vuoto per non modificare)" 
                      type="password"
                      value={editingUser.password || ""}
                      onChange={(e) => setEditingUser({ ...editingUser, password: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Ruolo</Label>
                    <Select value={editingUser.role} onValueChange={(v) => setEditingUser({ ...editingUser, role: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Admin">Admin</SelectItem>
                        <SelectItem value="Manager">Manager</SelectItem>
                        <SelectItem value="Member">Member</SelectItem>
                        <SelectItem value="Viewer">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Dipartimento</Label>
                    <Input 
                      placeholder="Dipartimento" 
                      value={editingUser.department || ""}
                      onChange={(e) => setEditingUser({ ...editingUser, department: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Stato</Label>
                    <Select value={editingUser.status} onValueChange={(v) => setEditingUser({ ...editingUser, status: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Active">Attivo</SelectItem>
                        <SelectItem value="Disabled">Disabilitato</SelectItem>
                        <SelectItem value="Offline">Offline</SelectItem>
                        <SelectItem value="Invited">Invitato</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>IP Autorizzato (auto-login)</Label>
                    <div className="flex gap-2">
                      <Input 
                        placeholder="es. 192.168.1.100" 
                        value={editingUser.allowedIp || ""}
                        onChange={(e) => setEditingUser({ ...editingUser, allowedIp: e.target.value })}
                        className="flex-1"
                      />
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="icon"
                        onClick={() => fetchCurrentIp("edit")}
                        disabled={fetchingIp}
                        title="Recupera IP corrente"
                      >
                        {fetchingIp ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wifi className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4 mt-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" />
                      <Label className="text-sm font-semibold">Orari di Accesso</Label>
                    </div>
                    {linkedCollaboratore && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                        {linkedCollaboratore.nome} {linkedCollaboratore.cognome}
                      </span>
                    )}
                  </div>
                  
                  {loadingTurni ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : linkedCollaboratore ? (
                    <div className="space-y-3">
                      {userTurni.length === 0 && !showAddTurno ? (
                        <div className="bg-muted/30 rounded-lg p-4 text-center">
                          <Clock className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                          <p className="text-xs text-muted-foreground mb-3">
                            Nessun turno definito per questa settimana
                          </p>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setShowAddTurno(true)}
                            className="gap-2"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            Inserisci Turni
                          </Button>
                        </div>
                      ) : showAddTurno ? (
                        <div className="bg-muted/30 rounded-lg p-3 space-y-3">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs font-medium">Seleziona Turno</Label>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-6 text-xs"
                              onClick={() => setShowAddTurno(false)}
                            >
                              Annulla
                            </Button>
                          </div>
                          
                          {turniPredefiniti.length === 0 ? (
                            <div className="text-center py-4 text-muted-foreground text-xs">
                              Nessun turno predefinito configurato.
                              <br />
                              <span className="text-[10px]">Configura i turni nel modulo HR Manager → Turni</span>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 gap-2">
                              {turniPredefiniti.map((turnoOption: any) => (
                                <button
                                  key={turnoOption.id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedTurnoId(turnoOption.id);
                                    setNewTurno({ 
                                      ...newTurno, 
                                      oraInizio: turnoOption.oraInizio, 
                                      oraFine: turnoOption.oraFine 
                                    });
                                  }}
                                  className={`p-3 rounded-lg border text-left transition-colors ${
                                    selectedTurnoId === turnoOption.id
                                      ? "bg-primary/10 border-primary text-primary"
                                      : "bg-background border-border hover:bg-muted"
                                  }`}
                                  style={{ borderLeftColor: turnoOption.colore, borderLeftWidth: 3 }}
                                >
                                  <div className="text-sm font-medium">{turnoOption.nome}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {turnoOption.oraInizio} - {turnoOption.oraFine}
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}
                          
                          <Button 
                            onClick={saveWeeklyTurni} 
                            disabled={savingTurno || !selectedTurnoId}
                            size="sm"
                            className="w-full"
                          >
                            {savingTurno ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                              <Plus className="h-4 w-4 mr-2" />
                            )}
                            Applica Turno (Lun-Ven)
                          </Button>
                        </div>
                      ) : (
                        <div className="bg-muted/30 rounded-lg p-3">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="border-b border-border/50">
                                <th className="text-left py-1.5 text-muted-foreground font-medium w-16">Giorno</th>
                                <th className="text-center py-1.5 text-muted-foreground font-medium">Data</th>
                                <th className="text-center py-1.5 text-muted-foreground font-medium">Ingresso</th>
                                <th className="text-center py-1.5 text-muted-foreground font-medium">Uscita</th>
                              </tr>
                            </thead>
                            <tbody>
                              {["Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato", "Domenica"].map((day, idx) => {
                                const today = new Date();
                                const weekStart = startOfWeek(today, { weekStartsOn: 1 });
                                const dateStr = format(addDays(weekStart, idx), "yyyy-MM-dd");
                                const turno = userTurni.find((t: any) => t.data === dateStr);
                                const isWeekend = idx >= 5;
                                
                                return (
                                  <tr 
                                    key={day} 
                                    className={`border-b border-border/30 last:border-0 ${isWeekend ? "text-muted-foreground/70" : ""}`}
                                  >
                                    <td className="py-1.5 font-medium">{day.slice(0, 3)}</td>
                                    <td className="py-1.5 text-center text-muted-foreground">
                                      {format(addDays(weekStart, idx), "dd/MM")}
                                    </td>
                                    <td className="py-1.5 text-center">
                                      {turno ? (
                                        <span className="bg-green-500/20 text-green-700 dark:text-green-400 px-2 py-0.5 rounded font-medium">
                                          {turno.oraInizio}
                                        </span>
                                      ) : (
                                        <span className="text-muted-foreground">—</span>
                                      )}
                                    </td>
                                    <td className="py-1.5 text-center">
                                      {turno ? (
                                        <span className="bg-orange-500/20 text-orange-700 dark:text-orange-400 px-2 py-0.5 rounded font-medium">
                                          {turno.oraFine}
                                        </span>
                                      ) : (
                                        <span className="text-muted-foreground">—</span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setShowAddTurno(true)}
                            className="w-full mt-2 h-7 text-xs gap-1"
                          >
                            <Plus className="h-3 w-3" />
                            Aggiungi Turni
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-muted/30 rounded-lg p-4 text-center">
                      <Calendar className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground">
                        Nessun collaboratore collegato
                      </p>
                      <p className="text-[10px] text-muted-foreground/70 mt-1">
                        Verifica che l'email corrisponda all'anagrafica
                      </p>
                    </div>
                  )}
                </div>

                <Button onClick={handleSaveUser} className="w-full">
                  Salva Modifiche
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map((user: any) => (
          <div 
            key={user.id} 
            className={`bg-card rounded-xl border p-4 transition-all hover:shadow-md group ${
              user.status === 'Disabled' ? 'opacity-60 border-red-200 dark:border-red-900/50' : 'border-border/60'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 ring-2 ring-offset-2 ring-offset-background ring-primary/20">
                  <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-bold">
                    {user.avatar}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-semibold">{user.name}</div>
                  <div className="text-xs text-muted-foreground">{user.email}</div>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Azioni</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => handleEditUser(user)}>
                    <Edit2 className="mr-2 h-4 w-4" /> Modifica
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleConfigureEmail(user)}>
                    <Settings className="mr-2 h-4 w-4" /> Configura Email
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {user.status === 'Disabled' ? (
                    <DropdownMenuItem 
                      className="text-green-600"
                      onClick={() => toggleStatusMutation.mutate({ id: user.id, status: 'Active' })}
                    >
                      <UserCheck className="mr-2 h-4 w-4" /> Abilita
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem 
                      className="text-orange-600"
                      onClick={() => toggleStatusMutation.mutate({ id: user.id, status: 'Disabled' })}
                    >
                      <UserX className="mr-2 h-4 w-4" /> Disabilita
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="text-red-600"
                    onClick={() => deleteMutation.mutate(user.id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" /> Elimina
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            <div className="flex items-center gap-2 mb-3">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                user.role === 'Admin' 
                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                  : user.role === 'Manager'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
              }`}>
                <Shield className="h-3 w-3" />
                {user.role}
              </span>
              {user.department && (
                <span className="bg-muted px-2 py-0.5 rounded-full text-xs text-muted-foreground">
                  {user.department}
                </span>
              )}
            </div>
            
            <div className="flex items-center justify-between pt-3 border-t border-border/50">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <div className={`h-2.5 w-2.5 rounded-full ${
                    user.status === 'Active' ? 'bg-green-500 animate-pulse' 
                    : user.status === 'Disabled' ? 'bg-red-500' 
                    : user.status === 'Offline' ? 'bg-neutral-400' 
                    : 'bg-yellow-400'
                  }`} />
                  <span className={`text-xs font-medium ${
                    user.status === 'Active' ? 'text-green-600' 
                    : user.status === 'Disabled' ? 'text-red-600' 
                    : 'text-muted-foreground'
                  }`}>
                    {user.status === 'Disabled' ? 'Disabilitato' : user.status === 'Active' ? 'Attivo' : user.status}
                  </span>
                </div>
                {collaboratori.some((c: any) => c.email?.toLowerCase() === user.email?.toLowerCase()) && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30 px-1.5 py-0.5 rounded-full font-medium">
                    <Fingerprint className="h-2.5 w-2.5" />
                    Portale
                  </span>
                )}
              </div>
              {user.allowedIp && (
                <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded font-mono">
                  IP: {user.allowedIp}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {selectedUserForEmail && (
        <UserEmailConfigDialog
          open={emailConfigDialogOpen}
          onOpenChange={setEmailConfigDialogOpen}
          userId={selectedUserForEmail.id}
          userName={selectedUserForEmail.name}
        />
      )}
    </div>
  );
}
