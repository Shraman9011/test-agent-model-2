import logging
from datetime import date
from django.core.cache import cache
from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from leaves.models import LeaveBalance, Holiday, LeaveRequest
from .serializers import (
    LeaveBalanceSerializer, HolidaySerializer, LeaveRequestSerializer,
    LeaveRequestCreateSerializer, LeaveRequestUpdateSerializer
)

logger = logging.getLogger(__name__)

def get_leave_balance_cache_key(user_id, year):
    return f"leave_balances_{user_id}_{year}"

class LeaveBalanceListView(generics.ListAPIView):
    """
    GET /api/leaves/balances
    Retrieves the authenticated employee's leave balances for the current year.
    Uses Redis caching to maintain high performance.
    """
    serializer_class = LeaveBalanceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Fallback if caching logic is bypassed, but normally we override list()
        current_year = date.today().year
        return LeaveBalance.objects.filter(employee=self.request.user, year=current_year).select_related('leave_type')

    def list(self, request, *args, **kwargs):
        user_id = request.user.id
        current_year = date.today().year
        cache_key = get_leave_balance_cache_key(user_id, current_year)

        # Try to get from cache
        try:
            cached_data = cache.get(cache_key)
            if cached_data is not None:
                logger.debug(f"Cache hit for {cache_key}")
                return Response(cached_data)
        except Exception as e:
            logger.warning(f"Cache get failed for {cache_key}: {e}")
            cached_data = None
        
        logger.debug(f"Cache miss for {cache_key}")
        # Fetch from DB
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        data = serializer.data
        
        # Store in cache for 1 hour (3600 seconds)
        try:
            cache.set(cache_key, data, timeout=3600)
        except Exception as e:
            logger.warning(f"Cache set failed for {cache_key}: {e}")

        return Response(data)

class HolidayListView(generics.ListAPIView):
    """
    GET /api/holidays
    Retrieves chronological list of upcoming company holidays for the current year.
    Filters out past holidays.
    """
    serializer_class = HolidaySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        current_date = date.today()
        # Filter holidays that are >= today and in the current calendar year
        return Holiday.objects.filter(
            date__gte=current_date,
            date__year=current_date.year
        ).order_by('date')

class LeaveRequestPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100

class LeaveRequestHistoryView(generics.ListAPIView):
    """
    GET /api/leaves/history
    Retrieves the authenticated employee's leave request history.
    Supports filtering by status and leave_type.
    """
    serializer_class = LeaveRequestSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = LeaveRequestPagination

    def get_queryset(self):
        user = self.request.user
        queryset = LeaveRequest.objects.filter(employee=user).select_related('leave_type', 'employee', 'manager')
        
        status = self.request.query_params.get('status')
        if status:
            queryset = queryset.filter(status=status)
            
        leave_type_id = self.request.query_params.get('leave_type')
        if leave_type_id:
            queryset = queryset.filter(leave_type_id=leave_type_id)
            
        return queryset

class LeaveRequestCreateView(generics.CreateAPIView):
    """
    POST /api/leaves/
    Submit a new leave request. Validates date overlap and balance.
    """
    serializer_class = LeaveRequestCreateSerializer
    permission_classes = [permissions.IsAuthenticated]

from rest_framework.exceptions import PermissionDenied

class IsOwner(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        return obj.employee == request.user

class LeaveRequestUpdateView(generics.UpdateAPIView):
    """
    PUT /api/leaves/{id}/
    Edit a pending leave request.
    """
    queryset = LeaveRequest.objects.all()
    serializer_class = LeaveRequestUpdateSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwner]


from rest_framework.views import APIView
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.db import transaction
from decimal import Decimal

