// OAuth token management utilities
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export interface OAuthTokens {
  access_token: string;
  refresh_token?: string;
  expires_at?: number;
}

export async function getOAuthToken(
  userId: string,
  serviceName: string,
  supabaseUrl: string,
  supabaseKey: string
): Promise<string> {
  const supabaseClient = createClient(supabaseUrl, supabaseKey);

  // Fetch connection from external_service_connections
  const { data: connection, error } = await supabaseClient
    .from('external_service_connections')
    .select('*')
    .eq('user_id', userId)
    .eq('service_name', serviceName)
    .single();

  if (error || !connection) {
    throw new Error(`No connection found for ${serviceName}. Please connect this service in Settings > Integrations.`);
  }

  if (connection.connection_status !== 'connected') {
    throw new Error(`${serviceName} is not connected. Status: ${connection.connection_status}`);
  }

  const credentials = connection.credentials as any;
  if (!credentials || !credentials.access_token) {
    throw new Error(`No access token found for ${serviceName}`);
  }

  // Check if token is expired
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = credentials.expires_at || 0;

  if (expiresAt > 0 && now >= expiresAt - 300) { // Refresh 5 minutes before expiry
    console.log(`[OAuth] Token expired for ${serviceName}, refreshing...`);
    return await refreshOAuthToken(userId, serviceName, credentials, supabaseClient);
  }

  return credentials.access_token;
}

async function refreshOAuthToken(
  userId: string,
  serviceName: string,
  currentCredentials: any,
  supabaseClient: any
): Promise<string> {
  if (!currentCredentials.refresh_token) {
    throw new Error(`No refresh token available for ${serviceName}. Please reconnect the integration.`);
  }

  // Service-specific refresh logic
  let newTokens: any;

  switch (serviceName) {
    case 'google_workspace':
      newTokens = await refreshGoogleToken(currentCredentials.refresh_token);
      break;
    case 'microsoft_365':
      newTokens = await refreshMicrosoftToken(currentCredentials.refresh_token);
      break;
    case 'zoom':
      newTokens = await refreshZoomToken(currentCredentials.refresh_token);
      break;
    case 'facebook':
    case 'instagram':
      newTokens = await refreshMetaToken(currentCredentials.access_token);
      break;
    default:
      throw new Error(`Token refresh not implemented for ${serviceName}`);
  }

  // Update database with new tokens
  const updatedCredentials = {
    ...currentCredentials,
    access_token: newTokens.access_token,
    expires_at: newTokens.expires_at,
    refresh_token: newTokens.refresh_token || currentCredentials.refresh_token
  };

  await supabaseClient
    .from('external_service_connections')
    .update({
      credentials: updatedCredentials,
      last_sync_at: new Date().toISOString()
    })
    .eq('user_id', userId)
    .eq('service_name', serviceName);

  console.log(`[OAuth] Token refreshed successfully for ${serviceName}`);
  return newTokens.access_token;
}

async function refreshGoogleToken(refreshToken: string): Promise<any> {
  const clientId = Deno.env.get('GOOGLE_WORKSPACE_CLIENT_ID');
  const clientSecret = Deno.env.get('GOOGLE_WORKSPACE_CLIENT_SECRET');

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId!,
      client_secret: clientSecret!,
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to refresh Google token: ${error}`);
  }

  const data = await response.json();
  return {
    access_token: data.access_token,
    expires_at: Math.floor(Date.now() / 1000) + data.expires_in,
    refresh_token: refreshToken // Google doesn't always return new refresh token
  };
}

async function refreshMicrosoftToken(refreshToken: string): Promise<any> {
  const clientId = Deno.env.get('MICROSOFT_CLIENT_ID');
  const clientSecret = Deno.env.get('MICROSOFT_CLIENT_SECRET');

  const response = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId!,
      client_secret: clientSecret!,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
      scope: 'offline_access Mail.Send Mail.ReadWrite Calendars.ReadWrite Files.ReadWrite.All'
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to refresh Microsoft token: ${error}`);
  }

  const data = await response.json();
  return {
    access_token: data.access_token,
    expires_at: Math.floor(Date.now() / 1000) + data.expires_in,
    refresh_token: data.refresh_token || refreshToken
  };
}

async function refreshZoomToken(refreshToken: string): Promise<any> {
  const clientId = Deno.env.get('ZOOM_CLIENT_ID');
  const clientSecret = Deno.env.get('ZOOM_CLIENT_SECRET');

  const response = await fetch('https://zoom.us/oauth/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to refresh Zoom token: ${error}`);
  }

  const data = await response.json();
  return {
    access_token: data.access_token,
    expires_at: Math.floor(Date.now() / 1000) + data.expires_in,
    refresh_token: data.refresh_token || refreshToken
  };
}

async function refreshMetaToken(accessToken: string): Promise<any> {
  // Meta long-lived tokens last 60 days, can be exchanged for new ones
  const appId = Deno.env.get('META_APP_ID');
  const appSecret = Deno.env.get('META_APP_SECRET');

  const response = await fetch(
    `https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${accessToken}`
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to refresh Meta token: ${error}`);
  }

  const data = await response.json();
  return {
    access_token: data.access_token,
    expires_at: Math.floor(Date.now() / 1000) + data.expires_in,
    refresh_token: null // Meta doesn't use refresh tokens
  };
}
