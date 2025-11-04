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

const sanitizeString = (value) => {
  if (value === undefined || value === null) return null;
  const trimmed = String(value).trim();
  return trimmed.length > 0 ? trimmed : null;
};

const parseNameParts = (profile = {}, metadata = {}) => {
  const first = profile.first_name ?? metadata.first_name ?? profile.firstName ?? metadata.firstName;
  const last = profile.last_name ?? metadata.last_name ?? profile.lastName ?? metadata.lastName;

  if (first || last) {
    return {
      firstName: first ? String(first).trim() : '',
      lastName: last ? String(last).trim() : ''
    };
  }

  const full = profile.full_name ?? metadata.full_name ?? '';
  const parts = String(full).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return { firstName: '', lastName: '' };
  }

  return {
    firstName: parts[0] ?? '',
    lastName: parts.slice(1).join(' ') ?? ''
  };
};

const deriveAvatar = (profile = {}, metadata = {}) => {
  return (
    profile.avatar_url ||
    profile.avatar ||
    metadata.avatar_url ||
    metadata.avatar ||
    metadata.picture ||
    null
  );
};

const fetchUserRoles = async (userId) => {
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId);

  if (error) {
    console.warn('[entities] Failed to load user roles:', error.message);
    return [];
  }

  return Array.isArray(data) ? data.map((role) => role.role) : [];
};

const buildUserObject = (session, profile, roles = []) => {
  if (!session) return null;

  const metadata = session.user?.user_metadata || {};
  const nameParts = parseNameParts(profile, metadata);
  const avatar = deriveAvatar(profile, metadata);

  const licenseStateValue = profile?.license_state ?? profile?.state ?? profile?.specialization ?? null;
  const brokerageValue = profile?.brokerage ?? profile?.brokerage_name ?? null;
  const licenseNumberValue = profile?.license_number ?? profile?.licenseNumber ?? null;
  const yearsExperienceValue = profile?.years_experience ?? profile?.yearsExperience ?? null;
  const phoneValue = profile?.phone ?? null;

  const normalizedProfile = {
    ...profile,
    firstName: nameParts.firstName,
    lastName: nameParts.lastName,
    full_name: profile?.full_name ?? [nameParts.firstName, nameParts.lastName].filter(Boolean).join(' '),
    brokerage: brokerageValue ?? '',
    brokerage_name: brokerageValue ?? null,
    licenseNumber: licenseNumberValue ?? '',
    license_number: licenseNumberValue ?? null,
    licenseState: licenseStateValue ?? '',
    phone: phoneValue ?? '',
    yearsExperience: typeof yearsExperienceValue === 'number' || yearsExperienceValue === null
      ? yearsExperienceValue
      : Number(yearsExperienceValue) || null,
    avatar: avatar,
    avatar_url: avatar,
  };

  const isAdmin = roles.includes('admin');

  return {
    id: session.user.id,
    email: session.user.email,
    role: isAdmin ? 'admin' : 'user',
    roles,
    isAdmin,
    ...normalizedProfile,
  };
};

const getActiveSession = async () => {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
};

const loadProfile = async (userId) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  return data || {};
};

const normalizeProfileUpdates = (payload, existingProfile = {}) => {
  const first = sanitizeString(payload.firstName);
  const last = sanitizeString(payload.lastName);
  const fullName = sanitizeString(payload.fullName) || [first, last].filter(Boolean).join(' ');

  const updates = {
    full_name: fullName || null,
    brokerage_name: sanitizeString(payload.brokerage),
    phone: sanitizeString(payload.phone),
    license_number: sanitizeString(payload.licenseNumber),
    updated_at: new Date().toISOString(),
  };

  const hasYearsExperience = payload.yearsExperience !== undefined && payload.yearsExperience !== null && String(payload.yearsExperience).trim() !== '';
  if (hasYearsExperience) {
    updates.years_experience = Number(payload.yearsExperience);
  } else if (Object.prototype.hasOwnProperty.call(existingProfile, 'years_experience')) {
    updates.years_experience = null;
  }

  const licenseStateValue = sanitizeString(payload.licenseState);
  if (licenseStateValue !== null) {
    if (Object.prototype.hasOwnProperty.call(existingProfile, 'license_state')) {
      updates.license_state = licenseStateValue;
    } else if (Object.prototype.hasOwnProperty.call(existingProfile, 'state')) {
      updates.state = licenseStateValue;
    } else if (Object.prototype.hasOwnProperty.call(existingProfile, 'specialization')) {
      updates.specialization = licenseStateValue;
    } else {
      // default to specialization to preserve data if schema lacks dedicated field
      updates.specialization = licenseStateValue;
    }
  } else if (licenseStateValue === null) {
    if (Object.prototype.hasOwnProperty.call(existingProfile, 'license_state')) {
      updates.license_state = null;
    } else if (Object.prototype.hasOwnProperty.call(existingProfile, 'state')) {
      updates.state = null;
    } else if (Object.prototype.hasOwnProperty.call(existingProfile, 'specialization')) {
      updates.specialization = null;
    }
  }

  const avatarValue = sanitizeString(payload.avatar);
  if (avatarValue !== null) {
    if (Object.prototype.hasOwnProperty.call(existingProfile, 'avatar_url')) {
      updates.avatar_url = avatarValue;
    } else if (Object.prototype.hasOwnProperty.call(existingProfile, 'avatar')) {
      updates.avatar = avatarValue;
    } else {
      updates.avatar_url = avatarValue;
    }
  } else if (avatarValue === null) {
    if (Object.prototype.hasOwnProperty.call(existingProfile, 'avatar_url')) {
      updates.avatar_url = null;
    } else if (Object.prototype.hasOwnProperty.call(existingProfile, 'avatar')) {
      updates.avatar = null;
    }
  }

  const cleaned = Object.fromEntries(
    Object.entries(updates).filter(([, value]) => value !== undefined)
  );

  return cleaned;
};

const applyProfileUpdate = async (userId, updates) => {
  const { error } = await supabase
    .from('profiles')
    .upsert({ id: userId, ...updates }, { onConflict: 'id' });

  if (error) throw error;
};

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

// Enhanced User entity with real implementations for current user operations
const UserStub = createStubEntity('User');

const fetchUserProfileWithSession = async () => {
  const session = await getActiveSession();
  if (!session) return null;

  const [profile, roles] = await Promise.all([
    loadProfile(session.user.id),
    fetchUserRoles(session.user.id)
  ]);

  return buildUserObject(session, profile, roles);
};

export const User = {
  ...UserStub,
  me: async () => {
    const user = await fetchUserProfileWithSession();
    if (!user) {
      console.warn('[entities] User.me() called with no active session');
    }
    return user;
  },
  updateMyUserData: async (payload = {}) => {
    const session = await getActiveSession();
    if (!session) {
      throw new Error('Not authenticated');
    }

    const profile = await loadProfile(session.user.id);
    const updates = normalizeProfileUpdates(payload, profile);

    await applyProfileUpdate(session.user.id, updates);

    return await fetchUserProfileWithSession();
  },
};
