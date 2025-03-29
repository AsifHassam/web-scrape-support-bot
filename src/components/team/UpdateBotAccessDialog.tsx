
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { TeamMember } from "@/pages/Team";

interface UpdateBotAccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: TeamMember;
  bots: { id: string; name: string }[];
  onUpdate: (selectedBots: string[]) => Promise<void>;
}

const UpdateBotAccessDialog = ({
  open,
  onOpenChange,
  member,
  bots,
  onUpdate
}: UpdateBotAccessDialogProps) => {
  const [selectedBots, setSelectedBots] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  useEffect(() => {
    if (member && open) {
      setSelectedBots(member.bots.map(bot => bot.id));
    }
  }, [member, open]);

  const handleBotToggle = (botId: string) => {
    setSelectedBots(prev => 
      prev.includes(botId) 
        ? prev.filter(id => id !== botId) 
        : [...prev, botId]
    );
  };
  
  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      await onUpdate(selectedBots);
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Update Bot Access</DialogTitle>
          <DialogDescription>
            Select which bots {member?.email} can access.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Bot Access</Label>
            <div className="space-y-2 max-h-60 overflow-y-auto border rounded-md p-2">
              {bots.length === 0 ? (
                <p className="text-sm text-gray-500">No bots available</p>
              ) : (
                bots.map((bot) => (
                  <div key={bot.id} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`edit-bot-${bot.id}`} 
                      checked={selectedBots.includes(bot.id)}
                      onCheckedChange={() => handleBotToggle(bot.id)}
                    />
                    <label 
                      htmlFor={`edit-bot-${bot.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {bot.name}
                    </label>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UpdateBotAccessDialog;
