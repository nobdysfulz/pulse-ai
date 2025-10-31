// Stub file to prevent import errors while migrating to Supabase
// All entities should be accessed directly via Supabase client

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
export const TaskTemplate = createStubEntity('TaskTemplate');
export const ClientPersona = createStubEntity('ClientPersona');
export const ContentPack = createStubEntity('ContentPack');
export const ContentTopic = createStubEntity('ContentTopic');
export const FeaturedContentPack = createStubEntity('FeaturedContentPack');
export const GeneratedContent = createStubEntity('GeneratedContent');
export const AiPromptConfig = createStubEntity('AiPromptConfig');
export const CampaignTemplate = createStubEntity('CampaignTemplate');
export const Transaction = createStubEntity('Transaction');
export const UserCredit = createStubEntity('UserCredit');
export const CreditTransaction = createStubEntity('CreditTransaction');
export const User = createStubEntity('User');
export const CallLog = createStubEntity('CallLog');
export const RolePlayScenario = createStubEntity('RolePlayScenario');
export const RolePlaySessionLog = createStubEntity('RolePlaySessionLog');
export const RolePlayUserProgress = createStubEntity('RolePlayUserProgress');
export const RolePlayAnalysisReport = createStubEntity('RolePlayAnalysisReport');
export const ObjectionScript = createStubEntity('ObjectionScript');
export const Referral = createStubEntity('Referral');
export const BrandColorPalette = createStubEntity('BrandColorPalette');
