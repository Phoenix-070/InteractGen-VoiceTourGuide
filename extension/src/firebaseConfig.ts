export const firebaseConfig = {
    apiKey: "AIzaSyCj6qaPfaT8_1xhKFOO5qcYNtIh9Concag",
    authDomain: "interactgen-voicetour.firebaseapp.com",
    projectId: "interactgen-voicetour",
    storageBucket: "interactgen-voicetour.firebasestorage.app",
    messagingSenderId: "893679827888",
    appId: "1:893679827888:web:24602f5875132c08bab475"
};

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
