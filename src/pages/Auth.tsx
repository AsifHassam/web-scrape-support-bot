import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

const Auth = () => {
  const [view, setView] = useState<"signin" | "signup" | "reset">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const [teamInviteId, setTeamInviteId] = useState<string | null>(null);
  
  useEffect(() => {
    // Check for team invitation in URL params
    const urlParams = new URLSearchParams(window.location.search);
    const inviteParam = urlParams.get('team_invite');
    if (inviteParam) {
      setTeamInviteId(inviteParam);
      setView('signup'); // Automatically show signup view for invited users
    }
    
    // Redirect if already signed in
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/dashboard");
      }
    };
    checkSession();
  }, [navigate]);

  const signIn = async (email: string, password: string) => {
    try {
      setSubmitting(true);
      setError("");
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        throw error;
      }
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Sign in error:", error);
      setError(error.error_description || error.message || "An error occurred during sign in");
    } finally {
      setSubmitting(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      setSubmitting(true);
      setError("");
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth`
        }
      });
      
      if (error) {
        throw error;
      }
      
      // If this is a team invitation, update the team member record with the new user ID
      if (teamInviteId && data.user) {
        const { error: teamError } = await supabase
          .from('team_members')
          .update({ 
            member_id: data.user.id,
            status: 'active',
            updated_at: new Date().toISOString()
          })
          .eq('id', teamInviteId);
          
        if (teamError) {
          console.error("Error updating team member:", teamError);
          // We don't want to block signup if this fails
        }
      }
      
      setSuccess(
        "Success! Please check your email for a confirmation link to complete your registration."
      );
    } catch (error: any) {
      console.error("Sign up error:", error);
      setError(error.error_description || error.message || "An error occurred during sign up");
    } finally {
      setSubmitting(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setSubmitting(true);
      setError("");
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth`,
      });
      if (error) {
        throw error;
      }
      setSuccess("Success! Please check your email for password reset instructions.");
    } catch (error: any) {
      console.error("Reset password error:", error);
      setError(error.error_description || error.message || "An error occurred during password reset");
    } finally {
      setSubmitting(false);
    }
  };

  const updatePassword = async (token: string, newPassword: string) => {
    try {
      setSubmitting(true);
      setError("");
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) {
        throw error;
      }
      setSuccess("Success! Your password has been updated.");
      setView("signin");
    } catch (error: any) {
      console.error("Update password error:", error);
      setError(error.error_description || error.message || "An error occurred while updating password");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
          {teamInviteId 
            ? "Create your account" 
            : view === "signin" 
              ? "Sign in to your account" 
              : view === "signup" 
                ? "Create an account" 
                : "Reset your password"}
        </h2>
        {teamInviteId && (
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            You've been invited to join a team
          </p>
        )}
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {success && (
            <div className="rounded-md bg-green-50 dark:bg-green-900 p-4 mb-4">
              <div className="text-sm font-medium text-green-800 dark:text-green-400">{success}</div>
            </div>
          )}

          {error && (
            <div className="rounded-md bg-red-50 dark:bg-red-900 p-4 mb-4">
              <div className="text-sm font-medium text-red-800 dark:text-red-400">{error}</div>
            </div>
          )}

          {view === "signin" && (
            <form className="space-y-6" onSubmit={(e) => {
              e.preventDefault();
              signIn(email, password);
            }}>
              <div>
                <Label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email address
                </Label>
                <div className="mt-1">
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Password
                </Label>
                <div className="mt-1">
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <Link to="#" onClick={() => setView("reset")} className="font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500">
                    Forgot your password?
                  </Link>
                </div>
              </div>

              <div>
                <Button
                  type="submit"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  disabled={submitting}
                >
                  {submitting ? "Signing in..." : "Sign in"}
                </Button>
              </div>
            </form>
          )}

          {view === "signup" && (
            <form className="space-y-6" onSubmit={(e) => {
              e.preventDefault();
              if (password !== confirmPassword) {
                setError("Passwords do not match");
                return;
              }
              signUp(email, password);
            }}>
              <div>
                <Label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email address
                </Label>
                <div className="mt-1">
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Password
                </Label>
                <div className="mt-1">
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Confirm Password
                </Label>
                <div className="mt-1">
                  <Input
                    id="confirm-password"
                    name="confirm-password"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <Button
                  type="submit"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  disabled={submitting}
                >
                  {submitting ? "Creating account..." : "Create account"}
                </Button>
              </div>
            </form>
          )}

          {view === "reset" && (
            <form className="space-y-6" onSubmit={(e) => {
              e.preventDefault();
              resetPassword(email);
            }}>
              <div>
                <Label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email address
                </Label>
                <div className="mt-1">
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <Button
                  type="submit"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  disabled={submitting}
                >
                  {submitting ? "Sending reset instructions..." : "Reset password"}
                </Button>
              </div>
            </form>
          )}

          {view === "update" && (
            <form className="space-y-6" onSubmit={(e) => {
              e.preventDefault();
              updatePassword(token, newPassword);
            }}>
              <div>
                <Label htmlFor="token" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Token
                </Label>
                <div className="mt-1">
                  <Input
                    id="token"
                    name="token"
                    type="text"
                    required
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="new-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  New Password
                </Label>
                <div className="mt-1">
                  <Input
                    id="new-password"
                    name="new-password"
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <Button
                  type="submit"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  disabled={submitting}
                >
                  {submitting ? "Updating password..." : "Update password"}
                </Button>
              </div>
            </form>
          )}
          
          {!teamInviteId && !success && (
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300 dark:border-gray-600" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                    {view === "signin" ? "New to our platform?" : "Already have an account?"}
                  </span>
                </div>
              </div>

              <div className="mt-6 text-center">
                <button
                  type="button"
                  className="font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 cursor-pointer"
                  onClick={() => setView(view === "signin" ? "signup" : "signin")}
                >
                  {view === "signin" ? "Create a new account" : "Sign in instead"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
