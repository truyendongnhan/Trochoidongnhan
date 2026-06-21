import { initializeApp } from 'firebase/app';
import { 
  initializeAuth, 
  browserLocalPersistence, 
  browserSessionPersistence, 
  inMemoryPersistence,
  getAuth,
  GoogleAuthProvider, 
  signInWithRedirect, 
  signOut,
  getRedirectResult
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth with multiple persistence fallbacks to prevent rendering crashes
let authInstance: any;
try {
  authInstance = initializeAuth(app, {
    persistence: [browserLocalPersistence, browserSessionPersistence, inMemoryPersistence]
  });
} catch (e) {
  console.warn("Standard Auth persistent initialization error, trying traditional getAuth:", e);
  try {
    authInstance = getAuth(app);
  } catch (err) {
    console.warn("Critical: getAuth failed due to sandbox constraints. Initializing in-memory Auth:", err);
    try {
      authInstance = initializeAuth(app, {
        persistence: inMemoryPersistence
      });
    } catch (finalErr) {
      console.error("All Firebase Auth initialization methods failed:", finalErr);
    }
  }
}

export const auth = authInstance;
export const db = getFirestore(app);

const googleProvider = new GoogleAuthProvider();

// Automatically listen and handle redirect auth result upon page load
if (auth) {
  getRedirectResult(auth)
    .then((result) => {
      if (result) {
        console.log('Successfully captured authenticated user from redirect:', result.user);
      }
    })
    .catch((error) => {
      console.warn('Redirect auth result resolved with error or no active state:', error);
    });
}

export const signInWithGoogle = async () => {
  if (!auth) {
    throw new Error("Authentication utility is not initialized due to browser restrictions.");
  }
  try {
    // Attempt the redirect method
    await signInWithRedirect(auth, googleProvider);
  } catch (error) {
    console.warn('Authentication redirect failed (blocked or unsupported), attempting popup fallback...', error);
    try {
      // Lazy load standard popup flow as fallback
      const { signInWithPopup } = await import('firebase/auth');
      const result = await signInWithPopup(auth, googleProvider);
      return result.user;
    } catch (popupErr) {
      console.error('All authentication methods (redirect and popup) failed:', popupErr);
      throw popupErr;
    }
  }
};

export const logout = async () => {
  if (!auth) return;
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Error signing out', error);
    throw error;
  }
};
