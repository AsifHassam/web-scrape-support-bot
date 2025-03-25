
import { useState } from "react";
import { cn } from "@/lib/utils";
import { MessageSquare, User, Bot, Archive } from "lucide-react";

interface TabItem {
  value: string;
  label: string;
  icon: JSX.Element;
  count?: number;
}

interface VerticalTabsProps {
  defaultValue: string;
  tabs: TabItem[];
  onValueChange: (value: string) => void;
}

export const VerticalTabs = ({
  defaultValue,
  tabs,
  onValueChange
}: VerticalTabsProps) => {
  const [activeTab, setActiveTab] = useState(defaultValue);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    onValueChange(value);
  };

  return (
    <div className="flex flex-col space-y-1 w-full">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => handleTabChange(tab.value)}
          className={cn(
            "flex items-center space-x-3 px-4 py-3 text-sm font-medium rounded-md transition-colors",
            activeTab === tab.value
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          {tab.icon}
          <span>{tab.label}</span>
          {tab.count !== undefined && (
            <span className={cn(
              "ml-auto rounded-full px-2 py-0.5 text-xs font-medium",
              activeTab === tab.value
                ? "bg-primary-foreground/20 text-primary-foreground"
                : "bg-muted-foreground/20 text-muted-foreground"
            )}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
};
