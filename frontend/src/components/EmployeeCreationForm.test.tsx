/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EmployeeCreationForm } from './EmployeeCreationForm';
import { apiClient } from '../api/client';
import React from 'react';

vi.mock('../api/client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe('EmployeeCreationForm', () => {
  const mockOnSuccess = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (apiClient.get as any).mockResolvedValue({ data: [] });
  });

  it('renders correctly', async () => {
    render(<EmployeeCreationForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);
    expect(screen.getByText('Add New Employee')).toBeInTheDocument();
  });

  it('validates email requirement', async () => {
    render(<EmployeeCreationForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);
    
    await userEvent.type(screen.getByLabelText(/First Name/i), 'John');
    await userEvent.type(screen.getByLabelText(/Last Name/i), 'Doe');
    await userEvent.type(screen.getByLabelText(/Email Address/i), 'invalid-email');
    
    await userEvent.click(screen.getByRole('button', { name: /Create Employee/i }));
    
    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address.')).toBeInTheDocument();
    });
  });

  it('calls API and onSuccess callback', async () => {
    (apiClient.post as any).mockResolvedValue({ data: { id: 1 } });
    render(<EmployeeCreationForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);
    
    await userEvent.type(screen.getByLabelText(/First Name/i), 'John');
    await userEvent.type(screen.getByLabelText(/Last Name/i), 'Doe');
    await userEvent.type(screen.getByLabelText(/Email Address/i), 'john@example.com');
    
    await userEvent.click(screen.getByRole('button', { name: /Create Employee/i }));
    
    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalled();
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });
});
