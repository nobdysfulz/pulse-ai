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
};

export const getEntityOptions = () => {
  return Object.keys(importConfigs).map(key => ({
    value: key,
    label: importConfigs[key].label,
  }));
};
