import axios from 'axios';

// Ensure this matches the Django local server URL. 
// Note: Normally read from import.meta.env.VITE_API_URL
const BASE_URL = 'http://localhost:8000';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach JWT token to every request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor to handle global 401s (e.g., token expiration)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear local storage and redirect to login
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      // If we are not already on the login page, redirect
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Manual Leave Adjustment API
export const adjustLeaveBalance = async (data: { employee_id: number; leave_type_id: number; adjustment_amount: number; reason: string; year?: number }): Promise<unknown> => {
  const response = await apiClient.post('/api/v1/leave-balances/adjust/', data);
  return response.data;
};

export const getLeaveAdjustmentLogs = async (employeeId: number): Promise<unknown> => {
  const response = await apiClient.get('/api/v1/leave-balances/adjustments/logs/', { params: { employee_id: employeeId } });
  return response.data;
};

// Leave Policy API
export const getLeavePolicies = async (): Promise<unknown> => {
  const response = await apiClient.get('/api/leave-policies/');
  return response.data;
};

export const updateLeavePolicy = async (id: number, data: { default_annual_days: number; apply_retroactively: boolean; is_active?: boolean }): Promise<unknown> => {
  const response = await apiClient.patch(`/api/leave-policies/${id}/`, data);
  return response.data;
};
