import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { BottomNav } from '@/components/BottomNav';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Phone, MapPin, Clock, Hospital, Home, Pill, Users, Cpu } from 'lucide-react';

interface Service {
  id: string;
  name: string;
  category: string;
  address: string;
  phone: string;
  hours: string;
  is_24_7: boolean;
  lat?: number;
  lng?: number;
}

import { AiAPI, AlertsAPI, CityAssistRoutes, CityAssistOutage, CityAssistImage, CityAssistAlerts } from '@/lib/api';
import { hyderabadCoordFromId } from '@/lib/utils';

import { useAuth } from '@/contexts/AuthContext';

function RouteForm() {
  const [location, setLocation] = useState<string>('');
  const [timeOfDay, setTimeOfDay] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <input className="border rounded px-3 py-2" placeholder="Location (e.g., MG Road, Hyderabad)" value={location} onChange={e=>setLocation(e.target.value)} />
        <select className="border rounded px-3 py-2" value={timeOfDay} onChange={e=>setTimeOfDay(e.target.value)}>
          <option value="" disabled>Select time of day</option>
          <option value="morning">morning</option>
          <option value="afternoon">afternoon</option>
          <option value="evening">evening</option>
          <option value="night">night</option>
        </select>
      </div>
      <Button size="sm" disabled={loading || !location || !timeOfDay} onClick={async ()=>{
        if (!location || !timeOfDay) { toast.error('Please fill all fields'); return; }
        setLoading(true);
        try {
          const res = await CityAssistRoutes.predict({ location, time_of_day: timeOfDay });
          setResult(res);
        } catch (e:any) { toast.error(e?.message||'Failed to get route'); }
        finally { setLoading(false); }
      }}>Get Route</Button>
      {result && (() => {
        const p: any = result;
        const route = p.recommended_route || p.route || p.text;
        const eta = p.eta || p.eta_minutes || p.eta_min || p.eta_min || p.eta_time;
        const latency = p.meta?.latency;
        const model = p.meta?.model;
        const routeKey = (() => {
          const t = (route || '').toLowerCase();
          if (t.includes('necklace road')) return 'necklace_road';
          if (t.includes('begumpet')) return 'begumpet_avoid';
          if (t.includes('inner ring')) return 'inner_ring_road';
          return '';
        })();
        return (
          <div className="mt-3 p-3 rounded border space-y-2">
            <div className="text-sm text-muted-foreground">Recommendation</div>
            <div className="font-medium">{route || 'No route available'}</div>
            {eta && (
              <div className="text-sm"><span className="text-muted-foreground">ETA:</span> <span className="font-medium">{eta}</span></div>
            )}
            {(model || latency) && (
              <div className="text-xs text-muted-foreground">{model ? `Model: ${model}` : ''}{model && latency ? ' • ' : ''}{latency ? `Latency: ${latency}s` : ''}</div>
            )}
            {routeKey && (
              <div className="pt-1">
                <Button size="sm" variant="outline" onClick={() => (window.location.href = `/map?route=${routeKey}`)}>Show on Map</Button>
              </div>
            )}
            <details className="text-xs">
              <summary className="cursor-pointer text-muted-foreground">Raw</summary>
              <pre className="mt-2 p-3 bg-muted rounded overflow-auto">{JSON.stringify(result, null, 2)}</pre>
            </details>
          </div>
        );
      })()}
    </div>
  );
}

