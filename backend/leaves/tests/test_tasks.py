from decimal import Decimal
from django.test import TestCase
from django.contrib.auth import get_user_model
from leaves.models import LeaveType, LeaveBalance
from leaves.tasks import update_retroactive_leave_balances

User = get_user_model()

class CeleryTaskTests(TestCase):
    def setUp(self):
        # Create a leave type
        self.leave_type = LeaveType.objects.create(
            name='Annual Leave',
            max_days_per_year=20
        )
        
        # Create users
        self.user1 = User.objects.create_user(
            email='emp1@test.com',
            password='password123',
            first_name='Emp',
            last_name='One',
            role='EMPLOYEE'
        )
        self.user2 = User.objects.create_user(
            email='emp2@test.com',
            password='password123',
            first_name='Emp',
            last_name='Two',
            role='EMPLOYEE'
        )
        self.user3 = User.objects.create_user(
            email='emp3@test.com',
            password='password123',
            first_name='Emp',
            last_name='Three',
            role='EMPLOYEE'
        )
        
        # Make user3 inactive
        self.user3.profile.is_active = False
        self.user3.profile.save()
        
        # Give user1 an existing balance
        LeaveBalance.objects.create(
            employee=self.user1.profile,
            leave_type=self.leave_type,
            year=2026,
            allocated_days=Decimal('20.0')
        )
        
    def test_update_retroactive_leave_balances(self):
        # Run the task synchronously for testing
        updated_count = update_retroactive_leave_balances(
            leave_type_id=self.leave_type.id,
            new_days=25.0,
            current_year=2026
        )
        
        # Should update 2 active employees
        self.assertEqual(updated_count, 2)
        
        # Check user1 (existing balance updated)
        balance1 = LeaveBalance.objects.get(employee=self.user1.profile, leave_type=self.leave_type, year=2026)
        self.assertEqual(balance1.allocated_days, Decimal('25.0'))
        
        # Check user2 (new balance created)
        balance2 = LeaveBalance.objects.get(employee=self.user2.profile, leave_type=self.leave_type, year=2026)
        self.assertEqual(balance2.allocated_days, Decimal('25.0'))
        
        # Check user3 (inactive, should not have balance created)
        with self.assertRaises(LeaveBalance.DoesNotExist):
            LeaveBalance.objects.get(employee=self.user3.profile, leave_type=self.leave_type, year=2026)

    def test_update_retroactive_leave_balances_invalid_leave_type(self):
        # Should handle nonexistent leave type gracefully
        updated_count = update_retroactive_leave_balances(
            leave_type_id=999,
            new_days=25.0,
            current_year=2026
        )
        self.assertIsNone(updated_count)
