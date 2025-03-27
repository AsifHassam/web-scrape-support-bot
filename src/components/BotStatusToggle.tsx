
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { SUBSCRIPTION_LIMITS, SubscriptionTier } from "@/lib/types/billing";

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
  const { toast } = useToast();
  const maxLiveBots = SUBSCRIPTION_LIMITS[userSubscription].maxLiveBots;

  const handleToggle = async (checked: boolean, e: React.MouseEvent | React.ChangeEvent) => {
    // Stop event propagation to prevent card click
    e.stopPropagation();
    
    if (checked && liveBotCount >= maxLiveBots && !isLive) {
      toast({
        title: "Subscription limit reached",
        description: `Your ${userSubscription} plan allows a maximum of ${maxLiveBots} live bots. Please upgrade your plan or set another bot to draft.`,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from("bots")
        .update({ is_live: checked })
        .eq("id", botId);

      if (error) throw error;

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
    <div className={`flex items-center space-x-2 ${className}`} onClick={(e) => e.stopPropagation()}>
      <Switch
        checked={isLive}
        onCheckedChange={(checked) => handleToggle(checked, window.event || {} as any)}
        disabled={loading}
        className={loading ? "opacity-50 cursor-not-allowed" : ""}
      />
      <span className="text-sm font-medium">
        {isLive ? "Live" : "Draft"}
      </span>
    </div>
  );
};

export default BotStatusToggle;
