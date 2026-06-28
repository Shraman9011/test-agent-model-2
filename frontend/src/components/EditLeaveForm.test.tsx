/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EditLeaveForm } from './EditLeaveForm';
import { apiClient } from '../api/client';
import '@testing-library/jest-dom';

vi.mock('../api/client', () => ({
  apiClient: {
    put: vi.fn(),
  },
}));

const mockRequest = {
  id: 10,
  leave_type: { id: 1, name: 'Annual' },
  start_date: '2026-07-25',
  end_date: '2026-07-26',
  total_days: '2',
  reason: 'Vacation',
  status: 'PENDING' as const,
  applied_at: '2026-06-25T10:00:00Z',
};

describe('EditLeaveForm', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('renders pre-populated fields', () => {
    render(<EditLeaveForm leaveRequest={mockRequest} />);
    
    expect(screen.getByDisplayValue('Annual')).toBeInTheDocument();
    expect(screen.getByDisplayValue('2026-07-25')).toBeInTheDocument();
    expect(screen.getByDisplayValue('2026-07-26')).toBeInTheDocument();
    expect(screen.getByDisplayValue('2')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Vacation')).toBeInTheDocument();
  });

  it('submits updated values successfully', async () => {
    (apiClient.put as any).mockResolvedValueOnce({ data: { id: 10 } });
    const onSuccess = vi.fn();
    
    render(<EditLeaveForm leaveRequest={mockRequest} onSuccess={onSuccess} />);
    
    fireEvent.change(screen.getByLabelText(/reason/i), { target: { value: 'Updated reason' } });
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(apiClient.put).toHaveBeenCalledWith('/api/leaves/10/', {
        start_date: '2026-07-25',
        end_date: '2026-07-26',
        total_days: 2,
        reason: 'Updated reason',
      });
      expect(screen.getByText('Request Updated Successfully')).toBeInTheDocument();
    });
  });

  it('shows error if API fails', async () => {
    (apiClient.put as any).mockRejectedValueOnce({
      response: { data: { error: 'Not allowed' } }
    });
    
    render(<EditLeaveForm leaveRequest={mockRequest} />);
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

    expect(await screen.findByText('Not allowed')).toBeInTheDocument();
  });
});
