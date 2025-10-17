import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/integrations/supabase/auth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { LogOut, Star, MapPin, Calendar, Clock, IndianRupee } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b shadow-[var(--shadow-card)]">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Maidly Customer
          </h1>
          <Button onClick={signOut} variant="outline">
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="maids" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="maids">Find Maids</TabsTrigger>
            <TabsTrigger value="jobs">My Jobs</TabsTrigger>
          </TabsList>

          <TabsContent value="maids">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {maids.map((maid) => (
                <Card key={maid.id} className="shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-lg)] transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      {maid.profiles.full_name}
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-accent text-accent" />
                        <span className="text-sm font-normal">{maid.rating.toFixed(1)}</span>
                      </div>
                    </CardTitle>
                    <CardDescription className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {maid.location}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {maid.description && (
                      <p className="text-sm text-muted-foreground">{maid.description}</p>
                    )}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Hourly:</span>
                        <span className="font-medium">₹{maid.hourly_rate}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Daily:</span>
                        <span className="font-medium">₹{maid.daily_rate}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Monthly:</span>
                        <span className="font-medium">₹{maid.monthly_rate}</span>
                      </div>
                    </div>
                    <Badge variant="secondary" className="w-full justify-center">
                      {maid.completed_jobs} jobs completed
                    </Badge>
                    <Dialog open={bookingOpen && selectedMaid?.id === maid.id} onOpenChange={setBookingOpen}>
                      <DialogTrigger asChild>
                        <Button
                          className="w-full"
                          onClick={() => {
                            setSelectedMaid(maid);
                            setBookingOpen(true);
                          }}
                        >
                          Book Now
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Book {maid.profiles.full_name}</DialogTitle>
                          <DialogDescription>Fill in the details for your booking</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleBookMaid} className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="date">Date</Label>
                            <Input
                              id="date"
                              type="date"
                              value={bookingData.date}
                              onChange={(e) => setBookingData({ ...bookingData, date: e.target.value })}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="job-type">Job Type</Label>
                            <Select
                              value={bookingData.jobType}
                              onValueChange={(value: 'hourly' | 'daily' | 'monthly') =>
                                setBookingData({ ...bookingData, jobType: value })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="hourly">Hourly (₹{maid.hourly_rate})</SelectItem>
                                <SelectItem value="daily">Daily (₹{maid.daily_rate})</SelectItem>
                                <SelectItem value="monthly">Monthly (₹{maid.monthly_rate})</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="duration">Duration</Label>
                            <Input
                              id="duration"
                              placeholder="e.g., 2 hours, 1 day, 1 month"
                              value={bookingData.duration}
                              onChange={(e) => setBookingData({ ...bookingData, duration: e.target.value })}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="location">Location</Label>
                            <Input
                              id="location"
                              placeholder="Enter service location"
                              value={bookingData.location}
                              onChange={(e) => setBookingData({ ...bookingData, location: e.target.value })}
                              required
                            />
                          </div>
                          <Button type="submit" className="w-full">
                            Confirm Booking
                          </Button>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="jobs">
            <div className="space-y-4">
              {jobs.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground">No jobs yet. Start by booking a maid!</p>
                  </CardContent>
                </Card>
              ) : (
                jobs.map((job) => (
                  <Card key={job.id} className="shadow-[var(--shadow-card)]">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>{job.maids.profiles.full_name}</CardTitle>
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
                        <Badge
                          variant={
                            job.status === 'completed'
                              ? 'default'
                              : job.status === 'accepted'
                              ? 'secondary'
                              : job.status === 'cancelled'
                              ? 'destructive'
                              : 'outline'
                          }
                        >
                          {job.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <IndianRupee className="w-5 h-5 text-primary" />
                          <span className="text-2xl font-bold">₹{job.amount}</span>
                          <span className="text-sm text-muted-foreground">({job.job_type})</span>
                        </div>
                        {job.status === 'pending' && (
                          <Button variant="destructive" onClick={() => cancelJob(job.id)}>
                            Cancel
                          </Button>
                        )}
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

export default CustomerDashboard;