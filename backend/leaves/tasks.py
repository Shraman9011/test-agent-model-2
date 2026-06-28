import logging
from celery import shared_task
from django.db import transaction
from leaves.models import LeaveBalance, LeaveType
from users.models import EmployeeProfile

logger = logging.getLogger(__name__)

@shared_task
def update_retroactive_leave_balances(leave_type_id, new_days, current_year):
    """
    Background job to update leave balances for all active employees
    when a policy is retroactively updated.
    """
    logger.info(f"Starting retroactive leave balance update for leave_type_id={leave_type_id}, year={current_year}, new_days={new_days}")
    
    try:
        leave_type = LeaveType.objects.get(id=leave_type_id)
    except LeaveType.DoesNotExist:
        logger.error(f"LeaveType with id={leave_type_id} does not exist.")
        return

    # Process in batches to handle large volumes
    active_employees = EmployeeProfile.objects.filter(is_active=True).values_list('id', flat=True)
    total_employees = active_employees.count()
    
    logger.info(f"Found {total_employees} active employees to update.")

    updated_count = 0
    batch_size = 100
    
    # We could just do a bulk update:
    # LeaveBalance.objects.filter(leave_type_id=leave_type_id, year=current_year, employee__is_active=True).update(allocated_days=new_days)
    # But the checklist says "Job handles large volumes of employees without timing out"
    # and doing it in batches with logging is better for a background job.
    
    active_employee_ids = list(active_employees)
    for i in range(0, total_employees, batch_size):
        batch_ids = active_employee_ids[i:i + batch_size]
        
        with transaction.atomic():
            # Get existing balances
            existing_balances = LeaveBalance.objects.filter(
                leave_type_id=leave_type_id,
                year=current_year,
                employee_id__in=batch_ids
            )
            
            # Find which employees don't have a balance yet
            existing_employee_ids = set(existing_balances.values_list('employee_id', flat=True))
            missing_ids = set(batch_ids) - existing_employee_ids
            
            # Update existing balances
            existing_balances.update(allocated_days=new_days)
            
            # Create missing balances
            if missing_ids:
                new_balances = [
                    LeaveBalance(
                        employee_id=emp_id,
                        leave_type_id=leave_type_id,
                        year=current_year,
                        allocated_days=new_days,
                        used_days=0,
                        pending_days=0
                    ) for emp_id in missing_ids
                ]
                LeaveBalance.objects.bulk_create(new_balances)
        
        updated_count += len(batch_ids)
        logger.info(f"Processed {updated_count}/{total_employees} employee balances.")
        
    logger.info(f"Completed retroactive leave balance update. Total updated: {updated_count}.")
    return updated_count
