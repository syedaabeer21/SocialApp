
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, FacebookAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";


const firebaseConfig = {
  apiKey: "AIzaSyAH8nnXumJGsVeIJdQrGgy1jRpwVBr5QCo",
  authDomain: "socialapp-da32c.firebaseapp.com",
  projectId: "socialapp-da32c",
  storageBucket: "socialapp-da32c.firebasestorage.app",
  messagingSenderId: "1048754439131",
  appId: "1:1048754439131:web:a07419c71dce8a2bc5ddfe"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const facebookProvider = new FacebookAuthProvider();
export const db = getFirestore(app);