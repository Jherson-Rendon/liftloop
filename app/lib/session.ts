// Este archivo debe ser renombrado a session.server.ts y solo usarse en loaders/actions del servidor
import { createCookieSessionStorage } from "@remix-run/node";

// Verificación segura del entorno que funciona tanto en cliente como servidor
const isProduction = typeof window !== "undefined" 
  ? window.location.hostname !== "localhost" && !window.location.hostname.includes("127.0.0.1")
  : process.env.NODE_ENV !== "development";

export const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "__session",
    sameSite: "lax",
    path: "/",
    httpOnly: true,
    secure: isProduction, // Activado en compilación/despliegue (Vercel)
    maxAge: 60 * 60 * 24 * 365, // 1 año
  },
});

export async function getSession(request: Request) {
  return sessionStorage.getSession(request.headers.get("Cookie"));
}

export async function commitSession(session: any) {
  return sessionStorage.commitSession(session);
}

export async function destroySession(session: any) {
  return sessionStorage.destroySession(session);
} 