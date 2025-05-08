"use client";
import './home.css'
import dynamic from 'next/dynamic'
import { usePatient } from "../layout";
import { useEffect, useState } from 'react';
import { Event } from '../../../components/calendar'

const AppointmentCalendar = dynamic(() => import('../../../components/calendar'), { 
  	ssr: false 
})

export default function Home() {
    const user = usePatient();

    return (
        <div className='calendarHolder'>
          	<AppointmentCalendar isClinician={false}/>
        </div>
    );
}