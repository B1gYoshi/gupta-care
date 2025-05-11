// __tests__/Login.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Login from '../app/login/page';
import '@testing-library/jest-dom';
import { useRouter } from 'next/navigation';

const mockedUseRouter = useRouter as jest.Mock;

// Mock the next/router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

describe('Login Component', () => {
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

  test('renders login form inputs', () => {
    render(<Login />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByText(/login/i)).toBeInTheDocument();
    expect(screen.getByText(/create a new account/i)).toBeInTheDocument();
  });

  test('shows validation error if fields are empty', async () => {
    render(<Login />);
    fireEvent.click(screen.getByText(/^login$/i));

    await waitFor(() => {
      expect(screen.getAllByText('Required')).toHaveLength(2);
    });
  });

  test('shows create account fields when create a new account button is clicked', async () => {
    render(<Login />);
    fireEvent.click(screen.getByText(/^create a new account$/i));

    await waitFor(() => {
        expect(screen.getByTestId('signup-email')).toBeInTheDocument();
        expect(screen.getByTestId('signup-retype-email')).toBeInTheDocument();
        expect(screen.getByTestId('signup-password')).toBeInTheDocument();
        expect(screen.getByTestId('signup-retype-password')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument();
    });
  });


});
