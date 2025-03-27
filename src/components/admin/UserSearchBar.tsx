
import React from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface UserSearchBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

const UserSearchBar: React.FC<UserSearchBarProps> = ({
  searchTerm,
  onSearchChange
}) => {
  return (
    <div className="relative w-full sm:w-72">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
      <Input
        placeholder="Search users by email..."
        className="pl-10"
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
      />
    </div>
  );
};

export default UserSearchBar;
