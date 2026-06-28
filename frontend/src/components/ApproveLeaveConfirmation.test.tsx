import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ApproveLeaveConfirmation } from './ApproveLeaveConfirmation';
import { apiClient } from '../api/client';

vi.mock('../api/client', () => ({
  apiClient: {
    post: vi.fn(),
  }
}));

const mockLeaveRequest = {
  id: 10,
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

describe('ApproveLeaveConfirmation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders confirmation details correctly', () => {
    render(<ApproveLeaveConfirmation leaveRequest={mockLeaveRequest} />);
    expect(screen.getByText(/Approve Leave Request/i)).toBeInTheDocument();
    expect(screen.getByText(/John Doe/i)).toBeInTheDocument();
  });

  it('handles successful approval without comments', async () => {
    (apiClient.post as Mock).mockResolvedValueOnce({ data: {} });
    const onSuccess = vi.fn();
    
    render(<ApproveLeaveConfirmation leaveRequest={mockLeaveRequest} onSuccess={onSuccess} />);
    
    const approveBtn = screen.getByRole('button', { name: /Confirm Approval/i });
    fireEvent.click(approveBtn);
    
    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith('/api/v1/manager/leave-requests/10/approve', {
        comments: ''
      });
    });
    
    expect(screen.getByTestId('approve-success')).toBeInTheDocument();
  });

  it('handles successful approval with comments', async () => {
    (apiClient.post as Mock).mockResolvedValueOnce({ data: {} });
    
    render(<ApproveLeaveConfirmation leaveRequest={mockLeaveRequest} />);
    
    const textarea = screen.getByLabelText(/Comments/i);
    fireEvent.change(textarea, { target: { value: 'Enjoy your trip!' } });
    
    const approveBtn = screen.getByRole('button', { name: /Confirm Approval/i });
    fireEvent.click(approveBtn);
    
    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith('/api/v1/manager/leave-requests/10/approve', {
        comments: 'Enjoy your trip!'
      });
    });
  });

  it('handles API errors correctly', async () => {
    (apiClient.post as Mock).mockRejectedValueOnce({
      response: { data: { error: 'Insufficient balance' } }
    });
    
    render(<ApproveLeaveConfirmation leaveRequest={mockLeaveRequest} />);
    
    const approveBtn = screen.getByRole('button', { name: /Confirm Approval/i });
    fireEvent.click(approveBtn);
    
    expect(await screen.findByText('Insufficient balance')).toBeInTheDocument();
  });

  it('calls onCancel when Cancel button is clicked', () => {
    const onCancel = vi.fn();
    render(<ApproveLeaveConfirmation leaveRequest={mockLeaveRequest} onCancel={onCancel} />);
    
    const cancelBtn = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelBtn);
    
    expect(onCancel).toHaveBeenCalled();
  });
});
