import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AlertsAPI } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { BottomNav } from '@/components/BottomNav';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { toast } from 'sonner';

interface Alert {
  id: string;
  type: string;
  title: string;
  message: string;
  severity: string;
  zone: string;
  is_read: boolean;
  created_at: string;
}

export default function Notifications() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAlerts();
  }, [user]);

  const loadAlerts = async () => {
    if (!user) return;

    try {
      const backend = await AlertsAPI.list({ page: 0, size: 50 });
      const backendAlerts = (backend.content || []).map((a: any) => ({
        id: a.id,
        user_id: user.id,
        type: a.type,
        title: a.title,
        message: a.message,
        severity: a.severity,
        zone: a.zone || '',
        is_read: false,
        created_at: a.createdAt || a.created_at || new Date().toISOString(),
        origin: 'backend' as const,
      }));

      const { data, error } = await supabase
        .from('alerts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        setAlerts(backendAlerts);
      } else {
        setAlerts([...(data || []), ...backendAlerts].sort((a,b) => (new Date(b.created_at).getTime() - new Date(a.created_at).getTime())));
      }
    } catch {
      const { data } = await supabase
        .from('alerts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setAlerts(data || []);
    }
    setLoading(false);
  };

  const markAsRead = async (alertId: string) => {
    const a = alerts.find(x => x.id === alertId);
    if (!a) return;
    if ((a as any).origin === 'backend') {
      try { await AlertsAPI.read(alertId); } catch {}
      // Remove backend alert from view immediately
      setAlerts(alerts.filter(x => x.id !== alertId));
      return;
    }
    await supabase
      .from('alerts')
      .update({ is_read: true })
      .eq('id', alertId);
    setAlerts(alerts.map(x => x.id === alertId ? { ...x, is_read: true } : x));
  };

  const markAllAsRead = async () => {
    if (!user) return;

    await supabase
      .from('alerts')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);
    
    setAlerts(alerts.map(a => ({ ...a, is_read: true })));
    toast.success('All notifications marked as read');
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return AlertCircle;
      case 'warning': return AlertCircle;
      default: return Info;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'warning': return 'warning';
      default: return 'info';
    }
  };

  const unreadCount = alerts.filter(a => !a.is_read).length;

  return (
    <div className="min-h-screen pb-20 bg-background">
      <header className="bg-primary text-primary-foreground p-6 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-1">Notifications</h1>
              <p className="text-primary-foreground/80">
                {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
              </p>
            </div>
            {unreadCount > 0 && (
              <Button 
                variant="secondary" 
                size="sm"
                onClick={markAllAsRead}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Mark all read
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 space-y-3">
        {loading ? (
          <Card className="p-6 text-center">
            <p className="text-muted-foreground">Loading notifications...</p>
          </Card>
        ) : alerts.length === 0 ? (
          <Card className="p-12 text-center">
            <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No notifications yet</h3>
            <p className="text-muted-foreground">
              We'll notify you about important updates and alerts
            </p>
          </Card>
        ) : (
          alerts.map((alert) => {
            const Icon = getSeverityIcon(alert.severity);
            return (
              <Card 
                key={alert.id} 
                className={`p-4 ${!alert.is_read ? 'border-l-4 border-l-primary bg-primary/5' : ''}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${
                    alert.severity === 'critical' 
                      ? 'bg-destructive/10' 
                      : alert.severity === 'warning'
                      ? 'bg-warning/10'
                      : 'bg-info/10'
                  }`}>
                    <Icon className={`h-5 w-5 ${
                      alert.severity === 'critical'
                        ? 'text-destructive'
                        : alert.severity === 'warning'
                        ? 'text-warning'
                        : 'text-info'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{alert.title}</h3>
                      <Badge variant={getSeverityColor(alert.severity) as any}>
                        {alert.severity}
                      </Badge>
                      {!alert.is_read && (
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{alert.message}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {new Date(alert.created_at).toLocaleString()}
                      </span>
                      {!alert.is_read && (
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => markAsRead(alert.id)}
                        >
                          Mark as read
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </main>

      <BottomNav />
    </div>
  );
}
