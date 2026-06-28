from django.urls import path
from .views import LeaveBalanceListView

app_name = 'leaves_api'

urlpatterns = [
    path('leaves/balances', LeaveBalanceListView.as_view(), name='leave-balances'),
]