class LeaveRequestCancelView(APIView):
    """
    POST /api/leaves/{id}/cancel/
    Cancel a leave request.
    """
    permission_classes = [permissions.IsAuthenticated, IsOwner]
    
    def post(self, request, pk, format=None):
        leave_request = get_object_or_404(LeaveRequest, pk=pk)
        
        self.check_object_permissions(request, leave_request)
        
        if leave_request.start_date < date.today():
            return Response({"error": "Cannot cancel past leaves."}, status=status.HTTP_400_BAD_REQUEST)
            
        if leave_request.status == LeaveRequest.Status.CANCELLED:
            return Response({"error": "Request is already cancelled."}, status=status.HTTP_400_BAD_REQUEST)
            
        with transaction.atomic():
            try:
                balance = LeaveBalance.objects.select_for_update().get(
                    employee=leave_request.employee,
                    leave_type=leave_request.leave_type,
                    year=date.today().year
                )
            except LeaveBalance.DoesNotExist:
                return Response({"error": "Leave balance not found."}, status=status.HTTP_400_BAD_REQUEST)
                
            if leave_request.status == LeaveRequest.Status.APPROVED:
                balance.used_days -= Decimal(str(leave_request.total_days))
                if balance.used_days < 0:
                    balance.used_days = Decimal('0.0')
                balance.save()
            elif leave_request.status == LeaveRequest.Status.PENDING:
                balance.pending_days -= Decimal(str(leave_request.total_days))
                if balance.pending_days < 0:
                    balance.pending_days = Decimal('0.0')
                balance.save()
            elif leave_request.status == LeaveRequest.Status.REJECTED:
                pass # Nothing to restore, balance already didn't include it
            
            leave_request.status = LeaveRequest.Status.CANCELLED
            leave_request.save()
            
        return Response({"status": "cancelled", "message": "Leave request cancelled successfully."}, status=status.HTTP_200_OK)


