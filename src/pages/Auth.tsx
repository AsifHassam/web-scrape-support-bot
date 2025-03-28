
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

// Production URL for redirects
const SITE_URL = window.location.origin || 'https://web-scrape-support-bot.lovable.app';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(false); // Default to sign up instead of login
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [resetPasswordSuccess, setResetPasswordSuccess] = useState(false);
  const [emailExistsMessage, setEmailExistsMessage] = useState<string | null>(null);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
      return;
    }
    
    // Check if we're on this page because of a password reset or email confirmation
    const params = new URLSearchParams(location.search);
    const resetToken = params.get('token') || params.get('access_token');
    const refreshToken = params.get('refresh_token');
    const type = params.get('type');
    
    // Handle callback URLs with tokens (for password resets, email confirmation)
    const handleAuthCallback = async () => {
      if (resetToken && type === 'recovery') {
        // This is a password reset flow
        setIsForgotPassword(true);
      } else if (resetToken && refreshToken) {
        // This is probably an email confirmation or OAuth callback
        try {
          const { data, error } = await supabase.auth.setSession({
            access_token: resetToken,
            refresh_token: refreshToken
          });
          
          if (error) {
            toast.error("Authentication failed. Please try signing in again.");
          } else if (data.session) {
            toast.success("Authentication successful!");
            navigate("/dashboard");
          }
        } catch (error) {
          console.error("Exception when handling auth callback:", error);
        }
      }
      
      // Check URL for signup parameter
      if (params.get('signup') === 'true') {
        setIsLogin(false);
      }
    };
    
    handleAuthCallback();
  }, [user, navigate, location]);

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
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Improved method to check if an email exists in Supabase auth
  const checkEmailExists = async (email: string) => {
    try {
      setIsCheckingEmail(true);
      
      // More reliable way to check if an email exists
      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false // This will fail if the user doesn't exist
        }
      });
      
      // If there's no error about the user not existing, then the email exists
      const exists = !error || !error.message.includes("Email not found");
      
      if (exists) {
        setEmailExistsMessage("This email is already registered. Would you like to sign in or reset your password?");
      } else {
        setEmailExistsMessage(null);
      }
      
      return exists;
    } catch (error) {
      console.error("Error checking email:", error);
      return false;
    } finally {
      setIsCheckingEmail(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);

    try {
      if (isForgotPassword) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${SITE_URL}/auth?reset=true`,
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
          if (error.message?.includes("Email not confirmed")) {
            toast.error("Please confirm your email before logging in");
          } else if (error.message?.includes("Invalid login credentials")) {
            toast.error("Invalid email or password");
          } else {
            toast.error(error.message || "Authentication error");
          }
          throw error;
        }
        toast.success("Successfully logged in!");
        navigate("/dashboard");
      } else {
        // Always check if email exists before attempting signup
        const emailExists = await checkEmailExists(email);
        
        if (emailExists) {
          // Email exists, don't proceed with signup
          setLoading(false);
          return;
        }
        
        const { error, data } = await signUp(email, password);
        if (error) {
          if (error.message?.includes("User already registered")) {
            toast.error("This email is already registered");
            setEmailExistsMessage("This email is already registered. Would you like to sign in or reset your password?");
          } else {
            toast.error(error.message || "Registration error");
          }
          throw error;
        }

        if (data.session) {
          // If session is present, user is auto-confirmed (dev mode)
          toast.success("Registration successful! Redirecting to login...");
          // Switch to login mode after successful signup
          setIsLogin(true);
          setPassword("");
        } else {
          toast.success("Registration successful! Please check your email for confirmation.");
          // Switch to login mode after successful signup
          setIsLogin(true);
          setPassword("");
        }
      }
    } catch (error: any) {
      console.error("Auth error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setIsForgotPassword(false);
    setResetPasswordSuccess(false);
    setEmailExistsMessage(null);
  };

  const handleBlurEmail = async () => {
    // Only check email existence on sign up form and when we have a valid email
    if (!isLogin && email && email.match(/\S+@\S+\.\S+/)) {
      await checkEmailExists(email);
    } else {
      setEmailExistsMessage(null);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${SITE_URL}/auth`
        }
      });
      
      if (error) {
        toast.error(error.message);
        throw error;
      }
    } catch (error: any) {
      console.error("Google sign in error:", error);
    } finally {
      setLoading(false);
    }
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

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loading}
                >
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
        ) : (
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
                  onBlur={handleBlurEmail}
                  className={errors.email ? "border-red-500" : ""}
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email}</p>
                )}
                {isCheckingEmail && (
                  <p className="text-sm text-gray-500">Checking email...</p>
                )}
                {emailExistsMessage && (
                  <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-md text-sm">
                    <p className="text-blue-700 dark:text-blue-300">{emailExistsMessage}</p>
                    <div className="flex space-x-2 mt-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                          setIsLogin(true);
                          setEmailExistsMessage(null);
                        }}
                      >
                        Sign In
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                          setIsForgotPassword(true);
                          setEmailExistsMessage(null);
                        }}
                      >
                        Reset Password
                      </Button>
                    </div>
                  </div>
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

              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading || isCheckingEmail || !!emailExistsMessage}
              >
                {loading
                  ? "Processing..."
                  : isLogin
                  ? "Sign In"
                  : "Sign Up"}
              </Button>

              <div className="relative my-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">
                    or continue with
                  </span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full flex items-center justify-center gap-2"
                onClick={handleGoogleSignIn}
                disabled={loading}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"></path>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"></path>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"></path>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"></path>
                  <path d="M1 1h22v22H1z" fill="none"></path>
                </svg>
                Sign in with Google
              </Button>
            </form>
          </>
        )}

        {!isForgotPassword && !emailExistsMessage && (
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setErrors({});
                setEmailExistsMessage(null);
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
