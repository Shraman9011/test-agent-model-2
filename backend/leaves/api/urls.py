from django.urls import path
from .views import (
    LeaveBalanceListView, HolidayListView, LeaveRequestHistoryView,
    LeaveRequestCreateView, LeaveRequestUpdateView, LeaveRequestCancelView,
    ManagerPendingLeavesView, LeaveRequestApproveView
)

app_name = 'leaves_api'

urlpatterns = [
    path('leaves/balances', LeaveBalanceListView.as_view(), name='leave-balances'),
    path('leaves/history', LeaveRequestHistoryView.as_view(), name='leave-history'),
    path('leaves/', LeaveRequestCreateView.as_view(), name='leave-create'),
    path('leaves/<int:pk>/', LeaveRequestUpdateView.as_view(), name='leave-update'),
    path('leaves/<int:pk>/cancel/', LeaveRequestCancelView.as_view(), name='leave-cancel'),
    path('holidays', HolidayListView.as_view(), name='holidays'),
    path('v1/manager/leave-requests/pending', ManagerPendingLeavesView.as_view(), name='manager-pending-leaves'),
    path('v1/manager/leave-requests/<int:pk>/approve', LeaveRequestApproveView.as_view(), name='manager-approve-leave'),
]
