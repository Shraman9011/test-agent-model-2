"""WSGI config for test_agent_model_2 project."""

import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'test_agent_model_2.settings')

application = get_wsgi_application()
