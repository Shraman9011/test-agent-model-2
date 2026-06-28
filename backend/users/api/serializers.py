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

from django.utils.http import urlsafe_base64_decode
from django.contrib.auth.password_validation import validate_password
from rest_framework.exceptions import ValidationError
import logging

logger = logging.getLogger(__name__)

class PasswordResetConfirmSerializer(serializers.Serializer):
    """
    Serializer to validate the uid, token, and the new password.
    Updates the password if everything is valid.
    """
    uid = serializers.CharField(required=True)
    token = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, write_only=True)

    def validate(self, attrs):
        uid_b64 = attrs.get('uid')
        token = attrs.get('token')
        new_password = attrs.get('new_password')

        try:
            uid = urlsafe_base64_decode(uid_b64).decode()
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist, UnicodeDecodeError) as e:
            logger.error(f"Password reset failed: Invalid uid '{uid_b64}'. Exception: {e}")
            raise ValidationError({'token': 'Invalid user ID or token.'})

        if not default_token_generator.check_token(user, token):
            logger.warning(f"Password reset failed: check_token returned False for user '{user.email}' and token '{token}'")
            raise ValidationError({'token': 'The reset token is invalid or has expired.'})

        # Validate password complexity using Django's built-in validators
        try:
            validate_password(new_password, user)
        except Exception as e:
            raise ValidationError({'new_password': list(e.messages)})

        attrs['user'] = user
        return attrs

    def save(self):
        user = self.validated_data['user']
        new_password = self.validated_data['new_password']
        user.set_password(new_password)
        user.save()
        return user

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
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        email = attrs.get(User.USERNAME_FIELD)
        try:
            user = User.objects.get(email=email)
            if not user.is_active:
                raise AuthenticationFailed("Account is deactivated.")
            if hasattr(user, 'profile') and not user.profile.is_active:
                raise AuthenticationFailed("Account is deactivated.")
        except User.DoesNotExist:
            pass # Let super().validate handle the invalid credentials
            
        try:
            data = super().validate(attrs)
        except Exception as e:
            raise AuthenticationFailed("Invalid credentials")
            
        data['user'] = {
            'id': self.user.id,
            'email': self.user.email,
            'firstName': self.user.first_name,
            'lastName': self.user.last_name,
            'role': self.user.role,
        }
        return data

# ------------------------------------------------------------------ #
# Profile Serializers                                                  #
# ------------------------------------------------------------------ #
from users.models import EmployeeProfile

class EmployeeProfileSerializer(serializers.ModelSerializer):
    """
    Serializer for employee profiles.
    Handles nested reading and writing of the associated User model.
    """
    email = serializers.EmailField(source='user.email')
    first_name = serializers.CharField(source='user.first_name')
    last_name = serializers.CharField(source='user.last_name')
    department = serializers.CharField(source='user.department', required=False, allow_blank=True)
    phone_number = serializers.CharField(source='user.phone_number', required=False, allow_blank=True)
    user_role = serializers.ChoiceField(source='user.role', choices=['EMPLOYEE', 'MANAGER', 'HR_ADMIN'])
    password = serializers.CharField(write_only=True, required=False, style={'input_type': 'password'})

    class Meta:
        model = EmployeeProfile
        fields = [
            'id', 'email', 'first_name', 'last_name', 'department', 
            'phone_number', 'user_role', 'password', 'role', 
            'manager', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    from django.db import transaction
    
    @transaction.atomic
    def create(self, validated_data):
        user_data = validated_data.pop('user')
        password = validated_data.pop('password', 'Password123!') # Default password
        
        # Create user
        user = User.objects.create_user(
            email=user_data['email'],
            password=password,
            first_name=user_data.get('first_name', ''),
            last_name=user_data.get('last_name', ''),
            department=user_data.get('department', ''),
            phone_number=user_data.get('phone_number', ''),
            role=user_data.get('role', 'EMPLOYEE')
        )
        
        # The EmployeeProfile is automatically created by the post_save signal
        profile = user.profile
        
        # Update profile fields
        profile.role = validated_data.get('role', '')
        profile.manager = validated_data.get('manager')
        profile.is_active = validated_data.get('is_active', True)
        profile.save()
        
        return profile

    @transaction.atomic
    def update(self, instance, validated_data):
        user_data = validated_data.pop('user', {})
        password = validated_data.pop('password', None)
        
        # Update user fields
        user = instance.user
        if 'email' in user_data:
            user.email = user_data['email']
        if 'first_name' in user_data:
            user.first_name = user_data['first_name']
        if 'last_name' in user_data:
            user.last_name = user_data['last_name']
        if 'department' in user_data:
            user.department = user_data['department']
        if 'phone_number' in user_data:
            user.phone_number = user_data['phone_number']
        if 'role' in user_data:
            user.role = user_data['role']
            
        if password:
            user.set_password(password)
            
        user.save()
        
        # Update profile fields
        instance.role = validated_data.get('role', instance.role)
        instance.manager = validated_data.get('manager', instance.manager)
        instance.is_active = validated_data.get('is_active', instance.is_active)
        instance.save()
        
        return instance

