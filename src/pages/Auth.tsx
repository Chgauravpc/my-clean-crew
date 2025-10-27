import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Sparkles } from 'lucide-react';
import { z } from 'zod';
import '../styles/auth.css';

// Validation schemas
const signInSchema = z.object({
  email: z.string().email('Invalid email address').max(255),
  password: z.string().min(1, 'Password is required'),
});

const signUpBaseSchema = z.object({
  email: z.string().email('Invalid email address').max(255),
  password: z.string().min(8, 'Password must be at least 8 characters').max(72),
  fullName: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  phone: z.string().regex(/^\d{10}$/, 'Phone number must be exactly 10 digits').optional().or(z.literal('')),
});

const maidSignUpSchema = signUpBaseSchema.extend({
  hourlyRate: z.coerce.number().positive('Hourly rate must be positive').max(10000, 'Hourly rate must be less than ₹10,000'),
  dailyRate: z.coerce.number().positive('Daily rate must be positive').max(50000, 'Daily rate must be less than ₹50,000'),
  monthlyRate: z.coerce.number().positive('Monthly rate must be positive').max(500000, 'Monthly rate must be less than ₹5,00,000'),
  location: z.string().trim().min(3, 'Location must be at least 3 characters').max(200),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
});

const Auth = () => {
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<'customer' | 'maid'>('customer');
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
  const navigate = useNavigate();
  const { toast } = useToast();

  const [signInData, setSignInData] = useState({ email: '', password: '' });
  const [signUpData, setSignUpData] = useState({
    email: '',
    password: '',
    fullName: '',
    phone: '',
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
      const validation = signInSchema.safeParse(signInData);
      if (!validation.success) {
        toast({
          title: 'Validation Error',
          description: validation.error.errors[0].message,
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: signInData.email,
        password: signInData.password,
      });

      if (error) throw error;

      toast({
        title: 'Welcome back!',
        description: 'You have successfully signed in.',
      });

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
      const schema = role === 'maid' ? maidSignUpSchema : signUpBaseSchema;
      const validation = schema.safeParse(signUpData);
      
      if (!validation.success) {
        toast({
          title: 'Validation Error',
          description: validation.error.errors[0].message,
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      const validatedData = validation.data;

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: validatedData.email,
        password: validatedData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: validatedData.fullName,
            phone: validatedData.phone || null,
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Registration failed');

      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({ user_id: authData.user.id, role });

      if (roleError) throw roleError;

      if (role === 'maid') {
        const { error: maidError } = await supabase
          .from('maids')
          .insert({
            user_id: authData.user.id,
            hourly_rate: parseFloat(signUpData.hourlyRate),
            daily_rate: parseFloat(signUpData.dailyRate),
            monthly_rate: parseFloat(signUpData.monthlyRate),
            location: signUpData.location,
            description: signUpData.description || null,
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
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <Sparkles className="auth-logo-icon" />
          </div>
          <h1 className="auth-title">Maidly</h1>
          <p className="auth-subtitle">Your trusted maid service platform</p>
        </div>

        <div className="tabs-container">
          <div className="tabs-list">
            <button
              className={`tab-trigger ${activeTab === 'signin' ? 'active' : ''}`}
              onClick={() => setActiveTab('signin')}
            >
              Sign In
            </button>
            <button
              className={`tab-trigger ${activeTab === 'signup' ? 'active' : ''}`}
              onClick={() => setActiveTab('signup')}
            >
              Sign Up
            </button>
          </div>
        </div>

        {activeTab === 'signin' ? (
          <form onSubmit={handleSignIn} className="auth-form">
            <div className="form-group">
              <label htmlFor="signin-email" className="form-label">Email</label>
              <input
                id="signin-email"
                type="email"
                placeholder="Enter your email"
                className="form-input"
                value={signInData.email}
                onChange={(e) => setSignInData({ ...signInData, email: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="signin-password" className="form-label">Password</label>
              <input
                id="signin-password"
                type="password"
                placeholder="Enter your password"
                className="form-input"
                value={signInData.password}
                onChange={(e) => setSignInData({ ...signInData, password: e.target.value })}
                required
              />
            </div>
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? (
                <span className="btn-loading">
                  <span className="btn-spinner"></span>
                  Signing in...
                </span>
              ) : 'Sign In'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignUp} className="auth-form">
            <div className="form-group">
              <label className="form-label">I am a</label>
              <div className="radio-group">
                <label className="radio-item">
                  <input
                    type="radio"
                    name="role"
                    value="customer"
                    className="radio-input"
                    checked={role === 'customer'}
                    onChange={() => setRole('customer')}
                  />
                  <span className="radio-label">Customer</span>
                </label>
                <label className="radio-item">
                  <input
                    type="radio"
                    name="role"
                    value="maid"
                    className="radio-input"
                    checked={role === 'maid'}
                    onChange={() => setRole('maid')}
                  />
                  <span className="radio-label">Maid</span>
                </label>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="signup-name" className="form-label">Full Name</label>
              <input
                id="signup-name"
                type="text"
                placeholder="Enter your full name"
                className="form-input"
                value={signUpData.fullName}
                onChange={(e) => setSignUpData({ ...signUpData, fullName: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="signup-email" className="form-label">Email</label>
              <input
                id="signup-email"
                type="email"
                placeholder="Enter your email"
                className="form-input"
                value={signUpData.email}
                onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="signup-password" className="form-label">Password</label>
              <input
                id="signup-password"
                type="password"
                placeholder="Create a password"
                className="form-input"
                value={signUpData.password}
                onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="signup-phone" className="form-label">Phone</label>
              <input
                id="signup-phone"
                type="tel"
                placeholder="Enter your phone number"
                className="form-input"
                value={signUpData.phone}
                onChange={(e) => setSignUpData({ ...signUpData, phone: e.target.value })}
              />
            </div>

            {role === 'maid' && (
              <div className="maid-fields">
                <div className="form-group">
                  <label htmlFor="signup-location" className="form-label">Location</label>
                  <input
                    id="signup-location"
                    type="text"
                    placeholder="e.g., Sector 5, Noida"
                    className="form-input"
                    value={signUpData.location}
                    onChange={(e) => setSignUpData({ ...signUpData, location: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="hourly-rate" className="form-label">Hourly Rate (₹)</label>
                  <input
                    id="hourly-rate"
                    type="number"
                    placeholder="100"
                    className="form-input"
                    value={signUpData.hourlyRate}
                    onChange={(e) => setSignUpData({ ...signUpData, hourlyRate: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="daily-rate" className="form-label">Daily Rate (₹)</label>
                  <input
                    id="daily-rate"
                    type="number"
                    placeholder="500"
                    className="form-input"
                    value={signUpData.dailyRate}
                    onChange={(e) => setSignUpData({ ...signUpData, dailyRate: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="monthly-rate" className="form-label">Monthly Rate (₹)</label>
                  <input
                    id="monthly-rate"
                    type="number"
                    placeholder="8000"
                    className="form-input"
                    value={signUpData.monthlyRate}
                    onChange={(e) => setSignUpData({ ...signUpData, monthlyRate: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="description" className="form-label">Description (Optional)</label>
                  <input
                    id="description"
                    type="text"
                    placeholder="Tell customers about yourself"
                    className="form-input"
                    value={signUpData.description}
                    onChange={(e) => setSignUpData({ ...signUpData, description: e.target.value })}
                  />
                </div>
              </div>
            )}

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? (
                <span className="btn-loading">
                  <span className="btn-spinner"></span>
                  Creating account...
                </span>
              ) : 'Create Account'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Auth;
