import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get request data
    const { email, inviterEmail, signUpUrl, ownerId, role, selectedBots } = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Create a Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if the user already exists using the correct API method
    const { data: existingUsers, error: getUserError } = await supabase.auth
      .admin.listUsers({ 
        filters: { email: email }
      });
    
    let user = null;
    if (existingUsers && existingUsers.users && existingUsers.users.length > 0) {
      user = existingUsers.users[0];
    }
    
    let memberData = null;
    
    // If user exists, check if they're already a team member before creating/updating
    if (user) {
      console.log(`User ${email} already exists with ID ${user.id}`);
      
      // Check if team member already exists
      const { data: existingMember, error: checkError } = await supabase
        .from("team_members")
        .select("*")
        .eq("email", email.toLowerCase())
        .eq("owner_id", ownerId)
        .maybeSingle();
        
      if (checkError) {
        console.error("Error checking existing team member:", checkError);
      }
      
      // Also check if there's an entry with this user's member_id to prevent constraint violations
      const { data: existingByMemberId, error: memberIdCheckError } = await supabase
        .from("team_members")
        .select("*")
        .eq("member_id", user.id)
        .eq("owner_id", ownerId)
        .maybeSingle();
        
      if (memberIdCheckError) {
        console.error("Error checking existing member by member_id:", memberIdCheckError);
      }
      
      const existingTeamMember = existingMember || existingByMemberId;
      
      if (existingTeamMember) {
        // Update existing member
        const { data: updatedMember, error: updateError } = await supabase
          .from("team_members")
          .update({ 
            member_id: user.id, 
            status: "active",
            role: role || existingTeamMember.role
          })
          .eq("id", existingTeamMember.id)
          .select()
          .single();
          
        if (updateError) {
          console.error("Error updating team member:", updateError);
          throw updateError;
        } else {
          console.log(`Successfully updated team member for ${email}`);
          memberData = updatedMember;
        }
      } else {
        // Create new team member
        const { data: newMember, error: insertError } = await supabase
          .from("team_members")
          .insert({
            owner_id: ownerId,
            email: email.toLowerCase(),
            member_id: user.id,
            role: role || "member",
            status: "active"
          })
          .select()
          .single();
          
        if (insertError) {
          console.error("Error creating team member:", insertError);
          throw insertError;
        } else {
          console.log(`Successfully created team member for ${email}`);
          memberData = newMember;
        }
      }
      
      // Handle bot permissions if needed
      if (selectedBots && selectedBots.length > 0 && memberData) {
        // First, delete any existing permissions
        await supabase
          .from("bot_permissions")
          .delete()
          .eq("team_member_id", memberData.id);
          
        // Then add the new ones
        const botPermissions = selectedBots.map(botId => ({
          team_member_id: memberData.id,
          bot_id: botId
        }));
        
        const { error: permissionError } = await supabase
          .from("bot_permissions")
          .insert(botPermissions);
          
        if (permissionError) {
          console.error("Error adding bot permissions:", permissionError);
        }
      }
        
      // Return success without sending invitation email
      return new Response(
        JSON.stringify({ 
          message: "User already exists, team member updated/created", 
          memberData 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // For new users, create a pending team member record before sending the invitation
    if (ownerId) {
      // Check if a pending invitation already exists for this email
      const { data: existingInvite, error: checkInviteError } = await supabase
        .from("team_members")
        .select("*")
        .eq("email", email.toLowerCase())
        .eq("owner_id", ownerId)
        .eq("status", "pending")
        .maybeSingle();
        
      if (checkInviteError) {
        console.error("Error checking existing invitation:", checkInviteError);
      }
      
      if (existingInvite) {
        console.log(`Found existing invitation for ${email}, will update it`);
        
        // Update the existing invitation with new role/permissions
        const { data: updatedInvite, error: updateError } = await supabase
          .from("team_members")
          .update({
            role: role || existingInvite.role,
            // Keep the same temporary ID
          })
          .eq("id", existingInvite.id)
          .select()
          .single();
          
        if (updateError) {
          console.error("Error updating invitation:", updateError);
          throw updateError;
        }
        
        memberData = updatedInvite;
      } else {
        // Generate a truly unique temporary ID with a prefix to avoid conflicts with real user IDs
        const temporaryId = `pending_${crypto.randomUUID()}`;
        
        // Create a new pending team member
        const { data: pendingMember, error: memberError } = await supabase
          .from("team_members")
          .insert({
            owner_id: ownerId,
            email: email.toLowerCase(),
            member_id: temporaryId, // Using prefixed temporary ID to avoid conflicts
            role: role || "member",
            status: "pending"
          })
          .select()
          .single();
          
        if (memberError) {
          console.error("Error creating pending team member:", memberError);
          throw memberError;
        }
        
        memberData = pendingMember;
      }
      
      // Add or update bot permissions if selected
      if (selectedBots && selectedBots.length > 0 && memberData) {
        // First, delete any existing permissions
        await supabase
          .from("bot_permissions")
          .delete()
          .eq("team_member_id", memberData.id);
          
        // Then add the new ones
        const botPermissions = selectedBots.map(botId => ({
          team_member_id: memberData.id,
          bot_id: botId
        }));
        
        const { error: permissionError } = await supabase
          .from("bot_permissions")
          .insert(botPermissions);
          
        if (permissionError) {
          console.error("Error adding bot permissions:", permissionError);
        }
      }
    }

    // Use the built-in auth.admin.inviteUserByEmail to send an invitation
    const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
      redirectTo: signUpUrl || `${supabaseUrl}/auth/v1/callback`,
    });

    if (error) {
      console.error("Error inviting user:", error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    console.log("Invitation sent successfully:", data);

    return new Response(
      JSON.stringify({ 
        message: "Invitation sent successfully",
        memberData
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error) {
    console.error("Error in send-team-invitation function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
