from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser

from .models import Application, InternshipOffer
from .serializers import InternshipOfferSerializer, ApplicationSerializer

from .utils import extract_text_from_pdf

# Dans offers/views.py
from .ai_services import extract_skills_from_cv_with_grok, analyze_cv_with_grok


# =========================================================
# PERMISSION ENTREPRISE
# =========================================================

class IsCompanyUser(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True

        return (
            request.user.is_authenticated
            and getattr(request.user, 'role', None) == 'COMPANY'
        )


# =========================================================
# OFFRES
# =========================================================

class OfferListCreateView(generics.ListCreateAPIView):
    serializer_class = InternshipOfferSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        
        # Si l'utilisateur connecté est une entreprise, on filtre uniquement SES offres
        if getattr(user, 'role', None) == 'COMPANY':
            return InternshipOffer.objects.filter(company=user).order_by('-created_at')
            
        # Si c'est un étudiant (ou admin), on affiche toutes les offres actives
        return InternshipOffer.objects.filter(is_active=True).order_by('-created_at')

    def perform_create(self, serializer):
        # Sécurité : On s'assure qu'un étudiant ne peut pas tricher et poster une offre via Postman/Insomnia
        if getattr(self.request.user, 'role', None) != 'COMPANY':
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Seules les entreprises peuvent publier des offres.")
            
        serializer.save(company=self.request.user)


class OfferDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = InternshipOffer.objects.all()
    serializer_class = InternshipOfferSerializer
    permission_classes = [IsCompanyUser]


# =========================================================
# CANDIDATURES ENTREPRISE
# =========================================================

class CompanyApplicationsListView(generics.ListAPIView):
    serializer_class = ApplicationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Application.objects.filter(
            offer__company=self.request.user
        ).order_by('-applied_at')


# =========================================================
# CANDIDATURES ETUDIANT
# =========================================================

class StudentApplicationsListView(generics.ListAPIView):
    serializer_class = ApplicationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Application.objects.filter(
            student=self.request.user
        ).order_by('-applied_at')


# =========================================================
# POSTULER A UNE OFFRE + ANALYSE IA GROK
# =========================================================

class ApplyToOfferView(generics.CreateAPIView):
    serializer_class = ApplicationSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def perform_create(self, serializer):
        offer_id = self.kwargs.get('pk')
        offer = InternshipOffer.objects.get(id=offer_id)

        # Sauvegarde de la candidature initiale
        application = serializer.save(
            student=self.request.user,
            offer=offer,
            status='PENDING'
        )

        print("===== ANALYSE IA GROK =====")
        try:
            # =================================================
            # EXTRACTION TEXTE CV
            # =================================================
            cv_path = application.cv_file.path
            print("CV PATH :", cv_path)

            cv_text = extract_text_from_pdf(cv_path)
            print("CV TEXT OK")

            # =================================================
            # ANALYSE GROK
            # =================================================
            ai_result = analyze_cv_with_grok(
                cv_text,
                offer
            )
            print("AI RESULT :", ai_result)

           # =================================================
            # RESULTATS IA (Corrigé avec les bonnes clés de ai_services)
            # =================================================
            score = ai_result.get("ai_matching_score", 0)
            summary = ai_result.get("ai_analysis_summary", "")
            skills = ai_result.get("skills", [])  # Optionnel selon ton prompt Grok
            recommendation = ai_result.get("recommendation", "")
            # =================================================
            # SAUVEGARDE PROFIL ETUDIANT
            # =================================================
            student = application.student
            
            # Sauvegarde sous forme de liste ou chaîne selon votre configuration de modèle
            student.detected_skills = skills
            student.detected_technologies = skills
            student.save()

            # =================================================
            # SAUVEGARDE CANDIDATURE
            # =================================================
            application.ai_matching_score = score
            application.ai_analysis_summary = (
                f"{summary}\n\n"
                f"Recommandation IA : {recommendation}"
            )
            application.status = 'ANALYZED'
            application.save()

            print("===== ANALYSE TERMINÉE =====")

        except Exception as e:
            print("ERREUR GROK :", str(e))
            application.ai_matching_score = 0
            application.ai_analysis_summary = str(e)
            application.status = 'PENDING'
            application.save()


# =========================================================
# PLANIFICATION ENTRETIEN
# =========================================================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def plan_meeting_view(request, pk):
    try:
        application = Application.objects.get(
            id=pk,
            offer__company=request.user
        )
    except Application.DoesNotExist:
        return Response(
            {"detail": "Candidature introuvable"},
            status=status.HTTP_404_NOT_FOUND
        )

    meeting_date = request.data.get('meeting_date')
    meeting_link = request.data.get(
        'meeting_link',
        'https://meet.google.com/'
    )

    if not meeting_date:
        return Response(
            {"detail": "Date obligatoire"},
            status=status.HTTP_400_BAD_REQUEST
        )

    application.status = 'INTERVIEW'
    application.meeting_date = meeting_date
    application.meeting_link = meeting_link
    application.save()

    return Response(
        {
            "detail": "Entretien planifié",
            "status": application.status,
            "meeting_date": application.meeting_date,
            "meeting_link": application.meeting_link
        },
        status=status.HTTP_200_OK
    )


# =========================================================
# ACCEPTER / REFUSER
# =========================================================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_application_status(request, pk):
    try:
        application = Application.objects.get(
            id=pk,
            offer__company=request.user
        )
    except Application.DoesNotExist:
        return Response(
            {"detail": "Non autorisé"},
            status=status.HTTP_404_NOT_FOUND
        )

    new_status = request.data.get('status')
    allowed_status = ['ACCEPTED', 'REJECTED']

    if new_status not in allowed_status:
        return Response(
            {"detail": "Statut invalide"},
            status=status.HTTP_400_BAD_REQUEST
        )

    application.status = new_status
    application.save()

    return Response(
        {
            "detail": "Statut mis à jour",
            "status": application.status
        }
    )


# =========================================================
# RECOMMANDATION IA DES OFFRES (CORRIGÉE ET OPTIMISÉE)
# =========================================================

class RecommendedOffersView(generics.ListAPIView):
    serializer_class = InternshipOfferSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        # 1. Extraction et normalisation des compétences de l'étudiant
        skills = getattr(user, 'detected_skills', []) or []
        technologies = getattr(user, 'detected_technologies', []) or []

        # Si les compétences sont stockées sous forme de chaînes de caractères textuelles, on split
        if isinstance(skills, str):
            skills = [s.strip() for s in skills.split(',') if s.strip()]
        if isinstance(technologies, str):
            technologies = [t.strip() for t in technologies.split(',') if t.strip()]

        student_keywords = [
            str(k).lower().strip()
            for k in (skills + technologies)
        ]

        # 2. Récupération de toutes les offres de stage actives
        try:
            offers = InternshipOffer.objects.filter(is_active=True)
        except Exception:
            offers = InternshipOffer.objects.all()

        scored_offers = []

        # 3. Évaluation dynamique de la compatibilité de chaque offre
        for offer in offers:
            offer_skills_raw = offer.skills_required or ""
            offer_tech_raw = offer.technologies or ""

            # Transformation des chaînes de caractères textuelles en listes propres
            if isinstance(offer_skills_raw, str):
                offer_skills = [s.strip() for s in offer_skills_raw.split(',') if s.strip()]
            else:
                offer_skills = list(offer_skills_raw)

            if isinstance(offer_tech_raw, str):
                offer_techs = [t.strip() for t in offer_tech_raw.split(',') if t.strip()]
            else:
                offer_techs = list(offer_tech_raw)

            offer_keywords = [str(k).lower().strip() for k in (offer_skills + offer_techs)]

            # Calcul de l'intersection de mots-clés
            common = set(student_keywords).intersection(set(offer_keywords))
            
            score = 0
            if len(offer_keywords) > 0:
                score = int((len(common) / len(offer_keywords)) * 100)

            # 4. Fallback si l'étudiant débute et n'a pas encore de mots-clés extraits
            if score == 0 and len(student_keywords) == 0:
                score = 30  # Donne un score de base d'intérêt pour ne pas afficher une page vide

            # Bonus de pertinence basé sur le titre du poste (ex: s'il cherche du 'React')
            title_lower = offer.title.lower() if offer.title else ""
            if any(keyword in title_lower for keyword in student_keywords if len(keyword) > 2):
                score += 15

            # Limitation stricte à 100% maximum
            offer.matching_score = min(score, 100)

            # Ajout à la liste (seuil réduit à 10 pour garantir un contenu à afficher)
            if offer.matching_score >= 10:
                scored_offers.append((offer.matching_score, offer))

        # 5. Tri des offres du meilleur matching au moins bon
        scored_offers.sort(
            reverse=True,
            key=lambda x: x[0]
        )

        # 6. Extraction du Top 10 des offres triées
        return [offer for score, offer in scored_offers[:10]]