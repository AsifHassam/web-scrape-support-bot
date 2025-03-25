
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useScrollProgress } from '@/hooks/useScrollProgress';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

export const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const scrollProgress = useScrollProgress();
  const { user } = useAuth();
  
  useEffect(() => {
    setIsScrolled(scrollProgress > 0.01);
  }, [scrollProgress]);
  
  const handleNavLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };
  
  return (
    <header className={cn(
      "fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out",
      isScrolled ? "bg-white/80 dark:bg-gray-950/80 backdrop-blur-md shadow-sm" : "bg-transparent"
    )}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 sm:h-20 flex items-center justify-between">
          <div className="flex items-center">
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
          
          <nav className="hidden md:flex items-center space-x-8">
            <a 
              href="#features" 
              onClick={(e) => handleNavLinkClick(e, 'features')}
              className="text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors"
            >
              Features
            </a>
            <a 
              href="#how-it-works" 
              onClick={(e) => handleNavLinkClick(e, 'how-it-works')}
              className="text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors"
            >
              How It Works
            </a>
            <Link 
              to="/pricing"
              className="text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors"
            >
              Pricing
            </Link>
          </nav>
          
          <div className="flex items-center space-x-4">
            {user ? (
              <Link to="/dashboard">
                <Button variant="outline" size="sm" className="hidden sm:inline-flex">
                  Dashboard
                </Button>
              </Link>
            ) : (
              <Link to="/auth">
                <Button 
                  variant="outline"
                  size="sm" 
                  className="hidden sm:inline-flex items-center"
                >
                  Login
                </Button>
              </Link>
            )}
            <Link
              to="/auth?signup=true" 
              className="hidden sm:inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 transition-colors duration-200"
            >
              Get Started
            </Link>
          </div>
        </div>
      </div>
      
      {/* Progress bar */}
      <div 
        className="h-0.5 bg-primary transition-all duration-200 ease-out"
        style={{ width: `${scrollProgress * 100}%` }} 
      />
    </header>
  );
};

export default Navbar;
