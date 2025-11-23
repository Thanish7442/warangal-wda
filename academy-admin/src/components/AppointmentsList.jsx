// src/components/AppointmentsList.jsx
import React, { useEffect, useState, useMemo } from "react";
import { getAuth } from "firebase/auth";
import { format } from "date-fns";

function usePaged(items, pageSize, search) {
  const filtered = useMemo(() => {
    if (!search) return items;
    const q = search.toLowerCase();
    return items.filter(it =>
      `${it.studentName || ""} ${it.notes || ""} ${it.status || ""}`.toLowerCase().includes(q)
    );
  }, [items, search]);

  const total = filtered.length;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  return { filtered, total, pages };
}

export default function AppointmentsList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 6;

  useEffect(() => {
    let mounted = true;
    async function fetchAppts() {
      setLoading(true);
      try {
        const token = await getAuth().currentUser.getIdToken();
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/admin/appointments`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch appointments");
        const data = await res.json();
        // normalize date
        data.forEach(d => {
          if (d.dateTime) d._date = new Date(d.dateTime._seconds ? d.dateTime._seconds * 1000 : d.dateTime);
          else d._date = null;
        });
        if (mounted) setItems(data);
      } catch (e) {
        console.error(e);
        alert("Error fetching appointments");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchAppts();
    return () => (mounted = false);
  }, []);

  const { filtered, total, pages } = usePaged(items, pageSize, search);

  useEffect(() => {
    if (page > pages) setPage(pages);
  }, [pages]);

  const start = (page - 1) * pageSize;
  const pageItems = filtered.slice(start, start + pageSize);

  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search by student, notes, status..."
          className="flex-1 border rounded px-3 py-2"
        />
        <button onClick={() => { setSearch(""); setPage(1); }} className="px-3 py-2 border rounded">Clear</button>
      </div>

      {loading ? <div>Loading appointments...</div> : (
        <>
          <div className="space-y-3">
            {pageItems.length === 0 ? <div className="text-sm text-slate-500">No appointments</div> :
              pageItems.map(a => (
                <div key={a.id || (a.studentId + a.dateTime)} className="p-3 bg-white rounded shadow-sm flex items-start justify-between">
                  <div>
                    <div className="font-medium">{a.studentName || "—"}</div>
                    <div className="text-sm text-slate-600">{a.notes}</div>
                    <div className="text-xs text-slate-500 mt-1">
                      {a._date ? format(a._date, "PPP p") : "Date not set"} • <span className="capitalize">{a.status}</span>
                    </div>
                  </div>
                  <div className="text-sm text-right">
                    <div className="text-slate-500">Created by</div>
                    <div>{a.createdBy || "admin"}</div>
                  </div>
                </div>
              ))
            }
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-slate-600">Showing {Math.min(total, start + 1)}–{Math.min(total, start + pageSize)} of {total}</div>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 border rounded disabled:opacity-50">Prev</button>
              <div className="px-3 py-1 border rounded">{page} / {pages}</div>
              <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages} className="px-3 py-1 border rounded disabled:opacity-50">Next</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
