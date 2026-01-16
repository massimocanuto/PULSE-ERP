import { useEffect, useRef, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Loader2, ArrowLeft, Save, Share2, Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

declare global {
    interface Window {
        DocsAPI: any;
    }
}

export default function OfficeEditor() {
    const { id } = useParams();
    const [, setLocation] = useLocation();
    const { toast } = useToast();
    const editorRef = useRef<HTMLDivElement>(null);
    const [docEditor, setDocEditor] = useState<any>(null);
    const [scriptLoaded, setScriptLoaded] = useState(false);
    const [loadingTimeout, setLoadingTimeout] = useState(false);

    // In un ambiente reale, questo URL verrebbe da un'impostazione o .env
    const ONLYOFFICE_API_URL = "http://localhost:8080/web-apps/apps/api/documents/api.js";

    const { data: config, isLoading, error } = useQuery({
        queryKey: ['/api/office/config', id],
        queryFn: async () => {
            const res = await fetch(`/api/office/config/${id}`);
            if (!res.ok) throw new Error("Errore nel recupero della configurazione");
            return res.json();
        },
        enabled: !!id && scriptLoaded
    });

    useEffect(() => {
        // Timeout di 5 secondi per il caricamento
        const timer = setTimeout(() => {
            if (!scriptLoaded) {
                setLoadingTimeout(true);
            }
        }, 5000);

        // Carica lo script di OnlyOffice se non è già presente
        if (!window.DocsAPI) {
            const script = document.createElement("script");
            script.src = ONLYOFFICE_API_URL;
            script.async = true;
            script.onload = () => {
                setScriptLoaded(true);
                clearTimeout(timer);
            };
            script.onerror = () => {
                setLoadingTimeout(true);
                clearTimeout(timer);
            };
            document.body.appendChild(script);
        } else {
            setScriptLoaded(true);
            clearTimeout(timer);
        }

        return () => {
            clearTimeout(timer);
            if (docEditor) {
                docEditor.destroyEditor();
            }
        };
    }, []);

    useEffect(() => {
        if (scriptLoaded && config && editorRef.current && !docEditor) {
            try {
                const editor = new window.DocsAPI.DocEditor("editor-container", config);
                setDocEditor(editor);
            } catch (err) {
                console.error("Errore inizializzazione editor:", err);
                toast({
                    title: "Errore",
                    description: "Impossibile caricare l'editor di OnlyOffice. Verifica che il Document Server sia attivo.",
                    variant: "destructive"
                });
            }
        }
    }, [scriptLoaded, config, docEditor]);

    if (loadingTimeout) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-white">
                <div className="p-8 text-center max-w-md">
                    <div className="bg-orange-50 text-orange-600 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                        <Loader2 className="h-8 w-8" />
                    </div>
                    <h2 className="text-2xl font-bold mb-4">OnlyOffice non configurato</h2>
                    <p className="text-slate-500 mb-4">Il server OnlyOffice Document Server non è stato rilevato su http://localhost:8080</p>
                    <div className="bg-slate-50 p-4 rounded-lg mb-8 text-left text-sm text-slate-600">
                        <p className="font-semibold mb-2">Per utilizzare l'editor:</p>
                        <ol className="list-decimal list-inside space-y-1">
                            <li>Installa OnlyOffice Document Server</li>
                            <li>Avvialo sulla porta 8080</li>
                            <li>Configura la variabile ONLYOFFICE_DOC_SERVER_URL</li>
                        </ol>
                    </div>
                    <Button onClick={() => setLocation("/office-pulse")}>Torna a Office Pulse</Button>
                </div>
            </div>
        );
    }

    if (isLoading || !scriptLoaded) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-slate-900 text-white">
                <Loader2 className="h-12 w-12 animate-spin text-indigo-500 mb-4" />
                <p className="text-lg font-medium">Inizializzazione Office Pulse...</p>
                <p className="text-sm text-slate-400 mt-2">Caricamento Document Server in corso</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-white">
                <div className="p-8 text-center max-w-md">
                    <div className="bg-red-50 text-red-600 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                        <Loader2 className="h-8 w-8" />
                    </div>
                    <h2 className="text-2xl font-bold mb-4">Documento non trovato</h2>
                    <p className="text-slate-500 mb-8">Il documento richiesto non esiste o non hai i permessi per visualizzarlo.</p>
                    <Button onClick={() => setLocation("/office-pulse")}>Torna a Office Pulse</Button>
                </div>
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
                    <Button variant="ghost" size="sm" className="hidden md:flex">
                        <Share2 className="h-4 w-4 mr-2" />
                        Condividi
                    </Button>
                    <Button variant="ghost" size="sm" className="hidden md:flex">
                        <Printer className="h-4 w-4 mr-2" />
                        Stampa
                    </Button>
                    <Button variant="ghost" size="sm" className="hidden md:flex">
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
            <div className="flex-1 w-full h-full relative" id="editor-container">
                {/* OnlyOffice verrà iniettato qui */}
            </div>
        </div>
    );
}
