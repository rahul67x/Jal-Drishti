import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../lib/queryClient';
import {
  listSites,
  listSiteMetrics,
  getSiteBySlug,
  getSiteMetrics,
  getSiteLulc,
  createSite,
  deleteSite,
  updateSite,
} from './api';

/** All published sites, for the directory page. */
export function useSites() {
  return useQuery({
    queryKey: queryKeys.sites,
    queryFn: listSites,
  });
}

/** Metrics for every site, keyed by slug so a card can look its own up. */
export function useAllSiteMetrics() {
  return useQuery({
    queryKey: [...queryKeys.sites, 'metrics'],
    queryFn: async () => {
      const rows = await listSiteMetrics();
      return new Map(rows.map((r) => [r.slug, r]));
    },
  });
}

export function useSite(slug: string | undefined) {
  return useQuery({
    queryKey: queryKeys.site(slug ?? ''),
    queryFn: () => getSiteBySlug(slug!),
    enabled: Boolean(slug),
  });
}

export function useSiteMetrics(slug: string | undefined) {
  return useQuery({
    queryKey: queryKeys.siteMetrics(slug ?? ''),
    queryFn: () => getSiteMetrics(slug!),
    enabled: Boolean(slug),
  });
}

export function useSiteLulc(slug: string | undefined) {
  return useQuery({
    queryKey: queryKeys.siteLulc(slug ?? ''),
    queryFn: () => getSiteLulc(slug!),
    enabled: Boolean(slug),
  });
}

export function useCreateSite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createSite,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.sites }),
  });
}

export function useDeleteSite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteSite,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.sites }),
  });
}

export function useUpdateSite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Parameters<typeof updateSite>[1] }) =>
      updateSite(id, input),
    onSuccess: (site) => {
      qc.invalidateQueries({ queryKey: queryKeys.sites });
      qc.invalidateQueries({ queryKey: queryKeys.site(site.slug) });
    },
  });
}
