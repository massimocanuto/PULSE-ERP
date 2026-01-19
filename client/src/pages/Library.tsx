import { useState, useRef } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    BookOpen, Clock, Loader2, Plus,
    Search, Star, Trash2, CheckCircle2,
    BarChart, MoreVertical, Calendar, RotateCcw, Book, Download, ShoppingCart, StickyNote, Trophy, Upload, FileText, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuTrigger, DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { Link, useLocation } from "wouter";
import { ReactReader } from 'react-reader';

// Local interfaces to avoid importing @shared/schema which contains backend-only dependencies
export interface IBook {
    id: string;
    userId: string | null;
    isbn: string | null;
    title: string;
    author: string;
    coverUrl: string | null;
    description: string | null;
    totalPages: number | null;
    publisher: string | null;
    publishedDate: string | null;
    categories: string | null;
    language: string | null;
    status: "to_read" | "reading" | "completed" | "abandoned" | null;
    currentPage: number | null;
    rating: number | null;
    startedAt: string | null;
    finishedAt: string | null;
    format: string | null;
    createdAt: string | null;
    updatedAt: string | null;
    associatedKeepNoteId: string | null;
    filePath: string | null;
    fileType: string | null;
}

export interface ReadingSession {
    id: string;
    bookId: string;
    userId: string;
    date: string;
    pagesRead: number;
    durationMinutes: number | null;
    notes: string | null;
    createdAt: string | null;
}

