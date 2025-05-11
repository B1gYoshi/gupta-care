import { Calendar, momentLocalizer, View } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useEffect, useState } from 'react';
import './calendar.css'

import {
	Modal,
	Box,
	Button,
	Typography,
	TextField,
	Stack,
	FormControl,
	InputLabel,
	Select,
	MenuItem,
  } from '@mui/material';

const localizer = momentLocalizer(moment);

export type Event = {
  title: string,
  start: Date,
  end: Date,
  allDay?: boolean
  resource?: any,
}

type Props = {
  isClinician?: boolean;
};

const AppointmentCalendar = ({ isClinician }: Props) => {
	const [currentDate, setCurrentDate] = useState(new Date());
	const [currentView, setCurrentView] = useState<View>('week');
	
	const [appointmentTitle, setAppointmentTitle] = useState<String>('')
	const [patientEmail, setPatientEmail] = useState<String>('')
	const [appointmentStart, setAppointmentStart] = useState<String>('')

	const views: View[] = ['month', 'week', 'day'];

	const [openModal, setOpenModal] = useState(false);
	const [openResultModal, setOpenResultModal] = useState(false)

	const [appointmentStatus, setAppointmentStatus] = useState<Number>(0)
	const [appointmentCreationMessage, setAppointmentCreationMessage] = useState<String>('')

	const handleOpen = () => setOpenModal(true);
	const handleClose = () => setOpenModal(false);

	const handleResultModalClose = () => setOpenResultModal(false);

	const createAppointment = async (e: any) => {
		const resp = await fetch('/api/appointments', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			credentials: 'include',
			body: JSON.stringify({
				title: appointmentTitle,
				email: patientEmail,
				date: appointmentStart,
			}),
		})

		const data = await resp.json();

		setAppointmentStatus(resp.status)
		setAppointmentCreationMessage(data.message)

		setOpenResultModal(true)

		if (resp.ok) {
			setOpenModal(false)
		}
	}

	const [events, setEvents] = useState<Event[] | undefined>(undefined);
	const [selectedAppointment, setSelectedAppointment] = useState<string>('');

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

	const cancelAppointment = async () => {
		if (!selectedAppointment) {
		  return;
		}

		const resp = await fetch(`/api/appointments/cancel`, {
		  	method: 'DELETE',
		  	headers: {
			'Content-Type': 'application/json',
			},
			credentials: 'include',
			body: JSON.stringify({
				appointmentTitle: selectedAppointment
			}),
		});
	
		const data = await resp.json();
	
		setAppointmentStatus(resp.status);
		setAppointmentCreationMessage(data.message);
	
		setOpenResultModal(true);
	  }

    useEffect(() => {
		fetchAppointments()
    }, [openResultModal])

	return (
		<div className='calendarRoot'>
			{isClinician && (
				<div className='Cc'> 
					<button className='createButton' onClick={handleOpen}> Create Appointment Button </button>
				</div>
			)}
			<Box
				sx={{
					"display": "flex",
					"flex-direction": "row",
					"justify-content": "center",
					"align-items": "center",
					"padding-bottom": "15px"
				}}

			>
				<FormControl>
					<InputLabel >Select Appointment</InputLabel>
					<Select
					value={selectedAppointment}
					label="Select Appointment"
					onChange={(e) => setSelectedAppointment(e.target.value)}
					sx={{
						"height": "40px",
						"width": "150px"
					}}
					>
					{events?.map((event) => (
						<MenuItem key={event.title} value={event.title}>
							{event.title}
						</MenuItem>
					))}
					</Select>
				</FormControl>
				<Button
					variant="contained"
					onClick={cancelAppointment}
					sx={{
						"height": "40px"
					}}
				>
					Cancel Appointment
				</Button>
			</Box>
			<Calendar
				localizer={localizer}
				date={currentDate}
				onNavigate={(date) => setCurrentDate(date)} 
				view={currentView}
				onView={(view) => setCurrentView(view)}
				events={events}
				startAccessor="start"
				endAccessor="end"
				views={views}
				defaultView="week"
			/>
			<Modal open={openModal} onClose={handleClose}>
				<Box
				sx={{
					position: 'absolute',
					top: '50%',
					left: '50%',
					transform: 'translate(-50%, -50%)',
					bgcolor: 'background.paper',
					boxShadow: 24,
					p: 4,
					width: 400,
					borderRadius: 2,
				}}
				>
				<Typography variant="h6" gutterBottom>
					New Appointment
				</Typography>

					<Stack spacing={2}>
						<TextField
						label="Appointment Title"
						variant="outlined"
						fullWidth
						required
						onChange={(e) => setAppointmentTitle(e.target.value)}
						/>
						<TextField
						label="Patient Email"
						type="email"
						variant="outlined"
						fullWidth
						required
						onChange={(e) => setPatientEmail(e.target.value)}
						/>
						<TextField
						label="Start Date and Time"
						type="datetime-local"
						InputLabelProps={{ shrink: true }}
						fullWidth
						required
						onChange={(e) => setAppointmentStart(e.target.value)}
						/>

						<Button variant="contained" fullWidth onClick={createAppointment}>
							Create Appointment
						</Button>
					</Stack>
				</Box>
			</Modal>
			<Modal open={openResultModal} onClose={handleResultModalClose} >
				<Box
				sx={{
					position: 'absolute',
					top: '50%',
					left: '50%',
					transform: 'translate(-50%, -50%)',
					bgcolor: 'background.paper',
					boxShadow: 24,
					p: 4,
					width: 400,
					borderRadius: 2,
				}}>
					<div>{appointmentStatus.toString()}</div>
					<div>{appointmentCreationMessage}</div>
				</Box>
			</Modal>
		</div>
	);
};

export default AppointmentCalendar;
