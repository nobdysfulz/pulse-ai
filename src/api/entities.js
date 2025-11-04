// Entity API helpers - enhanced with compatibility layer
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

// Compatibility mapping for field name mismatches
const fieldCompatibilityMap = {
  referrals: { referrerId: 'referrer_user_id', referredUserEmail: 'referred_email' },
  user_credits: { creditsRemaining: 'credits_available', resetDate: 'last_reset_at' },
};

// Order field mapping (created_date -> created_at, etc.)
const orderFieldMap = {
  created_date: 'created_at',
  updated_date: 'updated_at',
  weekNumber: 'created_at',
};

// Normalize order parameter
const normalizeOrder = (orderBy) => {
  if (!orderBy || typeof orderBy !== 'string') return orderBy;
  const isDescending = orderBy.startsWith('-');
  const field = orderBy.replace('-', '');
  const mappedField = orderFieldMap[field] || toSnakeCase(field);
  return isDescending ? `-${mappedField}` : mappedField;
};

// Normalize filters
const normalizeFilters = (tableName, filters) => {
  if (!filters || typeof filters !== 'object') return filters;
  
  const compatMap = fieldCompatibilityMap[tableName] || {};
  const normalized = {};
  
  Object.entries(filters).forEach(([key, value]) => {
    // Skip isActive filter for agent_voices (stored in voice_settings jsonb)
    if (tableName === 'agent_voices' && key === 'isActive') return;
    
    const mappedKey = compatMap[key] || toSnakeCase(key);
    normalized[mappedKey] = value;
  });
  
  return normalized;
};

// Add backward compatibility aliases to response
const addResponseAliases = (tableName, obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  
  // Add date aliases
  if (obj.createdAt) obj.created_date = obj.createdAt;
  if (obj.updatedAt) obj.updated_date = obj.updatedAt;
  
  // Table-specific aliases
  if (tableName === 'user_credits') {
    if (obj.creditsAvailable !== undefined) obj.creditsRemaining = obj.creditsAvailable;
    if (obj.lastResetAt) obj.resetDate = obj.lastResetAt;
  }
  
  if (tableName === 'referrals') {
    if (obj.referrerUserId) obj.referrerId = obj.referrerUserId;
    if (obj.referredEmail) obj.referredUserEmail = obj.referredEmail;
    if (obj.createdAt) obj.referralDate = obj.createdAt;
    obj.creditsAwarded = (obj.status === 'completed') ? 5 : 0;
  }
  
  if (tableName === 'agent_voices' && obj.voiceSettings) {
    obj.previewAudioUrl = obj.voiceSettings?.previewAudioUrl || null;
    obj.isActive = obj.voiceSettings?.isActive !== false;
  }
  
  return obj;
};

// Create real entity helpers that connect to Supabase tables
const createEntity = (tableName) => ({
  list: async (orderBy = '-created_at') => {
    const normalizedOrder = normalizeOrder(orderBy);
    const isDescending = normalizedOrder.startsWith('-');
    const column = normalizedOrder.replace('-', '');
    
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .order(column, { ascending: !isDescending });
    
    if (error) throw error;
    return (data || []).map(item => addResponseAliases(tableName, objectToCamelCase(item)));
  },

  filter: async (filters = {}, orderBy = '-created_at') => {
    const normalizedFilters = normalizeFilters(tableName, filters);
    const normalizedOrder = normalizeOrder(orderBy);
    const isDescending = normalizedOrder.startsWith('-');
    const column = normalizedOrder.replace('-', '');
    
    let query = supabase.from(tableName).select('*');
    
    Object.entries(normalizedFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        query = query.eq(key, value);
      }
    });
    
    const { data, error } = await query.order(column, { ascending: !isDescending });
    
    if (error) throw error;
    return (data || []).map(item => addResponseAliases(tableName, objectToCamelCase(item)));
  },

  get: async (id) => {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .eq('id', id)
      .maybeSingle();
    
    if (error) throw error;
    return data ? addResponseAliases(tableName, objectToCamelCase(data)) : null;
  },

  create: async (payload) => {
    // Handle agent_voices special case: store extra fields in voice_settings
    let finalPayload = { ...payload };
    if (tableName === 'agent_voices') {
      const { previewAudioUrl, isActive, ...rest } = payload;
      finalPayload = {
        ...rest,
        voice_settings: {
          previewAudioUrl: previewAudioUrl || null,
          isActive: isActive !== false
        }
      };
    }
    
    const snakePayload = objectToSnakeCase(finalPayload);
    const { data, error } = await supabase
      .from(tableName)
      .insert(snakePayload)
      .select()
      .maybeSingle();
    
    if (error) throw error;
    return data ? addResponseAliases(tableName, objectToCamelCase(data)) : null;
  },

  update: async (id, payload) => {
    // Handle agent_voices special case
    let finalPayload = { ...payload };
    if (tableName === 'agent_voices') {
      const { previewAudioUrl, isActive, ...rest } = payload;
      finalPayload = {
        ...rest,
        voice_settings: {
          previewAudioUrl: previewAudioUrl || null,
          isActive: isActive !== false
        }
      };
    }
    
    const snakePayload = objectToSnakeCase(finalPayload);
    const { data, error } = await supabase
      .from(tableName)
      .update(snakePayload)
      .eq('id', id)
      .select()
      .maybeSingle();
    
    if (error) throw error;
    return data ? addResponseAliases(tableName, objectToCamelCase(data)) : null;
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
export const MarketData = createEntity('market_data');
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
export const ContentPreference = createEntity('content_preferences');
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
export const AiAgentConversation = createEntity('ai_agent_conversations');
export const ExternalServiceConnection = createEntity('external_service_connections');

// User entity remains stub as it references auth.users which is not directly accessible
export const User = createStubEntity('User');
