import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getOAuthToken } from '../_shared/oauthUtils.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, description, startTime, endTime, attendees, location, userId } = await req.json();

    if (!userId || !title || !startTime || !endTime) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields: title, startTime, endTime' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    // Get OAuth token
    const accessToken = await getOAuthToken(userId, 'google_workspace', supabaseUrl, supabaseKey);

    // Build event object
    const event: any = {
      summary: title,
      start: {
        dateTime: startTime,
        timeZone: 'America/Los_Angeles',
      },
      end: {
        dateTime: endTime,
        timeZone: 'America/Los_Angeles',
      },
    };

    if (description) event.description = description;
    if (location) event.location = location;
    
    if (attendees) {
      const attendeeList = attendees.split(',').map((email: string) => ({ email: email.trim() }));
      event.attendees = attendeeList;
    }

    // Create event via Google Calendar API
    const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event)
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[scheduleGoogleCalendarEventTool] Calendar API error:', response.status, error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Failed to create calendar event: ${response.status}`,
          suggestion: 'Please check your Google Workspace connection in Settings > Integrations'
        }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log('[scheduleGoogleCalendarEventTool] Event created:', data.id);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          eventId: data.id,
          eventLink: data.htmlLink,
          title: data.summary,
          startTime: data.start.dateTime,
          endTime: data.end.dateTime,
          message: 'Calendar event created successfully'
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[scheduleGoogleCalendarEventTool] Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        suggestion: error instanceof Error && error.message.includes('not connected') 
          ? 'Please connect Google Workspace in Settings > Integrations'
          : 'An error occurred creating the calendar event'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
