"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebaseClient";

export default function AdminNav() {
  const router = useRouter();

  async function logout() {
    try {
      // Clear server session cookie
      await fetch(`${process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080"}/sessionLogout`, {
        method: "POST",
        credentials: "include"
      });
    } catch (err) {
      console.warn("sessionLogout failed", err);
    }
    try { await signOut(auth); } catch (e) {}
    router.push("/admin/login");
  }

  return (
    <nav style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
      <button onClick={() => router.push("/admin/dashboard")}>Dashboard</button>
      <button onClick={logout}>Logout</button>
    </nav>
  );
}
