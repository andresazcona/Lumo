// PhotoCard component
import type { Photo } from '../types/photo';
import { downloadImage } from '../lib/storage';
import './PhotoCard.css';

interface PhotoCardProps {
  photo: Photo;
}

export const PhotoCard = ({ photo }: PhotoCardProps) => {
  const handleDownload = async () => {
    try {
      // Convertir createdAt a timestamp
      const timestamp = photo.createdAt instanceof Date 
        ? photo.createdAt.getTime()
        : typeof photo.createdAt === 'object' && 'seconds' in photo.createdAt
        ? photo.createdAt.seconds * 1000
        : Date.now();
      
      const filename = `${photo.ownerDisplayName || 'photo'}-${timestamp}.jpg`;
      await downloadImage(photo.downloadURL, filename);
    } catch (error) {
      console.error('Error downloading photo:', error);
      alert('Error al descargar la imagen. Por favor intenta de nuevo.');
    }
  };

  return (
    <div className="photo-card">
      <div className="photo-card-header">
        <span className="photo-card-author">@{photo.ownerDisplayName || 'Anónimo'}</span>
        <button
          className="photo-card-download-btn"
          onClick={handleDownload}
          aria-label="Descargar foto"
          title="Descargar foto"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="download-icon"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
            />
          </svg>
        </button>
      </div>

      <div className="photo-card-image-container">
        <img
          src={photo.downloadURL}
          alt={`Foto de ${photo.ownerDisplayName}`}
          className="photo-card-image"
          loading="lazy"
        />
      </div>
    </div>
  );
};
