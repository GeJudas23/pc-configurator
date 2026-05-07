from django.urls import path
from . import views

app_name = 'knowledge'

urlpatterns = [
    path('', views.component_list, name='component_list'),
    path('processor/add/', views.processor_add, name='processor_add'),
    path('motherboard/add/', views.motherboard_add, name='motherboard_add'),
    path('ram/add/', views.ram_add, name='ram_add'),
    path('psu/add/', views.psu_add, name='psu_add'),
    path('gpu/add/', views.gpu_add, name='gpu_add'),
    path('processor/<int:pk>/edit/', views.processor_edit, name='processor_edit'),
    path('motherboard/<int:pk>/edit/', views.motherboard_edit, name='motherboard_edit'),
    path('ram/<int:pk>/edit/', views.ram_edit, name='ram_edit'),
    path('psu/<int:pk>/edit/', views.psu_edit, name='psu_edit'),
    path('gpu/<int:pk>/edit/', views.gpu_edit, name='gpu_edit'),
    path('<str:component_type>/<int:pk>/delete/', views.component_delete, name='component_delete'),
    path('incompatibilities/', views.incompatibility_list, name='incompatibility_list'),
    path('incompatibilities/add/', views.incompatibility_add, name='incompatibility_add'),
    path('incompatibilities/<int:pk>/delete/', views.incompatibility_delete, name='incompatibility_delete'),
]
