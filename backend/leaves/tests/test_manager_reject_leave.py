from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.core.cache import cache
from users.models import User
from leaves.models import LeaveRequest, LeaveType, LeaveBalance
import datetime
from django.utils import timezone
from decimal import Decimal
from django.test import override_settings
from django.core import mail

@override_settings(CACHES={'default': {'BACKEND': 'django.core.cache.backends.locmem.LocMemCache'}})
class ManagerRejectLeaveTests(APITestCase):
    def setUp(self):
        self.manager = User.objects.create(email='manager@example.com', first_name='Manager', last_name='User', role='MANAGER')
        self.employee = User.objects.create(email='employee@example.com', first_name='Employee', last_name='User')
        self.other_manager = User.objects.create(email='other@example.com', first_name='Other', last_name='Manager', role='MANAGER')
        
        self.leave_type = LeaveType.objects.create(name='Annual', max_days_per_year=20)
        
        # Give employee a balance
        self.balance = LeaveBalance.objects.create(
            employee=self.employee.profile, leave_type=self.leave_type, year=timezone.now().date().year,
            allocated_days=20, used_days=0, pending_days=2
        )
        
        # Pending request for self.manager
        self.leave_request = LeaveRequest.objects.create(
            employee=self.employee, manager=self.manager, leave_type=self.leave_type,
            start_date=timezone.now().date(), end_date=timezone.now().date() + datetime.timedelta(days=1),
            total_days=2, reason='Vacation', status=LeaveRequest.Status.PENDING
        )
        
        self.url = reverse('leaves_api:manager-reject-leave', kwargs={'pk': self.leave_request.id})
        cache.clear()
        mail.outbox = []

    def test_manager_can_reject_request(self):
        self.client.force_authenticate(user=self.manager)
        response = self.client.post(self.url, {'rejection_reason': 'Need you in the office.'})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.leave_request.refresh_from_db()
        self.assertEqual(self.leave_request.status, LeaveRequest.Status.REJECTED)
        self.assertEqual(self.leave_request.rejection_reason, 'Need you in the office.')
        self.assertIsNotNone(self.leave_request.reviewed_at)
        
        self.balance.refresh_from_db()
        self.assertEqual(self.balance.pending_days, Decimal('0.0'))
        self.assertEqual(self.balance.used_days, Decimal('0.0')) # Days are returned
        
        # Check email sent
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn("Leave Request Rejected", mail.outbox[0].subject)

    def test_reject_requires_reason(self):
        self.client.force_authenticate(user=self.manager)
        response = self.client.post(self.url, {'rejection_reason': '   '})
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Rejection reason is required.', response.json()['error'])
        
        self.leave_request.refresh_from_db()
        self.assertEqual(self.leave_request.status, LeaveRequest.Status.PENDING)

    def test_other_manager_forbidden(self):
        self.client.force_authenticate(user=self.other_manager)
        response = self.client.post(self.url, {'rejection_reason': 'Rejected'})
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        self.leave_request.refresh_from_db()
        self.assertEqual(self.leave_request.status, LeaveRequest.Status.PENDING)

    def test_employee_forbidden(self):
        self.client.force_authenticate(user=self.employee)
        response = self.client.post(self.url, {'rejection_reason': 'Rejected'})
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_cannot_reject_already_approved(self):
        self.leave_request.status = LeaveRequest.Status.APPROVED
        self.leave_request.save()
        
        self.client.force_authenticate(user=self.manager)
        response = self.client.post(self.url, {'rejection_reason': 'Rejected'})
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Only pending requests can be rejected.', response.json()['error'])

    def test_reject_email_failure_does_not_block(self):
        self.client.force_authenticate(user=self.manager)
        
        from unittest.mock import patch
        with patch('leaves.email_utils.send_employee_decision_notification', side_effect=Exception('SMTP Error')):
            response = self.client.post(self.url, {'rejection_reason': 'Rejected'})
            
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.leave_request.refresh_from_db()
        self.assertEqual(self.leave_request.status, LeaveRequest.Status.REJECTED)
