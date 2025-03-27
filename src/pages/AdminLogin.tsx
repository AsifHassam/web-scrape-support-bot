
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/ThemeToggle";
import { toast } from "sonner";
import { Lock, LogIn } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const AdminLogin = () => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate();
  const { user, signIn } = useAuth();

  // Check if user is already logged in as admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (user) {
        try {
          // Check if the user is an admin in the database
          const { data, error } = await supabase.rpc('is_admin', {
            user_id: user.id
          });
          
          if (error) {
            console.error("Error checking admin status:", error);
            return;
          }
          
          if (data === true) {
            console.log("User is already an admin, redirecting to dashboard");
            localStorage.setItem("adminAuthenticated", "true");
            localStorage.setItem("adminAuthTime", Date.now().toString());
            navigate("/admin", { replace: true });
          }
        } catch (error) {
          console.error("Exception checking admin status:", error);
        }
      }
    };
    
    checkAdminStatus();
  }, [user, navigate]);

  // Special handler for the known admin account
  const ensureAdminUser = async (email: string, userId: string) => {
    if (email === 'hello@liorra.io') {
      try {
        // First, check if this user is already in the admin_users table
        const { data: existingAdmin, error: checkError } = await supabase
          .from('admin_users')
          .select('*')
          .eq('id', userId)
          .single();

        if (checkError && !checkError.message.includes('No rows found')) {
          console.error("Error checking admin status:", checkError);
          return false;
        }

        // If not in admin_users table, add them
        if (!existingAdmin) {
          const { error: insertError } = await supabase
            .from('admin_users')
            .insert([{ id: userId, is_admin: true }]);

          if (insertError) {
            console.error("Error inserting admin user:", insertError);
            return false;
          }
          
          console.log("Added user to admin_users table");
        } else if (!existingAdmin.is_admin) {
          // If in table but not admin, update them
          const { error: updateError } = await supabase
            .from('admin_users')
            .update({ is_admin: true })
            .eq('id', userId);

          if (updateError) {
            console.error("Error updating admin status:", updateError);
            return false;
          }
          
          console.log("Updated user admin status to true");
        }

        return true;
      } catch (error) {
        console.error("Error ensuring admin status:", error);
        return false;
      }
    }
    return false;
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // First authenticate with Supabase
      const { data: authData, error: authError } = await signIn(email, password);
      
      if (authError) {
        throw new Error(authError.message);
      }
      
      if (!authData?.user) {
        throw new Error("Authentication failed");
      }
      
      // For known admin email, ensure they have admin privileges
      if (email === 'hello@liorra.io') {
        const adminEnsured = await ensureAdminUser(email, authData.user.id);
        if (adminEnsured) {
          console.log("Successfully set admin privileges for:", email);
        }
      }
      
      // Then check if this user is an admin
      const { data: isAdminData, error: isAdminError } = await supabase.rpc('is_admin', {
        user_id: authData.user.id
      });
      
      if (isAdminError) {
        throw new Error(isAdminError.message);
      }
      
      if (isAdminData !== true) {
        throw new Error("Not authorized as admin");
      }
      
      // Store admin status in localStorage with timestamp
      localStorage.setItem("adminAuthenticated", "true");
      localStorage.setItem("adminAuthTime", Date.now().toString());
      
      toast.success("Admin login successful");
      
      // Redirect to admin dashboard
      setTimeout(() => {
        navigate("/admin", { replace: true });
      }, 1000);
      
    } catch (err: any) {
      setError(err.message || "An error occurred during login");
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <header className="w-full p-4 flex justify-end">
        <ThemeToggle />
      </header>
      
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-md p-8 space-y-8 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">Admin Login</h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Enter admin credentials to access the dashboard
            </p>
          </div>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative dark:bg-red-900/30 dark:text-red-400 dark:border-red-800" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}
          
          <form className="mt-8 space-y-6" onSubmit={handleAdminLogin}>
            <div className="rounded-md shadow-sm -space-y-px">
              <div className="mb-4">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <div className="relative">
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    className="pl-10"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                </div>
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                    className="pl-10"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <Button
                type="submit"
                className="w-full flex justify-center"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <LogIn className="mr-2 h-4 w-4" />
                    Login as Admin
                  </span>
                )}
              </Button>
            </div>
          </form>
          
          <div className="text-center mt-4">
            <Button 
              variant="link" 
              onClick={() => navigate("/")}
              className="text-sm text-gray-600 dark:text-gray-400"
            >
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
