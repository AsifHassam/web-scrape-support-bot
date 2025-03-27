
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
      // Check if the user has admin credentials in localStorage
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
      
      // Check if email is hello@liorra.io (automatic admin privilege)
      const isAdminEmail = user?.email === "hello@liorra.io";
      
      // User is admin if they have valid localStorage credentials OR they have the admin email
      const isValidAdmin = isStillValid || isAdminEmail;
      
      if (isAdminEmail) {
        // If the user has the admin email, refresh their admin status
        localStorage.setItem("adminAuthenticated", "true");
        localStorage.setItem("adminAuthTime", Date.now().toString());
      }
      
      console.log("AdminRoute: admin status =", isValidAdmin);
      setIsAdmin(isValidAdmin);
      setCheckingAdmin(false);
    };
    
    if (!loading) {
      // Check admin status once loading is complete
      setTimeout(checkAdminStatus, 500);
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
