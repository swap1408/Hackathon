import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { IncidentsAPI, UsersAPI, type Incident } from '@/lib/api';

function AdminSeverityEditor({ id, num, current, onUpdated }: { id: string; num: number; current: string; onUpdated: () => Promise<void> | void }) {
  const [severity, setSeverity] = useState<string>(current);
  const [note, setNote] = useState<string>('');
  const SEVERITIES = ['LOW','MEDIUM','HIGH','CRITICAL'];
  const doUpdate = async () => {
    if (!severity) { toast.error('Select severity'); return; }
    try {
      if (!Number.isNaN(num)) await IncidentsAPI.updateSeverity(num, { severity, text: note || undefined });
      else await IncidentsAPI.updateSeverityById(id, { severity, text: note || undefined });
      toast.success('Severity updated');
      setNote('');
      await onUpdated();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to update severity');
    }
  };
  return (
    <div className="flex flex-col gap-2">
      <select className="border rounded px-2 py-1" value={severity} onChange={e => setSeverity(e.target.value)}>
        <option value="">Select severity</option>
        {SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
      </select>
      <textarea className="border rounded px-3 py-2" placeholder="Optional note" value={note} onChange={e => setNote(e.target.value)} />
      <div>
        <Button onClick={doUpdate}>Update Severity</Button>
      </div>
    </div>
  );
}

export default function AdminIncidentDetail() {
  const { id } = useParams<{ id: string }>();
  const num = id ? Number(id) : NaN;
  const { user } = useAuth();
  const navigate = useNavigate();
  const [incident, setIncident] = useState<Incident | null>(null);
  const [timeline, setTimeline] = useState<Array<{ id: string; time: string; actor: string; text: string }>>([]);
  const [operators, setOperators] = useState<Array<{ id: string; name: string; email: string; role: string }>>([]);
  const [assign, setAssign] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const STATUSES = useMemo(() => ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CANCELLED'], []);

  useEffect(() => {
    if (user?.role !== 'ADMIN') { navigate('/profile'); return; }
    void initialize();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, id]);

  const initialize = async () => {
    if (!id) { return; }
    setLoading(true);
    try {
      const useNum = !Number.isNaN(num);
      const [inc, ops, tl] = await Promise.all([
        useNum ? IncidentsAPI.get(num) : IncidentsAPI.getById(id),
        UsersAPI.listOperators(),
        useNum ? IncidentsAPI.timeline(num) : IncidentsAPI.timelineById(id)
      ]);
      setIncident(inc);
      setStatus(inc.status);
      setOperators(ops);
      setTimeline(tl);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to load incident');
    } finally {
      setLoading(false);
    }
  };

  const doAssign = async () => {
    if (!id || !assign) { toast.error('Select operator'); return; }
    try {
      if (!Number.isNaN(num)) await IncidentsAPI.assign(num, assign);
      else await IncidentsAPI.assignById(id, assign);
      toast.success('Assigned');
      await refresh();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to assign');
    }
  };

  const doUpdateStatus = async () => {
    if (!id || !status) { toast.error('Select status'); return; }
    try {
      if (!Number.isNaN(num)) await IncidentsAPI.updateStatus(num, { status, text: note || undefined });
      else await IncidentsAPI.updateStatusById(id, { status, text: note || undefined });
      toast.success('Status updated');
      setNote('');
      await refresh();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to update status');
    }
  };

  const addNote = async () => {
    if (!id || !note) { toast.error('Write a note'); return; }
    try {
      if (!Number.isNaN(num)) await IncidentsAPI.addTimeline(num, { actor: 'admin', text: note });
      else await IncidentsAPI.addTimelineById(id, { actor: 'admin', text: note });
      setNote('');
      await refresh();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to add note');
    }
  };

  const refresh = async () => {
    if (!id) return;
    try {
      const useNum = !Number.isNaN(num);
      const [inc, tl] = await Promise.all([
        useNum ? IncidentsAPI.get(num) : IncidentsAPI.getById(id),
        useNum ? IncidentsAPI.timeline(num) : IncidentsAPI.timelineById(id)
      ]);
      setIncident(inc);
      setTimeline(tl);
    } catch { /* ignore */ }
  };

  return (
    <div className="min-h-screen pb-20 bg-background">
      <header className="bg-primary text-primary-foreground p-6 shadow-lg">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-1">Incident Detail</h1>
              <p className="text-primary-foreground/80">ID: {id}</p>
            </div>
            <Button variant="secondary" onClick={() => navigate('/admin/incidents')}>Back</Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 space-y-4">
        <Card className="p-6">
          {loading || !incident ? (
            <p className="text-muted-foreground">Loading...</p>) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="font-semibold">{incident.title || incident.type}</div>
                <span className="text-xs px-2 py-1 rounded bg-secondary">{incident.status}</span>
              </div>
              <div className="text-sm text-muted-foreground">Type: {incident.type}</div>
              <div className="text-sm text-muted-foreground">Severity: {incident.severity}</div>
              <div className="text-sm text-muted-foreground">ID: {incident.incidentNumber ?? incident.id}</div>
              {incident.location && <div className="text-sm text-muted-foreground">Location: {incident.location}</div>}
            </div>
          )}
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-6">
            <h3 className="font-semibold mb-3">Assign Operator</h3>
            <div className="text-sm text-muted-foreground mb-2">Currently assigned: {incident?.assignedTo ? (operators.find(o => o.id === incident.assignedTo)?.name + ' (' + (operators.find(o => o.id === incident.assignedTo)?.email || '') + ')' ) : 'Unassigned'}</div>
            <div className="flex gap-2 items-center">
              <select className="border rounded px-2 py-1" defaultValue="" onChange={e => setAssign(e.target.value)}>
                <option value="">Select operator</option>
                {operators.map(o => <option key={o.id} value={o.id}>{o.name} ({o.email})</option>)}
              </select>
              <Button onClick={doAssign}>Assign</Button>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold mb-3">Update Status</h3>
            <div className="flex flex-col gap-2">
              <select className="border rounded px-2 py-1" value={status} onChange={e => setStatus(e.target.value)}>
                <option value="">Select status</option>
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <textarea className="border rounded px-3 py-2" placeholder="Optional note" value={note} onChange={e => setNote(e.target.value)} />
              <div className="flex gap-2">
                <Button onClick={doUpdateStatus}>Update</Button>
                <Button variant="outline" onClick={addNote}>Add Note</Button>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <h3 className="font-semibold mb-3">Update Severity</h3>
            <AdminSeverityEditor id={id!} num={num} current={incident?.severity || ''} onUpdated={refresh} />
          </Card>
        </div>

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
