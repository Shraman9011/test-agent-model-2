from django.test import TestCase
from django.core import mail
from leaves.email_utils import send_manager_notification, get_frontend_url
from users.models import User
from leaves.models import LeaveRequest, LeaveType
import datetime
from django.utils import timezone

class EmailUtilsTests(TestCase):
    def setUp(self):
        self.manager = User.objects.create(email='manager@example.com', first_name='Manager', last_name='User')
        self.employee = User.objects.create(email='employee@example.com', first_name='Employee', last_name='User')
        self.leave_type = LeaveType.objects.create(name='Annual', max_days_per_year=20)
        
    def test_send_manager_notification(self):
        leave_request = LeaveRequest.objects.create(
            employee=self.employee,
            manager=self.manager,
            leave_type=self.leave_type,
            start_date=timezone.now().date(),
            end_date=timezone.now().date() + datetime.timedelta(days=2),
            total_days=3,
            reason='Vacation'
        )
        
        result = send_manager_notification(leave_request)
        
        self.assertTrue(result)
        self.assertEqual(len(mail.outbox), 1)
        
        email = mail.outbox[0]
        self.assertEqual(email.subject, "Leave Request Approval Needed: Employee User")
        self.assertEqual(email.to, ["manager@example.com"])
        self.assertIn("Manager User", email.body)
        self.assertIn("Employee User", email.body)
        self.assertIn("Annual", email.body)
        self.assertIn("Vacation", email.body)
        
        self.assertEqual(len(email.alternatives), 1)
        html_content, mimetype = email.alternatives[0]
        self.assertEqual(mimetype, 'text/html')
        self.assertIn("<strong>Employee User</strong>", html_content)
        self.assertIn(get_frontend_url(), html_content)

    def test_send_manager_notification_no_manager(self):
        leave_request = LeaveRequest.objects.create(
            employee=self.employee,
            manager=None,
            leave_type=self.leave_type,
            start_date=timezone.now().date(),
            end_date=timezone.now().date() + datetime.timedelta(days=2),
            total_days=3,
            reason='Vacation'
        )
        
        result = send_manager_notification(leave_request)
        
        self.assertFalse(result)
        self.assertEqual(len(mail.outbox), 0)
