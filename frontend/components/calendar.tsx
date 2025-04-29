import { Calendar, momentLocalizer, View, Views } from 'react-big-calendar'
import 'react-big-calendar/lib/css/react-big-calendar.css';
import moment from 'moment'
import './calendar.css'
import { useMemo, useState } from 'react';


const localizer = momentLocalizer(moment) 

const AppointmentCalendar = (props: any) => {
    const [currentView, setCurrentView] = useState("week");
    const allowedViews: View[] = ['month', 'week', 'day'];
    
    const { views } = useMemo(() => {
        return {
          views: allowedViews,
        };
      }, []);
    
    return <div className='calendarContainer'>
        <Calendar
        localizer={localizer}
        startAccessor="start"
        endAccessor="end"
        views={views}
        view={currentView as View}
        onView={(view) => setCurrentView(view)}
        defaultView="week"
        />
    </div>
    
    
}

export default AppointmentCalendar;