from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('api/wms/', views.list_wms, name='list_wms'),
    path('api/wms/save/', views.save_wms, name='save_wms'),
]
