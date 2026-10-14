// Where the Firebase settings come from, in priority order:
//   1. emulators  (window.__LUMO_CONFIG__.useEmulators): a local Firebase that needs no project
//   2. runtime    (window.__LUMO_CONFIG__.firebase): written at container start, so ONE image
//                 can be deployed against any Firebase project
//   3. build time (VITE_FIREBASE_* variables): the usual Vite way, for development

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

export interface RuntimeConfig {
  useEmulators?: boolean;
  emulatorHost?: string;
  firebase?: Partial<FirebaseConfig>;
}

export interface ResolvedConfig {
  firebase: FirebaseConfig;
  emulators: { host: string } | null;
}

type Env = Record<string, string | undefined>;

const REQUIRED: Array<[keyof FirebaseConfig, string]> = [
  ['apiKey', 'VITE_FIREBASE_API_KEY'],
  ['authDomain', 'VITE_FIREBASE_AUTH_DOMAIN'],
  ['projectId', 'VITE_FIREBASE_PROJECT_ID'],
  ['storageBucket', 'VITE_FIREBASE_STORAGE_BUCKET'],
  ['messagingSenderId', 'VITE_FIREBASE_MESSAGING_SENDER_ID'],
  ['appId', 'VITE_FIREBASE_APP_ID'],
];

/** Dummy values: emulators ignore credentials but the SDK insists on a project id. */
const EMULATOR_FIREBASE: FirebaseConfig = {
  apiKey: 'demo-key',
  authDomain: 'demo-lumo.firebaseapp.com',
  projectId: 'demo-lumo',
  storageBucket: 'demo-lumo.appspot.com',
  messagingSenderId: '0',
  appId: 'demo-lumo-app',
};

export function resolveConfig(runtime: RuntimeConfig | undefined, env: Env): ResolvedConfig {
  if (runtime?.useEmulators) {
    return {
      firebase: { ...EMULATOR_FIREBASE, ...runtime.firebase },
      emulators: { host: runtime.emulatorHost || 'localhost' },
    };
  }

  const fromRuntime = runtime?.firebase;
  const fromEnv: Partial<FirebaseConfig> = {};
  for (const [key, variable] of REQUIRED) fromEnv[key] = env[variable];
  const chosen = fromRuntime?.apiKey ? fromRuntime : fromEnv;

  const missing = REQUIRED.filter(([key]) => !chosen[key]).map(([, variable]) => variable);
  if (missing.length > 0) {
    throw new Error(
      `Lumo is not configured. Missing: ${missing.join(', ')}. ` +
        'Set them for the build, pass FIREBASE_* variables to the container, or start the ' +
        'local emulators with `docker compose up`.',
    );
  }
  return { firebase: chosen as FirebaseConfig, emulators: null };
}
