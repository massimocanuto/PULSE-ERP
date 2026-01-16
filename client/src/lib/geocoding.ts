export interface GeocodingResult {
  coordinates: [number, number];
  accuracy: 'exact' | 'street' | 'city' | 'province';
  displayName?: string;
}

const ITALIAN_BILINGUAL_CITIES: Record<string, string> = {
  'bolzano': 'bolzano',
  'bozen': 'bolzano',
  'merano': 'merano',
  'meran': 'merano',
  'bressanone': 'bressanone',
  'brixen': 'bressanone',
  'brunico': 'brunico',
  'bruneck': 'brunico',
  'vipiteno': 'vipiteno',
  'sterzing': 'vipiteno',
  'laives': 'laives',
  'leifers': 'laives',
  'appiano': 'appiano',
  'eppan': 'appiano',
  'trento': 'trento',
  'trient': 'trento',
  'rovereto': 'rovereto',
  'aosta': 'aosta',
  'aoste': 'aosta',
  'trieste': 'trieste',
  'trst': 'trieste',
  'gorizia': 'gorizia',
  'gorica': 'gorizia',
};

const PROVINCE_FALLBACKS: Record<string, [number, number]> = {
  'bolzano': [46.4983, 11.3548],
  'trento': [46.0748, 11.1217],
  'aosta': [45.7372, 7.3206],
  'trieste': [45.6495, 13.7768],
  'gorizia': [45.9414, 13.6219],
  'udine': [46.0711, 13.2346],
  'milano': [45.4642, 9.1900],
  'roma': [41.9028, 12.4964],
  'torino': [45.0703, 7.6869],
  'napoli': [40.8518, 14.2681],
  'firenze': [43.7696, 11.2558],
  'bologna': [44.4949, 11.3426],
  'venezia': [45.4408, 12.3155],
  'genova': [44.4056, 8.9463],
  'palermo': [38.1157, 13.3615],
  'bari': [41.1171, 16.8719],
};

export function normalizeAddress(input: string): string {
  let normalized = input
    .toLowerCase()
    .replace(/\s*\.\s*/g, ' ')
    .replace(/[.,;:!?'"()[\]{}]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  for (const [variant, canonical] of Object.entries(ITALIAN_BILINGUAL_CITIES)) {
    const regex = new RegExp(`\\b${variant}\\b`, 'gi');
    if (regex.test(normalized)) {
      normalized = normalized.replace(regex, '');
      if (!normalized.includes(canonical)) {
        normalized = normalized.replace(/\s+/g, ' ').trim() + ' ' + canonical;
      }
    }
  }

  return normalized.replace(/\s+/g, ' ').trim();
}

export function normalizeCity(city: string): string {
  const cleaned = city
    .toLowerCase()
    .replace(/\s*\.\s*/g, ' ')
    .replace(/[.,;:!?'"()[\]{}]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const words = cleaned.split(' ').filter(w => w.length > 0);
  
  for (const word of words) {
    if (ITALIAN_BILINGUAL_CITIES[word]) {
      return ITALIAN_BILINGUAL_CITIES[word];
    }
  }

  return words[0] || cleaned;
}

async function nominatimSearch(query: string, timeout = 5000): Promise<GeocodingResult | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&countrycodes=it`;
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'PULSE-ERP/2.1' }
    });
    
    clearTimeout(timeoutId);
    const data = await res.json();
    
    if (data && data.length > 0) {
      return {
        coordinates: [parseFloat(data[0].lat), parseFloat(data[0].lon)],
        accuracy: 'exact',
        displayName: data[0].display_name
      };
    }
    return null;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn('⏱️ Geocoding timeout for:', query);
    }
    return null;
  }
}

export async function geocodeItalianAddress(
  street: string,
  city: string,
  cap: string
): Promise<GeocodingResult | null> {
  const normalizedCity = normalizeCity(city);
  const normalizedStreet = normalizeAddress(street);
  
  console.log('🗺️ Geocoding:', { street: normalizedStreet, city: normalizedCity, cap });

  const fullAddress = `${normalizedStreet}, ${cap} ${normalizedCity}, italia`;
  let result = await nominatimSearch(fullAddress);
  if (result) {
    console.log('✅ Found with full address');
    result.accuracy = 'exact';
    return result;
  }

  const streetCity = `${normalizedStreet}, ${normalizedCity}, italia`;
  result = await nominatimSearch(streetCity);
  if (result) {
    console.log('✅ Found with street+city');
    result.accuracy = 'street';
    return result;
  }

  const cityOnly = `${normalizedCity}, italia`;
  result = await nominatimSearch(cityOnly);
  if (result) {
    console.log('✅ Found with city only');
    result.accuracy = 'city';
    return result;
  }

  const provinceFallback = PROVINCE_FALLBACKS[normalizedCity];
  if (provinceFallback) {
    console.log('⚠️ Using province fallback for:', normalizedCity);
    return {
      coordinates: provinceFallback,
      accuracy: 'province',
      displayName: normalizedCity
    };
  }

  console.error('❌ Geocoding failed for all attempts');
  return null;
}

export async function getRoute(
  origin: [number, number],
  destination: [number, number]
): Promise<{ distance: number; duration: number; geometry: [number, number][] } | null> {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${origin[1]},${origin[0]};${destination[1]},${destination[0]}?overview=full&geometries=geojson`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    
    const data = await res.json();
    
    if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      return {
        distance: route.distance / 1000,
        duration: route.duration / 60,
        geometry: route.geometry.coordinates.map((c: [number, number]) => [c[1], c[0]])
      };
    }
    return null;
  } catch (error) {
    console.error('Route calculation error:', error);
    return null;
  }
}
