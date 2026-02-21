import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyCR3W8yD88Zsf6YOaIK3CP-ebRdqpE8lZc",
  authDomain: "novavoiceassitant.firebaseapp.com",
  databaseURL: "https://novavoiceassitant-default-rtdb.firebaseio.com",
  projectId: "novavoiceassitant",
  storageBucket: "novavoiceassitant.firebasestorage.app",
  messagingSenderId: "586699150875",
  appId: "1:586699150875:web:763cc33bf585092f9ccabe",
  measurementId: "G-2HJ8D8FH14"
};

const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);
