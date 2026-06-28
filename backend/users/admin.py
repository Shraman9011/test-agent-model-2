"""
Django Admin configuration for the custom User model.

Extends Django's built-in UserAdmin to display and manage the additional
fields introduced by the custom User model (role, department, phone_number).
"""

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _

from .models import User, UserRole


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """
    Admin panel configuration for the custom User model.

    Customises Django's default UserAdmin to:
      - Use email instead of username as the primary display field.
      - Expose the 'role', 'department', and 'phone_number' fields.
      - Provide role-based filtering and search.
    """

    # ------------------------------------------------------------------ #
    # List view                                                           #
    # ------------------------------------------------------------------ #
    list_display = (
        'email', 'first_name', 'last_name',
        'role', 'department', 'is_active', 'is_staff', 'created_at',
    )
    list_filter  = ('role', 'is_active', 'is_staff', 'department')
    search_fields = ('email', 'first_name', 'last_name', 'department')
    ordering = ('last_name', 'first_name')

    # ------------------------------------------------------------------ #
    # Detail / edit view fieldsets                                        #
    # ------------------------------------------------------------------ #
    fieldsets = (
        (None, {
            'fields': ('email', 'password'),
        }),
        (_('Personal Info'), {
            'fields': ('first_name', 'last_name', 'phone_number'),
        }),
        (_('Role & Organisation'), {
            'fields': ('role', 'department'),
        }),
        (_('Permissions'), {
            'fields': (
                'is_active', 'is_staff', 'is_superuser',
                'groups', 'user_permissions',
            ),
        }),
        (_('Important Dates'), {
            'fields': ('last_login', 'date_joined', 'created_at', 'updated_at'),
        }),
    )

    # Fieldsets shown when creating a new user in admin.
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': (
                'email', 'first_name', 'last_name',
                'role', 'department', 'phone_number',
                'password1', 'password2',
                'is_active', 'is_staff',
            ),
        }),
    )

    readonly_fields = ('created_at', 'updated_at', 'last_login', 'date_joined')

    # ------------------------------------------------------------------ #
    # Override: username is not used                                      #
    # ------------------------------------------------------------------ #
    # BaseUserAdmin sets ordering and search_fields that reference
    # 'username'; override them here to avoid FieldError.
    # (Already handled via list_display / search_fields / ordering above.)
