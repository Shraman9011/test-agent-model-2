import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ManagerPendingRequests } from './ManagerPendingRequests';
import { apiClient } from '../api/client';
import '@testing-library/jest-dom';

vi.mock('../api/client', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

describe('ManagerPendingRequests', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('shows loading skeleton initially', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (apiClient.get as any).mockImplementation(() => new Promise(() => {}));
    
    render(<ManagerPendingRequests />);
    expect(screen.getByTestId('pending-requests-skeleton')).toBeInTheDocument();
  });

  it('renders empty state when there are no requests', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (apiClient.get as any).mockResolvedValueOnce({ data: [] });
    
    render(<ManagerPendingRequests />);
    
    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
      expect(screen.getByText('All caught up!')).toBeInTheDocument();
    });
  });

  it('displays employee name, leave type, requested dates, total days, and reason clearly', async () => {
    const mockData = [
      {
        id: 1,
        employee: { id: 10, email: 'john@example.com', first_name: 'John', last_name: 'Doe' },
        leave_type: { id: 1, name: 'Sick Leave' },
        start_date: '2026-08-10',
        end_date: '2026-08-11',
        total_days: '2',
        reason: 'Feeling unwell',
        status: 'PENDING',
        applied_at: '2026-08-01T10:00:00Z',
      }
    ];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (apiClient.get as any).mockResolvedValueOnce({ data: mockData });
    
    render(<ManagerPendingRequests />);
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Sick Leave')).toBeInTheDocument();
      expect(screen.getByText('2026-08-10')).toBeInTheDocument();
      expect(screen.getByText('2026-08-11')).toBeInTheDocument();
      expect(screen.getByText(/2 days/i)).toBeInTheDocument();
      expect(screen.getByText(/"Feeling unwell"/i)).toBeInTheDocument();
    });
    
    expect(screen.getByRole('button', { name: /Approve request from John/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Reject request from John/i })).toBeInTheDocument();
  });

  it('shows error state when API fails', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (apiClient.get as any).mockRejectedValueOnce(new Error('API Error'));
    
    render(<ManagerPendingRequests />);
    
    await waitFor(() => {
      expect(screen.getByText(/Failed to load pending requests/i)).toBeInTheDocument();
    });
  });
});
