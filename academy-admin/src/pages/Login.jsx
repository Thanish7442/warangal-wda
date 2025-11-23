// src/pages/Login.jsx
import React, { useState } from "react";
import { signInWithEmailAndPassword, sendPasswordResetEmail, getAuth } from "firebase/auth";
import { auth } from "../firebase";

function AdminLoginCard({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged in App.jsx will handle role check and redirect
      if (onLogin) onLogin(cred.user);
    } catch (err) {
      console.error("Login error:", err);
      // nicer message
      const msg = err?.code
        ? { "auth/wrong-password":"Incorrect password", "auth/user-not-found":"No account found", "auth/invalid-email":"Invalid email" }[err.code] || err.message
        : err.message;
      alert("Login failed: " + msg);
    } finally {
      setBusy(false);
    }
  }

  async function handleReset() {
    if (!email) return alert("Enter the admin email first to receive a reset link.");
    try {
      await sendPasswordResetEmail(auth, email);
      alert("Password reset email sent (check inbox).");
    } catch (err) {
      console.error(err);
      alert("Failed to send reset: " + (err.message || err.code));
    }
  }

  return (
    <form onSubmit={submit} className="max-w-md w-full bg-white p-8 rounded-lg shadow">
      <h2 className="text-2xl font-semibold mb-4">Admin Sign in</h2>

      <label className="block text-sm text-slate-700">Email</label>
      <input
        type="email"
        required
        value={email}
        onChange={(e)=>setEmail(e.target.value)}
        className="mt-1 mb-3 w-full border rounded px-3 py-2 outline-none focus:ring-2 focus:ring-sky-300"
        placeholder="admin@yourorg.com"
      />

      <label className="block text-sm text-slate-700">Password</label>
      <input
        type="password"
        required
        value={password}
        onChange={(e)=>setPassword(e.target.value)}
        className="mt-1 mb-3 w-full border rounded px-3 py-2 outline-none focus:ring-2 focus:ring-sky-300"
        placeholder="••••••••"
      />

      <div className="flex items-center justify-between text-sm mb-4">
        <div className="text-slate-600">Only admin accounts allowed</div>
        <button type="button" onClick={handleReset} className="text-sky-600 hover:underline">Forgot password?</button>
      </div>

      <button type="submit" disabled={busy} className="w-full py-2 rounded bg-sky-600 text-white hover:bg-sky-700 disabled:opacity-60">
        {busy ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}

export default function Login(){
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        <div className="hidden md:block p-6">
          <div className="text-3xl font-bold mb-4">Academy Admin</div>
          <p className="text-slate-600">
            This admin console is restricted. Only authorized admins can sign in and manage students & appointments.
            All actions are audited.
          </p>
          <ul className="mt-4 text-sm text-slate-600 space-y-1">
            <li>• Use a secure admin account (MFA recommended)</li>
            <li>• No student signups — admins create student records</li>
            <li>• All actions are logged with timestamps</li>
          </ul>
        </div>

        <div className="flex items-center justify-center">
          <AdminLoginCard />
        </div>
      </div>
    </div>
  );
}
