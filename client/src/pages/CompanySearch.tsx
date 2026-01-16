import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Building, Phone, Mail, FileText, ShoppingCart, MapPin, User, Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";

export default function CompanySearch() {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
    const [debouncedQuery, setDebouncedQuery] = useState("");

    // Debounce search query
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(searchQuery);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Search Results Query
    const { data: searchResults, isLoading: isSearching } = useQuery({
        queryKey: ["company-search", debouncedQuery],
        queryFn: async () => {
            if (debouncedQuery.length < 2) return [];
            const res = await fetch(`/api/companies/search?q=${encodeURIComponent(debouncedQuery)}`);
            if (!res.ok) throw new Error("Search failed");
            return res.json();
        },
        enabled: debouncedQuery.length >= 2,
    });

    // Full Company Data Query
    const { data: companyData, isLoading: isLoadingData } = useQuery({
        queryKey: ["company-full-data", selectedCompanyId],
        queryFn: async () => {
            if (!selectedCompanyId) return null;
            const res = await fetch(`/api/companies/${selectedCompanyId}/full-data`);
            if (!res.ok) throw new Error("Failed to fetch data");
            return res.json();
        },
        enabled: !!selectedCompanyId,
    });

    return (
        <div className="container mx-auto py-8 space-y-8">
            <div className="flex flex-col space-y-4">
                <h1 className="text-3xl font-bold tracking-tight">Ricerca Aziende</h1>
                <p className="text-muted-foreground">
                    Cerca un'azienda per visualizzare il dossier completo: anagrafica, contatti, documenti e ordini.
                </p>
            </div>

            {/* Search Area */}
            <Card>
                <CardContent className="pt-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Cerca per Ragione Sociale, P.IVA o Codice Fiscale..."
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                if (!e.target.value) setSelectedCompanyId(null);
                            }}
                            className="pl-9 h-12 text-lg focus:bg-yellow-50 transition-colors"
                        />
                    </div>

                    {/* Search Results Dropdown */}
                    {debouncedQuery.length >= 2 && (searchResults || isSearching) && !selectedCompanyId && (
                        <div className="mt-2 border rounded-md shadow-md bg-white overflow-hidden">
                            {isSearching ? (
                                <div className="p-4 flex items-center justify-center text-muted-foreground">
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" /> Cercando...
                                </div>
                            ) : searchResults?.length > 0 ? (
                                <ScrollArea className="h-[300px]">
                                    {searchResults.map((company: any) => (
                                        <div
                                            key={company.id}
                                            className="p-3 hover:bg-muted cursor-pointer flex items-center justify-between border-b last:border-0"
                                            onClick={() => {
                                                setSelectedCompanyId(company.id);
                                                setSearchQuery(company.ragioneSociale);
                                            }}
                                        >
                                            <div>
                                                <div className="font-medium">{company.ragioneSociale}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    P.IVA: {company.partitaIva || "-"} | CF: {company.codiceFiscale || "-"}
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="sm">Seleziona</Button>
                                        </div>
                                    ))}
                                </ScrollArea>
                            ) : (
                                <div className="p-4 text-center text-muted-foreground">
                                    Nessun risultato trovato.
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Dossier View */}
            {selectedCompanyId && companyData && (
                <div className="space-y-6">
                    {isLoadingData ? (
                        <div className="flex items-center justify-center p-12">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <>
                            {/* Header Info */}
                            <div className="flex flex-col md:flex-row gap-6 items-start justify-between bg-card p-6 rounded-lg border shadow-sm">
                                <div>
                                    <h2 className="text-2xl font-bold flex items-center gap-2">
                                        <Building className="h-6 w-6 text-primary" />
                                        {companyData.company.ragioneSociale}
                                    </h2>
                                    <div className="mt-2 text-muted-foreground space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-xs uppercase tracking-wider">P.IVA:</span>
                                            {companyData.company.partitaIva || "N/A"}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-xs uppercase tracking-wider">Cod. Fisc:</span>
                                            {companyData.company.codiceFiscale || "N/A"}
                                        </div>
                                        {companyData.company.indirizzo && (
                                            <div className="flex items-center gap-2 mt-2">
                                                <MapPin className="h-4 w-4" />
                                                {companyData.company.indirizzo}, {companyData.company.citta} ({companyData.company.provincia})
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                    {companyData.company.telefono && (
                                        <Button variant="outline" className="justify-start gap-2">
                                            <Phone className="h-4 w-4" /> {companyData.company.telefono}
                                        </Button>
                                    )}
                                    {companyData.company.email && (
                                        <Button variant="outline" className="justify-start gap-2">
                                            <Mail className="h-4 w-4" /> {companyData.company.email}
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {/* Data Tabs */}
                            <Tabs defaultValue="referenti" className="w-full">
                                <TabsList className="w-full justify-start h-auto p-1 bg-muted/50 overflow-x-auto">
                                    <TabsTrigger value="referenti" className="gap-2 py-2">
                                        <User className="h-4 w-4" /> Contatti ({companyData.referenti.length})
                                    </TabsTrigger>
                                    <TabsTrigger value="finance" className="gap-2 py-2">
                                        <FileText className="h-4 w-4" /> Fatture & Preventivi ({companyData.invoices.length + companyData.quotes.length})
                                    </TabsTrigger>
                                    <TabsTrigger value="orders" className="gap-2 py-2">
                                        <ShoppingCart className="h-4 w-4" /> Ordini ({companyData.orders.length})
                                    </TabsTrigger>
                                    <TabsTrigger value="addresses" className="gap-2 py-2">
                                        <MapPin className="h-4 w-4" /> Sedi ({companyData.addresses.length})
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="referenti" className="mt-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {companyData.referenti.map((ref: any) => (
                                            <Card key={ref.id}>
                                                <CardHeader className="pb-3">
                                                    <CardTitle className="text-base font-medium flex justify-between items-center">
                                                        {ref.nome} {ref.cognome}
                                                        {ref.principale && <Badge>Principale</Badge>}
                                                    </CardTitle>
                                                    <CardDescription>{ref.ruolo}</CardDescription>
                                                </CardHeader>
                                                <CardContent className="text-sm space-y-2">
                                                    {ref.telefono && <div className="flex items-center gap-2"><Phone className="h-3 w-3" /> {ref.telefono}</div>}
                                                    {ref.email && <div className="flex items-center gap-2"><Mail className="h-3 w-3" /> {ref.email}</div>}
                                                </CardContent>
                                            </Card>
                                        ))}
                                        {companyData.referenti.length === 0 && (
                                            <div className="col-span-full h-32 flex items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg">
                                                Nessun referente trovato.
                                            </div>
                                        )}
                                    </div>
                                </TabsContent>

                                <TabsContent value="finance" className="mt-6 space-y-6">
                                    <div>
                                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><FileText className="h-5 w-5" /> Fatture</h3>
                                        <div className="border rounded-md">
                                            {companyData.invoices.length > 0 ? (
                                                <div className="divide-y">
                                                    {companyData.invoices.map((inv: any) => (
                                                        <div key={inv.id} className="p-4 flex justify-between items-center hover:bg-muted/50">
                                                            <div>
                                                                <div className="font-medium">Fattura #{inv.numero}</div>
                                                                <div className="text-sm text-muted-foreground">{format(new Date(inv.data), "dd/MM/yyyy")}</div>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className="font-bold">€ {Number(inv.importoTotale || 0).toFixed(2)}</div>
                                                                <Badge variant={inv.stato === 'pagata' ? 'default' : 'secondary'}>{inv.stato}</Badge>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="p-6 text-center text-muted-foreground">Nessuna fattura trovata.</div>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><FileText className="h-5 w-5" /> Preventivi</h3>
                                        <div className="border rounded-md">
                                            {companyData.quotes.length > 0 ? (
                                                <div className="divide-y">
                                                    {companyData.quotes.map((quote: any) => (
                                                        <div key={quote.id} className="p-4 flex justify-between items-center hover:bg-muted/50">
                                                            <div>
                                                                <div className="font-medium">Preventivo #{quote.numero}</div>
                                                                <div className="text-sm text-muted-foreground">{format(new Date(quote.data), "dd/MM/yyyy")}</div>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className="font-bold">€ {Number(quote.importoTotale || 0).toFixed(2)}</div>
                                                                <Badge variant="outline">{quote.stato}</Badge>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="p-6 text-center text-muted-foreground">Nessun preventivo trovato.</div>
                                            )}
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent value="orders" className="mt-6">
                                    <div className="border rounded-md">
                                        {companyData.orders.length > 0 ? (
                                            <div className="divide-y">
                                                {companyData.orders.map((order: any) => (
                                                    <div key={order.id} className="p-4 flex justify-between items-center hover:bg-muted/50">
                                                        <div>
                                                            <div className="font-medium">Ordine #{order.numero}</div>
                                                            <div className="text-sm text-muted-foreground">{format(new Date(order.data), "dd/MM/yyyy")}</div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="font-bold">€ {Number(order.importoTotale || 0).toFixed(2)}</div>
                                                            <Badge>{order.stato}</Badge>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="p-12 text-center text-muted-foreground border-2 border-dashed rounded-lg">
                                                Nessun ordine trovato.
                                            </div>
                                        )}
                                    </div>
                                </TabsContent>

                                <TabsContent value="addresses" className="mt-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {companyData.addresses.map((addr: any) => (
                                            <Card key={addr.id}>
                                                <CardHeader className="pb-3">
                                                    <CardTitle className="text-base font-medium flex justify-between items-center">
                                                        {addr.nome || "Indirizzo"}
                                                        {addr.principale && <Badge>Principale</Badge>}
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent className="text-sm">
                                                    <div>{addr.indirizzo}</div>
                                                    <div>{addr.cap} {addr.citta} ({addr.provincia})</div>
                                                    <div className="uppercase text-xs text-muted-foreground mt-1">{addr.paese}</div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                        {companyData.addresses.length === 0 && (
                                            <div className="col-span-full h-32 flex items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg">
                                                Nessun indirizzo di spedizione aggiuntivo.
                                            </div>
                                        )}
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
