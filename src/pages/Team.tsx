import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import TeamMembersTable from "@/components/team/TeamMembersTable";
import AddTeamMemberDialog from "@/components/team/AddTeamMemberDialog";
import RemoveTeamMemberDialog from "@/components/team/RemoveTeamMemberDialog";
import WithdrawInvitationDialog from "@/components/team/WithdrawInvitationDialog";
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
  isOwner?: boolean;
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
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [addingMember, setAddingMember] = useState(false);
  const [withdrawingInvitation, setWithdrawingInvitation] = useState(false);

  useEffect(() => {
    if (!user) return;
    
    const fetchUserAndTeam = async () => {
      try {
        setLoading(true);
        
        const { data: userDataArray, error: userError } = await supabase
          .from("users_metadata")
          .select("payment_status")
          .eq("id", user.id);
          
        if (userError) throw userError;
        
        let userIsPro = false;
        let userSubscriptionTier: SubscriptionTier = "TRIAL";
        
        if (!userDataArray || userDataArray.length === 0) {
          console.log("No user metadata found, defaulting to TRIAL");
        } else {
          const userData = userDataArray[0];
          const paymentStatus = userData.payment_status.toUpperCase();
          userIsPro = paymentStatus === "PRO" || paymentStatus === "ENTERPRISE";
          userSubscriptionTier = 
            paymentStatus === "PRO" ? "PRO" : 
            paymentStatus === "ENTERPRISE" ? "ENTERPRISE" : 
            paymentStatus === "STARTER" ? "STARTER" : "TRIAL";
        }
        
        if (userSubscriptionTier !== "PRO" && userSubscriptionTier !== "ENTERPRISE") {
          const { data: subscriptions } = await supabase
            .from("subscriptions")
            .select("*")
            .eq("user_id", user.id)
            .eq("status", "active")
            .order("created_at", { ascending: false });
            
          const hasPremiumSubscription = subscriptions && subscriptions.length > 0 && 
            (subscriptions[0].plan_name.includes("PRO") || 
             subscriptions[0].plan_name.includes("Enterprise"));
             
          if (!hasPremiumSubscription) {
            toast.error("Team feature is only available for PRO and ENTERPRISE plans");
            navigate("/dashboard");
            return;
          } else {
            userIsPro = true;
            userSubscriptionTier = subscriptions[0].plan_name.includes("PRO") ? "PRO" : "ENTERPRISE";
          }
        }
        
        setIsPro(userIsPro);
        setSubscriptionTier(userSubscriptionTier);
        
        const { data: botsData, error: botsError } = await supabase
          .from("bots")
          .select("id, name")
          .eq("user_id", user.id);
          
        if (botsError) throw botsError;
        setBots(botsData || []);
        
        const { data: membersData, error: membersError } = await supabase
          .from("team_members")
          .select("*")
          .eq("owner_id", user.id);
          
        if (membersError) throw membersError;
        
        const teamMembersWithBots = await Promise.all((membersData || []).map(async (member) => {
          const { data: permissions, error: permissionsError } = await supabase
            .from("bot_permissions")
            .select("bot_id")
            .eq("team_member_id", member.id);
            
          if (permissionsError) throw permissionsError;
          
          const memberBots = (permissions || []).map(p => {
            const bot = botsData?.find(b => b.id === p.bot_id);
            return bot ? { id: bot.id, name: bot.name } : null;
          }).filter(Boolean);
          
          return {
            ...member,
            bots: memberBots
          };
        }));
        
        const ownerMember: TeamMember = {
          id: 'owner-' + user.id,
          email: user.email || '',
          member_id: user.id,
          status: 'active' as TeamMemberStatus,
          role: 'admin' as TeamMemberRole,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          bots: botsData || [],
          isOwner: true
        };
        
        setTeamMembers([ownerMember, ...teamMembersWithBots as TeamMember[]]);
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
      setAddingMember(true);
      
      const memberLimit = subscriptionTier === "ENTERPRISE" ? 10 : 5;
      if (teamMembers.length >= memberLimit) {
        toast.error(`Your plan allows a maximum of ${memberLimit} team members`);
        return;
      }
      
      const existingMember = teamMembers.find(m => m.email.toLowerCase() === email.toLowerCase());
      if (existingMember) {
        toast.error("This email is already a team member");
        return;
      }

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
            signUpUrl: inviteUrl,
            ownerId: user.id,
            role: role,
            selectedBots: selectedBots
          })
        }
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response:", errorText);
        
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.error || 'Failed to send invitation');
        } catch (parseError) {
          throw new Error(`Failed to send invitation: ${errorText || response.statusText}`);
        }
      }
      
      try {
        const responseData = await response.json();
        
        if (responseData.memberData) {
          const memberBots = selectedBots.map(botId => {
            const bot = bots.find(b => b.id === botId);
            return bot ? { id: bot.id, name: bot.name } : null;
          }).filter(Boolean);
          
          setTeamMembers([...teamMembers, { 
            ...responseData.memberData, 
            bots: memberBots 
          } as TeamMember]);
          
          toast.success(`Invitation sent to ${email}`);
        } else {
          toast.success(responseData.message || `Team member operation completed`);
          
          const { data: refreshedMembers, error: refreshError } = await supabase
            .from("team_members")
            .select("*")
            .eq("owner_id", user.id);
            
          if (!refreshError && refreshedMembers) {
            const updatedTeamMembers = await Promise.all(refreshedMembers.map(async (member) => {
              const { data: permissions } = await supabase
                .from("bot_permissions")
                .select("bot_id")
                .eq("team_member_id", member.id);
                
              const memberBots = (permissions || []).map(p => {
                const bot = bots.find(b => b.id === p.bot_id);
                return bot ? { id: bot.id, name: bot.name } : null;
              }).filter(Boolean);
              
              return {
                ...member,
                bots: memberBots
              };
            }));
            
            const ownerMember = teamMembers.find(m => m.isOwner);
            setTeamMembers([
              ...(ownerMember ? [ownerMember] : []), 
              ...updatedTeamMembers as TeamMember[]
            ]);
          }
        }
      } catch (jsonError) {
        console.error("Error parsing response as JSON:", jsonError);
        toast.success("Operation completed, but response could not be parsed");
        
        fetchTeamMembers();
      }
      
      setAddDialogOpen(false);
    } catch (error: any) {
      console.error("Error adding team member:", error);
      toast.error(`Failed to add team member: ${error.message}`);
    } finally {
      setAddingMember(false);
    }
  };
  
  const handleUpdateMemberBots = async (memberId: string, selectedBots: string[]) => {
    try {
      const { error: deleteError } = await supabase
        .from("bot_permissions")
        .delete()
        .eq("team_member_id", memberId);
        
      if (deleteError) throw deleteError;
      
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
      const { error } = await supabase
        .from("team_members")
        .delete()
        .eq("id", selectedMember.id);
        
      if (error) throw error;
      
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

  const openWithdrawDialog = (member: TeamMember) => {
    setSelectedMember(member);
    setWithdrawDialogOpen(true);
  };

  const handleWithdrawInvitation = async () => {
    if (!selectedMember) return;
    
    try {
      setWithdrawingInvitation(true);
      
      const { error } = await supabase
        .from("team_members")
        .delete()
        .eq("id", selectedMember.id)
        .eq("status", "pending");
        
      if (error) throw error;
      
      setTeamMembers(teamMembers.filter(member => member.id !== selectedMember.id));
      setWithdrawDialogOpen(false);
      setSelectedMember(null);
      
      toast.success("Invitation withdrawn successfully");
    } catch (error: any) {
      console.error("Error withdrawing invitation:", error);
      toast.error(`Failed to withdraw invitation: ${error.message}`);
    } finally {
      setWithdrawingInvitation(false);
    }
  };

  const fetchTeamMembers = async () => {
    if (!user) return;
    
    try {
      const { data: botsData, error: botsError } = await supabase
        .from("bots")
        .select("id, name")
        .eq("user_id", user.id);
        
      if (botsError) throw botsError;
      setBots(botsData || []);
      
      const { data: membersData, error: membersError } = await supabase
        .from("team_members")
        .select("*")
        .eq("owner_id", user.id);
        
      if (membersError) throw membersError;
      
      const teamMembersWithBots = await Promise.all((membersData || []).map(async (member) => {
        const { data: permissions, error: permissionsError } = await supabase
          .from("bot_permissions")
          .select("bot_id")
          .eq("team_member_id", member.id);
          
        if (permissionsError) throw permissionsError;
        
        const memberBots = (permissions || []).map(p => {
          const bot = botsData?.find(b => b.id === p.bot_id);
          return bot ? { id: bot.id, name: bot.name } : null;
        }).filter(Boolean);
        
        return {
          ...member,
          bots: memberBots
        };
      }));
      
      const ownerMember: TeamMember = {
        id: 'owner-' + user.id,
        email: user.email || '',
        member_id: user.id,
        status: 'active' as TeamMemberStatus,
        role: 'admin' as TeamMemberRole,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        bots: botsData || [],
        isOwner: true
      };
      
      setTeamMembers([ownerMember, ...teamMembersWithBots as TeamMember[]]);
    } catch (error: any) {
      console.error("Error fetching team members:", error);
      toast.error(`Failed to load team members: ${error.message}`);
    }
  };

  if (!isPro) {
    return null;
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
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
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
                onWithdrawInvitation={openWithdrawDialog}
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

      <WithdrawInvitationDialog
        open={withdrawDialogOpen}
        onOpenChange={setWithdrawDialogOpen}
        member={selectedMember}
        isLoading={withdrawingInvitation}
        onWithdraw={handleWithdrawInvitation}
      />
    </div>
  );
};

export default Team;
