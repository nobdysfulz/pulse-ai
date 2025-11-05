import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Webhook } from "https://esm.sh/svix@1.15.0";
import { createClerkWebhookHandler } from './handler.js';

const handler = createClerkWebhookHandler({
  getEnv: (key: string) => Deno.env.get(key),
  createSupabaseClient: (url: string, key: string) => createClient(url, key),
  createWebhook: (secret: string) => new Webhook(secret),
  logger: console,
});

serve(handler);
