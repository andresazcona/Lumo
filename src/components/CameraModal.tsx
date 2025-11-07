// CameraModal component
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { uploadPhoto } from '../lib/storage';
import { addPhoto } from '../lib/firestore';
import './CameraModal.css';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPhotoUploaded: () => void;
}

type Step = 'gallery' | 'preview' | 'uploading';

export const CameraModal = ({ isOpen, onClose, onPhotoUploaded }: CameraModalProps) => {
  const { user } = useAuth();
  const [step, setStep] = useState<Step>('gallery');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [acceptedWarning, setAcceptedWarning] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && step === 'gallery') {
      // Automatically trigger file input when modal opens
      setTimeout(() => {
        fileInputRef.current?.click();
      }, 100);
    }
  }, [isOpen, step]);

  useEffect(() => {
    if (!isOpen) {
      cleanup();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    return () => {
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cleanup = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setStep('gallery');
    setSelectedFile(null);
    setPreviewUrl(null);
    setAcceptedWarning(false);
    setUploadProgress(0);
    setError(null);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setStep('preview');
    } else {
      // If no file selected, close modal
      onClose();
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !user || !acceptedWarning) return;

    setStep('uploading');
    setError(null);
    setUploadProgress(0);

    try {
      // Simulate progress (Firebase doesn't provide upload progress easily with uploadBytes)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const result = await uploadPhoto(selectedFile, user.uid);

      clearInterval(progressInterval);
      setUploadProgress(95);

      await addPhoto({
        storagePath: result.storagePath,
        downloadURL: result.downloadURL,
        ownerUid: user.uid,
        ownerDisplayName: user.displayName || user.email || 'Anónimo',
        width: result.metadata.width,
        height: result.metadata.height,
        sizeBytes: result.metadata.sizeBytes,
      });

      setUploadProgress(100);
      setTimeout(() => {
        onPhotoUploaded();
        cleanup();
      }, 500);
    } catch (err) {
      console.error('Error uploading photo:', err);
      setError('Error al subir la foto. Por favor intenta de nuevo.');
      setStep('preview');
    }
  };

  const retake = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setAcceptedWarning(false);
    setStep('gallery');
    // Trigger file input again
    setTimeout(() => {
      fileInputRef.current?.click();
    }, 100);
  };

  if (!isOpen) return null;

  return (
    <div className="camera-modal-overlay" onClick={onClose}>
      <div className="camera-modal" onClick={(e) => e.stopPropagation()}>
        <button className="camera-modal-close" onClick={onClose} aria-label="Cerrar">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />

        {step === 'preview' && previewUrl && (
          <div className="camera-modal-content preview-view">
            <h2>Previsualización</h2>
            <img src={previewUrl} alt="Preview" className="preview-image" />

            <div className="warning-box">
              <p className="warning-text">
                ⚠️ <strong>Advertencia:</strong> Una vez subida, esta imagen no podrá eliminarse.
              </p>
              <label className="warning-checkbox">
                <input
                  type="checkbox"
                  checked={acceptedWarning}
                  onChange={(e) => setAcceptedWarning(e.target.checked)}
                />
                <span>Entiendo y acepto que no podré eliminar esta foto</span>
              </label>
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="camera-modal-buttons">
              <button
                className="camera-btn primary"
                onClick={handleUpload}
                disabled={!acceptedWarning}
              >
                Subir Foto
              </button>
              <button className="camera-btn secondary" onClick={retake}>
                Tomar Otra
              </button>
            </div>
          </div>
        )}

        {step === 'uploading' && (
          <div className="camera-modal-content uploading-view">
            <h2>Subiendo foto...</h2>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${uploadProgress}%` }} />
            </div>
            <p className="progress-text">{uploadProgress}%</p>
          </div>
        )}
      </div>
    </div>
  );
};
