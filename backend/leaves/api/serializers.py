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
    reviewer_name = serializers.SerializerMethodField()

    class Meta:
        model = LeaveRequest
        fields = [
            'id', 'employee', 'employee_name', 'leave_type', 'start_date', 'end_date',
            'total_days', 'reason', 'status', 'applied_at', 'reviewed_by', 
            'reviewer_name', 'reviewed_at', 'review_note'
        ]
        read_only_fields = ['employee', 'status', 'applied_at', 'reviewed_by', 'reviewed_at', 'review_note']

    def get_employee_name(self, obj):
        return f"{obj.employee.first_name} {obj.employee.last_name}".strip() or obj.employee.email

    def get_reviewer_name(self, obj):
        if obj.reviewed_by:
            return f"{obj.reviewed_by.first_name} {obj.reviewed_by.last_name}".strip() or obj.reviewed_by.email
        return None
