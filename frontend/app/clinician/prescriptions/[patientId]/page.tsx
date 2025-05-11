"use client";

import { useEffect, useState } from "react";
import { useParams }      from "next/navigation";

type Presc = {
  prescription_id: number;
  medication_name: string;
  dosage:          string;
  frequency:       string;
  duration:        string;
  issued_at:       string;
};

export default function PatientPrescriptions() {
  const { patientId } = useParams();
  const [prescriptions, setPrescriptions] = useState<Presc[]>([]);
  const [form, setForm] = useState({
    medication_name: "",
    dosage:          "",
    frequency:       "",
    duration:        "",
  });

  const fetchPrescriptions = async () => {
    const res = await fetch(
      `/api/patient/${patientId}/prescriptions`,
      { credentials: "include" }
    );
    if (res.ok) setPrescriptions(await res.json());
  };

  useEffect(() => {
    fetchPrescriptions();
  }, [patientId]);

  const handleSubmit = async () => {
    const res = await fetch(
      `/api/patient/${patientId}/prescriptions`,
      {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body:    JSON.stringify(form),
      }
    );
    if (res.ok) {
      setForm({ medication_name: "", dosage: "", frequency: "", duration: "" });
      fetchPrescriptions();
    }
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h2>Prescriptions for Patient #{patientId}</h2>

      <ul>
        {prescriptions.map((p) => (
          <li key={p.prescription_id}>
            <strong>{p.medication_name}</strong> — {p.dosage}, {p.frequency},{ " " }
            {p.duration}
          </li>
        ))}
      </ul>

      <h3>Add New Prescription</h3>
      <input
        placeholder="Medication Name"
        value={form.medication_name}
        onChange={(e) =>
          setForm((f) => ({ ...f, medication_name: e.target.value }))
        }
      />
      <input
        placeholder="Dosage"
        value={form.dosage}
        onChange={(e) => setForm((f) => ({ ...f, dosage: e.target.value }))}
      />
      <input
        placeholder="Frequency"
        value={form.frequency}
        onChange={(e) =>
          setForm((f) => ({ ...f, frequency: e.target.value }))
        }
      />
      <input
        placeholder="Duration"
        value={form.duration}
        onChange={(e) =>
          setForm((f) => ({ ...f, duration: e.target.value }))
        }
      />
      <button onClick={handleSubmit}>Add Prescription</button>
    </div>
  );
}
