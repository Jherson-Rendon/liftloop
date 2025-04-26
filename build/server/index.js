import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { PassThrough } from "node:stream";
import { createReadableStreamFromReadable, json, redirect } from "@remix-run/node";
import { RemixServer, useLoaderData, useLocation, Meta, Links, Outlet, ScrollRestoration, Scripts, Link, Form, useParams, useNavigate, useOutletContext } from "@remix-run/react";
import { isbot } from "isbot";
import { renderToPipeableStream } from "react-dom/server";
import React, { useState, useEffect } from "react";
import { entries, keys, del, set, get } from "idb-keyval";
import { getFirestore, collection, query, where, getDocs, setDoc, doc, deleteDoc } from "firebase/firestore";
import { initializeApp } from "firebase/app";
import { parse } from "cookie";
import { create } from "zustand";
import Modal from "react-modal";
const ABORT_DELAY = 5e3;
function handleRequest(request, responseStatusCode, responseHeaders, remixContext, loadContext) {
  return isbot(request.headers.get("user-agent") || "") ? handleBotRequest(
    request,
    responseStatusCode,
    responseHeaders,
    remixContext
  ) : handleBrowserRequest(
    request,
    responseStatusCode,
    responseHeaders,
    remixContext
  );
}
function handleBotRequest(request, responseStatusCode, responseHeaders, remixContext) {
  return new Promise((resolve, reject) => {
    let shellRendered = false;
    const { pipe, abort } = renderToPipeableStream(
      /* @__PURE__ */ jsx(
        RemixServer,
        {
          context: remixContext,
          url: request.url,
          abortDelay: ABORT_DELAY
        }
      ),
      {
        onAllReady() {
          shellRendered = true;
          const body = new PassThrough();
          const stream = createReadableStreamFromReadable(body);
          responseHeaders.set("Content-Type", "text/html");
          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode
            })
          );
          pipe(body);
        },
        onShellError(error) {
          reject(error);
        },
        onError(error) {
          responseStatusCode = 500;
          if (shellRendered) {
            console.error(error);
          }
        }
      }
    );
    setTimeout(abort, ABORT_DELAY);
  });
}
function handleBrowserRequest(request, responseStatusCode, responseHeaders, remixContext) {
  return new Promise((resolve, reject) => {
    let shellRendered = false;
    const { pipe, abort } = renderToPipeableStream(
      /* @__PURE__ */ jsx(
        RemixServer,
        {
          context: remixContext,
          url: request.url,
          abortDelay: ABORT_DELAY
        }
      ),
      {
        onShellReady() {
          shellRendered = true;
          const body = new PassThrough();
          const stream = createReadableStreamFromReadable(body);
          responseHeaders.set("Content-Type", "text/html");
          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode
            })
          );
          pipe(body);
        },
        onShellError(error) {
          reject(error);
        },
        onError(error) {
          responseStatusCode = 500;
          if (shellRendered) {
            console.error(error);
          }
        }
      }
    );
    setTimeout(abort, ABORT_DELAY);
  });
}
const entryServer = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: handleRequest
}, Symbol.toStringTag, { value: "Module" }));
const firebaseConfig = {
  apiKey: "AIzaSyCgVfKyWCjpCOjRnyZ9Cf-YNYlQWmyDXs4",
  authDomain: "liftloop-1280c.firebaseapp.com",
  projectId: "liftloop-1280c",
  storageBucket: "liftloop-1280c.firebasestorage.app",
  messagingSenderId: "655970575150",
  appId: "1:655970575150:web:8508eac8846185313b90bf"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const USER_PREFIX = "user_";
const SESSION_PREFIX = "session_";
const MACHINES_PREFIX = "machines_";
const isBrowser = typeof window !== "undefined";
const isIndexedDBAvailable = () => {
  if (!isBrowser) return false;
  try {
    return "indexedDB" in window;
  } catch {
    return false;
  }
};
let serverStorage = {};
const storage = {
  async get(key) {
    if (!isBrowser) {
      return serverStorage[key] || null;
    }
    if (isIndexedDBAvailable()) {
      const value2 = await get(key);
      return value2;
    }
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  },
  async set(key, value) {
    if (!isBrowser) {
      serverStorage[key] = value;
      return;
    }
    if (isIndexedDBAvailable()) {
      await set(key, value);
    } else {
      localStorage.setItem(key, JSON.stringify(value));
    }
  },
  async del(key) {
    if (!isBrowser) {
      delete serverStorage[key];
      return;
    }
    if (isIndexedDBAvailable()) {
      await del(key);
    } else {
      localStorage.removeItem(key);
    }
  },
  async keys() {
    if (!isBrowser) {
      return Object.keys(serverStorage);
    }
    if (isIndexedDBAvailable()) {
      const idbKeys = await keys();
      return idbKeys.map((key) => String(key));
    }
    return Object.keys(localStorage);
  },
  async entries() {
    if (!isBrowser) {
      return Object.entries(serverStorage);
    }
    if (isIndexedDBAvailable()) {
      return await entries();
    }
    return Object.entries(localStorage).map(([key, value]) => [key, JSON.parse(value)]);
  }
};
async function getUsers() {
  try {
    const allKeys = await storage.keys();
    const userKeys = allKeys.filter(
      (key) => typeof key === "string" && key.startsWith(USER_PREFIX)
    );
    const users = await Promise.all(
      userKeys.map(async (key) => await storage.get(key))
    );
    return users;
  } catch (error) {
    console.error("Error getting users:", error);
    return [];
  }
}
async function saveUser(user) {
  try {
    console.log("[Storage] Saving user:", user);
    await storage.set(`${USER_PREFIX}${user.id}`, user);
    console.log("[Storage] User saved successfully");
  } catch (error) {
    console.error("[Storage] Error saving user:", error);
    throw error;
  }
}
async function getUser(userId) {
  try {
    const user = await storage.get(`${USER_PREFIX}${userId}`);
    return user || null;
  } catch (error) {
    console.error("Error getting user:", error);
    return null;
  }
}
async function deleteUser(userId) {
  try {
    await storage.del(`${USER_PREFIX}${userId}`);
  } catch (error) {
    console.error("Error deleting user:", error);
    throw error;
  }
}
async function getMachines(userId) {
  try {
    const machines = await storage.get(`${MACHINES_PREFIX}${userId}`);
    return machines || [];
  } catch (error) {
    console.error("Error getting machines:", error);
    return [];
  }
}
async function saveMachines(userId, machines) {
  try {
    await storage.set(`${MACHINES_PREFIX}${userId}`, machines);
  } catch (error) {
    console.error("Error saving machines:", error);
    throw error;
  }
}
async function getMachine(userId, id) {
  try {
    const machines = await getMachines(userId);
    return machines.find((machine) => machine.id === id) || null;
  } catch (error) {
    console.error("Error getting machine:", error);
    return null;
  }
}
async function getSessionsByUser(userId) {
  try {
    const allEntries = await storage.entries();
    const sessionEntries = allEntries.filter(
      ([key]) => typeof key === "string" && key.startsWith(SESSION_PREFIX) && key.includes(userId)
    );
    return sessionEntries.map(([_, value]) => value);
  } catch (error) {
    console.error("Error getting sessions:", error);
    return [];
  }
}
async function saveSession(session) {
  try {
    await storage.set(`${SESSION_PREFIX}${session.userId}_${session.id}`, session);
  } catch (error) {
    console.error("Error saving session:", error);
    throw error;
  }
}
async function getSessionsByMachine(userId, machineId) {
  try {
    const sessions = await getSessionsByUser(userId);
    return sessions.filter((session) => session.machineId === machineId);
  } catch (error) {
    console.error("Error getting sessions by machine:", error);
    return [];
  }
}
async function getWeightLiftedByWeek(userId) {
  if (!userId) return [];
  try {
    const sessions = await getSessionsByUser(userId);
    const weeklyData = {};
    sessions.forEach((session) => {
      const date = new Date(session.date);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().split("T")[0];
      const totalWeight = session.weight * session.reps;
      weeklyData[weekKey] = (weeklyData[weekKey] || 0) + totalWeight;
    });
    return Object.entries(weeklyData).map(([week, total]) => ({ week, total })).sort((a, b) => a.week.localeCompare(b.week));
  } catch (error) {
    console.error("Error calculating weight lifted by week:", error);
    return [];
  }
}
async function migrateToBackend() {
  try {
    const users = await getUsers();
    const allSessions = [];
    const allMachines = {};
    for (const user of users) {
      const userSessions = await getSessionsByUser(user.id);
      allSessions.push(...userSessions);
      allMachines[user.id] = await getMachines(user.id);
    }
    console.log("Ready to migrate:", { users, sessions: allSessions, machines: allMachines });
    return { success: true, message: "Data prepared for migration" };
  } catch (error) {
    console.error("Error preparing migration:", error);
    return { success: false, message: "Error preparing data for migration" };
  }
}
async function createUser(data) {
  const id = crypto.randomUUID();
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const users = await getUsersFromFirestore();
  if (users.some((u) => u.code === data.code)) {
    throw new Error("El código ya está en uso.");
  }
  const user = {
    id,
    name: data.name,
    avatar: "",
    color: "#" + Math.floor(Math.random() * 16777215).toString(16),
    weight: [data.weight],
    weightDates: [now],
    createdAt: now,
    age: data.age,
    height: data.height,
    code: data.code
  };
  await saveUser(user);
  return user;
}
async function getUsersFromFirestore() {
  const usersCol = collection(db, "users");
  const userSnapshot = await getDocs(usersCol);
  return userSnapshot.docs.map((doc2) => ({ id: doc2.id, ...doc2.data() }));
}
async function getMachinesFromFirestore(userId) {
  const machinesCol = collection(db, "machines");
  const q = query(machinesCol, where("userId", "==", userId));
  const machinesSnapshot = await getDocs(q);
  return machinesSnapshot.docs.map((doc2) => ({ id: doc2.id, ...doc2.data() }));
}
async function getSessionsFromFirestore(userId) {
  const sessionsCol = collection(db, "session");
  const q = query(sessionsCol, where("userId", "==", userId));
  const sessionsSnapshot = await getDocs(q);
  return sessionsSnapshot.docs.map((doc2) => ({ id: doc2.id, ...doc2.data() }));
}
async function getCurrentUserFromCookie(request) {
  const cookieHeader = request.headers.get("Cookie");
  let currentUserId = null;
  if (cookieHeader) {
    const cookies = parse(cookieHeader);
    currentUserId = cookies.currentUserId;
  }
  if (currentUserId) {
    const users = await getUsersFromFirestore();
    return users.find((u) => u.id === currentUserId) || null;
  }
  return null;
}
function setCurrentUserCookie(userId) {
  if (typeof document !== "undefined") {
    document.cookie = `currentUserId=${userId}; path=/;`;
  }
}
function getCurrentUserIdFromCookie() {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|; )currentUserId=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}
const storage$1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  createUser,
  deleteUser,
  getCurrentUserFromCookie,
  getCurrentUserIdFromCookie,
  getMachine,
  getMachines,
  getMachinesFromFirestore,
  getSessionsByMachine,
  getSessionsByUser,
  getSessionsFromFirestore,
  getUser,
  getUsers,
  getUsersFromFirestore,
  getWeightLiftedByWeek,
  migrateToBackend,
  saveMachines,
  saveSession,
  saveUser,
  setCurrentUserCookie
}, Symbol.toStringTag, { value: "Module" }));
function Toast({ message, type = "info" }) {
  const bgColor = {
    success: "bg-green-500",
    error: "bg-red-500",
    warning: "bg-yellow-500",
    info: "bg-blue-500"
  }[type];
  return /* @__PURE__ */ jsx("div", { className: "fixed bottom-4 right-4 z-50", children: /* @__PURE__ */ jsx("div", { className: `${bgColor} text-white px-6 py-3 rounded-lg shadow-lg`, children: message }) });
}
function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  useEffect(() => {
    function handleOnline() {
      setIsOnline(true);
    }
    function handleOffline() {
      setIsOnline(false);
    }
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);
  return { isOnline };
}
const useUserStore = create((set2, get2) => ({
  currentUser: null,
  isLoading: false,
  error: null,
  setCurrentUser: async (userId) => {
    try {
      set2({ isLoading: true, error: null });
      const user = await getUser(userId);
      set2({ currentUser: user, isLoading: false });
    } catch (error) {
      set2({
        error: error instanceof Error ? error.message : "Error setting current user",
        isLoading: false
      });
    }
  },
  updateUserWeight: async (weight) => {
    try {
      set2({ isLoading: true, error: null });
      const { currentUser } = get2();
      if (!currentUser) {
        throw new Error("No current user");
      }
      const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
      const weights = currentUser.weight || [];
      const weightDates = currentUser.weightDates || [];
      const todayIndex = weightDates.indexOf(today);
      if (todayIndex >= 0) {
        weights[todayIndex] = weight;
      } else {
        weights.push(weight);
        weightDates.push(today);
      }
      const updatedUser = {
        ...currentUser,
        weight: weights,
        weightDates
      };
      await saveUser(updatedUser);
      set2({ currentUser: updatedUser, isLoading: false });
    } catch (error) {
      set2({
        error: error instanceof Error ? error.message : "Error updating weight",
        isLoading: false
      });
    }
  },
  setCurrentUserDirect: (user) => {
    set2({ currentUser: user });
  }
}));
const useTestDateStore = create((set2) => ({
  enabled: false,
  testDate: null,
  setEnabled: (enabled) => set2({ enabled }),
  setTestDate: (date) => set2({ testDate: date })
}));
function TestDatePanel() {
  const { enabled, testDate, setEnabled, setTestDate } = useTestDateStore();
  const [open, setOpen] = React.useState(false);
  if (process.env.NODE_ENV === "production") return null;
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(
      "button",
      {
        onClick: () => setOpen((v) => !v),
        className: "fixed top-6 right-6 z-50 bg-blue-600 text-white rounded-full shadow-lg p-3 hover:bg-blue-700 focus:outline-none",
        title: "Panel de pruebas de fecha",
        children: "🕒"
      }
    ),
    open && /* @__PURE__ */ jsxs("div", { className: "fixed top-20 right-6 z-50 bg-white dark:bg-zinc-800 rounded-lg shadow-xl p-6 w-80 border border-blue-500", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-4", children: [
        /* @__PURE__ */ jsx("span", { className: "font-semibold text-blue-600 dark:text-blue-400", children: "Modo pruebas de fecha" }),
        /* @__PURE__ */ jsx("button", { onClick: () => setOpen(false), className: "text-gray-400 hover:text-gray-700 dark:hover:text-gray-200", children: "✕" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-4", children: [
        /* @__PURE__ */ jsx("label", { className: "font-medium", children: "Activar:" }),
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "checkbox",
            checked: enabled,
            onChange: (e) => setEnabled(e.target.checked),
            className: "form-checkbox h-5 w-5 text-blue-600"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mb-2", children: [
        /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1", children: "Fecha de prueba" }),
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "date",
            value: testDate ? testDate.slice(0, 10) : "",
            onChange: (e) => setTestDate(e.target.value ? e.target.value : null),
            className: "w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-700 dark:text-white",
            disabled: !enabled
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "text-xs text-gray-500 dark:text-gray-400 mt-2", children: [
        "Si está activado, todos los formularios usarán esta fecha.",
        /* @__PURE__ */ jsx("br", {}),
        "Si está vacío, se usará la fecha actual."
      ] })
    ] })
  ] });
}
const links = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous"
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,100..900;1,100..900&display=swap"
  },
  { rel: "manifest", href: "/manifest.json" },
  { rel: "icon", href: "/favicon.ico" },
  { rel: "apple-touch-icon", href: "/icons/icon-192x192.png" }
];
async function loader$5({ request }) {
  const cookieHeader = request.headers.get("Cookie");
  console.log("[root loader] Cookie header:", cookieHeader);
  let currentUser = await getCurrentUserFromCookie(request);
  console.log("[root loader] currentUser:", currentUser);
  let machines = [];
  return json({ currentUser, machines });
}
function App() {
  const { currentUser, machines } = useLoaderData();
  const { isOnline } = useNetworkStatus();
  const location = useLocation();
  const [isMounted, setIsMounted] = useState(false);
  const setCurrentUserDirect = useUserStore((state) => state.setCurrentUserDirect);
  useEffect(() => {
    setIsMounted(true);
  }, []);
  useEffect(() => {
    if (isMounted && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/service-worker.js").catch((error) => {
        console.error("Service Worker registration failed:", error);
      });
    }
  }, [isMounted]);
  useEffect(() => {
    if (isMounted) {
      document.title = `Gym Progress - ${location.pathname.slice(1) || "Home"}`;
    }
  }, [location, isMounted]);
  useEffect(() => {
    setCurrentUserDirect(currentUser);
  }, [currentUser, setCurrentUserDirect]);
  return /* @__PURE__ */ jsxs("html", { lang: "en", className: "h-full", children: [
    /* @__PURE__ */ jsxs("head", { children: [
      /* @__PURE__ */ jsx("meta", { charSet: "utf-8" }),
      /* @__PURE__ */ jsx("meta", { name: "viewport", content: "width=device-width, initial-scale=1" }),
      /* @__PURE__ */ jsx("meta", { name: "theme-color", content: "#111827" }),
      /* @__PURE__ */ jsx(Meta, {}),
      /* @__PURE__ */ jsx(Links, {})
    ] }),
    /* @__PURE__ */ jsxs("body", { className: "h-full bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100", children: [
      /* @__PURE__ */ jsx(Outlet, { context: { currentUser, machines } }),
      /* @__PURE__ */ jsx(TestDatePanel, {}),
      isMounted && !isOnline && /* @__PURE__ */ jsx(Toast, { message: "Modo sin conexión", type: "warning" }),
      /* @__PURE__ */ jsx(ScrollRestoration, {}),
      /* @__PURE__ */ jsx(Scripts, {})
    ] })
  ] });
}
const route0 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: App,
  links,
  loader: loader$5
}, Symbol.toStringTag, { value: "Module" }));
async function loader$4({ request }) {
  console.log("[Profile Select Loader] Iniciando loader");
  const users = await getUsersFromFirestore();
  console.log("[Profile Select Loader] users:", users);
  if (!users || users.length === 0) {
    return redirect("/profile/new");
  }
  return json({ users });
}
async function action$3({ request }) {
  console.log("[Profile Select Action] Iniciando action");
  const formData = await request.formData();
  const userId = formData.get("userId");
  console.log("[Profile Select Action] userId:", userId);
  if (!userId) {
    return json({ error: "Se requiere seleccionar un usuario" });
  }
  return redirect("/", {
    headers: {
      "Set-Cookie": `currentUserId=${userId}; Path=/; SameSite=Lax`
    }
  });
}
function SelectProfile() {
  const { users } = useLoaderData();
  const [selectedUser, setSelectedUser] = useState(null);
  const [codeInput, setCodeInput] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const handleSelect = (user) => {
    setSelectedUser(user);
    setCodeInput("");
    setError("");
  };
  const handleCodeSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    if (selectedUser && codeInput === selectedUser.code) {
      const form = document.createElement("form");
      form.method = "post";
      form.action = "";
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = "userId";
      input.value = selectedUser.id;
      form.appendChild(input);
      document.body.appendChild(form);
      form.submit();
    } else {
      setError("Código incorrecto");
    }
    setLoading(false);
  };
  const usersList = users;
  const filteredUsers = usersList.filter(
    (user) => user.name.toLowerCase().includes(search.toLowerCase())
  );
  return /* @__PURE__ */ jsx("div", { className: "flex h-screen items-center justify-center bg-gradient-to-b from-zinc-900 to-zinc-800", children: /* @__PURE__ */ jsxs("div", { className: "px-8 py-12 rounded-lg bg-zinc-800/50 backdrop-blur-sm max-w-md w-full mx-4", children: [
    /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold text-white mb-4 text-center", children: "Seleccionar Perfil" }),
    /* @__PURE__ */ jsx("p", { className: "text-gray-300 mb-8 text-center", children: "Elige tu perfil para continuar" }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsx(
        "input",
        {
          type: "text",
          placeholder: "Buscar usuario...",
          value: search,
          onChange: (e) => setSearch(e.target.value),
          className: "w-full mb-4 px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-700 dark:text-white"
        }
      ),
      filteredUsers.length === 0 ? /* @__PURE__ */ jsx("div", { className: "text-gray-400 text-center", children: "No se encontraron usuarios" }) : filteredUsers.map((user) => /* @__PURE__ */ jsxs(
        "button",
        {
          type: "button",
          className: "w-full flex items-center p-4 bg-zinc-700 rounded-lg hover:bg-zinc-600 transition-all duration-200",
          onClick: () => handleSelect(user),
          children: [
            /* @__PURE__ */ jsx(
              "div",
              {
                className: "w-12 h-12 rounded-full flex items-center justify-center text-lg font-semibold",
                style: { backgroundColor: user.color },
                children: user.name.charAt(0)
              }
            ),
            /* @__PURE__ */ jsxs("div", { className: "ml-4 flex-1 text-left", children: [
              /* @__PURE__ */ jsx("h3", { className: "text-white font-semibold", children: user.name }),
              /* @__PURE__ */ jsxs("p", { className: "text-gray-400 text-sm", children: [
                "Miembro desde ",
                new Date(user.createdAt).toLocaleDateString()
              ] })
            ] })
          ]
        },
        user.id
      ))
    ] }),
    /* @__PURE__ */ jsx("div", { className: "mt-8 text-center", children: /* @__PURE__ */ jsx(
      Link,
      {
        to: "/profile/new",
        className: "text-blue-400 hover:text-blue-300 transition-colors",
        children: "Crear nuevo perfil"
      }
    ) }),
    selectedUser && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50", children: /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-zinc-800 rounded-lg shadow-xl p-8 w-full max-w-xs relative", children: [
      /* @__PURE__ */ jsx(
        "button",
        {
          className: "absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200",
          onClick: () => setSelectedUser(null),
          "aria-label": "Cerrar",
          children: "×"
        }
      ),
      /* @__PURE__ */ jsxs("h2", { className: "text-lg font-semibold mb-4 text-center text-gray-800 dark:text-gray-100", children: [
        "Ingresa el código de acceso para ",
        /* @__PURE__ */ jsx("span", { className: "font-bold", children: selectedUser.name })
      ] }),
      /* @__PURE__ */ jsxs("form", { onSubmit: handleCodeSubmit, children: [
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "password",
            inputMode: "numeric",
            pattern: "[0-9]{4}",
            maxLength: 4,
            minLength: 4,
            autoFocus: true,
            className: "w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-700 dark:text-white mb-3 text-center text-lg tracking-widest",
            placeholder: "••••",
            value: codeInput,
            onChange: (e) => setCodeInput(e.target.value.replace(/[^0-9]/g, "")),
            required: true
          }
        ),
        error && /* @__PURE__ */ jsx("div", { className: "text-red-600 text-sm mb-2 text-center", children: error }),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "submit",
            className: "w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500",
            disabled: loading,
            children: loading ? "Verificando..." : "Ingresar"
          }
        )
      ] })
    ] }) })
  ] }) });
}
const route1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$3,
  default: SelectProfile,
  loader: loader$4
}, Symbol.toStringTag, { value: "Module" }));
async function loader$3({ request }) {
  const currentUser = await getCurrentUserFromCookie(request);
  if (!currentUser) {
    return redirect("/profile/new");
  }
  return redirect("/profile/edit");
}
function ProfileIndex() {
  return null;
}
const route2 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: ProfileIndex,
  loader: loader$3
}, Symbol.toStringTag, { value: "Module" }));
async function loader$2({ request }) {
  console.log("[Profile Edit Loader] Iniciando loader");
  const currentUser = await getCurrentUserFromCookie(request);
  console.log("[Profile Edit Loader] currentUser:", currentUser);
  if (!currentUser) {
    return redirect("/");
  }
  return { currentUser };
}
async function action$2({ request }) {
  console.log("[Profile Edit Action] Iniciando action");
  const currentUser = await getCurrentUserFromCookie(request);
  console.log("[Profile Edit Action] currentUser:", currentUser);
  if (!currentUser) {
    return redirect("/");
  }
  const formData = await request.formData();
  const name = formData.get("name");
  const weight = formData.get("weight");
  const color = formData.get("color");
  if (!name || !weight || !color) {
    console.log("[Profile Edit Action] Faltan campos:", { name, weight, color });
    return { error: "Todos los campos son requeridos" };
  }
  const updatedUser = {
    ...currentUser,
    name,
    color,
    weight: [...currentUser.weight || [], parseFloat(weight)],
    weightDates: [...currentUser.weightDates || [], (/* @__PURE__ */ new Date()).toISOString()]
  };
  try {
    await setDoc(doc(collection(db, "users"), updatedUser.id), updatedUser);
    console.log("[Profile Edit Action] Usuario actualizado en Firestore:", updatedUser);
    return redirect("/");
  } catch (error) {
    console.error("[Profile Edit Action] Error al guardar usuario:", error);
    return { error: "Error al guardar el usuario. Por favor, intenta de nuevo." };
  }
}
function EditProfile() {
  var _a;
  const { currentUser } = useLoaderData();
  const [showCode, setShowCode] = useState(false);
  const colors = [
    "#2563eb",
    // blue-600
    "#dc2626",
    // red-600
    "#16a34a",
    // green-600
    "#9333ea",
    // purple-600
    "#ea580c",
    // orange-600
    "#0891b2"
    // cyan-600
  ];
  return /* @__PURE__ */ jsx("div", { className: "min-h-screen bg-gray-50 dark:bg-zinc-900 py-12 px-4 sm:px-6 lg:px-8", children: /* @__PURE__ */ jsxs("div", { className: "max-w-md mx-auto", children: [
    /* @__PURE__ */ jsxs("div", { className: "text-center mb-8", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-3xl font-bold text-gray-900 dark:text-gray-100", children: "Editar Perfil" }),
      /* @__PURE__ */ jsx("p", { className: "mt-2 text-gray-600 dark:text-gray-400", children: "Actualiza tus datos de perfil" })
    ] }),
    /* @__PURE__ */ jsx(Form, { method: "post", className: "bg-white dark:bg-zinc-800 rounded-lg shadow-lg p-8", children: /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx(
          "label",
          {
            htmlFor: "name",
            className: "block text-sm font-medium text-gray-700 dark:text-gray-300",
            children: "Nombre"
          }
        ),
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "text",
            name: "name",
            id: "name",
            defaultValue: currentUser.name,
            required: true,
            className: "mt-1 block w-full rounded-md border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx(
          "label",
          {
            htmlFor: "weight",
            className: "block text-sm font-medium text-gray-700 dark:text-gray-300",
            children: "Peso Actual (kg)"
          }
        ),
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "number",
            name: "weight",
            id: "weight",
            defaultValue: (_a = currentUser.weight) == null ? void 0 : _a[currentUser.weight.length - 1],
            required: true,
            min: "20",
            step: "0.1",
            className: "mt-1 block w-full rounded-md border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: "Color de Perfil" }),
        /* @__PURE__ */ jsx("div", { className: "grid grid-cols-6 gap-3", children: colors.map((color) => /* @__PURE__ */ jsxs("div", { className: "relative", children: [
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "radio",
              name: "color",
              value: color,
              defaultChecked: color === currentUser.color,
              className: "sr-only peer",
              required: true
            }
          ),
          /* @__PURE__ */ jsx(
            "label",
            {
              className: "flex aspect-square rounded-full peer-checked:ring-2 peer-checked:ring-offset-2 peer-checked:ring-blue-500 cursor-pointer",
              style: { backgroundColor: color },
              htmlFor: color
            }
          )
        ] }, color)) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mb-4", children: [
        /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1", children: "Código de acceso" }),
        /* @__PURE__ */ jsxs("div", { className: "relative", children: [
          /* @__PURE__ */ jsx(
            "input",
            {
              type: showCode ? "text" : "password",
              value: currentUser.code,
              readOnly: true,
              className: "w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-700 dark:text-white pr-10"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: () => setShowCode((v) => !v),
              className: "absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 dark:text-gray-300 focus:outline-none",
              tabIndex: -1,
              "aria-label": showCode ? "Ocultar código" : "Mostrar código",
              children: showCode ? /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", strokeWidth: 1.5, stroke: "currentColor", className: "w-5 h-5", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M3.98 8.223A10.477 10.477 0 001.934 12c1.676 4.019 5.822 7 10.066 7 2.042 0 3.97-.613 5.566-1.66M21.066 12c-.394-.947-.958-1.818-1.66-2.577M15 12a3 3 0 11-6 0 3 3 0 016 0z" }) }) : /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", strokeWidth: 1.5, stroke: "currentColor", className: "w-5 h-5", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M15 12a3 3 0 11-6 0 3 3 0 016 0zm2.25 2.25l3.5 3.5m-3.5-3.5A9.003 9.003 0 013 12c1.676-4.019 5.822-7 10.066-7 2.042 0 3.97.613 5.566 1.66" }) })
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-4", children: [
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "submit",
            className: "flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors",
            children: "Guardar Cambios"
          }
        ),
        /* @__PURE__ */ jsx(
          "a",
          {
            href: "/",
            className: "flex-1 bg-gray-200 dark:bg-zinc-700 text-center text-gray-900 dark:text-gray-100 py-2 px-4 rounded-lg hover:bg-gray-300 dark:hover:bg-zinc-600 transition-colors",
            children: "Cancelar"
          }
        )
      ] })
    ] }) })
  ] }) });
}
const route3 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$2,
  default: EditProfile,
  loader: loader$2
}, Symbol.toStringTag, { value: "Module" }));
function MachineDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useUserStore();
  const [machine, setMachine] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    weight: "",
    reps: "",
    difficulty: "easy"
  });
  const testDateStore = useTestDateStore();
  const [editSession, setEditSession] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [visibleCount, setVisibleCount] = useState(10);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  useEffect(() => {
    const fetchData = async () => {
      console.log("[MachineDetail] useEffect ejecutado. currentUser:", currentUser, "id:", id);
      if (!currentUser) return;
      if (!id) return;
      try {
        const machines = await getMachinesFromFirestore(currentUser.id);
        const machineData = machines.find((m) => m.id === id);
        console.log("[MachineDetail] machineData:", machineData);
        if (!machineData) {
          navigate("/");
          return;
        }
        setMachine(machineData);
        const allSessions = await getSessionsFromFirestore(currentUser.id);
        const sessionsData = allSessions.filter((s) => s.machineId == id || s.machineId == Number(id));
        console.log("[MachineDetail] sessionsData:", sessionsData);
        setSessions(sessionsData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      } catch (error) {
        console.error("Error fetching machine data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [currentUser, id, navigate]);
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser || !machine) return;
    let dateToUse = testDateStore.enabled && testDateStore.testDate ? testDateStore.testDate : (/* @__PURE__ */ new Date()).toISOString();
    if (testDateStore.enabled && testDateStore.testDate && /^\d{4}-\d{2}-\d{2}$/.test(testDateStore.testDate)) {
      dateToUse = `${testDateStore.testDate}T12:00:00`;
    }
    const newSession = {
      id: Date.now().toString(),
      userId: currentUser.id,
      machineId: machine.id,
      weight: parseFloat(formData.weight),
      reps: parseInt(formData.reps),
      date: dateToUse,
      difficulty: formData.difficulty
    };
    try {
      await setDoc(doc(collection(db, "session"), newSession.id), newSession);
      setSessions([newSession, ...sessions]);
      setFormData({ weight: "", reps: "", difficulty: "easy" });
      setShowRegisterModal(false);
    } catch (error) {
      console.error("Error saving session:", error);
    }
  };
  const handleDeleteSession = async (sessionId) => {
    if (!currentUser) return;
    if (window.confirm("¿Seguro que deseas eliminar este registro?")) {
      try {
        await deleteDoc(doc(collection(db, "session"), sessionId));
        setSessions(sessions.filter((s) => s.id !== sessionId));
      } catch (error) {
        console.error("Error deleting session:", error);
      }
    }
  };
  const handleEditSession = (session) => {
    setEditSession(session);
    setShowModal(true);
  };
  const handleModalSave = async (updated) => {
    if (!currentUser) return;
    try {
      await setDoc(doc(collection(db, "session"), updated.id), updated);
      setSessions(sessions.map((s) => s.id === updated.id ? updated : s));
      setShowModal(false);
      setEditSession(null);
    } catch (error) {
      console.error("Error updating session:", error);
    }
  };
  const handleModalClose = () => {
    setShowModal(false);
    setEditSession(null);
  };
  if (isLoading) {
    console.log("Loading... currentUser:", currentUser, "id:", id, "machine:", machine, "sessions:", sessions);
    return /* @__PURE__ */ jsx("div", { className: "flex justify-center items-center h-screen", children: "Cargando..." });
  }
  if (!machine) {
    console.log("Machine not found after loading.");
    return /* @__PURE__ */ jsx("div", { className: "flex justify-center items-center h-screen", children: "Máquina no encontrada" });
  }
  return /* @__PURE__ */ jsx("div", { className: "container mx-auto px-4 py-8", children: /* @__PURE__ */ jsxs("div", { className: "max-w-2xl mx-auto", children: [
    /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-zinc-800 rounded-lg shadow-lg overflow-hidden mb-8", children: [
      /* @__PURE__ */ jsx("div", { className: "h-48 flex items-center justify-center bg-gray-100 dark:bg-zinc-700", children: /* @__PURE__ */ jsx(
        "img",
        {
          src: `/images/machines/${machine.image}`,
          alt: machine.name,
          className: "h-full object-contain"
        }
      ) }),
      /* @__PURE__ */ jsxs("div", { className: "p-6", children: [
        /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2", children: machine.name }),
        /* @__PURE__ */ jsx("span", { className: "inline-block bg-gray-200 dark:bg-zinc-700 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 dark:text-gray-300", children: machine.category })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-zinc-800 rounded-lg shadow-lg p-6 mb-8", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4", children: "Historial de sesiones" }),
      /* @__PURE__ */ jsx("div", { className: "max-h-64 overflow-y-auto pr-2", children: sessions.length > 0 ? /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
        sessions.slice(0, visibleCount).map((session, idx) => {
          let icon = null;
          let iconColor = "";
          if (idx < sessions.length - 1) {
            const prev = sessions[idx + 1];
            if (session.weight > prev.weight) {
              icon = "▲";
              iconColor = "text-green-600";
            } else if (session.weight < prev.weight) {
              icon = "▼";
              iconColor = "text-red-600";
            } else {
              icon = "→";
              iconColor = "text-gray-400";
            }
          } else {
            icon = "★";
            iconColor = "text-blue-400";
          }
          return /* @__PURE__ */ jsx("div", { className: "relative border-b border-gray-200 dark:border-zinc-700 pb-4", children: /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsxs("p", { className: "text-gray-800 dark:text-gray-200 flex items-center gap-2", children: [
                /* @__PURE__ */ jsx("span", { className: iconColor, children: icon }),
                session.weight,
                " kg × ",
                session.reps,
                " repeticiones"
              ] }),
              /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400", children: new Date(session.date).toLocaleDateString() })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-end gap-1", children: [
              /* @__PURE__ */ jsx("span", { className: `inline-block rounded-full px-2 py-1 text-xs font-semibold ${session.difficulty === "easy" ? "bg-green-100 text-green-800" : session.difficulty === "medium" ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"}`, children: session.difficulty === "easy" ? "Fácil" : session.difficulty === "medium" ? "Medio" : "Difícil" }),
              /* @__PURE__ */ jsxs("div", { className: "flex gap-1 mt-1", children: [
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    type: "button",
                    className: "p-1 bg-blue-500 hover:bg-blue-600 text-white rounded-full text-xs shadow focus:outline-none",
                    title: "Editar registro",
                    onClick: () => handleEditSession(session),
                    children: "✎"
                  }
                ),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    type: "button",
                    className: "p-1 bg-red-500 hover:bg-red-600 text-white rounded-full text-xs shadow focus:outline-none",
                    title: "Eliminar registro",
                    onClick: () => handleDeleteSession(session.id),
                    children: "🗑"
                  }
                )
              ] })
            ] })
          ] }) }, session.id);
        }),
        visibleCount < sessions.length && /* @__PURE__ */ jsx("div", { className: "flex justify-center mt-2", children: /* @__PURE__ */ jsx(
          "button",
          {
            className: "px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none",
            onClick: () => setVisibleCount(visibleCount + 10),
            children: "Cargar más"
          }
        ) })
      ] }) : /* @__PURE__ */ jsx("p", { className: "text-gray-500 dark:text-gray-400", children: "No hay sesiones registradas" }) })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "flex justify-center mb-8", children: /* @__PURE__ */ jsxs(
      "button",
      {
        className: "flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none shadow",
        onClick: () => setShowRegisterModal(true),
        children: [
          /* @__PURE__ */ jsx("span", { className: "text-lg", children: "+" }),
          " Registrar nueva sesión"
        ]
      }
    ) }),
    /* @__PURE__ */ jsx(
      Modal,
      {
        isOpen: showRegisterModal,
        onRequestClose: () => setShowRegisterModal(false),
        className: "fixed inset-0 flex items-center justify-center z-50",
        overlayClassName: "fixed inset-0 bg-black bg-opacity-50 z-40",
        ariaHideApp: false,
        children: /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-zinc-800 rounded-lg shadow-xl p-8 w-full max-w-md", children: [
          /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold mb-4", children: "Registrar nueva sesión" }),
          /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { htmlFor: "weight", className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1", children: "Peso (kg)" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "number",
                  id: "weight",
                  value: formData.weight,
                  onChange: (e) => setFormData({ ...formData, weight: e.target.value }),
                  className: "w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-700 dark:text-white",
                  required: true,
                  min: "0",
                  step: "0.1"
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { htmlFor: "reps", className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1", children: "Repeticiones" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "number",
                  id: "reps",
                  value: formData.reps,
                  onChange: (e) => setFormData({ ...formData, reps: e.target.value }),
                  className: "w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-700 dark:text-white",
                  required: true,
                  min: "1"
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { htmlFor: "difficulty", className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1", children: "Dificultad percibida" }),
              /* @__PURE__ */ jsxs(
                "select",
                {
                  id: "difficulty",
                  value: formData.difficulty,
                  onChange: (e) => setFormData({ ...formData, difficulty: e.target.value }),
                  className: "w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-700 dark:text-white",
                  required: true,
                  children: [
                    /* @__PURE__ */ jsx("option", { value: "easy", children: "Fácil" }),
                    /* @__PURE__ */ jsx("option", { value: "medium", children: "Medio" }),
                    /* @__PURE__ */ jsx("option", { value: "hard", children: "Difícil" })
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex justify-end gap-2 mt-4", children: [
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  onClick: () => setShowRegisterModal(false),
                  className: "px-4 py-2 rounded bg-gray-300 dark:bg-zinc-600 text-gray-800 dark:text-gray-100 hover:bg-gray-400 dark:hover:bg-zinc-500",
                  children: "Cancelar"
                }
              ),
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "submit",
                  className: "px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700",
                  children: "Guardar sesión"
                }
              )
            ] })
          ] })
        ] })
      }
    ),
    /* @__PURE__ */ jsx(
      Modal,
      {
        isOpen: showModal,
        onRequestClose: handleModalClose,
        className: "fixed inset-0 flex items-center justify-center z-50",
        overlayClassName: "fixed inset-0 bg-black bg-opacity-50 z-40",
        ariaHideApp: false,
        children: editSession && /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-zinc-800 rounded-lg shadow-xl p-8 w-full max-w-md", children: [
          /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold mb-4", children: "Editar sesión" }),
          /* @__PURE__ */ jsxs(
            "form",
            {
              onSubmit: (e) => {
                e.preventDefault();
                handleModalSave(editSession);
              },
              className: "space-y-4",
              children: [
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium mb-1", children: "Peso (kg)" }),
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: "number",
                      value: editSession.weight,
                      onChange: (e) => setEditSession({ ...editSession, weight: parseFloat(e.target.value) }),
                      className: "w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-700 dark:text-white",
                      required: true,
                      min: "0",
                      step: "0.1"
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium mb-1", children: "Repeticiones" }),
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: "number",
                      value: editSession.reps,
                      onChange: (e) => setEditSession({ ...editSession, reps: parseInt(e.target.value) }),
                      className: "w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-700 dark:text-white",
                      required: true,
                      min: "1"
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium mb-1", children: "Dificultad percibida" }),
                  /* @__PURE__ */ jsxs(
                    "select",
                    {
                      value: editSession.difficulty,
                      onChange: (e) => setEditSession({ ...editSession, difficulty: e.target.value }),
                      className: "w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-700 dark:text-white",
                      children: [
                        /* @__PURE__ */ jsx("option", { value: "easy", children: "Fácil" }),
                        /* @__PURE__ */ jsx("option", { value: "medium", children: "Medio" }),
                        /* @__PURE__ */ jsx("option", { value: "hard", children: "Difícil" })
                      ]
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex justify-end gap-2 mt-4", children: [
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      type: "button",
                      onClick: handleModalClose,
                      className: "px-4 py-2 rounded bg-gray-300 dark:bg-zinc-600 text-gray-800 dark:text-gray-100 hover:bg-gray-400 dark:hover:bg-zinc-500",
                      children: "Cancelar"
                    }
                  ),
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      type: "submit",
                      className: "px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700",
                      children: "Guardar"
                    }
                  )
                ] })
              ]
            }
          )
        ] })
      }
    )
  ] }) });
}
const route4 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: MachineDetail
}, Symbol.toStringTag, { value: "Module" }));
const categories = [
  "Pecho",
  "Piernas",
  "Espalda",
  "Brazos",
  "Hombros",
  "Abdomen",
  "Otro"
];
const availableImages = [
  "Bench_press.png",
  "leg-press.png",
  "lat-pulldown.png",
  "bicep-curl.png",
  "shoulder-press.png",
  "tricep-extension.png"
];
function AddMachineForm({ userId, onMachineAdded }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState(categories[0]);
  const [image, setImage] = useState("");
  const [selectedImage, setSelectedImage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (!name.trim()) {
        setError("El nombre es obligatorio");
        setLoading(false);
        return;
      }
      const newId = Date.now().toString();
      const imageToUse = image.trim() || selectedImage || "default-machine.png";
      const newMachine = {
        id: newId,
        name: name.trim(),
        category,
        image: imageToUse,
        userId
      };
      await setDoc(doc(collection(db, "machines"), newId), newMachine);
      onMachineAdded(newMachine);
      setName("");
      setCategory(categories[0]);
      setImage("");
      setSelectedImage("");
    } catch (err) {
      setError("Error al guardar la máquina");
    } finally {
      setLoading(false);
    }
  };
  return /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "bg-white dark:bg-zinc-800 rounded-lg shadow-lg p-6 mb-8", children: [
    /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4", children: "Agregar Nueva Máquina" }),
    error && /* @__PURE__ */ jsx("div", { className: "mb-4 text-red-600", children: error }),
    /* @__PURE__ */ jsxs("div", { className: "mb-4", children: [
      /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1", children: "Nombre" }),
      /* @__PURE__ */ jsx(
        "input",
        {
          type: "text",
          value: name,
          onChange: (e) => setName(e.target.value),
          className: "w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-700 dark:text-white",
          required: true
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mb-4", children: [
      /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1", children: "Categoría" }),
      /* @__PURE__ */ jsx(
        "select",
        {
          value: category,
          onChange: (e) => setCategory(e.target.value),
          className: "w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-700 dark:text-white",
          children: categories.map((cat) => /* @__PURE__ */ jsx("option", { value: cat, children: cat }, cat))
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mb-4", children: [
      /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1", children: "Imagen (nombre de archivo, opcional)" }),
      /* @__PURE__ */ jsx(
        "input",
        {
          type: "text",
          value: image,
          onChange: (e) => setImage(e.target.value),
          className: "w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-700 dark:text-white mb-2",
          placeholder: "default-machine.png"
        }
      ),
      /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-2 mt-2", children: availableImages.map((img) => /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          className: `border rounded p-1 ${selectedImage === img ? "ring-2 ring-blue-500" : ""}`,
          onClick: () => setSelectedImage(img),
          title: img,
          children: /* @__PURE__ */ jsx("img", { src: `/images/machines/${img}`, alt: img, className: "w-16 h-16 object-contain" })
        },
        img
      )) })
    ] }),
    /* @__PURE__ */ jsx(
      "button",
      {
        type: "submit",
        className: "w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
        disabled: loading,
        children: loading ? "Guardando..." : "Agregar Máquina"
      }
    )
  ] });
}
function NewMachine() {
  const { currentUser } = useUserStore();
  console.log("[NewMachine] currentUser:", currentUser);
  const navigate = useNavigate();
  if (!currentUser) {
    return /* @__PURE__ */ jsx("div", { className: "flex justify-center items-center h-screen", children: "Usuario no encontrado" });
  }
  const handleMachineAdded = (machine) => {
    navigate("/");
  };
  return /* @__PURE__ */ jsx("div", { className: "container mx-auto px-4 py-8 flex justify-center items-center min-h-screen", children: /* @__PURE__ */ jsx("div", { className: "max-w-lg w-full", children: /* @__PURE__ */ jsx(AddMachineForm, { userId: currentUser.id, onMachineAdded: handleMachineAdded }) }) });
}
const route5 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: NewMachine
}, Symbol.toStringTag, { value: "Module" }));
console.log("[Profile New] Module loaded");
async function action$1({ request }) {
  console.log("[Profile New Action] Iniciando action");
  const formData = await request.formData();
  const name = formData.get("name");
  const weight = formData.get("weight");
  const color = formData.get("color");
  const age = formData.get("age");
  const height = formData.get("height");
  const code = formData.get("code");
  console.log("[Profile New Action] Form data:", { name, weight, color, age, height, code });
  if (!name || !weight || !color || !age || !height || !code) {
    console.log("[Profile New Action] Faltan campos:", { name, weight, color, age, height, code });
    return { error: "Todos los campos son requeridos" };
  }
  if (!/^\d{4}$/.test(code)) {
    return { error: "El código debe ser exactamente 4 dígitos numéricos." };
  }
  const user = {
    id: crypto.randomUUID(),
    name,
    avatar: "",
    color,
    weight: [parseFloat(weight)],
    weightDates: [(/* @__PURE__ */ new Date()).toISOString()],
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    age: parseInt(age),
    height: parseFloat(height),
    code
  };
  console.log("[Profile New Action] Created user object:", user);
  try {
    const usersSnap = await Promise.resolve().then(() => storage$1).then((m) => m.getUsersFromFirestore());
    if (usersSnap.some((u) => u.code === code)) {
      return { error: "El código ya está en uso. Elige otro." };
    }
    console.log("[Profile New Action] Attempting to save user");
    await setDoc(doc(collection(db, "users"), user.id), user);
    console.log("[Profile New Action] Usuario guardado en Firestore:", user);
    return redirect("/profile/select");
  } catch (error) {
    console.error("[Profile New Action] Error al guardar usuario:", error);
    return { error: "Error al guardar el usuario. Por favor, intenta de nuevo." };
  }
}
function NewProfile() {
  console.log("[Profile New] Rendering component");
  const colors = [
    "#2563eb",
    // blue-600
    "#dc2626",
    // red-600
    "#16a34a",
    // green-600
    "#9333ea",
    // purple-600
    "#ea580c",
    // orange-600
    "#0891b2"
    // cyan-600
  ];
  console.log("[Profile New] Colors array:", colors);
  return /* @__PURE__ */ jsx("div", { className: "min-h-screen bg-gray-50 dark:bg-zinc-900 py-12 px-4 sm:px-6 lg:px-8", children: /* @__PURE__ */ jsxs("div", { className: "max-w-md mx-auto", children: [
    /* @__PURE__ */ jsxs("div", { className: "text-center mb-8", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-3xl font-bold text-gray-900 dark:text-gray-100", children: "Crear Perfil" }),
      /* @__PURE__ */ jsx("p", { className: "mt-2 text-gray-600 dark:text-gray-400", children: "Ingresa tus datos para comenzar a registrar tu progreso" })
    ] }),
    /* @__PURE__ */ jsx(Form, { method: "post", className: "bg-white dark:bg-zinc-800 rounded-lg shadow-lg p-8", children: /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx(
          "label",
          {
            htmlFor: "name",
            className: "block text-sm font-medium text-gray-700 dark:text-gray-300",
            children: "Nombre"
          }
        ),
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "text",
            name: "name",
            id: "name",
            required: true,
            className: "mt-1 block w-full rounded-md border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx(
          "label",
          {
            htmlFor: "age",
            className: "block text-sm font-medium text-gray-700 dark:text-gray-300",
            children: "Edad"
          }
        ),
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "number",
            name: "age",
            id: "age",
            required: true,
            min: "1",
            max: "120",
            className: "mt-1 block w-full rounded-md border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx(
          "label",
          {
            htmlFor: "height",
            className: "block text-sm font-medium text-gray-700 dark:text-gray-300",
            children: "Altura (cm)"
          }
        ),
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "number",
            name: "height",
            id: "height",
            required: true,
            min: "50",
            max: "250",
            step: "0.1",
            className: "mt-1 block w-full rounded-md border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx(
          "label",
          {
            htmlFor: "weight",
            className: "block text-sm font-medium text-gray-700 dark:text-gray-300",
            children: "Peso Actual (kg)"
          }
        ),
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "number",
            name: "weight",
            id: "weight",
            required: true,
            min: "20",
            step: "0.1",
            className: "mt-1 block w-full rounded-md border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx(
          "label",
          {
            htmlFor: "code",
            className: "block text-sm font-medium text-gray-700 dark:text-gray-300",
            children: "Código de acceso (4 dígitos)"
          }
        ),
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "text",
            name: "code",
            id: "code",
            required: true,
            pattern: "[0-9]{4}",
            minLength: 4,
            maxLength: 4,
            inputMode: "numeric",
            autoComplete: "one-time-code",
            className: "mt-1 block w-full rounded-md border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500",
            placeholder: "Ej: 1234"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: "Color de Perfil" }),
        /* @__PURE__ */ jsx("div", { className: "grid grid-cols-6 gap-3", children: colors.map((color) => /* @__PURE__ */ jsxs("div", { className: "relative", children: [
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "radio",
              id: `color-${color}`,
              name: "color",
              value: color,
              className: "sr-only peer",
              required: true
            }
          ),
          /* @__PURE__ */ jsx(
            "label",
            {
              className: "flex aspect-square rounded-full peer-checked:ring-2 peer-checked:ring-offset-2 peer-checked:ring-blue-500 cursor-pointer",
              style: { backgroundColor: color },
              htmlFor: `color-${color}`
            }
          )
        ] }, color)) })
      ] }),
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "submit",
          className: "w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500",
          children: "Crear Perfil"
        }
      )
    ] }) })
  ] }) });
}
const route6 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$1,
  default: NewProfile
}, Symbol.toStringTag, { value: "Module" }));
async function loader$1({ request }) {
  return redirect("/");
}
function ReloadUser() {
  return null;
}
const route7 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: ReloadUser,
  loader: loader$1
}, Symbol.toStringTag, { value: "Module" }));
async function action({ request }) {
  console.log("[Logout] Iniciando logout");
  return redirect("/", {
    headers: {
      "Set-Cookie": "currentUserId=; Path=/; Max-Age=0"
    }
  });
}
async function loader() {
  return redirect("/");
}
const route8 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action,
  loader
}, Symbol.toStringTag, { value: "Module" }));
function MachineCard({ machine, userId, onEdit, onDelete }) {
  const [lastSession, setLastSession] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(true);
  React.useEffect(() => {
    const fetchLastSession = async () => {
      try {
        const machineIdNum = typeof machine.id === "string" ? parseInt(machine.id, 10) : machine.id;
        const sessions = await getSessionsByMachine(userId, machineIdNum);
        if (sessions.length > 0) {
          const lastSession2 = sessions.sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          )[0];
          setLastSession(lastSession2);
        }
      } catch (error) {
        console.error(`Error fetching sessions for machine ${machine.id}:`, error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLastSession();
  }, [userId, machine.id]);
  return /* @__PURE__ */ jsxs("div", { className: "relative bg-white dark:bg-zinc-800 rounded-lg shadow-lg overflow-hidden", children: [
    /* @__PURE__ */ jsxs(Link, { to: `/machine/${machine.id}`, className: "block", children: [
      /* @__PURE__ */ jsx("div", { className: "h-32 flex items-center justify-center bg-gray-100 dark:bg-zinc-700", children: /* @__PURE__ */ jsx(
        "img",
        {
          src: `/images/machines/${machine.image}`,
          alt: machine.name,
          className: "h-full object-contain"
        }
      ) }),
      /* @__PURE__ */ jsxs("div", { className: "p-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start mb-2", children: [
          /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold text-gray-800 dark:text-gray-100", children: machine.name }),
          /* @__PURE__ */ jsx("span", { className: "inline-block bg-gray-200 dark:bg-zinc-700 rounded-full px-2 py-1 text-xs font-semibold text-gray-700 dark:text-gray-300", children: machine.category })
        ] }),
        isLoading ? /* @__PURE__ */ jsx("p", { className: "text-gray-500 dark:text-gray-400 text-sm", children: "Cargando..." }) : lastSession ? /* @__PURE__ */ jsxs("div", { className: "mt-2", children: [
          /* @__PURE__ */ jsx("p", { className: "text-gray-600 dark:text-gray-400 text-sm", children: "Última sesión:" }),
          /* @__PURE__ */ jsxs("div", { className: "flex justify-between mt-1", children: [
            /* @__PURE__ */ jsxs("span", { className: "text-gray-800 dark:text-gray-200", children: [
              lastSession.weight,
              " kg × ",
              lastSession.reps
            ] }),
            /* @__PURE__ */ jsx("span", { className: "text-gray-500 dark:text-gray-400 text-sm", children: new Date(lastSession.date).toLocaleDateString() })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "mt-1", children: /* @__PURE__ */ jsx("span", { className: `inline-block rounded-full px-2 py-1 text-xs font-semibold ${lastSession.difficulty === "easy" ? "bg-green-100 text-green-800" : lastSession.difficulty === "medium" ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"}`, children: lastSession.difficulty === "easy" ? "Fácil" : lastSession.difficulty === "medium" ? "Medio" : "Difícil" }) })
        ] }) : /* @__PURE__ */ jsx("p", { className: "text-gray-500 dark:text-gray-400 text-sm", children: "No hay sesiones registradas" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "absolute bottom-2 right-2 flex gap-1 z-10", children: [
      onEdit && /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          className: "p-1 bg-blue-500 hover:bg-blue-600 text-white rounded-full text-xs shadow focus:outline-none",
          title: "Editar máquina",
          onClick: (e) => {
            e.stopPropagation();
            e.preventDefault();
            onEdit(machine);
          },
          children: "✎"
        }
      ),
      onDelete && /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          className: "p-1 bg-red-500 hover:bg-red-600 text-white rounded-full text-xs shadow focus:outline-none",
          title: "Eliminar máquina",
          onClick: (e) => {
            e.stopPropagation();
            e.preventDefault();
            onDelete(machine);
          },
          children: "🗑"
        }
      )
    ] })
  ] });
}
function WeightLine({ userId }) {
  const [weights, setWeights] = useState([]);
  const [dates, setDates] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchUserWeight = async () => {
      try {
        const user = await getUser(userId);
        if (user && user.weight && user.weightDates) {
          setWeights(user.weight);
          setDates(user.weightDates);
        }
      } catch (error) {
        console.error("Error fetching user weight data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserWeight();
  }, [userId]);
  if (loading) {
    return /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center h-full", children: /* @__PURE__ */ jsx("p", { className: "text-gray-500 dark:text-gray-400", children: "Cargando datos..." }) });
  }
  if (weights.length === 0) {
    return /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center h-full", children: /* @__PURE__ */ jsx("p", { className: "text-gray-500 dark:text-gray-400", children: "No hay datos de peso disponibles" }) });
  }
  if (weights.length === 1) {
    return /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center h-full", children: [
      /* @__PURE__ */ jsxs("p", { className: "text-xl font-semibold text-blue-600 dark:text-blue-400", children: [
        weights[0],
        " kg"
      ] }),
      /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400", children: new Date(dates[0]).toLocaleDateString() })
    ] });
  }
  return /* @__PURE__ */ jsx("div", { className: "h-full flex flex-col", children: /* @__PURE__ */ jsx("div", { className: "flex-1 flex items-end", children: weights.map((weight, index) => {
    const date = new Date(dates[index]);
    const height = weight / Math.max(...weights) * 100;
    return /* @__PURE__ */ jsxs("div", { className: "flex-1 flex flex-col items-center", style: { height: "100%" }, children: [
      /* @__PURE__ */ jsx(
        "div",
        {
          className: "w-full bg-blue-500 rounded-t-sm mx-1",
          style: { height: `${height}%` }
        }
      ),
      /* @__PURE__ */ jsxs("p", { className: "text-xs text-gray-600 dark:text-gray-400 mt-1", children: [
        weight,
        " kg"
      ] }),
      /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-500 dark:text-gray-500", children: date.toLocaleDateString() })
    ] }, index);
  }) }) });
}
function ProgressChart({ userId }) {
  const [activeTab, setActiveTab] = useState("weight");
  const [machineProgress, setMachineProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [machineList, setMachineList] = useState([]);
  const [showAll, setShowAll] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("todas");
  const [categories2, setCategories] = useState([]);
  useEffect(() => {
    const fetchMachineProgress = async () => {
      setLoading(true);
      try {
        if (activeTab === "machines") {
          const machines = (await getMachinesFromFirestore(userId)).map((m) => ({
            ...m,
            id: Number(m.id)
          }));
          setMachineList(machines);
          const uniqueCategories = [
            ...new Set(machines.map((m) => m.category))
          ];
          setCategories(uniqueCategories);
          const allSessions = (await getSessionsFromFirestore(userId)).map((s) => ({
            ...s,
            machineId: Number(s.machineId)
          }));
          const progress = await Promise.all(
            machines.map(async (machine) => {
              const sessions = allSessions.filter((s) => s.machineId === machine.id);
              if (sessions.length === 0) {
                return {
                  id: machine.id,
                  name: machine.name,
                  lastWeight: null,
                  prevWeight: null,
                  change: "new",
                  category: machine.category
                };
              }
              const sorted = sessions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
              const last = sorted[0];
              const lastDate = new Date(last.date);
              const lastWeek = new Date(lastDate);
              lastWeek.setDate(lastDate.getDate() - 7);
              const prev = sorted.find((s) => new Date(s.date) < lastWeek);
              let change = "same";
              if (!prev) change = "new";
              else if (last.weight > prev.weight) change = "up";
              else if (last.weight < prev.weight) change = "down";
              return {
                id: machine.id,
                name: machine.name,
                lastWeight: last.weight,
                prevWeight: prev ? prev.weight : null,
                change,
                category: machine.category
              };
            })
          );
          setMachineProgress(progress);
        }
      } catch (error) {
        console.error("Error fetching machine progress", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMachineProgress();
  }, [userId, activeTab]);
  const filteredProgress = selectedCategory === "todas" ? machineProgress : machineProgress.filter((mp) => mp.category === selectedCategory);
  const frequentMachines = [...filteredProgress].sort((a, b) => {
    if (a.lastWeight === null) return 1;
    if (b.lastWeight === null) return -1;
    return 0;
  }).slice(0, 5);
  const machinesToShow = showAll ? filteredProgress : frequentMachines;
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsxs("div", { className: "flex border-b border-gray-200 dark:border-gray-700 mb-4", children: [
      /* @__PURE__ */ jsx(
        "button",
        {
          className: `py-2 px-4 font-medium ${activeTab === "weight" ? "border-b-2 border-blue-500 text-blue-600 dark:text-blue-400" : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"}`,
          onClick: () => setActiveTab("weight"),
          children: "Tu Peso"
        }
      ),
      /* @__PURE__ */ jsx(
        "button",
        {
          className: `py-2 px-4 font-medium ${activeTab === "machines" ? "border-b-2 border-blue-500 text-blue-600 dark:text-blue-400" : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"}`,
          onClick: () => setActiveTab("machines"),
          children: "Progreso por Máquina"
        }
      )
    ] }),
    /* @__PURE__ */ jsx("div", { className: "h-64", children: loading ? /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center h-full", children: /* @__PURE__ */ jsx("p", { className: "text-gray-500 dark:text-gray-400", children: "Cargando datos..." }) }) : activeTab === "weight" ? /* @__PURE__ */ jsx(WeightLine, { userId }) : /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-2", children: [
        /* @__PURE__ */ jsx("label", { htmlFor: "cat-select", className: "text-sm text-gray-600 dark:text-gray-300", children: "Categoría:" }),
        /* @__PURE__ */ jsxs(
          "select",
          {
            id: "cat-select",
            value: selectedCategory,
            onChange: (e) => setSelectedCategory(e.target.value),
            className: "px-2 py-1 rounded border border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-gray-800 dark:text-gray-100 text-sm",
            children: [
              /* @__PURE__ */ jsx("option", { value: "todas", children: "Todas" }),
              categories2.map((cat) => /* @__PURE__ */ jsx("option", { value: cat, children: cat }, cat))
            ]
          }
        ),
        !showAll && filteredProgress.length > 5 && /* @__PURE__ */ jsx(
          "button",
          {
            className: "ml-auto px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700",
            onClick: () => setShowAll(true),
            children: "Ver todas"
          }
        ),
        showAll && /* @__PURE__ */ jsx(
          "button",
          {
            className: "ml-auto px-3 py-1 bg-gray-300 dark:bg-zinc-600 text-gray-800 dark:text-gray-100 rounded text-xs hover:bg-gray-400 dark:hover:bg-zinc-500",
            onClick: () => setShowAll(false),
            children: "Ver menos"
          }
        )
      ] }),
      /* @__PURE__ */ jsx("div", { className: "overflow-y-auto h-full", children: machinesToShow.length === 0 ? /* @__PURE__ */ jsx("p", { className: "text-gray-500 dark:text-gray-400", children: "No hay datos de máquinas." }) : /* @__PURE__ */ jsx("ul", { className: "divide-y divide-gray-200 dark:divide-gray-700", children: machinesToShow.map((mp) => /* @__PURE__ */ jsxs("li", { className: "flex items-center justify-between py-3 px-2", children: [
        /* @__PURE__ */ jsx(
          Link,
          {
            to: `/machine/${mp.id}`,
            className: "font-medium text-blue-700 dark:text-blue-300 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-400 rounded transition-colors",
            children: mp.name
          }
        ),
        /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-2", children: [
          mp.lastWeight !== null && /* @__PURE__ */ jsxs("span", { className: "text-sm text-gray-600 dark:text-gray-300", children: [
            mp.lastWeight,
            " kg"
          ] }),
          mp.change === "up" && /* @__PURE__ */ jsx("span", { title: "Aumento", className: "text-green-600", children: "▲" }),
          mp.change === "down" && /* @__PURE__ */ jsx("span", { title: "Disminución", className: "text-red-600", children: "▼" }),
          mp.change === "same" && /* @__PURE__ */ jsx("span", { title: "Sin cambio", className: "text-gray-400", children: "→" }),
          mp.change === "new" && /* @__PURE__ */ jsx("span", { title: "Nuevo", className: "text-blue-400", children: "★" }),
          /* @__PURE__ */ jsx("span", { className: "text-xs text-gray-400 ml-2", children: mp.change === "new" ? "nuevo" : mp.prevWeight !== null ? `(antes: ${mp.prevWeight} kg)` : "" })
        ] })
      ] }, mp.id)) }) })
    ] }) })
  ] });
}
function UserProfile({ user }) {
  return /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-zinc-800 rounded-lg shadow-lg p-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 mb-6", children: [
      /* @__PURE__ */ jsx(
        "div",
        {
          className: "w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold",
          style: { backgroundColor: user.color },
          children: user.name.charAt(0)
        }
      ),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold text-gray-800 dark:text-gray-100", children: user.name }),
        /* @__PURE__ */ jsxs("p", { className: "text-gray-600 dark:text-gray-400", children: [
          "Miembro desde ",
          new Date(user.createdAt).toLocaleDateString()
        ] })
      ] })
    ] }),
    user.weight && user.weight.length > 0 && /* @__PURE__ */ jsxs("div", { className: "mb-6", children: [
      /* @__PURE__ */ jsx("h3", { className: "text-lg font-medium text-gray-800 dark:text-gray-100 mb-2", children: "Peso Actual" }),
      /* @__PURE__ */ jsxs("p", { className: "text-2xl font-bold text-gray-900 dark:text-gray-50", children: [
        user.weight[user.weight.length - 1],
        " kg"
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center", children: [
      /* @__PURE__ */ jsx(
        Link,
        {
          to: "/profile/edit",
          className: "text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors",
          children: "Editar Perfil"
        }
      ),
      /* @__PURE__ */ jsx(Form, { action: "/logout", method: "post", children: /* @__PURE__ */ jsx(
        "button",
        {
          type: "submit",
          className: "text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors",
          children: "Cerrar Sesión"
        }
      ) })
    ] })
  ] });
}
function TestFirestore() {
  useEffect(() => {
    getUsersFromFirestore().then((users) => {
      console.log("Usuarios desde Firestore:", users);
    });
  }, []);
  return /* @__PURE__ */ jsx("div", { children: "Revisa la consola para ver los usuarios de Firestore." });
}
function Index() {
  console.log("[Index] Renderizando componente principal", (/* @__PURE__ */ new Date()).toISOString());
  const context = useOutletContext();
  const currentUser = context == null ? void 0 : context.currentUser;
  console.log("[Index] currentUser en render:", currentUser);
  useNavigate();
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("todas");
  const categories2 = Array.from(new Set(machines.map((m) => m.category)));
  useEffect(() => {
    console.log("[Index] useEffect ejecutado. currentUser:", currentUser, (/* @__PURE__ */ new Date()).toISOString());
    if (currentUser) {
      document.documentElement.classList.add("loaded");
      setLoading(true);
      getMachinesFromFirestore(currentUser.id).then((m) => {
        console.log("[Firestore] Máquinas obtenidas:", m);
        const machines2 = m.map((item) => ({
          id: item.id,
          name: item.name || "",
          image: item.image || "",
          category: item.category || ""
        }));
        setMachines(machines2);
        setLoading(false);
      }).catch((e) => {
        console.error("[Firestore] Error obteniendo máquinas:", e);
        setLoading(false);
      });
    }
  }, [currentUser]);
  const handleEditMachine = (machine) => {
    alert(`Editar máquina: ${machine.name}`);
  };
  const handleDeleteMachine = async (machine) => {
    if (!currentUser) return;
    if (window.confirm(`¿Seguro que deseas eliminar la máquina "${machine.name}"?`)) {
      try {
        await deleteDoc(doc(collection(db, "machines"), machine.id.toString()));
        setMachines(machines.filter((m) => m.id !== machine.id));
      } catch (error) {
        console.error("Error deleting machine:", error);
      }
    }
  };
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(TestFirestore, {}),
    !currentUser ? /* @__PURE__ */ jsx("div", { className: "flex h-screen items-center justify-center bg-gradient-to-b from-zinc-900 to-zinc-800", children: /* @__PURE__ */ jsxs("div", { className: "text-center px-8 py-12 rounded-lg bg-zinc-800/50 backdrop-blur-sm max-w-md w-full mx-4", children: [
      /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold text-white mb-4", children: "Gym Progress" }),
      /* @__PURE__ */ jsx("p", { className: "text-gray-300 mb-8", children: "Registra y monitorea tu progreso en el gimnasio de manera fácil y efectiva" }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsx(
          Link,
          {
            to: "/profile/new",
            className: "block w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-all duration-200 transform hover:scale-105",
            children: "Crear Nuevo Perfil"
          }
        ),
        /* @__PURE__ */ jsxs("div", { className: "relative", children: [
          /* @__PURE__ */ jsx("div", { className: "absolute inset-0 flex items-center", children: /* @__PURE__ */ jsx("div", { className: "w-full border-t border-gray-600" }) }),
          /* @__PURE__ */ jsx("div", { className: "relative flex justify-center text-sm", children: /* @__PURE__ */ jsx("span", { className: "px-2 text-gray-400 bg-zinc-800/50", children: "o" }) })
        ] }),
        /* @__PURE__ */ jsx(
          Link,
          {
            to: "/profile/select",
            className: "block w-full bg-zinc-700 text-white px-6 py-3 rounded-lg hover:bg-zinc-600 transition-all duration-200 transform hover:scale-105",
            children: "Usar Perfil Existente"
          }
        )
      ] })
    ] }) }) : /* @__PURE__ */ jsx("div", { className: "container mx-auto px-4 py-8", children: /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-8", children: [
      /* @__PURE__ */ jsx("div", { className: "md:col-span-1", children: /* @__PURE__ */ jsx(UserProfile, { user: currentUser }) }),
      /* @__PURE__ */ jsxs("div", { className: "md:col-span-2", children: [
        /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-zinc-800 rounded-lg shadow-lg p-6 mb-8", children: [
          /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4", children: "Tu Progreso" }),
          /* @__PURE__ */ jsx(ProgressChart, { userId: currentUser.id })
        ] }),
        loading ? /* @__PURE__ */ jsx("div", { className: "text-center py-8", children: "Cargando máquinas..." }) : machines.length === 0 ? /* @__PURE__ */ jsx("div", { className: "text-center py-8", children: /* @__PURE__ */ jsx(
          Link,
          {
            to: "/machine/new",
            className: "inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-all duration-200 transform hover:scale-105",
            children: "Agregar primera máquina"
          }
        ) }) : /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-4", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { htmlFor: "cat-select", className: "text-sm text-gray-600 dark:text-gray-300 mr-2", children: "Categoría:" }),
              /* @__PURE__ */ jsxs(
                "select",
                {
                  id: "cat-select",
                  value: selectedCategory,
                  onChange: (e) => setSelectedCategory(e.target.value),
                  className: "px-2 py-1 rounded border border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-gray-800 dark:text-gray-100 text-sm",
                  children: [
                    /* @__PURE__ */ jsx("option", { value: "todas", children: "Todas" }),
                    categories2.map((cat) => /* @__PURE__ */ jsx("option", { value: cat, children: cat }, cat))
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ jsx(
              Link,
              {
                to: "/machine/new",
                className: "inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all duration-200",
                children: "+ Agregar máquina"
              }
            )
          ] }),
          /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4", children: machines.filter((m) => selectedCategory === "todas" || m.category === selectedCategory).map((machine) => /* @__PURE__ */ jsx(
            MachineCard,
            {
              machine,
              userId: currentUser.id,
              onEdit: handleEditMachine,
              onDelete: handleDeleteMachine
            },
            machine.id
          )) })
        ] })
      ] })
    ] }) })
  ] });
}
const route9 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: Index
}, Symbol.toStringTag, { value: "Module" }));
const serverManifest = { "entry": { "module": "/assets/entry.client-CtoR9LOg.js", "imports": ["/assets/index-keZNs5ok.js", "/assets/index-1bZHM5go.js", "/assets/components-ooYZhqzC.js"], "css": [] }, "routes": { "root": { "id": "root", "parentId": void 0, "path": "", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/root-DMobfkvr.js", "imports": ["/assets/index-keZNs5ok.js", "/assets/index-1bZHM5go.js", "/assets/components-ooYZhqzC.js", "/assets/useUserStore-CkyXIECU.js", "/assets/useTestDateStore-DkeVuR4_.js", "/assets/storage-CmIiShv6.js"], "css": ["/assets/root-TZDQjr0W.css"] }, "routes/profile.select": { "id": "routes/profile.select", "parentId": "root", "path": "profile/select", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/profile.select-DnnBpjrH.js", "imports": ["/assets/index-keZNs5ok.js", "/assets/components-ooYZhqzC.js", "/assets/index-1bZHM5go.js"], "css": [] }, "routes/profile._index": { "id": "routes/profile._index", "parentId": "root", "path": "profile", "index": true, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/profile._index-ChG-6rmU.js", "imports": [], "css": [] }, "routes/profile.edit": { "id": "routes/profile.edit", "parentId": "root", "path": "profile/edit", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/profile.edit-DuTzI3u0.js", "imports": ["/assets/index-keZNs5ok.js", "/assets/components-ooYZhqzC.js", "/assets/index-1bZHM5go.js"], "css": [] }, "routes/machine.$id": { "id": "routes/machine.$id", "parentId": "root", "path": "machine/:id", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/machine._id-DGVExeQd.js", "imports": ["/assets/index-keZNs5ok.js", "/assets/storage-CmIiShv6.js", "/assets/useUserStore-CkyXIECU.js", "/assets/useTestDateStore-DkeVuR4_.js", "/assets/index-1bZHM5go.js"], "css": [] }, "routes/machine.new": { "id": "routes/machine.new", "parentId": "root", "path": "machine/new", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/machine.new-DMma1R3m.js", "imports": ["/assets/index-keZNs5ok.js", "/assets/useUserStore-CkyXIECU.js", "/assets/storage-CmIiShv6.js"], "css": [] }, "routes/profile.new": { "id": "routes/profile.new", "parentId": "root", "path": "profile/new", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/profile.new-CoLoem5p.js", "imports": ["/assets/index-keZNs5ok.js", "/assets/components-ooYZhqzC.js", "/assets/index-1bZHM5go.js"], "css": [] }, "routes/reload-user": { "id": "routes/reload-user", "parentId": "root", "path": "reload-user", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/reload-user-ChG-6rmU.js", "imports": [], "css": [] }, "routes/logout": { "id": "routes/logout", "parentId": "root", "path": "logout", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/logout-l0sNRNKZ.js", "imports": [], "css": [] }, "routes/_index": { "id": "routes/_index", "parentId": "root", "path": void 0, "index": true, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/_index-C0I_x20h.js", "imports": ["/assets/index-keZNs5ok.js", "/assets/storage-CmIiShv6.js", "/assets/components-ooYZhqzC.js", "/assets/index-1bZHM5go.js"], "css": [] } }, "url": "/assets/manifest-8a09dc21.js", "version": "8a09dc21" };
const mode = "production";
const assetsBuildDirectory = "build\\client";
const basename = "/";
const future = { "v3_fetcherPersist": true, "v3_relativeSplatPath": true, "v3_throwAbortReason": true, "v3_routeConfig": false, "v3_singleFetch": true, "v3_lazyRouteDiscovery": true, "unstable_optimizeDeps": false };
const isSpaMode = false;
const publicPath = "/";
const entry = { module: entryServer };
const routes = {
  "root": {
    id: "root",
    parentId: void 0,
    path: "",
    index: void 0,
    caseSensitive: void 0,
    module: route0
  },
  "routes/profile.select": {
    id: "routes/profile.select",
    parentId: "root",
    path: "profile/select",
    index: void 0,
    caseSensitive: void 0,
    module: route1
  },
  "routes/profile._index": {
    id: "routes/profile._index",
    parentId: "root",
    path: "profile",
    index: true,
    caseSensitive: void 0,
    module: route2
  },
  "routes/profile.edit": {
    id: "routes/profile.edit",
    parentId: "root",
    path: "profile/edit",
    index: void 0,
    caseSensitive: void 0,
    module: route3
  },
  "routes/machine.$id": {
    id: "routes/machine.$id",
    parentId: "root",
    path: "machine/:id",
    index: void 0,
    caseSensitive: void 0,
    module: route4
  },
  "routes/machine.new": {
    id: "routes/machine.new",
    parentId: "root",
    path: "machine/new",
    index: void 0,
    caseSensitive: void 0,
    module: route5
  },
  "routes/profile.new": {
    id: "routes/profile.new",
    parentId: "root",
    path: "profile/new",
    index: void 0,
    caseSensitive: void 0,
    module: route6
  },
  "routes/reload-user": {
    id: "routes/reload-user",
    parentId: "root",
    path: "reload-user",
    index: void 0,
    caseSensitive: void 0,
    module: route7
  },
  "routes/logout": {
    id: "routes/logout",
    parentId: "root",
    path: "logout",
    index: void 0,
    caseSensitive: void 0,
    module: route8
  },
  "routes/_index": {
    id: "routes/_index",
    parentId: "root",
    path: void 0,
    index: true,
    caseSensitive: void 0,
    module: route9
  }
};
export {
  serverManifest as assets,
  assetsBuildDirectory,
  basename,
  entry,
  future,
  isSpaMode,
  mode,
  publicPath,
  routes
};