function AqiAdvisoryForm() {
  const [age, setAge] = useState<string>('');
  const [aqi, setAqi] = useState<string>('');
  const [health, setHealth] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <input className="border rounded px-3 py-2" placeholder="Age (years)" value={age} onChange={e=>setAge(e.target.value)} />
        <input className="border rounded px-3 py-2" placeholder="AQI (e.g., 120)" value={aqi} onChange={e=>setAqi(e.target.value)} />
        <select className="border rounded px-3 py-2" value={health} onChange={e=>setHealth(e.target.value)}>
          <option value="" disabled>Select health condition</option>
          <option value="none">none</option>
          <option value="asthma">asthma</option>
          <option value="elderly">elderly</option>
          <option value="heart">heart</option>
        </select>
      </div>
      <Button size="sm" disabled={loading || !age || !aqi || !health} onClick={async ()=>{
        if (!age || !aqi || !health) { toast.error('Please fill all fields'); return; }
        setLoading(true);
        try {
          const res = await CityAssistAlerts.predict({ age: Number(age), aqi: Number(aqi), health_flag: health });
          setResult(res);
        } catch (e:any) { toast.error(e?.message||'Failed to get advisory'); }
        finally { setLoading(false); }
      }}>Get Advisory</Button>
      {result && (() => {
        const p: any = result;
        const severityRaw = (p.severity || '').toString().toUpperCase();
        const message = p.alert_message || p.message || '';
        const color = severityRaw === 'HIGH' ? 'bg-red-600' : severityRaw === 'MODERATE' ? 'bg-amber-500' : 'bg-green-600';
        return (
          <div className="mt-3 p-3 rounded border space-y-2">
            <div className="flex items-center gap-2">
              <Badge className={`${color} text-white`}>Severity: {severityRaw || 'LOW'}</Badge>
            </div>
            <div className="text-sm text-foreground">{message || 'No advisory available'}</div>
            <details className="text-xs">
              <summary className="cursor-pointer text-muted-foreground">Raw</summary>
              <pre className="mt-2 p-3 bg-muted rounded overflow-auto">{JSON.stringify(result, null, 2)}</pre>
            </details>
          </div>
        );
      })()}
    </div>
  );
}

function OutageForm() {
  const [area, setArea] = useState<string>('');
  const [weather, setWeather] = useState<string>('');
  const [load, setLoad] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <input className="border rounded px-3 py-2" placeholder="Area or Ward (e.g., Ward 12)" value={area} onChange={e=>setArea(e.target.value)} />
        <select className="border rounded px-3 py-2" value={weather} onChange={e=>setWeather(e.target.value)}>
          <option value="" disabled>Select weather</option>
          <option value="clear">clear</option>
          <option value="rain">rain</option>
          <option value="storm">storm</option>
          <option value="heat">heat</option>
        </select>
        <select className="border rounded px-3 py-2" value={load} onChange={e=>setLoad(e.target.value)}>
          <option value="" disabled>Select grid load</option>
          <option value="low">low</option>
          <option value="medium">medium</option>
          <option value="high">high</option>
        </select>
      </div>
      <Button size="sm" disabled={loading || !area || !weather || !load} onClick={async ()=>{
        if (!area || !weather || !load) { toast.error('Please fill all fields'); return; }
        setLoading(true);
        try {
          const res = await CityAssistOutage.predict({ area, weather, load });
          setResult(res);
        } catch (e:any) { toast.error(e?.message||'Failed to predict outage ETA'); }
        finally { setLoading(false); }
      }}>Predict ETA</Button>
      {result && (() => {
        const p: any = result;
        const hours = p.eta_hours ?? p.eta ?? null;
        return (
          <div className="mt-3 p-3 rounded border space-y-2">
            <div className="text-sm text-muted-foreground">Estimated Restoration</div>
            <div className="text-2xl font-bold">{hours != null ? `${hours} hours` : 'N/A'}</div>
            {p.message && <div className="text-sm text-muted-foreground">{p.message}</div>}
            <details className="text-xs">
              <summary className="cursor-pointer text-muted-foreground">Raw</summary>
              <pre className="mt-2 p-3 bg-muted rounded overflow-auto">{JSON.stringify(result, null, 2)}</pre>
            </details>
          </div>
        );
      })()}
    </div>
  );
}

function ImageTriageForm() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  return (
    <div className="space-y-2">
      <input type="file" accept="image/*" onChange={e=>setFile(e.target.files?.[0] || null)} />
      <Button size="sm" disabled={loading || !file} onClick={async ()=>{
        if (!file) return; setLoading(true);
        try {
          const res = await CityAssistImage.classify(file);
          setResult(res);
        } catch (e:any) { toast.error(e?.message||'Image triage failed'); }
        finally { setLoading(false); }
      }}>Classify</Button>
      {result && (() => {
        const p: any = result;
        const label = (p.label || '').toString();
        const confidence = typeof p.confidence === 'number' ? p.confidence : undefined;
        const priority = (p.priority || '').toString();
        const color = priority === 'high' ? 'bg-red-600' : priority === 'medium' ? 'bg-amber-500' : 'bg-green-600';
        const pct = confidence != null ? Math.round((confidence > 1 ? Math.min(confidence, 100) : confidence*100)) : 0;
        return (
          <div className="mt-3 p-3 rounded border space-y-2">
            <div className="flex items-center gap-2">
              <Badge>{label || 'unknown'}</Badge>
              {priority && <Badge className={`${color} text-white`}>Priority: {priority}</Badge>}
            </div>
            {confidence != null && (
              <div>
                <div className="h-2 w-full bg-muted rounded">
                  <div className={`h-2 rounded ${color}`} style={{ width: `${Math.max(2, Math.min(100, pct))}%` }} />
                </div>
                <div className="text-xs text-muted-foreground mt-1">Confidence: {pct}%</div>
              </div>
            )}
            <details className="text-xs">
              <summary className="cursor-pointer text-muted-foreground">Raw</summary>
              <pre className="mt-2 p-3 bg-muted rounded overflow-auto">{JSON.stringify(result, null, 2)}</pre>
            </details>
          </div>
        );
      })()}
    </div>
  );
}

