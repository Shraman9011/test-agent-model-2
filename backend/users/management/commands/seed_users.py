"""
Management command to seed initial test users with different roles.

Creates one user per role (Employee, Manager, HR Administrator) plus one
Django superuser for admin panel access.  All passwords are read from
environment variables so no credentials are hardcoded.

Usage:
    python manage.py seed_users
    python manage.py seed_users --clear    # delete existing seed users first

Environment variables (see .env.example):
    SEED_EMPLOYEE_EMAIL     default: employee@example.com
    SEED_EMPLOYEE_PASSWORD  default: Employee@123!
    SEED_MANAGER_EMAIL      default: manager@example.com
    SEED_MANAGER_PASSWORD   default: Manager@123!
    SEED_HRADMIN_EMAIL      default: hradmin@example.com
    SEED_HRADMIN_PASSWORD   default: HrAdmin@123!
    SEED_SUPER_EMAIL        default: superuser@example.com
    SEED_SUPER_PASSWORD     default: SuperAdmin@123!
"""

import os

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction

from users.models import UserRole

User = get_user_model()


# --------------------------------------------------------------------------- #
# Seed data definitions — credentials resolved from env vars                  #
# --------------------------------------------------------------------------- #

def _seed_users_config():
    """
    Return a list of dicts describing users to seed.

    Passwords are read from environment variables so they can be changed
    per environment without modifying source code.

    Returns:
        list[dict]: Seed user configurations.
    """
    return [
        {
            'email':      os.getenv('SEED_EMPLOYEE_EMAIL',    'employee@example.com'),
            'password':   os.getenv('SEED_EMPLOYEE_PASSWORD', 'Employee@123!'),
            'first_name': 'Alice',
            'last_name':  'Smith',
            'role':       UserRole.EMPLOYEE,
            'department': 'Engineering',
            'phone_number': '+91-9000000001',
            'is_staff':   False,
        },
        {
            'email':      os.getenv('SEED_MANAGER_EMAIL',    'manager@example.com'),
            'password':   os.getenv('SEED_MANAGER_PASSWORD', 'Manager@123!'),
            'first_name': 'Bob',
            'last_name':  'Johnson',
            'role':       UserRole.MANAGER,
            'department': 'Engineering',
            'phone_number': '+91-9000000002',
            'is_staff':   False,
        },
        {
            'email':      os.getenv('SEED_HRADMIN_EMAIL',    'hradmin@example.com'),
            'password':   os.getenv('SEED_HRADMIN_PASSWORD', 'HrAdmin@123!'),
            'first_name': 'Carol',
            'last_name':  'Williams',
            'role':       UserRole.HR_ADMIN,
            'department': 'Human Resources',
            'phone_number': '+91-9000000003',
            'is_staff':   True,
        },
        {
            'email':      os.getenv('SEED_SUPER_EMAIL',    'superuser@example.com'),
            'password':   os.getenv('SEED_SUPER_PASSWORD', 'SuperAdmin@123!'),
            'first_name': 'Dave',
            'last_name':  'Admin',
            'role':       UserRole.HR_ADMIN,
            'department': 'IT',
            'phone_number': '+91-9000000004',
            'is_superuser': True,
            'is_staff':     True,
        },
    ]


class Command(BaseCommand):
    """Seed initial test users with Employee, Manager, and HR Administrator roles."""

    help = (
        'Seed initial test users with different roles (Employee, Manager, HR Administrator). '
        'Credentials are read from environment variables — see .env.example.'
    )

    def add_arguments(self, parser):
        """Register command-line options."""
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Delete all existing seed users before re-seeding.',
        )

    def handle(self, *args, **options):
        """
        Entry point for the management command.

        Args:
            *args: Positional arguments (unused).
            **options: Parsed CLI options.
        """
        seed_config = _seed_users_config()
        seed_emails = [cfg['email'] for cfg in seed_config]

        if options['clear']:
            self.stdout.write(self.style.WARNING('Clearing existing seed users…'))
            deleted_count, _ = User.objects.filter(email__in=seed_emails).delete()
            self.stdout.write(self.style.SUCCESS(f'Deleted {deleted_count} seed user(s).'))

        created_count  = 0
        existing_count = 0

        with transaction.atomic():
            for cfg in seed_config:
                is_superuser = cfg.pop('is_superuser', False)
                user, created = User.objects.get_or_create(
                    email=cfg['email'],
                    defaults={k: v for k, v in cfg.items() if k != 'password'},
                )

                if created:
                    # Set the hashed password only on creation.
                    user.set_password(cfg['password'])
                    if is_superuser:
                        user.is_superuser = True
                        user.is_staff     = True
                    user.save()
                    created_count += 1
                    self.stdout.write(
                        f'  Created: {user.email} '
                        f'[{user.get_role_display()}]'
                    )
                else:
                    existing_count += 1
                    self.stdout.write(
                        f'  Already exists: {user.email} '
                        f'[{user.get_role_display()}]'
                    )

        self.stdout.write(
            self.style.SUCCESS(
                f'\nSeeding complete — '
                f'created: {created_count}, already existed: {existing_count}.'
            )
        )
        self.stdout.write(
            self.style.WARNING(
                '\n[WARNING] These are DEV/TEST credentials. '
                'Do NOT use default passwords in production.'
            )
        )
