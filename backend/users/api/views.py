from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers import PasswordResetRequestSerializer

class PasswordResetRequestView(APIView):
    """
    POST /api/auth/password-reset
    
    Accepts an email address and sends a password reset link if the user exists.
    Always returns a generic 200 OK success message to prevent user enumeration.
    """
    # Anyone can request a password reset
    permission_classes = [] 
    authentication_classes = []

    def post(self, request, *args, **kwargs):
        serializer = PasswordResetRequestSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            # Generic success message regardless of whether the email was found
            return Response(
                {"message": "If an account with that email exists, we have sent a password reset link."},
                status=status.HTTP_200_OK
            )
        
        # If the email format is completely invalid (not a string/email format)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
