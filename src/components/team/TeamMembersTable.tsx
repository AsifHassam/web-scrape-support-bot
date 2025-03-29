
import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Send, Trash, UserCog } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import EditMemberDialog from "./EditMemberDialog";
import DeleteMemberDialog from "./DeleteMemberDialog";

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

interface TeamMembersTableProps {
  members: Member[];
  bots: { id: string; name: string }[];
  onUpdate: (memberId: string, updates: { role?: 'member' | 'admin', botIds?: string[] }) => void;
  onRemove: (memberId: string) => void;
  onResendInvite: (memberId: string, email: string) => void;
  isAdmin: boolean;
}

const TeamMembersTable: React.FC<TeamMembersTableProps> = ({
  members,
  bots,
  onUpdate,
  onRemove,
  onResendInvite,
  isAdmin
}) => {
  const [editMemberId, setEditMemberId] = useState<string | null>(null);
  const [editMemberData, setEditMemberData] = useState<Member | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState<boolean>(false);
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);

  const handleEditClick = (member: Member) => {
    setEditMemberId(member.id);
    setEditMemberData(member);
  };

  const handleDeleteClick = (member: Member) => {
    setMemberToDelete(member);
    setDeleteConfirmOpen(true);
  };

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Bot Access</TableHead>
              <TableHead>Invited</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-gray-500">
                  No team members found. Invite people to your team to get started.
                </TableCell>
              </TableRow>
            ) : (
              members.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">{member.email}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        member.status === 'pending'
                          ? 'outline'
                          : member.status === 'active'
                          ? 'default'
                          : 'destructive'
                      }
                    >
                      {member.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{member.role}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {member.bots.length === 0 ? (
                        <span className="text-gray-500 text-sm">No bots</span>
                      ) : (
                        member.bots.map((bot) => (
                          <Badge key={bot.id} variant="secondary" className="mr-1">
                            {bot.name}
                          </Badge>
                        ))
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {formatDistanceToNow(new Date(member.created_at), { addSuffix: true })}
                  </TableCell>
                  <TableCell className="text-right">
                    {isAdmin && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditClick(member)}>
                            <UserCog className="mr-2 h-4 w-4" />
                            Edit permissions
                          </DropdownMenuItem>
                          {member.status === 'pending' && (
                            <DropdownMenuItem
                              onClick={() => onResendInvite(member.id, member.email)}
                            >
                              <Send className="mr-2 h-4 w-4" />
                              Resend invitation
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            className="text-destructive focus:bg-destructive/10"
                            onClick={() => handleDeleteClick(member)}
                          >
                            <Trash className="mr-2 h-4 w-4" />
                            Remove from team
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <EditMemberDialog
        open={editMemberId !== null}
        onOpenChange={(open) => !open && setEditMemberId(null)}
        member={editMemberData}
        bots={bots}
        onSave={(updates) => {
          if (editMemberId) {
            onUpdate(editMemberId, updates);
            setEditMemberId(null);
          }
        }}
      />

      <DeleteMemberDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        member={memberToDelete}
        onDelete={() => {
          if (memberToDelete) {
            onRemove(memberToDelete.id);
            setDeleteConfirmOpen(false);
            setMemberToDelete(null);
          }
        }}
      />
    </>
  );
};

export default TeamMembersTable;
