"use client";
import './home.css'
import dynamic from 'next/dynamic'

const AppointmentCalendar = dynamic(() => import('../../../components/calendar'), { 
  ssr: false 
})

export default function Home() {
    return (
        <div className='calendarHolder'>
          <AppointmentCalendar/>
        </div>
    );
}