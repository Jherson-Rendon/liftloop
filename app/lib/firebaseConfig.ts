import { initializeApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCgVfKyWCjpCOjRnyZ9Cf-YNYlQWmyDXs4",
  authDomain: "liftloop-1280c.firebaseapp.com",
  projectId: "liftloop-1280c",
  storageBucket: "liftloop-1280c.firebasestorage.app",
  messagingSenderId: "655970575150",
  appId: "1:655970575150:web:8508eac8846185313b90bf"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Enable persistence only in the browser
if (typeof window !== "undefined") {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      // Multiple tabs open, persistence can only be enabled in one tab at a a time.
      console.warn('Firestore persistence failed-precondition: Multiple tabs open');
    } else if (err.code === 'unimplemented-state') {
      // The current browser does not support all of the features required to enable persistence
      console.warn('Firestore persistence unimplemented-state: Browser not supported');
    }
  });
}