"""
Test settings — uses SQLite so tests run without a live PostgreSQL connection.
Usage:  python manage.py test --settings=test_agent_model_2.settings_test
"""

from .settings import *  # noqa: F401, F403

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
    }
}

# Silence migrations for faster test runs (schema is created fresh anyway).
# Comment out if you want to test the migration itself.
# MIGRATION_MODULES = {app: None for app in INSTALLED_APPS}
