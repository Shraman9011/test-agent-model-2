from django.urls import path
from .views import (
    LeaveBalanceListView, HolidayListView, LeaveRequestHistoryView,
    LeaveRequestCreateView, LeaveRequestUpdateView, LeaveRequestCancelView
)

app_name = 'leaves_api'

urlpatterns = [
    path('leaves/balances', LeaveBalanceListView.as_view(), name='leave-balances'),
    path('leaves/history', LeaveRequestHistoryView.as_view(), name='leave-history'),
    path('leaves/', LeaveRequestCreateView.as_view(), name='leave-create'),
    path('leaves/<int:pk>/', LeaveRequestUpdateView.as_view(), name='leave-update'),
    path('leaves/<int:pk>/cancel/', LeaveRequestCancelView.as_view(), name='leave-cancel'),
    path('holidays', HolidayListView.as_view(), name='holidays'),
]
