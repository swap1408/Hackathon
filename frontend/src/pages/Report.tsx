import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { BottomNav } from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Camera, MapPin, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { IncidentsAPI } from '@/lib/api';

export default function Report() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [ticketId, setTicketId] = useState('');
  
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);

    try {
      // Map form fields to backend IncidentCreateRequest
      const payload = {
        title: `Citizen Report: ${category || 'General'}`,
        type: category || 'other',
        severity: 'LOW',
        status: 'OPEN',
        location: address,
        data: JSON.stringify({
          description,
          user_id: user?.id || null,
          photo_name: photo?.name || null,
        }),
      };

      const incident = await IncidentsAPI.create(payload);

      setTicketId(incident.id);
      setSubmitted(true);
      toast.success('Report submitted successfully!');

      // Reset form
      setCategory('');
      setDescription('');
      setAddress('');
      setPhoto(null);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to submit report');
    } finally {
      setLoading(false);
    }
  };
  if (submitted) {
    return (
      <div className="min-h-screen pb-20 bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="h-8 w-8 text-success" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Report Submitted!</h2>
          <p className="text-muted-foreground mb-4">
            Your report has been received and will be reviewed shortly.
          </p>
          <div className="bg-muted p-4 rounded-lg mb-6">
            <p className="text-sm text-muted-foreground mb-1">Ticket ID</p>
            <p className="text-xl font-mono font-bold">{ticketId}</p>
          </div>
          <Button onClick={() => setSubmitted(false)} className="w-full">
            Submit Another Report
          </Button>
        </Card>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 bg-background">
      <header className="bg-primary text-primary-foreground p-6 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-1">Report an Issue</h1>
          <p className="text-primary-foreground/80">Help improve your community</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4">
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="category">Issue Category</Label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background mt-2"
                required
              >
                <option value="">Select a category...</option>
                <option value="road">Road / Infrastructure</option>
                <option value="water">Water Supply</option>
                <option value="power">Power / Electricity</option>
                <option value="waste">Waste Management</option>
                <option value="safety">Public Safety</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Please describe the issue in detail..."
                rows={4}
                required
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="address">Location</Label>
              <div className="relative mt-2">
                <MapPin className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter address or describe location"
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="photo">Photo (Optional)</Label>
              <div className="mt-2 border-2 border-dashed border-border rounded-lg p-8 text-center">
                <Camera className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                <Input
                  id="photo"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPhoto(e.target.files?.[0] || null)}
                  className="hidden"
                />
                <label htmlFor="photo" className="cursor-pointer">
                  <span className="text-primary hover:underline">
                    {photo ? photo.name : 'Click to upload photo'}
                  </span>
                </label>
              </div>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Report'}
            </Button>
          </form>
        </Card>
      </main>

      <BottomNav />
    </div>
  );
}
