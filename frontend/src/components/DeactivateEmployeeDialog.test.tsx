/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DeactivateEmployeeDialog } from './DeactivateEmployeeDialog';
import { apiClient } from '../api/client';
import React from 'react';

vi.mock('../api/client', () => ({
  apiClient: {
    delete: vi.fn(),
    patch: vi.fn(),
  },
}));

describe('DeactivateEmployeeDialog', () => {
  const mockOnSuccess = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly for active employee', () => {
    const employee = { id: 1, first_name: 'John', last_name: 'Doe', is_active: true };
    render(<DeactivateEmployeeDialog employee={employee} onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);
    
    expect(screen.getByRole('heading', { name: 'Deactivate Employee' })).toBeInTheDocument();
    expect(screen.getByText(/Are you sure you want to deactivate/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Deactivate Employee' })).toBeInTheDocument();
  });

  it('renders correctly for inactive employee', () => {
    const employee = { id: 1, first_name: 'John', last_name: 'Doe', is_active: false };
    render(<DeactivateEmployeeDialog employee={employee} onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);
    
    expect(screen.getByRole('heading', { name: 'Reactivate Employee' })).toBeInTheDocument();
    expect(screen.getByText(/Are you sure you want to reactivate/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reactivate Employee' })).toBeInTheDocument();
  });

  it('calls delete API and onSuccess on confirm for active employee', async () => {
    const employee = { id: 1, first_name: 'John', last_name: 'Doe', is_active: true };
    (apiClient.delete as any).mockResolvedValue({});
    
    render(<DeactivateEmployeeDialog employee={employee} onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);
    
    await userEvent.click(screen.getByRole('button', { name: 'Deactivate Employee' }));
    
    await waitFor(() => {
      expect(apiClient.delete).toHaveBeenCalledWith('/api/v1/employees/1/');
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('calls patch API and onSuccess on confirm for inactive employee', async () => {
    const employee = { id: 1, first_name: 'John', last_name: 'Doe', is_active: false };
    (apiClient.patch as any).mockResolvedValue({});
    
    render(<DeactivateEmployeeDialog employee={employee} onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);
    
    await userEvent.click(screen.getByRole('button', { name: 'Reactivate Employee' }));
    
    await waitFor(() => {
      expect(apiClient.patch).toHaveBeenCalledWith('/api/v1/employees/1/', { is_active: true });
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });
});
