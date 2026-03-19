# 💡 Consejos de Desarrollo

## 🎯 Primeros Pasos

### 1. Configurar Firebase

```bash
# Crea archivo de configuración
firebase login
firebase init

# Select:
# Firestore
# Functions (si necesitas)
# Hosting
```

### 2. Crear Estructura

```bash
mkdir src
mkdir src/components
mkdir src/hooks
mkdir src/lib
mkdir src/types
```

### 3. Hooks Custom de Firebase

```typescript
// src/hooks/useAuth.ts
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../lib/firebase';

export const useAuth = () => useAuthState(auth);
```

## 🎨 Componentes Base

### Botón

```tsx
// src/components/ui/Button.tsx
export const Button = ({ children, onClick, variant = 'primary' }) => {
  return <button className={...}>{children}</button>;
};
```

### Formulario de Entrenamiento

```tsx
// src/components/forms/WorkoutForm.tsx
export const WorkoutForm = () => {
  // Ejercicio selector
  // Agregar series
  // Guardar
};
```

## 📊 Datos

### Estructura de Workout

```typescript
interface Workout {
  id: string;
  userId: string;
  date: Date;
  timestamp: number;
  exercises: Exercise[];
}

interface Exercise {
  name: string;
  machineImage?: string;
  sets: Set[];
}

interface Set {
  repetitions: number;
  weight: number;
  notes?: string;
}
```

### Firestore Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow create: if request.auth != null && request.auth.uid == userId;
      allow update, delete: if request.auth != null && request.auth.uid == userId;
    }
    
    match /workouts/{workoutId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && resource.data.userId == request.auth.uid;
      allow update, delete: if request.auth != null && resource.data.userId == request.auth.uid;
    }
  }
}
```

## 📈 Gráficos con Chart.js

### Configuración Básica

```javascript
// src/components/Charts/ProgressChart.tsx
import { Chart as ChartJS, ... } from 'chart.js';

export const ProgressChart = ({ data }) => {
  const chartRef = useRef(null);
  
  useEffect(() => {
    const ctx = chartRef.current.getContext('2d');
    
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          borderColor: '#4F46E5',
          tension: 0.4
        }]
      }
    });
  }, [data]);
  
  return <canvas ref={chartRef}></canvas>;
};
```

## 🎨 Tailwind Tips

### Utility Classes Clave

```css
/* En tailwind.config.ts */
module.exports = {
  theme: {
    extend: {
      colors: {
        gym: {
          primary: '#10B981',     // Verde entrenamiento
          secondary: '#3B82F6',   // Azul progreso
          danger: '#EF4444',      // Rojo advertencia
          dark: '#1F2937'         // Oscuro
        }
      }
    }
  }
};
```

### Responsive

```tsx
<div className="
  flex-col md:flex-row
  p-4 md:p-8
  gap-4 md:gap-8
">
  {/* Responsive por defecto */}
</div>
```

## 🚀 PWA Specific

### manifest.json

```json
{
  "name": "Gym Progress Tracker",
  "short_name": "GymProgress",
  "description": "Rastrea tu progreso en el gimnasio",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#10B981",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

### Service Worker

El proyecto ya tiene un service worker básico en `public/service-worker.js`.

## 🔧 Debugging

### Verificar Firebase

```javascript
// En el browser console
console.log('Auth:', firebase.auth());
console.log('Firestore:', firebase.firestore());
console.log('Storage:', firebase.storage());
```

### Offline Testing

```bash
# Activar modo offline en chrome
F12 > Network > Disable cache
```

## ⚡ Optimización

### Lazy Load Componentes

```tsx
import { lazy, Suspense } from 'react';

const WorkoutForm = lazy(() => import('./components/WorkoutForm'));

export default () => (
  <Suspense fallback={<LoadingSpinner />} >
    <WorkoutForm />
  </Suspense>
);
```

### Memoization

```tsx
import { useMemo, useCallback } from 'react';

// Evitar recalculos innecesarios
const filteredExercises = useMemo(() => {
  return exercises.filter(...);
}, [exercises]);

// Evitar recrear funciones
const fetchData = useCallback(() => {
  // ...
}, [dependencies]);
```

## 🎓 Recursos Recomendados

- **Remix Docs:** https://remix.run/docs
- **Firebase Docs:** https://firebase.google.com/docs
- **Chart.js Docs:** https://www.chartjs.org/docs
- **React:** https://react.dev
- **Tailwind:** https://tailwindcss.com

## 🐛 Debug Checklist

- [ ] Firebase console abierto
- [ ] Dev tools abiertas
- [ ] Console sin errores
- [ ] Network tab mostrando peticiones
- [ ] Application tab > Service Workers

## 🔒 Checklist de Seguridad

- [ ] Firebase Security Rules configuradas
- [ ] No hardcodear API keys
- [ ] Sanitizar inputs
- [ ] HTTPS en producción
- [ ] Content Security Policy

---

**Tip:** Guarda este archivo y actualízalo según avanza el proyecto.
