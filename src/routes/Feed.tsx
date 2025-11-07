// Feed page
import { useEffect, useRef, useCallback } from 'react';
import { Header } from '../components/Header';
import { PhotoCard } from '../components/PhotoCard';
import { UploadFAB } from '../components/UploadFAB';
import { useInfiniteFeed } from '../hooks/useInfiniteFeed';
import './Feed.css';

export const Feed = () => {
  const { photos, loading, hasMore, error, loadMore, refresh } = useInfiniteFeed();
  const observerTarget = useRef<HTMLDivElement>(null);

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [target] = entries;
      if (target.isIntersecting && hasMore && !loading) {
        loadMore();
      }
    },
    [hasMore, loading, loadMore]
  );

  useEffect(() => {
    const element = observerTarget.current;
    if (!element) return;

    const observer = new IntersectionObserver(handleObserver, {
      threshold: 0.1,
    });

    observer.observe(element);

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [handleObserver]);

  return (
    <div className="feed-container">
      <Header />

      <main className="feed-main">
        {error && (
          <div className="feed-error">
            <p>{error}</p>
            <button onClick={refresh} className="retry-btn">
              Intentar de nuevo
            </button>
          </div>
        )}

        {photos.length === 0 && !loading && !error && (
          <div className="feed-empty">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="empty-icon"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
              />
            </svg>
            <h2>No hay fotos aún</h2>
            <p>Sé el primero en compartir un momento especial</p>
          </div>
        )}

        {photos.length > 0 && (
          <div className="feed-grid">
            {photos.map((photo) => (
              <PhotoCard key={photo.id} photo={photo} />
            ))}
          </div>
        )}

        {loading && (
          <div className="feed-loading">
            <div className="spinner"></div>
            <p>Cargando fotos...</p>
          </div>
        )}

        <div ref={observerTarget} className="feed-observer" />
      </main>

      <UploadFAB onPhotoUploaded={refresh} />
    </div>
  );
};
