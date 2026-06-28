from rest_framework import serializers
from leaves.models import LeaveBalance, LeaveType, Holiday, LeaveRequest

class LeaveTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeaveType
        fields = ['id', 'name', 'description', 'max_days_per_year']

class LeaveBalanceSerializer(serializers.ModelSerializer):
    leave_type = LeaveTypeSerializer(read_only=True)
    remaining_days = serializers.DecimalField(max_digits=5, decimal_places=1, read_only=True)

    class Meta:
        model = LeaveBalance
        fields = [
            'id', 
            'leave_type', 
            'year', 
            'allocated_days', 
            'used_days', 
            'pending_days', 
            'remaining_days'
        ]

class HolidaySerializer(serializers.ModelSerializer):
    class Meta:
        model = Holiday
        fields = ['id', 'name', 'date', 'description']

class LeaveRequestSerializer(serializers.ModelSerializer):
    leave_type = LeaveTypeSerializer(read_only=True)
    employee_name = serializers.SerializerMethodField()
    manager_name = serializers.SerializerMethodField()

    class Meta:
        model = LeaveRequest
        fields = [
            'id', 'employee', 'employee_name', 'leave_type', 'start_date', 'end_date',
            'total_days', 'reason', 'status', 'applied_at', 'manager', 
            'manager_name', 'reviewed_at', 'manager_comments', 'rejection_reason'
        ]
        read_only_fields = ['employee', 'status', 'applied_at', 'manager', 'reviewed_at', 'manager_comments', 'rejection_reason']

    def get_employee_name(self, obj):
        return f"{obj.employee.first_name} {obj.employee.last_name}".strip() or obj.employee.email

    def get_manager_name(self, obj):
        if getattr(obj, 'manager', None):
            return f"{obj.manager.first_name} {obj.manager.last_name}".strip() or obj.manager.email
        return None
