import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getApiErrorMessage } from '../api/client';
import { LanguageSwitcher } from '../components/layout/LanguageSwitcher';
import { ThemePicker } from '../components/layout/ThemePicker';
import { PageHeader } from '../components/layout/PageHeader';
import { useAuth } from '../hooks/useAuth';
import { useLocale } from '../hooks/useLocale';
import { useTheme } from '../hooks/useTheme';

export function SettingsPage() {
  const { user, updateProfile, changePassword } = useAuth();
  const { theme, setTheme } = useTheme();
  const { t } = useLocale();

  const [displayName, setDisplayName] = useState('');
  const [profileMessage, setProfileMessage] = useState('');
  const [profileError, setProfileError] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    if (user) setDisplayName(user.displayName);
  }, [user]);

  if (!user) return null;

  async function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault();
    setProfileLoading(true);
    setProfileError('');
    setProfileMessage('');
    try {
      await updateProfile({ displayName });
      setProfileMessage(t('settings.profile.updated'));
    } catch (err) {
      setProfileError(getApiErrorMessage(err, t('settings.profile.updateFailed')));
    } finally {
      setProfileLoading(false);
    }
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError('');
    setPasswordMessage('');

    if (newPassword !== confirmPassword) {
      setPasswordError(t('settings.password.mismatch'));
      return;
    }

    setPasswordLoading(true);
    try {
      await changePassword(currentPassword, newPassword);
      setPasswordMessage(t('settings.password.updated'));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordError(getApiErrorMessage(err, t('settings.password.updateFailed')));
    } finally {
      setPasswordLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <PageHeader title={t('settings.title')} lead={t('settings.lead')} />

      <section className="poster-card space-y-3 rounded-xl p-5">
        <h2 className="section-title">{t('settings.profile.title')}</h2>
        <p className="text-sm text-slate-400">
          {t('settings.profile.email')}：<span className="text-slate-300">{user.email}</span>
        </p>
        <form onSubmit={handleProfileSubmit} className="space-y-3">
          <label className="block text-sm">
            {t('settings.profile.nickname')}
            <input
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={50}
              required
            />
          </label>
          {profileError && <p className="text-sm text-red-400">{profileError}</p>}
          {profileMessage && <p className="text-sm text-accent-500">{profileMessage}</p>}
          <button
            type="submit"
            disabled={profileLoading || displayName.trim() === user.displayName}
            className="rounded-lg bg-accent-600 px-4 py-2 text-sm font-medium hover:bg-accent-500 disabled:opacity-50"
          >
            {profileLoading ? t('common.saving') : t('settings.profile.save')}
          </button>
        </form>
      </section>

      <section className="poster-card space-y-3 rounded-xl p-5">
        <h2 className="section-title">{t('settings.password.title')}</h2>
        <form onSubmit={handlePasswordSubmit} className="space-y-3">
          <label className="block text-sm">
            {t('settings.password.current')}
            <input
              type="password"
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </label>
          <label className="block text-sm">
            {t('settings.password.new')}
            <input
              type="password"
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </label>
          <label className="block text-sm">
            {t('settings.password.confirm')}
            <input
              type="password"
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </label>
          {passwordError && <p className="text-sm text-red-400">{passwordError}</p>}
          {passwordMessage && <p className="text-sm text-accent-500">{passwordMessage}</p>}
          <button
            type="submit"
            disabled={passwordLoading}
            className="rounded-lg bg-accent-600 px-4 py-2 text-sm font-medium hover:bg-accent-500 disabled:opacity-50"
          >
            {passwordLoading ? t('settings.password.submitting') : t('settings.password.submit')}
          </button>
        </form>
      </section>

      <section className="poster-card space-y-3 rounded-xl p-5">
        <h2 className="section-title">{t('settings.appearance.title')}</h2>
        <ThemePicker theme={theme} onSelect={setTheme} hint={t('settings.appearance.syncHint')} />
      </section>

      <section className="poster-card space-y-3 rounded-xl p-5">
        <h2 className="section-title">{t('settings.language.title')}</h2>
        <p className="text-xs text-slate-400">{t('settings.language.hint')}</p>
        <LanguageSwitcher />
      </section>

      <p className="text-center text-sm text-slate-500">
        <Link to="/" className="text-accent-500 hover:text-accent-400">
          {t('common.backToHome')}
        </Link>
      </p>
    </div>
  );
}
