"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import './patientSearch.css';
import { useClinician } from "../layout";

type Patient = {
  user_id: number;
  full_name: string;
  email: string;
};

export default function PatientSearch() {
  const router = useRouter();
  const user = useClinician();
  const [query, setQuery] = useState("");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) {
      setPatients([]);
      return;
    }
    setLoading(true);
    try {
      const resp = await fetch(`/api/patients?q=${encodeURIComponent(query)}`, {
        credentials: "include",
      });
      if (resp.ok) {
        setPatients(await resp.json());
      } else {
        console.error("Patient search failed");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="patient-search">
      <h2>Clinician Patient Search</h2>
      <div className="search-controls">
        <input
          type="text"
          placeholder="Enter name or email"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <button onClick={handleSearch} disabled={loading}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {loading && <p>Loading results...</p>}

      {!loading && patients.length === 0 && <p>No patients found.</p>}

      {!loading && patients.length > 0 && (
        <table className="patient-table">
          <thead>
            <tr>
              <th>Full Name</th>
              <th>Email</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {patients.map((p) => (
              <tr key={p.user_id}>
                <td>{p.full_name}</td>
                <td>{p.email}</td>
                <td>
                <button
                    onClick={() => router.push(`/clinician/prescriptions/${p.user_id}`)}
                  >
                    View Prescriptions
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
