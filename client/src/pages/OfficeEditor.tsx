
import { useEffect, useRef, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, ArrowLeft, Save, Share2, Download, Printer, RefreshCw, Upload, FileText, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

declare global {
    interface Window {
        DocsAPI: any;
    }
}

export default function OfficeEditor() {
    const { id } = useParams();
    const [, setLocation] = useLocation();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const editorRef = useRef<HTMLDivElement>(null);
    const [docEditor, setDocEditor] = useState<any>(null);
    const [scriptLoaded, setScriptLoaded] = useState(false);
    const [loadingTimeout, setLoadingTimeout] = useState(false);
    const [retryCount, setRetryCount] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Default Public Server
    const [apiUrl, setApiUrl] = useState("https://documentserver.onlyoffice.com/web-apps/apps/api/documents/api.js");

    const { data: config, isLoading, error } = useQuery({
        queryKey: ['/api/office/config', id],
        queryFn: async () => {
            const res = await fetch(`/api/office/config/${id}`);
            if (!res.ok) throw new Error("Errore nel recupero della configurazione");
            return res.json();
        },
        enabled: !!id
    });

    const uploadMutation = useMutation({
        mutationFn: async (file: File) => {
            const formData = new FormData();
            formData.append('file', file);
            const res = await fetch(`/api/office/documents/${id}/upload`, {
                method: 'POST',
                body: formData
            });
            if (!res.ok) throw new Error("Errore durante il caricamento");
            return res.json();
        },
        onSuccess: () => {
            toast({ title: "Successo", description: "Nuova versione caricata correttamente." });
            queryClient.invalidateQueries({ queryKey: ['/api/office/config', id] });
            queryClient.invalidateQueries({ queryKey: ['/api/office/documents'] });
        },
        onError: () => {
            toast({ title: "Errore", description: "Caricamento fallito.", variant: "destructive" });
        }
    });

    useEffect(() => {
        let timer: NodeJS.Timeout;
        setLoadingTimeout(false);
        setScriptLoaded(false);

        // Remove old script if exists
        const oldScript = document.getElementById("onlyoffice-script");
        if (oldScript) oldScript.remove();

        const loadScript = () => {
            const script = document.createElement("script");
            script.id = "onlyoffice-script";
            script.src = apiUrl;
            script.async = true;

            script.onload = () => {
                setScriptLoaded(true);
                if (timer) clearTimeout(timer);
            };

            script.onerror = (e) => {
                console.error("Errore caricamento script OnlyOffice", e);
                setLoadingTimeout(true);
                if (timer) clearTimeout(timer);
            };

            document.body.appendChild(script);

            // Timeout 15 secondi
            timer = setTimeout(() => {
                if (!window.DocsAPI) {
                    setLoadingTimeout(true);
                }
            }, 15000);
        };

        loadScript();

        return () => {
            if (timer) clearTimeout(timer);
            if (docEditor) {
                try {
                    docEditor.destroyEditor();
                } catch (e) { console.error(e); }
            }
        };
    }, [retryCount, apiUrl]);

    useEffect(() => {
        if (scriptLoaded && config && editorRef.current && !docEditor) {
            try {
                // Ensure container is empty
                const container = document.getElementById("editor-container");
                if (container) container.innerHTML = "";

                const editor = new window.DocsAPI.DocEditor("editor-container", config);
                setDocEditor(editor);
            } catch (err) {
                console.error("Errore inizializzazione editor:", err);
                toast({
                    title: "Errore Editor",
                    description: "Impossibile inizializzare l'editor.",
                    variant: "destructive"
                });
            }
        }
    }, [scriptLoaded, config, docEditor]);

    const handleRetry = () => {
        setRetryCount(c => c + 1);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            uploadMutation.mutate(e.target.files[0]);
        }
    };

    if (loadingTimeout) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 py-10 px-4">
                <div className="w-full max-w-2xl space-y-8 text-center">

                    {/* Error Header */}
                    <div>
                        <div className="bg-red-100 text-red-600 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 animate-pulse">
                            <AlertTriangle className="h-8 w-8" />
                        </div>
                        <h2 className="text-3xl font-bold text-slate-800">Connessione Interrotta</h2>
                        <p className="text-slate-600 mt-2">
                            Non riesco a caricare l'editor online. Potrebbe esserci un problema di rete o di configurazione del server OnlyOffice.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* Option 1: Retry Connection */}
                        <Card className="border-slate-200 shadow-sm text-left">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center">
                                    <RefreshCw className="w-5 h-5 mr-2 text-blue-500" />
                                    Riprova Connessione
                                </CardTitle>
                                <CardDescription>Modifica l'URL del server e riprova.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div>
                                        <Label className="text-xs text-slate-500">OnlyOffice API URL</Label>
                                        <Input
                                            value={apiUrl}
                                            onChange={(e) => setApiUrl(e.target.value)}
                                            className="text-sm font-mono mt-1"
                                        />
                                    </div>
                                    <Button onClick={handleRetry} className="w-full bg-blue-600 hover:bg-blue-700">
                                        Riprova Caricamento
                                    </Button>
                                    <p className="text-xs text-slate-400">
                                        Prova: <code>https://onlinedocs.onlyoffice.com/web-apps/apps/api/documents/api.js</code> se hai un account.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Option 2: Manual Mode */}
                        <Card className="border-slate-200 shadow-sm text-left bg-white">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center text-green-700">
                                    <FileText className="w-5 h-5 mr-2" />
                                    Gestione Manuale
                                </CardTitle>
                                <CardDescription>Lavora offline e carica la nuova versione.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Button variant="outline" className="w-full justify-start h-auto py-3" onClick={() => window.open(config?.document?.url, '_blank')}>
                                    <Download className="w-5 h-5 mr-3 text-slate-500" />
                                    <div className="text-left">
                                        <div className="font-semibold text-slate-700">Scarica Documento</div>
                                        <div className="text-xs text-slate-400">Scarica e modifica con Word/Excel locale</div>
                                    </div>
                                </Button>

                                <div className="border-t border-slate-100 pt-4">
                                    <Label className="text-xs text-slate-500 mb-2 block">Carica nuova versione</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            type="file"
                                            ref={fileInputRef}
                                            className="hidden"
                                            onChange={handleFileUpload}
                                        />
                                        <Button
                                            variant="secondary"
                                            className="w-full bg-green-50 text-green-700 hover:bg-green-100 border-green-200 border"
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={uploadMutation.isPending}
                                        >
                                            {uploadMutation.isPending ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                                            Carica Aggiornamento
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Button variant="ghost" onClick={() => setLocation("/office-pulse")} className="text-slate-500 hover:text-slate-700">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Torna alla lista
                    </Button>
                </div>
            </div>
        );
    }

    if (isLoading || !scriptLoaded) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-slate-900 text-white">
                <Loader2 className="h-12 w-12 animate-spin text-indigo-500 mb-4" />
                <p className="text-lg font-medium">Inizializzazione Office Pulse...</p>
                <p className="text-sm text-slate-400 mt-2">Connessione a: {apiUrl.substring(0, 30)}...</p>
            </div>
        );
    }

    // ... Error handling & Render ...

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-white">
                <p className="text-red-500">Errore Generico</p>
                <Button onClick={() => setLocation("/office-pulse")}>Indietro</Button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-slate-100 overflow-hidden">
            {/* Navbar superiore stile Office */}
            <div className="bg-white border-b border-slate-200 px-4 py-2 flex items-center justify-between shadow-sm z-10">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" onClick={() => setLocation("/office-pulse")} className="text-slate-600">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Chiudi
                    </Button>
                    <div className="h-6 w-[1px] bg-slate-200 mx-2" />
                    <h1 className="font-semibold text-slate-800 tracking-tight">
                        {config?.document?.title || "Documento"}
                    </h1>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => window.open(config?.document?.url, '_blank')}>
                        <Download className="h-4 w-4 mr-2" />
                        Download
                    </Button>
                    <div className="h-6 w-[1px] bg-slate-200 mx-2" />
                    <Button className="bg-green-600 hover:bg-green-700 text-white shadow-sm font-semibold">
                        <Save className="h-4 w-4 mr-2" />
                        Salva ora
                    </Button>
                </div>
            </div>

            {/* Container per l'editor OnlyOffice */}
            <div className="flex-1 w-full h-full relative" id="editor-container" ref={editorRef}>
                {/* OnlyOffice verrà iniettato qui */}
            </div>
        </div>
    );
}
