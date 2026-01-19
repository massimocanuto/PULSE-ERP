import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, RefreshCw, Search, Trash2, Edit2, Mail, Phone, Link as LinkIcon, AlertTriangle, User, Building2, Briefcase, StickyNote, Calendar, RotateCcw, AlertOctagon } from "lucide-react";
import { Contact } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";

export function ContactsTab() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const { user: authUser } = useAuth();
    const [searchTerm, setSearchTerm] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingContact, setEditingContact] = useState<Contact | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        givenName: "",
        familyName: "",
        email: "",
        phone: "",
        company: "",
        jobTitle: "",
        notes: "",
        birthday: ""
    });

    // Check for successful connection return
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get("google_connected") === "true") {
            setTimeout(() => {
                toast({ title: "Google Connesso", description: "Account collegato con successo. Ora puoi sincronizzare.", variant: "default" });
            }, 500);
            // Clean URL
            window.history.replaceState({}, document.title, window.location.pathname + "?tab=contatti");
        }
    }, [toast]);


    const [viewMode, setViewMode] = useState<"active" | "trash">("active");

    const { data: contacts, isLoading: isActiveLoading, refetch: refetchActive } = useQuery<Contact[]>({
        queryKey: ["contacts", authUser?.id],
        queryFn: async () => {
            if (!authUser?.id) return [];
            const res = await fetch(`/api/contacts?userId=${authUser.id}`, {
                headers: { "x-user-id": authUser.id },
                credentials: "include"
            });
            if (res.status === 401) return [];
            if (!res.ok) throw new Error("Error fetching contacts");
            return res.json();
        },
        enabled: !!authUser?.id && viewMode === "active"
    });

    const { data: trashContacts, isLoading: isTrashLoading, refetch: refetchTrash } = useQuery<Contact[]>({
        queryKey: ["contacts-trash", authUser?.id],
        queryFn: async () => {
            if (!authUser?.id) return [];
            const res = await fetch(`/api/contacts/trash?userId=${authUser.id}`, {
                headers: { "x-user-id": authUser.id },
                credentials: "include"
            });
            if (res.status === 401) return [];
            if (!res.ok) throw new Error("Error fetching trash");
            return res.json();
        },
        enabled: !!authUser?.id && viewMode === "trash"
    });

    const currentContacts = viewMode === "active" ? (contacts || []) : (trashContacts || []);
    const isLoading = viewMode === "active" ? isActiveLoading : isTrashLoading;

    // Filter Logic
    const filteredContacts = currentContacts.filter(contact =>
        (contact.givenName?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (contact.familyName?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (contact.email?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (contact.company?.toLowerCase() || "").includes(searchTerm.toLowerCase())
    );

    const restoreMutation = useMutation({
        mutationFn: async (id: string) => {
            await fetch(`/api/contacts/restore/${id}`, {
                method: "POST",
                headers: { "x-user-id": authUser?.id || "" },
                credentials: "include"
            });
        },
        onSuccess: () => {
            toast({ title: "Contatto Ripristinato", description: "Il contatto è di nuovo nella rubrica." });
            queryClient.invalidateQueries({ queryKey: ["contacts"] });
            queryClient.invalidateQueries({ queryKey: ["contacts-trash"] });
        }
    });

    const permanentDeleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await fetch(`/api/contacts/trash/${id}`, {
                method: "DELETE",
                headers: { "x-user-id": authUser?.id || "" },
                credentials: "include"
            });
        },
        onSuccess: () => {
            toast({ title: "Eliminato Definitivamente", description: "Contatto rimosso per sempre." });
            queryClient.invalidateQueries({ queryKey: ["contacts-trash"] });
        }
    });

    const emptyTrashMutation = useMutation({
        mutationFn: async () => {
            await fetch("/api/contacts/empty-trash", {
                method: "POST",
                headers: { "x-user-id": authUser?.id || "" },
                credentials: "include"
            });
        },
        onSuccess: () => {
            toast({ title: "Cestino Svuotato", description: "Tutti i contatti nel cestino sono stati eliminati." });
            queryClient.invalidateQueries({ queryKey: ["contacts-trash"] });
        }
    });

    const getDaysRemaining = (deletedAt?: string | null) => {
        if (!deletedAt) return 30;
        const deletedDate = new Date(deletedAt);
        const thirtyDaysLater = new Date(deletedDate);
        thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
        const now = new Date();
        const diffTime = thirtyDaysLater.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 ? diffDays : 0;
    };

    const connectGoogle = async () => {
        try {
            const res = await fetch("/api/contacts/auth/url", {
                credentials: "include",
                headers: { "x-user-id": authUser?.id || "" }
            });
            const data = await res.json();
            if (data.error || !data.url) {
                console.error("Auth URL missing:", data);
                toast({ title: "Errore Configurazione", description: data.error || "Risposta server non valida (URL mancante)", variant: "destructive" });
                return;
            }
            // Redirect to Google Auth
            window.location.href = data.url;
        } catch (e) {
            toast({ title: "Errore", description: "Impossibile avviare connessione", variant: "destructive" });
        }
    };

    const syncMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch("/api/contacts/sync", {
                method: "POST",
                credentials: "include",
                headers: { "x-user-id": authUser?.id || "" }
            });
            if (res.status === 401) {
                // Check body for specific error
                const err = await res.json().catch(() => ({}));
                if (err.error && err.error.includes("Non connesso")) {
                    throw new Error("AUTH_REQUIRED");
                }
            }
            if (!res.ok) {
                const err = await res.json().catch(() => ({ error: "Errore sconosciuto" }));
                throw new Error(err.error || "Sync failed");
            }
            return res.json();
        },
        onSuccess: (data) => {
            toast({ title: "Sincronizzazione Completata", description: `${data.count} contatti sincronizzati da Google.` });
            queryClient.invalidateQueries({ queryKey: ["contacts"] });
        },
        onError: (err: Error) => {
            if (err.message === "AUTH_REQUIRED") {
                toast({
                    title: "Non connesso",
                    description: "Devi collegare l'account Google prima di poter sincronizzare.",
                    variant: "destructive"
                });
                // Optionally auto-trigger connect? No, manual is better.
            } else {
                toast({ title: "Errore Sincronizzazione", description: err.message, variant: "destructive" });
            }
        }
    });

    const saveMutation = useMutation({
        mutationFn: async (data: any) => {
            const url = editingContact ? `/api/contacts/${editingContact.id}` : "/api/contacts";
            const method = editingContact ? "PUT" : "POST";
            const res = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    "x-user-id": authUser?.id || ""
                },
                body: JSON.stringify({ ...data, userId: authUser?.id }),
                credentials: "include"
            });
            if (!res.ok) throw new Error("Save failed");
            return res.json();
        },
        onSuccess: () => {
            toast({ title: "Successo", description: "Contatto salvato." });
            setIsDialogOpen(false);
            resetForm();
            queryClient.invalidateQueries({ queryKey: ["contacts"] });
        },
        onError: () => {
            toast({ title: "Errore", description: "Impossibile salvare il contatto.", variant: "destructive" });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`/api/contacts/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Delete failed");
        },
        onSuccess: () => {
            toast({ title: "Contatto eliminato" });
            queryClient.invalidateQueries({ queryKey: ["contacts"] });
        }
    });

    const resetForm = () => {
        setFormData({
            givenName: "",
            familyName: "",
            email: "",
            phone: "",
            company: "",
            jobTitle: "",
            notes: "",
            birthday: ""
        });
        setEditingContact(null);
    };

    const handleEdit = (contact: Contact) => {
        setEditingContact(contact);
        setFormData({
            givenName: contact.givenName || "",
            familyName: contact.familyName || "",
            email: contact.email || "",
            phone: contact.phone || "",
            company: contact.company || "",
            jobTitle: contact.jobTitle || "",
            notes: contact.notes || "",
            birthday: contact.birthday || ""
        });
        setIsDialogOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (confirm("Sei sicuro di voler eliminare questo contatto?")) {
            deleteMutation.mutate(id);
        }
    };



    return (
        <Card className="p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
                <div>
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300">
                            <Phone className="h-5 w-5" />
                        </div>
                        Rubrica Contatti
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">Gestisci i tuoi contatti e sincronizzali con Google.</p>
                </div>

                <div className="flex gap-2">
                    <div className="flex bg-muted p-1 rounded-lg mr-2">
                        <Button
                            variant={viewMode === "active" ? "secondary" : "ghost"}
                            size="sm"
                            onClick={() => setViewMode("active")}
                            className="text-xs"
                        >
                            Rubrica
                        </Button>
                        <Button
                            variant={viewMode === "trash" ? "secondary" : "ghost"}
                            size="sm"
                            onClick={() => setViewMode("trash")}
                            className="text-xs flex items-center gap-1"
                        >
                            <Trash2 className="h-3 w-3" /> Cestino
                        </Button>
                    </div>

                    {viewMode === "active" ? (
                        <>
                            <Button variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-300 dark:hover:bg-blue-900/50" onClick={connectGoogle}>
                                <LinkIcon className="h-4 w-4 mr-2" /> Collega Google
                            </Button>
                            <Button variant="outline" onClick={() => syncMutation.mutate()} disabled={syncMutation.isPending}>
                                {syncMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                                Sincronizza
                            </Button>
                            <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
                                <Plus className="h-4 w-4 mr-2" /> Nuovo Contatto
                            </Button>
                        </>
                    ) : (
                        <Button
                            variant="destructive"
                            onClick={() => emptyTrashMutation.mutate()}
                            disabled={emptyTrashMutation.isPending || trashContacts?.length === 0}
                        >
                            <AlertOctagon className="h-4 w-4 mr-2" /> Svuota Cestino
                        </Button>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-2 mb-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Cerca nome, email, azienda..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>{viewMode === "active" ? "Telefono" : "Scadenza"}</TableHead>
                            <TableHead>{viewMode === "active" ? "Azienda" : "Stato"}</TableHead>
                            <TableHead className="text-right">Azioni</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8">
                                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                                </TableCell>
                            </TableRow>
                        ) : filteredContacts.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                    Nessun contatto trovato.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredContacts.map((contact) => (
                                <TableRow key={contact.id}>
                                    <TableCell className="font-medium">
                                        {contact.givenName} {contact.familyName}
                                        {contact.googleId && (
                                            <Badge variant="secondary" className="ml-2 text-[10px] bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200">
                                                Google
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {contact.email && (
                                            <div className="flex items-center gap-1 text-sm">
                                                <Mail className="h-3 w-3 text-muted-foreground" />
                                                <a href={`mailto:${contact.email}`} className="hover:underline">{contact.email}</a>
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {viewMode === "active" ? contact.phone : (
                                            <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50">
                                                {getDaysRemaining(contact.deletedAt)} giorni
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {viewMode === "active" ? (
                                            contact.company && (
                                                <div className="flex flex-col">
                                                    <span>{contact.company}</span>
                                                    <span className="text-xs text-muted-foreground">{contact.jobTitle}</span>
                                                </div>
                                            )
                                        ) : (
                                            <span className="text-xs text-muted-foreground italic">In Cestino</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-1">
                                            {viewMode === "active" ? (
                                                <>
                                                    <Button variant="ghost" size="sm" onClick={() => handleEdit(contact)}>
                                                        <Edit2 className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(contact.id)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </>
                                            ) : (
                                                <>
                                                    <Button variant="ghost" size="sm" onClick={() => restoreMutation.mutate(contact.id)} title="Ripristina">
                                                        <RotateCcw className="h-4 w-4 text-green-600" />
                                                    </Button>
                                                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => permanentDeleteMutation.mutate(contact.id)} title="Elimina per sempre">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[800px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl">
                            {editingContact ? <Edit2 className="h-5 w-5 text-blue-600" /> : <Plus className="h-5 w-5 text-blue-600" />}
                            {editingContact ? "Modifica Contatto" : "Nuovo Contatto"}
                        </DialogTitle>
                        <DialogDescription>
                            Inserisci i dettagli del contatto. I dati verranno salvati localmente e sincronizzati se richiesto.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-6 py-4">
                        {/* Avatar + Main Info */}
                        <div className="flex flex-col md:flex-row gap-6 items-start">
                            {/* Avatar Placeholder */}
                            <div className="flex-shrink-0 mx-auto md:mx-0">
                                <div className="h-24 w-24 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 text-3xl font-bold border-4 border-white dark:border-stone-800 shadow-sm">
                                    {formData.givenName?.[0]?.toUpperCase() || formData.familyName?.[0]?.toUpperCase() || <User className="h-10 w-10 opacity-50" />}
                                </div>
                            </div>

                            {/* Name Fields */}
                            <div className="flex-1 space-y-4 w-full">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Nome</Label>
                                        <Input value={formData.givenName} onChange={(e) => setFormData({ ...formData, givenName: e.target.value })} placeholder="Mario" className="bg-stone-50/50 border-stone-200 dark:border-stone-800" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Cognome</Label>
                                        <Input value={formData.familyName} onChange={(e) => setFormData({ ...formData, familyName: e.target.value })} placeholder="Rossi" className="bg-stone-50/50 border-stone-200 dark:border-stone-800" />
                                    </div>
                                </div>

                                <div className="space-y-2 relative">
                                    <Label className="sr-only">Email</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input className="pl-9" type="email" placeholder="email@esempio.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                                    </div>
                                </div>

                                <div className="space-y-2 relative">
                                    <Label className="sr-only">Telefono</Label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input className="pl-9" placeholder="+39 333 ..." value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                                    </div>
                                </div>

                                <div className="space-y-2 relative">
                                    <Label className="sr-only">Compleanno</Label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            className="pl-9"
                                            type="date"
                                            value={formData.birthday}
                                            onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
                                            title="Data di Nascita"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="h-px bg-border" />

                        {/* Professional Info */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2 text-sm font-medium">Azienda <Building2 className="h-4 w-4 text-primary/70" /></Label>
                                <Input placeholder="Nome Azienda" value={formData.company} onChange={(e) => setFormData({ ...formData, company: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2 text-sm font-medium"><Briefcase className="h-4 w-4 text-primary/70" /> Ruolo</Label>
                                <Input placeholder="CEO, Manager, etc." value={formData.jobTitle} onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="flex items-center gap-2 text-sm font-medium"><StickyNote className="h-4 w-4 text-primary/70" /> Note</Label>
                            <Textarea placeholder="Aggiungi note aggiuntive..." className="resize-none min-h-[80px]" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Annulla</Button>
                        <Button onClick={() => saveMutation.mutate(formData)} disabled={saveMutation.isPending} className="px-8 font-medium">
                            {saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                            Salva Contatto
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </Card>
    );
}
