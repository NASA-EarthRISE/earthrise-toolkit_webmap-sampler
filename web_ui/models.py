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


class WMSVote(models.Model):
    VOTE_CHOICES = [('up', 'Thumbs Up'), ('down', 'Thumbs Down')]

    service = models.ForeignKey(WMSService, on_delete=models.CASCADE, related_name='votes')
    session_key = models.CharField(max_length=40)
    vote = models.CharField(max_length=4, choices=VOTE_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('service', 'session_key')
