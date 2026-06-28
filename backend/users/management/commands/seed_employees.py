from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from users.models import UserRole, EmployeeProfile

User = get_user_model()

class Command(BaseCommand):
    help = 'Seeds initial HR Admin and test employee data along with EmployeeProfiles.'

    def handle(self, *args, **kwargs):
        # 1. Create HR Admin
        hr_email = "hr.admin@unichronic.com"
        hr_user, hr_created = User.objects.get_or_create(
            email=hr_email,
            defaults={
                'first_name': 'HR',
                'last_name': 'Administrator',
                'role': UserRole.HR_ADMIN,
                'department': 'Human Resources'
            }
        )
        if hr_created:
            hr_user.set_password('hradmin123!')
            hr_user.save()
            self.stdout.write(self.style.SUCCESS(f'Created HR Admin: {hr_email}'))
        
        hr_profile, hp_created = EmployeeProfile.objects.get_or_create(
            user=hr_user,
            defaults={
                'role': 'Head of HR',
                'is_active': True
            }
        )

        # 2. Create Manager
        manager_email = "manager@unichronic.com"
        mgr_user, mgr_created = User.objects.get_or_create(
            email=manager_email,
            defaults={
                'first_name': 'Jane',
                'last_name': 'Manager',
                'role': UserRole.MANAGER,
                'department': 'Engineering'
            }
        )
        if mgr_created:
            mgr_user.set_password('manager123!')
            mgr_user.save()
            self.stdout.write(self.style.SUCCESS(f'Created Manager: {manager_email}'))

        mgr_profile, mp_created = EmployeeProfile.objects.get_or_create(
            user=mgr_user,
            defaults={
                'role': 'Engineering Lead',
                'is_active': True
            }
        )

        # 3. Create Employee reporting to Manager
        employee_email = "employee@unichronic.com"
        emp_user, emp_created = User.objects.get_or_create(
            email=employee_email,
            defaults={
                'first_name': 'John',
                'last_name': 'Employee',
                'role': UserRole.EMPLOYEE,
                'department': 'Engineering'
            }
        )
        if emp_created:
            emp_user.set_password('employee123!')
            emp_user.save()
            self.stdout.write(self.style.SUCCESS(f'Created Employee: {employee_email}'))
            
        emp_profile, ep_created = EmployeeProfile.objects.get_or_create(
            user=emp_user,
            defaults={
                'role': 'Software Developer',
                'manager': mgr_profile,
                'is_active': True
            }
        )
        
        if not ep_created and not emp_profile.manager:
            emp_profile.manager = mgr_profile
            emp_profile.save()

        self.stdout.write(self.style.SUCCESS('Database seeded successfully with test employees and profiles!'))
