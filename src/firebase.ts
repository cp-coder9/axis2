// Firebase configuration
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Debug environment variables
console.log('Firebase Environment Variables:', {
  apiKey: import.meta.env.VITE_API_KEY ? '***configured***' : 'missing',
  authDomain: import.meta.env.VITE_AUTH_DOMAIN || 'missing',
  projectId: import.meta.env.VITE_PROJECT_ID || 'missing',
  storageBucket: import.meta.env.VITE_STORAGE_BUCKET || 'missing',
  messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID || 'missing',
  appId: import.meta.env.VITE_APP_ID ? '***configured***' : 'missing'
});

const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY || "demo-api-key",
  authDomain: import.meta.env.VITE_AUTH_DOMAIN || "demo-project.firebaseapp.com",
  projectId: import.meta.env.VITE_PROJECT_ID || "demo-project",
  storageBucket: import.meta.env.VITE_STORAGE_BUCKET || "demo-project.appspot.com",
  messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID || "123456789",
  appId: import.meta.env.VITE_APP_ID || "1:123456789:web:abcdef"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;