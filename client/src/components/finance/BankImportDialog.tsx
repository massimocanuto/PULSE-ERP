
import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface BankImportDialogProps {
    accounts: any[];
    onSuccess?: () => void;
}

export function BankImportDialog({ accounts, onSuccess }: BankImportDialogProps) {
    const [open, setOpen] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [selectedAccountId, setSelectedAccountId] = useState<string>("");
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const uploadMutation = useMutation({
        mutationFn: async (formData: FormData) => {
            const res = await fetch("/api/finance/import-transactions", {
                method: "POST",
                body: formData,
            });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || "Errore durante l'importazione");
            }
            return res.json();
        },
        onSuccess: (data) => {
            toast({
                title: "Importazione completata",
                description: `Importate ${data.importedCount} transazioni su ${data.totalCount} trovate.`,
                variant: "default",
            });
            setOpen(false);
            setFile(null);
            setSelectedAccountId("");
            queryClient.invalidateQueries({ queryKey: ["/api/finance/transactions"] });
            queryClient.invalidateQueries({ queryKey: ["/api/finance/stats"] });
            queryClient.invalidateQueries({ queryKey: ["/api/finance/accounts"] });
            if (onSuccess) onSuccess();
        },
        onError: (error: Error) => {
            toast({
                title: "Errore importazione",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = () => {
        if (!file || !selectedAccountId) return;

        const formData = new FormData();
        formData.append("file", file);
        formData.append("accountId", selectedAccountId);

        uploadMutation.mutate(formData);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <Upload className="h-4 w-4" />
                    Importa Movimenti
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Importa Estratto Conto</DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="space-y-2">
                        <Label>Seleziona Conto</Label>
                        <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Scegli un conto..." />
                            </SelectTrigger>
                            <SelectContent>
                                {accounts.map((account) => (
                                    <SelectItem key={account.id} value={account.id}>
                                        {account.nome} ({account.istituto})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>File (CSV, Excel)</Label>
                        <div
                            className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-colors ${file ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
                                }`}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept=".csv,.xlsx,.xls"
                                onChange={handleFileChange}
                            />

                            {file ? (
                                <div className="text-center">
                                    <FileSpreadsheet className="h-10 w-10 text-primary mx-auto mb-2" />
                                    <p className="text-sm font-medium">{file.name}</p>
                                    <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                                </div>
                            ) : (
                                <div className="text-center">
                                    <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                                    <p className="text-sm font-medium">Clicca per caricare</p>
                                    <p className="text-xs text-muted-foreground">Supporta CSV e Excel (.xlsx)</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Formato File</AlertTitle>
                        <AlertDescription className="text-xs">
                            Il file deve contenere le colonne: <b>Data</b>, <b>Descrizione</b>, <b>Importo</b> (positivo per entrate, negativo per uscite).
                        </AlertDescription>
                    </Alert>

                    <Button
                        className="w-full"
                        onClick={handleUpload}
                        disabled={!file || !selectedAccountId || uploadMutation.isPending}
                    >
                        {uploadMutation.isPending ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Elaborazione...
                            </>
                        ) : (
                            <>Importa Transazioni</>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
