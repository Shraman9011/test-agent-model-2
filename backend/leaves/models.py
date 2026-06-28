from decimal import Decimal

from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models


class LeaveType(models.Model):
    """Defines a category of leave (e.g. Annual, Sick, Casual)."""

    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    max_days_per_year = models.PositiveIntegerField(
        validators=[MinValueValidator(1)],
        help_text="Maximum leave days of this type allowed per employee per year.",
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'leaves_leavetype'
        ordering = ['name']
        verbose_name = 'Leave Type'
        verbose_name_plural = 'Leave Types'

    def __str__(self):
        return self.name


class LeaveRequest(models.Model):
    """A single leave application submitted by an employee."""

    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        APPROVED = 'APPROVED', 'Approved'
        REJECTED = 'REJECTED', 'Rejected'
        CANCELLED = 'CANCELLED', 'Cancelled'

    employee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='leave_requests',
    )
    leave_type = models.ForeignKey(
        LeaveType,
        on_delete=models.PROTECT,
        related_name='requests',
    )
    start_date = models.DateField()
    end_date = models.DateField()
    # Stored explicitly to avoid repeated business-day recalculations.
    total_days = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    reason = models.TextField()
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
        db_index=True,
    )
    applied_at = models.DateTimeField(auto_now_add=True)
    manager = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='managed_leaves',
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    manager_comments = models.TextField(blank=True, null=True)
    rejection_reason = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'leaves_leaverequest'
        ordering = ['-applied_at']
        indexes = [
            models.Index(fields=['employee', 'status', 'leave_type'], name='idx_leavereq_emp_stat_type'),
            models.Index(fields=['start_date', 'end_date'], name='idx_leavereq_dates'),
            models.Index(fields=['manager', 'status'], name='idx_leavereq_manager_status'),
        ]
        constraints = [
            models.CheckConstraint(
                check=models.Q(end_date__gte=models.F('start_date')),
                name='chk_leavereq_end_gte_start',
            ),
            models.CheckConstraint(
                check=models.Q(total_days__gte=1),
                name='chk_leavereq_total_days_positive',
            ),
        ]

    def __str__(self):
        return (
            f"{self.employee} — {self.leave_type.name} "
            f"({self.start_date} to {self.end_date}) [{self.status}]"
        )


class LeaveBalance(models.Model):
    """Tracks allocated, used, and pending leave days per employee per type per year."""

    employee = models.ForeignKey(
        'users.EmployeeProfile',
        on_delete=models.CASCADE,
        related_name='leave_balances',
        to_field='user',
    )
    leave_type = models.ForeignKey(
        LeaveType,
        on_delete=models.CASCADE,
        related_name='balances',
    )
    # Calendar year this balance applies to.
    year = models.PositiveIntegerField(validators=[MinValueValidator(2000)])
    allocated_days = models.DecimalField(
        max_digits=5,
        decimal_places=1,
        validators=[MinValueValidator(Decimal('0.0'))],
    )
    used_days = models.DecimalField(
        max_digits=5,
        decimal_places=1,
        default=Decimal('0.0'),
        validators=[MinValueValidator(Decimal('0.0'))],
    )
    # Days consumed by PENDING requests, not yet deducted from used_days.
    pending_days = models.DecimalField(
        max_digits=5,
        decimal_places=1,
        default=Decimal('0.0'),
        validators=[MinValueValidator(Decimal('0.0'))],
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'leaves_leavebalance'
        unique_together = [('employee', 'leave_type', 'year')]
        indexes = [
            models.Index(fields=['employee', 'year'], name='idx_leavebal_emp_year'),
        ]
        constraints = [
            models.CheckConstraint(
                check=models.Q(allocated_days__gte=0),
                name='chk_leavebal_allocated_non_negative',
            ),
            models.CheckConstraint(
                check=models.Q(used_days__gte=0),
                name='chk_leavebal_used_non_negative',
            ),
            models.CheckConstraint(
                check=models.Q(pending_days__gte=0),
                name='chk_leavebal_pending_non_negative',
            ),
        ]

    def __str__(self):
        return (
            f"{self.employee} — {self.leave_type.name} "
            f"({self.year}): {self.remaining_days} days remaining"
        )

    @property
    def remaining_days(self):
        """Available days = allocated − used − pending."""
        return self.allocated_days - self.used_days - self.pending_days

class Holiday(models.Model):
    """Official company holidays (non-working days)."""
    name = models.CharField(max_length=100)
    date = models.DateField(unique=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'leaves_holiday'
        ordering = ['date']
        indexes = [
            models.Index(fields=['date'], name='idx_holiday_date'),
        ]
        verbose_name = 'Company Holiday'
        verbose_name_plural = 'Company Holidays'

    def __str__(self):
        return f"{self.name} ({self.date})"


class LeaveAdjustmentAuditLog(models.Model):
    """Immutable audit trail for manual leave balance adjustments."""

    employee = models.ForeignKey(
        'users.EmployeeProfile',
        on_delete=models.CASCADE,
        related_name='leave_adjustments',
    )
    leave_type = models.ForeignKey(
        LeaveType,
        on_delete=models.CASCADE,
        related_name='adjustments',
    )
    adjustment_amount = models.DecimalField(
        max_digits=5,
        decimal_places=1,
        help_text="Positive for addition, negative for deduction."
    )
    reason = models.TextField()
    adjusted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='made_leave_adjustments',
        help_text="HR Admin who made the adjustment."
    )
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'leaves_leaveadjustmentauditlog'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['employee', 'timestamp'], name='idx_leaveadj_emp_time'),
        ]

    def __str__(self):
        return f"{self.employee} - {self.leave_type.name} ({self.adjustment_amount})"
