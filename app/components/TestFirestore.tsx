<<<<<<< HEAD
import React, { useEffect } from "react";
import { getUsersFromFirestore } from "~/lib/storage";

export default function TestFirestore() {
  useEffect(() => {
    getUsersFromFirestore().then(users => {
      console.log("Usuarios desde Firestore:", users);
    });
  }, []);
  return <div>Revisa la consola para ver los usuarios de Firestore.</div>;
=======
import React, { useEffect } from "react";
import { getUsersFromFirestore } from "~/lib/storage";

export default function TestFirestore() {
  useEffect(() => {
    getUsersFromFirestore().then(users => {
      console.log("Usuarios desde Firestore:", users);
    });
  }, []);
  return <div>Revisa la consola para ver los usuarios de Firestore.</div>;
>>>>>>> 95a3c1246c1a6c9854832977ac51e3e27b33c307
} 