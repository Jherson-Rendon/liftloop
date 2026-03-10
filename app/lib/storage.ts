import { get, set, del, keys, entries } from 'idb-keyval';
import { initialMachines } from './initialData';
import { collection, getDocs, query, where, doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "./firebaseConfig";
import { parse } from "cookie";
// import { getSession } from "~/lib/session.server"; // Solo importar en archivos .server si es necesario

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
  code: string;
  friends?: string[];
  friendCode?: string;
}

export interface Machine {
  id: string | number;
  name: string;
  image: string;
  category: string;
  userId?: string;
  catalogId?: string;
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
    if (user) return user;

    // Fallback: Try fetching from Firestore if local fails
    const userRef = doc(db, "users", userId);
    const docSnap = await getDoc(userRef);
    if (docSnap.exists()) {
      const userData = { id: docSnap.id, ...docSnap.data() } as User;
      // Save it locally for future use
      await saveUser(userData);
      return userData;
    }
    return null;
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
}

// Friend Functions

// Helper to normalize a name for comparison (remove accents, lowercase, trim)
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

// Helper to find a matching machine in another user's profile
export async function findMatchingMachine(targetUserId: string, sourceMachine: Machine): Promise<Machine | null> {
  try {
    const targetMachines = await getMachinesFromFirestore(targetUserId);
    console.log(`[findMatchingMachine] Source machine:`, { id: sourceMachine.id, name: sourceMachine.name, catalogId: sourceMachine.catalogId });
    console.log(`[findMatchingMachine] Target user ${targetUserId} has ${targetMachines.length} machines:`, targetMachines.map((m: any) => ({ id: m.id, name: m.name, catalogId: m.catalogId })));

    // 1. Try to match by catalogId (Strongest match)
    if (sourceMachine.catalogId) {
      const match = targetMachines.find((m: any) => m.catalogId === sourceMachine.catalogId);
      if (match) {
        console.log(`[findMatchingMachine] Matched by catalogId:`, match);
        return match as Machine;
      }
    }

    // 2. Fallback: Match by exact name (Case insensitive)
    const sourceNameNorm = normalizeName(sourceMachine.name);
    const matchByName = targetMachines.find((m: any) =>
      normalizeName(m.name) === sourceNameNorm
    );

    if (matchByName) {
      console.log(`[findMatchingMachine] Matched by name:`, matchByName);
      return matchByName as Machine;
    }

    // 3. Partial name match (contains)
    const matchByPartialName = targetMachines.find((m: any) =>
      normalizeName(m.name).includes(sourceNameNorm) || sourceNameNorm.includes(normalizeName(m.name))
    );

    if (matchByPartialName) {
      console.log(`[findMatchingMachine] Matched by partial name:`, matchByPartialName);
      return matchByPartialName as Machine;
    }

    console.warn(`[findMatchingMachine] No match found for "${sourceMachine.name}" in target user ${targetUserId}`);
    return null;
  } catch (error) {
    console.error("Error finding matching machine:", error);
    return null;
  }
}

export async function generateFriendCode(userId: string): Promise<string> {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid ambiguous chars
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }

  // Update user with new code
  const user = await getUser(userId);
  if (user) {
    const updatedUser = { ...user, friendCode: result };
    await saveUser(updatedUser);

    const userRef = doc(db, "users", userId);
    await setDoc(userRef, { friendCode: result }, { merge: true });
    return result;
  }
  throw new Error("User not found");
}

export async function addFriendByCode(currentUserId: string, code: string): Promise<void> {
  try {
    // 1. Find user with this code
    const usersCol = collection(db, "users");
    const q = query(usersCol, where("friendCode", "==", code));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      throw new Error("Código no encontrado");
    }

    const friendDoc = querySnapshot.docs[0];
    const friendId = friendDoc.id;
    const friendData = friendDoc.data() as User; // Cast carefully

    if (friendId === currentUserId) {
      throw new Error("No puedes agregarte a ti mismo");
    }

    // 2. Add friendId to currentUser's friends list
    const currentUser = await getUser(currentUserId);
    if (!currentUser) throw new Error("Current user not found");

    const currentFriends = currentUser.friends || [];
    if (currentFriends.includes(friendId)) {
      throw new Error("Ya son amigos");
    }

    const updatedFriends = [...currentFriends, friendId];
    await saveUser({ ...currentUser, friends: updatedFriends });
    await setDoc(doc(db, "users", currentUserId), { friends: updatedFriends }, { merge: true });

    // 3. Add currentUserId to friend's friends list (Mutual)
    const friendFriends = friendData.friends || [];
    if (!friendFriends.includes(currentUserId)) {
      const updatedFriendFriends = [...friendFriends, currentUserId];
      // We technically should update local storage for the friend too if we could, but they might be on another device.
      // We MUST update Firestore.
      await setDoc(doc(db, "users", friendId), { friends: updatedFriendFriends }, { merge: true });
    }

  } catch (error) {
    console.error("Error adding friend:", error);
    throw error;
  }
}

