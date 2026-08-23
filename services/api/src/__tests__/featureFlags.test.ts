import { featureFlagManager } from '../shared/featureFlags';

describe('FeatureFlagManager & Controlled Rollouts', () => {
  it('defaults experimental features (voice, prompt v2, model routing) to disabled', () => {
    const flags = featureFlagManager.getFlags();

    expect(flags.newTutorPromptV2).toBe(false);
    expect(flags.newLlmModelRouting).toBe(false);
    expect(flags.voiceTutorMode).toBe(false);
    expect(flags.enableRagCitations).toBe(true);
  });

  it('allows dynamic admin flag updates', () => {
    featureFlagManager.updateFlags({ voiceTutorMode: true });
    expect(featureFlagManager.isEnabled('voiceTutorMode')).toBe(true);
  });

  it('calculates deterministic student percentage rollouts', () => {
    featureFlagManager.updateFlags({ newTutorPromptV2: true });

    const studentA = 'student-alpha-123';
    const isEnrolled = featureFlagManager.isEnabledForStudent('newTutorPromptV2', studentA, 100);

    expect(isEnrolled).toBe(true);
  });
});
