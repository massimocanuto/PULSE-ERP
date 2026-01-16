import { useEffect, useState, useMemo, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Loader2, Building2, Phone, Mail, MapPin, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
  stato?: string;
  categoria?: string;
}

interface GeocodedCliente extends Cliente {
  coords: [number, number];
  accuracy?: 'exact' | 'street' | 'city' | 'province';
}

interface FailedCliente {
  name: string;
  reason: string;
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

interface ClientiMapProps {
  clienti: Cliente[];
}

export function ClientiMap({ clienti }: ClientiMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [geocodedClienti, setGeocodedClienti] = useState<GeocodedCliente[]>([]);
  const [failedClienti, setFailedClienti] = useState<FailedCliente[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [showFailed, setShowFailed] = useState(false);

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

      // Phase 1: Use already saved coordinates
      for (const cliente of clientiWithAddress) {
        const c = cliente as any;
        const latStr = String(c.latitudine).replace(',', '.');
        const longStr = String(c.longitudine).replace(',', '.');
        if (c.latitudine && c.longitudine && !isNaN(parseFloat(latStr)) && !isNaN(parseFloat(longStr))) {
          results.push({
            ...cliente,
            coords: [parseFloat(latStr), parseFloat(longStr)],
            accuracy: 'exact'
          });
        } else {
          toGeocode.push(cliente);
        }
      }

      // If everything is already geocoded, we are done
      if (toGeocode.length === 0) {
        setGeocodedClienti(results);
        setIsLoading(false);
        return;
      }

      const total = clientiWithAddress.length;
      setProgress({ done: results.length, total });

      // Phase 2: Geocode remaining addresses
      for (let i = 0; i < toGeocode.length; i++) {
        const cliente = toGeocode[i];
        try {
          const result = await geocodeItalianAddress(
            cliente.indirizzo || "",
            cliente.citta || "",
            cliente.cap || ""
          );
          if (result && result.coordinates) {
            results.push({
              ...cliente,
              coords: result.coordinates,
              accuracy: result.accuracy
            });
            newCoordinates.push({
              id: cliente.id,
              latitudine: result.coordinates[0].toString(),
              longitudine: result.coordinates[1].toString()
            });
          } else {
            const missingParts = [];
            if (!cliente.citta) missingParts.push("città");
            if (!cliente.indirizzo) missingParts.push("indirizzo");
            if (!cliente.cap) missingParts.push("CAP");

            failed.push({
              name: cliente.ragioneSociale,
              reason: missingParts.length > 0
                ? `Mancano: ${missingParts.join(", ")}`
                : "Indirizzo non trovato su OpenStreetMap"
            });
          }
        } catch (error) {
          failed.push({
            name: cliente.ragioneSociale,
            reason: error instanceof Error ? error.message : "Errore sconosciuto"
          });
        }

        // Progress update
        setProgress({ done: results.length + (failed.length), total });

        // OSM rate limit is strict, use 1s delay if we are doing more than a few
        const delay = toGeocode.length > 5 ? 1000 : 150;
        if (i < toGeocode.length - 1) {
          await new Promise(r => setTimeout(r, delay));
        }
      }

      // Phase 3: Save newly found coordinates to database
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
      setFailedClienti(failed);
      setIsLoading(false);
    };

    const failed: FailedCliente[] = [];
    geocodeAll();
  }, [clientiWithAddress]);

  useEffect(() => {
    if (isLoading || geocodedClienti.length === 0 || !mapRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapRef.current, {
      zoomControl: true,
      scrollWheelZoom: true,
    }).setView([42.5, 12.5], 6);

    mapInstanceRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    // Force invalidateSize after a short delay to ensure container is fully rendered in Dialog
    setTimeout(() => {
      map.invalidateSize();
    }, 250);

    const markers: L.Marker[] = [];

    geocodedClienti.forEach((cliente) => {
      const color = getProvinciaColor(cliente.provincia);

      const icon = L.divIcon({
        className: "custom-marker",
        html: `<div style="
          background-color: ${color};
          width: 24px;
          height: 24px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        "></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 24],
        popupAnchor: [0, -24],
      });

      const popupContent = `
        <div style="min-width: 200px; font-family: system-ui, sans-serif;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
            <strong>${cliente.ragioneSociale}</strong>
          </div>
          ${cliente.provincia ? `<span style="background-color: ${color}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px; display: inline-block; margin-bottom: 8px;">${cliente.provincia}</span>` : ''}
          <div style="font-size: 13px; color: #666;">
            ${cliente.indirizzo ? `<div style="margin-bottom: 4px;">📍 ${cliente.indirizzo}</div>` : ''}
            ${cliente.citta ? `<div style="margin-bottom: 4px; margin-left: 20px;">${cliente.cap || ''} ${cliente.citta}</div>` : ''}
            ${cliente.telefono ? `<div style="margin-bottom: 4px;">📞 ${cliente.telefono}</div>` : ''}
            ${cliente.email ? `<div>✉️ ${cliente.email}</div>` : ''}
          </div>
        </div>
      `;

      const marker = L.marker(cliente.coords, { icon })
        .addTo(map)
        .bindPopup(popupContent);

      markers.push(marker);
    });

    if (failedClienti.length > 0) {
      console.warn("Clienti non geolocalizzati:", failedClienti);
    }

    if (markers.length > 0) {
      const group = L.featureGroup(markers);
      map.fitBounds(group.getBounds(), { padding: [50, 50], maxZoom: 10 });
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
      <div className="h-full w-full flex flex-col items-center justify-center gap-4 bg-muted/20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <div className="text-center w-full max-w-xs">
          <p className="font-medium mb-2">Caricamento mappa clienti...</p>
          <Progress value={(progress.done / progress.total) * 100} className="h-2 mb-2" />
          <p className="text-sm text-muted-foreground">
            Geocodifica indirizzi: {progress.done} / {progress.total}
          </p>
        </div>
      </div>
    );
  }

  if (geocodedClienti.length === 0) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center gap-2 bg-muted/20">
        <MapPin className="h-12 w-12 text-muted-foreground/30" />
        <p className="text-muted-foreground">Nessun cliente con indirizzo valido trovato</p>
        <p className="text-sm text-muted-foreground">Aggiungi città o indirizzo ai clienti per visualizzarli sulla mappa</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full relative">
      <div
        ref={mapRef}
        className="h-full w-full"
        style={{ zIndex: 0 }}
      />
      <div className="absolute bottom-3 left-3 z-[1000] bg-white/95 backdrop-blur rounded-lg shadow-lg px-3 py-2 flex items-center gap-3 flex-wrap max-w-md">
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-green-600">{geocodedClienti.length}</span> / {clientiWithAddress.length} clienti
        </p>
        {failedClienti.length > 0 && (
          <button
            onClick={() => setShowFailed(!showFailed)}
            className="flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700 transition-colors"
          >
            <AlertTriangle className="h-3 w-3" />
            <span>{failedClienti.length} non trovati</span>
          </button>
        )}
        <div className="flex gap-1.5 flex-wrap">
          {Object.entries(clientsByProvincia).slice(0, 4).map(([prov, clients]) => (
            <span
              key={prov}
              className="text-[10px] px-1.5 py-0.5 rounded text-white"
              style={{ backgroundColor: getProvinciaColor(prov) }}
            >
              {prov}: {clients.length}
            </span>
          ))}
          {Object.keys(clientsByProvincia).length > 4 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-600">
              +{Object.keys(clientsByProvincia).length - 4}
            </span>
          )}
        </div>
      </div>

      {showFailed && failedClienti.length > 0 && (
        <div className="absolute bottom-16 left-3 z-[1000] rounded-lg border border-amber-200 bg-amber-50 p-3 max-h-40 max-w-sm overflow-y-auto shadow-lg">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <span className="text-sm font-medium text-amber-800">Clienti non localizzati</span>
            <button onClick={() => setShowFailed(false)} className="ml-auto text-amber-600 hover:text-amber-800">✕</button>
          </div>
          <div className="space-y-1">
            {failedClienti.map((cliente, idx) => (
              <div key={idx} className="text-xs flex justify-between items-center py-1 border-b border-amber-100 last:border-0">
                <span className="font-medium text-amber-900 truncate max-w-[150px]">{cliente.name}</span>
                <span className="text-amber-600 ml-2 text-[10px]">{cliente.reason}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
