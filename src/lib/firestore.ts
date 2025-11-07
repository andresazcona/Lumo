// Firestore utilities
import {
  collection,
  query,
  orderBy,
  limit,
  startAfter,
  getDocs,
  addDoc,
  serverTimestamp,
  where,
  type DocumentData,
  QueryDocumentSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Photo } from '../types/photo';

const PHOTOS_COLLECTION = 'photos';

export interface PhotoData {
  storagePath: string;
  downloadURL: string;
  ownerUid: string;
  ownerDisplayName: string;
  width: number;
  height: number;
  sizeBytes: number;
  exif?: Record<string, unknown>;
}

export const addPhoto = async (photoData: PhotoData): Promise<string> => {
  const docRef = await addDoc(collection(db, PHOTOS_COLLECTION), {
    ...photoData,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
};

export const getPhotos = async (
  pageSize = 12,
  lastDoc?: QueryDocumentSnapshot<DocumentData>
): Promise<{ photos: Photo[]; lastDoc: QueryDocumentSnapshot<DocumentData> | null }> => {
  let q = query(
    collection(db, PHOTOS_COLLECTION),
    orderBy('createdAt', 'desc'),
    limit(pageSize)
  );

  if (lastDoc) {
    q = query(q, startAfter(lastDoc));
  }

  const snapshot = await getDocs(q);
  const photos: Photo[] = snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
    } as Photo;
  });

  return {
    photos,
    lastDoc: snapshot.docs[snapshot.docs.length - 1] || null,
  };
};

export const getUserPhotoCount = async (uid: string): Promise<number> => {
  const q = query(collection(db, PHOTOS_COLLECTION), where('ownerUid', '==', uid));
  const snapshot = await getDocs(q);
  return snapshot.size;
};
