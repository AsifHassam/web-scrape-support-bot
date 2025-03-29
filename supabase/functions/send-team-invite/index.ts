
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.1";

// Initialize Resend with API key
const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

// Initialize Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface InviteRequest {
  email: string;
  inviterId: string;
  teamMemberId: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request
    const { email, inviterId, teamMemberId }: InviteRequest = await req.json();

    if (!email || !inviterId || !teamMemberId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log(`Processing invitation for ${email}, from inviter ${inviterId}`);

    // Get inviter details
    const { data: inviterData, error: inviterError } = await supabase
      .from("user_profiles")
      .select("display_name")
      .eq("id", inviterId)
      .single();

    if (inviterError) {
      console.error("Error fetching inviter data:", inviterError);
      return new Response(
        JSON.stringify({ error: "Could not fetch inviter data" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Get team member to update email
    const { data: memberData, error: memberError } = await supabase
      .from("team_members")
      .select("*")
      .eq("id", teamMemberId)
      .single();

    if (memberError) {
      console.error("Error fetching team member data:", memberError);
      return new Response(
        JSON.stringify({ error: "Could not fetch team member data" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Update the email in team_members table
    const { error: updateError } = await supabase
      .from("team_members")
      .update({ email: email })
      .eq("id", teamMemberId);

    if (updateError) {
      console.error("Error updating team member email:", updateError);
      // Continue with sending the invitation, as this might be a resend
    }

    const inviterName = inviterData.display_name || "A team admin";

    // Generate a signup URL with team member ID
    const signupUrl = `${Deno.env.get("SITE_URL") || "http://localhost:5173"}/auth?team_invite=${teamMemberId}`;

    // Send the invitation email
    const emailResponse = await resend.emails.send({
      from: "Team Invitations <onboarding@resend.dev>",
      to: [email],
      subject: `You've been invited to join a team`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333; font-size: 24px;">Team Invitation</h1>
          <p style="font-size: 16px; line-height: 24px; color: #555;">
            ${inviterName} has invited you to join their team!
          </p>
          <p style="font-size: 16px; line-height: 24px; color: #555;">
            Click the button below to create your account and access their bots:
          </p>
          <a 
            href="${signupUrl}" 
            style="display: inline-block; background-color: #2563eb; color: white; text-decoration: none; padding: 12px 20px; border-radius: 4px; margin: 20px 0; font-weight: bold;"
          >
            Accept Invitation
          </a>
          <p style="font-size: 14px; color: #777; margin-top: 40px;">
            If you didn't expect this invitation, you can ignore this email.
          </p>
        </div>
      `,
      text: `${inviterName} has invited you to join their team! Accept the invitation at: ${signupUrl}`,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-team-invite function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
