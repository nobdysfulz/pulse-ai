const createPageUrl = (pageName) => '/' + pageName.toLowerCase().replace(/ /g, '-');

export const normalizeOnboardingProgress = (record) => {
  if (!record) {
    return {
      onboardingCompleted: false,
      agentOnboardingCompleted: false,
      agentIntelligenceCompleted: false,
      callCenterOnboardingCompleted: false,
      completedSteps: []
    };
  }

  // Map DB schema to expected format
  // Core completion is determined by onboarding_completion_date
  // Call center completion is determined by completed_steps containing all callcenter steps
  const callCenterSteps = ['phone', 'voice', 'identity', 'workspace', 'call-confirm'];
  const completedSteps = record.completed_steps ?? record.completedSteps ?? [];
  const hasAllCallCenterSteps = callCenterSteps.every(step => completedSteps.includes(step));

  return {
    ...record,
    onboardingCompleted: !!record.onboarding_completion_date,
    agentOnboardingCompleted: record.agent_onboarding_completed ?? false,
    agentIntelligenceCompleted: record.agent_intelligence_completed ?? false,
    callCenterOnboardingCompleted: hasAllCallCenterSteps,
    completedSteps: completedSteps
  };
};

export const buildActiveModules = ({ subscriptionTier, hasCallCenterAddon } = {}) => {
  const modules = ['core'];

  if (subscriptionTier === 'Subscriber' || subscriptionTier === 'Admin') {
    modules.push('agents');
  }

  if (hasCallCenterAddon || subscriptionTier === 'Admin') {
    modules.push('callcenter');
  }

  return modules;
};

export const determineInitialPhase = (progress, activeModules) => {
  const normalized = normalizeOnboardingProgress(progress);

  if (!normalized.onboardingCompleted) {
    return { phase: 'core', stepIndex: 0 };
  }

  if (activeModules.includes('agents') && !normalized.agentOnboardingCompleted) {
    return { phase: 'agents', stepIndex: 0 };
  }

  if (activeModules.includes('callcenter') && !normalized.callCenterOnboardingCompleted) {
    return { phase: 'callcenter', stepIndex: 0 };
  }

  return { phase: null, stepIndex: 0 };
};

export const getOnboardingJourneyState = ({ user, onboarding }) => {
  const subscriptionTier = user?.subscriptionTier;
  const hasCallCenterAddon = user?.hasCallCenterAddon || false;

  const activeModules = buildActiveModules({ subscriptionTier, hasCallCenterAddon });
  const progress = normalizeOnboardingProgress(onboarding);
  const { phase } = determineInitialPhase(progress, activeModules);

  const completionStatus = {
    coreComplete: progress.onboardingCompleted,
    agentsComplete: !activeModules.includes('agents') || progress.agentOnboardingCompleted,
    callCenterComplete: !activeModules.includes('callcenter') || progress.callCenterOnboardingCompleted
  };

  const unlockedFeatures = {
    aiAgents: activeModules.includes('agents') && progress.agentOnboardingCompleted,
    callCenter: activeModules.includes('callcenter') && progress.callCenterOnboardingCompleted
  };

  const onboardingRequired = phase !== null;

  return {
    activeModules,
    initialPhase: phase,
    completionStatus,
    unlockedFeatures,
    completedSteps: progress.completedSteps,
    onboarding
  };
};

export const buildReminderStatus = (journeyState) => {
  const totalCoreSteps = 4;
  const completedCoreSteps = journeyState.completedSteps.filter(step => ['welcome', 'market', 'preferences', 'core-confirm'].includes(step));
  const onboardingRequired = journeyState.completionStatus ? Object.values(journeyState.completionStatus).some(value => value === false) : true;

  return {
    onboardingRequired,
    completedSteps: completedCoreSteps
  };
};

