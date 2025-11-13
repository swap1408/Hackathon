import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

// Signup form state
  const [name, setName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupError, setSignupError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      loginSchema.parse({ email, password });
      setLoading(true);

      await login(email, password);
      toast.success('Welcome back!');
      navigate('/home');
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else if (error instanceof Error) {
        toast.error(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSignupError(null);
      signupSchema.parse({ name, email: signupEmail, password: signupPassword });
      setLoading(true);
      await register(name, signupEmail, signupPassword);
      toast.success('Account created successfully!');
      navigate('/home');
    } catch (error) {
      let msg = 'Signup failed';
      if (error instanceof z.ZodError) {
        msg = error.errors[0].message;
      } else if (error instanceof Error) {
        msg = error.message || msg;
      }
      console.error('Signup error:', error);
      setSignupError(msg);
      toast.error(msg || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

const [apiStatus, setApiStatus] = useState<'checking' | 'ok' | 'down'>('checking');

// Check API connectivity once when opening auth page
useEffect(() => {
  (async () => {
    try {
      await (await import('@/lib/api')).AuthAPI.ping();
      setApiStatus('ok');
    } catch (e) {
      console.error('API connectivity check failed:', e);
      setApiStatus('down');
    }
  })();
}, []);

return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 via-background to-info/5">
      <Card className="w-full max-w-md p-6 shadow-xl">
        {apiStatus === 'down' && (
          <div className="mb-4 p-3 rounded-md border border-warning/50 bg-warning/10 text-warning text-sm">
            Cannot reach the server. Make sure the backend is running at the URL in VITE_API_URL.
          </div>
        )}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold mb-2">CitizenHub</h1>
          <p className="text-muted-foreground">Access your city services</p>
        </div>

        <Tabs value={isLogin ? 'login' : 'signup'} onValueChange={(v) => setIsLogin(v === 'login')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signup">
            <form onSubmit={handleSignup} className="space-y-4">
              {signupError && (
                <div className="p-3 rounded-md border border-destructive/50 bg-destructive/10 text-destructive text-sm">
                  {signupError}
                </div>
              )}
              <div>
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  required
                />
              </div>
              <div>
                <Label htmlFor="signupEmail">Email</Label>
                <Input
                  id="signupEmail"
                  type="email"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                />
              </div>
              <div>
                <Label htmlFor="signupPassword">Password</Label>
                <Input
                  id="signupPassword"
                  type="password"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Creating account...' : 'Create Account'}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
