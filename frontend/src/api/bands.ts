import { api } from './client';
import type { Band, Instrument, QuestionnaireAnswers } from '../types/band';

export async function createBand(input: { name: string; stylePreferences?: string[] }) {
  const { data } = await api.post<{ band: Band }>('/bands', input);
  return data.band;
}

export async function joinBand(inviteCode: string) {
  const { data } = await api.post<{ band: Band }>('/bands/join', { inviteCode });
  return data.band;
}

export async function getMyBands(): Promise<Band[]> {
  const { data } = await api.get<{ bands?: Band[]; band?: Band | null }>('/bands/me');
  if (Array.isArray(data.bands)) return data.bands;
  // Backward compat: older backend returned a single band
  if (data.band) return [data.band];
  return [];
}

export async function updateMyProfile(
  bandId: string,
  input: { instrument: Instrument; questionnaireAnswers: QuestionnaireAnswers },
) {
  const { data } = await api.put<{ member: Band['members'][0] }>(
    `/bands/${bandId}/members/me`,
    input,
  );
  return data.member;
}

export async function leaveBand(bandId: string) {
  const { data } = await api.delete<{ disbanded: boolean; message: string }>(
    `/bands/${bandId}/members/me`,
  );
  return data;
}
