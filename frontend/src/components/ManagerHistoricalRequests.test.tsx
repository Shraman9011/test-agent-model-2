import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ManagerHistoricalRequests } from './ManagerHistoricalRequests';
import { apiClient } from '../api/client';
import '@testing-library/jest-dom';

vi.mock('../api/client', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

describe('ManagerHistoricalRequests', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('shows loading skeleton initially', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (apiClient.get as any).mockImplementation(() => new Promise(() => {}));
    
    render(<ManagerHistoricalRequests />);
    expect(screen.getByTestId('historical-requests-skeleton')).toBeInTheDocument();
  });

  it('renders empty state when there are no historical requests', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (apiClient.get as any).mockResolvedValueOnce({ data: { count: 0, next: null, previous: null, results: [] } });
    
    render(<ManagerHistoricalRequests />);
    
    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
      expect(screen.getByText('No History')).toBeInTheDocument();
    });
  });

  it('displays approved and rejected requests clearly', async () => {
    const mockData = {
      count: 2,
      next: null,
      previous: null,
      results: [
        {
          id: 1,
          employee: { id: 10, email: 'john@example.com', first_name: 'John', last_name: 'Doe' },
          leave_type: { id: 1, name: 'Sick Leave' },
          start_date: '2026-08-10',
          end_date: '2026-08-11',
          total_days: '2',
          reason: 'Feeling unwell',
          status: 'APPROVED',
          applied_at: '2026-08-01T10:00:00Z',
          reviewed_at: '2026-08-02T10:00:00Z',
          manager_comments: 'Get well soon',
        },
        {
          id: 2,
          employee: { id: 11, email: 'jane@example.com', first_name: 'Jane', last_name: 'Smith' },
          leave_type: { id: 2, name: 'Annual Leave' },
          start_date: '2026-09-10',
          end_date: '2026-09-15',
          total_days: '4',
          reason: 'Vacation',
          status: 'REJECTED',
          applied_at: '2026-08-01T10:00:00Z',
          reviewed_at: '2026-08-03T10:00:00Z',
          rejection_reason: 'Too busy',
        }
      ]
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (apiClient.get as any).mockResolvedValueOnce({ data: mockData });
    
    render(<ManagerHistoricalRequests />);
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getAllByText('Approved').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Rejected').length).toBeGreaterThan(0);
      expect(screen.getByText(/Get well soon/i)).toBeInTheDocument();
      expect(screen.getByText(/Too busy/i)).toBeInTheDocument();
    });
  });

  it('handles pagination correctly', async () => {
    const page1 = {
      count: 20,
      next: 'url?page=2',
      previous: null,
      results: [{
        id: 1,
        employee: { id: 10, email: 'john@example.com', first_name: 'John', last_name: 'Doe' },
        leave_type: { id: 1, name: 'Sick Leave' },
        start_date: '2026-08-10',
        end_date: '2026-08-11',
        total_days: '2',
        reason: 'Feeling unwell',
        status: 'APPROVED',
      }]
    };

    const page2 = {
      count: 20,
      next: null,
      previous: 'url?page=1',
      results: [{
        id: 2,
        employee: { id: 11, email: 'jane@example.com', first_name: 'Jane', last_name: 'Smith' },
        leave_type: { id: 2, name: 'Annual Leave' },
        start_date: '2026-09-10',
        end_date: '2026-09-15',
        total_days: '4',
        reason: 'Vacation',
        status: 'REJECTED',
      }]
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (apiClient.get as any)
      .mockResolvedValueOnce({ data: page1 })
      .mockResolvedValueOnce({ data: page2 });
    
    render(<ManagerHistoricalRequests />);
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /Next/i })).not.toBeDisabled();
    expect(screen.getByRole('button', { name: /Previous/i })).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: /Next/i }));

    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/manager/leave-requests/history?page=2');
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });
  });
});
