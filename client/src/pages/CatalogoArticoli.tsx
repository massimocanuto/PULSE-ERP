import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit2, Trash2, Eye, EyeOff, Package, Copy, Barcode, MapPin, Calendar, Upload, Download, Search, LayoutGrid, List, TrendingUp, TrendingDown, ArrowUpDown, Factory } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function CatalogoArticoli() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategoria, setFilterCategoria] = useState("tutti");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<any>(null);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [prezzoListino, setPrezzoListino] = useState("");
  const [costo, setCosto] = useState("");
  const [unitaMisura, setUnitaMisura] = useState("pz");
  const [customUnita, setCustomUnita] = useState("");
  const [codice, setCodice] = useState("");
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [movimentiDialogOpen, setMovimentiDialogOpen] = useState(false);
  const [movimentiArticolo, setMovimentiArticolo] = useState<any>(null);
  const [nuovoMovimento, setNuovoMovimento] = useState({ tipo: "carico", quantita: "", causale: "", note: "" });

  const generateCodice = async () => {
    try {
      const res = await fetch("/api/catalogo/next-codice");
      if (res.ok) {
        const data = await res.json();
        setCodice(data.codice);
      }
    } catch (e) {
      console.error("Errore generazione codice:", e);
    }
  };

  const calcolaRicarico = () => {
    const prezzo = parseFloat(prezzoListino.replace(",", ".")) || 0;
    const costoNum = parseFloat(costo.replace(",", ".")) || 0;
    if (costoNum > 0 && prezzo > 0) {
      return (((prezzo - costoNum) / costoNum) * 100).toFixed(1);
    }
    return "0";
  };

  const { data: articoli = [] } = useQuery({ queryKey: ["/api/catalogo/articoli"] });
  const { data: categorie = [] } = useQuery({ queryKey: ["/api/catalogo/categorie"] });
  const { data: occupati = {} } = useQuery<Record<string, number>>({
    queryKey: ["/api/catalogo/occupati"],
    refetchInterval: 5000,
  });
  const { data: inProduzione = {} } = useQuery<Record<string, { quantita: number; dataPrevista: string | null; ordini: string }>>({
    queryKey: ["/api/catalogo/in-produzione"],
    refetchInterval: 10000,
  });
  const { data: movimenti = [], refetch: refetchMovimenti } = useQuery({
    queryKey: ["/api/catalogo/movimenti", movimentiArticolo?.id],
    queryFn: async () => {
      if (!movimentiArticolo?.id) return [];
      const res = await fetch(`/api/catalogo/movimenti/${movimentiArticolo.id}`);
      return res.json();
    },
    enabled: !!movimentiArticolo?.id
  });

  const registraMovimentoMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/catalogo/movimenti", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Errore nel salvataggio");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/catalogo/articoli"] });
      refetchMovimenti();
      setNuovoMovimento({ tipo: "carico", quantita: "", causale: "", note: "" });
      toast({ title: "Movimento registrato" });
    },
  });

  const createArticleMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/catalogo/articoli", {
        method: selectedArticle?.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(selectedArticle?.id
          ? { ...data, id: selectedArticle.id }
          : data),
      });
      if (!res.ok) throw new Error("Errore nel salvataggio");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/catalogo/articoli"] });
      setDialogOpen(false);
      setSelectedArticle(null);
      toast({ title: "Articolo salvato" });
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const deleteArticleMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/catalogo/articoli/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Errore nell'eliminazione");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/catalogo/articoli"] });
      toast({ title: "Articolo eliminato" });
    },
  });

  const toggleVisibileMutation = useMutation({
    mutationFn: async ({ id, visibile }: any) => {
      const res = await fetch(`/api/catalogo/articoli/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visibile: !visibile }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/catalogo/articoli"] });
    },
  });

  const createCategoryMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/catalogo/categorie", {
        method: selectedCategory?.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(selectedCategory?.id
          ? { ...data, id: selectedCategory.id }
          : data),
      });
      if (!res.ok) throw new Error("Errore nel salvataggio");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/catalogo/categorie"] });
      setCategoryDialogOpen(false);
      setSelectedCategory(null);
    },
  });

  const filteredArticoli = articoli.filter((a: any) => {
    const matchSearch = a.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.codice.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCategory = filterCategoria === "tutti" || a.categoriaId === filterCategoria;
    return matchSearch && matchCategory;
  });

  const visibiliCount = articoli.filter((a: any) => a.visibile).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Articoli</h1>
          <p className="text-muted-foreground">Gestione catalogo prodotti e servizi</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={async () => { setSelectedArticle(null); setPrezzoListino("0"); setCosto("0"); setUnitaMisura("pz"); setCustomUnita(""); await generateCodice(); setDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Nuovo Articolo
          </Button>
          <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Importa
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{articoli.length}</div>
            <p className="text-xs text-muted-foreground">Articoli totali</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-600">{visibiliCount}</div>
            <p className="text-xs text-muted-foreground">Visibili nel listino</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{categorie.length}</div>
            <p className="text-xs text-muted-foreground">Categorie</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50" onClick={() => { setSelectedCategory(null); setCategoryDialogOpen(true); }}>
          <CardContent className="pt-4 flex items-center gap-3">
            <Package className="h-8 w-8 text-muted-foreground" />
            <div>
              <div className="font-medium">Gestisci Categorie</div>
              <p className="text-xs text-muted-foreground">Aggiungi o modifica</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Elenco Articoli</CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cerca..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
              <Select value={filterCategoria} onValueChange={setFilterCategoria}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tutti">Tutte le categorie</SelectItem>
                  {categorie.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[450px]">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-y sticky top-0">
                <tr>
                  <th className="text-center p-2 font-medium w-8"></th>
                  <th className="text-left p-3 font-medium">Codice</th>
                  <th className="text-left p-3 font-medium">Nome</th>
                  <th className="text-left p-3 font-medium">Categoria</th>
                  <th className="text-center p-3 font-medium">Giacenza</th>
                  <th className="text-center p-3 font-medium">Occupati</th>
                  <th className="text-center p-3 font-medium">Disponibili</th>
                  <th className="text-center p-3 font-medium">In Prod.</th>
                  <th className="text-right p-3 font-medium">Prezzo</th>
                  <th className="text-center p-3 font-medium">Vis.</th>
                  <th className="text-center p-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {filteredArticoli.map((articolo: any) => {
                  const disp = (articolo.giacenza || 0) - (occupati[articolo.codice] || 0);
                  const sottoscorta = (articolo.giacenza || 0) <= (articolo.stockMinimo || 0) || disp <= 0;
                  return (
                    <tr key={articolo.id} className={`border-b hover:bg-muted/30 transition-colors ${(articolo.giacenza || 0) === 0 ? 'bg-red-50 dark:bg-red-950/20' : ''}`}>
                      <td className="p-2 text-center">
                        <div
                          className={`w-3 h-3 rounded-full mx-auto ${sottoscorta ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}
                          style={sottoscorta ? { animation: 'pulse 1s ease-in-out infinite' } : {}}
                        />
                      </td>
                      <td className="p-3">
                        <div className="font-mono text-xs font-medium">{articolo.codice}</div>
                        {articolo.barcode && <div className="text-[10px] text-muted-foreground">{articolo.barcode}</div>}
                      </td>
                      <td className="p-3">
                        <div className="font-medium">{articolo.nome}</div>
                        {(articolo.giacenza || 0) === 0 && (
                          <Badge className="bg-red-600 text-white text-xs mt-1">Non Disponibile</Badge>
                        )}
                        {articolo.lotto && <div className="text-xs text-muted-foreground">Lotto: {articolo.lotto}</div>}
                      </td>
                      <td className="p-3">
                        <Badge variant="secondary" className="text-xs">
                          {categorie.find((c: any) => c.id === articolo.categoriaId)?.nome || "Senza categoria"}
                        </Badge>
                      </td>
                      <td className="p-3 text-center">
                        <span className={`font-medium ${(articolo.giacenza || 0) <= (articolo.stockMinimo || 0) ? 'text-red-600' : ''}`}>
                          {articolo.giacenza || 0}
                        </span>
                        <span className="text-xs text-muted-foreground ml-1">{articolo.unitaMisura}</span>
                      </td>
                      <td className="p-3 text-center">
                        {(occupati[articolo.codice] || 0) > 0 ? (
                          <span className="text-orange-600 font-medium">{occupati[articolo.codice]}</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        {(() => {
                          const disp = (articolo.giacenza || 0) - (occupati[articolo.codice] || 0);
                          return (
                            <span className={`font-medium ${disp < 0 ? 'text-red-600' : disp === 0 ? 'text-orange-600' : 'text-green-600'}`}>
                              {disp}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="p-3 text-center">
                        {inProduzione[articolo.codice] ? (
                          <div className="flex items-center justify-center gap-1">
                            <Factory className="h-3 w-3 text-blue-600 animate-pulse" />
                            <span className="text-xs font-medium text-blue-600">
                              +{inProduzione[articolo.codice].quantita}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="p-3 text-right font-medium">{articolo.prezzoListino} €</td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => toggleVisibileMutation.mutate({ id: articolo.id, visibile: articolo.visibile })}
                        >
                          {articolo.visibile ? (
                            <Eye className="h-4 w-4 mx-auto" />
                          ) : (
                            <EyeOff className="h-4 w-4 mx-auto opacity-50" />
                          )}
                        </button>
                      </td>
                      <td className="p-3 text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">⋮</Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => {
                              setSelectedArticle(articolo);
                              setCodice(articolo.codice || "");
                              setPrezzoListino(articolo.prezzoListino || "0");
                              setCosto(articolo.costo || "0");
                              const predefinite = ["pz", "kg", "g", "lt", "m", "ml", "cm", "mm", "mq"];
                              if (predefinite.includes(articolo.unitaMisura)) {
                                setUnitaMisura(articolo.unitaMisura);
                                setCustomUnita("");
                              } else {
                                setUnitaMisura("altro");
                                setCustomUnita(articolo.unitaMisura || "");
                              }
                              setDialogOpen(true);
                            }}>
                              <Edit2 className="h-4 w-4 mr-2" />
                              Modifica
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={async () => {
                              setSelectedArticle(null);
                              await generateCodice();
                              setPrezzoListino(articolo.prezzoListino || "0");
                              setCosto(articolo.costo || "0");
                              const predefinite = ["pz", "kg", "g", "lt", "m", "ml", "cm", "mm", "mq"];
                              if (predefinite.includes(articolo.unitaMisura)) {
                                setUnitaMisura(articolo.unitaMisura);
                                setCustomUnita("");
                              } else {
                                setUnitaMisura("altro");
                                setCustomUnita(articolo.unitaMisura || "");
                              }
                              setDialogOpen(true);
                              setTimeout(() => {
                                const form = document.querySelector('form[class*="space-y-4"]') as HTMLFormElement;
                                if (form) {
                                  (form.querySelector('[name="nome"]') as HTMLInputElement).value = articolo.nome + " (copia)";
                                  (form.querySelector('[name="descrizione"]') as HTMLTextAreaElement).value = articolo.descrizione || "";
                                  if (form.querySelector('[name="barcode"]')) (form.querySelector('[name="barcode"]') as HTMLInputElement).value = "";
                                  if (form.querySelector('[name="ubicazioneScaffale"]')) (form.querySelector('[name="ubicazioneScaffale"]') as HTMLInputElement).value = articolo.ubicazioneScaffale || "";
                                  if (form.querySelector('[name="ubicazioneCorsia"]')) (form.querySelector('[name="ubicazioneCorsia"]') as HTMLInputElement).value = articolo.ubicazioneCorsia || "";
                                  if (form.querySelector('[name="ubicazioneRipiano"]')) (form.querySelector('[name="ubicazioneRipiano"]') as HTMLInputElement).value = articolo.ubicazioneRipiano || "";
                                }
                              }, 100);
                            }}>
                              <Copy className="h-4 w-4 mr-2" />
                              Duplica
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              setMovimentiArticolo(articolo);
                              setMovimentiDialogOpen(true);
                            }}>
                              <ArrowUpDown className="h-4 w-4 mr-2" />
                              Movimenti
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => deleteArticleMutation.mutate(articolo.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Elimina
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </ScrollArea>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedArticle?.id ? "Modifica Articolo" : "Nuovo Articolo"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            createArticleMutation.mutate(Object.fromEntries(formData));
          }} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Codice *</Label>
                <Input
                  name="codice"
                  value={selectedArticle?.codice || codice}
                  onChange={(e) => setCodice(e.target.value)}
                  required
                  className="font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label>Nome *</Label>
                <Input name="nome" defaultValue={selectedArticle?.nome} required />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Descrizione</Label>
              <Textarea name="descrizione" defaultValue={selectedArticle?.descrizione} rows={3} />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select name="categoriaId" defaultValue={selectedArticle?.categoriaId || ""}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona..." />
                  </SelectTrigger>
                  <SelectContent>
                    {categorie.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Unità Misura</Label>
                <div className="flex gap-2">
                  <Select
                    value={unitaMisura}
                    onValueChange={(v) => { setUnitaMisura(v); if (v !== "altro") setCustomUnita(""); }}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pz">Pezzi</SelectItem>
                      <SelectItem value="kg">Chilogrammi</SelectItem>
                      <SelectItem value="g">Grammi</SelectItem>
                      <SelectItem value="lt">Litri</SelectItem>
                      <SelectItem value="m">Metri</SelectItem>
                      <SelectItem value="ml">Millilitri</SelectItem>
                      <SelectItem value="cm">Centimetri</SelectItem>
                      <SelectItem value="mm">Millimetri</SelectItem>
                      <SelectItem value="mq">Metri Quadri</SelectItem>
                      <SelectItem value="altro">Altro...</SelectItem>
                    </SelectContent>
                  </Select>
                  {unitaMisura === "altro" && (
                    <Input
                      placeholder="es. rotoli"
                      value={customUnita}
                      onChange={(e) => setCustomUnita(e.target.value)}
                      className="w-24"
                    />
                  )}
                </div>
                <input type="hidden" name="unitaMisura" value={unitaMisura === "altro" ? customUnita : unitaMisura} />
              </div>
              <div className="space-y-2">
                <Label>Giacenza</Label>
                <Input type="number" name="giacenza" defaultValue={selectedArticle?.giacenza || 0} />
              </div>
              <div className="space-y-2">
                <Label>Stock Minimo</Label>
                <Input type="number" name="stockMinimo" defaultValue={selectedArticle?.stockMinimo || 0} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Prezzo Listino (€)</Label>
                <Input
                  name="prezzoListino"
                  value={prezzoListino}
                  onChange={(e) => setPrezzoListino(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Costo (€)</Label>
                <Input
                  name="costo"
                  value={costo}
                  onChange={(e) => setCosto(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Ricarico (%)</Label>
                <Input
                  name="ricarico"
                  value={calcolaRicarico()}
                  readOnly
                  className="bg-muted"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2"><Barcode className="h-4 w-4" /> Codice a Barre</Label>
              <Input name="barcode" defaultValue={selectedArticle?.barcode} placeholder="EAN-13, UPC, ecc." />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><MapPin className="h-4 w-4" /> Scaffale</Label>
                <Input name="ubicazioneScaffale" defaultValue={selectedArticle?.ubicazioneScaffale} placeholder="es. A1" />
              </div>
              <div className="space-y-2">
                <Label>Corsia</Label>
                <Input name="ubicazioneCorsia" defaultValue={selectedArticle?.ubicazioneCorsia} placeholder="es. 3" />
              </div>
              <div className="space-y-2">
                <Label>Ripiano</Label>
                <Input name="ubicazioneRipiano" defaultValue={selectedArticle?.ubicazioneRipiano} placeholder="es. B" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Lotto</Label>
                <Input name="lotto" defaultValue={selectedArticle?.lotto} placeholder="Numero lotto" />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><Calendar className="h-4 w-4" /> Data Scadenza</Label>
                <Input type="date" name="dataScadenza" defaultValue={selectedArticle?.dataScadenza?.split("T")[0]} />
              </div>
            </div>

            <DialogFooter>
              <Button type="submit" disabled={createArticleMutation.isPending}>
                {createArticleMutation.isPending ? "Salvando..." : "Salva"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedCategory?.id ? "Modifica Categoria" : "Nuova Categoria"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            createCategoryMutation.mutate(Object.fromEntries(formData));
          }} className="space-y-4">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input name="nome" defaultValue={selectedCategory?.nome} required />
            </div>
            <div className="space-y-2">
              <Label>Descrizione</Label>
              <Input name="descrizione" defaultValue={selectedCategory?.descrizione} />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={createCategoryMutation.isPending}>
                Salva
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Importa Articoli</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Carica un file Excel (.xlsx), CSV o PDF con le colonne: codice, nome, descrizione, prezzoListino, costo, unitaMisura, stockMinimo, barcode, scaffale, corsia, ripiano, lotto
            </p>
            <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center">
              <input
                type="file"
                accept=".xlsx,.xls,.csv,.pdf"
                className="hidden"
                id="import-file"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;

                  setImporting(true);
                  const formData = new FormData();
                  formData.append("file", file);

                  try {
                    const res = await fetch("/api/catalogo/import", {
                      method: "POST",
                      body: formData,
                    });
                    const data = await res.json();

                    if (data.success) {
                      toast({
                        title: `Importati ${data.imported} di ${data.total} articoli`,
                        description: data.errors?.length ? `${data.errors.length} errori` : undefined
                      });
                      queryClient.invalidateQueries({ queryKey: ["/api/catalogo/articoli"] });
                      setImportDialogOpen(false);
                    } else {
                      toast({ title: "Errore", description: data.error, variant: "destructive" });
                    }
                  } catch (err: any) {
                    toast({ title: "Errore", description: err.message, variant: "destructive" });
                  } finally {
                    setImporting(false);
                  }
                }}
              />
              <label htmlFor="import-file" className="cursor-pointer">
                <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                <p className="font-medium">{importing ? "Importando..." : "Clicca per selezionare il file"}</p>
                <p className="text-xs text-muted-foreground mt-1">Excel (.xlsx, .xls), CSV o PDF</p>
              </label>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={movimentiDialogOpen} onOpenChange={setMovimentiDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm">
              <ArrowUpDown className="h-4 w-4" />
              Movimenti: {movimentiArticolo?.nome}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <h4 className="font-medium mb-2 text-xs">Registra Movimento</h4>
              <div className="space-y-2">
                <div className="flex gap-1.5">
                  <Button
                    variant={nuovoMovimento.tipo === "carico" ? "default" : "outline"}
                    className="flex-1 h-7 text-xs"
                    onClick={() => setNuovoMovimento({ ...nuovoMovimento, tipo: "carico" })}
                  >
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Carico
                  </Button>
                  <Button
                    variant={nuovoMovimento.tipo === "scarico" ? "default" : "outline"}
                    className="flex-1 h-7 text-xs"
                    onClick={() => setNuovoMovimento({ ...nuovoMovimento, tipo: "scarico" })}
                  >
                    <TrendingDown className="h-3 w-3 mr-1" />
                    Scarico
                  </Button>
                </div>
                <div>
                  <Label className="text-xs">Quantità</Label>
                  <Input
                    type="number"
                    value={nuovoMovimento.quantita}
                    onChange={(e) => setNuovoMovimento({ ...nuovoMovimento, quantita: e.target.value })}
                    placeholder="0"
                    className="h-7 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs">Causale</Label>
                  <Select value={nuovoMovimento.causale} onValueChange={(v) => setNuovoMovimento({ ...nuovoMovimento, causale: v })}>
                    <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="Seleziona..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="acquisto" className="text-xs">Acquisto</SelectItem>
                      <SelectItem value="vendita" className="text-xs">Vendita</SelectItem>
                      <SelectItem value="reso" className="text-xs">Reso</SelectItem>
                      <SelectItem value="inventario" className="text-xs">Inventario</SelectItem>
                      <SelectItem value="produzione" className="text-xs">Produzione</SelectItem>
                      <SelectItem value="altro" className="text-xs">Altro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Note</Label>
                  <Input
                    value={nuovoMovimento.note}
                    onChange={(e) => setNuovoMovimento({ ...nuovoMovimento, note: e.target.value })}
                    placeholder="Note opzionali..."
                    className="h-7 text-xs"
                  />
                </div>
                <Button
                  className="w-full h-7 text-xs"
                  disabled={!nuovoMovimento.quantita || registraMovimentoMutation.isPending}
                  onClick={() => {
                    registraMovimentoMutation.mutate({
                      articoloId: movimentiArticolo?.id,
                      tipo: nuovoMovimento.tipo,
                      quantita: parseInt(nuovoMovimento.quantita),
                      causale: nuovoMovimento.causale,
                      note: nuovoMovimento.note
                    });
                  }}
                >
                  {registraMovimentoMutation.isPending ? "Salvando..." : "Registra Movimento"}
                </Button>
              </div>

              <div className="mt-3 p-2 bg-muted rounded-lg">
                <div className="text-[10px] text-muted-foreground">Giacenza attuale</div>
                <div className="text-lg font-bold">{movimentiArticolo?.giacenza || 0} {movimentiArticolo?.unitaMisura}</div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2 text-xs">Andamento Giacenza</h4>
              {movimenti.length > 0 ? (
                <ResponsiveContainer width="100%" height={150}>
                  <LineChart data={[...movimenti].reverse().map((m: any) => ({
                    data: new Date(m.created_at).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' }),
                    giacenza: m.giacenza_successiva
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="data" fontSize={9} />
                    <YAxis fontSize={9} />
                    <Tooltip />
                    <Line type="monotone" dataKey="giacenza" stroke="#3b82f6" strokeWidth={2} dot={{ r: 2 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[150px] flex items-center justify-center text-muted-foreground text-xs">
                  Nessun movimento registrato
                </div>
              )}

              <h4 className="font-medium mt-3 mb-1.5 text-xs">Storico Movimenti</h4>
              <ScrollArea className="h-[160px]">
                <div className="space-y-1">
                  {movimenti.map((m: any) => (
                    <div key={m.id} className="flex items-center justify-between p-1.5 border rounded text-[10px]">
                      <div className="flex items-center gap-1.5">
                        {m.tipo === 'carico' ? (
                          <TrendingUp className="h-3 w-3 text-green-600" />
                        ) : (
                          <TrendingDown className="h-3 w-3 text-red-600" />
                        )}
                        <span className={m.tipo === 'carico' ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                          {m.tipo === 'carico' ? '+' : '-'}{m.quantita}
                        </span>
                        <span className="text-muted-foreground">{m.causale}</span>
                      </div>
                      <div className="text-muted-foreground">
                        {new Date(m.created_at).toLocaleString('it-IT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
