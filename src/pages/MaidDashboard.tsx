import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/integrations/supabase/auth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { LogOut, Briefcase, IndianRupee, Clock } from 'lucide-react';
import '../styles/maid-dashboard.css';

interface Job {
  id: string;
  job_date: string;
  duration: string;
  location: string;
  job_type: string;
  amount: number;
  status: string;
  profiles: {
    full_name: string;
  };
}

const MaidDashboard = () => {
  const { user, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [maidProfile, setMaidProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchMaidProfile();
      fetchJobs();
    }
  }, [user]);

  const fetchMaidProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('maids')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setMaidProfile(data);
    } catch (error: any) {
      console.error('Error fetching maid profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchJobs = async () => {
    if (!user) return;

    try {
      // First get maid profile to get maid_id
      const { data: maidData } = await supabase
        .from('maids')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!maidData) return;

      const { data, error } = await supabase
        .from('jobs')
        .select(`
          *,
          profiles!customer_id(full_name)
        `)
        .eq('maid_id', maidData.id)
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

  const acceptJob = async (jobId: string) => {
    try {
      const { error } = await supabase
        .from('jobs')
        .update({ status: 'accepted' })
        .eq('id', jobId);

      if (error) throw error;

      toast({
        title: 'Job accepted!',
        description: 'The customer will be notified.',
      });

      fetchJobs();
      fetchMaidProfile();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const rejectJob = async (jobId: string) => {
    try {
      const { error } = await supabase
        .from('jobs')
        .update({ status: 'cancelled' })
        .eq('id', jobId);

      if (error) throw error;

      toast({
        title: 'Job rejected',
        description: 'The job has been declined.',
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

  const completeJob = async (jobId: string) => {
    try {
      const { error } = await supabase
        .from('jobs')
        .update({ status: 'completed' })
        .eq('id', jobId);

      if (error) throw error;

      // Update maid's completed jobs count
      if (maidProfile) {
        await supabase
          .from('maids')
          .update({ completed_jobs: maidProfile.completed_jobs + 1 })
          .eq('id', maidProfile.id);
      }

      toast({
        title: 'Job completed!',
        description: 'Great work!',
      });

      fetchJobs();
      fetchMaidProfile();
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

  const pendingJobs = jobs.filter((j) => j.status === 'pending');
  const completedJobs = jobs.filter((j) => j.status === 'completed');
  const totalEarnings = completedJobs.reduce((sum, job) => sum + Number(job.amount), 0);

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-content">
          <h1 className="header-title">Maidly Maid</h1>
          <button onClick={signOut} className="logout-btn">
            <LogOut style={{ width: '1rem', height: '1rem', marginRight: '0.5rem', display: 'inline' }} />
            Sign Out
          </button>
        </div>
      </header>

      <main className="dashboard-main">
        <section className="welcome-section">
          <h2 className="welcome-title">Welcome, {maidProfile?.location ? `Maid from ${maidProfile.location}` : 'Maid'}!</h2>
          <p className="welcome-text">Manage your jobs and track your earnings</p>

          {maidProfile && (
            <div className="profile-grid">
              <div className="profile-item">
                <div className="profile-label">Hourly Rate</div>
                <div className="profile-value">₹{maidProfile.hourly_rate}</div>
              </div>
              <div className="profile-item">
                <div className="profile-label">Daily Rate</div>
                <div className="profile-value">₹{maidProfile.daily_rate}</div>
              </div>
              <div className="profile-item">
                <div className="profile-label">Monthly Rate</div>
                <div className="profile-value">₹{maidProfile.monthly_rate}</div>
              </div>
              <div className="profile-item">
                <div className="profile-label">Location</div>
                <div className="profile-value">{maidProfile.location}</div>
              </div>
            </div>
          )}
        </section>

        <section className="stats-section">
          <h2 className="section-title">Your Statistics</h2>
          <div className="stats-grid">
            <article className="stat-card">
              <IndianRupee className="stat-icon" />
              <div className="stat-value">₹{totalEarnings.toFixed(2)}</div>
              <div className="stat-label">Total Earnings</div>
            </article>
            <article className="stat-card">
              <Briefcase className="stat-icon" />
              <div className="stat-value">{completedJobs.length}</div>
              <div className="stat-label">Completed Jobs</div>
            </article>
            <article className="stat-card">
              <Clock className="stat-icon" />
              <div className="stat-value">{pendingJobs.length}</div>
              <div className="stat-label">Pending Requests</div>
            </article>
          </div>
        </section>

        <section className="tips-section">
          <h3 className="tips-title">Tips for Success</h3>
          <ul className="tips-list">
            <li className="tip-item">Respond to job requests promptly to increase bookings</li>
            <li className="tip-item">Maintain high quality service for better ratings</li>
            <li className="tip-item">Update your availability regularly</li>
            <li className="tip-item">Communicate clearly with customers</li>
          </ul>
        </section>

        {pendingJobs.length > 0 && (
          <section style={{ marginTop: '2rem' }}>
            <h2 className="section-title">Pending Job Requests ({pendingJobs.length})</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {pendingJobs.map((job) => (
                <article
                  key={job.id}
                  style={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '0.75rem',
                    padding: '1.5rem',
                  }}
                >
                  <div style={{ marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                      New Job Request
                    </h3>
                    <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.875rem' }}>
                      Customer: {job.profiles.full_name}
                    </p>
                    <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                      Date: {new Date(job.job_date).toLocaleDateString()} | Duration: {job.duration}
                    </p>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                      ₹{job.amount} <span style={{ fontSize: '0.875rem', fontWeight: 'normal', color: 'hsl(var(--muted-foreground))' }}>({job.job_type})</span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => rejectJob(job.id)}
                        style={{
                          padding: '0.5rem 1rem',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '0.375rem',
                          background: 'transparent',
                          cursor: 'pointer',
                        }}
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => acceptJob(job.id)}
                        className="submit-btn"
                        style={{ padding: '0.5rem 1rem' }}
                      >
                        Accept
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default MaidDashboard;