import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UpcomingHolidays } from './UpcomingHolidays';
import { apiClient } from '../api/client';

vi.mock('../api/client', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

describe('UpcomingHolidays', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders skeleton loader initially', () => {
    (apiClient.get as any).mockReturnValue(new Promise(() => {}));
    render(<UpcomingHolidays />);
    expect(screen.getByTestId('holiday-skeleton')).toBeInTheDocument();
  });

  it('renders error state on API failure', async () => {
    (apiClient.get as any).mockRejectedValue(new Error('Network error'));
    render(<UpcomingHolidays />);
    
    await waitFor(() => {
      expect(screen.getByText(/Unable to load upcoming holidays/i)).toBeInTheDocument();
    });
  });

  it('renders empty state if no holidays', async () => {
    (apiClient.get as any).mockResolvedValue({ data: [] });
    render(<UpcomingHolidays />);
    
    await waitFor(() => {
      expect(screen.getByText(/No upcoming company holidays remaining/i)).toBeInTheDocument();
    });
  });

  it('renders holiday list chronologically', async () => {
    const mockHolidays = [
      {
        id: 2,
        name: 'Christmas',
        date: '2026-12-25',
        description: 'Christmas Day',
      },
      {
        id: 1,
        name: 'Thanksgiving',
        date: '2026-11-26',
        description: 'Thanksgiving Day',
      }
    ];

    (apiClient.get as any).mockResolvedValue({ data: mockHolidays });
    render(<UpcomingHolidays />);
    
    await waitFor(() => {
      // Check if both names exist
      expect(screen.getByText('Thanksgiving')).toBeInTheDocument();
      expect(screen.getByText('Christmas')).toBeInTheDocument();
    });

    // Check order (Thanksgiving before Christmas)
    const items = screen.getAllByRole('listitem');
    expect(items[0]).toHaveTextContent('Thanksgiving');
    expect(items[1]).toHaveTextContent('Christmas');
  });
});
