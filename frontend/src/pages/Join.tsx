import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { joinBand } from '../api/bands';
import { getApiErrorMessage } from '../api/client';
import { AppearanceMenu } from '../components/layout/AppearanceMenu';
import { useAuth } from '../hooks/useAuth';
import {
  clearPendingInviteCode,
  getPendingInviteCode,
  normalizeInviteCode,
  setPendingInviteCode,
} from '../lib/invite';

export function JoinPage() {
  const { user, loading: authLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');
  const joinStartedRef = useRef(false);

  const codeFromUrl = normalizeInviteCode(searchParams.get('code'));
  const inviteCode = codeFromUrl ?? getPendingInviteCode();

  useEffect(() => {
    if (codeFromUrl) setPendingInviteCode(codeFromUrl);
  }, [codeFromUrl]);

  async function attemptJoin(code: string) {
    setJoining(true);
    setError('');
    try {
      const band = await joinBand(code);
      clearPendingInviteCode();
      navigate('/', {
        replace: true,
        state: { joinMessage: `已加入乐队「${band.name}」` },
      });
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        clearPendingInviteCode();
        navigate('/', {
          replace: true,
          state: { joinMessage: getApiErrorMessage(err, '你已加入该乐队') },
        });
        return;
      }
      setError(getApiErrorMessage(err, '加入失败，请检查邀请码是否正确'));
      setJoining(false);
      joinStartedRef.current = false;
    }
  }

  useEffect(() => {
    if (authLoading || !user || !inviteCode || joinStartedRef.current) return;
    joinStartedRef.current = true;
    void attemptJoin(inviteCode);
  }, [authLoading, user, inviteCode]);

  if (authLoading) {
    return (
      <JoinShell>
        <p className="text-slate-400">加载中…</p>
      </JoinShell>
    );
  }

  if (!inviteCode) {
    return (
      <JoinShell>
        <h1 className="text-2xl font-bold">邀请链接无效</h1>
        <p className="mt-2 text-sm text-slate-400">链接缺少邀请码，请让队友重新分享邀请。</p>
        {user ? (
          <Link to="/" className="mt-6 inline-block text-accent-500 hover:text-accent-400">
            返回首页
          </Link>
        ) : (
          <Link to="/login" className="mt-6 inline-block text-accent-500 hover:text-accent-400">
            去登录
          </Link>
        )}
      </JoinShell>
    );
  }

  if (!user) {
    return (
      <JoinShell>
        <h1 className="text-2xl font-bold">加入乐队</h1>
        <p className="mt-2 text-sm text-slate-300">
          你收到了乐队邀请，邀请码为{' '}
          <code className="rounded bg-slate-800 px-2 py-0.5">{inviteCode}</code>。登录或注册后会自动加入。
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <Link
            to="/login"
            className="rounded-lg bg-accent-600 px-4 py-2 text-center text-sm font-medium hover:bg-accent-500"
          >
            登录
          </Link>
          <Link
            to="/register"
            className="rounded-lg border border-accent-500 px-4 py-2 text-center text-sm hover:bg-accent-500/10"
          >
            注册
          </Link>
        </div>
      </JoinShell>
    );
  }

  async function handleRetry() {
    if (!inviteCode) return;
    joinStartedRef.current = true;
    await attemptJoin(inviteCode);
  }

  if (joining && !error) {
    return (
      <JoinShell>
        <p className="text-slate-300">正在加入乐队…</p>
      </JoinShell>
    );
  }

  if (error) {
    return (
      <JoinShell>
        <h1 className="text-2xl font-bold">未能加入乐队</h1>
        <p className="mt-2 text-sm text-red-400">{error}</p>
        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void handleRetry()}
            className="rounded-lg bg-accent-600 px-4 py-2 text-sm font-medium hover:bg-accent-500"
          >
            重试
          </button>
          <Link
            to="/"
            className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
            onClick={() => clearPendingInviteCode()}
          >
            返回首页
          </Link>
        </div>
      </JoinShell>
    );
  }

  return <Navigate to="/" replace />;
}

function JoinShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <span className="font-display-heavy text-2xl tracking-widest text-accent-600">BandMate</span>
        <AppearanceMenu />
      </div>
      <div className="rounded-xl border border-slate-700 bg-slate-900 p-6">{children}</div>
    </div>
  );
}
