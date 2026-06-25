import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { getApiErrorMessage } from '../api/client';
import * as bandsApi from '../api/bands';
import type { Band } from '../types/band';
import { useAuth } from './useAuth';

interface BandContextValue {
  bands: Band[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createBand: (name: string, stylePreferences?: string[]) => Promise<Band>;
  joinBand: (inviteCode: string) => Promise<Band>;
  leaveBand: (bandId: string) => Promise<{ disbanded: boolean; message: string }>;
}

const BandContext = createContext<BandContextValue | null>(null);

export function BandProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [bands, setBands] = useState<Band[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) {
      setBands([]);
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await bandsApi.getMyBands();
      setBands(data);
    } catch (err) {
      setBands([]);
      setError(getApiErrorMessage(err, '加载乐队失败，请确认 backend 已启动并已重启'));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const createBand = useCallback(async (name: string, stylePreferences?: string[]) => {
    const created = await bandsApi.createBand({ name, stylePreferences });
    setBands((prev) => [...prev, created]);
    return created;
  }, []);

  const joinBand = useCallback(async (inviteCode: string) => {
    const joined = await bandsApi.joinBand(inviteCode);
    setBands((prev) => (prev.some((b) => b.id === joined.id) ? prev : [...prev, joined]));
    return joined;
  }, []);

  const leaveBand = useCallback(async (bandId: string) => {
    const result = await bandsApi.leaveBand(bandId);
    setBands((prev) => prev.filter((b) => b.id !== bandId));
    return result;
  }, []);

  const value = useMemo(
    () => ({ bands, loading, error, refresh, createBand, joinBand, leaveBand }),
    [bands, loading, error, refresh, createBand, joinBand, leaveBand],
  );

  return <BandContext.Provider value={value}>{children}</BandContext.Provider>;
}

export function useBand() {
  const ctx = useContext(BandContext);
  if (!ctx) throw new Error('useBand must be used within BandProvider');
  return ctx;
}
