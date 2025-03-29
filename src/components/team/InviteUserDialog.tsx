
import React from "react";
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
  DialogTrigger,
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
import { UserPlus } from "lucide-react";

const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  role: z.enum(["member", "admin"], {
    required_error: "Please select a role",
  }),
  botIds: z.array(z.string()).optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface InviteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInvite: (data: FormValues) => Promise<void>;
  bots: { id: string; name: string }[];
}

const InviteUserDialog: React.FC<InviteUserDialogProps> = ({
  open,
  onOpenChange,
  onInvite,
  bots
}) => {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      role: "member",
      botIds: [],
    },
  });

  const handleSubmit = async (data: FormValues) => {
    await onInvite(data);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Invite Team Member
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Invite Team Member</DialogTitle>
          <DialogDescription>
            Invite a new user to join your team and give them access to specific bots.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="user@example.com" {...field} />
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
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
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
              {bots.length === 0 ? (
                <p className="text-sm text-gray-500">No bots available</p>
              ) : (
                <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto p-2 border rounded-md">
                  {bots.map((bot) => (
                    <FormField
                      key={bot.id}
                      control={form.control}
                      name="botIds"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(bot.id)}
                              onCheckedChange={(checked) => {
                                const currentValue = field.value || [];
                                if (checked) {
                                  field.onChange([...currentValue, bot.id]);
                                } else {
                                  field.onChange(
                                    currentValue.filter((value) => value !== bot.id)
                                  );
                                }
                              }}
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal cursor-pointer">
                            {bot.name}
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="submit">Send Invitation</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default InviteUserDialog;
