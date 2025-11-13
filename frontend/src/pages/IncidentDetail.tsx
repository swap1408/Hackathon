import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { IncidentsAPI, type Incident } from '@/lib/api';

export default function IncidentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const num = id ? Number(id) : NaN;
  const [incident, setIncident] = useState<Incident | null>(null);
  const [timeline, setTimeline] = useState<Array<{ id: string; time: string; actor: string; text: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { void initialize(); /* eslint-disable-next-line */ }, [id]);

  const initialize = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const useNum = !Number.isNaN(num);
      const [inc, tl] = await Promise.all([
        useNum ? IncidentsAPI.get(num) : IncidentsAPI.getById(id),
        useNum ? IncidentsAPI.timeline(num) : IncidentsAPI.timelineById(id)
      ]);
      setIncident(inc);
      setTimeline(tl);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to load incident');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pb-20 bg-background">
      <header className="bg-primary text-primary-foreground p-6 shadow-lg">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-1">Incident</h1>
            <p className="text-primary-foreground/80">ID: {id}</p>
          </div>
          <Button variant="secondary" onClick={() => navigate(-1)}>Back</Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 space-y-4">
        <Card className="p-6">
          {loading || !incident ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : (
            <div className="space-y-2">
              <div className="font-semibold">{incident.title || incident.type}</div>
              <div className="text-sm text-muted-foreground">Type: {incident.type}</div>
              <div className="text-sm text-muted-foreground">Severity: {incident.severity}</div>
              <div className="text-sm text-muted-foreground">Status: {incident.status}</div>
              <div className="text-sm text-muted-foreground">ID: {incident.incidentNumber ?? incident.id}</div>
              {incident.location && <div className="text-sm text-muted-foreground">Location: {incident.location}</div>}
            </div>
          )}
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold mb-3">Timeline</h3>
          {timeline.length === 0 ? (
            <p className="text-muted-foreground">No events yet</p>
          ) : (
            <div className="space-y-2">
              {timeline.map(t => (
                <div key={t.id} className="p-3 bg-muted rounded">
                  <div className="text-xs text-muted-foreground">{new Date(t.time).toLocaleString()} • {t.actor}</div>
                  <div>{t.text}</div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}
