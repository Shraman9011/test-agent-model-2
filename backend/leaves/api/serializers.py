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

from datetime import date

class LeaveRequestCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeaveRequest
        fields = ['leave_type', 'start_date', 'end_date', 'reason', 'total_days', 'manager']
        
    def validate(self, data):
        start_date = data.get('start_date')
        end_date = data.get('end_date')
        total_days = data.get('total_days')
        leave_type = data.get('leave_type')
        
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            raise serializers.ValidationError("Authentication required")
        employee = request.user
        
        if start_date and end_date and start_date > end_date:
            raise serializers.ValidationError({"end_date": "End date must be after start date."})
            
        if total_days and total_days <= 0:
            raise serializers.ValidationError({"total_days": "Total days must be positive."})
            
        # Overlap validation
        overlapping = LeaveRequest.objects.filter(
            employee=employee,
            status__in=[LeaveRequest.Status.PENDING, LeaveRequest.Status.APPROVED],
            start_date__lte=end_date,
            end_date__gte=start_date
        )
        if overlapping.exists():
            raise serializers.ValidationError("Requested dates overlap with an existing leave request.")
            
        # Balance validation
        current_year = date.today().year
        try:
            balance = LeaveBalance.objects.get(
                employee=employee.profile,
                leave_type=leave_type,
                year=current_year
            )
        except LeaveBalance.DoesNotExist:
            raise serializers.ValidationError("Leave balance not found for this leave type.")
            
        if balance.remaining_days < total_days:
            raise serializers.ValidationError("Requested days exceed available leave balance.")
            
        return data

    def create(self, validated_data):
        employee = self.context['request'].user
        leave_type = validated_data['leave_type']
        total_days = validated_data['total_days']
        current_year = date.today().year
        
        validated_data['employee'] = employee
        validated_data['status'] = LeaveRequest.Status.PENDING
        
        from django.db import transaction
        from decimal import Decimal
        
        with transaction.atomic():
            instance = super().create(validated_data)
            
            # Update the balance pending days
            balance = LeaveBalance.objects.select_for_update().get(
                employee=employee.profile,
                leave_type=leave_type,
                year=current_year
            )
            balance.pending_days += Decimal(str(total_days))
            balance.save()
            
        # Send manager notification
        import logging
        logger = logging.getLogger(__name__)
        try:
            from leaves.email_utils import send_manager_notification
            send_manager_notification(instance)
        except Exception as e:
            logger.error(f"Failed to send manager notification email: {e}")
            
        return instance

class LeaveRequestUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeaveRequest
        fields = ['start_date', 'end_date', 'reason', 'total_days']
        
    def validate(self, data):
        if self.instance.status != LeaveRequest.Status.PENDING:
            raise serializers.ValidationError("Only pending requests can be modified.")
            
        start_date = data.get('start_date', self.instance.start_date)
        end_date = data.get('end_date', self.instance.end_date)
        total_days = data.get('total_days', self.instance.total_days)
        employee = self.instance.employee
        leave_type = self.instance.leave_type
        
        if start_date > end_date:
            raise serializers.ValidationError({"end_date": "End date must be after start date."})
            
        if total_days <= 0:
            raise serializers.ValidationError({"total_days": "Total days must be positive."})
            
        overlapping = LeaveRequest.objects.filter(
            employee=employee,
            status__in=[LeaveRequest.Status.PENDING, LeaveRequest.Status.APPROVED],
            start_date__lte=end_date,
            end_date__gte=start_date
        ).exclude(pk=self.instance.pk)
        
        if overlapping.exists():
            raise serializers.ValidationError("Requested dates overlap with an existing leave request.")
            
        days_diff = total_days - self.instance.total_days
        if days_diff > 0:
            current_year = date.today().year
            try:
                balance = LeaveBalance.objects.get(
                    employee=employee.profile,
                    leave_type=leave_type,
                    year=current_year
                )
                if balance.remaining_days < days_diff:
                    raise serializers.ValidationError("Requested days exceed available leave balance.")
            except LeaveBalance.DoesNotExist:
                raise serializers.ValidationError("Leave balance not found.")
                
        return data

    def update(self, instance, validated_data):
        old_total_days = instance.total_days
        new_total_days = validated_data.get('total_days', old_total_days)
        days_diff = new_total_days - old_total_days
        
        from django.db import transaction
        from decimal import Decimal
        
        with transaction.atomic():
            instance = super().update(instance, validated_data)
            if days_diff != 0:
                balance = LeaveBalance.objects.select_for_update().get(
                    employee=instance.employee.profile,
                    leave_type=instance.leave_type,
                    year=date.today().year
                )
                balance.pending_days += Decimal(str(days_diff))
                balance.save()
                
        return instance
from leaves.models import LeavePolicy

class LeavePolicySerializer(serializers.ModelSerializer):
    apply_retroactively = serializers.BooleanField(write_only=True, required=False, default=False)
    
    class Meta:
        model = LeavePolicy
        fields = ['id', 'leave_type', 'default_annual_days', 'is_active', 'created_at', 'updated_at', 'apply_retroactively']
        read_only_fields = ['id', 'leave_type', 'created_at', 'updated_at']

    def update(self, instance, validated_data):
        apply_retroactively = validated_data.pop('apply_retroactively', False)
        new_days = validated_data.get('default_annual_days')
        
        instance = super().update(instance, validated_data)
        
        if apply_retroactively and new_days is not None:
            # Asynchronously update existing balances for the current year
            from django.utils import timezone
            from leaves.tasks import update_retroactive_leave_balances
            
            current_year = timezone.now().year
            
            # Dispatch background task via Celery
            update_retroactive_leave_balances.delay(
                leave_type_id=instance.leave_type.id,
                new_days=float(new_days),  # Pass as float/string to ensure serialization
                current_year=current_year
            )
            
        return instance

from leaves.models import LeaveAdjustmentAuditLog

class LeaveAdjustmentAuditLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeaveAdjustmentAuditLog
        fields = '__all__'
        read_only_fields = ['adjusted_by', 'timestamp']

class LeaveBalanceAdjustmentSerializer(serializers.Serializer):
    employee_id = serializers.IntegerField()
    leave_type_id = serializers.IntegerField()
    year = serializers.IntegerField(required=False)
    adjustment_amount = serializers.DecimalField(max_digits=5, decimal_places=1)
    reason = serializers.CharField(required=True, allow_blank=False, min_length=1)

    def validate_reason(self, value):
        if not value or not str(value).strip():
            raise serializers.ValidationError("Reason is required and cannot be empty.")
        return str(value).strip()
