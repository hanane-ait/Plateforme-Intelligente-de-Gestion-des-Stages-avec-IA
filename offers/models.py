from django.db import models
from django.conf import settings

class InternshipOffer(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField()
    company = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='offers_published')
    location = models.CharField(max_length=100)
    duration = models.CharField(max_length=50)
    skills_required = models.JSONField(default=list)  # Stocke une liste de compétences
    technologies = models.JSONField(default=list)     # Stocke une liste de technos
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title


class Application(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'En attente d\'analyse'),
        ('ANALYZED', 'Analysé par l\'IA'),
        ('INTERVIEW', 'Entretien Planifié'),
        ('ACCEPTED', 'Acceptée'),
        ('REJECTED', 'Refusée'),
    ]

    offer = models.ForeignKey(InternshipOffer, on_delete=models.CASCADE, related_name='applications')
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='applications')
    cv_file = models.FileField(upload_to='cv_files/') 
    cover_letter = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    applied_at = models.DateTimeField(auto_now_add=True)

    # 🤖 Nouveaux champs pour l'analyse automatique du CV
    ai_matching_score = models.IntegerField(null=True, blank=True)    # Score de 0 à 100
    ai_analysis_summary = models.TextField(null=True, blank=True)     # Résumé des compétences

    # 🗓️ Nouveaux champs pour la planification de la réunion
    meeting_date = models.DateTimeField(null=True, blank=True)
    meeting_link = models.URLField(null=True, blank=True, default='https://meet.google.com/')

    class Meta:
        unique_together = ('offer', 'student')

    def __str__(self):
        return f"{self.student.username} - {self.offer.title}"