import { useEffect, useState, useMemo, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Loader2, MapPin, RefreshCw, Maximize2, Minimize2 } from "lucide-react";
import { geocodeItalianAddress } from "@/lib/geocoding";
import { Progress } from "@/components/ui/progress";

interface Cliente {
  id: string;
  ragioneSociale: string;
  indirizzo?: string;
  citta?: string;
  cap?: string;
  provincia?: string;
  telefono?: string;
  email?: string;
  latitudine?: string;
  longitudine?: string;
}

interface GeocodedCliente extends Cliente {
  coords: [number, number];
}

const REGIONE_COLORS: { [key: string]: string } = {
  "MI": "#3b82f6", "MB": "#3b82f6", "VA": "#3b82f6", "CO": "#3b82f6", "LC": "#3b82f6", "BG": "#3b82f6", "BS": "#3b82f6", "PV": "#3b82f6", "LO": "#3b82f6", "CR": "#3b82f6", "MN": "#3b82f6", "SO": "#3b82f6",
  "TO": "#8b5cf6", "VC": "#8b5cf6", "NO": "#8b5cf6", "CN": "#8b5cf6", "AT": "#8b5cf6", "AL": "#8b5cf6", "BI": "#8b5cf6", "VB": "#8b5cf6",
  "GE": "#06b6d4", "IM": "#06b6d4", "SP": "#06b6d4", "SV": "#06b6d4",
  "VE": "#10b981", "PD": "#10b981", "VR": "#10b981", "VI": "#10b981", "TV": "#10b981", "BL": "#10b981", "RO": "#10b981",
  "TS": "#14b8a6", "UD": "#14b8a6", "GO": "#14b8a6", "PN": "#14b8a6",
  "TN": "#f59e0b", "BZ": "#f59e0b",
  "BO": "#ef4444", "MO": "#ef4444", "RE": "#ef4444", "PR": "#ef4444", "PC": "#ef4444", "FE": "#ef4444", "RA": "#ef4444", "FC": "#ef4444", "RN": "#ef4444",
  "FI": "#f97316", "AR": "#f97316", "SI": "#f97316", "GR": "#f97316", "LI": "#f97316", "PI": "#f97316", "LU": "#f97316", "MS": "#f97316", "PT": "#f97316", "PO": "#f97316",
  "PG": "#84cc16", "TR": "#84cc16",
  "AN": "#22c55e", "PU": "#22c55e", "MC": "#22c55e", "AP": "#22c55e", "FM": "#22c55e",
  "RM": "#dc2626", "VT": "#dc2626", "RI": "#dc2626", "LT": "#dc2626", "FR": "#dc2626",
  "AQ": "#a855f7", "TE": "#a855f7", "PE": "#a855f7", "CH": "#a855f7",
  "CB": "#d946ef", "IS": "#d946ef",
  "NA": "#0ea5e9", "SA": "#0ea5e9", "CE": "#0ea5e9", "BN": "#0ea5e9", "AV": "#0ea5e9",
  "BA": "#6366f1", "TA": "#6366f1", "BR": "#6366f1", "LE": "#6366f1", "FG": "#6366f1", "BT": "#6366f1",
  "PZ": "#ec4899", "MT": "#ec4899",
  "CS": "#f43f5e", "CZ": "#f43f5e", "KR": "#f43f5e", "VV": "#f43f5e", "RC": "#f43f5e",
  "PA": "#eab308", "CT": "#eab308", "ME": "#eab308", "AG": "#eab308", "CL": "#eab308", "EN": "#eab308", "RG": "#eab308", "SR": "#eab308", "TP": "#eab308",
  "CA": "#64748b", "SS": "#64748b", "NU": "#64748b", "OR": "#64748b", "SU": "#64748b",
  "AO": "#7c3aed",
};

function getProvinciaColor(provincia: string | null | undefined): string {
  if (!provincia) return "#94a3b8";
  return REGIONE_COLORS[provincia.toUpperCase()] || "#94a3b8";
}

