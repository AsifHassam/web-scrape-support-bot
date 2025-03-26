
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Define CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, cache-control',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Content-Type': 'application/json'
};

serve(async (req) => {
  console.log('Bot config function called with:', req.method, req.url);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200, 
      headers: corsHeaders 
    });
  }

  // Only allow GET requests
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
    // Create a Supabase client with the project URL and anonymous key
    const supabaseUrl = Deno.env.get('SUPABASE_URL') as string;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') as string;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get the botId from the URL
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

    // Debug: Check for valid UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(botId)) {
      console.error('Invalid botId format:', botId);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid botId format', 
          details: 'The botId must be a valid UUID' 
        }),
        { 
          status: 400, 
          headers: corsHeaders 
        }
      );
    }

    // Debug: List all bots in the database first for debugging
    const { data: allBots, error: listError } = await supabase
      .from('bots')
      .select('id, name')
      .limit(10);
    
    console.log('Available bots in database:', allBots);
    
    if (listError) {
      console.error('Error listing bots:', listError);
    }

    // Fetch bot details from Supabase
    const { data: bot, error } = await supabase
      .from('bots')
      .select('*')
      .eq('id', botId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching bot configuration:', error);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to fetch bot configuration', 
          details: error.message 
        }),
        { 
          status: 500, 
          headers: corsHeaders 
        }
      );
    }

    if (!bot) {
      console.log('Bot not found for ID:', botId);
      return new Response(
        JSON.stringify({ 
          error: 'Bot not found',
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
