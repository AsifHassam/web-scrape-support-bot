
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();
  
  // Log authentication state for debugging
  useEffect(() => {
    console.log("ProtectedRoute: checking auth state", { 
      isAuthenticated: !!user, 
      loading, 
      userEmail: user?.email 
    });
  }, [user, loading]);
  
  // Show loading state while checking authentication
  if (loading) {
    console.log("ProtectedRoute: still loading auth state");
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    );
  }
  
  // Redirect to login if not authenticated
  if (!user) {
    console.log("ProtectedRoute: user not authenticated, redirecting to login");
    return <Navigate to="/auth" replace />;
  }
  
  // Render children if authenticated
  console.log("ProtectedRoute: user is authenticated, rendering protected content");
  return <>{children}</>;
};

export default ProtectedRoute;
