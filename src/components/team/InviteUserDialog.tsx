
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Plus, UserPlus } from "lucide-react";
import { z } from "zod";

interface InviteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInvite: (data: { email: string; role: 'member' | 'admin'; botIds: string[] }) => void;
  bots: { id: string; name: string }[];
}

const emailSchema = z.string().email("Please enter a valid email address");

const InviteUserDialog = ({ open, onOpenChange, onInvite, bots }: InviteUserDialogProps) => {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<'member' | 'admin'>('member');
  const [selectedBots, setSelectedBots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState("");

  const handleInvite = async () => {
    try {
      // Validate email
      emailSchema.parse(email);
      setEmailError("");
      
      setLoading(true);
      
      await onInvite({
        email,
        role,
        botIds: selectedBots
      });
      
      // Reset form
      setEmail("");
      setRole('member');
      setSelectedBots([]);
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        setEmailError(error.errors[0].message);
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleBot = (botId: string) => {
    setSelectedBots(prev => 
      prev.includes(botId) 
        ? prev.filter(id => id !== botId) 
        : [...prev, botId]
    );
  };

  return (
    <div>
      <Button onClick={() => onOpenChange(true)}>
        <UserPlus className="h-4 w-4 mr-2" />
        Invite Team Member
      </Button>
      
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
            <DialogDescription>
              Send an invitation to collaborate on your bots
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="colleague@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEmailError("");
                }}
              />
              {emailError && (
                <p className="text-sm text-red-500">{emailError}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={role}
                onValueChange={(value: 'member' | 'admin') => setRole(value)}
              >
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
            
            <div className="space-y-3">
              <Label>Bot Access</Label>
              
              {bots.length > 0 ? (
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
              ) : (
                <p className="text-sm text-gray-500">
                  You don't have any bots yet. Create bots first to share them with team members.
                </p>
              )}
            </div>
          </div>
          
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleInvite}
              disabled={loading || !email || selectedBots.length === 0}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Send Invitation
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InviteUserDialog;
