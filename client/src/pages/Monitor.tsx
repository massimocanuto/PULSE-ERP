import { useEffect, useState } from "react";
import { Package, Truck, Factory, Clock, RefreshCw, AlertCircle, Warehouse, ArrowDown, ArrowUp, Box, Link2 } from "lucide-react";

interface MonitorStats {
  timestamp: string;
  ddt: {
    stats: Array<{ stato: string; count: string }>;
    daEvadere: Array<{
      id: string;
      numero: string;
      ragione_sociale: string;
      data_emissione: string;
      stato: string;
    }>;
  };
  spedizioni: {
    stats: Array<{ stato: string; count: string }>;
    inCorso: Array<{
      id: string;
      numero: string;
      destinatario: string;
      stato: string;
      data: string;
      corriere_nome: string;
    }>;
  };
  produzione: {
    stats: Array<{ stato: string; count: string }>;
    inCorso: Array<{
      id: string;
      numero: string;
      nome_prodotto: string;
      quantita: string;
      stato: string;
      data_inizio: string;
      data_fine_prevista: string;
    }>;
  };
  magazzino: {
    stats: Array<{ categoria: string; count: string; totale_giacenza: string }>;
    sottoscorta: Array<{
      id: string;
      codice: string;
      nome: string;
      giacenza: string;
      scorta_minima: string;
      unita_misura: string;
    }>;
    movimentiRecenti: Array<{
      id: string;
      tipo: string;
      quantita: string;
      data: string;
      causale: string;
      prodotto_codice: string;
      prodotto_nome: string;
    }>;
  };
}

const STATO_SPEDIZIONE_LABELS: Record<string, { label: string; color: string }> = {
  da_preparare: { label: "Da Preparare", color: "bg-yellow-500" },
  in_preparazione: { label: "In Preparazione", color: "bg-blue-500" },
  pronta: { label: "Pronta", color: "bg-purple-500" },
  spedita: { label: "Spedita", color: "bg-orange-500" },
  consegnata: { label: "Consegnata", color: "bg-green-500" },
  annullata: { label: "Annullata", color: "bg-red-500" },
};

const STATO_DDT_LABELS: Record<string, { label: string; color: string }> = {
  bozza: { label: "Bozza", color: "bg-gray-500" },
  in_preparazione: { label: "In Preparazione", color: "bg-yellow-500" },
  in_spedizione: { label: "In Spedizione", color: "bg-orange-500" },
  consegnato: { label: "Consegnato", color: "bg-green-500" },
};

const STATO_PRODUZIONE_LABELS: Record<string, { label: string; color: string }> = {
  pianificato: { label: "Pianificato", color: "bg-gray-500" },
  in_corso: { label: "In Corso", color: "bg-blue-500" },
  completato: { label: "Completato", color: "bg-green-500" },
  sospeso: { label: "Sospeso", color: "bg-yellow-500" },
  annullato: { label: "Annullato", color: "bg-red-500" },
};

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit", year: "2-digit" });
  } catch {
    return dateStr;
  }
}

