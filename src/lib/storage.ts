// Storage utilities
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';

export interface ImageMetadata {
  width: number;
  height: number;
  sizeBytes: number;
}

export const uploadPhoto = async (
  file: File,
  uid: string
): Promise<{ downloadURL: string; storagePath: string; metadata: ImageMetadata }> => {
  const timestamp = Date.now();
  const storagePath = `photos/${uid}/${timestamp}.jpg`;
  const storageRef = ref(storage, storagePath);

  // Compress if needed
  const processedFile = await compressImage(file);

  // Get image dimensions
  const metadata = await getImageMetadata(processedFile);

  // Upload to Firebase Storage
  await uploadBytes(storageRef, processedFile);

  // Get download URL
  const downloadURL = await getDownloadURL(storageRef);

  return {
    downloadURL,
    storagePath,
    metadata,
  };
};

const compressImage = async (file: File, maxSizeMB = 3): Promise<File> => {
  if (file.size <= maxSizeMB * 1024 * 1024) {
    return file;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        // Reduce size proportionally if too large
        const maxDimension = 1920;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = (height * maxDimension) / width;
            width = maxDimension;
          } else {
            width = (width * maxDimension) / height;
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          },
          'image/jpeg',
          0.85
        );
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
};

const getImageMetadata = async (file: File): Promise<ImageMetadata> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        resolve({
          width: img.width,
          height: img.height,
          sizeBytes: file.size,
        });
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
};

export const downloadImage = async (url: string, filename: string): Promise<void> => {
  try {
    const response = await fetch(url, {
      mode: 'cors',
      credentials: 'omit',
    });
    
    if (!response.ok) {
      throw new Error('Error al descargar la imagen');
    }
    
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    
    // Clean up after a delay to ensure download starts
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    }, 100);
  } catch (error) {
    console.error('Error downloading image:', error);
    // Fallback: open in new tab
    window.open(url, '_blank');
  }
};

export const uploadProfilePhoto = async (file: File, uid: string): Promise<string> => {
  const timestamp = Date.now();
  const storagePath = `avatars/${uid}/${timestamp}.jpg`;
  const storageRef = ref(storage, storagePath);

  // Compress and resize for avatar
  const processedFile = await compressAvatar(file);

  // Upload to Firebase Storage
  await uploadBytes(storageRef, processedFile);

  // Get download URL
  const downloadURL = await getDownloadURL(storageRef);
  return downloadURL;
};

const compressAvatar = async (file: File): Promise<File> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = 400; // Fixed size for avatars
        
        canvas.width = size;
        canvas.height = size;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }

        // Calculate crop dimensions (center crop to square)
        const sourceSize = Math.min(img.width, img.height);
        const sourceX = (img.width - sourceSize) / 2;
        const sourceY = (img.height - sourceSize) / 2;

        ctx.drawImage(img, sourceX, sourceY, sourceSize, sourceSize, 0, 0, size, size);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          },
          'image/jpeg',
          0.9
        );
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
};

