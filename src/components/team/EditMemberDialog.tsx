
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
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
import { Checkbox } from "@/components/ui/checkbox";

const formSchema = z.object({
  role: z.enum(["member", "admin"], {
    required_error: "Please select a role",
  }),
  botIds: z.array(z.string()).optional(),
});

type FormValues = z.infer<typeof formSchema>;

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
  member: Member | null;
  bots: { id: string; name: string }[];
  onSave: (data: { role: 'member' | 'admin'; botIds: string[] }) => void;
}

const EditMemberDialog: React.FC<EditMemberDialogProps> = ({
  open,
  onOpenChange,
  member,
  bots,
  onSave,
}) => {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      role: "member",
      botIds: [],
    },
  });

  // Reset form when member changes
  useEffect(() => {
    if (member) {
      form.reset({
        role: member.role,
        botIds: member.bots.map(bot => bot.id),
      });
    }
  }, [member, form]);

  const handleSubmit = (data: FormValues) => {
    onSave({
      role: data.role,
      botIds: data.botIds || [],
    });
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Team Member</DialogTitle>
        </DialogHeader>
        {member && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <div className="text-sm">
                <span className="font-semibold">Email:</span> {member.email}
              </div>
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
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
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EditMemberDialog;
