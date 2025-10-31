// Stub file to prevent import errors while migrating to Supabase
// All integrations should be migrated to use Supabase edge functions

export const InvokeLLM = async (params) => {
  console.warn('InvokeLLM() not implemented. Use Supabase edge functions with Lovable AI instead.');
  return { response: 'AI functionality coming soon!', error: null };
};

export const UploadFile = async (file, path) => {
  console.warn('UploadFile() not implemented. Use Supabase storage instead.');
  return { url: null, error: 'Not implemented' };
};

export const GenerateImage = async (params) => {
  console.warn('GenerateImage() not implemented. Use Supabase edge functions instead.');
  return { url: null, error: 'Not implemented' };
};

const base44 = {
  functions: {
    invoke: async (functionName, params) => {
      console.warn(`base44.functions.invoke('${functionName}') not implemented. Use Supabase edge functions instead.`);
      return { data: null, error: 'Not implemented' };
    }
  }
};

export default base44;