export default function PublicMappaClienti() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [clienti, setClienti] = useState<Cliente[]>([]);
  const [geocodedClienti, setGeocodedClienti] = useState<GeocodedCliente[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState({ done: 0, total: 0, phase: "Caricamento clienti..." });
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const clientiWithAddress = useMemo(() => {
    return clienti.filter(c => c.citta || c.indirizzo);
  }, [clienti]);

  const clientsByProvincia = useMemo(() => {
    return geocodedClienti.reduce((acc, c) => {
      const prov = c.provincia?.toUpperCase() || "N/D";
      if (!acc[prov]) acc[prov] = [];
      acc[prov].push(c);
      return acc;
    }, {} as Record<string, GeocodedCliente[]>);
  }, [geocodedClienti]);

  const fetchClienti = async () => {
    try {
      const res = await fetch("/api/public/mappa-clienti");
      if (res.ok) {
        const data = await res.json();
        setClienti(data);
      }
    } catch (error) {
      console.error("Errore caricamento clienti:", error);
    }
  };

  useEffect(() => {
    fetchClienti();
    const interval = setInterval(fetchClienti, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const geocodeAll = async () => {
      if (clientiWithAddress.length === 0) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const results: GeocodedCliente[] = [];
      const toGeocode: Cliente[] = [];
      const newCoordinates: { id: string; latitudine: string; longitudine: string }[] = [];

      // Prima usa le coordinate già salvate nel database
      for (const cliente of clientiWithAddress) {
        if (cliente.latitudine && cliente.longitudine) {
          results.push({
            ...cliente,
            coords: [parseFloat(cliente.latitudine), parseFloat(cliente.longitudine)]
          });
        } else {
          toGeocode.push(cliente);
        }
      }

      // Se non ci sono clienti da geocodificare, mostra subito la mappa
      if (toGeocode.length === 0) {
        setGeocodedClienti(results);
        setLastUpdate(new Date());
        setIsLoading(false);
        return;
      }

      setProgress({ done: results.length, total: clientiWithAddress.length, phase: `Geocodifica ${toGeocode.length} nuovi indirizzi...` });

      // Geocodifica solo i clienti senza coordinate
      for (let i = 0; i < toGeocode.length; i++) {
        const cliente = toGeocode[i];
        try {
          const result = await geocodeItalianAddress(
            cliente.indirizzo || "",
            cliente.citta || "",
            cliente.cap || ""
          );
          if (result && result.coordinates) {
            results.push({ ...cliente, coords: result.coordinates });
            newCoordinates.push({
              id: cliente.id,
              latitudine: result.coordinates[0].toString(),
              longitudine: result.coordinates[1].toString()
            });
          }
        } catch (error) {
          console.error("Geocoding error:", error);
        }
        setProgress({
          done: results.length,
          total: clientiWithAddress.length,
          phase: `Geocodifica ${toGeocode.length - i - 1} indirizzi rimanenti...`
        });
        if (i < toGeocode.length - 1) {
          await new Promise(r => setTimeout(r, 50));
        }
      }

      // Salva le nuove coordinate nel database
      if (newCoordinates.length > 0) {
        try {
          await fetch("/api/public/mappa-clienti/geocode", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ coordinates: newCoordinates })
          });
        } catch (error) {
          console.error("Errore salvataggio coordinate:", error);
        }
      }

      setGeocodedClienti(results);
      setLastUpdate(new Date());
      setIsLoading(false);
    };

    if (clientiWithAddress.length > 0) {
      geocodeAll();
    }
  }, [clientiWithAddress]);

  useEffect(() => {
    if (isLoading || geocodedClienti.length === 0 || !mapRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapRef.current).setView([42.5, 12.5], 6);
    mapInstanceRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap'
    }).addTo(map);

    const markers: L.Marker[] = [];

    geocodedClienti.forEach((cliente) => {
      const color = getProvinciaColor(cliente.provincia);

      const icon = L.divIcon({
        className: "custom-marker",
        html: `<div style="
          background-color: ${color};
          width: 28px;
          height: 28px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          border: 3px solid white;
          box-shadow: 0 3px 6px rgba(0,0,0,0.4);
        "></div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 28],
        popupAnchor: [0, -28],
      });

      const popupContent = `
        <div style="min-width: 220px; font-family: system-ui, sans-serif; font-size: 14px;">
          <div style="font-weight: bold; font-size: 16px; margin-bottom: 8px;">${cliente.ragioneSociale}</div>
          ${cliente.provincia ? `<span style="background-color: ${color}; color: white; padding: 3px 10px; border-radius: 4px; font-size: 12px; display: inline-block; margin-bottom: 8px;">${cliente.provincia}</span>` : ''}
          <div style="color: #666;">
            ${cliente.indirizzo ? `<div style="margin-bottom: 4px;">📍 ${cliente.indirizzo}</div>` : ''}
            ${cliente.citta ? `<div style="margin-bottom: 4px; margin-left: 20px;">${cliente.cap || ''} ${cliente.citta}</div>` : ''}
            ${cliente.telefono ? `<div>📞 ${cliente.telefono}</div>` : ''}
          </div>
        </div>
      `;

      const marker = L.marker(cliente.coords, { icon })
        .addTo(map)
        .bindPopup(popupContent);

      markers.push(marker);
    });

    if (markers.length > 0) {
      const group = L.featureGroup(markers);
      map.fitBounds(group.getBounds(), { padding: [60, 60], maxZoom: 9 });
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isLoading, geocodedClienti]);

  if (isLoading) {
    return (
      <div className="h-screen w-screen bg-slate-900 flex flex-col items-center justify-center gap-6">
        <div className="text-white text-center">
          <Loader2 className="h-16 w-16 animate-spin text-blue-400 mx-auto mb-6" />
          <h1 className="text-3xl font-bold mb-2">PULSE ERP</h1>
          <p className="text-xl text-slate-300 mb-4">Mappa Clienti</p>
          <Progress value={(progress.done / progress.total) * 100} className="w-64 h-2 mb-4 bg-slate-700" indicatorClassName="bg-blue-400" />
          <p className="text-lg text-slate-400">{progress.phase}</p>
          <p className="text-2xl font-mono text-blue-400 mt-2">
            {progress.done} / {progress.total}
          </p>
        </div>
      </div>
    );
  }

  if (geocodedClienti.length === 0) {
    return (
      <div className="h-screen w-screen bg-slate-900 flex flex-col items-center justify-center gap-4">
        <MapPin className="h-24 w-24 text-slate-600" />
        <p className="text-2xl text-slate-400">Nessun cliente con indirizzo trovato</p>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex bg-slate-100">
      <div className="flex-1 relative">
        <div ref={mapRef} className="h-full w-full" />

        <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur rounded-lg shadow-lg px-4 py-2 flex items-center gap-2 text-sm text-slate-600">
          <RefreshCw className="h-4 w-4" />
          {lastUpdate && (
            <span>Ultimo aggiornamento: {lastUpdate.toLocaleTimeString('it-IT')}</span>
          )}
        </div>

        <div className="absolute top-4 left-4 flex items-center gap-3">
          <button
            onClick={toggleFullscreen}
            className="bg-white/90 backdrop-blur hover:bg-white text-slate-700 rounded-xl shadow-xl p-3 transition-colors"
            title={isFullscreen ? "Esci da schermo intero" : "Schermo intero"}
          >
            {isFullscreen ? <Minimize2 className="h-6 w-6" /> : <Maximize2 className="h-6 w-6" />}
          </button>
        </div>
      </div>

      <div className="w-72 border-l bg-white flex flex-col shadow-xl">
        <div className="p-4 border-b bg-blue-600 text-white">
          <h1 className="text-xl font-bold">PULSE ERP</h1>
          <p className="text-sm text-blue-100">Mappa Clienti</p>
        </div>
        <div className="p-3 border-b bg-slate-50">
          <h3 className="font-semibold text-sm">Lista Clienti</h3>
          <p className="text-xs text-muted-foreground">{geocodedClienti.length} clienti visualizzati</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="p-2 space-y-1">
            {geocodedClienti.map((cliente) => {
              const provinciaColor = getProvinciaColor(cliente.provincia);
              return (
                <div
                  key={cliente.id}
                  className="p-2 rounded-lg border bg-white hover:bg-slate-50 cursor-pointer transition-colors"
                  style={{ borderLeftWidth: 3, borderLeftColor: provinciaColor }}
                >
                  <div className="font-medium text-sm truncate">{cliente.ragioneSociale}</div>
                  <div className="flex items-center gap-2 mt-1">
                    {cliente.provincia && (
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded text-white"
                        style={{ backgroundColor: provinciaColor }}
                      >
                        {cliente.provincia}
                      </span>
                    )}
                    {cliente.citta && (
                      <span className="text-xs text-slate-500 truncate">{cliente.citta}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="p-3 border-t bg-slate-50">
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(clientsByProvincia).slice(0, 6).map(([prov, clients]) => (
              <span
                key={prov}
                className="text-[10px] px-1.5 py-0.5 rounded text-white"
                style={{ backgroundColor: getProvinciaColor(prov) }}
              >
                {prov}: {clients.length}
              </span>
            ))}
            {Object.keys(clientsByProvincia).length > 6 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-600">
                +{Object.keys(clientsByProvincia).length - 6}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
