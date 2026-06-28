"""
Unit and integration tests for users.models (custom User model).

Covers:
  - UserRole choices and constants
  - UserManager.create_user behaviour
  - UserManager.create_superuser behaviour
  - Field constraints (email uniqueness, blank first_name/last_name, etc.)
  - Role field default and choices
  - Model convenience properties (is_employee, is_manager, is_hr_admin)
  - Indexes existence
  - Password hashing (never stored plain text)
  - __str__ representation

Run with:
    python manage.py test users.tests.test_models \\
        --settings=test_agent_model_2.settings_test
"""

from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction
from django.test import TestCase

from users.models import UserRole

User = get_user_model()


# --------------------------------------------------------------------------- #
# Helpers                                                                      #
# --------------------------------------------------------------------------- #

def make_user(
    email='alice@example.com',
    password='SecurePass@1',
    first_name='Alice',
    last_name='Smith',
    role=UserRole.EMPLOYEE,
    **kwargs,
):
    """
    Create and return a non-privileged test user.

    Args:
        email (str): Login email.
        password (str): Plain-text password (will be hashed).
        first_name (str): User's first name.
        last_name (str): User's last name.
        role (str): UserRole choice value.
        **kwargs: Additional User field overrides.

    Returns:
        User: Saved User instance.
    """
    return User.objects.create_user(
        email=email,
        password=password,
        first_name=first_name,
        last_name=last_name,
        role=role,
        **kwargs,
    )


# --------------------------------------------------------------------------- #
# UserRole tests                                                               #
# --------------------------------------------------------------------------- #

class UserRoleChoicesTest(TestCase):
    """Verify the UserRole TextChoices enum values."""

    def test_role_values(self):
        """All three roles must have the expected DB values."""
        self.assertEqual(UserRole.EMPLOYEE, 'EMPLOYEE')
        self.assertEqual(UserRole.MANAGER,  'MANAGER')
        self.assertEqual(UserRole.HR_ADMIN, 'HR_ADMIN')

    def test_role_labels(self):
        """Human-readable labels must match the spec."""
        self.assertEqual(UserRole.EMPLOYEE.label, 'Employee')
        self.assertEqual(UserRole.MANAGER.label,  'Manager')
        self.assertEqual(UserRole.HR_ADMIN.label, 'HR Administrator')

    def test_all_choices_present(self):
        """choices() must contain exactly three items."""
        choice_values = [v for v, _ in UserRole.choices]
        self.assertIn('EMPLOYEE', choice_values)
        self.assertIn('MANAGER',  choice_values)
        self.assertIn('HR_ADMIN', choice_values)
        self.assertEqual(len(choice_values), 3)


# --------------------------------------------------------------------------- #
# UserManager tests                                                            #
# --------------------------------------------------------------------------- #

class UserManagerTest(TestCase):
    """Tests for the custom UserManager methods."""

    def test_create_user_basic(self):
        """create_user should persist a valid user with hashed password."""
        user = make_user()
        self.assertIsNotNone(user.pk)
        self.assertEqual(user.email, 'alice@example.com')

    def test_create_user_default_role_is_employee(self):
        """Users created without a role should default to EMPLOYEE."""
        user = User.objects.create_user(
            email='noRole@example.com',
            password='pass',
            first_name='No',
            last_name='Role',
        )
        self.assertEqual(user.role, UserRole.EMPLOYEE)

    def test_create_user_not_staff_by_default(self):
        """Regular users must not be staff by default."""
        user = make_user(email='staff_test@example.com')
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)

    def test_create_user_password_is_hashed(self):
        """
        Password must never be stored as plain text.
        Django hashes it; check_password must verify the plain-text original.
        """
        plain = 'SuperSecret@99'
        user = make_user(email='hash_test@example.com', password=plain)
        self.assertNotEqual(user.password, plain)
        self.assertTrue(user.check_password(plain))

    def test_create_user_requires_email(self):
        """create_user must raise ValueError when email is empty."""
        with self.assertRaises(ValueError):
            User.objects.create_user(
                email='',
                password='pass',
                first_name='X',
                last_name='Y',
            )

    def test_create_superuser(self):
        """create_superuser must set is_staff=True, is_superuser=True, role=HR_ADMIN."""
        su = User.objects.create_superuser(
            email='super@example.com',
            password='SuperPass@1',
            first_name='Super',
            last_name='User',
        )
        self.assertTrue(su.is_staff)
        self.assertTrue(su.is_superuser)
        self.assertEqual(su.role, UserRole.HR_ADMIN)

    def test_create_superuser_rejects_false_is_staff(self):
        """create_superuser must raise ValueError if is_staff=False is passed."""
        with self.assertRaises(ValueError):
            User.objects.create_superuser(
                email='su2@example.com',
                password='pass',
                first_name='X',
                last_name='Y',
                is_staff=False,
            )

    def test_create_superuser_rejects_false_is_superuser(self):
        """create_superuser must raise ValueError if is_superuser=False is passed."""
        with self.assertRaises(ValueError):
            User.objects.create_superuser(
                email='su3@example.com',
                password='pass',
                first_name='X',
                last_name='Y',
                is_superuser=False,
            )

    def test_email_is_normalised(self):
        """Email domain part must be lowercased during normalisation."""
        user = User.objects.create_user(
            email='test@EXAMPLE.COM',
            password='pass',
            first_name='Norm',
            last_name='Alise',
        )
        self.assertEqual(user.email, 'test@example.com')


