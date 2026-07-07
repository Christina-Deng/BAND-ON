import { api } from './client';
import type { CreateRehearsalPlanInput, RehearsalPlan } from '../types/community';

export async function listRehearsalPlans(bandId: string) {
  const { data } = await api.get<{ plans: RehearsalPlan[] }>(`/bands/${bandId}/rehearsal-plans`);
  return data.plans;
}

export async function createRehearsalPlan(bandId: string, input: CreateRehearsalPlanInput) {
  const { data } = await api.post<{ plan: RehearsalPlan }>(
    `/bands/${bandId}/rehearsal-plans`,
    input,
  );
  return data.plan;
}

export async function updateRehearsalPlan(
  bandId: string,
  planId: string,
  input: CreateRehearsalPlanInput,
) {
  const { data } = await api.patch<{ plan: RehearsalPlan }>(
    `/bands/${bandId}/rehearsal-plans/${planId}`,
    input,
  );
  return data.plan;
}

export async function deleteRehearsalPlan(bandId: string, planId: string) {
  await api.delete(`/bands/${bandId}/rehearsal-plans/${planId}`);
}
