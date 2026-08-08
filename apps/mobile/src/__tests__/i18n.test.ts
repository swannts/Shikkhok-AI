import i18n, { setLanguage, t } from '../localization/i18n';

describe('Localization i18n Tests', () => {
  test('defaults to Bangla locale and translates greeting correctly', () => {
    setLanguage('bn');
    expect(i18n.locale).toBe('bn');
    const bnText = t('common.loading');
    expect(bnText).toBe('লোড হচ্ছে...');
  });

  test('switches live to English and translates greeting correctly', () => {
    setLanguage('en');
    expect(i18n.locale).toBe('en');
    const enText = t('common.loading');
    expect(enText).toBe('Loading...');
  });
});
