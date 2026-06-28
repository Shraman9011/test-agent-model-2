from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from leaves.models import LeavePolicy, LeaveType, LeaveBalance
from users.models import EmployeeProfile

User = get_user_model()

class LeavePolicyAPITests(APITestCase):
    def setUp(self):
        # Create HR Admin user
        self.hr_user = User.objects.create_user(
            email='hr@example.com',
            password='Password123!',
            first_name='HR',
            last_name='Admin',
            role='HR_ADMIN'
        )
        # Create standard employee user
        self.employee_user = User.objects.create_user(
            email='emp@example.com',
            password='Password123!',
            first_name='Reg',
            last_name='Employee',
            role='EMPLOYEE'
        )
        
        # We need to delete the auto-created balances so we can create a clean state
        LeaveBalance.objects.all().delete()
        LeavePolicy.objects.all().delete()
        LeaveType.objects.all().delete()
        
        # Create Leave Type
        self.leave_type = LeaveType.objects.create(name='Annual Leave', description='Annual', max_days_per_year=30.0)
        
        # Create Leave Policy
        self.policy = LeavePolicy.objects.create(
            leave_type=self.leave_type,
            default_annual_days=20.0,
            is_active=True
        )
        
        # Assign initial balance to employee to test retroactive changes
        from django.utils import timezone
        self.current_year = timezone.now().year
        self.balance = LeaveBalance.objects.create(
            employee=self.employee_user.profile,
            leave_type=self.leave_type,
            year=self.current_year,
            allocated_days=20.0
        )
        
        self.list_url = reverse('leaves_api:leave-policies-list')
        self.detail_url = reverse('leaves_api:leave-policies-detail', args=[self.policy.id])

    def test_list_policies_forbidden_for_employee(self):
        self.client.force_authenticate(user=self.employee_user)
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_list_policies_success_for_hr(self):
        self.client.force_authenticate(user=self.hr_user)
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_update_policy_without_retroactive(self):
        self.client.force_authenticate(user=self.hr_user)
        payload = {
            'default_annual_days': 25.0,
            'apply_retroactively': False
        }
        
        response = self.client.patch(self.detail_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.policy.refresh_from_db()
        self.assertEqual(self.policy.default_annual_days, 25.0)
        
        # Existing user balance should NOT change
        self.balance.refresh_from_db()
        self.assertEqual(self.balance.allocated_days, 20.0)

    def test_update_policy_with_retroactive(self):
        self.client.force_authenticate(user=self.hr_user)
        payload = {
            'default_annual_days': 25.0,
            'apply_retroactively': True
        }
        
        response = self.client.patch(self.detail_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.policy.refresh_from_db()
        self.assertEqual(self.policy.default_annual_days, 25.0)
        
        # Existing user balance SHOULD change
        self.balance.refresh_from_db()
        self.assertEqual(self.balance.allocated_days, 25.0)
