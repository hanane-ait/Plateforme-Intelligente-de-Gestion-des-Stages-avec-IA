from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    # Définition des rôles sous forme de choix
    ROLE_CHOICES = (
        ('ADMIN', 'Administrateur'),
        ('STUDENT', 'Étudiant'),
        ('COMPANY', 'Entreprise'),
    )
    
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='STUDENT')
    telephone = models.CharField(max_length=20, blank=True, null=True)
    
    # On force l'email à être unique pour l'authentification future
    email = models.EmailField(unique=True)
    # ✅ IA
    detected_skills = models.JSONField(default=list, blank=True)
    detected_technologies = models.JSONField(default=list, blank=True)

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"

class StudentProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='student_profile')
    cv_url = models.FileField(upload_to='cvs/', blank=True, null=True)
    skills = models.JSONField(default=list, blank=True) # Stockera les compétences extraites par l'IA
    bio = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"Profil Étudiant de {self.user.username}"

class CompanyProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='company_profile')
    company_name = models.CharField(max_length=100)
    website = models.URLField(blank=True, null=True)
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.company_name