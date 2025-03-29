
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import TeamMembersTable from "@/components/team/TeamMembersTable";
import AddTeamMemberDialog from "@/components/team/AddTeamMemberDialog";
import RemoveTeamMemberDialog from "@/components/team/RemoveTeamMemberDialog";
import { Badge } from "@/components/ui/badge";
import { SubscriptionTier } from "@/lib/types/billing";

export type TeamMemberStatus = "pending" | "active" | "removed";
export type TeamMemberRole = "member" | "admin";

export interface TeamMember {
  id: string;
  email: string;
  member_id: string | null;
  status: TeamMemberStatus;
  role: TeamMemberRole;
  created_at: string;
  updated_at: string;
  bots: {
    id: string;
    name: string;
  }[];
}

const Team = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [bots, setBots] = useState<any[]>([]);
  const [isPro, setIsPro] = useState(false);
  const [subscriptionTier, setSubscriptionTier] = useState<SubscriptionTier>("TRIAL");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

  useEffect(() => {
    if (!user) return;
    
    const fetchUserAndTeam = async () => {
      try {
        setLoading(true);
        
        // Get user's subscription tier
        const { data: userData, error: userError } = await supabase
          .from("users_metadata")
          .select("payment_status")
          .eq("id", user.id)
          .single();
          
        if (userError) throw userError;
        
        const paymentStatus = userData.payment_status.toUpperCase();
        setIsPro(paymentStatus === "PRO" || paymentStatus === "ENTERPRISE");
        setSubscriptionTier(
          paymentStatus === "PRO" ? "PRO" : 
          paymentStatus === "ENTERPRISE" ? "ENTERPRISE" : 
          paymentStatus === "STARTER" ? "STARTER" : "TRIAL"
        );
        
        if (paymentStatus !== "PRO" && paymentStatus !== "ENTERPRISE") {
          toast.error("Team feature is only available for PRO and ENTERPRISE plans");
          navigate("/dashboard");
          return;
        }
        
        // Fetch all bots owned by the user
        const { data: botsData, error: botsError } = await supabase
          .from("bots")
          .select("id, name")
          .eq("user_id", user.id);
          
        if (botsError) throw botsError;
        setBots(botsData || []);
        
        // Fetch all team members
        const { data: membersData, error: membersError } = await supabase
          .from("team_members")
          .select("*")
          .eq("owner_id", user.id);
          
        if (membersError) throw membersError;
        
        // Fetch bot permissions for each team member
        const teamMembersWithBots = await Promise.all((membersData || []).map(async (member) => {
          const { data: permissions, error: permissionsError } = await supabase
            .from("bot_permissions")
            .select("bot_id")
            .eq("team_member_id", member.id);
            
          if (permissionsError) throw permissionsError;
          
          const memberBots = (permissions || []).map(p => {
            const bot = botsData.find(b => b.id === p.bot_id);
            return bot ? { id: bot.id, name: bot.name } : null;
          }).filter(Boolean);
          
          return {
            ...member,
            bots: memberBots
          };
        }));
        
        setTeamMembers(teamMembersWithBots as TeamMember[]);
      } catch (error: any) {
        console.error("Error fetching team data:", error);
        toast.error(`Failed to load team data: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserAndTeam();
  }, [user, navigate]);
  
  const handleAddTeamMember = async (email: string, role: TeamMemberRole, selectedBots: string[]) => {
    if (!user) return;
    
    try {
      // Check if we have reached the member limit based on plan
      const memberLimit = subscriptionTier === "ENTERPRISE" ? 10 : 5; // PRO: 5, ENTERPRISE: 10
      if (teamMembers.length >= memberLimit) {
        toast.error(`Your plan allows a maximum of ${memberLimit} team members`);
        return;
      }
      
      // Add team member - Fix: provide null for member_id as it will be populated when the user signs up
      const { data: memberData, error: memberError } = await supabase
        .from("team_members")
        .insert({
          owner_id: user.id,
          email: email.toLowerCase(),
          role,
          member_id: null // Explicitly set to null for pending invites
        })
        .select()
        .single();
        
      if (memberError) {
        if (memberError.code === "23505") { // Unique violation
          toast.error("This email is already a team member");
        } else {
          throw memberError;
        }
        return;
      }
      
      // Add bot permissions
      if (selectedBots.length > 0) {
        const botPermissions = selectedBots.map(botId => ({
          team_member_id: memberData.id,
          bot_id: botId
        }));
        
        const { error: permissionsError } = await supabase
          .from("bot_permissions")
          .insert(botPermissions);
          
        if (permissionsError) throw permissionsError;
      }
      
      // Send invitation email using Edge Function
      try {
        const inviteUrl = `${window.location.origin}/auth?invite=true&email=${encodeURIComponent(email)}`;
        
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-team-invitation`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({
              email,
              inviterEmail: user.email || "Team Owner",
              signUpUrl: inviteUrl
            })
          }
        );
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to send invitation');
        }
        
        toast.success(`Invitation sent to ${email}`);
      } catch (inviteError: any) {
        console.error("Error sending invitation:", inviteError);
        toast.error(`Invitation email could not be sent: ${inviteError.message}`);
        // We don't throw here because we already created the user in the database
      }
      
      // Refresh team members list
      const { data: refreshedMemberData, error: refreshError } = await supabase
        .from("team_members")
        .select("*")
        .eq("id", memberData.id)
        .single();
        
      if (refreshError) throw refreshError;
      
      // Add bot data to refreshed member
      const memberBots = selectedBots.map(botId => {
        const bot = bots.find(b => b.id === botId);
        return bot ? { id: bot.id, name: bot.name } : null;
      }).filter(Boolean);
      
      setTeamMembers([...teamMembers, { ...refreshedMemberData, bots: memberBots } as TeamMember]);
      setAddDialogOpen(false);
    } catch (error: any) {
      console.error("Error adding team member:", error);
      toast.error(`Failed to add team member: ${error.message}`);
    }
  };
  
  const handleUpdateMemberBots = async (memberId: string, selectedBots: string[]) => {
    try {
      // First delete all existing permissions
      const { error: deleteError } = await supabase
        .from("bot_permissions")
        .delete()
        .eq("team_member_id", memberId);
        
      if (deleteError) throw deleteError;
      
      // Then add new permissions
      if (selectedBots.length > 0) {
        const botPermissions = selectedBots.map(botId => ({
          team_member_id: memberId,
          bot_id: botId
        }));
        
        const { error: insertError } = await supabase
          .from("bot_permissions")
          .insert(botPermissions);
          
        if (insertError) throw insertError;
      }
      
      // Update local state
      setTeamMembers(teamMembers.map(member => {
        if (member.id === memberId) {
          const memberBots = selectedBots.map(botId => {
            const bot = bots.find(b => b.id === botId);
            return bot ? { id: bot.id, name: bot.name } : null;
          }).filter(Boolean);
          
          return { ...member, bots: memberBots };
        }
        return member;
      }));
      
      toast.success("Bot access updated successfully");
    } catch (error: any) {
      console.error("Error updating bot access:", error);
      toast.error(`Failed to update bot access: ${error.message}`);
    }
  };
  
  const handleRemoveMember = async () => {
    if (!selectedMember) return;
    
    try {
      // Delete team member (bot permissions will be cascaded)
      const { error } = await supabase
        .from("team_members")
        .delete()
        .eq("id", selectedMember.id);
        
      if (error) throw error;
      
      // Update local state
      setTeamMembers(teamMembers.filter(member => member.id !== selectedMember.id));
      setRemoveDialogOpen(false);
      setSelectedMember(null);
      
      toast.success("Team member removed successfully");
    } catch (error: any) {
      console.error("Error removing team member:", error);
      toast.error(`Failed to remove team member: ${error.message}`);
    }
  };
  
  const openRemoveDialog = (member: TeamMember) => {
    setSelectedMember(member);
    setRemoveDialogOpen(true);
  };

  if (!isPro) {
    return null; // Already redirected in useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <button 
              onClick={() => navigate("/dashboard")}
              className="mr-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              aria-label="Back to dashboard"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Team Management</h1>
          </div>
          <Badge variant="outline" className="flex items-center gap-1 border-primary/50">
            <span className="text-xs font-medium">{subscriptionTier}</span>
          </Badge>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Team Members
              </h2>
              <Button onClick={() => setAddDialogOpen(true)}>
                Add Team Member
              </Button>
            </div>
            
            {loading ? (
              <div className="text-center py-10">
                <p className="text-gray-500 dark:text-gray-400">Loading team members...</p>
              </div>
            ) : teamMembers.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-gray-500 dark:text-gray-400">No team members yet</p>
                <Button onClick={() => setAddDialogOpen(true)} className="mt-4">
                  Add Your First Team Member
                </Button>
              </div>
            ) : (
              <TeamMembersTable 
                members={teamMembers} 
                bots={bots}
                onRemoveMember={openRemoveDialog}
                onUpdateBots={handleUpdateMemberBots}
              />
            )}
          </div>
        </div>
      </main>
      
      <AddTeamMemberDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        bots={bots}
        onAddMember={handleAddTeamMember}
      />
      
      <RemoveTeamMemberDialog
        open={removeDialogOpen}
        onOpenChange={setRemoveDialogOpen}
        member={selectedMember}
        onRemove={handleRemoveMember}
      />
    </div>
  );
};

export default Team;
