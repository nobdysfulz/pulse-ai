import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * Validates Supabase JWT token and returns the authenticated user ID
 * @param authHeader - Authorization header containing Bearer token
 * @returns User ID from validated session
 * @throws Error if authentication fails
 */
export async function validateSupabaseAuth(authHeader: string): Promise<string> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing or invalid Authorization header');
  }

  const token = authHeader.replace('Bearer ', '');
  
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase configuration');
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: { Authorization: authHeader }
    }
  });

  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    console.error('[Auth] Failed to validate user:', error);
    throw new Error('Unauthorized: Invalid or expired token');
  }

  return user.id;
}
