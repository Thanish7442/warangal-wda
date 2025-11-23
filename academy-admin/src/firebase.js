// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAKNrFbcvOibJf3JGcVrpco9phawstax4s",
  authDomain: "warangal-defence-academy-18af8.firebaseapp.com",
  projectId: "warangal-defence-academy-18af8",
};
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export default app;