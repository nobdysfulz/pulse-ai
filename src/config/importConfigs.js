// Import configurations for bulk data import
// Each config defines the structure, validation, and sample data for CSV imports

export const importConfigs = {
  profiles: {
    label: 'User Profiles',
    tableName: 'profiles',
    description: 'Import user profile information including contact details and professional info',
    columnMapping: {
      'Full Name': 'full_name',
      'Email': 'email',
      'Phone': 'phone',
      'Brokerage Name': 'brokerage_name',
      'License Number': 'license_number',
      'Years Experience': 'years_experience',
      'Specialization': 'specialization',
    },
    sampleCsvData: [
      ['Full Name', 'Email', 'Phone', 'Brokerage Name', 'License Number', 'Years Experience', 'Specialization'],
      ['John Smith', 'john@example.com', '555-0123', 'Acme Realty', 'CA-12345', '5', 'Residential'],
      ['Jane Doe', 'jane@example.com', '555-0124', 'Prime Properties', 'CA-67890', '3', 'Commercial'],
    ],
    requiredFields: ['email'],
  },

  goals: {
    label: 'Goals',
    tableName: 'goals',
    description: 'Import annual or quarterly goals with targets and deadlines',
    columnMapping: {
      'Title': 'title',
      'Goal Type': 'goal_type',
      'Target Value': 'target_value',
      'Current Value': 'current_value',
      'Unit': 'unit',
      'Deadline': 'deadline',
      'Timeframe': 'timeframe',
      'Status': 'status',
      'Confidence Score': 'confidence_score',
    },
    sampleCsvData: [
      ['Title', 'Goal Type', 'Target Value', 'Current Value', 'Unit', 'Deadline', 'Timeframe', 'Status', 'Confidence Score'],
      ['Annual GCI Goal', 'financial', '250000', '75000', 'dollars', '2025-12-31', 'annual', 'active', '75'],
      ['Q1 Closings', 'transactions', '15', '4', 'transactions', '2025-03-31', 'quarterly', 'active', '80'],
    ],
    requiredFields: ['title', 'goal_type'],
  },

  daily_actions: {
    label: 'Daily Actions / Tasks',
    tableName: 'daily_actions',
    description: 'Import tasks and action items with due dates and priorities',
    columnMapping: {
      'Title': 'title',
      'Description': 'description',
      'Category': 'category',
      'Priority': 'priority',
      'Status': 'status',
      'Due Date': 'due_date',
      'Scheduled Time': 'scheduled_time',
      'Duration Minutes': 'duration_minutes',
    },
    sampleCsvData: [
      ['Title', 'Description', 'Category', 'Priority', 'Status', 'Due Date', 'Scheduled Time', 'Duration Minutes'],
      ['Follow up with lead', 'Call John about property inquiry', 'follow_up', 'high', 'pending', '2025-01-15', '10:00', '30'],
      ['Market research', 'Research comparables in Downtown', 'research', 'medium', 'pending', '2025-01-16', '14:00', '60'],
    ],
    requiredFields: ['title', 'category', 'due_date'],
  },

  transactions: {
    label: 'Transactions',
    tableName: 'transactions',
    description: 'Import active and closed transactions with commission details',
    columnMapping: {
      'Client Name': 'client_name',
      'Transaction Type': 'transaction_type',
      'Property Address': 'property_address',
      'Status': 'status',
      'Commission Amount': 'commission_amount',
      'Expected Close Date': 'expected_close_date',
      'Notes': 'notes',
    },
    sampleCsvData: [
      ['Client Name', 'Transaction Type', 'Property Address', 'Status', 'Commission Amount', 'Expected Close Date', 'Notes'],
      ['Bob Johnson', 'listing', '123 Main St, Anytown', 'pending', '15000', '2025-02-15', 'Hot market'],
      ['Sarah Williams', 'buyer', '456 Oak Ave, Somewhere', 'active', '12000', '2025-03-01', 'First time buyer'],
    ],
    requiredFields: ['client_name', 'transaction_type'],
  },

  business_plans: {
    label: 'Business Plans',
    tableName: 'business_plans',
    description: 'Import annual business plans with GCI goals and breakdown',
    columnMapping: {
      'Annual GCI Goal': 'annual_gci_goal',
      'Average Commission': 'average_commission',
      'Transactions Needed': 'transactions_needed',
    },
    sampleCsvData: [
      ['Annual GCI Goal', 'Average Commission', 'Transactions Needed'],
      ['300000', '10000', '30'],
    ],
    requiredFields: ['annual_gci_goal'],
  },

  market_config: {
    label: 'Market Configuration',
    tableName: 'market_config',
    description: 'Import market area settings and statistics',
    columnMapping: {
      'Market Name': 'market_name',
      'City': 'city',
      'State': 'state',
      'Average Price': 'average_price',
      'Market Trend': 'market_trend',
      'Inventory Level': 'inventory_level',
      'Median DOM': 'median_dom',
    },
    sampleCsvData: [
      ['Market Name', 'City', 'State', 'Average Price', 'Market Trend', 'Inventory Level', 'Median DOM'],
      ['Downtown District', 'San Francisco', 'CA', '1250000', 'rising', 'low', '25'],
    ],
    requiredFields: ['market_name'],
  },

  generated_content: {
    label: 'Generated Content',
    tableName: 'generated_content',
    description: 'Import previously generated marketing content and posts',
    columnMapping: {
      'Title': 'title',
      'Content Type': 'content_type',
      'Content': 'content',
      'Prompt Used': 'prompt_used',
    },
    sampleCsvData: [
      ['Title', 'Content Type', 'Content', 'Prompt Used'],
      ['Spring Market Update', 'social_post', 'Spring is here and the market is heating up! 🏡', 'Create a spring market post'],
      ['New Listing Email', 'email', 'Just listed: Beautiful 3BR home in prime location...', 'Draft new listing announcement'],
    ],
    requiredFields: ['content_type', 'content'],
  },

  pulse_scores: {
    label: 'Pulse Scores',
    tableName: 'pulse_scores',
    description: 'Import historical Pulse performance scores',
    columnMapping: {
      'Date': 'date',
      'Overall Score': 'overall_score',
      'Production Score': 'production_score',
      'Pipeline Score': 'pipeline_score',
      'Activities Score': 'activities_score',
      'Mindset Score': 'mindset_score',
      'Systems Score': 'systems_score',
    },
    sampleCsvData: [
      ['Date', 'Overall Score', 'Production Score', 'Pipeline Score', 'Activities Score', 'Mindset Score', 'Systems Score'],
      ['2025-01-01', '75', '80', '70', '75', '80', '70'],
      ['2025-01-02', '78', '82', '72', '78', '82', '72'],
    ],
    requiredFields: ['date', 'overall_score'],
  },

  agent_config: {
    label: 'AI Agent Configuration',
    tableName: 'agent_config',
    description: 'Import AI agent settings and preferences',
    columnMapping: {
      'Agent Type': 'agent_type',
      'Enabled': 'enabled',
      'Response Style': 'response_style',
      'Voice ID': 'voice_id',
      'Voice Name': 'voice_name',
      'Personality Traits': 'personality_traits',
    },
    sampleCsvData: [
      ['Agent Type', 'Enabled', 'Response Style', 'Voice ID', 'Voice Name', 'Personality Traits'],
      ['nova', 'true', 'professional', 'voice_123', 'Professional Female', 'helpful|organized|proactive'],
      ['sirius', 'true', 'creative', 'voice_456', 'Creative Male', 'creative|confident|engaging'],
    ],
    requiredFields: ['agent_type'],
  },

  user_preferences: {
    label: 'User Preferences',
    tableName: 'user_preferences',
    description: 'Import user app preferences and settings',
    columnMapping: {
      'Theme': 'theme',
      'Notifications Enabled': 'notifications_enabled',
      'Email Notifications': 'email_notifications',
      'Weekly Report': 'weekly_report',
    },
    sampleCsvData: [
      ['Theme', 'Notifications Enabled', 'Email Notifications', 'Weekly Report'],
      ['dark', 'true', 'true', 'true'],
    ],
    requiredFields: [],
  },

  crm_connections: {
    label: 'CRM Connections',
    tableName: 'crm_connections',
    description: 'Import CRM integration settings (credentials should be re-entered manually for security)',
    columnMapping: {
      'Provider': 'provider',
      'Connection Status': 'connection_status',
    },
    sampleCsvData: [
      ['Provider', 'Connection Status'],
      ['follow_up_boss', 'disconnected'],
      ['lofty', 'disconnected'],
    ],
    requiredFields: ['provider'],
  },

  external_service_connections: {
    label: 'External Service Connections',
    tableName: 'external_service_connections',
    description: 'Import external service integration settings',
    columnMapping: {
      'Service Name': 'service_name',
      'Connection Status': 'connection_status',
    },
    sampleCsvData: [
      ['Service Name', 'Connection Status'],
      ['google_workspace', 'disconnected'],
      ['zoom', 'disconnected'],
    ],
    requiredFields: ['service_name'],
  },

  // ============= ADMIN-MANAGED TABLES =============
  // These tables are global and don't have user_id columns

  task_templates: {
    label: 'Task Templates (Admin)',
    tableName: 'task_templates',
    description: 'Import system-wide task templates for intelligent action generation',
    columnMapping: {
      'title': 'title',
      'description': 'description',
      'category': 'category',
      'action_type': 'action_type',
      'trigger_type': 'trigger_type',
      'trigger_value': 'trigger_value',
      'priority': 'priority',
      'priority_weight': 'priority_weight',
      'display_category': 'display_category',
      'impact_area': 'impact_area',
    },
    sampleCsvData: [
      ['title', 'description', 'category', 'action_type', 'priority', 'trigger_type', 'trigger_value', 'impact_area'],
      ['Follow up with hot lead', 'Contact lead within 24 hours', 'power_hour', 'lead_generation', 'high', 'day_of_week', '2', '8'],
      ['Call 12 past clients', 'Use the FORD script to do check-in calls', 'power_hour', 'client_follow_up', 'high', 'day_of_week', '5', '8'],
    ],
    requiredFields: ['title', 'category', 'action_type', 'trigger_type'],
  },

  objection_scripts: {
    label: 'Objection Scripts (Admin)',
    tableName: 'objection_scripts',
    description: 'Import roleplay objection handling scripts and responses',
    columnMapping: {
      'title': 'title',
      'category': 'category',
      'situation': 'situation',
      'difficulty': 'difficulty',
      'response': 'response',
      'tips': 'tips',
      'isFree': 'is_free',
      'isActive': 'is_active',
      'isPopular': 'is_popular',
      'sortOrder': 'sort_order',
    },
    sampleCsvData: [
      ['title', 'category', 'difficulty', 'situation', 'response', 'tips', 'isFree', 'isPopular', 'isActive', 'sortOrder'],
      ['"Your commission is too high"', 'price_objections', 'intermediate', 'A seller questions your commission rate compared to discount brokers', 'I understand commission is an important consideration...', '["Focus on value, not cost","Use market statistics","Ask questions"]', 'true', 'true', 'true', '1'],
    ],
    requiredFields: ['title', 'category', 'situation', 'difficulty', 'response'],
  },

  role_play_scenarios: {
    label: 'Role Play Scenarios (Admin)',
    tableName: 'role_play_scenarios',
    description: 'Import AI-powered roleplay training scenarios',
    columnMapping: {
      'name': 'name',
      'description': 'description',
      'category': 'category',
      'difficultyLevel': 'difficulty_level',
      'clientPersona': 'client_persona',
      'initialContext': 'initial_context',
      'learningObjectives': 'learning_objectives',
      'successCriteria': 'success_criteria',
      'averageDurationMinutes': 'average_duration_minutes',
      'passingThreshold': 'passing_threshold',
      'isPremium': 'is_premium',
      'isPopular': 'is_popular',
      'isActive': 'is_active',
      'elevenLabsAgentId': 'eleven_labs_agent_id',
      'elevenLabsPhoneNumberId': 'eleven_labs_phone_number_id',
      'elevenLabsVoiceId': 'eleven_labs_voice_id',
      'firstMessageOverride': 'first_message_override',
      'avatarImageUrl': 'avatar_image_url',
    },
    sampleCsvData: [
      ['category', 'difficultyLevel', 'name', 'description', 'initialContext', 'clientPersona', 'passingThreshold', 'learningObjectives', 'averageDurationMinutes', 'successCriteria', 'isActive', 'isPopular', 'isPremium'],
      ['price_objections', 'beginner', '"Can you lower your commission?"', 'A seller is questioning your commission rate', 'You are a homeowner looking to sell...', 'helpless_victim', '75', '["Value Proposition","Commission Justification"]', '5', '["Successfully justify your commission"]', 'true', 'true', 'false'],
    ],
    requiredFields: ['name', 'category', 'difficultyLevel', 'clientPersona', 'initialContext'],
  },

  email_templates: {
    label: 'Email Templates (Admin)',
    tableName: 'email_templates',
    description: 'Import system-wide email templates for campaigns',
    columnMapping: {
      'Template Name': 'template_name',
      'Template Key': 'template_key',
      'Category': 'category',
      'Subject': 'subject',
      'Body HTML': 'body_html',
      'Body Text': 'body_text',
      'Is Active': 'is_active',
    },
    sampleCsvData: [
      ['Template Name', 'Template Key', 'Category', 'Subject', 'Body HTML', 'Body Text', 'Is Active'],
      ['New Listing Announcement', 'new_listing', 'marketing', 'Just Listed: {{property_address}}', '<h1>New Listing</h1><p>Check out this amazing property!</p>', 'New Listing - Check out this amazing property!', 'true'],
    ],
    requiredFields: ['template_name', 'template_key', 'category', 'subject', 'body_html'],
  },

  content_topics: {
    label: 'Content Topics (Admin)',
    tableName: 'content_topics',
    description: 'Import content generation topics and prompts',
    columnMapping: {
      'Topic Name': 'topic_name',
      'Topic Key': 'topic_key',
      'Category': 'category',
      'Description': 'description',
      'Is Active': 'is_active',
    },
    sampleCsvData: [
      ['Topic Name', 'Topic Key', 'Category', 'Description', 'Is Active'],
      ['Market Update', 'market_update', 'market_intelligence', 'Monthly market trends and statistics', 'true'],
      ['Home Buying Tips', 'buyer_tips', 'education', 'Helpful tips for homebuyers', 'true'],
    ],
    requiredFields: ['topic_name', 'topic_key', 'category'],
  },

  client_personas: {
    label: 'Client Personas (Admin)',
    tableName: 'client_personas',
    description: 'Import AI training client personality types',
    columnMapping: {
      'personaKey': 'persona_key',
      'personaName': 'persona_name',
      'description': 'description',
      'personality': 'personality_traits',
      'speakingStyle': 'communication_style',
      'typicalObjections': 'objection_patterns',
      'isActive': 'is_active',
    },
    sampleCsvData: [
      ['personaKey', 'personaName', 'description', 'personality', 'speakingStyle', 'typicalObjections', 'isActive'],
      ['angry_frustrated', 'Angry & Frustrated', 'Already upset about the process', 'Short-tempered, impatient, easily agitated', 'Abrupt, raised voice, accusatory', '["This is ridiculous!","Why is this so difficult?"]', 'true'],
    ],
    requiredFields: ['personaKey', 'personaName'],
  },

  ai_prompt_configs: {
    label: 'AI Prompt Configs (Admin)',
    tableName: 'ai_prompt_configs',
    description: 'Import system AI prompt templates',
    columnMapping: {
      'Prompt Name': 'prompt_name',
      'Prompt Key': 'prompt_key',
      'Category': 'category',
      'Prompt Template': 'prompt_template',
      'Is Active': 'is_active',
    },
    sampleCsvData: [
      ['Prompt Name', 'Prompt Key', 'Category', 'Prompt Template', 'Is Active'],
      ['Social Post Generator', 'social_post', 'content', 'Generate an engaging social media post about {{topic}}', 'true'],
    ],
    requiredFields: ['prompt_name', 'prompt_key', 'category', 'prompt_template'],
  },

  featured_content_packs: {
    label: 'Featured Content Packs (Admin)',
    tableName: 'featured_content_packs',
    description: 'Import featured content pack collections',
    columnMapping: {
      'Title': 'title',
      'Category': 'category',
      'Description': 'description',
      'Icon': 'icon',
      'Sort Order': 'sort_order',
      'Is Active': 'is_active',
    },
    sampleCsvData: [
      ['Title', 'Category', 'Description', 'Icon', 'Sort Order', 'Is Active'],
      ['Spring Market Pack', 'seasonal', 'Complete spring marketing content bundle', 'sun', '1', 'true'],
    ],
    requiredFields: ['title', 'category'],
  },

  content_packs: {
    label: 'Content Packs (Admin)',
    tableName: 'content_packs',
    description: 'Import content pack templates',
    columnMapping: {
      'Pack Name': 'pack_name',
      'Pack Key': 'pack_key',
      'Category': 'category',
      'Description': 'description',
      'Is Premium': 'is_premium',
      'Is Active': 'is_active',
    },
    sampleCsvData: [
      ['Pack Name', 'Pack Key', 'Category', 'Description', 'Is Premium', 'Is Active'],
      ['Listing Launch Kit', 'listing_launch', 'marketing', '7-day listing promotion content', 'true', 'true'],
    ],
    requiredFields: ['pack_name', 'pack_key', 'category'],
  },

  brand_color_palettes: {
    label: 'Brand Color Palettes (Admin)',
    tableName: 'brand_color_palettes',
    description: 'Import brand color palette options',
    columnMapping: {
      'paletteId': 'palette_id',
      'name': 'palette_name',
      'primaryColorHex': 'primary_color',
      'secondaryColorHex': 'secondary_color',
      'accentColorHex1': 'accent_color',
      'isActive': 'is_active',
    },
    sampleCsvData: [
      ['paletteId', 'name', 'primaryColorHex', 'secondaryColorHex', 'accentColorHex1', 'accentColorHex2', 'isActive'],
      ['modern_storm', 'Modern Storm', '#222831', '#083377', '#00ADB5', '#FFFFFF', 'true'],
      ['luxury_gold', 'Luxury Gold', '#111827', '#D4AF37', '#F9FAFB', '#6B7280', 'true'],
    ],
    requiredFields: ['name', 'primaryColorHex', 'secondaryColorHex'],
  },

  agent_voices: {
    label: 'Agent Voices (Admin)',
    tableName: 'agent_voices',
    description: 'Import AI agent voice options',
    columnMapping: {
      'name': 'voice_name',
      'voice_id': 'voice_id',
      'previewAudioUrl': 'voice_settings',
      'isActive': 'voice_settings',
    },
    sampleCsvData: [
      ['name', 'voice_id', 'previewAudioUrl', 'isActive'],
      ['Ella', 'DODLEQrClDo8wCz460ld', 'https://example.com/ella.mp3', 'true'],
      ['Leo', 'h2I5OFX58E5TL5AitYwR', 'https://example.com/leo.mp3', 'true'],
    ],
    requiredFields: ['name', 'voice_id'],
  },

  call_logs: {
    label: 'Call Logs',
    tableName: 'call_logs',
    description: 'Import call history from ElevenLabs or other sources',
    columnMapping: {
      'contactName': 'contact_name',
      'contactPhone': 'phone_number',
      'status': 'status',
      'duration': 'duration_seconds',
      'recordingUrl': 'recording_url',
      'conversationId': 'metadata',
      'callSid': 'metadata',
      'transcript': 'metadata',
      'analysis': 'metadata',
    },
    sampleCsvData: [
      ['conversationId', 'callSid', 'contactName', 'contactPhone', 'campaignName', 'status', 'duration', 'recordingUrl'],
      ['conv_123', 'CA123', 'John Smith', '+14698057702', 'Expired Listings', 'done', '19', 'https://example.com/recording.mp3'],
    ],
    requiredFields: ['contactName'],
  },

  legal_documents: {
    label: 'Legal Documents (Admin)',
    tableName: 'legal_documents',
    description: 'Import legal documents and terms of service',
    columnMapping: {
      'documentType': 'document_type',
      'title': 'title',
      'content': 'content',
      'lastUpdated': 'effective_date',
    },
    sampleCsvData: [
      ['documentType', 'title', 'content', 'lastUpdated'],
      ['agent_onboarding_terms', 'AI Agent Terms of Use', 'IMPORTANT: READ CAREFULLY...', '2025-10-01'],
    ],
    requiredFields: ['documentType', 'title', 'content'],
  },

  campaign_templates: {
    label: 'Campaign Templates (Admin)',
    tableName: 'campaign_templates',
    description: 'Import email campaign templates',
    columnMapping: {
      'file_name': 'file_name',
      'file_uri': 'file_uri',
    },
    sampleCsvData: [
      ['file_name', 'file_uri'],
      ['Spring Campaign 2025.xlsx', 'https://example.com/template.xlsx'],
    ],
    requiredFields: ['file_name', 'file_uri'],
  },
};

export const getEntityOptions = () => {
  return Object.keys(importConfigs).map(key => ({
    value: key,
    label: importConfigs[key].label,
  }));
};
