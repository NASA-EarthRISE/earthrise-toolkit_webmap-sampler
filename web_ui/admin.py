from django.contrib import admin
from .models import WMSService

@admin.register(WMSService)
class WMSServiceAdmin(admin.ModelAdmin):
    list_display = ('label', 'layers', 'url', 'creator', 'created_at')
    list_filter = ('creator', 'created_at')
    search_fields = ('label', 'layers', 'url')
