
import { Check, Clock, Edit, Shield, Trash2, UserCog, UserPlus, XCircle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { TeamMember } from "@/pages/Team";
import UpdateBotAccessDialog from "./UpdateBotAccessDialog";
import { useState } from "react";

interface TeamMembersTableProps {
  members: TeamMember[];
  bots: { id: string; name: string }[];
  onRemoveMember: (member: TeamMember) => void;
  onWithdrawInvitation: (member: TeamMember) => void;
  onUpdateBots: (memberId: string, selectedBots: string[]) => Promise<void>;
}

const TeamMembersTable = ({
  members,
  bots,
  onRemoveMember,
  onWithdrawInvitation,
  onUpdateBots
}: TeamMembersTableProps) => {
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [updatingBots, setUpdatingBots] = useState<string | null>(null);

  const handleUpdateClick = (member: TeamMember) => {
    setSelectedMember(member);
    setUpdateDialogOpen(true);
  };

  const handleUpdateBots = async (memberId: string, selectedBots: string[]) => {
    setUpdatingBots(memberId);
    try {
      await onUpdateBots(memberId, selectedBots);
    } finally {
      setUpdatingBots(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Sort members to show pending invitations more prominently
  const sortedMembers = [...members].sort((a, b) => {
    // Sort by status - pending first, then active, then owner
    if (a.isOwner && !b.isOwner) return 1;
    if (!a.isOwner && b.isOwner) return -1;
    if (a.status === 'pending' && b.status !== 'pending') return -1;
    if (a.status !== 'pending' && b.status === 'pending') return 1;
    return 0;
  });

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Invited</TableHead>
            <TableHead>Bot Access</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedMembers.map((member) => (
            <TableRow 
              key={`${member.id}-${member.email}`} 
              className={
                member.isOwner ? "bg-primary/5" : 
                member.status === 'pending' ? "bg-amber-50 dark:bg-amber-900/10" : ""
              }
            >
              <TableCell className="font-medium">
                <div className="flex items-center">
                  {member.email}
                  {member.isOwner && (
                    <span className="ml-2 text-xs text-primary font-semibold flex items-center">
                      <Shield className="h-3 w-3 mr-1" />
                      Owner
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  member.status === 'active' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
                    : member.status === 'pending'
                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                    : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                }`}>
                  <span className="flex items-center">
                    {member.status === 'active' ? (
                      <Check className="mr-1 h-3 w-3" />
                    ) : member.status === 'pending' ? (
                      <Clock className="mr-1 h-3 w-3" />
                    ) : (
                      <Trash2 className="mr-1 h-3 w-3" />
                    )}
                    {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                  </span>
                </span>
              </TableCell>
              <TableCell>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  member.role === 'admin'
                    ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
                    : 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                }`}>
                  <span className="flex items-center">
                    {member.role === 'admin' ? (
                      <UserCog className="mr-1 h-3 w-3" />
                    ) : (
                      <UserPlus className="mr-1 h-3 w-3" />
                    )}
                    {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                  </span>
                </span>
              </TableCell>
              <TableCell>{formatDate(member.created_at)}</TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {member.bots.length === 0 ? (
                    <span className="text-sm text-gray-500 dark:text-gray-400">No bots</span>
                  ) : member.bots.map((bot) => (
                    <span 
                      key={bot.id} 
                      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                    >
                      {bot.name}
                    </span>
                  ))}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end space-x-2">
                  {!member.isOwner && (
                    <>
                      {member.status === 'active' ? (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateClick(member)}
                            disabled={updatingBots === member.id}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onRemoveMember(member)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      ) : member.status === 'pending' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onWithdrawInvitation(member)}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Withdraw
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {selectedMember && (
        <UpdateBotAccessDialog
          open={updateDialogOpen}
          onOpenChange={setUpdateDialogOpen}
          member={selectedMember}
          bots={bots}
          onUpdate={(botIds) => handleUpdateBots(selectedMember.id, botIds)}
        />
      )}
    </div>
  );
};

export default TeamMembersTable;
