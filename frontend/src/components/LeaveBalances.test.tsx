import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LeaveBalances } from './LeaveBalances';
import { apiClient } from '../api/client';

vi.mock('../api/client', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

describe('LeaveBalances', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders skeleton loader initially', () => {
    (apiClient.get as any).mockReturnValue(new Promise(() => {})); // Never resolves
    render(<LeaveBalances />);
    expect(screen.getByTestId('skeleton-loader')).toBeInTheDocument();
  });

  it('renders error state on API failure', async () => {
    (apiClient.get as any).mockRejectedValue(new Error('Network error'));
    render(<LeaveBalances />);
    
    await waitFor(() => {
      expect(screen.getByText(/Unable to fetch your leave balances/i)).toBeInTheDocument();
    });
  });

  it('renders empty state if no balances', async () => {
    (apiClient.get as any).mockResolvedValue({ data: [] });
    render(<LeaveBalances />);
    
    await waitFor(() => {
      expect(screen.getByText(/No leave balances found/i)).toBeInTheDocument();
    });
  });

  it('renders balance cards correctly', async () => {
    const mockData = [
      {
        id: 1,
        leave_type: { name: 'Annual Leave' },
        allocated_days: '20.0',
        used_days: '5.0',
        pending_days: '2.0',
        remaining_days: '13.0',
      },
      {
        id: 2,
        leave_type: { name: 'Sick Leave' },
        allocated_days: '10.0',
        used_days: '1.0',
        pending_days: '0.0',
        remaining_days: '9.0',
      }
    ];

    (apiClient.get as any).mockResolvedValue({ data: mockData });
    render(<LeaveBalances />);
    
    await waitFor(() => {
      expect(screen.getByText('Annual Leave')).toBeInTheDocument();
      expect(screen.getByText('13')).toBeInTheDocument();
      expect(screen.getByText(/7 used\/pending/)).toBeInTheDocument(); // 5 + 2

      expect(screen.getByText('Sick Leave')).toBeInTheDocument();
      expect(screen.getByText('9')).toBeInTheDocument();
      expect(screen.getByText(/1 used\/pending/)).toBeInTheDocument(); // 1 + 0
    });
  });
});
