from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.core.cache import cache
from users.models import User
from leaves.models import LeaveRequest, LeaveType
import datetime
from django.utils import timezone
from django.test import override_settings

@override_settings(CACHES={'default': {'BACKEND': 'django.core.cache.backends.locmem.LocMemCache'}})
class ManagerHistoricalLeavesTests(APITestCase):
    def setUp(self):
        self.manager = User.objects.create(email='manager@example.com', first_name='Manager', last_name='User', role='MANAGER')
        self.employee1 = User.objects.create(email='emp1@example.com', first_name='Employee1', last_name='User')
        self.employee2 = User.objects.create(email='emp2@example.com', first_name='Employee2', last_name='User')
        
        self.leave_type = LeaveType.objects.create(name='Annual', max_days_per_year=20)
        
        # Pending request (should not appear)
        self.req1 = LeaveRequest.objects.create(
            employee=self.employee1, manager=self.manager, leave_type=self.leave_type,
            start_date=timezone.now().date(), end_date=timezone.now().date() + datetime.timedelta(days=1),
            total_days=2, reason='Vacation', status=LeaveRequest.Status.PENDING
        )
        
        # Approved request for emp1
        self.req2 = LeaveRequest.objects.create(
            employee=self.employee1, manager=self.manager, leave_type=self.leave_type,
            start_date=timezone.now().date() + datetime.timedelta(days=3), end_date=timezone.now().date() + datetime.timedelta(days=4),
            total_days=2, reason='Sick', status=LeaveRequest.Status.APPROVED,
            reviewed_at=timezone.now() - datetime.timedelta(days=1)
        )
        
        # Rejected request for emp2
        self.req3 = LeaveRequest.objects.create(
            employee=self.employee2, manager=self.manager, leave_type=self.leave_type,
            start_date=timezone.now().date() + datetime.timedelta(days=6), end_date=timezone.now().date() + datetime.timedelta(days=7),
            total_days=2, reason='Personal', status=LeaveRequest.Status.REJECTED,
            reviewed_at=timezone.now() - datetime.timedelta(days=2)
        )
        
        self.url = reverse('leaves_api:manager-historical-leaves')

    def test_manager_gets_historical_requests(self):
        self.client.force_authenticate(user=self.manager)
        response = self.client.get(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        
        # Pagination format check
        self.assertIn('results', data)
        self.assertEqual(data['count'], 2)
        
        # Check sorting: -reviewed_at
        results = data['results']
        self.assertEqual(results[0]['id'], self.req2.id) # reviewed 1 day ago
        self.assertEqual(results[1]['id'], self.req3.id) # reviewed 2 days ago

    def test_filter_by_employee(self):
        self.client.force_authenticate(user=self.manager)
        response = self.client.get(self.url, {'employee_id': self.employee2.id})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.json()['results']
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['id'], self.req3.id)

    def test_filter_by_date_range(self):
        self.client.force_authenticate(user=self.manager)
        start_date_str = (timezone.now().date() + datetime.timedelta(days=5)).isoformat()
        response = self.client.get(self.url, {'start_date': start_date_str})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.json()['results']
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['id'], self.req3.id) # Starts on day 6

    def test_unauthorized_access(self):
        self.client.force_authenticate(user=self.employee1)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
