from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.core import mail
from users.models import User
from leaves.models import LeaveType, LeaveBalance, LeaveRequest
import datetime
from django.utils import timezone
from decimal import Decimal

class LeaveRequestCreateEmailTests(APITestCase):
    def setUp(self):
        self.manager = User.objects.create(email='manager@example.com', first_name='Manager', last_name='User', role='MANAGER')
        self.employee = User.objects.create(email='employee@example.com', first_name='Employee', last_name='User')
        
        self.leave_type = LeaveType.objects.create(name='Annual', max_days_per_year=20)
        
        self.balance = LeaveBalance.objects.create(
            employee=self.employee, leave_type=self.leave_type, year=timezone.now().date().year,
            allocated_days=20, used_days=0, pending_days=0
        )
        
        self.url = reverse('leaves_api:leave-create')
        mail.outbox = []

    def test_create_leave_request_sends_email(self):
        self.client.force_authenticate(user=self.employee)
        
        payload = {
            'leave_type': self.leave_type.id,
            'start_date': timezone.now().date().isoformat(),
            'end_date': (timezone.now().date() + datetime.timedelta(days=1)).isoformat(),
            'total_days': 2,
            'reason': 'Vacation',
            'manager': self.manager.id
        }
        
        response = self.client.post(self.url, payload, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(LeaveRequest.objects.count(), 1)
        
        # Verify email was sent
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, [self.manager.email])
        self.assertIn('Leave Request Approval Needed', mail.outbox[0].subject)

    def test_create_leave_request_email_failure_does_not_block(self):
        self.client.force_authenticate(user=self.employee)
        
        payload = {
            'leave_type': self.leave_type.id,
            'start_date': timezone.now().date().isoformat(),
            'end_date': (timezone.now().date() + datetime.timedelta(days=1)).isoformat(),
            'total_days': 2,
            'reason': 'Vacation',
            'manager': self.manager.id
        }
        
        # Patch send_manager_notification to raise an exception
        from unittest.mock import patch
        with patch('leaves.email_utils.send_manager_notification', side_effect=Exception('SMTP Error')):
            response = self.client.post(self.url, payload, format='json')
            
        # The request should still succeed!
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(LeaveRequest.objects.count(), 1)
