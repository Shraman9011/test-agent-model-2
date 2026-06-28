from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers import PasswordResetRequestSerializer

class PasswordResetRequestView(APIView):
    """
    POST /api/auth/password-reset
    
    Accepts an email address and sends a password reset link if the user exists.
    Always returns a generic 200 OK success message to prevent user enumeration.
    """
    # Anyone can request a password reset
    permission_classes = [] 
    authentication_classes = []

    def post(self, request, *args, **kwargs):
        serializer = PasswordResetRequestSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            # Generic success message regardless of whether the email was found
            return Response(
                {"message": "If an account with that email exists, we have sent a password reset link."},
                status=status.HTTP_200_OK
            )
        
        # If the email format is completely invalid (not a string/email format)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

from .serializers import PasswordResetConfirmSerializer

class PasswordResetConfirmView(APIView):
    """
    POST /api/auth/password-reset/confirm
    
    Accepts uid, token, and new_password.
    Validates token, enforces password complexity, and securely updates the password.
    """
    permission_classes = [] 
    authentication_classes = []

    def post(self, request, *args, **kwargs):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {"message": "Your password has been successfully reset."},
                status=status.HTTP_200_OK
            )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# ------------------------------------------------------------------ #
# Auth & JWT Views                                                     #
# ------------------------------------------------------------------ #
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import IsAuthenticated
from .serializers import CustomTokenObtainPairSerializer
from django.core.cache import cache

class LoginView(TokenObtainPairView):
    """
    POST /api/auth/login
    Authenticates a user and returns JWT access and refresh tokens.
    Uses CustomTokenObtainPairSerializer to include user details.
    """
    serializer_class = CustomTokenObtainPairSerializer


class LogoutView(APIView):
    """
    POST /api/auth/logout
    Blacklists the given refresh token and invalidates the session cache in Redis.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get("refresh")
            if not refresh_token:
                return Response({"error": "Refresh token is required"}, status=status.HTTP_400_BAD_REQUEST)

            # Blacklist token (SimpleJWT handles this automatically if BLACKLIST_AFTER_ROTATION is enabled)
            token = RefreshToken(refresh_token)
            token.blacklist()

            # Optional: Clear user session data from Redis cache if any exists
            cache_key = f"user_session_{request.user.id}"
            cache.delete(cache_key)

            return Response({"message": "Successfully logged out."}, status=status.HTTP_205_RESET_CONTENT)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

# ------------------------------------------------------------------ #
# Employee Profile Views                                               #
# ------------------------------------------------------------------ #
from rest_framework import viewsets
from users.models import EmployeeProfile
from users.permissions import IsHRAdmin
from .serializers import EmployeeProfileSerializer

class EmployeeProfileViewSet(viewsets.ModelViewSet):
    """
    CRUD for employee profiles. Only accessible by HR Administrators.
    """
    queryset = EmployeeProfile.objects.all()
    serializer_class = EmployeeProfileSerializer
    permission_classes = [IsHRAdmin]

