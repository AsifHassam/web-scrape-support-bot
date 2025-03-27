
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { SUBSCRIPTION_LIMITS, SubscriptionTier } from "@/lib/types/billing";

interface SubscriptionUpgradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentTier: SubscriptionTier;
}

interface PlanFeatureProps {
  title: string;
  tiers: Record<SubscriptionTier, string | number | boolean>;
  formatter?: (value: string | number | boolean) => string;
}

const PlanFeature = ({ title, tiers, formatter }: PlanFeatureProps) => {
  const format = (value: string | number | boolean): string => {
    if (formatter) return formatter(value);
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    return String(value);
  };

  return (
    <div className="grid grid-cols-4 py-2 border-b border-gray-100 dark:border-gray-800">
      <div className="col-span-1 font-medium text-sm">{title}</div>
      <div className="col-span-1 text-center text-sm">{format(tiers.STARTER)}</div>
      <div className="col-span-1 text-center text-sm">{format(tiers.PRO)}</div>
      <div className="col-span-1 text-center text-sm">{format(tiers.ENTERPRISE)}</div>
    </div>
  );
};

const SubscriptionUpgradeDialog = ({ 
  open, 
  onOpenChange,
  currentTier
}: SubscriptionUpgradeDialogProps) => {
  const navigate = useNavigate();
  
  const tierColors = {
    STARTER: "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300",
    PRO: "bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300",
    ENTERPRISE: "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300"
  };
  
  const tierPrices = {
    STARTER: '$9/month',
    PRO: '$29/month',
    ENTERPRISE: '$99/month'
  };

  const handleUpgrade = () => {
    navigate("/pricing");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-2xl mb-2">Upgrade Your Plan</DialogTitle>
          <DialogDescription>
            Choose the plan that best fits your needs
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-4 overflow-x-auto">
          {/* Plan Headers */}
          <div className="grid grid-cols-4 mb-4">
            <div className="col-span-1"></div>
            <div className="col-span-1 flex flex-col items-center">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${tierColors.STARTER}`}>STARTER</span>
              <span className="mt-2 font-bold text-lg">{tierPrices.STARTER}</span>
            </div>
            <div className="col-span-1 flex flex-col items-center">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${tierColors.PRO}`}>PRO</span>
              <span className="mt-2 font-bold text-lg">{tierPrices.PRO}</span>
            </div>
            <div className="col-span-1 flex flex-col items-center">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${tierColors.ENTERPRISE}`}>ENTERPRISE</span>
              <span className="mt-2 font-bold text-lg">{tierPrices.ENTERPRISE}</span>
            </div>
          </div>
          
          {/* Features */}
          <div className="space-y-1">
            <PlanFeature 
              title="Messages" 
              tiers={{
                TRIAL: SUBSCRIPTION_LIMITS.TRIAL.maxMessages,
                STARTER: SUBSCRIPTION_LIMITS.STARTER.maxMessages,
                PRO: SUBSCRIPTION_LIMITS.PRO.maxMessages,
                ENTERPRISE: SUBSCRIPTION_LIMITS.ENTERPRISE.maxMessages
              }}
              formatter={(val) => val.toLocaleString()}
            />
            <PlanFeature 
              title="Conversations" 
              tiers={{
                TRIAL: SUBSCRIPTION_LIMITS.TRIAL.maxConversations,
                STARTER: SUBSCRIPTION_LIMITS.STARTER.maxConversations,
                PRO: SUBSCRIPTION_LIMITS.PRO.maxConversations,
                ENTERPRISE: SUBSCRIPTION_LIMITS.ENTERPRISE.maxConversations
              }}
              formatter={(val) => val.toLocaleString()}
            />
            <PlanFeature 
              title="Live Bots" 
              tiers={{
                TRIAL: SUBSCRIPTION_LIMITS.TRIAL.maxLiveBots,
                STARTER: SUBSCRIPTION_LIMITS.STARTER.maxLiveBots,
                PRO: SUBSCRIPTION_LIMITS.PRO.maxLiveBots,
                ENTERPRISE: SUBSCRIPTION_LIMITS.ENTERPRISE.maxLiveBots
              }}
            />
            <PlanFeature 
              title="Team Members" 
              tiers={{
                TRIAL: SUBSCRIPTION_LIMITS.TRIAL.maxTeamMembers,
                STARTER: SUBSCRIPTION_LIMITS.STARTER.maxTeamMembers,
                PRO: SUBSCRIPTION_LIMITS.PRO.maxTeamMembers,
                ENTERPRISE: SUBSCRIPTION_LIMITS.ENTERPRISE.maxTeamMembers
              }}
            />
            <PlanFeature 
              title="Advanced Analytics" 
              tiers={{
                TRIAL: SUBSCRIPTION_LIMITS.TRIAL.advancedAnalytics,
                STARTER: SUBSCRIPTION_LIMITS.STARTER.advancedAnalytics,
                PRO: SUBSCRIPTION_LIMITS.PRO.advancedAnalytics,
                ENTERPRISE: SUBSCRIPTION_LIMITS.ENTERPRISE.advancedAnalytics
              }}
            />
            <PlanFeature 
              title="Custom Branding" 
              tiers={{
                TRIAL: SUBSCRIPTION_LIMITS.TRIAL.customBranding,
                STARTER: SUBSCRIPTION_LIMITS.STARTER.customBranding,
                PRO: SUBSCRIPTION_LIMITS.PRO.customBranding,
                ENTERPRISE: SUBSCRIPTION_LIMITS.ENTERPRISE.customBranding
              }}
            />
          </div>
          
          {/* Action Buttons */}
          <div className="grid grid-cols-4 mt-8">
            <div className="col-span-1"></div>
            <div className="col-span-1 flex justify-center">
              <Button 
                variant={currentTier === 'STARTER' ? "secondary" : "outline"} 
                className="w-full max-w-[150px]"
                onClick={handleUpgrade}
                disabled={currentTier === 'STARTER'}
              >
                {currentTier === 'STARTER' ? (
                  <div className="flex items-center">
                    <Check className="mr-2 h-4 w-4" />
                    Current
                  </div>
                ) : "Select"}
              </Button>
            </div>
            <div className="col-span-1 flex justify-center">
              <Button 
                variant={currentTier === 'PRO' ? "secondary" : "outline"} 
                className="w-full max-w-[150px]"
                onClick={handleUpgrade}
                disabled={currentTier === 'PRO'}
              >
                {currentTier === 'PRO' ? (
                  <div className="flex items-center">
                    <Check className="mr-2 h-4 w-4" />
                    Current
                  </div>
                ) : "Select"}
              </Button>
            </div>
            <div className="col-span-1 flex justify-center">
              <Button 
                variant={currentTier === 'ENTERPRISE' ? "secondary" : "outline"} 
                className="w-full max-w-[150px]"
                onClick={handleUpgrade}
                disabled={currentTier === 'ENTERPRISE'}
              >
                {currentTier === 'ENTERPRISE' ? (
                  <div className="flex items-center">
                    <Check className="mr-2 h-4 w-4" />
                    Current
                  </div>
                ) : "Select"}
              </Button>
            </div>
          </div>
        </div>
        
        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleUpgrade}>View Full Pricing Details</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SubscriptionUpgradeDialog;
