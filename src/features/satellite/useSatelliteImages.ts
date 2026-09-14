import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../lib/queryClient';
import type { SatelliteImageRow } from '../../lib/database.types';
import {
  listSatelliteImages,
  uploadSatelliteImage,
  deleteSatelliteImage,
  updateSatelliteImage,
  type SatelliteUploadInput,
} from './api';

export function useSatelliteImages(siteId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.satellite(siteId ?? ''),
    queryFn: () => listSatelliteImages(siteId!),
    enabled: Boolean(siteId),
  });
}

export function useUploadSatelliteImage(siteId: string, siteSlug: string, userId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    // userId may be null in open demo mode; the row simply records no uploader.
    mutationFn: (input: SatelliteUploadInput) =>
      uploadSatelliteImage(siteSlug, siteId, input, userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.satellite(siteId) }),
  });
}

export function useDeleteSatelliteImage(siteId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (row: SatelliteImageRow) => deleteSatelliteImage(row),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.satellite(siteId) }),
  });
}

export function useUpdateSatelliteImage(siteId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Parameters<typeof updateSatelliteImage>[1] }) =>
      updateSatelliteImage(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.satellite(siteId) }),
  });
}
