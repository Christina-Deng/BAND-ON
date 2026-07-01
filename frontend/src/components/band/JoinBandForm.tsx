import { useState } from 'react';
import { useBand } from '../../hooks/useBand';
import { useLocale } from '../../hooks/useLocale';
import { normalizeInviteCode } from '../../lib/invite';

export function JoinBandForm({ onSuccess }: { onSuccess?: () => void }) {
  const { joinBand } = useBand();
  const { t } = useLocale();
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await joinBand(normalizeInviteCode(inviteCode) ?? '');
      setInviteCode('');
      onSuccess?.();
    } catch {
      setError(t('band.joinForm.invalidCode'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-slate-700 bg-slate-900 p-4">
      <h3 className="font-semibold">{t('band.joinForm.title')}</h3>
      <input
        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
        placeholder={t('band.joinForm.codePlaceholder')}
        value={inviteCode}
        onChange={(e) => setInviteCode(e.target.value)}
        required
      />
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg border border-accent-500 px-4 py-2 font-medium hover:bg-accent-500/10 disabled:opacity-50"
      >
        {loading ? t('common.joining') : t('band.joinForm.submit')}
      </button>
    </form>
  );
}
