import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { getApiErrorMessage } from '../api/client';
import { AuthPageLayout } from '../components/layout/AuthPageLayout';
import { useAuth } from '../hooks/useAuth';
import { getPendingInviteCode } from '../lib/invite';

export function LoginPage() {
  const { user, login } = useAuth();
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
      setError(getApiErrorMessage(err, '登录失败，请检查邮箱和密码'));
    }
  }

  return (
    <AuthPageLayout
      title="登录"
      lead="欢迎回来，继续你和乐队的排练节奏。"
      footer={
        <>
          还没有账号？
          <Link to="/register" className="text-accent-500 hover:text-accent-400">
            注册
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="email"
          placeholder="邮箱"
          className="w-full rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2.5"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="密码"
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
          登录
        </button>
      </form>
    </AuthPageLayout>
  );
}
