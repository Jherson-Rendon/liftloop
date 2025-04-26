import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useLocation
} from "@remix-run/react";
import type { LinksFunction, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useEffect, useState } from "react";

import "./tailwind.css";
import { getCurrentUser, getMachines } from "~/lib/storage";
import { Toast } from "~/components/ui/Toast";
import { useNetworkStatus } from "~/hooks/useNetworkStatus";
import { useUserStore } from "~/hooks/useUserStore";

export const links: LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,100..900;1,100..900&display=swap",
  },
  { rel: "manifest", href: "/manifest.json" },
  { rel: "icon", href: "/favicon.ico" },
  { rel: "apple-touch-icon", href: "/icons/icon-192x192.png" },
];

export async function loader({ request }: LoaderFunctionArgs) {
  const [currentUser, machines] = await Promise.all([
    getCurrentUser(),
    getMachines()
  ]);

  return json({ currentUser, machines });
}

export default function App() {
  const { currentUser, machines } = useLoaderData<typeof loader>();
  const { isOnline } = useNetworkStatus();
  const location = useLocation();
  const [isMounted, setIsMounted] = useState(false);
  const setCurrentUserDirect = useUserStore((state) => state.setCurrentUserDirect);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js').catch(error => {
        console.error('Service Worker registration failed:', error);
      });
    }
  }, [isMounted]);

  useEffect(() => {
    if (isMounted) {
      document.title = `Gym Progress - ${location.pathname.slice(1) || 'Home'}`;
    }
  }, [location, isMounted]);

  useEffect(() => {
    setCurrentUserDirect(currentUser);
  }, [currentUser, setCurrentUserDirect]);

  return (
    <html lang="en" className="h-full">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#111827" />
        <Meta />
        <Links />
      </head>
      <body className="h-full bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">
        <Outlet context={{ currentUser, machines }} />
        {isMounted && !isOnline && <Toast message="Modo sin conexión" type="warning" />}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
