import { get, set, del, keys, entries } from 'idb-keyval';
import { initialMachines } from './initialData';
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "./firebaseConfig";
import { parse } from "cookie";

// Types
export interface User {
  id: string;
  name: string;
  avatar: string;
  color: string;
  weight?: number[];
  weightDates?: string[];
  createdAt: string;
  age: number;
  height: number;
}

export interface Machine {
  id: string | number;
  name: string;
  image: string;
  category: string;
  userId?: string;
}

export interface Session {
  id: string;
  userId: string;
  machineId: number;
  weight: number;
  reps: number;
  date: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

// Storage keys
const CURRENT_USER_KEY = 'currentUserId';
const USER_PREFIX = 'user_';
const SESSION_PREFIX = 'session_';
const MACHINES_PREFIX = 'machines_';

// Helper function to check if we're in the browser and IndexedDB is available
const isBrowser = typeof window !== 'undefined';

const isIndexedDBAvailable = () => {
  if (!isBrowser) return false;
  try {
    return 'indexedDB' in window;
  } catch {
    return false;
  }
};

// Server-side storage simulation with initialization tracking
let serverStorage: Record<string, any> = {};
let isInitialized = false;
let currentUserPromise: Promise<User | null> | null = null;

const storage = {
  async get(key: string) {
    if (!isBrowser) {
      return serverStorage[key] || null;
    }
    if (isIndexedDBAvailable()) {
      const value = await get(key);
      return value;
    }
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  },

  async set(key: string, value: any) {
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

  async del(key: string) {
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
      return idbKeys.map(key => String(key));
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

// User functions
export async function getUsers(): Promise<User[]> {
  try {
    const allKeys = await storage.keys();
    const userKeys = allKeys.filter(key => 
      typeof key === 'string' && key.startsWith(USER_PREFIX)
    );
    
    const users = await Promise.all(
      userKeys.map(async key => await storage.get(key))
    );
    
    return users as User[];
  } catch (error) {
    console.error('Error getting users:', error);
    return [];
  }
}

export async function saveUser(user: User): Promise<void> {
  try {
    console.log('[Storage] Saving user:', user);
    await storage.set(`${USER_PREFIX}${user.id}`, user);
    console.log('[Storage] User saved successfully');
  } catch (error) {
    console.error('[Storage] Error saving user:', error);
    throw error;
  }
}

export async function getUser(userId: string): Promise<User | null> {
  try {
    const user = await storage.get(`${USER_PREFIX}${userId}`);
    return user || null;
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
}

export async function deleteUser(userId: string): Promise<void> {
  try {
    await storage.del(`${USER_PREFIX}${userId}`);
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
}

// Machine functions with initialization check
export async function getMachines(userId: string): Promise<Machine[]> {
  try {
    const machines = await storage.get(`${MACHINES_PREFIX}${userId}`);
    return machines || [];
  } catch (error) {
    console.error('Error getting machines:', error);
    return [];
  }
}

export async function saveMachines(userId: string, machines: Machine[]): Promise<void> {
  try {
    await storage.set(`${MACHINES_PREFIX}${userId}`, machines);
  } catch (error) {
    console.error('Error saving machines:', error);
    throw error;
  }
}

export async function getMachine(userId: string, id: number): Promise<Machine | null> {
  try {
    const machines = await getMachines(userId);
    return machines.find(machine => machine.id === id) || null;
  } catch (error) {
    console.error('Error getting machine:', error);
    return null;
  }
}

// Session functions
export async function getSessionsByUser(userId: string): Promise<Session[]> {
  try {
    const allEntries = await storage.entries();
    const sessionEntries = allEntries.filter(([key]) => 
      typeof key === 'string' && 
      key.startsWith(SESSION_PREFIX) && 
      key.includes(userId)
    );
    
    return sessionEntries.map(([_, value]) => value as Session);
  } catch (error) {
    console.error('Error getting sessions:', error);
    return [];
  }
}

export async function saveSession(session: Session): Promise<void> {
  try {
    await storage.set(`${SESSION_PREFIX}${session.userId}_${session.id}`, session);
  } catch (error) {
    console.error('Error saving session:', error);
    throw error;
  }
}

export async function getSessionsByMachine(userId: string, machineId: number): Promise<Session[]> {
  try {
    const sessions = await getSessionsByUser(userId);
    return sessions.filter(session => session.machineId === machineId);
  } catch (error) {
    console.error('Error getting sessions by machine:', error);
    return [];
  }
}

// Helper function to calculate total weight lifted by week
export async function getWeightLiftedByWeek(userId: string): Promise<{ week: string, total: number }[]> {
  if (!userId) return [];
  try {
    const sessions = await getSessionsByUser(userId);
    
    // Group sessions by week
    const weeklyData: Record<string, number> = {};
    
    sessions.forEach(session => {
      const date = new Date(session.date);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay()); // Start of week (Sunday)
      const weekKey = weekStart.toISOString().split('T')[0];
      
      const totalWeight = session.weight * session.reps;
      weeklyData[weekKey] = (weeklyData[weekKey] || 0) + totalWeight;
    });
    
    // Convert to array and sort by week
    return Object.entries(weeklyData)
      .map(([week, total]) => ({ week, total }))
      .sort((a, b) => a.week.localeCompare(b.week));
  } catch (error) {
    console.error('Error calculating weight lifted by week:', error);
    return [];
  }
}

// Helper function to migrate to backend REST API
// This function would be implemented when migrating from local storage to a backend
export async function migrateToBackend() {
  try {
    const users = await getUsers();
    const allSessions: Session[] = [];
    const allMachines: Record<string, Machine[]> = {};
    
    for (const user of users) {
      const userSessions = await getSessionsByUser(user.id);
      allSessions.push(...userSessions);
      allMachines[user.id] = await getMachines(user.id);
    }
    
    // Aquí implementarías las llamadas a la API para enviar estos datos a tu backend
    console.log('Ready to migrate:', { users, sessions: allSessions, machines: allMachines });
    
    return { success: true, message: 'Data prepared for migration' };
  } catch (error) {
    console.error('Error preparing migration:', error);
    return { success: false, message: 'Error preparing data for migration' };
  }
}

export async function createUser(data: { name: string; age: number; weight: number; height: number }): Promise<User> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  
  const user: User = {
    id,
    name: data.name,
    avatar: '', // Default avatar can be added later
    color: '#' + Math.floor(Math.random()*16777215).toString(16), // Random color
    weight: [data.weight],
    weightDates: [now],
    createdAt: now,
    age: data.age,
    height: data.height
  };

  await saveUser(user);
  return user;
}

// Nueva función para obtener usuarios desde Firestore
export async function getUsersFromFirestore() {
  const usersCol = collection(db, "users");
  const userSnapshot = await getDocs(usersCol);
  return userSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// Nueva función para obtener máquinas desde Firestore por userId
export async function getMachinesFromFirestore(userId: string) {
  const machinesCol = collection(db, "machines");
  const q = query(machinesCol, where("userId", "==", userId));
  const machinesSnapshot = await getDocs(q);
  return machinesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// Nueva función para obtener sesiones desde Firestore por userId
export async function getSessionsFromFirestore(userId: string) {
  const sessionsCol = collection(db, "session");
  const q = query(sessionsCol, where("userId", "==", userId));
  const sessionsSnapshot = await getDocs(q);
  return sessionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// Nueva función para obtener usuario actual desde cookie y Firestore
export async function getCurrentUserFromCookie(request: Request) {
  const cookieHeader = request.headers.get("Cookie");
  let currentUserId = null;
  if (cookieHeader) {
    const cookies = parse(cookieHeader);
    currentUserId = cookies.currentUserId;
  }
  if (currentUserId) {
    const users = await getUsersFromFirestore();
    return users.find((u: any) => u.id === currentUserId) || null;
  }
  return null;
}

// Helpers para cookies (SSR)
export function setCurrentUserCookie(userId: string) {
  if (typeof document !== 'undefined') {
    document.cookie = `currentUserId=${userId}; path=/;`;
  }
}

export function getCurrentUserIdFromCookie(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|; )currentUserId=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}
