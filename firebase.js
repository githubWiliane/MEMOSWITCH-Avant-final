
import { initializeApp } from "firebase/app";
import { getDatabase, ref,onValue } from "firebase/database";
import "firebase/database";
 


// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAVZNc6iwoI852OjMPuxnLttZhfJmqdljM",
    authDomain: "esp32reactnative.firebaseapp.com",
    projectId: "esp32reactnative",
    storageBucket: "esp32reactnative.firebasestorage.app",
    messagingSenderId: "659993136207",
    appId: "1:659993136207:web:e4060bf044cd56a5482e3a"
  };
  

  // Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase()

export {db, ref, onValue}
