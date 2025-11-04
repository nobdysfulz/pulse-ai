import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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
    const { startDate, endDate, duration, attendees, userId } = await req.json();

    if (!userId || !startDate || !endDate) {
      return new Response(
        JSON.stringify({ success: false, error: 'userId, startDate, and endDate are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    const accessToken = await getOAuthToken(userId, 'google_workspace', supabaseUrl, supabaseKey);

    // Query Google Calendar free/busy API
    const freeBusyQuery = {
      timeMin: startDate,
      timeMax: endDate,
      items: [{ id: 'primary' }]
    };

    // Add other attendees if provided
    if (attendees) {
      const attendeeEmails = attendees.split(',').map((email: string) => email.trim());
      attendeeEmails.forEach((email: string) => {
        freeBusyQuery.items.push({ id: email });
      });
    }

    const response = await fetch('https://www.googleapis.com/calendar/v3/freeBusy', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(freeBusyQuery)
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[findAvailableTimeSlotsTool] Google Calendar API error:', error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Failed to query availability: ${error}`,
          suggestion: 'Please check your Google Workspace connection in Settings > Integrations'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    
    // Calculate available slots based on busy periods
    const busyPeriods = data.calendars?.primary?.busy || [];
    const availableSlots = calculateAvailableSlots(startDate, endDate, busyPeriods, duration || 60);

    console.log('[findAvailableTimeSlotsTool] Found available slots:', availableSlots.length);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          availableSlots,
          busyPeriods,
          message: `Found ${availableSlots.length} available time slot(s)`
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[findAvailableTimeSlotsTool] Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        suggestion: 'Please ensure your Google Workspace account is connected'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function calculateAvailableSlots(startDate: string, endDate: string, busyPeriods: any[], durationMinutes: number) {
  const slots = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  const duration = durationMinutes * 60 * 1000; // Convert to milliseconds

  let currentSlot = new Date(start);

  while (currentSlot < end) {
    const slotEnd = new Date(currentSlot.getTime() + duration);
    
    // Check if this slot conflicts with any busy period
    const isAvailable = !busyPeriods.some(busy => {
      const busyStart = new Date(busy.start);
      const busyEnd = new Date(busy.end);
      return (currentSlot < busyEnd && slotEnd > busyStart);
    });

    if (isAvailable && slotEnd <= end) {
      slots.push({
        start: currentSlot.toISOString(),
        end: slotEnd.toISOString()
      });
    }

    // Move to next 30-minute interval
    currentSlot = new Date(currentSlot.getTime() + 30 * 60 * 1000);
  }

  return slots;
}
