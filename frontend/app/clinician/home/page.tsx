"use client";
import './home.css'
import dynamic from 'next/dynamic'
import { useClinician } from "../layout";
import usePatient from "../layout";
import PatientSearch from "../patientSearch/page";
import { useEffect, useState } from 'react';
import { Event } from '../../../components/calendar'

const AppointmentCalendar = dynamic(() => import('../../../components/calendar'), { 
  ssr: false 
})

export default function Home() {
    const user = useClinician();
    

    return (
        <div className='calendarHolder'>
          <AppointmentCalendar isClinician/>
        </div>
    );
}