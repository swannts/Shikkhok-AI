import { I18n } from 'i18n-js';
import bn from './bn.json';
import en from './en.json';

const i18n = new I18n({ bn, en });

i18n.enableFallback = true;
i18n.locale = 'bn';

export const setLanguage = (lang: 'bn' | 'en') => {
  i18n.locale = lang;
};

export const t = (scope: string, options?: Record<string, unknown>): string => {
  return i18n.t(scope, options);
};

export default i18n;
