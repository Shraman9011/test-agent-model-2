from django.urls import path
from .views import LeaveBalanceListView, HolidayListView, LeaveRequestHistoryView

app_name = 'leaves_api'

urlpatterns = [
    path('leaves/balances', LeaveBalanceListView.as_view(), name='leave-balances'),
    path('leaves/history', LeaveRequestHistoryView.as_view(), name='leave-history'),
    path('holidays', HolidayListView.as_view(), name='holidays'),
]