class IsManager(permissions.BasePermission):
    """Allows access only to managers."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_manager)


class ManagerPendingLeavesView(generics.ListAPIView):
    """
    GET /api/v1/manager/leave-requests/pending
    Retrieves pending leave requests for the direct reports of the logged-in manager.
    Integrated with Redis caching.
    """
    serializer_class = LeaveRequestSerializer
    permission_classes = [IsManager]

    def get_queryset(self):
        return LeaveRequest.objects.filter(
            manager=self.request.user,
            status=LeaveRequest.Status.PENDING
        ).select_related('leave_type', 'employee').order_by('start_date')

    def list(self, request, *args, **kwargs):
        cache_key = f"manager_pending_leaves_{request.user.id}"
        
        try:
            cached_data = cache.get(cache_key)
            if cached_data is not None:
                return Response(cached_data)
        except Exception:
            pass
            
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        data = serializer.data
        
        try:
            # Cache for 5 minutes (300 seconds)
            cache.set(cache_key, data, timeout=300)
        except Exception:
            pass
            
        return Response(data)

from django.utils import timezone

class LeaveRequestApproveView(APIView):
    """
    POST /api/v1/manager/leave-requests/{id}/approve
    Approve a pending leave request with optional comments.
    """
    permission_classes = [IsManager]

    def post(self, request, pk, format=None):
        leave_request = get_object_or_404(LeaveRequest, pk=pk)
        
        # Ensure the user is the assigned manager
        if leave_request.manager != request.user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You are not authorized to approve this request.")
            
        if leave_request.status != LeaveRequest.Status.PENDING:
            return Response(
                {"error": "Only pending requests can be approved."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        comments = request.data.get('comments', '')
        
        with transaction.atomic():
            try:
                balance = LeaveBalance.objects.select_for_update().get(
                    employee=leave_request.employee,
                    leave_type=leave_request.leave_type,
                    year=date.today().year
                )
            except LeaveBalance.DoesNotExist:
                return Response({"error": "Leave balance not found."}, status=status.HTTP_400_BAD_REQUEST)
                
            # Move days from pending to used
            balance.pending_days -= Decimal(str(leave_request.total_days))
            if balance.pending_days < 0:
                balance.pending_days = Decimal('0.0')
            balance.used_days += Decimal(str(leave_request.total_days))
            balance.save()
            
            leave_request.status = LeaveRequest.Status.APPROVED
            leave_request.manager_comments = comments
            leave_request.reviewed_at = timezone.now()
            leave_request.save()
            
            # Invalidate manager pending leaves cache
            cache_key = f"manager_pending_leaves_{request.user.id}"
            try:
                cache.delete(cache_key)
            except Exception:
                pass
            
            # Send notification
            try:
                from leaves.email_utils import send_employee_decision_notification
                send_employee_decision_notification(leave_request)
            except Exception as e:
                logger.error(f"Failed to send decision notification email: {e}")
            
        serializer = LeaveRequestSerializer(leave_request)
        return Response(serializer.data, status=status.HTTP_200_OK)


class ManagerHistoricalLeavesView(generics.ListAPIView):
    """
    GET /api/v1/manager/leave-requests/history
    Retrieves historical (approved/rejected) leave requests for the direct reports of the logged-in manager.
    Supports pagination and filtering by date and employee.
    """
    serializer_class = LeaveRequestSerializer
    permission_classes = [IsManager]
    pagination_class = LeaveRequestPagination

    def get_queryset(self):
        queryset = LeaveRequest.objects.filter(
            manager=self.request.user,
            status__in=[LeaveRequest.Status.APPROVED, LeaveRequest.Status.REJECTED]
        ).select_related('leave_type', 'employee').order_by('-reviewed_at', '-start_date')

        # Filtering
        employee_id = self.request.query_params.get('employee_id')
        if employee_id:
            queryset = queryset.filter(employee_id=employee_id)
            
        start_date = self.request.query_params.get('start_date')
        if start_date:
            queryset = queryset.filter(start_date__gte=start_date)
            
        end_date = self.request.query_params.get('end_date')
        if end_date:
            queryset = queryset.filter(end_date__lte=end_date)
            
        return queryset

class LeaveRequestRejectView(APIView):
    """
    POST /api/v1/manager/leave-requests/{id}/reject
    Reject a pending leave request. Requires a rejection reason.
    """
    permission_classes = [IsManager]

    def post(self, request, pk, format=None):
        leave_request = get_object_or_404(LeaveRequest, pk=pk)
        
        # Ensure the user is the assigned manager
        if leave_request.manager != request.user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You are not authorized to reject this request.")
            
        if leave_request.status != LeaveRequest.Status.PENDING:
            return Response(
                {"error": "Only pending requests can be rejected."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        reason = request.data.get('rejection_reason', '')
        if isinstance(reason, str):
            reason = reason.strip()
            
        if not reason:
            return Response(
                {"error": "Rejection reason is required."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        with transaction.atomic():
            try:
                balance = LeaveBalance.objects.select_for_update().get(
                    employee=leave_request.employee,
                    leave_type=leave_request.leave_type,
                    year=date.today().year
                )
            except LeaveBalance.DoesNotExist:
                return Response({"error": "Leave balance not found."}, status=status.HTTP_400_BAD_REQUEST)
                
            # Remove days from pending
            balance.pending_days -= Decimal(str(leave_request.total_days))
            if balance.pending_days < 0:
                balance.pending_days = Decimal('0.0')
            balance.save()
            
            leave_request.status = LeaveRequest.Status.REJECTED
            leave_request.rejection_reason = reason
            leave_request.reviewed_at = timezone.now()
            leave_request.save()
            
            # Invalidate manager pending leaves cache
            cache_key = f"manager_pending_leaves_{request.user.id}"
            try:
                cache.delete(cache_key)
            except Exception:
                pass
            
            # Send notification
            try:
                from leaves.email_utils import send_employee_decision_notification
                send_employee_decision_notification(leave_request)
            except Exception as e:
                logger.error(f"Failed to send decision notification email: {e}")
            
        serializer = LeaveRequestSerializer(leave_request)
        return Response(serializer.data, status=status.HTTP_200_OK)
