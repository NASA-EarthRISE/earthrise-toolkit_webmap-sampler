from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('api/wms/', views.list_wms, name='list_wms'),
    path('api/wms/save/', views.save_wms, name='save_wms'),
    path('api/wms/<int:service_id>/vote/', views.vote_wms, name='vote_wms'),
    path('api/wms/time/', views.wms_time, name='wms_time'),
]
