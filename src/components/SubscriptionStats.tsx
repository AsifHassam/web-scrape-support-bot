
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowUp } from "lucide-react";
import { SUBSCRIPTION_LIMITS, SubscriptionTier } from "@/lib/types/billing";
import { useNavigate } from "react-router-dom";

interface SubscriptionStatsProps {
  tier: SubscriptionTier;
  messageCount: number;
  conversationCount: number;
  botCount: number;
  teamMemberCount: number;
}

const SubscriptionStats = ({
  tier,
  messageCount,
  conversationCount,
  botCount,
  teamMemberCount
}: SubscriptionStatsProps) => {
  const navigate = useNavigate();
  const limits = SUBSCRIPTION_LIMITS[tier];
  
  const calculatePercentage = (current: number, max: number) => {
    return Math.min(Math.round((current / max) * 100), 100);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(2) + ' Million';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Messages Used
              </span>
              <span className="text-sm font-medium">
                {messageCount} / {formatNumber(limits.maxMessages)}
              </span>
            </div>
            <Progress
              value={calculatePercentage(messageCount, limits.maxMessages)}
              className="h-2"
            />

            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Active Conversations
              </span>
              <span className="text-sm font-medium">
                {conversationCount} / {formatNumber(limits.maxConversations)}
              </span>
            </div>
            <Progress
              value={calculatePercentage(conversationCount, limits.maxConversations)}
              className="h-2"
            />

            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Live Chatbots
              </span>
              <span className="text-sm font-medium">
                {botCount} / {limits.maxLiveBots}
              </span>
            </div>
            <Progress
              value={calculatePercentage(botCount, limits.maxLiveBots)}
              className="h-2"
            />

            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Team Members
              </span>
              <span className="text-sm font-medium">
                {teamMemberCount} / {limits.maxTeamMembers}
              </span>
            </div>
            <Progress
              value={calculatePercentage(teamMemberCount, limits.maxTeamMembers)}
              className="h-2"
            />
          </div>
        </CardContent>
      </Card>
      
      {tier !== 'ENTERPRISE' && (
        <Button 
          className="w-full flex items-center justify-center gap-2" 
          variant="default"
          onClick={() => navigate("/pricing")}
        >
          <ArrowUp className="h-4 w-4" />
          Upgrade Plan
        </Button>
      )}
    </div>
  );
};

export default SubscriptionStats;
