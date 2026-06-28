"""
Initial migration for the custom User model.

Creates the ``users_user`` table with:
  - email as primary identifier (unique, indexed)
  - password stored as Django hash (never plain text)
  - role field (Employee / Manager / HR Administrator)
  - first_name, last_name, phone_number, department
  - Standard AbstractUser fields (is_active, is_staff, is_superuser, etc.)
  - Audit timestamps (created_at, updated_at)
  - Indexes on role, department, and (is_active, role)

Rollback:
    python manage.py migrate users zero
    (See also: users/migrations/0001_rollback_script.sql)
"""

import django.utils.timezone
from django.db import migrations, models
import users.managers


class Migration(migrations.Migration):
    """
    Creates the users_user table — the foundation for all downstream
    authentication and RBAC tasks (3168, 3171, 3175, 3176).
    """

    initial = True

    dependencies = [
        ('auth', '0012_alter_user_first_name_max_length'),
    ]

    operations = [
        # ------------------------------------------------------------------ #
        # users_user table                                                    #
        # ------------------------------------------------------------------ #
        migrations.CreateModel(
            name='User',
            fields=[
                # Primary key
                ('id', models.BigAutoField(
                    auto_created=True,
                    primary_key=True,
                    serialize=False,
                    verbose_name='ID',
                )),

                # Password (hashed by Django — PBKDF2+SHA256 by default)
                ('password', models.CharField(max_length=128, verbose_name='password')),

                # Session / admin fields from AbstractBaseUser / PermissionsMixin
                ('last_login', models.DateTimeField(
                    blank=True, null=True, verbose_name='last login',
                )),
                ('is_superuser', models.BooleanField(
                    default=False,
                    help_text='Designates that this user has all permissions without explicitly assigning them.',
                    verbose_name='superuser status',
                )),
                ('is_staff', models.BooleanField(
                    default=False,
                    help_text='Designates whether the user can log into this admin site.',
                    verbose_name='staff status',
                )),
                ('is_active', models.BooleanField(
                    default=True,
                    help_text='Designates whether this user should be treated as active. '
                              'Unselect this instead of deleting accounts.',
                    verbose_name='active',
                )),
                ('date_joined', models.DateTimeField(
                    default=django.utils.timezone.now,
                    verbose_name='date joined',
                )),

                # Core identity fields
                ('email', models.EmailField(
                    db_index=True,
                    help_text='Required. Used as the login identifier.',
                    max_length=254,
                    unique=True,
                    verbose_name='email address',
                )),
                ('first_name', models.CharField(
                    help_text='Legal first name of the user.',
                    max_length=150,
                    verbose_name='first name',
                )),
                ('last_name', models.CharField(
                    help_text='Legal last name of the user.',
                    max_length=150,
                    verbose_name='last name',
                )),

                # RBAC role field
                ('role', models.CharField(
                    choices=[
                        ('EMPLOYEE',  'Employee'),
                        ('MANAGER',   'Manager'),
                        ('HR_ADMIN',  'HR Administrator'),
                    ],
                    db_index=True,
                    default='EMPLOYEE',
                    help_text="Determines the user's access level within the application. "
                              "Employee → standard access; Manager → team approval rights; "
                              "HR Administrator → full administrative access.",
                    max_length=20,
                    verbose_name='role',
                )),

                # Optional contact / organisational fields
                ('phone_number', models.CharField(
                    blank=True,
                    help_text='Optional contact phone number.',
                    max_length=20,
                    verbose_name='phone number',
                )),
                ('department', models.CharField(
                    blank=True,
                    db_index=True,
                    help_text='Organisational department the user belongs to.',
                    max_length=100,
                    verbose_name='department',
                )),

                # Audit timestamps
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),

                # Many-to-many relations from PermissionsMixin
                ('groups', models.ManyToManyField(
                    blank=True,
                    help_text='The groups this user belongs to. A user will get all permissions '
                              'granted to each of their groups.',
                    related_name='user_set',
                    related_query_name='user',
                    to='auth.group',
                    verbose_name='groups',
                )),
                ('user_permissions', models.ManyToManyField(
                    blank=True,
                    help_text='Specific permissions for this user.',
                    related_name='user_set',
                    related_query_name='user',
                    to='auth.permission',
                    verbose_name='user permissions',
                )),
            ],
            options={
                'verbose_name': 'user',
                'verbose_name_plural': 'users',
                'db_table': 'users_user',
                'ordering': ['last_name', 'first_name'],
            },
            managers=[
                ('objects', users.managers.UserManager()),
            ],
        ),

        # ------------------------------------------------------------------ #
        # Additional indexes                                                  #
        # ------------------------------------------------------------------ #
        migrations.AddIndex(
            model_name='user',
            index=models.Index(fields=['role'], name='idx_user_role'),
        ),
        migrations.AddIndex(
            model_name='user',
            index=models.Index(fields=['department'], name='idx_user_department'),
        ),
        migrations.AddIndex(
            model_name='user',
            index=models.Index(fields=['is_active', 'role'], name='idx_user_active_role'),
        ),
    ]
