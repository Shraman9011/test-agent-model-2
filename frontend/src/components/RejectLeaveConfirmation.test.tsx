import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RejectLeaveConfirmation } from './RejectLeaveConfirmation';
import { apiClient } from '../api/client';

vi.mock('../api/client', () => ({
  apiClient: {
    post: vi.fn(),
  }
}));

const mockLeaveRequest = {
  id: 11,
  employee: {
    id: 1,
    email: 'test@example.com',
    first_name: 'John',
    last_name: 'Doe'
  },
  leave_type: { id: 1, name: 'Vacation' },
  start_date: '2026-08-01',
  end_date: '2026-08-05',
  total_days: 5,
  reason: 'Family trip',
  status: 'PENDING' as const,
  applied_at: '2026-07-01T10:00:00Z'
};

describe('RejectLeaveConfirmation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders confirmation details correctly', () => {
    render(<RejectLeaveConfirmation leaveRequest={mockLeaveRequest} />);
    expect(screen.getByText(/Reject Leave Request/i)).toBeInTheDocument();
    expect(screen.getByText(/John Doe/i)).toBeInTheDocument();
  });

  it('displays validation error if submitted without a reason', async () => {
    render(<RejectLeaveConfirmation leaveRequest={mockLeaveRequest} />);
    
    const rejectBtn = screen.getByRole('button', { name: /Confirm Rejection/i });
    fireEvent.click(rejectBtn);
    
    expect(await screen.findByText('A rejection reason is required.')).toBeInTheDocument();
    expect(apiClient.post).not.toHaveBeenCalled();
  });

  it('clears validation error when user types a reason', async () => {
    render(<RejectLeaveConfirmation leaveRequest={mockLeaveRequest} />);
    
    const rejectBtn = screen.getByRole('button', { name: /Confirm Rejection/i });
    fireEvent.click(rejectBtn);
    expect(await screen.findByText('A rejection reason is required.')).toBeInTheDocument();
    
    const textarea = screen.getByLabelText(/Rejection Reason/i);
    fireEvent.change(textarea, { target: { value: 'Coverage issues' } });
    
    expect(screen.queryByText('A rejection reason is required.')).not.toBeInTheDocument();
  });

  it('handles successful rejection with a reason', async () => {
    (apiClient.post as Mock).mockResolvedValueOnce({ data: {} });
    const onSuccess = vi.fn();
    
    render(<RejectLeaveConfirmation leaveRequest={mockLeaveRequest} onSuccess={onSuccess} />);
    
    const textarea = screen.getByLabelText(/Rejection Reason/i);
    fireEvent.change(textarea, { target: { value: 'Project deadline' } });
    
    const rejectBtn = screen.getByRole('button', { name: /Confirm Rejection/i });
    fireEvent.click(rejectBtn);
    
    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith('/api/v1/manager/leave-requests/11/reject', {
        rejection_reason: 'Project deadline'
      });
    });
    
    expect(screen.getByTestId('reject-success')).toBeInTheDocument();
  });

  it('handles API errors correctly', async () => {
    (apiClient.post as Mock).mockRejectedValueOnce({
      response: { data: { error: 'Invalid state' } }
    });
    
    render(<RejectLeaveConfirmation leaveRequest={mockLeaveRequest} />);
    
    const textarea = screen.getByLabelText(/Rejection Reason/i);
    fireEvent.change(textarea, { target: { value: 'Nope' } });
    
    const rejectBtn = screen.getByRole('button', { name: /Confirm Rejection/i });
    fireEvent.click(rejectBtn);
    
    expect(await screen.findByText('Invalid state')).toBeInTheDocument();
  });

  it('calls onCancel when Cancel button is clicked', () => {
    const onCancel = vi.fn();
    render(<RejectLeaveConfirmation leaveRequest={mockLeaveRequest} onCancel={onCancel} />);
    
    const cancelBtn = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelBtn);
    
    expect(onCancel).toHaveBeenCalled();
  });
});
