
import { Button } from "@/components/ui/button";
import { ArrowLeft, User } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useEffect } from "react";

interface ConversationHeaderProps {
  botName: string;
}

const ConversationHeader: React.FC<ConversationHeaderProps> = ({ botName }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Scroll to top when route changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <header className="bg-white dark:bg-gray-800 shadow">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/dashboard")}
            className="mr-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
            {botName} - Conversations
          </h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <ThemeToggle />
          <Button variant="outline" size="sm" onClick={() => navigate("/profile")}>
            <User className="h-4 w-4 mr-2" />
            Profile
          </Button>
        </div>
      </div>
    </header>
  );
};

export default ConversationHeader;
