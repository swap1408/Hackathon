import { useEffect, useMemo, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { IncidentsAPI, SensorsAPI, type Incident, AqiAPI, type CityAQI } from '@/lib/api';
import { supabase } from '@/integrations/supabase/client';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, CircleMarker, Polyline, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import Supercluster from 'supercluster';
import { hyderabadCoordFromId } from '@/lib/utils';
import { useNavigate, useLocation } from 'react-router-dom';
// Fix default marker assets in Vite
// @ts-ignore
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
// @ts-ignore
import markerIcon from 'leaflet/dist/images/marker-icon.png';
// @ts-ignore
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

export default function MapPage() {
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const mapRef = useRef<L.Map | null>(null);
  const [sensors, setSensors] = useState<Array<{ id: string; type: string; label: string; lat?: number; lon?: number; status?: string }>>([]);
  const [services, setServices] = useState<Array<{ id: string; name: string; category: string; lat: number; lng: number }>>([]);
  const [showIncidents, setShowIncidents] = useState(true);
  const [showServices, setShowServices] = useState(true);
  const [layers, setLayers] = useState({ aqi: true });
  const [routeCoords, setRouteCoords] = useState<Array<[number, number]>>([]);
  const [dest, setDest] = useState<{ lat: number; lng: number; label?: string; cat?: string; addr?: string } | null>(null);
  const [selected, setSelected] = useState<Incident | null>(null);
  const [aqiData, setAqiData] = useState<CityAQI[] | null>(null);

  // Optional: render a suggested route based on query param
  const locationHook = useLocation();
  useEffect(() => {
    const params = new URLSearchParams(locationHook.search);
    // Suggested route key
    const key = params.get('route');
    if (!key) { setRouteCoords([]); }
    const routes: Record<string, Array<[number, number]>> = {
      necklace_road: [
        [17.423, 78.473], [17.427, 78.476], [17.432, 78.480], [17.437, 78.479], [17.439, 78.474], [17.436, 78.470], [17.430, 78.468]
      ],
      begumpet_avoid: [
        [17.437, 78.467], [17.448, 78.460], [17.457, 78.480], [17.442, 78.489]
      ],
      inner_ring_road: [
        [17.370, 78.450], [17.400, 78.500], [17.440, 78.540], [17.470, 78.500], [17.450, 78.450]
      ],
    };
    setRouteCoords(key ? (routes[key] || []) : []);

    // Destination point (from Services page)
    const destParam = params.get('dest');
    const label = params.get('label') || undefined;
    const cat = params.get('cat') || undefined;
    const addr = params.get('addr') || undefined;
    if (destParam) {
      const m = destParam.split(',');
      const lat = parseFloat(m[0]);
      const lng = parseFloat(m[1]);
      if (!isNaN(lat) && !isNaN(lng)) setDest({ lat, lng, label, cat, addr }); else setDest(null);
    } else {
      setDest(null);
    }
  }, [locationHook.search]);

  // Fit map to route when set
  function FitRoute({ coords }: { coords: Array<[number, number]> }) {
    const map = useMap();
    useEffect(() => {
      if (coords && coords.length > 1) {
        const bounds = L.latLngBounds(coords.map(c => L.latLng(c[0], c[1])));
        map.fitBounds(bounds.pad(0.2));
      }
    }, [coords, map]);
    return null;
  }

  function DestinationMarker({ point }: { point: { lat: number; lng: number; label?: string; cat?: string; addr?: string } }) {
    const map = useMap();
    useEffect(() => {
      // Pan to destination but preserve current zoom so user can zoom out freely
      map.panTo([point.lat, point.lng], { animate: true });
    }, [point, map]);
    const emoji = (() => {
      const c = (point.cat || '').toLowerCase();
      if (c === 'hospital') return '🏥';
      if (c === 'pharmacy') return '💊';
      if (c === 'shelter') return '🏠';
      if (c === 'community') return '👥';
      return '📍';
    })();
    return (
      <>
        <Marker position={[point.lat, point.lng]}>
          <Popup>
            <div style={{ minWidth: 180 }}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>{emoji} {point.label || 'Destination'}</div>
              {point.addr && (
                <div style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>{point.addr}</div>
              )}
            </div>
          </Popup>
        </Marker>
        <CircleMarker center={[point.lat, point.lng]} radius={10} pathOptions={{ color: '#2563eb', fillColor: '#2563eb', fillOpacity: 0.25 }} />
      </>
    );
  }

  // India center
  const initialCenter: [number, number] = [21.1458, 79.0882];
  const initialZoom = 4;

  // Deterministic pseudo-random generator from a string id
  function hashToUnit(id: string, salt = 0) {
    let h = 2166136261 ^ salt;
    for (let i = 0; i < id.length; i++) { h ^= id.charCodeAt(i); h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24); }
    // convert to 0..1
    return ((h >>> 0) % 100000) / 100000;
  }

  useEffect(() => {
    (async () => {
      try {
        const page = await IncidentsAPI.list({ page: 0, size: 500 });
        setIncidents(page.content || []);
      } catch {}
      try {
        const ss = await SensorsAPI.list();
        setSensors(ss || []);
      } catch {}
      try {
        // Services from DB; if none, fallback to local demo
        const { data } = await supabase.from('local_services').select('id,name,type,lat,lng');
        let mapped = (data || []).map((d: any) => {
          // Use provided lat/lng if available; otherwise deterministic Hyderabad fallback
          const hasCoords = typeof d.lat === 'number' && typeof d.lng === 'number';
          const { lat: utilLat, lng: utilLng } = hyderabadCoordFromId(d.id);
          const lat = hasCoords ? d.lat : utilLat;
          const lng = hasCoords ? d.lng : utilLng;
          return { id: d.id, name: d.name, category: d.type || d.category || 'community', lat, lng };
        });
        if (!mapped.length) {
          const samples = [
            { id: 'svc-1', name: 'Aarogya Hospital', category: 'hospital' },
            { id: 'svc-2', name: 'City Care Hospital', category: 'hospital' },
            { id: 'svc-3', name: 'MedPlus Pharmacy', category: 'pharmacy' },
            { id: 'svc-4', name: 'HealthKart Pharmacy', category: 'pharmacy' },
            { id: 'svc-5', name: 'Shelter - Kukatpally', category: 'shelter' },
            { id: 'svc-6', name: 'Shelter - Secunderabad', category: 'shelter' },
            { id: 'svc-7', name: 'Community Center - Begumpet', category: 'community' },
            { id: 'svc-8', name: 'Community Hall - Hitec', category: 'community' },
          ];
          mapped = samples.map((s) => {
            const { lat, lng } = hyderabadCoordFromId(s.id);
            return { ...s, lat, lng } as any;
          });
        }
        setServices(mapped);
      } catch { setServices([]); }
    })();
  }, []);
  type PointFeature = GeoJSON.Feature<GeoJSON.Point, any>;
  const clusterRef = useRef<{ incidents: Supercluster; sensors: Supercluster; services: Supercluster } | null>(null);
  const [bounds, setBounds] = useState<[number, number, number, number] | null>(null);
  const [zoom, setZoom] = useState(initialZoom);

  const incidentFeatures: PointFeature[] = useMemo(() => (incidents
    .filter(i => !!(i as any).location)
    .map((i, idx) => {
      // Try to parse lat/lon from data/location if present; fallback random demo in India bbox
      let lat = 23 + (idx % 10) * 0.5; let lon = 77 + (idx % 10) * 0.5;
      return { type: 'Feature', geometry: { type: 'Point', coordinates: [lon, lat] }, properties: { type: 'incident', id: i.id, severity: i.severity, ref: i } } as PointFeature;
    })), [incidents]);

  const sensorFeatures: PointFeature[] = useMemo(() => (sensors
    .filter(s => typeof s.lat === 'number' && typeof s.lon === 'number')
    .map(s => ({ type: 'Feature', geometry: { type: 'Point', coordinates: [s.lon as number, s.lat as number] }, properties: { type: 'sensor', id: s.id, status: s.status, label: s.label } } as PointFeature))), [sensors]);

  const serviceFeatures: PointFeature[] = useMemo(() => (services
    .map(s => ({ type: 'Feature', geometry: { type: 'Point', coordinates: [s.lng, s.lat] }, properties: { type: s.category, name: s.name } } as PointFeature))), [services]);

  useEffect(() => {
    const make = (features: PointFeature[]) => new Supercluster({ radius: 60, maxZoom: 17 }).load(features);
    clusterRef.current = {
      incidents: make(incidentFeatures),
      sensors: make(sensorFeatures),
      services: make(serviceFeatures),
    };
  }, [incidentFeatures, sensorFeatures, serviceFeatures]);

  useEffect(() => {
    if (layers.aqi && !aqiData) {
      (async () => {
        const data = await AqiAPI.getBulk();
        setAqiData(data);
      })();
    }
  }, [layers.aqi, aqiData]);

  function BoundsTracker() {
    useMapEvents({
      moveend(e) {
        const m = e.target;
        const b = m.getBounds();
        setBounds([b.getWest(), b.getSouth(), b.getEast(), b.getNorth()]);
        setZoom(m.getZoom());
      },
      zoomend(e) {
        const m = e.target; setZoom(m.getZoom());
      }
    });
    return null;
  }

  const getClusters = (key: 'incidents'|'sensors'|'services') => {
    if (!bounds || !clusterRef.current) return [];
    const res = clusterRef.current[key].getClusters(bounds, Math.round(zoom));
    return res;
  };

  const renderCluster = (cl: any, color: string, onClick?: () => void) => {
    const [lon, lat] = cl.geometry.coordinates;
    const count = cl.properties.point_count;
    if (count) {
      const html = `<div style="background:${color};color:white;border-radius:9999px;padding:6px 8px;font-size:12px;font-weight:600;box-shadow:0 1px 4px rgba(0,0,0,0.3)">${count}</div>`;
      const icon = L.divIcon({ html, className: '' });
      return <Marker key={`c-${lat}-${lon}-${count}`} position={[lat, lon]} icon={icon} eventHandlers={{ click: onClick || (()=>{}) }} />;
    }
    return <CircleMarker key={`p-${lat}-${lon}-${Math.random()}`} center={[lat, lon]} radius={6} pathOptions={{ color }} />;
  };

  return (
    <div className="min-h-screen pb-20 bg-background">
      <header className="bg-primary text-primary-foreground p-6 shadow-lg">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-1">City Map</h1>
            <p className="text-primary-foreground/80">Leaflet map with clustering</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => navigate('/services')}>Back to Services</Button>
            <Button variant="secondary" size="sm" onClick={() => navigate(-1)}>Back</Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 space-y-4">
        <Card className="p-4 flex flex-wrap gap-3 items-center">
          <label className="flex items-center gap-2"><input type="checkbox" checked={showIncidents} onChange={e => setShowIncidents(e.target.checked)} />Incidents</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={layers.aqi} onChange={e => setLayers({ ...layers, aqi: e.target.checked })} />AQI</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={showServices} onChange={e => setShowServices(e.target.checked)} />Services</label>
        </Card>

        <Card className="p-0 overflow-hidden">
          <MapContainer center={initialCenter} zoom={initialZoom} whenCreated={(m) => { mapRef.current = m; }} style={{ height: 520 }}>
            <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {/* Optionally overlay traffic/AQI tiles here if you have providers */}
            <BoundsTracker />
            {/* Suggested route overlay (if any) */}
            {routeCoords && routeCoords.length > 1 && (
              <>
                <FitRoute coords={routeCoords} />
                <Polyline positions={routeCoords as any} pathOptions={{ color: '#7c3aed', weight: 5, opacity: 0.8 }} />
              </>
            )}
            {/* Destination marker (from Services) */}
            {dest && <DestinationMarker point={dest} />}
            {/* Render clusters per layer */}
            {showIncidents && getClusters('incidents').map((cl: any) => renderCluster(cl, '#dc2626', () => {
              if (!cl.properties.point_count && cl.properties && cl.properties.ref) setSelected(cl.properties.ref as Incident);
            }))}
            {/* Municipal services (emoji markers) */}
            {showServices && services.map(s => {
              const cat = (s.category || '').toLowerCase();
              const emoji = cat === 'hospital' ? '🏥' : cat === 'pharmacy' ? '💊' : cat === 'shelter' ? '🏠' : cat === 'community' ? '👥' : '📍';
              const color = cat === 'hospital' ? '#ef4444' : cat === 'pharmacy' ? '#22c55e' : cat === 'shelter' ? '#2563eb' : cat === 'community' ? '#9333ea' : '#0ea5e9';
              const icon = L.divIcon({ html: `<div style=\"background:${color};color:white;border-radius:6px;padding:2px 6px;font-size:12px;box-shadow:0 1px 3px rgba(0,0,0,.3)\">${emoji} ${s.name}</div>`, className: '' });
              return <Marker key={`svc-${s.id}`} position={[s.lat, s.lng]} icon={icon} />;
            })}
            {/* AQI overlay */}
            {layers.aqi && aqiData && (
              <>
                {aqiData.map((d) => {
                  const coords: Record<string, [number, number]> = {
                    Mumbai: [19.0760, 72.8777],
                    Pune: [18.5204, 73.8567],
                    Hyderabad: [17.3850, 78.4867],
                    Delhi: [28.6139, 77.2090],
                    Kolkata: [22.5726, 88.3639],
                  };
                  const [lat, lon] = coords[d.city] || [21.1458, 79.0882];
                  const color = d.category === 'Good' ? '#16a34a' :
                    d.category === 'Satisfactory' ? '#22c55e' :
                    d.category === 'Moderate' ? '#eab308' :
                    d.category === 'Poor' ? '#f97316' :
                    d.category === 'Very Poor' ? '#dc2626' : '#7c3aed';
                  const icon = L.divIcon({ html: `<div style=\"background:${color};color:white;border-radius:6px;padding:2px 6px;font-size:12px;box-shadow:0 1px 3px rgba(0,0,0,.3)\">${d.city}: ${d.aqi}</div>`, className: '' });
                  return (
                    <>
                      <CircleMarker key={`aqi-c-${d.city}`} center={[lat, lon]} radius={10} pathOptions={{ color, fillColor: color, fillOpacity: 0.35 }} />
                      <Marker key={`aqi-m-${d.city}`} position={[lat, lon]} icon={icon} />
                    </>
                  );
                })}
              </>
            )}
          </MapContainer>
        </Card>

        {selected && (
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold">{selected.title || selected.type}</div>
                <div className="text-sm text-muted-foreground">Status: {selected.status} • Severity: {selected.severity}</div>
              </div>
              <Button size="sm" onClick={() => setSelected(null)}>Close</Button>
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}
