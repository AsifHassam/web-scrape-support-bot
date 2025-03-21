
import { useState, useEffect } from 'react';

export function useScrollProgress() {
  const [progress, setProgress] = useState(0);
  
  useEffect(() => {
    const updateScroll = () => {
      // Calculate how far the user has scrolled through the page
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = scrollTop / docHeight || 0;
      setProgress(scrollPercent);
    };
    
    // Add scroll event listener
    window.addEventListener('scroll', updateScroll);
    
    // Initial calculation
    updateScroll();
    
    // Cleanup
    return () => window.removeEventListener('scroll', updateScroll);
  }, []);
  
  return progress;
}
