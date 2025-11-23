import React from "react";
import StudentsList from "../components/StudentsList";
import CreateStudentForm from "../components/CreateStudentForm";
import AppointmentsList from "../components/AppointmentsList";
import CreateAppointmentForm from "../components/CreateAppointmentForm";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";

export default function Dashboard({ user }) {
  return (
    <div className="min-h-screen p-6 max-w-7xl mx-auto">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Academy Admin Dashboard</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-600">{user.email}</span>
          <button
            onClick={() => signOut(auth)}
            className="px-3 py-1 rounded-md border hover:bg-slate-100"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 space-y-6">
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-medium">Students</h2>
            </div>
            <StudentsList />
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-medium">Appointments</h2>
            </div>
            <AppointmentsList />
          </div>
        </section>

        <aside className="space-y-6">
          <div className="card">
            <h3 className="font-medium mb-3">Create Student</h3>
            <CreateStudentForm />
          </div>

          <div className="card">
            <h3 className="font-medium mb-3">Create Appointment</h3>
            <CreateAppointmentForm />
          </div>
        </aside>
      </main>
    </div>
  );
}
