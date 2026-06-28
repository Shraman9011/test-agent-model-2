/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserManagement } from './UserManagement';
import { apiClient } from '../api/client';
import React from 'react';

vi.mock('../api/client', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

describe('UserManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    (apiClient.get as any).mockReturnValue(new Promise(() => {}));
    render(<UserManagement />);
    expect(screen.getByText(/Loading employees.../i)).toBeInTheDocument();
  });

  it('renders employee list', async () => {
    (apiClient.get as any).mockResolvedValue({
      data: [
        {
          id: 1,
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@example.com',
          user_role: 'EMPLOYEE',
          role: 'Developer',
          department: 'Engineering',
          is_active: true
        }
      ]
    });
    
    render(<UserManagement />);
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
      expect(screen.getByText('Active')).toBeInTheDocument();
    });
  });

  it('opens modal on Add Employee click', async () => {
    (apiClient.get as any).mockResolvedValue({ data: [] });
    render(<UserManagement />);
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Add Employee/i })).toBeInTheDocument();
    });
    
    await userEvent.click(screen.getByRole('button', { name: /Add Employee/i }));
    
    await waitFor(() => {
      expect(screen.getByText('Add New Employee')).toBeInTheDocument();
    });
  });
});
