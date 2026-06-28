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
    list_display = ('id', 'employee', 'leave_type', 'start_date', 'end_date', 'total_days', 'status', 'manager', 'applied_at')
    list_filter = ('status', 'leave_type', 'applied_at', 'reviewed_at')
    search_fields = ('employee__email', 'employee__first_name', 'employee__last_name', 'manager__email')
    raw_id_fields = ('employee', 'manager')
    date_hierarchy = 'applied_at'
    readonly_fields = ('applied_at', 'created_at', 'updated_at')

    fieldsets = (
        ('Employee Information', {
            'fields': ('employee', 'leave_type', 'total_days')
        }),
        ('Leave Details', {
            'fields': ('start_date', 'end_date', 'reason', 'status')
        }),
        ('Review Information', {
            'fields': ('manager', 'reviewed_at', 'manager_comments', 'rejection_reason')
        }),
    )


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
