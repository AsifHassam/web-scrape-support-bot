
import React from "react";
import { useNavigate } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";

interface AdminHeaderProps {
  title: string;
  onSignOut: () => void;
}

const AdminHeader: React.FC<AdminHeaderProps> = ({ title, onSignOut }) => {
  const navigate = useNavigate();

  return (
    <header className="bg-white dark:bg-gray-800 shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h1>
        <div className="flex items-center space-x-4">
          <ThemeToggle />
          <Button variant="outline" size="sm" onClick={() => navigate("/dashboard")}>
            Dashboard
          </Button>
          <Button variant="outline" size="sm" onClick={onSignOut}>
            Log Out
          </Button>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
