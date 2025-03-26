
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [checkingAdmin, setCheckingAdmin] = useState<boolean>(true);
  
  useEffect(() => {
    console.log("AdminRoute: checking admin status, user:", user?.email);
    
    const checkAdminStatus = () => {
      // Check if admin is authenticated via localStorage
      const adminAuthenticated = localStorage.getItem("adminAuthenticated") === "true";
      
      // Add a time-based check to require re-authentication after 8 hours
      const adminAuthTime = localStorage.getItem("adminAuthTime");
      const now = Date.now();
      const eightHoursMs = 8 * 60 * 60 * 1000;
      
      let isStillValid = adminAuthenticated;
      
      if (adminAuthTime) {
        const authTimeMs = parseInt(adminAuthTime);
        if (now - authTimeMs > eightHoursMs) {
          // Admin session expired
          console.log("AdminRoute: admin session expired");
          localStorage.removeItem("adminAuthenticated");
          localStorage.removeItem("adminAuthTime");
          isStillValid = false;
        }
      }
      
      console.log("AdminRoute: adminAuthenticated =", isStillValid);
      setIsAdmin(isStillValid);
      setCheckingAdmin(false);
    };
    
    if (user) {
      // If user is authenticated with Supabase, check admin status
      setTimeout(checkAdminStatus, 500);
    } else {
      // If no user, definitely not an admin
      setIsAdmin(false);
      setCheckingAdmin(false);
    }
  }, [user]); // Re-check when auth state changes

  // Show loading state while checking authentication
  if (loading || checkingAdmin) {
    console.log("AdminRoute: still loading or checking admin status");
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    );
  }
  
  // Check if user is authenticated first
  if (!user) {
    console.log("AdminRoute: user not authenticated, redirecting to admin login");
    return <Navigate to="/admin/login" replace />;
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
