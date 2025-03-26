
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
    console.log("AdminRoute: checking admin status");
    // Check if admin is authenticated via localStorage
    const adminAuthenticated = localStorage.getItem("adminAuthenticated") === "true";
    console.log("AdminRoute: adminAuthenticated =", adminAuthenticated);
    setIsAdmin(adminAuthenticated);
    setCheckingAdmin(false);
  }, [user]); // Re-check when auth state changes

  // Show loading state while checking authentication
  if (loading || checkingAdmin) {
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
