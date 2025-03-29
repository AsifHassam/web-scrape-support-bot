
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
    const { email, inviterEmail, signUpUrl } = await req.json();

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

    // Check if user already exists
    const { data: existingUsers, error: lookupError } = await supabase
      .from("auth.users")
      .select("id, email")
      .eq("email", email.toLowerCase());
      
    if (lookupError) {
      console.error("Error looking up existing user:", lookupError);
    }
    
    // If user exists, update team_members record with the correct member_id
    if (existingUsers && existingUsers.length > 0) {
      const userId = existingUsers[0].id;
      console.log(`User ${email} already exists with ID ${userId}, updating team_members record`);
      
      const { error: updateError } = await supabase
        .from("team_members")
        .update({ member_id: userId, status: "active" })
        .eq("email", email.toLowerCase());
        
      if (updateError) {
        console.error("Error updating team member:", updateError);
      } else {
        console.log(`Successfully updated team member for ${email}`);
        
        // Return success without sending invitation email
        return new Response(
          JSON.stringify({ message: "User already exists, team member updated" }),
          { 
            status: 200, 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        );
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
      JSON.stringify({ message: "Invitation sent successfully" }),
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
