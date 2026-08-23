export interface PlatformFeatureFlags {
  newTutorPromptV2: boolean;      // Controlled rollout for experimental pedagogical prompt
  newLlmModelRouting: boolean;    // Experimental model routing (e.g. Flash 1.5 vs Pro 1.5)
  adaptivePracticeV2: boolean;    // Next-gen adaptive difficulty engine
  voiceTutorMode: boolean;        // Real-time audio streaming for AI tutor
  hybridVectorSearch: boolean;    // RAG Strategy V2 (Dense Vector + BM25 Sparse Search)
  enableRagCitations: boolean;    // verified source metadata
  enableOfflineSyncQueue: boolean;// Mobile offline sync support
}

export class FeatureFlagManager {
  private flags: PlatformFeatureFlags = {
    newTutorPromptV2: false,
    newLlmModelRouting: false,
    adaptivePracticeV2: false,
    voiceTutorMode: false,
    hybridVectorSearch: false,
    enableRagCitations: true,
    enableOfflineSyncQueue: true,
  };

  public getFlags(): PlatformFeatureFlags {
    return { ...this.flags };
  }

  public isEnabled(flagKey: keyof PlatformFeatureFlags): boolean {
    return this.flags[flagKey] ?? false;
  }

  /**
   * Admin controlled rollout override
   */
  public updateFlags(newFlags: Partial<PlatformFeatureFlags>): PlatformFeatureFlags {
    this.flags = {
      ...this.flags,
      ...newFlags,
    };
    return this.getFlags();
  }

  /**
   * User-level gradual percentage rollout calculation based on studentId hash
   */
  public isEnabledForStudent(flagKey: keyof PlatformFeatureFlags, studentId: string, rolloutPercentage: number = 10): boolean {
    if (!this.isEnabled(flagKey)) return false;

    // Simple deterministic hash matching student ID to rollout percentage bucket
    let hash = 0;
    for (let i = 0; i < studentId.length; i++) {
      hash = (hash << 5) - hash + studentId.charCodeAt(i);
      hash |= 0;
    }
    const bucket = Math.abs(hash) % 100;
    return bucket < rolloutPercentage;
  }
}

export const featureFlagManager = new FeatureFlagManager();
