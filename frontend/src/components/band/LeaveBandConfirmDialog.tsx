import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useLocale } from '../../hooks/useLocale';

interface Props {
  open: boolean;
  bandName: string;
  isLastMember: boolean;
  loading: boolean;
  error?: string;
  onClose: () => void;
  onConfirm: () => void;
}

export function LeaveBandConfirmDialog({
  open,
  bandName,
  isLastMember,
  loading,
  error,
  onClose,
  onConfirm,
}: Props) {
  const { t } = useLocale();
  const openedAtRef = useRef(0);

  useEffect(() => {
    if (open) {
      openedAtRef.current = Date.now();
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [open]);

  if (!open) return null;

  function handleBackdropClick() {
    if (Date.now() - openedAtRef.current < 300) return;
    if (!loading) onClose();
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
      onMouseDown={handleBackdropClick}
    >
      <div
        role="dialog"
        aria-labelledby="leave-band-title"
        aria-modal="true"
        className="dialog-panel w-full max-w-md rounded-xl p-6"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h2 id="leave-band-title" className="text-lg font-semibold text-emphasis">
          {t('band.leave.title')}
        </h2>

        <p className="mt-3 text-sm text-slate-300">
          {t('band.leave.body', { name: bandName })}
        </p>

        {isLastMember ? (
          <p className="dialog-callout mt-2 rounded-lg px-3 py-2 text-sm">
            {t('band.leave.lastMemberBody')}
          </p>
        ) : (
          <p className="mt-2 text-sm text-slate-400">{t('band.leave.normalHint')}</p>
        )}

        {error && (
          <p className="mt-3 rounded-lg border border-accent-600/40 bg-accent-600/10 px-3 py-2 text-sm text-red-400">
            {error}
          </p>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg px-4 py-2 text-sm hover:bg-slate-800 disabled:opacity-50"
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="rounded-lg bg-accent-600 px-4 py-2 text-sm font-medium hover:bg-accent-500 disabled:opacity-50"
          >
            {loading ? t('band.leave.confirming') : t('band.leave.confirm')}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
