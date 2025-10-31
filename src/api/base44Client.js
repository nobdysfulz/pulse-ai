// Stub file to prevent import errors while migrating to Supabase
// All functionality should be migrated to use Supabase directly

export const base44 = {
  functions: {
    invoke: async (functionName, params) => {
      console.warn(`base44.functions.invoke('${functionName}') called but not implemented. Use Supabase edge functions instead.`);
      return { data: null, error: 'Not implemented' };
    }
  },
  entities: {}
};
