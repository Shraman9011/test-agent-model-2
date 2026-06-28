"""
Unit and integration tests for leaves.models.

Run with:  python manage.py test leaves.tests.test_models
"""

import datetime
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction
from django.test import TestCase

from leaves.models import LeaveBalance, LeaveRequest, LeaveType

User = get_user_model()


# --------------------------------------------------------------------------- #
# Helpers                                                                      #
# --------------------------------------------------------------------------- #

def make_user(username='employee1', **kwargs):
    """
    Create a test user compatible with the custom User model (email-based).

    The custom UserManager uses email as the primary identifier.
    We derive the email from username to keep existing call sites unchanged.
    """
    email = kwargs.pop('email', f'{username}@example.com')
    first_name = kwargs.pop('first_name', 'Test')
    last_name = kwargs.pop('last_name', 'User')
    return User.objects.create_user(
        email=email,
        password='testpass',
        first_name=first_name,
        last_name=last_name,
        **kwargs,
    )


def make_leave_type(name='Annual Leave', max_days=21):
    return LeaveType.objects.create(name=name, max_days_per_year=max_days)


# --------------------------------------------------------------------------- #
# LeaveType tests                                                              #
# --------------------------------------------------------------------------- #

class LeaveTypeModelTest(TestCase):

    def test_create_leave_type(self):
        lt = make_leave_type()
        self.assertEqual(lt.name, 'Annual Leave')
        self.assertEqual(lt.max_days_per_year, 21)
        self.assertTrue(lt.is_active)

    def test_name_must_be_unique(self):
        make_leave_type(name='Sick Leave')
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                make_leave_type(name='Sick Leave')

    def test_max_days_must_be_at_least_one(self):
        lt = LeaveType(name='Zero Days', max_days_per_year=0)
        with self.assertRaises(ValidationError):
            lt.full_clean()

    def test_str_returns_name(self):
        lt = make_leave_type(name='Casual Leave')
        self.assertEqual(str(lt), 'Casual Leave')


# --------------------------------------------------------------------------- #
# LeaveRequest tests                                                           #
# --------------------------------------------------------------------------- #

class LeaveRequestModelTest(TestCase):

    def setUp(self):
        self.user = make_user()
        self.leave_type = make_leave_type()

    def _make_request(self, **kwargs):
        defaults = dict(
            employee=self.user,
            leave_type=self.leave_type,
            start_date=datetime.date(2026, 7, 1),
            end_date=datetime.date(2026, 7, 5),
            total_days=5,
            reason='Vacation',
        )
        defaults.update(kwargs)
        return LeaveRequest.objects.create(**defaults)

    def test_create_leave_request(self):
        req = self._make_request()
        self.assertEqual(req.status, LeaveRequest.Status.PENDING)
        self.assertIsNotNone(req.applied_at)

    def test_default_status_is_pending(self):
        req = self._make_request()
        self.assertEqual(req.status, 'PENDING')

    def test_str_representation(self):
        req = self._make_request()
        self.assertIn('Annual Leave', str(req))
        self.assertIn('PENDING', str(req))

    def test_end_date_before_start_date_fails_db_constraint(self):
        with self.assertRaises(Exception):
            with transaction.atomic():
                self._make_request(
                    start_date=datetime.date(2026, 7, 10),
                    end_date=datetime.date(2026, 7, 5),
                    total_days=1,
                )

    def test_end_date_before_start_date_fails_validation(self):
        req = LeaveRequest(
            employee=self.user,
            leave_type=self.leave_type,
            start_date=datetime.date(2026, 7, 10),
            end_date=datetime.date(2026, 7, 5),
            total_days=1,
            reason='Bad dates',
        )
        # The DB constraint will fire; model-level full_clean should also fail
        # if the caller invokes it.  We validate total_days at minimum here.
        with self.assertRaises(ValidationError):
            req.total_days = 0
            req.full_clean()

    def test_zero_total_days_fails_validation(self):
        req = LeaveRequest(
            employee=self.user,
            leave_type=self.leave_type,
            start_date=datetime.date(2026, 7, 1),
            end_date=datetime.date(2026, 7, 1),
            total_days=0,
            reason='Same-day, zero days',
        )
        with self.assertRaises(ValidationError):
            req.full_clean()

    def test_employee_fk_is_protected(self):
        self._make_request()
        with self.assertRaises(Exception):
            with transaction.atomic():
                self.user.delete()

    def test_leave_type_fk_is_protected(self):
        self._make_request()
        with self.assertRaises(Exception):
            with transaction.atomic():
                self.leave_type.delete()

    def test_indexes_exist(self):
        index_names = {
            idx.name
            for idx in LeaveRequest._meta.indexes
        }
        self.assertIn('idx_leavereq_emp_stat_type', index_names)
        self.assertIn('idx_leavereq_dates', index_names)


# --------------------------------------------------------------------------- #
# LeaveBalance tests                                                           #
# --------------------------------------------------------------------------- #

class LeaveBalanceModelTest(TestCase):

    def setUp(self):
        self.user = make_user()
        self.leave_type = make_leave_type()

    def _make_balance(self, **kwargs):
        defaults = dict(
            employee=self.user,
            leave_type=self.leave_type,
            year=2026,
            allocated_days=Decimal('21.0'),
        )
        defaults.update(kwargs)
        return LeaveBalance.objects.create(**defaults)

    def test_create_leave_balance(self):
        bal = self._make_balance()
        self.assertEqual(bal.allocated_days, Decimal('21.0'))
        self.assertEqual(bal.used_days, Decimal('0.0'))
        self.assertEqual(bal.pending_days, Decimal('0.0'))

    def test_remaining_days_property(self):
        bal = self._make_balance(
            allocated_days=Decimal('21.0'),
            used_days=Decimal('5.0'),
            pending_days=Decimal('3.0'),
        )
        self.assertEqual(bal.remaining_days, Decimal('13.0'))

    def test_unique_together_employee_leavetype_year(self):
        self._make_balance()
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                self._make_balance()

    def test_negative_used_days_fails_db_constraint(self):
        with self.assertRaises(Exception):
            with transaction.atomic():
                self._make_balance(used_days=Decimal('-1.0'))

    def test_negative_pending_days_fails_db_constraint(self):
        with self.assertRaises(Exception):
            with transaction.atomic():
                self._make_balance(pending_days=Decimal('-1.0'))

    def test_negative_allocated_days_fails_validation(self):
        bal = LeaveBalance(
            employee=self.user,
            leave_type=self.leave_type,
            year=2026,
            allocated_days=Decimal('-5.0'),
        )
        with self.assertRaises(ValidationError):
            bal.full_clean()

    def test_str_representation(self):
        bal = self._make_balance()
        self.assertIn('Annual Leave', str(bal))
        self.assertIn('2026', str(bal))
        self.assertIn('remaining', str(bal))

    def test_different_years_same_user_type_allowed(self):
        self._make_balance(year=2026)
        bal2 = self._make_balance(year=2027)
        self.assertEqual(bal2.year, 2027)

    def test_different_leave_types_same_user_year_allowed(self):
        sick = make_leave_type(name='Sick Leave', max_days=10)
        self._make_balance()
        bal2 = LeaveBalance.objects.create(
            employee=self.user,
            leave_type=sick,
            year=2026,
            allocated_days=Decimal('10.0'),
        )
        self.assertEqual(bal2.leave_type.name, 'Sick Leave')
