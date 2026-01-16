import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    FileText,
    FileSpreadsheet,
    Presentation,
    Plus,
    History,
    Search,
    MoreVertical,
    ExternalLink,
    Trash2,
    Clock,
    User,
    LayoutGrid,
    List,
    Loader2,
    Download
} from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

type OfficeDocType = 'docx' | 'xlsx' | 'pptx';

export default function OfficePulse() {
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [searchQuery, setSearchQuery] = useState("");
    const [, setLocation] = useLocation();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [newDocType, setNewDocType] = useState<OfficeDocType>('docx');
    const [newDocTitle, setNewDocTitle] = useState("");

    const { data: documents, isLoading } = useQuery({
        queryKey: ['/api/office/documents'],
        queryFn: async () => {
            const res = await fetch('/api/office/documents');
            if (!res.ok) throw new Error("Errore caricamento documenti");
            return res.json();
        }
    });

    const createMutation = useMutation({
        mutationFn: async (data: { title: string, type: OfficeDocType }) => {
            const res = await fetch('/api/office/documents', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!res.ok) throw new Error("Errore creazione documento");
            return res.json();
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['/api/office/documents'] });
            setIsCreateDialogOpen(false);
            setNewDocTitle("");
            setLocation(`/office-editor/${data.id}`);
            toast({ title: "Successo", description: "Documento creato correttamente" });
        },
        onError: (err: any) => {
            toast({ title: "Errore", description: err.message, variant: "destructive" });
        }
    });

    const tools = [
        {
            id: 'docx' as OfficeDocType,
            title: 'Word Pulse',
            description: 'Documenti di testo, preventivi e relazioni',
            icon: FileText,
            color: 'bg-blue-600',
            lightColor: 'bg-blue-50',
            textColor: 'text-blue-600',
            borderColor: 'border-blue-200'
        },
        {
            id: 'xlsx' as OfficeDocType,
            title: 'Excel Pulse',
            description: 'Fogli di calcolo, analisi dati e budget',
            icon: FileSpreadsheet,
            color: 'bg-emerald-600',
            lightColor: 'bg-emerald-50',
            textColor: 'text-emerald-600',
            borderColor: 'border-emerald-200'
        },
        {
            id: 'pptx' as OfficeDocType,
            title: 'Power Pulse',
            description: 'Presentazioni aziendali e pitch deck',
            icon: Presentation,
            color: 'bg-orange-600',
            lightColor: 'bg-orange-50',
            textColor: 'text-orange-600',
            borderColor: 'border-orange-200'
        }
    ];

    const getFileIcon = (type: string) => {
        switch (type) {
            case 'docx': return <FileText className="h-5 w-5 text-blue-600" />;
            case 'xlsx': return <FileSpreadsheet className="h-5 w-5 text-emerald-600" />;
            case 'pptx': return <Presentation className="h-5 w-5 text-orange-600" />;
            default: return <FileText className="h-5 w-5 text-slate-600" />;
        }
    };

    const handleCreateClick = (type: OfficeDocType) => {
        setNewDocType(type);
        setIsCreateDialogOpen(true);
    };

    const filteredDocs = documents?.filter((doc: any) =>
        doc.title.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

    return (
        <AppLayout>
            <div className="flex flex-col h-full bg-slate-50/50">
                <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white px-8 py-10 shadow-lg">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 max-w-7xl mx-auto w-full">
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight mb-2 flex items-center gap-3">
                                <LayoutGrid className="h-6 w-6 text-indigo-400" />
                                Office Pulse
                            </h1>
                            <p className="text-sm text-slate-300 max-w-lg">
                                Crea, modifica e collabora su documenti Word, Excel e PowerPoint direttamente dal tuo ERP.
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            <Button variant="secondary" className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-sm">
                                <History className="h-4 w-4 mr-2" />
                                Cronologia
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-auto px-8 py-8">
                    <div className="max-w-7xl mx-auto space-y-10">

                        <section>
                            <div className="flex items-center justify-between mb-6 text-slate-800">
                                <h2 className="text-lg font-bold flex items-center gap-2">
                                    <Plus className="h-4 w-4 text-indigo-600" />
                                    Crea nuovo
                                </h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {tools.map((tool) => (
                                    <Card key={tool.id} className="group hover:shadow-xl transition-all duration-300 border-slate-200 cursor-pointer overflow-hidden border-2 hover:border-indigo-400/30" onClick={() => handleCreateClick(tool.id)}>
                                        <CardHeader className={`${tool.lightColor} border-b border-slate-100 p-6 flex items-center justify-center`}>
                                            <div className={`${tool.color} text-white p-4 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                                <tool.icon className="h-8 w-8" />
                                            </div>
                                        </CardHeader>
                                        <CardContent className="p-5 text-center">
                                            <h3 className={`text-lg font-bold mb-2 ${tool.textColor}`}>{tool.title}</h3>
                                            <p className="text-xs text-slate-500 mb-4">{tool.description}</p>
                                            <Button size="sm" className={`w-full ${tool.color} hover:opacity-90`}>
                                                Crea {tool.id.toUpperCase()}
                                            </Button>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </section>

                        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-indigo-500" />
                                        Documenti Recenti
                                    </h2>
                                    <div className="flex bg-slate-200/50 p-1 rounded-lg">
                                        <Button
                                            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                                            size="sm"
                                            className="h-7 w-7 p-0"
                                            onClick={() => setViewMode('grid')}
                                        >
                                            <LayoutGrid className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                                            size="sm"
                                            className="h-7 w-7 p-0"
                                            onClick={() => setViewMode('list')}
                                        >
                                            <List className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                <div className="relative flex-1 md:max-w-md">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input
                                        placeholder="Cerca tra i tuoi documenti..."
                                        className="pl-10 h-9 bg-white border-slate-200 focus:ring-indigo-500"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="p-6">
                                {isLoading ? (
                                    <div className="flex items-center justify-center py-12">
                                        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                                    </div>
                                ) : filteredDocs.length === 0 ? (
                                    <div className="text-center py-12">
                                        <div className="bg-slate-50 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                                            <Search className="h-8 w-8 text-slate-300" />
                                        </div>
                                        <p className="text-slate-500">Nessun documento trovato.</p>
                                    </div>
                                ) : (
                                    <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" : "space-y-2"}>
                                        {filteredDocs.map((doc: any) => (
                                            viewMode === 'grid' ? (
                                                <div key={doc.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/30 hover:bg-white hover:shadow-md transition-all group">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <div className="p-2 bg-white rounded-lg shadow-sm border border-slate-100">
                                                            {getFileIcon(doc.type)}
                                                        </div>
                                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-8 w-8 p-0"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    window.open(`/api/office/download/${doc.id}`, '_blank');
                                                                }}
                                                                title="Download"
                                                            >
                                                                <Download className="h-4 w-4" />
                                                            </Button>
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={(e) => e.stopPropagation()}>
                                                                        <MoreVertical className="h-4 w-4" />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end">
                                                                    <DropdownMenuItem onClick={() => setLocation(`/office-editor/${doc.id}`)}><ExternalLink className="h-4 w-4 mr-2" /> Apri Editor</DropdownMenuItem>
                                                                    <DropdownMenuItem onClick={() => window.open(`/api/office/download/${doc.id}`, '_blank')}><Download className="h-4 w-4 mr-2" /> Download</DropdownMenuItem>
                                                                    <DropdownMenuItem className="text-red-600"><Trash2 className="h-4 w-4 mr-2" /> Elimina</DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </div>
                                                    </div>
                                                    <p className="font-semibold text-sm truncate text-slate-700 mb-1">{doc.title}</p>
                                                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {new Date(doc.updatedAt).toLocaleDateString()}</span>
                                                        <span>•</span>
                                                        <Badge variant="outline" className="text-[8px] h-4 py-0 uppercase">{doc.type}</Badge>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div key={doc.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0 cursor-pointer" onClick={() => setLocation(`/office-editor/${doc.id}`)}>
                                                    <div className="p-2 bg-white rounded border border-slate-100">
                                                        {getFileIcon(doc.type)}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium text-sm text-slate-700 truncate">{doc.title}</p>
                                                        <p className="text-[10px] text-slate-400">Modificato il {new Date(doc.updatedAt).toLocaleString()}</p>
                                                    </div>
                                                    <Badge variant="outline" className="text-[10px] uppercase font-bold text-slate-400">{doc.type}</Badge>
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={(e) => e.stopPropagation()}>
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            )
                                        ))}
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>
                </div>
            </div>

            {/* Dialog creation */}
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Crea nuovo documento {newDocType.toUpperCase()}</DialogTitle>
                        <DialogDescription>
                            Inserisci un titolo per il tuo nuovo documento.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Input
                            placeholder="Titolo documento..."
                            value={newDocTitle}
                            onChange={(e) => setNewDocTitle(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && newDocTitle) {
                                    createMutation.mutate({ title: newDocTitle, type: newDocType });
                                }
                            }}
                            autoFocus
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsCreateDialogOpen(false)}>Annulla</Button>
                        <Button
                            className="bg-indigo-600 hover:bg-indigo-700"
                            disabled={!newDocTitle || createMutation.isPending}
                            onClick={() => createMutation.mutate({ title: newDocTitle, type: newDocType })}
                        >
                            {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Crea Documento
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
