
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import BotTypeSelector from "@/components/BotTypeSelector";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

type BotType = 
  | 'educational' 
  | 'health' 
  | 'customer_support' 
  | 'it_support' 
  | 'ecommerce' 
  | 'hr' 
  | 'personal' 
  | 'lead_generation' 
  | 'other';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [botType, setBotType] = useState<BotType | ''>('');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [resetPasswordSuccess, setResetPasswordSuccess] = useState(false);
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Please enter a valid email address";
    }
    
    if (!isForgotPassword) {
      if (!password) {
        newErrors.password = "Password is required";
      } else if (password.length < 6) {
        newErrors.password = "Password must be at least 6 characters";
      }
    }
    
    if (!isLogin && step === 2 && !botType) {
      newErrors.botType = "Please select a bot type";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);

    try {
      if (isForgotPassword) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth?reset=true`,
        });
        
        if (error) {
          toast.error(error.message);
          throw error;
        }
        
        setResetPasswordSuccess(true);
        toast.success("Password reset email sent! Check your inbox.");
      } else if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes("Email not confirmed")) {
            toast.error("Please confirm your email before logging in");
          } else if (error.message.includes("Invalid login credentials")) {
            toast.error("Invalid email or password");
          } else {
            toast.error(error.message);
          }
          throw error;
        }
        toast.success("Successfully logged in!");
        navigate("/dashboard");
      } else {
        if (step === 1) {
          const { data } = await supabase.auth.signInWithPassword({
            email,
            password: "dummypassword"
          });
          
          if (data.user) {
            setErrors({
              email: "An account with this email already exists"
            });
            setLoading(false);
            return;
          } else {
            setStep(2);
            setLoading(false);
            return;
          }
        } else {
          const { error, data } = await signUp(email, password);
          if (error) {
            if (error.message.includes("User already registered")) {
              toast.error("This email is already registered");
            } else {
              toast.error(error.message);
            }
            throw error;
          }
          
          if (botType && data?.user) {
            try {
              const { error: prefError } = await supabase
                .from('user_preferences')
                .insert({ 
                  user_id: data.user.id,
                  bot_purpose: botType 
                });
                
              if (prefError) {
                console.error("Failed to save preference:", prefError);
              }
            } catch (err) {
              console.error("Error storing user preferences:", err);
            }
          }
          
          toast.success("Registration successful! Please check your email for confirmation.");
        }
      }
    } catch (error: any) {
      console.error("Auth error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToStep1 = () => {
    setStep(1);
  };

  const handleBackToLogin = () => {
    setIsForgotPassword(false);
    setResetPasswordSuccess(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900 flex items-center justify-center px-4">
      <div className="absolute top-0 left-0 right-0">
        <div className="container mx-auto px-4 py-4">
          <Link to="/" className="flex items-center space-x-2">
            <span className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="w-5 h-5 text-white"
              >
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="17" x2="12" y2="17"></line>
              </svg>
            </span>
            <span className="text-xl font-semibold text-gray-900 dark:text-white">Chatwise</span>
          </Link>
        </div>
      </div>
      
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 space-y-6 mt-20">
        {isForgotPassword ? (
          <>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Reset Your Password
              </h1>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Enter your email and we'll send you instructions to reset your password
              </p>
            </div>

            {resetPasswordSuccess ? (
              <div className="space-y-4">
                <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-lg text-green-800 dark:text-green-300">
                  <p>A password reset link has been sent to <strong>{email}</strong></p>
                  <p className="text-sm mt-2">Check your email and follow the instructions to reset your password.</p>
                </div>
                
                <Button 
                  variant="outline" 
                  className="w-full mt-4"
                  onClick={handleBackToLogin}
                >
                  Back to Login
                </Button>
              </div>
            ) : (
              <form onSubmit={handleAuth} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={errors.email ? "border-red-500" : ""}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-500">{errors.email}</p>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Sending..." : "Send Reset Link"}
                </Button>
                
                <Button 
                  variant="ghost" 
                  className="w-full"
                  onClick={handleBackToLogin}
                  type="button"
                >
                  Back to Login
                </Button>
              </form>
            )}
          </>
        ) : isLogin || step === 1 ? (
          <>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {isLogin ? "Log in to your account" : "Create a new account"}
              </h1>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {isLogin
                  ? "Enter your credentials to access your account"
                  : "Sign up to start creating your chatbots"}
              </p>
            </div>

            <form onSubmit={handleAuth} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={errors.email ? "border-red-500" : ""}
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={errors.password ? "border-red-500" : ""}
                />
                {errors.password && (
                  <p className="text-sm text-red-500">{errors.password}</p>
                )}
              </div>

              {isLogin && (
                <button
                  type="button"
                  onClick={() => setIsForgotPassword(true)}
                  className="text-sm text-primary hover:underline w-full text-right"
                >
                  Forgot password?
                </button>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading
                  ? "Processing..."
                  : isLogin
                  ? "Sign In"
                  : "Continue"}
              </Button>
            </form>
          </>
        ) : (
          <>
            <div className="flex items-center mb-4">
              <Button variant="ghost" onClick={handleBackToStep1} className="p-0 mr-2">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tell us about your needs</h1>
            </div>
            
            <BotTypeSelector 
              value={botType} 
              onChange={(value) => {
                setBotType(value);
                if (errors.botType) {
                  setErrors({ ...errors, botType: '' });
                }
              }} 
            />
            
            {errors.botType && (
              <p className="text-sm text-red-500">{errors.botType}</p>
            )}
            
            <Button 
              onClick={handleAuth} 
              className="w-full mt-6" 
              disabled={loading}
            >
              {loading ? "Creating Account..." : "Create Account"}
            </Button>
          </>
        )}

        {!isForgotPassword && (
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setStep(1);
                setErrors({});
              }}
              className="text-sm text-primary hover:underline"
            >
              {isLogin
                ? "Don't have an account? Sign up"
                : "Already have an account? Sign in"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Auth;
