import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { IncidentsAPI, UsersAPI, type Incident, type Page } from '@/lib/api';

export default function AdminIncidents() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [operators, setOperators] = useState<Array<{ id: string; name: string; email: string; role: string }>>([]);
  const operatorMap = useMemo(() => Object.fromEntries(operators.map(o => [o.id, `${o.name} (${o.email})`])), [operators]);
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [assign, setAssign] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<{ status: string; severity: string; zone: string; from: string }>({ status: '', severity: '', zone: '', from: '' });

  useEffect(() => {
    if (user?.role !== 'ADMIN') {
      navigate('/profile');
      return;
    }
    void Promise.all([loadIncidents(0), loadOperators()]).finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadOperators = async () => {
    try {
      const ops = await UsersAPI.listOperators();
      setOperators(ops);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to load operators');
    }
  };

  const loadIncidents = async (p = page) => {
    try {
      const fromIso = filters.from ? new Date(filters.from).toISOString() : undefined;
      const res: Page<Incident> = await IncidentsAPI.list({ page: p, size, status: filters.status || undefined, severity: filters.severity || undefined, zone: filters.zone || undefined, from: fromIso });
      setIncidents(res.content || []);
      setTotalPages(res.totalPages || 0);
      setPage(res.number || p);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to load incidents');
    }
  };

  const doAssignIncident = async (inc: Incident) => {
    const key = String(inc.incidentNumber ?? inc.id);
    const op = assign[key];
    if (!op) { toast.error('Select operator'); return; }
    try {
      if (inc.incidentNumber != null) {
        await IncidentsAPI.assign(inc.incidentNumber, op);
      } else {
        await IncidentsAPI.assignById(inc.id, op);
      }
      toast.success('Assigned');
      await loadIncidents();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to assign');
    }
  };

  const operatorOptions = useMemo(() => (
    <>
      <option value="">Select operator</option>
      {operators.map(o => <option key={o.id} value={o.id}>{o.name} ({o.email})</option>)}
    </>
  ), [operators]);

  return (
    <div className="min-h-screen pb-20 bg-background">
      <header className="bg-primary text-primary-foreground p-6 shadow-lg">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-1">Admin - Incidents</h1>
            <p className="text-primary-foreground/80">Browse and assign incidents</p>
          </div>
          <Button variant="secondary" onClick={() => navigate('/profile')}>Back</Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 space-y-4">
        <Card className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-2 mb-4">
            <select className="border rounded px-2 py-1" value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })}>
              <option value="">Status</option>
              <option value="OPEN">OPEN</option>
              <option value="IN_PROGRESS">IN_PROGRESS</option>
              <option value="RESOLVED">RESOLVED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
            <select className="border rounded px-2 py-1" value={filters.severity} onChange={e => setFilters({ ...filters, severity: e.target.value })}>
              <option value="">Severity</option>
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH</option>
              <option value="CRITICAL">CRITICAL</option>
            </select>
            <input className="border rounded px-2 py-1" placeholder="Zone" value={filters.zone} onChange={e => setFilters({ ...filters, zone: e.target.value })} />
            <input className="border rounded px-2 py-1" type="datetime-local" value={filters.from} onChange={e => setFilters({ ...filters, from: e.target.value })} />
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { setFilters({ status: '', severity: '', zone: '', from: '' }); void loadIncidents(0); }}>Clear</Button>
              <Button onClick={() => void loadIncidents(0)}>Apply</Button>
            </div>
          </div>
          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : incidents.length === 0 ? (
            <p className="text-muted-foreground">No incidents</p>
          ) : (
            <div className="space-y-3">
              {incidents.map(i => (
                <div key={i.id} className="p-3 bg-muted rounded">
                  <div className="flex justify-between items-start mb-1">
                    <div>
                      <div className="font-medium cursor-pointer underline" onClick={() => navigate(`/admin/incidents/${i.incidentNumber ?? i.id}`)}>{i.title || i.type}</div>
                      <div className="text-xs text-muted-foreground">ID: {i.incidentNumber ?? i.id}</div>
                      <div className="text-xs text-muted-foreground">Assigned: {i.assignedTo ? (operatorMap[i.assignedTo] || i.assignedTo) : 'Unassigned'}</div>
                    </div>
                    <span className="text-xs px-2 py-1 rounded bg-secondary">{i.status}</span>
                  </div>
                  <div className="mt-2 flex flex-col md:flex-row gap-2 md:items-center">
                    <select className="border rounded px-2 py-1" defaultValue="" onChange={e => setAssign({ ...assign, [String(i.incidentNumber ?? i.id)]: e.target.value })}>
                      {operatorOptions}
                    </select>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => doAssignIncident(i)}>Assign</Button>
                      <Button size="sm" variant="outline" onClick={() => navigate(`/admin/incidents/${i.incidentNumber ?? i.id}`)}>View</Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center gap-2">
              <Button variant="outline" disabled={page <= 0} onClick={() => loadIncidents(page - 1)}>Prev</Button>
              <span className="text-sm">Page {page + 1} / {totalPages}</span>
              <Button variant="outline" disabled={page >= totalPages - 1} onClick={() => loadIncidents(page + 1)}>Next</Button>
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}
