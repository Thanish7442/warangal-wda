// src/components/CreateAppointmentForm.jsx
import React, { useState, useEffect } from "react";
import { getAuth } from "firebase/auth";

export default function CreateAppointmentForm() {
  const [studentId, setStudentId] = useState("");
  const [studentName, setStudentName] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");
  const [students, setStudents] = useState([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // fetch students for dropdown
    let mounted = true;
    async function fetchStudents() {
      try {
        const token = await getAuth().currentUser.getIdToken();
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/admin/students`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch students");
        const data = await res.json();
        if (mounted) setStudents(data);
      } catch (e) {
        console.error(e);
      }
    }
    fetchStudents();
    return () => (mounted = false);
  }, []);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const dt = new Date(`${date}T${time}`);
      const token = await getAuth().currentUser.getIdToken();
      const payload = {
        studentId: studentId || null,
        studentName: studentName || (students.find(s => s.id === studentId)?.firstName ?? "") + " " + (students.find(s => s.id === studentId)?.lastName ?? ""),
        dateTime: dt.toISOString(),
        notes,
      };
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/admin/appointments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed");
      }
      const { id } = await res.json();
      alert("Appointment created: " + id);
      setStudentId(""); setStudentName(""); setDate(""); setTime(""); setNotes("");
    } catch (err) {
      console.error(err);
      alert("Error creating appointment: " + (err.message || err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <label className="block text-sm">Student</label>
      <select
        value={studentId}
        onChange={(e) => setStudentId(e.target.value)}
        className="w-full border rounded px-2 py-1"
      >
        <option value="">-- select student --</option>
        {students.map(s => (
          <option key={s.id} value={s.id}>
            {s.firstName} {s.lastName} {s.admissionNo ? `(${s.admissionNo})` : ""}
          </option>
        ))}
      </select>

      <div>
        <label className="block text-sm">Or type student name</label>
        <input
          value={studentName}
          onChange={(e) => setStudentName(e.target.value)}
          placeholder="If student not in list"
          className="w-full border rounded px-2 py-1"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-sm">Date</label>
          <input value={date} onChange={e => setDate(e.target.value)} type="date" className="w-full border rounded px-2 py-1" required />
        </div>
        <div>
          <label className="block text-sm">Time</label>
          <input value={time} onChange={e => setTime(e.target.value)} type="time" className="w-full border rounded px-2 py-1" required />
        </div>
      </div>

      <div>
        <label className="block text-sm">Notes</label>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full border rounded px-2 py-1" />
      </div>

      <div className="flex justify-end">
        <button type="submit" disabled={busy} className="px-4 py-2 bg-sky-600 text-white rounded hover:bg-sky-700 disabled:opacity-60">
          {busy ? "Creating..." : "Create Appointment"}
        </button>
      </div>
    </form>
  );
}
