import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'test_agent_model_2.settings')
django.setup()

from datetime import date
from django.contrib.auth import get_user_model
from leaves.models import LeaveType, LeaveRequest

User = get_user_model()

employee = User.objects.filter(email='employee@example.com').first()
manager = User.objects.filter(email='manager@example.com').first()

if not employee or not manager:
    print("Users not found.")
    exit(1)

leave_type = LeaveType.objects.first()
if not leave_type:
    leave_type = LeaveType.objects.create(name='Annual', max_days_per_year=20)

LeaveRequest.objects.create(
    employee=employee,
    leave_type=leave_type,
    start_date=date(2026, 8, 1),
    end_date=date(2026, 8, 5),
    total_days=5,
    reason="Family vacation",
    status=LeaveRequest.Status.PENDING,
)

LeaveRequest.objects.create(
    employee=employee,
    leave_type=leave_type,
    start_date=date(2026, 6, 1),
    end_date=date(2026, 6, 2),
    total_days=2,
    reason="Medical",
    status=LeaveRequest.Status.APPROVED,
    manager=manager,
    manager_comments="Approved, take care.",
)

LeaveRequest.objects.create(
    employee=employee,
    leave_type=leave_type,
    start_date=date(2026, 9, 10),
    end_date=date(2026, 9, 20),
    total_days=11,
    reason="Long trip",
    status=LeaveRequest.Status.REJECTED,
    manager=manager,
    rejection_reason="Too many days during peak season.",
)

print("Seed data for leave requests created successfully!")
