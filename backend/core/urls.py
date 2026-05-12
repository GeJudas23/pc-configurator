from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    # Auth
    path('auth/register/', views.register, name='auth-register'),
    path('auth/login/', views.login_view, name='auth-login'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='auth-refresh'),
    path('users/me/', views.current_user, name='users-me'),

    # Price categories
    path('categories/', views.PriceCategoryListView.as_view(), name='categories-list'),

    # Components (generic CRUD)
    path('components/', views.ComponentListCreateView.as_view(), name='components-list'),
    path('components/<int:pk>/', views.ComponentDetailView.as_view(), name='components-detail'),

    # Typed component lists (for wizard)
    path('processors/', views.ProcessorListView.as_view(), name='processors-list'),
    path('motherboards/', views.MotherboardListView.as_view(), name='motherboards-list'),
    path('ram/', views.RAMListView.as_view(), name='ram-list'),
    path('psus/', views.PowerSupplyListView.as_view(), name='psus-list'),
    path('gpus/', views.GPUListView.as_view(), name='gpus-list'),

    # Incompatibilities
    path('incompatibilities/', views.IncompatibilityListCreateView.as_view(), name='incompatibilities-list'),
    path('incompatibilities/<int:pk>/', views.IncompatibilityDeleteView.as_view(), name='incompatibilities-detail'),

    # Compatibility check
    path('compatibility/check/', views.check_compatibility, name='compatibility-check'),

    # Builds
    path('builds/', views.BuildListCreateView.as_view(), name='builds-list'),
    path('builds/<int:pk>/', views.BuildDetailView.as_view(), name='builds-detail'),

    # History (admin only)
    path('history/', views.HistoryListView.as_view(), name='history-list'),
]
