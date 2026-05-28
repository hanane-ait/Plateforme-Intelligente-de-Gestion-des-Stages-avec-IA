from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.split if hasattr(admin, 'split') else admin.site.urls),
    path('api/auth/', include('users.urls')),
    path('api/offers/', include('offers.urls')),
]

# Permet d'accéder aux CV téléversés via l'URL en développement
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)