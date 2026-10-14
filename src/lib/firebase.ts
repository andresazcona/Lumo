// Firebase initialisation. See ./config.ts for where the settings come from.
import { initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import { connectStorageEmulator, getStorage } from 'firebase/storage';
import { resolveConfig, type RuntimeConfig } from './config';

declare global {
  interface Window {
    __LUMO_CONFIG__?: RuntimeConfig;
  }
}

// Must match the ports in firebase.json
const EMULATOR_PORTS = { auth: 9099, firestore: 8088, storage: 9199 };

const { firebase, emulators } = resolveConfig(window.__LUMO_CONFIG__, import.meta.env);

export const app = initializeApp(firebase);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

if (emulators) {
  connectAuthEmulator(auth, `http://${emulators.host}:${EMULATOR_PORTS.auth}`, {
    disableWarnings: true,
  });
  connectFirestoreEmulator(db, emulators.host, EMULATOR_PORTS.firestore);
  connectStorageEmulator(storage, emulators.host, EMULATOR_PORTS.storage);
}
