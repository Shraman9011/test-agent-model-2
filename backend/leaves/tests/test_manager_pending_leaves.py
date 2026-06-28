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
class ManagerPendingLeavesTests(APITestCase):
    def setUp(self):
        self.manager = User.objects.create(email='manager@example.com', first_name='Manager', last_name='User', role='MANAGER')
        self.employee = User.objects.create(email='employee@example.com', first_name='Employee', last_name='User')
        self.other_manager = User.objects.create(email='other@example.com', first_name='Other', last_name='Manager', role='MANAGER')
        self.leave_type = LeaveType.objects.create(name='Annual', max_days_per_year=20)
        
        # Pending request for self.manager
        self.req1 = LeaveRequest.objects.create(
            employee=self.employee, manager=self.manager, leave_type=self.leave_type,
            start_date=timezone.now().date(), end_date=timezone.now().date() + datetime.timedelta(days=1),
            total_days=2, reason='Vacation', status=LeaveRequest.Status.PENDING
        )
        
        # Approved request for self.manager (should not appear)
        self.req2 = LeaveRequest.objects.create(
            employee=self.employee, manager=self.manager, leave_type=self.leave_type,
            start_date=timezone.now().date() + datetime.timedelta(days=3), end_date=timezone.now().date() + datetime.timedelta(days=4),
            total_days=2, reason='Sick', status=LeaveRequest.Status.APPROVED
        )
        
        # Pending request for other_manager
        self.req3 = LeaveRequest.objects.create(
            employee=self.employee, manager=self.other_manager, leave_type=self.leave_type,
            start_date=timezone.now().date() + datetime.timedelta(days=6), end_date=timezone.now().date() + datetime.timedelta(days=7),
            total_days=2, reason='Personal', status=LeaveRequest.Status.PENDING
        )
        
        self.url = reverse('leaves_api:manager-pending-leaves')
        cache.clear()

    def test_manager_can_get_pending_requests(self):
        self.client.force_authenticate(user=self.manager)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        data = response.json()
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]['id'], self.req1.id)
        self.assertEqual(data[0]['employee_name'], 'Employee User')
        
    def test_other_manager_gets_their_own_requests(self):
        self.client.force_authenticate(user=self.other_manager)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        data = response.json()
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]['id'], self.req3.id)
        
    def test_employee_forbidden(self):
        self.client.force_authenticate(user=self.employee)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
    def test_unauthenticated_forbidden(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
    def test_cache_is_populated(self):
        self.client.force_authenticate(user=self.manager)
        
        # First call hits DB
        response1 = self.client.get(self.url)
        self.assertEqual(response1.status_code, status.HTTP_200_OK)
        
        # Check cache
        cache_key = f"manager_pending_leaves_{self.manager.id}"
        cached_data = cache.get(cache_key)
        self.assertIsNotNone(cached_data)
        self.assertEqual(len(cached_data), 1)
        
        # Create a new request (won't be in response until cache is cleared or expires, but for this test we just check cache works)
        LeaveRequest.objects.create(
            employee=self.employee, manager=self.manager, leave_type=self.leave_type,
            start_date=timezone.now().date() + datetime.timedelta(days=10), end_date=timezone.now().date() + datetime.timedelta(days=11),
            total_days=2, reason='Vacation', status=LeaveRequest.Status.PENDING
        )
        
        # Second call hits cache (still returns 1 item)
        response2 = self.client.get(self.url)
        self.assertEqual(len(response2.json()), 1)
        
        # Clear cache and hit again
        cache.clear()
        response3 = self.client.get(self.url)
        self.assertEqual(len(response3.json()), 2)
