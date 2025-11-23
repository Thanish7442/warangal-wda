"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebaseClient";

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(user => {
      if (!user) {
        router.push("/admin/login");
      } else {
        setLoading(false);
      }
    });

    return () => unsub();
  }, []);

  if (loading) return <p>Loading...</p>;

  return (
    <div style={{ padding: 30 }}>
      <h1>Admin Dashboard</h1>

      <button onClick={() => auth.signOut().then(() => router.push("/admin/login"))}>
        Logout
      </button>

      <h2 style={{ marginTop: 30 }}>Appointments</h2>
      <Appointments />

      <h2 style={{ marginTop: 30 }}>Students</h2>
      <Students />
    </div>
  );
}

function Appointments() {
  const [items, setItems] = useState([]);

  async function load() {
    const token = await auth.currentUser.getIdToken();
    const res = await fetch("http://localhost:8080/admin/appointments", {
      headers: { Authorization: `Bearer ${token}` }
    });
    setItems(await res.json());
  }

  useEffect(() => { load(); }, []);

  return (
    <ul>
      {items.map(a => (
        <li key={a.id}>{a.studentName} — {a.status}</li>
      ))}
    </ul>
  );
}

function Students() {
  const [items, setItems] = useState([]);

  async function load() {
    const token = await auth.currentUser.getIdToken();
    const res = await fetch("http://localhost:8080/admin/students", {
      headers: { Authorization: `Bearer ${token}` }
    });
    setItems(await res.json());
  }

  useEffect(() => { load(); }, []);

  return (
    <ul>
      {items.map(s => (
        <li key={s.id}>{s.firstName} {s.lastName}</li>
      ))}
    </ul>
  );
}
