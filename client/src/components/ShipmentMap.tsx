import { useEffect, useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Navigation, MapPin, Clock, Route, Loader2, AlertTriangle, ExternalLink, Info, Building2 } from "lucide-react";
import { geocodeItalianAddress, getRoute, type GeocodingResult } from "@/lib/geocoding";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const originIconUrl = "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png";
const destIconUrl = "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png";
const shadowUrl = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png";

interface ShipmentMapProps {
  destinationAddress: string;
  destinationCity?: string;
  destinationCap?: string;
  originAddress?: string;
  originCity?: string;
  originCap?: string;
}

export function ShipmentMap({ destinationAddress, destinationCity, destinationCap, originAddress, originCity, originCap }: ShipmentMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [originCoords, setOriginCoords] = useState<[number, number] | null>(null);
  const [destResult, setDestResult] = useState<GeocodingResult | null>(null);
  const [routeInfo, setRouteInfo] = useState<{ distance: number; duration: number; geometry: [number, number][] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [geoWarning, setGeoWarning] = useState<string | null>(null);
  const [originName, setOriginName] = useState<string>("Milano (default)");

  const defaultOrigin: [number, number] = [45.4642, 9.19];

  useEffect(() => {
    async function initMap() {
      setLoading(true);
      setError(null);
      setGeoWarning(null);

      try {
        if (!destinationCity) {
          setError("Città destinazione mancante");
          setLoading(false);
          return;
        }

        const destGeocode = await geocodeItalianAddress(
          destinationAddress || "",
          destinationCity,
          destinationCap || ""
        );

        if (!destGeocode) {
          setError("Indirizzo destinazione non trovato. Verifica città e CAP.");
          setLoading(false);
          return;
        }

        setDestResult(destGeocode);

        if (destGeocode.accuracy === 'city' || destGeocode.accuracy === 'province') {
          setGeoWarning(`Precisione destinazione: ${destGeocode.accuracy === 'city' ? 'città' : 'provincia'}`);
        }

        let origin: [number, number] = defaultOrigin;
        let originLabel = "Milano (default)";

        if (originCity) {
          console.log("🏢 Usando indirizzo aziendale come origine:", originAddress, originCity, originCap);
          const originGeocode = await geocodeItalianAddress(
            originAddress || "",
            originCity,
            originCap || ""
          );

          if (originGeocode) {
            origin = originGeocode.coordinates;
            originLabel = [originAddress, originCity].filter(Boolean).join(", ");
            console.log("✅ Origine aziendale geocodificata:", origin);
          } else {
            setGeoWarning("Indirizzo aziendale non trovato. Usando Milano come origine.");
          }
        } else {
          setGeoWarning("Configura l'indirizzo aziendale in Anagrafica → La Mia Azienda per usarlo come partenza.");
        }

        setOriginCoords(origin);
        setOriginName(originLabel);

        const route = await getRoute(origin, destGeocode.coordinates);
        if (route) {
          setRouteInfo({ distance: route.distance, duration: route.duration, geometry: route.geometry });
        }

        setLoading(false);
      } catch (err) {
        console.error("Map init error:", err);
        setError("Errore durante il caricamento. Riprova.");
        setLoading(false);
      }
    }

    if (destinationCity) {
      initMap();
    } else {
      setLoading(false);
      setError("Città destinazione mancante");
    }
  }, [destinationAddress, destinationCity, destinationCap, originAddress, originCity, originCap]);

  useEffect(() => {
    if (loading || !originCoords || !destResult || !mapRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const center: [number, number] = [
      (originCoords[0] + destResult.coordinates[0]) / 2,
      (originCoords[1] + destResult.coordinates[1]) / 2
    ];

    const map = L.map(mapRef.current).setView(center, 7);
    mapInstanceRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    const originIcon = L.icon({
      iconUrl: originIconUrl,
      shadowUrl: shadowUrl,
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });

    const destIcon = L.icon({
      iconUrl: destIconUrl,
      shadowUrl: shadowUrl,
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });

    const originMarker = L.marker(originCoords, { icon: originIcon })
      .addTo(map)
      .bindPopup(`<strong>Partenza</strong><br />${originName}`);

    const destMarker = L.marker(destResult.coordinates, { icon: destIcon })
      .addTo(map)
      .bindPopup(`<strong>Destinazione</strong><br />${destinationAddress ? `${destinationAddress}, ` : ''}${destinationCap} ${destinationCity}`);

    if (routeInfo?.geometry && routeInfo.geometry.length > 0) {
      L.polyline(routeInfo.geometry, { color: "#3b82f6", weight: 4, opacity: 0.8 }).addTo(map);
    }

    const bounds = L.latLngBounds([originCoords, destResult.coordinates]);
    map.fitBounds(bounds, { padding: [50, 50] });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [loading, originCoords, destResult, routeInfo, originName, destinationAddress, destinationCap, destinationCity]);

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return hours > 0 ? `${hours}h ${mins}min` : `${mins} min`;
  };

  const openGoogleMaps = useCallback(() => {
    if (originCoords && destResult) {
      const url = `https://www.google.com/maps/dir/${originCoords[0]},${originCoords[1]}/${destResult.coordinates[0]},${destResult.coordinates[1]}`;
      window.open(url, "_blank");
    }
  }, [originCoords, destResult]);

  const openOpenStreetMap = useCallback(() => {
    if (originCoords && destResult) {
      const url = `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${originCoords[0]}%2C${originCoords[1]}%3B${destResult.coordinates[0]}%2C${destResult.coordinates[1]}`;
      window.open(url, "_blank");
    }
  }, [originCoords, destResult]);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500 mr-3" />
          <span>Caricamento mappa...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center gap-3 text-red-600">
            <AlertTriangle className="h-6 w-6" />
            <span>{error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Route className="h-5 w-5 text-blue-600" />
          Percorso Spedizione
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {geoWarning && (
          <div className="flex items-center gap-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-sm text-yellow-700 dark:text-yellow-300">
            <Info className="h-4 w-4 flex-shrink-0" />
            {geoWarning}
          </div>
        )}

        {routeInfo && (
          <div className="flex flex-wrap items-center gap-4">
            <Badge variant="outline" className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-50 dark:bg-blue-900/20 border-blue-200">
              <Navigation className="h-4 w-4 text-blue-600" />
              <span className="font-semibold">{routeInfo.distance.toFixed(1)} km</span>
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-green-50 dark:bg-green-900/20 border-green-200">
              <Clock className="h-4 w-4 text-green-600" />
              <span className="font-semibold">{formatDuration(routeInfo.duration)}</span>
            </Badge>
            {destResult?.accuracy && destResult.accuracy !== 'exact' && (
              <Badge variant="secondary" className="text-xs">
                {destResult.accuracy === 'street' ? '~Via' : destResult.accuracy === 'city' ? '~Città' : '~Provincia'}
              </Badge>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-start gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <Building2 className="h-4 w-4 text-green-600 mt-0.5" />
            <div>
              <p className="font-medium text-green-800 dark:text-green-200">Partenza</p>
              <p className="text-green-700 dark:text-green-300">{originName}</p>
            </div>
          </div>
          <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <MapPin className="h-4 w-4 text-red-600 mt-0.5" />
            <div>
              <p className="font-medium text-red-800 dark:text-red-200">Destinazione</p>
              <p className="text-red-700 dark:text-red-300">
                {destinationAddress && `${destinationAddress}, `}
                {destinationCap} {destinationCity}
              </p>
            </div>
          </div>
        </div>

        {originCoords && destResult && (
          <div 
            ref={mapRef} 
            className="rounded-lg overflow-hidden border h-[350px]"
            style={{ zIndex: 0 }}
          />
        )}

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={openGoogleMaps} className="flex-1">
            <ExternalLink className="h-4 w-4 mr-2" />
            Apri in Google Maps
          </Button>
          <Button variant="outline" size="sm" onClick={openOpenStreetMap} className="flex-1">
            <ExternalLink className="h-4 w-4 mr-2" />
            Apri in OpenStreetMap
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
