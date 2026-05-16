import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect,
  signOut, 
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  getRedirectResult
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Asegurar persistencia local
setPersistence(auth, browserLocalPersistence).catch(err => console.error("Persistence error:", err));

export const googleProvider = new GoogleAuthProvider();
// Forzar el prompt de selección de cuenta si es necesario
googleProvider.setCustomParameters({ prompt: 'select_account' });

export const signInWithGoogle = async () => {
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  
  // En modo PWA standalone, el redirect es obligatorio
  if (isStandalone) {
    try {
      return await signInWithRedirect(auth, googleProvider);
    } catch (error) {
      console.error("Error redirect standalone:", error);
      throw error;
    }
  }

  // En navegadores normales (PC o Móvil), intentamos popup primero
  // Si falla o es bloqueado, usamos redirect como respaldo
  try {
    return await signInWithPopup(auth, googleProvider);
  } catch (error: any) {
    console.warn("Popup blocked or failed, falling back to redirect...", error);
    if (error.code === 'auth/popup-blocked' || error.code === 'auth/cancelled-popup-request' || isMobile) {
      return await signInWithRedirect(auth, googleProvider);
    }
    throw error;
  }
};

export { getRedirectResult };
export const logout = () => signOut(auth);
