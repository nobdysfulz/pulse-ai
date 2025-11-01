// Lightweight wrapper around Lovable Cloud Functions (Supabase Edge Functions)
// This preserves existing call sites while routing to supabase.functions.invoke securely.
import { supabase } from '@/integrations/supabase/client';

export const base44 = {
  functions: {
    invoke: async (functionName, params = {}) => {
      try {
        const { data, error } = await supabase.functions.invoke(functionName, {
          body: params,
        });
        return {
          data: data ?? null,
          error: error ?? null,
          status: error ? (error.status ?? 400) : 200,
        };
      } catch (err) {
        return { data: null, error: err?.message || 'Invocation failed', status: 500 };
      }
    },
  },
  entities: {},
};
