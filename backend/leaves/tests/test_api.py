from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from django.core.cache import cache
from leaves.models import LeaveType, LeaveBalance
from decimal import Decimal
from datetime import date
from decimal import Decimal
from datetime import date
from django.test import override_settings

User = get_user_model()

@override_settings(CACHES={'default': {'BACKEND': 'django.core.cache.backends.locmem.LocMemCache'}})
class LeaveBalanceAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            password='Password123!',
            first_name='Test',
            last_name='User'
        )
        self.other_user = User.objects.create_user(
            email='other@example.com',
            password='Password123!',
            first_name='Other',
            last_name='User'
        )
        
        self.leave_type = LeaveType.objects.create(name='Annual', max_days_per_year=20)
        self.current_year = date.today().year
        
        self.balance = LeaveBalance.objects.create(
            employee=self.user,
            leave_type=self.leave_type,
            year=self.current_year,
            allocated_days=Decimal('20.0'),
            used_days=Decimal('5.0'),
            pending_days=Decimal('0.0')
        )
        
        self.url = reverse('leaves_api:leave-balances')
        cache.clear()

    def test_get_leave_balances_unauthenticated(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_get_leave_balances_authenticated(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['allocated_days'], '20.0')
        self.assertEqual(response.data[0]['remaining_days'], '15.0')
        
        # Test caching
        cache_key = f"leave_balances_{self.user.id}_{self.current_year}"
        cached_data = cache.get(cache_key)
        self.assertIsNotNone(cached_data)
        self.assertEqual(cached_data[0]['allocated_days'], '20.0')

    def test_role_based_access_only_own_balances(self):
        # Even if other balances exist, user should only see their own
        LeaveBalance.objects.create(
            employee=self.other_user,
            leave_type=self.leave_type,
            year=self.current_year,
            allocated_days=Decimal('10.0')
        )
        
        self.client.force_authenticate(user=self.user)
        response = self.client.get(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['allocated_days'], '20.0')

    def test_cache_invalidation_on_leave_approval(self):
        from leaves.models import LeaveRequest
        
        # Populate cache
        self.client.force_authenticate(user=self.user)
        self.client.get(self.url)
        cache_key = f"leave_balances_{self.user.id}_{self.current_year}"
        self.assertIsNotNone(cache.get(cache_key))
        
        # Create and approve a leave request
        request = LeaveRequest.objects.create(
            employee=self.user,
            leave_type=self.leave_type,
            start_date=date(self.current_year, 1, 1),
            end_date=date(self.current_year, 1, 2),
            total_days=2,
            reason="Vacation",
            status=LeaveRequest.Status.PENDING
        )
        
        # Change status to approved (should trigger post_save signal and invalidate cache)
        request.status = LeaveRequest.Status.APPROVED
        request.save()
        
        # Verify cache is cleared
        self.assertIsNone(cache.get(cache_key))
