# 📚 Documentación del Proyecto

Bienvenido a la documentación completa del **Gym Progress PWA**.

## 📁 Estructura del Proyecto

```
gym_progress_pwa/
├── Docs/                    # Esta carpeta de documentación
├── public/                  # Archivos públicos
│   ├── images/
│   │   └── machines/       # Imágenes de ejercicios
│   ├── manifest.json       # Config PWA
│   └── service-worker.js   # PWA offline
├── src/                     # Código fuente (futuro)
├── app/                     # Directorios de Remix
├── public/
│   └── _index.html         # Entry point PWA
├── tailwind.config.ts      # Config Tailwind
├── vite.config.ts          # Config Vite
└── package.json            # Dependencias
```

## 🎯 Objetivo del Proyecto

**Gym Progress PWA** es una aplicación para:
- Registrar cada sesión de entrenamiento
- Seguimiento de ejercicios, series, repeticiones y peso
- Visualización gráfica del progreso
- Funciona completamente offline una vez cargada

## 🏗️ Arquitectura

### Frontend
- **Remix** - Rutas y lógica del servidor
- **React** - Componentes UI
- **Tailwind CSS** - Estilos
- **Chart.js** - Visualización de datos

### Backend (Serverless)
- **Firebase Auth** - Autenticación de usuarios
- **Firebase Firestore** - Base de datos documental
- **Firebase Storage** - Almacenamiento de imágenes/videos

### Offline First
- **Service Worker** - Caché de recursos
- **idb-keyval** - IndexedDB API wrapper
- **Workbox** - Generación automática de cache

## 🔥 Firebase Setup

El proyecto usa Firebase. Asegúrate de configurar:

1. **Auth** - Email/Password o Google Sign-In
2. **Firestore** - Colecciones:
   - `users/{userId}` - Datos del usuario
   - `workouts/{workoutId}` - Sesiones de entrenamiento
   - `exercises/{exerciseId}` - Ejercicios registrados
3. **Storage** - Subida de imágenes de progreso

## 📊 Estructura de Datos

### Usuario
```json
{
  "uid": "firebase_uid",
  "email": "usuario@email.com",
  "name": "Nombre",
  "createdAt": "timestamp"
}
```

### Entrenamiento
```json
{
  "workoutId": "uuid",
  "userId": "firebase_uid",
  "date": "2024-03-19",
  "exercises": [
    {
      "name": "Sentadilla",
      "sets": [
        {"repeticiones": 10, "peso": 50, "notas": "formación perfecta"}
      ]
    }
  ]
}
```

## 🚧 Estado Actual

El proyecto está en **desarrollo inicial**. Se necesita:

- [ ] Crear directorio `src/` con código React/Remix
- [ ] Implementar componentes UI
- [ ] Conectar con Firebase
- [ ] Dashboard de registro
- [ ] Historial de entrenamientos
- [ ] Configuración de gráficos

## 🎨 Diseño

La app usa imágenes de ejercicios en:
`public/images/machines/`

- Bench Press
- Leg Press
- Lat Pulldown
- Shoulder Press
- Bicep Curl
- Tricep Extension
- Default Machine

## 🔧 Configuración

### Dependencias Principales

```json
{
  "remix-run/*": "Framework core",
  "firebase": "Backend service",
  "chart.js": "Graficos",
  "zustand": "Estado react",
  "react-modal": "Modales"
}
```

### Scripts Disponibles

- `npm run dev` - Modo desarrollo
- `npm run build` - Build de producción
- `npm start` - Servir producción
- `npm run typecheck` - TypeScript checking

## 📥 Datos de Entrenamiento

### Ejercimientos soportados (base)

- Sentadilla / Squat
- Press de Banca / Bench Press
- Curl de Bíceps / Bicep Curl
- Press de hombros / Shoulder Press
- Extension de Tríceps / Tricep Extension
- Abdominales

### Para agregar ejercicios:

1. Añadir imagen a `public/images/machines/`
2. Registrar nombre en configuración
3. Implementar en UI

## 🐛 Solución de Problemas

### App no carga
- Verificar `npm install`
- Limpiar cache: `rm -rf node_modules && npm install`

### Datos no se guardan
- Verificar Firebase emulador/product
- Revisar reglas de Firestore

### Offline no funciona
- Abrir dev tools > Application > Service Workers
- Ver estado de caché

## 📝 Notas de Desarrollo

- Usar TypeScript para mejores tipos
- Componentes funcionales con hooks de React
- Hooks personalizados para Firebase
- Lazy loading para optimización

---

**Última actualización:** Marzo 2026
