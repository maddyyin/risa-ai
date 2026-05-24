import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Guard against empty strings from environment placeholders to prevent Next.js build-time prerender crashes
const isConfigEmpty = !process.env.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY.trim() === "";

const finalConfig = isConfigEmpty 
  ? {
      apiKey: "dummy-api-key-for-build",
      authDomain: "dummy-auth-domain.firebaseapp.com",
      projectId: "dummy-project-id",
    }
  : firebaseConfig;

const app = getApps().length > 0 ? getApp() : initializeApp(finalConfig);
export const auth = getAuth(app);
