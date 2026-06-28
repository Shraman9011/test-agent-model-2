/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CancelLeaveConfirmation } from './CancelLeaveConfirmation';
import { apiClient } from '../api/client';
import '@testing-library/jest-dom';

vi.mock('../api/client', () => ({
  apiClient: {
    post: vi.fn(),
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

describe('CancelLeaveConfirmation', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('renders confirmation text', () => {
    render(<CancelLeaveConfirmation leaveRequest={mockRequest} />);
    expect(screen.getByText(/Are you sure you want to cancel your leave request from/i)).toBeInTheDocument();
  });

  it('submits cancellation successfully', async () => {
    (apiClient.post as any).mockResolvedValueOnce({ data: { message: 'Cancelled' } });
    const onSuccess = vi.fn();
    
    render(<CancelLeaveConfirmation leaveRequest={mockRequest} onSuccess={onSuccess} />);
    
    fireEvent.click(screen.getByRole('button', { name: /yes, cancel request/i }));

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith('/api/leaves/10/cancel/');
      expect(screen.getByTestId('cancel-success')).toBeInTheDocument();
    });
  });

  it('shows error if API fails', async () => {
    (apiClient.post as any).mockRejectedValueOnce({
      response: { data: { error: 'Not allowed' } }
    });
    
    render(<CancelLeaveConfirmation leaveRequest={mockRequest} />);
    fireEvent.click(screen.getByRole('button', { name: /yes, cancel request/i }));

    expect(await screen.findByText('Not allowed')).toBeInTheDocument();
  });
});
