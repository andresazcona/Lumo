// Type definitions for Photo documents in Firestore

export interface Photo {
  id: string;
  storagePath: string;
  downloadURL: string;
  ownerUid: string;
  ownerDisplayName: string;
  createdAt: Date | { seconds: number; nanoseconds: number };
  width: number;
  height: number;
  sizeBytes: number;
  exif?: Record<string, unknown>;
}

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  photoCount?: number;
}
