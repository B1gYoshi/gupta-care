import { Calendar, momentLocalizer, View } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useState } from 'react';

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

const AppointmentCalendar = ({ events }: Props) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState<View>('week');

  const views: View[] = ['month', 'week', 'day'];

  return (
    // <div className="calendarContainer">
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
    // </div>
  );
};

export default AppointmentCalendar;
