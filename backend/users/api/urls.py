from django.urls import path
from .views import PasswordResetRequestView

app_name = 'users_api'

urlpatterns = [
    path('auth/password-reset', PasswordResetRequestView.as_view(), name='password-reset-request'),
]
