import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Records from '../app/patient/records/page';
import '@testing-library/jest-dom';



describe('Records component', () => {

    // Mock fetch
    beforeEach(() => {
        global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => [],
        }) as jest.Mock;
    });
    
    afterEach(() => {
        jest.resetAllMocks();
    });
  
    test('renders upload section and record table header', async () => {
        render(<Records />);

        expect(await screen.findByText(/Upload New Record/i)).toBeInTheDocument();
        expect(await screen.findByText(/My Medical Records/i)).toBeInTheDocument();
        expect(screen.getByText(/No records found/i)).toBeInTheDocument();
    });

  test('shows error when upload clicked with no file', async () => {
    render(<Records />);

    const uploadBtn = screen.getByRole('button', { name: /upload/i });
    fireEvent.click(uploadBtn);

    await waitFor(() => {
      expect(screen.getByText(/Please select a file/i)).toBeInTheDocument();
    });

  });

  test('displays records in table when available', async () => {
    const mockRecords = [
      {
        record_id: 1,
        record_type: 'Immunizations',
        description: 'Flu shot',
        document_link: 'https://example.com/record1.pdf',
        uploaded_at: '2023-05-01T12:00:00Z',
      },
    ];

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockRecords,
    });

    render(<Records />);

    await waitFor(() => {
      expect(screen.getByText(/Flu shot/i)).toBeInTheDocument();
      expect(screen.getByText(/Immunizations/i)).toBeInTheDocument();
      expect(screen.getByText(/View File/i)).toBeInTheDocument();
    });
  });
});
