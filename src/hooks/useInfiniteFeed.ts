// Custom hook for infinite scroll feed
import { useState, useEffect, useCallback } from 'react';
import { QueryDocumentSnapshot, type DocumentData } from 'firebase/firestore';
import { getPhotos } from '../lib/firestore';
import type { Photo } from '../types/photo';

export const useInfiniteFeed = (pageSize = 12) => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);

  const loadPhotos = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    setError(null);

    try {
      const result = await getPhotos(pageSize, lastDoc || undefined);

      if (result.photos.length === 0) {
        setHasMore(false);
      } else {
        setPhotos((prev) => {
          // Prevent duplicates by checking photo IDs
          const existingIds = new Set(prev.map(p => p.id));
          const newPhotos = result.photos.filter(p => !existingIds.has(p.id));
          return [...prev, ...newPhotos];
        });
        setLastDoc(result.lastDoc);
        setHasMore(result.photos.length === pageSize);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar fotos');
      console.error('Error loading photos:', err);
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, lastDoc, pageSize]);

  const refresh = useCallback(async () => {
    setPhotos([]);
    setLastDoc(null);
    setHasMore(true);
    setError(null);

    setLoading(true);
    try {
      const result = await getPhotos(pageSize);
      setPhotos(result.photos);
      setLastDoc(result.lastDoc);
      setHasMore(result.photos.length === pageSize);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar fotos');
      console.error('Error refreshing photos:', err);
    } finally {
      setLoading(false);
    }
  }, [pageSize]);

  useEffect(() => {
    loadPhotos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    photos,
    loading,
    hasMore,
    error,
    loadMore: loadPhotos,
    refresh,
  };
};