export default function Monitor() {
  const [stats, setStats] = useState<MonitorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/monitor/stats");
      const data = await res.json();
      setStats(data);
      setLastUpdate(new Date());
    } catch (error) {
      console.error("Errore caricamento stats:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="flex items-center gap-4 text-white text-4xl">
          <RefreshCw className="w-12 h-12 animate-spin" />
          <span>Caricamento...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold tracking-tight">PULSE Monitor</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigator.clipboard.writeText(window.location.href)}
            className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors flex items-center gap-2"
            title="Copia link - Schermata condivisa"
          >
            <Link2 className="w-4 h-4" />
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
            </span>
          </button>
          <div className="flex items-center gap-2 text-gray-400 text-xs">
            <RefreshCw className="w-3 h-3" />
            <span>{lastUpdate.toLocaleTimeString("it-IT")}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <div className="bg-yellow-600 px-3 py-1.5 flex items-center gap-2">
            <Package className="w-3.5 h-3.5" />
            <span className="font-semibold text-xs">DDT DA EVADERE</span>
            <span className="ml-auto bg-white text-yellow-600 px-1.5 py-0.5 rounded-full text-[10px] font-bold">
              {stats?.ddt.daEvadere?.length || 0}
            </span>
          </div>
          <div className="overflow-auto max-h-[200px]">
            <table className="w-full text-[10px]">
              <thead className="bg-gray-700 sticky top-0">
                <tr>
                  <th className="text-left px-1.5 py-1 font-medium">Numero</th>
                  <th className="text-left px-1.5 py-1 font-medium">Cliente</th>
                  <th className="text-left px-1.5 py-1 font-medium">Data</th>
                  <th className="text-left px-1.5 py-1 font-medium">Stato</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {stats?.ddt.daEvadere?.map((ddt) => {
                  const statoInfo = STATO_DDT_LABELS[ddt.stato];
                  return (
                    <tr key={ddt.id} className="hover:bg-gray-750">
                      <td className="px-1.5 py-1 font-medium">{ddt.numero}</td>
                      <td className="px-1.5 py-1 truncate max-w-[120px]">{ddt.ragione_sociale}</td>
                      <td className="px-1.5 py-1">{formatDate(ddt.data_emissione)}</td>
                      <td className="px-1.5 py-1">
                        <span className={`${statoInfo?.color} text-white px-1 py-0.5 rounded text-[8px]`}>
                          {statoInfo?.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {(!stats?.ddt.daEvadere || stats.ddt.daEvadere.length === 0) && (
                  <tr>
                    <td colSpan={4} className="px-1.5 py-3 text-center text-gray-500">
                      Nessun DDT da evadere
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <div className="bg-blue-600 px-3 py-1.5 flex items-center gap-2">
            <Truck className="w-3.5 h-3.5" />
            <span className="font-semibold text-xs">SPEDIZIONI IN CORSO</span>
            <span className="ml-auto bg-white text-blue-600 px-1.5 py-0.5 rounded-full text-[10px] font-bold">
              {stats?.spedizioni.inCorso?.length || 0}
            </span>
          </div>
          <div className="overflow-auto max-h-[200px]">
            <table className="w-full text-[10px]">
              <thead className="bg-gray-700 sticky top-0">
                <tr>
                  <th className="text-left px-1.5 py-1 font-medium">Numero</th>
                  <th className="text-left px-1.5 py-1 font-medium">Destinatario</th>
                  <th className="text-left px-1.5 py-1 font-medium">Data</th>
                  <th className="text-left px-1.5 py-1 font-medium">Stato</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {stats?.spedizioni.inCorso?.map((sped) => {
                  const statoInfo = STATO_SPEDIZIONE_LABELS[sped.stato];
                  return (
                    <tr key={sped.id} className="hover:bg-gray-750">
                      <td className="px-1.5 py-1 font-medium">{sped.numero}</td>
                      <td className="px-1.5 py-1 truncate max-w-[120px]">{sped.destinatario}</td>
                      <td className="px-1.5 py-1">{formatDate(sped.data)}</td>
                      <td className="px-1.5 py-1">
                        <span className={`${statoInfo?.color} text-white px-1 py-0.5 rounded text-[8px]`}>
                          {statoInfo?.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {(!stats?.spedizioni.inCorso || stats.spedizioni.inCorso.length === 0) && (
                  <tr>
                    <td colSpan={4} className="px-1.5 py-3 text-center text-gray-500">
                      Nessuna spedizione in corso
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <div className="bg-green-600 px-3 py-1.5 flex items-center gap-2">
            <Factory className="w-3.5 h-3.5" />
            <span className="font-semibold text-xs">ORDINI PRODUZIONE</span>
            <span className="ml-auto bg-white text-green-600 px-1.5 py-0.5 rounded-full text-[10px] font-bold">
              {stats?.produzione.inCorso?.length || 0}
            </span>
          </div>
          <div className="overflow-auto max-h-[200px]">
            <table className="w-full text-[10px]">
              <thead className="bg-gray-700 sticky top-0">
                <tr>
                  <th className="text-left px-1.5 py-1 font-medium">Numero</th>
                  <th className="text-left px-1.5 py-1 font-medium">Prodotto</th>
                  <th className="text-left px-1.5 py-1 font-medium">Q.tà</th>
                  <th className="text-left px-1.5 py-1 font-medium">Stato</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {stats?.produzione.inCorso?.map((ord) => {
                  const statoInfo = STATO_PRODUZIONE_LABELS[ord.stato];
                  return (
                    <tr key={ord.id} className="hover:bg-gray-750">
                      <td className="px-1.5 py-1 font-medium">{ord.numero}</td>
                      <td className="px-1.5 py-1 truncate max-w-[120px]">{ord.nome_prodotto}</td>
                      <td className="px-1.5 py-1">{ord.quantita}</td>
                      <td className="px-1.5 py-1">
                        <span className={`${statoInfo?.color} text-white px-1 py-0.5 rounded text-[8px]`}>
                          {statoInfo?.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {(!stats?.produzione.inCorso || stats.produzione.inCorso.length === 0) && (
                  <tr>
                    <td colSpan={4} className="px-2 py-4 text-center text-gray-500">
                      Nessun ordine produzione
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <div className="bg-red-600 px-3 py-1.5 flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5" />
            <span className="font-semibold text-xs">PRODOTTI SOTTOSCORTA</span>
            <span className="ml-auto bg-white text-red-600 px-1.5 py-0.5 rounded-full text-[10px] font-bold">
              {stats?.magazzino.sottoscorta?.length || 0}
            </span>
          </div>
          <div className="overflow-auto max-h-[200px]">
            <table className="w-full text-[10px]">
              <thead className="bg-gray-700 sticky top-0">
                <tr>
                  <th className="text-left px-1.5 py-1 font-medium">Codice</th>
                  <th className="text-left px-1.5 py-1 font-medium">Prodotto</th>
                  <th className="text-right px-1.5 py-1 font-medium">Giac.</th>
                  <th className="text-right px-1.5 py-1 font-medium">Min</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {stats?.magazzino.sottoscorta?.map((prod) => (
                  <tr key={prod.id} className="hover:bg-gray-750">
                    <td className="px-1.5 py-1 font-medium">{prod.codice}</td>
                    <td className="px-1.5 py-1 truncate max-w-[120px]">{prod.nome}</td>
                    <td className="px-1.5 py-1 text-right text-red-400 font-bold">{prod.giacenza}</td>
                    <td className="px-1.5 py-1 text-right text-gray-400">{prod.scorta_minima}</td>
                  </tr>
                ))}
                {(!stats?.magazzino.sottoscorta || stats.magazzino.sottoscorta.length === 0) && (
                  <tr>
                    <td colSpan={4} className="px-1.5 py-3 text-center text-green-500">
                      Magazzino OK
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="mt-3 bg-gray-800 rounded-lg overflow-hidden">
        <div className="bg-purple-600 px-3 py-1.5 flex items-center gap-2">
          <Clock className="w-3.5 h-3.5" />
          <span className="font-semibold text-xs">MOVIMENTI MAGAZZINO RECENTI</span>
        </div>
        <div className="overflow-auto max-h-[120px]">
          <table className="w-full text-[10px]">
            <thead className="bg-gray-700 sticky top-0">
              <tr>
                <th className="text-left px-1.5 py-1 font-medium w-8">Tipo</th>
                <th className="text-left px-1.5 py-1 font-medium">Codice</th>
                <th className="text-left px-1.5 py-1 font-medium">Prodotto</th>
                <th className="text-left px-1.5 py-1 font-medium">Causale</th>
                <th className="text-right px-1.5 py-1 font-medium">Q.tà</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {stats?.magazzino.movimentiRecenti?.map((mov) => (
                <tr key={mov.id} className="hover:bg-gray-750">
                  <td className="px-1.5 py-1">
                    {mov.tipo === "carico" ? (
                      <ArrowDown className="w-3 h-3 text-green-400" />
                    ) : (
                      <ArrowUp className="w-3 h-3 text-red-400" />
                    )}
                  </td>
                  <td className="px-1.5 py-1 font-medium">{mov.prodotto_codice || "-"}</td>
                  <td className="px-1.5 py-1 truncate max-w-[150px]">{mov.prodotto_nome}</td>
                  <td className="px-1.5 py-1 text-gray-400">{mov.causale || mov.tipo}</td>
                  <td className={`px-1.5 py-1 text-right font-bold ${mov.tipo === "carico" ? "text-green-400" : "text-red-400"}`}>
                    {mov.tipo === "carico" ? "+" : "-"}{mov.quantita}
                  </td>
                </tr>
              ))}
              {(!stats?.magazzino.movimentiRecenti || stats.magazzino.movimentiRecenti.length === 0) && (
                <tr>
                  <td colSpan={5} className="px-1.5 py-3 text-center text-gray-500">
                    Nessun movimento recente
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="fixed bottom-2 right-2 text-gray-600 text-[10px]">
        Auto-refresh 30s
      </div>
    </div>
  );
}
