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


