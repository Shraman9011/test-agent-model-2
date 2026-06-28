from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from django.core import mail
from django.utils.http import urlsafe_base64_decode
from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_str

User = get_user_model()

class PasswordResetRequestAPITests(APITestCase):
    
    def setUp(self):
        self.url = reverse('users_api:password-reset-request')
        self.user_email = 'testuser@example.com'
        self.user = User.objects.create_user(
            email=self.user_email,
            password='testpassword123',
            first_name='Test',
            last_name='User'
        )
        # Clear outbox before each test
        mail.outbox = []

    def test_password_reset_registered_email(self):
        """
        Submitting a registered email sends a reset link and returns generic success.
        """
        response = self.client.post(self.url, {'email': self.user_email})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            response.data['message'], 
            "If an account with that email exists, we have sent a password reset link."
        )
        
        # Verify email was sent
        self.assertEqual(len(mail.outbox), 1)
        email_message = mail.outbox[0]
        self.assertEqual(email_message.subject, "LeaveSync: Password Reset Request")
        self.assertIn(self.user_email, email_message.to)
        
        # Verify token generation
        self.assertIn('uid=', email_message.body)
        self.assertIn('token=', email_message.body)
        
        # Extract uid and token from email body for verification
        parts = email_message.body.split('uid=')
        uid_token_part = parts[1].split()[0] # get everything after uid= up to whitespace
        uid, token = uid_token_part.split('&token=')
        
        # Decode uid and verify it matches the user
        decoded_uid = force_str(urlsafe_base64_decode(uid))
        self.assertEqual(int(decoded_uid), self.user.pk)
        
        # Verify the token is valid for this user
        self.assertTrue(default_token_generator.check_token(self.user, token))

    def test_password_reset_unregistered_email(self):
        """
        Submitting an unregistered email returns the same success message
        to prevent user enumeration, but sends NO email.
        """
        response = self.client.post(self.url, {'email': 'doesnotexist@example.com'})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            response.data['message'], 
            "If an account with that email exists, we have sent a password reset link."
        )
        
        # Verify NO email was sent
        self.assertEqual(len(mail.outbox), 0)

    def test_password_reset_invalid_email_format(self):
        """
        Submitting an invalid email format should return a 400 Bad Request.
        """
        response = self.client.post(self.url, {'email': 'not-an-email'})
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)
        
    def test_password_reset_missing_email(self):
        """
        Submitting a request without an email should return a 400 Bad Request.
        """
        response = self.client.post(self.url, {})
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)
