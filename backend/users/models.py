"""
Custom User model for the HR Leave Management System.

Extends Django's AbstractUser to:
  - Use email as the primary login identifier (instead of username)
  - Add a role field supporting Employee, Manager, and HR Administrator
  - Store first_name and last_name explicitly
  - Support secure password storage via Django's built-in PBKDF2/bcrypt hashing

Related tasks:
  - Blocks: Task 3168 (login/logout API), Task 3171 (RBAC middleware),
             Task 3175 (password reset request), Task 3176 (password reset confirm)
  - Relates to: Task 3169 (Login page UI), Task 3177 (Forgot/Reset Password forms)
"""

from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils.translation import gettext_lazy as _

from users.managers import UserManager


# --------------------------------------------------------------------------- #
# Role constants — used throughout the project for permission checks           #
# --------------------------------------------------------------------------- #

class UserRole(models.TextChoices):
    """
    Enumeration of supported user roles.

    Roles determine downstream RBAC behaviour (see Task 3171).

    EMPLOYEE       - Standard staff member; can apply for leave, view own records.
    MANAGER        - Team lead; can approve/reject subordinate leave requests.
    HR_ADMIN       - HR Administrator; full access to all leave and user data.
    """
    EMPLOYEE  = 'EMPLOYEE',  _('Employee')
    MANAGER   = 'MANAGER',   _('Manager')
    HR_ADMIN  = 'HR_ADMIN',  _('HR Administrator')


# --------------------------------------------------------------------------- #
# Custom User model                                                            #
# --------------------------------------------------------------------------- #

class User(AbstractUser):
    """
    Custom User model for the HR Leave Management System.

    Changes from Django's default User:
      - ``username`` field is removed; ``email`` is the unique identifier.
      - ``email`` field is required, unique, and used as USERNAME_FIELD.
      - ``role`` field added to support RBAC (Employee / Manager / HR Admin).
      - ``phone_number`` optional field for HR contact records.
      - ``department`` optional field to group employees.

    Database table: ``users_user``
    Auth field:     ``email``

    Password storage:
      Django uses PBKDF2+SHA256 by default (upgradeable to bcrypt/argon2).
      Passwords are NEVER stored in plain text.
    """

    # Remove the default username field — email is the identifier.
    username = None

    # ------------------------------------------------------------------ #
    # Core fields                                                          #
    # ------------------------------------------------------------------ #

    email = models.EmailField(
        _('email address'),
        unique=True,
        db_index=True,
        help_text=_('Required. Used as the login identifier.'),
    )

    first_name = models.CharField(
        _('first name'),
        max_length=150,
        blank=False,
        help_text=_('Legal first name of the user.'),
    )

    last_name = models.CharField(
        _('last name'),
        max_length=150,
        blank=False,
        help_text=_('Legal last name of the user.'),
    )

    # ------------------------------------------------------------------ #
    # RBAC field                                                           #
    # ------------------------------------------------------------------ #

    role = models.CharField(
        _('role'),
        max_length=20,
        choices=UserRole.choices,
        default=UserRole.EMPLOYEE,
        db_index=True,
        help_text=_(
            'Determines the user\'s access level within the application. '
            'Employee → standard access; Manager → team approval rights; '
            'HR Administrator → full administrative access.'
        ),
    )

    # ------------------------------------------------------------------ #
    # Optional contact / organisational fields                            #
    # ------------------------------------------------------------------ #

    phone_number = models.CharField(
        _('phone number'),
        max_length=20,
        blank=True,
        help_text=_('Optional contact phone number.'),
    )

    department = models.CharField(
        _('department'),
        max_length=100,
        blank=True,
        db_index=True,
        help_text=_('Organisational department the user belongs to.'),
    )

    # ------------------------------------------------------------------ #
    # Audit timestamps                                                    #
    # ------------------------------------------------------------------ #

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # ------------------------------------------------------------------ #
    # Manager and authentication settings                                 #
    # ------------------------------------------------------------------ #

    objects = UserManager()

    USERNAME_FIELD  = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']  # Prompted by createsuperuser

    # ------------------------------------------------------------------ #
    # Meta                                                                #
    # ------------------------------------------------------------------ #

    class Meta:
        db_table     = 'users_user'
        verbose_name = _('user')
        verbose_name_plural = _('users')
        ordering = ['last_name', 'first_name']
        indexes = [
            models.Index(fields=['role'], name='idx_user_role'),
            models.Index(fields=['department'], name='idx_user_department'),
            models.Index(fields=['is_active', 'role'], name='idx_user_active_role'),
        ]

    # ------------------------------------------------------------------ #
    # String representation                                               #
    # ------------------------------------------------------------------ #

    def __str__(self):
        """Return a human-readable representation: full name and email."""
        return f'{self.get_full_name()} <{self.email}>'

    # ------------------------------------------------------------------ #
    # Convenience properties                                              #
    # ------------------------------------------------------------------ #

    @property
    def is_employee(self):
        """Return True if the user has the Employee role."""
        return self.role == UserRole.EMPLOYEE

    @property
    def is_manager(self):
        """Return True if the user has the Manager role."""
        return self.role == UserRole.MANAGER

    @property
    def is_hr_admin(self):
        """Return True if the user has the HR Administrator role."""
        return self.role == UserRole.HR_ADMIN

    @property
    def full_name(self):
        """Return the user's full name (first + last)."""
        return self.get_full_name()
