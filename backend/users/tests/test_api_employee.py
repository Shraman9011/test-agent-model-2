from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from users.models import EmployeeProfile

User = get_user_model()

class EmployeeProfileAPITests(APITestCase):
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
        
        # Determine URLs
        self.list_url = reverse('users_api:employees-list')
        self.detail_url = reverse('users_api:employees-detail', args=[self.employee_user.profile.id])

    def test_list_profiles_forbidden_for_employee(self):
        self.client.force_authenticate(user=self.employee_user)
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_create_profile_success(self):
        self.client.force_authenticate(user=self.hr_user)
        payload = {
            'email': 'newguy@example.com',
            'first_name': 'New',
            'last_name': 'Guy',
            'department': 'Engineering',
            'user_role': 'EMPLOYEE',
            'phone_number': '1234567890',
            'password': 'StrongPassword123!',
            'role': 'Developer',
            'is_active': True
        }
        
        response = self.client.post(self.list_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verify user and profile were created
        new_user = User.objects.get(email='newguy@example.com')
        self.assertEqual(new_user.first_name, 'New')
        self.assertEqual(new_user.department, 'Engineering')
        
        profile = new_user.profile
        self.assertEqual(profile.role, 'Developer')
        self.assertTrue(profile.is_active)

    def test_update_profile_success(self):
        self.client.force_authenticate(user=self.hr_user)
        payload = {
            'first_name': 'Updated',
            'role': 'Senior Developer',
            'manager': self.hr_user.profile.id
        }
        
        response = self.client.patch(self.detail_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.employee_user.refresh_from_db()
        self.assertEqual(self.employee_user.first_name, 'Updated')
        
        profile = self.employee_user.profile
        self.assertEqual(profile.role, 'Senior Developer')
        self.assertEqual(profile.manager.id, self.hr_user.profile.id)

    def test_delete_profile_soft_deletes(self):
        self.client.force_authenticate(user=self.hr_user)
        response = self.client.delete(self.detail_url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        
        # Verify soft delete
        self.employee_user.refresh_from_db()
        profile = self.employee_user.profile
        
        self.assertFalse(self.employee_user.is_active)
        self.assertFalse(profile.is_active)
        
        # Profile should still exist in database
        self.assertTrue(EmployeeProfile.objects.filter(id=profile.id).exists())
