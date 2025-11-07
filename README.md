# 📸 Lumo - Álbum Compartido

Aplicación web tipo álbum/feed compartido (estilo Instagram minimalista) donde usuarios autenticados pueden subir fotos desde el celular o galería, ver el feed con autor y descargar imágenes. **Una vez subida una imagen no puede ser eliminada** (regla técnica y de UI).



## ✨ CaracterísticasCurrently, two official plugins are available:



- 🔐 **Autenticación**: Google Sign-In y Email/Password- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh

- 📱 **Subida de fotos**: Desde cámara o galería- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

- 🖼️ **Feed público**: Grid responsivo con infinite scroll

- ⬇️ **Descarga de imágenes**: Botón en cada foto## React Compiler

- 🚫 **No eliminación**: Las fotos no pueden borrarse una vez subidas

- ⚡ **PWA**: Instalable como app nativaThe React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

- 🎨 **Tema B/N**: Diseño elegante en blanco y negro

- ♿ **Accesible**: Cumple estándares WCAG AA## Expanding the ESLint configuration



## 🛠️ Stack TecnológicoIf you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:



- **Frontend**: React 19 + TypeScript + Vite```js

- **Backend**: Firebase (Auth, Firestore, Storage)export default defineConfig([

- **Routing**: React Router v6  globalIgnores(['dist']),

- **Estilos**: CSS puro con variables  {

- **PWA**: Vite Plugin PWA    files: ['**/*.{ts,tsx}'],

- **Linting**: ESLint + Prettier    extends: [

      // Other configs...

## 📋 Requisitos Previos

      // Remove tseslint.configs.recommended and replace with this

- Node.js 18+ y pnpm (o npm/yarn)      tseslint.configs.recommendedTypeChecked,

- Cuenta de Firebase con proyecto creado      // Alternatively, use this for stricter rules

- Navegador moderno con soporte para MediaDevices API      tseslint.configs.strictTypeChecked,

      // Optionally, add this for stylistic rules

## 🚀 Instalación      tseslint.configs.stylisticTypeChecked,



### 1. Clonar el repositorio      // Other configs...

    ],

```bash    languageOptions: {

git clone <tu-repo>      parserOptions: {

cd lumo        project: ['./tsconfig.node.json', './tsconfig.app.json'],

```        tsconfigRootDir: import.meta.dirname,

      },

### 2. Instalar dependencias      // other options...

    },

```bash  },

pnpm install])

``````



### 3. Configurar FirebaseYou can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:



