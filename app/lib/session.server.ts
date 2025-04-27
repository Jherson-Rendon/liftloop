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
  const cookie = request.headers.get("Cookie");
  console.log('[session.server] getSession cookie header:', cookie);
  const session = await sessionStorage.getSession(cookie);
  console.log('[session.server] getSession session:', session);
  return session;
}

export async function commitSession(session: any) {
  return sessionStorage.commitSession(session);
}

export async function destroySession(session: any) {
  const destroyed = await sessionStorage.destroySession(session);
  console.log('[session.server] destroySession result:', destroyed);
  return destroyed;
} 