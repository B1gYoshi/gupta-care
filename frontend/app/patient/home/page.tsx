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
	const [events, setEvents] = useState<Event[] | undefined>(undefined);

	const fetchAppointments = async () => {
		try {
			const resp = await fetch('/api/appointments', {
				method: 'GET',
				credentials: 'include',
			});

			if (!resp.ok) {

				console.log("Bad response: " + resp.statusText)
				throw new Error;
			}

			const data = await resp.json();
			// console.log(data)
			setEvents(data.map((dbEvent: any): Event => {

				const startTime = new Date(dbEvent.appointment_datetime)

				return {
					title: dbEvent.reason,
					start: startTime,
					end: new Date(startTime.getTime() + 60 * 60 * 1000)
				}

			}))

		} catch (err) {
			console.log(err)
		}
	}

    useEffect(() => {
		fetchAppointments()
    }, [])

    return (
        <div className='calendarHolder'>
          	<AppointmentCalendar events={events} isClinician={false}/>
        </div>
    );
}