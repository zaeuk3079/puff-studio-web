import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyC8kDrKi5EEzYWrw_Z7CjgmiJ5ZIOFRzDk",
  authDomain: "studio-9f44a.firebaseapp.com",
  projectId: "studio-9f44a",
  storageBucket: "studio-9f44a.firebasestorage.app",
  messagingSenderId: "570868650767",
  appId: "1:570868650767:web:559dfb282b8aee8ca2e47a"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
