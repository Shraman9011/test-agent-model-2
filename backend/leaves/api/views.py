import logging
from datetime import date
from django.core.cache import cache
from rest_framework import generics, permissions
from rest_framework.response import Response
from leaves.models import LeaveBalance
from .serializers import LeaveBalanceSerializer

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
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            logger.debug(f"Cache hit for {cache_key}")
            return Response(cached_data)
        
        logger.debug(f"Cache miss for {cache_key}")
        # Fetch from DB
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        data = serializer.data
        
        # Store in cache for 1 hour (3600 seconds)
        cache.set(cache_key, data, timeout=3600)
        return Response(data)
