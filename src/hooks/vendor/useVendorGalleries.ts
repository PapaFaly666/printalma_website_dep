import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { galleryService } from '../../services/gallery.service';
import { queryKeys, cacheTimes } from '../../lib/react-query/queryClient';
import { toast } from 'sonner';

/**
 * Hook pour récupérer les galeries du vendeur
 * Cache: 5 minutes (données relativement statiques)
 */
export function useVendorGalleries(page: number = 1, limit: number = 10) {
  return useQuery({
    queryKey: queryKeys.vendorGalleries,
    queryFn: () => galleryService.getVendorGalleries(page, limit),
    staleTime: cacheTimes.stats,
    gcTime: cacheTimes.stats * 2,
  });
}

/**
 * Hook pour récupérer la galerie publique d'un vendeur
 * Cache: 10 minutes (données statiques publiques)
 */
export function usePublicVendorGallery(vendorId: number) {
  return useQuery({
    queryKey: queryKeys.publicGallery(vendorId),
    queryFn: () => galleryService.getPublicVendorGallery(vendorId),
    enabled: !!vendorId,
    staleTime: cacheTimes.static,
    gcTime: cacheTimes.static * 2,
  });
}

/**
 * Hook pour créer ou mettre à jour la galerie du vendeur
 * Invalide le cache après succès
 */
export function useCreateOrUpdateGallery() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      title: string;
      description?: string;
      images: File[];
      captions?: string[];
    }) => galleryService.createOrUpdateGallery(data),
    onSuccess: () => {
      // Invalider le cache des galeries
      queryClient.invalidateQueries({ queryKey: queryKeys.vendorGalleries });
      toast.success('Galerie sauvegardée avec succès');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erreur lors de la sauvegarde');
    },
  });
}

/**
 * Hook pour mettre à jour les informations de la galerie
 * Invalide le cache après succès
 */
export function useUpdateGalleryInfo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      title?: string;
      description?: string;
      status?: string;
      isPublished?: boolean;
    }) => galleryService.updateGalleryInfo(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.vendorGalleries });
      toast.success('Informations mises à jour');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erreur lors de la mise à jour');
    },
  });
}

/**
 * Hook pour supprimer la galerie
 * Invalide le cache après succès
 */
export function useDeleteGallery() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => galleryService.deleteGallery(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.vendorGalleries });
      queryClient.setQueryData(queryKeys.vendorGalleries, { galleries: [], total: 0 });
      toast.success('Galerie supprimée');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erreur lors de la suppression');
    },
  });
}

/**
 * Hook pour publier/dépublier une galerie
 * Invalide le cache après succès
 */
export function useTogglePublishGallery() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ galleryId, isPublished }: { galleryId: number; isPublished: boolean }) =>
      galleryService.togglePublishGallery(galleryId, isPublished),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.vendorGalleries });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erreur lors de la publication');
    },
  });
}

/**
 * Hook pour changer le statut de la galerie
 * Invalide le cache après succès
 */
export function useChangeGalleryStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (status: string) => galleryService.changeGalleryStatus(status as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.vendorGalleries });
      toast.success('Statut mis à jour');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erreur lors du changement de statut');
    },
  });
}

/**
 * Prefetch des données de galerie pour optimisation
 */
export function usePrefetchGallery() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.vendorGalleries,
      queryFn: () => galleryService.getVendorGalleries(),
      staleTime: cacheTimes.stats,
    });
  };
}
