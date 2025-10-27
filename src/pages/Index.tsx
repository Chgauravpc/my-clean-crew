import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/integrations/supabase/auth';
import { Sparkles, Users, Star, Shield } from 'lucide-react';
import '../styles/landing.css';

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
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="landing-container">
      <header className="landing-header">
        <div className="header-content">
          <div className="logo">
            <Sparkles className="logo-icon" />
            <span>Maidly</span>
          </div>
          <div className="hero-buttons">
            <a href="#" onClick={(e) => { e.preventDefault(); navigate('/auth'); }} className="btn btn-primary">
              Get Started
            </a>
            <a href="#" onClick={(e) => { e.preventDefault(); navigate('/auth'); }} className="btn btn-outline">
              Sign In
            </a>
          </div>
        </div>
      </header>

      <section className="hero-section">
        <h1 className="hero-title">
          Welcome to Maidly
        </h1>
        <p className="hero-subtitle">
          Your trusted platform for connecting with professional maid services
        </p>
        <div className="hero-buttons">
          <a href="#" onClick={(e) => { e.preventDefault(); navigate('/auth'); }} className="btn btn-primary">
            Get Started
          </a>
          <a href="#" onClick={(e) => { e.preventDefault(); navigate('/auth'); }} className="btn btn-outline">
            Sign In
          </a>
        </div>
      </section>

      <section className="features-section">
        <h2 className="section-title">Why Choose Maidly?</h2>
        <div className="features-grid">
          <article className="feature-card">
            <Users className="feature-icon" />
            <h3 className="feature-title">Trusted Professionals</h3>
            <p className="feature-description">
              Connect with verified and experienced maids in your area
            </p>
          </article>
          <article className="feature-card">
            <Star className="feature-icon" />
            <h3 className="feature-title">Quality Service</h3>
            <p className="feature-description">
              Rated and reviewed by customers to ensure the best experience
            </p>
          </article>
          <article className="feature-card">
            <Shield className="feature-icon" />
            <h3 className="feature-title">Secure Platform</h3>
            <p className="feature-description">
              Safe and secure bookings with transparent pricing
            </p>
          </article>
        </div>
      </section>

      <section className="how-it-works-section">
        <h2 className="section-title">How It Works</h2>
        <div className="steps-grid">
          <article className="step-card">
            <div className="step-number">1</div>
            <h3 className="step-title">Sign Up</h3>
            <p className="step-description">
              Create your account as a customer or maid in just minutes
            </p>
          </article>
          <article className="step-card">
            <div className="step-number">2</div>
            <h3 className="step-title">Browse & Book</h3>
            <p className="step-description">
              Customers can browse available maids and book services easily
            </p>
          </article>
          <article className="step-card">
            <div className="step-number">3</div>
            <h3 className="step-title">Get Started</h3>
            <p className="step-description">
              Maids accept jobs and provide quality service to earn income
            </p>
          </article>
        </div>
      </section>
    </div>
  );
};

export default Index;
