"use client";
import './home.css'
import dynamic from 'next/dynamic'
import { useClinician } from "../layout";
import usePatient from "../layout";
import PatientSearch from "../patientSearch/page";

const AppointmentCalendar = dynamic(() => import('../../../components/calendar'), { 
  ssr: false 
})

export default function Home() {
  const user = useClinician();
  return (
    <>
      {user.role === "clinician" && <PatientSearch />}
      <div className="calendarHolder">
        <AppointmentCalendar />
      </div>
    </>
  );
}