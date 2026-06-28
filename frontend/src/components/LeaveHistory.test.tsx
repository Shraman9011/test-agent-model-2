/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
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
    (apiClient.get as any).mockResolvedValue({
      data: {
        count: 2,
        results: [
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
      }
    });

    render(<LeaveHistory />);

    await waitFor(() => {
      expect(screen.getByText('Annual')).toBeInTheDocument();
      expect(screen.getByText('Sick')).toBeInTheDocument();
    });

    const editBtns = screen.getAllByRole('button', { name: /edit request/i });
    expect(editBtns.length).toBe(1);

    const cancelBtns = screen.getAllByRole('button', { name: /cancel request/i });
    // Both requests are cancellable since '2026-08-01' is in the future for tests
    expect(cancelBtns.length).toBe(2);
  });

  it('updates filters and fetches new data', async () => {
    (apiClient.get as any).mockResolvedValue({
      data: { count: 1, results: [{ id: 1, leave_type: { name: 'Annual' }, status: 'PENDING' }] }
    });

    render(<LeaveHistory />);
    
    // Wait for initial fetch
    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith('/api/leaves/history?page=1');
    });
    
    // Change status filter
    const statusSelect = screen.getByLabelText('Filter by Status');
    fireEvent.change(statusSelect, { target: { value: 'PENDING' } });
    
    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith('/api/leaves/history?status=PENDING&page=1');
    });
  });

  it('handles pagination', async () => {
    (apiClient.get as any).mockResolvedValue({
      data: { count: 15, results: [{ id: 1, leave_type: { name: 'Annual' }, status: 'PENDING' }] }
    });

    render(<LeaveHistory />);
    
    // Wait for initial fetch
    await waitFor(() => {
      expect(screen.getByText(/Page/i)).toBeInTheDocument();
    });
    
    const nextBtn = screen.getByRole('button', { name: /next/i });
    fireEvent.click(nextBtn);
    
    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith('/api/leaves/history?page=2');
    });
  });
});
