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
export const db = getFirestore(app); 