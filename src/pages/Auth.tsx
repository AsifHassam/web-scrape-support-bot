
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

// Production URL for redirects
const SITE_URL = 'https://web-scrape-support-bot.lovable.app';

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
  const [autoLoginAfterSignup, setAutoLoginAfterSignup] = useState(false);
  // Rate limiting states
  const [cooldownActive, setCooldownActive] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Cooldown timer effect
  useEffect(() => {
    let interval: number | undefined;
    
    if (cooldownActive && cooldownSeconds > 0) {
      interval = window.setInterval(() => {
        setCooldownSeconds((prev) => {
          if (prev <= 1) {
            setCooldownActive(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [cooldownActive, cooldownSeconds]);

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
    
    // Check if the URL has a specific query param to show signup
    const params = new URLSearchParams(location.search);
    if (params.get('signup') === 'true') {
      setIsLogin(false);
    }

    // Check if we need to auto login after signup
    if (autoLoginAfterSignup && email && password) {
      handleAutoLogin();
      setAutoLoginAfterSignup(false);
    }
  }, [user, navigate, location, autoLoginAfterSignup]);

  const handleAutoLogin = async () => {
    try {
      setLoading(true);
      const { error } = await signIn(email, password);
      if (error) {
        console.error("Auto login failed:", error);
        return;
      }
      
      toast.success("Successfully logged in!");
      navigate("/dashboard");
    } catch (error) {
      console.error("Auto login error:", error);
    } finally {
      setLoading(false);
    }
  };

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

  const checkEmailExists = async (email: string) => {
    try {
      setIsCheckingEmail(true);
      
      // Try to sign up with an empty password to check if the email exists
      // This is a technique to use Supabase's auth system to check for existing users
      const { error } = await supabase.auth.signUp({
        email,
        password: "temporary_password_for_check_only",
      });
      
      let exists = false;
      
      // Email already registered error indicates the email exists
      if (error?.message?.includes("User already registered")) {
        exists = true;
        setEmailExistsMessage("This email is already registered. Would you like to sign in or reset your password?");
      } else if (error?.message?.includes("For security purposes, you can only request this")) {
        // Handle rate limiting error
        const secondsMatch = error.message.match(/after (\d+) seconds/);
        const waitSeconds = secondsMatch ? parseInt(secondsMatch[1], 10) : 60;
        
        setCooldownSeconds(waitSeconds);
        setCooldownActive(true);
        toast.error(`Rate limit reached. Please try again in ${waitSeconds} seconds.`);
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

  // Helper to manually verify user email in development
  const verifyUserEmailManually = async (email: string) => {
    try {
      console.log("Attempting to manually verify email:", email);
      
      // For admin accounts with hello@liorra.io email, let's specifically check and set admin status
      if (email === 'hello@liorra.io') {
        const { data: isAdminData, error: isAdminError } = await supabase.rpc('is_admin', {
          user_id: (await supabase.auth.getUser()).data.user?.id
        });
        
        if (isAdminError) {
          console.error("Error checking admin status:", isAdminError);
        } else {
          console.log("User admin status:", isAdminData);
        }
      }

      return true;
    } catch (error) {
      console.error("Error verifying email manually:", error);
      return false;
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (cooldownActive) {
      toast.error(`Please wait ${cooldownSeconds} seconds before trying again.`);
      return;
    }
    
    if (!validateForm()) return;
    
    setLoading(true);

    try {
      if (isForgotPassword) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${SITE_URL}/auth?reset=true`,
        });
        
        if (error) {
          // Handle rate limiting error
          if (error.message.includes("For security purposes, you can only request this")) {
            const secondsMatch = error.message.match(/after (\d+) seconds/);
            const waitSeconds = secondsMatch ? parseInt(secondsMatch[1], 10) : 60;
            
            setCooldownSeconds(waitSeconds);
            setCooldownActive(true);
            toast.error(`Rate limit reached. Please try again in ${waitSeconds} seconds.`);
          } else {
            toast.error(error.message);
          }
          throw error;
        }
        
        setResetPasswordSuccess(true);
        toast.success("Password reset email sent! Check your inbox.");
      } else if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes("Email not confirmed")) {
            toast.error("Please confirm your email before logging in");
            
            // In development, offer to manually verify the email
            const manualVerification = await verifyUserEmailManually(email);
            if (manualVerification) {
              toast.success("Email verified manually. Please try logging in again.");
              // Trigger auto-login after a delay
              setTimeout(() => handleAutoLogin(), 1500);
            }
          } else if (error.message.includes("Invalid login credentials")) {
            toast.error("Invalid email or password");
          } else if (error.message.includes("For security purposes, you can only request this")) {
            // Handle rate limiting error
            const secondsMatch = error.message.match(/after (\d+) seconds/);
            const waitSeconds = secondsMatch ? parseInt(secondsMatch[1], 10) : 60;
            
            setCooldownSeconds(waitSeconds);
            setCooldownActive(true);
            toast.error(`Rate limit reached. Please try again in ${waitSeconds} seconds.`);
          } else {
            toast.error(error.message);
          }
          throw error;
        }
        toast.success("Successfully logged in!");
        navigate("/dashboard");
      } else {
        // Check if email exists before attempting signup
        const emailExists = await checkEmailExists(email);
        
        if (emailExists) {
          // Email exists, don't proceed with signup
          setLoading(false);
          return;
        }
        
        if (cooldownActive) {
          // Don't proceed if we're in cooldown
          setLoading(false);
          return;
        }
        
        // Direct signup without the bot type selection
        const { error, data } = await signUp(email, password);
        if (error) {
          if (error.message.includes("User already registered")) {
            toast.error("This email is already registered");
          } else if (error.message.includes("For security purposes, you can only request this")) {
            // Handle rate limiting error
            const secondsMatch = error.message.match(/after (\d+) seconds/);
            const waitSeconds = secondsMatch ? parseInt(secondsMatch[1], 10) : 60;
            
            setCooldownSeconds(waitSeconds);
            setCooldownActive(true);
            toast.error(`Rate limit reached. Please try again in ${waitSeconds} seconds.`);
          } else {
            toast.error(error.message);
          }
          throw error;
        }

        // Dev environment: try to auto-verify email
        if (data?.user?.id) {
          const verified = await verifyUserEmailManually(email);
          if (verified) {
            toast.success("Email verified automatically in development. Logging you in...");
            setAutoLoginAfterSignup(true);
          } else {
            toast.success("Registration successful! Please check your email for confirmation.");
          }
        } else {
          toast.success("Registration successful! Please check your email for confirmation.");
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
    if (cooldownActive) {
      return; // Don't check if we're in cooldown
    }
    
    if (!isLogin && email && email.match(/\S+@\S+\.\S+/)) {
      await checkEmailExists(email);
    } else {
      setEmailExistsMessage(null);
    }
  };

  const handleGoogleSignIn = async () => {
    if (cooldownActive) {
      toast.error(`Please wait ${cooldownSeconds} seconds before trying again.`);
      return;
    }
    
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${SITE_URL}/auth`
        }
      });
      
      if (error) {
        if (error.message.includes("For security purposes, you can only request this")) {
          // Handle rate limiting error
          const secondsMatch = error.message.match(/after (\d+) seconds/);
          const waitSeconds = secondsMatch ? parseInt(secondsMatch[1], 10) : 60;
          
          setCooldownSeconds(waitSeconds);
          setCooldownActive(true);
          toast.error(`Rate limit reached. Please try again in ${waitSeconds} seconds.`);
        } else {
          toast.error(error.message);
        }
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
        {cooldownActive && (
          <div className="bg-yellow-50 dark:bg-yellow-900/30 p-4 rounded-lg text-yellow-800 dark:text-yellow-300 mb-4">
            <p className="font-semibold">Rate limit reached</p>
            <p className="text-sm mt-1">
              For security purposes, please wait {cooldownSeconds} seconds before trying again.
            </p>
          </div>
        )}
        
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
                  disabled={loading || cooldownActive}
                >
                  {loading ? "Sending..." : cooldownActive ? `Wait ${cooldownSeconds}s` : "Send Reset Link"}
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
                disabled={loading || isCheckingEmail || !!emailExistsMessage || cooldownActive}
              >
                {loading
                  ? "Processing..."
                  : cooldownActive
                  ? `Wait ${cooldownSeconds}s`
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
                disabled={loading || cooldownActive}
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