1. Ve a [Firebase Console](https://console.firebase.google.com/)```js

2. Crea un nuevo proyecto o usa uno existente// eslint.config.js

3. Habilita **Authentication** (Google y Email/Password)import reactX from 'eslint-plugin-react-x'

4. Crea una base de datos **Firestore**import reactDom from 'eslint-plugin-react-dom'

5. Configura **Storage**

6. Copia las credenciales de tu proyectoexport default defineConfig([

  globalIgnores(['dist']),

### 4. Variables de entorno  {

    files: ['**/*.{ts,tsx}'],

Copia el archivo `.env.example` a `.env`:    extends: [

      // Other configs...

```bash      // Enable lint rules for React

cp .env.example .env      reactX.configs['recommended-typescript'],

```      // Enable lint rules for React DOM

      reactDom.configs.recommended,

Edita `.env` con tus credenciales de Firebase:    ],

    languageOptions: {

```env      parserOptions: {

VITE_FIREBASE_API_KEY=tu_api_key        project: ['./tsconfig.node.json', './tsconfig.app.json'],

VITE_FIREBASE_AUTH_DOMAIN=tu_project_id.firebaseapp.com        tsconfigRootDir: import.meta.dirname,

VITE_FIREBASE_PROJECT_ID=tu_project_id      },

VITE_FIREBASE_STORAGE_BUCKET=tu_project_id.appspot.com      // other options...

VITE_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id    },

VITE_FIREBASE_APP_ID=tu_app_id  },

```])

```

### 5. Configurar reglas de Firebase

#### Firestore Rules

Ve a Firestore > Rules en Firebase Console y copia el contenido de `firestore.rules`:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /photos/{photoId} {
      allow read: if true;
      allow create: if request.auth != null &&
        request.resource.data.ownerUid == request.auth.uid &&
        request.resource.data.createdAt == request.time;
      allow update, delete: if false; // ❌ No se puede eliminar
    }
    match /users/{uid} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

#### Storage Rules

Ve a Storage > Rules en Firebase Console y copia el contenido de `storage.rules`:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /photos/{allPaths=**} {
      allow read: if true;
      allow create: if request.auth != null &&
        request.resource.size < 10 * 1024 * 1024 &&
        request.resource.contentType.matches('image/.*');
      allow delete: if false; // ❌ No se puede eliminar
      allow update: if false;
    }
  }
}
```

### 6. Generar iconos PWA (opcional)

Los iconos PWA están en `public/icons/`. Puedes:
- Generar tus propios iconos siguiendo `public/icons/README.md`
- Usar una herramienta como [PWA Builder](https://www.pwabuilder.com/imageGenerator)
- Dejar los placeholders (funcionará sin iconos personalizados)

### 7. Ejecutar en desarrollo

```bash
pnpm dev
```

La aplicación estará disponible en `http://localhost:5173`

## 📦 Build para Producción

```bash
pnpm build
pnpm preview
```

## 🚢 Despliegue

### Opción 1: Firebase Hosting

```bash
# Instalar Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Inicializar
firebase init hosting

# Build
pnpm build

# Deploy
firebase deploy --only hosting
```

### Opción 2: Vercel

```bash
# Instalar Vercel CLI
npm install -g vercel

# Deploy
vercel
```

### Opción 3: Netlify

Conecta tu repositorio en [Netlify](https://netlify.com) con estos ajustes:
- **Build command**: `pnpm build`
- **Publish directory**: `dist`

## 📁 Estructura del Proyecto

```
lumo/
├─ public/
│  ├─ icons/              # Iconos PWA
│  └─ manifest.webmanifest
├─ src/
│  ├─ components/         # Componentes React
│  │  ├─ Header.tsx
│  │  ├─ PhotoCard.tsx
│  │  ├─ UploadFAB.tsx
│  │  └─ CameraModal.tsx
│  ├─ routes/            # Páginas/rutas
│  │  ├─ index.tsx       # Router config
│  │  ├─ Auth.tsx
│  │  ├─ Feed.tsx
│  │  └─ Profile.tsx
│  ├─ lib/               # Utilidades Firebase
│  │  ├─ firebase.ts
│  │  ├─ auth.ts
│  │  ├─ firestore.ts
│  │  └─ storage.ts
│  ├─ hooks/             # Custom hooks
│  │  ├─ useAuth.ts
│  │  └─ useInfiniteFeed.ts
│  ├─ styles/
│  │  └─ globals.css
│  ├─ types/
│  │  └─ photo.d.ts
│  ├─ App.tsx
│  └─ main.tsx
├─ firestore.rules       # Reglas Firestore
├─ storage.rules         # Reglas Storage
├─ .env.example
├─ package.json
├─ vite.config.ts
└─ README.md
```

## 🎯 Flujo de Usuario

### 1. Autenticación
- Usuario entra a la app → redirigido a `/auth`
- Opciones: **Continuar con Google** o **Email/Password**
- Validaciones de formulario con mensajes claros
- Al autenticarse → redirigido a `/feed`

### 2. Feed Principal
- Grid responsivo (1 col móvil, 2-3 cols desktop)
- Cada card muestra: autor arriba, foto, botón de descarga
- Orden: más recientes primero
- Infinite scroll: carga automática al llegar al final

### 3. Subir Foto
- FAB (botón flotante) abajo a la derecha con ícono de cámara
- Modal con opciones: **Abrir Cámara** o **Galería**
- Previsualización de la foto
- **Advertencia obligatoria**: "Una vez subida, no podrá eliminarse"
- Checkbox de aceptación
- Compresión automática si > 3MB
- Subida a Firebase Storage + documento Firestore

### 4. Descarga
- Botón en esquina superior derecha de cada card
- Descarga con nombre: `autor-timestamp.jpg`

### 5. Perfil
- Foto de perfil (de Google si existe)
- Nombre y email
- Contador de fotos subidas
- Botón para volver al feed

## 🔒 Seguridad

### Reglas de Firestore
- ✅ **Lectura pública**: cualquiera puede ver el feed
- ✅ **Creación autenticada**: solo usuarios logueados pueden subir
- ✅ **Validación de owner**: el `ownerUid` debe coincidir con el usuario
- ❌ **No updates ni deletes**: imposible modificar o borrar fotos

### Reglas de Storage
- ✅ **Lectura pública**: descarga abierta
- ✅ **Subida autenticada**: solo usuarios logueados
- ✅ **Límite de tamaño**: máximo 10 MB
- ✅ **Solo imágenes**: validación de `contentType`
- ❌ **No deletes ni updates**: imposible borrar o modificar

## ✅ Criterios de Aceptación

- [x] Autenticación Google y Email/Password funcionales
- [x] Tema B/N coherente y responsive (móvil first)
- [x] Feed muestra autor, foto y botón de descarga
- [x] FAB abre cámara/galería con previsualización
- [x] Advertencia y checkbox antes de subir
- [x] Tras subir, **no hay forma de borrar**
- [x] Reglas de Firestore/Storage **impiden delete/update**
- [x] Paginación/infinite scroll sin recargas
- [x] Mensajes de error claros en español
- [x] Estados de carga y vacío bien resueltos
- [x] Accesibilidad (aria-labels, focus visible)
- [x] PWA básica configurada

## 🧪 Testing (opcional)

```bash
# Unit tests con Vitest
pnpm test

# E2E con Playwright (si configurado)
pnpm test:e2e
```

## 🐛 Troubleshooting

### Error: "Cannot find module 'firebase/...'"
- Asegúrate de ejecutar `pnpm install`
- Verifica que Firebase esté en `package.json`

### Error: "Permission denied" en Firestore/Storage
- Revisa que las reglas estén correctamente desplegadas
- Verifica que el usuario esté autenticado

### La cámara no funciona
- Asegúrate de estar en HTTPS (o localhost)
- Da permisos de cámara al navegador
- Usa la opción de galería como alternativa

### Las fotos no se comprimen
- La compresión es opcional y automática si > 3MB
- Puedes ajustar el límite en `src/lib/storage.ts`

## 🎨 Personalización

### Cambiar colores
Edita las variables en `src/styles/globals.css` y archivos CSS de componentes:
```css
/* Negro principal */
background: #0a0a0a;

/* Blanco */
background: #ffffff;

/* Grises */
border: 1px solid #e5e5e5;
color: #666666;
```

### Cambiar tamaño de página
Ajusta `pageSize` en `src/hooks/useInfiniteFeed.ts`:
```typescript
export const useInfiniteFeed = (pageSize = 12) => {
  // ...
}
```

## 📝 Licencia

MIT License - siéntete libre de usar este proyecto como base.

## 👥 Contribuir

1. Fork el proyecto
2. Crea una rama (`git checkout -b feature/nueva-feature`)
3. Commit (`git commit -m 'Agregar nueva feature'`)
4. Push (`git push origin feature/nueva-feature`)
5. Abre un Pull Request

## 📧 Contacto

Para preguntas o soporte, abre un issue en GitHub.

---

**Nota importante**: Este proyecto implementa una política estricta de **no eliminación** de contenido. Asegúrate de que todos los usuarios comprendan esta limitación antes de subir fotos.
