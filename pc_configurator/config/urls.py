from django.contrib import admin
from django.urls import path, include
from django.views.generic import RedirectView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('knowledge/', include('knowledge.urls')),
    path('configurator/', include('configurator.urls')),
    path('', RedirectView.as_view(url='/configurator/', permanent=False)),
]
