import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyDfpFSr5Qpfb3lDGiRprTCorW448Xag2js",
  authDomain: "ava-dfs-dfcb9.firebaseapp.com",
  projectId: "ava-dfs-dfcb9",
  storageBucket: "ava-dfs-dfcb9.firebasestorage.app",
  messagingSenderId: "178222076928",
  appId: "1:178222076928:web:99e9f01bf3dfef1f8074e5",
  measurementId: "G-251MR7CYWJ"
};

const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export default app;
