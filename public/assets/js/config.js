import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-analytics.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyAgf1Ct89GYa230gKP897YafCDgh6-c9h4",
    authDomain: "myblock-wad.firebaseapp.com",
    projectId: "myblock-wad",
    storageBucket: "myblock-wad.appspot.com",
    messagingSenderId: "76059073822",
    appId: "1:76059073822:web:d4772755748085f6f6bd0f",
    measurementId: "G-Z3RZGNRG3V"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

export { app, db };