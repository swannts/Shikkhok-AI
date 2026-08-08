export interface FeatureFlags {
  voiceTutor: boolean;
  homeworkCamera: boolean;
  examMode: boolean;
  offlineDownloads: boolean;
  parentLinking: boolean;
  subscriptions: boolean;
}

const defaultFlags: FeatureFlags = {
  voiceTutor: true,
  homeworkCamera: true,
  examMode: true,
  offlineDownloads: true,
  parentLinking: true,
  subscriptions: true,
};

export const featureFlags = {
  get: <K extends keyof FeatureFlags>(flag: K): boolean => {
    return defaultFlags[flag] ?? false;
  },
  getAll: (): FeatureFlags => defaultFlags,
};
