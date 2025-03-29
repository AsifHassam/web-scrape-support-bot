
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { SUBSCRIPTION_LIMITS, SubscriptionTier } from "@/lib/types/billing";
import SubscriptionUpgradeDialog from "@/components/billing/SubscriptionUpgradeDialog";

interface BotStatusToggleProps {
  botId: string;
  isLive: boolean;
  onStatusChange: (isLive: boolean) => void;
  className?: string;
  userSubscription?: SubscriptionTier;
  liveBotCount?: number;
}

const BotStatusToggle = ({
  botId,
  isLive,
  onStatusChange,
  className = "",
  userSubscription = 'STARTER',
  liveBotCount = 0,
}: BotStatusToggleProps) => {
  const [loading, setLoading] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(isLive);
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const { toast } = useToast();
  const maxLiveBots = SUBSCRIPTION_LIMITS[userSubscription].maxLiveBots;
  const isPremiumUser = userSubscription === 'PRO' || userSubscription === 'ENTERPRISE';

  // Enforce the live bot limit when the component mounts
  useEffect(() => {
    if (isLive) {
      // Check if this bot causes us to exceed the limit
      const currentLiveBots = isLive ? liveBotCount : liveBotCount + 1;
      if (currentLiveBots > maxLiveBots) {
        console.log(`Limit exceeded: ${currentLiveBots} > ${maxLiveBots}, deactivating bot ${botId}`);
        // Force deactivate if somehow the bot is live but exceeds the limit
        handleDeactivate();
      }
    }
  }, []);

  // Separate function for deactivation to use in the initial enforcement
  const handleDeactivate = async () => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from("bots")
        .update({ is_live: false })
        .eq("id", botId);

      if (error) throw error;

      // Only update local state after successful DB update
      setCurrentStatus(false);
      onStatusChange(false);
      
      toast({
        title: "Bot is now in draft mode",
        description: "Your bot is now in draft mode and won't be visible to users.",
      });
    } catch (error: any) {
      console.error("Error updating bot status:", error);
      toast({
        title: "Error updating status",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Re-check live bot count when trying to activate a bot
  useEffect(() => {
    if (!isLive && upgradeDialogOpen) {
      const checkLiveBots = async () => {
        const { data, error } = await supabase
          .from('bots')
          .select('id')
          .eq('is_live', true);
          
        if (!error && data && data.length < maxLiveBots) {
          // User deactivated another bot elsewhere, allow activation
          setUpgradeDialogOpen(false);
        }
      };
      
      checkLiveBots();
    }
  }, [liveBotCount, maxLiveBots, isLive, upgradeDialogOpen]);

  const handleToggle = async (checked: boolean, e: React.MouseEvent | React.ChangeEvent) => {
    // Stop event propagation to prevent card click
    e.stopPropagation();
    
    // If trying to set a bot live and we're at or above the limit, show upgrade dialog
    // But only for non-PRO/ENTERPRISE users
    if (checked && !currentStatus) {
      // Get the latest count of live bots
      const { data, error } = await supabase
        .from('bots')
        .select('id')
        .eq('is_live', true);
        
      if (error) {
        console.error("Error checking live bots:", error);
        toast({
          title: "Error",
          description: "Could not verify live bot count. Please try again.",
          variant: "destructive",
        });
        return;
      }
      
      // Use the fresh data from database to make the decision
      const currentLiveCount = data?.length || 0;
      console.log(`Current live count: ${currentLiveCount}, max: ${maxLiveBots}, subscription: ${userSubscription}, isPremium: ${isPremiumUser}`);
      
      // Only show upgrade dialog for non-premium users who have reached their limit
      if (currentLiveCount >= maxLiveBots && !isPremiumUser) {
        setUpgradeDialogOpen(true);
        return;
      }

      // For premium users or users under their limit, just proceed with the activation
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from("bots")
        .update({ is_live: checked })
        .eq("id", botId);

      if (error) throw error;

      // Only update local state after successful DB update
      setCurrentStatus(checked);
      onStatusChange(checked);
      
      toast({
        title: checked ? "Bot is now live" : "Bot is now in draft mode",
        description: checked 
          ? "Your bot is now visible to users." 
          : "Your bot is now in draft mode and won't be visible to users.",
      });
    } catch (error: any) {
      console.error("Error updating bot status:", error);
      toast({
        title: "Error updating status",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className={`flex items-center space-x-2 ${className}`} onClick={(e) => e.stopPropagation()}>
        <Switch
          checked={currentStatus}
          onCheckedChange={(checked) => handleToggle(checked, window.event || {} as any)}
          disabled={loading}
          className={loading ? "opacity-50 cursor-not-allowed" : ""}
        />
        <span className="text-sm font-medium">
          {currentStatus ? "Live" : "Draft"}
        </span>
      </div>
      
      <SubscriptionUpgradeDialog 
        open={upgradeDialogOpen} 
        onOpenChange={setUpgradeDialogOpen}
        currentTier={userSubscription}
      />
    </>
  );
};

export default BotStatusToggle;
