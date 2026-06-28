/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LeaveHistory } from './LeaveHistory';
import { apiClient } from '../api/client';
import '@testing-library/jest-dom';

vi.mock('../api/client', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

describe('LeaveHistory', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('renders history table and edit buttons for pending requests', async () => {
    (apiClient.get as any).mockResolvedValueOnce({
      data: [
        {
          id: 1,
          leave_type: { name: 'Annual' },
          start_date: '2026-07-25',
          end_date: '2026-07-26',
          total_days: 2,
          status: 'PENDING'
        },
        {
          id: 2,
          leave_type: { name: 'Sick' },
          start_date: '2026-08-01',
          end_date: '2026-08-02',
          total_days: 2,
          status: 'APPROVED'
        }
      ]
    });

    render(<LeaveHistory />);

    await waitFor(() => {
      expect(screen.getByText('Annual')).toBeInTheDocument();
      expect(screen.getByText('Sick')).toBeInTheDocument();
    });

    const buttons = screen.getAllByRole('button', { name: /edit request/i });
    expect(buttons.length).toBe(1);
  });
});
