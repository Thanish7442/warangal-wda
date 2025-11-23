// src/components/Login.jsx
import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await userCred.user.getIdToken(/* forceRefresh */ true);

      // Send token to backend to create session or be used for API calls
      const res = await fetch("http://localhost:3000/sessionLogin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ idToken })
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to create session");
      }

      const data = await res.json();
      // data might contain user info, session cookie info, or server token
      // Save what you need (e.g., user info in state)
      onLoginSuccess?.(data);
    } catch (error) {
      setErr(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto">
      <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" />
      <input value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" type="password"/>
      <button type="submit" disabled={loading}>{loading ? "Signing in..." : "Sign in"}</button>
      {err && <div className="text-red-500">{err}</div>}
    </form>
  );
}
