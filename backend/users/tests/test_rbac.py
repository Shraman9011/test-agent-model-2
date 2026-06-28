from django.urls import path, reverse
from django.http import JsonResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from users.permissions import IsHRAdmin, IsManager, IsEmployee

User = get_user_model()

# Dummy Views for testing DRF Permissions
class HRAdminView(APIView):
    permission_classes = [IsHRAdmin]
    def get(self, request):
        return Response({'message': 'HR Admin Success'})

class ManagerView(APIView):
    permission_classes = [IsManager]
    def get(self, request):
        return Response({'message': 'Manager Success'})

class EmployeeView(APIView):
    permission_classes = [IsEmployee]
    def get(self, request):
        return Response({'message': 'Employee Success'})

def dummy_admin_view(request):
    return JsonResponse({'message': 'Admin Middleware Success'})

def dummy_manager_view(request):
    return JsonResponse({'message': 'Manager Middleware Success'})

# We dynamically append URLs for testing
from django.urls import re_path
from test_agent_model_2.urls import urlpatterns

urlpatterns += [
    path('api/test-hr/', HRAdminView.as_view(), name='test-hr'),
    path('api/test-manager/', ManagerView.as_view(), name='test-manager'),
    path('api/test-employee/', EmployeeView.as_view(), name='test-employee'),
    path('api/admin/test/', dummy_admin_view, name='test-admin-mid'),
    path('api/manager/test/', dummy_manager_view, name='test-manager-mid'),
]

class DRFPermissionsTests(APITestCase):
    
    def setUp(self):
        self.hr_admin = User.objects.create_user(email='hr@test.com', password='pwd', role='HR_ADMIN')
        self.manager = User.objects.create_user(email='manager@test.com', password='pwd', role='MANAGER')
        self.employee = User.objects.create_user(email='emp@test.com', password='pwd', role='EMPLOYEE')

    def test_hr_admin_access(self):
        self.client.force_authenticate(user=self.hr_admin)
        self.assertEqual(self.client.get(reverse('test-hr')).status_code, status.HTTP_200_OK)
        self.assertEqual(self.client.get(reverse('test-manager')).status_code, status.HTTP_200_OK)
        self.assertEqual(self.client.get(reverse('test-employee')).status_code, status.HTTP_200_OK)

    def test_manager_access(self):
        self.client.force_authenticate(user=self.manager)
        self.assertEqual(self.client.get(reverse('test-hr')).status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(self.client.get(reverse('test-manager')).status_code, status.HTTP_200_OK)
        self.assertEqual(self.client.get(reverse('test-employee')).status_code, status.HTTP_200_OK)

    def test_employee_access(self):
        self.client.force_authenticate(user=self.employee)
        self.assertEqual(self.client.get(reverse('test-hr')).status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(self.client.get(reverse('test-manager')).status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(self.client.get(reverse('test-employee')).status_code, status.HTTP_200_OK)


class RBACMiddlewareTests(APITestCase):

    def setUp(self):
        self.hr_admin = User.objects.create_user(email='hr_mid@test.com', password='pwd', role='HR_ADMIN')
        self.manager = User.objects.create_user(email='manager_mid@test.com', password='pwd', role='MANAGER')
        self.employee = User.objects.create_user(email='emp_mid@test.com', password='pwd', role='EMPLOYEE')

    def get_jwt(self, user):
        response = self.client.post(reverse('users_api:login'), {'email': user.email, 'password': 'pwd'})
        return response.data['access']

    def test_middleware_hr_admin(self):
        token = self.get_jwt(self.hr_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        self.assertEqual(self.client.get(reverse('test-admin-mid')).status_code, status.HTTP_200_OK)
        self.assertEqual(self.client.get(reverse('test-manager-mid')).status_code, status.HTTP_200_OK)

    def test_middleware_manager(self):
        token = self.get_jwt(self.manager)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        self.assertEqual(self.client.get(reverse('test-admin-mid')).status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(self.client.get(reverse('test-manager-mid')).status_code, status.HTTP_200_OK)

    def test_middleware_employee(self):
        token = self.get_jwt(self.employee)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        self.assertEqual(self.client.get(reverse('test-admin-mid')).status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(self.client.get(reverse('test-manager-mid')).status_code, status.HTTP_403_FORBIDDEN)
