
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SUBSCRIPTION_LIMITS, SubscriptionTier } from "@/lib/types/billing";
import SubscriptionUpgradeDialog from "@/components/billing/SubscriptionUpgradeDialog";

interface BotStatusToggleProps {
  botId: string;
  isLive: boolean;
  userSubscription: SubscriptionTier;
  liveBotCount: number;
  onStatusChange: (isLive: boolean) => void;
  className?: string;
}

const BotStatusToggle = ({
  botId,
  isLive,
  userSubscription,
  liveBotCount,
  onStatusChange,
  className = "",
}: BotStatusToggleProps) => {
  const [loading, setLoading] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(isLive);
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const { toast } = useToast();
  const maxLiveBots = SUBSCRIPTION_LIMITS[userSubscription].maxLiveBots;

  const handleToggle = async (checked: boolean, e: React.MouseEvent | React.ChangeEvent) => {
    // Stop event propagation to prevent card click
    e.stopPropagation();
    
    // If trying to set a bot live and we're at the limit, show upgrade dialog
    if (checked && liveBotCount >= maxLiveBots && !isLive) {
      setUpgradeDialogOpen(true);
      return;
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
