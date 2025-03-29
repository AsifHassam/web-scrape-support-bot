
import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoonIcon, SunIcon } from "@radix-ui/react-icons";
import { useTheme } from "@/components/theme-provider";
import { SubscriptionTier } from "@/lib/types/billing";

const Navbar = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { setTheme, theme } = useTheme();
  const [profile, setProfile] = useState<{ avatar_url: string | null; display_name: string | null }>({
    avatar_url: null,
    display_name: null,
  });
  const [subscriptionTier, setSubscriptionTier] = useState<SubscriptionTier | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        try {
          const { data, error } = await supabase
            .from('user_profiles')
            .select('avatar_url, display_name')
            .eq('id', user.id)
            .single();

          if (error) {
            console.error("Error fetching profile:", error);
          } else {
            setProfile({
              avatar_url: data?.avatar_url || null,
              display_name: data?.display_name || null,
            });
          }
        } catch (error) {
          console.error("Error fetching profile:", error);
        }
      }
    };
    
    if (user) {
      // Check user's subscription tier
      const checkSubscription = async () => {
        try {
          const { data, error } = await supabase
            .from('users_metadata')
            .select('payment_status')
            .eq('id', user.id)
            .single();
            
          if (error) throw error;
          
          setSubscriptionTier(data.payment_status as SubscriptionTier);
        } catch (error) {
          console.error("Error checking subscription:", error);
        }
      };
      
      checkSubscription();
    }

    fetchProfile();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const isPremiumUser = subscriptionTier === 'PRO' || subscriptionTier === 'ENTERPRISE';

  // Toggle theme function that correctly handles the Theme type
  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="shrink-0 flex items-center">
              <Link to="/dashboard">
                <img
                  className="h-8 w-auto"
                  src="https://tailwindui.com/img/logos/mark.svg?color=indigo&shade=500"
                  alt="Your Company"
                />
              </Link>
            </div>
            
            <div className="flex-1 flex justify-center px-2 lg:ml-6 lg:justify-start">
              <div className="max-w-lg w-full">
                <nav className="flex space-x-4">
                  <Link
                    to="/dashboard"
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      location.pathname === "/dashboard"
                        ? "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                        : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    }`}
                  >
                    Dashboard
                  </Link>
                  
                  {isPremiumUser && (
                    <Link
                      to="/team"
                      className={`px-3 py-2 rounded-md text-sm font-medium ${
                        location.pathname === "/team"
                          ? "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                          : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                      }`}
                    >
                      Team
                    </Link>
                  )}
                  
                </nav>
              </div>
            </div>
          </div>
          
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
            >
              <SunIcon className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <MoonIcon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile.avatar_url || `https://avatar.vercel.sh/${user?.email}.png`} alt={profile.display_name || "Avatar"} />
                    <AvatarFallback>{profile.display_name?.slice(0, 1).toUpperCase() || user?.email?.slice(0, 1).toUpperCase() || "U"}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{profile.display_name || user?.email}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => navigate("/profile")} >
                  Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={handleSignOut} className="cursor-pointer">
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
