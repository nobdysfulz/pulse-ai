// Entity API helpers - mix of real Supabase connections and stubs
import { supabase } from '@/integrations/supabase/client';

// Helper to convert camelCase to snake_case
const toSnakeCase = (str) => str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);

// Helper to convert snake_case to camelCase
const toCamelCase = (str) => str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());

// Convert object keys from camelCase to snake_case
const objectToSnakeCase = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(objectToSnakeCase);
  
  return Object.keys(obj).reduce((acc, key) => {
    const snakeKey = toSnakeCase(key);
    acc[snakeKey] = obj[key];
    return acc;
  }, {});
};

// Convert object keys from snake_case to camelCase
const objectToCamelCase = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(objectToCamelCase);
  
  return Object.keys(obj).reduce((acc, key) => {
    const camelKey = toCamelCase(key);
    acc[camelKey] = obj[key];
    return acc;
  }, {});
};

// Create real entity helpers that connect to Supabase tables
const createEntity = (tableName) => ({
  list: async (orderBy = '-created_at') => {
    const isDescending = orderBy.startsWith('-');
    const column = toSnakeCase(orderBy.replace('-', ''));
    
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .order(column, { ascending: !isDescending });
    
    if (error) throw error;
    return (data || []).map(objectToCamelCase);
  },

  filter: async (filters = {}, orderBy = '-created_at') => {
    const isDescending = orderBy.startsWith('-');
    const column = toSnakeCase(orderBy.replace('-', ''));
    
    let query = supabase.from(tableName).select('*');
    
    const snakeFilters = objectToSnakeCase(filters);
    Object.entries(snakeFilters).forEach(([key, value]) => {
      query = query.eq(key, value);
    });
    
    const { data, error } = await query.order(column, { ascending: !isDescending });
    
    if (error) throw error;
    return (data || []).map(objectToCamelCase);
  },

  get: async (id) => {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .eq('id', id)
      .maybeSingle();
    
    if (error) throw error;
    return data ? objectToCamelCase(data) : null;
  },

  create: async (payload) => {
    const snakePayload = objectToSnakeCase(payload);
    const { data, error } = await supabase
      .from(tableName)
      .insert(snakePayload)
      .select()
      .single();
    
    if (error) throw error;
    return objectToCamelCase(data);
  },

  update: async (id, payload) => {
    const snakePayload = objectToSnakeCase(payload);
    const { data, error } = await supabase
      .from(tableName)
      .update(snakePayload)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return objectToCamelCase(data);
  },

  delete: async (id) => {
    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return { success: true };
  }
});

// Create stub entities for entities not yet migrated
const createStubEntity = (name) => ({
  filter: async () => {
    console.warn(`${name}.filter() called but not implemented. Use Supabase client directly.`);
    return [];
  },
  get: async () => {
    console.warn(`${name}.get() called but not implemented. Use Supabase client directly.`);
    return null;
  },
  create: async () => {
    console.warn(`${name}.create() called but not implemented. Use Supabase client directly.`);
    return null;
  },
  update: async () => {
    console.warn(`${name}.update() called but not implemented. Use Supabase client directly.`);
    return null;
  },
  delete: async () => {
    console.warn(`${name}.delete() called but not implemented. Use Supabase client directly.`);
    return null;
  }
});

// Export stub entities
export const Goal = createStubEntity('Goal');
export const BusinessPlan = createStubEntity('BusinessPlan');
export const DailyAction = createStubEntity('DailyAction');
export const UserOnboarding = createStubEntity('UserOnboarding');
export const UserPreferences = createStubEntity('UserPreferences');
export const UserMarketConfig = createStubEntity('UserMarketConfig');
export const MarketIntelligence = createStubEntity('MarketIntelligence');
export const AgentConfig = createStubEntity('AgentConfig');
export const AgentVoice = createStubEntity('AgentVoice');
export const UserGuidelines = createStubEntity('UserGuidelines');
export const UserKnowledge = createStubEntity('UserKnowledge');
export const CrmConnection = createStubEntity('CrmConnection');
export const TaskTemplate = createEntity('task_templates');
export const ClientPersona = createEntity('client_personas');
export const ContentPack = createStubEntity('ContentPack');
export const ContentTopic = createStubEntity('ContentTopic');
export const FeaturedContentPack = createStubEntity('FeaturedContentPack');
export const GeneratedContent = createStubEntity('GeneratedContent');
export const AiPromptConfig = createStubEntity('AiPromptConfig');
export const CampaignTemplate = createEntity('campaign_templates');
export const Transaction = createStubEntity('Transaction');
export const UserCredit = createStubEntity('UserCredit');
export const CreditTransaction = createStubEntity('CreditTransaction');
export const User = createStubEntity('User');
export const CallLog = createStubEntity('CallLog');
export const RolePlayScenario = createEntity('role_play_scenarios');
export const RolePlaySessionLog = createStubEntity('RolePlaySessionLog');
export const RolePlayUserProgress = createStubEntity('RolePlayUserProgress');
export const RolePlayAnalysisReport = createStubEntity('RolePlayAnalysisReport');
export const ObjectionScript = createEntity('objection_scripts');
export const Referral = createStubEntity('Referral');
export const BrandColorPalette = createStubEntity('BrandColorPalette');
export const UserAgentSubscription = createStubEntity('UserAgentSubscription');
export const LegalDocument = createStubEntity('LegalDocument');
export const EmailTemplate = createStubEntity('EmailTemplate');
export const EmailCampaign = createStubEntity('EmailCampaign');
export const FeatureFlag = createStubEntity('FeatureFlag');
