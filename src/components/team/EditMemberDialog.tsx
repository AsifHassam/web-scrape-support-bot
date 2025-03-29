
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
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";

interface Member {
  id: string;
  email: string;
  status: 'pending' | 'active' | 'removed';
  role: 'member' | 'admin';
  created_at: string;
  updated_at: string;
  bots: {
    id: string;
    name: string;
  }[];
}

interface EditMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: Member;
  bots: { id: string; name: string }[];
  onUpdate: (updates: { role?: 'member' | 'admin', botIds?: string[] }) => void;
}

const EditMemberDialog = ({
  open,
  onOpenChange,
  member,
  bots,
  onUpdate,
}: EditMemberDialogProps) => {
  const [role, setRole] = useState<'member' | 'admin'>(member.role);
  const [selectedBots, setSelectedBots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Initialize selected bots when member changes
    setRole(member.role);
    setSelectedBots(member.bots.map((bot) => bot.id));
  }, [member]);

  const toggleBot = (botId: string) => {
    setSelectedBots((prev) =>
      prev.includes(botId) ? prev.filter((id) => id !== botId) : [...prev, botId]
    );
  };

  const handleUpdate = async () => {
    setLoading(true);
    try {
      await onUpdate({
        role,
        botIds: selectedBots,
      });
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Team Member</DialogTitle>
          <DialogDescription>
            Update role and bot access for {member.email}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={role} onValueChange={(value: 'member' | 'admin') => setRole(value)}>
              <SelectTrigger id="role">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">
              Members can only view and manage assigned bots. Admins can manage team members and all bots.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Bot Access</Label>
            <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-2">
              {bots.map((bot) => (
                <div key={bot.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`bot-${bot.id}`}
                    checked={selectedBots.includes(bot.id)}
                    onCheckedChange={() => toggleBot(bot.id)}
                  />
                  <Label htmlFor={`bot-${bot.id}`} className="font-normal cursor-pointer">
                    {bot.name}
                  </Label>
                </div>
              ))}
            </div>
            {bots.length === 0 && (
              <p className="text-sm text-gray-500">No bots available to assign</p>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleUpdate}
            disabled={loading || selectedBots.length === 0}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Updating...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditMemberDialog;
