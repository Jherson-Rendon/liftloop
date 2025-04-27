import React, { useEffect } from "react";
import { getUsersFromFirestore } from "~/lib/storage";

export default function TestFirestore() {
  useEffect(() => {
    getUsersFromFirestore().then(users => {
      console.log("Usuarios desde Firestore:", users);
    });
  }, []);
  return null;
}