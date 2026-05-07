from django.urls import path
from . import views

app_name = 'configurator'

urlpatterns = [
    path('', views.category_select, name='category_select'),
    path('processor/', views.step_processor, name='step_processor'),
    path('motherboard/', views.step_motherboard, name='step_motherboard'),
    path('ram/', views.step_ram, name='step_ram'),
    path('psu/', views.step_psu, name='step_psu'),
    path('gpu/', views.step_gpu, name='step_gpu'),
    path('result/', views.result, name='result'),
    path('reset/', views.reset, name='reset'),
    path('custom/', views.custom_build, name='custom_build'),
]
