"use client";
import './home.css'
import dynamic from 'next/dynamic'
import { useClinician } from "../layout";

const AppointmentCalendar = dynamic(() => import('../../../components/calendar'), { 
  ssr: false 
})

export default function Home() {
    const user = useClinician();
    return (
        <div className='calendarHolder'>
          <AppointmentCalendar/>
        </div>
    );
}