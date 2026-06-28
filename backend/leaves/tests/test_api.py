from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from django.core.cache import cache
from leaves.models import LeaveType, LeaveBalance, Holiday
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

class HolidayAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='holiday_tester@example.com',
            password='Password123!',
            first_name='Test',
            last_name='User'
        )
        self.url = reverse('leaves_api:holidays')
        
        self.current_year = date.today().year
        # We need a date that is clearly past
        self.past_date = date(self.current_year, 1, 1)
        # If today is Jan 1st, then past date logic might be tricky, let's just use an arbitrary past year for past
        self.past_holiday = Holiday.objects.create(name="Past", date=date(2000, 1, 1))
        
        # Future dates for the current year
        import datetime
        self.future_date_1 = date.today() + datetime.timedelta(days=10)
        if self.future_date_1.year != self.current_year:
            self.future_date_1 = date(self.current_year, 12, 29) # Safe bet
            
        self.future_date_2 = date.today() + datetime.timedelta(days=20)
        if self.future_date_2.year != self.current_year:
            self.future_date_2 = date(self.current_year, 12, 30)

        # Create out of order to test sorting
        self.holiday2 = Holiday.objects.create(name="Later", date=self.future_date_2)
        self.holiday1 = Holiday.objects.create(name="Sooner", date=self.future_date_1)
        
    def test_get_holidays_unauthenticated(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_get_holidays_authenticated(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Should not include past holiday from year 2000
        self.assertEqual(len(response.data), 2)
        
        # Should be sorted chronologically
        self.assertEqual(response.data[0]['name'], "Sooner")
        self.assertEqual(response.data[1]['name'], "Later")

@override_settings(CACHES={'default': {'BACKEND': 'django.core.cache.backends.locmem.LocMemCache'}})
class LeaveRequestHistoryAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='history_tester@example.com',
            password='Password123!'
        )
        self.other_user = User.objects.create_user(
            email='other_tester@example.com',
            password='Password123!'
        )
        
        self.leave_type_annual = LeaveType.objects.create(name='Annual', max_days_per_year=20)
        self.leave_type_sick = LeaveType.objects.create(name='Sick', max_days_per_year=10)
        
        from leaves.models import LeaveRequest
        
        # Create some requests for the user
        self.req1 = LeaveRequest.objects.create(
            employee=self.user,
            leave_type=self.leave_type_annual,
            start_date=date.today(),
            end_date=date.today(),
            total_days=1,
            status=LeaveRequest.Status.APPROVED
        )
        self.req2 = LeaveRequest.objects.create(
            employee=self.user,
            leave_type=self.leave_type_sick,
            start_date=date.today(),
            end_date=date.today(),
            total_days=1,
            status=LeaveRequest.Status.PENDING
        )
        
        # Create a request for another user
        LeaveRequest.objects.create(
            employee=self.other_user,
            leave_type=self.leave_type_annual,
            start_date=date.today(),
            end_date=date.today(),
            total_days=1,
            status=LeaveRequest.Status.APPROVED
        )
        
        self.url = reverse('leaves_api:leave-history')

    def test_get_history_unauthenticated(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_get_history_authenticated_only_own(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('results', response.data)
        # Should only see their own 2 requests, not the other_user's
        self.assertEqual(len(response.data['results']), 2)

    def test_get_history_filter_by_status(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get(self.url, {'status': 'PENDING'})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['status'], 'PENDING')

    def test_get_history_filter_by_leave_type(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get(self.url, {'leave_type': self.leave_type_sick.id})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['leave_type']['name'], 'Sick')

@override_settings(CACHES={'default': {'BACKEND': 'django.core.cache.backends.locmem.LocMemCache'}})
class LeaveRequestCreateAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='create_tester@example.com',
            password='Password123!'
        )
        self.leave_type = LeaveType.objects.create(name='Annual', max_days_per_year=20)
        self.current_year = date.today().year
        
        self.balance = LeaveBalance.objects.create(
            employee=self.user,
            leave_type=self.leave_type,
            year=self.current_year,
            allocated_days=Decimal('20.0'),
            used_days=Decimal('5.0'),
            pending_days=Decimal('5.0')
        )
        # Remaining balance is 20 - 5 - 5 = 10 days
        
        from leaves.models import LeaveRequest
        self.existing_req = LeaveRequest.objects.create(
            employee=self.user,
            leave_type=self.leave_type,
            start_date=date(self.current_year, 10, 1),
            end_date=date(self.current_year, 10, 5),
            total_days=5,
            status=LeaveRequest.Status.APPROVED
        )
        
        self.url = reverse('leaves_api:leave-create')

    def test_create_leave_success(self):
        self.client.force_authenticate(user=self.user)
        payload = {
            'leave_type': self.leave_type.id,
            'start_date': f'{self.current_year}-11-01',
            'end_date': f'{self.current_year}-11-05',
            'total_days': 5,
            'reason': 'Vacation'
        }
        response = self.client.post(self.url, payload, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.balance.refresh_from_db()
        # Pending days should have increased by 5 (from 5 to 10)
        self.assertEqual(self.balance.pending_days, Decimal('10.0'))

    def test_create_leave_overlap_error(self):
        self.client.force_authenticate(user=self.user)
        payload = {
            'leave_type': self.leave_type.id,
            'start_date': f'{self.current_year}-10-03',
            'end_date': f'{self.current_year}-10-07',
            'total_days': 5,
            'reason': 'Overlap'
        }
        response = self.client.post(self.url, payload, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Requested dates overlap with an existing leave request.", str(response.data))

    def test_create_leave_insufficient_balance(self):
        self.client.force_authenticate(user=self.user)
        payload = {
            'leave_type': self.leave_type.id,
            'start_date': f'{self.current_year}-12-01',
            'end_date': f'{self.current_year}-12-15',
            'total_days': 15, # we only have 10 remaining
            'reason': 'Too long'
        }
        response = self.client.post(self.url, payload, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Requested days exceed available leave balance.", str(response.data))

    def test_create_leave_invalid_dates(self):
        self.client.force_authenticate(user=self.user)
        payload = {
            'leave_type': self.leave_type.id,
            'start_date': f'{self.current_year}-11-10',
            'end_date': f'{self.current_year}-11-05', # End before start
            'total_days': 5,
            'reason': 'Invalid dates'
        }
        response = self.client.post(self.url, payload, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("end_date", response.data)
