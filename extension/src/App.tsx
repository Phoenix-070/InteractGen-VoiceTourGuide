import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import type { User } from "firebase/auth";

import { auth } from "./firebase";
import TourOverlay from "./components/TourOverlay";
import Login from "./auth/Login";
import Signup from "./auth/Signup";

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [showSignup, setShowSignup] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // 🔐 NOT LOGGED IN → SHOW AUTH SCREENS
  if (!user) {
    return showSignup ? (
      <Signup onSwitch={() => setShowSignup(false)} />
    ) : (
      <Login onSwitch={() => setShowSignup(true)} />
    );
  }

  // ✅ LOGGED IN → SHOW YOUR EXISTING APP
  return (
    <div className="App">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "10px 20px",
          borderBottom: "1px solid #ddd",
        }}
      >
        <p style={{ margin: 0 }}>Logged in as <b>{user.email}</b></p>
        <button onClick={() => signOut(auth)}>Logout</button>
      </div>

      <h1 style={{ textAlign: "center", marginTop: "30px", color: "#333" }}>
        InteractGen Voice Tour (Dev Mode)
      </h1>

      <p style={{ textAlign: "center", color: "#666" }}>
        This is the standalone view. In the extension, the overlay below is injected.
      </p>

      {/* 🔥 YOUR ORIGINAL TOUR OVERLAY — UNCHANGED */}
      <TourOverlay />
    </div>
  );
}

export default App;
