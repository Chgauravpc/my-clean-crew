import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/integrations/supabase/auth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { LogOut, Calendar, Clock, MapPin, IndianRupee, TrendingUp } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
          profiles!jobs_customer_id_fkey(full_name)
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const pendingJobs = jobs.filter((j) => j.status === 'pending');
  const acceptedJobs = jobs.filter((j) => j.status === 'accepted');
  const completedJobs = jobs.filter((j) => j.status === 'completed');
  const totalEarnings = completedJobs.reduce((sum, job) => sum + Number(job.amount), 0);

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b shadow-[var(--shadow-card)]">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Maidly Maid
          </h1>
          <Button onClick={signOut} variant="outline">
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="shadow-[var(--shadow-card)]">
            <CardHeader>
              <CardDescription>Total Earnings</CardDescription>
              <CardTitle className="text-3xl flex items-center gap-2">
                <IndianRupee className="w-6 h-6 text-primary" />
                ₹{totalEarnings.toFixed(2)}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card className="shadow-[var(--shadow-card)]">
            <CardHeader>
              <CardDescription>Completed Jobs</CardDescription>
              <CardTitle className="text-3xl flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-primary" />
                {completedJobs.length}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card className="shadow-[var(--shadow-card)]">
            <CardHeader>
              <CardDescription>Pending Requests</CardDescription>
              <CardTitle className="text-3xl">{pendingJobs.length}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="pending">
              Pending ({pendingJobs.length})
            </TabsTrigger>
            <TabsTrigger value="accepted">
              Accepted ({acceptedJobs.length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed ({completedJobs.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            <div className="space-y-4">
              {pendingJobs.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground">No pending requests</p>
                  </CardContent>
                </Card>
              ) : (
                pendingJobs.map((job) => (
                  <Card key={job.id} className="shadow-[var(--shadow-card)]">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>New Job Request</CardTitle>
                          <CardDescription className="mt-2">
                            Customer: {job.profiles.full_name}
                          </CardDescription>
                          <CardDescription className="flex items-center gap-4 mt-2">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {new Date(job.job_date).toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {job.duration}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {job.location}
                            </span>
                          </CardDescription>
                        </div>
                        <Badge variant="outline">Pending</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <IndianRupee className="w-5 h-5 text-primary" />
                          <span className="text-2xl font-bold">₹{job.amount}</span>
                          <span className="text-sm text-muted-foreground">({job.job_type})</span>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" onClick={() => rejectJob(job.id)}>
                            Reject
                          </Button>
                          <Button onClick={() => acceptJob(job.id)}>Accept</Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="accepted">
            <div className="space-y-4">
              {acceptedJobs.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground">No accepted jobs</p>
                  </CardContent>
                </Card>
              ) : (
                acceptedJobs.map((job) => (
                  <Card key={job.id} className="shadow-[var(--shadow-card)]">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>Upcoming Job</CardTitle>
                          <CardDescription className="mt-2">
                            Customer: {job.profiles.full_name}
                          </CardDescription>
                          <CardDescription className="flex items-center gap-4 mt-2">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {new Date(job.job_date).toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {job.duration}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {job.location}
                            </span>
                          </CardDescription>
                        </div>
                        <Badge variant="secondary">Accepted</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <IndianRupee className="w-5 h-5 text-primary" />
                          <span className="text-2xl font-bold">₹{job.amount}</span>
                          <span className="text-sm text-muted-foreground">({job.job_type})</span>
                        </div>
                        <Button onClick={() => completeJob(job.id)}>Mark Complete</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="completed">
            <div className="space-y-4">
              {completedJobs.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground">No completed jobs yet</p>
                  </CardContent>
                </Card>
              ) : (
                completedJobs.map((job) => (
                  <Card key={job.id} className="shadow-[var(--shadow-card)]">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>Completed Job</CardTitle>
                          <CardDescription className="mt-2">
                            Customer: {job.profiles.full_name}
                          </CardDescription>
                          <CardDescription className="flex items-center gap-4 mt-2">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {new Date(job.job_date).toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {job.duration}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {job.location}
                            </span>
                          </CardDescription>
                        </div>
                        <Badge>Completed</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2">
                        <IndianRupee className="w-5 h-5 text-primary" />
                        <span className="text-2xl font-bold">₹{job.amount}</span>
                        <span className="text-sm text-muted-foreground">({job.job_type})</span>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default MaidDashboard;