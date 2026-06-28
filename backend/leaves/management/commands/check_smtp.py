from django.core.management.base import BaseCommand
from django.core.mail import get_connection
import sys

class Command(BaseCommand):
    help = 'Tests the SMTP connection using current Django settings'

    def handle(self, *args, **kwargs):
        self.stdout.write("Testing SMTP connection...")
        try:
            connection = get_connection()
            # The console backend just opens a dummy stream, 
            # while SMTP backend actually connects.
            connection.open()
            self.stdout.write(self.style.SUCCESS("SMTP Connection successful!"))
            connection.close()
        except Exception as e:
            self.stderr.write(self.style.ERROR(f"SMTP Connection failed: {e}"))
            sys.exit(1)
