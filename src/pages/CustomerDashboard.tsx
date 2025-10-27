import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/integrations/supabase/auth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { LogOut, Star, MapPin, Users } from 'lucide-react';
import '../styles/customer-dashboard.css';

interface Maid {
  id: string;
  user_id: string;
  hourly_rate: number;
  daily_rate: number;
  monthly_rate: number;
  location: string;
  description: string;
  rating: number;
  completed_jobs: number;
  profiles: {
    full_name: string;
  };
}

interface Job {
  id: string;
  job_date: string;
  duration: string;
  location: string;
  job_type: string;
  amount: number;
  status: string;
  maids: {
    profiles: {
      full_name: string;
    };
  };
}

const CustomerDashboard = () => {
  const { user, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [maids, setMaids] = useState<Maid[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedMaid, setSelectedMaid] = useState<Maid | null>(null);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [bookingData, setBookingData] = useState({
    date: '',
    duration: '',
    location: '',
    jobType: 'hourly' as 'hourly' | 'daily' | 'monthly',
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchMaids();
      fetchJobs();
    }
  }, [user]);

  const fetchMaids = async () => {
    try {
      const { data, error } = await supabase
        .from('maids')
        .select(`
          *,
          profiles!inner(full_name)
        `)
        .order('rating', { ascending: false });

      if (error) throw error;
      setMaids(data as any || []);
    } catch (error: any) {
      toast({
        title: 'Error fetching maids',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchJobs = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          *,
          maids!inner(
            profiles!inner(full_name)
          )
        `)
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJobs(data as any || []);
    } catch (error: any) {
      toast({
        title: 'Error fetching jobs',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleBookMaid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMaid || !user) return;

    const amount =
      bookingData.jobType === 'hourly'
        ? selectedMaid.hourly_rate
        : bookingData.jobType === 'daily'
        ? selectedMaid.daily_rate
        : selectedMaid.monthly_rate;

    try {
      const { error } = await supabase.from('jobs').insert({
        customer_id: user.id,
        maid_id: selectedMaid.id,
        job_date: bookingData.date,
        duration: bookingData.duration,
        location: bookingData.location,
        job_type: bookingData.jobType,
        amount,
        status: 'pending',
      });

      if (error) throw error;

      toast({
        title: 'Booking successful!',
        description: 'Your job request has been sent to the maid.',
      });

      setBookingOpen(false);
      setBookingData({ date: '', duration: '', location: '', jobType: 'hourly' });
      fetchJobs();
    } catch (error: any) {
      toast({
        title: 'Booking failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const cancelJob = async (jobId: string) => {
    try {
      const { error } = await supabase
        .from('jobs')
        .update({ status: 'cancelled' })
        .eq('id', jobId);

      if (error) throw error;

      toast({
        title: 'Job cancelled',
        description: 'The job has been cancelled successfully.',
      });

      fetchJobs();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  if (authLoading || loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-content">
          <h1 className="header-title">Maidly Customer</h1>
          <button onClick={signOut} className="logout-btn">
            <LogOut className="w-4 h-4" style={{ marginRight: '0.5rem', display: 'inline' }} />
            Sign Out
          </button>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="welcome-section">
          <h2 className="welcome-title">Find Your Perfect Maid</h2>
          <p className="welcome-text">Browse and book trusted cleaning professionals in your area</p>
        </div>

        <section>
          <h2 className="section-title">Available Maids</h2>
          {maids.length === 0 ? (
            <div className="empty-state">
              <Users className="empty-icon" />
              <h3 className="empty-title">No maids available</h3>
              <p className="empty-text">Check back later for available professionals</p>
            </div>
          ) : (
            <div className="maids-grid">
              {maids.map((maid) => (
                <article key={maid.id} className="maid-card">
                  <div className="maid-header">
                    <div className="maid-info">
                      <h3 className="maid-name">{maid.profiles.full_name}</h3>
                      <div className="maid-location">
                        <MapPin style={{ width: '1rem', height: '1rem', display: 'inline', verticalAlign: 'middle', marginRight: '0.25rem' }} />
                        {maid.location}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Star style={{ width: '1rem', height: '1rem', fill: 'hsl(var(--primary))', color: 'hsl(var(--primary))' }} />
                      <span>{maid.rating.toFixed(1)}</span>
                    </div>
                  </div>

                  {maid.description && (
                    <p className="maid-description">{maid.description}</p>
                  )}

                  <div className="rates-section">
                    <h4 className="rates-title">Service Rates</h4>
                    <div className="rates-list">
                      <div className="rate-item">
                        <span className="rate-label">Hourly:</span>
                        <span className="rate-value">₹{maid.hourly_rate}</span>
                      </div>
                      <div className="rate-item">
                        <span className="rate-label">Daily:</span>
                        <span className="rate-value">₹{maid.daily_rate}</span>
                      </div>
                      <div className="rate-item">
                        <span className="rate-label">Monthly:</span>
                        <span className="rate-value">₹{maid.monthly_rate}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ fontSize: '0.875rem', textAlign: 'center', color: 'hsl(var(--muted-foreground))', marginBottom: '0.75rem' }}>
                    {maid.completed_jobs} jobs completed
                  </div>

                  <button
                    className="contact-btn"
                    onClick={() => {
                      setSelectedMaid(maid);
                      setBookingOpen(true);
                    }}
                  >
                    Book Now
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      {bookingOpen && selectedMaid && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
            padding: '1rem',
          }}
          onClick={() => setBookingOpen(false)}
        >
          <div
            style={{
              background: 'hsl(var(--card))',
              borderRadius: '0.75rem',
              padding: '1.5rem',
              maxWidth: '28rem',
              width: '100%',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
              Book {selectedMaid.profiles.full_name}
            </h3>
            <p style={{ color: 'hsl(var(--muted-foreground))', marginBottom: '1rem' }}>
              Fill in the details for your booking
            </p>
            <form onSubmit={handleBookMaid} className="auth-form">
              <div className="form-group">
                <label htmlFor="date" className="form-label">Date</label>
                <input
                  id="date"
                  type="date"
                  className="form-input"
                  value={bookingData.date}
                  onChange={(e) => setBookingData({ ...bookingData, date: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="job-type" className="form-label">Job Type</label>
                <select
                  id="job-type"
                  className="form-input"
                  value={bookingData.jobType}
                  onChange={(e) => setBookingData({ ...bookingData, jobType: e.target.value as any })}
                  required
                >
                  <option value="hourly">Hourly (₹{selectedMaid.hourly_rate})</option>
                  <option value="daily">Daily (₹{selectedMaid.daily_rate})</option>
                  <option value="monthly">Monthly (₹{selectedMaid.monthly_rate})</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="duration" className="form-label">Duration</label>
                <input
                  id="duration"
                  type="text"
                  placeholder="e.g., 2 hours, 1 day, 1 month"
                  className="form-input"
                  value={bookingData.duration}
                  onChange={(e) => setBookingData({ ...bookingData, duration: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="location" className="form-label">Location</label>
                <input
                  id="location"
                  type="text"
                  placeholder="Enter service location"
                  className="form-input"
                  value={bookingData.location}
                  onChange={(e) => setBookingData({ ...bookingData, location: e.target.value })}
                  required
                />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setBookingOpen(false)}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '0.375rem',
                    background: 'transparent',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="submit-btn" style={{ flex: 1 }}>
                  Confirm Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerDashboard;