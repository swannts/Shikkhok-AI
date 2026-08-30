import { FuseSettingsConfigType } from '@fuse/core/FuseSettings/FuseSettings';

export type User = {
  id: string;
  role: string[] | string | null;
  displayName: string;
  photoURL?: string;
  email?: string;
  shortcuts?: string[];
  settings?: Partial<FuseSettingsConfigType>;
  loginRedirectUrl?: string;
};
