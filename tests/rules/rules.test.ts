// Security rules, tested against the Firebase emulators:  npm run test:rules
import { readFileSync } from 'node:fs';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { deleteObject, getBytes, ref, uploadBytes } from 'firebase/storage';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';

let env: RulesTestEnvironment;

const jpeg = { contentType: 'image/jpeg' };
const smallImage = () => new Uint8Array(64);

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-lumo',
    firestore: { rules: readFileSync('firestore.rules', 'utf8') },
    storage: { rules: readFileSync('storage.rules', 'utf8') },
  });
});

afterAll(async () => {
  await env.cleanup();
});

beforeEach(async () => {
  await env.clearFirestore();
  await env.clearStorage();
});

const photo = (ownerUid: string) => ({
  ownerUid,
  storagePath: `photos/${ownerUid}/1.jpg`,
  downloadURL: 'http://example.test/1.jpg',
  createdAt: serverTimestamp(),
});

describe('firestore: photos', () => {
  it('hides the feed from signed-out visitors', async () => {
    const db = env.unauthenticatedContext().firestore();
    await assertFails(getDocs(collection(db, 'photos')));
  });

  it('shows the feed to signed-in users', async () => {
    const db = env.authenticatedContext('alice').firestore();
    await assertSucceeds(getDocs(collection(db, 'photos')));
  });

  it('lets a user post a photo as themselves', async () => {
    const db = env.authenticatedContext('alice').firestore();
    await assertSucceeds(addDoc(collection(db, 'photos'), photo('alice')));
  });

  it('refuses a photo posted in someone else name', async () => {
    const db = env.authenticatedContext('alice').firestore();
    await assertFails(addDoc(collection(db, 'photos'), photo('bob')));
  });

  it('refuses a back-dated photo (the timestamp must come from the server)', async () => {
    const db = env.authenticatedContext('alice').firestore();
    await assertFails(
      addDoc(collection(db, 'photos'), { ...photo('alice'), createdAt: new Date('2020-01-01') }),
    );
  });

  it('refuses anonymous posting', async () => {
    const db = env.unauthenticatedContext().firestore();
    await assertFails(addDoc(collection(db, 'photos'), photo('alice')));
  });

  it('never lets anyone edit or delete a photo, not even its owner', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'photos/p1'), {
        ownerUid: 'alice',
        storagePath: 'photos/alice/1.jpg',
        downloadURL: 'http://example.test/1.jpg',
      });
    });
    const db = env.authenticatedContext('alice').firestore();
    await assertFails(updateDoc(doc(db, 'photos/p1'), { downloadURL: 'http://evil.test/x.jpg' }));
    await assertFails(deleteDoc(doc(db, 'photos/p1')));
  });
});

describe('firestore: profiles', () => {
  it('lets users write only their own profile', async () => {
    const alice = env.authenticatedContext('alice').firestore();
    await assertSucceeds(setDoc(doc(alice, 'users/alice'), { name: 'Alice' }));
    await assertFails(setDoc(doc(alice, 'users/bob'), { name: 'Not Bob' }));
  });

  it('hides profiles from signed-out visitors', async () => {
    const anon = env.unauthenticatedContext().firestore();
    await assertFails(getDocs(collection(anon, 'users')));
  });
});

describe('storage: photos', () => {
  it('lets a user upload an image into their own folder', async () => {
    const storage = env.authenticatedContext('alice').storage();
    await assertSucceeds(uploadBytes(ref(storage, 'photos/alice/1.jpg'), smallImage(), jpeg));
  });

  it('refuses uploads into another user folder', async () => {
    const storage = env.authenticatedContext('alice').storage();
    await assertFails(uploadBytes(ref(storage, 'photos/bob/1.jpg'), smallImage(), jpeg));
  });

  it('refuses files that are not images', async () => {
    const storage = env.authenticatedContext('alice').storage();
    const pdf = { contentType: 'application/pdf' };
    await assertFails(uploadBytes(ref(storage, 'photos/alice/doc.pdf'), smallImage(), pdf));
  });

  it('refuses images of 10 MB or more', async () => {
    const storage = env.authenticatedContext('alice').storage();
    const huge = new Uint8Array(10 * 1024 * 1024 + 1);
    await assertFails(uploadBytes(ref(storage, 'photos/alice/big.jpg'), huge, jpeg));
  });

  it('refuses anonymous uploads', async () => {
    const storage = env.unauthenticatedContext().storage();
    await assertFails(uploadBytes(ref(storage, 'photos/alice/1.jpg'), smallImage(), jpeg));
  });

  it('never replaces a photo once uploaded', async () => {
    const storage = env.authenticatedContext('alice').storage();
    const file = ref(storage, 'photos/alice/1.jpg');
    await assertSucceeds(uploadBytes(file, smallImage(), jpeg));
    await assertFails(uploadBytes(file, smallImage(), jpeg));
  });

  it('never deletes a photo, not even for its owner', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await uploadBytes(ref(ctx.storage(), 'photos/alice/2.jpg'), smallImage(), jpeg);
    });
    const storage = env.authenticatedContext('alice').storage();
    await assertFails(deleteObject(ref(storage, 'photos/alice/2.jpg')));
  });

  it('shows photos to signed-in users only', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await uploadBytes(ref(ctx.storage(), 'photos/alice/1.jpg'), smallImage(), jpeg);
    });
    const member = env.authenticatedContext('bob').storage();
    const visitor = env.unauthenticatedContext().storage();
    await assertSucceeds(getBytes(ref(member, 'photos/alice/1.jpg')));
    await assertFails(getBytes(ref(visitor, 'photos/alice/1.jpg')));
  });
});

describe('storage: avatars', () => {
  it('lets the owner replace and delete their avatar', async () => {
    const storage = env.authenticatedContext('alice').storage();
    const avatar = ref(storage, 'avatars/alice/me.jpg');
    await assertSucceeds(uploadBytes(avatar, smallImage(), jpeg));
    await assertSucceeds(uploadBytes(avatar, smallImage(), jpeg));
    await assertSucceeds(deleteObject(avatar));
  });

  it('keeps other users out of an avatar folder', async () => {
    const storage = env.authenticatedContext('bob').storage();
    await assertFails(uploadBytes(ref(storage, 'avatars/alice/me.jpg'), smallImage(), jpeg));
  });
});
