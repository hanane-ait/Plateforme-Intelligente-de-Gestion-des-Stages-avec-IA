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

    # Champs dénormalisés (synchronisés depuis Interview pour compatibilité dashboards / filtres)
    meeting_date = models.DateTimeField(null=True, blank=True)
    meeting_link = models.CharField(max_length=500, null=True, blank=True)

    class Meta:
        unique_together = ('offer', 'student')

    def __str__(self):
        return f"{self.student.username} - {self.offer.title}"

    def sync_interview_snapshot(self, interview):
        """Copie les infos d'entretien sur la candidature (affichage & requêtes existantes)."""
        self.status = 'INTERVIEW'
        self.meeting_date = interview.scheduled_at
        self.meeting_link = interview.meeting_link
        self.save(update_fields=['status', 'meeting_date', 'meeting_link'])


class Interview(models.Model):
    """Entretien planifié — source de vérité pour date, durée, lien et notes."""

    application = models.OneToOneField(
        Application,
        on_delete=models.CASCADE,
        related_name='interview',
    )
    scheduled_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='interviews_scheduled',
    )
    scheduled_at = models.DateTimeField()
    duration_minutes = models.PositiveSmallIntegerField(default=60)
    meeting_link = models.CharField(max_length=500)
    notes = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['scheduled_at']

    def __str__(self):
        return f"Entretien {self.application.student.username} — {self.scheduled_at:%d/%m/%Y %H:%M}"


class CandidateRanking(models.Model):
    """Classement IA des candidats pour une offre — persisté après « Classer les CVs »."""

    offer = models.ForeignKey(
        InternshipOffer,
        on_delete=models.CASCADE,
        related_name='candidate_rankings',
    )
    application = models.ForeignKey(
        Application,
        on_delete=models.CASCADE,
        related_name='rankings',
    )
    rank = models.PositiveIntegerField()
    justification = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('offer', 'application')
        ordering = ['rank']

    def __str__(self):
        return f"#{self.rank} — candidature {self.application_id} / offre {self.offer_id}"


class MeetingReview(models.Model):
    application = models.OneToOneField(
        Application,
        on_delete=models.CASCADE,
        related_name='meeting_review'
    )
    text_note = models.TextField(null=True, blank=True)
    audio_file = models.FileField(upload_to='meeting_audio/', null=True, blank=True)
    ai_feedback = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Review — {self.application.student.username} / {self.application.offer.title}"