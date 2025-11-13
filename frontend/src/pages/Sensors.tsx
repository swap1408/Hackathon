import { useEffect, useMemo, useState } from 'react';
import { SensorsAPI } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function SensorsPage() {
  const [sensors, setSensors] = useState<Array<{ id: string; type: string; label: string; zone?: string; lat?: number; lon?: number; status?: string; lastReportedAt?: string }>>([]);
  const [active, setActive] = useState<string | null>(null);
  const [series, setSeries] = useState<Array<{ time: string; data: any }>>([]);

  useEffect(() => { (async () => { try { setSensors(await SensorsAPI.list()); } catch {} })(); }, []);

  const statusColor = (s?: string) => s === 'online' ? 'text-green-600' : s === 'warning' ? 'text-amber-600' : 'text-muted-foreground';

  const timespan = useMemo(() => {
    const to = new Date();
    const from = new Date(to.getTime() - 3600 * 1000);
    return { from: from.toISOString(), to: to.toISOString() };
  }, []);

  const openSeries = async (id: string) => {
    setActive(id);
    try { const res = await SensorsAPI.timeseries(id, timespan); setSeries(res.map(r => ({ time: r.time, data: JSON.parse(r.data || '{}') }))); } catch {}
  };

  // Simple SVG line chart over a numeric field
  const renderChart = () => {
    if (series.length === 0) return <div className="text-sm text-muted-foreground">No data</div>;
    const values = series.map(s => Number(Object.values(s.data)[0] || 0));
    const max = Math.max(1, ...values);
    const pts = values.map((v, i) => `${(i/(values.length-1))*100},${100-(v/max)*100}`).join(' ');
    return (
      <svg viewBox="0 0 100 100" className="w-full h-32 bg-muted rounded">
        <polyline fill="none" stroke="#2563eb" strokeWidth="1" points={pts} />
      </svg>
    );
  };

  return (
    <div className="min-h-screen pb-20 bg-background">
      <header className="bg-primary text-primary-foreground p-6 shadow-lg">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-1">Sensors</h1>
            <p className="text-primary-foreground/80">Live status and timeseries</p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => history.back()}>Back</Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 space-y-3">
        {sensors.map(s => (
          <Card key={s.id} className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold">{s.label} <span className="text-xs text-muted-foreground">({s.type})</span></div>
                <div className={`text-sm ${statusColor(s.status)}`}>Status: {s.status || 'unknown'}</div>
                <div className="text-xs text-muted-foreground">Zone: {s.zone || '-'} • Last: {s.lastReportedAt ? new Date(s.lastReportedAt).toLocaleString() : '-'}</div>
              </div>
              <Button size="sm" onClick={() => openSeries(s.id)}>Timeseries</Button>
            </div>
            {active === s.id && (
              <div className="mt-3">
                {renderChart()}
              </div>
            )}
          </Card>
        ))}
      </main>
    </div>
  );
}