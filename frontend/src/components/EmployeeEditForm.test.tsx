/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EmployeeEditForm } from './EmployeeEditForm';
import { apiClient } from '../api/client';
import React from 'react';

vi.mock('../api/client', () => ({
  apiClient: {
    get: vi.fn(),
    patch: vi.fn(),
  },
}));

describe('EmployeeEditForm', () => {
  const mockOnSuccess = vi.fn();
  const mockOnCancel = vi.fn();
  const mockEmployee = {
    id: 1,
    first_name: 'John',
    last_name: 'Doe',
    email: 'john@example.com',
    user_role: 'EMPLOYEE',
    role: 'Developer',
    department: 'Engineering',
    is_active: true,
    phone_number: '1234567890',
    manager: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (apiClient.get as any).mockResolvedValue({ data: [] });
  });

  it('renders correctly and pre-populates data', async () => {
    render(<EmployeeEditForm employee={mockEmployee} onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);
    
    expect(screen.getByText('Edit Employee Profile')).toBeInTheDocument();
    
    const firstNameInput = screen.getByLabelText(/First Name/i) as HTMLInputElement;
    expect(firstNameInput.value).toBe('John');

    const roleInput = screen.getByLabelText(/Job Title/i) as HTMLInputElement;
    expect(roleInput.value).toBe('Developer');
  });

  it('calls API and onSuccess callback on submit', async () => {
    (apiClient.patch as any).mockResolvedValue({ data: { id: 1 } });
    render(<EmployeeEditForm employee={mockEmployee} onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);
    
    const roleInput = screen.getByLabelText(/Job Title/i);
    await userEvent.clear(roleInput);
    await userEvent.type(roleInput, 'Senior Developer');
    
    await userEvent.click(screen.getByRole('button', { name: /Save Changes/i }));
    
    await waitFor(() => {
      expect(apiClient.patch).toHaveBeenCalledWith('/api/employees/1/', expect.objectContaining({
        role: 'Senior Developer'
      }));
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });
});
