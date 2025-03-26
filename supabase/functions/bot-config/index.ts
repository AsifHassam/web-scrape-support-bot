
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, cache-control',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Content-Type': 'application/json'
};

serve(async (req) => {
  console.log('Bot config function called with:', req.method, req.url);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200, 
      headers: corsHeaders 
    });
  }

  if (req.method !== 'GET') {
    return new Response(
      JSON.stringify({
        error: 'Method not allowed'
      }),
      { 
        status: 405, 
        headers: corsHeaders 
      }
    );
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') as string;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') as string;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = new URL(req.url);
    const botId = url.searchParams.get('botId');

    console.log('Request headers:', Object.fromEntries(req.headers.entries()));
    console.log('Fetching configuration for bot ID:', botId);

    if (!botId) {
      console.error('Missing required parameter: botId');
      return new Response(
        JSON.stringify({ 
          error: 'Missing required parameter: botId is required' 
        }),
        { 
          status: 400, 
          headers: corsHeaders 
        }
      );
    }

    // Debug: List all bots in the database for debugging
    const { data: allBots, error: listError } = await supabase
      .from('bots')
      .select('id, name')
      .limit(10);
    
    console.log('Available bots in database:', allBots);
    
    if (listError) {
      console.error('Error listing bots:', listError);
    }

    // Try first with a standard query
    const { data: bot, error } = await supabase
      .from('bots')
      .select('*')
      .eq('id', botId.trim())
      .maybeSingle();

    if (error || !bot) {
      console.error('Standard query failed:', error);
      
      // Try using the string comparison function
      console.log('Attempting direct string query with ID:', botId.trim());
      const { data: directBot, error: directError } = await supabase
        .rpc('get_bot_by_id_string', { id_param: botId.trim() })
        .maybeSingle();
        
      if (directError || !directBot) {
        console.error('Direct string query also failed:', directError);
        return new Response(
          JSON.stringify({ 
            error: 'Bot not found', 
            botIdRequested: botId,
            availableBots: allBots?.map(b => ({ id: b.id, name: b.name })) || []
          }),
          { 
            status: 404, 
            headers: corsHeaders 
          }
        );
      }
      
      console.log('Found bot via direct string query:', directBot);
      return new Response(
        JSON.stringify({ bot: directBot }),
        { 
          status: 200, 
          headers: corsHeaders 
        }
      );
    }

    console.log('Bot configuration fetched successfully:', bot.id, bot.name);

    // Return a clean JSON response with the bot data
    return new Response(
      JSON.stringify({ bot }),
      { 
        status: 200, 
        headers: corsHeaders 
      }
    );
  } catch (error) {
    console.error('Unexpected error fetching bot configuration:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Unexpected error occurred', 
        details: error.message 
      }),
      { 
        status: 500, 
        headers: corsHeaders 
      }
    );
  }
});
