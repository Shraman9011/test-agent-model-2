from django.http import JsonResponse
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.exceptions import AuthenticationFailed

class RBACMiddleware:
    """
    Middleware to globally enforce Role-Based Access Control (RBAC) on API routes.
    It authenticates the JWT token directly in the middleware layer for strict enforcement.
    """
    def __init__(self, get_response):
        self.get_response = get_response
        self.jwt_authenticator = JWTAuthentication()

    def __call__(self, request):
        path = request.path

        # Only apply to API routes, exempt auth
        if not path.startswith('/api/') or path.startswith('/api/auth/'):
            return self.get_response(request)

        # Authenticate user via JWT in middleware
        user = None
        try:
            auth_tuple = self.jwt_authenticator.authenticate(request)
            if auth_tuple is not None:
                user, token = auth_tuple
        except AuthenticationFailed:
            # Let DRF handle the 401 response in the view if token is invalid
            pass

        # If we have an authenticated user, enforce global route constraints
        if user:
            if path.startswith('/api/admin/') and user.role != 'HR_ADMIN':
                return JsonResponse({'detail': 'HR Administrator access strictly required.'}, status=403)
            
            if path.startswith('/api/manager/') and user.role not in ['MANAGER', 'HR_ADMIN']:
                return JsonResponse({'detail': 'Manager access strictly required.'}, status=403)

        response = self.get_response(request)
        return response
