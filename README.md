# 🏋️ Gym Progress PWA

Una Progressive Web App para rastrear el progreso en el gimnasio, registrar entrenamientos y visualizar tus mejoras con gráficos interactivos.

## ✨ Características

- 📊 **Registro de entrenamientos** - Registra cada ejercicio, series, repeticiones y peso utilizado
- 📈 **Visualización de progreso** - Gráficos gráficos con Chart.js para ver tus avances
- 📱 **Funciona offline** - PWA completamente funcional sin conexión a internet
- 🔒 **Autenticación** - Seguridad con Firebase Authentication
- 💾 **Datos persistentes** - Tus registros se guardan en Firebase Firestore
- 🎨 **Diseño moderno** - Interfaz responsiva con Tailwind CSS

## 🛠️ Tecnologías

- **Remix** - Framework web moderno
- **React** - Biblioteca de UI
- **Firebase** - Backend as-a-service (Auth, Firestore, Storage)
- **Chart.js** - Graficos de visualización de datos
- **Tailwind CSS** - Estilizado utilitario
- **Zustand** - Gestión de estado
- **idb-keyval** - IndexedDB para almacenamiento offline

## 📦 Instalación

```bash
npm install
```

## 🚀 Desarrollo

```bash
npm run dev
```

## 🔨 Construcción para producción

```bash
npm run build
npm start
```

## 📱 Despliegue

El proyecto está configurado para ser una PWA. Después de construir:

```bash
npm run build
```

El directorio `build/client` contiene el app frontend.
El directorio `build/server` contiene el backend para Node.js.

---

## 📖 Documentación

Para más información sobre el proyecto, ve la carpeta `/docs`.
