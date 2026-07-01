import { useState } from 'react';
import { Link } from 'react-router-dom';
import { updateBand, updateMyProfile } from '../../api/bands';
import { EditBandDialog } from './EditBandDialog';
import { LeaveBandConfirmDialog } from './LeaveBandConfirmDialog';
import { MemberCard } from './MemberCard';
import { SkillQuestionnaire } from '../shared/SkillQuestionnaire';
import { formatStylePreferences } from '../../constants/music';
import { useLocale } from '../../hooks/useLocale';
import { buildInviteShareText, copyText, isInviteLinkOriginConfigured } from '../../lib/invite';
import type { Band, Instrument, QuestionnaireAnswers } from '../../types/band';

interface Props {
  band: Band;
  currentUserId?: string;
  onRefresh: () => Promise<void>;
  onLeave: (bandId: string) => Promise<{ disbanded: boolean; message: string }>;
}

export function BandSection({ band, currentUserId, onRefresh, onLeave }: Props) {
  const { locale, t } = useLocale();
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);
  const [showEditBand, setShowEditBand] = useState(false);
  const [editBandLoading, setEditBandLoading] = useState(false);
  const [editBandError, setEditBandError] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [leaveError, setLeaveError] = useState('');

  const myMember = band.members.find((m) => m.user.id === currentUserId);
  const profileComplete = Boolean(myMember?.questionnaireAnswers);
  const profileInitial =
    myMember?.questionnaireAnswers != null
      ? { instrument: myMember.instrument, questionnaireAnswers: myMember.questionnaireAnswers }
      : null;

  async function handleProfileSubmit(answers: QuestionnaireAnswers, instrument: Instrument) {
    await updateMyProfile(band.id, { instrument, questionnaireAnswers: answers });
    await onRefresh();
  }

  async function handleEditBandSubmit(input: { name: string; stylePreferences: string[] }) {
    setEditBandLoading(true);
    setEditBandError('');
    try {
      await updateBand(band.id, input);
      await onRefresh();
      setShowEditBand(false);
    } catch {
      setEditBandError(t('common.saveFailed'));
    } finally {
      setEditBandLoading(false);
    }
  }

  async function copyInviteCode() {
    await copyText(band.inviteCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  }

  async function copyInviteShare() {
    await copyText(buildInviteShareText(band.name, band.inviteCode, t));
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2000);
  }

  async function handleLeaveConfirm() {
    setLeaving(true);
    setLeaveError('');
    try {
      await onLeave(band.id);
      setShowLeaveConfirm(false);
    } catch {
      setLeaveError(t('band.leaveFailed'));
    } finally {
      setLeaving(false);
    }
  }

  return (
    <section className="space-y-4 rounded-xl border border-slate-700 bg-slate-900 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-emphasis">{band.name}</h2>
          {band.stylePreferences && band.stylePreferences.length > 0 && (
            <p className="text-sm text-slate-400">
              {t('band.style')}：{formatStylePreferences(band.stylePreferences, locale)}
            </p>
          )}
          <div className="mt-2 space-y-1 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-slate-400">{t('band.inviteCode')}：</span>
              <code className="rounded bg-slate-800 px-2 py-1">{band.inviteCode}</code>
              <button
                type="button"
                onClick={() => void copyInviteCode()}
                className="text-accent-500 hover:text-accent-400 hover:underline"
              >
                {copiedCode ? t('common.copied') : t('common.copyCode')}
              </button>
              <button
                type="button"
                onClick={() => void copyInviteShare()}
                className="text-accent-500 hover:text-accent-400 hover:underline"
              >
                {copiedShare ? t('common.copied') : t('common.copyInvite')}
              </button>
            </div>
            <p className="text-xs text-slate-500">{t('band.shareHint')}</p>
            {import.meta.env.PROD && !isInviteLinkOriginConfigured() && (
              <p className="text-xs text-amber-400/90">{t('band.deployWarning')}</p>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setEditBandError('');
              setShowEditBand(true);
            }}
            className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300 hover:border-slate-500 hover:bg-slate-800 hover:text-emphasis"
          >
            {t('band.editBand')}
          </button>
          <button
            type="button"
            onClick={() => setShowQuestionnaire(true)}
            className="rounded-lg border border-accent-500 px-4 py-2 text-sm hover:bg-accent-500/10"
          >
            {profileComplete ? t('band.editProfile') : t('band.completeProfile')}
          </button>
          <Link
            to="/practice"
            className="rounded-lg bg-accent-600 px-4 py-2 text-sm font-medium hover:bg-accent-500"
          >
            {t('band.goPractice')}
          </Link>
          <button
            type="button"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={() => {
              setLeaveError('');
              setShowLeaveConfirm(true);
            }}
            disabled={leaving}
            className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300 hover:border-accent-600 hover:text-accent-500 disabled:opacity-50"
          >
            {t('band.leaveBand')}
          </button>
        </div>
      </div>

      {!profileComplete && myMember && (
        <p className="profile-incomplete-banner rounded-lg px-4 py-3 text-sm">
          {t('band.profileIncompleteBanner')}
        </p>
      )}

      {leaveError && !showLeaveConfirm && (
        <p className="rounded-lg border border-accent-600/40 bg-accent-600/10 px-4 py-3 text-sm text-red-400">
          {leaveError}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {band.members.map((member) => (
          <MemberCard
            key={member.id}
            member={member}
            isSelf={member.user.id === currentUserId}
          />
        ))}
      </div>

      <SkillQuestionnaire
        open={showQuestionnaire}
        onClose={() => setShowQuestionnaire(false)}
        onSubmit={handleProfileSubmit}
        initial={profileInitial}
      />

      <EditBandDialog
        open={showEditBand}
        initialName={band.name}
        initialStylePreferences={band.stylePreferences ?? []}
        loading={editBandLoading}
        error={showEditBand ? editBandError : undefined}
        onClose={() => {
          if (editBandLoading) return;
          setShowEditBand(false);
          setEditBandError('');
        }}
        onSubmit={(input) => void handleEditBandSubmit(input)}
      />

      <LeaveBandConfirmDialog
        open={showLeaveConfirm}
        bandName={band.name}
        isLastMember={band.members.length === 1}
        loading={leaving}
        error={showLeaveConfirm ? leaveError : undefined}
        onClose={() => {
          if (leaving) return;
          setShowLeaveConfirm(false);
          setLeaveError('');
        }}
        onConfirm={() => void handleLeaveConfirm()}
      />
    </section>
  );
}
