from django.urls import path
from .views import LeaveBalanceListView, HolidayListView

app_name = 'leaves_api'

urlpatterns = [
    path('leaves/balances', LeaveBalanceListView.as_view(), name='leave-balances'),
    path('holidays', HolidayListView.as_view(), name='holidays'),
]
