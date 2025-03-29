
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { TeamMemberRole } from "@/pages/Team";
import { Loader2 } from "lucide-react";

interface AddTeamMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bots: { id: string; name: string }[];
  onAddMember: (email: string, role: TeamMemberRole, selectedBots: string[]) => Promise<void>;
}

const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  role: z.enum(["member", "admin"]),
});

const AddTeamMemberDialog = ({
  open,
  onOpenChange,
  bots,
  onAddMember
}: AddTeamMemberDialogProps) => {
  const [selectedBots, setSelectedBots] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      role: "member",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      await onAddMember(values.email, values.role, selectedBots);
      form.reset();
      setSelectedBots([]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBotToggle = (botId: string) => {
    setSelectedBots(prev => 
      prev.includes(botId) 
        ? prev.filter(id => id !== botId) 
        : [...prev, botId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (!newOpen) {
        form.reset();
        setSelectedBots([]);
      }
      onOpenChange(newOpen);
    }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Team Member</DialogTitle>
          <DialogDescription>
            Invite a new member to your team. They will receive an email invitation.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input placeholder="email@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="space-y-2">
              <FormLabel>Bot Access</FormLabel>
              <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-2">
                {bots.length === 0 ? (
                  <p className="text-sm text-gray-500">No bots available</p>
                ) : (
                  bots.map((bot) => (
                    <div key={bot.id} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`bot-${bot.id}`} 
                        checked={selectedBots.includes(bot.id)}
                        onCheckedChange={() => handleBotToggle(bot.id)}
                      />
                      <label 
                        htmlFor={`bot-${bot.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {bot.name}
                      </label>
                    </div>
                  ))
                )}
              </div>
            </div>
            
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  "Add Team Member"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddTeamMemberDialog;
