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
      .maybeSingle();
    
    if (error) throw error;
    return data ? objectToCamelCase(data) : null;
  },

  update: async (id, payload) => {
    const snakePayload = objectToSnakeCase(payload);
    const { data, error } = await supabase
      .from(tableName)
      .update(snakePayload)
      .eq('id', id)
      .select()
      .maybeSingle();
    
    if (error) throw error;
    return data ? objectToCamelCase(data) : null;
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

// Export real entity connections
export const Goal = createEntity('goals');
export const BusinessPlan = createEntity('business_plans');
export const DailyAction = createEntity('daily_actions');
export const UserOnboarding = createEntity('user_onboarding');
export const UserPreferences = createEntity('user_preferences');
export const UserMarketConfig = createEntity('market_config');
export const MarketIntelligence = createEntity('market_intelligence');
export const AgentConfig = createEntity('agent_config');
export const AgentVoice = createEntity('agent_voices');
export const UserGuidelines = createEntity('user_guidelines');
export const UserKnowledge = createEntity('user_knowledge');
export const CrmConnection = createEntity('crm_connections');
export const TaskTemplate = createEntity('task_templates');
export const ClientPersona = createEntity('client_personas');
export const ContentPack = createEntity('content_packs');
export const ContentTopic = createEntity('content_topics');
export const FeaturedContentPack = createEntity('featured_content_packs');
export const GeneratedContent = createEntity('generated_content');
export const AiPromptConfig = createEntity('ai_prompt_configs');
export const CampaignTemplate = createEntity('campaign_templates');
export const Transaction = createEntity('transactions');
export const UserCredit = createEntity('user_credits');
export const CreditTransaction = createEntity('credit_transactions');
export const CallLog = createEntity('call_logs');
export const RolePlayScenario = createEntity('role_play_scenarios');
export const RolePlaySessionLog = createEntity('role_play_session_logs');
export const RolePlayUserProgress = createEntity('role_play_user_progress');
export const RolePlayAnalysisReport = createEntity('role_play_analysis_reports');
export const ObjectionScript = createEntity('objection_scripts');
export const Referral = createEntity('referrals');
export const BrandColorPalette = createEntity('brand_color_palettes');
export const UserAgentSubscription = createEntity('user_agent_subscriptions');
export const LegalDocument = createEntity('legal_documents');
export const EmailTemplate = createEntity('email_templates');
export const EmailCampaign = createEntity('email_campaigns');
export const FeatureFlag = createEntity('feature_flags');

// User entity remains stub as it references auth.users which is not directly accessible
export const User = createStubEntity('User');
