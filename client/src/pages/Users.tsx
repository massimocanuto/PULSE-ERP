import { AppLayout } from "@/components/layout/AppLayout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Mail, Shield, Trash2, Edit2, Loader2, UserPlus, UserCheck, UserX, Users } from "lucide-react";
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
import { useState, useMemo } from "react";
import { Switch } from "@/components/ui/switch";

export default function Users() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [newUser, setNewUser] = useState({ name: "", email: "", role: "Member", department: "", username: "", password: "" });
  const [showPersonaleSuggestions, setShowPersonaleSuggestions] = useState(false);

  const { data: personale = [] } = useQuery({
    queryKey: ["anagrafica-personale"],
    queryFn: async () => {
      const res = await fetch("/api/anagrafica/personale", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const personaleSuggestions = useMemo(() => {
    if (!newUser.name || newUser.name.length < 2) return [];
    const search = newUser.name.toLowerCase();
    return personale.filter((p: any) => {
      const fullName = `${p.nome || ""} ${p.cognome || ""}`.toLowerCase();
      return fullName.includes(search);
    }).slice(0, 5);
  }, [newUser.name, personale]);

  const selectPersonale = (p: any) => {
    const fullName = `${p.nome || ""} ${p.cognome || ""}`.trim();
    const username = generateUsername(fullName);
    setNewUser({
      ...newUser,
      name: fullName,
      email: p.email || "",
      department: p.reparto || "",
      username,
    });
    setShowPersonaleSuggestions(false);
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
      setNewUser({ name: "", email: "", role: "Member", department: "", username: "", password: "" });
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

  const handleEditUser = (user: any) => {
    setEditingUser({ ...user });
    setEditDialogOpen(true);
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
        avatar: editingUser.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
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
        avatar: newUser.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
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
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="w-full bg-gradient-to-br from-[#f5f0e6] via-[#e8dcc8] to-[#ddd0b8] dark:from-[#2d3748] dark:via-[#374151] dark:to-[#3d4555]">
        <div className="h-32 w-full bg-gradient-to-r from-[#4a5568] via-[#5a6a7d] to-[#6b7a8f]" />
        
        <div className="relative -mt-20 px-8 pb-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 bg-card rounded-xl flex items-center justify-center shadow-md">
              <UserCheck className="h-8 w-8 text-amber-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white drop-shadow-md">Gestione Utenti</h1>
              <p className="text-white/80">Gestisci accessi e ruoli del team</p>
            </div>
          </div>
        </div>

        <div className="px-8 pb-8">
        <div className="flex items-center justify-end mb-8">
           <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
             <DialogTrigger asChild>
               <Button data-testid="button-invite-user"><UserPlus className="h-4 w-4 mr-2" /> Nuovo Utente</Button>
             </DialogTrigger>
             <DialogContent>
               <DialogHeader>
                 <DialogTitle>Nuovo Utente</DialogTitle>
               </DialogHeader>
               <div className="space-y-4 pt-4">
                 <div className="space-y-2">
                   <Label className="flex items-center gap-2">
                     Nome completo
                     {personale.length > 0 && <span className="text-xs text-muted-foreground">(digita per cercare in anagrafica)</span>}
                   </Label>
                   <div className="relative">
                     <Input 
                       placeholder="Nome Cognome" 
                       value={newUser.name}
                       onChange={(e) => {
                         handleNameChange(e.target.value);
                         setShowPersonaleSuggestions(true);
                       }}
                       onFocus={() => setShowPersonaleSuggestions(true)}
                       onBlur={() => setTimeout(() => setShowPersonaleSuggestions(false), 200)}
                       data-testid="input-user-name"
                     />
                     {showPersonaleSuggestions && personaleSuggestions.length > 0 && (
                       <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-48 overflow-y-auto">
                         <div className="px-2 py-1 text-xs text-muted-foreground border-b bg-muted/50 flex items-center gap-1">
                           <Users className="h-3 w-3" />
                           Collaboratori in anagrafica
                         </div>
                         {personaleSuggestions.map((p: any) => (
                           <div
                             key={p.id}
                             className="px-3 py-2 hover:bg-accent cursor-pointer flex items-center justify-between"
                             onMouseDown={() => selectPersonale(p)}
                           >
                             <div>
                               <span className="font-medium">{p.nome} {p.cognome}</span>
                               {p.ruolo && <span className="text-xs text-muted-foreground ml-2">({p.ruolo})</span>}
                             </div>
                             {p.reparto && <Badge variant="outline" className="text-xs">{p.reparto}</Badge>}
                           </div>
                         ))}
                       </div>
                     )}
                   </div>
                 </div>
                 <div className="space-y-2">
                   <Label>Email</Label>
                   <Input 
                     placeholder="email@esempio.com" 
                     type="email"
                     value={newUser.email}
                     onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                     data-testid="input-user-email"
                   />
                 </div>
                 <div className="space-y-2">
                   <Label>Username (auto-generato)</Label>
                   <Input 
                     placeholder="nome.cognome" 
                     value={newUser.username}
                     onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                     data-testid="input-user-username"
                   />
                 </div>
                 <div className="space-y-2">
                   <Label>Password</Label>
                   <Input 
                     placeholder="Password" 
                     type="password"
                     value={newUser.password}
                     onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                     data-testid="input-user-password"
                   />
                 </div>
                 <div className="space-y-2">
                   <Label>Dipartimento</Label>
                   <Input 
                     placeholder="Dipartimento" 
                     value={newUser.department}
                     onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
                     data-testid="input-user-department"
                   />
                 </div>
                 <Button onClick={handleCreateUser} className="w-full" data-testid="button-create-user">
                   Invia Invito
                 </Button>
               </div>
             </DialogContent>
           </Dialog>

           <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
             <DialogContent>
               <DialogHeader>
                 <DialogTitle>Modifica Utente</DialogTitle>
               </DialogHeader>
               {editingUser && (
                 <div className="space-y-4 pt-4">
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
                   <Button onClick={handleSaveUser} className="w-full">
                     Salva Modifiche
                   </Button>
                 </div>
               )}
             </DialogContent>
           </Dialog>
        </div>

        <div className="border border-border/60 rounded-lg overflow-hidden">
           <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-xs text-muted-foreground uppercase font-medium border-b border-border/60">
                 <tr>
                    <th className="px-6 py-3 w-[300px]">Name</th>
                    <th className="px-6 py-3">Role</th>
                    <th className="px-6 py-3">Department</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 w-[50px]"></th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-border/40 bg-card">
                 {users.map((user: any) => (
                    <tr key={user.id} data-testid={`row-user-${user.id}`} className="hover:bg-muted/50/50 transition-colors group">
                       <td className="px-6 py-3">
                          <div className="flex items-center gap-3">
                             <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-orange-100 text-orange-700 text-xs font-bold">{user.avatar}</AvatarFallback>
                             </Avatar>
                             <div>
                                <div className="font-medium text-foreground">{user.name}</div>
                                <div className="text-xs text-muted-foreground">{user.email}</div>
                             </div>
                          </div>
                       </td>
                       <td className="px-6 py-3">
                          <div className="flex items-center gap-1.5">
                             <Shield className="h-3 w-3 text-muted-foreground" />
                             <span>{user.role}</span>
                          </div>
                       </td>
                       <td className="px-6 py-3">
                          <span className="bg-muted px-2 py-0.5 rounded text-muted-foreground border border-border text-xs">
                             {user.department}
                          </span>
                       </td>
                       <td className="px-6 py-3">
                          <div className="flex items-center gap-1.5">
                             <div className={`h-2 w-2 rounded-full ${user.status === 'Active' ? 'bg-green-500' : user.status === 'Disabled' ? 'bg-red-500' : user.status === 'Offline' ? 'bg-neutral-400' : 'bg-yellow-400'}`} />
                             <span className={user.status === 'Disabled' ? 'text-red-600 font-medium' : ''}>
                               {user.status === 'Disabled' ? 'Disabilitato' : user.status === 'Active' ? 'Attivo' : user.status}
                             </span>
                          </div>
                       </td>
                       <td className="px-6 py-3 text-right">
                          <DropdownMenu>
                             <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                                   <MoreHorizontal className="h-4 w-4" />
                                </Button>
                             </DropdownMenuTrigger>
                             <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Azioni</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => handleEditUser(user)}>
                                  <Edit2 className="mr-2 h-4 w-4" /> Modifica Utente
                                </DropdownMenuItem>
                                <DropdownMenuItem><Mail className="mr-2 h-4 w-4" /> Invia Email</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {user.status === 'Disabled' ? (
                                  <DropdownMenuItem 
                                    className="text-green-600"
                                    onClick={() => toggleStatusMutation.mutate({ id: user.id, status: 'Active' })}
                                  >
                                    <UserCheck className="mr-2 h-4 w-4" /> Abilita Utente
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem 
                                    className="text-orange-600"
                                    onClick={() => toggleStatusMutation.mutate({ id: user.id, status: 'Disabled' })}
                                  >
                                    <UserX className="mr-2 h-4 w-4" /> Disabilita Utente
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  className="text-red-600"
                                  onClick={() => deleteMutation.mutate(user.id)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" /> Rimuovi Utente
                                </DropdownMenuItem>
                             </DropdownMenuContent>
                          </DropdownMenu>
                       </td>
                    </tr>
                 ))}
              </tbody>
           </table>
        </div>
        </div>
      </div>
    </AppLayout>
  );
}
