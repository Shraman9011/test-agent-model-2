from decimal import Decimal
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from users.models import EmployeeProfile
from leaves.models import LeaveType, LeaveBalance, LeaveAdjustmentAuditLog

User = get_user_model()

class LeaveBalanceAdjustmentTests(APITestCase):
    def setUp(self):
        self.hr_user = User.objects.create_user(
            email='hr@test.com',
            password='password123',
            first_name='HR',
            last_name='Admin',
            role='HR_ADMIN'
        )
        # EmployeeProfile is created by signal

        self.employee_user = User.objects.create_user(
            email='employee@test.com',
            password='password123',
            first_name='Emp',
            last_name='Loyee',
            role='EMPLOYEE'
        )
        self.employee_profile = self.employee_user.profile
        
        self.leave_type = LeaveType.objects.create(
            name='Annual Leave',
            max_days_per_year=20
        )
        
        self.url = reverse('leaves_api:leave-balance-adjust')
        
    def test_adjust_leave_balance_success(self):
        self.client.force_authenticate(user=self.hr_user)
        
        data = {
            'employee_id': self.employee_user.id,
            'leave_type_id': self.leave_type.id,
            'year': 2026,
            'adjustment_amount': 5.5,
            'reason': 'Added starting balance'
        }
        
        response = self.client.post(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        balance = LeaveBalance.objects.get(employee=self.employee_profile, leave_type=self.leave_type, year=2026)
        self.assertEqual(balance.allocated_days, Decimal('5.5'))
        
        audit_log = LeaveAdjustmentAuditLog.objects.first()
        self.assertIsNotNone(audit_log)
        self.assertEqual(audit_log.adjustment_amount, Decimal('5.5'))
        self.assertEqual(audit_log.previous_balance, Decimal('0.0'))
        self.assertEqual(audit_log.new_balance, Decimal('5.5'))
        self.assertEqual(audit_log.reason, 'Added starting balance')
        self.assertEqual(audit_log.adjusted_by, self.hr_user)

    def test_adjust_leave_balance_missing_reason(self):
        self.client.force_authenticate(user=self.hr_user)
        
        data = {
            'employee_id': self.employee_user.id,
            'leave_type_id': self.leave_type.id,
            'adjustment_amount': 5.0,
            'reason': ''
        }
        
        response = self.client.post(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('reason', response.data)
        
        # Ensure no audit log was created
        self.assertEqual(LeaveAdjustmentAuditLog.objects.count(), 0)

    def test_adjust_leave_balance_employee_unauthorized(self):
        self.client.force_authenticate(user=self.employee_user)
        
        data = {
            'employee_id': self.employee_user.id,
            'leave_type_id': self.leave_type.id,
            'adjustment_amount': 5.0,
            'reason': 'Give myself days'
        }
        
        response = self.client.post(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
