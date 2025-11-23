import React, { useState } from "react";
import { getAuth } from "firebase/auth";

export default function CreateStudentForm(){
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e){
    e.preventDefault();
    setBusy(true);
    try {
      const token = await getAuth().currentUser.getIdToken();
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/admin/students`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ firstName, lastName, email, phone })
      });
      if (!res.ok) throw new Error("Create failed");
      const { id } = await res.json();
      alert("Student created: " + id);
      setFirstName(""); setLastName(""); setEmail(""); setPhone("");
    } catch (e) {
      console.error(e);
      alert("Error creating student");
    } finally { setBusy(false); }
  }

  return (
    <div style={{border:"1px solid #eee", padding:12, borderRadius:6}}>
      <h3>Create Student</h3>
      <form onSubmit={submit}>
        <input placeholder="First name" value={firstName} onChange={e=>setFirstName(e.target.value)} required style={{width:"100%", padding:8, marginBottom:6}} />
        <input placeholder="Last name" value={lastName} onChange={e=>setLastName(e.target.value)} style={{width:"100%", padding:8, marginBottom:6}} />
        <input placeholder="Email" type="email" value={email} onChange={e=>setEmail(e.target.value)} style={{width:"100%", padding:8, marginBottom:6}} />
        <input placeholder="Phone" value={phone} onChange={e=>setPhone(e.target.value)} style={{width:"100%", padding:8, marginBottom:6}} />
        <button type="submit" disabled={busy}>{busy ? "Creating..." : "Create student"}</button>
      </form>
    </div>
  );
}