export default function Library() {
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState<"all" | "reading" | "to_read" | "completed">("all");
    const [isAddBookOpen, setIsAddBookOpen] = useState(false);
    const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
    const [readingGoal, setReadingGoal] = useState(() => parseInt(localStorage.getItem("pulse_reading_goal") || "12"));

    const updateReadingGoal = (newGoal: number) => {
        setReadingGoal(newGoal);
        localStorage.setItem("pulse_reading_goal", newGoal.toString());
    };

    const { data: books, isLoading } = useQuery<IBook[]>({
        queryKey: ["books"],
        queryFn: async () => {
            const res = await fetch("/api/books");
            if (!res.ok) throw new Error("Failed to fetch books");
            return res.json();
        }
    });

    const filteredBooks = books?.filter(book => {
        const matchesSearch = book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            book.author.toLowerCase().includes(searchQuery.toLowerCase());
        if (activeTab === "all") return matchesSearch;
        return matchesSearch && book.status === activeTab;
    });

    const readingBooks = books?.filter(b => b.status === "reading") || [];
    const completedBooks = books?.filter(b => b.status === "completed") || [];

    // Reading Challenge Logic
    const booksReadThisYear = completedBooks.filter(b => {
        if (!b.finishedAt) return false;
        return new Date(b.finishedAt).getFullYear() === new Date().getFullYear();
    }).length;

    const challengeProgress = Math.min((booksReadThisYear / readingGoal) * 100, 100);

    const handleExport = () => {
        if (!books) return;

        const headers = ["Title", "Author", "ISBN", "Status", "Total Pages", "Current Page", "Rating", "Amazon Link"];
        const csvContent = [
            headers.join(","),
            ...books.map(book => [
                `"${book.title.replace(/"/g, '""')}"`,
                `"${book.author.replace(/"/g, '""')}"`,
                book.isbn || "",
                book.status || "",
                book.totalPages || 0,
                book.currentPage || 0,
                book.rating || "",
                `"https://www.amazon.it/s?k=${book.isbn || encodeURIComponent(book.title + " " + book.author)}"`
            ].join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "pulse_library_export.csv";
        link.click();
    };

    const totalPagesRead = books?.reduce((acc, book) => acc + (book.currentPage || 0), 0) || 0;

    return (
        <AppLayout>
            <div className="flex flex-col h-[calc(100vh-3rem)] overflow-hidden bg-gradient-to-br from-[#f5f0e6] via-[#e8dcc8] to-[#ddd0b8] dark:from-[#2d3748] dark:via-[#374151] dark:to-[#3d4555]">

                {/* Header Section */}
                <div className="h-32 w-full flex-shrink-0 bg-gradient-to-r from-amber-800 to-amber-900 dark:from-slate-800 dark:to-slate-900 shadow-xl" />

                <div className="relative -mt-16 px-8 pb-4">
                    <div className="flex gap-6 items-start">
                        {/* Main Stats Card */}
                        <div className="bg-card rounded-xl shadow-lg border p-4 flex-1">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-md">
                                        <BookOpen className="h-6 w-6 text-white" />
                                    </div>
                                    <div>
                                        <h1 className="text-2xl font-bold">Pulse Library</h1>
                                        <div className="flex gap-4 text-sm text-muted-foreground mt-1">
                                            <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" /> {books?.length || 0} Libri</span>
                                            <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> {completedBooks.length} Letti</span>
                                            <span className="flex items-center gap-1"><BarChart className="h-3 w-3" /> {totalPagesRead} Pagine</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <Button variant="outline" onClick={handleExport}>
                                        <Download className="h-4 w-4 mr-2" /> Esporta
                                    </Button>
                                    <Button variant="outline" onClick={handleExport}>
                                        <Download className="h-4 w-4 mr-2" /> Esporta
                                    </Button>
                                    <Button variant="secondary" onClick={() => setIsBulkImportOpen(true)}>
                                        <Upload className="h-4 w-4 mr-2" /> Importa File
                                    </Button>
                                    <AddBookDialog open={isAddBookOpen} onOpenChange={setIsAddBookOpen} />
                                    <BulkImportDialog open={isBulkImportOpen} onOpenChange={setIsBulkImportOpen} />
                                </div>
                            </div>

                            {/* In Reading Now Card Grid */}
                            {readingBooks.length > 0 && (
                                <div className="mt-6 border-t pt-4">
                                    <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">In Lettura</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {readingBooks.map(book => (
                                            <ReadingCard key={book.id} book={book} />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Reading Challenge Widget */}
                        <div className="bg-card rounded-xl shadow-lg border p-4 w-72 hidden xl:block self-stretch flex flex-col justify-center">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-full text-yellow-600">
                                    <Trophy className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm">Reading Challenge</h3>
                                    <p className="text-xs text-muted-foreground">{new Date().getFullYear()}</p>
                                </div>
                            </div>

                            <div className="mt-4 space-y-2">
                                <div className="flex justify-between text-xs">
                                    <span className="font-medium">{booksReadThisYear} letti</span>
                                    <span className="text-muted-foreground">Obiettivo: {readingGoal}</span>
                                </div>
                                <Progress value={challengeProgress} className="h-2.5" />
                                <p className="text-[10px] text-muted-foreground text-center mt-2">
                                    {challengeProgress >= 100 ? "Obiettivo raggiunto! 🎉" : `${readingGoal - booksReadThisYear} libri al traguardo`}
                                </p>
                            </div>

                            <Button
                                variant="ghost"
                                size="sm"
                                className="mt-auto w-full text-xs h-7"
                                onClick={() => {
                                    const newGoal = prompt("Imposta il tuo obiettivo di lettura per quest'anno:", readingGoal.toString());
                                    if (newGoal && !isNaN(parseInt(newGoal))) {
                                        updateReadingGoal(parseInt(newGoal));
                                    }
                                }}
                            >
                                Modifica Obiettivo
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 overflow-hidden px-8 pb-8 pt-4">
                    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="h-full flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <TabsList className="bg-white/50 dark:bg-black/20 backdrop-blur-sm">
                                <TabsTrigger value="all">Tutti</TabsTrigger>
                                <TabsTrigger value="reading">In Lettura</TabsTrigger>
                                <TabsTrigger value="to_read">Da Leggere</TabsTrigger>
                                <TabsTrigger value="completed">Completati</TabsTrigger>
                            </TabsList>

                            <div className="relative w-64">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Cerca nella libreria..."
                                    className="pl-8 bg-white/50 dark:bg-black/20 backdrop-blur-sm border-none shadow-sm"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>

                        <ScrollArea className="flex-1 -mx-2 px-2">
                            {isLoading ? (
                                <div className="flex justify-center p-12">
                                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 p-1">
                                    {filteredBooks?.map(book => (
                                        <BookCard key={book.id} book={book} />
                                    ))}
                                    {filteredBooks?.length === 0 && (
                                        <div className="col-span-full flex flex-col items-center justify-center p-12 text-muted-foreground">
                                            <Book className="h-12 w-12 opacity-20 mb-4" />
                                            <p>Nessun libro trovato</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </ScrollArea>
                    </Tabs>
                </div>
            </div>
        </AppLayout>
    );
}

function BookCard({ book }: { book: IBook }) {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const [, setLocation] = useLocation();
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [isReaderOpen, setIsReaderOpen] = useState(false);

    const deleteMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch(`/api/books/${book.id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed");
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["books"] });
            toast({ title: "Libro eliminato" });
        }
    });

    const updateStatusMutation = useMutation({
        mutationFn: async (status: string) => {
            const res = await fetch(`/api/books/${book.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status })
            });
            if (!res.ok) throw new Error("Failed");
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["books"] });
        }
    });

    const createNoteMutation = useMutation({
        mutationFn: async () => {
            // 1. Create Note in Keep
            const noteRes = await fetch("/api/keep/notes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: `Note: ${book.title}`,
                    content: `<h1>${book.title}</h1><p><i>di ${book.author}</i></p><br/><p>Note di lettura...</p>`,
                    tags: ["Libro", "Lettura"],
                    color: "white",
                    pinned: false
                })
            });
            if (!noteRes.ok) throw new Error("Failed to create note");
            const note = await noteRes.json();

            // 2. Link Note to Book
            const bookRes = await fetch(`/api/books/${book.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ associatedKeepNoteId: note.id })
            });
            if (!bookRes.ok) throw new Error("Failed to link note to book");

            return note.id;
        },
        onSuccess: (noteId) => {
            queryClient.invalidateQueries({ queryKey: ["books"] });
            toast({ title: "Nota creata", description: "Reindirizzamento a Pulse Keep..." });
            setLocation(`/keep?noteId=${noteId}`);
        },
        onError: () => {
            toast({ title: "Errore", description: "Impossibile creare la nota", variant: "destructive" });
        }
    });

    const handleOpenNote = () => {
        if (book.associatedKeepNoteId) {
            setLocation(`/keep?noteId=${book.associatedKeepNoteId}`);
        } else {
            createNoteMutation.mutate();
        }
    };

    return (
        <>
            <div className="group relative bg-card rounded-lg shadow-sm hover:shadow-xl transition-all duration-300 border overflow-hidden flex flex-col h-[320px]">
                <div className="relative h-48 w-full bg-muted overflow-hidden">
                    {book.coverUrl ? (
                        <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-100 to-amber-200 dark:from-slate-700 dark:to-slate-800">
                            <Book className="h-12 w-12 text-muted-foreground/30" />
                        </div>
                    )}

                    {/* Overlay Actions */}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full shadow-md">
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => updateStatusMutation.mutate("reading")}>
                                    Inizia a leggere
                                </DropdownMenuItem>
                                {book.filePath && (
                                    <DropdownMenuItem onClick={() => setIsReaderOpen(true)}>
                                        <BookOpen className="h-4 w-4 mr-2" /> Leggi Ora
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={() => setIsUploadOpen(true)}>
                                    <Upload className="h-4 w-4 mr-2" /> Carica E-book
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => updateStatusMutation.mutate("completed")}>
                                    Segna come letto
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => window.open(`https://www.amazon.it/s?k=${book.isbn || encodeURIComponent(book.title + " " + book.author)}`, '_blank')}>
                                    <ShoppingCart className="h-4 w-4 mr-2" /> Vedi su Amazon
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={handleOpenNote}>
                                    <StickyNote className="h-4 w-4 mr-2" /> Note & Riassunto
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-600" onClick={() => deleteMutation.mutate()}>
                                    <Trash2 className="h-4 w-4 mr-2" /> Elimina
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    {book.status === "completed" && (
                        <div className="absolute top-2 left-2 bg-green-500/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                            LETTO
                        </div>
                    )}
                    {book.status === "reading" && (
                        <div className="absolute top-2 left-2 bg-blue-500/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                            IN LETTURA
                        </div>
                    )}
                    {book.filePath && (
                        <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                            <FileText className="h-3 w-3" /> EBOOK
                        </div>
                    )}
                </div>

                <div className="p-3 flex-1 flex flex-col">
                    <h3 className="font-semibold text-sm line-clamp-2 leading-tight mb-1" title={book.title}>
                        {book.title}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-1 mb-2">{book.author}</p>

                    <div className="mt-auto">
                        {book.totalPages > 0 && (
                            <div className="space-y-1">
                                <div className="flex justify-between text-[10px] text-muted-foreground">
                                    <span>{Math.round(((book.currentPage || 0) / (book.totalPages || 1)) * 100)}%</span>
                                    <span>{book.currentPage || 0}/{book.totalPages}</span>
                                </div>
                                <Progress value={((book.currentPage || 0) / (book.totalPages || 1)) * 100} className="h-1" />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <UploadBookFileDialog book={book} open={isUploadOpen} onOpenChange={setIsUploadOpen} />
            <BookReader book={book} open={isReaderOpen} onOpenChange={setIsReaderOpen} />
        </>
    );
}

function UploadBookFileDialog({ book, open, onOpenChange }: { book: IBook, open: boolean, onOpenChange: (v: boolean) => void }) {
    const [file, setFile] = useState<File | null>(null);
    const queryClient = useQueryClient();
    const { toast } = useToast();

    const uploadMutation = useMutation({
        mutationFn: async () => {
            if (!file) throw new Error("Seleziona un file");
            const formData = new FormData();
            formData.append('file', file);

            const res = await fetch(`/api/books/${book.id}/upload`, {
                method: 'POST',
                body: formData
            });

            if (!res.ok) throw new Error("Errore durante il caricamento");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["books"] });
            toast({ title: "File caricato correttamente!" });
            onOpenChange(false);
            setFile(null);
        },
        onError: (e) => {
            toast({ title: "Errore", description: e.message, variant: "destructive" });
        }
    });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Carica E-book</DialogTitle>
                    <DialogDescription>
                        Carica un file PDF o ePub per il libro "{book.title}".
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <Input
                        type="file"
                        accept=".pdf,.epub"
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                    />
                </div>
                <DialogFooter>
                    <Button onClick={() => uploadMutation.mutate()} disabled={!file || uploadMutation.isPending}>
                        {uploadMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                        Carica
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function BookReader({ book, open, onOpenChange }: { book: IBook, open: boolean, onOpenChange: (v: boolean) => void }) {
    if (!book.filePath) return null;

    const [location, setLocation] = useState<string | number>(0);
    const fileUrl = `/api/books/${book.id}/file`;
    const isPdf = book.fileType === 'pdf';

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[95vw] w-[95vw] h-[90vh] p-0 flex flex-col gap-0 overflow-hidden bg-background">
                <div className="flex items-center justify-between p-3 border-b shrink-0 bg-card">
                    <div className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-primary" />
                        <span className="font-semibold truncate max-w-md">{book.title}</span>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
                        <X className="h-5 w-5" />
                    </Button>
                </div>
                <div className="flex-1 relative bg-gray-100 dark:bg-gray-900 overflow-hidden">
                    {isPdf ? (
                        <iframe src={fileUrl} className="w-full h-full border-0" title="PDF Reader" />
                    ) : (
                        <div style={{ height: '100%' }}>
                            <ReactReader
                                url={fileUrl}
                                location={location}
                                locationChanged={(epubLocation: string | number) => setLocation(epubLocation)}
                                getRendition={(rendition) => {
                                    rendition.themes.register('custom', {
                                        'p': { 'font-family': 'Helvetica, sans-serif' }
                                    })
                                    rendition.themes.select('custom')
                                }}
                            />
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

function ReadingCard({ book }: { book: IBook }) {
    const [sessionOpen, setSessionOpen] = useState(false);
    const [isReaderOpen, setIsReaderOpen] = useState(false);
    const percent = book.totalPages ? Math.round(((book.currentPage || 0) / book.totalPages) * 100) : 0;

    return (
        <>
            <div className="flex items-start gap-4 p-3 rounded-lg border bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-900/50">
                <div className="h-20 w-14 flex-shrink-0 rounded shadow-sm overflow-hidden bg-muted group relative">
                    {book.coverUrl ? (
                        <img src={book.coverUrl} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center"><Book className="h-6 w-6 text-muted-foreground/30" /></div>
                    )}

                    {book.filePath && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" onClick={() => setIsReaderOpen(true)}>
                            <BookOpen className="h-6 w-6 text-white" />
                        </div>
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm truncate">{book.title}</h4>
                    <p className="text-xs text-muted-foreground mb-2">{book.author}</p>

                    <div className="space-y-1.5">
                        <Progress value={percent} className="h-2" />
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-muted-foreground">{percent}% completato</span>
                            <div className="flex gap-1">
                                {book.filePath && (
                                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setIsReaderOpen(true)} title="Leggi">
                                        <BookOpen className="h-3 w-3" />
                                    </Button>
                                )}
                                <Button size="sm" variant="outline" className="h-6 text-xs" onClick={() => setSessionOpen(true)}>
                                    <Plus className="h-3 w-3 mr-1" /> Aggiorna
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                <LogSessionDialog book={book} open={sessionOpen} onOpenChange={setSessionOpen} />
            </div>
            <BookReader book={book} open={isReaderOpen} onOpenChange={setIsReaderOpen} />
        </>
    );
}

function LogSessionDialog({ book, open, onOpenChange }: { book: IBook, open: boolean, onOpenChange: (v: boolean) => void }) {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const [page, setPage] = useState((book.currentPage || 0).toString());
    const [time, setTime] = useState("30");

    const mutation = useMutation({
        mutationFn: async () => {
            const res = await fetch(`/api/books/${book.id}/sessions`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    date: new Date().toISOString(),
                    pagesRead: parseInt(page),
                    durationMinutes: parseInt(time),
                    notes: ""
                })
            });
            if (!res.ok) throw new Error("Failed");
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["books"] });
            toast({ title: "Progressi salvati!" });
            onOpenChange(false);
        }
    });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xs">
                <DialogHeader>
                    <DialogTitle>Aggiorna Progressi</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label>A che pagina sei arrivato?</Label>
                        <div className="flex items-center gap-2">
                            <Input type="number" value={page} onChange={e => setPage(e.target.value)} />
                            <span className="text-xs text-muted-foreground whitespace-nowrap">su {book.totalPages}</span>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Minuti di lettura (opzionale)</Label>
                        <Input type="number" value={time} onChange={e => setTime(e.target.value)} />
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>Salva</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function AddBookDialog({ open, onOpenChange }: { open: boolean, onOpenChange: (v: boolean) => void }) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const queryClient = useQueryClient();
    const { toast } = useToast();

    const handleSearch = async () => {
        if (!query.trim()) return;
        setIsSearching(true);
        try {
            const res = await fetch(`/api/books/search?q=${encodeURIComponent(query)}`);
            const data = await res.json();
            setResults(data);
        } catch (e) {
            console.error(e);
        } finally {
            setIsSearching(false);
        }
    };

    const addMutation = useMutation({
        mutationFn: async (volume: any) => {
            const info = volume.volumeInfo;
            const res = await fetch("/api/books", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: info.title,
                    author: info.authors?.[0] || "Unknown",
                    description: info.description?.substring(0, 500) || "",
                    totalPages: info.pageCount || 0,
                    coverUrl: info.imageLinks?.thumbnail?.replace('http:', 'https:') || null,
                    publisher: info.publisher,
                    publishedDate: info.publishedDate,
                    isbn: info.industryIdentifiers?.[0]?.identifier,
                    status: "to_read"
                })
            });
            if (!res.ok) throw new Error("Failed");
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["books"] });
            toast({ title: "Libro aggiunto alla libreria" });
            onOpenChange(false);
            setResults([]);
            setQuery("");
        }
    });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
                <Button className="bg-amber-600 hover:bg-amber-700 text-white">
                    <Plus className="h-4 w-4 mr-2" /> Aggiungi Libro
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Cerca libro da aggiungere</DialogTitle>
                    <DialogDescription>
                        Usa Google Books per trovare e aggiungere libri alla tua collezione.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex gap-2 my-2">
                    <Input
                        placeholder="Titolo, autore o ISBN..."
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && handleSearch()}
                    />
                    <Button onClick={handleSearch} disabled={isSearching}>
                        {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                    </Button>
                </div>

                <ScrollArea className="flex-1 px-1">
                    <div className="space-y-2">
                        {results.map((volume: any) => (
                            <div key={volume.id} className="flex gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                                <div className="h-20 w-14 bg-muted flex-shrink-0">
                                    {volume.volumeInfo.imageLinks?.thumbnail && (
                                        <img src={volume.volumeInfo.imageLinks.thumbnail.replace('http:', 'https:')} className="w-full h-full object-cover rounded-sm" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-sm line-clamp-1">{volume.volumeInfo.title}</h4>
                                    <p className="text-xs text-muted-foreground">{volume.volumeInfo.authors?.join(", ")}</p>
                                    <p className="text-xs text-muted-foreground mt-1">{volume.volumeInfo.publishedDate?.substring(0, 4)} • {volume.volumeInfo.pageCount} pag</p>
                                </div>
                                <Button size="sm" variant="ghost" className="self-center" onClick={() => addMutation.mutate(volume)}>
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                        {results.length === 0 && !isSearching && query && (
                            <p className="text-center text-sm text-muted-foreground py-8">Nessun risultato trovato.</p>
                        )}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}


function BulkImportDialog({ open, onOpenChange }: { open: boolean, onOpenChange: (v: boolean) => void }) {
    const [files, setFiles] = useState<FileList | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [results, setResults] = useState<any | null>(null);
    const queryClient = useQueryClient();
    const { toast } = useToast();

    const handleImport = async () => {
        if (!files || files.length === 0) return;

        setIsUploading(true);
        const formData = new FormData();
        for (let i = 0; i < files.length; i++) {
            formData.append('files', files[i]);
        }

        try {
            const res = await fetch('/api/books/import', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();

            if (res.ok) {
                setResults(data);
                queryClient.invalidateQueries({ queryKey: ["books"] });
                toast({ title: "Importazione completata", description: `${data.imported} libri aggiunti.` });
            } else {
                toast({ title: "Errore", description: data.error, variant: "destructive" });
            }
        } catch (e: any) {
            toast({ title: "Errore", description: "Errore di connessione", variant: "destructive" });
        } finally {
            setIsUploading(false);
        }
    };

    const handleClose = () => {
        onOpenChange(false);
        setFiles(null);
        setResults(null);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Importa Libri da File</DialogTitle>
                    <DialogDescription>
                        Carica i file <strong>.epub</strong> o <strong>.pdf</strong> esportati da Amazon/Google.
                        Creeremo automaticamente i libri nella tua libreria.
                    </DialogDescription>
                </DialogHeader>

                {!results ? (
                    <div className="py-6 space-y-4">
                        <div className="border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-muted/50 transition-colors relative">
                            <input
                                type="file"
                                multiple
                                accept=".epub,.pdf"
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                onChange={(e) => setFiles(e.target.files)}
                            />
                            <Upload className="h-10 w-10 text-muted-foreground mb-4" />
                            <p className="font-medium">Clicca o trascina qui i tuoi libri</p>
                            <p className="text-xs text-muted-foreground mt-1">Massimo 20 file alla volta (PDF, ePUB)</p>
                        </div>
                        {files && files.length > 0 && (
                            <div className="bg-muted/50 p-2 rounded text-sm">
                                {files.length} file selezionati
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="py-4">
                        <div className="flex items-center gap-2 text-green-600 mb-4">
                            <CheckCircle2 className="h-5 w-5" />
                            <span className="font-medium">Importazione completata!</span>
                        </div>
                        <p className="text-sm">
                            {results.imported} libri aggiunti con successo.<br />
                            {results.failed > 0 && <span className="text-red-500">{results.failed} errori.</span>}
                        </p>
                    </div>
                )}

                <DialogFooter>
                    {!results ? (
                        <Button onClick={handleImport} disabled={!files || isUploading}>
                            {isUploading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                            Avvia Importazione
                        </Button>
                    ) : (
                        <Button onClick={handleClose}>Chiudi</Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
