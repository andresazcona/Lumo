#!/bin/sh
# Runs at container start (nginx image hook). Writes the browser config the app reads as
# window.__LUMO_CONFIG__, from environment variables:
#
#   USE_EMULATORS=true [EMULATOR_HOST=localhost]       local Firebase emulators, no project needed
#   FIREBASE_API_KEY, FIREBASE_AUTH_DOMAIN, FIREBASE_PROJECT_ID,
#   FIREBASE_STORAGE_BUCKET, FIREBASE_MESSAGING_SENDER_ID, FIREBASE_APP_ID    your own project
set -eu

OUT=/tmp/lumo/config.js
mkdir -p /tmp/lumo

# Values end up inside a JavaScript string: drop anything that could close it.
clean() { printf '%s' "${1:-}" | tr -d '"\\\n\r<>'; }

if [ "${USE_EMULATORS:-false}" = "true" ]; then
  printf 'window.__LUMO_CONFIG__ = { useEmulators: true, emulatorHost: "%s" };\n' \
    "$(clean "${EMULATOR_HOST:-localhost}")" > "$OUT"
elif [ -n "${FIREBASE_API_KEY:-}" ]; then
  printf 'window.__LUMO_CONFIG__ = { firebase: { apiKey: "%s", authDomain: "%s", projectId: "%s", storageBucket: "%s", messagingSenderId: "%s", appId: "%s" } };\n' \
    "$(clean "$FIREBASE_API_KEY")" "$(clean "${FIREBASE_AUTH_DOMAIN:-}")" "$(clean "${FIREBASE_PROJECT_ID:-}")" \
    "$(clean "${FIREBASE_STORAGE_BUCKET:-}")" "$(clean "${FIREBASE_MESSAGING_SENDER_ID:-}")" "$(clean "${FIREBASE_APP_ID:-}")" > "$OUT"
else
  echo "lumo: set USE_EMULATORS=true or the FIREBASE_* variables; the app will show a configuration error." >&2
  printf 'window.__LUMO_CONFIG__ = undefined;\n' > "$OUT"
fi
