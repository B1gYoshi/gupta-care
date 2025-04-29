import { Calendar, momentLocalizer } from 'react-big-calendar'
import 'react-big-calendar/lib/css/react-big-calendar.css';
import moment from 'moment'
import './calendar.css'

// Setup the localizer by providing the moment (or globalize, or Luxon) Object
// to the correct localizer.
const localizer = momentLocalizer(moment) // or globalizeLocalizer

const AppointmentCalendar = (props: any) => (
    <div className='calendarContainer'>
        <Calendar
        localizer={localizer}
        startAccessor="start"
        endAccessor="end"
        />
    </div>
    
    
)

export default AppointmentCalendar;