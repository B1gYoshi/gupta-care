import { Calendar, momentLocalizer, View } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useState } from 'react';
import './calendar.css'

import {
	Modal,
	Box,
	Button,
	Typography,
	TextField,
	Stack,
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
  events?: Event[];
  isClinician?: boolean;
};

const AppointmentCalendar = ({ events, isClinician }: Props) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState<View>('week');
  
  const [appointmentTitle, setAppointmentTitle] = useState<String>('')
  const [patientEmail, setPatientEmail] = useState<String>('')
  const [appointmentStart, setAppointmentStart] = useState<String>('')

  const views: View[] = ['month', 'week', 'day'];

  const [openModal, setOpenModal] = useState(false);

  const handleOpen = () => setOpenModal(true);
  const handleClose = () => setOpenModal(false);

  const createAppointment = async (e: any) => {
	console.log("Creating appointment")
	setOpenModal(false)
  }

  return (
    <div className='calendarRoot'>
		{isClinician && (
			<div className='Cc'> 
				<button className='createButton' onClick={handleOpen}> Create Appointment Button </button>
			</div>
		)}
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
    </div>
  );
};

export default AppointmentCalendar;
