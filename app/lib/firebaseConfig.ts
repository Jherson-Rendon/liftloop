<<<<<<< HEAD
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCgVfKyWCjpCOjRnyZ9Cf-YNYlQWmyDXs4",
  authDomain: "liftloop-1280c.firebaseapp.com",
  projectId: "liftloop-1280c",
  storageBucket: "liftloop-1280c.firebasestorage.app",
  messagingSenderId: "655970575150",
  appId: "1:655970575150:web:8508eac8846185313b90bf"
};

const app = initializeApp(firebaseConfig);
=======
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCgVfKyWCjpCOjRnyZ9Cf-YNYlQWmyDXs4",
  authDomain: "liftloop-1280c.firebaseapp.com",
  projectId: "liftloop-1280c",
  storageBucket: "liftloop-1280c.firebasestorage.app",
  messagingSenderId: "655970575150",
  appId: "1:655970575150:web:8508eac8846185313b90bf"
};

const app = initializeApp(firebaseConfig);
>>>>>>> 95a3c1246c1a6c9854832977ac51e3e27b33c307
export const db = getFirestore(app); 