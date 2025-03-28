
import { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

// Production URL for redirects
const SITE_URL = window.location.origin || 'https://web-scrape-support-bot.lovable.app';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  signIn: (email: string, password: string) => Promise<{
    error: Error | null;
    data: Session | null;
  }>;
  signUp: (email: string, password: string) => Promise<{
    error: Error | null;
    data: { user: User | null; session: Session | null };
  }>;
  resetPassword: (token: string, newPassword: string) => Promise<{
    error: Error | null;
    data: { user: User | null };
  }>;
  signOut: () => Promise<void>;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    console.log("Setting up auth state listener");
    
    // First set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        console.log("Auth state changed:", event, currentSession?.user?.email);
        
        // Only update synchronously in the callback
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setLoading(false);
        
        if (event === 'SIGNED_OUT') {
          console.log("User signed out, redirecting to auth page");
          // We use setTimeout to defer this to avoid issues with React updates
          setTimeout(() => {
            navigate("/auth");
          }, 0);
        }
      }
    );

    // Then check for existing session
    const initializeAuth = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        console.log("Initial session check:", initialSession?.user?.email || "No session");
        
        if (!initialSession) {
          setLoading(false);
        }
      } catch (error) {
        console.error("Error checking initial session:", error);
        setLoading(false);
      }
    };
    
    initializeAuth();

    return () => {
      console.log("Cleaning up auth state listener");
      subscription.unsubscribe();
    };
  }, [navigate]);

  const signIn = async (email: string, password: string) => {
    try {
      console.log("Attempting sign in for:", email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error("Sign in error:", error.message);
      } else {
        console.log("Sign in successful for:", email);
      }
      
      return { error, data: data.session };
    } catch (error: any) {
      console.error("Exception during sign in:", error);
      return { error, data: null };
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      console.log("Attempting sign up for:", email);
      // Set the redirect URL when signing up to ensure proper redirection after email confirmation
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${SITE_URL}/auth`
        }
      });
      
      if (error) {
        console.error("Sign up error:", error.message);
      } else {
        console.log("Sign up successful for:", email);
      }
      
      return { error, data };
    } catch (error: any) {
      console.error("Exception during sign up:", error);
      return { error, data: { user: null, session: null } };
    }
  };

  const resetPassword = async (token: string, newPassword: string) => {
    try {
      console.log("Attempting password reset");
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) {
        console.error("Password reset error:", error.message);
      } else {
        console.log("Password reset successful");
      }
      
      return { error, data };
    } catch (error: any) {
      console.error("Exception during password reset:", error);
      return { error, data: { user: null } };
    }
  };

  const signOut = async () => {
    try {
      console.log("Signing out user");
      await supabase.auth.signOut();
      navigate("/auth");
    } catch (error) {
      console.error("Error during sign out:", error);
      toast.error("Failed to sign out properly");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        signIn,
        signUp,
        resetPassword,
        signOut,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
