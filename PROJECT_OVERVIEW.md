# Project Overview

## Resumen

**Gym Progress PWA** es una aplicación web tipo PWA para registrar entrenamientos, seguir el progreso físico y visualizar evolución con gráficos. El proyecto combina Remix, React, Firebase, Chart.js, Tailwind CSS y Zustand, con soporte offline mediante service worker e IndexedDB.

## Estructura relevante del repositorio

### Raíz del proyecto

- `package.json`: scripts y dependencias principales.
- `package-lock.json`: bloqueo de dependencias.
- `tsconfig.json`: configuración de TypeScript.
- `vite.config.ts`: configuración de Vite.
- `next.config.mjs`: configuración PWA basada en `next-pwa`.
- `firebase.json`: configuración de hosting de Firebase.
- `firestore.rules`: reglas de Firestore.
- `.eslintrc.cjs`: configuración de ESLint.
- `postcss.config.js` y `tailwind.config.ts`: pipeline de estilos.
- `README.md`: descripción general del proyecto.
- `Docs/`: documentación complementaria del proyecto.

### `app/`

Contiene la aplicación principal de Remix.

#### `app/root.tsx`

- Define la estructura HTML global.
- Carga `manifest.json`, favicon y fuentes.
- Lee la sesión activa desde Remix.
- Recupera el usuario actual y sus máquinas desde Firestore.
- Registra el service worker en el cliente.
- Muestra un aviso cuando la app está sin conexión.

#### `app/routes/`

- `app/routes/_index.tsx`: pantalla principal. Redirige a creación o selección de perfil si no hay usuario; si existe, muestra el dashboard con perfil, progreso, máquinas, filtros y comparaciones sociales.
- `app/routes/machine.$id.tsx`: detalle de una máquina. Permite registrar, editar y eliminar sesiones, ver historial y comparar rendimiento con amigos.
- `app/routes/profile.*`: flujo de perfil del usuario (`new`, `edit`, `select`).
- `app/routes/logout.tsx`: cierre de sesión.
- `app/routes/reload-user.tsx`: recarga del usuario actual.
- `app/routes/machine.new.tsx`: alta de máquinas.

#### `app/components/`

- `cards/`: tarjetas de usuario, perfil y máquina.
- `charts/`: gráficos de progreso y peso con Chart.js.
- `forms/`: formularios para sesiones y máquinas.
- `social/`: modal de amigos y comparación social.
- `ui/`: componentes reutilizables como `Toast`, `ErrorBoundary` y paneles de prueba.
- `TestFirestore.tsx`: componente de prueba para Firestore.

#### `app/hooks/`

- `useIdb.ts`: acceso a IndexedDB.
- `useNetworkStatus.ts`: detección de conectividad.
- `useTestDateStore.ts`: estado para fecha de pruebas.
- `useUserStore.ts`: estado global del usuario con Zustand.

#### `app/lib/`

- `storage.ts`: módulo central de persistencia y sincronización. Maneja usuarios, máquinas, sesiones, amigos, peso corporal, y fallback entre IndexedDB, `localStorage`, memoria del servidor y Firestore.
- `firebaseConfig.ts`: inicializa Firebase y Firestore, con persistencia IndexedDB del lado del navegador.
- `session.ts` y `session.server.ts`: manejo de sesión.
- `catalog.ts`: catálogo de máquinas.
- `initialData.ts`: datos iniciales.

#### `app/tailwind.css`

- Estilos globales de la aplicación.

### `public/`

Recursos estáticos y PWA.

- `manifest.json`: metadatos de la PWA.
- `service-worker.js`: soporte offline y caché.
- `offline.html`: página sin conexión.
- `favicon.ico`, `logo-dark.png`, `logo-light.png`: identidad visual.
- `images/machines/`: imágenes de máquinas y ejercicios.

### `Docs/`

Documentación del proyecto ya existente:

- `Docs/INDEX.md`: índice general.
- `Docs/task-list.md`: lista de tareas.
- `Docs/tips.md`: notas y recomendaciones.

## Flujo funcional principal

1. El usuario entra en la app y Remix resuelve la sesión actual.
2. `app/root.tsx` carga el usuario y las máquinas desde Firestore.
3. La pantalla principal decide si mostrar el onboarding de perfil o el dashboard.
4. Los datos de entrenamiento y máquinas se guardan y leen desde `app/lib/storage.ts`, que combina persistencia local y Firestore.
5. La app registra un service worker para habilitar funcionamiento offline.
6. Las vistas de progreso usan Chart.js para representar evolución.
7. La capa social permite añadir amigos y comparar sesiones o máquinas.

## Piezas más importantes para entender el proyecto

- `app/lib/storage.ts`
- `app/root.tsx`
- `app/routes/_index.tsx`
- `app/routes/machine.$id.tsx`
- `app/lib/firebaseConfig.ts`
- `public/manifest.json`
- `public/service-worker.js`
- `Docs/INDEX.md`

## Archivos y carpetas que se deben ignorar al documentar

No aportan valor para una guía de arquitectura general:

- `node_modules/`
- archivos temporales o generados por herramientas
- backups o copias puntuales como `public/_index_backup.html`
- artefactos de compilación o caché
- archivos timestamp o de salida intermedia

## Nota final

Esta vista está pensada como referencia rápida para entender la app sin entrar en detalles de implementación menores. Si el proyecto crece, este archivo puede servir como mapa inicial para nuevos cambios.