# --------------------------------------------------------------------------- #
# User model field tests                                                       #
# --------------------------------------------------------------------------- #

class UserModelFieldTest(TestCase):
    """Tests for User model field constraints and defaults."""

    def setUp(self):
        self.user = make_user()

    def test_email_is_username_field(self):
        """USERNAME_FIELD must be 'email'."""
        self.assertEqual(User.USERNAME_FIELD, 'email')

    def test_email_must_be_unique(self):
        """Creating two users with the same email must raise IntegrityError."""
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                make_user(email='alice@example.com')  # duplicate

    def test_role_default_is_employee(self):
        """Default role must be EMPLOYEE."""
        self.assertEqual(self.user.role, UserRole.EMPLOYEE)

    def test_role_can_be_manager(self):
        """User can be created with MANAGER role."""
        mgr = make_user(email='mgr@example.com', role=UserRole.MANAGER)
        self.assertEqual(mgr.role, UserRole.MANAGER)

    def test_role_can_be_hr_admin(self):
        """User can be created with HR_ADMIN role."""
        hr = make_user(email='hr@example.com', role=UserRole.HR_ADMIN)
        self.assertEqual(hr.role, UserRole.HR_ADMIN)

    def test_phone_number_is_optional(self):
        """phone_number can be blank."""
        user = make_user(email='nophone@example.com', phone_number='')
        self.assertEqual(user.phone_number, '')

    def test_department_is_optional(self):
        """department can be blank."""
        user = make_user(email='nodept@example.com', department='')
        self.assertEqual(user.department, '')

    def test_created_at_is_set_on_save(self):
        """created_at must be populated automatically."""
        self.assertIsNotNone(self.user.created_at)

    def test_updated_at_is_set_on_save(self):
        """updated_at must be populated automatically."""
        self.assertIsNotNone(self.user.updated_at)

    def test_is_active_default_true(self):
        """New users must be active by default."""
        self.assertTrue(self.user.is_active)


# --------------------------------------------------------------------------- #
# User model convenience properties                                            #
# --------------------------------------------------------------------------- #

class UserRolePropertiesTest(TestCase):
    """Tests for the is_employee, is_manager, is_hr_admin properties."""

    def test_is_employee_true_for_employee_role(self):
        user = make_user(role=UserRole.EMPLOYEE)
        self.assertTrue(user.is_employee)
        self.assertFalse(user.is_manager)
        self.assertFalse(user.is_hr_admin)

    def test_is_manager_true_for_manager_role(self):
        user = make_user(email='mgr@example.com', role=UserRole.MANAGER)
        self.assertFalse(user.is_employee)
        self.assertTrue(user.is_manager)
        self.assertFalse(user.is_hr_admin)

    def test_is_hr_admin_true_for_hr_admin_role(self):
        user = make_user(email='hr@example.com', role=UserRole.HR_ADMIN)
        self.assertFalse(user.is_employee)
        self.assertFalse(user.is_manager)
        self.assertTrue(user.is_hr_admin)


# --------------------------------------------------------------------------- #
# User model __str__                                                           #
# --------------------------------------------------------------------------- #

class UserStrTest(TestCase):
    """Tests for the __str__ representation of User."""

    def test_str_includes_full_name_and_email(self):
        """__str__ must include both the full name and email address."""
        user = make_user(
            email='alice@example.com',
            first_name='Alice',
            last_name='Smith',
        )
        result = str(user)
        self.assertIn('Alice Smith', result)
        self.assertIn('alice@example.com', result)

    def test_full_name_property(self):
        """full_name property must return concatenated first + last name."""
        user = make_user(first_name='John', last_name='Doe')
        self.assertEqual(user.full_name, 'John Doe')


# --------------------------------------------------------------------------- #
# Index existence tests                                                        #
# --------------------------------------------------------------------------- #

class UserIndexTest(TestCase):
    """Verify that the required database indexes are defined on the model."""

    def test_required_indexes_exist(self):
        """
        The migration declares indexes on role, department, and
        (is_active, role). Verify they are present in model meta.
        """
        index_names = {idx.name for idx in User._meta.indexes}
        self.assertIn('idx_user_role',        index_names)
        self.assertIn('idx_user_department',  index_names)
        self.assertIn('idx_user_active_role', index_names)


# --------------------------------------------------------------------------- #
# Full model validation                                                        #
# --------------------------------------------------------------------------- #

class UserFullCleanTest(TestCase):
    """Tests that model-level validation (full_clean) works correctly."""

    def test_invalid_email_fails_validation(self):
        """A non-email string in the email field must fail full_clean."""
        user = User(
            email='not-an-email',
            first_name='Bad',
            last_name='Email',
        )
        user.set_password('pass')
        with self.assertRaises(ValidationError):
            user.full_clean()

    def test_invalid_role_fails_validation(self):
        """An invalid role value must fail full_clean."""
        user = User(
            email='valid@example.com',
            first_name='Valid',
            last_name='Role',
            role='INVALID_ROLE',
        )
        user.set_password('pass')
        with self.assertRaises(ValidationError):
            user.full_clean()
