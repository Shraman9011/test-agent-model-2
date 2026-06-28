from django.urls import path
from .views import PasswordResetRequestView, LoginView, LogoutView

app_name = 'users_api'

urlpatterns = [
    path('auth/login', LoginView.as_view(), name='login'),
    path('auth/logout', LogoutView.as_view(), name='logout'),
    path('auth/password-reset', PasswordResetRequestView.as_view(), name='password-reset-request'),
]
