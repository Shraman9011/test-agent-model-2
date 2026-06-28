from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from django.core.mail import send_mail
from django.conf import settings
import os

User = get_user_model()

class PasswordResetRequestSerializer(serializers.Serializer):
    """
    Serializer for handling password reset requests.
    Accepts an email address and sends a reset link if the user exists.
    """
    email = serializers.EmailField(required=True)

    def validate_email(self, value):
        # We don't raise a ValidationError if the email doesn't exist 
        # to prevent user enumeration attacks. The view will always return success.
        return value

    def save(self):
        email = self.validated_data['email']
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # Prevent user enumeration: do nothing if user doesn't exist,
            # but don't leak this fact to the client.
            return

        # Generate the time-limited, cryptographically secure token
        token = default_token_generator.make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))

        # Build the reset URL (pointing to frontend)
        # Using VITE_API_URL or similar from env if frontend is separate
        frontend_url = os.getenv('VITE_API_URL', 'http://localhost:5173')
        reset_link = f"{frontend_url}/reset-password?uid={uid}&token={token}"

        # Send the email
        subject = "LeaveSync: Password Reset Request"
        message = (
            f"Hello {user.first_name or user.email},\n\n"
            f"We received a request to reset your password for your LeaveSync account.\n"
            f"Click the link below to reset your password:\n\n"
            f"{reset_link}\n\n"
            f"If you did not request this, please ignore this email.\n\n"
            f"Thank you,\n"
            f"LeaveSync Team"
        )
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False,
        )

# ------------------------------------------------------------------ #
# Auth & JWT Serializers                                               #
# ------------------------------------------------------------------ #
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Custom JWT serializer that adds user role and email to the token payload,
    and returns standard user info along with the token in the response.
    """
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Add custom claims
        token['email'] = user.email
        token['role'] = user.role
        return token

    def validate(self, attrs):
        from rest_framework_simplejwt.exceptions import AuthenticationFailed as JWTAuthFailed
        from rest_framework.exceptions import AuthenticationFailed
        try:
            data = super().validate(attrs)
        except Exception as e:
            # We catch any Exception here just to intercept the specific 'no_active_account' error
            # SimpleJWT might raise a few different types of AuthenticationFailed
            raise AuthenticationFailed("Invalid credentials")
            
        data['user'] = {
            'id': self.user.id,
            'email': self.user.email,
            'firstName': self.user.first_name,
            'lastName': self.user.last_name,
            'role': self.user.role,
        }
        return data
