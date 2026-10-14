# Firebase Auth, Firestore and Storage emulators with this project's security rules.
# Nothing is stored on disk: stop the container and every account and photo is gone.
FROM node:22-bookworm-slim
RUN apt-get update \
    && apt-get install -y --no-install-recommends openjdk-17-jre-headless \
    && rm -rf /var/lib/apt/lists/*
RUN npm install -g firebase-tools@13.29.1
USER node
WORKDIR /home/node/app
# Fetch the emulator runtimes at build time so `docker compose up` starts offline.
RUN firebase setup:emulators:firestore && (firebase setup:emulators:storage || true)
COPY --chown=node:node firebase.json firestore.rules storage.rules ./
EXPOSE 9099 8088 9199
HEALTHCHECK --interval=10s --timeout=3s --start-period=30s --retries=6 \
    CMD node -e "fetch('http://127.0.0.1:8088').then(() => process.exit(0)).catch(() => process.exit(1))"
CMD ["firebase", "emulators:start", "--project", "demo-lumo", "--only", "auth,firestore,storage"]
