import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../lib/queryClient';
import type { GeotaggedImageRow } from '../../lib/database.types';
import {
  listGeotaggedImages,
  uploadGeotaggedImage,
  deleteGeotaggedImage,
  updateGeotaggedImage,
  type PendingUpload,
} from './api';

export function useGeotaggedImages(siteId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.geotagged(siteId ?? ''),
    queryFn: () => listGeotaggedImages(siteId!),
    enabled: Boolean(siteId),
  });
}

export function useUploadGeotaggedImage(siteId: string, siteSlug: string, userId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    // userId may be null in open demo mode; the row simply records no uploader.
    mutationFn: (pending: PendingUpload) =>
      uploadGeotaggedImage(siteSlug, siteId, pending, userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.geotagged(siteId) }),
  });
}

export function useDeleteGeotaggedImage(siteId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (row: GeotaggedImageRow) => deleteGeotaggedImage(row),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.geotagged(siteId) }),
  });
}

export function useUpdateGeotaggedImage(siteId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Parameters<typeof updateGeotaggedImage>[1] }) =>
      updateGeotaggedImage(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.geotagged(siteId) }),
  });
}
