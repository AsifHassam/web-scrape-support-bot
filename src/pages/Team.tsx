
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SubscriptionTier } from "@/lib/types/billing";

// Components
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navbar from "@/components/Navbar";
import TeamMembersTable from "@/components/team/TeamMembersTable";
import InviteUserDialog from "@/components/team/InviteUserDialog";
import { Loader2 } from "lucide-react";

interface TeamMember {
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

const Team = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState<boolean>(true);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isPremium, setIsPremium] = useState<boolean>(false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [bots, setBots] = useState<{ id: string; name: string }[]>([]);
  const [inviteDialogOpen, setInviteDialogOpen] = useState<boolean>(false);

  useEffect(() => {
    if (user) {
      checkUserStatus();
      fetchTeamMembers();
      fetchBots();
    }
  }, [user]);

  const checkUserStatus = async () => {
    try {
      // Check if user is on PRO or ENTERPRISE plan
      const { data: userData, error: userError } = await supabase
        .from('users_metadata')
        .select('payment_status')
        .eq('id', user?.id)
        .single();

      if (userError) throw userError;

      const isPremiumUser = userData?.payment_status === 'PRO' || userData?.payment_status === 'ENTERPRISE';
      setIsPremium(isPremiumUser);
      
      // Check if user is a team admin
      const { data: isAdminData, error: isAdminError } = await supabase
        .rpc('is_team_admin', { user_id: user?.id });

      if (isAdminError) throw isAdminError;
      
      setIsAdmin(isAdminData);
    } catch (error: any) {
      console.error("Error checking user status:", error);
      toast.error("Failed to check user status");
    }
  };

  const fetchTeamMembers = async () => {
    setLoading(true);
    try {
      // Get team members where current user is the owner
      const { data: members, error } = await supabase
        .from('team_members')
        .select(`
          id, 
          email, 
          status, 
          role, 
          created_at, 
          updated_at,
          bot_permissions (
            bot_id
          )
        `)
        .eq('owner_id', user?.id);

      if (error) throw error;

      // Fetch bot details for each permission
      const membersWithBots = await Promise.all(members.map(async (member) => {
        const botIds = member.bot_permissions.map((p: any) => p.bot_id);
        
        if (botIds.length === 0) {
          return { ...member, bots: [] };
        }
        
        const { data: botData, error: botError } = await supabase
          .from('bots')
          .select('id, name')
          .in('id', botIds);
          
        if (botError) throw botError;
        
        return {
          ...member,
          bots: botData || []
        };
      }));

      setTeamMembers(membersWithBots);
    } catch (error: any) {
      console.error("Error fetching team members:", error);
      toast.error("Failed to fetch team members");
    } finally {
      setLoading(false);
    }
  };

  const fetchBots = async () => {
    try {
      const { data, error } = await supabase
        .from('bots')
        .select('id, name')
        .eq('user_id', user?.id);

      if (error) throw error;
      setBots(data || []);
    } catch (error: any) {
      console.error("Error fetching bots:", error);
      toast.error("Failed to fetch bots");
    }
  };

  const handleInviteUser = async (data: { email: string; role: 'member' | 'admin'; botIds: string[] }) => {
    try {
      // Create a new team member entry
      const { data: teamMember, error: teamMemberError } = await supabase
        .from('team_members')
        .insert({
          owner_id: user?.id,
          email: data.email,
          role: data.role,
          // Initially we don't have a member_id since the user hasn't signed up yet
          member_id: null,
          status: 'pending'
        })
        .select()
        .single();

      if (teamMemberError) throw teamMemberError;

      // Add bot permissions
      if (data.botIds.length > 0) {
        const botPermissions = data.botIds.map(botId => ({
          team_member_id: teamMember.id,
          bot_id: botId
        }));

        const { error: permissionsError } = await supabase
          .from('bot_permissions')
          .insert(botPermissions);

        if (permissionsError) throw permissionsError;
      }

      // Trigger invitation email
      const { error: inviteError } = await supabase.functions.invoke('send-team-invite', {
        body: {
          email: data.email,
          inviterId: user?.id,
          teamMemberId: teamMember.id
        }
      });

      if (inviteError) throw inviteError;

      toast.success(`Invitation sent to ${data.email}`);
      setInviteDialogOpen(false);
      fetchTeamMembers();
    } catch (error: any) {
      console.error("Error inviting user:", error);
      toast.error(error.message || "Failed to invite user");
    }
  };

  const handleUpdateMember = async (memberId: string, updates: { role?: 'member' | 'admin', botIds?: string[] }) => {
    try {
      // Update member role if provided
      if (updates.role) {
        const { error: roleError } = await supabase
          .from('team_members')
          .update({ role: updates.role })
          .eq('id', memberId);

        if (roleError) throw roleError;
      }

      // Update bot permissions if provided
      if (updates.botIds) {
        // First delete existing permissions
        const { error: deleteError } = await supabase
          .from('bot_permissions')
          .delete()
          .eq('team_member_id', memberId);

        if (deleteError) throw deleteError;

        // Add new permissions
        if (updates.botIds.length > 0) {
          const botPermissions = updates.botIds.map(botId => ({
            team_member_id: memberId,
            bot_id: botId
          }));

          const { error: insertError } = await supabase
            .from('bot_permissions')
            .insert(botPermissions);

          if (insertError) throw insertError;
        }
      }

      toast.success("Team member updated successfully");
      fetchTeamMembers();
    } catch (error: any) {
      console.error("Error updating team member:", error);
      toast.error("Failed to update team member");
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      // Delete all bot permissions first (due to foreign key constraints)
      const { error: permissionsError } = await supabase
        .from('bot_permissions')
        .delete()
        .eq('team_member_id', memberId);

      if (permissionsError) throw permissionsError;

      // Then delete the team member
      const { error: memberError } = await supabase
        .from('team_members')
        .delete()
        .eq('id', memberId);

      if (memberError) throw memberError;

      toast.success("Team member removed successfully");
      fetchTeamMembers();
    } catch (error: any) {
      console.error("Error removing team member:", error);
      toast.error("Failed to remove team member");
    }
  };

  const handleResendInvite = async (memberId: string, email: string) => {
    try {
      const { error } = await supabase.functions.invoke('send-team-invite', {
        body: {
          email: email,
          inviterId: user?.id,
          teamMemberId: memberId
        }
      });

      if (error) throw error;

      toast.success(`Invitation resent to ${email}`);
    } catch (error: any) {
      console.error("Error resending invitation:", error);
      toast.error("Failed to resend invitation");
    }
  };

  if (!isPremium) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Team Management</h1>
            <p className="mt-3 text-xl text-gray-500 dark:text-gray-400">
              Upgrade to a PRO or ENTERPRISE plan to access team management features.
            </p>
          </div>
        </main>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Team Management</h1>
          {isAdmin && (
            <InviteUserDialog
              open={inviteDialogOpen}
              onOpenChange={setInviteDialogOpen}
              onInvite={handleInviteUser}
              bots={bots}
            />
          )}
        </div>

        <Tabs defaultValue="members" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="members">Team Members</TabsTrigger>
          </TabsList>

          <TabsContent value="members">
            <TeamMembersTable
              members={teamMembers}
              bots={bots}
              onUpdate={handleUpdateMember}
              onRemove={handleRemoveMember}
              onResendInvite={handleResendInvite}
              isAdmin={isAdmin}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Team;
