import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { BottomNav } from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { User as UserIcon, LogOut, FileText, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { IncidentsAPI, UsersAPI, type Incident, type Page } from '@/lib/api';

export default function Profile() {
  const { user, logout } = useAuth();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [operators, setOperators] = useState<Array<{ id: string; name: string; email: string; role: string }>>([]);
  const [opForm, setOpForm] = useState({ name: '', email: '', password: '' });
  const [saving, setSaving] = useState(false);
  const [statusEdit, setStatusEdit] = useState<Record<string, string>>({});
  const navigate = useNavigate();

  const STATUSES = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CANCELLED'];

  useEffect(() => {
    loadIncidents();
    if (user?.role === 'ADMIN') loadOperators();
  }, [user]);

  const loadIncidents = async () => {
    if (!user) return;
    try {
      const page: Page<Incident> = await IncidentsAPI.list({ page: 0, size: 5 });
      setIncidents(page.content || []);
    } catch (e) {
      // best-effort
    }
  };

  const loadOperators = async () => {
    try {
      const ops = await UsersAPI.listOperators();
      setOperators(ops);
    } catch (e) { /* ignore */ }
  };

  const createOperator = async () => {
    if (!opForm.name || !opForm.email || !opForm.password) {
      toast.error('Please fill name, email and password');
      return;
    }
    setSaving(true);
    try {
      await UsersAPI.createOperator(opForm);
      toast.success('Operator created');
      setOpForm({ name: '', email: '', password: '' });
      loadOperators();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to create operator');
    } finally {
      setSaving(false);
    }
  };

  const deleteOperator = async (id: string) => {
    setSaving(true);
    try {
      await UsersAPI.deleteOperator(id);
      toast.success('Operator deleted');
      loadOperators();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to delete operator');
    } finally {
      setSaving(false);
    }
  };

  const updateIncidentStatus = async (inc: Incident) => {
    const selected = statusEdit[inc.id];
    if (!selected) {
      toast.error('Select a status');
      return;
    }
    setSaving(true);
    try {
      if (inc.incidentNumber != null) {
        await IncidentsAPI.updateStatus(inc.incidentNumber, { status: selected });
      } else {
        await IncidentsAPI.updateStatusById(inc.id, { status: selected });
      }
      toast.success('Incident status updated');
      await loadIncidents();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to update status');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await logout();
    toast.success('Signed out successfully');
    navigate('/');
    // Ensure scroll goes to top on landing
    setTimeout(() => window.scrollTo({ top: 0, left: 0, behavior: 'auto' }), 0);
  };

  return (
    <div className="min-h-screen pb-20 bg-background">
      <header className="bg-primary text-primary-foreground p-6 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-1">Profile</h1>
          <p className="text-primary-foreground/80">Manage your account</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 space-y-4">
        {/* Profile Info */}
        <Card className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <UserIcon className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold">{user?.name || 'User'}</h2>
              <p className="text-muted-foreground">{user?.email}</p>
              {user?.role && (
                <p className="text-xs mt-1"><span className="px-2 py-0.5 rounded bg-muted">Role: {user.role}</span></p>
              )}
            </div>
          </div>
        </Card>

        {/* Admin: Manage Operators */}
        {user?.role === 'ADMIN' && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Manage Operators</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-4">
              <input className="border rounded px-3 py-2" placeholder="Name" value={opForm.name} onChange={e => setOpForm({ ...opForm, name: e.target.value })} />
              <input className="border rounded px-3 py-2" placeholder="Email" value={opForm.email} onChange={e => setOpForm({ ...opForm, email: e.target.value })} />
              <input className="border rounded px-3 py-2" type="password" placeholder="Password" value={opForm.password} onChange={e => setOpForm({ ...opForm, password: e.target.value })} />
            </div>
            <Button onClick={createOperator} disabled={saving}>Create Operator</Button>

            <div className="mt-6">
              {operators.length === 0 ? (
                <p className="text-muted-foreground">No operators yet.</p>
              ) : (
                <div className="space-y-2">
                  {operators.map(op => (
                    <div key={op.id} className="flex items-center justify-between p-3 bg-muted rounded">
                      <div>
                        <div className="font-medium">{op.name}</div>
                        <div className="text-xs text-muted-foreground">{op.email}</div>
                      </div>
                      <Button variant="destructive" size="sm" onClick={() => deleteOperator(op.id)} disabled={saving}>Delete</Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Recent Reports */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Recent Incidents
          </h3>
          {incidents.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No incidents yet</p>
          ) : (
            <div className="space-y-3">
              {incidents.map((i) => (
                <div key={i.id} className="p-3 bg-muted rounded-lg">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-medium cursor-pointer underline" onClick={() => {
                      if (user?.role === 'ADMIN') navigate(`/admin/incidents/${i.incidentNumber ?? i.id}`);
                      else navigate(`/incidents/${i.incidentNumber ?? i.id}`);
                    }}>{i.title || i.type}</span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      i.status?.toLowerCase() === 'resolved' 
                        ? 'bg-success/10 text-success' 
                        : 'bg-warning/10 text-warning'
                    }`}>
                      {i.status}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">ID: {i.incidentNumber ?? i.id}</p>

                  {user?.role === 'OPERATOR' && (
                    <div className="mt-2 flex items-center gap-2">
                      <select
                        className="border rounded px-2 py-1"
                        defaultValue={i.status}
                        onChange={(e) => setStatusEdit({ ...statusEdit, [i.id]: e.target.value })}
                      >
                        <option value="">Select status</option>
                        {STATUSES.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                      <Button size="sm" onClick={() => updateIncidentStatus(i)} disabled={saving}>Update</Button>
                      <Button size="sm" variant="outline" onClick={() => navigate(`/incidents/${i.incidentNumber ?? i.id}`)}>View</Button>
                    </div>
                  )}

                  {user?.role === 'ADMIN' && (
                    <div className="mt-2">
                      <Button size="sm" variant="outline" onClick={() => navigate(`/admin/incidents/${i.incidentNumber ?? i.id}`)}>View</Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Actions */}
        <div className="space-y-2">
          {user?.role === 'ADMIN' && (
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => navigate('/admin/incidents')}
            >
              <Settings className="h-5 w-5 mr-2" />
              Manage Incidents
            </Button>
          )}
          <Button 
            variant="destructive" 
            className="w-full justify-start"
            onClick={handleSignOut}
          >
            <LogOut className="h-5 w-5 mr-2" />
            Sign Out
          </Button>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
