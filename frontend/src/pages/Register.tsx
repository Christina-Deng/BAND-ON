import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { getApiErrorMessage } from '../api/client';
import { AuthPageLayout } from '../components/layout/AuthPageLayout';
import { useAuth } from '../hooks/useAuth';
import { useLocale } from '../hooks/useLocale';
import { getPendingInviteCode } from '../lib/invite';

export function RegisterPage() {
  const { user, register } = useAuth();
  const { t } = useLocale();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');

  if (user) {
    return <Navigate to={getPendingInviteCode() ? '/join' : '/'} replace />;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await register(email, password, displayName);
    } catch (err) {
      setError(getApiErrorMessage(err, t('common.registerFailed')));
    }
  }

  return (
    <AuthPageLayout
      title={t('auth.register.title')}
      lead={t('auth.register.lead')}
      footer={
        <>
          {t('auth.register.hasAccount')}
          <Link to="/login" className="text-accent-500 hover:text-accent-400">
            {t('auth.register.loginLink')}
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          placeholder={t('auth.register.name')}
          className="w-full rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2.5"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          required
        />
        <input
          type="email"
          placeholder={t('auth.register.email')}
          className="w-full rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2.5"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder={t('auth.register.password')}
          className="w-full rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2.5"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          className="w-full rounded-lg bg-accent-600 py-2.5 font-medium hover:bg-accent-500"
        >
          {t('auth.register.submit')}
        </button>
      </form>
    </AuthPageLayout>
  );
}
