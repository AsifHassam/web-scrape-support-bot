
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface AnalyticsUpdateRequest {
  botId: string;
  sessionId: string;
  isNewVisitor?: boolean;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Create a Supabase client with the service role key
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Parse request body
    const { botId, sessionId, isNewVisitor = false } = await req.json() as AnalyticsUpdateRequest;

    if (!botId) {
      return new Response(
        JSON.stringify({ error: "Missing botId parameter" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split("T")[0];

    // Check if we have an entry for today
    const { data: existingEntry, error: queryError } = await supabase
      .from("bot_analytics")
      .select("*")
      .eq("bot_id", botId)
      .eq("date", today)
      .single();

    if (queryError && queryError.code !== "PGRST116") {
      // PGRST116 is "Results contain 0 rows" which is expected when there's no entry yet
      throw queryError;
    }

    if (existingEntry) {
      // Update existing entry
      const { error: updateError } = await supabase
        .from("bot_analytics")
        .update({
          chat_count: existingEntry.chat_count + 1,
          unique_visitors: isNewVisitor
            ? existingEntry.unique_visitors + 1
            : existingEntry.unique_visitors,
        })
        .eq("id", existingEntry.id);

      if (updateError) throw updateError;
    } else {
      // Create new entry
      const { error: insertError } = await supabase.from("bot_analytics").insert({
        bot_id: botId,
        date: today,
        chat_count: 1,
        unique_visitors: isNewVisitor ? 1 : 0,
      });

      if (insertError) throw insertError;
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error updating analytics:", error);
    return new Response(
      JSON.stringify({ error: error.message || "An error occurred" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
