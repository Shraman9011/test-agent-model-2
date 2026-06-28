from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from users.models import EmployeeProfile, UserRole

User = get_user_model()

class SecurityIntegrationTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        
        # Create an HR Admin
        self.hr_admin = User.objects.create_user(
            email='hr@example.com',
            password='Password123!',
            first_name='HR',
            last_name='Admin',
            role=UserRole.HR_ADMIN
        )
        # Profile is created automatically by signal, but let's ensure it exists
        self.hr_profile = self.hr_admin.profile
        
        # Create a regular Employee
        self.employee = User.objects.create_user(
            email='emp@example.com',
            password='Password123!',
            first_name='Reg',
            last_name='Emp',
            role=UserRole.EMPLOYEE
        )
        
        # Create a deactivated Employee
        self.deactivated_emp = User.objects.create_user(
            email='deactivated@example.com',
            password='Password123!',
            first_name='Deact',
            last_name='Emp',
            role=UserRole.EMPLOYEE,
            is_active=False
        )

        # Create a Manager whose profile is deactivated
        self.manager = User.objects.create_user(
            email='mgr@example.com',
            password='Password123!',
            first_name='Man',
            last_name='Ager',
            role=UserRole.MANAGER
        )
        self.manager.profile.is_active = False
        self.manager.profile.save()

    def test_non_hr_admin_cannot_access_profile_crud(self):
        # Authenticate as regular employee
        res_login = self.client.post(reverse('users_api:login'), {
            'email': 'emp@example.com',
            'password': 'Password123!'
        })
        self.assertEqual(res_login.status_code, status.HTTP_200_OK)
        token = res_login.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        # Attempt to access profile CRUD endpoint
        response = self.client.get(reverse('users_api:employees-list'))
        
        # Should be forbidden
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_hr_admin_can_access_profile_crud(self):
        # Authenticate as HR admin
        res_login = self.client.post(reverse('users_api:login'), {
            'email': 'hr@example.com',
            'password': 'Password123!'
        })
        self.assertEqual(res_login.status_code, status.HTTP_200_OK)
        token = res_login.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        # Attempt to access profile CRUD endpoint
        response = self.client.get(reverse('users_api:employees-list'))
        
        # Should be allowed (200 OK)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_deactivated_user_receives_401_on_login(self):
        # Attempt to login as deactivated user (is_active=False on User model)
        response = self.client.post(reverse('users_api:login'), {
            'email': 'deactivated@example.com',
            'password': 'Password123!'
        })
        
        # Should be unauthorized
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(response.data['detail'], 'Account is deactivated.')

    def test_user_with_deactivated_profile_receives_401_on_login(self):
        # Attempt to login as user with active User model but deactivated EmployeeProfile
        response = self.client.post(reverse('users_api:login'), {
            'email': 'mgr@example.com',
            'password': 'Password123!'
        })
        
        # Should be unauthorized
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(response.data['detail'], 'Account is deactivated.')