export async function removeFriend(currentUserId: string, friendId: string): Promise<void> {
  try {
    // Remove from current user
    const currentUser = await getUser(currentUserId);
    if (currentUser && currentUser.friends) {
      const updatedFriends = currentUser.friends.filter(id => id !== friendId);
      await saveUser({ ...currentUser, friends: updatedFriends });
      await setDoc(doc(db, "users", currentUserId), { friends: updatedFriends }, { merge: true });
    }

    // Remove from friend (Firestore)
    // Note: In a real app with proper security rules, users might not be allowed to edit other users' docs directly.
    // Assuming permissive rules for now or backend function.
    const friendRef = doc(db, "users", friendId);
    const friendSnap = await getDoc(friendRef);
    if (friendSnap.exists()) {
      const friendData = friendSnap.data() as User;
      if (friendData.friends) {
        const updatedFriendFriends = friendData.friends.filter(id => id !== currentUserId);
        await setDoc(friendRef, { friends: updatedFriendFriends }, { merge: true });
      }
    }
  } catch (error) {
    console.error("Error removing friend:", error);
    throw error;
  }
}

export async function getFriendsData(friendIds: string[]): Promise<User[]> {
  if (!friendIds || friendIds.length === 0) return [];

  // Check local storage first for speed, but fallback to Firestore
  const friends: User[] = [];
  for (const id of friendIds) {
    let friend = await getUser(id);
    if (!friend) {
      // force fetch from firestore inside getUser if properly implemented, or direct ref here
      // getUser already has fallback logic now. Be sure it works for non-current-user too.
      // Wait, getUser checks LOCAL storage for USER_PREFIX+userId.
      // If we haven't loaded this friend before, they won't be in local.
      // The revised getUser handles this!
    }
    if (friend) {
      friends.push(friend);
    }
  }
  return friends;
}

export async function deleteUser(userId: string): Promise<void> {
  try {
    await storage.del(`${USER_PREFIX}${userId}`);
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
}

export async function updateUserWeight(userId: string, weight: number, date: string): Promise<void> {
  try {
    const user = await getUser(userId);
    if (!user) throw new Error("User not found");

    // Inicializar arrays si no existen
    const currentWeights = user.weight || [];
    const currentDates = user.weightDates || [];

    // Agregar nuevo dato
    const newWeights = [...currentWeights, weight];
    const newDates = [...currentDates, date];

    // Actualizar usuario localmente
    const updatedUser = { ...user, weight: newWeights, weightDates: newDates };
    await saveUser(updatedUser);

    // Actualizar en Firestore si es necesario (asumimos sincronización futura o manual)
    const userRef = doc(db, "users", userId);
    await setDoc(userRef, { weight: newWeights, weightDates: newDates }, { merge: true });

  } catch (error) {
    console.error("Error updating user weight:", error);
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

export async function getSessionsByMachine(userId: string, machineId: number | string): Promise<Session[]> {
  try {
    // 1. Try Local Storage first
    let sessions = await getSessionsByUser(userId);

    // 2. If empty (or for friends not in local storage), try Firestore
    if (sessions.length === 0) {
      const remoteSessionsRaw = await getSessionsFromFirestore(userId);
      if (remoteSessionsRaw.length > 0) {
        sessions = remoteSessionsRaw.map((s: any) => ({
          id: String(s.id),
          userId: s.userId,
          machineId: Number(s.machineId),
          weight: Number(s.weight),
          reps: Number(s.reps),
          date: s.date,
          difficulty: s.difficulty as 'easy' | 'medium' | 'hard'
        }));
      }
    }

    // Use loose equality (==) to handle string/number type mismatches in machineId
    const machineIdNum = Number(machineId);
    console.log(`[getSessionsByMachine] userId=${userId}, machineId=${machineId} (as number: ${machineIdNum}), total sessions: ${sessions.length}`);
    const filtered = sessions.filter(session => Number(session.machineId) === machineIdNum);
    console.log(`[getSessionsByMachine] Filtered sessions for machine ${machineId}:`, filtered.length);
    return filtered;
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

export async function createUser(data: { name: string; age: number; weight: number; height: number; code: string }): Promise<User> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const users = await getUsersFromFirestore();
  if (users.some((u: any) => u.code === data.code)) {
    throw new Error('El código ya está en uso.');
  }
  const user: User = {
    id,
    name: data.name,
    avatar: '',
    color: '#' + Math.floor(Math.random() * 16777215).toString(16),
    weight: [data.weight],
    weightDates: [now],
    createdAt: now,
    age: data.age,
    height: data.height,
    code: data.code,
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
