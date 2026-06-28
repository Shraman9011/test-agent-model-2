from django.contrib import admin

from .models import LeaveBalance, LeaveRequest, LeaveType


@admin.register(LeaveType)
class LeaveTypeAdmin(admin.ModelAdmin):
    list_display = ('name', 'max_days_per_year', 'is_active', 'created_at')
    list_filter = ('is_active',)
    search_fields = ('name',)
    ordering = ('name',)


@admin.register(LeaveRequest)
class LeaveRequestAdmin(admin.ModelAdmin):
    list_display = (
        'employee', 'leave_type', 'start_date', 'end_date',
        'total_days', 'status', 'applied_at',
    )
    list_filter = ('status', 'leave_type')
    search_fields = ('employee__username', 'employee__email', 'reason')
    ordering = ('-applied_at',)
    readonly_fields = ('applied_at', 'created_at', 'updated_at')
    raw_id_fields = ('employee', 'reviewed_by')


@admin.register(LeaveBalance)
class LeaveBalanceAdmin(admin.ModelAdmin):
    list_display = (
        'employee', 'leave_type', 'year',
        'allocated_days', 'used_days', 'pending_days', 'remaining_days',
    )
    list_filter = ('leave_type', 'year')
    search_fields = ('employee__username', 'employee__email')
    ordering = ('employee', 'leave_type', 'year')
    readonly_fields = ('remaining_days', 'created_at', 'updated_at')

    @admin.display(description='Remaining Days')
    def remaining_days(self, obj):
        return obj.remaining_days
