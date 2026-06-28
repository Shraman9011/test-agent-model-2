"""
Management command to seed initial leave types and per-user leave balances.

Usage:
    python manage.py seed_leave_data
    python manage.py seed_leave_data --year 2027
    python manage.py seed_leave_data --clear   # wipe and re-seed
"""

import datetime

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction

from leaves.models import LeaveBalance, LeaveType

User = get_user_model()

LEAVE_TYPE_DEFAULTS = [
    {
        'name': 'Annual Leave',
        'description': 'Paid yearly vacation entitlement.',
        'max_days_per_year': 21,
    },
    {
        'name': 'Sick Leave',
        'description': 'Paid leave for personal illness or medical appointments.',
        'max_days_per_year': 10,
    },
    {
        'name': 'Casual Leave',
        'description': 'Short-notice leave for personal matters.',
        'max_days_per_year': 7,
    },
    {
        'name': 'Maternity Leave',
        'description': 'Paid leave for childbirth and newborn care.',
        'max_days_per_year': 90,
    },
    {
        'name': 'Paternity Leave',
        'description': 'Paid leave for a new father.',
        'max_days_per_year': 10,
    },
    {
        'name': 'Unpaid Leave',
        'description': 'Approved absence without pay.',
        'max_days_per_year': 30,
    },
]


class Command(BaseCommand):
    help = 'Seed initial leave types and leave balances for all existing users.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--year',
            type=int,
            default=datetime.date.today().year,
            help='Calendar year to create balances for (default: current year).',
        )
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Delete all existing LeaveType and LeaveBalance records before seeding.',
        )

    def handle(self, *args, **options):
        year = options['year']

        if options['clear']:
            self.stdout.write(self.style.WARNING('Clearing existing leave data…'))
            LeaveBalance.objects.all().delete()
            LeaveType.objects.all().delete()
            self.stdout.write(self.style.SUCCESS('Cleared.'))

        with transaction.atomic():
            leave_types = self._seed_leave_types()
            self._seed_leave_balances(leave_types, year)

        self.stdout.write(
            self.style.SUCCESS(
                f'Seeding complete. {len(leave_types)} leave types, '
                f'balances created for year {year}.'
            )
        )

    def _seed_leave_types(self):
        """Create leave types that do not already exist."""
        created_types = []
        for data in LEAVE_TYPE_DEFAULTS:
            leave_type, created = LeaveType.objects.get_or_create(
                name=data['name'],
                defaults={
                    'description': data['description'],
                    'max_days_per_year': data['max_days_per_year'],
                    'is_active': True,
                },
            )
            verb = 'Created' if created else 'Exists'
            self.stdout.write(f'  {verb}: LeaveType "{leave_type.name}"')
            created_types.append(leave_type)
        return created_types

    def _seed_leave_balances(self, leave_types, year):
        """Create a LeaveBalance row for every active user × active leave type."""
        users = User.objects.filter(is_active=True)
        if not users.exists():
            self.stdout.write(self.style.WARNING('No active users found — skipping balance seed.'))
            return

        created_count = 0
        skipped_count = 0
        for user in users:
            for leave_type in leave_types:
                if not leave_type.is_active:
                    continue
                _, created = LeaveBalance.objects.get_or_create(
                    employee=user,
                    leave_type=leave_type,
                    year=year,
                    defaults={'allocated_days': leave_type.max_days_per_year},
                )
                if created:
                    created_count += 1
                else:
                    skipped_count += 1

        self.stdout.write(
            f'  LeaveBalance rows — created: {created_count}, already existed: {skipped_count}'
        )
