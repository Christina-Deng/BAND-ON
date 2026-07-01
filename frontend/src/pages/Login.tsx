import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { getApiErrorMessage } from '../api/client';
import { AuthPageLayout } from '../components/layout/AuthPageLayout';
import { useAuth } from '../hooks/useAuth';
import { useLocale } from '../hooks/useLocale';
import { getPendingInviteCode } from '../lib/invite';

export function LoginPage() {
  const { user, login } = useAuth();
  const { t } = useLocale();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (user) {
    return <Navigate to={getPendingInviteCode() ? '/join' : '/'} replace />;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
    } catch (err) {
      setError(getApiErrorMessage(err, t('common.loginFailed')));
    }
  }

  return (
    <AuthPageLayout
      title={t('auth.login.title')}
      lead={t('auth.login.lead')}
      footer={
        <>
          {t('auth.login.noAccount')}
          <Link to="/register" className="text-accent-500 hover:text-accent-400">
            {t('auth.login.registerLink')}
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="email"
          placeholder={t('auth.login.email')}
          className="w-full rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2.5"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder={t('auth.login.password')}
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
          {t('auth.login.submit')}
        </button>
      </form>
    </AuthPageLayout>
  );
}
