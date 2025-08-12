import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy, serverTimestamp, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyB87ScF-Wh9BuHPXNsI_oL_9GpZE8DiRbc",
  authDomain: "prisum-air-systems.firebaseapp.com",
  projectId: "prisum-air-systems",
  storageBucket: "prisum-air-systems.firebasestorage.app",
  messagingSenderId: "49665517905",
  appId: "1:49665517905:web:64c0174b20bfdbb22e0b70"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
export { db, collection, addDoc, getDocs, query, orderBy, serverTimestamp, onSnapshot };


