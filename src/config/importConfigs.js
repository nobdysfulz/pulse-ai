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
      'Title': 'title',
      'Description': 'description',
      'Category': 'category',
      'Action Type': 'action_type',
      'Trigger Type': 'trigger_type',
      'Trigger Value': 'trigger_value',
      'Priority': 'priority',
      'Priority Weight': 'priority_weight',
      'Display Category': 'display_category',
      'Impact Area': 'impact_area',
      'Is Active': 'is_active',
    },
    sampleCsvData: [
      ['Title', 'Description', 'Category', 'Action Type', 'Trigger Type', 'Trigger Value', 'Priority', 'Priority Weight', 'Display Category', 'Impact Area', 'Is Active'],
      ['Follow up with hot lead', 'Contact lead within 24 hours', 'follow_up', 'call', 'pulse_score', '85', 'high', '5', 'Lead Generation', 'pipeline', 'true'],
      ['Schedule property showing', 'Set up showing for interested buyer', 'showing', 'calendar', 'transaction_stage', '2', 'medium', '3', 'Client Services', 'production', 'true'],
    ],
    requiredFields: ['title', 'category', 'action_type', 'trigger_type'],
  },

  objection_scripts: {
    label: 'Objection Scripts (Admin)',
    tableName: 'objection_scripts',
    description: 'Import roleplay objection handling scripts and responses',
    columnMapping: {
      'Title': 'title',
      'Category': 'category',
      'Situation': 'situation',
      'Difficulty': 'difficulty',
      'Response': 'response',
      'Tips': 'tips',
      'Is Free': 'is_free',
      'Is Active': 'is_active',
      'Is Popular': 'is_popular',
      'Sort Order': 'sort_order',
    },
    sampleCsvData: [
      ['Title', 'Category', 'Situation', 'Difficulty', 'Response', 'Tips', 'Is Free', 'Is Active', 'Is Popular', 'Sort Order'],
      ['Price Too High', 'pricing', 'Client says your listing price is too high', 'medium', 'I understand your concern. Let me show you the comparable sales data...', 'Stay calm|Use data|Acknowledge concerns', 'true', 'true', 'true', '1'],
      ['Not Ready Yet', 'timing', 'Client is not ready to commit', 'easy', 'I completely understand. What timeline works best for you?', 'Be patient|Ask questions|Offer value', 'true', 'true', 'false', '2'],
    ],
    requiredFields: ['title', 'category', 'situation', 'difficulty', 'response'],
  },

  role_play_scenarios: {
    label: 'Role Play Scenarios (Admin)',
    tableName: 'role_play_scenarios',
    description: 'Import AI-powered roleplay training scenarios',
    columnMapping: {
      'Name': 'name',
      'Description': 'description',
      'Category': 'category',
      'Difficulty Level': 'difficulty_level',
      'Client Persona': 'client_persona',
      'Initial Context': 'initial_context',
      'Learning Objectives': 'learning_objectives',
      'Success Criteria': 'success_criteria',
      'Average Duration Minutes': 'average_duration_minutes',
      'Passing Threshold': 'passing_threshold',
      'Is Premium': 'is_premium',
      'Is Popular': 'is_popular',
      'Is Active': 'is_active',
    },
    sampleCsvData: [
      ['Name', 'Description', 'Category', 'Difficulty Level', 'Client Persona', 'Initial Context', 'Learning Objectives', 'Success Criteria', 'Average Duration Minutes', 'Passing Threshold', 'Is Premium', 'Is Popular', 'Is Active'],
      ['First Time Buyer Consultation', 'Handle initial consultation with nervous first-time buyer', 'buyer', 'beginner', 'first_time_buyer', 'Client just reached out about buying their first home', 'Build rapport|Explain process|Address concerns', 'Active listening|Clear explanations|Confidence building', '15', '70', 'false', 'true', 'true'],
    ],
    requiredFields: ['name', 'category', 'difficulty_level', 'client_persona', 'initial_context'],
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
      'Persona Name': 'persona_name',
      'Persona Key': 'persona_key',
      'Description': 'description',
      'Personality Traits': 'personality_traits',
      'Decision Making Style': 'decision_making_style',
      'Communication Style': 'communication_style',
      'Objection Patterns': 'objection_patterns',
      'Is Active': 'is_active',
    },
    sampleCsvData: [
      ['Persona Name', 'Persona Key', 'Description', 'Personality Traits', 'Decision Making Style', 'Communication Style', 'Objection Patterns', 'Is Active'],
      ['First Time Buyer', 'first_time_buyer', 'Young, nervous, needs guidance', 'anxious|eager|detail-oriented', 'analytical', 'asks many questions', 'price concerns|timeline worries', 'true'],
    ],
    requiredFields: ['persona_name', 'persona_key'],
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
};

export const getEntityOptions = () => {
  return Object.keys(importConfigs).map(key => ({
    value: key,
    label: importConfigs[key].label,
  }));
};
