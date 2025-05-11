import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AppointmentCalendar from '../components/calendar';
import '@testing-library/jest-dom';
import { useRouter } from 'next/navigation';


const mockedUseRouter = useRouter as jest.Mock;


jest.mock('next/navigation', () => ({
    useRouter: jest.fn(),
  }));


jest.mock('react-big-calendar', () => ({
  Calendar: ({ events, ...props }: any) => (
    <div data-testid="calendar-mock">Calendar Component</div>
  ),
  momentLocalizer: () => jest.fn(),
  Views: { MONTH: 'month', WEEK: 'week', DAY: 'day' },
}));

describe('AppointmentCalendar Component', () => {
    beforeEach(() => {

        mockedUseRouter.mockReturnValue({ push: jest.fn() });
        global.fetch = jest.fn(() =>
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ role: 'patient' }),
          })
        ) as jest.Mock;
      });
    
      afterEach(() => {
        jest.clearAllMocks();
      }); 

    test('opens modal with form when create appointment button is clicked', async () => {
        render(<AppointmentCalendar isClinician={true} />);

        const createButton = screen.getByText(/create appointment button/i);
        fireEvent.click(createButton);

        await waitFor(() => {

            expect(screen.getByLabelText(/appointment title/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/patient email/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/start date and time/i)).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /create appointment/i })).toBeInTheDocument();
        });
    });
});
