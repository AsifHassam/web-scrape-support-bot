
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import EditMemberDialog from "@/components/team/EditMemberDialog";
import DeleteMemberDialog from "@/components/team/DeleteMemberDialog";
import { Mail, MoreHorizontal, Pencil, Repeat, Trash2, UserCheck, UserClock, UserX } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card } from "@/components/ui/card";

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

const TeamMembersTable = ({
  members,
  bots,
  onUpdate,
  onRemove,
  onResendInvite,
  isAdmin
}: TeamMembersTableProps) => {
  const [editMember, setEditMember] = useState<Member | null>(null);
  const [deleteMember, setDeleteMember] = useState<Member | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <UserCheck className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <UserClock className="h-4 w-4 text-yellow-500" />;
      case 'removed':
        return <UserX className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Active</Badge>;
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>;
      case 'removed':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Removed</Badge>;
      default:
        return null;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100 border-purple-200">Admin</Badge>;
      case 'member':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Member</Badge>;
      default:
        return null;
    }
  };

  const handleEdit = (member: Member) => {
    setEditMember(member);
    setEditDialogOpen(true);
  };

  const handleDelete = (member: Member) => {
    setDeleteMember(member);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (deleteMember) {
      onRemove(deleteMember.id);
      setDeleteDialogOpen(false);
      setDeleteMember(null);
    }
  };

  const handleResend = (member: Member) => {
    onResendInvite(member.id, member.email);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (members.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
        <h3 className="text-lg font-medium mb-2">No team members yet</h3>
        <p className="text-gray-500 dark:text-gray-400 mb-4">
          Invite team members to collaborate on your bots
        </p>
      </div>
    );
  }

  return (
    <Card className="overflow-hidden border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Bot Access</TableHead>
            <TableHead>Date Added</TableHead>
            {isAdmin && <TableHead className="text-right">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((member) => (
            <TableRow key={member.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span>{member.email}</span>
                </div>
              </TableCell>
              <TableCell>{getStatusBadge(member.status)}</TableCell>
              <TableCell>{getRoleBadge(member.role)}</TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1 max-w-xs">
                  {member.bots.length > 0 ? (
                    member.bots.map((bot) => (
                      <Badge key={bot.id} variant="outline" className="text-xs">
                        {bot.name}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-gray-500 text-sm">No bots assigned</span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <span className="text-sm text-gray-500">{formatDate(member.created_at)}</span>
              </TableCell>
              {isAdmin && (
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(member)}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      {member.status === 'pending' && (
                        <DropdownMenuItem onClick={() => handleResend(member)}>
                          <Repeat className="h-4 w-4 mr-2" />
                          Resend Invite
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem 
                        onClick={() => handleDelete(member)}
                        className="text-red-600 focus:text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {editMember && (
        <EditMemberDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          member={editMember}
          bots={bots}
          onUpdate={(updates) => onUpdate(editMember.id, updates)}
        />
      )}

      {deleteMember && (
        <DeleteMemberDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          member={deleteMember}
          onDelete={handleConfirmDelete}
        />
      )}
    </Card>
  );
};

export default TeamMembersTable;
