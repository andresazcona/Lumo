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

type Step = 'choose' | 'camera' | 'gallery' | 'preview' | 'uploading';

export const CameraModal = ({ isOpen, onClose, onPhotoUploaded }: CameraModalProps) => {
  const { user } = useAuth();
  const [step, setStep] = useState<Step>('choose');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [acceptedWarning, setAcceptedWarning] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setStep('choose');
    setSelectedFile(null);
    setPreviewUrl(null);
    setAcceptedWarning(false);
    setUploadProgress(0);
    setError(null);
  };

  const openCamera = async () => {
    try {
      setError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setStep('camera');
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('No se pudo acceder a la cámara. Usa la opción de galería.');
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    ctx?.drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(blob));
        
        // Stop camera
        if (stream) {
          stream.getTracks().forEach((track) => track.stop());
          setStream(null);
        }
        
        setStep('preview');
      }
    }, 'image/jpeg', 0.9);
  };

  const openGallery = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setStep('preview');
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
    setStep('choose');
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

        {step === 'choose' && (
          <div className="camera-modal-content">
            <h2>Subir Foto</h2>
            {error && <div className="error-message">{error}</div>}
            <div className="camera-modal-buttons">
              <button className="camera-btn primary" onClick={openCamera}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z"
                  />
                </svg>
                Abrir Cámara
              </button>
              <button className="camera-btn secondary" onClick={openGallery}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
                  />
                </svg>
                Elegir desde Galería
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
          </div>
        )}

        {step === 'camera' && (
          <div className="camera-modal-content camera-view">
            <video ref={videoRef} autoPlay playsInline className="camera-video" />
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            <div className="camera-controls">
              <button className="camera-btn primary" onClick={capturePhoto}>
                Capturar Foto
              </button>
              <button className="camera-btn secondary" onClick={retake}>
                Cancelar
              </button>
            </div>
          </div>
        )}

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
