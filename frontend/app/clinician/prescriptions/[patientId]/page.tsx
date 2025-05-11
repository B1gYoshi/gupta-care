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

  // fetch list
  useEffect(() => {
    (async () => {
      const res = await fetch(
        `/api/patient/${patientId}/prescriptions`,
        { credentials: "include" }
      );
      if (res.ok) setPrescriptions(await res.json());
    })();
  }, [patientId]);

  // submit new
  const handleSubmit = async () => {
    const res = await fetch(
      `/api/patient/${patientId}/prescriptions`,
      {
        method:      "POST",
        headers:     { "Content-Type": "application/json" },
        credentials: "include",
        body:        JSON.stringify(form),
      }
    );
    if (res.ok) {
      setForm({ medication_name: "", dosage: "", frequency: "", duration: "" });
      // refresh
      const updated = await fetch(
        `/api/patient/${patientId}/prescriptions`,
        { credentials: "include" }
      );
      setPrescriptions(await updated.json());
    }
  };

  return (
    <div
      style={{
        display:       "flex",
        justifyContent:"center",
        marginTop:     "50px",
      }}
    >
      <div
        style={{
          backgroundColor:"white",
          padding:        "30px",
          borderRadius:   "12px",
          boxShadow:      "0 4px 12px rgba(0,0,0,0.15)",
          width:           "100%",
          maxWidth:        "800px",
        }}
      >
        <h2
          style={{
            marginBottom:    "20px",
            borderBottom:    "1px solid #ccc",
            paddingBottom:   "10px",
          }}
        >
          Prescriptions
        </h2>

        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {prescriptions.length === 0 && <li>No prescriptions found.</li>}
          {prescriptions.map((p) => (
            <li key={p.prescription_id} style={{ marginBottom: "25px" }}>
              <b>{p.medication_name}</b>
              <ul style={{ marginTop: "5px", paddingLeft: "20px" }}>
                <li>{p.dosage}</li>
                <li>{p.frequency}</li>
                <li>{p.duration}</li>
                <li>
                  Issued on:{" "}
                  {new Date(p.issued_at).toLocaleDateString()}
                </li>
              </ul>
            </li>
          ))}
        </ul>

        <h3
          style={{
            marginTop:     "30px",
            borderTop:     "1px solid #eee",
            paddingTop:    "15px",
          }}
        >
          Add New Prescription
        </h3>

        <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
          <input
            style={{ flex: 2, padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
            placeholder="Medication Name"
            value={form.medication_name}
            onChange={(e) =>
              setForm((f) => ({ ...f, medication_name: e.target.value }))
            }
          />
          <input
            style={{ flex: 1, padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
            placeholder="Dosage"
            value={form.dosage}
            onChange={(e) =>
              setForm((f) => ({ ...f, dosage: e.target.value }))
            }
          />
          <input
            style={{ flex: 1, padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
            placeholder="Frequency"
            value={form.frequency}
            onChange={(e) =>
              setForm((f) => ({ ...f, frequency: e.target.value }))
            }
          />
          <input
            style={{ flex: 1, padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
            placeholder="Duration"
            value={form.duration}
            onChange={(e) =>
              setForm((f) => ({ ...f, duration: e.target.value }))
            }
          />
        </div>
        <button
          onClick={handleSubmit}
          style={{
            marginTop:     "15px",
            padding:       "10px 20px",
            border:        "none",
            borderRadius:  "4px",
            backgroundColor:"#1976d2",
            color:         "white",
            cursor:        "pointer",
          }}
        >
          Add Prescription
        </button>
      </div>
    </div>
  );
}
