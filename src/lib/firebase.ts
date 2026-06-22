import { initializeApp, getApps } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import {
  getDatabase,
  ref,
  set,
  get,
  push,
  remove,
} from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyCSP078ufDdqBS1wM_Sj30F_xr5z-m9gYM",
  authDomain: "omniapi-a3e65.firebaseapp.com",
  databaseURL: "https://omniapi-a3e65-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "omniapi-a3e65",
  storageBucket: "omniapi-a3e65.firebasestorage.app",
  messagingSenderId: "856198970756",
  appId: "1:856198970756:web:f26a9a107fadcb14b6b1d1",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const database = getDatabase(app);

export {
  app,
  auth,
  database,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  onAuthStateChanged,
  ref,
  set,
  get,
  push,
  remove,
};

export type { User };
