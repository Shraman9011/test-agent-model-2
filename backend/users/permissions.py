from rest_framework.permissions import BasePermission

class IsHRAdmin(BasePermission):
    """
    Allows access only to HR Administrators.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'HR_ADMIN')

class IsManager(BasePermission):
    """
    Allows access to Managers. 
    Also allows HR Admins since they usually have a superset of permissions.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role in ['MANAGER', 'HR_ADMIN'])

class IsEmployee(BasePermission):
    """
    Allows access to regular Employees.
    Also allows Managers and HR Admins.
    """
    def has_permission(self, request, view):
        # Essentially, any authenticated user can act as an employee (since everyone is an employee)
        return bool(request.user and request.user.is_authenticated)

class IsExactRole(BasePermission):
    """
    Allows access only if the user role EXACTLY matches the required_role on the view.
    Used for strict isolation if needed.
    """
    def has_permission(self, request, view):
        required_role = getattr(view, 'required_role', None)
        if not required_role:
            return False
        return bool(request.user and request.user.is_authenticated and request.user.role == required_role)
