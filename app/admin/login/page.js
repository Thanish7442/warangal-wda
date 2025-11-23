// app/admin/login/page.js  (paste into /mnt/data/page.js or into your next app)
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/firebase/config"; // adjust if your firebase client file is elsewhere

export default function AdminLogin() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const userCred = await signInWithEmailAndPassword(auth, form.email, form.password);
      const idToken = await userCred.user.getIdToken(true);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3000"}/admin/login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken })
      });

      if (!res.ok) {
        const txt = await res.text().catch(()=>res.statusText);
        throw new Error(txt || `Server login failed (${res.status})`);
      }

      router.push("/admin");
    } catch (err) {
      console.error("Login error:", err);
      setError(err.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <form onSubmit={handleLogin} style={{ width: 360, padding: 24, borderRadius: 8, boxShadow: '0 6px 20px rgba(0,0,0,0.08)' }}>
        <h2 style={{ marginBottom: 12 }}>Admin Login</h2>
        {error && <div style={{ color: 'crimson', marginBottom: 12 }}>{error}</div>}
        <input type="email" placeholder="Email" value={form.email} onChange={e=>setForm({...form, email: e.target.value})} required style={{ width: '100%', padding: 10, marginBottom: 10 }} />
        <input type="password" placeholder="Password" value={form.password} onChange={e=>setForm({...form, password: e.target.value})} required style={{ width: '100%', padding: 10, marginBottom: 16 }} />
        <button type="submit" disabled={loading} style={{ width: '100%', padding: 10 }}>{loading ? 'Signing in...' : 'Login'}</button>
      </form>
    </div>
  );
}
