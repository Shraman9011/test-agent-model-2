from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('users.api.urls')),
    path('api/', include('leaves.api.urls')),
    # Add your app URLs here
    # path('api/', include('your_app.urls')),
]
