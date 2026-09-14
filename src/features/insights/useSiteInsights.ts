import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../lib/queryClient';
import {
  listSiteInsights,
  createInsight,
  updateInsight,
  deleteInsight,
  type InsightInput,
} from './api';

export function useSiteInsights(siteId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.siteInsights(siteId ?? ''),
    queryFn: () => listSiteInsights(siteId!),
    enabled: Boolean(siteId),
  });
}

export function useCreateInsight(siteId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: InsightInput) => createInsight(siteId, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.siteInsights(siteId) }),
  });
}

export function useUpdateInsight(siteId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Parameters<typeof updateInsight>[1] }) =>
      updateInsight(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.siteInsights(siteId) }),
  });
}

export function useDeleteInsight(siteId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteInsight(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.siteInsights(siteId) }),
  });
}
