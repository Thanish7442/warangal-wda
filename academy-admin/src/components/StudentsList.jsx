// src/components/StudentsList.jsx
import React, { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";

export default function StudentsList() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  async function fetchStudents() {
    setLoading(true);
    try {
      const token = await getAuth().currentUser.getIdToken();
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/admin/students`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setStudents(data);
    } catch (e) {
      console.error(e);
      alert("Error fetching students");
    } finally { setLoading(false); }
  }

  useEffect(() => { fetchStudents(); }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm text-slate-600">{students.length} students</div>
        <div>
          <button onClick={fetchStudents} className="px-2 py-1 border rounded text-sm">Refresh</button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {loading ? <div>Loading...</div> :
          students.length === 0 ? <div className="text-sm text-slate-500">No students yet</div> :
            students.map(s => (
              <div key={s.id} className="p-3 bg-white rounded shadow-sm">
                <div className="font-medium">{s.firstName} {s.lastName}</div>
                <div className="text-xs text-slate-500">{s.email || s.phone || "—"}</div>
                <div className="text-xs mt-2 text-slate-600">Course: {s.course || "—"}</div>
                <div className="text-xs text-slate-400 mt-1">Created by: {s.createdBy || "admin"}</div>
              </div>
            ))
        }
      </div>
    </div>
  );
}
