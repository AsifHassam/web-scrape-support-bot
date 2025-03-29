
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

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

interface DeleteMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: Member | null;
  onDelete: () => void;
}

const DeleteMemberDialog: React.FC<DeleteMemberDialogProps> = ({
  open,
  onOpenChange,
  member,
  onDelete,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remove Team Member</DialogTitle>
          <DialogDescription>
            Are you sure you want to remove {member?.email} from your team? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex space-x-2 justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onDelete}>
            Remove
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteMemberDialog;
