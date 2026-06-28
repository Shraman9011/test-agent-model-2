/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApplyLeaveForm } from './ApplyLeaveForm';
import { apiClient } from '../api/client';
import '@testing-library/jest-dom';

vi.mock('../api/client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe('ApplyLeaveForm', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('renders correctly and fetches leave types', async () => {
    (apiClient.get as any).mockResolvedValueOnce({
      data: [
        { leave_type: { id: 1, name: 'Annual' }, remaining_days: '5.0' },
      ],
    });

    render(<ApplyLeaveForm />);

    await waitFor(() => {
      expect(screen.getByText('Annual (5 days remaining)')).toBeInTheDocument();
    });
  });

  it('shows validation errors for empty fields', async () => {
    render(<ApplyLeaveForm />);
    
    const submitBtn = screen.getByRole('button', { name: /apply leave/i });
    fireEvent.click(submitBtn);

    expect(await screen.findByText('Leave type is required')).toBeInTheDocument();
    expect(await screen.findByText('Start date is required')).toBeInTheDocument();
    expect(await screen.findByText('End date is required')).toBeInTheDocument();
    expect(await screen.findByText('Valid total days is required')).toBeInTheDocument();
    expect(await screen.findByText('Reason is required')).toBeInTheDocument();
  });

  it('shows error if end date is before start date', async () => {
    (apiClient.get as any).mockResolvedValueOnce({ data: [] });
    render(<ApplyLeaveForm />);
    
    fireEvent.change(screen.getByLabelText(/start date/i), { target: { value: '2026-07-26' } });
    fireEvent.change(screen.getByLabelText(/end date/i), { target: { value: '2026-07-25' } });
    
    fireEvent.click(screen.getByRole('button', { name: /apply leave/i }));

    expect(await screen.findByText('End date cannot be before start date')).toBeInTheDocument();
  });

  it('submits form successfully', async () => {
    (apiClient.get as any).mockResolvedValueOnce({
      data: [{ leave_type: { id: 1, name: 'Annual' }, remaining_days: '5.0' }],
    });
    (apiClient.post as any).mockResolvedValueOnce({ data: { id: 10 } });

    const onSuccess = vi.fn();
    render(<ApplyLeaveForm onSuccess={onSuccess} />);

    await waitFor(() => expect(screen.getByText('Annual (5 days remaining)')).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText(/leave type/i), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText(/start date/i), { target: { value: '2026-07-25' } });
    fireEvent.change(screen.getByLabelText(/end date/i), { target: { value: '2026-07-26' } });
    fireEvent.change(screen.getByLabelText(/total days/i), { target: { value: '2' } });
    fireEvent.change(screen.getByLabelText(/reason/i), { target: { value: 'Vacation' } });

    fireEvent.click(screen.getByRole('button', { name: /apply leave/i }));

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith('/api/leaves/', {
        leave_type: 1,
        start_date: '2026-07-25',
        end_date: '2026-07-26',
        total_days: 2,
        reason: 'Vacation',
      });
      expect(screen.getByText('Request Submitted Successfully')).toBeInTheDocument();
    });
  });

  it('displays backend errors on submission failure', async () => {
    (apiClient.get as any).mockResolvedValueOnce({
      data: [{ leave_type: { id: 1, name: 'Annual' }, remaining_days: '5.0' }],
    });
    (apiClient.post as any).mockRejectedValueOnce({
      response: { data: ["Requested dates overlap with an existing leave request."] }
    });

    render(<ApplyLeaveForm />);
    
    await waitFor(() => expect(screen.getByText('Annual (5 days remaining)')).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText(/leave type/i), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText(/start date/i), { target: { value: '2026-07-25' } });
    fireEvent.change(screen.getByLabelText(/end date/i), { target: { value: '2026-07-26' } });
    fireEvent.change(screen.getByLabelText(/total days/i), { target: { value: '2' } });
    fireEvent.change(screen.getByLabelText(/reason/i), { target: { value: 'Vacation' } });

    fireEvent.click(screen.getByRole('button', { name: /apply leave/i }));

    await waitFor(() => {
      expect(screen.getByText('Requested dates overlap with an existing leave request.')).toBeInTheDocument();
    });
  });
});
