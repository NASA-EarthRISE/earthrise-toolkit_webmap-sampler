from django.db import models
from django.contrib.auth.models import User

class WMSService(models.Model):
    url = models.URLField(max_length=500)
    layers = models.CharField(max_length=255)
    label = models.CharField(max_length=255)
    creator = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.label} ({self.layers})"

    class Meta:
        ordering = ['-created_at']
