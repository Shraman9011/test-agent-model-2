from django.db.models.signals import post_save
from django.dispatch import receiver
from django.core.cache import cache
from datetime import date
from leaves.models import LeaveRequest
from leaves.api.views import get_leave_balance_cache_key

@receiver(post_save, sender=LeaveRequest)
def invalidate_leave_balance_cache(sender, instance, **kwargs):
    # Invalidate when a leave request is approved (or created/modified in a way that affects balances)
    # The requirement specifically says "triggered on leave approval"
    if instance.status == LeaveRequest.Status.APPROVED:
        # We also clear pending cache since pending days would decrease
        year = date.today().year
        cache_key = get_leave_balance_cache_key(instance.employee.id, year)
        try:
            cache.delete(cache_key)
        except Exception as e:
            # We use print here as logging might not be configured identically in signals, or we can just ignore
            print(f"Failed to invalidate cache for {cache_key}: {e}")
