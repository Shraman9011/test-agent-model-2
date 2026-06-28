from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PasswordResetRequestView, PasswordResetConfirmView, LoginView, LogoutView, EmployeeProfileViewSet

app_name = 'users_api'

router = DefaultRouter()
router.register(r'profiles', EmployeeProfileViewSet, basename='employee-profile')

urlpatterns = [
    path('auth/login', LoginView.as_view(), name='login'),
    path('auth/logout', LogoutView.as_view(), name='logout'),
    path('auth/password-reset', PasswordResetRequestView.as_view(), name='password-reset-request'),
    path('auth/password-reset/confirm', PasswordResetConfirmView.as_view(), name='password-reset-confirm'),
    path('', include(router.urls)),
]
