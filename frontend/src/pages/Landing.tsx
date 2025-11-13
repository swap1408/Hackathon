import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Bell, MapPin, Shield, Users } from 'lucide-react';
import heroImage from '@/assets/hero-city.jpg';

export default function Landing() {
  const navigate = useNavigate();

  const features = [
    {
      icon: Bell,
      title: 'Real-time Alerts',
      description: 'Stay informed about air quality, traffic, and utility updates in your area'
    },
    {
      icon: MapPin,
      title: 'Smart Navigation',
      description: 'Get alternative routes and real-time traffic updates for your commute'
    },
    {
      icon: Shield,
      title: 'Report Issues',
      description: 'Quickly report and track civic issues with photo uploads and geotagging'
    },
    {
      icon: Users,
      title: 'Community Services',
      description: 'Access local hospitals, pharmacies, shelters, and community centers'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background"></div>
        </div>
        
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-info">
            CitizenHub
          </h1>
          <p className="text-xl md:text-2xl text-foreground/90 mb-8 max-w-2xl mx-auto">
            Your personal portal for city services, real-time alerts, and community engagement
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={() => navigate('/auth')}
              className="text-lg px-8 py-6"
            >
              Get Started
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => navigate('/auth')}
              className="text-lg px-8 py-6"
            >
              Sign In
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-4">
            Everything You Need in One Place
          </h2>
          <p className="text-center text-muted-foreground mb-12 text-lg">
            Access vital city services and stay informed about what matters most to you
          </p>
          
          <div className="grid md:grid-cols-2 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div 
                  key={index}
                  className="bg-card border border-border rounded-xl p-8 hover:shadow-lg transition-shadow"
                >
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-primary/5">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join thousands of citizens staying connected with their community
          </p>
          <Button 
            size="lg"
            onClick={() => navigate('/auth')}
            className="text-lg px-8 py-6"
          >
            Create Your Account
          </Button>
        </div>
      </section>
    </div>
  );
}
