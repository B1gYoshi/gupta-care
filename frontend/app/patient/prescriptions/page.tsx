// export default function Prescriptions() {
//     return <div>
//         <h1>This is the patient prescriptions page. The prescriptions will be displayed here</h1>
//     </div>;
// }
"use client";
import { useEffect, useState } from "react";

type Prescription = {
  medication_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  issued_at: string;
};

export default function Prescriptions() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);

  useEffect(() => {
    const fetchPrescriptions = async () => {
      const resp = await fetch("/api/prescriptions", {
        method: "GET",
        credentials: "include"
      });

      if (!resp.ok) {
        console.error("Failed to fetch prescriptions");
        return;
      }

      const data = await resp.json();
      setPrescriptions(data);
    };

    fetchPrescriptions();
  }, []);

  return (
    <div style={{
      display: "flex",
      justifyContent: "center",
      marginTop: "50px"
    }}>
      <div style={{
        backgroundColor: "white",
        padding: "30px",
        borderRadius: "12px",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
        width: "600px"
      }}>
        <h2 style={{ marginBottom: "20px", borderBottom: "1px solid #ccc", paddingBottom: "10px" }}>
          <b>Prescriptions</b>
        </h2>
        <ul style={{ listStyle: "none", padding: 0 }}>
          {prescriptions.length === 0 && <li>No prescriptions found.</li>}
          {prescriptions.map((p, idx) => (
            <li key={idx} style={{ marginBottom: "25px" }}>
              <b>{p.medication_name}</b>
              <ul style={{ marginTop: "5px", paddingLeft: "20px" }}>
                <li>{p.dosage}</li>
                <li>{p.frequency}</li>
                <li>{p.duration}</li>
                <li>Issued on: {new Date(p.issued_at).toLocaleDateString()}</li>
              </ul>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
