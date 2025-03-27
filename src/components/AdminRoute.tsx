
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [checkingAdmin, setCheckingAdmin] = useState<boolean>(true);
  
  useEffect(() => {
    console.log("AdminRoute: checking admin status, user:", user?.email);
    
    const checkAdminStatus = async () => {
      if (!user) {
        console.log("AdminRoute: no user found");
        setIsAdmin(false);
        setCheckingAdmin(false);
        return;
      }
      
      try {
        // Check admin status in the database using our is_admin function
        const { data, error } = await supabase.rpc('is_admin', {
          user_id: user.id
        });
        
        if (error) {
          console.error("AdminRoute: error checking admin status:", error);
          setIsAdmin(false);
        } else {
          console.log("AdminRoute: admin status =", data);
          setIsAdmin(data === true);
          
          // If admin, we still store this in localStorage for faster checks
          // on subsequent requests, but the source of truth is the database
          if (data === true) {
            localStorage.setItem("adminAuthenticated", "true");
            localStorage.setItem("adminAuthTime", Date.now().toString());
          }
        }
      } catch (error) {
        console.error("AdminRoute: exception checking admin status:", error);
        setIsAdmin(false);
      }
      
      setCheckingAdmin(false);
    };
    
    if (!loading) {
      // Check admin status once loading is complete
      checkAdminStatus();
    }
  }, [user, loading]); // Re-check when auth state or loading changes

  // Show loading state while checking authentication
  if (loading || checkingAdmin) {
    console.log("AdminRoute: still loading or checking admin status");
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    );
  }
  
  // If not admin, redirect to admin login
  if (!isAdmin) {
    console.log("AdminRoute: user not admin, redirecting to admin login");
    return <Navigate to="/admin/login" replace />;
  }
  
  // Render children if authenticated and admin
  console.log("AdminRoute: user is admin, rendering admin dashboard");
  return <>{children}</>;
};

export default AdminRoute;
