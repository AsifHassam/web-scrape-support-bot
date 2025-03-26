
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

    // Fetch bot details from Supabase - use non-strict equality to handle string UUID vs UUID object
    const { data: bot, error } = await supabase
      .from('bots')
      .select('*')
      .filter('id', 'eq', botId.trim())
      .limit(1)
      .single();

    if (error) {
      console.error('Error fetching bot configuration:', error);
      
      // Try again with a direct query to check if the issue is with UUID format
      const { data: directBot, error: directError } = await supabase
        .rpc('get_bot_by_id_string', { id_param: botId.trim() })
        .maybeSingle();
        
      if (directError || !directBot) {
        console.error('Direct query also failed:', directError);
        return new Response(
          JSON.stringify({ 
            error: 'Failed to fetch bot configuration', 
            details: error.message,
            availableBots: allBots?.map(b => ({ id: b.id, name: b.name })) || []
          }),
          { 
            status: 500, 
            headers: corsHeaders 
          }
        );
      }
      
      console.log('Found bot via direct query:', directBot);
      return new Response(
        JSON.stringify({ bot: directBot }),
        { 
          status: 200, 
          headers: corsHeaders 
        }
      );
    }

    if (!bot) {
      console.log('Bot not found for ID:', botId);
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
