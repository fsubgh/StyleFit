from django.contrib import admin
from django.urls import path, include
from .views import home, cart_page
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('', home, name='home'),
    path('cart/', cart_page, name='cart'),
    path('admin/', admin.site.urls),
    path('api/users/', include('users.urls')),
    path('api/catalog/', include('catalog.urls')),
]

if settings.DEBUG:
    urlpatterns += static(
        settings.MEDIA_URL,
        document_root=settings.MEDIA_ROOT
    )