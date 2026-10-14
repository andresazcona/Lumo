import { describe, expect, it } from 'vitest';
import { resolveConfig } from './config';

const env = {
  VITE_FIREBASE_API_KEY: 'env-key',
  VITE_FIREBASE_AUTH_DOMAIN: 'env.firebaseapp.com',
  VITE_FIREBASE_PROJECT_ID: 'env-project',
  VITE_FIREBASE_STORAGE_BUCKET: 'env.appspot.com',
  VITE_FIREBASE_MESSAGING_SENDER_ID: '1',
  VITE_FIREBASE_APP_ID: 'env-app',
};

const runtimeFirebase = {
  apiKey: 'run-key',
  authDomain: 'run.firebaseapp.com',
  projectId: 'run-project',
  storageBucket: 'run.appspot.com',
  messagingSenderId: '2',
  appId: 'run-app',
};

describe('resolveConfig', () => {
  it('uses the build-time variables when nothing is injected at runtime', () => {
    const result = resolveConfig(undefined, env);
    expect(result.firebase.projectId).toBe('env-project');
    expect(result.emulators).toBeNull();
  });

  it('lets runtime values (written at container start) win over the build', () => {
    const result = resolveConfig({ firebase: runtimeFirebase }, env);
    expect(result.firebase.projectId).toBe('run-project');
  });

  it('works with no credentials at all in emulator mode', () => {
    const result = resolveConfig({ useEmulators: true }, {});
    expect(result.firebase.projectId).toBe('demo-lumo');
    expect(result.emulators).toEqual({ host: 'localhost' });
  });

  it('points at another host when the emulators run elsewhere', () => {
    const result = resolveConfig({ useEmulators: true, emulatorHost: '192.168.1.20' }, {});
    expect(result.emulators?.host).toBe('192.168.1.20');
  });

  it('names every missing variable instead of failing silently', () => {
    expect(() => resolveConfig(undefined, {})).toThrow(/VITE_FIREBASE_API_KEY.*VITE_FIREBASE_APP_ID/);
  });

  it('refuses a half-configured runtime instead of mixing sources', () => {
    expect(() => resolveConfig({ firebase: { apiKey: 'run-key' } }, {})).toThrow(/Missing/);
  });
});