function AdminSendAlert({ prob, zone, label, onSent }: { prob: number; zone: string; label: string; onSent: () => void }) {
  const { user } = useAuth();
  if (user?.role !== 'ADMIN') return null;
  const severity = label === 'CRITICAL' || label === 'HIGH' ? 'critical' : label === 'MEDIUM' ? 'warning' : 'info';
  const title = 'Flood Risk Alert';
  const message = `Predicted flood risk ${Math.round(prob*100)}%${zone ? ` in ${zone}` : ''}. Take precautions.`;
  return (
    <div className="mt-3">
      <Button onClick={async () => {
        await AlertsAPI.create({ type: 'flood', title, message, severity, zone });
        onSent();
      }}>Send city-wide alert</Button>
    </div>
  );
}

import { toast } from 'sonner';

export default function Services() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  // AI state
  const [models, setModels] = useState<Array<{ name: string; version: string }>>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [aiLoading, setAiLoading] = useState(false);
  const [features, setFeatures] = useState({
    rainfall_mm: '',
    river_level_m: '',
    soil_moisture_percent: '',
    zone: '',
  });
  const [prediction, setPrediction] = useState<any>(null);

  useEffect(() => {
    loadServices();
  }, []);

  useEffect(() => {
    // Load AI models on mount; ensure we always show at least two local models
    (async () => {
      const defaults = [
        { name: 'flood-heuristic', version: '1.0.0' },
        { name: 'flood-logistic', version: '1.0.0' },
      ];
      try {
        const list = await AiAPI.getModels();
        const combined = [...defaults, ...(list || [])];
        const uniq = Array.from(new Map(combined.map(m => [`${m.name}:${m.version}`, m])).values());
        setModels(uniq);
      } catch {
        setModels(defaults);
      }
    })();
  }, []);

  const loadServices = async () => {
    const { data, error } = await supabase
      .from('local_services')
      .select('*')
      .order('name');

    if (!error) {
      setServices(data || []);
    }
    setLoading(false);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'hospital': return Hospital;
      case 'pharmacy': return Pill;
      case 'shelter': return Home;
      case 'community': return Users;
      default: return MapPin;
    }
  };

  const filteredServices = filter === 'all' 
    ? services 
    : services.filter(s => s.category === filter);

  const categories = [
    { id: 'all', label: 'All' },
    { id: 'hospital', label: 'Hospitals' },
    { id: 'pharmacy', label: 'Pharmacies' },
    { id: 'shelter', label: 'Shelters' },
    { id: 'community', label: 'Community' }
  ];

  return (
    <div className="min-h-screen pb-20 bg-background">
      <header className="bg-primary text-primary-foreground p-6 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-1">Local Services & City Ops</h1>
          <p className="text-primary-foreground/80">Find nearby community resources</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 space-y-4">
        {/* Filter Buttons */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map((cat) => (
            <Button
              key={cat.id}
              variant={filter === cat.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(cat.id)}
              className="whitespace-nowrap"
            >
              {cat.label}
            </Button>
          ))}
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Card className="p-4">
            <div className="font-semibold mb-2">City Map</div>
            <Button size="sm" onClick={() => (window.location.href = '/map')}>Open Map</Button>
          </Card>
          <Card className="p-4">
            <div className="font-semibold mb-2">CCTV</div>
            <Button size="sm" onClick={() => (window.location.href = '/cctv')}>Open CCTV</Button>
          </Card>
        </div>

        {/* AI Integration */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-2 flex items-center gap-2"><Cpu className="h-5 w-5"/>Flood Risk Prediction</h3>
          <div className="flex items-center gap-2 mb-3">
            <p className="text-sm text-muted-foreground flex-1">Enter features to get a prediction.</p>
            <select className="border rounded px-2 py-1" value={selectedModel} onChange={e => setSelectedModel(e.target.value)}>
              <option value="">Auto</option>
              {models.map(m => (
                <option key={`${m.name}:${m.version}`} value={`${m.name}:${m.version}`}>{m.name} v{m.version}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
            <input className="border rounded px-3 py-2" placeholder="Rainfall (mm)" value={features.rainfall_mm} onChange={e => setFeatures({ ...features, rainfall_mm: e.target.value })} />
            <input className="border rounded px-3 py-2" placeholder="River level (m)" value={features.river_level_m} onChange={e => setFeatures({ ...features, river_level_m: e.target.value })} />
            <input className="border rounded px-3 py-2" placeholder="Soil moisture (%)" value={features.soil_moisture_percent} onChange={e => setFeatures({ ...features, soil_moisture_percent: e.target.value })} />
            <input className="border rounded px-3 py-2" placeholder="Zone" value={features.zone} onChange={e => setFeatures({ ...features, zone: e.target.value })} />
          </div>
          <div className="mt-3">
            <Button disabled={aiLoading} onClick={async () => {
              setAiLoading(true);
              try {
                const payload: Record<string, any> = {
                  rainfall_mm: Number(features.rainfall_mm),
                  river_level_m: Number(features.river_level_m),
                  soil_moisture_percent: Number(features.soil_moisture_percent),
                  zone: features.zone,
                };
                const res = await AiAPI.predictFlood(payload, selectedModel || undefined);
                setPrediction(res);
              } catch (e) { setPrediction({ error: 'Failed to get prediction' }); }
              finally { setAiLoading(false); }
            }}>Predict</Button>
          </div>
          {prediction && (
            <div className="mt-4 space-y-3">
              {(() => {
                // Normalize various possible shapes from AI service
                const p: any = prediction || {};
                const rawProb = (typeof p.probability === 'number' ? p.probability
                              : typeof p.prob === 'number' ? p.prob
                              : typeof p.score === 'number' ? p.score
                              : typeof p.risk_score === 'number' ? p.risk_score
                              : undefined);
                const prob = rawProb != null ? (rawProb > 1 ? Math.min(rawProb/100, 1) : Math.max(Math.min(rawProb, 1), 0)) : undefined;
                const labelRaw = (p.label || p.risk || p.risk_level || p.severity || '').toString().toUpperCase();
                const label = labelRaw || (prob != null ? (prob >= 0.8 ? 'CRITICAL' : prob >= 0.6 ? 'HIGH' : prob >= 0.4 ? 'MEDIUM' : prob >= 0.2 ? 'LOW' : 'VERY_LOW') : 'UNKNOWN');
                const confidence = (typeof p.confidence === 'number' ? p.confidence : undefined);
                const model = p.model || p.model_name || undefined;
                const version = p.version || p.model_version || undefined;

                const pctStr = prob != null ? `${Math.round(prob*100)}%` : 'N/A';
                const confStr = confidence != null ? `${Math.round((confidence > 1 ? confidence/100 : confidence)*100)}%` : null;

                const color = label === 'CRITICAL' ? 'bg-red-600' : label === 'HIGH' ? 'bg-orange-500' : label === 'MEDIUM' ? 'bg-amber-500' : label === 'LOW' ? 'bg-green-600' : 'bg-green-500';
                const barPct = prob != null ? Math.max(2, Math.min(100, Math.round(prob*100))) : 0;

                const advice = (() => {
                  switch (label) {
                    case 'CRITICAL': return ['Issue immediate alerts', 'Evacuate low-lying areas', 'Deploy emergency response'];
                    case 'HIGH': return ['Notify operators', 'Prepare sandbags and pumps', 'Advise citizens to avoid flood-prone zones'];
                    case 'MEDIUM': return ['Monitor river levels', 'Pre-position resources', 'Share caution advisory'];
                    case 'LOW': return ['Routine monitoring'];
                    default: return ['Insufficient data — collect more sensor readings'];
                  }
                })();

                return (
                  <div className="p-4 rounded border">
                    <div className="flex flex-wrap items-center gap-3">
                      <Badge className={`${color} text-white`}>Risk: {label}</Badge>
                      <span className="text-sm text-muted-foreground">Probability: <span className="font-medium text-foreground">{pctStr}</span></span>
                      {confStr && (<span className="text-sm text-muted-foreground">Confidence: <span className="font-medium text-foreground">{confStr}</span></span>)}
                      {(model || version) && (
                        <span className="text-sm text-muted-foreground">Model: <span className="font-medium text-foreground">{model || 'unknown'}{version ? ` v${version}` : ''}</span></span>
                      )}
                    </div>
                    {prob != null && (
                      <div className="mt-3">
                        <div className="h-2 w-full bg-muted rounded">
                          <div className={`h-2 rounded ${color}`} style={{ width: `${barPct}%` }} />
                        </div>
                      </div>
                    )}
                    {advice.length > 0 && (
                      <div className="mt-3">
                        <div className="text-sm font-medium mb-1">Recommended actions</div>
                        <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                          {advice.map((a, idx) => (<li key={idx}>{a}</li>))}
                        </ul>
                      </div>
                    )}

                    {/* Admin-only Send Alert when prob > 50% */}
                    {prob != null && prob >= 0.5 && (
                      <AdminSendAlert
                        prob={prob}
                        zone={features.zone}
                        label={label}
                        onSent={() => toast.success('Alert sent to all users')}
                      />
                    )}

                    <details className="mt-3 text-xs">
                      <summary className="cursor-pointer text-muted-foreground">View raw response</summary>
                      <pre className="mt-2 p-3 bg-muted rounded overflow-auto">{JSON.stringify(prediction, null, 2)}</pre>
                    </details>
                  </div>
                );
              })()}
            </div>
          )}
        </Card>

        {/* CityAssist Python Services */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Route Recommendation */}
          <Card className="p-6 space-y-3">
            <h3 className="text-lg font-semibold">Route Recommendation</h3>
            <RouteForm />
          </Card>

          {/* Air Quality Advisory */}
          <Card className="p-6 space-y-3">
            <h3 className="text-lg font-semibold">Air Quality Advisory</h3>
            <AqiAdvisoryForm />
          </Card>

          {/* Outage ETA */}
          <Card className="p-6 space-y-3">
            <h3 className="text-lg font-semibold">Outage ETA Prediction</h3>
            <OutageForm />
          </Card>

          {/* Image Triage */}
          <Card className="p-6 space-y-3">
            <h3 className="text-lg font-semibold">Image Triage</h3>
            <ImageTriageForm />
          </Card>
        </div>

        {/* Services List */}
        {loading ? (
          <Card className="p-6 text-center">
            <p className="text-muted-foreground">Loading services...</p>
          </Card>
        ) : filteredServices.length === 0 ? (
          <Card className="p-6 text-center">
            <p className="text-muted-foreground">No services found in this category</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredServices.map((service) => {
              const Icon = getCategoryIcon(service.category);
              return (
                <Card key={service.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">{service.name}</h3>
                        {service.is_24_7 && (
                          <Badge className="bg-success text-success-foreground">24/7</Badge>
                        )}
                      </div>
                      
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span>{service.address}</span>
                        </div>
                        
                        {service.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            <a 
                              href={`tel:${service.phone}`}
                              className="text-primary hover:underline"
                            >
                              {service.phone}
                            </a>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>{service.hours}</span>
                        </div>
                      </div>

                      <div className="flex gap-2 mt-4">
                        <Button 
                          size="sm" 
                          variant="default"
                          onClick={() => window.open(`tel:${service.phone}`)}
                        >
                          <Phone className="h-4 w-4 mr-1" />
                          Call
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            // Deterministically map each service to a point within Hyderabad bbox
                            const hashToUnit = (id: string, salt = 0) => {
                              let h = 2166136261 ^ salt;
                              for (let i = 0; i < id.length; i++) { h ^= id.charCodeAt(i); h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24); }
                              return ((h >>> 0) % 100000) / 100000;
                            };
                            const r1 = hashToUnit(service.id, 1);
                            const r2 = hashToUnit(service.id, 2);
                            // Prefer provided coordinates; otherwise Hyderabad fallback (shared util)
                            const { lat: fLat, lng: fLng } = hyderabadCoordFromId(service.id);
                            const lat = typeof service.lat === 'number' ? service.lat : fLat;
                            const lng = typeof service.lng === 'number' ? service.lng : fLng
                            const label = encodeURIComponent(service.name);
                            const cat = encodeURIComponent(service.category || '');
                            const addr = encodeURIComponent(service.address || '');
                            window.location.href = `/map?dest=${lat.toFixed(5)},${lng.toFixed(5)}&label=${label}&cat=${cat}&addr=${addr}`;
                          }}
                        >
                          <MapPin className="h-4 w-4 mr-1" />
                          Directions
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
