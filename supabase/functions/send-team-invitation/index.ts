
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Initialize Supabase client
function initSupabaseClient() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set");
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

// Check if user exists by email
async function checkExistingUser(supabase, email) {
  const { data: existingUsers, error: getUserError } = await supabase.auth
    .admin.listUsers({ 
      filters: { email: email }
    });
  
  if (getUserError) {
    console.error("Error checking existing user:", getUserError);
    throw getUserError;
  }
  
  if (existingUsers && existingUsers.users && existingUsers.users.length > 0) {
    return existingUsers.users[0];
  }
  
  return null;
}

// Check if user is already a team member
async function checkExistingTeamMember(supabase, email, userId, ownerId) {
  // Check by email
  const { data: existingMember, error: checkError } = await supabase
    .from("team_members")
    .select("*")
    .eq("email", email.toLowerCase())
    .eq("owner_id", ownerId)
    .maybeSingle();
    
  if (checkError) {
    console.error("Error checking existing team member:", checkError);
  }
  
  // Check by member_id if we have a user ID
  if (userId) {
    const { data: existingByMemberId, error: memberIdCheckError } = await supabase
      .from("team_members")
      .select("*")
      .eq("member_id", userId)
      .eq("owner_id", ownerId)
      .maybeSingle();
      
    if (memberIdCheckError) {
      console.error("Error checking existing member by member_id:", memberIdCheckError);
    }
    
    return existingMember || existingByMemberId;
  }
  
  return existingMember;
}

// Update existing team member
async function updateExistingTeamMember(supabase, existingMember, userId, role) {
  const { data: updatedMember, error: updateError } = await supabase
    .from("team_members")
    .update({ 
      member_id: userId, 
      status: "active",
      role: role || existingMember.role
    })
    .eq("id", existingMember.id)
    .select()
    .single();
    
  if (updateError) {
    console.error("Error updating team member:", updateError);
    throw updateError;
  }
  
  console.log(`Successfully updated team member for ${existingMember.email}`);
  return updatedMember;
}

// Create new team member
async function createTeamMember(supabase, email, userId, ownerId, role) {
  const { data: newMember, error: insertError } = await supabase
    .from("team_members")
    .insert({
      owner_id: ownerId,
      email: email.toLowerCase(),
      member_id: userId,
      role: role || "member",
      status: "active"
    })
    .select()
    .single();
    
  if (insertError) {
    console.error("Error creating team member:", insertError);
    throw insertError;
  }
  
  console.log(`Successfully created team member for ${email}`);
  return newMember;
}

// Check if an invitation already exists for this email
async function checkExistingInvitation(supabase, email, ownerId) {
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
  
  return existingInvite;
}

// Update existing invitation
async function updateInvitation(supabase, existingInvite, role) {
  const { data: updatedInvite, error: updateError } = await supabase
    .from("team_members")
    .update({
      role: role || existingInvite.role,
    })
    .eq("id", existingInvite.id)
    .select()
    .single();
    
  if (updateError) {
    console.error("Error updating invitation:", updateError);
    throw updateError;
  }
  
  return updatedInvite;
}

// Create new pending invitation
async function createPendingInvitation(supabase, email, ownerId, role) {
  // Generate a truly unique temporary ID with a prefix to avoid conflicts with real user IDs
  const temporaryId = `pending_${crypto.randomUUID()}`;
  
  const { data: pendingMember, error: memberError } = await supabase
    .from("team_members")
    .insert({
      owner_id: ownerId,
      email: email.toLowerCase(),
      member_id: temporaryId,
      role: role || "member",
      status: "pending"
    })
    .select()
    .single();
    
  if (memberError) {
    console.error("Error creating pending team member:", memberError);
    throw memberError;
  }
  
  return pendingMember;
}

// Handle bot permissions
async function updateBotPermissions(supabase, memberData, selectedBots) {
  if (!selectedBots || selectedBots.length === 0 || !memberData) {
    return;
  }
  
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

// Send invitation email
async function sendInvitationEmail(supabase, email, signUpUrl) {
  const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
    redirectTo: signUpUrl || `${Deno.env.get("SUPABASE_URL")}/auth/v1/callback`,
  });

  if (error) {
    console.error("Error inviting user:", error);
    throw error;
  }

  console.log("Invitation sent successfully:", data);
  return data;
}

// Handle existing user
async function handleExistingUser(supabase, user, email, ownerId, role, selectedBots) {
  console.log(`User ${email} already exists with ID ${user.id}`);
  
  // Check if they're already a team member
  const existingTeamMember = await checkExistingTeamMember(supabase, email, user.id, ownerId);
  
  let memberData = null;
  
  if (existingTeamMember) {
    // Update existing member
    memberData = await updateExistingTeamMember(supabase, existingTeamMember, user.id, role);
  } else {
    // Create new team member
    memberData = await createTeamMember(supabase, email, user.id, ownerId, role);
  }
  
  // Handle bot permissions
  await updateBotPermissions(supabase, memberData, selectedBots);
  
  return memberData;
}

// Handle new user invitation
async function handleNewUserInvitation(supabase, email, ownerId, role, selectedBots, signUpUrl) {
  let memberData = null;
  
  // Check if a pending invitation already exists
  const existingInvite = await checkExistingInvitation(supabase, email, ownerId);
  
  if (existingInvite) {
    console.log(`Found existing invitation for ${email}, will update it`);
    memberData = await updateInvitation(supabase, existingInvite, role);
  } else {
    // Create a new pending invitation
    memberData = await createPendingInvitation(supabase, email, ownerId, role);
  }
  
  // Handle bot permissions
  await updateBotPermissions(supabase, memberData, selectedBots);
  
  // Send invitation email
  await sendInvitationEmail(supabase, email, signUpUrl);
  
  return memberData;
}

// Main request handler
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
    const supabase = initSupabaseClient();

    // Check if the user already exists
    const user = await checkExistingUser(supabase, email);
    
    let memberData = null;
    
    if (user) {
      // Handle existing user flow
      memberData = await handleExistingUser(supabase, user, email, ownerId, role, selectedBots);
      
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
    } else {
      // Handle new user flow
      memberData = await handleNewUserInvitation(supabase, email, ownerId, role, selectedBots, signUpUrl);
    }

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
