from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.conf import settings
from .models import LeaveRequest
import os

def get_frontend_url():
    """Helper to determine the frontend base URL."""
    return os.getenv('FRONTEND_URL', 'http://localhost:5173')

def send_manager_notification(leave_request: LeaveRequest):
    """
    Sends an email notification to the manager when an employee submits a leave request.
    
    Args:
        leave_request (LeaveRequest): The newly created leave request object.
    """
    if not leave_request.manager:
        # No manager to notify
        return False
        
    manager = leave_request.manager
    
    # Prepare context data for the templates
    context = {
        'manager_name': manager.get_full_name() or manager.email,
        'employee_name': leave_request.employee.get_full_name() or leave_request.employee.email,
        'leave_type': leave_request.leave_type.name,
        'start_date': leave_request.start_date.strftime('%Y-%m-%d'),
        'end_date': leave_request.end_date.strftime('%Y-%m-%d'),
        'total_days': str(leave_request.total_days),
        'reason': leave_request.reason,
        'approval_link': f"{get_frontend_url()}/dashboard/manager?request={leave_request.id}"
    }
    
    # Render both text and HTML versions
    text_content = render_to_string('emails/manager_notification.txt', context)
    html_content = render_to_string('emails/manager_notification.html', context)
    
    subject = f"Leave Request Approval Needed: {context['employee_name']}"
    from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@example.com')
    to_email = manager.email
    
    # Create the email message
    msg = EmailMultiAlternatives(subject, text_content, from_email, [to_email])
    msg.attach_alternative(html_content, "text/html")
    
    # Send the email
    msg.send(fail_silently=False)
    
    return True
