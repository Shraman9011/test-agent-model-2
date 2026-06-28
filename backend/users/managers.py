"""
Custom manager for the User model.

Extracted to a separate module so it can be referenced cleanly
in migration files without importing from models.py (which would
create circular imports during migration state reconstruction).
"""

from django.contrib.auth.models import BaseUserManager
from django.utils.translation import gettext_lazy as _


class UserManager(BaseUserManager):
    """
    Custom manager that uses email as the unique identifier for authentication
    instead of the default username field.
    """

    use_in_migrations = True

    def _create_user(self, email, password, **extra_fields):
        """
        Create and save a User with the given email and password.

        Args:
            email (str): The user's email address (used as USERNAME_FIELD).
            password (str): Plain-text password; Django hashes before saving.
            **extra_fields: Additional model field values.

        Returns:
            User: The newly created user instance.

        Raises:
            ValueError: If email is not provided.
        """
        if not email:
            raise ValueError(_('The Email field must be set.'))
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)  # Hashes the password using Django's hasher
        user.save(using=self._db)
        return user

    def create_user(self, email, password=None, **extra_fields):
        """
        Create and save a regular (non-staff, non-superuser) User.

        Args:
            email (str): The user's email address.
            password (str | None): Plain-text password.
            **extra_fields: Additional field overrides.

        Returns:
            User: The new non-privileged user.
        """
        extra_fields.setdefault('is_staff', False)
        extra_fields.setdefault('is_superuser', False)
        # Import here to avoid circular import at module load time
        from users.models import UserRole
        extra_fields.setdefault('role', UserRole.EMPLOYEE)
        return self._create_user(email, password, **extra_fields)

    def create_superuser(self, email, password, **extra_fields):
        """
        Create and save a SuperUser (Django admin access).

        Superusers are automatically assigned the HR_ADMIN role so they
        have unrestricted access within the application's RBAC layer as well.

        Args:
            email (str): The superuser's email address.
            password (str): Plain-text password.
            **extra_fields: Additional field overrides.

        Returns:
            User: The new superuser instance.

        Raises:
            ValueError: If is_staff or is_superuser is explicitly set to False.
        """
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        from users.models import UserRole
        extra_fields.setdefault('role', UserRole.HR_ADMIN)

        if extra_fields.get('is_staff') is not True:
            raise ValueError(_('Superuser must have is_staff=True.'))
        if extra_fields.get('is_superuser') is not True:
            raise ValueError(_('Superuser must have is_superuser=True.'))

        return self._create_user(email, password, **extra_fields)
