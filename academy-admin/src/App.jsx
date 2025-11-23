import React, { useEffect, useState } from "react";
import Login from "./pages/login";
import Dashboard from "./pages/Dashboard";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";

export default function App(){
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async u => {
      setLoading(true);
      if (!u) {
        setUser(null);
        setIsAdmin(false);
        setLoading(false);
        return;
      }
      setUser(u);
      try {
        const tokenResult = await u.getIdTokenResult(true); // refresh
        const role = tokenResult.claims?.role;
        if (role === "admin") {
          setIsAdmin(true);
        } else {
          // not admin -> sign out immediately
          await auth.signOut();
          setIsAdmin(false);
          setUser(null);
          alert("Access denied: not an admin.");
        }
      } catch (e) {
        console.error("Token/claims error:", e);
        await auth.signOut();
        setUser(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  if (loading) return <div style={{padding:20}}>Loading...</div>;
  if (!user) return <Login />;
  if (user && isAdmin) return <Dashboard user={user} />;
  return null;
}
