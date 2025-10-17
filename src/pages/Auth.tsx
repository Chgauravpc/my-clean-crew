import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Sparkles } from 'lucide-react';

const Auth = () => {
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<'customer' | 'maid'>('customer');
  const navigate = useNavigate();
  const { toast } = useToast();

  const [signInData, setSignInData] = useState({ email: '', password: '' });
  const [signUpData, setSignUpData] = useState({
    email: '',
    password: '',
    fullName: '',
    phone: '',
    // Maid-specific fields
    hourlyRate: '',
    dailyRate: '',
    monthlyRate: '',
    location: '',
    description: '',
  });

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: signInData.email,
        password: signInData.password,
      });

      if (error) throw error;

      toast({
        title: 'Welcome back!',
        description: 'You have successfully signed in.',
      });

      // Fetch user role to redirect appropriately
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', data.user.id)
        .single();

      if (roleData?.role === 'maid') {
        navigate('/maid-dashboard');
      } else {
        navigate('/customer-dashboard');
      }
    } catch (error: any) {
      toast({
        title: 'Sign in failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: signUpData.email,
        password: signUpData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: signUpData.fullName,
            phone: signUpData.phone,
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Registration failed');

      // Insert user role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({ user_id: authData.user.id, role });

      if (roleError) throw roleError;

      // If maid, create maid profile
      if (role === 'maid') {
        const { error: maidError } = await supabase
          .from('maids')
          .insert({
            user_id: authData.user.id,
            hourly_rate: parseFloat(signUpData.hourlyRate),
            daily_rate: parseFloat(signUpData.dailyRate),
            monthly_rate: parseFloat(signUpData.monthlyRate),
            location: signUpData.location,
            description: signUpData.description,
          });

        if (maidError) throw maidError;
      }

      toast({
        title: 'Account created!',
        description: 'Your account has been created successfully.',
      });

      if (role === 'maid') {
        navigate('/maid-dashboard');
      } else {
        navigate('/customer-dashboard');
      }
    } catch (error: any) {
      toast({
        title: 'Registration failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted to-background p-4">
      <Card className="w-full max-w-md shadow-[var(--shadow-lg)]">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-gradient-to-br from-primary to-accent rounded-full">
              <Sparkles className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Maidly
          </CardTitle>
          <CardDescription>Your trusted maid service platform</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="Enter your email"
                    value={signInData.email}
                    onChange={(e) => setSignInData({ ...signInData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    placeholder="Enter your password"
                    value={signInData.password}
                    onChange={(e) => setSignInData({ ...signInData, password: e.target.value })}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label>I am a</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={role === 'customer' ? 'default' : 'outline'}
                      className="flex-1"
                      onClick={() => setRole('customer')}
                    >
                      Customer
                    </Button>
                    <Button
                      type="button"
                      variant={role === 'maid' ? 'default' : 'outline'}
                      className="flex-1"
                      onClick={() => setRole('maid')}
                    >
                      Maid
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full Name</Label>
                  <Input
                    id="signup-name"
                    placeholder="Enter your full name"
                    value={signUpData.fullName}
                    onChange={(e) => setSignUpData({ ...signUpData, fullName: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="Enter your email"
                    value={signUpData.email}
                    onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="Create a password"
                    value={signUpData.password}
                    onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-phone">Phone</Label>
                  <Input
                    id="signup-phone"
                    type="tel"
                    placeholder="Enter your phone number"
                    value={signUpData.phone}
                    onChange={(e) => setSignUpData({ ...signUpData, phone: e.target.value })}
                  />
                </div>

                {role === 'maid' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="signup-location">Location</Label>
                      <Input
                        id="signup-location"
                        placeholder="e.g., Sector 5, Noida"
                        value={signUpData.location}
                        onChange={(e) => setSignUpData({ ...signUpData, location: e.target.value })}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-2">
                        <Label htmlFor="hourly-rate">Hourly Rate</Label>
                        <Input
                          id="hourly-rate"
                          type="number"
                          placeholder="₹100"
                          value={signUpData.hourlyRate}
                          onChange={(e) => setSignUpData({ ...signUpData, hourlyRate: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="daily-rate">Daily Rate</Label>
                        <Input
                          id="daily-rate"
                          type="number"
                          placeholder="₹500"
                          value={signUpData.dailyRate}
                          onChange={(e) => setSignUpData({ ...signUpData, dailyRate: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="monthly-rate">Monthly Rate</Label>
                        <Input
                          id="monthly-rate"
                          type="number"
                          placeholder="₹8000"
                          value={signUpData.monthlyRate}
                          onChange={(e) => setSignUpData({ ...signUpData, monthlyRate: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description (Optional)</Label>
                      <Input
                        id="description"
                        placeholder="Tell customers about yourself"
                        value={signUpData.description}
                        onChange={(e) => setSignUpData({ ...signUpData, description: e.target.value })}
                      />
                    </div>
                  </>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Creating account...' : 'Create Account'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;