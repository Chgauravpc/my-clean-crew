import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/integrations/supabase/auth';
import { Button } from '@/components/ui/button';
import { Sparkles, Users, Star, Shield, ArrowRight } from 'lucide-react';

const Index = () => {
  const { user, userRole, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user && userRole) {
      if (userRole === 'maid') {
        navigate('/maid-dashboard');
      } else if (userRole === 'customer') {
        navigate('/customer-dashboard');
      }
    }
  }, [user, userRole, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-gradient-to-br from-primary to-accent rounded-2xl shadow-[var(--shadow-lg)]">
              <Sparkles className="w-16 h-16 text-primary-foreground" />
            </div>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent leading-tight">
            Welcome to Maidly
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
            Your trusted platform for connecting with professional maid services
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
            <Button
              size="lg"
              className="text-lg px-8 shadow-[var(--shadow-lg)]"
              onClick={() => navigate('/auth')}
            >
              Get Started
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-lg px-8"
              onClick={() => navigate('/auth')}
            >
              Sign In
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="bg-card rounded-xl p-8 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-lg)] transition-shadow">
            <div className="bg-gradient-to-br from-primary to-accent p-3 rounded-lg w-fit mb-4">
              <Users className="w-8 h-8 text-primary-foreground" />
            </div>
            <h3 className="text-2xl font-bold mb-3">Trusted Professionals</h3>
            <p className="text-muted-foreground">
              Connect with verified and experienced maids in your area
            </p>
          </div>

          <div className="bg-card rounded-xl p-8 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-lg)] transition-shadow">
            <div className="bg-gradient-to-br from-secondary to-primary p-3 rounded-lg w-fit mb-4">
              <Star className="w-8 h-8 text-primary-foreground" />
            </div>
            <h3 className="text-2xl font-bold mb-3">Quality Service</h3>
            <p className="text-muted-foreground">
              Rated and reviewed by customers to ensure the best experience
            </p>
          </div>

          <div className="bg-card rounded-xl p-8 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-lg)] transition-shadow">
            <div className="bg-gradient-to-br from-accent to-secondary p-3 rounded-lg w-fit mb-4">
              <Shield className="w-8 h-8 text-primary-foreground" />
            </div>
            <h3 className="text-2xl font-bold mb-3">Secure Platform</h3>
            <p className="text-muted-foreground">
              Safe and secure bookings with transparent pricing
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            How It Works
          </h2>
          <div className="space-y-6">
            <div className="flex gap-4 items-start bg-card p-6 rounded-xl shadow-[var(--shadow-card)]">
              <div className="bg-primary text-primary-foreground rounded-full w-12 h-12 flex items-center justify-center font-bold text-xl shrink-0">
                1
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Sign Up</h3>
                <p className="text-muted-foreground">
                  Create your account as a customer or maid in just minutes
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start bg-card p-6 rounded-xl shadow-[var(--shadow-card)]">
              <div className="bg-secondary text-primary-foreground rounded-full w-12 h-12 flex items-center justify-center font-bold text-xl shrink-0">
                2
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Browse & Book</h3>
                <p className="text-muted-foreground">
                  Customers can browse available maids and book services easily
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start bg-card p-6 rounded-xl shadow-[var(--shadow-card)]">
              <div className="bg-accent text-primary-foreground rounded-full w-12 h-12 flex items-center justify-center font-bold text-xl shrink-0">
                3
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Get Started</h3>
                <p className="text-muted-foreground">
                  Maids accept jobs and provide quality service to earn income
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