export const deriveSetupGroups = ({ user, onboarding }) => {
  const journey = getOnboardingJourneyState({ user, onboarding });
  const completedSteps = new Set(journey.completedSteps);
  const onboardingUrl = createPageUrl('Onboarding');
  const intelligenceUrl = createPageUrl('IntelligenceSurvey');
  const agentsOnboardingUrl = createPageUrl('AgentsOnboarding');

  const core = [
    {
      id: 'welcome',
      title: 'Welcome',
      description: 'Get started with PULSE AI',
      path: `${onboardingUrl}?phase=core`,
      completed: completedSteps.has('welcome')
    },
    {
      id: 'market',
      title: 'Business & Market Setup',
      description: 'Configure your market territory and business info',
      path: `${onboardingUrl}?phase=core`,
      completed: completedSteps.has('market')
    },
    {
      id: 'preferences',
      title: 'Brand & Preferences',
      description: 'Set your brand colors and AI preferences',
      path: `${onboardingUrl}?phase=core`,
      completed: completedSteps.has('preferences')
    },
    {
      id: 'intelligence-survey',
      title: 'Intelligence Survey',
      description: 'Complete your agent intelligence profile',
      path: intelligenceUrl,
      completed: onboarding?.agentIntelligenceCompleted || false
    },
    {
      id: 'core-confirm',
      title: 'Core Setup Complete',
      description: 'Finalize your basic setup',
      path: `${onboardingUrl}?phase=core`,
      completed: onboarding?.onboardingCompleted || false
    }
  ];

  const agents = journey.activeModules.includes('agents') ? [
    {
      id: 'ai-team-intro',
      title: 'Meet Your AI Team',
      description: 'Introduction to NOVA, SIRIUS, VEGA, and PHOENIX',
      path: `${onboardingUrl}?phase=agents`,
      completed: completedSteps.has('ai-team-intro'),
      locked: !onboarding?.onboardingCompleted
    },
    {
      id: 'integrations',
      title: 'Connect Services',
      description: 'Link Google Workspace, CRM, and social media',
      path: `${onboardingUrl}?phase=agents`,
      completed: completedSteps.has('integrations'),
      locked: !onboarding?.onboardingCompleted
    },
    {
      id: 'customization',
      title: 'Customize AI Agents',
      description: 'Set guidelines for email, content, and transactions',
      path: agentsOnboardingUrl,
      completed: completedSteps.has('customization'),
      locked: !onboarding?.onboardingCompleted
    },
    {
      id: 'test',
      title: 'Test Your AI Agents',
      description: 'Try out your configured AI agents',
      path: `${onboardingUrl}?phase=agents`,
      completed: onboarding?.agentOnboardingCompleted || false,
      locked: !onboarding?.onboardingCompleted
    }
  ] : [];

  const callcenter = journey.activeModules.includes('callcenter') ? [
    {
      id: 'phone',
      title: 'Phone Number Setup',
      description: 'Select and configure your Twilio number',
      path: `${onboardingUrl}?phase=callcenter`,
      completed: completedSteps.has('phone'),
      locked: !(onboarding?.agentOnboardingCompleted || false)
    },
    {
      id: 'voice',
      title: 'Voice Selection',
      description: 'Choose your AI calling agent voice',
      path: `${onboardingUrl}?phase=callcenter`,
      completed: completedSteps.has('voice'),
      locked: !(onboarding?.agentOnboardingCompleted || false)
    },
    {
      id: 'identity',
      title: 'Caller Identity',
      description: 'Configure caller ID and call settings',
      path: `${onboardingUrl}?phase=callcenter`,
      completed: completedSteps.has('identity'),
      locked: !(onboarding?.agentOnboardingCompleted || false)
    },
    {
      id: 'workspace',
      title: 'Google Workspace Setup',
      description: 'Connect Google Calendar for appointments',
      path: `${onboardingUrl}?phase=callcenter`,
      completed: completedSteps.has('workspace'),
      locked: !(onboarding?.agentOnboardingCompleted || false)
    },
    {
      id: 'call-confirm',
      title: 'Call Center Complete',
      description: 'Finalize AI calling setup',
      path: `${onboardingUrl}?phase=callcenter`,
      completed: onboarding?.callCenterOnboardingCompleted || false,
      locked: !(onboarding?.agentOnboardingCompleted || false)
    }
  ] : [];

  return {
    core,
    agents,
    callcenter,
    journey
  };
};

export const summarizeCompletion = (journey) => {
  const { completionStatus } = journey;
  const transitions = [];

  if (!completionStatus.coreComplete) {
    transitions.push('not_started');
  } else if (!completionStatus.agentsComplete) {
    transitions.push('core_complete');
  } else if (!completionStatus.callCenterComplete) {
    transitions.push('agents_complete');
  } else {
    transitions.push('fully_complete');
  }

  return {
    nextStatus: transitions.at(-1),
    allComplete: completionStatus.coreComplete && completionStatus.agentsComplete && completionStatus.callCenterComplete
  };
};
