// Import the functions you need from the SDKs you need
import { initializeApp, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBs12hLM_wu0C62E3Xfbk6dQfAXNJUezgQ",
  authDomain: "suspect-information.firebaseapp.com",
  databaseURL: "https://suspect-information-default-rtdb.firebaseio.com",
  projectId: "suspect-information",
  storageBucket: "suspect-information.appspot.com",
  messagingSenderId: "675645868095",
  appId: "1:675645868095:web:e9e5aafa10c3da6e78908a",
  measurementId: "G-FHEP6RFWJ8"
};

// Initialize Firebase
const app: FirebaseApp = initializeApp(firebaseConfig);
const db: Firestore = getFirestore(app);
const storage: FirebaseStorage = getStorage(app);
// Removed: let auth: Auth;


export { app, db, storage }; // Removed auth export
