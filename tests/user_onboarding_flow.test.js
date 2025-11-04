import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildActiveModules,
  getOnboardingJourneyState,
  buildReminderStatus,
  deriveSetupGroups,
  summarizeCompletion
} from '../src/components/onboarding/onboardingLogic.js';

const baseUser = {
  id: 'user-123',
  subscriptionTier: 'Free',
  hasCallCenterAddon: false
};

describe('User_Onboarding_Flow', () => {
  it('handles first login for core onboarding', () => {
    const journey = getOnboardingJourneyState({ user: baseUser, onboarding: null });

    assert.deepEqual(buildActiveModules({ subscriptionTier: baseUser.subscriptionTier, hasCallCenterAddon: false }), ['core']);
    assert.equal(journey.initialPhase, 'core');
    assert.equal(journey.completionStatus.coreComplete, false);
    assert.equal(journey.unlockedFeatures.aiAgents, false);
    assert.equal(journey.unlockedFeatures.callCenter, false);
  });

  it('surfaces agent module for subscriber who finished core steps', () => {
    const subscriber = { ...baseUser, subscriptionTier: 'Subscriber' };
    const onboarding = {
      onboardingCompleted: true,
      agentOnboardingCompleted: false,
      callCenterOnboardingCompleted: false,
      completedSteps: ['welcome', 'market', 'preferences', 'core-confirm']
    };

    const journey = getOnboardingJourneyState({ user: subscriber, onboarding });

    assert.deepEqual(journey.activeModules, ['core', 'agents']);
    assert.equal(journey.initialPhase, 'agents');
    assert.equal(journey.completionStatus.coreComplete, true);
    assert.equal(journey.completionStatus.agentsComplete, false);
    assert.equal(journey.completionStatus.callCenterComplete, true);
  });

  it('activates call center module for add-on users after agents complete', () => {
    const addonUser = { ...baseUser, subscriptionTier: 'Subscriber', hasCallCenterAddon: true };
    const onboarding = {
      onboardingCompleted: true,
      agentOnboardingCompleted: true,
      callCenterOnboardingCompleted: false,
      completedSteps: ['welcome', 'market', 'preferences', 'core-confirm', 'ai-team-intro', 'integrations', 'customization']
    };

    const journey = getOnboardingJourneyState({ user: addonUser, onboarding });

    assert.deepEqual(journey.activeModules, ['core', 'agents', 'callcenter']);
    assert.equal(journey.initialPhase, 'callcenter');
    assert.equal(journey.completionStatus.callCenterComplete, false);
    assert.equal(journey.unlockedFeatures.aiAgents, true);
    assert.equal(journey.unlockedFeatures.callCenter, false);
  });

  it('builds reminder status with completed core steps only', () => {
    const onboarding = {
      onboardingCompleted: false,
      agentOnboardingCompleted: false,
      callCenterOnboardingCompleted: false,
      completedSteps: ['welcome', 'market', 'ai-team-intro']
    };
    const journey = getOnboardingJourneyState({ user: baseUser, onboarding });
    const reminder = buildReminderStatus(journey);

    assert.equal(reminder.onboardingRequired, true);
    assert.deepEqual(reminder.completedSteps.sort(), ['market', 'welcome']);
  });

  it('groups setup steps with correct locking rules', () => {
    const subscriber = { ...baseUser, subscriptionTier: 'Subscriber', hasCallCenterAddon: true };
    const onboarding = {
      onboardingCompleted: true,
      agentOnboardingCompleted: false,
      callCenterOnboardingCompleted: false,
      completedSteps: ['welcome', 'market']
    };

    const groups = deriveSetupGroups({ user: subscriber, onboarding });

    assert.equal(groups.core.length, 5);
    assert.equal(groups.agents.length, 4);
    assert.equal(groups.callcenter.length, 5);
    assert.equal(groups.agents[0].locked, !onboarding.onboardingCompleted);
    assert.equal(groups.callcenter[0].locked, !onboarding.agentOnboardingCompleted);
  });

  it('summarizes completion states across the journey', () => {
    const subscriber = { ...baseUser, subscriptionTier: 'Subscriber', hasCallCenterAddon: true };
    const onboarding = {
      onboardingCompleted: true,
      agentOnboardingCompleted: true,
      callCenterOnboardingCompleted: true,
      completedSteps: []
    };

    const journey = getOnboardingJourneyState({ user: subscriber, onboarding });
    const summary = summarizeCompletion(journey);

    assert.equal(summary.nextStatus, 'fully_complete');
    assert.equal(summary.allComplete, true);
  });
});
